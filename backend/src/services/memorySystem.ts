/**
 * 🧠 Memory System - 3-Tier Architecture
 * - Working Memory: Session context (Redis, 1h TTL)
 * - Short-term Memory: Recent 7 days (Redis Sorted Set)
 * - Long-term Memory: Permanent (Pinecone + MongoDB)
 */

import { Redis } from 'ioredis';
import { vectorStore, VectorMetadata } from './vectorStore';
import LongTermMemory from '../models/LongTermMemory';
import config from '../config/environment';
import redisService from './redisService';

export interface WorkingMemoryData {
  emotion: string;
  intent: string;
  crisisLevel: number;
  conversationHistory: string[];
  lastUpdated: number;
}

export interface ShortTermMemoryData {
  timestamp: number;
  message: string;
  emotion: string;
  testResults?: any;
  crisisScore?: number;
}

export interface LongTermMemoryData {
  type: 'insight' | 'pattern' | 'preference' | 'milestone' | 'trigger' | 'coping_strategy' | 'progress' | 'behavior';
  content: string;
  metadata: {
    confidence: number;
    source: string;
    category?: string;
    extractedAt?: Date;
    intensity?: number;
    frequency?: number;
    lastSeen?: Date;
    relatedTopics?: string[];
    timeContext?: {
      hour?: number;
      dayOfWeek?: number;
      timePattern?: string;
    };
    [key: string]: any;
  };
}

export class MemorySystem {
  private redis: Redis | null = null;
  private enabled: boolean = false;

  constructor() {
    // Check if Redis is configured
    if (config.REDIS_URL) {
      try {
        this.redis = new Redis(config.REDIS_URL);
        this.enabled = true;
        console.log('✅ Memory System initialized with Redis');
      } catch (error) {
        console.error('❌ Failed to initialize Redis:', error);
        this.enabled = false;
      }
    } else {
      console.log('⚠️  Redis not configured, memory system disabled');
    }
  }

  /**
   * Check if memory system is enabled
   */
  isEnabled(): boolean {
    return this.enabled && this.redis !== null;
  }

  // ==========================================
  // 🔥 WORKING MEMORY - Session Context
  // ==========================================

  /**
   * Save working memory (current session context)
   */
  async saveWorkingMemory(sessionId: string, data: WorkingMemoryData): Promise<void> {
    if (!this.isEnabled()) {
      console.log('⚠️  Memory system disabled, skipping save');
      return;
    }

    try {
      const key = `working:${sessionId}`;
      await this.redis!.setex(key, 3600, JSON.stringify({
        ...data,
        lastUpdated: Date.now(),
      }));
      console.log(`✅ Working memory saved for session: ${sessionId}`);
    } catch (error) {
      console.error('❌ Failed to save working memory:', error);
    }
  }

  /**
   * Get working memory
   */
  async getWorkingMemory(sessionId: string): Promise<WorkingMemoryData | null> {
    if (!this.isEnabled()) {
      return null;
    }

    try {
      const key = `working:${sessionId}`;
      const data = await this.redis!.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ Failed to get working memory:', error);
      return null;
    }
  }

  /**
   * Clear working memory
   */
  async clearWorkingMemory(sessionId: string): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    try {
      await this.redis!.del(`working:${sessionId}`);
      console.log(`✅ Working memory cleared for session: ${sessionId}`);
    } catch (error) {
      console.error('❌ Failed to clear working memory:', error);
    }
  }

  // ==========================================
  // ⚡ SHORT-TERM MEMORY - Recent Interactions
  // ==========================================

  /**
   * Save short-term memory (recent 7 days)
   */
  async saveShortTermMemory(userId: string, interaction: ShortTermMemoryData): Promise<void> {
    if (!this.isEnabled()) {
      console.log('⚠️  Memory system disabled, skipping save');
      return;
    }

    try {
      const key = `shortterm:${userId}`;
      
      // Add to sorted set with timestamp as score
      await this.redis!.zadd(key, interaction.timestamp, JSON.stringify(interaction));
      
      // Keep only last 100 interactions
      await this.redis!.zremrangebyrank(key, 0, -101);
      
      // Set expiry to 7 days
      await this.redis!.expire(key, 604800);
      
      console.log(`✅ Short-term memory saved for user: ${userId}`);
    } catch (error) {
      console.error('❌ Failed to save short-term memory:', error);
    }
  }

  /**
   * Get recent interactions
   */
  async getRecentInteractions(userId: string, limit = 10): Promise<ShortTermMemoryData[]> {
    if (!this.isEnabled()) {
      return [];
    }

    try {
      const key = `shortterm:${userId}`;
      const data = await this.redis!.zrevrange(key, 0, limit - 1);
      return data.map(d => JSON.parse(d));
    } catch (error) {
      console.error('❌ Failed to get recent interactions:', error);
      return [];
    }
  }

  /**
   * Get interactions within time range
   */
  async getInteractionsByTimeRange(
    userId: string,
    startTime: number,
    endTime: number
  ): Promise<ShortTermMemoryData[]> {
    if (!this.isEnabled()) {
      return [];
    }

    try {
      const key = `shortterm:${userId}`;
      const data = await this.redis!.zrangebyscore(key, startTime, endTime);
      return data.map(d => JSON.parse(d));
    } catch (error) {
      console.error('❌ Failed to get interactions by time range:', error);
      return [];
    }
  }

  // ==========================================
  // 🧠 LONG-TERM MEMORY - Semantic Search
  // ==========================================

  /**
   * Save long-term memory (permanent, searchable)
   */
  async saveLongTermMemory(userId: string, memory: LongTermMemoryData): Promise<void> {
    try {
      // 1. Save structured data to MongoDB using LongTermMemory model
      const longTermMemory = await LongTermMemory.create({
        userId,
        type: memory.type,
        content: memory.content,
        metadata: memory.metadata,
      });

      // 2. Create embedding and save to Pinecone (if enabled)
      if (vectorStore.isEnabled()) {
        try {
          const embedding = await vectorStore.createEmbedding(memory.content);
          
          const vectorId = `${userId}_${Date.now()}_${longTermMemory._id}`;
          
          await vectorStore.upsert({
            id: vectorId,
            values: embedding,
            metadata: {
              userId,
              type: memory.type,
              content: memory.content,
              timestamp: Date.now(),
              category: memory.metadata.category,
              confidence: memory.metadata.confidence,
              mongoId: String(longTermMemory._id),
              source: memory.metadata.source,
            } as VectorMetadata,
          });

          // Update MongoDB with vector ID
          longTermMemory.vectorId = vectorId;
          longTermMemory.embeddingGenerated = true;
          await longTermMemory.save();

          console.log(`✅ Long-term memory saved for user: ${userId} (Vector ID: ${vectorId})`);
        } catch (error) {
          console.error('⚠️  Failed to save vector, continuing with MongoDB only:', error);
        }
      } else {
        console.log(`✅ Long-term memory saved to MongoDB only (vector DB disabled): ${userId}`);
      }
    } catch (error) {
      console.error('❌ Failed to save long-term memory:', error);
      throw error;
    }
  }

  /**
   * Retrieve relevant memories via semantic search
   */
  async retrieveRelevantMemories(
    userId: string,
    query: string,
    topK = 5
  ): Promise<Array<{
    content: string;
    type: string;
    confidence: number;
    timestamp: number;
  }>> {
    // If vector store is not enabled, fallback to MongoDB text search
    if (!vectorStore.isEnabled()) {
      console.log('⚠️  Vector search disabled, using MongoDB fallback');
      return this.fallbackTextSearch(userId, query, topK);
    }

    try {
      // Create query embedding
      const queryEmbedding = await vectorStore.createEmbedding(query);

      // Search in Pinecone
      const results = await vectorStore.query({
        vector: queryEmbedding,
        filter: { userId },
        topK,
        includeMetadata: true,
      });

      return results.map(match => ({
        content: match.metadata.content,
        type: match.metadata.type,
        confidence: match.score,
        timestamp: match.metadata.timestamp,
      }));
    } catch (error) {
      console.error('❌ Failed to retrieve relevant memories, using fallback:', error);
      return this.fallbackTextSearch(userId, query, topK);
    }
  }

  /**
   * Fallback text search using MongoDB (when Pinecone is unavailable)
   */
  private async fallbackTextSearch(
    userId: string,
    query: string,
    limit: number
  ): Promise<Array<{
    content: string;
    type: string;
    confidence: number;
    timestamp: number;
  }>> {
    try {
      const results = await LongTermMemory.find({
        userId,
        $or: [
          { content: { $regex: query, $options: 'i' } },
          { 'metadata.category': { $regex: query, $options: 'i' } },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(limit);

      return results.map(result => ({
        content: result.content,
        type: result.type,
        confidence: 0.5, // Lower confidence for text match
        timestamp: result.createdAt.getTime(),
      }));
    } catch (error) {
      console.error('❌ Fallback text search failed:', error);
      return [];
    }
  }

  /**
   * Delete all memories for a user (GDPR compliance)
   */
  async deleteUserMemories(userId: string): Promise<void> {
    try {
      // 1. Delete from Redis (working + short-term)
      if (this.isEnabled()) {
        const workingKeys = await this.redis!.keys(`working:*${userId}*`);
        if (workingKeys.length > 0) {
          await this.redis!.del(...workingKeys);
        }
        await this.redis!.del(`shortterm:${userId}`);
      }

      // 2. Delete from Pinecone (long-term vectors)
      if (vectorStore.isEnabled()) {
        await vectorStore.deleteByUser(userId);
      }

      // 3. Delete from MongoDB (long-term memory structured data)
      await LongTermMemory.deleteMany({ userId });

      console.log(`✅ All memories deleted for user: ${userId}`);
    } catch (error) {
      console.error('❌ Failed to delete user memories:', error);
      throw error;
    }
  }

  /**
   * Get memory statistics for a user
   */
  async getMemoryStats(userId: string): Promise<{
    workingMemoryExists: boolean;
    shortTermCount: number;
    longTermCount: number;
  }> {
    try {
      let workingExists = false;
      let shortTermCount = 0;

      if (this.isEnabled()) {
        const workingKeys = await this.redis!.keys(`working:*${userId}*`);
        workingExists = workingKeys.length > 0;
        shortTermCount = await this.redis!.zcard(`shortterm:${userId}`);
      }

      const longTermCount = await LongTermMemory.countDocuments({ userId });

      return {
        workingMemoryExists: workingExists,
        shortTermCount,
        longTermCount,
      };
    } catch (error) {
      console.error('❌ Failed to get memory stats:', error);
      return {
        workingMemoryExists: false,
        shortTermCount: 0,
        longTermCount: 0,
      };
    }
  }
}

// Export singleton instance
export const memorySystem = new MemorySystem();
