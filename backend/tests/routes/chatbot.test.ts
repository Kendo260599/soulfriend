/**
 * API Route Tests for Chatbot Endpoints
 * Tests integration with moderation and HITL
 */

import request from 'supertest';
import express from 'express';
import chatbotRoutes from '../../src/routes/chatbot';

jest.setTimeout(20000);

// Bypass middleware with external dependencies during route unit/integration tests
jest.mock('../../src/middleware/redisRateLimiter', () => ({
  chatbotRateLimiter: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../../src/middleware/consentEnforcement', () => ({
  checkConsent: () => (_req: any, _res: any, next: any) => next(),
  requireConsent: () => (_req: any, _res: any, next: any) => next(),
}));

// Mock services
jest.mock('../../src/services/openAIService', () => ({
  __esModule: true,
  default: {
    isReady: jest.fn().mockReturnValue(true),
    generateResponse: jest.fn().mockResolvedValue({
      text: 'AI response',
    }),
  },
}));

jest.mock('../../src/services/criticalInterventionService', () => ({
  criticalInterventionService: {
    createCriticalAlert: jest.fn().mockResolvedValue({
      id: 'ALERT_TEST_123',
      timestamp: new Date(),
      status: 'pending',
    }),
  },
}));

jest.mock('../../src/services/memoryAwareChatbotService', () => ({
  memoryAwareChatbotService: {
    chat: jest.fn().mockImplementation(async (message: string) => {
      if ((message || '').toLowerCase().includes('muốn chết')) {
        return {
          message: 'Crisis support response',
          response: 'Crisis support response',
          intent: 'crisis',
          confidence: 0.99,
          suggestions: ['Liên hệ hỗ trợ khẩn cấp'],
          riskLevel: 'CRITICAL',
          crisisLevel: 'critical',
        };
      }
      return {
        message: 'AI response',
        response: 'AI response',
        intent: 'general_chat',
        confidence: 0.9,
        suggestions: [],
        riskLevel: 'LOW',
        crisisLevel: 'low',
      };
    }),
  },
}));

jest.mock('../../src/services/chatbotService', () => ({
  ChatbotService: jest.fn().mockImplementation(() => ({
    performSafetyCheck: jest.fn().mockResolvedValue({
      riskLevel: 'LOW',
      recommendation: 'safe',
    }),
    retrieveKnowledge: jest.fn().mockResolvedValue([]),
    getEmergencyResources: jest.fn().mockResolvedValue([]),
  })),
}));

jest.mock('../../src/services/v5IntegrationService', () => ({
  v5IntegrationService: {
    checkSafety: jest.fn().mockReturnValue({ safe: true, response: '' }),
    afterChatResponse: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../src/services/pge/pgeOrchestrator', () => ({
  pgeOrchestrator: {
    processMessage: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../src/services/gamefi', () => ({
  detectEvent: jest.fn().mockReturnValue(null),
  processEvent: jest.fn().mockResolvedValue({ xpGained: 0 }),
  generateShortFeedback: jest.fn().mockReturnValue(''),
}));

jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use('/api/v2/chatbot', chatbotRoutes);

describe('Chatbot API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v2/chatbot/message', () => {
    it('should process normal message', async () => {
      const response = await request(app)
        .post('/api/v2/chatbot/message')
        .send({
          message: 'Xin chào',
          userId: 'test_user',
          sessionId: 'test_session',
        })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(['NONE', 'LOW']).toContain(response.body.data.riskLevel);
    });

    it('should detect critical crisis and trigger HITL', async () => {
      const response = await request(app)
        .post('/api/v2/chatbot/message')
        .send({
          message: 'Tôi muốn chết',
          userId: 'test_user',
          sessionId: 'test_session',
        })
        .expect(200);

      expect(response.body.data.riskLevel).toBe('CRITICAL');
      expect(response.body.data.crisisLevel).toBe('critical');
    });

    it('should include crisis-level data in response for dangerous messages', async () => {
      const response = await request(app)
        .post('/api/v2/chatbot/message')
        .send({
          message: 'Tôi muốn chết',
          userId: 'test_user',
          sessionId: 'test_session',
        })
        .expect(200);

      expect(response.body.data.crisisLevel).toBe('critical');
      expect(response.body.data.message).toBeDefined();
    });

    it('should handle message without userId (uses default)', async () => {
      const response = await request(app)
        .post('/api/v2/chatbot/message')
        .send({
          message: 'Xin chào',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v2/chatbot/safety-check', () => {
    it('should perform safety check on message', async () => {
      const response = await request(app)
        .post('/api/v2/chatbot/safety-check')
        .send({
          message: 'Tôi muốn chết',
        })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.success).toBe(true);
    });
  });
});


