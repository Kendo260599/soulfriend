/**
 * PGE EMOTION EXTRACTION SERVICE
 * 
 * Psychological Gravity Engine — Module 1: State Vector Estimation
 * 
 * Trích xuất 24 biến tâm lý từ văn bản hội thoại.
 * Pipeline: text → OpenAI structured output → state vector S(t)
 * 
 * Phương pháp hybrid:
 * 1. OpenAI GPT-4o-mini (primary) — structured JSON extraction
 * 2. Rule-based fallback — keyword & pattern matching (khi OpenAI unavailable)
 * 
 * @module services/pge/emotionExtractor
 * @version 1.0.0
 */

import axios from 'axios';
import { logger } from '../../utils/logger';
import { PSY_VARIABLES, IStateVector, PsyVariable } from '../../models/PsychologicalState';
import { openAICircuit } from '../circuitBreakerService';

// ════════════════════════════════════════════════════════════════
// OPENAI-BASED EXTRACTION
// ════════════════════════════════════════════════════════════════

const EXTRACTION_SYSTEM_PROMPT = `Bạn là một hệ thống phân tích tâm lý chuyên sâu.

NHIỆM VỤ: Phân tích đoạn văn bản (tiếng Việt hoặc tiếng Anh) từ người dùng và ước lượng 24 biến tâm lý.

MỖI BIẾN là một số thực từ 0.0 đến 1.0:
- 0.0 = không có dấu hiệu
- 0.5 = trung bình
- 1.0 = rất mạnh / rất rõ ràng

24 BIẾN TÂM LÝ:

[Cảm xúc tiêu cực]
1. stress — căng thẳng, áp lực
2. anxiety — lo âu, bồn chồn, sợ hãi mơ hồ
3. sadness — buồn bã, u sầu
4. anger — tức giận, bực bội, phẫn nộ
5. loneliness — cô đơn, bị bỏ rơi, thiếu kết nối
6. shame — xấu hổ, bẽ mặt
7. guilt — tội lỗi, hối hận
8. hopelessness — tuyệt vọng, không thấy lối thoát

[Cảm xúc tích cực]
9. hope — hy vọng, lạc quan
10. calmness — bình tĩnh, thư thái
11. joy — vui vẻ, hạnh phúc
12. gratitude — biết ơn, trân trọng

[Nhận thức]
13. selfWorth — cảm giác giá trị bản thân, tự tin
14. selfEfficacy — niềm tin vào khả năng của mình
15. rumination — suy nghĩ lặp đi lặp lại về điều tiêu cực
16. cognitiveClarity — sáng suốt, suy nghĩ rõ ràng

[Hành vi]
17. avoidance — né tránh, rút lui
18. helpSeeking — muốn tìm kiếm giúp đỡ
19. socialEngagement — kết nối xã hội, giao lưu
20. motivation — động lực, ý chí hành động

[Xã hội]
21. trustInOthers — tin tưởng người khác
22. perceivedSupport — cảm nhận được hỗ trợ
23. fearOfJudgment — sợ bị đánh giá, phán xét

[Năng lượng]
24. mentalFatigue — mệt mỏi tinh thần, kiệt sức

QUY TẮC:
- Phân tích nội dung ngôn ngữ LẪN ngữ cảnh ẩn
- Nếu văn bản quá ngắn hoặc không rõ ràng → trả về 0.3 cho hầu hết biến
- Trả về confidence (0-1) cho mức độ tin cậy của phân tích
- CHỈ trả về JSON, KHÔNG thêm giải thích

FORMAT ĐẦU RA (JSON):
{
  "stress": 0.0, "anxiety": 0.0, "sadness": 0.0, "anger": 0.0,
  "loneliness": 0.0, "shame": 0.0, "guilt": 0.0, "hopelessness": 0.0,
  "hope": 0.0, "calmness": 0.0, "joy": 0.0, "gratitude": 0.0,
  "selfWorth": 0.0, "selfEfficacy": 0.0, "rumination": 0.0, "cognitiveClarity": 0.0,
  "avoidance": 0.0, "helpSeeking": 0.0, "socialEngagement": 0.0, "motivation": 0.0,
  "trustInOthers": 0.0, "perceivedSupport": 0.0, "fearOfJudgment": 0.0,
  "mentalFatigue": 0.0,
  "confidence": 0.0
}`;

/**
 * Trích xuất vector trạng thái tâm lý từ văn bản bằng OpenAI
 */
async function extractWithOpenAI(text: string): Promise<{
  stateVector: IStateVector;
  confidence: number;
  method: 'openai';
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const client = axios.create({
    baseURL: 'https://api.openai.com/v1',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });

  const response: any = await openAICircuit.executeWithRetry(() =>
    client.post('/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: `Phân tích tâm lý đoạn văn sau:\n\n"${text}"` },
      ],
      max_tokens: 500,
      temperature: 0.2, // low temperature for consistent analysis
      response_format: { type: 'json_object' },
    })
  );

  const content = response.data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenAI');

  const parsed = JSON.parse(content);
  const confidence = parsed.confidence ?? 0.7;

  // Build state vector
  const stateVector: any = {};
  for (const v of PSY_VARIABLES) {
    const val = parseFloat(parsed[v]);
    stateVector[v] = isNaN(val) ? 0.3 : Math.max(0, Math.min(1, val));
  }

  return {
    stateVector: stateVector as IStateVector,
    confidence,
    method: 'openai',
  };
}

// ════════════════════════════════════════════════════════════════
// RULE-BASED FALLBACK EXTRACTION
// ════════════════════════════════════════════════════════════════

/** Vietnamese keyword patterns for each psychological variable */
const KEYWORD_PATTERNS: Record<PsyVariable, { positive: RegExp[]; weight: number }> = {
  stress: {
    positive: [
      /căng thẳng|áp lực|stress|quá tải|gánh nặng|bức bối|ngộp thở/i,
      /deadline|công việc nhiều|không kịp|chịu không nổi/i,
    ],
    weight: 0.6,
  },
  anxiety: {
    positive: [
      /lo âu|lo lắng|bồn chồn|sợ hãi|bất an|anxiety|lo ngại/i,
      /sợ|bối rối|hồi hộp|đánh trống ngực|khó thở/i,
    ],
    weight: 0.6,
  },
  sadness: {
    positive: [
      /buồn|u sầu|đau khổ|khóc|nước mắt|sad|trầm|chán nản/i,
      /tủi thân|đau lòng|xót xa|tang thương/i,
    ],
    weight: 0.6,
  },
  anger: {
    positive: [
      /tức giận|bực bội|phẫn nộ|giận dữ|angry|điên|cay đắng/i,
      /ức chế|bực mình|nổi khùng|ghét/i,
    ],
    weight: 0.5,
  },
  loneliness: {
    positive: [
      /cô đơn|lonely|một mình|bị bỏ rơi|không ai|lẻ loi/i,
      /thiếu kết nối|không có bạn|bơ vơ|cô lập/i,
    ],
    weight: 0.6,
  },
  shame: {
    positive: [
      /xấu hổ|bẽ mặt|shame|mất mặt|nhục|cảm thấy tệ/i,
      /ngại ngùng|e thẹn|xấu xa/i,
    ],
    weight: 0.5,
  },
  guilt: {
    positive: [
      /tội lỗi|hối hận|guilt|ân hận|lỗi lầm|sai lầm/i,
      /đáng trách|lương tâm|mắc lỗi/i,
    ],
    weight: 0.5,
  },
  hopelessness: {
    positive: [
      /tuyệt vọng|vô vọng|hopeless|không thấy lối thoát|bế tắc/i,
      /không còn cách|hết hy vọng|không thể thay đổi|chấm dứt/i,
    ],
    weight: 0.7,
  },
  hope: {
    positive: [
      /hy vọng|lạc quan|tương lai|sẽ tốt hơn|hope|tin tưởng/i,
      /sáng sủa|cơ hội|có thể|tiến bộ/i,
    ],
    weight: 0.5,
  },
  calmness: {
    positive: [
      /bình tĩnh|thư thái|calm|relax|tĩnh|yên bình|thanh thản/i,
      /nhẹ nhàng|thư giãn|dễ chịu/i,
    ],
    weight: 0.5,
  },
  joy: {
    positive: [
      /vui|hạnh phúc|joy|happy|hài lòng|phấn khởi|tuyệt vời/i,
      /cười|tươi|sung sướng|thích thú/i,
    ],
    weight: 0.5,
  },
  gratitude: {
    positive: [
      /biết ơn|cảm ơn|gratitude|trân trọng|thank|appreciate/i,
      /may mắn|phúc|quý|quý giá/i,
    ],
    weight: 0.4,
  },
  selfWorth: {
    positive: [
      /giá trị bản thân|tự tin|self.?worth|xứng đáng|tự hào/i,
      /tin vào mình|có giá trị|đáng giá/i,
    ],
    weight: 0.5,
  },
  selfEfficacy: {
    positive: [
      /có thể làm được|tự tin|efficacy|năng lực|khả năng/i,
      /giỏi|tài|thành công|đạt được/i,
    ],
    weight: 0.5,
  },
  rumination: {
    positive: [
      /suy nghĩ mãi|lặp đi lặp lại|rumination|cứ nghĩ|ám ảnh/i,
      /không ngừng nghĩ|xoay quanh|nung nấu|trăn trở/i,
    ],
    weight: 0.6,
  },
  cognitiveClarity: {
    positive: [
      /sáng suốt|rõ ràng|hiểu|clarity|minh mẫn|sáng tạo/i,
      /thấu hiểu|nhận ra|logic|tỉnh táo/i,
    ],
    weight: 0.4,
  },
  avoidance: {
    positive: [
      /né tránh|trốn|avoid|rút lui|không muốn gặp|cách ly/i,
      /từ chối|bỏ|không đối mặt|chạy trốn/i,
    ],
    weight: 0.5,
  },
  helpSeeking: {
    positive: [
      /giúp đỡ|help|tư vấn|cần ai đó|hỗ trợ|khuyên/i,
      /nhờ|hỏi|chia sẻ|tìm kiếm sự giúp/i,
    ],
    weight: 0.5,
  },
  socialEngagement: {
    positive: [
      /giao lưu|kết nối|bạn bè|social|gặp gỡ|hội|nhóm/i,
      /cùng nhau|chia sẻ|tham gia|hoạt động/i,
    ],
    weight: 0.4,
  },
  motivation: {
    positive: [
      /động lực|muốn|motivation|quyết tâm|ý chí|cố gắng/i,
      /nỗ lực|phấn đấu|mục tiêu|làm được/i,
    ],
    weight: 0.5,
  },
  trustInOthers: {
    positive: [
      /tin tưởng|trust|tin người|đáng tin|an tâm/i,
      /tin cậy|trông cậy|phó thác/i,
    ],
    weight: 0.4,
  },
  perceivedSupport: {
    positive: [
      /được hỗ trợ|support|có người|gia đình|bạn bè giúp/i,
      /không cô đơn|có ai đó|được quan tâm/i,
    ],
    weight: 0.4,
  },
  fearOfJudgment: {
    positive: [
      /sợ bị đánh giá|phán xét|judgment|dị nghị|chỉ trích/i,
      /người ta nói|bị cười|sợ người khác nghĩ/i,
    ],
    weight: 0.5,
  },
  mentalFatigue: {
    positive: [
      /mệt mỏi|kiệt sức|fatigue|burnout|exhausted|kiệt quệ/i,
      /không còn sức|hết năng lượng|não cá vàng|quá mệt/i,
    ],
    weight: 0.6,
  },
};

/** Negative indicators that REDUCE a variable's score */
const NEGATIVE_INDICATORS: Partial<Record<PsyVariable, RegExp[]>> = {
  hope: [/tuyệt vọng|vô vọng|hết hy vọng|không còn/i],
  calmness: [/căng thẳng|lo âu|bồn chồn|phát điên/i],
  selfWorth: [/vô dụng|không ra gì|tệ hại|thất bại|kém cỏi/i],
  selfEfficacy: [/không thể|bất lực|vô năng|thất bại/i],
  cognitiveClarity: [/mù mờ|rối|không hiểu|bối rối|lú lẫn/i],
  motivation: [/không muốn|chán|lười|mất hứng|bỏ cuộc/i],
  trustInOthers: [/phản bội|lừa dối|không tin|nghi ngờ|đề phòng/i],
  socialEngagement: [/cô lập|một mình|không gặp|né tránh/i],
};

/**
 * Rule-based fallback extraction using Vietnamese keyword patterns
 */
function extractWithRules(text: string): {
  stateVector: IStateVector;
  confidence: number;
  method: 'rule_based';
} {
  const normalizedText = text.toLowerCase().normalize('NFC');
  const stateVector: any = {};

  for (const variable of PSY_VARIABLES) {
    let score = 0.15; // baseline
    const patterns = KEYWORD_PATTERNS[variable];

    // Check positive indicators
    for (const regex of patterns.positive) {
      if (regex.test(normalizedText)) {
        score += patterns.weight;
      }
    }

    // Check negative indicators
    const negPatterns = NEGATIVE_INDICATORS[variable];
    if (negPatterns) {
      for (const regex of negPatterns) {
        if (regex.test(normalizedText)) {
          score = Math.max(0, score - 0.3);
        }
      }
    }

    stateVector[variable] = Math.max(0, Math.min(1, score));
  }

  // Intensity modifier — longer messages tend to have stronger signals
  const wordCount = normalizedText.split(/\s+/).length;
  if (wordCount > 50) {
    // Amplify detected signals slightly for longer messages
    for (const v of PSY_VARIABLES) {
      if (stateVector[v] > 0.3) {
        stateVector[v] = Math.min(1, stateVector[v] * 1.1);
      }
    }
  }

  return {
    stateVector: stateVector as IStateVector,
    confidence: 0.4, // rule-based has lower confidence
    method: 'rule_based',
  };
}

// ════════════════════════════════════════════════════════════════
// MAIN EXTRACTION SERVICE
// ════════════════════════════════════════════════════════════════

class EmotionExtractionService {
  /**
   * Trích xuất vector trạng thái tâm lý từ văn bản.
   * Sử dụng OpenAI nếu khả dụng, fallback sang rule-based.
   */
  async extract(text: string): Promise<{
    stateVector: IStateVector;
    confidence: number;
    method: 'openai' | 'rule_based' | 'hybrid';
  }> {
    if (!text || text.trim().length < 3) {
      return {
        stateVector: this.neutralState(),
        confidence: 0.1,
        method: 'rule_based',
      };
    }

    try {
      // Primary: OpenAI extraction
      const result = await extractWithOpenAI(text);
      logger.debug('[PGE EmotionExtractor] OpenAI extraction successful', {
        confidence: result.confidence,
      });
      return result;
    } catch (error) {
      logger.warn('[PGE EmotionExtractor] OpenAI extraction failed, using rule-based fallback:', 
        error instanceof Error ? error.message : error
      );

      // Fallback: Rule-based extraction
      return extractWithRules(text);
    }
  }

  /**
   * Batch extract: trích xuất từ nhiều messages cùng lúc
   */
  async batchExtract(texts: string[]): Promise<Array<{
    stateVector: IStateVector;
    confidence: number;
    method: 'openai' | 'rule_based' | 'hybrid';
  }>> {
    // Process sequentially to avoid rate limiting
    const results = [];
    for (const text of texts) {
      results.push(await this.extract(text));
    }
    return results;
  }

  /**
   * Trạng thái trung tính (neutral baseline)
   */
  neutralState(): IStateVector {
    const s: any = {};
    for (const v of PSY_VARIABLES) {
      s[v] = 0.2; // low baseline
    }
    // Positive should be at moderate baseline
    s.hope = 0.4;
    s.calmness = 0.4;
    s.selfWorth = 0.4;
    s.selfEfficacy = 0.4;
    s.motivation = 0.4;
    s.cognitiveClarity = 0.4;
    return s as IStateVector;
  }
}

export const emotionExtractionService = new EmotionExtractionService();
export default emotionExtractionService;
