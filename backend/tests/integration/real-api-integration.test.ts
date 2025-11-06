/**
 * Integration Tests with Real API Endpoints
 * Tests actual API behavior end-to-end
 * Run with: npm test -- real-api-integration.test.ts
 */

import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../../src/index';
import Consent from '../../src/models/Consent';
import Admin from '../../src/models/Admin';

describe('Real API Integration Tests', () => {
  let mongod: MongoMemoryServer;
  let adminToken: string;
  let consentId: string;

  beforeAll(async () => {
    // Setup in-memory MongoDB
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    // Create an admin user for protected endpoints
    const admin = await Admin.create({
      username: 'integration_admin',
      email: 'integration@test.com',
      password: 'TestPassword123!',
      role: 'admin',
    });

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/admin/login')
      .send({
        username: 'integration_admin',
        password: 'TestPassword123!',
      });

    adminToken = loginResponse.body.token;
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  describe('Consent Management Flow', () => {
    it('should create a consent record', async () => {
      const response = await request(app)
        .post('/api/consent')
        .send({
          consentGiven: true,
          termsAccepted: true,
          privacyPolicyAccepted: true,
          age: 25,
          gender: 'female',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data._id).toBeDefined();
      
      consentId = response.body.data._id;
    });

    it('should retrieve consent by ID', async () => {
      const response = await request(app)
        .get(`/api/consent/${consentId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(consentId);
      expect(response.body.data.consentGiven).toBe(true);
    });

    it('should update consent record', async () => {
      const response = await request(app)
        .put(`/api/consent/${consentId}`)
        .send({
          dataProcessingConsent: true,
          researchConsent: true,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.dataProcessingConsent).toBe(true);
      expect(response.body.data.researchConsent).toBe(true);
    });
  });

  describe('Test Submission Flow', () => {
    it('should get test questions', async () => {
      const response = await request(app)
        .get('/api/tests/questions/PHQ-9')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBe(9);
    });

    it('should submit a valid test', async () => {
      const response = await request(app)
        .post('/api/tests/submit')
        .send({
          consentId,
          testType: 'PHQ-9',
          answers: Array(9).fill(null).map((_, idx) => ({
            questionId: `q${idx + 1}`,
            score: 2,
          })),
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.testType).toBe('PHQ-9');
      expect(response.body.data.totalScore).toBe(18);
      expect(response.body.data.severityLevel).toBe('moderate');
    });

    it('should get test results', async () => {
      const response = await request(app)
        .get('/api/tests/results')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should validate GAD-7 test submission', async () => {
      const response = await request(app)
        .post('/api/tests/submit')
        .send({
          consentId,
          testType: 'GAD-7',
          answers: Array(7).fill(null).map((_, idx) => ({
            questionId: `q${idx + 1}`,
            score: 3,
          })),
        })
        .expect(201);

      expect(response.body.data.testType).toBe('GAD-7');
      expect(response.body.data.totalScore).toBe(21);
      expect(response.body.data.severityLevel).toBe('severe');
    });

    it('should validate DASS-21 test with subscales', async () => {
      const response = await request(app)
        .post('/api/tests/submit')
        .send({
          consentId,
          testType: 'DASS-21',
          answers: Array(21).fill(null).map((_, idx) => ({
            questionId: `q${idx + 1}`,
            score: 2,
          })),
        })
        .expect(201);

      expect(response.body.data.testType).toBe('DASS-21');
      expect(response.body.data.subscaleScores).toBeDefined();
      expect(response.body.data.subscaleScores.depression).toBeDefined();
      expect(response.body.data.subscaleScores.anxiety).toBeDefined();
      expect(response.body.data.subscaleScores.stress).toBeDefined();
    });
  });

  describe('Chatbot API Integration', () => {
    it('should process a normal chatbot message', async () => {
      const response = await request(app)
        .post('/api/v2/chatbot/message')
        .send({
          message: 'Xin chào, tôi cần giúp đỡ',
          sessionId: 'integration_session_1',
          userId: 'integration_user_1',
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.message).toBeDefined();
      expect(response.body.data.sessionId).toBe('integration_session_1');
    });

    it('should detect crisis in message', async () => {
      const response = await request(app)
        .post('/api/v2/chatbot/message')
        .send({
          message: 'Tôi muốn chết',
          sessionId: 'crisis_session',
          userId: 'crisis_user',
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.riskLevel).toBe('CRITICAL');
      expect(response.body.data.crisisLevel).toBe('critical');
    });

    it('should perform safety check on message', async () => {
      const response = await request(app)
        .post('/api/v2/chatbot/safety-check')
        .send({
          message: 'Tôi đang rất buồn',
        })
        .expect(200);

      expect(response.body.riskLevel).toBeDefined();
      expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(response.body.riskLevel);
    });

    it('should maintain conversation context', async () => {
      const sessionId = 'context_session';
      const userId = 'context_user';

      // First message
      const response1 = await request(app)
        .post('/api/v2/chatbot/message')
        .send({
          message: 'Tôi tên là Mai',
          sessionId,
          userId,
        })
        .expect(200);

      // Second message referencing first
      const response2 = await request(app)
        .post('/api/v2/chatbot/message')
        .send({
          message: 'Tôi cảm thấy lo lắng',
          sessionId,
          userId,
        })
        .expect(200);

      expect(response1.body.data.sessionId).toBe(sessionId);
      expect(response2.body.data.sessionId).toBe(sessionId);
    });
  });

  describe('Admin Dashboard Integration', () => {
    it('should access dashboard with valid token', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalConsents).toBeDefined();
      expect(response.body.data.totalTestResults).toBeDefined();
    });

    it('should get test results with pagination', async () => {
      const response = await request(app)
        .get('/api/admin/test-results?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should filter test results by type', async () => {
      const response = await request(app)
        .get('/api/admin/test-results?testType=PHQ-9')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const results = response.body.data;
      if (results.length > 0) {
        expect(results.every((r: any) => r.testType === 'PHQ-9')).toBe(true);
      }
    });

    it('should export data as CSV', async () => {
      const response = await request(app)
        .get('/api/admin/export?format=csv')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.text).toContain('testType');
      expect(response.text).toContain('totalScore');
      expect(response.text).toContain('severityLevel');
    });

    it('should reject unauthorized dashboard access', async () => {
      await request(app)
        .get('/api/admin/dashboard')
        .expect(401);
    });

    it('should reject invalid token', async () => {
      await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
    });
  });

  describe('Health Check Integration', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/api/tests/health-check')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.timestamp).toBeDefined();
    });
  });

  describe('Clinical Validation Integration', () => {
    it('should run clinical validation', async () => {
      const response = await request(app)
        .get('/api/tests/validate')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalTests).toBeDefined();
      expect(response.body.data.testsPassed).toBeDefined();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle missing required fields in test submission', async () => {
      const response = await request(app)
        .post('/api/tests/submit')
        .send({
          // Missing consentId and answers
          testType: 'PHQ-9',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });

    it('should handle invalid test type', async () => {
      const response = await request(app)
        .get('/api/tests/questions/INVALID_TEST')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should handle invalid consent ID', async () => {
      const response = await request(app)
        .post('/api/tests/submit')
        .send({
          consentId: 'invalid_id_format',
          testType: 'PHQ-9',
          answers: Array(9).fill(null).map((_, idx) => ({
            questionId: `q${idx + 1}`,
            score: 2,
          })),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle missing chatbot message', async () => {
      const response = await request(app)
        .post('/api/v2/chatbot/message')
        .send({
          sessionId: 'test',
          userId: 'test',
          // Missing message field
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should enforce rate limits on API endpoints', async () => {
      // Make many requests quickly
      const requests = Array(100).fill(null).map(() =>
        request(app)
          .get('/api/tests/health-check')
      );

      const responses = await Promise.all(requests);
      
      const successCount = responses.filter(r => r.status === 200).length;
      const rateLimitedCount = responses.filter(r => r.status === 429).length;

      console.log(`Rate limiting test: ${successCount} succeeded, ${rateLimitedCount} rate-limited`);
      
      // Some requests should be rate-limited
      expect(rateLimitedCount).toBeGreaterThan(0);
    });
  });

  describe('End-to-End User Journey', () => {
    it('should complete full user journey: consent -> test -> results', async () => {
      // Step 1: Create consent
      const consentResponse = await request(app)
        .post('/api/consent')
        .send({
          consentGiven: true,
          termsAccepted: true,
          privacyPolicyAccepted: true,
          age: 30,
          gender: 'male',
        })
        .expect(201);

      const journeyConsentId = consentResponse.body.data._id;

      // Step 2: Get test questions
      const questionsResponse = await request(app)
        .get('/api/tests/questions/GAD-7')
        .expect(200);

      expect(questionsResponse.body.data.length).toBe(7);

      // Step 3: Submit test
      const submitResponse = await request(app)
        .post('/api/tests/submit')
        .send({
          consentId: journeyConsentId,
          testType: 'GAD-7',
          answers: Array(7).fill(null).map((_, idx) => ({
            questionId: `q${idx + 1}`,
            score: 1,
          })),
        })
        .expect(201);

      const testResultId = submitResponse.body.data._id;

      // Step 4: Verify results were saved
      const resultsResponse = await request(app)
        .get('/api/tests/results')
        .expect(200);

      const savedResult = resultsResponse.body.data.find(
        (r: any) => r._id === testResultId
      );

      expect(savedResult).toBeDefined();
      expect(savedResult.testType).toBe('GAD-7');
      expect(savedResult.totalScore).toBe(7);
    });

    it('should complete chatbot conversation flow', async () => {
      const sessionId = 'journey_session';
      const userId = 'journey_user';

      // Step 1: Initial greeting
      const greeting = await request(app)
        .post('/api/v2/chatbot/message')
        .send({
          message: 'Xin chào',
          sessionId,
          userId,
        })
        .expect(200);

      expect(greeting.body.data.message).toBeDefined();

      // Step 2: Express concern
      const concern = await request(app)
        .post('/api/v2/chatbot/message')
        .send({
          message: 'Tôi đang lo lắng về công việc',
          sessionId,
          userId,
        })
        .expect(200);

      expect(concern.body.data.message).toBeDefined();
      expect(concern.body.data.riskLevel).toBeDefined();

      // Step 3: Safety check
      const safetyCheck = await request(app)
        .post('/api/v2/chatbot/safety-check')
        .send({
          message: concern.body.data.message,
        })
        .expect(200);

      expect(safetyCheck.body.riskLevel).toBeDefined();
    });
  });
});

