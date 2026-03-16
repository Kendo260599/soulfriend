import request from 'supertest';
import express from 'express';
import analyticsRoutes from '../../src/routes/v5/analytics';

jest.mock('../../src/routes/expertAuth', () => ({
  authenticateExpert: (req: any, _res: any, next: any) => {
    req.expert = {
      expertId: 'expert_test_1',
      email: 'expert@test.local',
      name: 'Test Expert',
      role: 'psychologist',
    };
    next();
  },
}));

jest.mock('../../src/middleware/auth', () => ({
  authenticateAdmin: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../../src/services/impactAnalyticsEngine', () => ({
  impactAnalyticsEngine: {
    getDashboardData: jest.fn(),
    calculateMetrics: jest.fn(),
    getTrends: jest.fn(),
  },
}));

jest.mock('../../src/services/ebhScoringService', () => ({
  ebhScoringService: {
    computeTimelineForUser: jest.fn(),
    buildInterventionPlan: jest.fn(),
    getExpertOverviewForUser: jest.fn(),
    computeForUser: jest.fn(),
    computeForSession: jest.fn(),
  },
}));

jest.mock('../../src/services/triadic/triadicSynthesizer', () => ({
  triadicSynthesizer: {
    runShadowAnalysis: jest.fn(),
  },
}));

jest.mock('../../src/services/triadic/triadicCanaryService', () => ({
  triadicCanaryService: {
    getDashboardSnapshot: jest.fn().mockReturnValue({
      canary: {
        enabledByFlag: true,
        canaryPercent: 20,
        autoDisabledByKpi: false,
      },
      thresholds: {
        minHelpfulnessRate: 0.55,
        maxUnsafeRate: 0.05,
        windowSize: 100,
        minSamples: 20,
      },
      kpi: {
        sampleSize: 12,
        helpfulnessRate: 0.75,
        unsafeRate: 0.02,
        readyForGateEvaluation: false,
      },
    }),
    getDashboardHistory: jest.fn().mockReturnValue([
      {
        timestamp: '2026-03-15T00:00:00.000Z',
        sampleSize: 8,
        helpfulnessRate: 0.62,
        unsafeRate: 0.01,
        readyForGateEvaluation: false,
        autoDisabledByKpi: false,
        kpiBreached: false,
      },
      {
        timestamp: '2026-03-15T00:30:00.000Z',
        sampleSize: 20,
        helpfulnessRate: 0.58,
        unsafeRate: 0.03,
        readyForGateEvaluation: true,
        autoDisabledByKpi: false,
        kpiBreached: false,
      },
    ]),
    getDashboardHistoryAggregated: jest.fn().mockReturnValue([
      {
        bucketStart: '2026-03-15T00:00:00.000Z',
        bucketMinutes: 15,
        count: 2,
        avgHelpfulnessRate: 0.6,
        avgUnsafeRate: 0.02,
        maxSampleSize: 20,
        gateReadyRate: 0.5,
        kpiBreachedCount: 0,
        autoDisabledObserved: false,
      },
    ]),
    getDecisionGateReadiness: jest.fn().mockReturnValue({
      ready: false,
      status: 'fail',
      reasons: ['Not enough samples for gate evaluation.'],
      recommendedActions: [
        {
          id: 'collect_more_samples',
          priority: 'medium',
          status: 'todo',
          action: 'Collect more canary interactions before making rollout decisions.',
          owner: 'product',
          etaHours: 24,
          sourceCheckId: 'sample_ready',
        },
      ],
      checks: [
        {
          id: 'sample_ready',
          label: 'Enough samples for gate evaluation',
          passed: false,
          detail: 'Not enough samples for gate evaluation.',
        },
      ],
      snapshot: {
        canary: {
          enabledByFlag: true,
          canaryPercent: 20,
          autoDisabledByKpi: false,
        },
        thresholds: {
          minHelpfulnessRate: 0.55,
          maxUnsafeRate: 0.05,
          windowSize: 100,
          minSamples: 20,
        },
        kpi: {
          sampleSize: 12,
          helpfulnessRate: 0.75,
          unsafeRate: 0.02,
          readyForGateEvaluation: false,
        },
      },
    }),
    getManualReenableReadiness: jest.fn().mockReturnValue({
      ready: true,
      status: 'pass',
      reasons: [],
      checks: [
        {
          id: 'auto_disabled_by_kpi',
          label: 'Canary is currently auto-disabled by KPI',
          passed: true,
          blocking: true,
          detail: 'Canary is auto-disabled and can be evaluated for manual recovery.',
        },
      ],
      snapshot: {
        canary: {
          enabledByFlag: true,
          canaryPercent: 20,
          autoDisabledByKpi: true,
        },
        thresholds: {
          minHelpfulnessRate: 0.55,
          maxUnsafeRate: 0.05,
          windowSize: 100,
          minSamples: 20,
        },
        kpi: {
          sampleSize: 24,
          helpfulnessRate: 0.71,
          unsafeRate: 0.01,
          readyForGateEvaluation: true,
        },
      },
    }),
    updateRecommendedActionStatus: jest.fn().mockReturnValue({
      actionId: 'collect_more_samples',
      status: 'in_progress',
      updatedAt: '2026-03-15T01:00:00.000Z',
      updatedBy: 'expert_test_1',
      note: 'Investigating traffic quality',
    }),
    reEnableAfterKpiDisable: jest.fn().mockReturnValue({
      previousAutoDisabledByKpi: true,
      autoDisabledByKpi: false,
      updatedAt: '2026-03-15T01:20:00.000Z',
      updatedBy: 'expert_test_1',
      reason: 'Rollback drill completed',
      readinessBefore: {
        ready: true,
        status: 'pass',
        reasons: [],
      },
    }),
    getActionStatusTimelinePage: jest.fn().mockReturnValue({
      items: [
        {
          actionId: 'collect_more_samples',
          status: 'in_progress',
          previousStatus: 'todo',
          updatedAt: '2026-03-15T01:00:00.000Z',
          updatedBy: 'expert_test_1',
          note: 'Investigating traffic quality',
          owner: 'product',
          priority: 'medium',
        },
      ],
      nextCursor: '1',
    }),
  },
}));

jest.mock('../../src/models/InteractionEvent', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    countDocuments: jest.fn(),
    updateMany: jest.fn(),
  },
}));

jest.mock('../../src/models/AuditLog', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  },
}));

jest.mock('../../src/services/eventQueueService', () => ({
  eventQueueService: {
    publish: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import InteractionEvent from '../../src/models/InteractionEvent';
import { triadicSynthesizer } from '../../src/services/triadic/triadicSynthesizer';
import { triadicCanaryService } from '../../src/services/triadic/triadicCanaryService';
import AuditLogModel from '../../src/models/AuditLog';
import { eventQueueService } from '../../src/services/eventQueueService';

const app = express();
app.use(express.json());
app.use('/api/v5/analytics', analyticsRoutes);

describe('V5 Analytics Triadic shadow route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 404 when no interaction events are found', async () => {
    const lean = jest.fn().mockResolvedValue([]);
    const limit = jest.fn().mockReturnValue({ lean });
    const sort = jest.fn().mockReturnValue({ limit });
    (InteractionEvent.find as jest.Mock).mockReturnValue({ sort });

    const response = await request(app)
      .get('/api/v5/analytics/triadic/user/u404')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('No interaction events');
    expect(triadicSynthesizer.runShadowAnalysis).not.toHaveBeenCalled();
    expect(InteractionEvent.updateMany).not.toHaveBeenCalled();
  });

  it('should return triadic canary dashboard snapshot for internal monitoring', async () => {
    const response = await request(app)
      .get('/api/v5/analytics/triadic/canary/status')
      .expect(200);

    expect(triadicCanaryService.getDashboardSnapshot).toHaveBeenCalledTimes(1);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        canary: expect.objectContaining({
          canaryPercent: 20,
        }),
        kpi: expect.objectContaining({
          sampleSize: 12,
        }),
      })
    );
    expect(response.body.meta).toEqual(
      expect.objectContaining({
        scope: 'triadic_canary_internal',
        mode: 'canary-dashboard',
      })
    );
  });

  it('should return triadic canary dashboard history trend for internal monitoring', async () => {
    const response = await request(app)
      .get('/api/v5/analytics/triadic/canary/status/history?limit=5000&minutes=20000')
      .expect(200);

    expect(triadicCanaryService.getDashboardHistory).toHaveBeenCalledWith({
      limit: 1000,
      minutes: 10080,
    });

    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        trend: expect.any(Array),
      })
    );
    expect(response.body.data.trend).toHaveLength(2);
    expect(response.body.meta).toEqual(
      expect.objectContaining({
        scope: 'triadic_canary_internal',
        mode: 'canary-dashboard-history',
        points: 2,
      })
    );
  });

  it('should return triadic canary aggregated history buckets with default bucket clamp', async () => {
    const response = await request(app)
      .get('/api/v5/analytics/triadic/canary/status/history/aggregate?limit=15&minutes=120&bucketMinutes=7')
      .expect(200);

    expect(triadicCanaryService.getDashboardHistoryAggregated).toHaveBeenCalledWith({
      limit: 15,
      minutes: 120,
      bucketMinutes: 15,
    });

    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        buckets: expect.any(Array),
      })
    );
    expect(response.body.meta).toEqual(
      expect.objectContaining({
        mode: 'canary-dashboard-history-aggregate',
        granularity: 'manual',
        bucketMinutes: 15,
        points: 1,
      })
    );
  });

  it('should auto-pick 5-minute bucket for short canary windows', async () => {
    const response = await request(app)
      .get('/api/v5/analytics/triadic/canary/status/history/aggregate?minutes=180&granularity=auto')
      .expect(200);

    expect(triadicCanaryService.getDashboardHistoryAggregated).toHaveBeenCalledWith(
      expect.objectContaining({
        minutes: 180,
        bucketMinutes: 5,
      })
    );

    expect(response.body.meta).toEqual(
      expect.objectContaining({
        granularity: 'auto',
        bucketMinutes: 5,
      })
    );
  });

  it('should auto-pick 60-minute bucket for long canary windows', async () => {
    const response = await request(app)
      .get('/api/v5/analytics/triadic/canary/status/history/aggregate?minutes=4000&granularity=auto')
      .expect(200);

    expect(triadicCanaryService.getDashboardHistoryAggregated).toHaveBeenCalledWith(
      expect.objectContaining({
        minutes: 4000,
        bucketMinutes: 60,
      })
    );

    expect(response.body.meta).toEqual(
      expect.objectContaining({
        granularity: 'auto',
        bucketMinutes: 60,
      })
    );
  });

  it('should return triadic canary decision gate readiness status', async () => {
    const response = await request(app)
      .get('/api/v5/analytics/triadic/canary/decision-gate')
      .expect(200);

    expect(triadicCanaryService.getDecisionGateReadiness).toHaveBeenCalledTimes(1);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        ready: false,
        status: 'fail',
        reasons: expect.any(Array),
        checks: expect.any(Array),
        recommendedActions: expect.any(Array),
      })
    );
    expect(response.body.data.recommendedActions[0]).toEqual(
      expect.objectContaining({
        priority: 'medium',
        status: 'todo',
        owner: 'product',
        etaHours: 24,
        sourceCheckId: 'sample_ready',
      })
    );
    expect(response.body.meta).toEqual(
      expect.objectContaining({
        scope: 'triadic_canary_internal',
        mode: 'canary-decision-gate',
      })
    );
  });

  it('should update triadic canary action status and return updated readiness', async () => {
    const response = await request(app)
      .post('/api/v5/analytics/triadic/canary/decision-gate/action-status')
      .send({
        actionId: 'collect_more_samples',
        status: 'in_progress',
        note: 'Investigating traffic quality',
      })
      .expect(200);

    expect(triadicCanaryService.updateRecommendedActionStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        actionId: 'collect_more_samples',
        status: 'in_progress',
      })
    );
    expect(AuditLogModel.create).toHaveBeenCalled();
    expect(eventQueueService.publish).toHaveBeenCalledWith(
      'triadic.canary.action_status.updated',
      expect.objectContaining({
        actionId: 'collect_more_samples',
        status: 'in_progress',
      })
    );

    expect(response.body.success).toBe(true);
    expect(response.body.data.updated).toEqual(
      expect.objectContaining({
        actionId: 'collect_more_samples',
        status: 'in_progress',
      })
    );
    expect(response.body.meta).toEqual(
      expect.objectContaining({
        mode: 'canary-decision-gate-action-status-update',
      })
    );
  });

  it('should return 400 when action status update payload is invalid', async () => {
    const response = await request(app)
      .post('/api/v5/analytics/triadic/canary/decision-gate/action-status')
      .send({
        status: 'invalid_status',
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('actionId is required');
    expect(triadicCanaryService.updateRecommendedActionStatus).not.toHaveBeenCalled();
  });

  it('should manually re-enable canary with audit trail and readiness snapshot', async () => {
    const response = await request(app)
      .post('/api/v5/analytics/triadic/canary/decision-gate/re-enable')
      .send({ reason: 'Rollback drill completed' })
      .expect(200);

    expect(triadicCanaryService.reEnableAfterKpiDisable).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'Rollback drill completed',
      })
    );
    expect(AuditLogModel.create).toHaveBeenCalled();
    expect(eventQueueService.publish).toHaveBeenCalledWith(
      'triadic.canary.manual_reenabled',
      expect.objectContaining({
        autoDisabledByKpi: false,
      })
    );
    expect(response.body.success).toBe(true);
    expect(response.body.data.reEnableReadiness).toEqual(
      expect.objectContaining({
        ready: true,
        status: 'pass',
      })
    );
    expect(response.body.meta).toEqual(
      expect.objectContaining({
        mode: 'canary-decision-gate-re-enable',
      })
    );
  });

  it('should return 400 when re-enable reason is invalid', async () => {
    const response = await request(app)
      .post('/api/v5/analytics/triadic/canary/decision-gate/re-enable')
      .send({ reason: 'abc' })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('reason is required');
    expect(triadicCanaryService.reEnableAfterKpiDisable).not.toHaveBeenCalled();
  });

  it('should return manual re-enable history report with actor summary', async () => {
    const lean = jest.fn().mockResolvedValue([
      {
        _id: 'audit_1',
        timestamp: new Date('2026-03-15T02:00:00.000Z'),
        expertId: 'expert_test_1',
        changes: {
          after: {
            reason: 'Rollback drill completed',
            updatedAt: '2026-03-15T02:00:00.000Z',
            previousAutoDisabledByKpi: true,
            autoDisabledByKpi: false,
            readinessBefore: {
              ready: true,
              status: 'pass',
              reasons: [],
            },
          },
        },
      },
      {
        _id: 'audit_2',
        timestamp: new Date('2026-03-15T03:00:00.000Z'),
        expertId: 'expert_test_2',
        changes: {
          after: {
            reason: 'Second verification complete',
            updatedAt: '2026-03-15T03:00:00.000Z',
            previousAutoDisabledByKpi: true,
            autoDisabledByKpi: false,
          },
        },
      },
    ]);
    const limit = jest.fn().mockReturnValue({ lean });
    const sort = jest.fn().mockReturnValue({ limit });
    (AuditLogModel.find as jest.Mock).mockReturnValue({ sort });

    const response = await request(app)
      .get('/api/v5/analytics/triadic/canary/decision-gate/re-enable/history?limit=999&since=2026-03-15T00:00:00.000Z')
      .expect(200);

    expect(AuditLogModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'triadic_canary_manual_reenable',
        resource: 'triadic_canary_control',
        result: 'success',
      })
    );
    expect(limit).toHaveBeenCalledWith(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.history).toHaveLength(2);
    expect(response.body.data.history[0]).toEqual(
      expect.objectContaining({
        reEnableReadiness: expect.objectContaining({
          ready: true,
          status: 'pass',
        }),
      })
    );
    expect(response.body.data.summary).toEqual(
      expect.objectContaining({
        total: 2,
        uniqueActors: 2,
        byActor: {
          expert_test_1: 1,
          expert_test_2: 1,
        },
        readiness: {
          withReadiness: 1,
          pass: 1,
          fail: 0,
          unknown: 1,
          passRate: 1,
        },
        failReasons: {},
        byActorReadiness: {
          expert_test_1: {
            total: 1,
            withReadiness: 1,
            pass: 1,
            fail: 0,
            unknown: 0,
            passRate: 1,
          },
          expert_test_2: {
            total: 1,
            withReadiness: 0,
            pass: 0,
            fail: 0,
            unknown: 1,
            passRate: 0,
          },
        },
      })
    );
    expect(response.body.meta).toEqual(
      expect.objectContaining({
        mode: 'canary-decision-gate-re-enable-history',
        points: 2,
      })
    );
  });

  it('should return 400 when re-enable history since is invalid', async () => {
    const response = await request(app)
      .get('/api/v5/analytics/triadic/canary/decision-gate/re-enable/history?since=invalid')
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('since must be a valid ISO datetime string');
    expect(AuditLogModel.find).not.toHaveBeenCalled();
  });

  it('should return triadic canary action status timeline', async () => {
    const response = await request(app)
      .get('/api/v5/analytics/triadic/canary/decision-gate/action-status/history?limit=50&actionId=collect_more_samples&since=2026-03-15T00:00:00.000Z&until=2026-03-15T02:00:00.000Z&cursor=0&sort=newest')
      .expect(200);

    expect(triadicCanaryService.getActionStatusTimelinePage).toHaveBeenCalledWith({
      limit: 50,
      actionId: 'collect_more_samples',
      since: '2026-03-15T00:00:00.000Z',
      until: '2026-03-15T02:00:00.000Z',
      cursor: '0',
      sort: 'newest',
    });
    expect(response.body.success).toBe(true);
    expect(response.body.data.timeline).toHaveLength(1);
    expect(response.body.meta).toEqual(
      expect.objectContaining({
        mode: 'canary-decision-gate-action-status-history',
        sort: 'newest',
        nextCursor: '1',
        points: 1,
      })
    );
  });

  it('should support oldest sort for action status timeline', async () => {
    const response = await request(app)
      .get('/api/v5/analytics/triadic/canary/decision-gate/action-status/history?sort=oldest')
      .expect(200);

    expect(triadicCanaryService.getActionStatusTimelinePage).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: 'oldest',
      })
    );
    expect(response.body.meta).toEqual(
      expect.objectContaining({
        sort: 'oldest',
      })
    );
  });

  it('should include status summary when includeSummary=true', async () => {
    (triadicCanaryService.getActionStatusTimelinePage as jest.Mock).mockReturnValueOnce({
      items: [
        {
          actionId: 'collect_more_samples',
          status: 'todo',
          previousStatus: 'todo',
          updatedAt: '2026-03-15T01:00:00.000Z',
          updatedBy: 'expert_test_1',
          note: 'Queued',
          owner: 'product',
          priority: 'medium',
        },
        {
          actionId: 'collect_more_samples',
          status: 'in_progress',
          previousStatus: 'todo',
          updatedAt: '2026-03-15T01:10:00.000Z',
          updatedBy: 'expert_test_1',
          note: 'Started',
          owner: 'product',
          priority: 'medium',
        },
      ],
      nextCursor: null,
    });

    const response = await request(app)
      .get('/api/v5/analytics/triadic/canary/decision-gate/action-status/history?includeSummary=true')
      .expect(200);

    expect(response.body.data.summary).toEqual({
      total: 2,
      todo: 1,
      inProgress: 1,
      done: 0,
    });
    expect(response.body.meta).toEqual(
      expect.objectContaining({
        includeSummary: true,
      })
    );
  });

  it('should include grouped summary breakdown by owner when includeSummary=true&groupBy=owner', async () => {
    (triadicCanaryService.getActionStatusTimelinePage as jest.Mock).mockReturnValueOnce({
      items: [
        {
          actionId: 'collect_more_samples',
          status: 'todo',
          previousStatus: 'todo',
          updatedAt: '2026-03-15T01:00:00.000Z',
          updatedBy: 'expert_test_1',
          note: 'Queued',
          owner: 'product',
          priority: 'medium',
        },
        {
          actionId: 'reduce_unsafe_risk',
          status: 'in_progress',
          previousStatus: 'todo',
          updatedAt: '2026-03-15T01:10:00.000Z',
          updatedBy: 'expert_test_1',
          note: 'Started',
          owner: 'expert',
          priority: 'high',
        },
        {
          actionId: 'rollback_review',
          status: 'done',
          previousStatus: 'in_progress',
          updatedAt: '2026-03-15T01:20:00.000Z',
          updatedBy: 'expert_test_1',
          note: 'Completed',
          owner: 'expert',
          priority: 'high',
        },
      ],
      nextCursor: null,
    });

    const response = await request(app)
      .get('/api/v5/analytics/triadic/canary/decision-gate/action-status/history?includeSummary=true&groupBy=owner')
      .expect(200);

    expect(response.body.data.summary).toEqual({
      total: 3,
      todo: 1,
      inProgress: 1,
      done: 1,
      groupBy: 'owner',
      breakdown: {
        product: 1,
        expert: 2,
      },
    });
    expect(response.body.meta).toEqual(
      expect.objectContaining({
        includeSummary: true,
        groupBy: 'owner',
      })
    );
  });

  it('should return 400 when groupBy is invalid for action status timeline', async () => {
    const response = await request(app)
      .get('/api/v5/analytics/triadic/canary/decision-gate/action-status/history?groupBy=team')
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('groupBy must be one of');
    expect(triadicCanaryService.getActionStatusTimelinePage).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid since/until range on action status timeline', async () => {
    const response = await request(app)
      .get('/api/v5/analytics/triadic/canary/decision-gate/action-status/history?since=invalid&until=2026-03-15T02:00:00.000Z')
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('since must be a valid ISO datetime string');
    expect(triadicCanaryService.getActionStatusTimelinePage).not.toHaveBeenCalled();
  });

  it('should run in shadow-mode, normalize inputs, and return analysis payload', async () => {
    const events = [
      {
        timestamp: new Date('2026-03-14T10:05:00.000Z'),
        sessionId: 's2',
        userMessage: 'message 2',
        aiResponse: 'response 2',
        riskLevel: 'INVALID_RISK',
        sentiment: 'INVALID_SENTIMENT',
        sentimentScore: 0.11,
        escalationTriggered: true,
      },
      {
        timestamp: new Date('2026-03-14T10:00:00.000Z'),
        sessionId: 's1',
        userMessage: 'message 1',
        aiResponse: 'response 1',
        riskLevel: 'LOW',
        sentiment: 'negative',
        sentimentScore: -0.22,
        escalationTriggered: false,
      },
    ];

    const expectedAnalysis = {
      mode: 'shadow',
      sampleSize: 2,
      structural: {
        riskBand: 'low',
        trendType: 'stable',
        recurrenceScore: 0.3,
        hypotheses: [],
        confidence: 0.6,
      },
      operational: {
        interventionType: 'grounding',
        minimalAction: 'Use a brief grounding prompt and a check-in question.',
        expectedDelta: 'Maintain stability and reduce rumination drift.',
        burden: 'low',
        confidence: 0.66,
      },
      symbolic: {
        enabled: false,
        symbolicDensity: 0,
        identityLanguage: false,
        repetitionDetected: false,
        candidates: [],
        confidence: 0,
      },
      synthesis: {
        strategy: 'stable:grounding',
        responseHint: 'hint',
        safetyNotes: ['Shadow mode only: no runtime response mutation.'],
        confidence: 0.5,
      },
    };

    const lean = jest.fn().mockResolvedValue(events);
    const limit = jest.fn().mockReturnValue({ lean });
    const sort = jest.fn().mockReturnValue({ limit });
    (InteractionEvent.find as jest.Mock).mockReturnValue({ sort });
    (triadicSynthesizer.runShadowAnalysis as jest.Mock).mockReturnValue(expectedAnalysis);

    const response = await request(app)
      .get('/api/v5/analytics/triadic/user/u123?limit=999')
      .expect(200);

    expect(InteractionEvent.find).toHaveBeenCalledWith({ userId: 'u123' });
    expect(sort).toHaveBeenCalledWith({ timestamp: -1 });
    expect(limit).toHaveBeenCalledWith(120);

    expect(triadicSynthesizer.runShadowAnalysis).toHaveBeenCalledTimes(1);
    const inputTurns = (triadicSynthesizer.runShadowAnalysis as jest.Mock).mock.calls[0][0];
    expect(inputTurns).toHaveLength(2);
    expect(inputTurns[0].sessionId).toBe('s1');
    expect(inputTurns[1].sessionId).toBe('s2');
    expect(inputTurns[1].riskLevel).toBe('NONE');
    expect(inputTurns[1].sentiment).toBe('neutral');

    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(expectedAnalysis);
    expect(response.body.meta.mode).toBe('shadow');
    expect(response.body.meta.sampleSize).toBe(2);
    expect(InteractionEvent.updateMany).not.toHaveBeenCalled();
  });

  it('should use default limit=60 when query limit is not provided', async () => {
    const events = [
      {
        timestamp: new Date('2026-03-14T10:00:00.000Z'),
        sessionId: 's1',
        userMessage: 'message 1',
        aiResponse: 'response 1',
        riskLevel: 'LOW',
        sentiment: 'neutral',
        sentimentScore: 0,
        escalationTriggered: false,
      },
    ];

    const expectedAnalysis = {
      mode: 'shadow',
      sampleSize: 1,
      structural: {
        riskBand: 'low',
        trendType: 'stable',
        recurrenceScore: 0,
        hypotheses: [],
        confidence: 0.5,
      },
      operational: {
        interventionType: 'grounding',
        minimalAction: 'Use a brief grounding prompt and a check-in question.',
        expectedDelta: 'Maintain stability and reduce rumination drift.',
        burden: 'low',
        confidence: 0.66,
      },
      symbolic: {
        enabled: false,
        symbolicDensity: 0,
        identityLanguage: false,
        repetitionDetected: false,
        candidates: [],
        confidence: 0,
      },
      synthesis: {
        strategy: 'stable:grounding',
        responseHint: 'hint',
        safetyNotes: ['Shadow mode only: no runtime response mutation.'],
        confidence: 0.5,
      },
    };

    const lean = jest.fn().mockResolvedValue(events);
    const limit = jest.fn().mockReturnValue({ lean });
    const sort = jest.fn().mockReturnValue({ limit });
    (InteractionEvent.find as jest.Mock).mockReturnValue({ sort });
    (triadicSynthesizer.runShadowAnalysis as jest.Mock).mockReturnValue(expectedAnalysis);

    const response = await request(app)
      .get('/api/v5/analytics/triadic/user/u123')
      .expect(200);

    expect(limit).toHaveBeenCalledWith(60);
    expect(response.body.success).toBe(true);
    expect(response.body.meta.sampleSize).toBe(1);
    expect(response.body.meta.mode).toBe('shadow');
  });

  it('should clamp query limit to min=20 when provided value is too small', async () => {
    const events = [
      {
        timestamp: new Date('2026-03-14T10:00:00.000Z'),
        sessionId: 's1',
        userMessage: 'message 1',
        aiResponse: 'response 1',
        riskLevel: 'LOW',
        sentiment: 'neutral',
        sentimentScore: 0,
        escalationTriggered: false,
      },
    ];

    const expectedAnalysis = {
      mode: 'shadow',
      sampleSize: 1,
      structural: {
        riskBand: 'low',
        trendType: 'stable',
        recurrenceScore: 0,
        hypotheses: [],
        confidence: 0.5,
      },
      operational: {
        interventionType: 'grounding',
        minimalAction: 'Use a brief grounding prompt and a check-in question.',
        expectedDelta: 'Maintain stability and reduce rumination drift.',
        burden: 'low',
        confidence: 0.66,
      },
      symbolic: {
        enabled: false,
        symbolicDensity: 0,
        identityLanguage: false,
        repetitionDetected: false,
        candidates: [],
        confidence: 0,
      },
      synthesis: {
        strategy: 'stable:grounding',
        responseHint: 'hint',
        safetyNotes: ['Shadow mode only: no runtime response mutation.'],
        confidence: 0.5,
      },
    };

    const lean = jest.fn().mockResolvedValue(events);
    const limit = jest.fn().mockReturnValue({ lean });
    const sort = jest.fn().mockReturnValue({ limit });
    (InteractionEvent.find as jest.Mock).mockReturnValue({ sort });
    (triadicSynthesizer.runShadowAnalysis as jest.Mock).mockReturnValue(expectedAnalysis);

    const response = await request(app)
      .get('/api/v5/analytics/triadic/user/u123?limit=1')
      .expect(200);

    expect(limit).toHaveBeenCalledWith(20);
    expect(response.body.success).toBe(true);
    expect(response.body.meta.sampleSize).toBe(1);
    expect(response.body.meta.mode).toBe('shadow');
  });

  it('should run triadic analysis by session and read userText field', async () => {
    const events = [
      {
        timestamp: new Date('2026-03-14T10:05:00.000Z'),
        sessionId: 'sess-1',
        userText: 'turn 2 from userText',
        aiResponse: 'response 2',
        riskLevel: 'MODERATE',
        sentiment: 'negative',
        sentimentScore: -0.4,
        escalationTriggered: false,
      },
      {
        timestamp: new Date('2026-03-14T10:00:00.000Z'),
        sessionId: 'sess-1',
        userText: 'turn 1 from userText',
        aiResponse: 'response 1',
        riskLevel: 'LOW',
        sentiment: 'neutral',
        sentimentScore: 0,
        escalationTriggered: false,
      },
    ];

    const expectedAnalysis = {
      mode: 'shadow',
      sampleSize: 2,
      structural: {
        riskBand: 'moderate',
        trendType: 'stable',
        recurrenceScore: 0.4,
        hypotheses: [],
        confidence: 0.6,
      },
      operational: {
        interventionType: 'grounding',
        minimalAction: 'Use a brief grounding prompt and a check-in question.',
        expectedDelta: 'Maintain stability and reduce rumination drift.',
        burden: 'low',
        confidence: 0.66,
      },
      symbolic: {
        enabled: false,
        symbolicDensity: 0,
        identityLanguage: false,
        repetitionDetected: false,
        candidates: [],
        confidence: 0,
      },
      synthesis: {
        strategy: 'stable:grounding',
        responseHint: 'hint',
        safetyNotes: ['Shadow mode only: no runtime response mutation.'],
        confidence: 0.5,
      },
    };

    const lean = jest.fn().mockResolvedValue(events);
    const limit = jest.fn().mockReturnValue({ lean });
    const sort = jest.fn().mockReturnValue({ limit });
    (InteractionEvent.find as jest.Mock).mockReturnValue({ sort });
    (triadicSynthesizer.runShadowAnalysis as jest.Mock).mockReturnValue(expectedAnalysis);

    const response = await request(app)
      .get('/api/v5/analytics/triadic/session/sess-1?limit=999')
      .expect(200);

    expect(InteractionEvent.find).toHaveBeenCalledWith({ sessionId: 'sess-1' });
    expect(limit).toHaveBeenCalledWith(120);
    expect(triadicSynthesizer.runShadowAnalysis).toHaveBeenCalledTimes(1);

    const inputTurns = (triadicSynthesizer.runShadowAnalysis as jest.Mock).mock.calls[0][0];
    expect(inputTurns[0].userText).toBe('turn 1 from userText');
    expect(inputTurns[1].userText).toBe('turn 2 from userText');

    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(expectedAnalysis);
    expect(response.body.meta.scope).toBe('session');
    expect(response.body.meta.mode).toBe('shadow');
    expect(response.body.meta.sampleSize).toBe(2);
  });

  it('should return 404 for triadic session endpoint when no events are found', async () => {
    const lean = jest.fn().mockResolvedValue([]);
    const limit = jest.fn().mockReturnValue({ lean });
    const sort = jest.fn().mockReturnValue({ limit });
    (InteractionEvent.find as jest.Mock).mockReturnValue({ sort });

    const response = await request(app)
      .get('/api/v5/analytics/triadic/session/sess-empty')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('No interaction events found');
    expect(triadicSynthesizer.runShadowAnalysis).not.toHaveBeenCalled();
  });

  it('should return triadic user summary from stored shadow metadata', async () => {
    const events = [
      {
        triadic: {
          mode: 'shadow',
          sampleSize: 10,
          structural: { riskBand: 'moderate' },
          operational: { interventionType: 'grounding' },
          symbolic: { enabled: true, symbolicDensity: 0.6 },
          synthesis: { strategy: 'stable:grounding', confidence: 0.7 },
        },
      },
      {
        triadic: {
          mode: 'shadow',
          sampleSize: 8,
          structural: { riskBand: 'high' },
          operational: { interventionType: 'safety_anchor' },
          symbolic: { enabled: false, symbolicDensity: 0.2 },
          synthesis: { strategy: 'rising:safety_anchor', confidence: 0.5 },
        },
      },
    ];

    const lean = jest.fn().mockResolvedValue(events);
    const limit = jest.fn().mockReturnValue({ lean });
    const sort = jest.fn().mockReturnValue({ limit });
    (InteractionEvent.find as jest.Mock).mockReturnValue({ sort });

    const response = await request(app)
      .get('/api/v5/analytics/triadic/user/u-summary/summary?days=7&limit=999')
      .expect(200);

    expect(InteractionEvent.find).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u-summary',
        triadic: { $exists: true },
      })
    );
    expect(limit).toHaveBeenCalledWith(500);
    expect(response.body.success).toBe(true);
    expect(response.body.data.summary.count).toBe(2);
    expect(response.body.data.summary.strategyDistribution['stable:grounding']).toBe(1);
    expect(response.body.data.summary.riskBandDistribution.high).toBe(1);
    expect(response.body.meta.mode).toBe('shadow');
  });

  it('should return 404 when triadic summary has no stored shadow metadata', async () => {
    const lean = jest.fn().mockResolvedValue([]);
    const limit = jest.fn().mockReturnValue({ lean });
    const sort = jest.fn().mockReturnValue({ limit });
    (InteractionEvent.find as jest.Mock).mockReturnValue({ sort });

    const response = await request(app)
      .get('/api/v5/analytics/triadic/user/u-summary-empty/summary')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('No triadic shadow data');
  });

  it('should return triadic user trend grouped by day', async () => {
    const events = [
      {
        timestamp: new Date('2026-03-14T09:00:00.000Z'),
        triadic: {
          structural: { riskBand: 'high' },
          symbolic: { enabled: true, symbolicDensity: 0.7 },
          synthesis: { strategy: 'rising:safety_anchor', confidence: 0.8 },
        },
      },
      {
        timestamp: new Date('2026-03-14T08:00:00.000Z'),
        triadic: {
          structural: { riskBand: 'moderate' },
          symbolic: { enabled: false, symbolicDensity: 0.2 },
          synthesis: { strategy: 'stable:grounding', confidence: 0.6 },
        },
      },
      {
        timestamp: new Date('2026-03-13T10:00:00.000Z'),
        triadic: {
          structural: { riskBand: 'low' },
          symbolic: { enabled: false, symbolicDensity: 0.1 },
          synthesis: { strategy: 'stable:grounding', confidence: 0.5 },
        },
      },
    ];

    const lean = jest.fn().mockResolvedValue(events);
    const limit = jest.fn().mockReturnValue({ lean });
    const sort = jest.fn().mockReturnValue({ limit });
    (InteractionEvent.find as jest.Mock).mockReturnValue({ sort });

    const response = await request(app)
      .get('/api/v5/analytics/triadic/user/u-trend/trend?days=30&limit=9999')
      .expect(200);

    expect(InteractionEvent.find).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u-trend',
        triadic: { $exists: true },
      })
    );
    expect(limit).toHaveBeenCalledWith(1000);
    expect(response.body.success).toBe(true);
    expect(response.body.data.trend).toHaveLength(2);
    expect(response.body.data.trend[1].date).toBe('2026-03-14');
    expect(response.body.data.trend[1].count).toBe(2);
    expect(response.body.data.alerts).toHaveLength(1);
    expect(response.body.data.alerts[0].type).toBe('symbolic_enabled_spike');
    expect(response.body.meta.points).toBe(2);
    expect(response.body.meta.alertCount).toBe(1);
  });

  it('should return 404 when triadic trend has no data', async () => {
    const lean = jest.fn().mockResolvedValue([]);
    const limit = jest.fn().mockReturnValue({ lean });
    const sort = jest.fn().mockReturnValue({ limit });
    (InteractionEvent.find as jest.Mock).mockReturnValue({ sort });

    const response = await request(app)
      .get('/api/v5/analytics/triadic/user/u-trend-empty/trend')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('No triadic shadow data found to build trend');
  });

  it('should return triadic session trend grouped by day', async () => {
    const events = [
      {
        timestamp: new Date('2026-03-14T09:00:00.000Z'),
        triadic: {
          structural: { riskBand: 'high' },
          symbolic: { enabled: true, symbolicDensity: 0.7 },
          synthesis: { strategy: 'rising:safety_anchor', confidence: 0.8 },
        },
      },
      {
        timestamp: new Date('2026-03-13T08:00:00.000Z'),
        triadic: {
          structural: { riskBand: 'moderate' },
          symbolic: { enabled: false, symbolicDensity: 0.2 },
          synthesis: { strategy: 'stable:grounding', confidence: 0.6 },
        },
      },
    ];

    const lean = jest.fn().mockResolvedValue(events);
    const limit = jest.fn().mockReturnValue({ lean });
    const sort = jest.fn().mockReturnValue({ limit });
    (InteractionEvent.find as jest.Mock).mockReturnValue({ sort });

    const response = await request(app)
      .get('/api/v5/analytics/triadic/session/sess-trend/trend?days=30&limit=9999')
      .expect(200);

    expect(InteractionEvent.find).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'sess-trend',
        triadic: { $exists: true },
      })
    );
    expect(limit).toHaveBeenCalledWith(1000);
    expect(response.body.success).toBe(true);
    expect(response.body.data.trend).toHaveLength(2);
    expect(Array.isArray(response.body.data.alerts)).toBe(true);
    expect(response.body.meta.scope).toBe('session');
    expect(response.body.meta.points).toBe(2);
  });

  it('should return 404 when triadic session trend has no data', async () => {
    const lean = jest.fn().mockResolvedValue([]);
    const limit = jest.fn().mockReturnValue({ lean });
    const sort = jest.fn().mockReturnValue({ limit });
    (InteractionEvent.find as jest.Mock).mockReturnValue({ sort });

    const response = await request(app)
      .get('/api/v5/analytics/triadic/session/sess-trend-empty/trend')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('No triadic shadow data found to build trend for this session');
  });

  it('should compare user and session triadic trends with divergence summary', async () => {
    const userEvents = [
      {
        timestamp: new Date('2026-03-14T09:00:00.000Z'),
        triadic: {
          structural: { riskBand: 'high' },
          symbolic: { enabled: true, symbolicDensity: 0.8 },
          synthesis: { strategy: 'rising:safety_anchor', confidence: 0.9 },
        },
      },
    ];

    const sessionEvents = [
      {
        timestamp: new Date('2026-03-14T09:00:00.000Z'),
        triadic: {
          structural: { riskBand: 'moderate' },
          symbolic: { enabled: false, symbolicDensity: 0.3 },
          synthesis: { strategy: 'stable:grounding', confidence: 0.6 },
        },
      },
    ];

    const userLean = jest.fn().mockResolvedValue(userEvents);
    const userLimit = jest.fn().mockReturnValue({ lean: userLean });
    const userSort = jest.fn().mockReturnValue({ limit: userLimit });

    const sessionLean = jest.fn().mockResolvedValue(sessionEvents);
    const sessionLimit = jest.fn().mockReturnValue({ lean: sessionLean });
    const sessionSort = jest.fn().mockReturnValue({ limit: sessionLimit });

    (InteractionEvent.find as jest.Mock)
      .mockReturnValueOnce({ sort: userSort })
      .mockReturnValueOnce({ sort: sessionSort });

    const response = await request(app)
      .get('/api/v5/analytics/triadic/compare/user/u-comp/session/s-comp/trend?days=30&limit=200')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user.trend).toHaveLength(1);
    expect(response.body.data.session.trend).toHaveLength(1);
    expect(response.body.data.divergence.symbolicEnabledRateDelta).toBe(1);
    expect(response.body.meta.userPoints).toBe(1);
    expect(response.body.meta.sessionPoints).toBe(1);
  });

  it('should return 404 when compare endpoint lacks either side data', async () => {
    const userLean = jest.fn().mockResolvedValue([]);
    const userLimit = jest.fn().mockReturnValue({ lean: userLean });
    const userSort = jest.fn().mockReturnValue({ limit: userLimit });

    const sessionLean = jest.fn().mockResolvedValue([
      {
        timestamp: new Date('2026-03-14T09:00:00.000Z'),
        triadic: {
          structural: { riskBand: 'moderate' },
          symbolic: { enabled: false, symbolicDensity: 0.3 },
          synthesis: { strategy: 'stable:grounding', confidence: 0.6 },
        },
      },
    ]);
    const sessionLimit = jest.fn().mockReturnValue({ lean: sessionLean });
    const sessionSort = jest.fn().mockReturnValue({ limit: sessionLimit });

    (InteractionEvent.find as jest.Mock)
      .mockReturnValueOnce({ sort: userSort })
      .mockReturnValueOnce({ sort: sessionSort });

    const response = await request(app)
      .get('/api/v5/analytics/triadic/compare/user/u-comp-empty/session/s-comp/trend')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Not enough triadic shadow data');
  });
});
