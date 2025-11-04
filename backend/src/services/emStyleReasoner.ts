/**
 * EM-style Reasoner - Simplified Version
 * First-principles approach, integrated with training data
 */

import { logger } from '../utils/logger';
import openAIService from './openAIService';
import { offlineTrainingService } from './offlineTrainingService';
import * as fs from 'fs';
import * as path from 'path';

interface TrainingSample {
  input: string;
  output: string;
  metadata: {
    topic: string;
    quality: number;
  };
}

interface EMResponse {
  message: string;
  decomposition?: {
    goal: string;
    constraints: string[];
    keyVariables: string[];
  };
  options?: Array<{
    label: string;
    description: string;
  }>;
  assumptions?: Array<{
    assumption: string;
    test: string;
  }>;
}

export class EMStyleReasoner {
  private trainingSamples: TrainingSample[] = [];
  private initialized: boolean = false;

  constructor() {
    this.loadTrainingSamples();
  }

  /**
   * Load training samples from JSONL
   */
  private loadTrainingSamples(): void {
    try {
      // Try multiple possible paths
      const possiblePaths = [
        path.join(__dirname, '../../training_samples.jsonl'),
        path.join(process.cwd(), 'training_samples.jsonl'),
        path.join(process.cwd(), 'backend/training_samples.jsonl'),
      ];

      let samplesPath: string | null = null;
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          samplesPath = testPath;
          break;
        }
      }

      if (samplesPath) {
        const content = fs.readFileSync(samplesPath, 'utf-8');
        this.trainingSamples = content
          .split('\n')
          .filter(line => line.trim())
          .map(line => JSON.parse(line));
        this.initialized = true;
        logger.info(`Loaded ${this.trainingSamples.length} training samples from ${samplesPath}`);
      } else {
        logger.warn('Training samples file not found, will use fallback responses');
      }
    } catch (error) {
      logger.error('Error loading training samples:', error);
    }
  }

  /**
   * Find similar examples from training data
   */
  private findSimilarExamples(userMessage: string, count: number = 3): TrainingSample[] {
    const lowerMessage = userMessage.toLowerCase();

    // Simple keyword matching
    const scored = this.trainingSamples.map(sample => {
      const sampleLower = sample.input.toLowerCase();
      let score = 0;

      // Keyword overlap
      const messageWords = lowerMessage.split(/\s+/);
      const sampleWords = sampleLower.split(/\s+/);
      const commonWords = messageWords.filter(w => sampleWords.includes(w) && w.length > 2);
      score = commonWords.length;

      return { sample, score };
    });

    // Sort by score and return top matches
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(item => item.sample);
  }

  /**
   * Build EM-style system prompt với few-shot examples
   */
  private buildEMPrompt(userMessage: string): string {
    const examples = this.findSimilarExamples(userMessage, 2);

    let prompt = `[ROLE] System

Bạn là "EM-style Reasoner": mô phỏng phong cách tư duy first-principles, tối ưu hệ thống.

Quy tắc:
1) Phân rã: (Mục tiêu) – (Ràng buộc) – (Biến số chính)
2) Đưa 2–3 phương án với trade-offs
3) Viết Assumption và Test
4) Ngắn – trực diện – có số liệu
5) Tuân thủ an toàn sức khỏe tâm thần

⚠️ AN TOÀN: KHÔNG đưa lời khuyên y khoa/pháp lý. Chỉ self-help an toàn.`;

    if (examples.length > 0) {
      prompt += '\n\n📚 EXAMPLES:\n\n';
      examples.forEach((ex, idx) => {
        prompt += `Example ${idx + 1}:\n`;
        prompt += `User: ${ex.input}\n`;
        prompt += `Bot: ${ex.output.substring(0, 300)}...\n\n`;
      });
    }

    prompt += '\n\nHãy phân tích vấn đề theo phương pháp trên.';

    return prompt;
  }

  /**
   * Generate EM-style response
   */
  async reason(
    userMessage: string,
    context?: {
      userId?: string;
      sessionId?: string;
      userProfile?: any;
      testResults?: any[];
    }
  ): Promise<EMResponse> {
    try {
      // Safety check
      const lowerMessage = userMessage.toLowerCase();
      const crisisKeywords = ['tự tử', 'tự sát', 'không muốn sống', 'chết đi'];

      if (crisisKeywords.some(kw => lowerMessage.includes(kw))) {
        return {
          message:
            '⚠️ Tôi phát hiện dấu hiệu khủng hoảng. Đây là tình huống cần chuyên gia ngay lập tức.\n\n' +
            '🆘 **VUI LÒNG LIÊN HỆ NGAY:**\n' +
            '• Tổng đài tư vấn tâm lý 24/7: 1900 599 958\n' +
            '• Cảnh sát khẩn cấp: 113\n\n' +
            'Bạn không đơn độc. Hãy tìm kiếm sự giúp đỡ ngay.',
        };
      }

      // Build prompt
      const systemPrompt = this.buildEMPrompt(userMessage);

      // Generate response
      let responseText: string;

      if (openAIService.isReady()) {
        try {
          const response = await openAIService.generateResponse(userMessage, {
            systemPrompt,
          });

          // Check confidence - low confidence means error fallback from openAIService
          if (response.confidence < 0.5) {
            logger.warn(
              'AI returned low confidence (likely error), using offline training service'
            );
            // Use offline training instead of basic fallback
            const offlineResponse = offlineTrainingService.generateOfflineResponse(userMessage);
            responseText = offlineResponse.message;
            logger.info(
              `📚 Offline training (confidence: ${offlineResponse.confidence.toFixed(2)}, source: ${offlineResponse.source})`
            );
          } else {
            responseText = response.text;

            // Validate AI response has structure
            const hasStructure =
              responseText.includes('Mục tiêu') ||
              responseText.includes('**Mục tiêu**') ||
              responseText.includes('Phương án') ||
              responseText.includes('**Phương án**') ||
              responseText.includes('Assumption') ||
              responseText.includes('**Assumption**');

            if (!hasStructure) {
              // AI response doesn't follow EM-style format, use offline training
              logger.warn('AI response lacks EM-style structure, using offline training service');
              const offlineResponse = offlineTrainingService.generateOfflineResponse(userMessage);
              responseText = offlineResponse.message;
              logger.info(
                `📚 Offline training (confidence: ${offlineResponse.confidence.toFixed(2)}, source: ${offlineResponse.source})`
              );
            }
          }
        } catch (error) {
          logger.error('AI generation failed:', error);
          responseText = this.generateFallback(userMessage);
        }
      } else {
        // Use structured fallback when AI not available
        // Try offline training service first for better quality
        const offlineResponse = offlineTrainingService.generateOfflineResponse(userMessage);
        responseText = offlineResponse.message;

        logger.info(
          `📚 Using offline training service (confidence: ${offlineResponse.confidence.toFixed(2)}, source: ${offlineResponse.source}, matches: ${offlineResponse.matchedSamples})`
        );
      }

      // Parse structure
      const structured = this.parseResponse(responseText, userMessage);

      return structured;
    } catch (error) {
      logger.error('Error in EM-style reasoning:', error);
      return {
        message: 'Xin lỗi, tôi gặp sự cố. Bạn có thể thử lại sau.',
      };
    }
  }

  /**
   * Parse response to extract structure
   */
  private parseResponse(responseText: string, originalMessage: string): EMResponse {
    // Try to extract structured components
    const goalMatch = responseText.match(/Mục tiêu[:\s]+(.+?)(?:\n|$)/i);
    const constraintsMatch = responseText.match(/Ràng buộc[:\s]+(.+?)(?:\n|$)/i);
    const variablesMatch = responseText.match(/Biến số[:\s]+(.+?)(?:\n|$)/i);

    const goal = goalMatch?.[1]?.trim() || this.inferGoal(originalMessage);
    const constraints = constraintsMatch
      ? constraintsMatch[1]
          .split(/[,;]/)
          .map(s => s.trim())
          .filter(Boolean)
      : ['10 phút/ngày', 'Self-help an toàn'];

    const keyVariables = variablesMatch
      ? variablesMatch[1]
          .split(/[,;]/)
          .map(s => s.trim())
          .filter(Boolean)
      : this.inferVariables(originalMessage);

    // Extract options
    const options: Array<{ label: string; description: string }> = [];
    const optionPattern = /Phương án\s*([A-Z])[:\s]+(.+?)(?=\nPhương án|$)/gis;
    let match;
    while ((match = optionPattern.exec(responseText)) !== null && options.length < 3) {
      options.push({
        label: match[1],
        description: match[2].trim(),
      });
    }

    // Extract assumptions
    const assumptions: Array<{ assumption: string; test: string }> = [];
    const assumptionMatch = responseText.match(/Assumption[:\s]+(.+?)(?=\nTest|$)/i);
    const testMatch = responseText.match(/Test[:\s]+(.+?)(?=\n|$)/i);

    if (assumptionMatch && testMatch) {
      assumptions.push({
        assumption: assumptionMatch[1].trim(),
        test: testMatch[1].trim(),
      });
    }

    return {
      message: responseText,
      decomposition: {
        goal,
        constraints,
        keyVariables,
      },
      options: options.length > 0 ? options : undefined,
      assumptions: assumptions.length > 0 ? assumptions : undefined,
    };
  }

  /**
   * Generate fallback response
   */
  private generateFallback(message: string): string {
    const lower = message.toLowerCase();

    // Priority: Sleep detection first (more specific)
    if (lower.includes('ngủ') || lower.includes('khó ngủ') || lower.includes('thức giấc')) {
      return `**Mục tiêu:** Ngủ ngon hơn trong 2 tuần
**Ràng buộc:** 10 phút/ngày, không thuốc
**Biến số chính:** Giờ đi ngủ, Caffeine sau 15:00, Màn hình trước ngủ

**Phương án:**
🔥 10× Phương án A: 120s thở box + tắt màn hình 60' trước ngủ
Phương án B: Nhật ký worry time 15' lúc 18:00

**Assumption:** Thiếu vệ sinh giấc ngủ là nguồn chính
**Test:** Latency < 20' sau 7 ngày

⚠️ Đây là mô phỏng phong cách tư duy, không thay thế chuyên gia.`;
    }

    if (lower.includes('kiệt sức') || lower.includes('mệt')) {
      return `**Mục tiêu:** Giảm kiệt sức trong 14 ngày
**Ràng buộc:** 10 phút/ngày, không thuốc
**Biến số chính:** Giờ ngủ, Tải công việc, Hỗ trợ xã hội

**Phương án:**
🔥 10× Phương án A: Box breathing 120s + tắt màn hình 60' trước ngủ
Phương án B: Worry time 15 phút lúc 18:00

**Assumption:** Thiếu vệ sinh giấc ngủ là yếu tố chính
**Test:** Theo dõi sleep latency 7 ngày; target < 20 phút

⚠️ Đây là mô phỏng phong cách tư duy, không thay thế chuyên gia.`;
    }

    if (lower.includes('lo âu') || lower.includes('sợ')) {
      return `**Mục tiêu:** Giảm lo âu trong 4 tuần
**Ràng buộc:** 2 buổi luyện tập, không chuyên gia
**Biến số chính:** Nhịp tim, Số câu nói trôi chảy

**Phương án:**
🔥 10× Phương án A: Diễn tập 3 vòng 2-2-1 phút + ghi âm
Phương án B: Kịch bản 3 bullet + hook 15s

**Assumption:** Thiếu chuẩn bị cấu trúc
**Test:** So nhịp tim trước/sau; target -10%

⚠️ Đây là mô phỏng phong cách tư duy, không thay thế chuyên gia.`;
    }

    return `**Mục tiêu:** Cải thiện tình trạng trong 2-4 tuần
**Ràng buộc:** 10 phút/ngày, Self-help an toàn
**Biến số chính:** Tần suất thực hành, Tuân thủ

**Phương án:**
Phương án A: Can thiệp ngắn 5-10 phút/ngày
Phương án B: Theo dõi nhật ký cảm xúc

**Assumption:** Can thiệp đúng sẽ có tác động
**Test:** Đo lường cải thiện sau 2 tuần

⚠️ Đây là mô phỏng phong cách tư duy, không thay thế chuyên gia.`;
  }

  private inferGoal(message: string): string {
    const lower = message.toLowerCase();
    if (lower.includes('kiệt sức')) {
      return 'Giảm kiệt sức trong 14 ngày';
    }
    if (lower.includes('lo âu')) {
      return 'Giảm lo âu trong 4 tuần';
    }
    if (lower.includes('ngủ')) {
      return 'Ngủ ngon hơn trong 2 tuần';
    }
    return 'Cải thiện tình trạng trong 2-4 tuần';
  }

  private inferVariables(message: string): string[] {
    const lower = message.toLowerCase();
    if (lower.includes('ngủ')) {
      return ['Giờ ngủ', 'Caffeine', 'Thời gian màn hình'];
    }
    if (lower.includes('công việc')) {
      return ['Tải công việc', 'Hỗ trợ xã hội'];
    }
    return ['Tần suất thực hành', 'Tuân thủ'];
  }
}

export const emStyleReasoner = new EMStyleReasoner();
export default emStyleReasoner;
