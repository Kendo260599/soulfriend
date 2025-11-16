/**
 * Chatbot Controller
 * Handles chatbot API endpoints for Phase 1
 */

import { NextFunction, Request, Response } from 'express';
import { ChatbotService } from '../services/chatbotService';
import { EnhancedChatbotService } from '../services/enhancedChatbotService';
import { memoryAwareChatbotService } from '../services/memoryAwareChatbotService';
import { logger } from '../utils/logger';

export class ChatbotController {
  private chatbotService: ChatbotService;
  private enhancedChatbotService: EnhancedChatbotService;

  constructor() {
    this.chatbotService = new ChatbotService();
    this.enhancedChatbotService = new EnhancedChatbotService();
  }

  /**
   * Process chat message
   * POST /api/v2/chatbot/message
   */
  processMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let { message, userId, sessionId, context, mode } = req.body;

      // Validation
      if (!message || typeof message !== 'string') {
        res.status(400).json({
          error: 'Invalid request',
          message: 'Message is required and must be a string',
        });
        return;
      }

      // UTF-8 Normalization to fix encoding issues
      // Ensure string is properly normalized for Vietnamese characters
      message = Buffer.from(message, 'utf8').toString('utf8');
      message = message.normalize('NFC'); // Canonical composition normalization

      logger.info('Processing chatbot message', {
        userId,
        sessionId,
        messageLength: message.length,
      });

      // Process message with Enhanced Chatbot Service (với HITL crisis detection)
      const chatbotMode = mode === 'em_style' ? 'em_style' : 'default';
      const response = await this.enhancedChatbotService.processMessage(
        message,
        sessionId || this.generateSessionId(),
        userId || 'anonymous',
        context?.userProfile,
        chatbotMode
      );

      res.json({
        success: true,
        data: response,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error processing chatbot message:', error);
      next(error);
    }
  };

  /**
   * Get conversation history
   * GET /api/v2/chatbot/history/:sessionId
   */
  getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const { limit = 50 } = req.query;

      logger.info('Fetching conversation history', { sessionId, limit });

      // Get history from Enhanced Chatbot Service
      const session = this.enhancedChatbotService.sessions?.get(sessionId);
      const messages = this.enhancedChatbotService.messages?.get(sessionId) || [];
      const history = messages.slice(-parseInt(limit as string, 10));

      res.json({
        success: true,
        data: {
          sessionId,
          messages: history,
          count: history.length,
        },
      });
    } catch (error) {
      logger.error('Error fetching conversation history:', error);
      next(error);
    }
  };

  /**
   * Analyze intent
   * POST /api/v2/chatbot/analyze
   */
  analyzeIntent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { message } = req.body;

      if (!message) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'Message is required',
        });
        return;
      }

      // Analyze intent with Enhanced Chatbot Service
      const result = await this.enhancedChatbotService.processMessage(
        message,
        'temp_session',
        'temp_user'
      );

      const analysis = {
        intent: result.intent,
        confidence: result.confidence,
        userSegment: result.userSegment,
        emotionalState: result.emotionalState,
        crisisLevel: result.crisisLevel,
      };

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      logger.error('Error analyzing intent:', error);
      next(error);
    }
  };

  /**
   * Check safety
   * POST /api/v2/chatbot/safety-check
   */
  safetyCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { message, userId } = req.body;

      if (!message) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'Message is required',
        });
        return;
      }

      const safetyResult = await this.chatbotService.performSafetyCheck(message);

      // Log high-risk situations
      if (safetyResult.riskLevel === 'CRISIS' || safetyResult.riskLevel === 'HIGH') {
        logger.warn('High-risk message detected', {
          userId,
          riskLevel: safetyResult.riskLevel,
          messagePreview: message.substring(0, 50),
        });
      }

      res.json({
        success: true,
        data: safetyResult,
      });
    } catch (error) {
      logger.error('Error performing safety check:', error);
      next(error);
    }
  };

  /**
   * Get knowledge base information
   * GET /api/v2/chatbot/knowledge/:category?
   */
  getKnowledge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category } = req.params;
      const { query, limit = 10 } = req.query;

      const knowledge = await this.chatbotService.retrieveKnowledge(
        (query as string) || '',
        category ? [category] : [],
        parseInt(limit as string, 10)
      );

      res.json({
        success: true,
        data: {
          category: category || 'all',
          results: knowledge,
        },
      });
    } catch (error) {
      logger.error('Error retrieving knowledge:', error);
      next(error);
    }
  };

  /**
   * Get emergency resources
   * GET /api/v2/chatbot/emergency-resources
   */
  getEmergencyResources = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { location } = req.query;

      const resources = await this.chatbotService.getEmergencyResources(
        (location as string) || 'Vietnam'
      );

      res.json({
        success: true,
        data: resources,
      });
    } catch (error) {
      logger.error('Error fetching emergency resources:', error);
      next(error);
    }
  };

  /**
   * Create new chat session
   * POST /api/v2/chatbot/session
   */
  createSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, userProfile } = req.body;

      const session = await this.chatbotService.createSession(
        userId || 'anonymous',
        userProfile || {}
      );

      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      logger.error('Error creating chat session:', error);
      next(error);
    }
  };

  /**
   * End chat session
   * POST /api/v2/chatbot/session/:sessionId/end
   */
  endSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionId } = req.params;

      await this.chatbotService.endSession(sessionId);

      res.json({
        success: true,
        message: 'Session ended successfully',
      });
    } catch (error) {
      logger.error('Error ending chat session:', error);
      next(error);
    }
  };

  /**
   * Get chatbot statistics
   * GET /api/v2/chatbot/stats
   */
  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.chatbotService.getStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error fetching chatbot statistics:', error);
      next(error);
    }
  };

  /**
   * 🧠 Process message with memory context
   * POST /api/v2/chatbot/chat-with-memory
   */
  chatWithMemory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let { message, userId, sessionId, context, mode } = req.body;

      // Validation
      if (!message || typeof message !== 'string') {
        res.status(400).json({
          error: 'Invalid request',
          message: 'Message is required and must be a string',
        });
        return;
      }

      if (!userId) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'userId is required for memory-aware chat',
        });
        return;
      }

      // UTF-8 Normalization
      message = Buffer.from(message, 'utf8').toString('utf8');
      message = message.normalize('NFC');

      logger.info('Processing memory-aware chatbot message', {
        userId,
        sessionId,
        messageLength: message.length,
      });

      // Process with memory-aware service
      const chatbotMode = mode === 'em_style' ? 'em_style' : 'default';
      const response = await memoryAwareChatbotService.chat(
        message,
        sessionId || this.generateSessionId(),
        userId,
        context?.userProfile,
        chatbotMode
      );

      res.json({
        success: true,
        data: response,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error processing memory-aware chatbot message:', error);
      next(error);
    }
  };

  /**
   * 🧠 Get conversation history with memory context
   * GET /api/v2/chatbot/history-with-memory/:userId/:sessionId
   */
  getHistoryWithMemory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, sessionId } = req.params;
      const { limit = 20 } = req.query;

      logger.info('Fetching conversation history with memory', { userId, sessionId, limit });

      const history = await memoryAwareChatbotService.getConversationHistory(
        userId,
        sessionId,
        parseInt(limit as string, 10)
      );

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      logger.error('Error fetching conversation history with memory:', error);
      next(error);
    }
  };

  /**
   * 🧠 Get user memory profile
   * GET /api/v2/chatbot/memory-profile/:userId
   */
  getMemoryProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;

      logger.info('Fetching user memory profile', { userId });

      const profile = await memoryAwareChatbotService.getUserMemoryProfile(userId);

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      logger.error('Error fetching user memory profile:', error);
      next(error);
    }
  };

  /**
   * 🧠 Clear session memory
   * DELETE /api/v2/chatbot/session-memory/:sessionId
   */
  clearSessionMemory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionId } = req.params;

      logger.info('Clearing session memory', { sessionId });

      await memoryAwareChatbotService.clearSessionMemory(sessionId);

      res.json({
        success: true,
        message: 'Session memory cleared successfully',
      });
    } catch (error) {
      logger.error('Error clearing session memory:', error);
      next(error);
    }
  };

  /**
   * Helper: Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default new ChatbotController();
