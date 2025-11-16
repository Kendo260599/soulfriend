/**
 * SENTRY TEST ROUTES
 * Thêm các routes này vào backend để test Sentry
 * Thêm vào backend/src/index.ts hoặc simple-server.ts
 */

import { Router, Request, Response } from 'express';
import {
  captureException,
  captureMessage,
  logger,
  setUserContext,
  addBreadcrumb,
  withSpan
} from '../config/sentry';

const router = Router();

// ============================================================================
// TEST 1: Basic Error Tracking
// ============================================================================

router.get('/error', (req: Request, res: Response) => {
  try {
    // Simulate an error
    throw new Error('Test error from Sentry test route');
  } catch (error) {
    if (error instanceof Error) {
      captureException(error, {
        action: 'test_error',
        endpoint: '/api/test/sentry/error',
        timestamp: new Date().toISOString()
      });
    }
    
    res.status(500).json({
      message: 'Error captured! Check your Sentry dashboard',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// TEST 2: Logging Levels
// ============================================================================

router.get('/logs', (req: Request, res: Response) => {
  // Test different log levels
  logger.debug('This is a debug log', { testId: 1 });
  logger.info('This is an info log', { testId: 2 });
  logger.warn('This is a warning log', { testId: 3 });
  logger.error('This is an error log', { testId: 4 });
  
  res.json({
    message: 'Logs sent! Check your Sentry dashboard',
    logs: ['debug', 'info', 'warn', 'error']
  });
});

// ============================================================================
// TEST 3: User Context
// ============================================================================

router.get('/user-context', (req: Request, res: Response) => {
  // Set user context
  setUserContext('test-user-123', 'test@example.com', 'Test User');
  
  // Log with user context
  logger.info('User context set successfully', {
    userId: 'test-user-123',
    action: 'test_user_context'
  });
  
  // Throw error to see user info in Sentry
  const error = new Error('Test error with user context');
  captureException(error, {
    action: 'test_user_context'
  });
  
  res.json({
    message: 'User context set and error captured!',
    userId: 'test-user-123',
    email: 'test@example.com'
  });
});

// ============================================================================
// TEST 4: Breadcrumbs
// ============================================================================

router.get('/breadcrumbs', (req: Request, res: Response) => {
  // Add breadcrumbs
  addBreadcrumb('User started action', 'user', 'info', {
    action: 'test_breadcrumbs'
  });
  
  addBreadcrumb('Fetching data from database', 'query', 'info', {
    table: 'users'
  });
  
  addBreadcrumb('Processing data', 'process', 'info', {
    itemCount: 10
  });
  
  // Capture error with breadcrumbs
  const error = new Error('Test error with breadcrumbs');
  captureException(error, {
    action: 'test_breadcrumbs'
  });
  
  res.json({
    message: 'Breadcrumbs added and error captured!',
    breadcrumbs: 3
  });
});

// ============================================================================
// TEST 5: Performance Tracking
// ============================================================================

router.get('/performance', async (req: Request, res: Response) => {
  try {
    // Track slow operation
    const result = await withSpan('test.slow_operation', async () => {
      // Simulate slow operation
      await new Promise(resolve => setTimeout(resolve, 500));
      return { processed: 100 };
    });
    
    // Track fast operation
    const result2 = await withSpan('test.fast_operation', async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return { processed: 10 };
    });
    
    res.json({
      message: 'Performance tracked! Check Sentry Performance tab',
      operations: ['slow_operation', 'fast_operation'],
      results: [result, result2]
    });
  } catch (error) {
    if (error instanceof Error) {
      captureException(error);
    }
    res.status(500).json({ error: 'Performance test failed' });
  }
});

// ============================================================================
// TEST 6: Message Capture (Non-Error Events)
// ============================================================================

router.get('/message', (req: Request, res: Response) => {
  // Capture important messages
  captureMessage('Important: User completed onboarding', 'info');
  logger.info('User completed onboarding', {
    userId: 'test-123',
    completionTime: 300,
    stepsCompleted: 5
  });
  
  captureMessage('Warning: High API usage detected', 'warning');
  logger.warn('High API usage detected', {
    apiCalls: 950,
    limit: 1000,
    percentage: 95
  });
  
  res.json({
    message: 'Messages captured! Check your Sentry dashboard',
    messages: ['info', 'warning']
  });
});

// ============================================================================
// TEST 7: Async Error in Database Operation
// ============================================================================

router.get('/db-error', async (req: Request, res: Response) => {
  try {
    addBreadcrumb('Starting database query', 'database', 'info');
    
    // Simulate database error
    await withSpan('database.query', async () => {
      throw new Error('Database connection timeout');
    });
    
    res.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      captureException(error, {
        action: 'database_query',
        errorType: 'database',
        query: 'SELECT * FROM users'
      });
    }
    
    res.status(500).json({
      message: 'Database error captured!',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// TEST 8: Multiple Errors in Sequence
// ============================================================================

router.get('/multiple-errors', (req: Request, res: Response) => {
  // Simulate multiple errors
  const errors = [
    { type: 'ValidationError', message: 'Invalid email format' },
    { type: 'AuthError', message: 'Invalid credentials' },
    { type: 'RateLimitError', message: 'Too many requests' }
  ];
  
  errors.forEach((errData) => {
    const error = new Error(errData.message);
    error.name = errData.type;
    
    captureException(error, {
      errorType: errData.type,
      action: 'test_multiple_errors'
    });
  });
  
  res.json({
    message: 'Multiple errors captured!',
    errorCount: errors.length,
    errors: errors.map(e => e.type)
  });
});

// ============================================================================
// TEST 9: Complete Workflow Test
// ============================================================================

router.post('/complete-workflow', async (req: Request, res: Response) => {
  try {
    // 1. Set user context
    const userId = req.body.userId || 'test-user-123';
    setUserContext(userId, `${userId}@example.com`);
    
    // 2. Add breadcrumbs for each step
    addBreadcrumb('User started test submission', 'user', 'info', { userId });
    
    // 3. Simulate validation
    await withSpan('validation.checkInput', async () => {
      addBreadcrumb('Validating input', 'validation', 'info');
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // 4. Simulate database save
    await withSpan('database.saveTest', async () => {
      addBreadcrumb('Saving to database', 'database', 'info');
      await new Promise(resolve => setTimeout(resolve, 200));
    });
    
    // 5. Simulate external API call
    await withSpan('api.sendNotification', async () => {
      addBreadcrumb('Sending notification', 'api', 'info');
      await new Promise(resolve => setTimeout(resolve, 150));
    });
    
    // 6. Log success
    logger.info('Complete workflow finished successfully', {
      userId,
      duration: 450,
      steps: ['validation', 'database', 'notification']
    });
    
    res.json({
      message: 'Complete workflow tracked!',
      userId,
      steps: 3,
      duration: 450
    });
  } catch (error) {
    if (error instanceof Error) {
      captureException(error, {
        action: 'complete_workflow',
        userId: req.body.userId
      });
    }
    res.status(500).json({ error: 'Workflow failed' });
  }
});

// ============================================================================
// TEST 10: Intentional Crash (Use with caution!)
// ============================================================================

router.get('/crash', (req: Request, res: Response) => {
  logger.warn('Intentional crash test initiated');
  
  // This will crash the server - use only in development!
  process.nextTick(() => {
    throw new Error('INTENTIONAL CRASH TEST - Server will restart');
  });
  
  res.json({
    message: 'Crash initiated! Server will restart.',
    warning: 'This is for testing only!'
  });
});

export default router;

// ============================================================================
// USAGE IN YOUR MAIN SERVER FILE
// ============================================================================

/*
// In backend/src/index.ts or simple-server.ts:

import sentryTestRoutes from './routes/sentryTestRoutes';

// Add routes (after Sentry initialization)
app.use('/api', sentryTestRoutes);

// Now you can test:
// GET  http://localhost:5000/api/test/sentry/error
// GET  http://localhost:5000/api/test/sentry/logs
// GET  http://localhost:5000/api/test/sentry/user-context
// GET  http://localhost:5000/api/test/sentry/breadcrumbs
// GET  http://localhost:5000/api/test/sentry/performance
// GET  http://localhost:5000/api/test/sentry/message
// GET  http://localhost:5000/api/test/sentry/db-error
// GET  http://localhost:5000/api/test/sentry/multiple-errors
// POST http://localhost:5000/api/test/sentry/complete-workflow
// GET  http://localhost:5000/api/test/sentry/crash (USE WITH CAUTION!)
*/
