/**
 * EXAMPLE: Server Integration with HITL Feedback Loop
 *
 * Ví dụ về cách tích hợp HITL Feedback vào backend server
 */

import express from 'express';
import cors from 'cors';
import { criticalInterventionService } from './services/criticalInterventionService';
import { hitlFeedbackService } from './services/hitlFeedbackService';
import hitlFeedbackRouter from './routes/hitlFeedback';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// =============================================================================
// HITL FEEDBACK ROUTES
// =============================================================================

// Mount HITL feedback routes
app.use('/api/hitl-feedback', hitlFeedbackRouter);

// =============================================================================
// ALERT RESOLUTION WEBHOOK
// =============================================================================

/**
 * Webhook: When alert is resolved, prompt for feedback
 * This is called when clinical team marks alert as resolved
 */
app.post('/api/alerts/:alertId/resolve', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolution, clinicalMemberId } = req.body;

    // Resolve the alert
    await criticalInterventionService.resolveAlert(alertId, resolution);

    // Send notification to collect feedback
    await sendFeedbackRequest(alertId, clinicalMemberId);

    res.json({
      success: true,
      message: 'Alert resolved. Please provide feedback for AI improvement.',
      feedbackUrl: `/admin/feedback/${alertId}`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Send feedback request to clinical team member
 */
async function sendFeedbackRequest(alertId: string, clinicalMemberId: string) {
  console.log(`📧 Sending feedback request for alert ${alertId} to ${clinicalMemberId}`);

  // TODO: Send email/notification
  // const emailContent = {
  //   to: clinicalMember.email,
  //   subject: 'Feedback Request - Help Improve AI',
  //   body: `
  //     Please provide feedback for alert ${alertId}.
  //     This will help improve the crisis detection AI.
  //
  //     Feedback Form: https://admin.soulfriend.vn/feedback/${alertId}
  //   `
  // };
  // await emailService.send(emailContent);
}

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

/**
 * Daily metrics summary endpoint
 */
app.get('/api/admin/daily-summary', async (req, res) => {
  try {
    // Get metrics from last 24 hours
    const metrics = await hitlFeedbackService.calculatePerformanceMetrics(1);

    // Get improvement suggestions if available
    let improvements = null;
    if (metrics.totalReviewed >= 10) {
      improvements = await hitlFeedbackService.generateModelImprovements();
    }

    res.json({
      success: true,
      date: new Date().toISOString().split('T')[0],
      metrics,
      improvements,
      needsAttention: generateAlerts(metrics),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Generate alerts based on metrics
 */
function generateAlerts(metrics: any): string[] {
  const alerts: string[] = [];

  if (metrics.falsePositiveRate > 0.2) {
    alerts.push('⚠️ High false positive rate - Review keyword performance');
  }

  if (metrics.falseNegativeRate > 0.05) {
    alerts.push('🚨 CRITICAL: High false negative rate - Missing crisis indicators');
  }

  if (metrics.avgResponseTimeSeconds > 180) {
    alerts.push('⏱️ Response time exceeds 3 minutes - Consider staffing');
  }

  if (metrics.interventionSuccessRate < 0.9) {
    alerts.push('📉 Intervention success rate below 90% - Review protocols');
  }

  return alerts;
}

// =============================================================================
// AUTOMATED FINE-TUNING CHECK
// =============================================================================

/**
 * Check if we have enough data for fine-tuning
 * Run this periodically (e.g., daily via cron)
 */
async function checkFineTuningReadiness() {
  const trainingData = hitlFeedbackService.getTrainingData();
  const MINIMUM_SAMPLES = 100;

  if (trainingData.length >= MINIMUM_SAMPLES) {
    console.log(`🤖 Fine-tuning ready! ${trainingData.length} training samples available`);

    // Generate improvements
    const improvements = await hitlFeedbackService.generateModelImprovements();

    // Notify admin
    console.log('📧 Notifying admin about fine-tuning opportunity...');
    // TODO: Send notification

    return {
      ready: true,
      samplesCount: trainingData.length,
      improvements,
    };
  }

  console.log(`📊 Training data: ${trainingData.length}/${MINIMUM_SAMPLES} samples`);
  return {
    ready: false,
    samplesCount: trainingData.length,
    needed: MINIMUM_SAMPLES - trainingData.length,
  };
}

// Endpoint to check fine-tuning readiness
app.get('/api/admin/fine-tuning-status', async (req, res) => {
  const status = await checkFineTuningReadiness();
  res.json({
    success: true,
    ...status,
  });
});

// =============================================================================
// EXAMPLE: Integration with Chatbot
// =============================================================================

/**
 * Enhanced chatbot endpoint with feedback loop integration
 */
app.post('/api/chatbot/message', async (req, res) => {
  try {
    const { message, userId, sessionId } = req.body;

    // Crisis detection logic
    const crisisKeywords = ['tự tử', 'muốn chết', 'không muốn sống'];
    const isCrisis = crisisKeywords.some(kw => message.toLowerCase().includes(kw));

    if (isCrisis) {
      // Create HITL alert
      const alert = await criticalInterventionService.createCriticalAlert(userId, sessionId, {
        riskLevel: 'CRITICAL',
        riskType: 'suicidal',
        userMessage: message,
        detectedKeywords: crisisKeywords.filter(kw => message.toLowerCase().includes(kw)),
      });

      console.log(`🚨 HITL Alert created: ${alert.id}`);

      // Note: When this alert is resolved, feedback will be collected
      // and used to improve crisis detection model
    }

    res.json({
      success: true,
      response: 'Response from chatbot...',
      crisisDetected: isCrisis,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================================================
// SCHEDULED TASKS
// =============================================================================

/**
 * Daily task: Check metrics and send summary
 */
async function dailyMetricsCheck() {
  console.log('📊 Running daily metrics check...');

  const metrics = await hitlFeedbackService.calculatePerformanceMetrics(1);
  const alerts = generateAlerts(metrics);

  if (alerts.length > 0) {
    console.log('⚠️ Alerts detected:');
    alerts.forEach(alert => console.log(`   ${alert}`));
    // TODO: Send notification to admin
  }

  console.log('📈 Daily Summary:');
  console.log(`   Accuracy: ${(metrics.accuracy * 100).toFixed(1)}%`);
  console.log(`   False Positive Rate: ${(metrics.falsePositiveRate * 100).toFixed(1)}%`);
  console.log(`   Response Time: ${metrics.avgResponseTimeSeconds.toFixed(0)}s`);
}

/**
 * Weekly task: Generate improvement suggestions
 */
async function weeklyImprovementCheck() {
  console.log('🔬 Running weekly improvement check...');

  const improvements = await hitlFeedbackService.generateModelImprovements();

  if (improvements.keywordsToRemove.length > 0 || improvements.keywordsToAdd.length > 0) {
    console.log('💡 Model improvements available:');
    console.log(`   Keywords to add: ${improvements.keywordsToAdd.length}`);
    console.log(`   Keywords to remove: ${improvements.keywordsToRemove.length}`);
    console.log(`   Keywords to adjust: ${improvements.keywordsToAdjust.length}`);

    // TODO: Send notification to admin with improvement suggestions
  }
}

/**
 * Monthly task: Check fine-tuning readiness
 */
async function monthlyFineTuningCheck() {
  console.log('🤖 Running monthly fine-tuning check...');

  const status = await checkFineTuningReadiness();

  if (status.ready) {
    console.log('✅ Ready for fine-tuning!');
    console.log(`   Training samples: ${status.samplesCount}`);
    // TODO: Trigger automated fine-tuning or notify admin
  } else {
    console.log(`📊 Not ready yet. Need ${status.needed} more samples.`);
  }
}

// Schedule tasks (example using setInterval - in production use cron)
setInterval(dailyMetricsCheck, 24 * 60 * 60 * 1000); // Daily
setInterval(weeklyImprovementCheck, 7 * 24 * 60 * 60 * 1000); // Weekly
setInterval(monthlyFineTuningCheck, 30 * 24 * 60 * 60 * 1000); // Monthly

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hitlFeedback: 'enabled',
    services: {
      criticalIntervention: 'running',
      feedbackLoop: 'running',
      fineTuning: 'ready',
    },
  });
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 HITL Feedback API: http://localhost:${PORT}/api/hitl-feedback`);
  console.log('✅ HITL Feedback Loop: ENABLED');

  // Run initial checks
  checkFineTuningReadiness();
});

export default app;
