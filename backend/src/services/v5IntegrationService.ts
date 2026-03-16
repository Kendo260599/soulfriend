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
import InteractionEvent from '../models/InteractionEvent';
import { triadicSynthesizer } from './triadic/triadicSynthesizer';
import { TriadicTurn } from './triadic/triadicTypes';

// Configurable evaluation sampling rate (env: V5_EVAL_SAMPLE_RATE, default: 0.5 = 50%)
const EVAL_SAMPLE_RATE = Math.min(1, Math.max(0, parseFloat(process.env.V5_EVAL_SAMPLE_RATE || '0.5')));
const TRIADIC_ATTACH_TIMEOUT_MS = Math.max(50, parseInt(process.env.V5_TRIADIC_ATTACH_TIMEOUT_MS || '250', 10));
const TRIADIC_P95_BUDGET_MS = Math.max(50, parseInt(process.env.V5_TRIADIC_P95_BUDGET_MS || '200', 10));
const TRIADIC_P95_WINDOW_SIZE = Math.max(10, parseInt(process.env.V5_TRIADIC_P95_WINDOW_SIZE || '60', 10));
const TRIADIC_P95_MIN_SAMPLES = Math.max(5, parseInt(process.env.V5_TRIADIC_P95_MIN_SAMPLES || '20', 10));
const TRIADIC_P95_ALERT_COOLDOWN_MS = Math.max(10_000, parseInt(process.env.V5_TRIADIC_P95_ALERT_COOLDOWN_MS || '300000', 10));

function triadicLatencyBucket(durationMs: number): string {
  if (durationMs < 20) return 'lt20ms';
  if (durationMs < 50) return '20to49ms';
  if (durationMs < 100) return '50to99ms';
  if (durationMs < 200) return '100to199ms';
  if (durationMs < 500) return '200to499ms';
  return 'gte500ms';
}

class V5IntegrationService {
  private triadicLatencySamples: number[] = [];
  private triadicLastBudgetAlertAt = 0;
  private triadicP95BudgetMs = TRIADIC_P95_BUDGET_MS;
  private triadicP95MinSamples = TRIADIC_P95_MIN_SAMPLES;
  private triadicP95AlertCooldownMs = TRIADIC_P95_ALERT_COOLDOWN_MS;

  private recordTriadicLatencySample(durationMs: number): { p95Ms: number; sampleSize: number } {
    this.triadicLatencySamples.push(durationMs);
    if (this.triadicLatencySamples.length > TRIADIC_P95_WINDOW_SIZE) {
      this.triadicLatencySamples.shift();
    }

    const sorted = [...this.triadicLatencySamples].sort((a, b) => a - b);
    const idx = Math.max(0, Math.ceil(0.95 * sorted.length) - 1);
    return {
      p95Ms: sorted[idx] || 0,
      sampleSize: sorted.length,
    };
  }

  private enforceTriadicLatencyBudget(durationMs: number, latencyBucket: string): void {
    const latency = this.recordTriadicLatencySample(durationMs);
    if (latency.sampleSize < this.triadicP95MinSamples) {
      return;
    }

    if (latency.p95Ms <= this.triadicP95BudgetMs) {
      return;
    }

    const now = Date.now();
    if (
      this.triadicLastBudgetAlertAt > 0
      && now - this.triadicLastBudgetAlertAt < this.triadicP95AlertCooldownMs
    ) {
      return;
    }
    this.triadicLastBudgetAlertAt = now;

    logger.error('[V5 Integration] triadic latency budget breached', {
      budgetP95Ms: this.triadicP95BudgetMs,
      observedP95Ms: latency.p95Ms,
      sampleSize: latency.sampleSize,
      latestDurationMs: durationMs,
      latestLatencyBucket: latencyBucket,
    });

    eventQueueService.publish('triadic.latency_budget.breached', {
      budgetP95Ms: this.triadicP95BudgetMs,
      observedP95Ms: latency.p95Ms,
      sampleSize: latency.sampleSize,
      latestDurationMs: durationMs,
      latestLatencyBucket: latencyBucket,
      timestamp: new Date().toISOString(),
    }).catch(() => {});
  }

  private normalizeRiskLevel(value: string | undefined): TriadicTurn['riskLevel'] {
    if (value === 'NONE' || value === 'LOW' || value === 'MODERATE' || value === 'HIGH' || value === 'CRITICAL' || value === 'EXTREME') {
      return value;
    }
    return 'NONE';
  }

  private normalizeSentiment(value: string | undefined): TriadicTurn['sentiment'] {
    if (value === 'very_negative' || value === 'negative' || value === 'neutral' || value === 'positive' || value === 'very_positive') {
      return value;
    }
    return 'neutral';
  }

  private async attachTriadicShadow(interactionEventId: string, userId: string): Promise<void> {
    const startedAt = Date.now();
    try {
      const recentEvents = await InteractionEvent.find({ userId })
        .sort({ timestamp: -1 })
        .limit(60)
        .lean();

      if (!recentEvents || recentEvents.length === 0) {
        return;
      }

      const turns: TriadicTurn[] = recentEvents
        .reverse()
        .map((event: any) => ({
          timestamp: new Date(event.timestamp),
          sessionId: String(event.sessionId || 'unknown_session'),
          userText: String(event.userText || ''),
          aiResponse: String(event.aiResponse || ''),
          riskLevel: this.normalizeRiskLevel(event.riskLevel),
          sentiment: this.normalizeSentiment(event.sentiment),
          sentimentScore: typeof event.sentimentScore === 'number' ? event.sentimentScore : 0,
          escalationTriggered: Boolean(event.escalationTriggered),
        }));

      const triadic = triadicSynthesizer.runShadowAnalysis(turns);

      await Promise.race([
        InteractionEvent.findByIdAndUpdate(interactionEventId, {
          $set: { triadic },
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`triadic attach timeout after ${TRIADIC_ATTACH_TIMEOUT_MS}ms`)), TRIADIC_ATTACH_TIMEOUT_MS)
        ),
      ]);

      const durationMs = Date.now() - startedAt;
      const latencyBucket = triadicLatencyBucket(durationMs);

      logger.debug('[V5 Integration] attachTriadicShadow completed', {
        interactionEventId,
        userId,
        sampleSize: turns.length,
        durationMs,
        latencyBucket,
      });

      this.enforceTriadicLatencyBudget(durationMs, latencyBucket);

      if (durationMs >= 200) {
        logger.warn('[V5 Integration] attachTriadicShadow slow path', {
          interactionEventId,
          userId,
          durationMs,
          latencyBucket,
          sampleSize: turns.length,
        });
      }
    } catch (error) {
      logger.warn('[V5 Integration] attachTriadicShadow failed (non-critical):', error instanceof Error ? error.message : error);
    }
  }

  private mapSentiment(emotionalState?: string): string {
    const sentimentMap: Record<string, string> = {
      crisis: 'very_negative',
      despair: 'very_negative',
      panic: 'very_negative',
      exhaustion: 'very_negative',
      abandonment: 'negative',
      guilt: 'negative',
      loneliness: 'negative',
      disappointment: 'negative',
      neglect: 'negative',
      manipulation: 'negative',
      anxiety: 'negative',
      neutral: 'neutral',
      positive: 'positive',
      very_positive: 'very_positive',
      negative: 'negative',
      very_negative: 'very_negative',
    };
    return sentimentMap[emotionalState || 'neutral'] || 'neutral';
  }

  /**
   * SYNC: Capture interaction và trả về interactionEventId để frontend map feedback chuẩn.
   */
  async captureInteraction(params: {
    sessionId: string;
    userId: string;
    userMessage: string;
    aiResponse: string;
    responseTimeMs: number;
    riskLevel?: string;
    emotionalState?: string;
    intent?: string;
    crisisLevel?: string;
  }): Promise<string | null> {
    try {
      const captured = await interactionCaptureService.capture({
        sessionId: params.sessionId,
        userId: params.userId,
        userText: params.userMessage,
        aiResponse: params.aiResponse,
        responseTimeMs: params.responseTimeMs,
        riskLevel: params.riskLevel || 'NONE',
        sentiment: this.mapSentiment(params.emotionalState),
        escalationTriggered: params.crisisLevel === 'high' || params.crisisLevel === 'critical',
        escalationType: params.crisisLevel === 'critical' ? 'crisis' : 'none',
        aiModelUsed: 'gpt-4o-mini',
        topicCategory: params.intent,
      });

      const interactionEventId = (captured as any)?._id?.toString?.() || null;
      if (!interactionEventId) return null;

      this.attachTriadicShadow(interactionEventId, params.userId).catch(() => {});

      await eventQueueService.publish('interaction.captured', {
        interactionId: interactionEventId,
        sessionId: params.sessionId,
        userId: params.userId,
        riskLevel: params.riskLevel,
      });

      if (params.crisisLevel === 'high' || params.crisisLevel === 'critical') {
        await eventQueueService.publish('crisis.detected', {
          interactionId: interactionEventId,
          sessionId: params.sessionId,
          userId: params.userId,
          crisisLevel: params.crisisLevel,
          riskLevel: params.riskLevel,
        });
      }

      return interactionEventId;
    } catch (error) {
      logger.error('[V5 Integration] captureInteraction failed:', error);
      return null;
    }
  }

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
    interactionEventId?: string | null;
  }): Promise<void> {
    try {
      let interactionEventId = params.interactionEventId || null;
      if (!interactionEventId) {
        interactionEventId = await this.captureInteraction({
          sessionId: params.sessionId,
          userId: params.userId,
          userMessage: params.userMessage,
          aiResponse: params.aiResponse,
          responseTimeMs: params.responseTimeMs,
          riskLevel: params.riskLevel,
          emotionalState: params.emotionalState,
          intent: params.intent,
          crisisLevel: params.crisisLevel,
        });
      }

      if (interactionEventId) {
        // ================================
        // 2. AUTO-EVALUATE (Module 2) — async, non-blocking
        // ================================
        this.triggerAutoEvaluation({
          interactionEventId,
          sessionId: params.sessionId,
          userId: params.userId,
          userMessage: params.userMessage,
          aiResponse: params.aiResponse,
        }).catch(err => {
          logger.warn('[V5] Auto-evaluation failed (non-critical):', err instanceof Error ? err.message : err);
        });
      }

      logger.debug('[V5 Integration] afterChatResponse completed', {
        sessionId: params.sessionId,
        captured: !!interactionEventId,
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
