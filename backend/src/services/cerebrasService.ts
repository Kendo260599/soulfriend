import axios from 'axios';
import { logger } from '../utils/logger';
import { cerebrasCircuit } from './circuitBreakerService';

export class CerebrasService {
  private client: any;
  private isInitialized: boolean = false;
  private readonly MODEL = 'qwen-3-235b-a22b-instruct-2507';
  private readonly API_URL = 'https://api.cerebras.ai/v1/chat/completions';

  constructor() {
    const apiKey = process.env.CEREBRAS_API_KEY;
    if (!apiKey) {
      logger.warn('CEREBRAS_API_KEY is not set. CerebrasService will not be initialized.');
      return;
    }

    try {
      this.client = axios.create({
        baseURL: 'https://api.cerebras.ai/v1',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 seconds
      });

      this.isInitialized = true;
      logger.info('✅ Cerebras AI initialized successfully with Qwen 3 235B');
    } catch (error) {
      logger.error('❌ Failed to initialize Cerebras AI:', error);
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
      logger.warn('CerebrasService not ready, returning fallback response');
      return {
        text: 'Xin lỗi, dịch vụ AI tạm thời không khả dụng. Tôi vẫn có thể hỗ trợ bạn với các tính năng cơ bản.',
        confidence: 0.1,
      };
    }

    try {
      // Use custom system prompt if provided, otherwise use default CHUN prompt
      const systemPrompt =
        context?.systemPrompt ||
        `Bạn là CHUN - AI Companion chuyên về sức khỏe tâm lý cho phụ nữ Việt Nam.

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
- Luôn khuyến nghị gặp chuyên gia cho vấn đề nghiêm trọng`;

      const response: any = await cerebrasCircuit.executeWithRetry(() =>
        this.client.post('/chat/completions', {
          model: this.MODEL,
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userMessage,
            },
          ],
          max_tokens: 300,
          temperature: 0.7,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1,
        })
      );

      const aiResponse = response.data.choices[0]?.message?.content;

      if (!aiResponse || aiResponse.trim().length === 0) {
        throw new Error('Empty response from Cerebras');
      }

      // Validate response
      const safetyCheck = this.validateResponse(aiResponse);
      if (!safetyCheck.safe) {
        logger.warn('Unsafe response detected, using fallback', { issues: safetyCheck.issues });
        return {
          text: 'Xin lỗi, tôi cần thời gian để suy nghĩ về câu trả lời phù hợp. Bạn có thể chia sẻ thêm về tình huống của mình không?',
          confidence: 0.3,
        };
      }

      logger.info('✅ Cerebras AI response generated successfully');
      return { text: aiResponse, confidence: 0.95 };
    } catch (error: any) {
      logger.error('❌ Cerebras API error:', error.message);

      if (error.response?.status === 401) {
        logger.error('❌ Cerebras API key invalid or expired');
        return {
          text: 'Xin lỗi, dịch vụ AI tạm thời không khả dụng. Tôi vẫn có thể hỗ trợ bạn với các tính năng cơ bản.',
          confidence: 0.1,
        };
      } else if (error.response?.status === 429) {
        logger.warn('⚠️ Cerebras API rate limit exceeded');
        return {
          text: 'Mình hiểu bạn đang cần hỗ trợ. Do giới hạn dịch vụ, mình sẽ lắng nghe và cố gắng giúp bạn với những gì mình có thể. Bạn muốn chia sẻ gì với mình? 💙',
          confidence: 0.5,
        };
      } else {
        logger.error('❌ Cerebras API error:', error.message);
        return {
          text: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Bạn có thể thử lại sau hoặc liên hệ với chuyên gia tâm lý để được hỗ trợ.',
          confidence: 0.1,
        };
      }
    }
  }

  async chat(
    userMessage: string,
    history: any[] = []
  ): Promise<{ text: string; confidence: number }> {
    if (!this.isReady()) {
      logger.warn('CerebrasService not ready for chat, returning fallback response');
      return {
        text: 'Xin lỗi, dịch vụ AI tạm thời không khả dụng. Tôi vẫn có thể hỗ trợ bạn với các tính năng cơ bản.',
        confidence: 0.1,
      };
    }

    try {
      const systemPrompt =
        'Bạn là CHUN - AI Companion chuyên về sức khỏe tâm lý cho phụ nữ Việt Nam. Bạn ấm áp, đồng cảm và chuyên nghiệp. Sử dụng tiếng Việt và xưng hô "Mình" (CHUN) - "Bạn" (User).';

      const messages = [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...history.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content,
        })),
        {
          role: 'user',
          content: userMessage,
        },
      ];

      const response: any = await cerebrasCircuit.executeWithRetry(() =>
        this.client.post('/chat/completions', {
          model: this.MODEL,
          messages: messages,
          max_tokens: 300,
          temperature: 0.7,
          top_p: 0.9,
        })
      );

      const aiResponse = response.data.choices[0]?.message?.content;

      if (!aiResponse || aiResponse.trim().length === 0) {
        throw new Error('Empty response from Cerebras chat');
      }

      // Validate response
      const safetyCheck = this.validateResponse(aiResponse);
      if (!safetyCheck.safe) {
        logger.warn('Unsafe chat response detected, using fallback', {
          issues: safetyCheck.issues,
        });
        return {
          text: 'Xin lỗi, tôi cần thời gian để suy nghĩ về câu trả lời phù hợp. Bạn có thể chia sẻ thêm về tình huống của mình không?',
          confidence: 0.3,
        };
      }

      return { text: aiResponse, confidence: 0.95 };
    } catch (error) {
      logger.error('Error in chat with Cerebras:', error);
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
      model: this.isReady() ? this.MODEL : 'none',
      initialized: this.isInitialized,
    };
  }
}

// DEPRECATED: CerebrasService has been replaced by OpenAIService
// Export commented out to prevent initialization warning
// export default new CerebrasService();
