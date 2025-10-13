/**
 * Tests for test routes
 */

// Set test environment before any imports
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_2024_learning_system_secure_32_chars';
process.env.ENCRYPTION_KEY = 'test_encryption_key_2024_learning_system_secure_32_chars_hex_64';
process.env.MONGODB_URI = 'mongodb://localhost:27017/soulfriend_test';
process.env.DEFAULT_ADMIN_USERNAME = 'test_admin';
process.env.DEFAULT_ADMIN_EMAIL = 'test@soulfriend.vn';
process.env.DEFAULT_ADMIN_PASSWORD = 'TestPassword123!@#XYZ';

import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import TestResult from '../../src/models/TestResult';
import Consent from '../../src/models/Consent';

// Mock mongo-sanitize to avoid issues with supertest
jest.mock('express-mongo-sanitize', () => {
  return () => (req: any, res: any, next: any) => next();
});

// Create a simple Express app for testing without database connection
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { errorHandler } from '../../src/middleware/errorHandler';
import testRoutes from '../../src/routes/tests';

const app = express();

// Basic middleware setup
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/tests', testRoutes);

// Error handling
app.use(errorHandler);

describe('Test Routes', () => {
  let consentId: string;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    // Check if already connected
    if (mongoose.connection.readyState === 0) {
      // Start in-memory MongoDB instance
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      
      // Connect to the in-memory database
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    // Only close if we created the connection
    if (mongoServer) {
      await mongoose.connection.close();
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    // Clear database between tests
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

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
      expect(response.body.data.evaluation.severity).toBe('Lo âu nghiêm trọng');
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
      expect(response.body.data.evaluation.severity).toBe('Trầm cảm trung bình-nặng');
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

      // DASS-21 multiplies scores by 2 (standard DASS-21 scoring)
      expect(response.body.data.totalScore).toBe(42);
      expect(response.body.data.evaluation.severity).toBeDefined();
      expect(response.body.data.evaluation.interpretation).toBeDefined();
    });
  });
});
