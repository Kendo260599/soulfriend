jest.mock('../../src/services/interactionCaptureService', () => ({
  interactionCaptureService: {
    capture: jest.fn(),
  },
}));

jest.mock('../../src/services/eventQueueService', () => ({
  eventQueueService: {
    publish: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../src/services/safetyGuardrailService', () => ({
  safetyGuardrailService: {
    checkResponse: jest.fn(),
  },
}));

jest.mock('../../src/services/responseEvaluationService', () => ({
  responseEvaluationService: {
    evaluate: jest.fn(),
  },
}));

jest.mock('../../src/models/SafetyLog', () => ({
  SafetyLog: {
    create: jest.fn(),
  },
}));

jest.mock('../../src/models/InteractionEvent', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

jest.mock('../../src/services/triadic/triadicSynthesizer', () => ({
  triadicSynthesizer: {
    runShadowAnalysis: jest.fn(),
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

import { v5IntegrationService } from '../../src/services/v5IntegrationService';
import { interactionCaptureService } from '../../src/services/interactionCaptureService';
import InteractionEvent from '../../src/models/InteractionEvent';
import { eventQueueService } from '../../src/services/eventQueueService';
import { triadicSynthesizer } from '../../src/services/triadic/triadicSynthesizer';
import { logger } from '../../src/utils/logger';

describe('v5IntegrationService triadic shadow attach', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (v5IntegrationService as any).triadicLatencySamples = [];
    (v5IntegrationService as any).triadicLastBudgetAlertAt = 0;
    (v5IntegrationService as any).triadicP95BudgetMs = 200;
    (v5IntegrationService as any).triadicP95MinSamples = 20;
    (v5IntegrationService as any).triadicP95AlertCooldownMs = 300000;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should capture interaction and attach triadic shadow metadata', async () => {
    (interactionCaptureService.capture as jest.Mock).mockResolvedValue({ _id: 'evt_1' });

    const lean = jest.fn().mockResolvedValue([
      {
        timestamp: new Date('2026-03-14T11:00:00.000Z'),
        sessionId: 's1',
        userText: 'Mình đang mệt',
        aiResponse: 'Mình ở đây với bạn',
        riskLevel: 'LOW',
        sentiment: 'negative',
        sentimentScore: -0.3,
        escalationTriggered: false,
      },
    ]);
    const limit = jest.fn().mockReturnValue({ lean });
    const sort = jest.fn().mockReturnValue({ limit });
    (InteractionEvent.find as jest.Mock).mockReturnValue({ sort });
    (InteractionEvent.findByIdAndUpdate as jest.Mock).mockResolvedValue(undefined);

    (triadicSynthesizer.runShadowAnalysis as jest.Mock).mockReturnValue({
      mode: 'shadow',
      sampleSize: 1,
      structural: { riskBand: 'low', trendType: 'stable', recurrenceScore: 0, hypotheses: [], confidence: 0.5 },
      operational: { interventionType: 'grounding', minimalAction: 'x', expectedDelta: 'y', burden: 'low', confidence: 0.6 },
      symbolic: { enabled: false, symbolicDensity: 0, identityLanguage: false, repetitionDetected: false, candidates: [], confidence: 0 },
      synthesis: { strategy: 'stable:grounding', responseHint: 'hint', safetyNotes: [], confidence: 0.5 },
    });

    const eventId = await v5IntegrationService.captureInteraction({
      sessionId: 's1',
      userId: 'u1',
      userMessage: 'hello',
      aiResponse: 'hi',
      responseTimeMs: 50,
      riskLevel: 'LOW',
      emotionalState: 'negative',
      intent: 'support',
      crisisLevel: 'low',
    });

    expect(eventId).toBe('evt_1');
    expect(eventQueueService.publish).toHaveBeenCalledWith('interaction.captured', expect.any(Object));

    await new Promise(resolve => setImmediate(resolve));

    expect(InteractionEvent.find).toHaveBeenCalledWith({ userId: 'u1' });
    expect(sort).toHaveBeenCalledWith({ timestamp: -1 });
    expect(limit).toHaveBeenCalledWith(60);
    expect(triadicSynthesizer.runShadowAnalysis).toHaveBeenCalledTimes(1);
    expect(InteractionEvent.findByIdAndUpdate).toHaveBeenCalledWith(
      'evt_1',
      expect.objectContaining({ $set: expect.objectContaining({ triadic: expect.any(Object) }) })
    );
  });

  it('should still return interaction id when triadic attach fails', async () => {
    (interactionCaptureService.capture as jest.Mock).mockResolvedValue({ _id: 'evt_2' });
    (InteractionEvent.find as jest.Mock).mockImplementation(() => {
      throw new Error('db failed');
    });

    const eventId = await v5IntegrationService.captureInteraction({
      sessionId: 's2',
      userId: 'u2',
      userMessage: 'hello',
      aiResponse: 'hi',
      responseTimeMs: 40,
    });

    expect(eventId).toBe('evt_2');
    expect(eventQueueService.publish).toHaveBeenCalledWith('interaction.captured', expect.any(Object));
  });

  it('should timeout triadic attach and log warning without throwing', async () => {
    const timeoutSpy = jest
      .spyOn(global, 'setTimeout')
      .mockImplementation((callback: any) => {
        callback();
        return 0 as any;
      });

    const lean = jest.fn().mockResolvedValue([
      {
        timestamp: new Date('2026-03-14T11:00:00.000Z'),
        sessionId: 's-timeout',
        userText: 'Mình thấy nặng nề',
        aiResponse: 'Mình ở đây',
        riskLevel: 'LOW',
        sentiment: 'negative',
        sentimentScore: -0.2,
        escalationTriggered: false,
      },
    ]);
    const limit = jest.fn().mockReturnValue({ lean });
    const sort = jest.fn().mockReturnValue({ limit });
    (InteractionEvent.find as jest.Mock).mockReturnValue({ sort });

    (triadicSynthesizer.runShadowAnalysis as jest.Mock).mockReturnValue({
      mode: 'shadow',
      sampleSize: 1,
      structural: { riskBand: 'low', trendType: 'stable', recurrenceScore: 0, hypotheses: [], confidence: 0.5 },
      operational: { interventionType: 'grounding', minimalAction: 'x', expectedDelta: 'y', burden: 'low', confidence: 0.6 },
      symbolic: { enabled: false, symbolicDensity: 0, identityLanguage: false, repetitionDetected: false, candidates: [], confidence: 0 },
      synthesis: { strategy: 'stable:grounding', responseHint: 'hint', safetyNotes: [], confidence: 0.5 },
    });

    (InteractionEvent.findByIdAndUpdate as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );

    await (v5IntegrationService as any).attachTriadicShadow('evt_timeout', 'u_timeout');

    expect(logger.warn).toHaveBeenCalledWith(
      '[V5 Integration] attachTriadicShadow failed (non-critical):',
      expect.stringContaining('timeout')
    );

    timeoutSpy.mockRestore();
  });

  it('should log slow-path warning when triadic attach duration is high', async () => {
    (interactionCaptureService.capture as jest.Mock).mockResolvedValue({ _id: 'evt_slow' });

    const lean = jest.fn().mockResolvedValue([
      {
        timestamp: new Date('2026-03-14T11:00:00.000Z'),
        sessionId: 's-slow',
        userText: 'Mình thấy áp lực',
        aiResponse: 'Mình hiểu',
        riskLevel: 'LOW',
        sentiment: 'negative',
        sentimentScore: -0.2,
        escalationTriggered: false,
      },
    ]);
    const limit = jest.fn().mockReturnValue({ lean });
    const sort = jest.fn().mockReturnValue({ limit });
    (InteractionEvent.find as jest.Mock).mockReturnValue({ sort });
    (InteractionEvent.findByIdAndUpdate as jest.Mock).mockResolvedValue(undefined);

    (triadicSynthesizer.runShadowAnalysis as jest.Mock).mockReturnValue({
      mode: 'shadow',
      sampleSize: 1,
      structural: { riskBand: 'low', trendType: 'stable', recurrenceScore: 0, hypotheses: [], confidence: 0.5 },
      operational: { interventionType: 'grounding', minimalAction: 'x', expectedDelta: 'y', burden: 'low', confidence: 0.6 },
      symbolic: { enabled: false, symbolicDensity: 0, identityLanguage: false, repetitionDetected: false, candidates: [], confidence: 0 },
      synthesis: { strategy: 'stable:grounding', responseHint: 'hint', safetyNotes: [], confidence: 0.5 },
    });

    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(1300);

    await v5IntegrationService.captureInteraction({
      sessionId: 's-slow',
      userId: 'u-slow',
      userMessage: 'hello',
      aiResponse: 'hi',
      responseTimeMs: 50,
    });

    await new Promise(resolve => setImmediate(resolve));

    expect(logger.warn).toHaveBeenCalledWith(
      '[V5 Integration] attachTriadicShadow slow path',
      expect.objectContaining({
        durationMs: 300,
        latencyBucket: '200to499ms',
      })
    );

    nowSpy.mockRestore();
  });

  it('should emit expected latency buckets at boundaries', async () => {
    const makeFindChain = () => {
      const lean = jest.fn().mockResolvedValue([
        {
          timestamp: new Date('2026-03-14T11:00:00.000Z'),
          sessionId: 's-bucket',
          userText: 'boundary test',
          aiResponse: 'ok',
          riskLevel: 'LOW',
          sentiment: 'neutral',
          sentimentScore: 0,
          escalationTriggered: false,
        },
      ]);
      const limit = jest.fn().mockReturnValue({ lean });
      const sort = jest.fn().mockReturnValue({ limit });
      (InteractionEvent.find as jest.Mock).mockReturnValue({ sort });
    };

    (InteractionEvent.findByIdAndUpdate as jest.Mock).mockResolvedValue(undefined);
    (triadicSynthesizer.runShadowAnalysis as jest.Mock).mockReturnValue({
      mode: 'shadow',
      sampleSize: 1,
      structural: { riskBand: 'low', trendType: 'stable', recurrenceScore: 0, hypotheses: [], confidence: 0.5 },
      operational: { interventionType: 'grounding', minimalAction: 'x', expectedDelta: 'y', burden: 'low', confidence: 0.6 },
      symbolic: { enabled: false, symbolicDensity: 0, identityLanguage: false, repetitionDetected: false, candidates: [], confidence: 0 },
      synthesis: { strategy: 'stable:grounding', responseHint: 'hint', safetyNotes: [], confidence: 0.5 },
    });

    const cases = [
      { duration: 19, bucket: 'lt20ms' },
      { duration: 20, bucket: '20to49ms' },
      { duration: 50, bucket: '50to99ms' },
      { duration: 100, bucket: '100to199ms' },
      { duration: 200, bucket: '200to499ms' },
      { duration: 500, bucket: 'gte500ms' },
    ];

    for (const item of cases) {
      jest.clearAllMocks();
      makeFindChain();

      const nowSpy = jest.spyOn(Date, 'now');
      nowSpy.mockReturnValueOnce(1000).mockReturnValueOnce(1000 + item.duration);

      await (v5IntegrationService as any).attachTriadicShadow(`evt_${item.duration}`, 'u_bucket');

      expect(logger.debug).toHaveBeenCalledWith(
        '[V5 Integration] attachTriadicShadow completed',
        expect.objectContaining({ latencyBucket: item.bucket })
      );

      nowSpy.mockRestore();
    }
  });

  it('should publish triadic latency budget breach once threshold is exceeded', async () => {
    for (let i = 0; i < 20; i++) {
      const nowSpy = jest.spyOn(Date, 'now');
      nowSpy.mockReturnValue(1301 + i);

      (v5IntegrationService as any).enforceTriadicLatencyBudget(300, '200to499ms');

      nowSpy.mockRestore();
    }

    expect(logger.error).toHaveBeenCalledWith(
      '[V5 Integration] triadic latency budget breached',
      expect.objectContaining({
        budgetP95Ms: 200,
        observedP95Ms: 300,
      })
    );

    expect(eventQueueService.publish).toHaveBeenCalledWith(
      'triadic.latency_budget.breached',
      expect.objectContaining({
        budgetP95Ms: 200,
        observedP95Ms: 300,
      })
    );
  });

  it('should respect breach alert cooldown and avoid duplicate budget events', async () => {
    // Prime window with slow samples so p95 is above budget
    for (let i = 0; i < 20; i++) {
      const nowSpy = jest.spyOn(Date, 'now');
      nowSpy.mockReturnValue(2000);
      (v5IntegrationService as any).enforceTriadicLatencyBudget(300, '200to499ms');
      nowSpy.mockRestore();
    }

    const beforeCalls = (eventQueueService.publish as jest.Mock).mock.calls.filter(
      (call: any[]) => call[0] === 'triadic.latency_budget.breached'
    ).length;

    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValue(2100);
    (v5IntegrationService as any).enforceTriadicLatencyBudget(300, '200to499ms');
    nowSpy.mockRestore();

    const afterCalls = (eventQueueService.publish as jest.Mock).mock.calls.filter(
      (call: any[]) => call[0] === 'triadic.latency_budget.breached'
    ).length;

    expect(afterCalls).toBe(beforeCalls);
  });
});
