/**
 * Chatbot Orchestrator Service
 * Dialog Policy and Response Orchestration for Women's Mental Health Chatbot
 * Based on scientific research and safety protocols
 */

import ChatbotNLUService, { Intent } from './chatbotNLUService';
import ChatbotSafetyService, { SafetyResponse } from './chatbotSafetyService';
import ChatbotRAGService, { RAGResponse } from './chatbotRAGService';

export interface DialogContext {
  userId: string;
  sessionId: string;
  conversationHistory: Message[];
  userProfile: UserProfile;
  currentIntent: string;
  riskLevel: 'CRISIS' | 'HIGH' | 'MED' | 'LOW';
  safetyFlowActive: boolean;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  intent?: string;
  riskLevel?: string;
}

export interface UserProfile {
  age?: number;
  lifeStage?: 'pregnant' | 'postpartum' | 'menopause' | 'adolescent' | 'adult';
  symptoms?: string[];
  previousTests?: string[];
  riskFactors?: string[];
}

export interface OrchestratorResponse {
  message: string;
  intent: string;
  riskLevel: string;
  safetyFlow?: SafetyResponse;
  ragResponse?: RAGResponse;
  suggestedTests?: string[];
  nextActions?: string[];
  confidence: number;
}

export class ChatbotOrchestratorService {
  private nluService: ChatbotNLUService;
  private safetyService: ChatbotSafetyService;
  private ragService: ChatbotRAGService;

  constructor() {
    this.nluService = new ChatbotNLUService();
    this.safetyService = new ChatbotSafetyService();
    this.ragService = new ChatbotRAGService();
  }

  /**
   * Process user message and generate response
   */
  async processMessage(
    userMessage: string, 
    context: DialogContext
  ): Promise<OrchestratorResponse> {
    // Step 1: NLU Analysis
    const intent = this.nluService.analyzeMessage(userMessage);
    
    // Update context
    context.currentIntent = intent.name;
    context.riskLevel = intent.riskLevel;
    context.conversationHistory.push({
      id: this.generateMessageId(),
      content: userMessage,
      sender: 'user',
      timestamp: new Date(),
      intent: intent.name,
      riskLevel: intent.riskLevel
    });

    // Step 2: Safety Check (Priority)
    if (this.nluService.requiresSafetyFlow(intent)) {
      return this.handleSafetyFlow(intent, context);
    }

    // Step 3: Intent-based Routing
    switch (intent.name) {
      case 'screening_test':
        return this.handleScreeningTest(intent, context);
      
      case 'relaxation_skill':
        return this.handleRelaxationSkill(intent, context);
      
      case 'relationship_help':
        return this.handleRelationshipHelp(intent, context);
      
      case 'resource_request':
        return this.handleResourceRequest(intent, context);
      
      default:
        return this.handleGeneralHelp(userMessage, intent, context);
    }
  }

  /**
   * Handle safety flow for crisis situations
   */
  private handleSafetyFlow(intent: Intent, context: DialogContext): OrchestratorResponse {
    context.safetyFlowActive = true;
    const safetyFlow = this.safetyService.generateSafetyResponse(intent.riskLevel);
    
    return {
      message: safetyFlow.responseTemplate,
      intent: intent.name,
      riskLevel: intent.riskLevel,
      safetyFlow,
      confidence: 0.95,
      nextActions: [
        'Thực hiện kỹ thuật thư giãn',
        'Gọi số khẩn cấp nếu cần',
        'Liên hệ người thân'
      ]
    };
  }

  /**
   * Handle screening test requests
   */
  private handleScreeningTest(intent: Intent, context: DialogContext): OrchestratorResponse {
    const suggestedTests = this.getSuggestedTests(intent.entities, context.userProfile);
    
    let message = 'Tôi hiểu bạn muốn đánh giá tình trạng tâm lý. ';
    message += 'Dựa trên thông tin bạn chia sẻ, tôi gợi ý các test phù hợp:\n\n';
    
    suggestedTests.forEach((test, index) => {
      message += `${index + 1}. ${test.name} - ${test.description}\n`;
    });
    
    message += '\nBạn có muốn làm test nào trước không?';

    return {
      message,
      intent: intent.name,
      riskLevel: intent.riskLevel,
      suggestedTests: suggestedTests.map(t => t.name),
      confidence: 0.85,
      nextActions: [
        'Chọn test phù hợp',
        'Làm test đánh giá',
        'Xem kết quả và gợi ý'
      ]
    };
  }

  /**
   * Handle relaxation skill requests
   */
  private handleRelaxationSkill(intent: Intent, context: DialogContext): OrchestratorResponse {
    const ragResponse = this.ragService.generateResponse(
      'kỹ thuật thư giãn giảm stress',
      ['coping']
    );

    let message = 'Tôi sẽ hướng dẫn bạn kỹ thuật thư giãn hiệu quả:\n\n';
    message += ragResponse.answer;
    message += '\n\nHãy thử ngay bây giờ và cho tôi biết cảm giác của bạn!';

    return {
      message,
      intent: intent.name,
      riskLevel: intent.riskLevel,
      ragResponse,
      confidence: 0.90,
      nextActions: [
        'Thực hành kỹ thuật thư giãn',
        'Chia sẻ cảm giác sau khi thực hành',
        'Học thêm kỹ thuật khác'
      ]
    };
  }

  /**
   * Handle relationship help requests
   */
  private handleRelationshipHelp(intent: Intent, context: DialogContext): OrchestratorResponse {
    const ragResponse = this.ragService.generateResponse(
      'hỗ trợ mối quan hệ gia đình vợ chồng',
      ['relationships']
    );

    let message = 'Tôi hiểu bạn đang gặp khó khăn trong mối quan hệ. ';
    message += ragResponse.answer;
    
    // Check for abuse indicators
    if (this.containsAbuseIndicators(intent.entities)) {
      message += '\n\n⚠️ Nếu bạn đang bị bạo hành, hãy liên hệ ngay:';
      message += '\n• 113 (Công an)';
      message += '\n• 1900 6363 (Tư vấn tâm lý)';
    }

    return {
      message,
      intent: intent.name,
      riskLevel: intent.riskLevel,
      ragResponse,
      confidence: 0.88,
      nextActions: [
        'Tìm kiếm hỗ trợ chuyên nghiệp',
        'Xây dựng mạng lưới hỗ trợ',
        'Học kỹ năng giao tiếp'
      ]
    };
  }

  /**
   * Handle resource requests
   */
  private handleResourceRequest(intent: Intent, context: DialogContext): OrchestratorResponse {
    const resources = this.getLocalResources(context.userProfile);
    
    let message = 'Dưới đây là các nguồn hỗ trợ phù hợp với bạn:\n\n';
    
    resources.forEach((resource, index) => {
      message += `${index + 1}. ${resource.name}\n`;
      message += `   📞 ${resource.contact}\n`;
      message += `   🕒 ${resource.availability}\n`;
      message += `   📍 ${resource.location}\n\n`;
    });

    return {
      message,
      intent: intent.name,
      riskLevel: intent.riskLevel,
      confidence: 0.80,
      nextActions: [
        'Liên hệ nguồn hỗ trợ',
        'Lưu thông tin liên hệ',
        'Hẹn lịch tư vấn'
      ]
    };
  }

  /**
   * Handle general help requests
   */
  private handleGeneralHelp(
    userMessage: string, 
    intent: Intent, 
    context: DialogContext
  ): OrchestratorResponse {
    const ragResponse = this.ragService.generateResponse(userMessage);

    return {
      message: ragResponse.answer,
      intent: intent.name,
      riskLevel: intent.riskLevel,
      ragResponse,
      confidence: ragResponse.confidence,
      nextActions: [
        'Chia sẻ thêm về cảm xúc',
        'Thử kỹ thuật thư giãn',
        'Làm test đánh giá'
      ]
    };
  }

  /**
   * Get suggested tests based on entities and user profile
   */
  private getSuggestedTests(entities: any[], userProfile: UserProfile): any[] {
    const tests = [];

    // Life stage based tests
    if (userProfile.lifeStage === 'postpartum') {
      tests.push({
        name: 'EPDS',
        description: 'Thang đo trầm cảm sau sinh (Edinburgh Postnatal Depression Scale)'
      });
    }

    // Symptom based tests
    entities.forEach(entity => {
      if (entity.type === 'symptom') {
        switch (entity.value) {
          case 'depression':
            tests.push({
              name: 'PHQ-9',
              description: 'Thang đo trầm cảm (Patient Health Questionnaire-9)'
            });
            break;
          case 'anxiety':
            tests.push({
              name: 'GAD-7',
              description: 'Thang đo lo âu tổng quát (Generalized Anxiety Disorder-7)'
            });
            break;
        }
      }
    });

    // Default tests
    if (tests.length === 0) {
      tests.push(
        {
          name: 'DASS-21',
          description: 'Thang đo trầm cảm, lo âu, stress (Depression Anxiety Stress Scales)'
        },
        {
          name: 'PHQ-9',
          description: 'Thang đo trầm cảm (Patient Health Questionnaire-9)'
        }
      );
    }

    return tests;
  }

  /**
   * Check for abuse indicators in entities
   */
  private containsAbuseIndicators(entities: any[]): boolean {
    const abuseKeywords = ['bạo hành', 'đánh đập', 'hành hạ', 'đe dọa', 'kiểm soát'];
    
    return entities.some(entity => 
      abuseKeywords.some(keyword => 
        entity.value.toLowerCase().includes(keyword)
      )
    );
  }

  /**
   * Get local resources based on user profile
   */
  private getLocalResources(userProfile: UserProfile): any[] {
    const resources = [
      {
        name: 'Tổng đài tư vấn tâm lý',
        contact: '1900 6363',
        availability: '24/7',
        location: 'Toàn quốc'
      },
      {
        name: 'Bệnh viện Tâm thần Trung ương',
        contact: '024 3852 3852',
        availability: 'Giờ hành chính',
        location: 'Hà Nội'
      },
      {
        name: 'Trung tâm hỗ trợ phụ nữ',
        contact: '1900 969 969',
        availability: '24/7',
        location: 'Toàn quốc'
      }
    ];

    // Filter based on user profile
    if (userProfile.lifeStage === 'pregnant' || userProfile.lifeStage === 'postpartum') {
      resources.push({
        name: 'Trung tâm chăm sóc sức khỏe bà mẹ và trẻ em',
        contact: '1900 6363',
        availability: '24/7',
        location: 'Toàn quốc'
      });
    }

    return resources;
  }

  /**
   * Generate message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update user profile based on conversation
   */
  updateUserProfile(context: DialogContext, newInfo: Partial<UserProfile>): void {
    context.userProfile = { ...context.userProfile, ...newInfo };
  }

  /**
   * Get conversation summary
   */
  getConversationSummary(context: DialogContext): string {
    const recentMessages = context.conversationHistory.slice(-5);
    const intents = recentMessages.map(msg => msg.intent).filter(Boolean);
    const riskLevels = recentMessages.map(msg => msg.riskLevel).filter(Boolean);
    
    return `Cuộc trò chuyện gần đây: ${intents.join(', ')}. Mức độ rủi ro: ${riskLevels[riskLevels.length - 1] || 'LOW'}`;
  }
}

export default ChatbotOrchestratorService;
