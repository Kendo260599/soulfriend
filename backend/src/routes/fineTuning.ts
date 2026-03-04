/**
 * AUTO FINE-TUNING API ROUTES
 *
 * API endpoints để quản lý Auto Fine-Tuning Pipeline:
 *   - Xem trạng thái pipeline
 *   - Trigger tuning cycle thủ công
 *   - Approve/Reject/Rollback tuning cycles
 *   - Xem lịch sử tuning
 *
 * Tất cả routes yêu cầu expert authentication.
 *
 * @module routes/fineTuning
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import { autoFineTuningService } from '../services/autoFineTuningService';
import logger from '../utils/logger';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticateExpert } from './expertAuth';

const router = Router();

// All fine-tuning routes require expert authentication
router.use(authenticateExpert);

// =============================================================================
// GET /api/fine-tuning/status
// Lấy trạng thái hiện tại của fine-tuning pipeline
// =============================================================================
router.get(
  '/status',
  asyncHandler(async (_req: Request, res: Response) => {
    const status = autoFineTuningService.getStatus();
    const latestCycle = autoFineTuningService.getLatestCycle();

    res.json({
      success: true,
      data: {
        ...status,
        latestCycle: latestCycle
          ? {
              id: latestCycle.id,
              status: latestCycle.status,
              createdAt: latestCycle.createdAt,
              sampleCount: latestCycle.sampleCount,
              appliedAt: latestCycle.appliedAt,
            }
          : null,
        appliedSourceWeights: Object.fromEntries(
          autoFineTuningService.getAppliedSourceWeights()
        ),
        appliedKeywordWeights: Object.fromEntries(
          autoFineTuningService.getAppliedKeywordWeights()
        ),
      },
    });
  })
);

// =============================================================================
// POST /api/fine-tuning/trigger
// Trigger tuning cycle thủ công (không cần đợi timer)
// =============================================================================
router.post(
  '/trigger',
  asyncHandler(async (_req: Request, res: Response) => {
    logger.info('[FineTuning] Manual trigger requested by expert');

    const cycle = await autoFineTuningService.checkAndTrigger();

    if (!cycle) {
      res.json({
        success: true,
        message: 'Không đủ dữ liệu mới để tạo tuning cycle',
        data: null,
      });
      return;
    }

    res.json({
      success: true,
      message: `Tuning cycle ${cycle.id} đã được tạo`,
      data: cycle,
    });
  })
);

// =============================================================================
// POST /api/fine-tuning/approve/:cycleId
// Approve một pending tuning cycle
// =============================================================================
router.post(
  '/approve/:cycleId',
  asyncHandler(async (req: Request, res: Response) => {
    const { cycleId } = req.params;

    logger.info(`[FineTuning] Approving cycle ${cycleId}`);
    const cycle = await autoFineTuningService.approveCycle(cycleId);

    res.json({
      success: true,
      message: `Tuning cycle ${cycleId} đã được approve và apply`,
      data: cycle,
    });
  })
);

// =============================================================================
// POST /api/fine-tuning/reject/:cycleId
// Reject một pending tuning cycle
// =============================================================================
router.post(
  '/reject/:cycleId',
  asyncHandler(async (req: Request, res: Response) => {
    const { cycleId } = req.params;
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp lý do từ chối (reason)',
      });
      return;
    }

    logger.info(`[FineTuning] Rejecting cycle ${cycleId}: ${reason}`);
    const cycle = autoFineTuningService.rejectCycle(cycleId, reason);

    res.json({
      success: true,
      message: `Tuning cycle ${cycleId} đã bị reject`,
      data: cycle,
    });
  })
);

// =============================================================================
// POST /api/fine-tuning/rollback/:cycleId
// Rollback một applied tuning cycle
// =============================================================================
router.post(
  '/rollback/:cycleId',
  asyncHandler(async (req: Request, res: Response) => {
    const { cycleId } = req.params;
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp lý do rollback (reason)',
      });
      return;
    }

    logger.info(`[FineTuning] Rolling back cycle ${cycleId}: ${reason}`);
    const cycle = autoFineTuningService.rollbackCycle(cycleId, reason);

    res.json({
      success: true,
      message: `Tuning cycle ${cycleId} đã được rollback`,
      data: cycle,
    });
  })
);

// =============================================================================
// POST /api/fine-tuning/evaluate/:cycleId
// Đánh giá hiệu quả của một applied tuning cycle
// =============================================================================
router.post(
  '/evaluate/:cycleId',
  asyncHandler(async (req: Request, res: Response) => {
    const { cycleId } = req.params;

    logger.info(`[FineTuning] Evaluating cycle ${cycleId}`);
    const result = await autoFineTuningService.evaluateCycle(cycleId);

    res.json({
      success: true,
      data: result,
    });
  })
);

// =============================================================================
// GET /api/fine-tuning/history
// Lấy lịch sử tất cả tuning cycles
// =============================================================================
router.get(
  '/history',
  asyncHandler(async (_req: Request, res: Response) => {
    const history = autoFineTuningService.getTuningHistory();

    res.json({
      success: true,
      data: {
        total: history.length,
        cycles: history.map(cycle => ({
          id: cycle.id,
          status: cycle.status,
          createdAt: cycle.createdAt,
          sampleCount: cycle.sampleCount,
          appliedAt: cycle.appliedAt,
          rolledBackAt: cycle.rolledBackAt,
          reason: cycle.reason,
          metricsBefore: cycle.metricsBefore,
          metricsAfter: cycle.metricsAfter,
          proposedChanges: {
            keywordsToAdd: cycle.proposedChanges.keywordsToAdd.length,
            keywordsToRemove: cycle.proposedChanges.keywordsToRemove.length,
            keywordsToAdjust: cycle.proposedChanges.keywordsToAdjust.length,
            sourceWeightAdjustments: cycle.proposedChanges.sourceWeightAdjustments.length,
          },
        })),
      },
    });
  })
);

// =============================================================================
// GET /api/fine-tuning/cycle/:cycleId
// Chi tiết một tuning cycle cụ thể
// =============================================================================
router.get(
  '/cycle/:cycleId',
  asyncHandler(async (req: Request, res: Response) => {
    const { cycleId } = req.params;
    const history = autoFineTuningService.getTuningHistory();
    const cycle = history.find(c => c.id === cycleId);

    if (!cycle) {
      res.status(404).json({
        success: false,
        error: `Không tìm thấy tuning cycle ${cycleId}`,
      });
      return;
    }

    res.json({
      success: true,
      data: cycle,
    });
  })
);

export default router;
