/**
 * API Route Tests for Chatbot Endpoints
 * Tests integration with moderation and HITL
 */

import request from 'supertest';
import express from 'express';
import chatbotRoutes from '../../src/routes/chatbot';
import { criticalInterventionService } from '../../src/services/criticalInterventionService';

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
      expect(response.body.data.riskLevel).toBe('LOW');
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
      expect(criticalInterventionService.createCriticalAlert).toHaveBeenCalled();
    });

    it('should include moderation metadata in response', async () => {
      const response = await request(app)
        .post('/api/v2/chatbot/message')
        .send({
          message: 'Tôi muốn chết',
          userId: 'test_user',
          sessionId: 'test_session',
        })
        .expect(200);

      // Response should indicate crisis detected
      expect(response.body.data.crisisDetected).toBe(true);
    });

    it('should handle missing required fields', async () => {
      await request(app)
        .post('/api/v2/chatbot/message')
        .send({
          message: 'Xin chào',
          // Missing userId and sessionId
        })
        .expect(400);
    });
  });

  describe('GET /api/v2/chatbot/debug/version', () => {
    it('should return version information', async () => {
      const response = await request(app)
        .get('/api/v2/chatbot/debug/version')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.version).toBeDefined();
      expect(response.body.features).toBeDefined();
      expect(response.body.features.crisisDetection).toBeDefined();
      expect(response.body.features.hitlSystem).toBeDefined();
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
      expect(response.body.riskLevel).toBeDefined();
    });
  });
});

