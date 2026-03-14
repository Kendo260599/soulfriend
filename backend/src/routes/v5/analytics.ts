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
