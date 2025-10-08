/**
 * SOULFRIEND V2.0 - Family APGAR Scale
 * International Scientific Conference on Mental Health Care for Women and Families
 *
 * Family APGAR: Assessment of family functioning across 5 domains
 * Originally developed by Smilkstein (1978), adapted for Vietnamese families
 *
 * Domains: Adaptation, Partnership, Growth, Affection, Resolve
 * Scoring: 0-2 per question, total score 0-10
 */

export interface FamilyAPGARQuestion {
  id: string;
  domain: 'adaptation' | 'partnership' | 'growth' | 'affection' | 'resolve';
  vietnameseText: string;
  englishText: string;
  culturalNote?: string;
}

export interface FamilyAPGARResponse {
  questionId: string;
  score: 0 | 1 | 2; // Almost never (0), Some of the time (1), Almost always (2)
  responseText: string;
}

export interface FamilyAPGARResult {
  totalScore: number;
  domainScores: {
    adaptation: number;
    partnership: number;
    growth: number;
    affection: number;
    resolve: number;
  };
  interpretation: 'highly_functional' | 'moderately_dysfunctional' | 'severely_dysfunctional';
  recommendations: string[];
  culturalConsiderations: string[];
}

const familyAPGARQuestions: FamilyAPGARQuestion[] = [
  {
    id: 'apgar_1_adaptation',
    domain: 'adaptation',
    vietnameseText: 'Tôi hài lòng với sự hỗ trợ tôi nhận được từ gia đình khi có khó khăn.',
    englishText:
      'I am satisfied with the help I receive from my family when something is troubling me.',
    culturalNote:
      'Vietnamese families traditionally provide strong support during crises - consider extended family involvement',
  },
  {
    id: 'apgar_2_partnership',
    domain: 'partnership',
    vietnameseText: 'Tôi hài lòng với cách gia đình tôi thảo luận và chia sẻ vấn đề với nhau.',
    englishText:
      'I am satisfied with the way my family talks over things with me and shares problems with me.',
    culturalNote:
      'Hierarchical communication patterns may affect open discussion - respect for elders is important',
  },
  {
    id: 'apgar_3_growth',
    domain: 'growth',
    vietnameseText:
      'Tôi hài lòng với việc gia đình chấp nhận và ủng hộ mong muốn tham gia hoạt động mới của tôi.',
    englishText:
      'I am satisfied that my family accepts and supports my wishes to take on new activities or directions.',
    culturalNote:
      'Balance between individual growth and family expectations is crucial in Vietnamese culture',
  },
  {
    id: 'apgar_4_affection',
    domain: 'affection',
    vietnameseText:
      'Tôi hài lòng với cách gia đình thể hiện tình cảm và phản hồi với cảm xúc của tôi.',
    englishText:
      'I am satisfied with the way my family expresses affection and responds to my emotions.',
    culturalNote:
      'Emotional expression may be more subtle in Vietnamese families - actions often speak louder than words',
  },
  {
    id: 'apgar_5_resolve',
    domain: 'resolve',
    vietnameseText: 'Tôi hài lòng với thời gian gia đình dành cho nhau.',
    englishText: 'I am satisfied with the time my family and I spend together.',
    culturalNote:
      'Quality time together is highly valued in Vietnamese families, including extended family activities',
  },
];

const responseOptions = [
  { value: 0, vietnamese: 'Hầu như không bao giờ', english: 'Almost never' },
  { value: 1, vietnamese: 'Thỉnh thoảng', english: 'Some of the time' },
  { value: 2, vietnamese: 'Hầu như luôn luôn', english: 'Almost always' },
];

function calculateFamilyAPGARScore(responses: FamilyAPGARResponse[]): FamilyAPGARResult {
  if (responses.length !== 5) {
    throw new Error('Family APGAR requires exactly 5 responses');
  }

  // Calculate total score
  const totalScore = responses.reduce((sum, response) => sum + response.score, 0);

  // Calculate domain scores (1 question per domain)
  const domainScores = {
    adaptation: responses.find(r => r.questionId.includes('adaptation'))?.score || 0,
    partnership: responses.find(r => r.questionId.includes('partnership'))?.score || 0,
    growth: responses.find(r => r.questionId.includes('growth'))?.score || 0,
    affection: responses.find(r => r.questionId.includes('affection'))?.score || 0,
    resolve: responses.find(r => r.questionId.includes('resolve'))?.score || 0,
  };

  // Determine interpretation
  let interpretation: 'highly_functional' | 'moderately_dysfunctional' | 'severely_dysfunctional';
  if (totalScore >= 8) {
    interpretation = 'highly_functional';
  } else if (totalScore >= 4) {
    interpretation = 'moderately_dysfunctional';
  } else {
    interpretation = 'severely_dysfunctional';
  }

  // Generate recommendations based on score and cultural context
  const recommendations = generateFamilyAPGARRecommendations(totalScore, domainScores);
  const culturalConsiderations = generateCulturalConsiderations(domainScores);

  return {
    totalScore,
    domainScores,
    interpretation,
    recommendations,
    culturalConsiderations,
  };
}

function generateFamilyAPGARRecommendations(totalScore: number, domainScores: any): string[] {
  const recommendations: string[] = [];

  if (totalScore >= 8) {
    recommendations.push('Gia đình bạn có chức năng tốt. Hãy duy trì những điểm mạnh này.');
    recommendations.push('Tiếp tục nuôi dưỡng mối quan hệ gia đình và hỗ trợ lẫn nhau.');
  } else if (totalScore >= 4) {
    recommendations.push(
      'Gia đình có một số khó khăn về chức năng. Cần cải thiện giao tiếp và hỗ trợ.'
    );

    if (domainScores.adaptation < 2) {
      recommendations.push('Tăng cường hỗ trợ lẫn nhau trong lúc khó khăn.');
    }
    if (domainScores.partnership < 2) {
      recommendations.push('Cải thiện việc thảo luận và chia sẻ vấn đề trong gia đình.');
    }
    if (domainScores.growth < 2) {
      recommendations.push('Hỗ trợ các thành viên phát triển cá nhân và theo đuổi mục tiêu riêng.');
    }
    if (domainScores.affection < 2) {
      recommendations.push('Thể hiện tình cảm và quan tâm đến cảm xúc của nhau nhiều hơn.');
    }
    if (domainScores.resolve < 2) {
      recommendations.push('Dành thêm thời gian chất lượng bên nhau.');
    }
  } else {
    recommendations.push('Gia đình đang gặp khó khăn nghiêm trọng về chức năng.');
    recommendations.push('Nên tìm kiếm sự hỗ trợ từ chuyên gia tâm lý gia đình.');
    recommendations.push('Xem xét tham gia liệu pháp gia đình để cải thiện mối quan hệ.');
  }

  return recommendations;
}

function generateCulturalConsiderations(domainScores: any): string[] {
  const considerations: string[] = [];

  considerations.push('Trong văn hóa Việt Nam, gia đình là nền tảng quan trọng của xã hội.');

  if (domainScores.partnership < 2) {
    considerations.push('Cần cân bằng giữa tôn trọng thứ bậc và giao tiếp mở trong gia đình.');
  }

  if (domainScores.growth < 2) {
    considerations.push('Hỗ trợ sự phát triển cá nhân trong khi duy trì sự gắn kết gia đình.');
  }

  if (domainScores.affection < 2) {
    considerations.push('Tình cảm có thể được thể hiện qua hành động chăm sóc hơn là lời nói.');
  }

  considerations.push(
    'Xem xét vai trò của gia đình mở rộng (ông bà, cô dì chú bác) trong hỗ trợ gia đình.'
  );

  return considerations;
}

const familyAPGARTest = {
  testInfo: {
    id: 'FAMILY_APGAR',
    name: 'Family APGAR Scale',
    vietnameseName: 'Thang Đo Chức Năng Gia Đình APGAR',
    description:
      'Đánh giá 5 chức năng cơ bản của gia đình: Thích ứng, Hợp tác, Phát triển, Tình cảm, Giải quyết',
    version: '2.0',
    category: 'family_assessment',
    culturalContext: 'vietnamese',
    targetDemographic: 'family_members',
    estimatedTime: '5-10 minutes',
    domains: ['adaptation', 'partnership', 'growth', 'affection', 'resolve'],
    scoring: {
      min: 0,
      max: 10,
      interpretation: {
        highly_functional: { range: '8-10', description: 'Gia đình có chức năng tốt' },
        moderately_dysfunctional: { range: '4-7', description: 'Gia đình có một số khó khăn' },
        severely_dysfunctional: { range: '0-3', description: 'Gia đình gặp khó khăn nghiêm trọng' },
      },
    },
  },
  questions: familyAPGARQuestions,
  responseOptions,
  calculateScore: calculateFamilyAPGARScore,
};

export default familyAPGARTest;
