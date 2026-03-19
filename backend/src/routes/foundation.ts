import { Router, Request, Response } from 'express';
import {
  getFoundationCurriculum,
  getFoundationLesson,
  getFoundationProgress,
  getFoundationReview,
  getFoundationTrackLesson,
  submitFoundationGrammarCheck,
  submitFoundationReview,
  submitFoundationVocabCheck,
} from '../services/foundationBridgeService';
import {
  getGamificationData,
  updateStreak,
  addXP,
  progressDailyChallenge,
  checkAndUnlockAchievements,
  claimDailyChallengeReward,
} from '../services/foundationGamificationService';

const router = Router();

router.get('/lesson', async (req: Request, res: Response) => {
  try {
    const learnerId = Number(req.query.learnerId || 1);
    const trackRaw = String(req.query.track || '').trim().toLowerCase();
    const lessonId = String(req.query.lessonId || '').trim();
    const finalLearnerId = Number.isFinite(learnerId) ? learnerId : 1;

    if (trackRaw && trackRaw !== 'grammar' && trackRaw !== 'vocab') {
      res.status(400).json({
        message: "Track must be 'grammar' or 'vocab'.",
      });
      return;
    }

    const data = trackRaw && lessonId
      ? await getFoundationTrackLesson(trackRaw, lessonId, finalLearnerId)
      : await getFoundationLesson(finalLearnerId);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({
      message: error?.message || 'Failed to load foundation lesson',
    });
  }
});

router.get('/curriculum', async (_req: Request, res: Response) => {
  try {
    const data = await getFoundationCurriculum();
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({
      message: error?.message || 'Failed to load foundation curriculum',
    });
  }
});

router.get('/progress', async (req: Request, res: Response) => {
  try {
    const learnerId = Number(req.query.learnerId || 1);
    const data = await getFoundationProgress(Number.isFinite(learnerId) ? learnerId : 1);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({
      message: error?.message || 'Failed to load foundation progress',
    });
  }
});

router.post('/vocab-check', async (req: Request, res: Response) => {
  try {
    const learnerIdRaw = Number(req.body?.learnerId || 1);
    const lessonId = String(req.body?.lessonId || '').trim();
    const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
    const learnerId = Number.isFinite(learnerIdRaw) ? learnerIdRaw : 1;

    if (!lessonId) {
      res.status(400).json({
        message: 'lessonId is required.',
      });
      return;
    }

    if (!answers.length) {
      res.status(400).json({
        message: 'answers must be a non-empty array.',
      });
      return;
    }

    const normalizedAnswers: Array<{ wordId: number; correct: boolean }> = answers.map((item: any) => ({
      wordId: Number(item?.wordId),
      correct: Boolean(item?.correct),
    }));

    if (normalizedAnswers.some((item: { wordId: number; correct: boolean }) => !Number.isFinite(item.wordId) || item.wordId <= 0)) {
      res.status(400).json({
        message: 'Each answer must include a valid wordId.',
      });
      return;
    }

    const data = await submitFoundationVocabCheck(learnerId, lessonId, normalizedAnswers);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({
      message: error?.message || 'Failed to submit vocab check',
    });
  }
});

router.post('/grammar-check', async (req: Request, res: Response) => {
  try {
    const learnerIdRaw = Number(req.body?.learnerId || 1);
    const lessonId = String(req.body?.lessonId || '').trim();
    const grammarIdRaw = Number(req.body?.grammarId);
    const learnerId = Number.isFinite(learnerIdRaw) ? learnerIdRaw : 1;

    if (!lessonId) {
      res.status(400).json({
        message: 'lessonId is required.',
      });
      return;
    }

    if (!Number.isFinite(grammarIdRaw) || grammarIdRaw <= 0) {
      res.status(400).json({
        message: 'grammarId must be a positive number.',
      });
      return;
    }

    if (typeof req.body?.correct !== 'boolean') {
      res.status(400).json({
        message: 'correct must be a boolean.',
      });
      return;
    }

    const data = await submitFoundationGrammarCheck(learnerId, lessonId, grammarIdRaw, req.body.correct);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({
      message: error?.message || 'Failed to submit grammar check',
    });
  }
});

router.get('/review', async (req: Request, res: Response) => {
  try {
    const learnerId = Number(req.query.learnerId || 1);
    const limit = Number(req.query.limit || 20);
    const finalLearnerId = Number.isFinite(learnerId) ? learnerId : 1;
    const finalLimit = Number.isFinite(limit) ? limit : 20;

    const data = await getFoundationReview(finalLearnerId, finalLimit);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({
      message: error?.message || 'Failed to load foundation review queue',
    });
  }
});

router.post('/review-submit', async (req: Request, res: Response) => {
  try {
    const learnerIdRaw = Number(req.body?.learnerId || 1);
    const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
    const learnerId = Number.isFinite(learnerIdRaw) ? learnerIdRaw : 1;

    if (!answers.length) {
      res.status(400).json({
        message: 'answers must be a non-empty array.',
      });
      return;
    }

    const normalizedAnswers: Array<{ wordId: number; correct: boolean }> = answers.map((item: any) => ({
      wordId: Number(item?.wordId),
      correct: Boolean(item?.correct),
    }));

    if (normalizedAnswers.some((item: { wordId: number; correct: boolean }) => !Number.isFinite(item.wordId) || item.wordId <= 0)) {
      res.status(400).json({
        message: 'Each answer must include a valid wordId.',
      });
      return;
    }

    const data = await submitFoundationReview(learnerId, normalizedAnswers);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({
      message: error?.message || 'Failed to submit foundation review',
    });
  }
});

// ── GAMIFICATION ENDPOINTS ─────────────────

/**
 * GET /api/foundation/gamification
 * Get user's complete gamification data (streaks, XP, achievements, challenges)
 */
router.get('/gamification', async (req: Request, res: Response) => {
  try {
    const userId = String(req.query.userId || req.authUser?.userId || '').trim();

    if (!userId) {
      res.status(400).json({
        message: 'userId is required',
      });
      return;
    }

    const gamificationData = await getGamificationData(userId);
    res.status(200).json({
      success: true,
      data: gamificationData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to load gamification data',
    });
  }
});

/**
 * GET /api/foundation/gamification/achievements
 * Get user's achievements
 */
router.get('/gamification/achievements', async (req: Request, res: Response) => {
  try {
    const userId = String(req.query.userId || req.authUser?.userId || '').trim();

    if (!userId) {
      res.status(400).json({
        message: 'userId is required',
      });
      return;
    }

    const gamificationData = await getGamificationData(userId);
    res.status(200).json({
      success: true,
      data: {
        achievements: gamificationData.achievements,
        unlockedCount: gamificationData.unlockedAchievementCount,
        totalCount: gamificationData.achievements.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to load achievements',
    });
  }
});

/**
 * GET /api/foundation/gamification/challenges
 * Get user's daily challenges
 */
router.get('/gamification/challenges', async (req: Request, res: Response) => {
  try {
    const userId = String(req.query.userId || req.authUser?.userId || '').trim();

    if (!userId) {
      res.status(400).json({
        message: 'userId is required',
      });
      return;
    }

    const gamificationData = await getGamificationData(userId);
    res.status(200).json({
      success: true,
      data: {
        challenges: gamificationData.dailyChallenges,
        completedCount: gamificationData.dailyChallenges.filter((c) => c.completed).length,
        totalRewardToday: gamificationData.dailyChallenges
          .filter((c) => c.completed)
          .reduce((sum, c) => sum + c.reward, 0),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to load challenges',
    });
  }
});

/**
 * POST /api/foundation/gamification/activity
 * Track user activity and update streak
 */
router.post('/gamification/activity', async (req: Request, res: Response) => {
  try {
    const userId = String(req.body?.userId || req.authUser?.userId || '').trim();
    const activityType = String(req.body?.activityType || '').trim(); // 'lesson_start', 'lesson_complete', etc.

    if (!userId) {
      res.status(400).json({
        message: 'userId is required',
      });
      return;
    }

    await updateStreak(userId, true);
    const gamificationData = await getGamificationData(userId);
    const achievements = await checkAndUnlockAchievements(userId);

    res.status(200).json({
      success: true,
      data: {
        streak: gamificationData.streak,
        level: gamificationData.currentLevel,
        xp: gamificationData.xp,
        newAchievements: achievements,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to track activity',
    });
  }
});

/**
 * POST /api/foundation/gamification/xp
 * Award XP to user
 */
router.post('/gamification/xp', async (req: Request, res: Response) => {
  try {
    const userId = String(req.body?.userId || req.authUser?.userId || '').trim();
    const xpAmount = Number(req.body?.xpAmount || 0);

    if (!userId) {
      res.status(400).json({
        message: 'userId is required',
      });
      return;
    }

    if (!Number.isFinite(xpAmount) || xpAmount <= 0) {
      res.status(400).json({
        message: 'xpAmount must be a positive number',
      });
      return;
    }

    const result = await addXP(userId, xpAmount);
    const gamificationData = await getGamificationData(userId);
    const achievements = await checkAndUnlockAchievements(userId);

    res.status(200).json({
      success: true,
      data: {
        xpAdded: xpAmount,
        currentXP: gamificationData.xp,
        totalXP: gamificationData.totalXP,
        currentLevel: result.currentLevel,
        leveledUp: result.newLevel,
        xpToNextLevel: gamificationData.xpToNextLevel,
        newAchievements: achievements,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to add XP',
    });
  }
});

/**
 * POST /api/foundation/gamification/challenge/progress
 * Progress on a daily challenge
 */
router.post('/gamification/challenge/progress', async (req: Request, res: Response) => {
  try {
    const userId = String(req.body?.userId || req.authUser?.userId || '').trim();
    const challengeId = String(req.body?.challengeId || '').trim();
    const progress = Number(req.body?.progress || 1);

    if (!userId || !challengeId) {
      res.status(400).json({
        message: 'userId and challengeId are required',
      });
      return;
    }

    const completed = await progressDailyChallenge(userId, challengeId, progress);
    const gamificationData = await getGamificationData(userId);

    res.status(200).json({
      success: true,
      data: {
        challengeId,
        completed,
        challenge: gamificationData.dailyChallenges.find((c) => c.id === challengeId),
        achievements: await checkAndUnlockAchievements(userId),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to progress challenge',
    });
  }
});

/**
 * POST /api/foundation/gamification/challenge/claim
 * Claim reward for completed challenge
 */
router.post('/gamification/challenge/claim', async (req: Request, res: Response) => {
  try {
    const userId = String(req.body?.userId || req.authUser?.userId || '').trim();
    const challengeId = String(req.body?.challengeId || '').trim();

    if (!userId || !challengeId) {
      res.status(400).json({
        message: 'userId and challengeId are required',
      });
      return;
    }

    const reward = await claimDailyChallengeReward(userId, challengeId);
    const gamificationData = await getGamificationData(userId);

    res.status(200).json({
      success: true,
      data: {
        rewarded: reward,
        challenge: gamificationData.dailyChallenges.find((c) => c.id === challengeId),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to claim reward',
    });
  }
});

export default router;
