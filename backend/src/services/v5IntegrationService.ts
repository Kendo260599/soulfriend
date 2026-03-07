/**
 * V5 INTEGRATION SERVICE
 * 
 * Orchestrator trung tâm kết nối V5 Learning Pipeline vào chat flow chính.
 * 
 * Luồng xử lý:
 * 1. SYNC: checkSafety() — kiểm tra response trước khi gửi user
 * 2. ASYNC: afterChatResponse() — capture, evaluate, publish events (fire-and-forget)
 * 
 * @module services/v5IntegrationService
 * @version 5.0.0
 */

import { logger } from '../utils/logger';
import { interactionCaptureService } from './interactionCaptureService';
import { safetyGuardrailService } from './safetyGuardrailService';
import { responseEvaluationService } from './responseEvaluationService';
import { eventQueueService } from './eventQueueService';
import { SafetyLog } from '../models/SafetyLog';

// Configurable evaluation sampling rate (env: V5_EVAL_SAMPLE_RATE, default: 0.5 = 50%)
const EVAL_SAMPLE_RATE = Math.min(1, Math.max(0, parseFloat(process.env.V5_EVAL_SAMPLE_RATE || '0.5')));

class V5IntegrationService {
  /**
   * SYNC: Kiểm tra safety guardrails trước khi gửi response cho user.
   * Nếu response vi phạm → trả về sanitized version hoặc fallback.
   * 
   * @returns response gốc nếu an toàn, hoặc sanitized version nếu vi phạm
   */
  checkSafety(aiResponse: string, userMessage: string): {
    safe: boolean;
    response: string;
    violations: Array<{ rule: string; severity: string; description: string }>;
  } {
    try {
      const result = safetyGuardrailService.checkResponse(aiResponse, userMessage);

      if (!result.safe) {
        logger.warn('[V5 Safety] Response vi phạm guardrails', {
          violations: result.violations.length,
          rules: result.violations.map(v => v.rule),
        });

        // Publish guardrail violation event
        eventQueueService.publish('guardrail.violated', {
          userMessage: userMessage.substring(0, 100),
          violations: result.violations,
          timestamp: new Date().toISOString(),
        }).catch(() => {});

        // Persist safety violation to DB for audit trail
        SafetyLog.create({
          eventType: 'guardrail_violation',
          violations: result.violations,
          violationCount: result.violations.length,
          actionTaken: result.violations.some(v => v.severity === 'block') ? 'blocked' : 'sanitized',
          originalResponse: aiResponse.substring(0, 500),
          sanitizedResponse: result.sanitizedResponse?.substring(0, 500),
        }).catch(err => logger.warn('[V5 Safety] Failed to persist SafetyLog:', err));

        // Block critical violations, use sanitized for warnings
        const hasCritical = result.violations.some(v => v.severity === 'block');
        if (hasCritical && result.blockReason) {
          return {
            safe: false,
            response: this.getSafeFallback(userMessage),
            violations: result.violations,
          };
        }

        // Use sanitized if available, otherwise original
        return {
          safe: false,
          response: result.sanitizedResponse || aiResponse,
          violations: result.violations,
        };
      }

      return { safe: true, response: aiResponse, violations: [] };
    } catch (error) {
      // Safety check failure → allow original response (fail open) but log
      logger.error('[V5 Safety] Guardrail check failed, allowing response:', error);
      return { safe: true, response: aiResponse, violations: [] };
    }
  }

  /**
   * ASYNC (fire-and-forget): Gọi sau khi gửi response cho user.
   * Captures interaction + triggers auto-evaluation + publishes events.
   */
  async afterChatResponse(params: {
    sessionId: string;
    userId: string;
    userMessage: string;
    aiResponse: string;
    responseTimeMs: number;
    riskLevel?: string;
    emotionalState?: string;
    qualityScore?: number;
    intent?: string;
    crisisLevel?: string;
  }): Promise<void> {
    try {
      // ================================
      // 1. CAPTURE INTERACTION (Module 1)
      // ================================
      const captured = await interactionCaptureService.capture({
        sessionId: params.sessionId,
        userId: params.userId,
        userText: params.userMessage,
        aiResponse: params.aiResponse,
        responseTimeMs: params.responseTimeMs,
        riskLevel: params.riskLevel || 'NONE',
        sentiment: params.emotionalState || 'neutral',
        escalationTriggered: params.crisisLevel === 'high' || params.crisisLevel === 'critical',
        escalationType: params.crisisLevel === 'critical' ? 'crisis' : 'none',
        aiModelUsed: 'gpt-4o-mini',
        topicCategory: params.intent,
      });

      if (captured) {
        // Publish capture event
        await eventQueueService.publish('interaction.captured', {
          interactionId: (captured as any)._id?.toString(),
          sessionId: params.sessionId,
          userId: params.userId,
          riskLevel: params.riskLevel,
        });

        // ================================
        // 2. AUTO-EVALUATE (Module 2) — async, non-blocking
        // ================================
        this.triggerAutoEvaluation({
          interactionEventId: (captured as any)._id?.toString(),
          sessionId: params.sessionId,
          userId: params.userId,
          userMessage: params.userMessage,
          aiResponse: params.aiResponse,
        }).catch(err => {
          logger.warn('[V5] Auto-evaluation failed (non-critical):', err instanceof Error ? err.message : err);
        });

        // ================================
        // 3. CRISIS DETECTION EVENT
        // ================================
        if (params.crisisLevel === 'high' || params.crisisLevel === 'critical') {
          await eventQueueService.publish('crisis.detected', {
            interactionId: (captured as any)._id?.toString(),
            sessionId: params.sessionId,
            userId: params.userId,
            crisisLevel: params.crisisLevel,
            riskLevel: params.riskLevel,
          });
        }
      }

      logger.debug('[V5 Integration] afterChatResponse completed', {
        sessionId: params.sessionId,
        captured: !!captured,
      });
    } catch (error) {
      // Non-blocking — log and continue
      logger.error('[V5 Integration] afterChatResponse failed:', error);
    }
  }

  /**
   * Auto-evaluate response quality (Module 2)
   * Chỉ evaluate 1 trong N interactions để tiết kiệm API calls
   */
  private async triggerAutoEvaluation(data: {
    interactionEventId: string;
    sessionId: string;
    userId: string;
    userMessage: string;
    aiResponse: string;
  }): Promise<void> {
    // Configurable sample rate (default 50%, env V5_EVAL_SAMPLE_RATE)
    if (Math.random() > EVAL_SAMPLE_RATE) {
      return;
    }

    try {
      const result = await responseEvaluationService.evaluate(data);
      if (result) {
        await eventQueueService.publish('evaluation.completed', {
          interactionId: data.interactionEventId,
          score: (result as any).overallScore,
          needsReview: (result as any).needsHumanReview,
        });
      }
    } catch (error) {
      logger.warn('[V5] Auto-evaluation error:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Safe fallback response khi AI response bị block
   */
  private getSafeFallback(userMessage: string): string {
    const hasCrisisKeyword = /tự tử|muốn chết|kết liễu|tự vẫn|tự hại|không muốn sống/i.test(userMessage);

    if (hasCrisisKeyword) {
      return `Mình nghe thấy bạn đang rất khó khăn. Mình muốn giúp bạn, nhưng tình huống này cần sự hỗ trợ chuyên nghiệp ngay.

🆘 **Đường dây nóng hỗ trợ tâm lý:**
• Tổng đài 1800 599 920 (miễn phí, 24/7)
• Đường dây nóng sức khỏe tâm thần: 1900 0027

Bạn không đơn độc. Hãy liên hệ ngay để được hỗ trợ nhé. 💚`;
    }

    return `Mình xin lỗi, mình cần suy nghĩ lại câu trả lời. Bạn có thể chia sẻ thêm để mình hiểu rõ hơn không?

Nếu bạn đang gặp khó khăn về tâm lý, đừng ngại liên hệ chuyên gia:
• Tổng đài tư vấn: 1800 599 920 (miễn phí)`;
  }
}

export const v5IntegrationService = new V5IntegrationService();
export default v5IntegrationService;
