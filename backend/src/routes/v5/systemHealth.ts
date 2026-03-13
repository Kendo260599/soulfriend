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
import axios from 'axios';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authenticateExpert } from '../expertAuth';
import { logger } from '../../utils/logger';

const router = Router();

const SENTRY_API_BASE = 'https://sentry.io/api/0';

async function resolveSentryContext(authToken: string): Promise<{ orgSlug: string; projectSlug?: string }> {
  const orgRes = await axios.get(`${SENTRY_API_BASE}/organizations/`, {
    headers: { Authorization: `Bearer ${authToken}` },
    timeout: 10000,
  });

  const orgs = Array.isArray(orgRes.data) ? orgRes.data : [];
  if (!orgs.length || !orgs[0]?.slug) {
    throw new Error('Không tìm thấy organization trong Sentry token');
  }

  const orgSlug = orgs[0].slug as string;

  const projectRes = await axios.get(`${SENTRY_API_BASE}/organizations/${orgSlug}/projects/`, {
    headers: { Authorization: `Bearer ${authToken}` },
    timeout: 10000,
  });
  const projects = Array.isArray(projectRes.data) ? projectRes.data : [];
  const preferred = projects.find((p: any) => {
    const slug = String(p?.slug || '').toLowerCase();
    const name = String(p?.name || '').toLowerCase();
    return slug.includes('soulfriend') || name.includes('soulfriend');
  }) || projects[0];

  return {
    orgSlug,
    projectSlug: preferred?.slug,
  };
}

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

/**
 * GET /api/v5/health/sentry/recent-issues
 * Fetch recent Sentry issues for production diagnostics (expert only)
 */
router.get(
  '/sentry/recent-issues',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const token = process.env.SENTRY_AUTH_TOKEN;
    if (!token) {
      return res.status(503).json({
        success: false,
        error: 'SENTRY_AUTH_TOKEN chưa được cấu hình',
      });
    }

    const limit = Math.min(parseInt((req.query.limit as string) || '10', 10), 25);
    const query = (req.query.query as string) || 'is:unresolved level:error';

    try {
      const ctx = await resolveSentryContext(token);
      const issueRes = await axios.get(`${SENTRY_API_BASE}/organizations/${ctx.orgSlug}/issues/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          project: ctx.projectSlug,
          query,
          sort: 'date',
          limit,
        },
        timeout: 12000,
      });

      const issues = Array.isArray(issueRes.data) ? issueRes.data.map((i: any) => ({
        id: i.id,
        shortId: i.shortId,
        title: i.title,
        level: i.level,
        culprit: i.culprit,
        status: i.status,
        count: i.count,
        firstSeen: i.firstSeen,
        lastSeen: i.lastSeen,
        permalink: i.permalink,
      })) : [];

      return res.json({
        success: true,
        data: {
          orgSlug: ctx.orgSlug,
          projectSlug: ctx.projectSlug,
          query,
          count: issues.length,
          issues,
        },
      });
    } catch (err: any) {
      logger.error('[V5 Health] Sentry recent issues fetch failed:', err?.message || err);
      return res.status(502).json({
        success: false,
        error: 'Không thể truy vấn Sentry issues',
        detail: err?.message || 'Unknown error',
      });
    }
  })
);

/**
 * GET /api/v5/health/sentry/recent-events
 * Fetch recent error events from Sentry Event Search (expert only)
 */
router.get(
  '/sentry/recent-events',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const token = process.env.SENTRY_AUTH_TOKEN;
    if (!token) {
      return res.status(503).json({
        success: false,
        error: 'SENTRY_AUTH_TOKEN chưa được cấu hình',
      });
    }

    const limit = Math.min(parseInt((req.query.limit as string) || '20', 10), 50);
    const query = (req.query.query as string) || 'event.type:error';
    const statsPeriod = (req.query.statsPeriod as string) || '24h';

    try {
      const ctx = await resolveSentryContext(token);
      const eventsRes = await axios.get(`${SENTRY_API_BASE}/organizations/${ctx.orgSlug}/events/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          project: ctx.projectSlug,
          query,
          field: ['timestamp', 'project', 'level', 'message', 'transaction', 'title'],
          sort: '-timestamp',
          statsPeriod,
          per_page: limit,
        },
        timeout: 12000,
      });

      const rows = Array.isArray(eventsRes.data) ? eventsRes.data : [];
      return res.json({
        success: true,
        data: {
          orgSlug: ctx.orgSlug,
          projectSlug: ctx.projectSlug,
          query,
          statsPeriod,
          count: rows.length,
          rows,
        },
      });
    } catch (err: any) {
      logger.error('[V5 Health] Sentry recent events fetch failed:', err?.message || err);
      return res.status(502).json({
        success: false,
        error: 'Không thể truy vấn Sentry events',
        detail: err?.message || 'Unknown error',
      });
    }
  })
);

export default router;
