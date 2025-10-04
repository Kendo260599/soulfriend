/**
 * Advanced NLP Data - Dữ liệu NLP tiên tiến
 * Xử lý ngôn ngữ tự nhiên đa tầng và phức tạp
 */

export interface MultiIntentData {
  id: string;
  primaryIntent: string;
  secondaryIntents: string[];
  complexPatterns: string[];
  responseStrategy: 'sequential' | 'parallel' | 'prioritized';
  examples: string[];
}

export interface SentimentIntensityData {
  emotion: string;
  intensityLevels: {
    low: string[];
    medium: string[];
    high: string[];
    critical: string[];
  };
  escalationTriggers: string[];
  safetyProtocols: string[];
}

export interface ConversationState {
  sessionId: string;
  userId: string;
  currentTopic: string;
  previousTopics: string[];
  emotionalHistory: EmotionalState[];
  userSegment: string;
  lastInteraction: Date;
  contextMemory: ContextMemory[];
}

export interface EmotionalState {
  emotion: string;
  intensity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  trigger: string;
  duration: number;
}

export interface ContextMemory {
  topic: string;
  timestamp: Date;
  importance: 'low' | 'medium' | 'high';
  emotionalContext: string;
  userConcerns: string[];
}

// Dữ liệu nhận diện ý định đa tầng
export const multiIntentData: MultiIntentData[] = [
  {
    id: 'work_family_balance',
    primaryIntent: 'stress_management',
    secondaryIntents: ['work_pressure', 'family_guilt', 'time_management'],
    complexPatterns: [
      'Tôi stress vì deadline công việc và cảm thấy tội lỗi vì không dành thời gian cho con',
      'Công việc quá nhiều khiến tôi không thể chăm sóc gia đình như mong muốn',
      'Tôi muốn thành công trong sự nghiệp nhưng cũng muốn là người mẹ tốt'
    ],
    responseStrategy: 'prioritized',
    examples: [
      'deadline + tội lỗi + con',
      'công việc + gia đình + cân bằng',
      'thành công + mẹ tốt + áp lực'
    ]
  },
  {
    id: 'relationship_health',
    primaryIntent: 'relationship_concern',
    secondaryIntents: ['health_anxiety', 'communication', 'trust'],
    complexPatterns: [
      'Tôi lo lắng về sức khỏe của chồng và cảm thấy anh ấy không chia sẻ với tôi',
      'Mối quan hệ của chúng tôi đang có vấn đề và tôi cũng lo lắng về sức khỏe tâm lý của mình',
      'Tôi muốn cải thiện giao tiếp với chồng nhưng không biết bắt đầu từ đâu'
    ],
    responseStrategy: 'sequential',
    examples: [
      'lo lắng + chồng + không chia sẻ',
      'mối quan hệ + sức khỏe tâm lý',
      'giao tiếp + chồng + không biết'
    ]
  },
  {
    id: 'identity_crisis',
    primaryIntent: 'identity_confusion',
    secondaryIntents: ['self_worth', 'future_anxiety', 'social_pressure'],
    complexPatterns: [
      'Tôi không biết mình là ai nữa và lo lắng về tương lai',
      'Mọi người kỳ vọng quá nhiều ở tôi và tôi cảm thấy mất phương hướng',
      'Tôi muốn tìm lại bản thân nhưng không biết bắt đầu từ đâu'
    ],
    responseStrategy: 'parallel',
    examples: [
      'không biết + lo lắng + tương lai',
      'kỳ vọng + mất phương hướng',
      'tìm lại + bản thân + không biết'
    ]
  }
];

// Dữ liệu phân tích cảm xúc cường độ
export const sentimentIntensityData: SentimentIntensityData[] = [
  {
    emotion: 'sadness',
    intensityLevels: {
      low: ['hơi buồn', 'chút buồn', 'không vui'],
      medium: ['buồn', 'không vui', 'chán nản'],
      high: ['rất buồn', 'buồn lắm', 'tuyệt vọng'],
      critical: ['buồn không muốn sống', 'muốn chết', 'không muốn tồn tại']
    },
    escalationTriggers: ['tự tử', 'chết', 'không muốn sống', 'kết thúc'],
    safetyProtocols: [
      'Kích hoạt crisis intervention',
      'Liên hệ emergency services',
      'Thông báo cho người thân',
      'Theo dõi liên tục'
    ]
  },
  {
    emotion: 'anxiety',
    intensityLevels: {
      low: ['hơi lo', 'chút lo lắng', 'không yên tâm'],
      medium: ['lo lắng', 'không yên', 'bồn chồn'],
      high: ['rất lo lắng', 'hoảng sợ', 'không thể kiểm soát'],
      critical: ['hoảng loạn', 'không thể thở', 'sợ hãi tột độ']
    },
    escalationTriggers: ['hoảng loạn', 'không thở được', 'sợ chết', 'mất kiểm soát'],
    safetyProtocols: [
      'Hướng dẫn breathing exercises',
      'Grounding techniques',
      'Liên hệ chuyên gia tâm lý',
      'Theo dõi triệu chứng'
    ]
  },
  {
    emotion: 'anger',
    intensityLevels: {
      low: ['hơi tức', 'chút bực', 'không hài lòng'],
      medium: ['tức giận', 'bực bội', 'khó chịu'],
      high: ['rất tức', 'giận dữ', 'không thể chịu được'],
      critical: ['muốn đập phá', 'không kiểm soát được', 'tức điên lên']
    },
    escalationTriggers: ['đập phá', 'đánh nhau', 'không kiểm soát', 'tức điên'],
    safetyProtocols: [
      'De-escalation techniques',
      'Anger management strategies',
      'Liên hệ counselor',
      'Đảm bảo an toàn'
    ]
  }
];

// Dữ liệu quản lý trạng thái hội thoại
export const conversationStateData = {
  memoryRetention: {
    shortTerm: 24, // hours
    mediumTerm: 72, // hours  
    longTerm: 168 // hours (1 week)
  },
  
  contextTriggers: [
    'tuần trước', 'hôm qua', 'lần trước', 'trước đó',
    'như đã nói', 'như tôi đã chia sẻ', 'như bạn biết'
  ],
  
  followUpQuestions: [
    'Tình trạng này đã cải thiện chưa?',
    'Bạn có muốn chia sẻ thêm về vấn đề này không?',
    'Có điều gì thay đổi từ lần trước không?',
    'Bạn đã thử những gì tôi gợi ý chưa?'
  ],
  
  empatheticResponses: [
    'Tôi nghe thấy sự mệt mỏi và thất vọng trong lời bạn',
    'Cảm giác này thật sự khó khăn và tôi hiểu điều đó',
    'Việc bạn cảm thấy như vậy là hoàn toàn bình thường',
    'Tôi thấy bạn đang trải qua rất nhiều áp lực',
    'Điều này thật sự không dễ dàng và bạn đã rất mạnh mẽ'
  ]
};

// Hàm nhận diện ý định đa tầng
export function analyzeMultiIntent(userInput: string): MultiIntentData | null {
  const inputLower = userInput.toLowerCase();
  
  for (const intentData of multiIntentData) {
    const hasPrimaryIntent = intentData.complexPatterns.some(pattern => 
      inputLower.includes(pattern.toLowerCase())
    );
    
    if (hasPrimaryIntent) {
      return intentData;
    }
  }
  
  return null;
}

// Hàm phân tích cường độ cảm xúc
export function analyzeSentimentIntensity(userInput: string): {
  emotion: string;
  intensity: 'low' | 'medium' | 'high' | 'critical';
  needsEscalation: boolean;
  safetyProtocol: string[];
} {
  const inputLower = userInput.toLowerCase();
  
  for (const sentimentData of sentimentIntensityData) {
    // Kiểm tra từ critical trước
    for (const criticalPhrase of sentimentData.intensityLevels.critical) {
      if (inputLower.includes(criticalPhrase)) {
        return {
          emotion: sentimentData.emotion,
          intensity: 'critical',
          needsEscalation: true,
          safetyProtocol: sentimentData.safetyProtocols
        };
      }
    }
    
    // Kiểm tra từ high
    for (const highPhrase of sentimentData.intensityLevels.high) {
      if (inputLower.includes(highPhrase)) {
        return {
          emotion: sentimentData.emotion,
          intensity: 'high',
          needsEscalation: true,
          safetyProtocol: sentimentData.safetyProtocols
        };
      }
    }
    
    // Kiểm tra từ medium
    for (const mediumPhrase of sentimentData.intensityLevels.medium) {
      if (inputLower.includes(mediumPhrase)) {
        return {
          emotion: sentimentData.emotion,
          intensity: 'medium',
          needsEscalation: false,
          safetyProtocol: []
        };
      }
    }
    
    // Kiểm tra từ low
    for (const lowPhrase of sentimentData.intensityLevels.low) {
      if (inputLower.includes(lowPhrase)) {
        return {
          emotion: sentimentData.emotion,
          intensity: 'low',
          needsEscalation: false,
          safetyProtocol: []
        };
      }
    }
  }
  
  return {
    emotion: 'neutral',
    intensity: 'low',
    needsEscalation: false,
    safetyProtocol: []
  };
}

// Hàm tạo phản hồi đồng cảm
export function generateEmpatheticResponse(
  userInput: string,
  emotionalState: string,
  intensity: string
): string {
  const empatheticTemplates = [
    `Tôi nghe thấy sự ${emotionalState} trong lời bạn và điều này thật sự khó khăn`,
    `Cảm giác ${emotionalState} này là hoàn toàn bình thường và tôi hiểu bạn`,
    `Tôi thấy bạn đang trải qua rất nhiều ${emotionalState} và bạn đã rất mạnh mẽ`,
    `Việc bạn cảm thấy ${emotionalState} là phản ứng tự nhiên và tôi ở đây để lắng nghe`
  ];
  
  // Chọn template dựa trên intensity
  let templateIndex = 0;
  if (intensity === 'high' || intensity === 'critical') {
    templateIndex = 0; // Template quan tâm nhất
  } else if (intensity === 'medium') {
    templateIndex = 1; // Template đồng cảm
  } else {
    templateIndex = 2; // Template khuyến khích
  }
  
  return empatheticTemplates[templateIndex];
}
