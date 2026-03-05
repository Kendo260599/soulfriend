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
import { toNumericScore } from '../types/risk';
import { logger } from '../utils/logger';
import redisService from './redisService';
import { memoryConsolidationService } from './memoryConsolidationService';
import { therapeuticContextService } from './therapeuticContextService';

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
      const workingMemory = await memorySystem.getWorkingMemory(sessionId, userId);
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
        // 🔴 TRY CACHE FIRST
        if (redisService.isReady()) {
          const cacheKey = `memories:${userId}:${message.substring(0, 50)}`;
          const cached = await redisService.getCachedJSON<typeof relevantMemories>(cacheKey);
          
          if (cached) {
            relevantMemories = cached;
            logger.info(`✅ Cache HIT: Retrieved ${cached.length} memories from Redis`);
          } else {
            // Cache miss - fetch from Pinecone
            relevantMemories = await memorySystem.retrieveRelevantMemories(userId, message, 5);
            
            // Cache for 10 minutes
            await redisService.cacheJSON(cacheKey, relevantMemories, 600);
            logger.info(`⚠️ Cache MISS: Retrieved ${relevantMemories.length} memories from Pinecone, cached`);
          }
        } else {
          // Redis not available - direct fetch
          relevantMemories = await memorySystem.retrieveRelevantMemories(userId, message, 5);
          logger.info(`Retrieved ${relevantMemories.length} relevant memories (no cache)`, {
            userId,
            query: message.substring(0, 50),
          });
        }
      } catch (error) {
        logger.warn('Failed to retrieve long-term memories, continuing without them', error);
      }

      // ====================
      // STEP 1.5: LOAD THERAPEUTIC CONTEXT
      // ====================
      let therapeuticContext = '';
      try {
        therapeuticContext = await therapeuticContextService.getContextForPrompt(userId);
      } catch (err) {
        logger.warn('Failed to load therapeutic context, continuing without it', err);
      }

      // ====================
      // STEP 2: BUILD ENHANCED PROMPT
      // ====================

      const enhancedMessage = this.buildContextAwarePrompt(
        message,
        workingMemory,
        relevantMemories,
        userProfile,
        therapeuticContext
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
        crisisLevel: toNumericScore(response.riskLevel),
        conversationHistory: [
          ...(workingMemory?.conversationHistory || []).slice(-5), // Keep last 5 messages
          `User: ${message}`,
          `Bot: ${response.message}`,
        ],
        lastUpdated: Date.now(),
      };

      await memorySystem.saveWorkingMemory(sessionId, newWorkingMemory, userId);
      logger.info('Working memory updated', { sessionId });

      // 4.2. Save to short-term memory
      const shortTermData: ShortTermMemoryData = {
        timestamp: Date.now(),
        message: message,
        emotion: response.emotionalState || 'neutral',
        crisisScore: toNumericScore(response.riskLevel),
      };

      await memorySystem.saveShortTermMemory(userId, shortTermData);
      logger.info('Short-term memory updated', { userId });

      // 4.3. Extract insights for long-term memory (background task)
      this.extractInsightsBackground(userId, sessionId, message, response).catch(error => {
        // CRITICAL ERROR LOGGING - Force visibility
        console.error('🚨🚨🚨 INSIGHT EXTRACTION FAILED 🚨🚨🚨');
        console.error('Error:', error);
        console.error('Error Message:', error?.message);
        console.error('Error Stack:', error?.stack);
        console.error('User ID:', userId);
        console.error('Session ID:', sessionId);
        logger.error('Background insight extraction failed', {
          error: error?.message,
          stack: error?.stack,
          userId,
          sessionId,
          timestamp: new Date().toISOString()
        });
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
    userProfile?: any,
    therapeuticContext?: string
  ): string {
    let prompt = message;

    // Add memory context as system instructions
    const contextParts: string[] = [];

    // 0. Therapeutic context (comprehensive user profile)
    if (therapeuticContext) {
      contextParts.push(`[Therapeutic Profile:\n${therapeuticContext}\n]`);
    }

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
   * Extract insights for long-term memory (IMPROVED - background task)
   * NOW SUPPORTS SHORT MESSAGES - Learn from ALL chats!
   */
  private async extractInsightsBackground(
    userId: string,
    sessionId: string,
    userMessage: string,
    botResponse: EnhancedResponse
  ): Promise<void> {
    // ENTRY POINT LOGGING - Verify function is called
    console.log('🔍 extractInsightsBackground() CALLED');
    console.log('  User ID:', userId);
    console.log('  Session ID:', sessionId);
    console.log('  Message:', userMessage.substring(0, 50));
    console.log('  Message Length:', userMessage.length);
    
    try {
      console.log('✅ Inside try block - starting extraction...');
      
      // FIXED: Removed 15-char threshold - learn from ALL messages!
      // Extract patterns from user behavior
      const insights: LongTermMemoryData[] = [];
      const timeContext = this.getTimeContext();
      const topics = this.extractTopics(userMessage);

      // Calculate base confidence based on message quality
      // Short messages get lower confidence but still valuable
      const baseConfidence = Math.min(0.3 + (userMessage.length / 200), 0.9);

      // ====================
      // MICRO-INSIGHTS FOR SHORT MESSAGES (1-15 chars)
      // ====================
      if (userMessage.length < 15) {
        // Extract emotion from single words
        const shortMsgLower = userMessage.toLowerCase().trim();
        const emotionMap: Record<string, { emotion: string; intensity: number }> = {
          'buồn': { emotion: 'sad', intensity: 0.8 },
          'vui': { emotion: 'happy', intensity: 0.8 },
          'lo': { emotion: 'anxious', intensity: 0.7 },
          'sợ': { emotion: 'fearful', intensity: 0.8 },
          'giận': { emotion: 'angry', intensity: 0.8 },
          'mệt': { emotion: 'tired', intensity: 0.7 },
          'stress': { emotion: 'stressed', intensity: 0.8 },
          'ok': { emotion: 'neutral', intensity: 0.5 },
          'không': { emotion: 'negative', intensity: 0.6 },
          'có': { emotion: 'positive', intensity: 0.6 },
          'cảm ơn': { emotion: 'grateful', intensity: 0.7 },
          'xin lỗi': { emotion: 'apologetic', intensity: 0.6 },
        };

        // Check for emotion keywords
        for (const [keyword, data] of Object.entries(emotionMap)) {
          if (shortMsgLower.includes(keyword)) {
            insights.push({
              type: 'pattern',
              content: `Micro-insight: User expressed ${data.emotion} feeling (short message: "${userMessage}")`,
              metadata: {
                confidence: 0.6, // Lower confidence for short messages
                source: 'micro_insight',
                category: 'short_message_emotion',
                intensity: data.intensity,
                relatedTopics: [data.emotion],
                timeContext,
                originalMessage: userMessage,
              },
            });

            // Track time patterns for emotions
            insights.push({
              type: 'pattern',
              content: `User tends to feel ${data.emotion} during ${timeContext.timePattern}`,
              metadata: {
                confidence: 0.5,
                source: 'time_pattern',
                category: 'temporal_emotion',
                intensity: data.intensity * 0.7,
                relatedTopics: [data.emotion, timeContext.timePattern],
                timeContext,
              },
            });

            break; // Only extract first matching emotion
          }
        }

        // Save micro-insights and return early
        if (insights.length > 0) {
          for (const insight of insights) {
            const dedupResult = await memoryConsolidationService.deduplicateBeforeSave(
              userId, insight.type, insight.content, insight.metadata
            );
            if (dedupResult === 'new') {
              await memorySystem.saveLongTermMemory(userId, insight);
            }
            logger.info('🔬 Micro-insight processed from short message', {
              userId,
              messageLength: userMessage.length,
              message: userMessage,
              insightType: insight.type,
              dedupResult,
            });
          }
        }
        return; // Skip full extraction for short messages
      }

      // ====================
      // 1. CRISIS TRIGGERS (High Priority)
      // ====================
      if (botResponse.crisisLevel === 'high' || botResponse.crisisLevel === 'critical') {
        insights.push({
          type: 'trigger',
          content: `Crisis trigger detected: ${userMessage.substring(0, 100)}`,
          metadata: {
            confidence: 0.95,
            source: 'crisis_detection',
            category: 'crisis_trigger',
            intensity: botResponse.crisisLevel === 'critical' ? 1.0 : 0.8,
            relatedTopics: topics,
            timeContext,
          },
        });

        // Also create a pattern for crisis context
        insights.push({
          type: 'pattern',
          content: `User tends to experience ${botResponse.crisisLevel} crisis when discussing: ${topics.join(', ') || 'personal matters'}`,
          metadata: {
            confidence: 0.85,
            source: 'crisis_analysis',
            category: 'crisis_pattern',
            intensity: 0.9,
            relatedTopics: topics,
            timeContext,
          },
        });
      }

      // ====================
      // 2. EMOTIONAL PATTERNS (Medium Priority)
      // ====================
      if (botResponse.emotionalState && botResponse.emotionalState !== 'neutral') {
        const emotionIntensity = this.calculateEmotionIntensity(userMessage, botResponse.emotionalState);
        
        insights.push({
          type: 'pattern',
          content: `Emotional pattern: User feels ${botResponse.emotionalState} when discussing ${topics.join(', ') || 'daily matters'}`,
          metadata: {
            confidence: 0.75 + (emotionIntensity * 0.15),
            source: 'emotion_analysis',
            category: 'emotional_pattern',
            intensity: emotionIntensity,
            relatedTopics: topics,
            timeContext,
          },
        });
      }

      // ====================
      // 3. COPING STRATEGIES DETECTION (NEW!)
      // ====================
      const copingStrategy = this.detectCopingStrategy(userMessage);
      if (copingStrategy) {
        insights.push({
          type: 'coping_strategy',
          content: `User applies coping strategy: ${copingStrategy.strategy} - "${copingStrategy.description}"`,
          metadata: {
            confidence: copingStrategy.confidence,
            source: 'behavior_analysis',
            category: 'coping_mechanism',
            intensity: 0.7,
            relatedTopics: topics,
          },
        });
      }

      // ====================
      // 4. BEHAVIORAL PATTERNS (NEW!)
      // ====================
      insights.push({
        type: 'behavior',
        content: `User active during ${timeContext.timePattern} (${timeContext.hour}:00), discussing: ${topics.join(', ') || 'general topics'}`,
        metadata: {
          confidence: baseConfidence,
          source: 'temporal_analysis',
          category: 'activity_pattern',
          intensity: 0.5,
          relatedTopics: topics,
          timeContext,
          frequency: 1,
          lastSeen: new Date(),
        },
      });

      // ====================
      // 5. TOPIC PATTERNS WITH INTENSITY (IMPROVED!)
      // ====================
      if (topics.length > 0) {
        for (const topic of topics) {
          const intensity = this.calculateTopicIntensity(userMessage, topic);
          
          insights.push({
            type: 'pattern',
            content: `User discusses topic: ${topic} (intensity: ${(intensity * 100).toFixed(0)}%)`,
            metadata: {
              confidence: 0.7 + (intensity * 0.2),
              source: 'conversation_analysis',
              category: 'discussion_topic',
              intensity,
              relatedTopics: [topic],
              timeContext,
              frequency: 1,
              lastSeen: new Date(),
            },
          });
        }
      }

      // ====================
      // 6. COMMUNICATION PREFERENCES (NEW!)
      // ====================
      if (botResponse.qualityScore && botResponse.qualityScore > 0.8) {
        insights.push({
          type: 'preference',
          content: `User responds positively to ${botResponse.intent || 'supportive'} communication style`,
          metadata: {
            confidence: 0.7 + (botResponse.qualityScore * 0.2),
            source: 'quality_feedback',
            category: 'communication_preference',
            intensity: botResponse.qualityScore,
            relatedTopics: topics,
          },
        });
      }

      // ====================
      // 7. INTENT PATTERNS (IMPROVED!)
      // ====================
      if (botResponse.intent && botResponse.intent !== 'general') {
        insights.push({
          type: 'preference',
          content: `User frequently seeks ${botResponse.intent} type support`,
          metadata: {
            confidence: 0.6 + (baseConfidence * 0.2),
            source: 'intent_tracking',
            category: 'support_preference',
            intensity: 0.6,
            relatedTopics: topics,
            timeContext,
            frequency: 1,
          },
        });
      }

      // ====================
      // 8. TRIGGER DETECTION (NEW!)
      // ====================
      const triggers = this.detectTriggers(userMessage, botResponse);
      for (const trigger of triggers) {
        insights.push({
          type: 'trigger',
          content: `Trigger detected: ${trigger.name} - ${trigger.context}`,
          metadata: {
            confidence: trigger.confidence,
            source: 'trigger_analysis',
            category: 'stress_trigger',
            intensity: trigger.intensity,
            relatedTopics: topics,
            timeContext,
          },
        });
      }

      // ====================
      // 9. PROGRESS TRACKING (NEW!)
      // ====================
      const progressIndicator = this.detectProgressIndicator(userMessage);
      if (progressIndicator) {
        insights.push({
          type: 'progress',
          content: `Progress indicator: ${progressIndicator.type} - ${progressIndicator.description}`,
          metadata: {
            confidence: progressIndicator.confidence,
            source: 'progress_tracking',
            category: 'improvement_milestone',
            intensity: progressIndicator.intensity,
            relatedTopics: topics,
          },
        });
      }

      // ====================
      // SAVE ALL INSIGHTS
      // ====================
      logger.info('Extracted insights', {
        userId,
        count: insights.length,
        types: insights.map(i => i.type),
      });

      for (const insight of insights) {
        try {
          const dedupResult = await memoryConsolidationService.deduplicateBeforeSave(
            userId, insight.type, insight.content, insight.metadata
          );
          if (dedupResult === 'new') {
            await memorySystem.saveLongTermMemory(userId, insight);
          }
          logger.info('Insight processed for long-term memory', {
            userId,
            type: insight.type,
            category: insight.metadata.category,
            confidence: insight.metadata.confidence,
            dedupResult,
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
   * Calculate emotion intensity from message
   */
  private calculateEmotionIntensity(message: string, emotion: string): number {
    const lowerMessage = message.toLowerCase();
    let intensity = 0.5;

    // Strong emotion indicators
    const strongIndicators = ['rất', 'cực kỳ', 'quá', 'extremely', 'very', 'too', 'không thể', 'terrible', 'khủng khiếp'];
    if (strongIndicators.some(word => lowerMessage.includes(word))) {
      intensity += 0.3;
    }

    // Multiple exclamation/question marks
    const punctuationCount = (message.match(/[!?]/g) || []).length;
    intensity += Math.min(punctuationCount * 0.1, 0.2);

    return Math.min(intensity, 1.0);
  }

  /**
   * Detect coping strategies user mentions
   */
  private detectCopingStrategy(message: string): {
    strategy: string;
    description: string;
    confidence: number;
  } | null {
    const lowerMessage = message.toLowerCase();

    const strategies = [
      {
        keywords: ['thở', 'breathe', 'hít thở', 'breathing'],
        strategy: 'Breathing exercises',
        description: 'Uses breathing techniques to manage stress',
        confidence: 0.8,
      },
      {
        keywords: ['tập', 'exercise', 'gym', 'chạy bộ', 'yoga', 'workout'],
        strategy: 'Physical exercise',
        description: 'Engages in physical activity for mental health',
        confidence: 0.85,
      },
      {
        keywords: ['nói chuyện', 'chia sẻ', 'talk', 'share', 'bạn bè', 'friends'],
        strategy: 'Social support',
        description: 'Seeks support from friends and family',
        confidence: 0.8,
      },
      {
        keywords: ['nghe nhạc', 'music', 'đọc sách', 'read', 'book'],
        strategy: 'Distraction/Hobby',
        description: 'Uses hobbies to relax and distract from stress',
        confidence: 0.75,
      },
      {
        keywords: ['thiền', 'meditation', 'mindfulness', 'chánh niệm'],
        strategy: 'Mindfulness/Meditation',
        description: 'Practices mindfulness and meditation',
        confidence: 0.9,
      },
      {
        keywords: ['viết', 'write', 'journal', 'nhật ký'],
        strategy: 'Journaling',
        description: 'Writes to process emotions and thoughts',
        confidence: 0.85,
      },
    ];

    for (const strat of strategies) {
      if (strat.keywords.some(kw => lowerMessage.includes(kw))) {
        return {
          strategy: strat.strategy,
          description: strat.description,
          confidence: strat.confidence,
        };
      }
    }

    return null;
  }

  /**
   * Detect stress triggers in message
   */
  private detectTriggers(message: string, botResponse: EnhancedResponse): Array<{
    name: string;
    context: string;
    confidence: number;
    intensity: number;
  }> {
    const lowerMessage = message.toLowerCase();
    const triggers = [];

    const triggerPatterns = [
      {
        keywords: ['deadline', 'hạn chót', 'gấp', 'urgent', 'rush'],
        name: 'Time pressure',
        context: 'Tight deadlines cause stress',
        confidence: 0.85,
        intensity: 0.8,
      },
      {
        keywords: ['sếp', 'boss', 'manager', 'quản lý', 'leadership'],
        name: 'Authority figures',
        context: 'Interactions with supervisors trigger stress',
        confidence: 0.8,
        intensity: 0.7,
      },
      {
        keywords: ['cãi nhau', 'conflict', 'argue', 'fight', 'tranh cãi'],
        name: 'Interpersonal conflict',
        context: 'Conflicts in relationships cause distress',
        confidence: 0.9,
        intensity: 0.85,
      },
      {
        keywords: ['tiền', 'money', 'financial', 'debt', 'nợ', 'bill'],
        name: 'Financial stress',
        context: 'Money-related issues trigger anxiety',
        confidence: 0.85,
        intensity: 0.75,
      },
      {
        keywords: ['fail', 'thất bại', 'mistake', 'sai lầm', 'lỗi'],
        name: 'Fear of failure',
        context: 'Fear of making mistakes or failing',
        confidence: 0.8,
        intensity: 0.7,
      },
    ];

    for (const pattern of triggerPatterns) {
      if (pattern.keywords.some(kw => lowerMessage.includes(kw))) {
        triggers.push({
          name: pattern.name,
          context: pattern.context,
          confidence: pattern.confidence,
          intensity: pattern.intensity,
        });
      }
    }

    return triggers;
  }

  /**
   * Detect progress indicators (improvement over time)
   */
  private detectProgressIndicator(message: string): {
    type: string;
    description: string;
    confidence: number;
    intensity: number;
  } | null {
    const lowerMessage = message.toLowerCase();

    const progressPatterns = [
      {
        keywords: ['tốt hơn', 'better', 'improve', 'cải thiện', 'khá hơn'],
        type: 'Positive progress',
        description: 'User reports feeling better or improving',
        confidence: 0.9,
        intensity: 0.8,
      },
      {
        keywords: ['học được', 'learned', 'realize', 'nhận ra', 'hiểu'],
        type: 'Insight gained',
        description: 'User has gained self-awareness or understanding',
        confidence: 0.85,
        intensity: 0.7,
      },
      {
        keywords: ['thử', 'try', 'attempt', 'cố gắng', 'nỗ lực'],
        type: 'Active coping',
        description: 'User is actively trying to improve situation',
        confidence: 0.8,
        intensity: 0.7,
      },
      {
        keywords: ['cảm ơn', 'thank', 'appreciate', 'biết ơn', 'grateful'],
        type: 'Gratitude expression',
        description: 'User expresses gratitude (positive sign)',
        confidence: 0.85,
        intensity: 0.6,
      },
      {
        keywords: ['kiểm soát', 'control', 'manage', 'quản lý', 'handle'],
        type: 'Increased control',
        description: 'User feels more in control of situation',
        confidence: 0.85,
        intensity: 0.75,
      },
    ];

    for (const pattern of progressPatterns) {
      if (pattern.keywords.some(kw => lowerMessage.includes(kw))) {
        return {
          type: pattern.type,
          description: pattern.description,
          confidence: pattern.confidence,
          intensity: pattern.intensity,
        };
      }
    }

    return null;
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
      const workingMemory = await memorySystem.getWorkingMemory(sessionId, userId);
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
   * Extract key topics from message with intensity
   */
  private extractTopics(message: string): string[] {
    const topics: string[] = [];
    const lowerMessage = message.toLowerCase();

    // Extended topic keywords with more comprehensive coverage
    const topicMap: { [key: string]: string[] } = {
      'work': ['công việc', 'làm việc', 'deadline', 'dự án', 'project', 'work', 'job', 'sếp', 'đồng nghiệp', 'colleague', 'boss', 'meeting', 'họp', 'báo cáo', 'report', 'kpi', 'target', 'nhiệm vụ', 'task', 'overtime', 'tăng ca', 'resign', 'nghỉ việc', 'promotion', 'thăng chức'],
      'stress': ['lo lắng', 'stress', 'áp lực', 'căng thẳng', 'anxiety', 'worried', 'lo', 'sợ', 'fear', 'panic', 'hoảng loạn', 'overwhelmed', 'quá tải', 'burnout', 'kiệt sức', 'mệt mỏi tinh thần'],
      'sleep': ['ngủ', 'thức khuya', 'mất ngủ', 'sleep', 'insomnia', 'giấc ngủ', 'ngủ không ngon', 'nightmare', 'ác mộng', 'tired', 'mệt', 'exhausted', 'kiệt sức', 'năng lượng thấp', 'low energy'],
      'relationship': ['quan hệ', 'bạn bè', 'gia đình', 'tình cảm', 'relationship', 'family', 'người yêu', 'boyfriend', 'girlfriend', 'vợ', 'chồng', 'wife', 'husband', 'cha mẹ', 'parents', 'con cái', 'children', 'anh chị em', 'siblings', 'cãi nhau', 'conflict', 'hiểu lầm', 'misunderstanding', 'chia tay', 'breakup', 'ly hôn', 'divorce'],
      'health': ['sức khỏe', 'bệnh', 'đau', 'health', 'sick', 'pain', 'đau đầu', 'headache', 'đau bụng', 'stomach', 'khỏe', 'healthy', 'tập thể dục', 'exercise', 'gym', 'ăn uống', 'diet', 'nutrition', 'thuốc', 'medicine', 'bác sĩ', 'doctor', 'bệnh viện', 'hospital'],
      'emotion': ['cảm xúc', 'tâm trạng', 'buồn', 'vui', 'emotion', 'mood', 'feeling', 'hạnh phúc', 'happy', 'sad', 'tức giận', 'angry', 'tức', 'giận', 'rage', 'disappointed', 'thất vọng', 'excited', 'phấn khích', 'bình tĩnh', 'calm', 'peaceful', 'yên bình'],
      'finance': ['tiền', 'money', 'tài chính', 'finance', 'debt', 'nợ', 'bill', 'hóa đơn', 'lương', 'salary', 'income', 'thu nhập', 'save', 'tiết kiệm', 'invest', 'đầu tư', 'broke', 'hết tiền'],
      'career': ['sự nghiệp', 'career', 'thăng tiến', 'promotion', 'mục tiêu', 'goal', 'dream', 'ước mơ', 'thành công', 'success', 'thất bại', 'failure', 'skill', 'kỹ năng', 'học hỏi', 'learning', 'training', 'đào tạo'],
      'social': ['xã hội', 'society', 'cộng đồng', 'community', 'cô đơn', 'lonely', 'alone', 'isolated', 'kết nối', 'connect', 'social', 'party', 'event', 'gathering', 'họp mặt'],
      'hobby': ['sở thích', 'hobby', 'thích', 'like', 'love', 'enjoy', 'game', 'music', 'nhạc', 'movie', 'phim', 'book', 'sách', 'đọc', 'reading', 'travel', 'du lịch', 'sport', 'thể thao'],
    };

    for (const [topic, keywords] of Object.entries(topicMap)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        topics.push(topic);
      }
    }

    return topics;
  }

  /**
   * Calculate topic intensity based on message context
   */
  private calculateTopicIntensity(message: string, topic: string): number {
    const lowerMessage = message.toLowerCase();
    let intensity = 0.5; // Base intensity

    // Increase intensity based on strong emotion words
    const strongWords = ['rất', 'very', 'extremely', 'cực kỳ', 'quá', 'too much', 'không thể', 'cannot', 'nghiêm trọng', 'serious', 'khủng khiếp', 'terrible'];
    if (strongWords.some(word => lowerMessage.includes(word))) {
      intensity += 0.2;
    }

    // Increase intensity based on repetition
    const topicKeywords = this.getTopicKeywords(topic);
    const matchCount = topicKeywords.filter(kw => lowerMessage.includes(kw)).length;
    intensity += Math.min(matchCount * 0.1, 0.3);

    // Increase intensity based on punctuation (!!!, ???)
    if (message.includes('!!!') || message.includes('???')) {
      intensity += 0.1;
    }

    return Math.min(intensity, 1.0);
  }

  /**
   * Get keywords for a specific topic
   */
  private getTopicKeywords(topic: string): string[] {
    const topicMap: { [key: string]: string[] } = {
      'work': ['công việc', 'làm việc', 'deadline', 'dự án', 'work', 'job'],
      'stress': ['lo lắng', 'stress', 'áp lực', 'căng thẳng', 'anxiety'],
      'sleep': ['ngủ', 'thức khuya', 'mất ngủ', 'sleep', 'insomnia'],
      'relationship': ['quan hệ', 'bạn bè', 'gia đình', 'tình cảm', 'relationship'],
      'health': ['sức khỏe', 'bệnh', 'đau', 'health', 'sick'],
      'emotion': ['cảm xúc', 'tâm trạng', 'buồn', 'vui', 'emotion', 'mood'],
      'finance': ['tiền', 'money', 'tài chính', 'finance', 'nợ'],
      'career': ['sự nghiệp', 'career', 'thăng tiến', 'mục tiêu'],
      'social': ['xã hội', 'cộng đồng', 'cô đơn', 'lonely'],
      'hobby': ['sở thích', 'hobby', 'thích', 'game', 'music'],
    };
    return topicMap[topic] || [];
  }

  /**
   * Get time context for temporal pattern analysis
   */
  private getTimeContext(): {
    hour: number;
    dayOfWeek: number;
    timePattern: string;
  } {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    let timePattern = 'morning';
    if (hour >= 12 && hour < 17) timePattern = 'afternoon';
    else if (hour >= 17 && hour < 21) timePattern = 'evening';
    else if (hour >= 21 || hour < 6) timePattern = 'night';

    return { hour, dayOfWeek, timePattern };
  }

  /**
   * Clear session memory (for new conversation)
   */
  async clearSessionMemory(sessionId: string, userId?: string): Promise<void> {
    await memorySystem.clearWorkingMemory(sessionId, userId);
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
