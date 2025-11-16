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

// ====================
// 🧠 MEMORY-AWARE ENDPOINTS
// ====================

/**
 * @route   POST /api/v2/chatbot/chat-with-memory
 * @desc    Process message with 3-tier memory context
 * @access  Public
 */
router.post('/chat-with-memory', chatbotController.chatWithMemory);

/**
 * @route   GET /api/v2/chatbot/history-with-memory/:userId/:sessionId
 * @desc    Get conversation history with memory context
 * @access  Public
 */
router.get('/history-with-memory/:userId/:sessionId', chatbotController.getHistoryWithMemory);

/**
 * @route   GET /api/v2/chatbot/memory-profile/:userId
 * @desc    Get user's memory profile (patterns, preferences, insights)
 * @access  Public
 */
router.get('/memory-profile/:userId', chatbotController.getMemoryProfile);

/**
 * @route   DELETE /api/v2/chatbot/session-memory/:sessionId
 * @desc    Clear working memory for session
 * @access  Public
 */
router.delete('/session-memory/:sessionId', chatbotController.clearSessionMemory);

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
      debugLogging: 'enabled',
    },
    message: 'If you see version 1.0.1, crisis detection fixes are deployed',
  });
});

/**
 * DEBUG ENDPOINT - Verify crisis detection in production
 * GET /api/v2/chatbot/debug/crisis-check
 */
router.get('/debug/crisis-check', async (req, res) => {
  try {
    const { detectCrisis } = await import('../data/crisisManagementData');
    
    const tests = [
      "Tôi muốn tự tử",
      "Tôi muốn chết",
      "Tôi sẽ kết thúc mọi chuyện",
      "I want to die",
      "Xin chào"
    ];
    
    const results = tests.map(msg => {
      const crisis = detectCrisis(msg);
      return {
        message: msg,
        detected: crisis !== null,
        crisisId: crisis?.id || null,
        level: crisis?.level || 'low',
        triggers: crisis?.triggers?.slice(0, 3) || []
      };
    });
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      buildInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        env: process.env.NODE_ENV
      },
      results
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
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
        error: 'Message query parameter required',
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
      crisis: crisis
        ? {
            id: crisis.id,
            level: crisis.level,
            triggers: crisis.triggers,
          }
        : null,
      crisisLevel,
      riskLevel: crisisLevel === 'critical' ? 'CRITICAL' : crisisLevel === 'high' ? 'HIGH' : 'LOW',
      message: 'This is a debug endpoint to test crisis detection function directly',
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
});

export default router;
