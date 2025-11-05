/**
 * CRITICAL ALERTS API ROUTES
 * Admin Dashboard cho Clinical Team
 *
 * Endpoints:
 * - GET /api/alerts/active - Lấy danh sách alerts đang active
 * - POST /api/alerts/:id/acknowledge - Acknowledge một alert
 * - POST /api/alerts/:id/resolve - Resolve một alert
 * - GET /api/alerts/:id - Lấy chi tiết một alert
 * - GET /api/alerts/history - Lấy lịch sử alerts
 */

import express, { Request, Response } from 'express';
import { criticalInterventionService } from '../services/criticalInterventionService';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

/**
 * GET /api/alerts/active
 * Lấy danh sách alerts đang active
 */
router.get(
  '/active',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const activeAlerts = criticalInterventionService.getActiveAlerts();

      res.json({
        success: true,
        count: activeAlerts.length,
        alerts: activeAlerts,
      });
    } catch (error) {
      logger.error('Error fetching active alerts:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching active alerts',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  })
);

/**
 * POST /api/alerts/:id/acknowledge
 * Acknowledge một alert (dừng escalation timer)
 */
router.post(
  '/:id/acknowledge',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { clinicalMemberId, notes } = req.body;

      if (!clinicalMemberId) {
        return res.status(400).json({
          success: false,
          message: 'clinicalMemberId is required',
        });
      }

      await criticalInterventionService.acknowledgeAlert(id, clinicalMemberId, notes);

      logger.info(`Alert ${id} acknowledged by ${clinicalMemberId}`);

      res.json({
        success: true,
        message: 'Alert acknowledged successfully',
        alertId: id,
      });
    } catch (error) {
      logger.error('Error acknowledging alert:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error acknowledging alert',
      });
    }
  })
);

/**
 * POST /api/alerts/:id/resolve
 * Resolve một alert (crisis đã được xử lý)
 */
router.post(
  '/:id/resolve',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { resolution } = req.body;

      if (!resolution) {
        return res.status(400).json({
          success: false,
          message: 'resolution is required',
        });
      }

      await criticalInterventionService.resolveAlert(id, resolution);

      logger.info(`Alert ${id} resolved: ${resolution}`);

      res.json({
        success: true,
        message: 'Alert resolved successfully',
        alertId: id,
        resolution,
      });
    } catch (error) {
      logger.error('Error resolving alert:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error resolving alert',
      });
    }
  })
);

/**
 * GET /api/alerts/stats
 * Lấy thống kê alerts
 */
router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const activeAlerts = criticalInterventionService.getActiveAlerts();

      const stats = {
        total: activeAlerts.length,
        byStatus: {
          pending: activeAlerts.filter(a => a.status === 'pending').length,
          acknowledged: activeAlerts.filter(a => a.status === 'acknowledged').length,
          intervened: activeAlerts.filter(a => a.status === 'intervened').length,
        },
        byRiskType: {
          suicidal: activeAlerts.filter(a => a.riskType === 'suicidal').length,
          psychosis: activeAlerts.filter(a => a.riskType === 'psychosis').length,
          self_harm: activeAlerts.filter(a => a.riskType === 'self_harm').length,
          violence: activeAlerts.filter(a => a.riskType === 'violence').length,
        },
      };

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      logger.error('Error fetching alert stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching alert stats',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  })
);

/**
 * GET /api/alerts/:id
 * Lấy chi tiết một alert
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const activeAlerts = criticalInterventionService.getActiveAlerts();
      const alert = activeAlerts.find(a => a.id === id);

      if (!alert) {
        return res.status(404).json({
          success: false,
          message: 'Alert not found',
        });
      }

      res.json({
        success: true,
        alert,
      });
    } catch (error) {
      logger.error('Error fetching alert details:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching alert details',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  })
);

/**
 * GET /api/alerts/stats
 * Lấy thống kê alerts
 */
router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const activeAlerts = criticalInterventionService.getActiveAlerts();

      const stats = {
        total: activeAlerts.length,
        byStatus: {
          pending: activeAlerts.filter(a => a.status === 'pending').length,
          acknowledged: activeAlerts.filter(a => a.status === 'acknowledged').length,
          intervened: activeAlerts.filter(a => a.status === 'intervened').length,
        },
        byRiskType: {
          suicidal: activeAlerts.filter(a => a.riskType === 'suicidal').length,
          psychosis: activeAlerts.filter(a => a.riskType === 'psychosis').length,
          self_harm: activeAlerts.filter(a => a.riskType === 'self_harm').length,
          violence: activeAlerts.filter(a => a.riskType === 'violence').length,
        },
      };

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      logger.error('Error fetching alert stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching alert stats',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  })
);

export default router;
