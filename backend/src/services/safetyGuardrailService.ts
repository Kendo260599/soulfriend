/**
 * SAFETY GUARDRAIL SERVICE
 * 
 * V5 Learning Pipeline — Module 9: Safety Guardrails
 * Đảm bảo AI không drift khỏi giới hạn an toàn khi tự học
 * 
 * Quy tắc cứng:
 * 1. KHÔNG chẩn đoán bệnh
 * 2. KHÔNG khuyên dùng thuốc
 * 3. KHÔNG thay thế chuyên gia
 * 4. KHÔNG tiết lộ thông tin cá nhân
 * 5. LUÔN escalate khi có dấu hiệu khủng hoảng
 * 
 * @module services/safetyGuardrailService
 * @version 5.0.0
 */

import { logger } from '../utils/logger';

// ===========================
// GUARDRAIL RULES
// ===========================

interface GuardrailViolation {
  rule: string;
  severity: 'warning' | 'critical' | 'block';
  description: string;
  matchedText?: string;
}

interface GuardrailResult {
  safe: boolean;
  violations: GuardrailViolation[];
  sanitizedResponse?: string;
  blockReason?: string;
}

// Patterns that indicate diagnosis attempts
const DIAGNOSIS_PATTERNS = [
  /bạn (bị|mắc|có) (rối loạn|bệnh|trầm cảm lâm sàng|rối loạn lo âu|GAD|MDD|PTSD|OCD|BPD)/gi,
  /chẩn đoán.{0,30}(là|rằng|cho thấy)/gi,
  /bạn đang (bị|mắc) bệnh/gi,
  /kết luận.{0,20}(rối loạn|bệnh)/gi,
  /bạn cần được (chẩn đoán|xác nhận)/gi,
];

// Patterns that suggest medication advice
const MEDICATION_PATTERNS = [
  /nên (uống|dùng|sử dụng).{0,30}(thuốc|viên|liều)/gi,
  /kê đơn|toa thuốc|đơn thuốc/gi,
  /(thuốc|viên).{0,20}(chống trầm cảm|giảm lo âu|an thần|ngủ)/gi,
  /sertraline|fluoxetine|escitalopram|paroxetine|venlafaxine|benzodiazepine|xanax|valium/gi,
  /tăng liều|giảm liều|ngừng thuốc/gi,
];

// Patterns that try to replace professional help
const REPLACEMENT_PATTERNS = [
  /bạn không cần (bác sĩ|chuyên gia|tư vấn)/gi,
  /thay vì gặp (bác sĩ|chuyên gia)/gi,
  /không cần.{0,20}(trị liệu|tham vấn)/gi,
  /tôi có thể (chữa|điều trị) cho bạn/gi,
];

// Patterns indicating PII leakage
const PII_LEAKAGE_PATTERNS = [
  /tên (thật|đầy đủ) của bạn là/gi,
  /số (điện thoại|CMND|CCCD) của bạn/gi,
  /địa chỉ (nhà|cơ quan) của bạn/gi,
  /email.{0,20}@/gi,
];

// Crisis keywords that MUST trigger escalation
const CRISIS_KEYWORDS = [
  'tự tử', 'muốn chết', 'kết liễu', 'tự vẫn',
  'tự hại', 'cắt tay', 'tự gây thương tích',
  'không muốn sống', 'chấm dứt tất cả',
  'giết', 'đánh đập', 'bạo lực',
];

class SafetyGuardrailService {
  /**
   * Kiểm tra phản hồi AI trước khi gửi cho user
   */
  checkResponse(aiResponse: string, userMessage: string): GuardrailResult {
    const violations: GuardrailViolation[] = [];

    // Rule 1: No direct diagnosis
    for (const pattern of DIAGNOSIS_PATTERNS) {
      const match = aiResponse.match(pattern);
      if (match) {
        violations.push({
          rule: 'NO_DIAGNOSIS',
          severity: 'critical',
          description: 'AI đang cố chẩn đoán bệnh',
          matchedText: match[0],
        });
      }
    }

    // Rule 2: No medication advice
    for (const pattern of MEDICATION_PATTERNS) {
      const match = aiResponse.match(pattern);
      if (match) {
        violations.push({
          rule: 'NO_MEDICATION',
          severity: 'critical',
          description: 'AI đang khuyên dùng thuốc',
          matchedText: match[0],
        });
      }
    }

    // Rule 3: Not replacing professional
    for (const pattern of REPLACEMENT_PATTERNS) {
      const match = aiResponse.match(pattern);
      if (match) {
        violations.push({
          rule: 'NO_REPLACEMENT',
          severity: 'critical',
          description: 'AI đang cố thay thế chuyên gia',
          matchedText: match[0],
        });
      }
    }

    // Rule 4: No PII leakage
    for (const pattern of PII_LEAKAGE_PATTERNS) {
      const match = aiResponse.match(pattern);
      if (match) {
        violations.push({
          rule: 'NO_PII_LEAKAGE',
          severity: 'block',
          description: 'AI đang tiết lộ thông tin cá nhân',
          matchedText: match[0],
        });
      }
    }

    // Rule 5: Crisis detection in user message must be acknowledged
    const hasCrisisKeywords = CRISIS_KEYWORDS.some(kw =>
      userMessage.toLowerCase().includes(kw)
    );
    if (hasCrisisKeywords) {
      const hasEscalation =
        aiResponse.includes('1800') ||
        aiResponse.includes('113') ||
        aiResponse.includes('hotline') ||
        aiResponse.includes('đường dây') ||
        aiResponse.includes('chuyên gia') ||
        aiResponse.includes('bệnh viện') ||
        aiResponse.includes('cấp cứu');
      
      if (!hasEscalation) {
        violations.push({
          rule: 'MISSING_ESCALATION',
          severity: 'critical',
          description: 'User có dấu hiệu khủng hoảng nhưng AI không escalate',
        });
      }
    }

    // Determine safety
    const hasBlock = violations.some(v => v.severity === 'block');
    const hasCritical = violations.some(v => v.severity === 'critical');

    if (hasBlock || violations.length > 0) {
      logger.warn(`[SafetyGuardrail] ${violations.length} violations detected: ${violations.map(v => v.rule).join(', ')}`);
    }

    return {
      safe: !hasBlock && !hasCritical,
      violations,
      sanitizedResponse: hasBlock ? this.getSafeDefaultResponse(userMessage) : undefined,
      blockReason: hasBlock ? violations.find(v => v.severity === 'block')?.description : undefined,
    };
  }

  /**
   * Kiểm tra training data trước khi đưa vào dataset
   */
  checkTrainingData(input: string, output: string): GuardrailResult {
    // Check output (expected model response) for violations
    const responseCheck = this.checkResponse(output, input);

    // Additional checks for training data
    const violations = [...responseCheck.violations];

    // Check if output is too short (unhelpful)
    if (output.length < 50) {
      violations.push({
        rule: 'TOO_SHORT',
        severity: 'warning',
        description: 'Phản hồi quá ngắn, có thể không hữu ích',
      });
    }

    // Check if output is just copying input
    if (output.toLowerCase().includes(input.toLowerCase().substring(0, 50))) {
      violations.push({
        rule: 'ECHO_INPUT',
        severity: 'warning',
        description: 'Phản hồi chỉ lặp lại câu hỏi',
      });
    }

    return {
      safe: !violations.some(v => v.severity === 'block' || v.severity === 'critical'),
      violations,
    };
  }

  /**
   * Kiểm tra prompt mới trước khi apply
   */
  checkPromptUpdate(newPrompt: string): GuardrailResult {
    const violations: GuardrailViolation[] = [];

    // Must contain safety instructions
    const requiredPhrases = [
      'không chẩn đoán',
      'không khuyên thuốc',
      'chuyên gia',
    ];

    for (const phrase of requiredPhrases) {
      if (!newPrompt.toLowerCase().includes(phrase)) {
        violations.push({
          rule: 'MISSING_SAFETY_INSTRUCTION',
          severity: 'critical',
          description: `Prompt thiếu hướng dẫn an toàn: "${phrase}"`,
        });
      }
    }

    return {
      safe: violations.length === 0,
      violations,
    };
  }

  /**
   * Audit log cho tất cả guardrail checks
   */
  async logCheck(context: string, result: GuardrailResult): Promise<void> {
    if (result.violations.length > 0) {
      logger.warn(`[SafetyGuardrail] [${context}] Violations: ${JSON.stringify(result.violations)}`);
    }
  }

  /**
   * Default safe response khi AI bị block
   */
  private getSafeDefaultResponse(userMessage: string): string {
    const hasCrisis = CRISIS_KEYWORDS.some(kw => userMessage.toLowerCase().includes(kw));
    
    if (hasCrisis) {
      return `Tôi nghe thấy bạn đang trải qua giai đoạn rất khó khăn. Bạn không đơn độc.

🆘 Nếu bạn cần hỗ trợ ngay:
• Tổng đài tư vấn tâm lý: 1800 599 920 (miễn phí, 24/7)
• Đường dây nóng: 1800 599 100
• Cấp cứu: 113

Xin hãy liên hệ với một trong các số trên. Họ có thể giúp bạn.`;
    }

    return `Cảm ơn bạn đã chia sẻ. Tôi hiểu rằng bạn đang trải qua những cảm xúc khó khăn.

Tôi muốn lắng nghe thêm. Bạn có thể chia sẻ thêm về những gì bạn đang cảm thấy không?

💡 Nếu bạn cần nói chuyện với chuyên gia tâm lý, hãy gọi: 1800 599 920 (miễn phí).`;
  }
}

export const safetyGuardrailService = new SafetyGuardrailService();
export default safetyGuardrailService;
