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
  QuestValidationError,
} from '../services/gamefi';
import type { PsychEventType } from '../services/gamefi';
import { logger } from '../utils/logger';
import { sanitizeText } from '../utils/sanitize';

/**
 * Get authenticated userId from request.
 * For GET routes: userId from params must match the authenticated user.
 * For POST routes: userId from body must match the authenticated user.
 * Returns null and sends 403 if mismatch.
 */
function getAuthedUserId(req: Request, res: Response, source: 'params' | 'body'): string | null {
  const authedId = req.authUser?.userId;
  const requestedId = source === 'params' ? req.params.userId : req.body?.userId;

  if (!authedId) {
    res.status(401).json({ success: false, error: 'Chưa đăng nhập' });
    return null;
  }

  if (!requestedId || typeof requestedId !== 'string' || requestedId.length > 100) {
    res.status(400).json({ success: false, error: 'Invalid userId' });
    return null;
  }

  if (requestedId !== authedId) {
    res.status(403).json({ success: false, error: 'Không có quyền truy cập dữ liệu của người khác' });
    return null;
  }

  return authedId;
}

export class GamefiController {
  /**
   * GET /api/v2/gamefi/profile/:userId
   * Get full game profile (character, quests, badges, level info)
   */
  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getAuthedUserId(req, res, 'params');
      if (!userId) return;

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
      const userId = getAuthedUserId(req, res, 'body');
      if (!userId) return;

      const { eventType, content } = req.body;
      if (!eventType || !getSupportedEvents().includes(eventType as PsychEventType)) {
        res.status(400).json({
          success: false,
          error: 'Invalid eventType',
          supported: getSupportedEvents(),
        });
        return;
      }

      if (!content || typeof content !== 'string' || content.length > 5000) {
        res.status(400).json({ success: false, error: 'Content is required (max 5000 chars)' });
        return;
      }

      const result = await processEvent({
        userId,
        eventType: eventType as PsychEventType,
        content: sanitizeText(content),
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
   * Body: { userId, questId, journalText?, autoEvent? }
   */
  completeQuest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getAuthedUserId(req, res, 'body');
      if (!userId) return;

      const { questId, journalText, autoEvent } = req.body;

      if (!questId || typeof questId !== 'string' || questId.length > 200) {
        res.status(400).json({ success: false, error: 'Invalid questId' });
        return;
      }

      // Validate optional journalText
      const sanitizedText = journalText && typeof journalText === 'string'
        ? sanitizeText(journalText.slice(0, 2000))
        : undefined;

      const result = await completeQuest(userId, questId, {
        journalText: sanitizedText,
        autoEvent: autoEvent === true,
      });
      if (!result) {
        res.status(409).json({ success: false, error: 'Quest đã hoàn thành trước đó' });
        return;
      }

      res.json({ success: true, data: result });
    } catch (error) {
      if (error instanceof QuestValidationError) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
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
        res.status(400).json({ success: false, error: 'Message is required (max 5000 chars)' });
        return;
      }

      const result = detectEventWithScores(sanitizeText(message));
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
      const userId = getAuthedUserId(req, res, 'params');
      if (!userId) return;
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
      const userId = getAuthedUserId(req, res, 'params');
      if (!userId) return;
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
      const userId = getAuthedUserId(req, res, 'body');
      if (!userId) return;
      const { locationId } = req.body;
      if (!locationId || typeof locationId !== 'string' || locationId.length > 100) {
        res.status(400).json({ success: false, error: 'Invalid locationId' });
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
   * Get quest database with pagination
   * Query: ?category=reflection&page=1&limit=20
   */
  getQuestDatabase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getAuthedUserId(req, res, 'params');
      if (!userId) return;
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      const page = typeof req.query.page === 'string' ? parseInt(req.query.page, 10) || 1 : 1;
      const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) || 20 : 20;
      const data = await getQuestDatabase(userId, category, page, limit);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('GameFi getQuestDatabase error:', error);
      next(error);
    }
  };

  /**
   * POST /api/v2/gamefi/quests/complete
   * Complete a quest from the full database
   * Body: { userId, questId, journalText?, autoEvent? }
   */
  completeFullQuest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getAuthedUserId(req, res, 'body');
      if (!userId) return;
      const { questId, journalText, autoEvent } = req.body;
      if (!questId || typeof questId !== 'string' || questId.length > 200) {
        res.status(400).json({ success: false, error: 'Invalid questId' });
        return;
      }

      // Validate optional journalText
      const sanitizedText = journalText && typeof journalText === 'string'
        ? sanitizeText(journalText.slice(0, 2000))
        : undefined;

      const result = await completeFullQuest(userId, questId, {
        journalText: sanitizedText,
        autoEvent: autoEvent === true,
      });
      if (!result) {
        res.status(409).json({ success: false, error: 'Quest đã hoàn thành trước đó' });
        return;
      }
      res.json({ success: true, data: result });
    } catch (error) {
      if (error instanceof QuestValidationError) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
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
      const userId = getAuthedUserId(req, res, 'params');
      if (!userId) return;
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
      const userId = getAuthedUserId(req, res, 'params');
      if (!userId) return;
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
      const userId = getAuthedUserId(req, res, 'params');
      if (!userId) return;
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
      const userId = getAuthedUserId(req, res, 'body');
      if (!userId) return;
      const { step } = req.body;
      if (!['checkin', 'reflection', 'community'].includes(step)) {
        res.status(400).json({ success: false, error: 'Invalid step. Must be: checkin, reflection, community' });
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
      const userId = getAuthedUserId(req, res, 'body');
      if (!userId) return;
      const { challengeId } = req.body;
      if (!challengeId || typeof challengeId !== 'string') {
        res.status(400).json({ success: false, error: 'Invalid challengeId' });
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
      const userId = getAuthedUserId(req, res, 'params');
      if (!userId) return;
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
      const userId = getAuthedUserId(req, res, 'params');
      if (!userId) return;
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
      const userId = getAuthedUserId(req, res, 'params');
      if (!userId) return;
      const data = await getQuestHistory(userId);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('GameFi getHistory error:', error);
      next(error);
    }
  };
}

export const gamefiController = new GamefiController();
