/**
 * NARRATIVE INTELLIGENCE ENGINE
 * 
 * Phase 9: Narrative Intelligence Suite
 * 
 * Capabilities:
 * - Thematic extraction from conversation history
 * - Linguistic marker detection (rumination, avoidance, hope)
 * - Story arc detection (crisis → recovery → growth)
 * - Theme-emotion correlation mapping (which topics trigger/protect EBH)
 * - TF-IDF keyword analysis for user vocabulary
 * - Narrative coherence scoring
 * - Topic risk profiling
 * 
 * @module services/pge/narrativeIntelligenceEngine
 * @version 1.0.0 — Phase 9: Narrative Intelligence
 */

import { ConversationLog } from '../../models/ConversationLog';
import LongTermMemory from '../../models/LongTermMemory';
import { PsychologicalState } from '../../models/PsychologicalState';
import {
  extractThemes,
  computeTfIdf,
  detectLinguisticMarkers,
  detectStoryArcs,
  narrativeCoherence,
  themeEmotionCorrelation,
} from './mathEngine';
import { logger } from '../../utils/logger';

// ════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════

const MAX_CONVERSATION_LOGS = 500;         // max logs to analyze
const CACHE_TTL = 5 * 60_000;              // 5 minutes
const MIN_MESSAGES_FOR_ANALYSIS = 5;       // minimum messages for meaningful analysis
const STORY_ARC_WINDOW = 5;               // window size for arc detection

// ════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════

export interface ThematicProfile {
  userId: string;
  themes: Array<{ theme: string; hits: number; percentage: number }>;
  topKeywords: Array<{ term: string; score: number }>;
  totalMessages: number;
  analyzedAt: Date;
}

export interface LinguisticProfile {
  userId: string;
  markers: {
    rumination: number;
    avoidance: number;
    hopeExpression: number;
    totalMarkers: number;
  };
  trend: {
    rumination: number[];
    avoidance: number[];
    hopeExpression: number[];
  };
  analyzedAt: Date;
}

export interface StoryArcResult {
  userId: string;
  arcs: Array<{
    type: 'crisis' | 'recovery' | 'growth' | 'plateau';
    startIdx: number;
    endIdx: number;
    avgEBH: number;
    dateRange?: { start: Date; end: Date };
  }>;
  coherence: number;
  totalDataPoints: number;
  analyzedAt: Date;
}

export interface TopicRiskProfile {
  userId: string;
  topicRisks: Array<{
    theme: string;
    avgEBH: number;
    occurrences: number;
    impact: 'trigger' | 'neutral' | 'protective';
  }>;
  highRiskTopics: string[];
  protectiveTopics: string[];
  analyzedAt: Date;
}

export interface NarrativeInsight {
  userId: string;
  insights: Array<{
    type: 'pattern' | 'warning' | 'strength' | 'milestone';
    title: string;
    description: string;
    confidence: number;
    relatedThemes: string[];
  }>;
  memoryPatterns: Array<{
    type: string;
    count: number;
    avgConfidence: number;
  }>;
  analyzedAt: Date;
}

// ════════════════════════════════════════════
// SERVICE CLASS
// ════════════════════════════════════════════

class NarrativeIntelligenceEngineService {
  private cache: Map<string, { data: any; ts: number }> = new Map();

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data as T;
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, ts: Date.now() });
  }

  invalidateCache(userId?: string): void {
    if (userId) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(userId)) this.cache.delete(key);
      }
    } else {
      this.cache.clear();
    }
  }

  // ────────────────────────────────────
  // THEMATIC ANALYSIS
  // ────────────────────────────────────

  /**
   * Extract thematic profile from user's conversation history.
   * Uses keyword matching + TF-IDF for theme extraction.
   */
  async analyzeThemes(userId: string): Promise<ThematicProfile> {
    const cacheKey = `${userId}:themes`;
    const cached = this.getCached<ThematicProfile>(cacheKey);
    if (cached) return cached;

    try {
      logger.info('[NarrativeIntelligence] Analyzing themes', { userId });

      const logs = await ConversationLog.find({ userId })
        .sort({ timestamp: -1 })
        .limit(MAX_CONVERSATION_LOGS)
        .select('userMessage timestamp')
        .lean();

      if (logs.length < MIN_MESSAGES_FOR_ANALYSIS) {
        const empty: ThematicProfile = {
          userId,
          themes: [],
          topKeywords: [],
          totalMessages: logs.length,
          analyzedAt: new Date(),
        };
        return empty;
      }

      const messages = logs
        .map(l => (l as any).userMessage)
        .filter((m): m is string => Boolean(m));

      // Theme extraction via keyword matching
      const combinedText = messages.join(' ');
      const rawThemes = extractThemes(combinedText);
      const totalHits = rawThemes.reduce((s, t) => s + t.hits, 0) || 1;

      const themes = rawThemes.map(t => ({
        theme: t.theme,
        hits: t.hits,
        percentage: Math.round((t.hits / totalHits) * 100),
      }));

      // TF-IDF keyword extraction
      const topKeywords = computeTfIdf(messages, 15);

      const result: ThematicProfile = {
        userId,
        themes,
        topKeywords,
        totalMessages: messages.length,
        analyzedAt: new Date(),
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (err) {
      logger.error('[NarrativeIntelligence] Theme analysis failed', { userId, error: err });
      throw err;
    }
  }

  // ────────────────────────────────────
  // LINGUISTIC MARKERS
  // ────────────────────────────────────

  /**
   * Detect linguistic markers (rumination, avoidance, hope) in user messages.
   * Also computes trends over time windows.
   */
  async getLinguisticProfile(userId: string): Promise<LinguisticProfile> {
    const cacheKey = `${userId}:linguistic`;
    const cached = this.getCached<LinguisticProfile>(cacheKey);
    if (cached) return cached;

    try {
      logger.info('[NarrativeIntelligence] Detecting linguistic markers', { userId });

      const logs = await ConversationLog.find({ userId })
        .sort({ timestamp: 1 }) // chronological for trend
        .limit(MAX_CONVERSATION_LOGS)
        .select('userMessage timestamp')
        .lean();

      const messages = logs
        .map(l => (l as any).userMessage)
        .filter((m): m is string => Boolean(m));

      // Overall markers
      const markers = detectLinguisticMarkers(messages);

      // Trend: split into 5 time windows
      const windowCount = 5;
      const windowSize = Math.max(1, Math.ceil(messages.length / windowCount));
      const trend = { rumination: [] as number[], avoidance: [] as number[], hopeExpression: [] as number[] };

      for (let i = 0; i < windowCount; i++) {
        const windowMsgs = messages.slice(i * windowSize, (i + 1) * windowSize);
        if (windowMsgs.length === 0) continue;
        const wm = detectLinguisticMarkers(windowMsgs);
        trend.rumination.push(wm.rumination);
        trend.avoidance.push(wm.avoidance);
        trend.hopeExpression.push(wm.hopeExpression);
      }

      const result: LinguisticProfile = {
        userId,
        markers,
        trend,
        analyzedAt: new Date(),
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (err) {
      logger.error('[NarrativeIntelligence] Linguistic analysis failed', { userId, error: err });
      throw err;
    }
  }

  // ────────────────────────────────────
  // STORY ARCS
  // ────────────────────────────────────

  /**
   * Detect story arcs from the user's EBH trajectory.
   * Identifies crisis → recovery → growth sequences.
   */
  async detectUserStoryArcs(userId: string): Promise<StoryArcResult> {
    const cacheKey = `${userId}:arcs`;
    const cached = this.getCached<StoryArcResult>(cacheKey);
    if (cached) return cached;

    try {
      logger.info('[NarrativeIntelligence] Detecting story arcs', { userId });

      const states = await PsychologicalState.find({ userId })
        .sort({ messageIndex: 1 })
        .select('stateVector.EBH createdAt messageIndex')
        .lean();

      const ebhScores = states.map((s: any) => s.stateVector?.EBH ?? 0.5);
      const timestamps = states.map((s: any) => s.createdAt || new Date());

      const rawArcs = detectStoryArcs(ebhScores, STORY_ARC_WINDOW);
      const coherence = narrativeCoherence(ebhScores);

      // Enrich arcs with date ranges
      const arcs = rawArcs.map(arc => ({
        ...arc,
        dateRange: {
          start: timestamps[arc.startIdx] as Date,
          end: timestamps[arc.endIdx] as Date,
        },
      }));

      const result: StoryArcResult = {
        userId,
        arcs,
        coherence,
        totalDataPoints: states.length,
        analyzedAt: new Date(),
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (err) {
      logger.error('[NarrativeIntelligence] Story arc detection failed', { userId, error: err });
      throw err;
    }
  }

  // ────────────────────────────────────
  // TOPIC RISK PROFILE
  // ────────────────────────────────────

  /**
   * Map which themes correlate with higher/lower EBH.
   * Identifies trigger themes and protective themes.
   */
  async getTopicRiskProfile(userId: string): Promise<TopicRiskProfile> {
    const cacheKey = `${userId}:risk`;
    const cached = this.getCached<TopicRiskProfile>(cacheKey);
    if (cached) return cached;

    try {
      logger.info('[NarrativeIntelligence] Computing topic risk profile', { userId });

      // Get conversation logs with timestamps
      const logs = await ConversationLog.find({ userId })
        .sort({ timestamp: 1 })
        .limit(MAX_CONVERSATION_LOGS)
        .select('userMessage timestamp')
        .lean();

      // Get psychological states aligned in time
      const states = await PsychologicalState.find({ userId })
        .sort({ messageIndex: 1 })
        .select('stateVector.EBH messageIndex')
        .lean();

      const messages = logs
        .map(l => (l as any).userMessage)
        .filter((m): m is string => Boolean(m));

      if (messages.length < MIN_MESSAGES_FOR_ANALYSIS || states.length < MIN_MESSAGES_FOR_ANALYSIS) {
        return {
          userId,
          topicRisks: [],
          highRiskTopics: [],
          protectiveTopics: [],
          analyzedAt: new Date(),
        };
      }

      // Extract themes per message
      const perMessageThemes = messages.map(m => extractThemes(m));

      // Align EBH scores (may differ in count; truncate to the shorter)
      const ebhScores = states.map((s: any) => s.stateVector?.EBH ?? 0.5);
      const len = Math.min(perMessageThemes.length, ebhScores.length);
      const alignedThemes = perMessageThemes.slice(0, len);
      const alignedEBH = ebhScores.slice(0, len);

      const topicRisks = themeEmotionCorrelation(alignedThemes, alignedEBH);

      const result: TopicRiskProfile = {
        userId,
        topicRisks,
        highRiskTopics: topicRisks.filter(t => t.impact === 'trigger').map(t => t.theme),
        protectiveTopics: topicRisks.filter(t => t.impact === 'protective').map(t => t.theme),
        analyzedAt: new Date(),
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (err) {
      logger.error('[NarrativeIntelligence] Topic risk analysis failed', { userId, error: err });
      throw err;
    }
  }

  // ────────────────────────────────────
  // NARRATIVE INSIGHTS
  // ────────────────────────────────────

  /**
   * Generate high-level narrative insights combining all analyses.
   * Surfaces patterns, warnings, strengths, and milestones.
   */
  async getInsights(userId: string): Promise<NarrativeInsight> {
    const cacheKey = `${userId}:insights`;
    const cached = this.getCached<NarrativeInsight>(cacheKey);
    if (cached) return cached;

    try {
      logger.info('[NarrativeIntelligence] Generating narrative insights', { userId });

      // Run sub-analyses in parallel
      const [themes, linguistic, arcs, risk, memories] = await Promise.all([
        this.analyzeThemes(userId),
        this.getLinguisticProfile(userId),
        this.detectUserStoryArcs(userId),
        this.getTopicRiskProfile(userId),
        LongTermMemory.find({ userId }).lean(),
      ]);

      const insights: NarrativeInsight['insights'] = [];

      // 1) High rumination warning
      if (linguistic.markers.rumination > 0.5) {
        insights.push({
          type: 'warning',
          title: 'Xu hướng suy nghĩ lặp lại cao',
          description: `Phát hiện ${Math.round(linguistic.markers.rumination * 100)}% dấu hiệu rumination. Nguy cơ vòng lặp suy nghĩ tiêu cực.`,
          confidence: Math.min(0.95, 0.5 + linguistic.markers.rumination * 0.4),
          relatedThemes: themes.themes.slice(0, 3).map((t: { theme: string }) => t.theme),
        });
      }

      // 2) Hope expression strength
      if (linguistic.markers.hopeExpression > 0.3) {
        insights.push({
          type: 'strength',
          title: 'Biểu hiện hy vọng tích cực',
          description: `Phát hiện ${Math.round(linguistic.markers.hopeExpression * 100)}% dấu hiệu hy vọng/tích cực trong ngôn ngữ.`,
          confidence: 0.7,
          relatedThemes: themes.themes.filter((t: { theme: string }) => t.theme === 'tương_lai').map((t: { theme: string }) => t.theme),
        });
      }

      // 3) High-risk topics
      if (risk.highRiskTopics.length > 0) {
        insights.push({
          type: 'warning',
          title: `Chủ đề nhạy cảm: ${risk.highRiskTopics.join(', ')}`,
          description: `Các chủ đề này tương quan với EBH cao hơn trung bình. Cần cẩn trọng khi đề cập.`,
          confidence: 0.75,
          relatedThemes: risk.highRiskTopics,
        });
      }

      // 4) Protective topics
      if (risk.protectiveTopics.length > 0) {
        insights.push({
          type: 'strength',
          title: `Chủ đề bảo vệ: ${risk.protectiveTopics.join(', ')}`,
          description: `Các chủ đề này tương quan với EBH thấp hơn, có thể là nguồn lực phục hồi.`,
          confidence: 0.7,
          relatedThemes: risk.protectiveTopics,
        });
      }

      // 5) Recovery arc detection
      const recoveryArcs = arcs.arcs.filter((a: { type: string }) => a.type === 'recovery');
      if (recoveryArcs.length > 0) {
        insights.push({
          type: 'milestone',
          title: `Phát hiện ${recoveryArcs.length} giai đoạn phục hồi`,
          description: 'Người dùng đã trải qua các giai đoạn cải thiện — chứng tỏ khả năng phục hồi.',
          confidence: 0.8,
          relatedThemes: [],
        });
      }

      // 6) Crisis arc warning
      const crisisArcs = arcs.arcs.filter((a: { type: string }) => a.type === 'crisis');
      if (crisisArcs.length > 0) {
        const recentCrisis = crisisArcs[crisisArcs.length - 1];
        insights.push({
          type: 'warning',
          title: `Phát hiện ${crisisArcs.length} giai đoạn khủng hoảng`,
          description: `Giai đoạn khủng hoảng gần nhất: EBH trung bình ${recentCrisis.avgEBH.toFixed(2)}.`,
          confidence: 0.85,
          relatedThemes: risk.highRiskTopics,
        });
      }

      // 7) Dominant theme pattern
      if (themes.themes.length > 0) {
        const dominant = themes.themes[0];
        insights.push({
          type: 'pattern',
          title: `Chủ đề chính: ${dominant.theme.replace(/_/g, ' ')}`,
          description: `Chiếm ${dominant.percentage}% trong các cuộc trò chuyện. Đây là mối bận tâm chính.`,
          confidence: Math.min(0.9, 0.5 + dominant.percentage / 200),
          relatedThemes: [dominant.theme],
        });
      }

      // 8) Narrative coherence
      if (arcs.coherence < 0.3) {
        insights.push({
          type: 'pattern',
          title: 'Trạng thái cảm xúc biến động cao',
          description: `Điểm mạch lạc: ${(arcs.coherence * 100).toFixed(0)}%. Cảm xúc biến động nhiều, khó dự đoán.`,
          confidence: 0.65,
          relatedThemes: [],
        });
      }

      // Memory patterns from LongTermMemory
      const memoryPatterns = new Map<string, { count: number; totalConf: number }>();
      for (const mem of memories) {
        const t = (mem as any).type || 'unknown';
        const entry = memoryPatterns.get(t) || { count: 0, totalConf: 0 };
        entry.count++;
        entry.totalConf += (mem as any).metadata?.confidence ?? 0.5;
        memoryPatterns.set(t, entry);
      }

      const result: NarrativeInsight = {
        userId,
        insights,
        memoryPatterns: Array.from(memoryPatterns.entries()).map(([type, stats]) => ({
          type,
          count: stats.count,
          avgConfidence: stats.count > 0 ? stats.totalConf / stats.count : 0,
        })),
        analyzedAt: new Date(),
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (err) {
      logger.error('[NarrativeIntelligence] Insight generation failed', { userId, error: err });
      throw err;
    }
  }

  // ────────────────────────────────────
  // FULL NARRATIVE DASHBOARD
  // ────────────────────────────────────

  /**
   * Return all narrative analyses for a user in a single call.
   */
  async getFullNarrativeDashboard(userId: string): Promise<{
    themes: ThematicProfile;
    linguistic: LinguisticProfile;
    arcs: StoryArcResult;
    risk: TopicRiskProfile;
    insights: NarrativeInsight;
  }> {
    const [themes, linguistic, arcs, risk, insights] = await Promise.all([
      this.analyzeThemes(userId),
      this.getLinguisticProfile(userId),
      this.detectUserStoryArcs(userId),
      this.getTopicRiskProfile(userId),
      this.getInsights(userId),
    ]);

    return { themes, linguistic, arcs, risk, insights };
  }
}

// Singleton export
export const narrativeIntelligenceEngine = new NarrativeIntelligenceEngineService();
