// ============================================
// SoulFriend GameFi — Routes (Full 22 Systems)
// ============================================

import { Router } from 'express';
import { gamefiController } from '../controllers/gamefiController';

const router = Router();

// ── Profile & Core ───────────────────────────
router.get('/profile/:userId', gamefiController.getProfile);
router.post('/event', gamefiController.processEvent);
router.post('/quest/complete', gamefiController.completeQuest);
router.post('/detect', gamefiController.detectEvent);
router.get('/supported-events', gamefiController.getSupportedEvents);

// ── Full Game Data (single call) ─────────────
router.get('/full/:userId', gamefiController.getFullData);

// ── Skill Tree ───────────────────────────────
router.get('/skills/:userId', gamefiController.getSkillTree);

// ── World Map ────────────────────────────────
router.get('/world/:userId', gamefiController.getWorldMap);
router.post('/world/travel', gamefiController.travel);

// ── Quest Database (200 quests) ──────────────
router.get('/quests/:userId', gamefiController.getQuestDatabase);
router.post('/quests/complete', gamefiController.completeFullQuest);

// ── Adaptive Quest AI ────────────────────────
router.get('/adaptive/:userId', gamefiController.getAdaptiveQuests);

// ── Psychological State ──────────────────────
router.get('/state/:userId', gamefiController.getState);

// ── Behavior Loops ───────────────────────────
router.get('/behavior/:userId', gamefiController.getBehavior);
router.post('/behavior/daily', gamefiController.completeDailyStep);
router.post('/behavior/weekly', gamefiController.completeWeeklyChallenge);

// ── Lore & Mythology ─────────────────────────
router.get('/lore', gamefiController.getLore);

export default router;
