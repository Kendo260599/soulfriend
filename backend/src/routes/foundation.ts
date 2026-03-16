import { Router, Request, Response } from 'express';
import { getFoundationLesson, getFoundationProgress } from '../services/foundationBridgeService';

const router = Router();

router.get('/lesson', async (req: Request, res: Response) => {
  try {
    const learnerId = Number(req.query.learnerId || 1);
    const data = await getFoundationLesson(Number.isFinite(learnerId) ? learnerId : 1);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({
      message: error?.message || 'Failed to load foundation lesson',
    });
  }
});

router.get('/progress', async (req: Request, res: Response) => {
  try {
    const learnerId = Number(req.query.learnerId || 1);
    const data = await getFoundationProgress(Number.isFinite(learnerId) ? learnerId : 1);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({
      message: error?.message || 'Failed to load foundation progress',
    });
  }
});

export default router;
