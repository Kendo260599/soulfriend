/**
 * Offline Chat Service
 * Fallback service khi AI service không khả dụng
 * Đảm bảo chatbot luôn hoạt động ngay cả khi offline
 */

export interface OfflineResponse {
  text: string;
  crisisDetected: boolean;
  recommendations: string[];
  nextActions: string[];
}

export interface TestResult {
  testType: string;
  totalScore: number;
  evaluation: {
    level: string;
    description: string;
  };
}

export interface UserProfile {
  age?: number;
  gender?: string;
  testHistory?: TestResult[];
  preferences?: string[];
  culturalContext?: string;
}

export class OfflineChatService {
  private crisisKeywords = [
    'tự tử', 'tự sát', 'chết', 'không muốn sống', 'kết thúc cuộc đời',
    'tự làm mình chết', 'tự hủy', 'giết mình', 'tuyệt vọng'
  ];

  private emergencyContacts = [
    '1900 599 958 - Tổng đài tư vấn tâm lý 24/7',
    '113 - Cảnh sát khẩn cấp',
    '115 - Cấp cứu y tế',
    '1900 969 969 - Trung tâm hỗ trợ phụ nữ'
  ];

  private generalResponses = [
    'Tôi hiểu bạn đang gặp khó khăn. Hãy chia sẻ thêm về cảm xúc của bạn.',
    'Cảm ơn bạn đã tin tưởng chia sẻ. Tôi ở đây để lắng nghe bạn.',
    'Điều bạn đang trải qua không dễ dàng. Bạn không đơn độc đâu.',
    'Tôi cảm nhận được sự khó khăn của bạn. Hãy cùng tìm cách vượt qua nhé.',
    'Bạn đã rất dũng cảm khi chia sẻ. Hãy tiếp tục tin tưởng vào bản thân.'
  ];

  private relaxationTechniques = [
    'Kỹ thuật thở 4-7-8: Hít vào 4 giây, giữ 7 giây, thở ra 8 giây',
    'Thư giãn cơ bắp tiến triển: Căng và thả lỏng từng nhóm cơ',
    'Grounding 5-4-3-2-1: 5 điều nhìn thấy, 4 điều chạm được, 3 điều nghe thấy, 2 điều ngửi thấy, 1 điều nếm được',
    'Thiền chánh niệm: Tập trung vào hơi thở trong 5-10 phút',
    'Viết nhật ký cảm xúc: Ghi lại suy nghĩ và cảm xúc của bạn'
  ];

  /**
   * Xử lý tin nhắn offline
   */
  async processMessage(
    message: string, 
    testResults: TestResult[] = [], 
    userProfile: UserProfile = {}
  ): Promise<OfflineResponse> {
    const lowerMessage = message.toLowerCase();
    
    // Kiểm tra crisis
    const crisisDetected = this.crisisKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );

    if (crisisDetected) {
      return this.handleCrisisResponse(message);
    }

    // Phân tích intent cơ bản
    const intent = this.analyzeBasicIntent(lowerMessage);
    
    switch (intent) {
      case 'greeting':
        return this.handleGreeting();
      
      case 'test_results':
        return this.handleTestResults(testResults);
      
      case 'relaxation':
        return this.handleRelaxationRequest();
      
      case 'help':
        return this.handleHelpRequest();
      
      case 'stress':
        return this.handleStressRequest();
      
      case 'depression':
        return this.handleDepressionRequest();
      
      default:
        return this.handleGeneralMessage(message, testResults);
    }
  }

  /**
   * Xử lý tình huống khủng hoảng
   */
  private handleCrisisResponse(message: string): OfflineResponse {
    return {
      text: `🚨 TÔI RẤT LO LẮNG CHO BẠN!

Đây là tình huống khẩn cấp. Vui lòng liên hệ ngay:

${this.emergencyContacts.map(contact => `• ${contact}`).join('\n')}

💙 Hãy nhớ:
- Bạn không đơn độc
- Có nhiều người sẵn sàng giúp đỡ bạn
- Tình trạng này có thể được điều trị
- Cuộc sống của bạn rất quý giá

🤝 Hãy liên hệ ngay với một trong những số trên. Họ có thể giúp bạn.`,
      crisisDetected: true,
      recommendations: [
        'Liên hệ ngay số khẩn cấp',
        'Tìm người thân đáng tin cậy',
        'Đến nơi an toàn',
        'Không ở một mình'
      ],
      nextActions: this.emergencyContacts
    };
  }

  /**
   * Xử lý lời chào
   */
  private handleGreeting(): OfflineResponse {
    return {
      text: `Xin chào! Mình là CHUN 🌸 - AI Companion hỗ trợ sức khỏe tâm lý.

⚠️ LƯU Ý: Hiện tại mình đang hoạt động ở chế độ offline. Một số tính năng có thể bị hạn chế.

Mình ở đây để lắng nghe và hỗ trợ bạn. Bạn có muốn chia sẻ điều gì không? 💙`,
      crisisDetected: false,
      recommendations: [
        'Chia sẻ cảm xúc hiện tại',
        'Làm test đánh giá tâm lý',
        'Học kỹ thuật thư giãn',
        'Tìm kiếm hỗ trợ chuyên nghiệp'
      ],
      nextActions: []
    };
  }

  /**
   * Xử lý yêu cầu về kết quả test
   */
  private handleTestResults(testResults: TestResult[]): OfflineResponse {
    if (testResults.length === 0) {
      return {
        text: `Bạn chưa có kết quả test nào. Mình khuyến nghị bạn làm bài đánh giá DASS-21:

📊 DASS-21 (Depression, Anxiety and Stress Scales):
• Đánh giá đồng thời 3 chiều: Trầm cảm, Lo âu và Stress
• 21 câu hỏi, hoàn thành trong 5-10 phút
• Thang đo chuẩn quốc tế (Lovibond & Lovibond, 1995)

Bạn có muốn bắt đầu làm test DASS-21 không?`,
        crisisDetected: false,
        recommendations: [
          'Làm test DASS-21',
          'Tìm hiểu về DASS-21',
          'Tham khảo chuyên gia'
        ],
        nextActions: []
      };
    }

    const latestTest = testResults[testResults.length - 1];
    return {
      text: `📊 Kết quả test ${latestTest.testType} của bạn:

Điểm số: ${latestTest.totalScore}
Mức độ: ${latestTest.evaluation.level}
Mô tả: ${latestTest.evaluation.description}

💡 Khuyến nghị:
• Kết quả này chỉ mang tính tham khảo
• Nên tham khảo ý kiến chuyên gia để có đánh giá chính xác
• Duy trì lối sống lành mạnh
• Thực hành các kỹ thuật thư giãn`,
      crisisDetected: false,
      recommendations: [
        'Tham khảo chuyên gia tâm lý',
        'Thực hành kỹ thuật thư giãn',
        'Duy trì lối sống lành mạnh',
        'Theo dõi tình trạng thường xuyên'
      ],
      nextActions: []
    };
  }

  /**
   * Xử lý yêu cầu thư giãn
   */
  private handleRelaxationRequest(): OfflineResponse {
    const randomTechnique = this.relaxationTechniques[
      Math.floor(Math.random() * this.relaxationTechniques.length)
    ];

    return {
      text: `🧘‍♀️ Mình sẽ hướng dẫn bạn kỹ thuật thư giãn:

${randomTechnique}

Hãy thử ngay bây giờ và cho mình biết cảm giác của bạn nhé! 💙`,
      crisisDetected: false,
      recommendations: [
        'Thực hành kỹ thuật thở',
        'Thử thiền chánh niệm',
        'Nghe nhạc thư giãn',
        'Tập yoga nhẹ nhàng'
      ],
      nextActions: []
    };
  }

  /**
   * Xử lý yêu cầu giúp đỡ
   */
  private handleHelpRequest(): OfflineResponse {
    return {
      text: `💙 Mình ở đây để hỗ trợ bạn!

Các cách mình có thể giúp:
• Lắng nghe và chia sẻ cảm xúc
• Hướng dẫn kỹ thuật thư giãn
• Giải thích kết quả test
• Cung cấp thông tin hỗ trợ
• Kết nối với nguồn hỗ trợ chuyên nghiệp

Bạn muốn mình giúp gì cụ thể?`,
      crisisDetected: false,
      recommendations: [
        'Chia sẻ cảm xúc',
        'Học kỹ thuật thư giãn',
        'Tìm hiểu về test tâm lý',
        'Liên hệ chuyên gia'
      ],
      nextActions: []
    };
  }

  /**
   * Xử lý yêu cầu về stress
   */
  private handleStressRequest(): OfflineResponse {
    return {
      text: `😌 Mình hiểu stress có thể rất khó chịu.

Một số cách giảm stress hiệu quả:
• Thở sâu 4-7-8
• Đi bộ nhẹ nhàng
• Nghe nhạc yêu thích
• Viết nhật ký
• Trò chuyện với bạn bè

Bạn đang stress về điều gì cụ thể? Mình có thể giúp bạn tìm cách giải quyết.`,
      crisisDetected: false,
      recommendations: [
        'Thực hành thở sâu',
        'Đi bộ hoặc tập thể dục nhẹ',
        'Nghe nhạc thư giãn',
        'Trò chuyện với người thân'
      ],
      nextActions: []
    };
  }

  /**
   * Xử lý yêu cầu về trầm cảm
   */
  private handleDepressionRequest(): OfflineResponse {
    return {
      text: `💙 Mình hiểu trầm cảm có thể rất khó khăn.

Những điều quan trọng cần nhớ:
• Trầm cảm là một tình trạng y tế có thể điều trị
• Bạn không yếu đuối hay có lỗi
• Có nhiều người hiểu và hỗ trợ bạn
• Việc tìm kiếm giúp đỡ là dấu hiệu của sự mạnh mẽ

Bạn có muốn chia sẻ thêm về cảm giác của mình không?`,
      crisisDetected: false,
      recommendations: [
        'Tham khảo chuyên gia tâm lý',
        'Thực hành self-care',
        'Duy trì kết nối xã hội',
        'Tập thể dục nhẹ nhàng'
      ],
      nextActions: [
        '1900 599 958 - Tư vấn tâm lý 24/7',
        'Liên hệ bác sĩ tâm lý',
        'Tham gia nhóm hỗ trợ'
      ]
    };
  }

  /**
   * Xử lý tin nhắn chung
   */
  private handleGeneralMessage(message: string, testResults: TestResult[]): OfflineResponse {
    const randomResponse = this.generalResponses[
      Math.floor(Math.random() * this.generalResponses.length)
    ];

    let responseText = randomResponse;
    
    if (testResults.length > 0) {
      responseText += `\n\nMình thấy bạn đã có ${testResults.length} kết quả test. Bạn có muốn mình giải thích kết quả không?`;
    }

    return {
      text: responseText,
      crisisDetected: false,
      recommendations: [
        'Chia sẻ thêm về cảm xúc',
        'Thử kỹ thuật thư giãn',
        'Làm test đánh giá',
        'Tìm kiếm hỗ trợ chuyên nghiệp'
      ],
      nextActions: []
    };
  }

  /**
   * Phân tích intent cơ bản
   */
  private analyzeBasicIntent(message: string): string {
    if (message.includes('chào') || message.includes('hello') || message.includes('hi')) {
      return 'greeting';
    }
    
    if (message.includes('test') || message.includes('kết quả') || message.includes('điểm')) {
      return 'test_results';
    }
    
    if (message.includes('thư giãn') || message.includes('relax') || message.includes('thở')) {
      return 'relaxation';
    }
    
    if (message.includes('giúp') || message.includes('help') || message.includes('hỗ trợ')) {
      return 'help';
    }
    
    if (message.includes('stress') || message.includes('căng thẳng') || message.includes('áp lực')) {
      return 'stress';
    }
    
    if (message.includes('trầm cảm') || message.includes('buồn') || message.includes('depression')) {
      return 'depression';
    }
    
    return 'general';
  }
}

// Export singleton instance
export const offlineChatService = new OfflineChatService();
export default offlineChatService;