import axios from 'axios';
import { logger } from '../utils/logger';
import { geminiCircuit } from './circuitBreakerService';

/**
 * Gemini AI Service
 * Replaces CerebrasService with Google Gemini API
 */
export class GeminiService {
  private client: any;
  private isInitialized: boolean = false;
  private readonly MODEL = 'gemini-1.5-pro';
  private readonly API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.warn('GEMINI_API_KEY is not set. GeminiService will not be initialized.');
      return;
    }

    try {
      this.client = axios.create({
        baseURL: 'https://generativelanguage.googleapis.com/v1beta',
        params: {
          key: apiKey,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 seconds
      });

      this.isInitialized = true;
      logger.info('✅ Gemini AI initialized successfully with Gemini 1.5 Pro');
    } catch (error) {
      logger.error('❌ Failed to initialize Gemini AI:', error);
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Generate response using Gemini API
   */
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

      // Gemini API format
      const prompt = `${systemPrompt}\n\nNgười dùng: ${userMessage}\n\nCHUN:`;

      const response: any = await geminiCircuit.executeWithRetry(() =>
        this.client.post(`/models/${this.MODEL}:generateContent`, {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7,
            topP: 0.9,
            topK: 40,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
          ],
        })
      );

      const aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!aiResponse || aiResponse.trim().length === 0) {
        // Check if blocked by safety settings
        if (response.data.promptFeedback?.blockReason) {
          logger.warn(
            'Response blocked by safety settings:',
            response.data.promptFeedback.blockReason
          );
          return {
            text: 'Xin lỗi, tôi cần thời gian để suy nghĩ về câu trả lời phù hợp. Bạn có thể chia sẻ thêm về tình huống của mình không?',
            confidence: 0.3,
          };
        }
        throw new Error('Empty response from Gemini');
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

      logger.info('✅ Gemini AI response generated successfully');
      return { text: aiResponse.trim(), confidence: 0.95 };
    } catch (error: any) {
      logger.error('❌ Gemini API error:', error.message);

      if (error.response?.status === 401 || error.response?.status === 403) {
        logger.error('❌ Gemini API key invalid or expired');
        return {
          text: 'Xin lỗi, dịch vụ AI tạm thời không khả dụng. Tôi vẫn có thể hỗ trợ bạn với các tính năng cơ bản.',
          confidence: 0.1,
        };
      } else if (error.response?.status === 429) {
        logger.warn('⚠️ Gemini API rate limit exceeded');
        return {
          text: 'Mình hiểu bạn đang cần hỗ trợ. Do giới hạn dịch vụ, mình sẽ lắng nghe và cố gắng giúp bạn với những gì mình có thể. Bạn muốn chia sẻ gì với mình? 💙',
          confidence: 0.5,
        };
      } else {
        logger.error('❌ Gemini API error:', error.message);
        return {
          text: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Bạn có thể thử lại sau hoặc liên hệ với chuyên gia tâm lý để được hỗ trợ.',
          confidence: 0.1,
        };
      }
    }
  }

  /**
   * Chat with conversation history
   */
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
      const systemPrompt =
        'Bạn là CHUN - AI Companion chuyên về sức khỏe tâm lý cho phụ nữ Việt Nam. Bạn ấm áp, đồng cảm và chuyên nghiệp. Sử dụng tiếng Việt và xưng hô "Mình" (CHUN) - "Bạn" (User).';

      // Build conversation history
      const contents = [
        {
          parts: [{ text: systemPrompt }],
          role: 'user',
        },
      ];

      // Add history
      history.forEach(msg => {
        contents.push({
          parts: [{ text: msg.content }],
          role: msg.sender === 'user' ? 'user' : 'model',
        });
      });

      // Add current message
      contents.push({
        parts: [{ text: userMessage }],
        role: 'user',
      });

      const response: any = await geminiCircuit.executeWithRetry(() =>
        this.client.post(`/models/${this.MODEL}:generateContent`, {
          contents: contents,
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7,
            topP: 0.9,
            topK: 40,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
          ],
        })
      );

      const aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!aiResponse || aiResponse.trim().length === 0) {
        if (response.data.promptFeedback?.blockReason) {
          logger.warn(
            'Chat response blocked by safety settings:',
            response.data.promptFeedback.blockReason
          );
          return {
            text: 'Xin lỗi, tôi cần thời gian để suy nghĩ về câu trả lời phù hợp. Bạn có thể chia sẻ thêm về tình huống của mình không?',
            confidence: 0.3,
          };
        }
        throw new Error('Empty response from Gemini chat');
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

      return { text: aiResponse.trim(), confidence: 0.95 };
    } catch (error) {
      logger.error('Error in chat with Gemini:', error);
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
    if (text.length > 2000) {
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

export default new GeminiService();











