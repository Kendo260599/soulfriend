/**
 * Feedback & Improvement Data - Dữ liệu đánh giá và cải tiến
 * Để duy trì sự "hoàn hảo" của chatbot
 */

export interface InteractionRating {
  id: string;
  sessionId: string;
  userId: string;
  timestamp: Date;
  userInput: string;
  botResponse: string;
  rating: 1 | 2 | 3 | 4 | 5;
  helpfulness: 'not_helpful' | 'somewhat_helpful' | 'helpful' | 'very_helpful';
  emotionalImpact: 'negative' | 'neutral' | 'positive';
  specificFeedback?: string;
  improvementSuggestions?: string[];
}

export interface KnowledgeGap {
  id: string;
  userQuestion: string;
  botResponse: string;
  gapType: 'no_response' | 'inadequate_response' | 'incorrect_response' | 'outdated_info';
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  frequency: number;
  firstReported: Date;
  lastReported: Date;
  resolutionStatus: 'open' | 'in_progress' | 'resolved' | 'closed';
  resolutionNotes?: string;
}

export interface InteractionPattern {
  id: string;
  patternType:
    | 'emotional_escalation'
    | 'topic_shift'
    | 'user_dissatisfaction'
    | 'successful_resolution';
  triggerPhrases: string[];
  context: string;
  frequency: number;
  successRate: number;
  improvementOpportunities: string[];
  bestPractices: string[];
}

export interface ConversationQuality {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  messageCount: number;
  emotionalProgression: EmotionalProgression[];
  resolutionAchieved: boolean;
  userSatisfaction: number;
  qualityScore: number;
  improvementAreas: string[];
}

export interface EmotionalProgression {
  timestamp: Date;
  emotion: string;
  intensity: 'low' | 'medium' | 'high' | 'critical';
  trigger: string;
  botResponse: string;
  userReaction: 'positive' | 'neutral' | 'negative';
}

// Dữ liệu đánh giá tương tác
export const ratingCriteria = {
  helpfulness: {
    not_helpful: {
      score: 1,
      description: 'Phản hồi không hữu ích hoặc không liên quan',
      improvement: 'Cần cải thiện relevance và accuracy',
    },
    somewhat_helpful: {
      score: 2,
      description: 'Phản hồi có một phần hữu ích nhưng chưa đầy đủ',
      improvement: 'Cần cung cấp thêm thông tin chi tiết',
    },
    helpful: {
      score: 3,
      description: 'Phản hồi hữu ích và đáp ứng được nhu cầu cơ bản',
      improvement: 'Có thể cải thiện personalization',
    },
    very_helpful: {
      score: 4,
      description: 'Phản hồi rất hữu ích và cá nhân hóa tốt',
      improvement: 'Duy trì chất lượng hiện tại',
    },
  },

  emotionalImpact: {
    negative: {
      description: 'Phản hồi gây cảm xúc tiêu cực',
      action: 'Cần review và cải thiện empathy',
    },
    neutral: {
      description: 'Phản hồi không có tác động cảm xúc rõ rệt',
      action: 'Cần tăng cường emotional connection',
    },
    positive: {
      description: 'Phản hồi tạo cảm xúc tích cực',
      action: 'Duy trì và nhân rộng approach này',
    },
  },
};

// Dữ liệu nhận diện lỗ hổng kiến thức
export const knowledgeGapCategories = [
  'mental_health_conditions',
  'treatment_options',
  'crisis_intervention',
  'cultural_context',
  'family_dynamics',
  'work_life_balance',
  'relationship_issues',
  'self_care_techniques',
  'professional_resources',
  'emergency_procedures',
];

// Dữ liệu mẫu interaction patterns
export const interactionPatterns: InteractionPattern[] = [
  {
    id: 'emotional_escalation',
    patternType: 'emotional_escalation',
    triggerPhrases: [
      'không hiểu tôi',
      'bạn không giúp được gì',
      'tôi cần ai đó thật',
      'chatbot không thể hiểu',
      'tôi muốn nói chuyện với người thật',
    ],
    context: 'User expresses frustration with bot responses',
    frequency: 15,
    successRate: 0.3,
    improvementOpportunities: [
      'Tăng cường empathy trong responses',
      'Cải thiện emotional recognition',
      'Thêm human-like elements',
      'Cung cấp escalation options',
    ],
    bestPractices: [
      'Acknowledge limitations honestly',
      'Offer alternative support options',
      'Validate user emotions',
      'Provide clear next steps',
    ],
  },
  {
    id: 'successful_resolution',
    patternType: 'successful_resolution',
    triggerPhrases: [
      'cảm ơn bạn',
      'điều này giúp tôi',
      'tôi hiểu rồi',
      'bạn đã giúp tôi',
      'tôi cảm thấy tốt hơn',
    ],
    context: 'User expresses satisfaction with bot interaction',
    frequency: 45,
    successRate: 0.9,
    improvementOpportunities: [
      'Nhân rộng successful approaches',
      'Document effective strategies',
      'Train on successful patterns',
    ],
    bestPractices: [
      'Maintain empathetic tone',
      'Provide actionable advice',
      'Follow up appropriately',
      'Validate user experiences',
    ],
  },
];

// Hàm đánh giá chất lượng tương tác
export function evaluateInteractionQuality(
  userInput: string,
  botResponse: string,
  userReaction: string,
  sessionContext: any
): {
  qualityScore: number;
  improvementAreas: string[];
  recommendations: string[];
} {
  let qualityScore = 0;
  const improvementAreas: string[] = [];
  const recommendations: string[] = [];

  // Đánh giá relevance
  const relevanceScore = evaluateRelevance(userInput, botResponse);
  qualityScore += relevanceScore * 0.3;

  // Đánh giá empathy
  const empathyScore = evaluateEmpathy(botResponse);
  qualityScore += empathyScore * 0.25;

  // Đánh giá helpfulness
  const helpfulnessScore = evaluateHelpfulness(botResponse);
  qualityScore += helpfulnessScore * 0.25;

  // Đánh giá safety
  const safetyScore = evaluateSafety(userInput, botResponse);
  qualityScore += safetyScore * 0.2;

  // Xác định improvement areas
  if (relevanceScore < 0.6) {
    improvementAreas.push('relevance');
    recommendations.push('Cải thiện khả năng hiểu context và intent');
  }

  if (empathyScore < 0.6) {
    improvementAreas.push('empathy');
    recommendations.push('Tăng cường emotional intelligence và empathy');
  }

  if (helpfulnessScore < 0.6) {
    improvementAreas.push('helpfulness');
    recommendations.push('Cung cấp thông tin hữu ích và actionable hơn');
  }

  if (safetyScore < 0.8) {
    improvementAreas.push('safety');
    recommendations.push('Cải thiện crisis detection và safety protocols');
  }

  return {
    qualityScore: Math.round(qualityScore * 100) / 100,
    improvementAreas,
    recommendations,
  };
}

// Hàm đánh giá relevance
function evaluateRelevance(userInput: string, botResponse: string): number {
  const inputKeywords = extractKeywords(userInput);
  const responseKeywords = extractKeywords(botResponse);

  const overlap = inputKeywords.filter(keyword => responseKeywords.includes(keyword)).length;

  return overlap / Math.max(inputKeywords.length, 1);
}

// Hàm đánh giá empathy
function evaluateEmpathy(botResponse: string): number {
  const empathyIndicators = [
    'tôi hiểu',
    'tôi cảm thấy',
    'tôi nghe thấy',
    'điều này khó khăn',
    'bạn không cô đơn',
    'hoàn toàn bình thường',
    'tôi ở đây',
  ];

  const empathyCount = empathyIndicators.filter(indicator =>
    botResponse.toLowerCase().includes(indicator)
  ).length;

  return Math.min(empathyCount / 3, 1);
}

// Hàm đánh giá helpfulness
function evaluateHelpfulness(botResponse: string): number {
  const helpfulnessIndicators = [
    'bạn có thể thử',
    'tôi khuyên bạn',
    'hãy thử',
    'có thể giúp',
    'resources',
    'liên hệ',
    'tìm kiếm',
  ];

  const helpfulnessCount = helpfulnessIndicators.filter(indicator =>
    botResponse.toLowerCase().includes(indicator)
  ).length;

  return Math.min(helpfulnessCount / 2, 1);
}

// Hàm đánh giá safety
function evaluateSafety(userInput: string, botResponse: string): number {
  const crisisTriggers = ['tự tử', 'chết', 'không muốn sống'];
  const hasCrisisTrigger = crisisTriggers.some(trigger =>
    userInput.toLowerCase().includes(trigger)
  );

  if (hasCrisisTrigger) {
    const safetyIndicators = [
      'quan tâm',
      'không cô đơn',
      'liên hệ',
      'chuyên gia',
      'khẩn cấp',
      'hotline',
    ];

    const safetyCount = safetyIndicators.filter(indicator =>
      botResponse.toLowerCase().includes(indicator)
    ).length;

    return safetyCount >= 2 ? 1 : 0.5;
  }

  return 1; // No crisis detected, safety is maintained
}

// Hàm extract keywords
function extractKeywords(text: string): string[] {
  const stopWords = ['tôi', 'bạn', 'của', 'và', 'với', 'cho', 'để', 'là', 'có', 'không'];

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word));
}

// Hàm phát hiện knowledge gap
export function identifyKnowledgeGap(
  userQuestion: string,
  botResponse: string,
  userSatisfaction: number
): KnowledgeGap | null {
  if (userSatisfaction >= 3) {
    return null; // No gap if user is satisfied
  }

  let gapType: 'no_response' | 'inadequate_response' | 'incorrect_response' | 'outdated_info';

  if (botResponse.length < 50) {
    gapType = 'no_response';
  } else if (userSatisfaction <= 2) {
    gapType = 'inadequate_response';
  } else {
    gapType = 'incorrect_response';
  }

  // Determine category based on question content
  const category = determineCategory(userQuestion);

  return {
    id: `gap_${Date.now()}`,
    userQuestion,
    botResponse,
    gapType,
    category,
    priority: userSatisfaction === 1 ? 'critical' : 'medium',
    frequency: 1,
    firstReported: new Date(),
    lastReported: new Date(),
    resolutionStatus: 'open',
  };
}

// Hàm xác định category
function determineCategory(question: string): string {
  const questionLower = question.toLowerCase();

  for (const category of knowledgeGapCategories) {
    const categoryKeywords = getCategoryKeywords(category);
    if (categoryKeywords.some(keyword => questionLower.includes(keyword))) {
      return category;
    }
  }

  return 'general';
}

// Hàm lấy keywords cho category
function getCategoryKeywords(category: string): string[] {
  const categoryMap: Record<string, string[]> = {
    mental_health_conditions: ['trầm cảm', 'lo âu', 'stress', 'rối loạn'],
    treatment_options: ['điều trị', 'thuốc', 'liệu pháp', 'chữa'],
    crisis_intervention: ['khủng hoảng', 'khẩn cấp', 'nguy hiểm'],
    cultural_context: ['văn hóa', 'gia đình', 'xã hội', 'truyền thống'],
    family_dynamics: ['gia đình', 'chồng', 'con', 'mẹ chồng'],
    work_life_balance: ['công việc', 'cân bằng', 'thời gian'],
    relationship_issues: ['mối quan hệ', 'tình yêu', 'hôn nhân'],
    self_care_techniques: ['tự chăm sóc', 'thư giãn', 'tập thể dục'],
    professional_resources: ['chuyên gia', 'bác sĩ', 'tư vấn'],
    emergency_procedures: ['khẩn cấp', 'cấp cứu', 'nguy hiểm'],
  };

  return categoryMap[category] || [];
}
