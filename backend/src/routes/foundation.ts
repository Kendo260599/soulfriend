import { Router, Request, Response } from 'express';
import {
  getFoundationCurriculum,
  getFoundationLesson,
  getFoundationProgress,
  getFoundationReview,
  getFoundationTrackLesson,
  submitFoundationGrammarCheck,
  submitFoundationReview,
  submitFoundationVocabCheck,
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

router.post('/vocab-check', async (req: Request, res: Response) => {
  try {
    const learnerIdRaw = Number(req.body?.learnerId || 1);
    const lessonId = String(req.body?.lessonId || '').trim();
    const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
    const learnerId = Number.isFinite(learnerIdRaw) ? learnerIdRaw : 1;

    if (!lessonId) {
      res.status(400).json({
        message: 'lessonId is required.',
      });
      return;
    }

    if (!answers.length) {
      res.status(400).json({
        message: 'answers must be a non-empty array.',
      });
      return;
    }

    const normalizedAnswers: Array<{ wordId: number; correct: boolean }> = answers.map((item: any) => ({
      wordId: Number(item?.wordId),
      correct: Boolean(item?.correct),
    }));

    if (normalizedAnswers.some((item: { wordId: number; correct: boolean }) => !Number.isFinite(item.wordId) || item.wordId <= 0)) {
      res.status(400).json({
        message: 'Each answer must include a valid wordId.',
      });
      return;
    }

    const data = await submitFoundationVocabCheck(learnerId, lessonId, normalizedAnswers);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({
      message: error?.message || 'Failed to submit vocab check',
    });
  }
});

router.post('/grammar-check', async (req: Request, res: Response) => {
  try {
    const learnerIdRaw = Number(req.body?.learnerId || 1);
    const lessonId = String(req.body?.lessonId || '').trim();
    const grammarIdRaw = Number(req.body?.grammarId);
    const learnerId = Number.isFinite(learnerIdRaw) ? learnerIdRaw : 1;

    if (!lessonId) {
      res.status(400).json({
        message: 'lessonId is required.',
      });
      return;
    }

    if (!Number.isFinite(grammarIdRaw) || grammarIdRaw <= 0) {
      res.status(400).json({
        message: 'grammarId must be a positive number.',
      });
      return;
    }

    if (typeof req.body?.correct !== 'boolean') {
      res.status(400).json({
        message: 'correct must be a boolean.',
      });
      return;
    }

    const data = await submitFoundationGrammarCheck(learnerId, lessonId, grammarIdRaw, req.body.correct);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({
      message: error?.message || 'Failed to submit grammar check',
    });
  }
});

router.get('/review', async (req: Request, res: Response) => {
  try {
    const learnerId = Number(req.query.learnerId || 1);
    const limit = Number(req.query.limit || 20);
    const finalLearnerId = Number.isFinite(learnerId) ? learnerId : 1;
    const finalLimit = Number.isFinite(limit) ? limit : 20;

    const data = await getFoundationReview(finalLearnerId, finalLimit);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({
      message: error?.message || 'Failed to load foundation review queue',
    });
  }
});

router.post('/review-submit', async (req: Request, res: Response) => {
  try {
    const learnerIdRaw = Number(req.body?.learnerId || 1);
    const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
    const learnerId = Number.isFinite(learnerIdRaw) ? learnerIdRaw : 1;

    if (!answers.length) {
      res.status(400).json({
        message: 'answers must be a non-empty array.',
      });
      return;
    }

    const normalizedAnswers: Array<{ wordId: number; correct: boolean }> = answers.map((item: any) => ({
      wordId: Number(item?.wordId),
      correct: Boolean(item?.correct),
    }));

    if (normalizedAnswers.some((item: { wordId: number; correct: boolean }) => !Number.isFinite(item.wordId) || item.wordId <= 0)) {
      res.status(400).json({
        message: 'Each answer must include a valid wordId.',
      });
      return;
    }

    const data = await submitFoundationReview(learnerId, normalizedAnswers);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({
      message: error?.message || 'Failed to submit foundation review',
    });
  }
});

export default router;
