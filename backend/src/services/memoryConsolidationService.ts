/**
 * MEMORY CONSOLIDATION SERVICE
 *
 * Giải quyết vấn đề memory bloat trong LongTermMemory:
 *   - Deduplicate: Gộp insights trùng lặp, tăng frequency
 *   - Consolidate: Merge patterns liên quan thành higher-level insights
 *   - Decay: Giảm confidence cho memories không còn relevant
 *   - Archive: Chuyển memories cũ/thấp confidence sang archived state
 *
 * Chạy định kỳ (e.g. mỗi 24h) hoặc trigger thủ công.
 *
 * @module services/memoryConsolidationService
 * @version 1.0.0
 */

import LongTermMemory, { ILongTermMemory } from '../models/LongTermMemory';
import logger from '../utils/logger';

// ─────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────

export interface ConsolidationConfig {
  /** Similarity threshold for dedup (0-1, how similar content must be to merge) */
  similarityThreshold: number;
  /** Confidence decay rate per day for un-refreshed memories */
  decayRatePerDay: number;
  /** Minimum confidence before archiving */
  archiveThreshold: number;
  /** Max days without re-detection before decay kicks in */
  staleDays: number;
  /** Maximum LongTermMemory docs per user after consolidation */
  maxMemoriesPerUser: number;
  /** Run interval in milliseconds */
  intervalMs: number;
}

export interface ConsolidationResult {
  userId: string;
  startedAt: Date;
  completedAt: Date;
  duplicatesMerged: number;
  memoriesDecayed: number;
  memoriesArchived: number;
  memoriesBefore: number;
  memoriesAfter: number;
}

// ─────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────

export class MemoryConsolidationService {
  private config: ConsolidationConfig;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(config?: Partial<ConsolidationConfig>) {
    this.config = {
      similarityThreshold: 0.8,
      decayRatePerDay: 0.02,
      archiveThreshold: 0.15,
      staleDays: 30,
      maxMemoriesPerUser: 500,
      intervalMs: 24 * 60 * 60 * 1000, // 24 hours
      ...config,
    };
  }

  /**
   * Start periodic consolidation
   */
  startPeriodicConsolidation(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.consolidateAll().catch(err =>
        logger.error('[MemoryConsolidation] Periodic consolidation failed:', err)
      );
    }, this.config.intervalMs);

    logger.info(`[MemoryConsolidation] Periodic consolidation started (every ${this.config.intervalMs / 3600000}h)`);
  }

  /**
   * Stop periodic consolidation
   */
  stopPeriodicConsolidation(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Consolidate all users' memories
   */
  async consolidateAll(): Promise<ConsolidationResult[]> {
    logger.info('[MemoryConsolidation] Starting full consolidation...');

    // Get all unique userIds
    const userIds = await LongTermMemory.distinct('userId');
    const results: ConsolidationResult[] = [];

    for (const userId of userIds) {
      try {
        const result = await this.consolidateUser(userId);
        results.push(result);
      } catch (err) {
        logger.error(`[MemoryConsolidation] Failed for user ${userId}:`, err);
      }
    }

    const totalMerged = results.reduce((s, r) => s + r.duplicatesMerged, 0);
    const totalArchived = results.reduce((s, r) => s + r.memoriesArchived, 0);
    logger.info(
      `[MemoryConsolidation] Complete: ${userIds.length} users, ${totalMerged} merged, ${totalArchived} archived`
    );

    return results;
  }

  /**
   * Consolidate memories for a single user
   */
  async consolidateUser(userId: string): Promise<ConsolidationResult> {
    const startedAt = new Date();

    const allMemories = await LongTermMemory.find({ userId }).sort({ createdAt: -1 });
    const memoriesBefore = allMemories.length;

    let duplicatesMerged = 0;
    let memoriesDecayed = 0;
    let memoriesArchived = 0;

    // Phase 1: Deduplicate — merge memories with very similar content + same type
    duplicatesMerged = await this.deduplicateMemories(userId, allMemories);

    // Phase 2: Decay — reduce confidence for stale memories
    memoriesDecayed = await this.applyDecay(userId);

    // Phase 3: Archive — remove very low confidence memories
    memoriesArchived = await this.archiveStale(userId);

    // Phase 4: Cap — if still over limit, remove lowest confidence
    await this.capMemoryCount(userId);

    const memoriesAfter = await LongTermMemory.countDocuments({ userId });

    return {
      userId,
      startedAt,
      completedAt: new Date(),
      duplicatesMerged,
      memoriesDecayed,
      memoriesArchived,
      memoriesBefore,
      memoriesAfter,
    };
  }

  // ─────────────────────────────────────────────────────
  // PHASE 1: DEDUPLICATION
  // ─────────────────────────────────────────────────────

  private async deduplicateMemories(userId: string, memories: ILongTermMemory[]): Promise<number> {
    // Group by type
    const byType = new Map<string, ILongTermMemory[]>();
    for (const mem of memories) {
      if (!byType.has(mem.type)) byType.set(mem.type, []);
      byType.get(mem.type)!.push(mem);
    }

    let mergedCount = 0;
    const idsToDelete: string[] = [];

    for (const [, typeMemories] of byType) {
      // Compare each pair within the same type
      const merged = new Set<string>();

      for (let i = 0; i < typeMemories.length; i++) {
        const memI = typeMemories[i];
        const idI = String(memI._id);
        if (merged.has(idI)) continue;

        for (let j = i + 1; j < typeMemories.length; j++) {
          const memJ = typeMemories[j];
          const idJ = String(memJ._id);
          if (merged.has(idJ)) continue;

          const similarity = this.calculateSimilarity(
            memI.content,
            memJ.content
          );

          if (similarity >= this.config.similarityThreshold) {
            // Merge j into i: keep i (newer, since sorted desc), delete j
            await this.mergeInto(memI, memJ);
            idsToDelete.push(idJ);
            merged.add(idJ);
            mergedCount++;
          }
        }
      }
    }

    // Bulk delete merged documents
    if (idsToDelete.length > 0) {
      await LongTermMemory.deleteMany({ _id: { $in: idsToDelete } });
    }

    return mergedCount;
  }

  /**
   * Merge source memory into target (update frequency, lastSeen, confidence)
   */
  private async mergeInto(target: ILongTermMemory, source: ILongTermMemory): Promise<void> {
    // Increase frequency
    target.metadata.frequency = (target.metadata.frequency || 1) + (source.metadata.frequency || 1);

    // Update lastSeen to most recent
    const sourceLastSeen = source.metadata.lastSeen || source.createdAt;
    const targetLastSeen = target.metadata.lastSeen || target.createdAt;
    if (sourceLastSeen > targetLastSeen) {
      target.metadata.lastSeen = sourceLastSeen;
    }

    // Boost confidence (capped at 1.0)
    target.metadata.confidence = Math.min(
      1.0,
      target.metadata.confidence + 0.05 * (source.metadata.frequency || 1)
    );

    // Merge relatedTopics
    if (source.metadata.relatedTopics && source.metadata.relatedTopics.length > 0) {
      const existingTopics = new Set(target.metadata.relatedTopics || []);
      for (const topic of source.metadata.relatedTopics) {
        existingTopics.add(topic);
      }
      target.metadata.relatedTopics = Array.from(existingTopics);
    }

    // Use higher intensity
    if ((source.metadata.intensity ?? 0) > (target.metadata.intensity ?? 0)) {
      target.metadata.intensity = source.metadata.intensity;
    }

    await target.save();
  }

  /**
   * Calculate text similarity using Jaccard index on word trigrams
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const trigrams1 = this.getTrigrams(text1.toLowerCase());
    const trigrams2 = this.getTrigrams(text2.toLowerCase());

    if (trigrams1.size === 0 && trigrams2.size === 0) return 1;
    if (trigrams1.size === 0 || trigrams2.size === 0) return 0;

    let intersection = 0;
    for (const tri of trigrams1) {
      if (trigrams2.has(tri)) intersection++;
    }

    const union = trigrams1.size + trigrams2.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  private getTrigrams(text: string): Set<string> {
    const tokens = text.split(/\s+/).filter(t => t.length > 0);
    const trigrams = new Set<string>();

    // Word-level trigrams
    for (let i = 0; i <= tokens.length - 3; i++) {
      trigrams.add(tokens.slice(i, i + 3).join(' '));
    }

    // Also add bigrams for short texts
    if (tokens.length < 6) {
      for (let i = 0; i <= tokens.length - 2; i++) {
        trigrams.add(tokens.slice(i, i + 2).join(' '));
      }
    }

    // Single words for very short texts
    if (tokens.length <= 3) {
      for (const t of tokens) trigrams.add(t);
    }

    return trigrams;
  }

  // ─────────────────────────────────────────────────────
  // PHASE 2: CONFIDENCE DECAY
  // ─────────────────────────────────────────────────────

  private async applyDecay(userId: string): Promise<number> {
    const now = new Date();
    const staleThreshold = new Date(now.getTime() - this.config.staleDays * 24 * 60 * 60 * 1000);

    // Find memories not seen recently
    const staleMemories = await LongTermMemory.find({
      userId,
      $or: [
        { 'metadata.lastSeen': { $lt: staleThreshold } },
        { 'metadata.lastSeen': { $exists: false }, createdAt: { $lt: staleThreshold } },
      ],
      'metadata.confidence': { $gt: this.config.archiveThreshold },
    });

    let decayedCount = 0;

    for (const mem of staleMemories) {
      const lastSeen = mem.metadata.lastSeen || mem.createdAt;
      const daysSinceLastSeen = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24);
      const daysOverStale = daysSinceLastSeen - this.config.staleDays;

      if (daysOverStale > 0) {
        const decayAmount = daysOverStale * this.config.decayRatePerDay;
        const newConfidence = Math.max(0, mem.metadata.confidence - decayAmount);

        // High-frequency memories decay slower
        const frequencyMultiplier = 1 / Math.max(1, Math.log2(mem.metadata.frequency || 1));
        const adjustedConfidence = Math.max(
          0,
          mem.metadata.confidence - decayAmount * frequencyMultiplier
        );

        mem.metadata.confidence = Math.max(adjustedConfidence, newConfidence * 0.5); // hybrid
        await mem.save();
        decayedCount++;
      }
    }

    return decayedCount;
  }

  // ─────────────────────────────────────────────────────
  // PHASE 3: ARCHIVE (DELETE) STALE LOW-CONFIDENCE
  // ─────────────────────────────────────────────────────

  private async archiveStale(userId: string): Promise<number> {
    const result = await LongTermMemory.deleteMany({
      userId,
      'metadata.confidence': { $lte: this.config.archiveThreshold },
      // Never archive triggers or crisis-related memories (safety)
      type: { $nin: ['trigger', 'milestone'] },
    });

    return result.deletedCount || 0;
  }

  // ─────────────────────────────────────────────────────
  // PHASE 4: CAP MEMORY COUNT
  // ─────────────────────────────────────────────────────

  private async capMemoryCount(userId: string): Promise<number> {
    const count = await LongTermMemory.countDocuments({ userId });

    if (count <= this.config.maxMemoriesPerUser) return 0;

    const excess = count - this.config.maxMemoriesPerUser;

    // Find lowest confidence memories (excluding triggers/milestones)
    const toDelete = await LongTermMemory.find({
      userId,
      type: { $nin: ['trigger', 'milestone'] },
    })
      .sort({ 'metadata.confidence': 1, createdAt: 1 })
      .limit(excess)
      .select('_id');

    if (toDelete.length > 0) {
      await LongTermMemory.deleteMany({
        _id: { $in: toDelete.map(d => d._id) },
      });
    }

    return toDelete.length;
  }

  // ─────────────────────────────────────────────────────
  // INCREMENTAL DEDUP (real-time, called per-save)
  // ─────────────────────────────────────────────────────

  /**
   * Before saving a new LongTermMemory, check if a similar one exists.
   * If so, update existing instead of creating new.
   * Returns null if merged (caller should NOT create new doc), or the data if new.
   */
  async deduplicateBeforeSave(
    userId: string,
    type: string,
    content: string,
    metadata: Record<string, any>
  ): Promise<'merged' | 'new'> {
    try {
      // Find recent memories of same type
      const candidates = await LongTermMemory.find({
        userId,
        type,
      })
        .sort({ createdAt: -1 })
        .limit(50);

      for (const candidate of candidates) {
        const similarity = this.calculateSimilarity(content, candidate.content);

        if (similarity >= this.config.similarityThreshold) {
          // Update existing instead of creating new
          candidate.metadata.frequency = (candidate.metadata.frequency || 1) + 1;
          candidate.metadata.lastSeen = new Date();
          candidate.metadata.confidence = Math.min(
            1.0,
            candidate.metadata.confidence + 0.03
          );

          // Update intensity if higher
          if ((metadata.intensity ?? 0) > (candidate.metadata.intensity ?? 0)) {
            candidate.metadata.intensity = metadata.intensity;
          }

          await candidate.save();
          return 'merged';
        }
      }

      return 'new';
    } catch (err) {
      logger.warn('[MemoryConsolidation] deduplicateBeforeSave failed, allowing new save:', err);
      return 'new';
    }
  }

  /**
   * Get consolidation stats
   */
  async getStats(): Promise<{
    totalMemories: number;
    avgPerUser: number;
    topUsers: Array<{ userId: string; count: number }>;
    typeDistribution: Record<string, number>;
  }> {
    const totalMemories = await LongTermMemory.countDocuments();
    const userCounts = await LongTermMemory.aggregate([
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const avgPerUser = userCounts.length > 0
      ? userCounts.reduce((s, u) => s + u.count, 0) / userCounts.length
      : 0;

    const typeDistribution: Record<string, number> = {};
    const typeCounts = await LongTermMemory.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);
    for (const tc of typeCounts) {
      typeDistribution[tc._id] = tc.count;
    }

    return {
      totalMemories,
      avgPerUser: Math.round(avgPerUser),
      topUsers: userCounts.slice(0, 10).map(u => ({ userId: u._id, count: u.count })),
      typeDistribution,
    };
  }
}

// Export singleton
export const memoryConsolidationService = new MemoryConsolidationService();
export default memoryConsolidationService;
