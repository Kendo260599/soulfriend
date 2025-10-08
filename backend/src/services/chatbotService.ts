/**
 * Chatbot Service
 * Core chatbot business logic for backend
 * Phase 2: Enhanced with Gemini AI
 */

import { logger } from '../utils/logger';
import geminiService, { GeminiService } from './geminiService';

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  intent?: string;
  riskLevel?: string;
  metadata?: any;
}

export interface ChatSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  messageCount: number;
  userProfile?: any;
  status: 'active' | 'ended';
}

export interface IntentAnalysis {
  intent: string;
  confidence: number;
  entities: any[];
  riskLevel: 'CRISIS' | 'HIGH' | 'MED' | 'LOW';
}

export interface SafetyCheckResult {
  safe: boolean;
  riskLevel: 'CRISIS' | 'HIGH' | 'MED' | 'LOW';
  detectedIssues: string[];
  recommendedActions: string[];
  emergencyContacts?: any[];
}

export interface KnowledgeChunk {
  id: string;
  content: string;
  category: string;
  relevance: number;
  source: string;
}

export class ChatbotService {
  private sessions: Map<string, ChatSession> = new Map();
  private messages: Map<string, ChatMessage[]> = new Map();
  private geminiService: GeminiService;
  private useAI: boolean = true; // Toggle for AI vs rule-based

  constructor() {
    this.geminiService = geminiService;
    this.useAI = geminiService.isReady();
    logger.info(`Chatbot Service initialized (AI: ${this.useAI ? 'enabled' : 'disabled'})`);
  }

  /**
   * Process incoming chat message
   */
  async processMessage(
    message: string,
    userId: string,
    sessionId: string,
    context: any
  ): Promise<any> {
    try {
      // Ensure session exists
      if (!this.sessions.has(sessionId)) {
        await this.createSession(userId, context.userProfile || {});
      }

      // Save user message
      const userMsg = this.createMessage(sessionId, userId, message, 'user');
      this.saveMessage(sessionId, userMsg);

      // Analyze intent
      const intentAnalysis = await this.analyzeIntent(message);

      // Check safety first
      if (intentAnalysis.riskLevel === 'CRISIS' || intentAnalysis.riskLevel === 'HIGH') {
        const safetyResponse = await this.handleSafetyFlow(intentAnalysis);
        const botMsg = this.createMessage(sessionId, 'bot', safetyResponse.message, 'bot', {
          intent: intentAnalysis.intent,
          riskLevel: intentAnalysis.riskLevel,
          safetyFlow: true,
        });
        this.saveMessage(sessionId, botMsg);

        return {
          message: safetyResponse.message,
          intent: intentAnalysis.intent,
          riskLevel: intentAnalysis.riskLevel,
          safetyFlow: safetyResponse,
          emergencyContacts: safetyResponse.emergencyContacts,
        };
      }

      // Route based on intent (pass full context for AI)
      const response = await this.routeIntentToResponse(intentAnalysis, message, {
        ...context,
        userId,
        sessionId,
      });

      // Save bot response
      const botMsg = this.createMessage(sessionId, 'bot', response.message, 'bot', {
        intent: intentAnalysis.intent,
        riskLevel: intentAnalysis.riskLevel,
      });
      this.saveMessage(sessionId, botMsg);

      return response;
    } catch (error) {
      logger.error('Error processing message:', error);
      throw error;
    }
  }

  /**
   * Analyze message intent
   */
  async analyzeIntent(message: string): Promise<IntentAnalysis> {
    const normalizedMessage = message.toLowerCase().trim();

    // Crisis detection
    const crisisKeywords = [
      'tự tử',
      'tự sát',
      'không muốn sống',
      'chết đi',
      'kết thúc cuộc đời',
      'tự làm mình chết',
      'tự hủy',
      'giết mình',
    ];

    const hasCrisisKeywords = crisisKeywords.some(kw => normalizedMessage.includes(kw));
    if (hasCrisisKeywords) {
      return {
        intent: 'crisis',
        confidence: 0.95,
        entities: [],
        riskLevel: 'CRISIS',
      };
    }

    // High-risk detection
    const highRiskKeywords = [
      'trầm cảm nặng',
      'đau khổ',
      'tuyệt vọng',
      'không còn hy vọng',
      'cuộc sống vô nghĩa',
      'muốn biến mất',
    ];

    const hasHighRiskKeywords = highRiskKeywords.some(kw => normalizedMessage.includes(kw));
    if (hasHighRiskKeywords) {
      return {
        intent: 'high_risk',
        confidence: 0.85,
        entities: [],
        riskLevel: 'HIGH',
      };
    }

    // Intent detection
    if (
      normalizedMessage.includes('test') ||
      normalizedMessage.includes('đánh giá') ||
      normalizedMessage.includes('kiểm tra')
    ) {
      return {
        intent: 'screening_test',
        confidence: 0.8,
        entities: [],
        riskLevel: 'LOW',
      };
    }

    if (
      normalizedMessage.includes('thư giãn') ||
      normalizedMessage.includes('stress') ||
      normalizedMessage.includes('lo âu')
    ) {
      return {
        intent: 'relaxation_skill',
        confidence: 0.75,
        entities: [],
        riskLevel: 'MED',
      };
    }

    if (
      normalizedMessage.includes('gia đình') ||
      normalizedMessage.includes('vợ chồng') ||
      normalizedMessage.includes('mối quan hệ')
    ) {
      return {
        intent: 'relationship_help',
        confidence: 0.7,
        entities: [],
        riskLevel: 'MED',
      };
    }

    if (
      normalizedMessage.includes('bác sĩ') ||
      normalizedMessage.includes('tư vấn') ||
      normalizedMessage.includes('hỗ trợ')
    ) {
      return {
        intent: 'resource_request',
        confidence: 0.75,
        entities: [],
        riskLevel: 'LOW',
      };
    }

    // Default: general help
    return {
      intent: 'general_help',
      confidence: 0.5,
      entities: [],
      riskLevel: 'LOW',
    };
  }

  /**
   * Perform safety check
   */
  async performSafetyCheck(message: string): Promise<SafetyCheckResult> {
    const intentAnalysis = await this.analyzeIntent(message);

    const result: SafetyCheckResult = {
      safe: intentAnalysis.riskLevel === 'LOW',
      riskLevel: intentAnalysis.riskLevel,
      detectedIssues: [],
      recommendedActions: [],
    };

    if (intentAnalysis.riskLevel === 'CRISIS') {
      result.detectedIssues.push('Phát hiện nguy cơ tự tử cao');
      result.recommendedActions.push('Liên hệ ngay số khẩn cấp 113 hoặc 1900 599 958');
      result.recommendedActions.push('Thông báo cho người thân ngay lập tức');
      result.emergencyContacts = this.getEmergencyContactsSync();
    } else if (intentAnalysis.riskLevel === 'HIGH') {
      result.detectedIssues.push('Phát hiện dấu hiệu trầm cảm nghiêm trọng');
      result.recommendedActions.push('Tìm kiếm hỗ trợ chuyên nghiệp');
      result.recommendedActions.push('Liên hệ tổng đài tư vấn tâm lý');
    }

    return result;
  }

  /**
   * Handle safety flow for crisis situations
   */
  private async handleSafetyFlow(intentAnalysis: IntentAnalysis): Promise<any> {
    const emergencyContacts = this.getEmergencyContactsSync();

    let message = '⚠️ Tôi rất lo lắng cho bạn. Đây là tình huống khẩn cấp.\n\n';
    message += '🆘 **VUI LÒNG LIÊN HỆ NGAY:**\n\n';

    emergencyContacts.forEach((contact: any, index: number) => {
      message += `${index + 1}. ${contact.name}\n`;
      message += `   📞 ${contact.phone}\n`;
      message += `   🕒 ${contact.availability}\n\n`;
    });

    message += '\n💙 **Hãy nhớ:**\n';
    message += '- Bạn không đơn độc\n';
    message += '- Có nhiều người sẵn sàng giúp đỡ bạn\n';
    message += '- Tình trạng này có thể được điều trị\n';
    message += '- Cuộc sống của bạn rất quý giá\n\n';
    message += '🤝 Hãy liên hệ ngay với một trong những số trên. Họ có thể giúp bạn.';

    return {
      message,
      emergencyContacts,
      riskLevel: intentAnalysis.riskLevel,
      requiresImmediateAction: true,
    };
  }

  /**
   * Route intent to appropriate response
   */
  private async routeIntentToResponse(
    intentAnalysis: IntentAnalysis,
    message: string,
    context: any
  ): Promise<any> {
    switch (intentAnalysis.intent) {
      case 'screening_test':
        return this.handleScreeningTestRequest();

      case 'relaxation_skill':
        return this.handleRelaxationSkillRequest();

      case 'relationship_help':
        return this.handleRelationshipHelpRequest();

      case 'resource_request':
        return this.handleResourceRequest();

      default:
        return this.handleGeneralHelp(message);
    }
  }

  /**
   * Handle screening test request
   */
  private async handleScreeningTestRequest(): Promise<any> {
    return {
      message:
        'Tôi hiểu bạn muốn đánh giá tình trạng tâm lý của mình. Dưới đây là các test phù hợp:\n\n' +
        '1. PHQ-9 - Đánh giá trầm cảm\n' +
        '2. GAD-7 - Đánh giá lo âu\n' +
        '3. DASS-21 - Đánh giá trầm cảm, lo âu và stress\n\n' +
        'Bạn muốn làm test nào?',
      intent: 'screening_test',
      suggestedTests: ['PHQ-9', 'GAD-7', 'DASS-21'],
      nextActions: ['Chọn test phù hợp', 'Làm test đánh giá'],
    };
  }

  /**
   * Handle relaxation skill request
   */
  private async handleRelaxationSkillRequest(): Promise<any> {
    return {
      message:
        '🧘‍♀️ Tôi sẽ hướng dẫn bạn kỹ thuật thư giãn hiệu quả:\n\n' +
        '**Kỹ thuật thở 4-7-8:**\n' +
        '1. Hít vào qua mũi trong 4 giây\n' +
        '2. Giữ hơi trong 7 giây\n' +
        '3. Thở ra qua miệng trong 8 giây\n' +
        '4. Lặp lại 3-4 lần\n\n' +
        '**Thư giãn cơ bắp tiến triển:**\n' +
        '1. Căng nhóm cơ trong 5 giây\n' +
        '2. Thả lỏng và cảm nhận sự khác biệt\n' +
        '3. Di chuyển qua các nhóm cơ khác\n\n' +
        'Hãy thử ngay bây giờ và chia sẻ cảm giác của bạn!',
      intent: 'relaxation_skill',
      techniques: ['breathing', 'progressive_muscle_relaxation', 'mindfulness'],
      nextActions: ['Thực hành ngay', 'Xem video hướng dẫn'],
    };
  }

  /**
   * Handle relationship help request
   */
  private async handleRelationshipHelpRequest(): Promise<any> {
    return {
      message:
        '❤️ Tôi hiểu bạn đang gặp khó khăn trong mối quan hệ.\n\n' +
        '**Một số gợi ý hữu ích:**\n' +
        '1. Giao tiếp cởi mở và trung thực\n' +
        '2. Lắng nghe tích cực\n' +
        '3. Thể hiện sự đồng cảm\n' +
        '4. Tìm kiếm thời gian chất lượng cùng nhau\n' +
        '5. Tham khảo ý kiến chuyên gia nếu cần\n\n' +
        'Bạn có muốn tôi giới thiệu các chuyên gia tư vấn hôn nhân không?',
      intent: 'relationship_help',
      resources: ['marriage_counseling', 'communication_skills', 'conflict_resolution'],
      nextActions: ['Tìm chuyên gia tư vấn', 'Học kỹ năng giao tiếp'],
    };
  }

  /**
   * Handle resource request
   */
  private async handleResourceRequest(): Promise<any> {
    const resources = this.getEmergencyContactsSync();

    let message = '🏥 Dưới đây là các nguồn hỗ trợ chuyên nghiệp:\n\n';
    resources.forEach((resource: any, index: number) => {
      message += `${index + 1}. ${resource.name}\n`;
      message += `   📞 ${resource.phone}\n`;
      message += `   🕒 ${resource.availability}\n`;
      message += `   📍 ${resource.location || 'Toàn quốc'}\n\n`;
    });

    return {
      message,
      intent: 'resource_request',
      resources,
      nextActions: ['Liên hệ ngay', 'Lưu thông tin'],
    };
  }

  /**
   * Handle general help
   */
  private async handleGeneralHelp(message: string, context?: any): Promise<any> {
    // Try AI response first if available
    if (this.useAI && this.geminiService.isReady()) {
      try {
        const aiResponse = await this.geminiService.generateResponse(message, {
          userId: context?.userId || 'unknown',
          sessionId: context?.sessionId || 'unknown',
          history: [],
          userProfile: context?.userProfile,
        });

        return {
          message: aiResponse.text,
          intent: 'general_help',
          confidence: aiResponse.confidence,
          aiGenerated: true,
          nextActions: ['Làm test đánh giá', 'Học kỹ thuật thư giãn', 'Tìm chuyên gia'],
        };
      } catch (error) {
        logger.warn('AI response failed, falling back to rule-based:', error);
      }
    }

    // Fallback to rule-based response
    return {
      message:
        'Cảm ơn bạn đã chia sẻ. Tôi ở đây để lắng nghe và hỗ trợ bạn.\n\n' +
        'Bạn có thể:\n' +
        '- Làm test đánh giá tâm lý\n' +
        '- Học kỹ thuật thư giãn\n' +
        '- Tìm kiếm hỗ trợ chuyên nghiệp\n' +
        '- Tham gia cộng đồng hỗ trợ\n\n' +
        'Bạn muốn tôi giúp gì?',
      intent: 'general_help',
      aiGenerated: false,
      nextActions: ['Làm test đánh giá', 'Học kỹ thuật thư giãn', 'Tìm chuyên gia'],
    };
  }

  /**
   * Retrieve knowledge from knowledge base
   */
  async retrieveKnowledge(
    query: string,
    categories: string[] = [],
    limit: number = 10
  ): Promise<KnowledgeChunk[]> {
    // Placeholder for RAG implementation
    return [];
  }

  /**
   * Get emergency resources
   */
  async getEmergencyResources(location: string = 'Vietnam'): Promise<any[]> {
    return this.getEmergencyContactsSync();
  }

  /**
   * Get emergency contacts (sync)
   */
  private getEmergencyContactsSync(): any[] {
    return [
      {
        name: 'Tổng đài tư vấn tâm lý 24/7',
        phone: '1900 599 958',
        availability: '24/7',
        location: 'Toàn quốc',
        type: 'hotline',
      },
      {
        name: 'Cảnh sát khẩn cấp',
        phone: '113',
        availability: '24/7',
        location: 'Toàn quốc',
        type: 'emergency',
      },
      {
        name: 'Cấp cứu y tế',
        phone: '115',
        availability: '24/7',
        location: 'Toàn quốc',
        type: 'emergency',
      },
      {
        name: 'Trung tâm hỗ trợ phụ nữ',
        phone: '1900 969 969',
        availability: '24/7',
        location: 'Toàn quốc',
        type: 'support_center',
      },
    ];
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(sessionId: string, limit: number = 50): Promise<ChatMessage[]> {
    const messages = this.messages.get(sessionId) || [];
    return messages.slice(-limit);
  }

  /**
   * Create new session
   */
  async createSession(userId: string, userProfile: any): Promise<ChatSession> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: ChatSession = {
      id: sessionId,
      userId,
      startTime: new Date(),
      messageCount: 0,
      userProfile,
      status: 'active',
    };

    this.sessions.set(sessionId, session);
    this.messages.set(sessionId, []);

    logger.info('Chat session created', { sessionId, userId });

    return session;
  }

  /**
   * End session
   */
  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'ended';
      session.endTime = new Date();
      logger.info('Chat session ended', { sessionId, messageCount: session.messageCount });
    }
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<any> {
    const totalSessions = this.sessions.size;
    const activeSessions = Array.from(this.sessions.values()).filter(
      s => s.status === 'active'
    ).length;
    const totalMessages = Array.from(this.messages.values()).reduce(
      (sum, msgs) => sum + msgs.length,
      0
    );

    return {
      totalSessions,
      activeSessions,
      totalMessages,
      averageMessagesPerSession: totalSessions > 0 ? totalMessages / totalSessions : 0,
    };
  }

  /**
   * Helper: Create message object
   */
  private createMessage(
    sessionId: string,
    userId: string,
    content: string,
    sender: 'user' | 'bot',
    metadata?: any
  ): ChatMessage {
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      userId,
      content,
      sender,
      timestamp: new Date(),
      metadata,
    };
  }

  /**
   * Helper: Save message
   */
  private saveMessage(sessionId: string, message: ChatMessage): void {
    const messages = this.messages.get(sessionId) || [];
    messages.push(message);
    this.messages.set(sessionId, messages);

    // Update session message count
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messageCount = messages.length;
    }
  }
}

export default new ChatbotService();
