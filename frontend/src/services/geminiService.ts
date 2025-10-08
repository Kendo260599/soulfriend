/**
 * Google Gemini AI Service
 * Tích hợp Google Gemini API cho chatbot
 */

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'AIzaSyBaswf5ksxu1g7WvhS2_Hy7PHqWpjZu8LM';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface GeminiResponse {
  text: string;
  success: boolean;
  error?: string;
}

class GeminiService {
  private apiKey: string;
  private conversationHistory: GeminiMessage[] = [];
  private isAvailable: boolean | null = null;

  constructor(apiKey: string = GEMINI_API_KEY) {
    this.apiKey = apiKey;
  }

  /**
   * Kiểm tra xem API key có hoạt động không
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing Gemini API connection...');
      
      const response = await fetch(
        `${GEMINI_API_URL}?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: 'Hello' }]
            }]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Gemini API is working!', data);
        this.isAvailable = true;
        return true;
      } else {
        const error = await response.text();
        console.error('❌ Gemini API error:', error);
        this.isAvailable = false;
        return false;
      }
    } catch (error) {
      console.error('❌ Gemini API connection failed:', error);
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Gửi message tới Gemini và nhận response
   */
  async sendMessage(
    userMessage: string,
    context?: {
      testResults?: any[];
      userProfile?: any;
      systemPrompt?: string;
    }
  ): Promise<GeminiResponse> {
    try {
      // Build system prompt với CHUN personality
      const { buildCHUNSystemPrompt } = await import('./chatbotPersonality');
      const systemPrompt = context?.systemPrompt || buildCHUNSystemPrompt(context?.testResults);

      // Build messages array cho Gemini
      const messages: GeminiMessage[] = [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        },
        {
          role: 'model',
          parts: [{ text: 'Tôi hiểu. Tôi sẽ hỗ trợ bạn một cách chuyên nghiệp và ân cần về sức khỏe tâm lý.' }]
        },
        ...this.conversationHistory,
        {
          role: 'user',
          parts: [{ text: userMessage }]
        }
      ];

      console.log('📤 Sending to Gemini:', userMessage);

      const response = await fetch(
        `${GEMINI_API_URL}?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: messages.map(msg => ({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: msg.parts
            })),
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            },
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_NONE'
              },
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_NONE'
              },
              {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_NONE'
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_NONE'
              }
            ]
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API error:', errorText);
        
        // Parse error để xem API key có hợp lệ không
        if (errorText.includes('API_KEY_INVALID') || errorText.includes('invalid')) {
          throw new Error('API key không hợp lệ hoặc đã hết hạn');
        }
        
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 Gemini response:', data);

      // Extract text từ response
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        // Fallback response dựa trên context
        if (userMessage.toLowerCase().includes('kết quả') || userMessage.toLowerCase().includes('test')) {
          text = `Tôi hiểu bạn muốn biết về kết quả test. Dựa trên kết quả đã hoàn thành, tôi có thể giúp bạn hiểu:

📊 **Phân tích kết quả:**
- Điểm số của bạn phản ánh mức độ hiện tại
- Kết quả chỉ mang tính tham khảo
- Cần đánh giá chuyên môn để chẩn đoán chính xác

💡 **Gợi ý tiếp theo:**
- Thảo luận với chuyên gia tâm lý
- Thực hành các kỹ thuật thư giãn
- Theo dõi tình trạng theo thời gian

Bạn có muốn tôi giải thích chi tiết về test nào không?`;
        } else {
          text = `Xin chào! Tôi là CHUN - AI Companion hỗ trợ sức khỏe tâm lý.

Tôi có thể giúp bạn:
- Hiểu kết quả test tâm lý
- Gợi ý kỹ thuật quản lý stress
- Hướng dẫn tìm kiếm hỗ trợ chuyên nghiệp
- Cung cấp tài nguyên tự giúp đỡ

Bạn muốn trao đổi về điều gì?`;
        }
      }

      // Lưu vào conversation history
      this.conversationHistory.push(
        {
          role: 'user',
          parts: [{ text: userMessage }]
        },
        {
          role: 'model',
          parts: [{ text }]
        }
      );

      // Giới hạn history để không quá dài
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10);
      }

      return {
        text,
        success: true
      };

    } catch (error) {
      console.error('❌ Error calling Gemini API:', error);
      
      // Fallback response dựa trên context
      let fallbackText = '';
      if (userMessage.toLowerCase().includes('kết quả') || userMessage.toLowerCase().includes('test')) {
        fallbackText = `Tôi hiểu bạn muốn biết về kết quả test. Dựa trên kết quả đã hoàn thành, tôi có thể giúp bạn hiểu:

📊 **Phân tích kết quả:**
- Điểm số của bạn phản ánh mức độ hiện tại
- Kết quả chỉ mang tính tham khảo
- Cần đánh giá chuyên môn để chẩn đoán chính xác

💡 **Gợi ý tiếp theo:**
- Thảo luận với chuyên gia tâm lý
- Thực hành các kỹ thuật thư giãn
- Theo dõi tình trạng theo thời gian

Bạn có muốn tôi giải thích chi tiết về test nào không?`;
      } else {
        fallbackText = `Xin chào! Tôi là CHUN - AI Companion hỗ trợ sức khỏe tâm lý.

Tôi có thể giúp bạn:
- Hiểu kết quả test tâm lý
- Gợi ý kỹ thuật quản lý stress
- Hướng dẫn tìm kiếm hỗ trợ chuyên nghiệp
- Cung cấp tài nguyên tự giúp đỡ

Bạn muốn trao đổi về điều gì?`;
      }
      
      return {
        text: fallbackText,
        success: true, // Vẫn trả về success để không hiển thị lỗi
        error: (error as Error).message
      };
    }
  }

  /**
   * Reset conversation history
   */
  resetConversation(): void {
    this.conversationHistory = [];
    console.log('🔄 Conversation history cleared');
  }

  /**
   * Check if Gemini is available
   */
  async isGeminiAvailable(): Promise<boolean> {
    if (this.isAvailable !== null) {
      return this.isAvailable;
    }
    return await this.testConnection();
  }

  /**
   * Get API status
   */
  getStatus(): {
    isConfigured: boolean;
    isAvailable: boolean | null;
    apiKeyLength: number;
  } {
    return {
      isConfigured: !!this.apiKey,
      isAvailable: this.isAvailable,
      apiKeyLength: this.apiKey?.length || 0
    };
  }
}

// Singleton instance
export const geminiService = new GeminiService();

export default geminiService;

