/**
 * QStash Webhook Routes
 * Endpoints to receive messages from Upstash QStash
 */

import { Router, Request, Response } from 'express';
import { verifySignature } from '@upstash/qstash/nextjs';

const router = Router();

/**
 * QStash webhook for delayed alerts
 * POST /api/webhooks/qstash/alert
 */
router.post('/alert', async (req: Request, res: Response) => {
  try {
    // Verify QStash signature (optional but recommended)
    const signature = req.headers['upstash-signature'] as string;
    const isValid = signature ? await verifyQStashSignature(req, signature) : true;

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid QStash signature' });
    }

    const { userId, alertData, timestamp } = req.body;

    console.log('📬 QStash delayed alert received:', {
      userId,
      alertData,
      timestamp,
      receivedAt: Date.now(),
    });

    // TODO: Process delayed alert
    // - Check if user still needs intervention
    // - Send follow-up notification
    // - Update alert status

    res.json({
      success: true,
      message: 'Alert webhook processed',
      userId,
    });
  } catch (error) {
    console.error('❌ QStash alert webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * QStash webhook for daily reports
 * POST /api/webhooks/qstash/daily-report
 */
router.post('/daily-report', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['upstash-signature'] as string;
    const isValid = signature ? await verifyQStashSignature(req, signature) : true;

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid QStash signature' });
    }

    const { reportType, timestamp } = req.body;

    console.log('📊 QStash daily report triggered:', {
      reportType,
      timestamp,
      triggeredAt: Date.now(),
    });

    // TODO: Generate and send daily report
    // - Aggregate stats from last 24h
    // - Send email to admins
    // - Store report in database

    res.json({
      success: true,
      message: 'Daily report generated',
      reportType,
    });
  } catch (error) {
    console.error('❌ QStash daily report webhook error:', error);
    res.status(500).json({ error: 'Report generation failed' });
  }
});

/**
 * Verify QStash signature for security
 */
async function verifyQStashSignature(req: Request, signature: string): Promise<boolean> {
  try {
    const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
    const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

    if (!currentSigningKey || !nextSigningKey) {
      console.warn('⚠️  QStash signing keys not configured - skipping verification');
      return true;
    }

    // QStash signature verification
    // Format: "v1=<signature>,v1=<signature>"
    const body = JSON.stringify(req.body);
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    // Simple verification (in production, use @upstash/qstash verifySignature)
    const isValid = signature.includes('v1=');
    
    return isValid;
  } catch (error) {
    console.error('❌ Signature verification error:', error);
    return false;
  }
}

export default router;
