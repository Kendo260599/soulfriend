import express from 'express';
import request from 'supertest';
import englishLabRoutes from '../../src/routes/englishLab';
import {
  getCanonicalPhase2Status,
} from '../../src/services/lexicalCanonicalBridgeService';

jest.mock('../../src/services/lexicalCanonicalBridgeService', () => ({
  getCanonicalWords: jest.fn(),
  getCanonicalQuizNext: jest.fn(),
  submitCanonicalQuizAnswer: jest.fn(),
  scoreCanonicalPronunciation: jest.fn(),
  getCanonicalProgress: jest.fn(),
  getCanonicalHistory: jest.fn(),
  getCanonicalPhase2Status: jest.fn(),
}));

jest.mock('../../src/services/transcriptionBridgeService', () => ({
  transcribeAudioBuffer: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/api/v2/english-lab', englishLabRoutes);

describe('englishLab phase2 status route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return canonical phase2 flow payload', async () => {
    (getCanonicalPhase2Status as jest.Mock).mockResolvedValue({
      ok: true,
      data: {
        phase2Flow: {
          stage: 'phrase',
          phraseUnlocked: true,
          grammarUnlocked: false,
          thresholds: {
            phraseUnlockMin: 0.45,
            grammarUnlockMin: 0.5,
          },
          signals: {
            lexicalLevel: 0.5,
            grammarReadinessProxy: 0.42,
            unlockedSkills: 2,
          },
        },
        appliedLimits: {
          phraseLimitPerWord: 2,
          grammarLimit: 5,
        },
        homeSummary: {
          totalSkills: 5,
          unlockedSkills: 2,
          masteredSkills: 1,
        },
      },
    });

    const response = await request(app)
      .get('/api/v2/english-lab/phase2/status?userId=u_phase2')
      .expect(200);

    expect(getCanonicalPhase2Status).toHaveBeenCalledWith({
      lessonSize: 10,
      phraseLimitPerWord: 2,
      grammarLimit: 5,
    });

    expect(response.body.success).toBe(true);
    expect(response.body.data.userId).toBe('u_phase2');
    expect(response.body.data.phase2Flow).toEqual(
      expect.objectContaining({
        stage: 'phrase',
        phraseUnlocked: true,
        grammarUnlocked: false,
      })
    );
    expect(response.body.data.appliedLimits).toEqual({
      phraseLimitPerWord: 2,
      grammarLimit: 5,
    });
    expect(response.body.data.telemetry).toEqual(
      expect.objectContaining({
        source: 'canonical-python',
        endpoint: 'phase2-status',
        requested: {
          lessonSize: 10,
          phraseLimitPerWord: 2,
          grammarLimit: 5,
        },
      })
    );
  });

  it('should clamp query params before calling canonical bridge', async () => {
    (getCanonicalPhase2Status as jest.Mock).mockResolvedValue({
      ok: true,
      data: {
        phase2Flow: {
          stage: 'foundation',
          phraseUnlocked: false,
          grammarUnlocked: false,
          thresholds: {
            phraseUnlockMin: 0.45,
            grammarUnlockMin: 0.5,
          },
          signals: {
            lexicalLevel: 0.1,
            grammarReadinessProxy: 0.1,
            unlockedSkills: 1,
          },
        },
      },
    });

    await request(app)
      .get('/api/v2/english-lab/phase2/status?lessonSize=999&phraseLimitPerWord=999&grammarLimit=999')
      .expect(200);

    expect(getCanonicalPhase2Status).toHaveBeenCalledWith({
      lessonSize: 15,
      phraseLimitPerWord: 3,
      grammarLimit: 8,
    });
  });

  it('should return 502 when canonical bridge fails', async () => {
    (getCanonicalPhase2Status as jest.Mock).mockResolvedValue({
      ok: false,
      mode: 'error',
      message: 'bridge failed',
    });

    const response = await request(app)
      .get('/api/v2/english-lab/phase2/status?userId=u_fail')
      .expect(502);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('bridge failed');
    expect(response.body.data.mode).toBe('error');
  });

  it('should return stable default phase2Flow when bridge payload is missing flow', async () => {
    (getCanonicalPhase2Status as jest.Mock).mockResolvedValue({
      ok: true,
      data: {
        appliedLimits: {
          phraseLimitPerWord: 1,
          grammarLimit: 2,
        },
      },
    });

    const response = await request(app)
      .get('/api/v2/english-lab/phase2/status?userId=u_default')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.userId).toBe('u_default');
    expect(response.body.data.phase2Flow).toEqual({
      stage: 'foundation',
      phraseUnlocked: false,
      grammarUnlocked: false,
      thresholds: {
        phraseUnlockMin: 0.45,
        grammarUnlockMin: 0.5,
      },
      signals: {
        lexicalLevel: 0,
        grammarReadinessProxy: 0,
        unlockedSkills: 0,
      },
    });
    expect(response.body.data.appliedLimits).toEqual({
      phraseLimitPerWord: 1,
      grammarLimit: 2,
    });
    expect(response.body.data.homeSummary).toEqual({});
  });
});
