import express from 'express';
import request from 'supertest';
import englishLabRoutes from '../../src/routes/englishLab';
import {
  getCanonicalPhase2Home,
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

describe('englishLab phase2 home route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return canonical phase2 home aggregate payload', async () => {
    (getCanonicalPhase2Home as jest.Mock).mockResolvedValue({
      ok: true,
      data: {
        phase2Home: {
          home: {
            lesson: { lessonWords: ['trust'] },
            skills: [],
            summary: { unlockedSkills: 1 },
          },
          phrasePack: {
            items: [{ sourceWord: 'trust', phrase: 'build trust' }],
            summary: { requestedWords: 1, coveredWords: 1, seededItems: 1, fallbackItems: 0 },
          },
          grammarPack: {
            unlockLevels: ['all', 'core'],
            items: [{ pattern: 'I can + V' }],
            summary: { count: 1, seededItems: 1 },
          },
          adaptiveProfile: {
            current: { lexicalLevel: 0.6 },
            previous: null,
            delta: { lexicalLevel: 0.1 },
            meta: {},
          },
        },
      },
    });

    const response = await request(app)
      .get('/api/v2/english-lab/phase2/home?userId=u_home')
      .expect(200);

    expect(getCanonicalPhase2Home).toHaveBeenCalledWith({
      lessonSize: 10,
      phraseLimitPerWord: 2,
      grammarLimit: 5,
    });

    expect(response.body.success).toBe(true);
    expect(response.body.data.userId).toBe('u_home');
    expect(response.body.data.phase2Home).toEqual(
      expect.objectContaining({
        home: expect.any(Object),
        phrasePack: expect.any(Object),
        grammarPack: expect.any(Object),
        adaptiveProfile: expect.any(Object),
      })
    );
    expect(response.body.data.telemetry).toEqual(
      expect.objectContaining({
        source: 'canonical-python',
        endpoint: 'phase2-home',
        requested: {
          lessonSize: 10,
          phraseLimitPerWord: 2,
          grammarLimit: 5,
        },
      })
    );
  });

  it('should clamp query params before calling canonical phase2 home bridge', async () => {
    (getCanonicalPhase2Home as jest.Mock).mockResolvedValue({
      ok: true,
      data: { phase2Home: {} },
    });

    await request(app)
      .get('/api/v2/english-lab/phase2/home?lessonSize=999&phraseLimitPerWord=999&grammarLimit=999')
      .expect(200);

    expect(getCanonicalPhase2Home).toHaveBeenCalledWith({
      lessonSize: 15,
      phraseLimitPerWord: 3,
      grammarLimit: 8,
    });
  });

  it('should return stable fallback phase2 home when bridge payload is missing', async () => {
    (getCanonicalPhase2Home as jest.Mock).mockResolvedValue({
      ok: true,
      data: {},
    });

    const response = await request(app)
      .get('/api/v2/english-lab/phase2/home?userId=u_home_default')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.userId).toBe('u_home_default');
    expect(response.body.data.phase2Home).toEqual(
      expect.objectContaining({
        home: expect.objectContaining({
          lesson: {},
          skills: [],
          summary: {},
        }),
        phrasePack: expect.objectContaining({
          items: [],
          summary: expect.objectContaining({
            requestedWords: 0,
            coveredWords: 0,
            seededItems: 0,
            fallbackItems: 0,
          }),
        }),
        grammarPack: expect.objectContaining({
          unlockLevels: ['all', 'core'],
          items: [],
          summary: expect.objectContaining({
            count: 0,
            seededItems: 0,
          }),
        }),
        adaptiveProfile: expect.objectContaining({
          current: {},
          previous: null,
          delta: {},
          meta: {},
        }),
      })
    );
  });

  it('should return 502 when canonical phase2 home bridge fails', async () => {
    (getCanonicalPhase2Home as jest.Mock).mockResolvedValue({
      ok: false,
      mode: 'error',
      message: 'phase2-home failed',
    });

    const response = await request(app)
      .get('/api/v2/english-lab/phase2/home?userId=u_home_fail')
      .expect(502);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('phase2-home failed');
    expect(response.body.data.mode).toBe('error');
  });
});
