// Dịch vụ AI chuyên biệt cho phụ nữ Việt Nam
// Tích hợp văn hóa, ngôn ngữ và bối cảnh xã hội Việt Nam

import { vietnamResearchData, vietnamWomenHealthData, culturalFactors } from '../data/vietnamResearchData';

export interface VietnamAIAnalysis {
  culturalContext: {
    vietnameseValues: string[];
    familyInfluence: number;
    socialPressure: number;
    culturalStressors: string[];
  };
  personalizedInsights: {
    riskFactors: string[];
    protectiveFactors: string[];
    recommendations: string[];
    culturalConsiderations: string[];
  };
  vietnameseAdvice: {
    traditional: string[];
    modern: string[];
    family: string[];
    community: string[];
  };
  crisisIntervention: {
    vietnameseHotlines: string[];
    culturalBarriers: string[];
    familyInvolvement: boolean;
    communityResources: string[];
  };
}

export class VietnamAIService {
  private static instance: VietnamAIService;

  private constructor() {}

  public static getInstance(): VietnamAIService {
    if (!VietnamAIService.instance) {
      VietnamAIService.instance = new VietnamAIService();
    }
    return VietnamAIService.instance;
  }

  // Phân tích bối cảnh văn hóa
  private analyzeCulturalContext(testResults: any[], demographics: any): {
    vietnameseValues: string[];
    familyInfluence: number;
    socialPressure: number;
    culturalStressors: string[];
  } {
    const vietnameseValues = ['gia đình', 'tôn trọng', 'hòa hợp', 'chăm chỉ'];
    let familyInfluence = 0;
    let socialPressure = 0;
    const culturalStressors: string[] = [];

    // Phân tích ảnh hưởng gia đình
    if (demographics?.maritalStatus === 'married') familyInfluence += 0.3;
    if (demographics?.hasChildren) familyInfluence += 0.4;
    if (demographics?.livingWithParents) familyInfluence += 0.3;

    // Phân tích áp lực xã hội
    if (demographics?.educationLevel === 'university') socialPressure += 0.2;
    if (demographics?.occupation === 'professional') socialPressure += 0.3;
    if (demographics?.age < 30) socialPressure += 0.2;

    return {
      vietnameseValues,
      familyInfluence: Math.min(familyInfluence, 1),
      socialPressure: Math.min(socialPressure, 1),
      culturalStressors
    };
  }

  // Phân tích toàn diện cho phụ nữ Việt Nam
  public analyzeVietnameseWoman(testResults: any[], demographics: any, chatHistory: string[]): VietnamAIAnalysis {
    const culturalContext = this.analyzeCulturalContext(testResults, demographics);

    // Xác định yếu tố rủi ro
    const riskFactors: string[] = [];
    if (culturalContext.familyInfluence > 0.7) riskFactors.push('Áp lực gia đình cao');
    if (culturalContext.socialPressure > 0.6) riskFactors.push('Áp lực xã hội lớn');

    // Xác định yếu tố bảo vệ
    const protectiveFactors: string[] = [];
    if (demographics?.hasChildren) protectiveFactors.push('Hỗ trợ từ con cái');
    if (demographics?.maritalStatus === 'married') protectiveFactors.push('Hỗ trợ từ chồng');

    // Khuyến nghị cá nhân hóa
    const recommendations: string[] = [
      'Thực hành các kỹ thuật thư giãn như thiền hoặc yoga',
      'Duy trì lịch trình ngủ đều đặn',
      'Tìm kiếm sự hỗ trợ từ gia đình và bạn bè'
    ];

    // Cân nhắc văn hóa
    const culturalConsiderations: string[] = [
      'Gia đình có thể là nguồn hỗ trợ mạnh mẽ',
      'Cân nhắc thảo luận với người thân đáng tin cậy'
    ];

    // Lời khuyên tiếng Việt
    const vietnameseAdvice = {
      traditional: [
        'Tham gia các hoạt động truyền thống như thêu, nấu ăn',
        'Tìm kiếm sự hỗ trợ từ cộng đồng địa phương'
      ],
      modern: [
        'Sử dụng các ứng dụng sức khỏe tâm thần',
        'Tham gia các nhóm hỗ trợ trực tuyến'
      ],
      family: [
        'Dành thời gian chất lượng với gia đình',
        'Thảo luận về cảm xúc với người thân'
      ],
      community: [
        'Tham gia các hoạt động cộng đồng',
        'Tìm kiếm sự hỗ trợ từ bạn bè'
      ]
    };

    // Can thiệp khủng hoảng
    const crisisIntervention = {
      vietnameseHotlines: [
        'Tổng đài 111 - Tư vấn trẻ em (24/7)',
        'Tổng đài 1800 1525 - Tư vấn tâm lý (8h-22h)'
      ],
      culturalBarriers: [
        'Stigma về sức khỏe tâm thần trong xã hội',
        'Sợ gia đình và bạn bè biết'
      ],
      familyInvolvement: culturalContext.familyInfluence > 0.5,
      communityResources: [
        'Hội Phụ nữ địa phương',
        'Trung tâm Công tác Xã hội'
      ]
    };

    return {
      culturalContext,
      personalizedInsights: {
        riskFactors,
        protectiveFactors,
        recommendations,
        culturalConsiderations
      },
      vietnameseAdvice,
      crisisIntervention
    };
  }
}

export default VietnamAIService;