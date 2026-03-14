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

jest.mock('../../src/models/InteractionEvent', () => ({
  __esModule: true,
  default: {
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

import { ebhScoringService } from '../../src/services/ebhScoringService';
import InteractionEvent from '../../src/models/InteractionEvent';
import AuditLogModel from '../../src/models/AuditLog';
import { eventQueueService } from '../../src/services/eventQueueService';

const app = express();
app.use(express.json());
app.use('/api/v5/analytics', analyticsRoutes);

describe('V5 Analytics EBH Phase 3 routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET dry-run should preview and block when cooldown is active', async () => {
    (ebhScoringService.computeTimelineForUser as jest.Mock).mockResolvedValue({
      timeline: [{ index: 0, score: 0.65, zone: 'critical' }],
      warnings: [{ type: 'critical_entry' }],
      summary: { currentScore: 0.65, currentZone: 'critical' },
    });

    (ebhScoringService.buildInterventionPlan as jest.Mock).mockReturnValue({
      tier: 'critical',
      notifyExpert: true,
      notifyPriority: 'high',
      followUpHours: 4,
      suggestedActionText: 'critical action',
      actions: ['a1'],
    });

    (AuditLogModel.findOne as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          timestamp: new Date(),
          changes: { after: { tier: 'critical', applied: true } },
        }),
      }),
    });

    const response = await request(app)
      .get('/api/v5/analytics/ebh/user/u123/intervention-plan/dry-run?cooldownMinutes=30')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.blockedByCooldown).toBe(true);
    expect(response.body.data.wouldApply).toBe(false);
  });

  it('POST apply should NOT block when latest audit was applied=false', async () => {
    (ebhScoringService.computeTimelineForUser as jest.Mock).mockResolvedValue({
      timeline: [{ index: 0, score: 0.62, zone: 'critical' }],
      warnings: [{ type: 'critical_entry' }],
      summary: { currentScore: 0.62, currentZone: 'critical' },
    });

    (ebhScoringService.buildInterventionPlan as jest.Mock).mockReturnValue({
      tier: 'critical',
      notifyExpert: true,
      notifyPriority: 'high',
      followUpHours: 4,
      suggestedActionText: 'critical action',
      actions: ['a1'],
    });

    (AuditLogModel.findOne as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          timestamp: new Date(),
          changes: { after: { tier: 'critical', applied: false } },
        }),
      }),
    });

    (InteractionEvent.countDocuments as jest.Mock)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(5);
    (InteractionEvent.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 4 });

    const response = await request(app)
      .post('/api/v5/analytics/ebh/user/u123/intervention-plan/apply?cooldownMinutes=30')
      .send({})
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.applied).toBe(true);
    expect(InteractionEvent.updateMany).toHaveBeenCalled();
    expect(eventQueueService.publish).toHaveBeenCalled();
  });

  it('POST apply should return 409 when cooldown active for same tier', async () => {
    (ebhScoringService.computeTimelineForUser as jest.Mock).mockResolvedValue({
      timeline: [{ index: 0, score: 0.62, zone: 'critical' }],
      warnings: [{ type: 'critical_entry' }],
      summary: { currentScore: 0.62, currentZone: 'critical' },
    });

    (ebhScoringService.buildInterventionPlan as jest.Mock).mockReturnValue({
      tier: 'critical',
      notifyExpert: true,
      notifyPriority: 'high',
      followUpHours: 4,
      suggestedActionText: 'critical action',
      actions: ['a1'],
    });

    (AuditLogModel.findOne as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          timestamp: new Date(),
          changes: { after: { tier: 'critical', applied: true } },
        }),
      }),
    });

    const response = await request(app)
      .post('/api/v5/analytics/ebh/user/u123/intervention-plan/apply?cooldownMinutes=30')
      .send({})
      .expect(409);

    expect(response.body.success).toBe(false);
    expect(response.body.data.cooldownActive).toBe(true);
    expect(InteractionEvent.updateMany).not.toHaveBeenCalled();
    expect(eventQueueService.publish).not.toHaveBeenCalled();
  });

  it('POST revert and GET history should work with audit-backed trace', async () => {
    (InteractionEvent.countDocuments as jest.Mock)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(0);

    (InteractionEvent.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 5 });

    const revertResponse = await request(app)
      .post('/api/v5/analytics/ebh/user/u123/intervention-plan/revert?lookbackHours=24')
      .send({})
      .expect(200);

    expect(revertResponse.body.success).toBe(true);
    expect(revertResponse.body.data.revertedCount).toBe(5);

    (AuditLogModel.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            { action: 'ebh_intervention_apply', timestamp: new Date() },
            { action: 'ebh_intervention_revert', timestamp: new Date() },
          ]),
        }),
      }),
    });

    const historyResponse = await request(app)
      .get('/api/v5/analytics/ebh/user/u123/intervention-plan/history?limit=10')
      .expect(200);

    expect(historyResponse.body.success).toBe(true);
    expect(historyResponse.body.count).toBe(2);
  });
});
