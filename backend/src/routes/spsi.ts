/**
 * SPSI & PDD RESEARCH ROUTES
 * 
 * API endpoints cho SPSI (Social Psychological Stress Index) 
 * và PDD (Psychological Dynamics Dataset)
 * 
 * Endpoints:
 * - GET  /api/spsi/current/:userId     — Current SPSI value
 * - GET  /api/spsi/trend/:userId        — SPSI trend (14 days)
 * - GET  /api/spsi/timeseries/:userId   — SPSI time series
 * - GET  /api/spsi/population           — Population SPSI stats (admin)
 * - POST /api/spsi/consent              — Record research consent
 * - GET  /api/spsi/consent/:userId      — Check consent status
 * - GET  /api/pdd/statistics            — Dataset statistics (admin)
 * - GET  /api/pdd/export/participant    — Export participant trajectory (admin)
 * - GET  /api/pdd/export/population     — Export population data (admin)
 * 
 * @module routes/spsi
 * @version 1.0.0
 */

import express, { Request, Response } from 'express';
import { authenticateAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { spsiEngine } from '../services/pge/spsiEngine';
import { pddCollectionService } from '../services/pge/pddCollectionService';
import { anonymizationEngine } from '../services/pge/anonymizationEngine';
import { ResearchConsent } from '../models/ResearchConsent';
import { SPSIRecord } from '../models/SPSIRecord';

const router = express.Router();

// ════════════════════════════════════════════
// SPSI ENDPOINTS
// ════════════════════════════════════════════

/**
 * GET /api/spsi/current/:userId
 * Get current SPSI value for user
 */
router.get(
  '/current/:userId',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const latest = await SPSIRecord.findOne({ userId })
      .sort({ timestamp: -1 })
      .lean();

    if (!latest) {
      return res.json({ success: true, data: null, message: 'No SPSI data available' });
    }

    res.json({
      success: true,
      data: {
        spsiScore: latest.spsiScore,
        alertLevel: latest.alertLevel,
        components: latest.components,
        trend: latest.trend,
        ebhScore: latest.ebhScore,
        zone: latest.zone,
        timestamp: latest.timestamp,
      },
    });
  })
);

/**
 * GET /api/spsi/trend/:userId
 * Get SPSI trend analysis (14-day window)
 */
router.get(
  '/trend/:userId',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const trend = await spsiEngine.computeTrend(userId);

    res.json({ success: true, data: trend });
  })
);

/**
 * GET /api/spsi/timeseries/:userId
 * Get SPSI time series for charting
 */
router.get(
  '/timeseries/:userId',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const days = parseInt(req.query.days as string) || 30;
    const granularity = (req.query.granularity as string) || 'session';
    const limit = parseInt(req.query.limit as string) || 200;

    const validGranularities = ['message', 'session', 'daily'] as const;
    const gran = validGranularities.includes(granularity as typeof validGranularities[number])
      ? granularity as 'message' | 'session' | 'daily'
      : 'session';

    const series = await spsiEngine.getTimeSeries(userId, { days, granularity: gran, limit });

    res.json({
      success: true,
      data: series,
      meta: { days, granularity: gran, count: series.length },
    });
  })
);

/**
 * GET /api/spsi/population
 * Population-level SPSI statistics (admin only)
 */
router.get(
  '/population',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const granularity = (req.query.granularity as string) === 'session' ? 'session' as const : 'daily' as const;

    const stats = await spsiEngine.getPopulationStats({ startDate, endDate, granularity });

    res.json({ success: true, data: stats });
  })
);

// ════════════════════════════════════════════
// CONSENT ENDPOINTS
// ════════════════════════════════════════════

/**
 * POST /api/spsi/consent
 * Record research consent
 */
router.post(
  '/consent',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, scopes } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    const participantHash = anonymizationEngine.hashUserId(userId);

    // Upsert consent
    const consent = await ResearchConsent.findOneAndUpdate(
      { userId },
      {
        userId,
        participantHash,
        consentGiven: true,
        consentVersion: '1.0',
        consentDate: new Date(),
        scopes: scopes || {
          anonymizedConversation: true,
          emotionalMetrics: true,
          testResults: true,
          interventionOutcomes: true,
          longitudinalTracking: true,
        },
        ipAtConsent: req.ip,
        userAgent: req.headers['user-agent'],
      },
      { upsert: true, new: true }
    );

    res.status(201).json({
      success: true,
      data: {
        participantHash,
        consentGiven: consent.consentGiven,
        consentVersion: consent.consentVersion,
        consentDate: consent.consentDate,
      },
    });
  })
);

/**
 * DELETE /api/spsi/consent/:userId
 * Withdraw consent (right to be forgotten)
 */
router.delete(
  '/consent/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const consent = await ResearchConsent.findOneAndUpdate(
      { userId },
      { consentGiven: false, withdrawDate: new Date() },
      { new: true }
    );

    if (!consent) {
      return res.status(404).json({ success: false, error: 'No consent record found' });
    }

    res.json({
      success: true,
      message: 'Consent withdrawn. No new research data will be collected.',
      data: { withdrawDate: consent.withdrawDate },
    });
  })
);

/**
 * GET /api/spsi/consent/:userId
 * Check consent status
 */
router.get(
  '/consent/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const hasConsent = await pddCollectionService.hasConsent(userId);

    res.json({ success: true, data: { consentGiven: hasConsent } });
  })
);

// ════════════════════════════════════════════
// PDD ENDPOINTS (Admin only)
// ════════════════════════════════════════════

/**
 * GET /api/pdd/statistics
 * Dataset statistics overview
 */
router.get(
  '/pdd/statistics',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await pddCollectionService.getDatasetStatistics();
    res.json({ success: true, data: stats });
  })
);

/**
 * GET /api/pdd/export/participant
 * Export anonymized participant trajectory
 * Query: participantHash, startDate, endDate, granularity
 */
router.get(
  '/pdd/export/participant',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { participantHash, startDate, endDate, granularity } = req.query;

    if (!participantHash) {
      return res.status(400).json({ success: false, error: 'participantHash is required' });
    }

    const data = await pddCollectionService.exportParticipantTrajectory(
      participantHash as string,
      {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        granularity: (granularity as 'daily' | 'weekly' | 'monthly') || 'daily',
      }
    );

    res.json({
      success: true,
      data,
      meta: { count: data.length, participantHash },
    });
  })
);

/**
 * GET /api/pdd/export/population
 * Export population-level research data
 * Query: startDate, endDate, granularity, limit
 */
router.get(
  '/pdd/export/population',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, granularity, limit } = req.query;

    const data = await pddCollectionService.exportPopulationData({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      granularity: (granularity as 'daily' | 'weekly') || 'daily',
      limit: parseInt(limit as string) || 10000,
    });

    res.json({
      success: true,
      data,
      meta: { count: data.length },
    });
  })
);

/**
 * POST /api/pdd/snapshot/build
 * Manually trigger daily snapshot build for a user (admin)
 */
router.post(
  '/pdd/snapshot/build',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, date } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    const targetDate = date ? new Date(date) : new Date();
    const snapshot = await pddCollectionService.buildDailySnapshot(userId, targetDate);

    if (!snapshot) {
      return res.json({
        success: true,
        data: null,
        message: 'No data available or consent not given',
      });
    }

    res.json({
      success: true,
      data: {
        participantHash: snapshot.participantHash,
        periodStart: snapshot.periodStart,
        periodEnd: snapshot.periodEnd,
        spsi: snapshot.spsi,
        ebh: snapshot.ebh,
        eventCount: snapshot.eventCount,
      },
    });
  })
);

export default router;
