import { normalizeHistory, normalizeProgress } from '../../src/routes/englishLabPayload';

describe('englishLab payload normalizers', () => {
  it('should normalize progress with numeric defaults', () => {
    expect(normalizeProgress(undefined)).toEqual({
      learned: 0,
      avgMemoryPercent: 0,
      attempts: 0,
      avgPronunciationScore: 0,
    });

    expect(
      normalizeProgress({
        learned: '2',
        avgMemoryPercent: '65.5',
        attempts: '7',
        avgPronunciationScore: '72.3',
      })
    ).toEqual({
      learned: 2,
      avgMemoryPercent: 65.5,
      attempts: 7,
      avgPronunciationScore: 72.3,
    });
  });

  it('should normalize history list to stable shape', () => {
    expect(normalizeHistory(undefined)).toEqual([]);

    expect(
      normalizeHistory([
        {
          at: '2026-03-16T00:00:00Z',
          word: 'trust',
          score: '80',
          recognized: 'trus',
        },
      ])
    ).toEqual([
      {
        at: '2026-03-16T00:00:00Z',
        word: 'trust',
        score: 80,
        recognized: 'trus',
        feedback: '',
      },
    ]);
  });
});
