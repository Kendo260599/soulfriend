/**
 * V5 SYSTEM HEALTH ROUTES
 * 
 * API endpoints cho monitoring V5 Learning Pipeline health:
 * - Pipeline status (event queue, scheduled jobs)
 * - Safety violation statistics
 * - Service health checks
 * 
 * @module routes/v5/systemHealth
 * @version 5.0.0
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authenticateExpert } from '../expertAuth';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * GET /api/v5/health
 * Overall V5 pipeline health status
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const checks: Record<string, { status: string; detail?: string }> = {};

    // Check Event Queue
    try {
      const { eventQueueService } = await import('../../services/eventQueueService');
      const stats = eventQueueService.getStats();
      checks.eventQueue = {
        status: 'healthy',
        detail: `${stats.totalProcessed || 0} processed, ${stats.subscribers || 0} subscribers`,
      };
    } catch {
      checks.eventQueue = { status: 'unhealthy', detail: 'Service unavailable' };
    }

    // Check MongoDB V5 models
    try {
      const mongoose = await import('mongoose');
      const dbState = mongoose.connection.readyState;
      checks.mongodb = {
        status: dbState === 1 ? 'healthy' : 'unhealthy',
        detail: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown',
      };
    } catch {
      checks.mongodb = { status: 'unhealthy', detail: 'Cannot check' };
    }

    // Check SafetyLog collection
    try {
      const { SafetyLog } = await import('../../models/SafetyLog');
      const recentCount = await SafetyLog.countDocuments({
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });
      checks.safetyLogs = { status: 'healthy', detail: `${recentCount} logs (24h)` };
    } catch (err: any) {
      checks.safetyLogs = { status: 'degraded', detail: err.message };
    }

    // Check InteractionEvent collection
    try {
      const InteractionEvent = (await import('../../models/InteractionEvent')).default;
      const recentCount = await InteractionEvent.countDocuments({
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });
      checks.interactions = { status: 'healthy', detail: `${recentCount} captured (24h)` };
    } catch (err: any) {
      checks.interactions = { status: 'degraded', detail: err.message };
    }

    // Check EvaluationScore collection
    try {
      const EvaluationScore = (await import('../../models/EvaluationScore')).default;
      const recentCount = await EvaluationScore.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });
      checks.evaluations = { status: 'healthy', detail: `${recentCount} evaluated (24h)` };
    } catch (err: any) {
      checks.evaluations = { status: 'degraded', detail: err.message };
    }

    const allHealthy = Object.values(checks).every(c => c.status === 'healthy');
    const anyUnhealthy = Object.values(checks).some(c => c.status === 'unhealthy');

    res.status(anyUnhealthy ? 503 : 200).json({
      success: !anyUnhealthy,
      status: allHealthy ? 'healthy' : anyUnhealthy ? 'unhealthy' : 'degraded',
      version: '5.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      config: {
        evalSampleRate: parseFloat(process.env.V5_EVAL_SAMPLE_RATE || '0.5'),
        curationInterval: '6h',
        batchEvalInterval: '2h',
      },
      checks,
    });
  })
);

/**
 * GET /api/v5/health/safety-stats
 * Safety violation statistics for dashboard
 */
router.get(
  '/safety-stats',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    try {
      const { SafetyLog } = await import('../../models/SafetyLog');
      
      const [totalViolations, byAction, unreviewed] = await Promise.all([
        SafetyLog.countDocuments({ timestamp: { $gte: since } }),
        SafetyLog.aggregate([
          { $match: { timestamp: { $gte: since } } },
          { $group: { _id: '$actionTaken', count: { $sum: 1 } } },
        ]),
        SafetyLog.countDocuments({ timestamp: { $gte: since }, reviewedByExpert: false }),
      ]);

      const actionMap: Record<string, number> = {};
      byAction.forEach((a: any) => { actionMap[a._id] = a.count; });

      res.json({
        success: true,
        data: {
          totalViolations,
          blockedCount: actionMap['blocked'] || 0,
          sanitizedCount: actionMap['sanitized'] || 0,
          escalatedCount: actionMap['escalated'] || 0,
          allowedCount: actionMap['allowed'] || 0,
          unreviewed,
          period: `${days}d`,
        },
      });
    } catch (err: any) {
      logger.warn('[V5 Health] Safety stats query failed:', err.message);
      res.json({
        success: true,
        data: {
          totalViolations: 0,
          blockedCount: 0,
          sanitizedCount: 0,
          escalatedCount: 0,
          allowedCount: 0,
          unreviewed: 0,
          period: `${days}d`,
        },
      });
    }
  })
);

/**
 * GET /api/v5/health/pipeline-status
 * Detailed pipeline component status
 */
router.get(
  '/pipeline-status',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const components = [];

    // Check each V5 service
    const serviceChecks = [
      { name: 'interactionCaptureService', path: '../../services/interactionCaptureService' },
      { name: 'responseEvaluationService', path: '../../services/responseEvaluationService' },
      { name: 'safetyGuardrailService', path: '../../services/safetyGuardrailService' },
      { name: 'trainingDataCurationService', path: '../../services/trainingDataCurationService' },
      { name: 'eventQueueService', path: '../../services/eventQueueService' },
      { name: 'v5IntegrationService', path: '../../services/v5IntegrationService' },
      { name: 'impactAnalyticsEngine', path: '../../services/impactAnalyticsEngine' },
    ];

    for (const svc of serviceChecks) {
      try {
        await import(svc.path);
        components.push({ name: svc.name, status: 'loaded', error: null });
      } catch (err: any) {
        components.push({ name: svc.name, status: 'error', error: err.message });
      }
    }

    res.json({
      success: true,
      data: {
        components,
        scheduledJobs: [
          { name: 'auto-curation', interval: '6h', description: 'Curate training data from expert reviews & high-quality interactions' },
          { name: 'batch-evaluation', interval: '2h', description: 'Auto-evaluate pending interactions' },
        ],
        reactiveHandlers: [
          { event: 'feedback.received', action: 'Flag negative feedback for expert review' },
          { event: 'evaluation.completed', action: 'Flag low-score interactions' },
          { event: 'crisis.detected', action: 'Persist SafetyLog + email notification' },
          { event: 'guardrail.violated', action: 'Persist SafetyLog violation record' },
        ],
      },
    });
  })
);

export default router;
