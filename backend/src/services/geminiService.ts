import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import config from '../config/environment';
import { logger } from '../utils/logger';

export class GeminiService {
  private genAI!: GoogleGenerativeAI;
  private model!: GenerativeModel;
  private isInitialized: boolean = false;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.warn('GEMINI_API_KEY is not set. GeminiService will not be initialized.');
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      
      // Use gemini-pro as primary (more stable)
      // gemini-1.5-flash may require different API tier
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      this.isInitialized = true;
      logger.info('✅ Gemini AI initialized successfully with gemini-pro');
    } catch (error) {
      logger.error('❌ Failed to initialize Gemini AI:', error);
      logger.error('Error details:', JSON.stringify(error, null, 2));
      
      // Try alternative model names
      const fallbackModels = ['gemini-1.0-pro', 'gemini-1.5-pro'];
      for (const modelName of fallbackModels) {
        try {
          logger.info(`Trying fallback model: ${modelName}`);
          this.model = this.genAI.getGenerativeModel({ model: modelName });
          this.isInitialized = true;
          logger.info(`✅ Gemini AI initialized successfully with ${modelName} (fallback)`);
          break;
        } catch (fallbackError) {
          logger.error(`❌ Fallback ${modelName} also failed:`, fallbackError);
        }
      }
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  async generateResponse(
    userMessage: string,
    context: any
  ): Promise<{ text: string; confidence: number }> {
    if (!this.isReady()) {
      logger.warn('GeminiService not ready, returning fallback response');
      return {
        text: 'Xin lỗi, dịch vụ AI tạm thời không khả dụng. Tôi vẫn có thể hỗ trợ bạn với các tính năng cơ bản.',
        confidence: 0.1,
      };
    }

    try {
      // Enhanced prompt with safety guidelines
      const prompt = `Bạn là CHUN - AI Companion chuyên về sức khỏe tâm lý cho phụ nữ Việt Nam.

⚠️ QUAN TRỌNG:
- Bạn KHÔNG phải chuyên gia y tế/tâm lý
- Bạn là công cụ hỗ trợ sàng lọc sơ bộ
- KHÔNG chẩn đoán bệnh lý hoặc kê đơn thuốc
- Mọi lời khuyên chỉ mang tính tham khảo
- Với vấn đề nghiêm trọng, hãy gặp chuyên gia ngay

🌸 TÍNH CÁCH:
- Ấm áp, đồng cảm, không phán xét
- Chuyên nghiệp nhưng gần gũi
- Sử dụng emoji phù hợp (💙 🌸 ⚠️)
- Xưng hô: "Mình" (CHUN) - "Bạn" (User)

🚨 CRISIS PROTOCOL:
- Nếu phát hiện ý định tự tử: Hotline NGAY 1900 599 958
- Nếu phát hiện bạo hành: Gọi 113 ngay lập tức
- Luôn khuyến nghị gặp chuyên gia cho vấn đề nghiêm trọng

Người dùng: ${userMessage}

Hãy trả lời bằng tiếng Việt, ngắn gọn và thân thiện.`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Validate response
      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from Gemini');
      }

      // Check for safety issues in response
      const safetyCheck = this.validateResponse(text);
      if (!safetyCheck.safe) {
        logger.warn('Unsafe response detected, using fallback', { issues: safetyCheck.issues });
        return {
          text: 'Xin lỗi, tôi cần thời gian để suy nghĩ về câu trả lời phù hợp. Bạn có thể chia sẻ thêm về tình huống của mình không?',
          confidence: 0.3,
        };
      }

      return { text, confidence: 0.9 };
    } catch (error) {
      logger.error('Error generating response from Gemini:', error);

      // Return fallback response instead of throwing
      return {
        text: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Bạn có thể thử lại sau hoặc liên hệ với chuyên gia tâm lý để được hỗ trợ.',
        confidence: 0.1,
      };
    }
  }

  async chat(
    userMessage: string,
    history: any[] = []
  ): Promise<{ text: string; confidence: number }> {
    if (!this.isReady()) {
      logger.warn('GeminiService not ready for chat, returning fallback response');
      return {
        text: 'Xin lỗi, dịch vụ AI tạm thời không khả dụng. Tôi vẫn có thể hỗ trợ bạn với các tính năng cơ bản.',
        confidence: 0.1,
      };
    }

    try {
      const chat = this.model.startChat({
        history: history.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })),
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.7,
        },
      });

      const result = await chat.sendMessage(userMessage);
      const response = result.response;
      const text = response.text();

      // Validate response
      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from Gemini chat');
      }

      // Check for safety issues in response
      const safetyCheck = this.validateResponse(text);
      if (!safetyCheck.safe) {
        logger.warn('Unsafe chat response detected, using fallback', {
          issues: safetyCheck.issues,
        });
        return {
          text: 'Xin lỗi, tôi cần thời gian để suy nghĩ về câu trả lời phù hợp. Bạn có thể chia sẻ thêm về tình huống của mình không?',
          confidence: 0.3,
        };
      }

      return { text, confidence: 0.9 };
    } catch (error) {
      logger.error('Error in chat with Gemini:', error);

      // Return fallback response instead of throwing
      return {
        text: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Bạn có thể thử lại sau hoặc liên hệ với chuyên gia tâm lý để được hỗ trợ.',
        confidence: 0.1,
      };
    }
  }

  /**
   * Validate AI response for safety and appropriateness
   */
  private validateResponse(text: string): { safe: boolean; issues: string[] } {
    const issues: string[] = [];
    const lowerText = text.toLowerCase();

    // Check for inappropriate content
    const inappropriateKeywords = [
      'tự tử',
      'suicide',
      'chết',
      'giết',
      'bạo hành',
      'abuse',
      'thuốc',
      'drug',
      'rượu',
      'alcohol',
      'ma túy',
    ];

    inappropriateKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        issues.push(`Contains potentially inappropriate keyword: ${keyword}`);
      }
    });

    // Check for medical advice
    if (
      lowerText.includes('uống thuốc') ||
      lowerText.includes('kê đơn') ||
      lowerText.includes('chẩn đoán')
    ) {
      issues.push('Contains medical advice');
    }

    // Check response length
    if (text.length > 1000) {
      issues.push('Response too long');
    }

    if (text.length < 10) {
      issues.push('Response too short');
    }

    return {
      safe: issues.length === 0,
      issues,
    };
  }

  /**
   * Get service status and health
   */
  getStatus(): { ready: boolean; model: string; initialized: boolean } {
    return {
      ready: this.isReady(),
      model: this.isReady() ? 'gemini-1.5-flash' : 'none',
      initialized: this.isInitialized,
    };
  }
}

export default new GeminiService();
