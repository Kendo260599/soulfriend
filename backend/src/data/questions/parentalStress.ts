/**
 * SOULFRIEND V2.0 - Parental Stress Scale (PSS)
 * International Scientific Conference on Mental Health Care for Women and Families
 * 
 * Parental Stress Scale: Assessment of stress levels in parenting role
 * Originally developed by Berry & Jones (1995), adapted for Vietnamese mothers
 * 
 * Domains: Parental Rewards, Parental Stressors, Lack of Control, Parental Satisfaction
 * Scoring: 1-5 Likert scale, 18 items (mixed positive/negative), reverse scoring for positive items
 */

export interface ParentalStressQuestion {
  id: string;
  domain: 'parental_rewards' | 'parental_stressors' | 'lack_of_control' | 'parental_satisfaction';
  vietnameseText: string;
  englishText: string;
  isPositive: boolean; // Positive items need reverse scoring
  culturalNote?: string;
}

export interface ParentalStressResponse {
  questionId: string;
  score: 1 | 2 | 3 | 4 | 5; // Strongly disagree (1) to Strongly agree (5)
  responseText: string;
}

export interface ParentalStressResult {
  totalScore: number;
  domainScores: {
    parental_rewards: number;
    parental_stressors: number;
    lack_of_control: number;
    parental_satisfaction: number;
  };
  interpretation: 'low_stress' | 'moderate_stress' | 'high_stress';
  stressFactors: string[];
  protectiveFactors: string[];
  recommendations: string[];
  culturalConsiderations: string[];
}

const parentalStressQuestions: ParentalStressQuestion[] = [
  // PARENTAL REWARDS Domain (Positive items)
  {
    id: 'pss_1_happy',
    domain: 'parental_rewards',
    vietnameseText: 'Tôi hạnh phúc với vai trò làm cha/mẹ.',
    englishText: 'I am happy in my role as a parent.',
    isPositive: true
  },
  {
    id: 'pss_2_meaning',
    domain: 'parental_rewards',
    vietnameseText: 'Việc có con đã mang lại ý nghĩa hơn cho cuộc sống của tôi.',
    englishText: 'Having children has given more meaning to my life.',
    isPositive: true,
    culturalNote: 'Children are traditionally seen as bringing honor and continuation to Vietnamese families'
  },
  {
    id: 'pss_3_enjoy',
    domain: 'parental_rewards',
    vietnameseText: 'Tôi thực sự thích dành thời gian với con/các con mình.',
    englishText: 'I really enjoy spending time with my child/children.',
    isPositive: true
  },
  {
    id: 'pss_4_proud',
    domain: 'parental_satisfaction',
    vietnameseText: 'Tôi cảm thấy tự hào về con/các con mình.',
    englishText: 'I feel proud of my child/children.',
    isPositive: true
  },

  // PARENTAL STRESSORS Domain (Negative items)
  {
    id: 'pss_5_tired',
    domain: 'parental_stressors',
    vietnameseText: 'Việc chăm sóc con/các con khiến tôi cảm thấy mệt mỏi hơn tôi từng nghĩ.',
    englishText: 'Caring for my child/children is more tiring than I ever expected.',
    isPositive: false
  },
  {
    id: 'pss_6_demands',
    domain: 'parental_stressors',
    vietnameseText: 'Những đòi hỏi của con/các con đôi khi khiến tôi cảm thấy quá tải.',
    englishText: 'The demands of my child/children sometimes feel overwhelming.',
    isPositive: false
  },
  {
    id: 'pss_7_behavior',
    domain: 'parental_stressors',
    vietnameseText: 'Hành vi của con/các con thường gây căng thẳng cho tôi.',
    englishText: 'My child\'s/children\'s behavior often stresses me out.',
    isPositive: false
  },
  {
    id: 'pss_8_financial',
    domain: 'parental_stressors',
    vietnameseText: 'Chi phí nuôi con/các con tạo áp lực tài chính lớn cho gia đình.',
    englishText: 'The cost of raising my child/children creates significant financial pressure.',
    isPositive: false,
    culturalNote: 'Financial stress is particularly acute for Vietnamese families investing heavily in children\'s education'
  },
  {
    id: 'pss_9_worry',
    domain: 'parental_stressors',
    vietnameseText: 'Tôi thường xuyên lo lắng về tương lai của con/các con.',
    englishText: 'I frequently worry about my child\'s/children\'s future.',
    isPositive: false,
    culturalNote: 'Vietnamese parents often feel intense pressure for children\'s academic and career success'
  },

  // LACK OF CONTROL Domain (Negative items)
  {
    id: 'pss_10_control',
    domain: 'lack_of_control',
    vietnameseText: 'Tôi cảm thấy mất kiểm soát cuộc sống của mình kể từ khi có con.',
    englishText: 'I feel like I have lost control of my life since having children.',
    isPositive: false
  },
  {
    id: 'pss_11_freedom',
    domain: 'lack_of_control',
    vietnameseText: 'Tôi ít có thời gian tự do cho bản thân hơn tôi mong muốn.',
    englishText: 'I have less personal freedom than I would like.',
    isPositive: false
  },
  {
    id: 'pss_12_decisions',
    domain: 'lack_of_control',
    vietnameseText: 'Tôi khó khăn trong việc đưa ra quyết định về cách nuôi dạy con.',
    englishText: 'I have difficulty making decisions about how to raise my child/children.',
    isPositive: false
  },
  {
    id: 'pss_13_overwhelmed',
    domain: 'lack_of_control',
    vietnameseText: 'Tôi cảm thấy choáng ngợp với trách nhiệm làm cha/mẹ.',
    englishText: 'I feel overwhelmed by parental responsibilities.',
    isPositive: false
  },

  // Mixed items - Parental Satisfaction/Rewards
  {
    id: 'pss_14_fulfilling',
    domain: 'parental_satisfaction',
    vietnameseText: 'Làm cha/mẹ là trải nghiệm hoàn thiện nhất trong đời tôi.',
    englishText: 'Being a parent is the most fulfilling experience of my life.',
    isPositive: true
  },
  {
    id: 'pss_15_regret',
    domain: 'parental_satisfaction',
    vietnameseText: 'Đôi khi tôi hối hận vì đã quyết định có con.',
    englishText: 'Sometimes I regret the decision to have children.',
    isPositive: false,
    culturalNote: 'This may be particularly sensitive in Vietnamese culture where parenthood is highly valued'
  },

  // Additional Parental Stressors
  {
    id: 'pss_16_isolation',
    domain: 'parental_stressors',
    vietnameseText: 'Tôi cảm thấy cô đơn và bị cô lập kể từ khi có con.',
    englishText: 'I feel lonely and isolated since having children.',
    isPositive: false,
    culturalNote: 'Social isolation may be compounded by expectations for mothers to be primary caregivers'
  },
  {
    id: 'pss_17_support',
    domain: 'parental_rewards',
    vietnameseText: 'Tôi nhận được sự hỗ trợ tốt từ gia đình trong việc nuôi dạy con.',
    englishText: 'I receive good support from my family in raising my children.',
    isPositive: true,
    culturalNote: 'Extended family support is traditionally strong in Vietnamese culture'
  },
  {
    id: 'pss_18_expectations',
    domain: 'parental_stressors',
    vietnameseText: 'Áp lực từ xã hội về cách nuôi dạy con khiến tôi căng thẳng.',
    englishText: 'Social pressure about how to raise children causes me stress.',
    isPositive: false,
    culturalNote: 'Vietnamese parents face intense social expectations about children\'s academic performance and behavior'
  }
];

const responseOptions = [
  { value: 1, vietnamese: 'Hoàn toàn không đồng ý', english: 'Strongly disagree' },
  { value: 2, vietnamese: 'Không đồng ý', english: 'Disagree' },
  { value: 3, vietnamese: 'Trung lập', english: 'Neutral' },
  { value: 4, vietnamese: 'Đồng ý', english: 'Agree' },
  { value: 5, vietnamese: 'Hoàn toàn đồng ý', english: 'Strongly agree' }
];

function calculateParentalStressScore(responses: ParentalStressResponse[]): ParentalStressResult {
  if (responses.length !== 18) {
    throw new Error('Parental Stress Scale requires exactly 18 responses');
  }

  // Initialize domain scores
  const domainScores = {
    parental_rewards: 0,
    parental_stressors: 0,
    lack_of_control: 0,
    parental_satisfaction: 0
  };

  let totalScore = 0;

  responses.forEach(response => {
    const question = parentalStressQuestions.find(q => q.id === response.questionId);
    let score = response.score;
    
    // Reverse scoring for positive items (lower stress when agreeing with positive statements)
    if (question?.isPositive) {
      score = 6 - score; // Convert 1-5 scale to 5-1 for positive items
    }

    totalScore += score;
    
    if (question) {
      domainScores[question.domain] += score;
    }
  });

  // Determine interpretation based on total score
  let interpretation: 'low_stress' | 'moderate_stress' | 'high_stress';
  if (totalScore <= 54) {
    interpretation = 'low_stress';
  } else if (totalScore <= 72) {
    interpretation = 'moderate_stress';
  } else {
    interpretation = 'high_stress';
  }

  // Identify stress factors and protective factors
  const stressFactors = identifyStressFactors(responses);
  const protectiveFactors = identifyProtectiveFactors(responses);
  
  // Generate recommendations
  const recommendations = generateParentalStressRecommendations(totalScore, domainScores);
  const culturalConsiderations = generateParentalStressCulturalConsiderations(domainScores);

  return {
    totalScore,
    domainScores,
    interpretation,
    stressFactors,
    protectiveFactors,
    recommendations,
    culturalConsiderations
  };
}

function identifyStressFactors(responses: ParentalStressResponse[]): string[] {
  const stressFactors: string[] = [];
  
  responses.forEach(response => {
    const question = parentalStressQuestions.find(q => q.id === response.questionId);
    
    // High scores on negative items indicate stress factors
    if (!question?.isPositive && response.score >= 4) {
      switch(response.questionId) {
        case 'pss_5_tired':
          stressFactors.push('Mệt mỏi từ việc chăm sóc con');
          break;
        case 'pss_6_demands':
          stressFactors.push('Cảm thấy quá tải với nhu cầu của con');
          break;
        case 'pss_7_behavior':
          stressFactors.push('Căng thẳng từ hành vi của con');
          break;
        case 'pss_8_financial':
          stressFactors.push('Áp lực tài chính trong việc nuôi con');
          break;
        case 'pss_9_worry':
          stressFactors.push('Lo lắng về tương lai của con');
          break;
        case 'pss_10_control':
          stressFactors.push('Cảm giác mất kiểm soát cuộc sống');
          break;
        case 'pss_11_freedom':
          stressFactors.push('Thiếu thời gian tự do cá nhân');
          break;
        case 'pss_16_isolation':
          stressFactors.push('Cảm giác cô đơn và bị cô lập');
          break;
        case 'pss_18_expectations':
          stressFactors.push('Áp lực xã hội về cách nuôi dạy con');
          break;
      }
    }
  });
  
  return stressFactors;
}

function identifyProtectiveFactors(responses: ParentalStressResponse[]): string[] {
  const protectiveFactors: string[] = [];
  
  responses.forEach(response => {
    const question = parentalStressQuestions.find(q => q.id === response.questionId);
    
    // High scores on positive items indicate protective factors
    if (question?.isPositive && response.score >= 4) {
      switch(response.questionId) {
        case 'pss_1_happy':
          protectiveFactors.push('Hạnh phúc với vai trò làm cha/mẹ');
          break;
        case 'pss_2_meaning':
          protectiveFactors.push('Con cái mang lại ý nghĩa cho cuộc sống');
          break;
        case 'pss_3_enjoy':
          protectiveFactors.push('Thích thú khi dành thời gian với con');
          break;
        case 'pss_4_proud':
          protectiveFactors.push('Tự hào về con cái');
          break;
        case 'pss_14_fulfilling':
          protectiveFactors.push('Làm cha/mẹ là trải nghiệm hoàn thiện');
          break;
        case 'pss_17_support':
          protectiveFactors.push('Nhận được hỗ trợ tốt từ gia đình');
          break;
      }
    }
  });
  
  return protectiveFactors;
}

function generateParentalStressRecommendations(totalScore: number, domainScores: any): string[] {
  const recommendations: string[] = [];

  if (totalScore <= 54) {
    recommendations.push('Mức độ căng thẳng trong vai trò làm cha/mẹ của bạn ở mức thấp.');
    recommendations.push('Tiếp tục duy trì những chiến lược đối phó tích cực hiện tại.');
    recommendations.push('Có thể hỗ trợ các cha/mẹ khác đang gặp khó khăn.');
  } else if (totalScore <= 72) {
    recommendations.push('Bạn đang trải qua mức độ căng thẳng vừa phải trong vai trò làm cha/mẹ.');
    recommendations.push('Xem xét học các kỹ năng quản lý căng thẳng và chăm sóc bản thân.');
    
    // Domain specific recommendations
    if (domainScores.parental_stressors > 25) {
      recommendations.push('Tìm cách giảm các yếu tố gây căng thẳng trong việc nuôi dạy con.');
    }
    
    if (domainScores.lack_of_control > 20) {
      recommendations.push('Học các kỹ năng quản lý thời gian và đặt ranh giới cá nhân.');
    }
  } else {
    recommendations.push('Bạn đang trải qua mức độ căng thẳng cao trong vai trò làm cha/mẹ.');
    recommendations.push('Nên tìm kiếm sự hỗ trợ chuyên nghiệp từ tâm lý học hoặc tư vấn viên.');
    recommendations.push('Tham gia nhóm hỗ trợ cha/mẹ hoặc khóa học kỹ năng nuôi dạy con.');
    recommendations.push('Ưu tiên chăm sóc sức khỏe tâm thần của bản thân.');
  }

  // General recommendations
  recommendations.push('Dành thời gian cho các hoạt động chăm sóc bản thân.');
  recommendations.push('Tìm kiếm và duy trì mạng lưới hỗ trợ xã hội.');
  recommendations.push('Thiết lập kỳ vọng thực tế về việc làm cha/mẹ.');

  return recommendations;
}

function generateParentalStressCulturalConsiderations(domainScores: any): string[] {
  const considerations: string[] = [];

  considerations.push('Trong văn hóa Việt Nam, làm cha/mẹ được xem là vai trò thiêng liêng và trách nhiệm lớn.');
  considerations.push('Kỳ vọng xã hội về thành công học tập của con có thể tạo áp lực lớn cho cha/mẹ.');
  
  if (domainScores.parental_stressors > 25) {
    considerations.push('Áp lực "Tiger Parenting" có thể gây căng thẳng cho cả cha/mẹ và con cái.');
    considerations.push('Cân bằng giữa kỳ vọng cao và sức khỏe tâm thần của gia đình.');
  }
  
  if (domainScores.lack_of_control > 20) {
    considerations.push('Vai trò truyền thống của người mẹ như người chăm sóc chính có thể gây căng thẳng.');
    considerations.push('Chia sẻ trách nhiệm nuôi dạy con với các thành viên gia đình khác.');
  }

  considerations.push('Tận dụng hệ thống hỗ trợ gia đình mở rộng trong văn hóa Việt Nam.');
  considerations.push('Cân bằng giữa các giá trị truyền thống và phương pháp nuôi dạy con hiện đại.');

  return considerations;
}

const parentalStressTest = {
  testInfo: {
    id: 'PARENTAL_STRESS_SCALE',
    name: 'Parental Stress Scale (PSS)',
    vietnameseName: 'Thang Đo Căng Thẳng Của Cha Mẹ',
    description: 'Đánh giá mức độ căng thẳng trong vai trò làm cha/mẹ qua 4 lĩnh vực: Phần thưởng, Căng thẳng, Mất kiểm soát, Hài lòng',
    version: '2.0',
    category: 'family_assessment',
    culturalContext: 'vietnamese',
    targetDemographic: 'parents',
    estimatedTime: '10-15 minutes',
    domains: ['parental_rewards', 'parental_stressors', 'lack_of_control', 'parental_satisfaction'],
    scoring: {
      min: 18,
      max: 90,
      interpretation: {
        'low_stress': { range: '18-54', description: 'Mức độ căng thẳng thấp' },
        'moderate_stress': { range: '55-72', description: 'Mức độ căng thẳng vừa phải' },
        'high_stress': { range: '73-90', description: 'Mức độ căng thẳng cao' }
      }
    },
    culturalNote: 'Đặc biệt phù hợp cho các bà mẹ Việt Nam đang đối mặt với áp lực xã hội về việc nuôi dạy con'
  },
  questions: parentalStressQuestions,
  responseOptions,
  calculateScore: calculateParentalStressScore
};

export default parentalStressTest;