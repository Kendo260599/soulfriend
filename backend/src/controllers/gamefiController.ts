// ============================================
// SoulFriend GameFi — Controller
// ============================================

import { NextFunction, Request, Response } from 'express';
import {
  getGameProfile,
  processEvent,
  completeQuest,
  getSupportedEvents,
  detectEvent,
  detectEventWithScores,
} from '../services/gamefi';
import type { PsychEventType } from '../services/gamefi';
import { logger } from '../utils/logger';

export class GamefiController {
  /**
   * GET /api/v2/gamefi/profile/:userId
   * Get full game profile (character, quests, badges, level info)
   */
  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      if (!userId || typeof userId !== 'string' || userId.length > 100) {
        res.status(400).json({ error: 'Invalid userId' });
        return;
      }

      const profile = getGameProfile(userId);
      res.json({ success: true, data: profile });
    } catch (error) {
      logger.error('GameFi getProfile error:', error);
      next(error);
    }
  };

  /**
   * POST /api/v2/gamefi/event
   * Process a psychological event
   * Body: { userId, eventType, content }
   */
  processEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, eventType, content } = req.body;

      if (!userId || typeof userId !== 'string' || userId.length > 100) {
        res.status(400).json({ error: 'Invalid userId' });
        return;
      }

      if (!eventType || !getSupportedEvents().includes(eventType as PsychEventType)) {
        res.status(400).json({
          error: 'Invalid eventType',
          supported: getSupportedEvents(),
        });
        return;
      }

      if (!content || typeof content !== 'string' || content.length > 5000) {
        res.status(400).json({ error: 'Content is required (max 5000 chars)' });
        return;
      }

      const result = processEvent({
        userId,
        eventType: eventType as PsychEventType,
        content: content.normalize('NFC'),
      });

      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('GameFi processEvent error:', error);
      next(error);
    }
  };

  /**
   * POST /api/v2/gamefi/quest/complete
   * Complete a daily quest
   * Body: { userId, questId }
   */
  completeQuest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, questId } = req.body;

      if (!userId || typeof userId !== 'string' || userId.length > 100) {
        res.status(400).json({ error: 'Invalid userId' });
        return;
      }

      if (!questId || typeof questId !== 'string' || questId.length > 200) {
        res.status(400).json({ error: 'Invalid questId' });
        return;
      }

      const result = completeQuest(userId, questId);
      if (!result) {
        res.json({ success: true, data: null, message: 'Quest already completed' });
        return;
      }

      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('GameFi completeQuest error:', error);
      next(error);
    }
  };

  /**
   * POST /api/v2/gamefi/detect
   * Detect event type from a message (debug/utility endpoint)
   * Body: { message }
   */
  detectEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { message } = req.body;

      if (!message || typeof message !== 'string' || message.length > 5000) {
        res.status(400).json({ error: 'Message is required (max 5000 chars)' });
        return;
      }

      const result = detectEventWithScores(message);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('GameFi detectEvent error:', error);
      next(error);
    }
  };

  /**
   * GET /api/v2/gamefi/supported-events
   * List supported event types
   */
  getSupportedEvents = async (_req: Request, res: Response): Promise<void> => {
    res.json({ success: true, data: getSupportedEvents() });
  };
}

export const gamefiController = new GamefiController();
