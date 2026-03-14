jest.mock('../../src/models/InteractionEvent', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}));

import InteractionEvent from '../../src/models/InteractionEvent';
import { ebhScoringService } from '../../src/services/ebhScoringService';

function buildInteraction(i: number, total: number) {
  const ratio = i / Math.max(1, total - 1);
  const riskLevel = ratio < 0.25
    ? 'LOW'
    : ratio < 0.5
      ? 'MODERATE'
      : ratio < 0.75
        ? 'HIGH'
        : 'CRITICAL';

  const sentiment = ratio < 0.3
    ? 'neutral'
    : ratio < 0.55
      ? 'negative'
      : 'very_negative';

  return {
    userId: 'u_timeline',
    sessionId: 's_timeline',
    timestamp: new Date(2026, 0, 1, 0, i, 0),
    riskLevel,
    sentiment,
    escalationTriggered: ratio > 0.8,
  };
}

describe('ebhScoringService timeline correctness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should produce rising trend and warnings for worsening interactions', async () => {
    const interactions = Array.from({ length: 24 }, (_, i) => buildInteraction(i, 24));

    (InteractionEvent.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(interactions),
      }),
    });

    const result = await ebhScoringService.computeTimelineForUser('u_timeline', 30, 8, 2);

    expect(result).toBeTruthy();
    expect(result!.timeline.length).toBeGreaterThanOrEqual(4);
    expect(result!.summary.currentScore).toBeGreaterThanOrEqual(result!.summary.minScore);
    expect(result!.summary.maxScore).toBeGreaterThanOrEqual(result!.summary.currentScore);
    expect(result!.warnings.length).toBeGreaterThan(0);

    const warningTypes = result!.warnings.map(w => w.type);
    expect(warningTypes.some(t => t === 'threshold_crossing' || t === 'critical_entry' || t === 'accelerating')).toBe(true);
  });

  it('should return null when data is insufficient for configured window', async () => {
    const interactions = Array.from({ length: 6 }, (_, i) => buildInteraction(i, 6));

    (InteractionEvent.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(interactions),
      }),
    });

    const result = await ebhScoringService.computeTimelineForUser('u_timeline', 30, 12, 4);
    expect(result).toBeNull();
  });
});
