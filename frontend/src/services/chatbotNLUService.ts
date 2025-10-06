/**
 * Chatbot NLU Service
 * Natural Language Understanding for Women's Mental Health Chatbot
 * Based on scientific research and safety protocols
 */

export interface Intent {
  name: string;
  confidence: number;
  entities: Entity[];
  riskLevel: 'CRISIS' | 'HIGH' | 'MED' | 'LOW';
}

export interface Entity {
  type: string;
  value: string;
  confidence: number;
}

export interface RiskAssessment {
  level: 'CRISIS' | 'HIGH' | 'MED' | 'LOW';
  triggers: string[];
  safetyScore: number;
}

export interface SafetyFlowResult {
  isCrisis: boolean;
  emergencyNumbers: string[];
  groundingTechnique: string;
  safetyQuestions: string[];
  handoffOptions: string[];
}

export class ChatbotNLUService {
  private crisisKeywords = [
    'tự tử', 'suicide', 'chết', 'kết thúc', 'không muốn sống',
    'bạo hành', 'abuse', 'đánh đập', 'hành hạ', 'đe dọa',
    'cắt cổ tay', 'overdose', 'quá liều', 'thuốc ngủ',
    'nhảy lầu', 'tự hại', 'self harm'
  ];

  private highRiskKeywords = [
    'trầm cảm nặng', 'lo âu nghiêm trọng', 'hoảng loạn',
    'không thể ngủ', 'không ăn được', 'mất kiểm soát',
    'cảm thấy tuyệt vọng', 'không có lối thoát'
  ];

  private intentPatterns = {
    crisis_suicide: [
      'tôi muốn chết', 'không muốn sống nữa', 'kết thúc tất cả',
      'tự tử', 'suicide', 'chết đi cho xong'
    ],
    report_abuse: [
      'bị đánh', 'bị hành hạ', 'bạo hành', 'đe dọa',
      'không an toàn ở nhà', 'chồng đánh', 'bố mẹ đánh'
    ],
    screening_test: [
      'kiểm tra tâm lý', 'test trầm cảm', 'đánh giá lo âu',
      'tôi có bị trầm cảm không', 'kiểm tra sức khỏe tinh thần'
    ],
    relaxation_skill: [
      'thư giãn', 'giảm stress', 'kỹ thuật thở', 'thiền',
      'cách bình tĩnh', 'giảm lo âu'
    ],
    relationship_help: [
      'vợ chồng', 'gia đình', 'mối quan hệ', 'ly hôn',
      'con cái', 'cha mẹ', 'bạn bè'
    ],
    resource_request: [
      'bác sĩ tâm lý', 'chuyên gia', 'địa chỉ', 'liên hệ',
      'phòng khám', 'bệnh viện tâm thần'
    ]
  };

  /**
   * Analyze user message for intent, entities, and risk level
   */
  analyzeMessage(message: string): Intent {
    const normalizedMessage = message.toLowerCase().trim();
    
    // Risk assessment first (safety priority)
    const riskAssessment = this.assessRisk(normalizedMessage);
    
    // Intent detection
    const intent = this.detectIntent(normalizedMessage);
    
    // Entity extraction
    const entities = this.extractEntities(normalizedMessage);
    
    return {
      name: intent,
      confidence: this.calculateConfidence(normalizedMessage, intent),
      entities,
      riskLevel: riskAssessment.level
    };
  }

  /**
   * Assess risk level based on message content
   */
  private assessRisk(message: string): RiskAssessment {
    let crisisCount = 0;
    let highRiskCount = 0;
    const triggers: string[] = [];

    // Check for crisis keywords
    this.crisisKeywords.forEach(keyword => {
      if (message.includes(keyword)) {
        crisisCount++;
        triggers.push(keyword);
      }
    });

    // Check for high risk keywords
    this.highRiskKeywords.forEach(keyword => {
      if (message.includes(keyword)) {
        highRiskCount++;
        triggers.push(keyword);
      }
    });

    // Determine risk level
    let level: 'CRISIS' | 'HIGH' | 'MED' | 'LOW';
    let safetyScore: number;

    if (crisisCount > 0) {
      level = 'CRISIS';
      safetyScore = 0.1; // Very low safety score
    } else if (highRiskCount >= 2) {
      level = 'HIGH';
      safetyScore = 0.3;
    } else if (highRiskCount === 1) {
      level = 'MED';
      safetyScore = 0.6;
    } else {
      level = 'LOW';
      safetyScore = 0.9;
    }

    return {
      level,
      triggers,
      safetyScore
    };
  }

  /**
   * Detect intent from message
   */
  private detectIntent(message: string): string {
    let bestIntent = 'general_help';
    let maxScore = 0;

    Object.entries(this.intentPatterns).forEach(([intent, patterns]) => {
      let score = 0;
      patterns.forEach(pattern => {
        if (message.includes(pattern)) {
          score += 1;
        }
      });
      
      if (score > maxScore) {
        maxScore = score;
        bestIntent = intent;
      }
    });

    return bestIntent;
  }

  /**
   * Extract entities from message
   */
  private extractEntities(message: string): Entity[] {
    const entities: Entity[] = [];

    // Life stage detection
    const lifeStagePatterns = {
      'pregnant': ['mang thai', 'thai kỳ', 'bầu'],
      'postpartum': ['sau sinh', 'mới sinh', 'em bé'],
      'menopause': ['mãn kinh', 'tiền mãn kinh', 'tuổi trung niên'],
      'adolescent': ['tuổi teen', 'học sinh', 'sinh viên']
    };

    Object.entries(lifeStagePatterns).forEach(([stage, patterns]) => {
      patterns.forEach(pattern => {
        if (message.includes(pattern)) {
          entities.push({
            type: 'life_stage',
            value: stage,
            confidence: 0.8
          });
        }
      });
    });

    // Symptom detection
    const symptomPatterns = {
      'depression': ['trầm cảm', 'buồn', 'chán nản', 'mất hứng thú'],
      'anxiety': ['lo âu', 'căng thẳng', 'hoảng loạn', 'sợ hãi'],
      'stress': ['stress', 'áp lực', 'căng thẳng'],
      'sleep': ['mất ngủ', 'khó ngủ', 'ngủ không ngon']
    };

    Object.entries(symptomPatterns).forEach(([symptom, patterns]) => {
      patterns.forEach(pattern => {
        if (message.includes(pattern)) {
          entities.push({
            type: 'symptom',
            value: symptom,
            confidence: 0.7
          });
        }
      });
    });

    return entities;
  }

  /**
   * Calculate confidence score for intent
   */
  private calculateConfidence(message: string, intent: string): number {
    const patterns = this.intentPatterns[intent as keyof typeof this.intentPatterns] || [];
    let matchCount = 0;
    
    patterns.forEach(pattern => {
      if (message.includes(pattern)) {
        matchCount++;
      }
    });

    return Math.min(matchCount / patterns.length, 1.0);
  }

  /**
   * Check if message requires safety flow
   */
  requiresSafetyFlow(intent: Intent): boolean {
    return intent.name === 'crisis_suicide' || 
           intent.name === 'report_abuse' || 
           intent.riskLevel === 'CRISIS' || 
           intent.riskLevel === 'HIGH';
  }

  /**
   * Get safety flow configuration
   */
  getSafetyFlowConfig(): SafetyFlowResult {
    return {
      isCrisis: true,
      emergencyNumbers: [
        '112 - Khẩn cấp hợp nhất',
        '113 - Công an',
        '114 - Cứu hỏa', 
        '115 - Cấp cứu y tế',
        '111 - Trẻ em (UNICEF)'
      ],
      groundingTechnique: 'Thở 4-7-8 hoặc Grounding 5-4-3-2-1',
      safetyQuestions: [
        'Bạn có đang ở nơi an toàn không?',
        'Có ai đang ở bên cạnh bạn không?',
        'Bạn có thể gọi ai để được giúp đỡ không?'
      ],
      handoffOptions: [
        'Gọi người thân',
        'Liên hệ đường dây nóng',
        'Hẹn phiên với chuyên gia tâm lý'
      ]
    };
  }
}

export default ChatbotNLUService;
