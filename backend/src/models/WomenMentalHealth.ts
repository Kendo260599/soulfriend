/**
 * SOULFRIEND V2.0 - Women's Mental Health Assessment Module
 * Specialized module for women's mental health across life stages
 * Supporting research paper: "AI-Powered Application for Mental Health Screening
 * and Support for Women and Families: An Interdisciplinary Approach"
 */

export enum WomenLifeStage {
  ADOLESCENT = 'adolescent', // 13-18 years
  REPRODUCTIVE = 'reproductive', // 19-45 years
  PREGNANCY = 'pregnancy', // During pregnancy
  POSTPARTUM = 'postpartum', // 0-12 months postpartum
  PERIMENOPAUSE = 'perimenopause', // 45-55 years
  MENOPAUSE = 'menopause', // 55+ years
}

export interface WomenSpecificFactors {
  // Hormonal factors affecting mental health
  hormonalFactors: {
    menstrualCycle: {
      regularity: 'regular' | 'irregular' | 'absent';
      cycleLength: number; // days
      pmsSymptoms: boolean;
      pmddRisk: boolean;
    };

    reproductiveStatus: {
      pregnancyStatus: 'not_pregnant' | 'trying_to_conceive' | 'pregnant' | 'postpartum';
      pregnancyWeek?: number;
      postpartumWeeks?: number;
      breastfeeding: boolean;
      contraceptiveUse: string;
      fertilityTreatment: boolean;
    };

    menopauseStatus: {
      stage: 'premenopausal' | 'perimenopausal' | 'postmenopausal';
      lastMenstrualPeriod?: Date;
      hrt: boolean; // Hormone Replacement Therapy
      menopauseSymptoms: string[];
    };
  };

  // Psychosocial factors specific to women
  psychosocialFactors: {
    domesticResponsibilities: {
      primaryCaregiver: boolean;
      elderCare: boolean;
      householdManagement: boolean;
    };

    workLifeBalance: {
      employmentStatus: string;
      workHours: number;
      careerStage: string;
      workplacePressures: string[];
    };

    relationshipFactors: {
      maritalStatus: string;
      partnerSupport: 'high' | 'moderate' | 'low' | 'none';
      domesticViolence: boolean;
      sexualHealth: 'satisfied' | 'concerns' | 'problems';
    };
  };

  // Cultural and social context (Vietnam-specific)
  culturalFactors: {
    familyExpectations: string[];
    socialSupport: 'strong' | 'moderate' | 'weak';
    religiousBeliefs: string;
    culturalStressors: string[];
  };
}

export interface WomenAssessmentResult {
  lifeStage: WomenLifeStage;
  primaryConcerns: string[];
  riskFactors: string[];
  protectiveFactors: string[];
  recommendations: WomenSpecificRecommendations;
  referrals: InterdisciplinaryReferrals;
}

export interface WomenSpecificRecommendations {
  psychological: string[];
  medical: string[];
  lifestyle: string[];
  social: string[];
  educational: string[];
}

export interface InterdisciplinaryReferrals {
  gynecologist?: {
    urgency: 'routine' | 'urgent' | 'emergency';
    reason: string;
    recommendedTimeframe: string;
  };

  psychiatrist?: {
    urgency: 'routine' | 'urgent' | 'emergency';
    reason: string;
    recommendedTimeframe: string;
  };

  socialWorker?: {
    urgency: 'routine' | 'urgent';
    reason: string;
    services: string[];
  };

  nutritionist?: {
    reason: string;
    focus: string[];
  };

  counselor?: {
    type: 'individual' | 'couple' | 'family';
    specialization: string;
    reason: string;
  };
}

// Specialized assessment scales for women
export interface WomenSpecializedScales {
  // Edinburgh Postnatal Depression Scale - Already implemented
  EPDS: {
    applicable: boolean;
    timeframe: 'pregnancy' | 'postpartum';
    score?: number;
    interpretation?: string;
  };

  // Premenstrual Syndrome Scale
  PMS: {
    applicable: boolean;
    physicalSymptoms: number;
    emotionalSymptoms: number;
    behavioralSymptoms: number;
    totalScore: number;
    severity: 'mild' | 'moderate' | 'severe';
  };

  // Menopause Rating Scale
  MRS: {
    applicable: boolean;
    somaticScore: number;
    psychologicalScore: number;
    urogenitalScore: number;
    totalScore: number;
    severity: 'none' | 'mild' | 'moderate' | 'severe';
  };

  // Women's Health Questionnaire
  WHQ: {
    applicable: boolean;
    domains: {
      depressedMood: number;
      somaticSymptoms: number;
      anxiety: number;
      cognitiveImpairment: number;
      sexualBehavior: number;
      vasomotorSymptoms: number;
    };
  };

  // Maternal Attachment Inventory (for pregnant/postpartum women)
  MAI: {
    applicable: boolean;
    attachmentScore: number;
    riskLevel: 'low' | 'moderate' | 'high';
  };
}

// AI-powered assessment logic for women
export class WomenMentalHealthAssessment {
  static assessLifeStage(age: number, reproductiveStatus: any): WomenLifeStage {
    if (age < 18) {
      return WomenLifeStage.ADOLESCENT;
    }
    if (reproductiveStatus.pregnancyStatus === 'pregnant') {
      return WomenLifeStage.PREGNANCY;
    }
    if (reproductiveStatus.pregnancyStatus === 'postpartum') {
      return WomenLifeStage.POSTPARTUM;
    }
    if (age >= 55 || reproductiveStatus.menopauseStatus === 'postmenopausal') {
      return WomenLifeStage.MENOPAUSE;
    }
    if (age >= 45 || reproductiveStatus.menopauseStatus === 'perimenopausal') {
      return WomenLifeStage.PERIMENOPAUSE;
    }
    return WomenLifeStage.REPRODUCTIVE;
  }

  static generatePersonalizedRecommendations(
    assessmentResult: any,
    lifeStage: WomenLifeStage,
    culturalFactors: any
  ): WomenSpecificRecommendations {
    // AI-powered personalized recommendations
    // Based on Vietnamese cultural context and women's specific needs

    const recommendations: WomenSpecificRecommendations = {
      psychological: [],
      medical: [],
      lifestyle: [],
      social: [],
      educational: [],
    };

    // Life stage specific recommendations
    switch (lifeStage) {
      case WomenLifeStage.PREGNANCY:
        recommendations.medical.push('Thăm khám sản khoa định kỳ');
        recommendations.psychological.push('Tham gia lớp học chuẩn bị làm mẹ');
        recommendations.lifestyle.push('Dinh dưỡng thai kỳ cân bằng');
        break;

      case WomenLifeStage.POSTPARTUM:
        recommendations.psychological.push('Theo dõi trầm cảm sau sinh');
        recommendations.social.push('Tìm kiếm hỗ trợ từ gia đình và bạn bè');
        recommendations.medical.push('Khám sức khỏe sau sinh định kỳ');
        break;

      case WomenLifeStage.MENOPAUSE:
        recommendations.medical.push('Tư vấn về liệu pháp hormone');
        recommendations.lifestyle.push('Tập thể dục phù hợp với tuổi mãn kinh');
        recommendations.psychological.push('Tham gia nhóm hỗ trợ phụ nữ mãn kinh');
        break;
    }

    return recommendations;
  }

  static determineInterdisciplinaryReferrals(
    assessmentData: any,
    riskFactors: string[]
  ): InterdisciplinaryReferrals {
    const referrals: InterdisciplinaryReferrals = {};

    // Crisis situations requiring immediate referral
    if (riskFactors.includes('suicidal_ideation')) {
      referrals.psychiatrist = {
        urgency: 'emergency',
        reason: 'Ý định tự tử - cần can thiệp khẩn cấp',
        recommendedTimeframe: 'Trong 24 giờ',
      };
    }

    // Domestic violence
    if (riskFactors.includes('domestic_violence')) {
      referrals.socialWorker = {
        urgency: 'urgent',
        reason: 'Bạo lực gia đình - cần hỗ trợ xã hội',
        services: ['Tư vấn pháp lý', 'Nơi trú ẩn an toàn', 'Hỗ trợ tâm lý'],
      };
    }

    // Reproductive health concerns
    if (riskFactors.includes('reproductive_health_issues')) {
      referrals.gynecologist = {
        urgency: 'routine',
        reason: 'Vấn đề sức khỏe sinh sản ảnh hưởng đến tâm lý',
        recommendedTimeframe: 'Trong 2 tuần',
      };
    }

    return referrals;
  }
}

export default WomenMentalHealthAssessment;
