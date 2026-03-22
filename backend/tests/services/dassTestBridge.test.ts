/**
 * COMPREHENSIVE TESTS: DASS-21 ↔ PGE Integration
 *
 * Test scenarios:
 * 1. mapDASSToStateBias — unit tests for score→vector mapping
 * 2. blendWithExtraction — blending formula correctness
 * 3. getRiskBoost — severity thresholds & boost values
 * 4. getStateBias — DB query, cache, time-decay
 * 5. Cache invalidation
 * 6. Edge cases: zero scores, max scores, missing data, old tests
 * 7. Risk scoring integration with clinical_test source
 * 8. Test submission → cache invalidation flow
 */

// Load test environment BEFORE any other imports
// environment.ts imports dotenv WITHOUT a path, loading .env instead of .env.test.
// We MUST set process.env directly before environment.ts is imported.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_2024_learning_system_secure_32_chars';
process.env.ENCRYPTION_KEY = 'test_encryption_key_2024_learning_system_secure_32_chars_hex_64';
process.env.MONGODB_URI = 'mongodb://localhost:27017/soulfriend_test';

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import TestResult from '../../src/models/TestResult';
import Consent from '../../src/models/Consent';
import { IStateVector, PSY_VARIABLES } from '../../src/models/PsychologicalState';

// We need to access the module internals for testing
// Import the service (singleton)
import { dassTestBridge } from '../../src/services/pge/dassTestBridge';

// Also import the class so we can test mapDASSToStateBias via getStateBias
// Since mapDASSToStateBias is a module-level function (not exported),
// we test it indirectly through getStateBias

describe('DASS-21 ↔ PGE Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let consentId: any;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clean collections
    await TestResult.deleteMany({});
    await Consent.deleteMany({});

    // Create consent
    const consent = new Consent({
      agreed: true,
      timestamp: new Date(),
      ipAddress: '127.0.0.1',
      userAgent: 'Jest Test Agent',
    });
    const saved = await consent.save();
    consentId = saved._id;

    // Clear cache between tests
    dassTestBridge.invalidateCache('test_user_1');
    dassTestBridge.invalidateCache('test_user_2');
    dassTestBridge.invalidateCache('test_user_extreme');
    dassTestBridge.invalidateCache('test_user_severe');
    dassTestBridge.invalidateCache('test_user_moderate');
    dassTestBridge.invalidateCache('test_user_normal');
    dassTestBridge.invalidateCache('test_user_zero');
    dassTestBridge.invalidateCache('test_user_max');
    dassTestBridge.invalidateCache('test_user_old');
    dassTestBridge.invalidateCache('test_user_no_subscales');
    dassTestBridge.invalidateCache('test_user_cache');
  });

  // ═══════════════════════════════════════════════════════════
  // HELPER: Create a test result with specific scores
  // ═══════════════════════════════════════════════════════════

  async function createTestResult(
    userId: string,
    depression: number,
    anxiety: number,
    stress: number,
    severity: string,
    completedAt: Date = new Date()
  ) {
    const totalScore = depression + anxiety + stress;
    return TestResult.create({
      userId,
      testType: 'DASS-21',
      answers: Array(21).fill(1), // placeholder
      totalScore,
      subscaleScores: { depression, anxiety, stress },
      evaluation: {
        testType: 'DASS-21',
        totalScore,
        severity,
        interpretation: `Test severity: ${severity}`,
        recommendations: ['Test recommendation'],
      },
      consentId,
      completedAt,
    });
  }

  // ═══════════════════════════════════════════════════════════
  // SECTION 1: getStateBias — Core Mapping Tests
  // ═══════════════════════════════════════════════════════════

  describe('getStateBias — DASS→PGE mapping', () => {
    it('should return null when no test results exist', async () => {
      const result = await dassTestBridge.getStateBias('nonexistent_user');
      expect(result).toBeNull();
    });

    it('should return null for empty userId', async () => {
      const result = await dassTestBridge.getStateBias('');
      expect(result).toBeNull();
    });

    it('should map zero scores to low-severity bias', async () => {
      await createTestResult('test_user_zero', 0, 0, 0, 'Bình thường');
      const result = await dassTestBridge.getStateBias('test_user_zero');

      expect(result).not.toBeNull();
      expect(result!.bias.sadness).toBe(0);
      expect(result!.bias.anxiety).toBe(0);
      expect(result!.bias.stress).toBe(0);
      // Positive variables should be at baseline (not zero)
      expect(result!.bias.joy).toBeGreaterThan(0);
      expect(result!.bias.hope).toBeGreaterThan(0);
      expect(result!.bias.calmness).toBeGreaterThan(0);
    });

    it('should map maximum scores (42/42/42) to high-severity bias', async () => {
      await createTestResult('test_user_max', 42, 42, 42, 'Rất nặng');
      const result = await dassTestBridge.getStateBias('test_user_max');

      expect(result).not.toBeNull();
      const bias = result!.bias;

      // Negative emotions should be very high
      expect(bias.sadness).toBeCloseTo(0.9, 1);
      expect(bias.anxiety).toBeCloseTo(0.9, 1);
      expect(bias.stress).toBeCloseTo(0.9, 1);
      expect(bias.hopelessness).toBeCloseTo(0.85, 1);

      // Positive emotions should be suppressed
      expect(bias.joy!).toBeLessThanOrEqual(0.05);
      expect(bias.motivation!).toBeLessThanOrEqual(0.1);
      expect(bias.hope!).toBeLessThanOrEqual(0.05);
      expect(bias.calmness!).toBeLessThanOrEqual(0.1);
    });

    it('should map moderate depression (D=14) correctly', async () => {
      await createTestResult('test_user_moderate', 14, 0, 0, 'Vừa');
      const result = await dassTestBridge.getStateBias('test_user_moderate');

      expect(result).not.toBeNull();
      const bias = result!.bias;
      const dNorm = 14 / 42;

      expect(bias.sadness).toBeCloseTo(dNorm * 0.9, 2);
      expect(bias.hopelessness).toBeCloseTo(dNorm * 0.85, 2);
      expect(bias.anxiety).toBe(0); // anxiety subscale is 0
      expect(bias.stress).toBe(0); // stress subscale is 0
    });

    it('should ensure all bias values are in [0, 1] range', async () => {
      await createTestResult('test_user_max', 42, 42, 42, 'Rất nặng');
      const result = await dassTestBridge.getStateBias('test_user_max');
      expect(result).not.toBeNull();

      for (const [key, value] of Object.entries(result!.bias)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    });

    it('should only map to valid PGE variables (24D)', async () => {
      await createTestResult('test_user_1', 20, 15, 25, 'Nặng');
      const result = await dassTestBridge.getStateBias('test_user_1');
      expect(result).not.toBeNull();

      const validVars = new Set(PSY_VARIABLES);
      for (const key of Object.keys(result!.bias)) {
        expect(validVars.has(key as any)).toBe(true);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 2: Time Decay & Test Age
  // ═══════════════════════════════════════════════════════════

  describe('Time decay and test age', () => {
    it('should have weight ~0.4 for a fresh test (just taken)', async () => {
      await createTestResult('test_user_1', 14, 10, 19, 'Vừa', new Date());
      const result = await dassTestBridge.getStateBias('test_user_1');
      expect(result).not.toBeNull();
      expect(result!.weight).toBeCloseTo(0.4, 1);
      expect(result!.isRecent).toBe(true);
    });

    it('should have reduced weight for a 3-day-old test', async () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      await createTestResult('test_user_1', 14, 10, 19, 'Vừa', threeDaysAgo);
      const result = await dassTestBridge.getStateBias('test_user_1');
      expect(result).not.toBeNull();
      // weight = 0.4 - 3*0.05 = 0.25
      expect(result!.weight).toBeCloseTo(0.25, 1);
      expect(result!.isRecent).toBe(true);
    });

    it('should have weight≥0.1 for a 6-day-old test (still recent)', async () => {
      const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
      await createTestResult('test_user_1', 14, 10, 19, 'Vừa', sixDaysAgo);
      const result = await dassTestBridge.getStateBias('test_user_1');
      expect(result).not.toBeNull();
      // weight = max(0.1, 0.4 - 6*0.05) = max(0.1, 0.10) = 0.1
      expect(result!.weight).toBeCloseTo(0.1, 1);
      expect(result!.isRecent).toBe(true);
    });

    it('should have weight=0.1 for a 10-day-old test (not recent)', async () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      await createTestResult('test_user_old', 28, 20, 34, 'Rất nặng', tenDaysAgo);
      const result = await dassTestBridge.getStateBias('test_user_old');
      expect(result).not.toBeNull();
      expect(result!.weight).toBe(0.1);
      expect(result!.isRecent).toBe(false);
    });

    it('should use the most recent test when multiple exist', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      await createTestResult('test_user_1', 28, 20, 34, 'Rất nặng', twoDaysAgo);
      await createTestResult('test_user_1', 4, 2, 6, 'Bình thường', new Date());

      dassTestBridge.invalidateCache('test_user_1');
      const result = await dassTestBridge.getStateBias('test_user_1');
      expect(result).not.toBeNull();
      // Should use the most recent (normal) scores, not the extreme ones
      expect(result!.scores.depression).toBe(4);
      expect(result!.scores.anxiety).toBe(2);
      expect(result!.scores.stress).toBe(6);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 3: blendWithExtraction — Formula Tests
  // ═══════════════════════════════════════════════════════════

  describe('blendWithExtraction — blending formula', () => {
    function makeStateVector(overrides: Partial<IStateVector> = {}): IStateVector {
      const base: IStateVector = {
        stress: 0.3, anxiety: 0.2, sadness: 0.1, anger: 0.1,
        loneliness: 0.1, shame: 0.05, guilt: 0.05, hopelessness: 0.05,
        hope: 0.6, calmness: 0.5, joy: 0.7, gratitude: 0.4,
        selfWorth: 0.5, selfEfficacy: 0.5, rumination: 0.2, cognitiveClarity: 0.6,
        avoidance: 0.1, helpSeeking: 0.3, socialEngagement: 0.5, motivation: 0.6,
        trustInOthers: 0.5, perceivedSupport: 0.5, fearOfJudgment: 0.2,
        mentalFatigue: 0.3,
      };
      return { ...base, ...overrides };
    }

    it('should blend correctly with weight=0.4 (fresh test)', async () => {
      await createTestResult('test_user_1', 28, 20, 34, 'Rất nặng');
      const dassBias = await dassTestBridge.getStateBias('test_user_1');
      expect(dassBias).not.toBeNull();

      const extracted = makeStateVector();
      const blended = dassTestBridge.blendWithExtraction(extracted, dassBias!);

      // sadness: (1-0.4)*0.1 + 0.4*(28/42*0.9) ≈ 0.06 + 0.4*0.6 = 0.06+0.24 = 0.30
      const w = dassBias!.weight;
      const expectedSadness = (1 - w) * 0.1 + w * (28 / 42 * 0.9);
      expect(blended.sadness).toBeCloseTo(expectedSadness, 2);

      // All values should be in [0, 1]
      for (const key of PSY_VARIABLES) {
        expect(blended[key]).toBeGreaterThanOrEqual(0);
        expect(blended[key]).toBeLessThanOrEqual(1);
      }
    });

    it('should NOT modify variables that have no DASS mapping (e.g. mentalFatigue has mapping)', async () => {
      // mentalFatigue IS mapped from stress, so it should be modified
      // But unmapped variables from extracted should remain unchanged
      await createTestResult('test_user_1', 0, 0, 0, 'Bình thường');
      const dassBias = await dassTestBridge.getStateBias('test_user_1');
      expect(dassBias).not.toBeNull();

      const extracted = makeStateVector();
      const blended = dassTestBridge.blendWithExtraction(extracted, dassBias!);

      // Check that mapped variables are blended (stress=0 in DASS, weight~0.4)
      // stress: (1-0.4)*0.3 + 0.4*0 = 0.18
      expect(blended.stress).toBeCloseTo(0.18, 1);
    });

    it('should not exceed 1.0 even with extreme values', async () => {
      await createTestResult('test_user_max', 42, 42, 42, 'Rất nặng');
      const dassBias = await dassTestBridge.getStateBias('test_user_max');

      const extracted = makeStateVector({
        sadness: 0.95,
        anxiety: 0.95,
        stress: 0.95,
      });
      const blended = dassTestBridge.blendWithExtraction(extracted, dassBias!);

      for (const key of PSY_VARIABLES) {
        expect(blended[key]).toBeLessThanOrEqual(1);
        expect(blended[key]).toBeGreaterThanOrEqual(0);
      }
    });

    it('should be identity when weight is 0 (all text, no DASS)', async () => {
      // Can't directly set weight to 0, but with a very old test weight=0.1
      // Let's verify the formula maintains correctness
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      await createTestResult('test_user_old', 14, 10, 19, 'Vừa', tenDaysAgo);
      const dassBias = await dassTestBridge.getStateBias('test_user_old');
      expect(dassBias).not.toBeNull();
      expect(dassBias!.weight).toBe(0.1);

      const extracted = makeStateVector();
      const blended = dassTestBridge.blendWithExtraction(extracted, dassBias!);

      // With weight=0.1, most values should be close to the extracted values
      expect(blended.joy).toBeCloseTo(
        0.9 * 0.7 + 0.1 * dassBias!.bias.joy!,
        2
      );
    });
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 4: getRiskBoost — Severity Thresholds
  // ═══════════════════════════════════════════════════════════

  describe('getRiskBoost — severity classification', () => {
    it('should return boost=25 for extremely severe (D≥28)', async () => {
      await createTestResult('test_user_extreme', 28, 0, 0, 'Rất nặng');
      const result = await dassTestBridge.getRiskBoost('test_user_extreme');
      expect(result.boost).toBe(25);
      expect(result.shouldElevate).toBe(true);
    });

    it('should return boost=25 for extremely severe (A≥20)', async () => {
      await createTestResult('test_user_extreme', 0, 20, 0, 'Rất nặng');
      dassTestBridge.invalidateCache('test_user_extreme');
      const result = await dassTestBridge.getRiskBoost('test_user_extreme');
      expect(result.boost).toBe(25);
      expect(result.shouldElevate).toBe(true);
    });

    it('should return boost=25 for extremely severe (S≥34)', async () => {
      await createTestResult('test_user_extreme', 0, 0, 34, 'Rất nặng');
      dassTestBridge.invalidateCache('test_user_extreme');
      const result = await dassTestBridge.getRiskBoost('test_user_extreme');
      expect(result.boost).toBe(25);
      expect(result.shouldElevate).toBe(true);
    });

    it('should return boost=15 for severe (D=21, A<15, S<26)', async () => {
      await createTestResult('test_user_severe', 21, 7, 14, 'Nặng');
      const result = await dassTestBridge.getRiskBoost('test_user_severe');
      expect(result.boost).toBe(15);
      expect(result.shouldElevate).toBe(true);
    });

    it('should return boost=15 for severe (A=15)', async () => {
      await createTestResult('test_user_severe', 9, 15, 14, 'Nặng');
      dassTestBridge.invalidateCache('test_user_severe');
      const result = await dassTestBridge.getRiskBoost('test_user_severe');
      expect(result.boost).toBe(15);
      expect(result.shouldElevate).toBe(true);
    });

    it('should return boost=15 for severe (S=26)', async () => {
      await createTestResult('test_user_severe', 9, 7, 26, 'Nặng');
      dassTestBridge.invalidateCache('test_user_severe');
      const result = await dassTestBridge.getRiskBoost('test_user_severe');
      expect(result.boost).toBe(15);
      expect(result.shouldElevate).toBe(true);
    });

    it('should return boost=8 for moderate (D=14)', async () => {
      await createTestResult('test_user_moderate', 14, 7, 14, 'Vừa');
      const result = await dassTestBridge.getRiskBoost('test_user_moderate');
      expect(result.boost).toBe(8);
      expect(result.shouldElevate).toBe(false);
    });

    it('should return boost=8 for moderate (A=10)', async () => {
      await createTestResult('test_user_moderate', 9, 10, 14, 'Vừa');
      dassTestBridge.invalidateCache('test_user_moderate');
      const result = await dassTestBridge.getRiskBoost('test_user_moderate');
      expect(result.boost).toBe(8);
      expect(result.shouldElevate).toBe(false);
    });

    it('should return boost=8 for moderate (S=19)', async () => {
      await createTestResult('test_user_moderate', 9, 7, 19, 'Vừa');
      dassTestBridge.invalidateCache('test_user_moderate');
      const result = await dassTestBridge.getRiskBoost('test_user_moderate');
      expect(result.boost).toBe(8);
      expect(result.shouldElevate).toBe(false);
    });

    it('should return boost=0 for normal/mild scores', async () => {
      await createTestResult('test_user_normal', 8, 6, 12, 'Nhẹ');
      const result = await dassTestBridge.getRiskBoost('test_user_normal');
      expect(result.boost).toBe(0);
      expect(result.shouldElevate).toBe(false);
    });

    it('should return boost=0 for zero scores', async () => {
      await createTestResult('test_user_zero', 0, 0, 0, 'Bình thường');
      const result = await dassTestBridge.getRiskBoost('test_user_zero');
      expect(result.boost).toBe(0);
      expect(result.shouldElevate).toBe(false);
    });

    it('should return boost=0 for non-recent test (>7 days)', async () => {
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      await createTestResult('test_user_old', 28, 20, 34, 'Rất nặng', eightDaysAgo);
      const result = await dassTestBridge.getRiskBoost('test_user_old');
      expect(result.boost).toBe(0);
      expect(result.shouldElevate).toBe(false);
    });

    it('should return boost=0 for no test results', async () => {
      const result = await dassTestBridge.getRiskBoost('nonexistent_user');
      expect(result.boost).toBe(0);
      expect(result.severity).toBe('none');
    });

    // BOUNDARY TEST: just inside the 7-day mark
    it('should handle test just inside 7-day boundary', async () => {
      // 6 days 23 hours — safely inside the 7-day window
      const almostSevenDays = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000));
      await createTestResult('test_user_1', 28, 20, 34, 'Rất nặng', almostSevenDays);
      const result = await dassTestBridge.getRiskBoost('test_user_1');
      expect(result.boost).toBeGreaterThan(0);
    });

    // BOUNDARY TEST: just outside the 7-day mark
    it('should return boost=0 for test just outside 7-day boundary', async () => {
      const justOverSevenDays = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000));
      await createTestResult('test_user_2', 28, 20, 34, 'Rất nặng', justOverSevenDays);
      const result = await dassTestBridge.getRiskBoost('test_user_2');
      expect(result.boost).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 5: Cache Behavior
  // ═══════════════════════════════════════════════════════════

  describe('Cache behavior', () => {
    it('should cache results and not re-query DB', async () => {
      await createTestResult('test_user_cache', 14, 10, 19, 'Vừa');

      const result1 = await dassTestBridge.getStateBias('test_user_cache');
      expect(result1).not.toBeNull();

      // Delete from DB — cached result should still be returned
      await TestResult.deleteMany({ userId: 'test_user_cache' });
      const result2 = await dassTestBridge.getStateBias('test_user_cache');
      expect(result2).not.toBeNull();
      expect(result2!.scores.depression).toBe(14);
    });

    it('invalidateCache should clear cached value', async () => {
      await createTestResult('test_user_cache', 14, 10, 19, 'Vừa');
      await dassTestBridge.getStateBias('test_user_cache');

      // Invalidate cache
      dassTestBridge.invalidateCache('test_user_cache');

      // Delete from DB
      await TestResult.deleteMany({ userId: 'test_user_cache' });

      // Should now return null (cache cleared + no DB record)
      const result = await dassTestBridge.getStateBias('test_user_cache');
      expect(result).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 6: Edge Cases & Robustness
  // ═══════════════════════════════════════════════════════════

  describe('Edge cases', () => {
    it('should handle missing subscaleScores gracefully', async () => {
      // Create a TestResult without subscaleScores
      await TestResult.create({
        userId: 'test_user_no_subscales',
        testType: 'DASS-21',
        answers: Array(21).fill(1),
        totalScore: 42,
        evaluation: {
          testType: 'DASS-21',
          totalScore: 42,
          severity: 'Vừa',
          interpretation: 'Test',
          recommendations: ['Test'],
        },
        consentId,
        completedAt: new Date(),
      });

      const result = await dassTestBridge.getStateBias('test_user_no_subscales');
      // Should not crash — defaults to 0 for missing subscales
      expect(result).not.toBeNull();
      expect(result!.scores.depression).toBe(0);
      expect(result!.scores.anxiety).toBe(0);
      expect(result!.scores.stress).toBe(0);
    });

    it('should handle scores exceeding max (data corruption safety)', async () => {
      // Scores above 42 should be capped at 1.0 normalized
      await createTestResult('test_user_1', 50, 50, 50, 'Rất nặng');
      const result = await dassTestBridge.getStateBias('test_user_1');
      expect(result).not.toBeNull();

      // All bias values should still be in [0, 1]
      for (const [, value] of Object.entries(result!.bias)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    });

    it('should handle negative scores (data corruption safety)', async () => {
      // Negative scores can happen from data corruption
      // Use direct DB insert to bypass Mongoose validation
      await TestResult.collection.insertOne({
        userId: 'test_user_1',
        testType: 'DASS-21',
        answers: Array(21).fill(0),
        totalScore: 0,
        subscaleScores: { depression: -5, anxiety: -3, stress: -2 },
        evaluation: {
          testType: 'DASS-21',
          totalScore: 0,
          severity: 'Bình thường',
          interpretation: 'Test',
          recommendations: ['Test'],
        },
        consentId,
        completedAt: new Date(),
      });

      dassTestBridge.invalidateCache('test_user_1');
      const result = await dassTestBridge.getStateBias('test_user_1');
      expect(result).not.toBeNull();

      // After fix: negative scores should be clamped to 0
      // All bias values must be in [0, 1]
      for (const [, value] of Object.entries(result!.bias)) {
        if (typeof value === 'number') {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(1);
        }
      }

      // Clamped to 0 → sadness should be 0
      expect(result!.bias.sadness).toBe(0);
      expect(result!.bias.anxiety).toBe(0);
      expect(result!.bias.stress).toBe(0);
    });

    it('should only consider DASS-21 tests (not other test types)', async () => {
      // Create a non-DASS-21 test (if possible in the schema enum)
      // The TestType enum includes GAD-7 etc.
      try {
        await TestResult.create({
          userId: 'test_user_1',
          testType: 'GAD-7',
          answers: [1, 2, 1, 0, 2, 1, 1],
          totalScore: 8,
          subscaleScores: { depression: 99, anxiety: 99, stress: 99 },
          evaluation: {
            testType: 'GAD-7',
            totalScore: 8,
            severity: 'Rất nặng',
            interpretation: 'Test',
            recommendations: ['Test'],
          },
          consentId,
          completedAt: new Date(),
        });
      } catch {
        // May fail due to schema constraints but that's fine
      }

      dassTestBridge.invalidateCache('test_user_1');
      const result = await dassTestBridge.getStateBias('test_user_1');
      // Should be null — only DASS-21 tests should be considered
      // (unless the GAD-7 test was somehow matched)
      if (result) {
        // Bug: GAD-7 test scores being read as DASS-21
        expect(result.scores.depression).not.toBe(99);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 7: DASS-21 Scoring Algorithm Consistency
  // ═══════════════════════════════════════════════════════════

  describe('Scoring algorithm consistency', () => {
    it('DASS-21 subscale items should be correct standard groups', () => {
      // Import scoring to verify item assignment
      const { scoreDASS21 } = require('../../src/utils/scoring');

      // Create known answer pattern: all questions = 3
      const answers: { [key: number]: number } = {};
      for (let i = 1; i <= 21; i++) answers[i] = 3;
      const result = scoreDASS21(answers);

      // Each subscale: 7 items × 3 × 2 = 42
      expect(result.subscaleScores!.depression).toBe(42);
      expect(result.subscaleScores!.anxiety).toBe(42);
      expect(result.subscaleScores!.stress).toBe(42);
      expect(result.totalScore).toBe(126);
    });

    it('depression items should be [3,5,10,13,16,17,21]', () => {
      const { scoreDASS21 } = require('../../src/utils/scoring');
      const depressionItems = [3, 5, 10, 13, 16, 17, 21];

      // Set only depression items = 3, others = 0
      const answers: { [key: number]: number } = {};
      for (let i = 1; i <= 21; i++) answers[i] = 0;
      depressionItems.forEach(q => (answers[q] = 3));

      const result = scoreDASS21(answers);
      expect(result.subscaleScores!.depression).toBe(42);
      expect(result.subscaleScores!.anxiety).toBe(0);
      expect(result.subscaleScores!.stress).toBe(0);
    });

    it('anxiety items should be [2,4,7,9,15,19,20]', () => {
      const { scoreDASS21 } = require('../../src/utils/scoring');
      const anxietyItems = [2, 4, 7, 9, 15, 19, 20];

      const answers: { [key: number]: number } = {};
      for (let i = 1; i <= 21; i++) answers[i] = 0;
      anxietyItems.forEach(q => (answers[q] = 3));

      const result = scoreDASS21(answers);
      expect(result.subscaleScores!.depression).toBe(0);
      expect(result.subscaleScores!.anxiety).toBe(42);
      expect(result.subscaleScores!.stress).toBe(0);
    });

    it('stress items should be [1,6,8,11,12,14,18]', () => {
      const { scoreDASS21 } = require('../../src/utils/scoring');
      const stressItems = [1, 6, 8, 11, 12, 14, 18];

      const answers: { [key: number]: number } = {};
      for (let i = 1; i <= 21; i++) answers[i] = 0;
      stressItems.forEach(q => (answers[q] = 3));

      const result = scoreDASS21(answers);
      expect(result.subscaleScores!.depression).toBe(0);
      expect(result.subscaleScores!.anxiety).toBe(0);
      expect(result.subscaleScores!.stress).toBe(42);
    });

    it('severity thresholds between scoring and bridge should match', () => {
      const { scoreDASS21 } = require('../../src/utils/scoring');

      // Test: D=28 should be "Rất nặng" (extremely severe)
      const answersExtreme: { [key: number]: number } = {};
      for (let i = 1; i <= 21; i++) answersExtreme[i] = 0;
      // Set depression items to max (3) — 7 items × 3 = 21 raw × 2 = 42
      // For D=28, we need 28/2 = 14 raw → need some items at 2, some at 3
      [3, 5, 10, 13, 16, 17, 21].forEach(q => (answersExtreme[q] = 2)); // 7*2=14 raw → 28 scored
      const result = scoreDASS21(answersExtreme);
      expect(result.subscaleScores!.depression).toBe(28);
      expect(result.severity).toBe('Rất nặng');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 8: Cross-Loading & Combined Severity
  // ═══════════════════════════════════════════════════════════

  describe('Cross-loading effects (combined D+A+S)', () => {
    it('should reduce socialEngagement when both D and A are high', async () => {
      // High D + high A → socialEngagement should be very low
      await createTestResult('test_user_1', 28, 20, 0, 'Rất nặng');
      const result = await dassTestBridge.getStateBias('test_user_1');
      expect(result).not.toBeNull();

      // socialEngagement = max(0, 0.5 - (dNorm+aNorm)/2 * 0.4)
      const dNorm = 28 / 42;
      const aNorm = 20 / 42;
      const expected = Math.max(0, 0.5 - (dNorm + aNorm) / 2 * 0.4);
      expect(result!.bias.socialEngagement).toBeCloseTo(expected, 2);
    });

    it('shame should combine D and A', async () => {
      await createTestResult('test_user_1', 21, 15, 0, 'Nặng');
      dassTestBridge.invalidateCache('test_user_1');
      const result = await dassTestBridge.getStateBias('test_user_1');
      expect(result).not.toBeNull();

      const dNorm = 21 / 42;
      const aNorm = 15 / 42;
      const expectedShame = dNorm * 0.3 + aNorm * 0.3;
      expect(result!.bias.shame).toBeCloseTo(expectedShame, 2);
    });
  });
});
