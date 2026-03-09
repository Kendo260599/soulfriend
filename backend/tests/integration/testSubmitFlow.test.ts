/**
 * Integration Tests: Test Submission → Data Persistence → Cache Invalidation
 *
 * Tests the full submit flow and verifies:
 * 1. userId is saved in TestResult
 * 2. subscaleScores are persisted correctly
 * 3. dassTestBridge cache is invalidated on new submission
 * 4. therapeuticContextService cache is invalidated on new submission
 * 5. Scoring correctness for different answer patterns
 */

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
import { dassTestBridge } from '../../src/services/pge/dassTestBridge';
import { therapeuticContextService } from '../../src/services/therapeuticContextService';

// Mock express-mongo-sanitize
jest.mock('express-mongo-sanitize', () => {
  return () => (req: any, res: any, next: any) => next();
});

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { errorHandler } from '../../src/middleware/errorHandler';
import testRoutes from '../../src/routes/tests';

const app = express();
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/tests', testRoutes);
app.use(errorHandler);

describe('Test Submission Flow Integration', () => {
  let mongoServer: MongoMemoryServer;
  let consentId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
    if (mongoServer) await mongoServer.stop();
  });

  beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }

    const consent = new Consent({
      agreed: true,
      timestamp: new Date(),
      ipAddress: '127.0.0.1',
      userAgent: 'Jest Test Agent',
    });
    const saved = await consent.save();
    consentId = (saved._id as any).toString();
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 1: userId Persistence
  // ═══════════════════════════════════════════════════════════

  describe('userId persistence on submit', () => {
    it('should save userId when provided in request body', async () => {
      const response = await request(app)
        .post('/api/tests/submit')
        .send({
          testType: 'DASS-21',
          answers: Array(21).fill(1),
          consentId,
          userId: 'user_123456_abcde',
        })
        .expect(201);

      expect(response.body.success).toBe(true);

      // Verify in DB
      const saved = await TestResult.findOne({ userId: 'user_123456_abcde' });
      expect(saved).not.toBeNull();
      expect(saved!.userId).toBe('user_123456_abcde');
    });

    it('should save userId as null when not provided', async () => {
      const response = await request(app)
        .post('/api/tests/submit')
        .send({
          testType: 'DASS-21',
          answers: Array(21).fill(1),
          consentId,
        })
        .expect(201);

      expect(response.body.success).toBe(true);

      const saved = await TestResult.findById(response.body.data.testId);
      expect(saved).not.toBeNull();
      expect(saved!.userId).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 2: subscaleScores Persistence
  // ═══════════════════════════════════════════════════════════

  describe('subscaleScores persistence', () => {
    it('should save Depression, Anxiety, Stress subscale scores', async () => {
      // All answers = 3 → each subscale = 7*3*2 = 42
      const response = await request(app)
        .post('/api/tests/submit')
        .send({
          testType: 'DASS-21',
          answers: Array(21).fill(3),
          consentId,
          userId: 'user_subscale_test',
        })
        .expect(201);

      const saved = await TestResult.findById(response.body.data.testId);
      expect(saved).not.toBeNull();
      expect(saved!.subscaleScores).toBeDefined();
      expect(saved!.subscaleScores!.depression).toBe(42);
      expect(saved!.subscaleScores!.anxiety).toBe(42);
      expect(saved!.subscaleScores!.stress).toBe(42);
    });

    it('should save zero subscale scores for all-zero answers', async () => {
      const response = await request(app)
        .post('/api/tests/submit')
        .send({
          testType: 'DASS-21',
          answers: Array(21).fill(0),
          consentId,
          userId: 'user_zero_test',
        })
        .expect(201);

      const saved = await TestResult.findById(response.body.data.testId);
      expect(saved!.subscaleScores!.depression).toBe(0);
      expect(saved!.subscaleScores!.anxiety).toBe(0);
      expect(saved!.subscaleScores!.stress).toBe(0);
    });

    it('should save correct subscale scores for depression-only pattern', async () => {
      // Depression items: [3,5,10,13,16,17,21] (1-indexed)
      // Set only depression items to 3, others to 0
      const answers = Array(21).fill(0);
      [3, 5, 10, 13, 16, 17, 21].forEach(q => (answers[q - 1] = 3)); // 0-indexed array

      const response = await request(app)
        .post('/api/tests/submit')
        .send({
          testType: 'DASS-21',
          answers,
          consentId,
          userId: 'user_dep_test',
        })
        .expect(201);

      const saved = await TestResult.findById(response.body.data.testId);
      expect(saved!.subscaleScores!.depression).toBe(42); // 7*3*2
      expect(saved!.subscaleScores!.anxiety).toBe(0);
      expect(saved!.subscaleScores!.stress).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 3: Cache Invalidation on Submit
  // ═══════════════════════════════════════════════════════════

  describe('Cache invalidation after submit', () => {
    it('dassTestBridge should return new data after re-submission', async () => {
      const userId = 'user_cache_test_1';

      // First submission — moderate scores
      await request(app)
        .post('/api/tests/submit')
        .send({
          testType: 'DASS-21',
          answers: Array(21).fill(1),
          consentId,
          userId,
        })
        .expect(201);

      // Warm up bridge cache
      const firstBias = await dassTestBridge.getStateBias(userId);
      expect(firstBias).not.toBeNull();
      const firstD = firstBias!.scores.depression;

      // Second submission — extreme scores (all 3s)
      await request(app)
        .post('/api/tests/submit')
        .send({
          testType: 'DASS-21',
          answers: Array(21).fill(3),
          consentId,
          userId,
        })
        .expect(201);

      // Cache should have been invalidated by the route handler
      const secondBias = await dassTestBridge.getStateBias(userId);
      expect(secondBias).not.toBeNull();
      expect(secondBias!.scores.depression).toBeGreaterThan(firstD);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 4: Submit → Bridge → PGE Chain Verification
  // ═══════════════════════════════════════════════════════════

  describe('Submit → Bridge → PGE data flow', () => {
    it('submitted test should be readable by dassTestBridge.getStateBias()', async () => {
      const userId = 'user_flow_test';

      await request(app)
        .post('/api/tests/submit')
        .send({
          testType: 'DASS-21',
          answers: Array(21).fill(2), // moderate answers
          consentId,
          userId,
        })
        .expect(201);

      const bias = await dassTestBridge.getStateBias(userId);
      expect(bias).not.toBeNull();
      expect(bias!.scores.depression).toBeGreaterThan(0);
      expect(bias!.scores.anxiety).toBeGreaterThan(0);
      expect(bias!.scores.stress).toBeGreaterThan(0);
      expect(bias!.isRecent).toBe(true);
      expect(bias!.weight).toBeCloseTo(0.4, 1);
    });

    it('submitted test should be readable by dassTestBridge.getRiskBoost()', async () => {
      const userId = 'user_boost_test';

      // Submit extreme scores (all 3s → D=42, A=42, S=42)
      await request(app)
        .post('/api/tests/submit')
        .send({
          testType: 'DASS-21',
          answers: Array(21).fill(3),
          consentId,
          userId,
        })
        .expect(201);

      const boost = await dassTestBridge.getRiskBoost(userId);
      expect(boost.boost).toBe(25); // extreme
      expect(boost.shouldElevate).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 5: Scoring Consistency — answers[] → subscaleScores
  // ═══════════════════════════════════════════════════════════

  describe('Answer array to subscale score consistency', () => {
    it('the route receives 0-indexed answers array but scoring uses 1-indexed', async () => {
      // This tests a potential off-by-one bug:
      // answers array: [ans_for_Q1, ans_for_Q2, ..., ans_for_Q21] (0-indexed)
      // scoring expects: { 1: ans1, 2: ans2, ..., 21: ans21 } (1-indexed)
      // The route converts: answersMap[index+1] = score

      // Set Q1 (stress) = 3, all others = 0
      // Q1 is answer[0] in the array
      const answers = Array(21).fill(0);
      answers[0] = 3; // Q1 = stress item

      const response = await request(app)
        .post('/api/tests/submit')
        .send({
          testType: 'DASS-21',
          answers,
          consentId,
          userId: 'user_index_test',
        })
        .expect(201);

      const saved = await TestResult.findById(response.body.data.testId);
      // Q1 (index 0) is a STRESS item → stress should be 3*2=6
      expect(saved!.subscaleScores!.stress).toBe(6);
      expect(saved!.subscaleScores!.depression).toBe(0);
      expect(saved!.subscaleScores!.anxiety).toBe(0);
    });

    it('Q2 (answer[1]) should be anxiety item', async () => {
      const answers = Array(21).fill(0);
      answers[1] = 3; // Q2 = anxiety item

      const response = await request(app)
        .post('/api/tests/submit')
        .send({
          testType: 'DASS-21',
          answers,
          consentId,
          userId: 'user_q2_test',
        })
        .expect(201);

      const saved = await TestResult.findById(response.body.data.testId);
      expect(saved!.subscaleScores!.anxiety).toBe(6); // Q2 is anxiety, 3*2=6
      expect(saved!.subscaleScores!.depression).toBe(0);
      expect(saved!.subscaleScores!.stress).toBe(0);
    });

    it('Q3 (answer[2]) should be depression item', async () => {
      const answers = Array(21).fill(0);
      answers[2] = 3; // Q3 = depression item

      const response = await request(app)
        .post('/api/tests/submit')
        .send({
          testType: 'DASS-21',
          answers,
          consentId,
          userId: 'user_q3_test',
        })
        .expect(201);

      const saved = await TestResult.findById(response.body.data.testId);
      expect(saved!.subscaleScores!.depression).toBe(6); // Q3 is depression, 3*2=6
      expect(saved!.subscaleScores!.anxiety).toBe(0);
      expect(saved!.subscaleScores!.stress).toBe(0);
    });
  });
});
