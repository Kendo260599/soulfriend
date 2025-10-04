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

export default router;

