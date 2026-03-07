/**
 * PGE API ROUTES
 * 
 * Psychological Gravity Engine — REST API Endpoints
 * 
 * Endpoints:
 * GET  /api/pge/field-map/:userId          — Psychological field map (states, matrix, trajectory)
 * GET  /api/pge/ebh-trend/:userId          — EBH score trend over time
 * GET  /api/pge/session/:userId/:sessionId  — Session state evolution
 * GET  /api/pge/state/:userId/current       — Current (latest) state
 * POST /api/pge/analyze                     — Analyze text (one-shot, for testing)
 * POST /api/pge/retrain-population          — Retrain population matrix (admin)
 * GET  /api/pge/summary                     — System-wide PGE statistics
 * 
 * @module routes/pge
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import { pgeOrchestrator } from '../services/pge/pgeOrchestrator';
import { emotionExtractionService } from '../services/pge/emotionExtractor';
import {
  stateToVec, potentialEnergy, computeEBHScore, classifyZone,
  defaultWeightMatrix, findDominantEmotion, detectAttractor,
  negativeInertia,
} from '../services/pge/mathEngine';
import { PsychologicalState } from '../models/PsychologicalState';
import { InteractionMatrix } from '../models/InteractionMatrix';
import { PsychologicalTrajectory } from '../models/PsychologicalTrajectory';
import { authenticateExpert } from './expertAuth';
import { logger } from '../utils/logger';

const router = Router();

// ════════════════════════════════════════════════════════════════
// GET /field-map/:userId — Psychological Field Map
// ════════════════════════════════════════════════════════════════
router.get(
  '/field-map/:userId',
  authenticateExpert,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const days = parseInt(req.query.days as string) || 30;

      const fieldMap = await pgeOrchestrator.getFieldMap(userId, days);
      
      res.json({
        success: true,
        data: fieldMap,
        meta: { userId, days, generatedAt: new Date().toISOString() },
      });
    } catch (error) {
      logger.error('[PGE Route] getFieldMap error:', error);
      res.status(500).json({ success: false, error: 'Failed to generate field map' });
    }
  }
);

// ════════════════════════════════════════════════════════════════
// GET /ebh-trend/:userId — EBH Score Trend
// ════════════════════════════════════════════════════════════════
router.get(
  '/ebh-trend/:userId',
  authenticateExpert,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const days = parseInt(req.query.days as string) || 30;

      const trend = await pgeOrchestrator.getEBHTrend(userId, days);
      
      res.json({
        success: true,
        data: trend,
        meta: { userId, days },
      });
    } catch (error) {
      logger.error('[PGE Route] getEBHTrend error:', error);
      res.status(500).json({ success: false, error: 'Failed to get EBH trend' });
    }
  }
);

// ════════════════════════════════════════════════════════════════
// GET /session/:userId/:sessionId — Session State Evolution
// ════════════════════════════════════════════════════════════════
router.get(
  '/session/:userId/:sessionId',
  authenticateExpert,
  async (req: Request, res: Response) => {
    try {
      const { userId, sessionId } = req.params;

      const evolution = await pgeOrchestrator.getSessionEvolution(userId, sessionId);
      
      res.json({
        success: true,
        data: evolution,
        meta: { userId, sessionId, stateCount: evolution.length },
      });
    } catch (error) {
      logger.error('[PGE Route] getSessionEvolution error:', error);
      res.status(500).json({ success: false, error: 'Failed to get session evolution' });
    }
  }
);

// ════════════════════════════════════════════════════════════════
// GET /state/:userId/current — Current State
// ════════════════════════════════════════════════════════════════
router.get(
  '/state/:userId/current',
  authenticateExpert,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const latest = await PsychologicalState.findOne({ userId })
        .sort({ timestamp: -1 })
        .lean();

      if (!latest) {
        return res.json({
          success: true,
          data: null,
          message: 'No psychological state recorded yet',
        });
      }

      res.json({
        success: true,
        data: {
          stateVector: latest.stateVector,
          ebhScore: latest.ebhScore,
          zone: latest.zone,
          dominantEmotion: latest.dominantEmotion,
          attractorState: latest.attractorState,
          potentialEnergy: latest.potentialEnergy,
          forceNorm: latest.forceNorm,
          negativeInertia: latest.negativeInertia,
          loopStrength: latest.loopStrength,
          hopeDelta: latest.hopeDelta,
          timestamp: latest.timestamp,
          sessionId: latest.sessionId,
        },
      });
    } catch (error) {
      logger.error('[PGE Route] getCurrentState error:', error);
      res.status(500).json({ success: false, error: 'Failed to get current state' });
    }
  }
);

// ════════════════════════════════════════════════════════════════
// POST /analyze — One-shot Text Analysis (for testing/demo)
// ════════════════════════════════════════════════════════════════
router.post(
  '/analyze',
  authenticateExpert,
  async (req: Request, res: Response) => {
    try {
      const { text } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ success: false, error: 'Text is required' });
      }

      // Extract emotions
      const extraction = await emotionExtractionService.extract(text);
      const S = stateToVec(extraction.stateVector);
      const W = defaultWeightMatrix();
      const U = potentialEnergy(S, W);

      const ebhScore = computeEBHScore({
        loopStrength: 0, // no loop data for one-shot
        negativeInertia: 0,
        potentialEnergy: U,
        hopeLevel: extraction.stateVector.hope,
      });

      res.json({
        success: true,
        data: {
          stateVector: extraction.stateVector,
          potentialEnergy: Number(U.toFixed(4)),
          ebhScore: Number(ebhScore.toFixed(4)),
          zone: classifyZone(ebhScore),
          dominantEmotion: findDominantEmotion(S),
          attractorState: detectAttractor(S),
          confidence: extraction.confidence,
          method: extraction.method,
        },
      });
    } catch (error) {
      logger.error('[PGE Route] analyze error:', error);
      res.status(500).json({ success: false, error: 'Analysis failed' });
    }
  }
);

// ════════════════════════════════════════════════════════════════
// POST /retrain-population — Retrain Population Matrix (admin)
// ════════════════════════════════════════════════════════════════
router.post(
  '/retrain-population',
  authenticateExpert,
  async (req: Request, res: Response) => {
    try {
      await pgeOrchestrator.updatePopulationMatrix();
      
      res.json({
        success: true,
        message: 'Population matrix retrained successfully',
      });
    } catch (error) {
      logger.error('[PGE Route] retrain-population error:', error);
      res.status(500).json({ success: false, error: 'Retrain failed' });
    }
  }
);

// ════════════════════════════════════════════════════════════════
// GET /summary — System-wide PGE Statistics
// ════════════════════════════════════════════════════════════════
router.get(
  '/summary',
  authenticateExpert,
  async (req: Request, res: Response) => {
    try {
      const [
        totalStates,
        totalMatrices,
        totalTrajectories,
        zoneDistribution,
        recentWarnings,
      ] = await Promise.all([
        PsychologicalState.countDocuments(),
        InteractionMatrix.countDocuments(),
        PsychologicalTrajectory.countDocuments(),
        PsychologicalState.aggregate([
          { $group: { _id: '$zone', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        PsychologicalTrajectory.find({ earlyWarning: true })
          .sort({ simulatedAt: -1 })
          .limit(10)
          .select('userId sessionId warningType warningMessage simulatedAt maxEbhScore')
          .lean(),
      ]);

      // Get users with concerning states
      const criticalUsers = await PsychologicalState.aggregate([
        { $match: { zone: { $in: ['critical', 'black_hole'] } } },
        {
          $group: {
            _id: '$userId',
            lastZone: { $last: '$zone' },
            lastEBH: { $last: '$ebhScore' },
            lastSeen: { $max: '$timestamp' },
            count: { $sum: 1 },
          },
        },
        { $sort: { lastEBH: -1 } },
        { $limit: 10 },
      ]);

      res.json({
        success: true,
        data: {
          totalStates,
          totalMatrices,
          totalTrajectories,
          zoneDistribution: zoneDistribution.reduce((acc: any, z: any) => {
            acc[z._id] = z.count;
            return acc;
          }, {}),
          recentWarnings: recentWarnings.map((w: any) => ({
            userId: w.userId?.substring(0, 8) + '...',
            warningType: w.warningType,
            warningMessage: w.warningMessage,
            maxEBH: w.maxEbhScore,
            time: w.simulatedAt,
          })),
          criticalUsers: criticalUsers.map((u: any) => ({
            userId: u._id?.substring(0, 8) + '...',
            zone: u.lastZone,
            ebhScore: u.lastEBH,
            lastSeen: u.lastSeen,
            criticalCount: u.count,
          })),
        },
      });
    } catch (error) {
      logger.error('[PGE Route] summary error:', error);
      res.status(500).json({ success: false, error: 'Failed to get summary' });
    }
  }
);

export default router;
