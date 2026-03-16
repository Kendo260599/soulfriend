export type ProgressState = {
  learned: number;
  avgMemoryPercent: number;
  attempts: number;
  avgPronunciationScore: number;
};

export type HistoryItem = {
  at: string;
  word: string;
  score: number;
  recognized: string;
};

export type PronunciationState = {
  target: string;
  recognized: string;
  score: number;
  feedback: string;
};

export const DEFAULT_PROGRESS: ProgressState = {
  learned: 0,
  avgMemoryPercent: 0,
  attempts: 0,
  avgPronunciationScore: 0,
};

export function normalizeProgress(prog: any): ProgressState {
  if (!prog || typeof prog !== 'object') {
    return { ...DEFAULT_PROGRESS };
  }

  return {
    learned: Number(prog.learned || 0),
    avgMemoryPercent: Number(prog.avgMemoryPercent || 0),
    attempts: Number(prog.attempts || 0),
    avgPronunciationScore: Number(prog.avgPronunciationScore || 0),
  };
}

export function normalizeHistory(remoteHistory: any): HistoryItem[] {
  if (!Array.isArray(remoteHistory)) {
    return [];
  }

  return remoteHistory.map((row: any) => ({
    at: String(row.at || ''),
    word: String(row.word || ''),
    score: Number(row.score || 0),
    recognized: String(row.recognized || ''),
  }));
}

export function normalizePronunciationResult(remoteResult: any): PronunciationState | null {
  if (!remoteResult || typeof remoteResult !== 'object') {
    return null;
  }

  return {
    target: String(remoteResult.target || ''),
    recognized: String(remoteResult.recognized || ''),
    score: Number(remoteResult.score || 0),
    feedback: String(remoteResult.feedback || ''),
  };
}
