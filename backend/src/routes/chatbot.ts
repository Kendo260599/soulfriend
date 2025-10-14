/**
 * Chatbot Routes
 * API endpoints for chatbot functionality
 */

import express from 'express';
import chatbotController from '../controllers/chatbotController';
import { rateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Apply rate limiting to chatbot endpoints
router.use(rateLimiter.middleware);

/**
 * @route   POST /api/v2/chatbot/message
 * @desc    Process chat message
 * @access  Public
 */
router.post('/message', chatbotController.processMessage);

/**
 * @route   GET /api/v2/chatbot/history/:sessionId
 * @desc    Get conversation history
 * @access  Public
 */
router.get('/history/:sessionId', chatbotController.getHistory);

/**
 * @route   POST /api/v2/chatbot/analyze
 * @desc    Analyze message intent
 * @access  Public
 */
router.post('/analyze', chatbotController.analyzeIntent);

/**
 * @route   POST /api/v2/chatbot/safety-check
 * @desc    Perform safety check on message
 * @access  Public
 */
router.post('/safety-check', chatbotController.safetyCheck);

/**
 * @route   GET /api/v2/chatbot/knowledge
 * @route   GET /api/v2/chatbot/knowledge/:category
 * @desc    Get knowledge base information
 * @access  Public
 */
router.get('/knowledge', chatbotController.getKnowledge);
router.get('/knowledge/:category', chatbotController.getKnowledge);

/**
 * @route   GET /api/v2/chatbot/emergency-resources
 * @desc    Get emergency resources and contacts
 * @access  Public
 */
router.get('/emergency-resources', chatbotController.getEmergencyResources);

/**
 * @route   POST /api/v2/chatbot/session
 * @desc    Create new chat session
 * @access  Public
 */
router.post('/session', chatbotController.createSession);

/**
 * @route   POST /api/v2/chatbot/session/:sessionId/end
 * @desc    End chat session
 * @access  Public
 */
router.post('/session/:sessionId/end', chatbotController.endSession);

/**
 * @route   GET /api/v2/chatbot/stats
 * @desc    Get chatbot statistics
 * @access  Admin only (TODO: Add auth middleware)
 */
router.get('/stats', chatbotController.getStats);

/**
 * DEBUG ENDPOINT - Version check
 * GET /api/v2/chatbot/debug/version
 */
router.get('/debug/version', (req, res) => {
  res.json({
    version: '1.0.1',
    timestamp: new Date().toISOString(),
    features: {
      crisisDetection: 'enhanced-v2',
      hitlSystem: 'active',
      debugLogging: 'enabled'
    },
    message: 'If you see version 1.0.1, crisis detection fixes are deployed'
  });
});

/**
 * DEBUG ENDPOINT - Test crisis detection directly
 * GET /api/v2/chatbot/debug/crisis-test?message=xxx
 */
router.get('/debug/crisis-test', async (req, res) => {
  try {
    const { message } = req.query;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Message query parameter required'
      });
    }

    // Import crisis detection function directly
    const { detectCrisis } = await import('../data/crisisManagementData');
    
    const crisis = detectCrisis(message);
    const crisisLevel = crisis ? crisis.level : 'low';
    
    res.json({
      success: true,
      input: message,
      crisisDetected: crisis !== null,
      crisis: crisis ? {
        id: crisis.id,
        level: crisis.level,
        triggers: crisis.triggers,
      } : null,
      crisisLevel,
      riskLevel: crisisLevel === 'critical' ? 'CRITICAL' : crisisLevel === 'high' ? 'HIGH' : 'LOW',
      message: 'This is a debug endpoint to test crisis detection function directly'
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

export default router;
