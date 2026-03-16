import express from 'express';
import request from 'supertest';
import englishLabRoutes from '../../src/routes/englishLab';
import {
  getCanonicalHistory,
  getCanonicalPhase2Home,
  getCanonicalPhase2Status,
  getCanonicalProgress,
  getCanonicalQuizNext,
  submitCanonicalQuizAnswer,
} from '../../src/services/lexicalCanonicalBridgeService';

jest.mock('../../src/services/lexicalCanonicalBridgeService', () => ({
  getCanonicalWords: jest.fn(),
  getCanonicalQuizNext: jest.fn(),
  submitCanonicalQuizAnswer: jest.fn(),
  scoreCanonicalPronunciation: jest.fn(),
  getCanonicalProgress: jest.fn(),
  getCanonicalHistory: jest.fn(),
  getCanonicalPhase2Status: jest.fn(),
  getCanonicalPhase2Home: jest.fn(),
}));

jest.mock('../../src/services/transcriptionBridgeService', () => ({
  transcribeAudioBuffer: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/api/v2/english-lab', englishLabRoutes);

describe('englishLab integration smoke routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should keep canonical flow stable across quiz, progress, history, and phase2 endpoints', async () => {
    (getCanonicalQuizNext as jest.Mock).mockResolvedValue({
      ok: true,
      data: {
        quiz: {
          item: { word: 'trust', meaningVi: 'tin tuong' },
          choices: ['tin tuong', 'bo qua'],
        },
        progress: { learned: 1, avgMemoryPercent: 52, attempts: 3, avgPronunciationScore: 71 },
        memoryStrength: 0.68,
      },
    });

    (submitCanonicalQuizAnswer as jest.Mock).mockResolvedValue({
      ok: true,
      data: {
        isCorrect: true,
        memoryStrength: 0.72,
        message: 'Đúng! + memoryStrength',
        progress: { learned: 2, avgMemoryPercent: 58, attempts: 3, avgPronunciationScore: 71 },
      },
    });

    (getCanonicalProgress as jest.Mock).mockResolvedValue({
      ok: true,
      data: {
        progress: { learned: 2, avgMemoryPercent: 58, attempts: 3, avgPronunciationScore: 71 },
        memory: { trust: { strength: 0.72 } },
      },
    });

    (getCanonicalHistory as jest.Mock).mockResolvedValue({
      ok: true,
      data: {
        history: [{ at: '2026-03-16T10:00:00Z', word: 'trust', score: 80, recognized: 'trust', feedback: 'ok' }],
      },
    });

    (getCanonicalPhase2Status as jest.Mock).mockResolvedValue({
      ok: true,
      data: {
        phase2Flow: {
          stage: 'phrase',
          phraseUnlocked: true,
          grammarUnlocked: false,
          thresholds: { phraseUnlockMin: 0.45, grammarUnlockMin: 0.5 },
          signals: { lexicalLevel: 0.57, grammarReadinessProxy: 0.41, unlockedSkills: 2 },
        },
        appliedLimits: { phraseLimitPerWord: 2, grammarLimit: 5 },
      },
    });

    (getCanonicalPhase2Home as jest.Mock).mockResolvedValue({
      ok: true,
      data: {
        phase2Home: {
          home: { lesson: { lessonWords: ['trust'] }, skills: [], summary: { unlockedSkills: 2 } },
          phrasePack: {
            items: [{ sourceWord: 'trust', phrase: 'build trust' }],
            summary: { requestedWords: 1, coveredWords: 1, seededItems: 1, fallbackItems: 0 },
          },
          grammarPack: {
            unlockLevels: ['all', 'core'],
            items: [],
            summary: { count: 0, seededItems: 0 },
          },
          adaptiveProfile: {
            current: { lexicalLevel: 0.57 },
            previous: null,
            delta: { lexicalLevel: 0.05 },
            meta: {},
          },
        },
      },
    });

    const userId = 'integration-user';

    const quizRes = await request(app).get(`/api/v2/english-lab/quiz/next?userId=${userId}`).expect(200);
    expect(quizRes.body.success).toBe(true);
    expect(quizRes.body.data.userId).toBe(userId);
    expect(quizRes.body.data.item).toEqual({ word: 'trust', meaningVi: 'tin tuong' });

    const answerRes = await request(app)
      .post('/api/v2/english-lab/quiz/answer')
      .send({ userId, word: 'trust', selectedMeaning: 'tin tuong' })
      .expect(200);
    expect(answerRes.body.success).toBe(true);
    expect(answerRes.body.data.userId).toBe(userId);
    expect(answerRes.body.data.isCorrect).toBe(true);

    const progressRes = await request(app).get(`/api/v2/english-lab/progress?userId=${userId}`).expect(200);
    expect(progressRes.body.success).toBe(true);
    expect(progressRes.body.data.userId).toBe(userId);
    expect(progressRes.body.data.progress).toEqual(
      expect.objectContaining({ learned: 2, avgMemoryPercent: 58, attempts: 3, avgPronunciationScore: 71 })
    );

    const historyRes = await request(app).get(`/api/v2/english-lab/history?userId=${userId}&limit=5`).expect(200);
    expect(historyRes.body.success).toBe(true);
    expect(historyRes.body.data.userId).toBe(userId);
    expect(historyRes.body.data.history).toHaveLength(1);

    const phase2StatusRes = await request(app)
      .get(`/api/v2/english-lab/phase2/status?userId=${userId}&lessonSize=10&phraseLimitPerWord=2&grammarLimit=5`)
      .expect(200);
    expect(phase2StatusRes.body.success).toBe(true);
    expect(phase2StatusRes.body.data.userId).toBe(userId);
    expect(phase2StatusRes.body.data.phase2Flow).toEqual(
      expect.objectContaining({ stage: 'phrase', phraseUnlocked: true, grammarUnlocked: false })
    );

    const phase2HomeRes = await request(app)
      .get(`/api/v2/english-lab/phase2/home?userId=${userId}&lessonSize=10&phraseLimitPerWord=2&grammarLimit=5`)
      .expect(200);
    expect(phase2HomeRes.body.success).toBe(true);
    expect(phase2HomeRes.body.data.userId).toBe(userId);
    expect(phase2HomeRes.body.data.phase2Home.phrasePack.items).toHaveLength(1);
  });
});
