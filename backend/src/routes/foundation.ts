import { Router, Request, Response } from 'express';
import {
  getFoundationCurriculum,
  getFoundationLesson,
  getFoundationProgress,
  getFoundationTrackLesson,
} from '../services/foundationBridgeService';

const router = Router();

router.get('/lesson', async (req: Request, res: Response) => {
  try {
    const learnerId = Number(req.query.learnerId || 1);
    const trackRaw = String(req.query.track || '').trim().toLowerCase();
    const lessonId = String(req.query.lessonId || '').trim();
    const finalLearnerId = Number.isFinite(learnerId) ? learnerId : 1;

    if (trackRaw && trackRaw !== 'grammar' && trackRaw !== 'vocab') {
      res.status(400).json({
        message: "Track must be 'grammar' or 'vocab'.",
      });
      return;
    }

    const data = trackRaw && lessonId
      ? await getFoundationTrackLesson(trackRaw, lessonId, finalLearnerId)
      : await getFoundationLesson(finalLearnerId);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({
      message: error?.message || 'Failed to load foundation lesson',
    });
  }
});

router.get('/curriculum', async (_req: Request, res: Response) => {
  try {
    const data = await getFoundationCurriculum();
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({
      message: error?.message || 'Failed to load foundation curriculum',
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
