import { triadicCanaryService } from '../../src/services/triadic/triadicCanaryService';

describe('triadicCanaryService KPI guard', () => {
  beforeEach(() => {
    (triadicCanaryService as any).canaryAutoDisabled = false;
    (triadicCanaryService as any).outcomeWindow = [];
    (triadicCanaryService as any).actionStatusOverrides = new Map();
    (triadicCanaryService as any).actionStatusTimeline = [];
    (triadicCanaryService as any).flagEnabled = true;
    (triadicCanaryService as any).canaryPercent = 100;
    (triadicCanaryService as any).minHelpfulnessRate = 0.55;
    (triadicCanaryService as any).maxUnsafeRate = 0.05;
    (triadicCanaryService as any).kpiMinSamples = 5;
    (triadicCanaryService as any).kpiWindowSize = 20;
  });

  it('should auto-disable canary when helpfulness KPI is breached', () => {
    const decision = triadicCanaryService.evaluateUserCanary({
      userId: 'u_kpi_1',
      riskLevel: 'LOW',
      crisisLevel: 'low',
    });

    expect(decision.enabled).toBe(true);

    let lastOutcome: any = null;
    for (let i = 0; i < 5; i++) {
      lastOutcome = triadicCanaryService.recordOutcome({
        decision,
        riskLevel: 'LOW',
        crisisLevel: 'low',
        qualityScore: 0.1,
        safetyPassed: true,
      });
    }

    expect(lastOutcome.kpiBreached).toBe(true);
    expect(lastOutcome.autoDisabled).toBe(true);

    const afterDisable = triadicCanaryService.evaluateUserCanary({
      userId: 'u_kpi_2',
      riskLevel: 'LOW',
      crisisLevel: 'low',
    });

    expect(afterDisable.enabled).toBe(false);
    expect(afterDisable.reason).toBe('kpi_disabled');
  });

  it('should include unsafe signals in KPI snapshot', () => {
    const decision = triadicCanaryService.evaluateUserCanary({
      userId: 'u_kpi_3',
      riskLevel: 'LOW',
      crisisLevel: 'low',
    });

    let lastOutcome: any = null;
    for (let i = 0; i < 5; i++) {
      lastOutcome = triadicCanaryService.recordOutcome({
        decision,
        riskLevel: i === 0 ? 'CRITICAL' : 'LOW',
        crisisLevel: i === 0 ? 'critical' : 'low',
        qualityScore: 0.8,
        safetyPassed: i !== 0,
      });
    }

    expect(lastOutcome.snapshot).toEqual(
      expect.objectContaining({
        sampleSize: 5,
      })
    );
    expect(lastOutcome.snapshot?.unsafeRate).toBeGreaterThan(0);
  });

  it('should expose explainable decision-gate checks for fail case', () => {
    (triadicCanaryService as any).flagEnabled = false;
    (triadicCanaryService as any).canaryPercent = 0;
    (triadicCanaryService as any).canaryAutoDisabled = true;
    (triadicCanaryService as any).outcomeWindow = [
      { helpful: 0, unsafe: 1 },
      { helpful: 0, unsafe: 1 },
    ];

    const readiness = triadicCanaryService.getDecisionGateReadiness();

    expect(readiness.ready).toBe(false);
    expect(readiness.status).toBe('fail');
    expect(readiness.reasons.length).toBeGreaterThan(0);
    expect(readiness.recommendedActions.length).toBeGreaterThan(0);
    expect(readiness.recommendedActions[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        priority: expect.stringMatching(/high|medium|low/),
        status: expect.stringMatching(/todo|in_progress|done/),
        action: expect.any(String),
        owner: expect.stringMatching(/expert|devops|product/),
        etaHours: expect.any(Number),
      })
    );
    expect(readiness.checks.some(check => check.id === 'flag_enabled' && !check.passed)).toBe(true);
    expect(readiness.checks.some(check => check.id === 'unsafe_threshold' && !check.passed)).toBe(true);
  });

  it('should expose explainable decision-gate checks for pass case', () => {
    (triadicCanaryService as any).flagEnabled = true;
    (triadicCanaryService as any).canaryPercent = 20;
    (triadicCanaryService as any).canaryAutoDisabled = false;
    (triadicCanaryService as any).kpiMinSamples = 5;
    (triadicCanaryService as any).minHelpfulnessRate = 0.55;
    (triadicCanaryService as any).maxUnsafeRate = 0.05;
    (triadicCanaryService as any).outcomeWindow = [
      { helpful: 1, unsafe: 0 },
      { helpful: 1, unsafe: 0 },
      { helpful: 1, unsafe: 0 },
      { helpful: 1, unsafe: 0 },
      { helpful: 1, unsafe: 0 },
    ];

    const readiness = triadicCanaryService.getDecisionGateReadiness();

    expect(readiness.ready).toBe(true);
    expect(readiness.status).toBe('pass');
    expect(readiness.reasons).toHaveLength(0);
    expect(readiness.recommendedActions).toHaveLength(0);
    expect(readiness.checks.every(check => check.passed)).toBe(true);
  });

  it('should update recommended action status when action exists', () => {
    (triadicCanaryService as any).flagEnabled = false;
    (triadicCanaryService as any).canaryPercent = 0;
    (triadicCanaryService as any).canaryAutoDisabled = false;
    (triadicCanaryService as any).outcomeWindow = [];

    const updated = triadicCanaryService.updateRecommendedActionStatus({
      actionId: 'enable_canary_flag',
      status: 'in_progress',
      updatedBy: 'expert_1',
      note: 'Applying env flag now',
    });

    expect(updated).toEqual(
      expect.objectContaining({
        actionId: 'enable_canary_flag',
        status: 'in_progress',
        updatedBy: 'expert_1',
      })
    );

    const readiness = triadicCanaryService.getDecisionGateReadiness();
    const action = readiness.recommendedActions.find(item => item.id === 'enable_canary_flag');
    expect(action?.status).toBe('in_progress');
  });

  it('should throw when updating unknown action id', () => {
    (triadicCanaryService as any).flagEnabled = false;
    (triadicCanaryService as any).canaryPercent = 0;

    expect(() => {
      triadicCanaryService.updateRecommendedActionStatus({
        actionId: 'non_existing_action',
        status: 'done',
      });
    }).toThrow('Unknown actionId');
  });

  it('should record action status timeline entries and support filtering', () => {
    (triadicCanaryService as any).flagEnabled = false;
    (triadicCanaryService as any).canaryPercent = 0;

    triadicCanaryService.updateRecommendedActionStatus({
      actionId: 'enable_canary_flag',
      status: 'in_progress',
      updatedBy: 'expert_1',
    });
    triadicCanaryService.updateRecommendedActionStatus({
      actionId: 'enable_canary_flag',
      status: 'done',
      updatedBy: 'expert_1',
    });

    const allTimeline = triadicCanaryService.getActionStatusTimeline({ limit: 10 });
    const filtered = triadicCanaryService.getActionStatusTimeline({
      actionId: 'enable_canary_flag',
      limit: 10,
    });

    expect(allTimeline.length).toBeGreaterThanOrEqual(2);
    expect(filtered).toHaveLength(2);
    expect(filtered[0]).toEqual(
      expect.objectContaining({
        actionId: 'enable_canary_flag',
        status: 'done',
        previousStatus: 'in_progress',
      })
    );
    expect(filtered[1]).toEqual(
      expect.objectContaining({
        actionId: 'enable_canary_flag',
        status: 'in_progress',
      })
    );
  });

  it('should support since/until range filtering for action status timeline', () => {
    (triadicCanaryService as any).actionStatusTimeline = [
      {
        actionId: 'enable_canary_flag',
        status: 'todo',
        previousStatus: 'todo',
        updatedAt: '2026-03-15T00:00:00.000Z',
        updatedBy: 'expert_1',
        owner: 'devops',
        priority: 'high',
      },
      {
        actionId: 'enable_canary_flag',
        status: 'in_progress',
        previousStatus: 'todo',
        updatedAt: '2026-03-15T01:00:00.000Z',
        updatedBy: 'expert_1',
        owner: 'devops',
        priority: 'high',
      },
      {
        actionId: 'enable_canary_flag',
        status: 'done',
        previousStatus: 'in_progress',
        updatedAt: '2026-03-15T03:00:00.000Z',
        updatedBy: 'expert_1',
        owner: 'devops',
        priority: 'high',
      },
    ];

    const ranged = triadicCanaryService.getActionStatusTimeline({
      actionId: 'enable_canary_flag',
      since: '2026-03-15T00:30:00.000Z',
      until: '2026-03-15T02:00:00.000Z',
      limit: 10,
    });

    expect(ranged).toHaveLength(1);
    expect(ranged[0]).toEqual(
      expect.objectContaining({
        status: 'in_progress',
      })
    );
  });

  it('should paginate action status timeline with nextCursor', () => {
    (triadicCanaryService as any).actionStatusTimeline = [
      {
        actionId: 'enable_canary_flag',
        status: 'todo',
        previousStatus: 'todo',
        updatedAt: '2026-03-15T00:00:00.000Z',
        updatedBy: 'expert_1',
        owner: 'devops',
        priority: 'high',
      },
      {
        actionId: 'enable_canary_flag',
        status: 'in_progress',
        previousStatus: 'todo',
        updatedAt: '2026-03-15T01:00:00.000Z',
        updatedBy: 'expert_1',
        owner: 'devops',
        priority: 'high',
      },
      {
        actionId: 'enable_canary_flag',
        status: 'done',
        previousStatus: 'in_progress',
        updatedAt: '2026-03-15T02:00:00.000Z',
        updatedBy: 'expert_1',
        owner: 'devops',
        priority: 'high',
      },
    ];

    const page1 = triadicCanaryService.getActionStatusTimelinePage({ limit: 2, cursor: '0' });
    expect(page1.items).toHaveLength(2);
    expect(page1.items[0].status).toBe('done');
    expect(page1.items[1].status).toBe('in_progress');
    expect(page1.nextCursor).toBe('2');

    const page2 = triadicCanaryService.getActionStatusTimelinePage({ limit: 2, cursor: page1.nextCursor || '0' });
    expect(page2.items).toHaveLength(1);
    expect(page2.items[0].status).toBe('todo');
    expect(page2.nextCursor).toBeNull();
  });

  it('should support oldest sort for action status timeline pagination', () => {
    (triadicCanaryService as any).actionStatusTimeline = [
      {
        actionId: 'enable_canary_flag',
        status: 'todo',
        previousStatus: 'todo',
        updatedAt: '2026-03-15T00:00:00.000Z',
        updatedBy: 'expert_1',
        owner: 'devops',
        priority: 'high',
      },
      {
        actionId: 'enable_canary_flag',
        status: 'in_progress',
        previousStatus: 'todo',
        updatedAt: '2026-03-15T01:00:00.000Z',
        updatedBy: 'expert_1',
        owner: 'devops',
        priority: 'high',
      },
      {
        actionId: 'enable_canary_flag',
        status: 'done',
        previousStatus: 'in_progress',
        updatedAt: '2026-03-15T02:00:00.000Z',
        updatedBy: 'expert_1',
        owner: 'devops',
        priority: 'high',
      },
    ];

    const page = triadicCanaryService.getActionStatusTimelinePage({
      sort: 'oldest',
      limit: 2,
      cursor: '0',
    });

    expect(page.items).toHaveLength(2);
    expect(page.items[0].status).toBe('todo');
    expect(page.items[1].status).toBe('in_progress');
    expect(page.nextCursor).toBe('2');
  });

  it('should manually re-enable canary after KPI auto-disable and append recovery history', () => {
    (triadicCanaryService as any).canaryAutoDisabled = true;
    (triadicCanaryService as any).kpiMinSamples = 5;
    (triadicCanaryService as any).outcomeWindow = [
      { helpful: 1, unsafe: 0 },
      { helpful: 1, unsafe: 0 },
      { helpful: 1, unsafe: 0 },
      { helpful: 1, unsafe: 0 },
      { helpful: 1, unsafe: 0 },
    ];

    const beforeLen = (triadicCanaryService as any).outcomeHistory.length;
    const updated = triadicCanaryService.reEnableAfterKpiDisable({
      reason: 'Rollback drill completed and safeguards verified',
      updatedBy: 'expert_1',
    });

    expect(updated).toEqual(
      expect.objectContaining({
        previousAutoDisabledByKpi: true,
        autoDisabledByKpi: false,
        updatedBy: 'expert_1',
        readinessBefore: expect.objectContaining({
          ready: true,
          status: 'pass',
        }),
      })
    );
    expect((triadicCanaryService as any).canaryAutoDisabled).toBe(false);
    expect((triadicCanaryService as any).outcomeHistory.length).toBe(beforeLen + 1);
  });

  it('should return fail readiness when canary is not auto-disabled', () => {
    (triadicCanaryService as any).canaryAutoDisabled = false;

    const readiness = triadicCanaryService.getManualReenableReadiness();

    expect(readiness.ready).toBe(false);
    expect(readiness.status).toBe('fail');
    expect(readiness.reasons[0]).toContain('Canary is not auto-disabled by KPI');
  });

  it('should return fail readiness when unsafe gate is blocked', () => {
    (triadicCanaryService as any).canaryAutoDisabled = true;
    (triadicCanaryService as any).kpiMinSamples = 5;
    (triadicCanaryService as any).maxUnsafeRate = 0.05;
    (triadicCanaryService as any).outcomeWindow = [
      { helpful: 1, unsafe: 1 },
      { helpful: 1, unsafe: 0 },
      { helpful: 1, unsafe: 0 },
      { helpful: 1, unsafe: 0 },
      { helpful: 1, unsafe: 0 },
    ];

    const readiness = triadicCanaryService.getManualReenableReadiness();

    expect(readiness.ready).toBe(false);
    expect(readiness.status).toBe('fail');
    expect(readiness.reasons[0]).toContain('Cannot re-enable canary while unsafe rate');
  });

  it('should block manual re-enable when unsafe rate still exceeds threshold', () => {
    (triadicCanaryService as any).canaryAutoDisabled = true;
    (triadicCanaryService as any).kpiMinSamples = 5;
    (triadicCanaryService as any).maxUnsafeRate = 0.05;
    (triadicCanaryService as any).outcomeWindow = [
      { helpful: 1, unsafe: 1 },
      { helpful: 1, unsafe: 0 },
      { helpful: 1, unsafe: 0 },
      { helpful: 1, unsafe: 0 },
      { helpful: 1, unsafe: 0 },
    ];

    expect(() => {
      triadicCanaryService.reEnableAfterKpiDisable({
        reason: 'Attempt recovery while unsafe remains high',
        updatedBy: 'expert_1',
      });
    }).toThrow('Cannot re-enable canary while unsafe rate');
  });

  it('should throw when manually re-enabling while canary is not auto-disabled', () => {
    (triadicCanaryService as any).canaryAutoDisabled = false;

    expect(() => {
      triadicCanaryService.reEnableAfterKpiDisable({
        reason: 'Not needed',
        updatedBy: 'expert_1',
      });
    }).toThrow('Canary is not auto-disabled');
  });
});
