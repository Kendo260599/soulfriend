/**
 * AI Service - Tích hợp AI thực tế cho SoulFriend
 * Hỗ trợ Vietnamese NLP, Crisis Detection, và Personalized Recommendations
 */

export interface AIResponse {
  text: string;
  confidence: number;
  crisisDetected: boolean;
  recommendations: string[];
  nextActions: string[];
}

export interface CrisisLevel {
  level: 'low' | 'medium' | 'high' | 'critical';
  keywords: string[];
  response: string;
  emergencyContacts: string[];
}

export interface UserProfile {
  age?: number;
  gender?: string;
  testHistory: any[];
  preferences: string[];
  culturalContext: 'vietnamese' | 'international';
}

class AIService {
  private apiKey: string;
  private baseUrl: string;
  private crisisKeywords: CrisisLevel[];

  constructor() {
    // Sử dụng environment variables hoặc fallback
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY || '';
    this.baseUrl = process.env.REACT_APP_AI_API_URL || 'https://api.openai.com/v1';
    
    this.crisisKeywords = [
      {
        level: 'critical',
        keywords: ['tự tử', 'tự sát', 'chết', 'kết thúc', 'không muốn sống', 'tự hại', 'cắt tay', 'uống thuốc'],
        response: 'Tôi rất lo lắng về bạn. Hãy gọi ngay 115 hoặc đến bệnh viện gần nhất. Bạn không cô đơn và có người quan tâm đến bạn.',
        emergencyContacts: ['115', '1900 5999 15', 'Bệnh viện Tâm thần TP.HCM: 028 3930 3316']
      },
      {
        level: 'high',
        keywords: ['tuyệt vọng', 'vô vọng', 'không có lối thoát', 'muốn biến mất', 'không ai hiểu', 'cô đơn'],
        response: 'Tôi hiểu bạn đang trải qua những cảm xúc rất khó khăn. Hãy tìm kiếm sự hỗ trợ chuyên nghiệp ngay hôm nay.',
        emergencyContacts: ['1900 5999 15', 'Tổng đài tư vấn tâm lý: 1900 5999 15']
      },
      {
        level: 'medium',
        keywords: ['rất buồn', 'không thể chịu đựng', 'stress quá mức', 'lo âu nghiêm trọng', 'hoảng loạn'],
        response: 'Tôi thấy bạn đang gặp khó khăn. Hãy thử một số kỹ thuật thư giãn và cân nhắc tìm kiếm hỗ trợ chuyên nghiệp.',
        emergencyContacts: ['Tổng đài tư vấn: 1900 5999 15']
      },
      {
        level: 'low',
        keywords: ['buồn', 'lo âu', 'căng thẳng', 'mệt mỏi', 'khó ngủ'],
        response: 'Tôi hiểu bạn đang cảm thấy không ổn. Hãy thử một số kỹ thuật tự chăm sóc và theo dõi tình trạng của mình.',
        emergencyContacts: []
      }
    ];
  }

  /**
   * Phân tích tin nhắn người dùng và phát hiện khủng hoảng
   */
  private detectCrisis(message: string): CrisisLevel | null {
    if (!message) return null;
    const lowerMessage = message.toLowerCase();
    
    for (const crisis of this.crisisKeywords) {
      const hasKeyword = crisis.keywords.some(keyword => 
        lowerMessage.includes(keyword?.toLowerCase() || '')
      );
      
      if (hasKeyword) {
        return crisis;
      }
    }
    
    return null;
  }

  /**
   * Tạo prompt tiếng Việt cho AI
   */
  private createVietnamesePrompt(message: string, userProfile: UserProfile, testResults: any[]): string {
    const testContext = testResults.length > 0 
      ? `Kết quả test gần nhất: ${testResults[testResults.length - 1].testType} - ${testResults[testResults.length - 1].evaluation?.level || 'normal'}`
      : 'Chưa có kết quả test';

    return `Bạn là AI Health Assistant chuyên về sức khỏe tâm lý phụ nữ Việt Nam. 

THÔNG TIN NGƯỜI DÙNG:
- Tuổi: ${userProfile.age || 'không xác định'}
- Giới tính: ${userProfile.gender || 'không xác định'}
- Bối cảnh văn hóa: ${userProfile.culturalContext}
- ${testContext}

NGUYÊN TẮC:
1. Trả lời bằng tiếng Việt tự nhiên, thân thiện
2. Tôn trọng văn hóa Việt Nam và giá trị gia đình
3. Khuyến khích tìm kiếm hỗ trợ chuyên nghiệp khi cần
4. Đưa ra lời khuyên thực tế, khả thi
5. Thể hiện sự đồng cảm và hiểu biết

TIN NHẮN NGƯỜI DÙNG: "${message}"

Hãy trả lời một cách chuyên nghiệp, đồng cảm và hữu ích. Nếu phát hiện dấu hiệu khủng hoảng, hãy khuyến khích tìm kiếm hỗ trợ chuyên nghiệp ngay lập tức.`;
  }

  /**
   * Gọi API AI thực tế (OpenAI hoặc tương tự)
   */
  private async callAIAPI(prompt: string): Promise<string> {
    if (!this.apiKey) {
      // Fallback response nếu không có API key
      return this.getFallbackResponse(prompt);
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Bạn là AI Health Assistant chuyên về sức khỏe tâm lý phụ nữ Việt Nam. Trả lời bằng tiếng Việt tự nhiên, thân thiện và chuyên nghiệp.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('AI API Error:', error);
      return this.getFallbackResponse(prompt);
    }
  }

  /**
   * Fallback response khi không có API
   */
  private getFallbackResponse(message: string): string {
    if (!message) return "Xin chào! Tôi là AI Health Assistant. Tôi có thể giúp gì cho bạn hôm nay?";
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('cảm ơn') || lowerMessage.includes('thank')) {
      return "Rất vui được hỗ trợ bạn! 😊 Hãy nhớ rằng chăm sóc sức khỏe tâm lý là một hành trình dài. Tôi luôn ở đây khi bạn cần.";
    }
    
    if (lowerMessage.includes('lo âu') || lowerMessage.includes('căng thẳng')) {
      return "Lo âu và căng thẳng là những cảm xúc bình thường. Một số kỹ thuật có thể giúp:\n\n🌸 Thở sâu 4-7-8\n🧘‍♀️ Thiền chánh niệm 10 phút\n🚶‍♀️ Đi bộ trong thiên nhiên\n📝 Viết nhật ký cảm xúc";
    }
    
    if (lowerMessage.includes('trầm cảm') || lowerMessage.includes('buồn')) {
      return "Cảm giác buồn bã là một phần của cuộc sống. Một số điều có thể giúp:\n\n☀️ Tiếp xúc ánh sáng mặt trời\n💪 Tập thể dục nhẹ nhàng\n👥 Kết nối với bạn bè, gia đình\n🎨 Tham gia hoạt động sáng tạo";
    }
    
    return "Tôi hiểu mối quan tâm của bạn. Dựa trên kinh nghiệm hỗ trợ người dùng, tôi khuyên bạn:\n\n✨ Thực hành tự chăm sóc hàng ngày\n🎯 Đặt mục tiêu nhỏ, dễ đạt được\n🤝 Duy trì kết nối xã hội tích cực\n📚 Tìm hiểu thêm về sức khỏe tâm lý";
  }

  /**
   * Tạo lời khuyên cá nhân hóa dựa trên kết quả test
   */
  private generatePersonalizedRecommendations(testResults: any[], userProfile: UserProfile): string[] {
    const recommendations: string[] = [];
    
    if (testResults.length === 0) {
      return [
        "Hãy bắt đầu với việc hoàn thành một số bài đánh giá để tôi có thể đưa ra lời khuyên phù hợp.",
        "Thực hành thiền chánh niệm 10-15 phút mỗi ngày.",
        "Duy trì lịch trình ngủ đều đặn và tập thể dục nhẹ nhàng."
      ];
    }

    const latestResult = testResults[testResults.length - 1];
    const level = latestResult.evaluation?.level || 'normal';

    // Khuyến nghị dựa trên mức độ
    switch (level) {
      case 'high':
      case 'severe':
        recommendations.push(
          "Tìm kiếm sự hỗ trợ từ chuyên gia tâm lý ngay lập tức",
          "Duy trì liên lạc với những người thân yêu",
          "Thực hành kỹ thuật grounding 5-4-3-2-1"
        );
        break;
      case 'moderate':
        recommendations.push(
          "Áp dụng các kỹ thuật thư giãn hàng ngày",
          "Cân nhắc tham khảo ý kiến chuyên gia",
          "Thiết lập routine tự chăm sóc"
        );
        break;
      default:
        recommendations.push(
          "Duy trì lối sống lành mạnh",
          "Tập thể dục đều đặn",
          "Theo dõi tình trạng cảm xúc"
        );
    }

    // Khuyến nghị dựa trên văn hóa Việt Nam
    if (userProfile.culturalContext === 'vietnamese') {
      recommendations.push(
        "Duy trì kết nối với gia đình và cộng đồng",
        "Tham gia các hoạt động tôn giáo hoặc tâm linh nếu phù hợp",
        "Tìm kiếm sự hỗ trợ từ các tổ chức cộng đồng địa phương"
      );
    }

    return recommendations.slice(0, 5);
  }

  /**
   * API chính để xử lý tin nhắn người dùng
   */
  async processMessage(
    message: string, 
    userProfile: UserProfile, 
    testResults: any[]
  ): Promise<AIResponse> {
    // Phát hiện khủng hoảng
    const crisis = this.detectCrisis(message);
    
    if (crisis) {
      return {
        text: crisis.response,
        confidence: 0.9,
        crisisDetected: true,
        recommendations: [],
        nextActions: crisis.emergencyContacts
      };
    }

    // Tạo prompt và gọi AI
    const prompt = this.createVietnamesePrompt(message, userProfile, testResults);
    const aiResponse = await this.callAIAPI(prompt);
    
    // Tạo khuyến nghị cá nhân hóa
    const recommendations = this.generatePersonalizedRecommendations(testResults, userProfile);
    
    return {
      text: aiResponse,
      confidence: 0.8,
      crisisDetected: false,
      recommendations,
      nextActions: []
    };
  }

  /**
   * Phân tích kết quả test và tạo insights
   */
  analyzeTestResults(testResults: any[]): any[] {
    const insights: any[] = [];
    
    if (!testResults || testResults.length === 0) {
      return insights;
    }

    const latestResults = testResults.slice(-5);

    // Phân tích xu hướng
    if (latestResults.length >= 2) {
      const scoreChanges = latestResults.slice(1).map((result, index) => {
        const previousScore = latestResults[index].totalScore;
        return result.totalScore - previousScore;
      });

      const averageChange = scoreChanges.reduce((sum, change) => sum + change, 0) / scoreChanges.length;

      if (averageChange > 2) {
        insights.push({
          type: 'progress',
          title: '📈 Xu hướng tích cực',
          content: `Điểm số của bạn đã cải thiện trung bình ${averageChange.toFixed(1)} điểm trong các bài test gần đây.`,
          severity: 'low'
        });
      } else if (averageChange < -2) {
        insights.push({
          type: 'alert',
          title: '⚠️ Cần quan tâm',
          content: `Điểm số có xu hướng giảm ${Math.abs(averageChange).toFixed(1)} điểm. Hãy xem xét các yếu tố ảnh hưởng.`,
          severity: 'medium'
        });
      }
    }

    // Phát hiện rủi ro cao
    const highRiskResults = latestResults.filter(result => 
      result.evaluation?.level === 'high' || result.evaluation?.level === 'severe'
    );

    if (highRiskResults.length > 0) {
      insights.push({
        type: 'alert',
        title: '🚨 Cần hỗ trợ chuyên nghiệp',
        content: `Kết quả cho thấy mức độ ${highRiskResults[0].evaluation?.level || 'cao'} trong ${highRiskResults[0].testType}.`,
        severity: 'high'
      });
    }

    return insights;
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;


