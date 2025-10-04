/**
 * Enhanced Chatbot Service
 * Tích hợp tất cả hệ thống dữ liệu nâng cao
 * Cá nhân hóa sâu sắc và quản lý khủng hoảng hoàn hảo
 */

import { logger } from '../utils/logger';
import geminiService, { GeminiService } from './geminiService';
import { 
  userSegments, 
  identifyUserSegment, 
  getResponseTemplate, 
  analyzeNuancedEmotion 
} from '../data/userSegmentationData';
import { 
  multiIntentData, 
  analyzeMultiIntent, 
  analyzeSentimentIntensity, 
  generateEmpatheticResponse 
} from '../data/advancedNLPData';
import { 
  crisisScenarios, 
  detectCrisis, 
  getRelevantReferral, 
  generateDisclaimer, 
  assessRisk 
} from '../data/crisisManagementData';
import { 
  evaluateInteractionQuality, 
  identifyKnowledgeGap, 
  interactionPatterns 
} from '../data/feedbackImprovementData';

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
  response: string;
  intent: string;
  confidence: number;
  suggestions: string[];
  crisisLevel: 'low' | 'medium' | 'high' | 'critical';
  userSegment?: string;
  emotionalState?: string;
  qualityScore?: number;
  referralInfo?: any[];
  disclaimer?: string;
  followUpActions?: string[];
}

export class EnhancedChatbotService {
  private geminiService: GeminiService;
  private useAI: boolean = true;
  public sessions: Map<string, EnhancedChatSession> = new Map();
  public messages: Map<string, EnhancedChatMessage[]> = new Map();
  private interactionHistory: any[] = [];

  constructor() {
    this.geminiService = geminiService;
  }

  /**
   * Xử lý tin nhắn với hệ thống nâng cao
   */
  async processMessage(
    message: string,
    sessionId: string,
    userId: string,
    userProfile?: any
  ): Promise<EnhancedResponse> {
    try {
      logger.info(`Processing message for session ${sessionId}`, { userId, messageLength: message.length });

      // 1. Phân tích phân đoạn người dùng
      const userSegment = identifyUserSegment(message, this.getUserHistory(sessionId));
      
      // 2. Phân tích cảm xúc đa sắc thái
      const nuancedEmotion = analyzeNuancedEmotion(message);
      
      // 3. Nhận diện ý định đa tầng
      const multiIntent = analyzeMultiIntent(message);
      
      // 4. Phân tích cường độ cảm xúc
      const sentimentIntensity = analyzeSentimentIntensity(message);
      
      // 5. Phát hiện khủng hoảng
      const crisis = detectCrisis(message);
      const crisisLevel = crisis ? crisis.level : 'low';
      
      // 6. Đánh giá rủi ro
      const riskAssessment = assessRisk(message, this.getUserHistory(sessionId), nuancedEmotion.emotion);
      
      // 7. Tạo phản hồi cá nhân hóa
      let response: string;
      let suggestions: string[] = [];
      let referralInfo: any[] = [];
      let disclaimer: string = '';
      let followUpActions: string[] = [];
      
      if (crisisLevel === 'critical') {
        response = crisis!.immediateResponse;
        suggestions = crisis!.followUpActions;
        followUpActions = crisis!.escalationProtocol;
        disclaimer = generateDisclaimer('crisis', true);
        
        // Lấy thông tin referral khẩn cấp
        referralInfo = getRelevantReferral('Toàn quốc', ['crisis_intervention'], 'critical');
        
        // Ghi log khủng hoảng
        this.logCrisisEvent(sessionId, crisisLevel, message, response);
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
        // Phản hồi đồng cảm thông thường
        response = generateEmpatheticResponse(message, nuancedEmotion.emotion, sentimentIntensity.intensity);
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
        timestamp: new Date()
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
        qualityScore: qualityEvaluation.qualityScore
      });
      
      return {
        response,
        intent: multiIntent?.primaryIntent || 'general',
        confidence: 0.8,
        suggestions,
        crisisLevel,
        userSegment: userSegment?.id,
        emotionalState: nuancedEmotion.emotion,
        qualityScore: qualityEvaluation.qualityScore,
        referralInfo,
        disclaimer,
        followUpActions
      };
    } catch (error) {
      logger.error('Error processing message:', error);
      return {
        response: 'Xin lỗi, tôi gặp sự cố kỹ thuật. Bạn có thể thử lại sau không?',
        intent: 'error',
        confidence: 0,
        suggestions: ['Thử lại', 'Liên hệ hỗ trợ'],
        crisisLevel: 'low'
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
        
        const aiResponse = await this.geminiService.generateResponse(context, {});
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
      'pregnant_postpartum': [
        'Tìm hiểu về trầm cảm sau sinh',
        'Tham gia nhóm hỗ trợ bà mẹ',
        'Liên hệ chuyên gia tâm lý',
        'Chia sẻ với chồng về cảm xúc',
        'Thực hành self-care'
      ],
      'single_career_women': [
        'Cân bằng công việc và cuộc sống',
        'Xây dựng mạng lưới hỗ trợ',
        'Tìm kiếm mentor trong sự nghiệp',
        'Thực hành self-care',
        'Tham gia hoạt động xã hội'
      ],
      'menopause_women': [
        'Tìm hiểu về mãn kinh',
        'Tham gia nhóm hỗ trợ',
        'Tham khảo ý kiến bác sĩ',
        'Thực hành mindfulness',
        'Tập thể dục nhẹ nhàng'
      ]
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
      'Tham gia hoạt động yêu thích'
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
        lastEvaluation: new Date()
      },
      status: 'active' as const
    };
    
    existingState.emotionalHistory.push({
      emotion: data.emotionalState,
      intensity: 'medium',
      timestamp: data.timestamp,
      trigger: data.lastMessage,
      duration: 0
    });
    
    // existingState.lastUpdate = data.timestamp; // Removed as it doesn't exist in interface
    
    this.sessions.set(sessionId, existingState);
  }
  
  private logInteraction(sessionId: string, userId: string, userInput: string, botResponse: string, qualityScore: number): void {
    this.interactionHistory.push({
      sessionId,
      userId,
      userInput,
      botResponse,
      qualityScore,
      timestamp: new Date()
    });
    
    // Giữ chỉ 1000 interactions gần nhất
    if (this.interactionHistory.length > 1000) {
      this.interactionHistory = this.interactionHistory.slice(-1000);
    }
  }
  
  private logCrisisEvent(sessionId: string, level: string, trigger: string, response: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.crisisHistory.push({
        level: level as any,
        timestamp: new Date(),
        trigger,
        response,
        resolved: false
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
      ...metadata
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
    const averageQuality = this.interactionHistory.reduce((sum, interaction) => 
      sum + interaction.qualityScore, 0) / totalInteractions;
    
    const positiveInteractions = this.interactionHistory.filter(interaction => 
      interaction.qualityScore >= 0.7).length;
    
    return {
      totalInteractions,
      averageQuality: Math.round(averageQuality * 100) / 100,
      positiveInteractions,
      positiveRate: Math.round((positiveInteractions / totalInteractions) * 100),
      lastUpdate: new Date()
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
      critical: 0
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
