/**
 * User Segmentation Data - Dữ liệu phân đoạn người dùng
 * Cá nhân hóa sâu sắc theo vai trò và trạng thái của phụ nữ
 */

export interface UserSegment {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  emotionalPatterns: string[];
  commonIssues: string[];
  responseTemplates: ResponseTemplate[];
  culturalContext: CulturalContext;
}

export interface ResponseTemplate {
  trigger: string[];
  response: string;
  empathyLevel: 'low' | 'medium' | 'high';
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface CulturalContext {
  vietnameseSpecific: string[];
  familyPressure: string[];
  socialExpectations: string[];
  emotionalExpression: string[];
}

// Dữ liệu phân đoạn người dùng chi tiết
export const userSegments: UserSegment[] = [
  {
    id: 'pregnant_postpartum',
    name: 'Phụ nữ mang thai/Sau sinh',
    description:
      'Tập trung vào các vấn đề thay đổi nội tiết tố, trầm cảm sau sinh và áp lực làm mẹ',
    keywords: [
      'mang thai',
      'sau sinh',
      'nội tiết tố',
      'hormone',
      'trầm cảm sau sinh',
      'PPD',
      'áp lực làm mẹ',
      'cho con bú',
      'mất ngủ',
      'kiệt sức',
      'lo lắng về con',
      'thay đổi cơ thể',
      'tăng cân',
      'giảm cân',
      'da xấu',
      'tóc rụng',
      'cô đơn',
      'không ai hiểu',
      'chồng không quan tâm',
      'gia đình chồng',
    ],
    emotionalPatterns: [
      'kiệt sức',
      'vỡ mộng',
      'bị thao túng',
      'bị phớt lờ',
      'tội lỗi',
      'lo lắng quá mức',
      'hoảng sợ',
      'tuyệt vọng',
      'cô đơn',
      'bị bỏ rơi',
    ],
    commonIssues: [
      'Trầm cảm sau sinh',
      'Áp lực cho con bú',
      'Mất ngủ do chăm con',
      'Thay đổi hình ảnh cơ thể',
      'Căng thẳng trong mối quan hệ',
      'Áp lực từ gia đình chồng',
      'Lo lắng về sự phát triển của con',
    ],
    responseTemplates: [
      {
        trigger: ['kiệt sức', 'mệt mỏi', 'không ngủ được'],
        response:
          'Tôi hiểu bạn đang trải qua giai đoạn rất khó khăn. Việc chăm sóc em bé là công việc 24/7 và hoàn toàn bình thường khi bạn cảm thấy kiệt sức. Bạn có thể chia sẻ thêm về tình hình hiện tại không?',
        empathyLevel: 'high',
        urgencyLevel: 'medium',
      },
      {
        trigger: ['trầm cảm sau sinh', 'PPD', 'buồn không muốn sống'],
        response:
          'Tôi rất quan tâm đến những gì bạn đang chia sẻ. Trầm cảm sau sinh là tình trạng nghiêm trọng và bạn không cần phải đối mặt một mình. Tôi khuyên bạn nên liên hệ ngay với bác sĩ hoặc chuyên gia tâm lý.',
        empathyLevel: 'high',
        urgencyLevel: 'critical',
      },
    ],
    culturalContext: {
      vietnameseSpecific: [
        'Áp lực sinh con trai',
        'Kỳ vọng về việc chăm sóc con hoàn hảo',
        'Gánh nặng từ gia đình chồng',
        'So sánh với các bà mẹ khác',
      ],
      familyPressure: [
        'Mẹ chồng can thiệp quá nhiều',
        'Áp lực từ gia đình hai bên',
        'Kỳ vọng về vai trò người mẹ',
        'So sánh với con dâu khác',
      ],
      socialExpectations: [
        'Công dung ngôn hạnh',
        'Hy sinh cho gia đình',
        'Luôn vui vẻ và kiên nhẫn',
        'Không được phàn nàn',
      ],
      emotionalExpression: [
        'Biểu đạt cảm xúc một cách ẩn ý',
        'Không muốn làm phiền người khác',
        'Giữ im lặng để tránh xung đột',
        'Tìm kiếm sự đồng cảm từ người ngoài',
      ],
    },
  },
  {
    id: 'single_career_women',
    name: 'Phụ nữ độc thân/Phụ nữ sự nghiệp',
    description: 'Tập trung vào áp lực xã hội, cô đơn và cân bằng công việc',
    keywords: [
      'độc thân',
      'sự nghiệp',
      'công việc',
      'áp lực xã hội',
      'cô đơn',
      'kết hôn muộn',
      'sinh con muộn',
      'đồng hồ sinh học',
      'biological clock',
      'cân bằng công việc',
      'burnout',
      'stress công việc',
      'cạnh tranh',
      'glass ceiling',
      'bình đẳng giới',
      'lương thấp',
      'thăng tiến',
    ],
    emotionalPatterns: [
      'cô đơn',
      'lo lắng về tương lai',
      'áp lực từ xã hội',
      'tự ti',
      'kiệt sức',
      'vỡ mộng',
      'bị đánh giá',
      'không được công nhận',
    ],
    commonIssues: [
      'Áp lực kết hôn từ gia đình',
      'Cô đơn và thiếu kết nối',
      'Cân bằng công việc và cuộc sống',
      'Phân biệt đối xử tại nơi làm việc',
      'Lo lắng về tương lai',
      'Áp lực sinh con',
    ],
    responseTemplates: [
      {
        trigger: ['cô đơn', 'không có ai', 'một mình'],
        response:
          'Cảm giác cô đơn là điều rất phổ biến, đặc biệt khi bạn đang tập trung vào sự nghiệp. Điều quan trọng là bạn đang xây dựng một cuộc sống có ý nghĩa cho chính mình. Bạn có thể chia sẻ thêm về những gì khiến bạn cảm thấy cô đơn không?',
        empathyLevel: 'high',
        urgencyLevel: 'medium',
      },
      {
        trigger: ['áp lực kết hôn', 'gia đình thúc ép', 'tuổi tác'],
        response:
          'Áp lực từ gia đình về việc kết hôn có thể rất khó chịu. Bạn có quyền sống theo cách mình muốn và tìm kiếm hạnh phúc theo cách riêng. Hãy nhớ rằng bạn không cần phải vội vàng để làm hài lòng người khác.',
        empathyLevel: 'high',
        urgencyLevel: 'low',
      },
    ],
    culturalContext: {
      vietnameseSpecific: [
        'Áp lực kết hôn trước 30 tuổi',
        'Kỳ vọng về vai trò phụ nữ truyền thống',
        'So sánh với bạn bè đã có gia đình',
        'Định kiến về phụ nữ thành công',
      ],
      familyPressure: [
        'Cha mẹ lo lắng về tương lai',
        'Áp lực từ họ hàng',
        'Câu hỏi về kế hoạch kết hôn',
        'So sánh với con cái người khác',
      ],
      socialExpectations: [
        'Phụ nữ nên ưu tiên gia đình',
        'Sự nghiệp không quan trọng bằng hôn nhân',
        'Phụ nữ thành công thường cô đơn',
        'Cần có chồng để hoàn thiện',
      ],
      emotionalExpression: [
        'Che giấu cảm xúc để tỏ ra mạnh mẽ',
        'Không muốn thừa nhận sự cô đơn',
        'Tìm kiếm sự đồng cảm từ bạn bè',
        'Cảm thấy tội lỗi khi không đáp ứng kỳ vọng',
      ],
    },
  },
  {
    id: 'menopause_women',
    name: 'Phụ nữ lớn tuổi (Tiền mãn kinh/Mãn kinh)',
    description: 'Tập trung vào các vấn đề thay đổi cơ thể, hội chứng tổ trống và lo âu tuổi già',
    keywords: [
      'mãn kinh',
      'tiền mãn kinh',
      'perimenopause',
      'menopause',
      'thay đổi cơ thể',
      'bốc hỏa',
      'hot flash',
      'đổ mồ hôi đêm',
      'mất ngủ',
      'thay đổi tâm trạng',
      'lo âu',
      'trầm cảm',
      'giảm ham muốn',
      'khô âm đạo',
      'tăng cân',
      'da khô',
      'tóc mỏng',
      'loãng xương',
      'tim mạch',
      'tuổi già',
    ],
    emotionalPatterns: [
      'lo lắng về tuổi già',
      'tự ti về ngoại hình',
      'buồn bã',
      'cáu kỉnh',
      'kiệt sức',
      'vỡ mộng',
      'sợ hãi về tương lai',
    ],
    commonIssues: [
      'Thay đổi nội tiết tố',
      'Bốc hỏa và đổ mồ hôi đêm',
      'Mất ngủ',
      'Thay đổi tâm trạng',
      'Giảm ham muốn tình dục',
      'Lo lắng về sức khỏe',
      'Thay đổi hình ảnh cơ thể',
    ],
    responseTemplates: [
      {
        trigger: ['bốc hỏa', 'hot flash', 'đổ mồ hôi'],
        response:
          'Bốc hỏa là triệu chứng rất phổ biến trong giai đoạn mãn kinh và có thể rất khó chịu. Đây là phản ứng bình thường của cơ thể khi nội tiết tố thay đổi. Bạn có thể thử một số cách để giảm bớt như mặc quần áo thoáng mát, tránh thức ăn cay, và tập thể dục nhẹ nhàng.',
        empathyLevel: 'high',
        urgencyLevel: 'low',
      },
      {
        trigger: ['lo lắng về tuổi già', 'sợ hãi', 'tương lai'],
        response:
          'Lo lắng về tuổi già là cảm xúc rất tự nhiên. Giai đoạn mãn kinh đánh dấu một chương mới trong cuộc đời với những thay đổi và cơ hội mới. Bạn có thể chia sẻ thêm về những gì khiến bạn lo lắng không?',
        empathyLevel: 'high',
        urgencyLevel: 'medium',
      },
    ],
    culturalContext: {
      vietnameseSpecific: [
        'Định kiến về phụ nữ lớn tuổi',
        'Áp lực phải luôn trẻ trung',
        'Kỳ vọng về vai trò bà nội/bà ngoại',
        'So sánh với phụ nữ trẻ hơn',
      ],
      familyPressure: [
        'Áp lực chăm sóc con cháu',
        'Kỳ vọng về vai trò trong gia đình',
        'Căng thẳng với con dâu',
        'Lo lắng về tương lai con cái',
      ],
      socialExpectations: [
        'Phụ nữ lớn tuổi nên từ bỏ sự nghiệp',
        'Ưu tiên gia đình hơn bản thân',
        'Không được phàn nàn về sức khỏe',
        'Phải luôn vui vẻ và kiên nhẫn',
      ],
      emotionalExpression: [
        'Che giấu cảm xúc để không làm phiền',
        'Tìm kiếm sự đồng cảm từ bạn bè cùng tuổi',
        'Không muốn thừa nhận sự lo lắng',
        'Cảm thấy tội lỗi khi nghĩ đến bản thân',
      ],
    },
  },
];

// Hàm nhận diện phân đoạn người dùng
export function identifyUserSegment(userInput: string, userHistory: string[]): UserSegment | null {
  const allKeywords = userSegments.flatMap(segment => segment.keywords);
  const inputLower = userInput.toLowerCase();

  // Tìm segment có nhiều keyword match nhất
  let bestMatch: UserSegment | null = null;
  let maxMatches = 0;

  for (const segment of _userSegments) {
    const matches = segment.keywords.filter(keyword =>
      inputLower.includes(keyword.toLowerCase())
    ).length;

    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = segment;
    }
  }

  // Cần ít nhất 2 keyword match để xác định segment
  return maxMatches >= 2 ? bestMatch : null;
}

// Hàm lấy response template phù hợp
export function getResponseTemplate(
  segment: UserSegment,
  userInput: string,
  emotionalState: string
): ResponseTemplate | null {
  const inputLower = userInput.toLowerCase();

  // Tìm template có trigger match với input
  for (const template of segment.responseTemplates) {
    const hasTrigger = template.trigger.some(trigger => inputLower.includes(trigger.toLowerCase()));

    if (hasTrigger) {
      return template;
    }
  }

  return null;
}

// Hàm phân tích cảm xúc đa sắc thái
export function analyzeNuancedEmotion(userInput: string): {
  emotion: string;
  intensity: 'low' | 'medium' | 'high' | 'critical';
  culturalContext: string[];
} {
  const inputLower = userInput.toLowerCase();

  // Mapping các từ khóa cảm xúc với intensity
  const emotionMap: Record<
    string,
    { emotion: string; intensity: 'low' | 'medium' | 'high' | 'critical' }
  > = {
    'kiệt sức': { emotion: 'exhaustion', intensity: 'high' },
    'vỡ mộng': { emotion: 'disappointment', intensity: 'medium' },
    'bị thao túng': { emotion: 'manipulation', intensity: 'high' },
    'bị phớt lờ': { emotion: 'neglect', intensity: 'medium' },
    'tội lỗi': { emotion: 'guilt', intensity: 'medium' },
    'lo lắng quá mức': { emotion: 'anxiety', intensity: 'high' },
    'hoảng sợ': { emotion: 'panic', intensity: 'critical' },
    'tuyệt vọng': { emotion: 'despair', intensity: 'critical' },
    'cô đơn': { emotion: 'loneliness', intensity: 'medium' },
    'bị bỏ rơi': { emotion: 'abandonment', intensity: 'high' },
  };

  // Tìm emotion match
  for (const [keyword, data] of Object.entries(emotionMap)) {
    if (inputLower.includes(keyword)) {
      return {
        emotion: data.emotion,
        intensity: data.intensity,
        culturalContext: ['vietnamese', 'women', 'family_pressure'],
      };
    }
  }

  return {
    emotion: 'neutral',
    intensity: 'low',
    culturalContext: [],
  };
}
