/**
 * 🧠 Memory-Aware Chatbot Service
 * 
 * Chatbot tích hợp 3-tier memory system:
 * - Working Memory: Session context
 * - Short-term Memory: Recent interactions (7 days)
 * - Long-term Memory: Semantic search với Pinecone
 */

import { memorySystem, WorkingMemoryData, ShortTermMemoryData, LongTermMemoryData } from './memorySystem';
import { enhancedChatbotService, EnhancedResponse } from './enhancedChatbotService';
import { logger } from '../utils/logger';

export interface MemoryAwareResponse extends EnhancedResponse {
  relevantMemories?: Array<{
    content: string;
    type: string;
    confidence: number;
  }>;
  memoryContext?: {
    hasWorkingMemory: boolean;
    shortTermCount: number;
    longTermCount: number;
  };
}

export class MemoryAwareChatbotService {
  /**
   * Process message với memory context
   */
  async chat(
    message: string,
    sessionId: string,
    userId: string,
    userProfile?: any,
    mode?: 'default' | 'em_style'
  ): Promise<MemoryAwareResponse> {
    try {
      logger.info(`🧠 Memory-aware chat processing for user: ${userId}`);

      // ====================
      // STEP 1: LOAD MEMORIES
      // ====================

      // 1.1. Load working memory (session context)
      const workingMemory = await memorySystem.getWorkingMemory(sessionId);
      logger.info(`Working memory loaded: ${workingMemory ? 'exists' : 'none'}`, {
        sessionId,
        emotion: workingMemory?.emotion,
        crisisLevel: workingMemory?.crisisLevel,
      });

      // 1.2. Retrieve relevant long-term memories (semantic search)
      let relevantMemories: Array<{
        content: string;
        type: string;
        confidence: number;
      }> = [];

      try {
        relevantMemories = await memorySystem.retrieveRelevantMemories(userId, message, 5);
        logger.info(`Retrieved ${relevantMemories.length} relevant memories`, {
          userId,
          query: message.substring(0, 50),
        });
      } catch (error) {
        logger.warn('Failed to retrieve long-term memories, continuing without them', error);
      }

      // ====================
      // STEP 2: BUILD ENHANCED PROMPT
      // ====================

      const enhancedMessage = this.buildContextAwarePrompt(
        message,
        workingMemory,
        relevantMemories,
        userProfile
      );

      logger.info('Enhanced prompt built', {
        originalLength: message.length,
        enhancedLength: enhancedMessage.length,
        memoriesIncluded: relevantMemories.length,
      });

      // ====================
      // STEP 3: GET AI RESPONSE
      // ====================

      const response = await enhancedChatbotService.processMessage(
        enhancedMessage,
        sessionId,
        userId,
        userProfile,
        mode
      );

      // ====================
      // STEP 4: UPDATE MEMORIES
      // ====================

      // 4.1. Update working memory với context mới
      const newWorkingMemory: WorkingMemoryData = {
        emotion: response.emotionalState || workingMemory?.emotion || 'neutral',
        intent: response.intent,
        crisisLevel: this.mapCrisisLevel(response.crisisLevel),
        conversationHistory: [
          ...(workingMemory?.conversationHistory || []).slice(-5), // Keep last 5 messages
          `User: ${message}`,
          `Bot: ${response.message}`,
        ],
        lastUpdated: Date.now(),
      };

      await memorySystem.saveWorkingMemory(sessionId, newWorkingMemory);
      logger.info('Working memory updated', { sessionId });

      // 4.2. Save to short-term memory
      const shortTermData: ShortTermMemoryData = {
        timestamp: Date.now(),
        message: message,
        emotion: response.emotionalState || 'neutral',
        crisisScore: this.mapCrisisLevel(response.crisisLevel),
      };

      await memorySystem.saveShortTermMemory(userId, shortTermData);
      logger.info('Short-term memory updated', { userId });

      // 4.3. Extract insights for long-term memory (background task)
      this.extractInsightsBackground(userId, sessionId, message, response).catch(error => {
        logger.warn('Background insight extraction failed', error);
      });

      // ====================
      // STEP 5: GET MEMORY STATS
      // ====================

      const memoryStats = await memorySystem.getMemoryStats(userId);

      // ====================
      // STEP 6: RETURN RESPONSE
      // ====================

      return {
        ...response,
        relevantMemories: relevantMemories.length > 0 ? relevantMemories : undefined,
        memoryContext: {
          hasWorkingMemory: !!workingMemory,
          shortTermCount: memoryStats.shortTermCount,
          longTermCount: memoryStats.longTermCount,
        },
      };
    } catch (error) {
      logger.error('Memory-aware chat processing failed', error);
      
      // Fallback to basic chatbot without memory
      const response = await enhancedChatbotService.processMessage(
        message,
        sessionId,
        userId,
        userProfile,
        mode
      );

      return {
        ...response,
        memoryContext: {
          hasWorkingMemory: false,
          shortTermCount: 0,
          longTermCount: 0,
        },
      };
    }
  }

  /**
   * Build context-aware prompt với memories
   */
  private buildContextAwarePrompt(
    message: string,
    workingMemory: WorkingMemoryData | null,
    relevantMemories: Array<{ content: string; type: string; confidence: number }>,
    userProfile?: any
  ): string {
    let prompt = message;

    // Add memory context as system instructions
    const contextParts: string[] = [];

    // 1. Working memory context
    if (workingMemory) {
      contextParts.push(
        `[Session Context: User's current emotion is "${workingMemory.emotion}", intent: "${workingMemory.intent}", crisis level: ${workingMemory.crisisLevel}/10]`
      );
    }

    // 2. Long-term memories (most relevant)
    if (relevantMemories.length > 0) {
      const memoryContext = relevantMemories
        .filter(m => m.confidence > 0.3) // Only include confident memories
        .slice(0, 3) // Max 3 memories
        .map(m => `- ${m.type}: ${m.content}`)
        .join('\n');

      if (memoryContext) {
        contextParts.push(
          `[User History:\n${memoryContext}\n]`
        );
      }
    }

    // 3. User profile
    if (userProfile) {
      contextParts.push(
        `[User Profile: Age ${userProfile.age || 'unknown'}, ${userProfile.occupation || 'occupation unknown'}]`
      );
    }

    // Combine context + message
    if (contextParts.length > 0) {
      prompt = `${contextParts.join('\n\n')}\n\nUser Message: ${message}`;
    }

    return prompt;
  }

  /**
   * Extract insights for long-term memory (background task)
   */
  private async extractInsightsBackground(
    userId: string,
    sessionId: string,
    userMessage: string,
    botResponse: EnhancedResponse
  ): Promise<void> {
    try {
      // Only extract insights from meaningful conversations
      if (userMessage.length < 20) {
        return; // Skip short messages
      }

      // Extract patterns from user behavior
      const insights: LongTermMemoryData[] = [];

      // 1. Pattern: Crisis triggers
      if (botResponse.crisisLevel === 'high' || botResponse.crisisLevel === 'critical') {
        insights.push({
          type: 'pattern',
          content: `User shows signs of crisis when discussing: ${userMessage.substring(0, 100)}`,
          metadata: {
            confidence: 0.9,
            source: 'crisis_detection',
            category: 'crisis_trigger',
          },
        });
      }

      // 2. Insight: Emotional patterns
      if (botResponse.emotionalState && botResponse.emotionalState !== 'neutral') {
        insights.push({
          type: 'insight',
          content: `User experiences ${botResponse.emotionalState} when discussing topics like: ${userMessage.substring(0, 80)}`,
          metadata: {
            confidence: 0.7,
            source: 'emotion_analysis',
            category: 'emotional_pattern',
          },
        });
      }

      // 3. Preference: Response quality
      if (botResponse.qualityScore && botResponse.qualityScore > 0.8) {
        insights.push({
          type: 'preference',
          content: `User responds well to ${botResponse.intent} type responses`,
          metadata: {
            confidence: 0.6,
            source: 'quality_feedback',
            category: 'response_preference',
          },
        });
      }

      // 4. ALWAYS create a pattern from conversation topic (NEW!)
      // Extract key topics from user message
      const topics = this.extractTopics(userMessage);
      if (topics.length > 0) {
        insights.push({
          type: 'pattern',
          content: `User discusses topics related to: ${topics.join(', ')}`,
          metadata: {
            confidence: 0.6,
            source: 'conversation_analysis',
            category: 'discussion_topic',
          },
        });
      }

      // 5. Track intent patterns (NEW!)
      if (botResponse.intent && botResponse.intent !== 'general') {
        insights.push({
          type: 'preference',
          content: `User seeks ${botResponse.intent} type support in conversations`,
          metadata: {
            confidence: 0.5,
            source: 'intent_tracking',
            category: 'support_preference',
          },
        });
      }

      // Save all insights
      for (const insight of insights) {
        try {
          await memorySystem.saveLongTermMemory(userId, insight);
          logger.info('Insight saved to long-term memory', {
            userId,
            type: insight.type,
            category: insight.metadata.category,
          });
        } catch (error) {
          logger.warn('Failed to save insight', { error, insight: insight.type });
        }
      }
    } catch (error) {
      logger.error('Insight extraction failed', error);
    }
  }

  /**
   * Map crisis level to numeric score
   */
  private mapCrisisLevel(level: string): number {
    const mapping: { [key: string]: number } = {
      low: 2,
      medium: 5,
      high: 8,
      critical: 10,
    };
    return mapping[level] || 0;
  }

  /**
   * Get conversation history with memory context
   */
  async getConversationHistory(
    userId: string,
    sessionId: string,
    limit: number = 20
  ): Promise<{
    messages: any[];
    memoryContext: {
      workingMemory: WorkingMemoryData | null;
      recentInteractions: any[];
      memoryStats: any;
    };
  }> {
    try {
      // Get basic conversation history
      const messages = enhancedChatbotService.messages.get(sessionId) || [];

      // Get memory context
      const workingMemory = await memorySystem.getWorkingMemory(sessionId);
      const recentInteractions = await memorySystem.getRecentInteractions(userId, limit);
      const memoryStats = await memorySystem.getMemoryStats(userId);

      return {
        messages: messages.slice(-limit),
        memoryContext: {
          workingMemory,
          recentInteractions,
          memoryStats,
        },
      };
    } catch (error) {
      logger.error('Failed to get conversation history with memory', error);
      return {
        messages: [],
        memoryContext: {
          workingMemory: null,
          recentInteractions: [],
          memoryStats: {
            workingMemoryExists: false,
            shortTermCount: 0,
            longTermCount: 0,
          },
        },
      };
    }
  }

  /**
   * Extract key topics from message
   */
  private extractTopics(message: string): string[] {
    const topics: string[] = [];
    const lowerMessage = message.toLowerCase();

    // Common topic keywords
    const topicMap: { [key: string]: string[] } = {
      'work': ['công việc', 'làm việc', 'deadline', 'dự án', 'project', 'work', 'job'],
      'stress': ['lo lắng', 'stress', 'áp lực', 'căng thẳng', 'anxiety', 'worried'],
      'sleep': ['ngủ', 'thức khuya', 'mất ngủ', 'sleep', 'insomnia'],
      'relationship': ['quan hệ', 'bạn bè', 'gia đình', 'tình cảm', 'relationship', 'family'],
      'health': ['sức khỏe', 'bệnh', 'đau', 'health', 'sick', 'pain'],
      'emotion': ['cảm xúc', 'tâm trạng', 'buồn', 'vui', 'emotion', 'mood', 'feeling'],
    };

    for (const [topic, keywords] of Object.entries(topicMap)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        topics.push(topic);
      }
    }

    return topics;
  }

  /**
   * Clear session memory (for new conversation)
   */
  async clearSessionMemory(sessionId: string): Promise<void> {
    await memorySystem.clearWorkingMemory(sessionId);
    logger.info('Session memory cleared', { sessionId });
  }

  /**
   * Get user's memory profile
   */
  async getUserMemoryProfile(userId: string): Promise<{
    stats: any;
    recentPatterns: any[];
    topPreferences: any[];
  }> {
    try {
      const stats = await memorySystem.getMemoryStats(userId);
      
      // Get recent patterns and preferences from long-term memory
      const recentInteractions = await memorySystem.getRecentInteractions(userId, 50);
      
      // Analyze patterns
      const patterns = recentInteractions.filter((i: any) => 
        i.message && (i.message.includes('stress') || i.message.includes('anxiety'))
      );

      return {
        stats,
        recentPatterns: patterns.slice(0, 5),
        topPreferences: [], // TODO: Implement preference aggregation
      };
    } catch (error) {
      logger.error('Failed to get user memory profile', error);
      return {
        stats: { workingMemoryExists: false, shortTermCount: 0, longTermCount: 0 },
        recentPatterns: [],
        topPreferences: [],
      };
    }
  }
}

// Export singleton instance
export const memoryAwareChatbotService = new MemoryAwareChatbotService();
export default memoryAwareChatbotService;
