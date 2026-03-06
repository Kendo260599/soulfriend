/**
 * V5 KNOWLEDGE GRAPH ROUTES
 * 
 * API endpoints cho Mental Health Knowledge Graph
 * Query emotions, coping strategies, crisis signals, escalation paths
 * 
 * @module routes/v5/knowledgeGraph
 * @version 5.0.0
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authenticateAdmin } from '../../middleware/auth';
import { authenticateExpert } from '../expertAuth';
import { mentalHealthKnowledgeGraph } from '../../services/mentalHealthKnowledgeGraph';

const router = Router();

/**
 * GET /api/v5/knowledge-graph/full
 * Lấy toàn bộ graph (nodes + edges)
 */
router.get(
  '/full',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const graph = mentalHealthKnowledgeGraph.getFullGraph();
    res.json({ success: true, data: graph });
  })
);

/**
 * GET /api/v5/knowledge-graph/stats
 * Thống kê Knowledge Graph
 */
router.get(
  '/stats',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const stats = mentalHealthKnowledgeGraph.getStats();
    res.json({ success: true, data: stats });
  })
);

/**
 * GET /api/v5/knowledge-graph/coping/:emotionId
 * Lấy coping strategies phù hợp cho emotion
 */
router.get(
  '/coping/:emotionId',
  asyncHandler(async (req: Request, res: Response) => {
    const { emotionId } = req.params;
    const strategies = mentalHealthKnowledgeGraph.getCopingStrategies(emotionId);
    res.json({ success: true, data: strategies, emotion: emotionId });
  })
);

/**
 * GET /api/v5/knowledge-graph/resources/:emotionId
 * Lấy support resources cho emotion
 */
router.get(
  '/resources/:emotionId',
  asyncHandler(async (req: Request, res: Response) => {
    const { emotionId } = req.params;
    const resources = mentalHealthKnowledgeGraph.getSupportResources(emotionId);
    res.json({ success: true, data: resources, emotion: emotionId });
  })
);

/**
 * GET /api/v5/knowledge-graph/escalation-risks/:emotionId
 * Kiểm tra escalation risks từ emotion (BFS analysis)
 */
router.get(
  '/escalation-risks/:emotionId',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const { emotionId } = req.params;
    const risks = mentalHealthKnowledgeGraph.getEscalationRisks(emotionId);
    res.json({ success: true, data: risks, emotion: emotionId });
  })
);

/**
 * POST /api/v5/knowledge-graph/match
 * Match message với Knowledge Graph nodes
 */
router.post(
  '/match',
  asyncHandler(async (req: Request, res: Response) => {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'message is required' });
    }
    const matches = mentalHealthKnowledgeGraph.matchMessage(message);
    res.json({ success: true, data: matches, count: matches.length });
  })
);

/**
 * POST /api/v5/knowledge-graph/enrich-context
 * Enrichment context cho AI dựa trên message
 */
router.post(
  '/enrich-context',
  asyncHandler(async (req: Request, res: Response) => {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'message is required' });
    }
    const context = mentalHealthKnowledgeGraph.enrichContext(message);
    res.json({ success: true, data: { enrichedContext: context } });
  })
);

export default router;
