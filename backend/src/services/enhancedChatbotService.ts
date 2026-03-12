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
import { RiskLevel } from '../types/risk';
import { logger } from '../utils/logger';
import { criticalInterventionService } from './criticalInterventionService';
import openAIService from './openAIService';
import { centralRiskScoringService } from './riskScoringService';

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
  crisisLevel?: RiskLevel;
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
  level: RiskLevel;
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
  riskLevel: RiskLevel;
  crisisLevel: string; // Lowercase version for backward compatibility
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
  private static readonly MAX_SESSIONS = 500;
  private static readonly MAX_MESSAGES_PER_SESSION = 200;

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
      logger.info(`Processing message for session ${sessionId}`, {
        userId,
        messageLength: message.length,
        mode: mode || 'default',
      });

      // 0. Special keyword trigger
      const lowerMsg = message.toLowerCase().trim();
      if (lowerMsg.includes('chun ơi') || lowerMsg.includes('anh ơi')) {
        const reply = 'Ơi anh đây 💙';
        await this.saveMessage(sessionId, userId, message, 'user');
        await this.saveMessage(sessionId, userId, reply, 'bot');
        return {
          message: reply,
          response: reply,
          intent: 'greeting',
          confidence: 1.0,
          suggestions: [],
          riskLevel: RiskLevel.LOW,
          crisisLevel: 'low',
          qualityScore: 1.0,
          disclaimer: '',
          followUpActions: [],
          emergencyContacts: [],
          nextActions: [],
          aiGenerated: false,
        };
      }

      // 0b. EM-style mode check
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
            riskLevel: RiskLevel.LOW,
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

      // 4.5-6. Unified Risk Assessment (centralRiskScoringService)
      const riskAssessment = await centralRiskScoringService.assess(
        message,
        this.getUserHistory(sessionId),
        nuancedEmotion.emotion,
        undefined,
        userId
      );
      const detectedCrisis = detectCrisis(message);
      logger.info('Risk assessment completed', {
        level: riskAssessment.level,
        score: riskAssessment.score,
        riskType: riskAssessment.riskType,
        shouldHITL: riskAssessment.shouldActivateHITL,
        hasCrisisScenario: !!detectedCrisis,
      });

      // 7. Tạo phản hồi cá nhân hóa
      let response: string;
      let suggestions: string[] = [];
      let referralInfo: any[] = [];
      const disclaimer: string = '';
      const followUpActions: string[] = [];

      // Activate HITL based on unified risk assessment
      const shouldActivateHITL = riskAssessment.shouldActivateHITL;

      if (shouldActivateHITL) {
        // Use detectedCrisis if available, otherwise create default crisis response
        const crisisResponse = detectedCrisis
          ? detectedCrisis.immediateResponse
          : 'Tôi rất quan tâm đến những gì bạn vừa chia sẻ. Những suy nghĩ này cho thấy bạn đang trải qua một giai đoạn rất khó khăn. Bạn không cần phải đối mặt một mình.';

        const crisisSuggestions = detectedCrisis
          ? detectedCrisis.followUpActions
          : [
            'Liên hệ chuyên gia tâm lý khẩn cấp',
            'Gọi hotline tư vấn',
            'Tìm kiếm hỗ trợ từ người thân',
          ];

        const crisisActions = detectedCrisis
          ? detectedCrisis.escalationProtocol
          : ['Kích hoạt crisis intervention ngay lập tức', 'Liên hệ emergency services (113)'];

        const crisisDisclaimer = generateDisclaimer('crisis', true);
        const crisisReferrals = getRelevantReferral(
          'Toàn quốc',
          ['crisis_intervention'],
          'critical'
        );

        // Risk type from unified assessment
        const riskType = riskAssessment.riskType;

        // Detected keywords from unified assessment
        const detectedKeywords = riskAssessment.riskFactors;

        // Ghi log khủng hoảng
        this.logCrisisEvent(sessionId, riskAssessment.level, message, crisisResponse);

        // 🚨 HITL: Kích hoạt can thiệp của con người (ASYNC - Non-blocking)
        // Process HITL alert in background to prevent API timeout
        // User gets immediate response while alert is processed asynchronously
        (async () => {
          try {
            logger.warn('🚨 ACTIVATING HITL', {
              riskLevel: riskAssessment.level,
              riskType,
            });

            const criticalAlert = await criticalInterventionService.createCriticalAlert(
              userId,
              sessionId,
              {
                riskLevel: riskAssessment.level as any,
                riskType: riskType as any,
                userMessage: process.env.LOG_REDACT === 'true' ? '[redacted]' : message,
                detectedKeywords: detectedKeywords,
                userProfile: userProfile,
                metadata: {
                  assessment: {
                    level: riskAssessment.level,
                    score: riskAssessment.score,
                    signals: riskAssessment.signals.map(s => ({
                      source: s.source,
                      level: s.level,
                      score: s.score,
                      confidence: s.confidence,
                    })),
                  },
                },
              }
            );

            logger.warn(`HITL Alert created: ${criticalAlert.id} - escalation timer started`);

            // BROADCAST TO EXPERTS VIA SOCKET.IO
            try {
              const io = (global as any).io;
              if (io && typeof io.broadcastHITLAlert === 'function') {
                io.broadcastHITLAlert({
                  id: criticalAlert.id,
                  userId,
                  sessionId,
                  riskLevel: riskAssessment.level,
                  riskType,
                  userMessage: message,
                  detectedKeywords,
                  timestamp: new Date(),
                });
                logger.info('📡 HITL alert broadcasted to experts via Socket.io');
              } else {
                logger.warn('⚠️  Socket.io not available for broadcasting');
              }
            } catch (broadcastError) {
              logger.error('Error broadcasting HITL alert:', broadcastError);
              // Don't throw - broadcasting failure shouldn't block HITL
            }
          } catch (error) {
            logger.error('Error creating HITL alert:', error);
            // Don't throw - HITL processing failure shouldn't block user response
          }
        })(); // IIFE - Immediately Invoked Function Expression for async fire-and-forget

        // URGENT FIX: Return immediately to prevent override
        const hitlMessage =
          crisisResponse +
          '\n\n⚠️ **HỆ THỐNG CAN THIỆP KHỦNG HOẢNG ĐÃ ĐƯỢC KÍCH HOẠT**\n\n' +
          '👨‍⚕️ Chuyên gia tâm lý 𝑺𝒆𝒄𝒓𝒆𝒕❤️ đã được thông báo và sẽ liên hệ với bạn trong vòng 5 phút.\n\n' +
          '📧 Email: kendo2605@gmail.com\n' +
          '📞 Hotline: 0938021111\n\n' +
          'Bạn không đơn độc. Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7.';

        // Save messages asynchronously (non-blocking)
        // Don't await - save in background to return response immediately
        this.saveMessage(sessionId, userId, message, 'user').catch(error => {
          logger.error('Error saving user message (non-blocking):', error);
        });
        this.saveMessage(sessionId, userId, hitlMessage, 'bot', {
          intent: 'crisis',
          userSegment: 'crisis',
          emotionalState: 'crisis',
          crisisLevel: RiskLevel.CRITICAL,
          qualityScore: 1.0,
        }).catch(error => {
          logger.error('Error saving bot message (non-blocking):', error);
        });

        logger.warn('🚨 CRISIS RESPONSE - Returning early', {
          crisisId: detectedCrisis?.id || 'assessment_detected',
          level: riskAssessment.level,
          earlyReturn: true,
        });

        return {
          message: hitlMessage,
          response: hitlMessage,
          intent: 'crisis',
          confidence: 1.0,
          riskLevel: RiskLevel.CRITICAL,
          crisisLevel: 'critical',
          userSegment: 'crisis',
          emotionalState: 'crisis',
          suggestions: crisisSuggestions,
          qualityScore: 1.0,
          referralInfo: crisisReferrals,
          disclaimer: crisisDisclaimer,
          followUpActions: crisisActions,
          emergencyContacts: crisisReferrals,
          nextActions: crisisActions,
          aiGenerated: false,
        };
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
              systemPrompt: `Bạn là 𝑺𝒆𝒄𝒓𝒆𝒕❤️ chuyên về sức khỏe tâm lý cho phụ nữ Việt Nam.

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
- Xưng hô: "Mình" (𝑺𝒆𝒄𝒓𝒆𝒕❤️) - "Bạn" (User)

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
        crisisLevel: riskAssessment.level,
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
        crisisLevel: riskAssessment.level,
        qualityScore: qualityEvaluation.qualityScore,
      });

      const finalResponse: EnhancedResponse = {
        message: response,
        response,
        intent: multiIntent?.primaryIntent || 'general',
        confidence: 0.8,
        userSegment: userSegment?.id,
        emotionalState: nuancedEmotion.emotion,
        riskLevel: riskAssessment.level,
        crisisLevel: riskAssessment.level.toLowerCase(),
        suggestions,
        qualityScore: qualityEvaluation.qualityScore,
        referralInfo,
        disclaimer,
        followUpActions,
        emergencyContacts: riskAssessment.shouldActivateHITL ? referralInfo : [],
        nextActions: followUpActions,
        aiGenerated: true,
      };

      return finalResponse;
    } catch (error) {
      logger.error('Error processing message:', error);
      return {
        message: 'Xin lỗi, tôi gặp sự cố kỹ thuật. Bạn có thể thử lại sau không?',
        response: 'Xin lỗi, tôi gặp sự cố kỹ thuật. Bạn có thể thử lại sau không?',
        intent: 'error',
        confidence: 0,
        suggestions: ['Thử lại', 'Liên hệ hỗ trợ'],
        riskLevel: RiskLevel.LOW,
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

    // Evict oldest sessions if over limit
    if (this.sessions.size > EnhancedChatbotService.MAX_SESSIONS) {
      const oldest = this.sessions.keys().next().value;
      if (oldest) {
        this.sessions.delete(oldest);
        this.messages.delete(oldest);
      }
    }
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
    level: RiskLevel,
    trigger: string,
    response: string
  ): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.crisisHistory.push({
        level,
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
    // Keep only recent messages per session
    if (messages.length > EnhancedChatbotService.MAX_MESSAGES_PER_SESSION) {
      messages.splice(0, messages.length - EnhancedChatbotService.MAX_MESSAGES_PER_SESSION);
    }
    this.messages.set(sessionId, messages);

    // Cập nhật session
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messageCount = messages.length;
    }
  }

  /**
   * Get conversation history for a session
   * Used by clinical team to view user conversation
   */
  getConversationHistory(sessionId: string): EnhancedChatMessage[] {
    return this.messages.get(sessionId) || [];
  }

  /**
   * Send message from clinical team directly to user
   * This message will appear in user's chat as a bot message
   */
  async sendClinicalMessage(
    sessionId: string,
    userId: string,
    message: string,
    clinicalMemberId: string
  ): Promise<void> {
    // Format message to indicate it's from clinical team
    const clinicalMessage = `[Chuyên gia tư vấn] ${message}`;

    // Save as bot message so it appears in user's chat
    await this.saveMessage(sessionId, userId, clinicalMessage, 'bot', {
      intent: 'clinical_intervention',
      clinicalMemberId,
      isClinicalMessage: true,
      timestamp: new Date(),
    });

    logger.info(`📧 Clinical team message sent to user ${userId}`, {
      sessionId,
      clinicalMemberId,
      messageLength: message.length,
    });
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
      [RiskLevel.LOW]: 0,
      [RiskLevel.MODERATE]: 0,
      [RiskLevel.HIGH]: 0,
      [RiskLevel.CRITICAL]: 0,
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
