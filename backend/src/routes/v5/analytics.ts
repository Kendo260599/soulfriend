/**
 * V5 ANALYTICS ROUTES
 * 
 * API endpoints cho Impact Analytics Dashboard
 * Cung cấp metrics, trends, và dashboard data cho nghiên cứu
 * 
 * @module routes/v5/analytics
 * @version 5.0.0
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authenticateAdmin } from '../../middleware/auth';
import { authenticateExpert } from '../expertAuth';
import { impactAnalyticsEngine } from '../../services/impactAnalyticsEngine';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * GET /api/v5/analytics/dashboard
 * Full dashboard data (30d metrics + 7d metrics + trends)
 */
router.get(
  '/dashboard',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('[V5 Analytics] Fetching dashboard data...');
    const dashboard = await impactAnalyticsEngine.getDashboardData();
    res.json({ success: true, data: dashboard });
  })
);

/**
 * GET /api/v5/analytics/metrics
 * Tính metrics cho khoảng thời gian
 */
router.get(
  '/metrics',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const endDate = new Date();
    const metrics = await impactAnalyticsEngine.calculateMetrics(startDate, endDate);
    res.json({ success: true, data: metrics, period: { startDate, endDate } });
  })
);

/**
 * GET /api/v5/analytics/trends
 * Trend data cho charts (30 ngày gần nhất)
 */
router.get(
  '/trends',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 30;
    const metric = (req.query.metric as string) || 'interactions';
    const trends = await impactAnalyticsEngine.getTrends(metric, days);
    res.json({ success: true, data: trends, days });
  })
);

/**
 * GET /api/v5/analytics/psi
 * Psychological Safety Index chi tiết
 */
router.get(
  '/psi',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date();
    const metrics = await impactAnalyticsEngine.calculateMetrics(startDate, endDate);
    
    res.json({
      success: true,
      data: {
        psychologicalSafetyIndex: metrics.psychologicalSafetyIndex,
        components: {
          positiveOutcomeRate: metrics.positiveOutcomeRate,
          aiResponseQuality: metrics.aiResponseQuality,
          riskEscalationRate: metrics.riskEscalationRate,
          userSatisfactionRate: metrics.userSatisfactionRate,
        },
        formula: 'PSI = positiveOutcome*30 + safety*30 + (1-escalation)*20 + helpful*20',
      },
    });
  })
);

export default router;
