/**
 * Tests for test routes
 */

import request from 'supertest';
import app from '../../src/index';
import TestResult from '../../src/models/TestResult';
import Consent from '../../src/models/Consent';

describe('Test Routes', () => {
  let consentId: string;

  beforeEach(async () => {
    // Create a consent for testing
    const consent = new Consent({
      agreed: true,
      timestamp: new Date(),
      ipAddress: '127.0.0.1',
      userAgent: 'Jest Test Agent'
    });
    const savedConsent = await consent.save();
    consentId = (savedConsent._id as any).toString();
  });

  describe('POST /api/tests/submit', () => {
    it('should submit a valid test result', async () => {
      const testData = {
        testType: 'GAD-7',
        answers: [1, 2, 1, 0, 2, 1, 1],
        consentId: consentId
      };

      const response = await request(app)
        .post('/api/tests/submit')
        .send(testData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('thành công');
      expect(response.body.data.testId).toBeDefined();
      expect(response.body.data.totalScore).toBeDefined();
      expect(response.body.data.evaluation).toBeDefined();
    });

    it('should reject invalid test type', async () => {
      const testData = {
        testType: 'INVALID_TEST',
        answers: [1, 2, 1, 0, 2, 1, 1],
        consentId: consentId
      };

      const response = await request(app)
        .post('/api/tests/submit')
        .send(testData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Dữ liệu không hợp lệ');
      expect(response.body.errors).toBeDefined();
    });

    it('should reject missing answers', async () => {
      const testData = {
        testType: 'GAD-7',
        consentId: consentId
      };

      const response = await request(app)
        .post('/api/tests/submit')
        .send(testData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject invalid answer scores', async () => {
      const testData = {
        testType: 'GAD-7',
        answers: [1, 2, 15, 0, 2, 1, 1], // 15 is out of range
        consentId: consentId
      };

      const response = await request(app)
        .post('/api/tests/submit')
        .send(testData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject missing consent ID', async () => {
      const testData = {
        testType: 'GAD-7',
        answers: [1, 2, 1, 0, 2, 1, 1]
      };

      const response = await request(app)
        .post('/api/tests/submit')
        .send(testData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/tests/results', () => {
    beforeEach(async () => {
      // Create some test results
      const testResult1 = new TestResult({
        testType: 'GAD-7',
        answers: [1, 2, 1, 0, 2, 1, 1],
        totalScore: 8,
        evaluation: {
          testType: 'GAD-7',
          totalScore: 8,
          severity: 'mild',
          interpretation: 'Mild anxiety',
          recommendations: ['Practice relaxation']
        },
        consentId: consentId
      });

      const testResult2 = new TestResult({
        testType: 'PHQ-9',
        answers: [1, 1, 2, 1, 0, 1, 2, 1, 1],
        totalScore: 10,
        evaluation: {
          testType: 'PHQ-9',
          totalScore: 10,
          severity: 'moderate',
          interpretation: 'Moderate depression',
          recommendations: ['Consider counseling']
        },
        consentId: consentId
      });

      await testResult1.save();
      await testResult2.save();
    });

    it('should get all test results', async () => {
      const response = await request(app)
        .get('/api/tests/results')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].testType).toBeDefined();
      expect(response.body.data[0].totalScore).toBeDefined();
    });
  });

  describe('GET /api/tests/questions/:testType', () => {
    it('should get questions for PMS test', async () => {
      const response = await request(app)
        .get('/api/tests/questions/PMS')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.testType).toBe('PMS');
      expect(response.body.data.questions).toBeDefined();
    });

    it('should get questions for Menopause test', async () => {
      const response = await request(app)
        .get('/api/tests/questions/MENOPAUSE_RATING')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.testType).toBe('MENOPAUSE_RATING');
      expect(response.body.data.questions).toBeDefined();
    });

    it('should return 404 for unknown test type', async () => {
      const response = await request(app)
        .get('/api/tests/questions/UNKNOWN_TEST')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Không tìm thấy câu hỏi');
    });
  });

  describe('GET /api/tests/health-check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/tests/health-check')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.healthy).toBeDefined();
      expect(response.body.components).toBeDefined();
      expect(response.body.components.database).toBeDefined();
      expect(response.body.components.scoring).toBe('operational');
      expect(response.body.components.validation).toBe('ready');
    });
  });

  describe('GET /api/tests/validate', () => {
    it('should run clinical validation', async () => {
      const response = await request(app)
        .get('/api/tests/validate')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Clinical validation completed');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.validationReport).toBeDefined();
      expect(response.body.data.crossValidation).toBeDefined();
      expect(response.body.data.timestamp).toBeDefined();
    });
  });

  describe('Test Scoring Integration', () => {
    it('should correctly score GAD-7 test', async () => {
      const testData = {
        testType: 'GAD-7',
        answers: [3, 3, 3, 3, 3, 3, 3], // Maximum scores
        consentId: consentId
      };

      const response = await request(app)
        .post('/api/tests/submit')
        .send(testData)
        .expect(201);

      expect(response.body.data.totalScore).toBe(21);
      expect(response.body.data.evaluation.severity).toBe('severe');
      expect(response.body.data.evaluation.recommendations).toBeDefined();
      expect(response.body.data.evaluation.recommendations.length).toBeGreaterThan(0);
    });

    it('should correctly score PHQ-9 test', async () => {
      const testData = {
        testType: 'PHQ-9',
        answers: [2, 2, 2, 2, 2, 2, 2, 2, 2], // Moderate scores
        consentId: consentId
      };

      const response = await request(app)
        .post('/api/tests/submit')
        .send(testData)
        .expect(201);

      expect(response.body.data.totalScore).toBe(18);
      expect(response.body.data.evaluation.severity).toBe('moderately_severe');
      expect(response.body.data.evaluation.interpretation).toContain('trầm cảm');
    });

    it('should correctly score DASS-21 test', async () => {
      const testData = {
        testType: 'DASS-21',
        answers: Array(21).fill(1), // Mild scores across all questions
        consentId: consentId
      };

      const response = await request(app)
        .post('/api/tests/submit')
        .send(testData)
        .expect(201);

      expect(response.body.data.totalScore).toBe(21);
      expect(response.body.data.evaluation.severity).toBeDefined();
      expect(response.body.data.evaluation.interpretation).toBeDefined();
    });
  });
});
