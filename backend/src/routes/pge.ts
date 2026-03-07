/**
 * PGE API ROUTES
 * 
 * Psychological Gravity Engine — REST API Endpoints
 * 
 * Endpoints:
 * GET  /api/pge/field-map/:userId             — Psychological field map (states, matrix, trajectory, intervention)
 * GET  /api/pge/ebh-trend/:userId             — EBH score trend over time
 * GET  /api/pge/session/:userId/:sessionId    — Session state evolution
 * GET  /api/pge/state/:userId/current         — Current (latest) state
 * POST /api/pge/analyze                       — Analyze text (one-shot, for testing)
 * POST /api/pge/retrain-population            — Retrain population matrix (admin)
 * GET  /api/pge/summary                       — System-wide PGE statistics
 * GET  /api/pge/intervention/:userId          — Get intervention recommendation (Phase 2)
 * GET  /api/pge/intervention/history/:userId  — Get intervention history (Phase 2)
 * POST /api/pge/intervention/outcome          — Record intervention outcome (Phase 2)
 * GET  /api/pge/es-trend/:userId              — Emotional Star score trend (Phase 2)
 * 
 * GET  /api/pge/topology/:userId               — Psychological topology map (Phase 3)
 * GET  /api/pge/topology/landscape/:userId      — Energy landscape surface (Phase 3)
 * 
 * @module routes/pge
 * @version 3.0.0 — PGE Phase 3: Topology Mapper
 */

import { Router, Request, Response } from 'express';
import { pgeOrchestrator } from '../services/pge/pgeOrchestrator';
import { interventionEngine } from '../services/pge/interventionEngine';
import { topologyMapper } from '../services/pge/topologyMapper';
import { banditPolicy } from '../services/pge/banditPolicy';
import { emotionExtractionService } from '../services/pge/emotionExtractor';
import {
  stateToVec, potentialEnergy, computeEBHScore, classifyZone,
  defaultWeightMatrix, findDominantEmotion, detectAttractor,
  negativeInertia, computeESScore, distanceToAttractor,
  defaultInteractionMatrix,
} from '../services/pge/mathEngine';
import { PsychologicalState } from '../models/PsychologicalState';
import { InteractionMatrix } from '../models/InteractionMatrix';
import { PsychologicalTrajectory } from '../models/PsychologicalTrajectory';
import { InterventionRecord } from '../models/InterventionRecord';
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

// ════════════════════════════════════════════════════════════════
// GET /intervention/:userId — Get Intervention Recommendation (Phase 2)
// ════════════════════════════════════════════════════════════════
router.get(
  '/intervention/:userId',
  authenticateExpert,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      // Get current state
      const latest = await PsychologicalState.findOne({ userId })
        .sort({ timestamp: -1 })
        .lean();

      if (!latest) {
        return res.json({
          success: true,
          data: { recommended: false, message: 'No psychological state available for intervention analysis' },
        });
      }

      // Get interaction matrix
      const matrixDoc = await InteractionMatrix.findOne({
        userId,
        scope: 'individual',
      }).sort({ version: -1 }).lean();

      const A = matrixDoc?.matrix ?? defaultInteractionMatrix();
      const S = stateToVec(latest.stateVector);

      const recommendation = await interventionEngine.getRecommendation({
        userId,
        sessionId: latest.sessionId,
        currentState: S,
        interactionMatrix: A,
        ebhScore: latest.ebhScore,
        zone: latest.zone,
        loopStrength: latest.loopStrength,
        negativeInertia: latest.negativeInertia,
      });

      res.json({
        success: true,
        data: recommendation,
        meta: { userId, generatedAt: new Date().toISOString() },
      });
    } catch (error) {
      logger.error('[PGE Route] intervention error:', error);
      res.status(500).json({ success: false, error: 'Failed to get intervention recommendation' });
    }
  }
);

// ════════════════════════════════════════════════════════════════
// GET /intervention/history/:userId — Intervention History (Phase 2)
// ════════════════════════════════════════════════════════════════
router.get(
  '/intervention/history/:userId',
  authenticateExpert,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const history = await interventionEngine.getInterventionHistory(userId, limit);

      res.json({
        success: true,
        data: history,
        meta: { userId, limit },
      });
    } catch (error) {
      logger.error('[PGE Route] intervention history error:', error);
      res.status(500).json({ success: false, error: 'Failed to get intervention history' });
    }
  }
);

// ════════════════════════════════════════════════════════════════
// POST /intervention/outcome — Record Intervention Outcome (Phase 2)
// ════════════════════════════════════════════════════════════════
router.post(
  '/intervention/outcome',
  authenticateExpert,
  async (req: Request, res: Response) => {
    try {
      const { userId, sessionId, postState, postEBH } = req.body;

      if (!userId || !sessionId) {
        return res.status(400).json({ success: false, error: 'userId and sessionId are required' });
      }

      // Get interaction matrix 
      const matrixDoc = await InteractionMatrix.findOne({
        userId,
        scope: 'individual',
      }).sort({ version: -1 }).lean();

      const A = matrixDoc?.matrix ?? defaultInteractionMatrix();

      // If postState not provided, get from latest PsychologicalState
      let postVec: number[];
      let ebh: number;

      if (postState && Array.isArray(postState) && postState.length === 24) {
        postVec = postState;
        ebh = postEBH ?? 0;
      } else {
        const latest = await PsychologicalState.findOne({ userId, sessionId })
          .sort({ timestamp: -1 })
          .lean();
        if (!latest) {
          return res.status(404).json({ success: false, error: 'No post-intervention state found' });
        }
        postVec = stateToVec(latest.stateVector);
        ebh = latest.ebhScore;
      }

      const result = await interventionEngine.recordOutcome({
        userId,
        sessionId,
        postState: postVec,
        postEBH: ebh,
        interactionMatrix: A,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('[PGE Route] intervention outcome error:', error);
      res.status(500).json({ success: false, error: 'Failed to record outcome' });
    }
  }
);

// ════════════════════════════════════════════════════════════════
// GET /es-trend/:userId — Emotional Star Score Trend (Phase 2)
// ════════════════════════════════════════════════════════════════
router.get(
  '/es-trend/:userId',
  authenticateExpert,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const days = parseInt(req.query.days as string) || 30;
      const since = new Date(Date.now() - days * 24 * 3600 * 1000);

      const states = await PsychologicalState.find({
        userId,
        timestamp: { $gte: since },
      })
      .sort({ timestamp: 1 })
      .limit(200)
      .select('stateVector ebhScore timestamp zone')
      .lean();

      const trend = states.map(s => {
        const vec = stateToVec(s.stateVector);
        return {
          timestamp: s.timestamp,
          esScore: Number(computeESScore(vec).toFixed(3)),
          ebhScore: s.ebhScore,
          distanceToPA: Number(distanceToAttractor(vec).toFixed(3)),
          zone: s.zone,
        };
      });

      res.json({
        success: true,
        data: trend,
        meta: { userId, days, points: trend.length },
      });
    } catch (error) {
      logger.error('[PGE Route] es-trend error:', error);
      res.status(500).json({ success: false, error: 'Failed to get ES trend' });
    }
  }
);

// ════════════════════════════════════════════════════════════════
// GET /topology/:userId — Psychological Topology Map (Phase 3)
// ════════════════════════════════════════════════════════════════
router.get(
  '/topology/:userId',
  authenticateExpert,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const result = await topologyMapper.computeTopology(userId);

      // Slim down data for transport (don't send full 24D state vectors for each basin cell)
      const slimFixedPoints = result.topology.fixedPoints.map(fp => ({
        type: fp.type,
        label: fp.label,
        labelVi: fp.labelVi,
        basin: fp.basin,
        eigenvalues: fp.eigenvalues.slice(0, 3), // top 3 only
        position: result.topology.pcaAxes
          ? {
              x: fp.state.reduce((s, v, i) => s + v * result.topology.pcaAxes.pc1[i], 0)
                - result.topology.pcaAxes.mean.reduce((s, v, i) => s + v * result.topology.pcaAxes.pc1[i], 0),
              y: fp.state.reduce((s, v, i) => s + v * result.topology.pcaAxes.pc2[i], 0)
                - result.topology.pcaAxes.mean.reduce((s, v, i) => s + v * result.topology.pcaAxes.pc2[i], 0),
            }
          : { x: 0, y: 0 },
      }));

      res.json({
        success: true,
        data: {
          fixedPoints: slimFixedPoints,
          basins: result.topology.basins,
          gridSize: result.topology.gridSize,
          userPosition: result.topology.userPosition,
          userTrajectory: result.topology.userTrajectory.slice(-30), // last 30 points
          bifurcationEvents: result.topology.bifurcationEvents,
          profile: result.profile,
          phasePortrait: result.phasePortrait,
        },
        meta: { userId, generatedAt: new Date().toISOString() },
      });
    } catch (error) {
      logger.error('[PGE Route] topology error:', error);
      res.status(500).json({ success: false, error: 'Failed to compute topology' });
    }
  }
);

// ════════════════════════════════════════════════════════════════
// GET /topology/landscape/:userId — Energy Landscape Surface (Phase 3)
// ════════════════════════════════════════════════════════════════
router.get(
  '/topology/landscape/:userId',
  authenticateExpert,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const result = await topologyMapper.computeTopology(userId);

      res.json({
        success: true,
        data: {
          landscape: result.landscape,
          profile: result.profile,
          userPosition: result.topology.userPosition,
        },
        meta: { userId, generatedAt: new Date().toISOString() },
      });
    } catch (error) {
      logger.error('[PGE Route] landscape error:', error);
      res.status(500).json({ success: false, error: 'Failed to compute landscape' });
    }
  }
);

// ════════════════════════════════════════════════════════════════
// GET /bandit/:userId — Bandit RL Analytics (Phase 5)
// ════════════════════════════════════════════════════════════════
router.get(
  '/bandit/:userId',
  authenticateExpert,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const analytics = await banditPolicy.getAnalytics(userId);

      res.json({
        success: true,
        data: analytics,
        meta: { userId, generatedAt: new Date().toISOString() },
      });
    } catch (error) {
      logger.error('[PGE Route] bandit analytics error:', error);
      res.status(500).json({ success: false, error: 'Failed to get bandit analytics' });
    }
  }
);

// ════════════════════════════════════════════════════════════════
// GET /bandit/select/:userId — Bandit Arm Selection (Phase 5)
// ════════════════════════════════════════════════════════════════
router.get(
  '/bandit/select/:userId',
  authenticateExpert,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const zone = (req.query.zone as string) || 'caution';
      const ebhScore = parseFloat(req.query.ebh as string) || 0.5;
      const topologyProfile = req.query.topology as string;

      const result = await banditPolicy.selectArm(userId, {
        topologyProfile,
        zone,
        ebhScore,
      });

      res.json({
        success: true,
        data: result,
        meta: { userId, generatedAt: new Date().toISOString() },
      });
    } catch (error) {
      logger.error('[PGE Route] bandit select error:', error);
      res.status(500).json({ success: false, error: 'Failed to select bandit arm' });
    }
  }
);

export default router;
