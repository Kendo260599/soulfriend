// ============================================
// SoulFriend GameFi — Routes (Full 22 Systems)
// ============================================

import { Router } from 'express';
import { gamefiController } from '../controllers/gamefiController';
import { authenticateUser } from '../middleware/auth';
import { gamefiReadLimiter, gamefiWriteLimiter } from '../middleware/rateLimiter';

const router = Router();

// All GameFi routes require authentication
router.use(authenticateUser);

// ── Profile & Core ───────────────────────────
router.get('/profile/:userId', gamefiReadLimiter.middleware, gamefiController.getProfile);
router.post('/event', gamefiWriteLimiter.middleware, gamefiController.processEvent);
router.post('/quest/complete', gamefiWriteLimiter.middleware, gamefiController.completeQuest);
router.post('/detect', gamefiReadLimiter.middleware, gamefiController.detectEvent);
router.get('/supported-events', gamefiReadLimiter.middleware, gamefiController.getSupportedEvents);

// ── Full Game Data (single call) ─────────────
router.get('/full/:userId', gamefiReadLimiter.middleware, gamefiController.getFullData);

// ── Player Dashboard (aggregated) ────────────
router.get('/dashboard/:userId', gamefiReadLimiter.middleware, gamefiController.getDashboard);

// ── Skill Tree ───────────────────────────────
router.get('/skills/:userId', gamefiReadLimiter.middleware, gamefiController.getSkillTree);

// ── World Map ────────────────────────────────
router.get('/world/:userId', gamefiReadLimiter.middleware, gamefiController.getWorldMap);
router.post('/world/travel', gamefiWriteLimiter.middleware, gamefiController.travel);

// ── Quest Database (200 quests) ──────────────
router.get('/quests/:userId', gamefiReadLimiter.middleware, gamefiController.getQuestDatabase);
router.post('/quests/complete', gamefiWriteLimiter.middleware, gamefiController.completeFullQuest);

// ── Adaptive Quest AI ────────────────────────
router.get('/adaptive/:userId', gamefiReadLimiter.middleware, gamefiController.getAdaptiveQuests);

// ── Quest History ────────────────────────────
router.get('/history/:userId', gamefiReadLimiter.middleware, gamefiController.getHistory);

// ── Psychological State ──────────────────────
router.get('/state/:userId', gamefiReadLimiter.middleware, gamefiController.getState);

// ── Behavior Loops ───────────────────────────
router.get('/behavior/:userId', gamefiReadLimiter.middleware, gamefiController.getBehavior);
router.post('/behavior/daily', gamefiWriteLimiter.middleware, gamefiController.completeDailyStep);
router.post('/behavior/weekly', gamefiWriteLimiter.middleware, gamefiController.completeWeeklyChallenge);

// ── Lore & Mythology ─────────────────────────
router.get('/lore', gamefiReadLimiter.middleware, gamefiController.getLore);

export default router;
