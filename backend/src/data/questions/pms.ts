/**
 * Premenstrual Syndrome Scale (PMS) - Thang đo hội chứng tiền kinh nguyệt
 * Phiên bản Việt hóa cho phụ nữ Việt Nam
 */

const PMS_QUESTIONS = [
  // PHYSICAL SYMPTOMS - Triệu chứng thể chất
  {
    id: 1,
    category: 'physical',
    text: 'Đau bụng dưới, đau vùng chậu trước kỳ kinh',
    options: [
      { value: 0, label: 'Không bao giờ' },
      { value: 1, label: 'Hiếm khi' },
      { value: 2, label: 'Thỉnh thoảng' },
      { value: 3, label: 'Thường xuyên' },
      { value: 4, label: 'Luôn luôn' },
    ],
  },
  {
    id: 2,
    category: 'physical',
    text: 'Đau đầu, chóng mặt trước kỳ kinh',
    options: [
      { value: 0, label: 'Không bao giờ' },
      { value: 1, label: 'Hiếm khi' },
      { value: 2, label: 'Thỉnh thoảng' },
      { value: 3, label: 'Thường xuyên' },
      { value: 4, label: 'Luôn luôn' },
    ],
  },
  {
    id: 3,
    category: 'physical',
    text: 'Căng tức, đau ngực trước kỳ kinh',
    options: [
      { value: 0, label: 'Không bao giờ' },
      { value: 1, label: 'Hiếm khi' },
      { value: 2, label: 'Thỉnh thoảng' },
      { value: 3, label: 'Thường xuyên' },
      { value: 4, label: 'Luôn luôn' },
    ],
  },
  {
    id: 4,
    category: 'physical',
    text: 'Phù nề, tăng cân tạm thời',
    options: [
      { value: 0, label: 'Không bao giờ' },
      { value: 1, label: 'Hiếm khi' },
      { value: 2, label: 'Thỉnh thoảng' },
      { value: 3, label: 'Thường xuyên' },
      { value: 4, label: 'Luôn luôn' },
    ],
  },
  {
    id: 5,
    category: 'physical',
    text: 'Mệt mỏi, thiếu năng lượng',
    options: [
      { value: 0, label: 'Không bao giờ' },
      { value: 1, label: 'Hiếm khi' },
      { value: 2, label: 'Thỉnh thoảng' },
      { value: 3, label: 'Thường xuyên' },
      { value: 4, label: 'Luôn luôn' },
    ],
  },

  // EMOTIONAL SYMPTOMS - Triệu chứng cảm xúc
  {
    id: 6,
    category: 'emotional',
    text: 'Dễ cáu kỉnh, bực tức không lý do',
    options: [
      { value: 0, label: 'Không bao giờ' },
      { value: 1, label: 'Hiếm khi' },
      { value: 2, label: 'Thỉnh thoảng' },
      { value: 3, label: 'Thường xuyên' },
      { value: 4, label: 'Luôn luôn' },
    ],
  },
  {
    id: 7,
    category: 'emotional',
    text: 'Buồn chán, tâm trạng trầm lắng',
    options: [
      { value: 0, label: 'Không bao giờ' },
      { value: 1, label: 'Hiếm khi' },
      { value: 2, label: 'Thỉnh thoảng' },
      { value: 3, label: 'Thường xuyên' },
      { value: 4, label: 'Luôn luôn' },
    ],
  },
  {
    id: 8,
    category: 'emotional',
    text: 'Lo lắng, căng thẳng tăng cao',
    options: [
      { value: 0, label: 'Không bao giờ' },
      { value: 1, label: 'Hiếm khi' },
      { value: 2, label: 'Thỉnh thoảng' },
      { value: 3, label: 'Thường xuyên' },
      { value: 4, label: 'Luôn luôn' },
    ],
  },
  {
    id: 9,
    category: 'emotional',
    text: 'Thay đổi tâm trạng đột ngột',
    options: [
      { value: 0, label: 'Không bao giờ' },
      { value: 1, label: 'Hiếm khi' },
      { value: 2, label: 'Thỉnh thoảng' },
      { value: 3, label: 'Thường xuyên' },
      { value: 4, label: 'Luôn luôn' },
    ],
  },
  {
    id: 10,
    category: 'emotional',
    text: 'Dễ bật khóc, cảm thấy yếu đuối',
    options: [
      { value: 0, label: 'Không bao giờ' },
      { value: 1, label: 'Hiếm khi' },
      { value: 2, label: 'Thỉnh thoảng' },
      { value: 3, label: 'Thường xuyên' },
      { value: 4, label: 'Luôn luôn' },
    ],
  },

  // BEHAVIORAL SYMPTOMS - Triệu chứng hành vi
  {
    id: 11,
    category: 'behavioral',
    text: 'Thèm ăn nhiều hơn bình thường, đặc biệt đồ ngọt',
    options: [
      { value: 0, label: 'Không bao giờ' },
      { value: 1, label: 'Hiếm khi' },
      { value: 2, label: 'Thỉnh thoảng' },
      { value: 3, label: 'Thường xuyên' },
      { value: 4, label: 'Luôn luôn' },
    ],
  },
  {
    id: 12,
    category: 'behavioral',
    text: 'Khó ngủ hoặc ngủ nhiều hơn bình thường',
    options: [
      { value: 0, label: 'Không bao giờ' },
      { value: 1, label: 'Hiếm khi' },
      { value: 2, label: 'Thỉnh thoảng' },
      { value: 3, label: 'Thường xuyên' },
      { value: 4, label: 'Luôn luôn' },
    ],
  },
  {
    id: 13,
    category: 'behavioral',
    text: 'Khó tập trung vào công việc/học tập',
    options: [
      { value: 0, label: 'Không bao giờ' },
      { value: 1, label: 'Hiếm khi' },
      { value: 2, label: 'Thỉnh thoảng' },
      { value: 3, label: 'Thường xuyên' },
      { value: 4, label: 'Luôn luôn' },
    ],
  },
  {
    id: 14,
    category: 'behavioral',
    text: 'Tránh các hoạt động xã hội',
    options: [
      { value: 0, label: 'Không bao giờ' },
      { value: 1, label: 'Hiếm khi' },
      { value: 2, label: 'Thỉnh thoảng' },
      { value: 3, label: 'Thường xuyên' },
      { value: 4, label: 'Luôn luôn' },
    ],
  },
  {
    id: 15,
    category: 'behavioral',
    text: 'Xung đột với gia đình/đồng nghiệp tăng cao',
    options: [
      { value: 0, label: 'Không bao giờ' },
      { value: 1, label: 'Hiếm khi' },
      { value: 2, label: 'Thỉnh thoảng' },
      { value: 3, label: 'Thường xuyên' },
      { value: 4, label: 'Luôn luôn' },
    ],
  },
];

// Scoring algorithm for PMS
export function scorePMS(answers: Record<number, number>) {
  let physicalScore = 0;
  let emotionalScore = 0;
  let behavioralScore = 0;

  // Calculate subscores
  for (let i = 1; i <= 5; i++) {
    physicalScore += answers[i] || 0;
  }

  for (let i = 6; i <= 10; i++) {
    emotionalScore += answers[i] || 0;
  }

  for (let i = 11; i <= 15; i++) {
    behavioralScore += answers[i] || 0;
  }

  const totalScore = physicalScore + emotionalScore + behavioralScore;

  // Determine severity based on Vietnamese population norms
  let severity: 'minimal' | 'mild' | 'moderate' | 'severe';
  let interpretation: string;
  let recommendations: string[] = [];

  if (totalScore <= 15) {
    severity = 'minimal';
    interpretation =
      'Triệu chứng tiền kinh nguyệt ở mức tối thiểu. Bạn có thể trải qua một số khó chịu nhẹ trước kỳ kinh nhưng không ảnh hưởng nhiều đến cuộc sống hàng ngày.';
    recommendations = ['Duy trì lối sống lành mạnh', 'Tập thể dục nhẹ nhàng', 'Chế độ ăn cân bằng'];
  } else if (totalScore <= 30) {
    severity = 'mild';
    interpretation =
      'Triệu chứng tiền kinh nguyệt nhẹ. Bạn có thể cảm thấy một số khó chịu trước kỳ kinh nhưng vẫn có thể hoạt động bình thường.';
    recommendations = [
      'Theo dõi chu kỳ kinh nguyệt',
      'Giảm stress và căng thẳng',
      'Tăng cường vitamin B6, magiê',
      'Tập yoga hoặc thiền',
    ];
  } else if (totalScore <= 45) {
    severity = 'moderate';
    interpretation =
      'Triệu chứng tiền kinh nguyệt trung bình. Các triệu chứng có thể ảnh hưởng đến công việc, học tập và các mối quan hệ của bạn.';
    recommendations = [
      'Tư vấn với bác sĩ phụ khoa',
      'Cân nhắc liệu pháp hành vi nhận thức',
      'Quản lý stress hiệu quả',
      'Hạn chế caffeine và đường',
      'Tập thể dục đều đặn',
    ];
  } else {
    severity = 'severe';
    interpretation =
      'Triệu chứng tiền kinh nguyệt nghiêm trọng (có thể là PMDD). Các triệu chứng ảnh hưởng đáng kể đến chất lượng cuộc sống và cần được điều trị chuyên khoa.';
    recommendations = [
      'Thăm khám bác sĩ phụ khoa ngay lập tức',
      'Đánh giá rối loạn cảm xúc tiền kinh nguyệt (PMDD)',
      'Cân nhắc điều trị thuốc',
      'Tư vấn tâm lý chuyên sâu',
      'Hỗ trợ từ gia đình và bạn bè',
    ];
  }

  return {
    testType: 'PMS',
    totalScore,
    subscaleScores: {
      physical: physicalScore,
      emotional: emotionalScore,
      behavioral: behavioralScore,
    },
    severity,
    interpretation,
    recommendations,

    // Additional info for interdisciplinary approach
    interdisciplinaryConsiderations: {
      gynecologicalReferral: severity === 'severe' || severity === 'moderate',
      psychologicalSupport: emotionalScore >= 12,
      nutritionalCounseling: behavioralScore >= 8,
      workplaceAccommodations: severity === 'severe',
    },
  };
}

export default {
  questions: PMS_QUESTIONS,
  scoringFunction: scorePMS,
  testInfo: {
    name: 'Thang đo Hội chứng Tiền kinh nguyệt (PMS)',
    description: 'Đánh giá mức độ triệu chứng thể chất, cảm xúc và hành vi trước kỳ kinh nguyệt',
    duration: '5-7 phút',
    targetPopulation: 'Phụ nữ trong độ tuổi sinh sản (15-50 tuổi)',
    culturalAdaptation: 'Được điều chỉnh cho phụ nữ Việt Nam',
    clinicalUse: 'Hỗ trợ chẩn đoán và theo dõi điều trị PMS/PMDD',
  },
};
