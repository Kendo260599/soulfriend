/**
 * A/B TESTING API ROUTES
 *
 * API endpoints để quản lý A/B Testing Framework:
 *   - Tạo, start, pause, conclude experiments
 *   - Xem kết quả & phân tích thống kê
 *   - Track events (assessment, HITL, satisfaction, custom)
 *   - Quản lý variant assignment
 *
 * Tất cả routes yêu cầu expert authentication.
 *
 * @module routes/abTesting
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import { abTestingService } from '../services/abTestingService';
import logger from '../utils/logger';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticateExpert } from './expertAuth';

const router = Router();

// All A/B testing routes require expert authentication
router.use(authenticateExpert);

// =============================================================================
// POST /api/ab-testing/experiments
// Tạo experiment mới
// =============================================================================
router.post(
  '/experiments',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description, variants, primaryMetric, minSampleSize, confidenceThreshold } =
      req.body;

    // Validate required fields
    if (!name || !variants || !Array.isArray(variants) || variants.length < 2) {
      res.status(400).json({
        success: false,
        error: 'Cần ít nhất: name (string), variants (array, ≥2 phần tử)',
      });
      return;
    }

    // Validate each variant
    for (const variant of variants) {
      if (!variant.id || !variant.name || typeof variant.weight !== 'number') {
        res.status(400).json({
          success: false,
          error: 'Mỗi variant cần: id (string), name (string), weight (number)',
        });
        return;
      }
    }

    logger.info(`[ABTesting] Creating experiment: ${name}`);
    const experiment = abTestingService.createExperiment({
      name,
      description: description || '',
      variants,
      primaryMetric: primaryMetric || 'accuracy',
      minSampleSize: minSampleSize || 100,
      confidenceThreshold: confidenceThreshold || 0.95,
    });

    res.status(201).json({
      success: true,
      message: `Experiment "${name}" đã được tạo`,
      data: experiment,
    });
  })
);

// =============================================================================
// GET /api/ab-testing/experiments
// Liệt kê tất cả experiments
// =============================================================================
router.get(
  '/experiments',
  asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.query;

    let experiments;
    if (status === 'running') {
      experiments = abTestingService.getRunningExperiments();
    } else {
      experiments = abTestingService.getAllExperiments();
    }

    res.json({
      success: true,
      data: {
        total: experiments.length,
        experiments: experiments.map(exp => ({
          id: exp.id,
          name: exp.name,
          status: exp.status,
          description: exp.description,
          variantCount: exp.variants.length,
          primaryMetric: exp.primaryMetric,
          createdAt: exp.createdAt,
          startedAt: exp.startedAt,
          concludedAt: exp.concludedAt,
          winner: exp.winner,
        })),
      },
    });
  })
);

// =============================================================================
// GET /api/ab-testing/experiments/:id
// Chi tiết một experiment
// =============================================================================
router.get(
  '/experiments/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const allExperiments = abTestingService.getAllExperiments();
    const experiment = allExperiments.find(e => e.id === id);

    if (!experiment) {
      res.status(404).json({
        success: false,
        error: `Không tìm thấy experiment ${id}`,
      });
      return;
    }

    res.json({
      success: true,
      data: experiment,
    });
  })
);

// =============================================================================
// POST /api/ab-testing/experiments/:id/start
// Bắt đầu chạy experiment
// =============================================================================
router.post(
  '/experiments/:id/start',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    logger.info(`[ABTesting] Starting experiment ${id}`);
    const experiment = abTestingService.startExperiment(id);

    res.json({
      success: true,
      message: `Experiment "${experiment.name}" đã bắt đầu chạy`,
      data: experiment,
    });
  })
);

// =============================================================================
// POST /api/ab-testing/experiments/:id/pause
// Tạm dừng experiment
// =============================================================================
router.post(
  '/experiments/:id/pause',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    logger.info(`[ABTesting] Pausing experiment ${id}`);
    const experiment = abTestingService.pauseExperiment(id);

    res.json({
      success: true,
      message: `Experiment "${experiment.name}" đã tạm dừng`,
      data: experiment,
    });
  })
);

// =============================================================================
// POST /api/ab-testing/experiments/:id/conclude
// Kết thúc experiment (có thể chỉ định winner)
// =============================================================================
router.post(
  '/experiments/:id/conclude',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { winnerId } = req.body;

    logger.info(`[ABTesting] Concluding experiment ${id}${winnerId ? ` (winner: ${winnerId})` : ''}`);
    const result = abTestingService.concludeExperiment(id, winnerId);

    res.json({
      success: true,
      message: 'Experiment đã kết thúc',
      data: result,
    });
  })
);

// =============================================================================
// GET /api/ab-testing/experiments/:id/results
// Phân tích kết quả experiment
// =============================================================================
router.get(
  '/experiments/:id/results',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = abTestingService.analyzeResults(id);

    res.json({
      success: true,
      data: result,
    });
  })
);

// =============================================================================
// POST /api/ab-testing/experiments/:id/track
// Track events cho experiment
// Supports: assessment, hitl_outcome, satisfaction, custom
// =============================================================================
router.post(
  '/experiments/:id/track',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { type, userId, data: eventData } = req.body;

    if (!type || !userId) {
      res.status(400).json({
        success: false,
        error: 'Cần: type (string), userId (string)',
      });
      return;
    }

    switch (type) {
      case 'assessment':
        abTestingService.trackAssessment(id, userId, {
          riskScore: eventData?.riskScore ?? 0,
          wasHITLActivated: eventData?.wasHITLActivated ?? false,
        });
        break;

      case 'hitl_outcome':
        abTestingService.trackHITLOutcome(
          id,
          userId,
          eventData?.wasActualCrisis ?? false
        );
        break;

      case 'satisfaction':
        abTestingService.trackSatisfaction(
          id,
          userId,
          eventData?.score ?? 3
        );
        break;

      case 'custom':
        if (!eventData?.eventName) {
          res.status(400).json({
            success: false,
            error: 'Custom events cần data.eventName',
          });
          return;
        }
        abTestingService.trackCustomEvent(
          id,
          userId,
          eventData.eventName,
          eventData.value ?? 1
        );
        break;

      default:
        res.status(400).json({
          success: false,
          error: `Unknown event type: ${type}. Supported: assessment, hitl_outcome, satisfaction, custom`,
        });
        return;
    }

    res.json({
      success: true,
      message: `Event "${type}" tracked for user ${userId}`,
    });
  })
);

// =============================================================================
// GET /api/ab-testing/user/:userId/config
// Lấy active config cho user (merged từ tất cả running experiments)
// =============================================================================
router.get(
  '/user/:userId/config',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const config = abTestingService.getActiveConfigForUser(userId);

    res.json({
      success: true,
      data: {
        userId,
        activeConfig: config,
        runningExperiments: abTestingService.getRunningExperiments().length,
      },
    });
  })
);

// =============================================================================
// GET /api/ab-testing/user/:userId/variant/:experimentId
// Lấy variant assignment cho user trong experiment cụ thể
// =============================================================================
router.get(
  '/user/:userId/variant/:experimentId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, experimentId } = req.params;

    const variant = abTestingService.getVariantForUser(experimentId, userId);

    if (!variant) {
      res.status(404).json({
        success: false,
        error: 'Experiment không tồn tại hoặc không đang chạy',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        userId,
        experimentId,
        variant: {
          id: variant.id,
          name: variant.name,
          config: variant.config,
        },
      },
    });
  })
);

export default router;
