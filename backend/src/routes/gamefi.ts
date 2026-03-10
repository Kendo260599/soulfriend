// ============================================
// SoulFriend GameFi — Routes
// ============================================

import { Router } from 'express';
import { gamefiController } from '../controllers/gamefiController';

const router = Router();

// GET /api/v2/gamefi/profile/:userId — Full game profile
router.get('/profile/:userId', gamefiController.getProfile);

// POST /api/v2/gamefi/event — Process a psychological event
router.post('/event', gamefiController.processEvent);

// POST /api/v2/gamefi/quest/complete — Complete a daily quest
router.post('/quest/complete', gamefiController.completeQuest);

// POST /api/v2/gamefi/detect — Detect event type from message (utility)
router.post('/detect', gamefiController.detectEvent);

// GET /api/v2/gamefi/supported-events — List supported event types
router.get('/supported-events', gamefiController.getSupportedEvents);

export default router;
