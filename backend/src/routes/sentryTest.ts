/**
 * Sentry Test Routes
 * Test endpoints for validating Sentry error tracking
 */

import { Router, Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { captureException, captureMessage } from '../config/sentry';

const router = Router();

/**
 * Test route - intentional error
 * GET /api/test/sentry/error
 */
router.get('/error', (req: Request, res: Response) => {
  try {
    throw new Error('Test error from Sentry test endpoint');
  } catch (error) {
    captureException(error as Error, {
      endpoint: '/api/test/sentry/error',
      timestamp: new Date().toISOString(),
    });
    res.status(500).json({
      error: 'Test error captured',
      message: 'Error has been sent to Sentry',
      sentryEnabled: process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true',
    });
  }
});

/**
 * Test route - capture message
 * GET /api/test/sentry/message
 */
router.get('/message', (req: Request, res: Response) => {
  captureMessage('Test message from Sentry test endpoint', 'info');
  res.json({
    message: 'Test message sent to Sentry',
    level: 'info',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Test route - uncaught error (will be caught by Sentry middleware)
 * GET /api/test/sentry/uncaught
 */
router.get('/uncaught', (req: Request, res: Response) => {
  // This will be caught by Sentry's error handler
  throw new Error('Uncaught test error - should be captured by Sentry middleware');
});

/**
 * Status route - check Sentry configuration
 * GET /api/test/sentry/status
 */
router.get('/status', (req: Request, res: Response) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isEnabled = process.env.SENTRY_ENABLED === 'true';
  const dsnConfigured = !!process.env.SENTRY_DSN;

  res.json({
    sentry: {
      enabled: isProduction || isEnabled,
      configured: dsnConfigured,
      environment: process.env.NODE_ENV || 'development',
      dsnPresent: dsnConfigured ? 'Yes (hidden for security)' : 'No',
    },
    message: isProduction || isEnabled 
      ? 'Sentry is active and monitoring errors'
      : 'Sentry is disabled. Set SENTRY_ENABLED=true or NODE_ENV=production to enable',
    testEndpoints: {
      error: '/api/test/sentry/error',
      message: '/api/test/sentry/message',
      uncaught: '/api/test/sentry/uncaught',
    },
  });
});

export default router;
