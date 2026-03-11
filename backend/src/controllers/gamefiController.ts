// ============================================
// SoulFriend GameFi — Controller (Full 22 Systems)
// ============================================

import { NextFunction, Request, Response } from 'express';
import {
  getGameProfile,
  processEvent,
  completeQuest,
  getSupportedEvents,
  detectEvent,
  detectEventWithScores,
  getSkillTree,
  getWorldMap,
  travel,
  getQuestDatabase,
  completeFullQuest,
  getAdaptiveQuests,
  getStateData,
  getBehaviorData,
  completeDailyRitualStep,
  completeWeekly,
  getLoreData,
  getFullGameData,
  getPlayerDashboard,
  getQuestHistory,
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

      const profile = await getGameProfile(userId);
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

      const result = await processEvent({
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

      const result = await completeQuest(userId, questId);
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

  /**
   * GET /api/v2/gamefi/skills/:userId
   * Get skill tree data
   */
  getSkillTree = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      if (!userId || typeof userId !== 'string' || userId.length > 100) {
        res.status(400).json({ error: 'Invalid userId' });
        return;
      }
      const data = await getSkillTree(userId);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('GameFi getSkillTree error:', error);
      next(error);
    }
  };

  /**
   * GET /api/v2/gamefi/world/:userId
   * Get world map data
   */
  getWorldMap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      if (!userId || typeof userId !== 'string' || userId.length > 100) {
        res.status(400).json({ error: 'Invalid userId' });
        return;
      }
      const data = await getWorldMap(userId);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('GameFi getWorldMap error:', error);
      next(error);
    }
  };

  /**
   * POST /api/v2/gamefi/world/travel
   * Travel to a location
   * Body: { userId, locationId }
   */
  travel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, locationId } = req.body;
      if (!userId || typeof userId !== 'string' || userId.length > 100) {
        res.status(400).json({ error: 'Invalid userId' });
        return;
      }
      if (!locationId || typeof locationId !== 'string' || locationId.length > 100) {
        res.status(400).json({ error: 'Invalid locationId' });
        return;
      }
      const result = await travel(userId, locationId);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('GameFi travel error:', error);
      next(error);
    }
  };

  /**
   * GET /api/v2/gamefi/quests/:userId
   * Get full quest database (200 quests)
   * Query: ?category=reflection
   */
  getQuestDatabase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      if (!userId || typeof userId !== 'string' || userId.length > 100) {
        res.status(400).json({ error: 'Invalid userId' });
        return;
      }
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      const data = await getQuestDatabase(userId, category);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('GameFi getQuestDatabase error:', error);
      next(error);
    }
  };

  /**
   * POST /api/v2/gamefi/quests/complete
   * Complete a quest from the full database
   * Body: { userId, questId }
   */
  completeFullQuest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      const result = await completeFullQuest(userId, questId);
      if (!result) {
        res.json({ success: true, data: null, message: 'Quest already completed' });
        return;
      }
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('GameFi completeFullQuest error:', error);
      next(error);
    }
  };

  /**
   * GET /api/v2/gamefi/adaptive/:userId
   * Get adaptive quest recommendations
   */
  getAdaptiveQuests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      if (!userId || typeof userId !== 'string' || userId.length > 100) {
        res.status(400).json({ error: 'Invalid userId' });
        return;
      }
      const data = await getAdaptiveQuests(userId);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('GameFi getAdaptiveQuests error:', error);
      next(error);
    }
  };

  /**
   * GET /api/v2/gamefi/state/:userId
   * Get psychological state & trajectory
   */
  getState = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      if (!userId || typeof userId !== 'string' || userId.length > 100) {
        res.status(400).json({ error: 'Invalid userId' });
        return;
      }
      const data = await getStateData(userId);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('GameFi getState error:', error);
      next(error);
    }
  };

  /**
   * GET /api/v2/gamefi/behavior/:userId
   * Get behavior loop data (daily/weekly/seasonal)
   */
  getBehavior = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      if (!userId || typeof userId !== 'string' || userId.length > 100) {
        res.status(400).json({ error: 'Invalid userId' });
        return;
      }
      const data = await getBehaviorData(userId);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('GameFi getBehavior error:', error);
      next(error);
    }
  };

  /**
   * POST /api/v2/gamefi/behavior/daily
   * Complete a daily ritual step
   * Body: { userId, step: 'checkin' | 'reflection' | 'community' }
   */
  completeDailyStep = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, step } = req.body;
      if (!userId || typeof userId !== 'string' || userId.length > 100) {
        res.status(400).json({ error: 'Invalid userId' });
        return;
      }
      if (!['checkin', 'reflection', 'community'].includes(step)) {
        res.status(400).json({ error: 'Invalid step. Must be: checkin, reflection, community' });
        return;
      }
      const ritual = await completeDailyRitualStep(userId, step);
      res.json({ success: true, data: ritual });
    } catch (error) {
      logger.error('GameFi completeDailyStep error:', error);
      next(error);
    }
  };

  /**
   * POST /api/v2/gamefi/behavior/weekly
   * Complete a weekly challenge
   * Body: { userId, challengeId }
   */
  completeWeeklyChallenge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, challengeId } = req.body;
      if (!userId || typeof userId !== 'string' || userId.length > 100) {
        res.status(400).json({ error: 'Invalid userId' });
        return;
      }
      if (!challengeId || typeof challengeId !== 'string') {
        res.status(400).json({ error: 'Invalid challengeId' });
        return;
      }
      const result = await completeWeekly(userId, challengeId);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('GameFi completeWeeklyChallenge error:', error);
      next(error);
    }
  };

  /**
   * GET /api/v2/gamefi/lore
   * Get all lore data
   */
  getLore = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = getLoreData();
      res.json({ success: true, data });
    } catch (error) {
      logger.error('GameFi getLore error:', error);
      next(error);
    }
  };

  /**
   * GET /api/v2/gamefi/full/:userId
   * Get ALL game data in one call
   */
  getFullData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      if (!userId || typeof userId !== 'string' || userId.length > 100) {
        res.status(400).json({ error: 'Invalid userId' });
        return;
      }
      const data = await getFullGameData(userId);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('GameFi getFullData error:', error);
      next(error);
    }
  };

  /**
   * GET /api/v2/gamefi/dashboard/:userId
   * Get player profile dashboard (aggregated view)
   */
  getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      if (!userId || typeof userId !== 'string' || userId.length > 100) {
        res.status(400).json({ error: 'Invalid userId' });
        return;
      }
      const data = await getPlayerDashboard(userId);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('GameFi getDashboard error:', error);
      next(error);
    }
  };

  /**
   * GET /api/v2/gamefi/history/:userId
   * Get quest completion history
   */
  getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      if (!userId || typeof userId !== 'string' || userId.length > 100) {
        res.status(400).json({ error: 'Invalid userId' });
        return;
      }
      const data = await getQuestHistory(userId);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('GameFi getHistory error:', error);
      next(error);
    }
  };
}

export const gamefiController = new GamefiController();
