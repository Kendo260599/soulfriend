import {
  DEFAULT_PROGRESS,
  normalizeHistory,
  normalizeProgress,
  normalizePronunciationResult,
} from './englishLabPayload';

describe('englishLabPayload', () => {
  it('normalizes progress with default fallback', () => {
    expect(normalizeProgress(undefined)).toEqual(DEFAULT_PROGRESS);
    expect(
      normalizeProgress({
        learned: '3',
        avgMemoryPercent: '55.5',
        attempts: '10',
        avgPronunciationScore: '70.2',
      })
    ).toEqual({
      learned: 3,
      avgMemoryPercent: 55.5,
      attempts: 10,
      avgPronunciationScore: 70.2,
    });
  });

  it('normalizes history to stable list shape', () => {
    expect(normalizeHistory(null)).toEqual([]);
    expect(
      normalizeHistory([
        {
          at: '2026-03-16T10:00:00Z',
          word: 'trust',
          score: '88',
          recognized: 'trus',
        },
      ])
    ).toEqual([
      {
        at: '2026-03-16T10:00:00Z',
        word: 'trust',
        score: 88,
        recognized: 'trus',
      },
    ]);
  });

  it('normalizes pronunciation result with nullable guard', () => {
    expect(normalizePronunciationResult(undefined)).toBeNull();
    expect(
      normalizePronunciationResult({
        target: 'trust',
        recognized: 'trus',
        score: '80',
        feedback: 'good',
      })
    ).toEqual({
      target: 'trust',
      recognized: 'trus',
      score: 80,
      feedback: 'good',
    });
  });
});
