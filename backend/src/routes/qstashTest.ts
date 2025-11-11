/**
 * QStash Test Routes
 * Development-only endpoints to test QStash functionality
 */

import { Router, Request, Response } from 'express';
import { qstashService } from '../config/qstash';

const router = Router();

/**
 * Test QStash - Send immediate message
 * GET /api/test/qstash/send
 */
router.get('/send', async (req: Request, res: Response) => {
  try {
    console.log('🧪 Testing QStash message sending...');

    const testPayload = {
      message: 'QStash test message',
      timestamp: Date.now(),
      testId: Math.random().toString(36).substring(7),
    };

    const webhookUrl = `${process.env.API_BASE_URL || 'https://soulfriend-api.onrender.com'}/api/webhooks/qstash/alert`;

    const success = await qstashService.publishMessage(
      webhookUrl,
      testPayload,
      { delay: 10 } // 10 seconds delay for testing
    );

    if (success) {
      res.json({
        success: true,
        message: 'QStash test message sent successfully! Webhook will be called in 10 seconds.',
        testPayload,
        webhookUrl,
        nextStep: 'Check webhook logs in 10 seconds',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send QStash message',
        qstashConfigured: qstashService.isReady(),
      });
    }
  } catch (error) {
    console.error('❌ QStash test error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Test QStash - Delayed alert
 * POST /api/test/qstash/delayed-alert
 */
router.post('/delayed-alert', async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId || 'test-user-123';
    const delaySeconds = req.body.delaySeconds || 30;

    console.log(`🧪 Testing delayed alert for user: ${userId}, delay: ${delaySeconds}s`);

    const alertData = {
      severity: 'test',
      message: 'This is a test alert',
      timestamp: Date.now(),
    };

    const success = await qstashService.sendDelayedAlert(userId, alertData, delaySeconds);

    if (success) {
      res.json({
        success: true,
        message: `Delayed alert scheduled for ${delaySeconds} seconds`,
        userId,
        alertData,
        expectedDelivery: new Date(Date.now() + delaySeconds * 1000).toISOString(),
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to schedule delayed alert',
      });
    }
  } catch (error) {
    console.error('❌ Delayed alert test error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Test QStash - Schedule daily report
 * POST /api/test/qstash/schedule-report
 */
router.post('/schedule-report', async (req: Request, res: Response) => {
  try {
    const cronExpression = req.body.cron || '*/5 * * * *'; // Every 5 minutes for testing

    console.log(`🧪 Testing daily report scheduling with cron: ${cronExpression}`);

    const messageId = await qstashService.scheduleDailyReport(cronExpression);

    if (messageId) {
      res.json({
        success: true,
        message: 'Daily report scheduled successfully',
        messageId,
        cronExpression,
        nextRun: 'Check cron schedule',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to schedule daily report',
      });
    }
  } catch (error) {
    console.error('❌ Schedule report test error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * QStash Status Check
 * GET /api/test/qstash/status
 */
router.get('/status', (req: Request, res: Response) => {
  const status = {
    qstashReady: qstashService.isReady(),
    qstashConfigured: !!process.env.QSTASH_TOKEN,
    apiBaseUrl: process.env.API_BASE_URL || 'https://soulfriend-api.onrender.com',
    webhookEndpoints: {
      alert: `${process.env.API_BASE_URL || 'https://soulfriend-api.onrender.com'}/api/webhooks/qstash/alert`,
      dailyReport: `${process.env.API_BASE_URL || 'https://soulfriend-api.onrender.com'}/api/webhooks/qstash/daily-report`,
    },
    environment: process.env.NODE_ENV || 'development',
  };

  res.json(status);
});

/**
 * Full QStash Integration Test
 * GET /api/test/qstash/full-test
 */
router.get('/full-test', async (req: Request, res: Response) => {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: [],
  };

  try {
    // Test 1: QStash Ready
    console.log('🧪 Test 1: Checking QStash status...');
    const isReady = qstashService.isReady();
    results.tests.push({
      name: 'QStash Initialization',
      status: isReady ? 'PASS' : 'FAIL',
      details: isReady ? 'QStash client is ready' : 'QStash client not initialized',
    });

    if (!isReady) {
      return res.json(results);
    }

    // Test 2: Send Immediate Message
    console.log('🧪 Test 2: Sending immediate message...');
    const webhookUrl = `${process.env.API_BASE_URL || 'https://soulfriend-api.onrender.com'}/api/webhooks/qstash/alert`;
    
    const immediateSuccess = await qstashService.publishMessage(
      webhookUrl,
      { test: 'immediate', timestamp: Date.now() },
      { delay: 5 }
    );

    results.tests.push({
      name: 'Send Immediate Message',
      status: immediateSuccess ? 'PASS' : 'FAIL',
      details: immediateSuccess
        ? 'Message sent successfully (5s delay)'
        : 'Failed to send message',
    });

    // Test 3: Send Delayed Alert
    console.log('🧪 Test 3: Sending delayed alert...');
    const delayedSuccess = await qstashService.sendDelayedAlert(
      'test-user-123',
      { severity: 'test', message: 'Test alert' },
      10
    );

    results.tests.push({
      name: 'Send Delayed Alert',
      status: delayedSuccess ? 'PASS' : 'FAIL',
      details: delayedSuccess
        ? 'Delayed alert scheduled (10s delay)'
        : 'Failed to schedule alert',
    });

    // Summary
    const passCount = results.tests.filter((t: any) => t.status === 'PASS').length;
    const totalCount = results.tests.length;

    results.summary = {
      total: totalCount,
      passed: passCount,
      failed: totalCount - passCount,
      successRate: `${Math.round((passCount / totalCount) * 100)}%`,
    };

    results.nextSteps = [
      'Wait 5-10 seconds',
      'Check Render logs for webhook calls',
      'Verify messages in Upstash QStash dashboard',
    ];

    res.json(results);
  } catch (error) {
    results.error = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json(results);
  }
});

export default router;
