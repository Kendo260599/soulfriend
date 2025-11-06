/**
 * Enhanced Chatbot Service
 * Tích hợp tất cả hệ thống dữ liệu nâng cao
 * Cá nhân hóa sâu sắc và quản lý khủng hoảng hoàn hảo
 */

import {
  analyzeMultiIntent,
  analyzeSentimentIntensity,
  generateEmpatheticResponse,
} from '../data/advancedNLPData';
import {
  assessRisk,
  detectCrisis,
  generateDisclaimer,
  getRelevantReferral,
} from '../data/crisisManagementData';
import { evaluateInteractionQuality } from '../data/feedbackImprovementData';
import {
  analyzeNuancedEmotion,
  getResponseTemplate,
  identifyUserSegment,
} from '../data/userSegmentationData';
import { logger } from '../utils/logger';
import openAIService from './openAIService';
import { criticalInterventionService } from './criticalInterventionService';
import moderationService from './moderationService';

export interface EnhancedChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  intent?: string;
  userSegment?: string;
  emotionalState?: string;
  crisisLevel?: 'low' | 'medium' | 'high' | 'critical';
  qualityScore?: number;
  metadata?: any;
}

export interface EnhancedChatSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  messageCount: number;
  userProfile?: any;
  userSegment?: string;
  emotionalHistory: EmotionalState[];
  crisisHistory: CrisisEvent[];
  qualityMetrics: QualityMetrics;
  status: 'active' | 'ended';
}

export interface EmotionalState {
  emotion: string;
  intensity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  trigger: string;
  duration: number;
}

export interface CrisisEvent {
  level: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  trigger: string;
  response: string;
  resolved: boolean;
}

export interface QualityMetrics {
  averageQualityScore: number;
  totalInteractions: number;
  positiveInteractions: number;
  improvementAreas: string[];
  lastEvaluation: Date;
}

export interface EnhancedResponse {
  message: string; // Frontend expects 'message'
  response: string; // Keep for compatibility
  intent: string;
  confidence: number;
  suggestions: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; // Frontend expects 'riskLevel'
  crisisLevel: 'low' | 'medium' | 'high' | 'critical'; // Keep for compatibility
  userSegment?: string;
  emotionalState?: string;
  qualityScore?: number;
  referralInfo?: any[];
  disclaimer?: string;
  followUpActions?: string[];
  emergencyContacts?: any[]; // For crisis situations
  nextActions?: string[]; // For follow-up actions
  aiGenerated?: boolean; // Indicates if response is AI-generated
}

export class EnhancedChatbotService {
  private openAIService: any;
  private useAI: boolean = true;
  public sessions: Map<string, EnhancedChatSession> = new Map();
  public messages: Map<string, EnhancedChatMessage[]> = new Map();
  private interactionHistory: any[] = [];

  constructor() {
    this.openAIService = openAIService;
  }

  /**
   * Xử lý tin nhắn với hệ thống nâng cao
   * @param mode - Optional: 'em_style' để dùng EM-style Reasoner
   */
  async processMessage(
    message: string,
    sessionId: string,
    userId: string,
    userProfile?: any,
    mode?: 'default' | 'em_style'
  ): Promise<EnhancedResponse> {
    try {
      // Version logging to verify deployment
      console.error('🔍 EnhancedChatbotService v2.1 - Processing message');
      console.error(`📝 Input: "${message}" | User: ${userId} | Session: ${sessionId}`);
      console.error(`📝 Message type: ${typeof message}, length: ${message.length}`);
      console.error(`📝 Message bytes: ${Buffer.from(message, 'utf8').toString('hex').substring(0, 100)}`);

      // HEX DUMP to verify UTF-8 encoding
      const messageBytes = Buffer.from(message, 'utf8');
      const messageHex = messageBytes.toString('hex').substring(0, 100);
      console.error(`🔢 Message HEX (first 50 bytes): ${messageHex}`);
      console.error(
        `📏 Message byte length: ${messageBytes.length} | char length: ${message.length}`
      );

      logger.info(`Processing message for session ${sessionId}`, {
        userId,
        messageLength: message.length,
        mode: mode || 'default',
      });

      // 0. EM-style mode check
      if (mode === 'em_style') {
        try {
          const { emStyleReasoner } = await import('./emStyleReasoner');
          const emResult = await emStyleReasoner.reason(message, {
            userId,
            sessionId,
            userProfile,
          });

          // Save messages
          await this.saveMessage(sessionId, userId, message, 'user');
          await this.saveMessage(sessionId, userId, emResult.message, 'bot', {
            intent: 'em_style_reasoning',
            emStyle: true,
          });

          // Convert to EnhancedResponse
          return {
            message: emResult.message,
            response: emResult.message,
            intent: 'em_style_reasoning',
            confidence: 0.8,
            suggestions: emResult.options?.map(opt => opt.label) || [],
            riskLevel: 'LOW',
            crisisLevel: 'low',
            qualityScore: 0.8,
            disclaimer: 'Đây là mô phỏng phong cách tư duy, không thay thế chuyên gia.',
            followUpActions: [],
            emergencyContacts: [],
            nextActions: [],
            aiGenerated: true,
          };
        } catch (error) {
          logger.error('EM-style processing failed, falling back to default:', error);
          // Fall through to default mode
        }
      }

      // 1. Phân tích phân đoạn người dùng (default mode)
      const userSegment = identifyUserSegment(message, this.getUserHistory(sessionId));

      // 2. Phân tích cảm xúc đa sắc thái
      const nuancedEmotion = analyzeNuancedEmotion(message);

      // 3. Nhận diện ý định đa tầng
      const multiIntent = analyzeMultiIntent(message);

      // 4. Phân tích cường độ cảm xúc
      const sentimentIntensity = analyzeSentimentIntensity(message);

      // 4.5. Multi-layer Moderation Assessment (NEW HITL UPGRADE)
      const moderationResult = await moderationService.assess(message);
      logger.info('Moderation assessment completed', {
        riskLevel: moderationResult.riskLevel,
        riskScore: moderationResult.riskScore,
        signalCount: moderationResult.signals.length,
        messageHash: moderationResult.messageHash,
      });

      // 5. Phát hiện khủng hoảng - EXTENSIVE DEBUG
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('🔍 ABOUT TO CALL detectCrisis()');
      console.error(`📝 Original Message: "${message}"`);
      console.error(`📏 Message Length: ${message.length}`);
      console.error(`🔤 Message Type: ${typeof message}`);
      console.error(
        `📋 Message Chars: ${Array.from(message)
          .map(c => c.charCodeAt(0))
          .slice(0, 20)
          .join(',')}`
      );

      const crisis = detectCrisis(message);
      let crisisLevel = crisis ? crisis.level : 'low';

      // UPGRADE: Enhance crisisLevel with moderation results
      // Moderation has higher sensitivity and can catch patterns missed by detectCrisis
      if (moderationResult.riskLevel === 'critical') {
        crisisLevel = 'critical';
        logger.warn('Moderation detected CRITICAL risk, upgrading crisisLevel', {
          originalCrisisLevel: crisis?.level,
          moderationRiskScore: moderationResult.riskScore,
        });
      } else if (moderationResult.riskLevel === 'high' && crisisLevel !== 'critical') {
        crisisLevel = 'high';
        logger.info('Moderation detected HIGH risk, upgrading crisisLevel', {
          originalCrisisLevel: crisis?.level,
          moderationRiskScore: moderationResult.riskScore,
        });
      } else if (moderationResult.riskLevel === 'moderate' && crisisLevel === 'low') {
        crisisLevel = 'medium';
      }

      // Debug logging for crisis detection result
      console.error(`🎯 detectCrisis() RETURNED: ${crisis ? 'OBJECT' : 'NULL'}`);
      console.error(
        `📊 Crisis: ${crisis ? JSON.stringify({ id: crisis.id, level: crisis.level, triggers: crisis.triggers }) : 'null'}`
      );
      console.error(`⚠️  Crisis Level (initial): ${crisisLevel}`);
      console.error(`🔍 Crisis object exists: ${crisis !== null}`);
      console.error(`🔍 crisisLevel === 'critical': ${crisisLevel === 'critical'}`);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // CRITICAL: Store crisis in a const to prevent it from being overwritten
      const detectedCrisis = crisis;
      const detectedCrisisLevel = crisisLevel;

      if (detectedCrisis) {
        logger.warn(`🚨 CRISIS DETECTED: ${detectedCrisis.id} (${detectedCrisisLevel})`, {
          triggers: detectedCrisis.triggers,
          message: message.substring(0, 100),
        });
        console.error(`🚨 CRISIS DETECTED: ${detectedCrisis.id} (${detectedCrisisLevel}) - Message: "${message}"`);
        console.error(`🚨 Checking if detectedCrisisLevel === 'critical': ${detectedCrisisLevel === 'critical'}`);
      } else {
        console.error(`❌ NO CRISIS DETECTED for message: "${message}"`);
      }

      // 6. Đánh giá rủi ro (NOTE: assessRisk() calls detectCrisis() again internally)
      // We already have crisis and crisisLevel from step 5, so we don't need to rely on assessRisk()
      // But we'll still call it for compatibility, but we'll use our crisisLevel instead
      const riskAssessment = assessRisk(
        message,
        this.getUserHistory(sessionId),
        nuancedEmotion.emotion
      );
      
      // CRITICAL FIX: Restore crisis and crisisLevel after assessRisk() might have called detectCrisis() again
      // Use the originally detected crisis, not what assessRisk() might have returned
      if (detectedCrisis) {
        console.error(`🔧 RESTORING crisis and crisisLevel from original detection`);
        console.error(`🔧 Before restore: crisis=${crisis ? 'exists' : 'null'}, crisisLevel="${crisisLevel}"`);
        // crisis is a const, but we can reassign crisisLevel
        crisisLevel = detectedCrisisLevel;
        console.error(`🔧 After restore: crisisLevel="${crisisLevel}"`);
      }

      // 7. Tạo phản hồi cá nhân hóa
      let response: string;
      let suggestions: string[] = [];
      let referralInfo: any[] = [];
      let disclaimer: string = '';
      let followUpActions: string[] = [];

      console.error(`🔍 About to check crisisLevel === 'critical': crisisLevel="${crisisLevel}", type=${typeof crisisLevel}, detectedCrisis?.level="${detectedCrisis?.level}"`);
      if (crisisLevel === 'critical' && detectedCrisis) {
        console.error(`✅ ENTERING CRISIS BLOCK - detectedCrisis is ${detectedCrisis ? 'not null' : 'NULL'}`);
        response = detectedCrisis.immediateResponse;
        suggestions = detectedCrisis.followUpActions;
        followUpActions = detectedCrisis.escalationProtocol;
        disclaimer = generateDisclaimer('crisis', true);

        // Lấy thông tin referral khẩn cấp
        referralInfo = getRelevantReferral('Toàn quốc', ['crisis_intervention'], 'critical');

        // Ghi log khủng hoảng
        this.logCrisisEvent(sessionId, crisisLevel, message, response);

        // 🚨 HITL: Kích hoạt can thiệp của con người
        try {
          console.error(`🚨 ACTIVATING HITL for crisis: ${crisis!.id}`);

          const criticalAlert = await criticalInterventionService.createCriticalAlert(
            userId,
            sessionId,
            {
              riskLevel: 'CRITICAL',
              riskType: crisis!.id as 'suicidal' | 'psychosis' | 'self_harm' | 'violence',
              userMessage: process.env.LOG_REDACT === 'true' ? '[redacted]' : message,
              detectedKeywords: crisis!.triggers,
              userProfile: userProfile,
              // Add moderation metadata for enhanced HITL
              metadata: {
                moderation: {
                  riskLevel: moderationResult.riskLevel,
                  riskScore: moderationResult.riskScore,
                  messageHash: moderationResult.messageHash,
                  signalCount: moderationResult.signals.length,
                  signals: moderationResult.signals.map(s => ({
                    source: s.source,
                    category: s.category,
                    confidence: s.confidence,
                    matchedCount: s.matched?.length || 0,
                  })),
                },
              },
            }
          );

          logger.error(
            `🚨 HITL Alert created: ${criticalAlert.id} - 5-minute escalation timer started`
          );
          console.error(
            `🚨 HITL Alert created: ${criticalAlert.id} - 5-minute escalation timer started`
          );

          // Thêm thông tin về HITL vào response
          response +=
            '\n\n⚠️ Hệ thống đã tự động thông báo cho đội phản ứng khủng hoảng của chúng tôi. Một chuyên gia sẽ liên hệ với bạn trong thời gian sớm nhất.';
        } catch (error) {
          logger.error('Error creating HITL alert:', error);
          console.error('❌ HITL Error:', error);
        }
      } else if (userSegment) {
        // Sử dụng response template cho segment
        const template = getResponseTemplate(userSegment, message, nuancedEmotion.emotion);
        if (template) {
          response = template.response;
        } else {
          response = await this.generatePersonalizedResponse(message, userSegment, nuancedEmotion);
        }
        suggestions = this.getSegmentSuggestions(userSegment);

        // Lấy referral phù hợp với segment
        referralInfo = getRelevantReferral('Toàn quốc', userSegment.commonIssues, 'medium');
      } else {
        // ALWAYS use OpenAI API for personalized responses instead of template
        if (this.openAIService && this.openAIService.isReady()) {
          try {
            const aiContext = {
              systemPrompt: `Bạn là CHUN - AI Companion chuyên về sức khỏe tâm lý cho phụ nữ Việt Nam.

⚠️ QUAN TRỌNG:
- Bạn KHÔNG phải chuyên gia y tế/tâm lý
- Bạn là công cụ hỗ trợ sàng lọc sơ bộ
- KHÔNG chẩn đoán bệnh lý hoặc kê đơn thuốc
- Mọi lời khuyên chỉ mang tính tham khảo
- Với vấn đề nghiêm trọng, hãy gặp chuyên gia ngay

🌸 TÍNH CÁCH:
- Ấm áp, đồng cảm, không phán xét
- Chuyên nghiệp nhưng gần gũi
- Sử dụng emoji phù hợp (💙 🌸 ⚠️)
- Xưng hô: "Mình" (CHUN) - "Bạn" (User)

🚨 CRISIS PROTOCOL:
- Nếu phát hiện ý định tự tử: Hotline NGAY 1900 599 958
- Nếu phát hiện bạo hành: Gọi 113 ngay lập tức
- Luôn khuyến nghị gặp chuyên gia cho vấn đề nghiêm trọng

User's emotional state: ${nuancedEmotion.emotion} (${sentimentIntensity.intensity} intensity)
User's message: ${message}

Please provide a warm, empathetic, and personalized response in Vietnamese.`,
            };
            const aiResponse = await this.openAIService.generateResponse(message, aiContext);
            response = aiResponse.text;
            logger.info('✅ Generated AI response using OpenAI');
          } catch (error) {
            logger.error('AI generation failed, using fallback template:', error);
            // Fallback to template only if AI fails
            response = generateEmpatheticResponse(
              message,
              nuancedEmotion.emotion === 'neutral' ? 'khó khăn' : nuancedEmotion.emotion,
              sentimentIntensity.intensity
            );
          }
        } else {
          // Fallback if OpenAI not available
          response = generateEmpatheticResponse(
            message,
            nuancedEmotion.emotion === 'neutral' ? 'khó khăn' : nuancedEmotion.emotion,
            sentimentIntensity.intensity
          );
        }
        suggestions = this.getGeneralSuggestions();
      }

      // 8. Đánh giá chất lượng tương tác
      const qualityEvaluation = evaluateInteractionQuality(message, response, 'neutral', {});

      // 9. Cập nhật conversation state
      this.updateConversationState(sessionId, userId, {
        lastMessage: message,
        lastResponse: response,
        userSegment,
        emotionalState: nuancedEmotion.emotion,
        crisisLevel,
        timestamp: new Date(),
      });

      // 10. Ghi log tương tác để cải tiến
      this.logInteraction(sessionId, userId, message, response, qualityEvaluation.qualityScore);

      // 11. Lưu tin nhắn
      await this.saveMessage(sessionId, userId, message, 'user');
      await this.saveMessage(sessionId, userId, response, 'bot', {
        intent: multiIntent?.primaryIntent || 'general',
        userSegment: userSegment?.id,
        emotionalState: nuancedEmotion.emotion,
        crisisLevel,
        qualityScore: qualityEvaluation.qualityScore,
      });

      // CRITICAL FIX: Ensure crisisLevel is preserved
      console.error(`🔍 FINAL CRISIS LEVEL CHECK: crisisLevel="${crisisLevel}"`);
      console.error(`🔍 detectedCrisis exists: ${detectedCrisis !== null}`);
      console.error(`🔍 detectedCrisisLevel: "${detectedCrisisLevel}"`);
      
      // Use detectedCrisisLevel if it was set (to prevent overrides)
      const finalCrisisLevel = detectedCrisis ? detectedCrisisLevel : crisisLevel;
      
      const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' =
        finalCrisisLevel === 'critical'
          ? 'CRITICAL'
          : finalCrisisLevel === 'high'
            ? 'HIGH'
            : finalCrisisLevel === 'medium'
              ? 'MEDIUM'
              : 'LOW';

      console.error(`🔍 MAPPED RISK LEVEL: ${riskLevel} (from crisisLevel: ${finalCrisisLevel})`);

      const finalResponse: EnhancedResponse = {
        message: response, // Frontend expects 'message' not 'response'
        response, // Keep both for compatibility
        intent: multiIntent?.primaryIntent || 'general',
        confidence: 0.8,
        userSegment: userSegment?.id,
        emotionalState: nuancedEmotion.emotion,
        riskLevel, // Frontend expects 'riskLevel'
        crisisLevel: finalCrisisLevel, // Use finalCrisisLevel to preserve detected crisis
        suggestions,
        qualityScore: qualityEvaluation.qualityScore,
        referralInfo,
        disclaimer,
        followUpActions,
        emergencyContacts: crisisLevel === 'critical' ? referralInfo : [],
        nextActions: followUpActions,
        aiGenerated: true,
      };

      // Log final response structure for debugging
      console.error(
        `📤 FINAL RESPONSE: riskLevel=${finalResponse.riskLevel} | crisisLevel=${finalResponse.crisisLevel} | emergencyContacts=${finalResponse.emergencyContacts?.length || 0}`
      );

      return finalResponse;
    } catch (error) {
      logger.error('Error processing message:', error);
      return {
        message: 'Xin lỗi, tôi gặp sự cố kỹ thuật. Bạn có thể thử lại sau không?',
        response: 'Xin lỗi, tôi gặp sự cố kỹ thuật. Bạn có thể thử lại sau không?',
        intent: 'error',
        confidence: 0,
        suggestions: ['Thử lại', 'Liên hệ hỗ trợ'],
        riskLevel: 'LOW',
        crisisLevel: 'low',
        aiGenerated: false,
      };
    }
  }

  /**
   * Tạo phản hồi cá nhân hóa với AI
   */
  private async generatePersonalizedResponse(
    message: string,
    userSegment: any,
    emotionalState: any
  ): Promise<string> {
    if (this.useAI) {
      try {
        const context = `
          User Segment: ${userSegment.name}
          Description: ${userSegment.description}
          Emotional State: ${emotionalState.emotion}
          Cultural Context: ${userSegment.culturalContext.vietnameseSpecific.join(', ')}
          
          User Message: ${message}
          
          Please provide a personalized, empathetic response that:
          1. Acknowledges their specific situation
          2. Shows understanding of Vietnamese cultural context
          3. Provides relevant support
          4. Maintains professional boundaries
          5. Uses warm, supportive tone
        `;

        const aiResponse = await openAIService.generateResponse(context, {});
        return aiResponse.text;
      } catch (error) {
        logger.error('AI generation failed, using fallback:', error);
      }
    }

    // Fallback response
    return `Tôi hiểu bạn đang trải qua giai đoạn khó khăn. Là ${userSegment.name}, bạn đang đối mặt với những thách thức đặc biệt. Tôi ở đây để lắng nghe và hỗ trợ bạn.`;
  }

  /**
   * Lấy gợi ý theo phân đoạn người dùng
   */
  private getSegmentSuggestions(userSegment: any): string[] {
    const suggestions: Record<string, string[]> = {
      pregnant_postpartum: [
        'Tìm hiểu về trầm cảm sau sinh',
        'Tham gia nhóm hỗ trợ bà mẹ',
        'Liên hệ chuyên gia tâm lý',
        'Chia sẻ với chồng về cảm xúc',
        'Thực hành self-care',
      ],
      single_career_women: [
        'Cân bằng công việc và cuộc sống',
        'Xây dựng mạng lưới hỗ trợ',
        'Tìm kiếm mentor trong sự nghiệp',
        'Thực hành self-care',
        'Tham gia hoạt động xã hội',
      ],
      menopause_women: [
        'Tìm hiểu về mãn kinh',
        'Tham gia nhóm hỗ trợ',
        'Tham khảo ý kiến bác sĩ',
        'Thực hành mindfulness',
        'Tập thể dục nhẹ nhàng',
      ],
    };

    return suggestions[userSegment.id] || this.getGeneralSuggestions();
  }

  /**
   * Lấy gợi ý chung
   */
  private getGeneralSuggestions(): string[] {
    return [
      'Thực hành thở sâu',
      'Viết nhật ký cảm xúc',
      'Tìm kiếm hỗ trợ chuyên nghiệp',
      'Kết nối với bạn bè',
      'Tham gia hoạt động yêu thích',
    ];
  }

  /**
   * Helper methods
   */
  private getUserHistory(sessionId: string): string[] {
    const messages = this.messages.get(sessionId) || [];
    return messages.map(msg => msg.content);
  }

  private updateConversationState(sessionId: string, userId: string, data: any): void {
    const existingState = this.sessions.get(sessionId) || {
      id: sessionId,
      userId,
      startTime: new Date(),
      messageCount: 0,
      emotionalHistory: [],
      crisisHistory: [],
      qualityMetrics: {
        averageQualityScore: 0,
        totalInteractions: 0,
        positiveInteractions: 0,
        improvementAreas: [],
        lastEvaluation: new Date(),
      },
      status: 'active' as const,
    };

    existingState.emotionalHistory.push({
      emotion: data._emotionalState,
      intensity: 'medium',
      timestamp: data.timestamp,
      trigger: data.lastMessage,
      duration: 0,
    });

    // existingState.lastUpdate = data.timestamp; // Removed as it doesn't exist in interface

    this.sessions.set(sessionId, existingState);
  }

  private logInteraction(
    sessionId: string,
    userId: string,
    userInput: string,
    botResponse: string,
    qualityScore: number
  ): void {
    this.interactionHistory.push({
      sessionId,
      userId,
      userInput,
      botResponse,
      qualityScore,
      timestamp: new Date(),
    });

    // Giữ chỉ 1000 interactions gần nhất
    if (this.interactionHistory.length > 1000) {
      this.interactionHistory = this.interactionHistory.slice(-1000);
    }
  }

  private logCrisisEvent(
    sessionId: string,
    level: string,
    trigger: string,
    response: string
  ): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.crisisHistory.push({
        level: level as any,
        timestamp: new Date(),
        trigger,
        response,
        resolved: false,
      });
    }
  }

  private async saveMessage(
    sessionId: string,
    userId: string,
    content: string,
    sender: 'user' | 'bot',
    metadata?: any
  ): Promise<void> {
    const message: EnhancedChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      userId,
      content,
      sender,
      timestamp: new Date(),
      ...metadata,
    };

    const messages = this.messages.get(sessionId) || [];
    messages.push(message);
    this.messages.set(sessionId, messages);

    // Cập nhật session
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messageCount = messages.length;
    }
  }

  /**
   * Lấy thống kê chất lượng
   */
  getQualityStats(): any {
    const totalInteractions = this.interactionHistory.length;
    const averageQuality =
      this.interactionHistory.reduce((sum, interaction) => sum + interaction.qualityScore, 0) /
      totalInteractions;

    const positiveInteractions = this.interactionHistory.filter(
      interaction => interaction.qualityScore >= 0.7
    ).length;

    return {
      totalInteractions,
      averageQuality: Math.round(averageQuality * 100) / 100,
      positiveInteractions,
      positiveRate: Math.round((positiveInteractions / totalInteractions) * 100),
      lastUpdate: new Date(),
    };
  }

  /**
   * Lấy thống kê phân đoạn người dùng
   */
  getUserSegmentStats(): any {
    const segmentCounts: Record<string, number> = {};

    this.interactionHistory.forEach(interaction => {
      if (interaction.userSegment) {
        segmentCounts[interaction.userSegment] = (segmentCounts[interaction.userSegment] || 0) + 1;
      }
    });

    return segmentCounts;
  }

  /**
   * Lấy thống kê khủng hoảng
   */
  getCrisisStats(): any {
    const crisisCounts: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    this.sessions.forEach(session => {
      session.crisisHistory.forEach(crisis => {
        crisisCounts[crisis.level]++;
      });
    });

    return crisisCounts;
  }
}

// Export singleton instance
export const enhancedChatbotService = new EnhancedChatbotService();
export default enhancedChatbotService;
