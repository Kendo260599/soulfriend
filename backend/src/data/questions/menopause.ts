/**
 * Menopause Rating Scale (MRS) - Thang đo triệu chứng mãn kinh
 * Phiên bản Việt hóa cho phụ nữ Việt Nam
 * Đánh giá mức độ nghiêm trọng của các triệu chứng mãn kinh
 */

const MENOPAUSE_QUESTIONS = [
  // SOMATIC SYMPTOMS - Triệu chứng thể chất
  {
    id: 1,
    category: 'somatic',
    text: "Bốc hỏa, đổ mồ hôi (cơn nóng đột ngột, đổ mồ hôi bất thường)",
    options: [
      { value: 0, label: "Không có" },
      { value: 1, label: "Nhẹ" },
      { value: 2, label: "Trung bình" },
      { value: 3, label: "Nặng" },
      { value: 4, label: "Rất nặng" }
    ]
  },
  {
    id: 2,
    category: 'somatic',
    text: "Khó chịu về tim (tim đập nhanh, tim đập mạnh, tim bỏ nhịp)",
    options: [
      { value: 0, label: "Không có" },
      { value: 1, label: "Nhẹ" },
      { value: 2, label: "Trung bình" },
      { value: 3, label: "Nặng" },
      { value: 4, label: "Rất nặng" }
    ]
  },
  {
    id: 3,
    category: 'somatic',
    text: "Vấn đề về giấc ngủ (khó ngủ, ngủ không sâu, thức giấc sớm)",
    options: [
      { value: 0, label: "Không có" },
      { value: 1, label: "Nhẹ" },
      { value: 2, label: "Trung bình" },
      { value: 3, label: "Nặng" },
      { value: 4, label: "Rất nặng" }
    ]
  },
  {
    id: 4,
    category: 'somatic',
    text: "Đau nhức khớp và cơ (đau khớp, đau cơ, tê bì chân tay)",
    options: [
      { value: 0, label: "Không có" },
      { value: 1, label: "Nhẹ" },
      { value: 2, label: "Trung bình" },
      { value: 3, label: "Nặng" },
      { value: 4, label: "Rất nặng" }
    ]
  },

  // PSYCHOLOGICAL SYMPTOMS - Triệu chứng tâm lý
  {
    id: 5,
    category: 'psychological',
    text: "Tâm trạng trầm cảm (cảm thấy buồn chán, bi quan, khóc thường xuyên)",
    options: [
      { value: 0, label: "Không có" },
      { value: 1, label: "Nhẹ" },
      { value: 2, label: "Trung bình" },
      { value: 3, label: "Nặng" },
      { value: 4, label: "Rất nặng" }
    ]
  },
  {
    id: 6,
    category: 'psychological',
    text: "Dễ cáu gắt (cảm thấy căng thẳng, hung hăng, dễ tức giận)",
    options: [
      { value: 0, label: "Không có" },
      { value: 1, label: "Nhẹ" },
      { value: 2, label: "Trung bình" },
      { value: 3, label: "Nặng" },
      { value: 4, label: "Rất nặng" }
    ]
  },
  {
    id: 7,
    category: 'psychological',
    text: "Lo lắng (hoảng loạn, sợ hãi, bồn chồn không yên)",
    options: [
      { value: 0, label: "Không có" },
      { value: 1, label: "Nhẹ" },
      { value: 2, label: "Trung bình" },
      { value: 3, label: "Nặng" },
      { value: 4, label: "Rất nặng" }
    ]
  },
  {
    id: 8,
    category: 'psychological',
    text: "Mệt mỏi thể chất và tinh thần (giảm hiệu suất làm việc, giảm trí nhớ, giảm khả năng tập trung)",
    options: [
      { value: 0, label: "Không có" },
      { value: 1, label: "Nhẹ" },
      { value: 2, label: "Trung bình" },
      { value: 3, label: "Nặng" },
      { value: 4, label: "Rất nặng" }
    ]
  },

  // UROGENITAL SYMPTOMS - Triệu chứng tiết niệu sinh dục
  {
    id: 9,
    category: 'urogenital',
    text: "Vấn đề tình dục (thay đổi ham muốn tình dục, hoạt động tình dục, thỏa mãn tình dục)",
    options: [
      { value: 0, label: "Không có" },
      { value: 1, label: "Nhẹ" },
      { value: 2, label: "Trung bình" },
      { value: 3, label: "Nặng" },
      { value: 4, label: "Rất nặng" }
    ]
  },
  {
    id: 10,
    category: 'urogenital',
    text: "Vấn đề về tiểu tiện (khó tiểu, tăng tần suất đi tiểu, tiểu không tự chủ)",
    options: [
      { value: 0, label: "Không có" },
      { value: 1, label: "Nhẹ" },
      { value: 2, label: "Trung bình" },
      { value: 3, label: "Nặng" },
      { value: 4, label: "Rất nặng" }
    ]
  },
  {
    id: 11,
    category: 'urogenital',
    text: "Khô âm đạo (cảm giác khô, bỏng rát khi quan hệ tình dục)",
    options: [
      { value: 0, label: "Không có" },
      { value: 1, label: "Nhẹ" },
      { value: 2, label: "Trung bình" },
      { value: 3, label: "Nặng" },
      { value: 4, label: "Rất nặng" }
    ]
  }
];

// Scoring algorithm for MRS
export function scoreMRS(answers: Record<number, number>) {
  let somaticScore = 0;
  let psychologicalScore = 0;
  let urogenitalScore = 0;

  // Calculate subscores
  for (let i = 1; i <= 4; i++) {
    somaticScore += answers[i] || 0;
  }

  for (let i = 5; i <= 8; i++) {
    psychologicalScore += answers[i] || 0;
  }

  for (let i = 9; i <= 11; i++) {
    urogenitalScore += answers[i] || 0;
  }

  const totalScore = somaticScore + psychologicalScore + urogenitalScore;

  // Determine severity based on international standards adapted for Vietnamese women
  let severity: 'none' | 'mild' | 'moderate' | 'severe';
  let interpretation: string;
  let recommendations: string[] = [];

  if (totalScore <= 4) {
    severity = 'none';
    interpretation = 'Không có hoặc có rất ít triệu chứng mãn kinh. Bạn đang trải qua giai đoạn chuyển tiếp một cách tự nhiên.';
    recommendations = [
      'Duy trì lối sống lành mạnh',
      'Tập thể dục đều đặn',
      'Chế độ ăn giàu canxi và vitamin D',
      'Theo dõi sức khỏe định kỳ'
    ];
  } else if (totalScore <= 8) {
    severity = 'mild';
    interpretation = 'Triệu chứng mãn kinh nhẹ. Các triệu chứng có thể gây khó chịu nhưng không ảnh hưởng nhiều đến chất lượng cuộc sống.';
    recommendations = [
      'Áp dụng các phương pháp tự nhiên giảm triệu chứng',
      'Yoga, thiền để giảm stress',
      'Thực phẩm chức năng từ đậu nành',
      'Tư vấn với bác sĩ về lối sống',
      'Hỗ trợ tâm lý từ gia đình'
    ];
  } else if (totalScore <= 16) {
    severity = 'moderate';
    interpretation = 'Triệu chứng mãn kinh trung bình. Các triệu chứng có thể ảnh hưởng đến công việc, giấc ngủ và các mối quan hệ.';
    recommendations = [
      'Tham khảo ý kiến bác sĩ phụ khoa',
      'Cân nhắc liệu pháp hormone thay thế (HRT)',
      'Tư vấn dinh dưỡng chuyên sâu',
      'Quản lý stress hiệu quả',
      'Hỗ trợ tâm lý chuyên nghiệp',
      'Điều chỉnh môi trường làm việc'
    ];
  } else {
    severity = 'severe';
    interpretation = 'Triệu chứng mãn kinh nghiêm trọng. Các triệu chứng ảnh hưởng đáng kể đến chất lượng cuộc sống và cần được điều trị tích cực.';
    recommendations = [
      'Thăm khám bác sĩ chuyên khoa ngay lập tức',
      'Đánh giá toàn diện về liệu pháp hormone',
      'Tư vấn tâm lý chuyên sâu',
      'Hỗ trợ y tế đa chuyên khoa',
      'Điều chỉnh công việc và hoạt động hàng ngày',
      'Hỗ trợ từ gia đình và cộng đồng'
    ];
  }

  return {
    testType: 'MRS',
    totalScore,
    subscaleScores: {
      somatic: somaticScore,
      psychological: psychologicalScore,
      urogenital: urogenitalScore
    },
    severity,
    interpretation,
    recommendations,

    // Specific considerations for Vietnamese women
    culturalConsiderations: {
      traditionalMedicine: severity === 'mild' || severity === 'moderate',
      familySupport: severity === 'moderate' || severity === 'severe',
      workplaceDiscussion: severity === 'severe',
      communityResources: [
        'Nhóm hỗ trợ phụ nữ mãn kinh',
        'Lớp học về sức khỏe phụ nữ',
        'Tư vấn dinh dưỡng cộng đồng'
      ]
    },

    // Interdisciplinary referrals
    interdisciplinaryConsiderations: {
      gynecologicalReferral: severity === 'moderate' || severity === 'severe',
      endocrinologyReferral: severity === 'severe',
      psychologicalSupport: psychologicalScore >= 8,
      nutritionalCounseling: somaticScore >= 6,
      physiotherapy: somaticScore >= 8,
      sexualHealthCounseling: urogenitalScore >= 6
    }
  };
}

export default {
  questions: MENOPAUSE_QUESTIONS,
  scoringFunction: scoreMRS,
  testInfo: {
    name: 'Thang đo Triệu chứng Mãn kinh (MRS)',
    description: 'Đánh giá mức độ nghiêm trọng của các triệu chứng trong giai đoạn mãn kinh',
    duration: '3-5 phút',
    targetPopulation: 'Phụ nữ tiền mãn kinh và mãn kinh (45-65 tuổi)',
    culturalAdaptation: 'Được điều chỉnh cho phụ nữ Việt Nam với cân nhắc văn hóa',
    clinicalUse: 'Hỗ trợ đánh giá và theo dõi điều trị trong giai đoạn mãn kinh',
    domains: [
      'Triệu chứng thể chất (bốc hỏa, tim mạch, giấc ngủ, đau nhức)',
      'Triệu chứng tâm lý (trầm cảm, lo âu, cáu gắt, mệt mỏi)',
      'Triệu chứng tiết niệu sinh dục (tình dục, tiểu tiện, khô âm đạo)'
    ]
  }
};