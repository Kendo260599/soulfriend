/**
 * Crisis Management Data - Dữ liệu quản lý khủng hoảng và đạo đức
 * Đảm bảo an toàn và đáng tin cậy của chatbot
 */

export interface CrisisScenario {
  id: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  triggers: string[];
  immediateResponse: string;
  escalationProtocol: string[];
  followUpActions: string[];
  disclaimerRequired: boolean;
}

export interface SafetyProtocol {
  id: string;
  name: string;
  description: string;
  triggers: string[];
  actions: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiresHuman: boolean;
}

export interface ReferralData {
  id: string;
  name: string;
  type: 'hotline' | 'clinic' | 'counselor' | 'hospital' | 'support_group';
  location: string;
  contact: string;
  specialization: string[];
  availability: string;
  language: string[];
  cost: 'free' | 'low' | 'medium' | 'high';
  notes: string;
}

export interface DisclaimerTemplate {
  id: string;
  context: string;
  template: string;
  frequency: 'every_session' | 'crisis_only' | 'first_session' | 'as_needed';
  placement: 'beginning' | 'end' | 'middle' | 'contextual';
}

// Dữ liệu kịch bản leo thang nguy cơ
export const crisisScenarios: CrisisScenario[] = [
  {
    id: 'suicidal_ideation',
    level: 'critical',
    triggers: [
      'muốn chết',
      'không muốn sống',
      'kết thúc cuộc đời',
      'tự tử',
      'nhảy lầu',
      'uống thuốc',
      'cắt tay',
      'không muốn tồn tại',
      'muốn biến mất',
      'không còn ý nghĩa',
    ],
    immediateResponse:
      'Tôi rất quan tâm đến những gì bạn vừa chia sẻ. Những suy nghĩ này cho thấy bạn đang trải qua một giai đoạn rất khó khăn. Bạn không cần phải đối mặt một mình.',
    escalationProtocol: [
      'Kích hoạt crisis intervention ngay lập tức',
      'Liên hệ emergency services (113)',
      'Thông báo cho người thân tin cậy',
      'Theo dõi liên tục trong 24h',
      'Ghi chép chi tiết để báo cáo',
    ],
    followUpActions: [
      'Kiểm tra lại sau 2 giờ',
      'Liên hệ chuyên gia tâm lý khẩn cấp',
      'Cung cấp hotline tư vấn',
      'Theo dõi tình trạng liên tục',
    ],
    disclaimerRequired: true,
  },
  {
    id: 'self_harm',
    level: 'high',
    triggers: [
      'cắt tay',
      'đánh mình',
      'làm đau bản thân',
      'tự hại',
      'làm tổn thương',
      'đánh vào tường',
      'không kiểm soát được',
      'muốn đau đớn',
    ],
    immediateResponse:
      'Tôi hiểu bạn đang trải qua rất nhiều đau đớn và có thể bạn đang tìm cách để giải tỏa. Có những cách an toàn hơn để xử lý những cảm xúc này.',
    escalationProtocol: [
      'Đánh giá mức độ nghiêm trọng',
      'Liên hệ chuyên gia tâm lý',
      'Cung cấp coping strategies',
      'Theo dõi tình trạng',
      'Ghi chép để theo dõi',
    ],
    followUpActions: [
      'Kiểm tra lại sau 4 giờ',
      'Cung cấp resources về self-harm',
      'Kết nối với support group',
      'Theo dõi tiến triển',
    ],
    disclaimerRequired: true,
  },
  {
    id: 'severe_depression',
    level: 'high',
    triggers: [
      'không thể ra khỏi giường',
      'không ăn được',
      'mất ngủ liên tục',
      'không có năng lượng',
      'không thể làm việc',
      'tuyệt vọng',
      'không thấy tương lai',
      'cảm thấy vô dụng',
    ],
    immediateResponse:
      'Tôi thấy bạn đang trải qua một giai đoạn rất khó khăn với những triệu chứng nghiêm trọng. Điều này có thể là dấu hiệu của trầm cảm nặng và cần được điều trị chuyên nghiệp.',
    escalationProtocol: [
      'Đánh giá triệu chứng trầm cảm',
      'Khuyến nghị thăm khám bác sĩ',
      'Cung cấp thông tin về điều trị',
      'Theo dõi tình trạng',
      'Ghi chép triệu chứng',
    ],
    followUpActions: [
      'Kiểm tra lại sau 6 giờ',
      'Cung cấp resources về depression',
      'Kết nối với mental health services',
      'Theo dõi tiến triển điều trị',
    ],
    disclaimerRequired: true,
  },
  {
    id: 'panic_attack',
    level: 'medium',
    triggers: [
      'không thở được',
      'tim đập nhanh',
      'hoảng loạn',
      'không kiểm soát được',
      'sợ hãi tột độ',
      'chóng mặt',
      'đổ mồ hôi',
      'run rẩy',
    ],
    immediateResponse:
      'Tôi hiểu bạn đang trải qua một cơn hoảng loạn và điều này có thể rất đáng sợ. Hãy thử một số kỹ thuật thở để giúp bạn bình tĩnh lại.',
    escalationProtocol: [
      'Hướng dẫn breathing exercises',
      'Grounding techniques',
      'Theo dõi triệu chứng',
      'Ghi chép để đánh giá',
    ],
    followUpActions: [
      'Kiểm tra lại sau 1 giờ',
      'Cung cấp anxiety management resources',
      'Khuyến nghị thăm khám nếu tái phát',
      'Theo dõi pattern của panic attacks',
    ],
    disclaimerRequired: false,
  },
];

// Dữ liệu giao thức an toàn
export const safetyProtocols: SafetyProtocol[] = [
  {
    id: 'immediate_crisis',
    name: 'Crisis Intervention',
    description: 'Xử lý khủng hoảng ngay lập tức',
    triggers: ['suicidal', 'self_harm', 'critical_depression'],
    actions: [
      'Kích hoạt emergency protocol',
      'Liên hệ emergency services',
      'Thông báo người thân',
      'Theo dõi liên tục',
      'Ghi chép chi tiết',
    ],
    priority: 'critical',
    requiresHuman: true,
  },
  {
    id: 'professional_referral',
    name: 'Professional Referral',
    description: 'Chuyển tiếp đến chuyên gia',
    triggers: ['severe_symptoms', 'persistent_issues', 'no_improvement'],
    actions: [
      'Đánh giá mức độ nghiêm trọng',
      'Cung cấp referral information',
      'Hướng dẫn cách tiếp cận',
      'Theo dõi follow-up',
      'Ghi chép referral',
    ],
    priority: 'high',
    requiresHuman: false,
  },
  {
    id: 'safety_check',
    name: 'Safety Check',
    description: 'Kiểm tra an toàn định kỳ',
    triggers: ['ongoing_support', 'risk_assessment', 'follow_up'],
    actions: [
      'Đánh giá tình trạng hiện tại',
      'Kiểm tra safety indicators',
      'Cập nhật risk level',
      'Ghi chép observations',
      'Lên kế hoạch follow-up',
    ],
    priority: 'medium',
    requiresHuman: false,
  },
];

// Dữ liệu chuyển tiếp (referral data)
export const referralData: ReferralData[] = [
  {
    id: 'national_hotline',
    name: 'Đường dây nóng Quốc gia',
    type: 'hotline',
    location: 'Toàn quốc',
    contact: '1900 599 958',
    specialization: ['crisis_intervention', 'suicide_prevention', 'mental_health'],
    availability: '24/7',
    language: ['Vietnamese'],
    cost: 'free',
    notes: 'Dịch vụ tư vấn tâm lý khẩn cấp 24/7',
  },
  {
    id: 'mental_health_hospital',
    name: 'Bệnh viện Tâm thần Trung ương',
    type: 'hospital',
    location: 'Hà Nội',
    contact: '024 3736 2121',
    specialization: ['psychiatry', 'mental_health_treatment', 'crisis_care'],
    availability: '24/7',
    language: ['Vietnamese'],
    cost: 'low',
    notes: 'Bệnh viện chuyên khoa tâm thần hàng đầu',
  },
  {
    id: 'women_support_group',
    name: 'Nhóm hỗ trợ phụ nữ',
    type: 'support_group',
    location: 'TP.HCM',
    contact: '028 3930 1234',
    specialization: ['women_mental_health', 'postpartum_depression', 'domestic_violence'],
    availability: 'Mon-Fri 8AM-5PM',
    language: ['Vietnamese'],
    cost: 'free',
    notes: 'Nhóm hỗ trợ chuyên biệt cho phụ nữ',
  },
  {
    id: 'family_counseling',
    name: 'Trung tâm Tư vấn Gia đình',
    type: 'counselor',
    location: 'Hà Nội',
    contact: '024 3775 6789',
    specialization: ['family_therapy', 'marriage_counseling', 'parenting'],
    availability: 'Mon-Sat 8AM-8PM',
    language: ['Vietnamese'],
    cost: 'medium',
    notes: 'Tư vấn chuyên sâu về gia đình và mối quan hệ',
  },
  {
    id: 'postpartum_support',
    name: 'Hỗ trợ Trầm cảm Sau sinh',
    type: 'support_group',
    location: 'Đà Nẵng',
    contact: '0236 3456 789',
    specialization: ['postpartum_depression', 'new_mother_support', 'breastfeeding'],
    availability: 'Mon-Fri 9AM-4PM',
    language: ['Vietnamese'],
    cost: 'free',
    notes: 'Hỗ trợ chuyên biệt cho phụ nữ sau sinh',
  },
];

// Dữ liệu disclaimer templates
export const disclaimerTemplates: DisclaimerTemplate[] = [
  {
    id: 'general_disclaimer',
    context: 'general',
    template:
      'Tôi là một chatbot hỗ trợ tâm lý và không thể thay thế cho việc tư vấn chuyên nghiệp. Nếu bạn đang gặp khủng hoảng nghiêm trọng, hãy liên hệ ngay với chuyên gia hoặc dịch vụ khẩn cấp.',
    frequency: 'first_session',
    placement: 'beginning',
  },
  {
    id: 'crisis_disclaimer',
    context: 'crisis',
    template:
      'Nếu bạn đang có ý định tự hại hoặc tự tử, hãy liên hệ ngay với đường dây nóng 1900 599 958 hoặc đến bệnh viện gần nhất. Tôi không thể thay thế cho việc chăm sóc y tế khẩn cấp.',
    frequency: 'crisis_only',
    placement: 'contextual',
  },
  {
    id: 'professional_disclaimer',
    context: 'professional',
    template:
      'Thông tin tôi cung cấp chỉ mang tính chất tham khảo và không thay thế cho chẩn đoán hoặc điều trị y tế chuyên nghiệp. Hãy tham khảo ý kiến bác sĩ hoặc chuyên gia tâm lý.',
    frequency: 'as_needed',
    placement: 'end',
  },
];

// Hàm phát hiện khủng hoảng
/**
 * Remove Vietnamese diacritics for fuzzy matching
 * Handles UTF-8 encoding issues when diacritics are corrupted
 */
function removeVietnameseDiacritics(str: string): string {
  // Use a more comprehensive approach with Unicode normalization
  // First normalize to NFD (decomposed form), then remove combining diacritics
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove combining diacritics
    .replace(/đ/g, 'd') // Special case for đ
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export function detectCrisis(userInput: string): CrisisScenario | null {
  const inputLower = userInput.toLowerCase();
  const inputNormalized = removeVietnameseDiacritics(userInput);

  console.error('🔍 CRISIS DETECTION DEBUG:');
  console.error(`   Original: "${userInput}"`);
  console.error(`   Lowercase: "${inputLower}"`);
  console.error(`   Normalized: "${inputNormalized}"`);

  for (const scenario of crisisScenarios) {
    // Try matching with original triggers (with diacritics)
    const hasDirectTrigger = scenario.triggers.some(trigger =>
      inputLower.includes(trigger.toLowerCase())
    );

    // Try matching with normalized text (diacritics removed)
    const hasNormalizedTrigger = scenario.triggers.some(trigger => {
      const normalizedTrigger = removeVietnameseDiacritics(trigger);
      return inputNormalized.includes(normalizedTrigger);
    });

    if (hasDirectTrigger || hasNormalizedTrigger) {
      console.error(`   ✅ MATCHED: ${scenario.id} (${scenario.level})`);
      return scenario;
    }
  }

  console.error('   ❌ NO MATCH');
  return null;
}

// Hàm lấy referral phù hợp
export function getRelevantReferral(
  userLocation: string,
  specialization: string[],
  urgency: 'low' | 'medium' | 'high' | 'critical'
): ReferralData[] {
  let filteredReferrals = referralData.filter(referral =>
    referral.specialization.some(spec => specialization.includes(spec))
  );

  // Ưu tiên theo urgency
  if (urgency === 'critical') {
    filteredReferrals = filteredReferrals.filter(
      ref => ref.type === 'hotline' || ref.type === 'hospital'
    );
  }

  // Ưu tiên theo location
  if (userLocation) {
    filteredReferrals = filteredReferrals.filter(
      ref => ref.location.includes(userLocation) || ref.location === 'Toàn quốc'
    );
  }

  return filteredReferrals;
}

// Hàm tạo disclaimer
export function generateDisclaimer(context: string, crisisDetected: boolean): string {
  if (crisisDetected) {
    return disclaimerTemplates.find(t => t.context === 'crisis')?.template || '';
  }

  return disclaimerTemplates.find(t => t.context === context)?.template || '';
}

// Hàm đánh giá rủi ro
export function assessRisk(
  userInput: string,
  userHistory: string[],
  emotionalState: string
): {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  recommendations: string[];
} {
  const crisis = detectCrisis(userInput);
  const riskFactors: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

  if (crisis) {
    riskLevel = crisis.level;
    riskFactors.push(crisis.id);
  }

  // Đánh giá thêm dựa trên history
  const recentCrisis = userHistory.some(input => detectCrisis(input));
  if (recentCrisis) {
    riskFactors.push('recent_crisis_history');
    if (riskLevel === 'low') {
      riskLevel = 'medium';
    }
  }

  // Đánh giá dựa trên emotional state
  if (emotionalState === 'despair' || emotionalState === 'panic') {
    riskFactors.push('severe_emotional_distress');
    if (riskLevel === 'low') {
      riskLevel = 'medium';
    }
  }

  const recommendations =
    riskLevel === 'critical'
      ? ['immediate_intervention', 'emergency_services', 'continuous_monitoring']
      : riskLevel === 'high'
        ? ['professional_referral', 'safety_check', 'follow_up']
        : riskLevel === 'medium'
          ? ['monitoring', 'support_resources', 'check_in']
          : ['general_support', 'self_care', 'regular_check'];

  return {
    riskLevel,
    riskFactors,
    recommendations,
  };
}
