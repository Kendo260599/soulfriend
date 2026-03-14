import { ebhScoringService } from '../../src/services/ebhScoringService';

describe('ebhScoringService Phase 3 policy', () => {
  it('returns black_hole urgent plan for very high score', () => {
    const plan = ebhScoringService.buildInterventionPlan({
      timeline: [
        {
          index: 0,
          period: { from: new Date('2026-01-01T00:00:00Z'), to: new Date('2026-01-01T01:00:00Z') },
          sampleSize: 12,
          score: 0.83,
          zone: 'black_hole',
          components: { inertia: 0.8, negativeDrift: 0.8, recoveryLag: 0.75, couplingDensity: 0.7 },
        },
      ],
      warnings: [
        {
          type: 'critical_entry',
          severity: 'high',
          message: 'entered critical',
          atIndex: 0,
          timestamp: new Date('2026-01-01T01:00:00Z'),
          score: 0.83,
        },
      ],
      summary: {
        currentScore: 0.83,
        currentZone: 'black_hole',
        trendSlope: 0.04,
        maxScore: 0.83,
        minScore: 0.83,
      },
    });

    expect(plan.tier).toBe('black_hole');
    expect(plan.notifyExpert).toBe(true);
    expect(plan.notifyPriority).toBe('urgent');
    expect(plan.followUpHours).toBe(1);
  });

  it('returns risk plan with high priority when accelerating warning exists', () => {
    const plan = ebhScoringService.buildInterventionPlan({
      timeline: [
        {
          index: 0,
          period: { from: new Date('2026-01-01T00:00:00Z'), to: new Date('2026-01-01T01:00:00Z') },
          sampleSize: 12,
          score: 0.45,
          zone: 'risk',
          components: { inertia: 0.5, negativeDrift: 0.5, recoveryLag: 0.45, couplingDensity: 0.4 },
        },
      ],
      warnings: [
        {
          type: 'accelerating',
          severity: 'high',
          message: 'accelerating',
          atIndex: 0,
          timestamp: new Date('2026-01-01T01:00:00Z'),
          score: 0.45,
        },
      ],
      summary: {
        currentScore: 0.45,
        currentZone: 'risk',
        trendSlope: 0.05,
        maxScore: 0.45,
        minScore: 0.45,
      },
    });

    expect(plan.tier).toBe('risk');
    expect(plan.notifyExpert).toBe(true);
    expect(plan.notifyPriority).toBe('high');
    expect(plan.followUpHours).toBe(12);
  });

  it('returns safe plan without expert notification', () => {
    const plan = ebhScoringService.buildInterventionPlan({
      timeline: [
        {
          index: 0,
          period: { from: new Date('2026-01-01T00:00:00Z'), to: new Date('2026-01-01T01:00:00Z') },
          sampleSize: 12,
          score: 0.08,
          zone: 'safe',
          components: { inertia: 0.1, negativeDrift: 0.1, recoveryLag: 0.05, couplingDensity: 0.05 },
        },
      ],
      warnings: [],
      summary: {
        currentScore: 0.08,
        currentZone: 'safe',
        trendSlope: -0.01,
        maxScore: 0.08,
        minScore: 0.08,
      },
    });

    expect(plan.tier).toBe('safe');
    expect(plan.notifyExpert).toBe(false);
    expect(plan.notifyPriority).toBe('low');
    expect(plan.followUpHours).toBe(48);
  });

  it('builds intervention plan for critical tier', () => {
    const plan = ebhScoringService.buildInterventionPlan({
      timeline: [
        {
          index: 0,
          period: { from: new Date('2026-01-01T00:00:00Z'), to: new Date('2026-01-01T01:00:00Z') },
          sampleSize: 12,
          score: 0.67,
          zone: 'critical',
          components: { inertia: 0.7, negativeDrift: 0.65, recoveryLag: 0.6, couplingDensity: 0.55 },
        },
      ],
      warnings: [
        {
          type: 'critical_entry',
          severity: 'high',
          message: 'critical',
          atIndex: 0,
          timestamp: new Date('2026-01-01T01:00:00Z'),
          score: 0.67,
        },
      ],
      summary: {
        currentScore: 0.67,
        currentZone: 'critical',
        trendSlope: 0.02,
        maxScore: 0.67,
        minScore: 0.67,
      },
    });

    expect(plan.tier).toBe('critical');
    expect(plan.notifyExpert).toBe(true);
    expect(plan.notifyPriority).toBe('high');
    expect(plan.followUpHours).toBe(4);
  });
});
