import express, { Request, Response } from 'express';
import multer from 'multer';
import {
  getCanonicalHistory,
  getCanonicalPhase2Home,
  getCanonicalPhase2Status,
  getCanonicalProgress,
  getCanonicalQuizNext,
  getCanonicalWords,
  scoreCanonicalPronunciation,
  submitCanonicalQuizAnswer,
} from '../services/lexicalCanonicalBridgeService';
import { transcribeAudioBuffer } from '../services/transcriptionBridgeService';
import { normalizeHistory, normalizeProgress } from './englishLabPayload';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

type WordItem = {
  word: string;
  meaningVi: string;
};

function getUserId(req: Request): string {
  const bodyValue = typeof req.body?.userId === 'string' ? req.body.userId.trim() : '';
  const queryValue = typeof req.query.userId === 'string' ? req.query.userId.trim() : '';
  const headerValue = typeof req.headers['x-user-id'] === 'string' ? req.headers['x-user-id'].trim() : '';
  return bodyValue || queryValue || headerValue || 'anonymous';
}

router.get('/words', async (_req: Request, res: Response) => {
  const bridge = await getCanonicalWords();
  if (!bridge.ok) {
    return res.status(502).json({
      success: false,
      message: bridge.message || 'Không thể lấy danh sách từ từ canonical Python.',
      data: { mode: bridge.mode || 'error' },
    });
  }

  const words = Array.isArray(bridge.data?.words) ? bridge.data.words as WordItem[] : [];
  res.json({
    success: true,
    data: words,
  });
});

router.get('/quiz/next', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const mode = req.query.mode === 'review' ? 'review' : 'learn';
  const bridge = await getCanonicalQuizNext(mode);

  if (!bridge.ok) {
    return res.status(502).json({
      success: false,
      message: bridge.message || 'Không thể lấy quiz canonical từ Python.',
      data: { mode: bridge.mode || 'error' },
    });
  }

  const quiz = bridge.data?.quiz;
  if (!quiz?.item || !Array.isArray(quiz?.choices)) {
    return res.json({
      success: true,
      data: {
        userId,
        item: null,
        choices: [],
        memoryStrength: 0,
        progress: normalizeProgress(bridge.data?.progress),
      },
    });
  }

  res.json({
    success: true,
    data: {
      userId,
      item: {
        word: String(quiz.item.word),
        meaningVi: String(quiz.item.meaningVi),
      },
      choices: quiz.choices,
      memoryStrength: Number(bridge.data?.memoryStrength || 0),
      progress: normalizeProgress(bridge.data?.progress),
    },
  });
});

router.post('/quiz/answer', async (req: Request, res: Response) => {
  const userId = getUserId(req);

  const word = typeof req.body?.word === 'string' ? req.body.word.trim() : '';
  const selectedMeaning = typeof req.body?.selectedMeaning === 'string' ? req.body.selectedMeaning.trim() : '';

  if (!word || !selectedMeaning) {
    return res.status(400).json({
      success: false,
      message: 'word và selectedMeaning là bắt buộc.',
    });
  }

  const bridge = await submitCanonicalQuizAnswer({
    word,
    selectedMeaning,
  });

  if (!bridge.ok) {
    return res.status(502).json({
      success: false,
      message: bridge.message || 'Không thể chấm quiz theo canonical Python.',
      data: { mode: bridge.mode || 'error' },
    });
  }

  return res.json({
    success: true,
    data: {
      userId,
      isCorrect: Boolean(bridge.data?.isCorrect),
      memoryStrength: Number(bridge.data?.memoryStrength || 0),
      message: String(bridge.data?.message || ''),
      progress: normalizeProgress(bridge.data?.progress),
    },
  });
});

router.post('/pronunciation/score', async (req: Request, res: Response) => {
  const userId = getUserId(req);

  const targetWord = typeof req.body?.targetWord === 'string' ? req.body.targetWord.trim() : '';
  const recognizedText = typeof req.body?.recognizedText === 'string' ? req.body.recognizedText : '';

  if (!targetWord) {
    return res.status(400).json({
      success: false,
      message: 'targetWord là bắt buộc.',
    });
  }

  const bridge = await scoreCanonicalPronunciation({
    targetWord,
    recognizedText,
    transcriptionModel: 'manual',
  });

  if (!bridge.ok) {
    return res.status(502).json({
      success: false,
      message: bridge.message || 'Không thể chấm pronunciation theo canonical Python.',
      data: { mode: bridge.mode || 'error' },
    });
  }

  return res.json({
    success: true,
    data: {
      userId,
      result: bridge.data?.result,
      history: normalizeHistory(bridge.data?.history),
      progress: normalizeProgress(bridge.data?.progress),
    },
  });
});

router.post('/pronunciation/transcribe-score', upload.single('audio'), async (req: Request, res: Response) => {
  const userId = getUserId(req);

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

  const scored = await scoreCanonicalPronunciation({
    targetWord,
    recognizedText: bridge.text,
    transcriptionModel: `whisper:${typeof req.body?.model === 'string' ? req.body.model : 'base'}`,
  });

  if (!scored.ok) {
    return res.status(502).json({
      success: false,
      message: scored.message || 'Không thể chấm điểm canonical sau khi transcribe.',
      data: { mode: scored.mode || 'error' },
    });
  }

  return res.json({
    success: true,
    data: {
      userId,
      transcription: {
        text: bridge.text,
        mode: bridge.mode,
      },
      result: scored.data?.result,
      history: normalizeHistory(scored.data?.history),
      progress: normalizeProgress(scored.data?.progress),
    },
  });
});

router.get('/history', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const limitRaw = typeof req.query.limit === 'string' ? Number(req.query.limit) : 20;
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(100, Math.floor(limitRaw))) : 20;

  const bridge = await getCanonicalHistory(limit);
  if (!bridge.ok) {
    return res.status(502).json({
      success: false,
      message: bridge.message || 'Không thể lấy history canonical từ Python.',
      data: { mode: bridge.mode || 'error' },
    });
  }

  res.json({
    success: true,
    data: {
      userId,
      history: normalizeHistory(bridge.data?.history),
    },
  });
});

router.get('/progress', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const bridge = await getCanonicalProgress();

  if (!bridge.ok) {
    return res.status(502).json({
      success: false,
      message: bridge.message || 'Không thể lấy progress canonical từ Python.',
      data: { mode: bridge.mode || 'error' },
    });
  }

  res.json({
    success: true,
    data: {
      userId,
      progress: normalizeProgress(bridge.data?.progress),
      memory: bridge.data?.memory || {},
    },
  });
});

router.get('/phase2/status', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const lessonSizeRaw = typeof req.query.lessonSize === 'string' ? Number(req.query.lessonSize) : 10;
  const phraseLimitRaw = typeof req.query.phraseLimitPerWord === 'string' ? Number(req.query.phraseLimitPerWord) : 2;
  const grammarLimitRaw = typeof req.query.grammarLimit === 'string' ? Number(req.query.grammarLimit) : 5;

  const lessonSize = Number.isFinite(lessonSizeRaw) ? Math.max(5, Math.min(15, Math.floor(lessonSizeRaw))) : 10;
  const phraseLimitPerWord = Number.isFinite(phraseLimitRaw) ? Math.max(1, Math.min(3, Math.floor(phraseLimitRaw))) : 2;
  const grammarLimit = Number.isFinite(grammarLimitRaw) ? Math.max(1, Math.min(8, Math.floor(grammarLimitRaw))) : 5;

  const bridge = await getCanonicalPhase2Status({
    lessonSize,
    phraseLimitPerWord,
    grammarLimit,
  });

  if (!bridge.ok) {
    return res.status(502).json({
      success: false,
      message: bridge.message || 'Không thể lấy phase2 status canonical từ Python.',
      data: { mode: bridge.mode || 'error' },
    });
  }

  const phase2Flow = bridge.data?.phase2Flow || {
    stage: 'foundation',
    phraseUnlocked: false,
    grammarUnlocked: false,
    thresholds: { phraseUnlockMin: 0.45, grammarUnlockMin: 0.5 },
    signals: { lexicalLevel: 0, grammarReadinessProxy: 0, unlockedSkills: 0 },
  };

  res.json({
    success: true,
    data: {
      userId,
      phase2Flow,
      appliedLimits: bridge.data?.appliedLimits || {
        phraseLimitPerWord,
        grammarLimit,
      },
      homeSummary: bridge.data?.homeSummary || {},
      telemetry: {
        source: 'canonical-python',
        endpoint: 'phase2-status',
        fetchedAt: new Date().toISOString(),
        requested: {
          lessonSize,
          phraseLimitPerWord,
          grammarLimit,
        },
      },
    },
  });
});

router.get('/phase2/home', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const lessonSizeRaw = typeof req.query.lessonSize === 'string' ? Number(req.query.lessonSize) : 10;
  const phraseLimitRaw = typeof req.query.phraseLimitPerWord === 'string' ? Number(req.query.phraseLimitPerWord) : 2;
  const grammarLimitRaw = typeof req.query.grammarLimit === 'string' ? Number(req.query.grammarLimit) : 5;

  const lessonSize = Number.isFinite(lessonSizeRaw) ? Math.max(5, Math.min(15, Math.floor(lessonSizeRaw))) : 10;
  const phraseLimitPerWord = Number.isFinite(phraseLimitRaw) ? Math.max(1, Math.min(3, Math.floor(phraseLimitRaw))) : 2;
  const grammarLimit = Number.isFinite(grammarLimitRaw) ? Math.max(1, Math.min(8, Math.floor(grammarLimitRaw))) : 5;

  const bridge = await getCanonicalPhase2Home({
    lessonSize,
    phraseLimitPerWord,
    grammarLimit,
  });

  if (!bridge.ok) {
    return res.status(502).json({
      success: false,
      message: bridge.message || 'Không thể lấy phase2 home canonical từ Python.',
      data: { mode: bridge.mode || 'error' },
    });
  }

  const fallbackPhase2Home = {
    home: {
      lesson: {},
      skills: [],
      summary: {},
    },
    phrasePack: {
      items: [],
      summary: {
        requestedWords: 0,
        coveredWords: 0,
        seededItems: 0,
        fallbackItems: 0,
      },
    },
    grammarPack: {
      unlockLevels: ['all', 'core'],
      items: [],
      summary: {
        count: 0,
        seededItems: 0,
      },
    },
    adaptiveProfile: {
      current: {},
      previous: null,
      delta: {},
      meta: {},
    },
  };

  res.json({
    success: true,
    data: {
      userId,
      phase2Home: bridge.data?.phase2Home || fallbackPhase2Home,
      telemetry: {
        source: 'canonical-python',
        endpoint: 'phase2-home',
        fetchedAt: new Date().toISOString(),
        requested: {
          lessonSize,
          phraseLimitPerWord,
          grammarLimit,
        },
      },
    },
  });
});

export default router;
