import express, { Request, Response } from 'express';
import multer from 'multer';
import { transcribeAudioBuffer } from '../services/transcriptionBridgeService';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

type WordItem = {
  word: string;
  meaningVi: string;
};

type PronunciationHistoryItem = {
  at: string;
  word: string;
  score: number;
  recognized: string;
  feedback: string;
};

type UserState = {
  memory: Record<string, number>;
  history: PronunciationHistoryItem[];
};

const WORD_BANK: WordItem[] = [
  { word: 'trust', meaningVi: 'tin tưởng' },
  { word: 'hope', meaningVi: 'hy vọng' },
  { word: 'fear', meaningVi: 'sợ hãi' },
  { word: 'care', meaningVi: 'quan tâm' },
  { word: 'love', meaningVi: 'tình yêu' },
  { word: 'friend', meaningVi: 'bạn bè' },
  { word: 'family', meaningVi: 'gia đình' },
  { word: 'support', meaningVi: 'hỗ trợ' },
  { word: 'respect', meaningVi: 'tôn trọng' },
  { word: 'listen', meaningVi: 'lắng nghe' },
  { word: 'speak', meaningVi: 'nói' },
  { word: 'understand', meaningVi: 'thấu hiểu' },
  { word: 'practice', meaningVi: 'luyện tập' },
  { word: 'review', meaningVi: 'ôn tập' },
  { word: 'focus', meaningVi: 'tập trung' },
  { word: 'balance', meaningVi: 'cân bằng' },
  { word: 'growth', meaningVi: 'phát triển' },
  { word: 'progress', meaningVi: 'tiến bộ' },
  { word: 'healing', meaningVi: 'chữa lành' },
  { word: 'calm', meaningVi: 'bình tĩnh' },
];

const userStore: Map<string, UserState> = new Map();

function getUserId(req: Request): string {
  const bodyValue = typeof req.body?.userId === 'string' ? req.body.userId.trim() : '';
  const queryValue = typeof req.query.userId === 'string' ? req.query.userId.trim() : '';
  const headerValue = typeof req.headers['x-user-id'] === 'string' ? req.headers['x-user-id'].trim() : '';
  return bodyValue || queryValue || headerValue || 'anonymous';
}

function getUserState(userId: string): UserState {
  const existing = userStore.get(userId);
  if (existing) return existing;

  const initial: UserState = {
    memory: {},
    history: [],
  };
  userStore.set(userId, initial);
  return initial;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshteinSimilarity(a: string, b: string): number {
  if (!a && !b) return 1;
  if (!a || !b) return 0;

  const matrix: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[a.length][b.length];
  return Math.max(0, 1 - distance / Math.max(a.length, b.length));
}

function scorePronunciation(targetWord: string, recognizedText: string): { score: number; feedback: string; recognized: string } {
  const target = normalizeText(targetWord);
  const recognized = normalizeText(recognizedText);

  if (!recognized) {
    return {
      score: 0,
      recognized,
      feedback: 'Chưa nhận được gì. Hãy nói rõ hơn và thử lại.',
    };
  }

  const charScore = Math.round(levenshteinSimilarity(target, recognized) * 100);
  const endingScore = Math.round(levenshteinSimilarity(target.slice(-2), recognized.slice(-2)) * 100);
  const score = Math.round(charScore * 0.7 + endingScore * 0.3);

  let feedback = 'Cần luyện thêm âm cuối và độ rõ.';
  if (score >= 90) feedback = 'Rất tốt. Phát âm gần như chính xác.';
  else if (score >= 70) feedback = 'Gần đúng. Thử chậm và rõ âm cuối hơn.';
  else if (score >= 50) feedback = 'Tạm ổn. Cần điều chỉnh độ rõ và nhịp.';

  return { score, feedback, recognized };
}

function chooseQuizItem(memory: Record<string, number>): { item: WordItem; choices: string[] } {
  const sorted = [...WORD_BANK].sort((a, b) => (memory[a.word] ?? 0) - (memory[b.word] ?? 0));
  const candidatePool = sorted.slice(0, Math.min(8, sorted.length));
  const target = candidatePool[Math.floor(Math.random() * candidatePool.length)] ?? WORD_BANK[0];

  const distractors = WORD_BANK
    .filter((item) => item.word !== target.word)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((item) => item.meaningVi);

  const choices = [...distractors, target.meaningVi].sort(() => Math.random() - 0.5);
  return { item: target, choices };
}

function buildProgress(state: UserState): {
  learned: number;
  avgMemoryPercent: number;
  attempts: number;
  avgPronunciationScore: number;
} {
  const values = Object.values(state.memory);
  const avgMemory = values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const learned = values.filter((value) => value >= 0.6).length;
  const attempts = state.history.length;
  const avgPronunciationScore = attempts > 0
    ? Math.round(state.history.reduce((sum, row) => sum + row.score, 0) / attempts)
    : 0;

  return {
    learned,
    avgMemoryPercent: Math.round(avgMemory * 100),
    attempts,
    avgPronunciationScore,
  };
}

router.get('/words', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: WORD_BANK,
  });
});

router.get('/quiz/next', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const state = getUserState(userId);
  const quiz = chooseQuizItem(state.memory);

  res.json({
    success: true,
    data: {
      userId,
      ...quiz,
      memoryStrength: state.memory[quiz.item.word] ?? 0,
      progress: buildProgress(state),
    },
  });
});

router.post('/quiz/answer', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const state = getUserState(userId);

  const word = typeof req.body?.word === 'string' ? req.body.word.trim() : '';
  const selectedMeaning = typeof req.body?.selectedMeaning === 'string' ? req.body.selectedMeaning.trim() : '';

  if (!word || !selectedMeaning) {
    return res.status(400).json({
      success: false,
      message: 'word và selectedMeaning là bắt buộc.',
    });
  }

  const item = WORD_BANK.find((entry) => entry.word === word);
  if (!item) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy từ cần chấm quiz.',
    });
  }

  const isCorrect = item.meaningVi === selectedMeaning;
  const current = state.memory[word] ?? 0;
  const next = Math.max(0, Math.min(1, current + (isCorrect ? 0.2 : -0.3)));
  state.memory[word] = next;

  return res.json({
    success: true,
    data: {
      userId,
      isCorrect,
      memoryStrength: next,
      message: isCorrect ? 'Đúng rồi. + memory strength' : 'Chưa đúng. - memory strength',
      progress: buildProgress(state),
    },
  });
});

router.post('/pronunciation/score', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const state = getUserState(userId);

  const targetWord = typeof req.body?.targetWord === 'string' ? req.body.targetWord.trim() : '';
  const recognizedText = typeof req.body?.recognizedText === 'string' ? req.body.recognizedText : '';

  if (!targetWord) {
    return res.status(400).json({
      success: false,
      message: 'targetWord là bắt buộc.',
    });
  }

  const scored = scorePronunciation(targetWord, recognizedText);
  const row: PronunciationHistoryItem = {
    at: new Date().toISOString(),
    word: targetWord,
    score: scored.score,
    recognized: scored.recognized,
    feedback: scored.feedback,
  };

  state.history = [row, ...state.history].slice(0, 100);

  return res.json({
    success: true,
    data: {
      userId,
      result: {
        target: normalizeText(targetWord),
        recognized: scored.recognized,
        score: scored.score,
        feedback: scored.feedback,
      },
      history: state.history.slice(0, 20),
      progress: buildProgress(state),
    },
  });
});

router.post('/pronunciation/transcribe-score', upload.single('audio'), async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const state = getUserState(userId);

  const targetWord = typeof req.body?.targetWord === 'string' ? req.body.targetWord.trim() : '';
  if (!targetWord) {
    return res.status(400).json({
      success: false,
      message: 'targetWord là bắt buộc.',
    });
  }

  if (!req.file || !req.file.buffer || req.file.buffer.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Thiếu file audio.',
    });
  }

  const bridge = await transcribeAudioBuffer({
    audioBuffer: req.file.buffer,
    mimeType: req.file.mimetype || 'audio/webm',
    model: typeof req.body?.model === 'string' ? req.body.model : undefined,
    language: typeof req.body?.language === 'string' ? req.body.language : 'en',
  });

  if (!bridge.ok) {
    return res.status(502).json({
      success: false,
      message: bridge.message || 'Không thể transcribe audio.',
      data: {
        mode: bridge.mode,
      },
    });
  }

  const scored = scorePronunciation(targetWord, bridge.text);
  const row: PronunciationHistoryItem = {
    at: new Date().toISOString(),
    word: targetWord,
    score: scored.score,
    recognized: scored.recognized,
    feedback: scored.feedback,
  };
  state.history = [row, ...state.history].slice(0, 100);

  return res.json({
    success: true,
    data: {
      userId,
      transcription: {
        text: bridge.text,
        mode: bridge.mode,
      },
      result: {
        target: normalizeText(targetWord),
        recognized: scored.recognized,
        score: scored.score,
        feedback: scored.feedback,
      },
      history: state.history.slice(0, 20),
      progress: buildProgress(state),
    },
  });
});

router.get('/history', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const state = getUserState(userId);
  const limitRaw = typeof req.query.limit === 'string' ? Number(req.query.limit) : 20;
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(100, Math.floor(limitRaw))) : 20;

  res.json({
    success: true,
    data: {
      userId,
      history: state.history.slice(0, limit),
    },
  });
});

router.get('/progress', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const state = getUserState(userId);

  res.json({
    success: true,
    data: {
      userId,
      progress: buildProgress(state),
      memory: state.memory,
    },
  });
});

export default router;
