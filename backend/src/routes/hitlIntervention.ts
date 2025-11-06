/**
 * HITL Intervention Routes
 * API endpoints for clinical team to intervene directly with users
 */

import express from 'express';
import { criticalInterventionService } from '../services/criticalInterventionService';
import enhancedChatbotService from '../services/enhancedChatbotService';
import logger from '../utils/logger';

const router = express.Router();

/**
 * @route   GET /api/hitl/alerts
 * @desc    Get all active alerts (pending/escalated)
 * @access  Clinical Team (TODO: Add auth middleware)
 */
router.get('/alerts', async (req, res) => {
  try {
    const alerts = criticalInterventionService.getActiveAlerts();
    
    // Filter to show only pending/escalated alerts
    const activeAlerts = alerts.filter(alert => 
      alert.status === 'pending' || alert.status === 'escalated'
    );

    res.json({
      success: true,
      data: activeAlerts.map(alert => ({
        id: alert.id,
        timestamp: alert.timestamp,
        userId: alert.userId,
        sessionId: alert.sessionId,
        riskLevel: alert.riskLevel,
        riskType: alert.riskType,
        status: alert.status,
        userMessage: alert.userMessage.substring(0, 100) + '...',
        detectedKeywords: alert.detectedKeywords,
        escalatedAt: alert.escalatedAt,
      })),
      count: activeAlerts.length,
    });
  } catch (error) {
    logger.error('Error getting active alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get alerts',
    });
  }
});

/**
 * @route   GET /api/hitl/alerts/:alertId
 * @desc    Get detailed alert information
 * @access  Clinical Team
 */
router.get('/alerts/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;
    const alert = criticalInterventionService.getAlert(alertId);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
    }

    res.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    logger.error('Error getting alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get alert',
    });
  }
});

/**
 * @route   GET /api/hitl/alerts/:alertId/conversation
 * @desc    Get conversation history for alert's session
 * @access  Clinical Team
 */
router.get('/alerts/:alertId/conversation', async (req, res) => {
  try {
    const { alertId } = req.params;
    const alert = criticalInterventionService.getAlert(alertId);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
    }

    // Get conversation history from enhancedChatbotService
    const history = enhancedChatbotService.getConversationHistory(alert.sessionId);

    res.json({
      success: true,
      data: {
        alertId: alert.id,
        sessionId: alert.sessionId,
        userId: alert.userId,
        conversation: history,
      },
    });
  } catch (error) {
    logger.error('Error getting conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation',
    });
  }
});

/**
 * @route   POST /api/hitl/alerts/:alertId/chat
 * @desc    Send message directly to user (clinical team intervention)
 * @access  Clinical Team
 */
router.post('/alerts/:alertId/chat', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { message, clinicalMemberId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    const alert = criticalInterventionService.getAlert(alertId);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
    }

    // Send message to user's session
    // This will appear as a bot message in the user's chat
    await enhancedChatbotService.sendClinicalMessage(
      alert.sessionId,
      alert.userId,
      message,
      clinicalMemberId || 'clinical_team'
    );

    // Optionally acknowledge alert when clinical team starts chatting
    if (alert.status === 'pending') {
      await criticalInterventionService.acknowledgeAlert(
        alertId,
        clinicalMemberId || 'clinical_team',
        `Clinical team sent message: ${message.substring(0, 50)}...`
      );
    }

    logger.info(`📧 Clinical team sent message to user ${alert.userId}`, {
      alertId,
      sessionId: alert.sessionId,
      clinicalMemberId,
      messageLength: message.length,
    });

    res.json({
      success: true,
      data: {
        alertId,
        sessionId: alert.sessionId,
        userId: alert.userId,
        message,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error sending clinical message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
    });
  }
});

/**
 * @route   POST /api/hitl/alerts/:alertId/acknowledge
 * @desc    Acknowledge alert (stops escalation timer)
 * @access  Clinical Team
 */
router.post('/alerts/:alertId/acknowledge', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { clinicalMemberId, notes } = req.body;

    await criticalInterventionService.acknowledgeAlert(
      alertId,
      clinicalMemberId || 'clinical_team',
      notes
    );

    res.json({
      success: true,
      message: 'Alert acknowledged',
    });
  } catch (error) {
    logger.error('Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge alert',
    });
  }
});

/**
 * @route   POST /api/hitl/alerts/:alertId/resolve
 * @desc    Mark alert as resolved
 * @access  Clinical Team
 */
router.post('/alerts/:alertId/resolve', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolution, clinicalMemberId } = req.body;

    await criticalInterventionService.resolveAlert(
      alertId,
      resolution || 'resolved',
      clinicalMemberId || 'clinical_team'
    );

    res.json({
      success: true,
      message: 'Alert resolved',
    });
  } catch (error) {
    logger.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve alert',
    });
  }
});

export default router;

