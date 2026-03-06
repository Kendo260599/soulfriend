/**
 * V5 EXPERIMENT ROUTES
 * 
 * API endpoints cho AI Experimentation System
 * A/B testing, variant assignment, experiment analysis
 * 
 * @module routes/v5/experiments
 * @version 5.0.0
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authenticateAdmin } from '../../middleware/auth';
import { authenticateExpert } from '../expertAuth';
import { aiExperimentEngine } from '../../services/aiExperimentEngine';
import { eventQueueService } from '../../services/eventQueueService';

const router = Router();

/**
 * POST /api/v5/experiments
 * Tạo experiment mới
 */
router.post(
  '/',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description, variants, targetUserPercentage } = req.body;

    if (!name || !variants || !Array.isArray(variants) || variants.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'name và ít nhất 2 variants là bắt buộc',
      });
    }

    const experiment = await aiExperimentEngine.createExperiment({
      name,
      description: description || '',
      variants,
      metrics: req.body.metrics || ['session_length', 'helpfulness_rating'],
      startDate: req.body.startDate ? new Date(req.body.startDate) : new Date(),
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      minSampleSize: req.body.minSampleSize || 100,
    });

    await eventQueueService.publish('experiment.started', {
      experimentId: experiment._id,
      name,
      variantCount: variants.length,
    });

    res.json({ success: true, data: experiment, message: 'Experiment created and started' });
  })
);

/**
 * GET /api/v5/experiments/active
 * Lấy danh sách experiments đang chạy
 */
router.get(
  '/active',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const experiments = await aiExperimentEngine.getActiveExperiments();
    res.json({ success: true, data: experiments, count: experiments.length });
  })
);

/**
 * GET /api/v5/experiments/:experimentId/assign/:userId
 * Assign user vào variant (deterministic)
 */
router.get(
  '/:experimentId/assign/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { experimentId, userId } = req.params;
    const variant = await aiExperimentEngine.assignVariant(experimentId, userId);
    
    if (!variant) {
      return res.status(404).json({ success: false, error: 'Experiment not found or not active' });
    }
    
    res.json({ success: true, data: { variant } });
  })
);

/**
 * GET /api/v5/experiments/:experimentId/analyze
 * Phân tích kết quả experiment
 */
router.get(
  '/:experimentId/analyze',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const { experimentId } = req.params;
    const analysis = await aiExperimentEngine.analyzeExperiment(experimentId);
    
    if (!analysis) {
      return res.status(404).json({ success: false, error: 'Experiment not found' });
    }
    
    res.json({ success: true, data: analysis });
  })
);

/**
 * POST /api/v5/experiments/:experimentId/end
 * Kết thúc experiment & chọn winner
 */
router.post(
  '/:experimentId/end',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { experimentId } = req.params;
    const { winningVariant } = req.body;

    if (!winningVariant) {
      return res.status(400).json({ success: false, error: 'winningVariant is required' });
    }

    const experiment = await aiExperimentEngine.endExperiment(experimentId, winningVariant);
    
    if (!experiment) {
      return res.status(404).json({ success: false, error: 'Experiment not found' });
    }

    await eventQueueService.publish('experiment.completed', {
      experimentId,
      winningVariant,
    });

    res.json({ success: true, data: experiment, message: 'Experiment ended' });
  })
);

export default router;
