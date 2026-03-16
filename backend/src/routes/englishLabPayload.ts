export type ProgressPayload = {
  learned: number;
  avgMemoryPercent: number;
  attempts: number;
  avgPronunciationScore: number;
};

export type HistoryPayloadItem = {
  at: string;
  word: string;
  score: number;
  recognized: string;
  feedback: string;
};

const DEFAULT_PROGRESS: ProgressPayload = {
  learned: 0,
  avgMemoryPercent: 0,
  attempts: 0,
  avgPronunciationScore: 0,
};

export function normalizeProgress(raw: any): ProgressPayload {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_PROGRESS };
  }

  return {
    learned: Number(raw.learned || 0),
    avgMemoryPercent: Number(raw.avgMemoryPercent || 0),
    attempts: Number(raw.attempts || 0),
    avgPronunciationScore: Number(raw.avgPronunciationScore || 0),
  };
}

export function normalizeHistory(raw: any): HistoryPayloadItem[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((item) => ({
    at: String(item?.at || ''),
    word: String(item?.word || ''),
    score: Number(item?.score || 0),
    recognized: String(item?.recognized || ''),
    feedback: String(item?.feedback || ''),
  }));
}
