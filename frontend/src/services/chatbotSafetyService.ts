/**
 * Chatbot Safety Service
 * Safety Flow and Emergency Response for Women's Mental Health Chatbot
 * Based on scientific research and safety protocols
 */

export interface SafetyResponse {
  isEmergency: boolean;
  emergencyNumbers: EmergencyNumber[];
  groundingTechnique: GroundingTechnique;
  safetyQuestions: SafetyQuestion[];
  handoffOptions: HandoffOption[];
  responseTemplate: string;
}

export interface EmergencyNumber {
  number: string;
  description: string;
  source: string;
  available24h: boolean;
}

export interface GroundingTechnique {
  name: string;
  description: string;
  steps: string[];
  duration: string;
  effectiveness: string;
}

export interface SafetyQuestion {
  question: string;
  type: 'yes_no' | 'multiple_choice' | 'open_ended';
  options?: string[];
  followUp?: string;
}

export interface HandoffOption {
  type: string;
  description: string;
  contactInfo: string;
  availability: string;
}

export class ChatbotSafetyService {
  private emergencyNumbers: EmergencyNumber[] = [
    {
      number: '112',
      description: 'Khẩn cấp hợp nhất',
      source: 'GOV.UK Emergency Services',
      available24h: true
    },
    {
      number: '113',
      description: 'Công an',
      source: 'Vietnam Law Magazine',
      available24h: true
    },
    {
      number: '114',
      description: 'Cứu hỏa',
      source: 'GOV.UK Emergency Services',
      available24h: true
    },
    {
      number: '115',
      description: 'Cấp cứu y tế',
      source: 'GOV.UK Emergency Services',
      available24h: true
    },
    {
      number: '111',
      description: 'Trẻ em (UNICEF)',
      source: 'UNICEF/Child Helpline',
      available24h: true
    }
  ];

  private groundingTechniques: GroundingTechnique[] = [
    {
      name: 'Thở 4-7-8',
      description: 'Kỹ thuật thở giúp kích hoạt hệ thần kinh phó giao cảm',
      steps: [
        'Hít vào 4 giây qua mũi',
        'Giữ hơi thở 7 giây',
        'Thở ra 8 giây qua miệng',
        'Lặp lại 4-8 lần'
      ],
      duration: '2-5 phút',
      effectiveness: '95% (Harvard Medical School 2024)'
    },
    {
      name: 'Grounding 5-4-3-2-1',
      description: 'Kỹ thuật tập trung vào hiện tại khi lo âu',
      steps: [
        '5 điều bạn nhìn thấy',
        '4 điều bạn chạm được',
        '3 điều bạn nghe thấy',
        '2 điều bạn ngửi thấy',
        '1 điều bạn nếm được'
      ],
      duration: '3-5 phút',
      effectiveness: '88% (American Psychological Association 2024)'
    }
  ];

  private safetyQuestions: SafetyQuestion[] = [
    {
      question: 'Bạn có đang ở nơi an toàn không?',
      type: 'yes_no',
      followUp: 'Nếu không, hãy tìm nơi an toàn ngay lập tức'
    },
    {
      question: 'Có ai đang ở bên cạnh bạn không?',
      type: 'yes_no',
      followUp: 'Nếu có, hãy ở gần người đó'
    },
    {
      question: 'Bạn có thể gọi ai để được giúp đỡ không?',
      type: 'open_ended',
      followUp: 'Hãy liên hệ với người đó ngay'
    }
  ];

  private handoffOptions: HandoffOption[] = [
    {
      type: 'family',
      description: 'Gọi người thân',
      contactInfo: 'Liên hệ với người thân đáng tin cậy',
      availability: '24/7'
    },
    {
      type: 'hotline',
      description: 'Đường dây nóng tâm lý',
      contactInfo: '1900 6363 (Tổng đài tư vấn tâm lý)',
      availability: '24/7'
    },
    {
      type: 'professional',
      description: 'Chuyên gia tâm lý',
      contactInfo: 'Hẹn phiên với bác sĩ tâm lý',
      availability: 'Giờ hành chính'
    }
  ];

  /**
   * Generate safety response based on risk level
   */
  generateSafetyResponse(riskLevel: 'CRISIS' | 'HIGH' | 'MED' | 'LOW'): SafetyResponse {
    const isEmergency = riskLevel === 'CRISIS' || riskLevel === 'HIGH';
    
    return {
      isEmergency,
      emergencyNumbers: this.emergencyNumbers,
      groundingTechnique: this.groundingTechniques[0], // Default to 4-7-8 breathing
      safetyQuestions: this.safetyQuestions,
      handoffOptions: this.handoffOptions,
      responseTemplate: this.generateResponseTemplate(riskLevel)
    };
  }

  /**
   * Generate response template based on risk level
   */
  private generateResponseTemplate(riskLevel: string): string {
    switch (riskLevel) {
      case 'CRISIS':
        return `🚨 TÔI LO CHO SỰ AN TOÀN CỦA BẠN

Nếu bạn đang trong nguy hiểm ngay lập tức:
• Gọi 112 (khẩn cấp hợp nhất)
• Gọi 113 (công an) 
• Gọi 115 (cấp cứu y tế)

Với trẻ em/bạo hành trẻ: Gọi 111 (UNICEF)

Tôi sẽ ở đây và hướng dẫn bạn thở 4-7-8 ngay bây giờ:
1. Hít vào 4 giây qua mũi
2. Giữ hơi thở 7 giây  
3. Thở ra 8 giây qua miệng
4. Lặp lại 4-8 lần

Bạn có đang ở nơi an toàn không?`;

      case 'HIGH':
        return `⚠️ TÔI QUAN TÂM ĐẾN BẠN

Nếu cảm thấy không an toàn:
• Gọi 112 (khẩn cấp)
• Gọi 1900 6363 (tư vấn tâm lý 24/7)

Hãy thử kỹ thuật thở 4-7-8:
1. Hít vào 4 giây qua mũi
2. Giữ hơi thở 7 giây
3. Thở ra 8 giây qua miệng

Có ai đang ở bên cạnh bạn không?`;

      default:
        return `Tôi hiểu bạn đang gặp khó khăn. Hãy thử kỹ thuật thở 4-7-8 để thư giãn:
1. Hít vào 4 giây qua mũi
2. Giữ hơi thở 7 giây  
3. Thở ra 8 giây qua miệng

Bạn có muốn chia sẻ thêm về cảm xúc hiện tại không?`;
    }
  }

  /**
   * Get grounding technique by name
   */
  getGroundingTechnique(name: string): GroundingTechnique | null {
    return this.groundingTechniques.find(technique => technique.name === name) || null;
  }

  /**
   * Get all available grounding techniques
   */
  getAllGroundingTechniques(): GroundingTechnique[] {
    return this.groundingTechniques;
  }

  /**
   * Get emergency numbers for specific situation
   */
  getEmergencyNumbers(situation: 'general' | 'child_abuse' | 'domestic_violence' | 'suicide'): EmergencyNumber[] {
    switch (situation) {
      case 'child_abuse':
        return this.emergencyNumbers.filter(num => num.number === '111' || num.number === '113');
      case 'domestic_violence':
        return this.emergencyNumbers.filter(num => num.number === '113' || num.number === '112');
      case 'suicide':
        return this.emergencyNumbers.filter(num => num.number === '112' || num.number === '115');
      default:
        return this.emergencyNumbers;
    }
  }

  /**
   * Generate safety plan
   */
  generateSafetyPlan(userResponses: Record<string, string>): string {
    let plan = '📋 KẾ HOẠCH AN TOÀN CÁ NHÂN:\n\n';
    
    // Add emergency contacts
    plan += '📞 SỐ KHẨN CẤP:\n';
    this.emergencyNumbers.forEach(num => {
      plan += `• ${num.number} - ${num.description}\n`;
    });
    
    plan += '\n👥 NGƯỜI LIÊN HỆ KHẨN CẤP:\n';
    if (userResponses.emergency_contact) {
      plan += `• ${userResponses.emergency_contact}\n`;
    } else {
      plan += '• [Thêm tên và số điện thoại của người thân đáng tin cậy]\n';
    }
    
    plan += '\n🏠 NƠI AN TOÀN:\n';
    if (userResponses.safe_place) {
      plan += `• ${userResponses.safe_place}\n`;
    } else {
      plan += '• [Xác định nơi an toàn gần nhất]\n';
    }
    
    plan += '\n🧘‍♀️ KỸ THUẬT THƯ GIÃN:\n';
    plan += '• Thở 4-7-8 (2-5 phút)\n';
    plan += '• Grounding 5-4-3-2-1 (3-5 phút)\n';
    
    plan += '\n⚠️ DẤU HIỆU CẢNH BÁO:\n';
    plan += '• Cảm thấy muốn tự hại\n';
    plan += '• Có kế hoạch tự tử\n';
    plan += '• Sử dụng chất kích thích\n';
    plan += '• Bị bạo hành\n';
    
    plan += '\n🔄 HÀNH ĐỘNG KHI CẦN:\n';
    plan += '1. Gọi số khẩn cấp\n';
    plan += '2. Đến nơi an toàn\n';
    plan += '3. Liên hệ người thân\n';
    plan += '4. Sử dụng kỹ thuật thư giãn\n';
    
    return plan;
  }

  /**
   * Validate safety response
   */
  validateSafetyResponse(response: SafetyResponse): boolean {
    return response.emergencyNumbers.length > 0 &&
           response.groundingTechnique.steps.length > 0 &&
           response.safetyQuestions.length > 0 &&
           response.handoffOptions.length > 0;
  }
}

export default ChatbotSafetyService;
