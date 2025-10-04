/**
 * SOULFRIEND V2.0 - Family Relationship Index (FRI)
 * International Scientific Conference on Mental Health Care for Women and Families
 * 
 * Family Relationship Index: Assessment of relationship quality within families
 * Adapted for Vietnamese cultural context with emphasis on collectivistic values
 * 
 * Domains: Communication, Conflict Resolution, Emotional Support, Shared Activities, Respect & Trust
 * Scoring: 1-5 Likert scale, 4 questions per domain, total score 20-100
 */

export interface FamilyRelationshipQuestion {
  id: string;
  domain: 'communication' | 'conflict_resolution' | 'emotional_support' | 'shared_activities' | 'respect_trust';
  vietnameseText: string;
  englishText: string;
  isReversed: boolean; // For negative items that need reverse scoring
  culturalNote?: string;
}

export interface FamilyRelationshipResponse {
  questionId: string;
  score: 1 | 2 | 3 | 4 | 5; // Strongly disagree (1) to Strongly agree (5)
  responseText: string;
}

export interface FamilyRelationshipResult {
  totalScore: number;
  domainScores: {
    communication: number;
    conflict_resolution: number;
    emotional_support: number;
    shared_activities: number;
    respect_trust: number;
  };
  interpretation: 'excellent' | 'good' | 'fair' | 'poor';
  strengthAreas: string[];
  improvementAreas: string[];
  recommendations: string[];
  culturalConsiderations: string[];
}

const familyRelationshipQuestions: FamilyRelationshipQuestion[] = [
  // COMMUNICATION Domain (4 questions)
  {
    id: 'fri_1_comm_open',
    domain: 'communication',
    vietnameseText: 'Các thành viên trong gia đình có thể nói chuyện cởi mở với nhau về mọi vấn đề.',
    englishText: 'Family members can talk openly with each other about any issue.',
    isReversed: false,
    culturalNote: 'Open communication may be limited by hierarchical respect in Vietnamese families'
  },
  {
    id: 'fri_2_comm_listen',
    domain: 'communication',
    vietnameseText: 'Mọi người trong gia đình lắng nghe ý kiến của nhau một cách tôn trọng.',
    englishText: 'Everyone in the family listens to each other\'s opinions respectfully.',
    isReversed: false
  },
  {
    id: 'fri_3_comm_express',
    domain: 'communication',
    vietnameseText: 'Tôi cảm thấy thoải mái khi bày tỏ cảm xúc thật của mình với gia đình.',
    englishText: 'I feel comfortable expressing my true feelings to my family.',
    isReversed: false,
    culturalNote: 'Emotional expression may be more reserved in Vietnamese culture'
  },
  {
    id: 'fri_4_comm_misunderstand',
    domain: 'communication',
    vietnameseText: 'Gia đình tôi thường hiểu lầm những gì tôi cố gắng nói.',
    englishText: 'My family often misunderstands what I\'m trying to say.',
    isReversed: true
  },

  // CONFLICT RESOLUTION Domain (4 questions)
  {
    id: 'fri_5_conflict_resolve',
    domain: 'conflict_resolution',
    vietnameseText: 'Khi có xung đột, gia đình tôi có thể giải quyết một cách bình tĩnh và công bằng.',
    englishText: 'When conflicts arise, my family can resolve them calmly and fairly.',
    isReversed: false
  },
  {
    id: 'fri_6_conflict_avoid',
    domain: 'conflict_resolution',
    vietnameseText: 'Gia đình tôi thường tránh né thay vì giải quyết những vấn đề khó khăn.',
    englishText: 'My family tends to avoid rather than address difficult issues.',
    isReversed: true,
    culturalNote: 'Conflict avoidance may be preferred to maintain harmony in Vietnamese families'
  },
  {
    id: 'fri_7_conflict_compromise',
    domain: 'conflict_resolution',
    vietnameseText: 'Các thành viên trong gia đình sẵn sàng thỏa hiệp để giải quyết bất đồng.',
    englishText: 'Family members are willing to compromise to resolve disagreements.',
    isReversed: false
  },
  {
    id: 'fri_8_conflict_anger',
    domain: 'conflict_resolution',
    vietnameseText: 'Những cuộc cãi vã trong gia đình thường kéo dài và tạo ra nhiều căng thẳng.',
    englishText: 'Arguments in my family tend to drag on and create lasting tension.',
    isReversed: true
  },

  // EMOTIONAL SUPPORT Domain (4 questions)
  {
    id: 'fri_9_support_comfort',
    domain: 'emotional_support',
    vietnameseText: 'Gia đình tôi an ủi và hỗ trợ tôi khi tôi gặp khó khăn.',
    englishText: 'My family comforts and supports me when I\'m going through difficult times.',
    isReversed: false
  },
  {
    id: 'fri_10_support_celebrate',
    domain: 'emotional_support',
    vietnameseText: 'Gia đình tôi chia sẻ niềm vui và ăn mừng thành công của nhau.',
    englishText: 'My family shares joy and celebrates each other\'s successes.',
    isReversed: false
  },
  {
    id: 'fri_11_support_burden',
    domain: 'emotional_support',
    vietnameseText: 'Tôi cảm thấy gia đình coi những vấn đề của tôi như là gánh nặng.',
    englishText: 'I feel like my family sees my problems as a burden.',
    isReversed: true
  },
  {
    id: 'fri_12_support_available',
    domain: 'emotional_support',
    vietnameseText: 'Tôi biết rằng gia đình luôn sẵn sàng hỗ trợ tôi khi cần thiết.',
    englishText: 'I know my family is always available to support me when needed.',
    isReversed: false
  },

  // SHARED ACTIVITIES Domain (4 questions)
  {
    id: 'fri_13_activities_together',
    domain: 'shared_activities',
    vietnameseText: 'Gia đình tôi thường tham gia các hoạt động vui vẻ cùng nhau.',
    englishText: 'My family regularly engages in enjoyable activities together.',
    isReversed: false
  },
  {
    id: 'fri_14_activities_time',
    domain: 'shared_activities',
    vietnameseText: 'Chúng tôi dành thời gian chất lượng bên nhau như một gia đình.',
    englishText: 'We spend quality time together as a family.',
    isReversed: false,
    culturalNote: 'Family time may include extended family activities in Vietnamese culture'
  },
  {
    id: 'fri_15_activities_separate',
    domain: 'shared_activities',
    vietnameseText: 'Các thành viên trong gia đình chủ yếu làm những việc riêng biệt.',
    englishText: 'Family members mostly do separate things.',
    isReversed: true
  },
  {
    id: 'fri_16_activities_traditions',
    domain: 'shared_activities',
    vietnameseText: 'Gia đình tôi duy trì các truyền thống và nghi lễ có ý nghĩa.',
    englishText: 'My family maintains meaningful traditions and rituals.',
    isReversed: false,
    culturalNote: 'Traditional celebrations and ancestor worship are important in Vietnamese families'
  },

  // RESPECT & TRUST Domain (4 questions)
  {
    id: 'fri_17_respect_opinions',
    domain: 'respect_trust',
    vietnameseText: 'Các thành viên trong gia đình tôn trọng ý kiến và quyết định của nhau.',
    englishText: 'Family members respect each other\'s opinions and decisions.',
    isReversed: false
  },
  {
    id: 'fri_18_trust_reliable',
    domain: 'respect_trust',
    vietnameseText: 'Tôi tin tưởng rằng gia đình sẽ luôn đáng tin cậy.',
    englishText: 'I trust that my family will always be reliable.',
    isReversed: false
  },
  {
    id: 'fri_19_respect_privacy',
    domain: 'respect_trust',
    vietnameseText: 'Gia đình tôi tôn trọng quyền riêng tư và ranh giới cá nhân của nhau.',
    englishText: 'My family respects each other\'s privacy and personal boundaries.',
    isReversed: false,
    culturalNote: 'Individual privacy may be less emphasized in collectivistic Vietnamese families'
  },
  {
    id: 'fri_20_trust_secrets',
    domain: 'respect_trust',
    vietnameseText: 'Tôi có thể tin tưởng chia sẻ những điều riêng tư với gia đình.',
    englishText: 'I can trust my family with my personal secrets.',
    isReversed: false
  }
];

const responseOptions = [
  { value: 1, vietnamese: 'Hoàn toàn không đồng ý', english: 'Strongly disagree' },
  { value: 2, vietnamese: 'Không đồng ý', english: 'Disagree' },
  { value: 3, vietnamese: 'Trung lập', english: 'Neutral' },
  { value: 4, vietnamese: 'Đồng ý', english: 'Agree' },
  { value: 5, vietnamese: 'Hoàn toàn đồng ý', english: 'Strongly agree' }
];

function calculateFamilyRelationshipScore(responses: FamilyRelationshipResponse[]): FamilyRelationshipResult {
  if (responses.length !== 20) {
    throw new Error('Family Relationship Index requires exactly 20 responses');
  }

  // Calculate domain scores (4 questions per domain)
  const domainScores = {
    communication: 0,
    conflict_resolution: 0,
    emotional_support: 0,
    shared_activities: 0,
    respect_trust: 0
  };

  let totalScore = 0;

  responses.forEach(response => {
    const question = familyRelationshipQuestions.find(q => q.id === response.questionId);
    let score = response.score;
    
    // Reverse scoring for negative items
    if (question?.isReversed) {
      score = 6 - score; // Convert 1-5 scale to 5-1
    }

    totalScore += score;
    
    if (question) {
      domainScores[question.domain] += score;
    }
  });

  // Determine interpretation
  let interpretation: 'excellent' | 'good' | 'fair' | 'poor';
  if (totalScore >= 80) {
    interpretation = 'excellent';
  } else if (totalScore >= 60) {
    interpretation = 'good';
  } else if (totalScore >= 40) {
    interpretation = 'fair';
  } else {
    interpretation = 'poor';
  }

  // Identify strength and improvement areas
  const strengthAreas = identifyStrengthAreas(domainScores);
  const improvementAreas = identifyImprovementAreas(domainScores);
  
  // Generate recommendations
  const recommendations = generateFamilyRelationshipRecommendations(totalScore, domainScores);
  const culturalConsiderations = generateFamilyRelationshipCulturalConsiderations(domainScores);

  return {
    totalScore,
    domainScores,
    interpretation,
    strengthAreas,
    improvementAreas,
    recommendations,
    culturalConsiderations
  };
}

function identifyStrengthAreas(domainScores: any): string[] {
  const strengths: string[] = [];
  const maxScore = 20; // 4 questions × 5 points each
  
  Object.entries(domainScores).forEach(([domain, score]) => {
    if ((score as number) >= maxScore * 0.75) { // 75% or higher
      switch(domain) {
        case 'communication':
          strengths.push('Giao tiếp trong gia đình rất tốt');
          break;
        case 'conflict_resolution':
          strengths.push('Giải quyết xung đột hiệu quả');
          break;
        case 'emotional_support':
          strengths.push('Hỗ trợ cảm xúc mạnh mẽ');
          break;
        case 'shared_activities':
          strengths.push('Hoạt động chung phong phú');
          break;
        case 'respect_trust':
          strengths.push('Tôn trọng và tin tưởng cao');
          break;
      }
    }
  });
  
  return strengths;
}

function identifyImprovementAreas(domainScores: any): string[] {
  const improvements: string[] = [];
  const maxScore = 20;
  
  Object.entries(domainScores).forEach(([domain, score]) => {
    if ((score as number) < maxScore * 0.5) { // Below 50%
      switch(domain) {
        case 'communication':
          improvements.push('Cần cải thiện giao tiếp trong gia đình');
          break;
        case 'conflict_resolution':
          improvements.push('Cần học cách giải quyết xung đột tốt hơn');
          break;
        case 'emotional_support':
          improvements.push('Cần tăng cường hỗ trợ cảm xúc');
          break;
        case 'shared_activities':
          improvements.push('Cần dành nhiều thời gian hoạt động chung hơn');
          break;
        case 'respect_trust':
          improvements.push('Cần xây dựng lòng tin và tôn trọng');
          break;
      }
    }
  });
  
  return improvements;
}

function generateFamilyRelationshipRecommendations(totalScore: number, domainScores: any): string[] {
  const recommendations: string[] = [];

  if (totalScore >= 80) {
    recommendations.push('Mối quan hệ gia đình của bạn rất xuất sắc. Hãy duy trì những điểm mạnh này.');
    recommendations.push('Có thể hỗ trợ các gia đình khác học hỏi từ kinh nghiệm của bạn.');
  } else if (totalScore >= 60) {
    recommendations.push('Mối quan hệ gia đình tốt, nhưng vẫn có thể cải thiện thêm.');
    // Add specific recommendations based on domain scores
    addDomainSpecificRecommendations(recommendations, domainScores);
  } else if (totalScore >= 40) {
    recommendations.push('Mối quan hệ gia đình cần được cải thiện đáng kể.');
    recommendations.push('Xem xét tham gia khóa học kỹ năng gia đình hoặc tư vấn gia đình.');
    addDomainSpecificRecommendations(recommendations, domainScores);
  } else {
    recommendations.push('Mối quan hệ gia đình đang gặp nhiều khó khăn.');
    recommendations.push('Nên tìm kiếm sự hỗ trợ chuyên nghiệp từ nhà tâm lý học gia đình.');
    recommendations.push('Xem xét tham gia liệu pháp gia đình để cải thiện mối quan hệ.');
  }

  return recommendations;
}

function addDomainSpecificRecommendations(recommendations: string[], domainScores: any): void {
  const maxScore = 20;
  
  if (domainScores.communication < maxScore * 0.6) {
    recommendations.push('Thực hành lắng nghe tích cực và giao tiếp cởi mở hơn.');
  }
  
  if (domainScores.conflict_resolution < maxScore * 0.6) {
    recommendations.push('Học các kỹ năng giải quyết xung đột một cách bình tĩnh và công bằng.');
  }
  
  if (domainScores.emotional_support < maxScore * 0.6) {
    recommendations.push('Tăng cường thể hiện sự quan tâm và hỗ trợ cảm xúc cho nhau.');
  }
  
  if (domainScores.shared_activities < maxScore * 0.6) {
    recommendations.push('Lên kế hoạch cho các hoạt động gia đình thường xuyên hơn.');
  }
  
  if (domainScores.respect_trust < maxScore * 0.6) {
    recommendations.push('Xây dựng lòng tin thông qua việc thực hiện lời hứa và tôn trọng ranh giới.');
  }
}

function generateFamilyRelationshipCulturalConsiderations(domainScores: any): string[] {
  const considerations: string[] = [];

  considerations.push('Trong văn hóa Việt Nam, hòa hợp gia đình được đề cao và xung đột thường được tránh.');
  
  if (domainScores.communication < 15) {
    considerations.push('Giao tiếp có thể bị ảnh hưởng bởi thứ bậc trong gia đình - cân bằng tôn trọng và cởi mở.');
  }
  
  if (domainScores.conflict_resolution < 15) {
    considerations.push('Việc tránh xung đột để giữ "thể diện" có thể cản trở việc giải quyết vấn đề.');
  }
  
  if (domainScores.shared_activities < 15) {
    considerations.push('Xem xét bao gồm gia đình mở rộng trong các hoạt động chung.');
  }

  considerations.push('Cân bằng giữa các giá trị truyền thống và nhu cầu hiện đại của gia đình.');
  considerations.push('Tôn trọng vai trò của người lớn tuổi trong việc ra quyết định gia đình.');

  return considerations;
}

const familyRelationshipTest = {
  testInfo: {
    id: 'FAMILY_RELATIONSHIP_INDEX',
    name: 'Family Relationship Index',
    vietnameseName: 'Chỉ Số Mối Quan Hệ Gia Đình',
    description: 'Đánh giá chất lượng mối quan hệ trong gia đình qua 5 lĩnh vực: Giao tiếp, Giải quyết xung đột, Hỗ trợ cảm xúc, Hoạt động chung, Tôn trọng & Tin tưởng',
    version: '2.0',
    category: 'family_assessment',
    culturalContext: 'vietnamese',
    targetDemographic: 'family_members',
    estimatedTime: '10-15 minutes',
    domains: ['communication', 'conflict_resolution', 'emotional_support', 'shared_activities', 'respect_trust'],
    scoring: {
      min: 20,
      max: 100,
      interpretation: {
        'excellent': { range: '80-100', description: 'Mối quan hệ gia đình xuất sắc' },
        'good': { range: '60-79', description: 'Mối quan hệ gia đình tốt' },
        'fair': { range: '40-59', description: 'Mối quan hệ gia đình trung bình' },
        'poor': { range: '20-39', description: 'Mối quan hệ gia đình kém' }
      }
    }
  },
  questions: familyRelationshipQuestions,
  responseOptions,
  calculateScore: calculateFamilyRelationshipScore
};

export default familyRelationshipTest;