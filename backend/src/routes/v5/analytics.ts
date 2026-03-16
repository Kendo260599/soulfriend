/**
 * V5 ANALYTICS ROUTES
 * 
 * API endpoints cho Impact Analytics Dashboard
 * Cung cấp metrics, trends, và dashboard data cho nghiên cứu
 * 
 * @module routes/v5/analytics
 * @version 5.0.0
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authenticateAdmin } from '../../middleware/auth';
import { authenticateExpert } from '../expertAuth';
import { impactAnalyticsEngine } from '../../services/impactAnalyticsEngine';
import { ebhScoringService } from '../../services/ebhScoringService';
import { triadicSynthesizer } from '../../services/triadic/triadicSynthesizer';
import { triadicCanaryService } from '../../services/triadic/triadicCanaryService';
import { TriadicTurn } from '../../services/triadic/triadicTypes';
import InteractionEvent from '../../models/InteractionEvent';
import AuditLogModel from '../../models/AuditLog';
import { eventQueueService } from '../../services/eventQueueService';
import { logger } from '../../utils/logger';

const router = Router();

async function logEbhPolicyAudit(params: {
  req: Request;
  action: string;
  result: 'success' | 'failure';
  userId: string;
  changesDescription: string;
  before?: any;
  after?: any;
  errorMessage?: string;
}) {
  try {
    const expert = (params.req as any).expert || {};
    await AuditLogModel.create({
      userId: params.userId,
      userEmail: expert.email || undefined,
      expertId: expert.expertId || undefined,
      action: params.action,
      category: 'admin',
      resource: 'ebh_intervention_policy',
      method: params.req.method,
      ip: (params.req.headers['x-forwarded-for'] as string) || params.req.ip || 'unknown',
      userAgent: params.req.headers['user-agent'] || 'unknown',
      path: params.req.originalUrl || params.req.path,
      statusCode: params.result === 'success' ? 200 : 500,
      result: params.result,
      errorMessage: params.errorMessage,
      changes: {
        before: params.before,
        after: params.after,
        description: params.changesDescription,
      },
      legalBasis: 'Operational safety monitoring',
      dataCategories: ['interaction_flags', 'risk_monitoring'],
      processingPurpose: 'EBH intervention governance and traceability',
    });
  } catch (auditErr) {
    logger.warn('[V5 Analytics] Failed to write EBH audit log', auditErr);
  }
}

async function getLatestSuccessfulApply(userId: string): Promise<any | null> {
  return AuditLogModel.findOne({
    userId,
    action: 'ebh_intervention_apply',
    resource: 'ebh_intervention_policy',
    result: 'success',
  })
    .sort({ timestamp: -1 })
    .lean();
}

function getCooldownInfo(latestApply: any | null, cooldownMinutes: number) {
  if (!latestApply?.timestamp) {
    return {
      active: false,
      remainingMinutes: 0,
      appliedTier: undefined as string | undefined,
    };
  }

  const now = Date.now();
  const lastTs = new Date(latestApply.timestamp).getTime();
  const elapsedMs = now - lastTs;
  const cooldownMs = Math.max(1, cooldownMinutes) * 60 * 1000;
  const remainingMs = cooldownMs - elapsedMs;
  const wasApplied = latestApply?.changes?.after?.applied === true;

  return {
    active: wasApplied && remainingMs > 0,
    remainingMinutes: remainingMs > 0 ? Math.ceil(remainingMs / 60000) : 0,
    appliedTier: latestApply?.changes?.after?.tier as string | undefined,
  };
}

function normalizeRiskLevel(
  value: string | undefined
): TriadicTurn['riskLevel'] {
  if (value === 'NONE' || value === 'LOW' || value === 'MODERATE' || value === 'HIGH' || value === 'CRITICAL' || value === 'EXTREME') {
    return value;
  }
  return 'NONE';
}

function normalizeSentiment(
  value: string | undefined
): TriadicTurn['sentiment'] {
  if (value === 'very_negative' || value === 'negative' || value === 'neutral' || value === 'positive' || value === 'very_positive') {
    return value;
  }
  return 'neutral';
}

function buildTriadicTurns(events: any[]): TriadicTurn[] {
  return events
    .reverse()
    .map((event: any) => ({
      timestamp: new Date(event.timestamp),
      sessionId: String(event.sessionId || 'unknown_session'),
      userText: String(event.userText || event.userMessage || ''),
      aiResponse: String(event.aiResponse || ''),
      riskLevel: normalizeRiskLevel(event.riskLevel),
      sentiment: normalizeSentiment(event.sentiment),
      sentimentScore: typeof event.sentimentScore === 'number' ? event.sentimentScore : 0,
      escalationTriggered: Boolean(event.escalationTriggered),
    }));
}

function summarizeTriadicAnalyses(analyses: any[]) {
  const total = analyses.length;
  const strategyDistribution: Record<string, number> = {};
  const riskBandDistribution: Record<string, number> = {};

  let confidenceSum = 0;
  let symbolicDensitySum = 0;
  let symbolicEnabledCount = 0;

  for (const analysis of analyses) {
    const strategy = String(analysis?.synthesis?.strategy || 'unknown');
    const riskBand = String(analysis?.structural?.riskBand || 'unknown');
    const confidence = Number(analysis?.synthesis?.confidence || 0);
    const symbolicDensity = Number(analysis?.symbolic?.symbolicDensity || 0);
    const symbolicEnabled = Boolean(analysis?.symbolic?.enabled);

    strategyDistribution[strategy] = (strategyDistribution[strategy] || 0) + 1;
    riskBandDistribution[riskBand] = (riskBandDistribution[riskBand] || 0) + 1;
    confidenceSum += confidence;
    symbolicDensitySum += symbolicDensity;
    symbolicEnabledCount += symbolicEnabled ? 1 : 0;
  }

  return {
    count: total,
    avgConfidence: total > 0 ? Number((confidenceSum / total).toFixed(4)) : 0,
    avgSymbolicDensity: total > 0 ? Number((symbolicDensitySum / total).toFixed(4)) : 0,
    symbolicEnabledRate: total > 0 ? Number((symbolicEnabledCount / total).toFixed(4)) : 0,
    strategyDistribution,
    riskBandDistribution,
  };
}

function buildTriadicTrend(events: any[]) {
  const buckets = new Map<string, {
    count: number;
    confidenceSum: number;
    symbolicDensitySum: number;
    symbolicEnabledCount: number;
    riskBandDistribution: Record<string, number>;
    strategyDistribution: Record<string, number>;
  }>();

  for (const event of events) {
    if (!event?.triadic || !event?.timestamp) {
      continue;
    }

    const day = new Date(event.timestamp).toISOString().slice(0, 10);
    const triadic = event.triadic;

    const bucket = buckets.get(day) || {
      count: 0,
      confidenceSum: 0,
      symbolicDensitySum: 0,
      symbolicEnabledCount: 0,
      riskBandDistribution: {},
      strategyDistribution: {},
    };

    const confidence = Number(triadic?.synthesis?.confidence || 0);
    const symbolicDensity = Number(triadic?.symbolic?.symbolicDensity || 0);
    const symbolicEnabled = Boolean(triadic?.symbolic?.enabled);
    const riskBand = String(triadic?.structural?.riskBand || 'unknown');
    const strategy = String(triadic?.synthesis?.strategy || 'unknown');

    bucket.count += 1;
    bucket.confidenceSum += confidence;
    bucket.symbolicDensitySum += symbolicDensity;
    bucket.symbolicEnabledCount += symbolicEnabled ? 1 : 0;
    bucket.riskBandDistribution[riskBand] = (bucket.riskBandDistribution[riskBand] || 0) + 1;
    bucket.strategyDistribution[strategy] = (bucket.strategyDistribution[strategy] || 0) + 1;

    buckets.set(day, bucket);
  }

  return Array.from(buckets.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, value]) => ({
      date,
      count: value.count,
      avgConfidence: Number((value.confidenceSum / Math.max(1, value.count)).toFixed(4)),
      avgSymbolicDensity: Number((value.symbolicDensitySum / Math.max(1, value.count)).toFixed(4)),
      symbolicEnabledRate: Number((value.symbolicEnabledCount / Math.max(1, value.count)).toFixed(4)),
      riskBandDistribution: value.riskBandDistribution,
      strategyDistribution: value.strategyDistribution,
    }));
}

function enrichTrendWithSignals(trend: any[]) {
  const points = trend.map((point, index) => {
    if (index === 0) {
      return {
        ...point,
        symbolicEnabledSpikeFromPrev: false,
        symbolicEnabledDelta: 0,
      };
    }

    const prev = trend[index - 1];
    const delta = Number((point.symbolicEnabledRate - prev.symbolicEnabledRate).toFixed(4));
    const isSpike = delta >= 0.35;

    return {
      ...point,
      symbolicEnabledSpikeFromPrev: isSpike,
      symbolicEnabledDelta: delta,
    };
  });

  const alerts = points
    .filter(p => p.symbolicEnabledSpikeFromPrev)
    .map(p => ({
      date: p.date,
      type: 'symbolic_enabled_spike',
      delta: p.symbolicEnabledDelta,
      currentRate: p.symbolicEnabledRate,
      severity: p.symbolicEnabledDelta >= 0.6 ? 'high' : 'moderate',
    }));

  return {
    points,
    alerts,
  };
}

function pickCanaryBucketMinutes(rawGranularity: string | undefined, minutes: number, rawBucket: number): {
  bucketMinutes: 5 | 15 | 60;
  granularity: 'auto' | 'manual';
} {
  const granularity = rawGranularity === 'auto' ? 'auto' : 'manual';
  if (granularity === 'auto') {
    if (minutes <= 6 * 60) {
      return { bucketMinutes: 5, granularity };
    }
    if (minutes <= 48 * 60) {
      return { bucketMinutes: 15, granularity };
    }
    return { bucketMinutes: 60, granularity };
  }

  const bucketMinutes = rawBucket === 5 || rawBucket === 15 || rawBucket === 60 ? rawBucket : 15;
  return { bucketMinutes, granularity };
}

/**
 * GET /api/v5/analytics/dashboard
 * Full dashboard data (30d metrics + 7d metrics + trends)
 */
router.get(
  '/dashboard',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('[V5 Analytics] Fetching dashboard data...');
    const dashboard = await impactAnalyticsEngine.getDashboardData();
    res.json({ success: true, data: dashboard });
  })
);

/**
 * GET /api/v5/analytics/metrics
 * Tính metrics cho khoảng thời gian
 */
router.get(
  '/metrics',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const endDate = new Date();
    const metrics = await impactAnalyticsEngine.calculateMetrics(startDate, endDate);
    res.json({ success: true, data: metrics, period: { startDate, endDate } });
  })
);

/**
 * GET /api/v5/analytics/trends
 * Trend data cho charts (30 ngày gần nhất)
 */
router.get(
  '/trends',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 30;
    const metric = (req.query.metric as string) || 'interactions';
    const trends = await impactAnalyticsEngine.getTrends(metric, days);
    res.json({ success: true, data: trends, days });
  })
);

/**
 * GET /api/v5/analytics/psi
 * Psychological Safety Index chi tiết
 */
router.get(
  '/psi',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date();
    const metrics = await impactAnalyticsEngine.calculateMetrics(startDate, endDate);
    
    res.json({
      success: true,
      data: {
        psychologicalSafetyIndex: metrics.psychologicalSafetyIndex,
        components: {
          positiveOutcomeRate: metrics.positiveOutcomeRate,
          aiResponseQuality: metrics.aiResponseQuality,
          riskEscalationRate: metrics.riskEscalationRate,
          userSatisfactionRate: metrics.userSatisfactionRate,
        },
        formula: 'PSI = positiveOutcome*30 + safety*30 + (1-escalation)*20 + helpful*20',
      },
    });
  })
);

/**
 * GET /api/v5/analytics/triadic/user/:userId
 * Shadow-mode triadic analysis (read-only, internal)
 */
router.get(
  '/triadic/canary/status',
  authenticateExpert,
  asyncHandler(async (_req: Request, res: Response) => {
    const snapshot = triadicCanaryService.getDashboardSnapshot();

    return res.json({
      success: true,
      data: snapshot,
      meta: {
        scope: 'triadic_canary_internal',
        mode: 'canary-dashboard',
        timestamp: new Date().toISOString(),
      },
    });
  })
);

router.get(
  '/triadic/canary/status/history',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit as string, 10) || 200));
    const minutes = Math.min(7 * 24 * 60, Math.max(1, parseInt(req.query.minutes as string, 10) || 24 * 60));
    const points = triadicCanaryService.getDashboardHistory({ limit, minutes });

    return res.json({
      success: true,
      data: {
        trend: points,
      },
      meta: {
        scope: 'triadic_canary_internal',
        mode: 'canary-dashboard-history',
        limit,
        minutes,
        points: points.length,
        timestamp: new Date().toISOString(),
      },
    });
  })
);

router.get(
  '/triadic/canary/status/history/aggregate',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit as string, 10) || 200));
    const minutes = Math.min(7 * 24 * 60, Math.max(1, parseInt(req.query.minutes as string, 10) || 24 * 60));
    const rawBucket = parseInt(req.query.bucketMinutes as string, 10);
    const rawGranularity = String(req.query.granularity || '').toLowerCase();
    const selected = pickCanaryBucketMinutes(rawGranularity, minutes, rawBucket);
    const bucketMinutes = selected.bucketMinutes;

    const buckets = triadicCanaryService.getDashboardHistoryAggregated({
      limit,
      minutes,
      bucketMinutes,
    });

    return res.json({
      success: true,
      data: {
        buckets,
      },
      meta: {
        scope: 'triadic_canary_internal',
        mode: 'canary-dashboard-history-aggregate',
        limit,
        minutes,
        granularity: selected.granularity,
        bucketMinutes,
        points: buckets.length,
        timestamp: new Date().toISOString(),
      },
    });
  })
);

router.get(
  '/triadic/canary/decision-gate',
  authenticateExpert,
  asyncHandler(async (_req: Request, res: Response) => {
    const readiness = triadicCanaryService.getDecisionGateReadiness();

    return res.json({
      success: true,
      data: readiness,
      meta: {
        scope: 'triadic_canary_internal',
        mode: 'canary-decision-gate',
        timestamp: new Date().toISOString(),
      },
    });
  })
);

router.post(
  '/triadic/canary/decision-gate/re-enable',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    if (reason.length < 5) {
      return res.status(400).json({
        success: false,
        error: 'reason is required and must be at least 5 characters.',
      });
    }

    let updated: any;
    let readinessBefore: any;
    try {
      const expert = (req as any).expert || {};
      readinessBefore = triadicCanaryService.getManualReenableReadiness();
      updated = triadicCanaryService.reEnableAfterKpiDisable({
        reason,
        updatedBy: expert.expertId || expert.email || 'unknown_expert',
      });

      await AuditLogModel.create({
        userId: expert.expertId || 'expert_unknown',
        userEmail: expert.email || undefined,
        expertId: expert.expertId || undefined,
        action: 'triadic_canary_manual_reenable',
        category: 'admin',
        resource: 'triadic_canary_control',
        method: req.method,
        ip: (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        path: req.originalUrl || req.path,
        statusCode: 200,
        result: 'success',
        changes: {
          before: { autoDisabledByKpi: true },
          after: {
            ...updated,
            readinessBefore,
          },
          description: 'Manually re-enabled triadic canary after KPI auto-disable. This supports rollback drill evidence.',
        },
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unable to re-enable canary.',
      });
    }

    eventQueueService.publish('triadic.canary.manual_reenabled', {
      ...updated,
      timestamp: new Date().toISOString(),
    }).catch(() => {});

    return res.json({
      success: true,
      data: {
        updated,
        reEnableReadiness: updated?.readinessBefore || readinessBefore || null,
        snapshot: triadicCanaryService.getDashboardSnapshot(),
        readiness: triadicCanaryService.getDecisionGateReadiness(),
      },
      meta: {
        scope: 'triadic_canary_internal',
        mode: 'canary-decision-gate-re-enable',
        timestamp: new Date().toISOString(),
      },
    });
  })
);

router.get(
  '/triadic/canary/decision-gate/re-enable/history',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string, 10) || 50));
    const since = typeof req.query.since === 'string' ? req.query.since : undefined;
    const until = typeof req.query.until === 'string' ? req.query.until : undefined;

    if (since && Number.isNaN(new Date(since).getTime())) {
      return res.status(400).json({
        success: false,
        error: 'since must be a valid ISO datetime string.',
      });
    }

    if (until && Number.isNaN(new Date(until).getTime())) {
      return res.status(400).json({
        success: false,
        error: 'until must be a valid ISO datetime string.',
      });
    }

    if (since && until && new Date(since).getTime() > new Date(until).getTime()) {
      return res.status(400).json({
        success: false,
        error: 'since must be earlier than or equal to until.',
      });
    }

    const timestampFilter: Record<string, Date> = {};
    if (since) {
      timestampFilter.$gte = new Date(since);
    }
    if (until) {
      timestampFilter.$lte = new Date(until);
    }

    const history = await AuditLogModel.find({
      action: 'triadic_canary_manual_reenable',
      resource: 'triadic_canary_control',
      result: 'success',
      ...(Object.keys(timestampFilter).length > 0 ? { timestamp: timestampFilter } : {}),
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    const rows = history.map((item: any) => {
      const actor = String(item.expertId || item.userId || 'unknown_expert');
      const readinessBefore = item?.changes?.after?.readinessBefore;
      return {
        actionId: String(item._id),
        timestamp: new Date(item.timestamp).toISOString(),
        actor,
        reason: String(item?.changes?.after?.reason || ''),
        updatedAt: String(item?.changes?.after?.updatedAt || new Date(item.timestamp).toISOString()),
        previousAutoDisabledByKpi: Boolean(item?.changes?.after?.previousAutoDisabledByKpi),
        autoDisabledByKpi: Boolean(item?.changes?.after?.autoDisabledByKpi),
        reEnableReadiness: readinessBefore
          ? {
            ready: Boolean(readinessBefore.ready),
            status: readinessBefore.status === 'pass' ? 'pass' : 'fail',
            reasons: Array.isArray(readinessBefore.reasons)
              ? readinessBefore.reasons.map((reasonItem: unknown) => String(reasonItem))
              : [],
          }
          : null,
      };
    });

    const summary = rows.reduce(
      (acc, row) => {
        acc.total += 1;
        acc.byActor[row.actor] = (acc.byActor[row.actor] || 0) + 1;

        const actorReadiness = acc.byActorReadiness[row.actor] || {
          total: 0,
          withReadiness: 0,
          pass: 0,
          fail: 0,
          unknown: 0,
          passRate: 0,
        };

        actorReadiness.total += 1;

        if (row.reEnableReadiness) {
          acc.readiness.withReadiness += 1;
          actorReadiness.withReadiness += 1;

          if (row.reEnableReadiness.status === 'pass') {
            acc.readiness.pass += 1;
            actorReadiness.pass += 1;
          } else {
            acc.readiness.fail += 1;
            actorReadiness.fail += 1;
            for (const reason of row.reEnableReadiness.reasons) {
              acc.failReasons[reason] = (acc.failReasons[reason] || 0) + 1;
            }
          }
        } else {
          acc.readiness.unknown += 1;
          actorReadiness.unknown += 1;
        }

        const actorReadyDenominator = Math.max(1, actorReadiness.withReadiness);
        actorReadiness.passRate = Number((actorReadiness.pass / actorReadyDenominator).toFixed(4));
        acc.byActorReadiness[row.actor] = actorReadiness;

        return acc;
      },
      {
        total: 0,
        uniqueActors: 0,
        byActor: {} as Record<string, number>,
        readiness: {
          withReadiness: 0,
          pass: 0,
          fail: 0,
          unknown: 0,
          passRate: 0,
        },
        failReasons: {} as Record<string, number>,
        byActorReadiness: {} as Record<
          string,
          {
            total: number;
            withReadiness: number;
            pass: number;
            fail: number;
            unknown: number;
            passRate: number;
          }
        >,
      }
    );
    summary.uniqueActors = Object.keys(summary.byActor).length;
    summary.readiness.passRate = Number(
      (summary.readiness.pass / Math.max(1, summary.readiness.withReadiness)).toFixed(4)
    );

    return res.json({
      success: true,
      data: {
        history: rows,
        summary,
      },
      meta: {
        scope: 'triadic_canary_internal',
        mode: 'canary-decision-gate-re-enable-history',
        limit,
        since,
        until,
        points: rows.length,
        timestamp: new Date().toISOString(),
      },
    });
  })
);

router.post(
  '/triadic/canary/decision-gate/action-status',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const { actionId, status, note } = req.body || {};
    if (!actionId || typeof actionId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'actionId is required.',
      });
    }

    if (status !== 'todo' && status !== 'in_progress' && status !== 'done') {
      return res.status(400).json({
        success: false,
        error: 'status must be one of: todo, in_progress, done.',
      });
    }

    let updated: any;
    try {
      const expert = (req as any).expert || {};
      updated = triadicCanaryService.updateRecommendedActionStatus({
        actionId,
        status,
        updatedBy: expert.expertId || expert.email || 'unknown_expert',
        note: typeof note === 'string' ? note : undefined,
      });

      await AuditLogModel.create({
        userId: expert.expertId || 'expert_unknown',
        userEmail: expert.email || undefined,
        expertId: expert.expertId || undefined,
        action: 'triadic_canary_action_status_update',
        category: 'admin',
        resource: 'triadic_canary_decision_gate',
        method: req.method,
        ip: (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        path: req.originalUrl || req.path,
        statusCode: 200,
        result: 'success',
        changes: {
          before: { actionId },
          after: updated,
          description: 'Updated triadic canary decision-gate action status.',
        },
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unable to update action status.',
      });
    }

    eventQueueService.publish('triadic.canary.action_status.updated', {
      ...updated,
      timestamp: new Date().toISOString(),
    }).catch(() => {});

    return res.json({
      success: true,
      data: {
        updated,
        readiness: triadicCanaryService.getDecisionGateReadiness(),
      },
      meta: {
        scope: 'triadic_canary_internal',
        mode: 'canary-decision-gate-action-status-update',
        timestamp: new Date().toISOString(),
      },
    });
  })
);

router.get(
  '/triadic/canary/decision-gate/action-status/history',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit as string, 10) || 200));
    const actionId = typeof req.query.actionId === 'string' ? req.query.actionId : undefined;
    const since = typeof req.query.since === 'string' ? req.query.since : undefined;
    const until = typeof req.query.until === 'string' ? req.query.until : undefined;
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const sort = req.query.sort === 'oldest' ? 'oldest' : 'newest';
    const includeSummary = ['1', 'true', 'yes'].includes(String(req.query.includeSummary || '').toLowerCase());
    const groupByRaw = String(req.query.groupBy || '').toLowerCase();
    const groupBy = groupByRaw === 'owner' || groupByRaw === 'priority' || groupByRaw === 'status'
      ? groupByRaw
      : undefined;

    if (groupByRaw && !groupBy) {
      return res.status(400).json({
        success: false,
        error: 'groupBy must be one of: owner, priority, status.',
      });
    }

    if (since && Number.isNaN(new Date(since).getTime())) {
      return res.status(400).json({
        success: false,
        error: 'since must be a valid ISO datetime string.',
      });
    }

    if (until && Number.isNaN(new Date(until).getTime())) {
      return res.status(400).json({
        success: false,
        error: 'until must be a valid ISO datetime string.',
      });
    }

    if (since && until && new Date(since).getTime() > new Date(until).getTime()) {
      return res.status(400).json({
        success: false,
        error: 'since must be earlier than or equal to until.',
      });
    }

    const page = triadicCanaryService.getActionStatusTimelinePage({
      limit,
      actionId,
      since,
      until,
      cursor,
      sort,
    });

    const summary = includeSummary
      ? page.items.reduce(
          (acc, item) => {
            acc.total += 1;
            if (item.status === 'todo') acc.todo += 1;
            if (item.status === 'in_progress') acc.inProgress += 1;
            if (item.status === 'done') acc.done += 1;
            if (groupBy && acc.breakdown) {
              const key = String(item[groupBy]);
              acc.breakdown[key] = (acc.breakdown[key] || 0) + 1;
            }
            return acc;
          },
          (() => {
            const base: {
              total: number;
              todo: number;
              inProgress: number;
              done: number;
              groupBy?: 'owner' | 'priority' | 'status';
              breakdown?: Record<string, number>;
            } = {
              total: 0,
              todo: 0,
              inProgress: 0,
              done: 0,
            };

            if (groupBy) {
              base.groupBy = groupBy;
              base.breakdown = {};
            }

            return base;
          })()
        )
      : undefined;

    return res.json({
      success: true,
      data: {
        timeline: page.items,
        ...(summary ? { summary } : {}),
      },
      meta: {
        scope: 'triadic_canary_internal',
        mode: 'canary-decision-gate-action-status-history',
        limit,
        actionId,
        since,
        until,
        cursor,
        sort,
        includeSummary,
        groupBy,
        nextCursor: page.nextCursor,
        points: page.items.length,
        timestamp: new Date().toISOString(),
      },
    });
  })
);

router.get(
  '/triadic/user/:userId',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const limit = Math.min(120, Math.max(20, parseInt(req.query.limit as string, 10) || 60));

    const events = await InteractionEvent.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    if (!events || events.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No interaction events found for triadic shadow analysis.',
      });
    }

    const turns = buildTriadicTurns(events);

    const analysis = triadicSynthesizer.runShadowAnalysis(turns);

    return res.json({
      success: true,
      data: analysis,
      meta: {
        scope: 'user',
        userId,
        sampleSize: turns.length,
        mode: 'shadow',
      },
    });
  })
);

/**
 * GET /api/v5/analytics/triadic/session/:sessionId
 * Shadow-mode triadic analysis by session (read-only, internal)
 */
router.get(
  '/triadic/session/:sessionId',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const limit = Math.min(120, Math.max(20, parseInt(req.query.limit as string, 10) || 60));

    const events = await InteractionEvent.find({ sessionId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    if (!events || events.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No interaction events found for triadic shadow analysis in this session.',
      });
    }

    const turns = buildTriadicTurns(events);
    const analysis = triadicSynthesizer.runShadowAnalysis(turns);

    return res.json({
      success: true,
      data: analysis,
      meta: {
        scope: 'session',
        sessionId,
        sampleSize: turns.length,
        mode: 'shadow',
      },
    });
  })
);

/**
 * GET /api/v5/analytics/triadic/user/:userId/summary
 * Shadow-mode triadic summary for dashboard aggregation (read-only, internal)
 */
router.get(
  '/triadic/user/:userId/summary',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const days = Math.max(1, parseInt(req.query.days as string, 10) || 30);
    const limit = Math.min(500, Math.max(20, parseInt(req.query.limit as string, 10) || 120));
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const events = await InteractionEvent.find({
      userId,
      timestamp: { $gte: startDate },
      triadic: { $exists: true },
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    if (!events || events.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No triadic shadow data found for this user in selected period.',
      });
    }

    const analyses = events.map((event: any) => event.triadic).filter(Boolean);
    const summary = summarizeTriadicAnalyses(analyses);

    return res.json({
      success: true,
      data: {
        summary,
        latest: analyses[0],
      },
      meta: {
        scope: 'user',
        userId,
        mode: 'shadow',
        days,
        count: analyses.length,
      },
    });
  })
);

/**
 * GET /api/v5/analytics/triadic/user/:userId/trend
 * Shadow-mode triadic trend series for dashboard charts (read-only, internal)
 */
router.get(
  '/triadic/user/:userId/trend',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const days = Math.max(1, parseInt(req.query.days as string, 10) || 30);
    const limit = Math.min(1000, Math.max(20, parseInt(req.query.limit as string, 10) || 300));
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const events = await InteractionEvent.find({
      userId,
      timestamp: { $gte: startDate },
      triadic: { $exists: true },
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    if (!events || events.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No triadic shadow data found to build trend for this user.',
      });
    }

    const trend = buildTriadicTrend(events);
    const enriched = enrichTrendWithSignals(trend);

    return res.json({
      success: true,
      data: {
        trend: enriched.points,
        alerts: enriched.alerts,
      },
      meta: {
        scope: 'user',
        userId,
        mode: 'shadow',
        days,
        sourceEvents: events.length,
        points: enriched.points.length,
        alertCount: enriched.alerts.length,
      },
    });
  })
);

/**
 * GET /api/v5/analytics/triadic/session/:sessionId/trend
 * Shadow-mode triadic trend series for a single session (read-only, internal)
 */
router.get(
  '/triadic/session/:sessionId/trend',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const days = Math.max(1, parseInt(req.query.days as string, 10) || 30);
    const limit = Math.min(1000, Math.max(20, parseInt(req.query.limit as string, 10) || 300));
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const events = await InteractionEvent.find({
      sessionId,
      timestamp: { $gte: startDate },
      triadic: { $exists: true },
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    if (!events || events.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No triadic shadow data found to build trend for this session.',
      });
    }

    const trend = buildTriadicTrend(events);
    const enriched = enrichTrendWithSignals(trend);

    return res.json({
      success: true,
      data: {
        trend: enriched.points,
        alerts: enriched.alerts,
      },
      meta: {
        scope: 'session',
        sessionId,
        mode: 'shadow',
        days,
        sourceEvents: events.length,
        points: enriched.points.length,
        alertCount: enriched.alerts.length,
      },
    });
  })
);

/**
 * GET /api/v5/analytics/triadic/compare/user/:userId/session/:sessionId/trend
 * Compare triadic trend between user-level and one session-level windows (read-only, internal)
 */
router.get(
  '/triadic/compare/user/:userId/session/:sessionId/trend',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, sessionId } = req.params;
    const days = Math.max(1, parseInt(req.query.days as string, 10) || 30);
    const limit = Math.min(1000, Math.max(20, parseInt(req.query.limit as string, 10) || 300));
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [userEvents, sessionEvents] = await Promise.all([
      InteractionEvent.find({ userId, timestamp: { $gte: startDate }, triadic: { $exists: true } })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean(),
      InteractionEvent.find({ sessionId, timestamp: { $gte: startDate }, triadic: { $exists: true } })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean(),
    ]);

    if (!userEvents.length || !sessionEvents.length) {
      return res.status(404).json({
        success: false,
        error: 'Not enough triadic shadow data to compare user and session trends.',
      });
    }

    const userTrend = enrichTrendWithSignals(buildTriadicTrend(userEvents));
    const sessionTrend = enrichTrendWithSignals(buildTriadicTrend(sessionEvents));

    const userLatest = userTrend.points[userTrend.points.length - 1] || null;
    const sessionLatest = sessionTrend.points[sessionTrend.points.length - 1] || null;

    const divergence = {
      symbolicEnabledRateDelta: userLatest && sessionLatest
        ? Number((userLatest.symbolicEnabledRate - sessionLatest.symbolicEnabledRate).toFixed(4))
        : null,
      avgConfidenceDelta: userLatest && sessionLatest
        ? Number((userLatest.avgConfidence - sessionLatest.avgConfidence).toFixed(4))
        : null,
      symbolicDensityDelta: userLatest && sessionLatest
        ? Number((userLatest.avgSymbolicDensity - sessionLatest.avgSymbolicDensity).toFixed(4))
        : null,
    };

    return res.json({
      success: true,
      data: {
        user: {
          trend: userTrend.points,
          alerts: userTrend.alerts,
        },
        session: {
          trend: sessionTrend.points,
          alerts: sessionTrend.alerts,
        },
        divergence,
      },
      meta: {
        mode: 'shadow',
        userId,
        sessionId,
        days,
        userPoints: userTrend.points.length,
        sessionPoints: sessionTrend.points.length,
      },
    });
  })
);

/**
 * GET /api/v5/analytics/ebh/user/:userId
 * Phase 1 (read-only): EBH score from InteractionEvent timeline
 */
router.get(
  '/ebh/user/:userId',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const days = parseInt(req.query.days as string, 10) || 30;

    const data = await ebhScoringService.computeForUser(userId, days);
    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Not enough interaction data to compute EBH (minimum 8 interactions).',
      });
    }

    return res.json({
      success: true,
      data,
      meta: {
        scope: 'user',
        userId,
        days,
        phase: 'phase1-readonly',
      },
    });
  })
);

/**
 * GET /api/v5/analytics/ebh/session/:sessionId
 * Phase 1 (read-only): EBH score for one session
 */
router.get(
  '/ebh/session/:sessionId',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const data = await ebhScoringService.computeForSession(sessionId);

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Not enough interaction data to compute EBH for session (minimum 6 interactions).',
      });
    }

    return res.json({
      success: true,
      data,
      meta: {
        scope: 'session',
        sessionId,
        phase: 'phase1-readonly',
      },
    });
  })
);

/**
 * GET /api/v5/analytics/ebh/user/:userId/timeline
 * Phase 2 (read-only): sliding-window EBH progression + early warnings
 */
router.get(
  '/ebh/user/:userId/timeline',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const days = parseInt(req.query.days as string, 10) || 30;
    const windowSize = parseInt(req.query.windowSize as string, 10) || 12;
    const stepSize = parseInt(req.query.stepSize as string, 10) || 4;

    const data = await ebhScoringService.computeTimelineForUser(userId, days, windowSize, stepSize);
    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Not enough interaction data to compute EBH timeline for this user.',
      });
    }

    return res.json({
      success: true,
      data,
      meta: {
        scope: 'user',
        userId,
        days,
        windowSize,
        stepSize,
        phase: 'phase2-readonly',
      },
    });
  })
);

/**
 * GET /api/v5/analytics/ebh/user/:userId/warnings
 * Phase 2 (read-only): compact early-warning payload for dashboard widgets
 */
router.get(
  '/ebh/user/:userId/warnings',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const days = parseInt(req.query.days as string, 10) || 30;

    const data = await ebhScoringService.computeTimelineForUser(userId, days, 12, 4);
    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Not enough interaction data to compute EBH early warnings.',
      });
    }

    return res.json({
      success: true,
      data: {
        warnings: data.warnings,
        summary: data.summary,
        latest: data.timeline[data.timeline.length - 1],
      },
      meta: {
        scope: 'user',
        userId,
        days,
        phase: 'phase2-readonly',
      },
    });
  })
);

/**
 * GET /api/v5/analytics/ebh/user/:userId/expert-overview
 * Dashboard aggregate endpoint: compact timeline + warnings + suggested action text
 */
router.get(
  '/ebh/user/:userId/expert-overview',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const days = parseInt(req.query.days as string, 10) || 30;
    const windowSize = parseInt(req.query.windowSize as string, 10) || 12;
    const stepSize = parseInt(req.query.stepSize as string, 10) || 4;
    const maxPoints = parseInt(req.query.maxPoints as string, 10) || 8;

    const overview = await ebhScoringService.getExpertOverviewForUser(
      userId,
      days,
      windowSize,
      stepSize,
      maxPoints
    );

    if (!overview) {
      return res.status(404).json({
        success: false,
        error: 'Not enough interaction data to build EBH expert overview.',
      });
    }

    return res.json({
      success: true,
      data: overview,
      meta: {
        scope: 'user',
        userId,
        days,
        windowSize,
        stepSize,
        maxPoints,
        phase: 'phase3-policy',
      },
    });
  })
);

/**
 * GET /api/v5/analytics/ebh/user/:userId/intervention-plan
 * Phase 3: tier-based intervention policy from EBH trend and warnings
 */
router.get(
  '/ebh/user/:userId/intervention-plan',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const days = parseInt(req.query.days as string, 10) || 30;

    const timelineData = await ebhScoringService.computeTimelineForUser(userId, days, 12, 4);
    if (!timelineData) {
      return res.status(404).json({
        success: false,
        error: 'Not enough interaction data to generate intervention plan.',
      });
    }

    const plan = ebhScoringService.buildInterventionPlan(timelineData);

    return res.json({
      success: true,
      data: {
        summary: timelineData.summary,
        warnings: timelineData.warnings,
        interventionPlan: plan,
      },
      meta: {
        scope: 'user',
        userId,
        days,
        phase: 'phase3-policy',
      },
    });
  })
);

/**
 * POST /api/v5/analytics/ebh/user/:userId/intervention-plan/apply
 * Phase 3: apply intervention plan to expert workflow (flag interactions + publish warning event)
 */
router.post(
  '/ebh/user/:userId/intervention-plan/apply',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const days = parseInt(req.query.days as string, 10) || 30;
    const lookbackHours = parseInt(req.query.lookbackHours as string, 10) || 24;
    const cooldownMinutes = parseInt(req.query.cooldownMinutes as string, 10) || 30;

    const timelineData = await ebhScoringService.computeTimelineForUser(userId, days, 12, 4);
    if (!timelineData) {
      return res.status(404).json({
        success: false,
        error: 'Not enough interaction data to apply intervention plan.',
      });
    }

    const plan = ebhScoringService.buildInterventionPlan(timelineData);
    const cutoff = new Date(Date.now() - Math.max(1, lookbackHours) * 60 * 60 * 1000);

    const latestApply = await getLatestSuccessfulApply(userId);
    const cooldown = getCooldownInfo(latestApply, cooldownMinutes);
    if (plan.notifyExpert && cooldown.active && cooldown.appliedTier === plan.tier) {
      await logEbhPolicyAudit({
        req,
        action: 'ebh_intervention_apply',
        result: 'failure',
        userId,
        changesDescription: `Apply skipped due to cooldown (${cooldown.remainingMinutes}m remaining) for tier ${plan.tier}`,
        after: {
          skipped: true,
          reason: 'cooldown',
          remainingMinutes: cooldown.remainingMinutes,
          tier: plan.tier,
        },
      });

      return res.status(409).json({
        success: false,
        error: 'Intervention apply is in cooldown window for this tier.',
        data: {
          cooldownActive: true,
          remainingMinutes: cooldown.remainingMinutes,
          tier: plan.tier,
        },
      });
    }

    let flaggedCount = 0;
    if (plan.notifyExpert) {
      const beforeFlagged = await InteractionEvent.countDocuments({
        userId,
        timestamp: { $gte: cutoff },
        expertReviewRecommended: true,
      });

      const updateResult = await InteractionEvent.updateMany(
        { userId, timestamp: { $gte: cutoff } },
        {
          $set: {
            expertReviewRecommended: true,
            expertReviewReason: `ebh_${plan.tier}`,
          },
        }
      );
      flaggedCount = updateResult.modifiedCount || 0;

      const afterFlagged = await InteractionEvent.countDocuments({
        userId,
        timestamp: { $gte: cutoff },
        expertReviewRecommended: true,
      });

      await eventQueueService.publish('ebh.warning', {
        userId,
        tier: plan.tier,
        score: timelineData.summary.currentScore,
        reason: `ebh_${plan.tier}`,
        warnings: timelineData.warnings,
      });

      await logEbhPolicyAudit({
        req,
        action: 'ebh_intervention_apply',
        result: 'success',
        userId,
        changesDescription: `Applied EBH ${plan.tier} policy and flagged interactions for expert review`,
        before: { flaggedInWindow: beforeFlagged },
        after: { flaggedInWindow: afterFlagged, flaggedCount, applied: true, tier: plan.tier, score: timelineData.summary.currentScore },
      });
    } else {
      await logEbhPolicyAudit({
        req,
        action: 'ebh_intervention_apply',
        result: 'success',
        userId,
        changesDescription: `EBH ${plan.tier} policy evaluated; no expert notification required`,
        after: { applied: false, tier: plan.tier, score: timelineData.summary.currentScore },
      });
    }

    return res.json({
      success: true,
      data: {
        interventionPlan: plan,
        applied: plan.notifyExpert,
        flaggedCount,
        lookbackHours,
        cooldownMinutes,
        summary: timelineData.summary,
      },
      meta: {
        scope: 'user',
        userId,
        phase: 'phase3-policy-apply',
      },
    });
  })
);

/**
 * GET /api/v5/analytics/ebh/user/:userId/intervention-plan/dry-run
 * Phase 3: preview intervention impact without mutating data
 */
router.get(
  '/ebh/user/:userId/intervention-plan/dry-run',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const days = parseInt(req.query.days as string, 10) || 30;
    const lookbackHours = parseInt(req.query.lookbackHours as string, 10) || 24;
    const cooldownMinutes = parseInt(req.query.cooldownMinutes as string, 10) || 30;

    const timelineData = await ebhScoringService.computeTimelineForUser(userId, days, 12, 4);
    if (!timelineData) {
      return res.status(404).json({
        success: false,
        error: 'Not enough interaction data to run intervention dry-run.',
      });
    }

    const plan = ebhScoringService.buildInterventionPlan(timelineData);
    const cutoff = new Date(Date.now() - Math.max(1, lookbackHours) * 60 * 60 * 1000);
    const wouldFlagCount = plan.notifyExpert
      ? await InteractionEvent.countDocuments({ userId, timestamp: { $gte: cutoff } })
      : 0;

    const latestApply = await getLatestSuccessfulApply(userId);
    const cooldown = getCooldownInfo(latestApply, cooldownMinutes);
    const blockedByCooldown = plan.notifyExpert && cooldown.active && cooldown.appliedTier === plan.tier;

    return res.json({
      success: true,
      data: {
        interventionPlan: plan,
        summary: timelineData.summary,
        warnings: timelineData.warnings,
        wouldApply: plan.notifyExpert && !blockedByCooldown,
        blockedByCooldown,
        cooldownRemainingMinutes: blockedByCooldown ? cooldown.remainingMinutes : 0,
        estimatedFlaggedCount: blockedByCooldown ? 0 : wouldFlagCount,
        lookbackHours,
      },
      meta: {
        scope: 'user',
        userId,
        days,
        cooldownMinutes,
        phase: 'phase3-policy-dry-run',
      },
    });
  })
);

/**
 * POST /api/v5/analytics/ebh/user/:userId/intervention-plan/revert
 * Phase 3: rollback EBH-applied expert flags in a time window
 */
router.post(
  '/ebh/user/:userId/intervention-plan/revert',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const lookbackHours = parseInt(req.query.lookbackHours as string, 10) || 24;
    const cutoff = new Date(Date.now() - Math.max(1, lookbackHours) * 60 * 60 * 1000);

    const beforeFlagged = await InteractionEvent.countDocuments({
      userId,
      timestamp: { $gte: cutoff },
      expertReviewRecommended: true,
      expertReviewReason: { $regex: '^ebh_' },
    });

    const result = await InteractionEvent.updateMany(
      {
        userId,
        timestamp: { $gte: cutoff },
        expertReviewRecommended: true,
        expertReviewReason: { $regex: '^ebh_' },
      },
      {
        $set: {
          expertReviewRecommended: false,
          expertReviewReason: 'reverted_by_expert',
        },
      }
    );

    const revertedCount = result.modifiedCount || 0;
    const afterFlagged = await InteractionEvent.countDocuments({
      userId,
      timestamp: { $gte: cutoff },
      expertReviewRecommended: true,
      expertReviewReason: { $regex: '^ebh_' },
    });

    await logEbhPolicyAudit({
      req,
      action: 'ebh_intervention_revert',
      result: 'success',
      userId,
      changesDescription: 'Reverted EBH intervention expert-review flags',
      before: { flaggedInWindow: beforeFlagged },
      after: { flaggedInWindow: afterFlagged, revertedCount },
    });

    return res.json({
      success: true,
      data: {
        userId,
        lookbackHours,
        revertedCount,
      },
      meta: {
        scope: 'user',
        phase: 'phase3-policy-revert',
      },
    });
  })
);

/**
 * GET /api/v5/analytics/ebh/user/:userId/intervention-plan/history
 * Phase 3: audit trail for EBH intervention apply/revert actions
 */
router.get(
  '/ebh/user/:userId/intervention-plan/history',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    const history = await AuditLogModel.find({
      userId,
      action: { $in: ['ebh_intervention_apply', 'ebh_intervention_revert'] },
      resource: 'ebh_intervention_policy',
    })
      .sort({ timestamp: -1 })
      .limit(Math.min(100, Math.max(1, limit)))
      .lean();

    return res.json({
      success: true,
      data: history,
      count: history.length,
      meta: {
        scope: 'user',
        userId,
        phase: 'phase3-policy-audit',
      },
    });
  })
);

export default router;
