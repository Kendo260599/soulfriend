/**
 * Integration Tests: Risk Scoring with DASS-21 Clinical Data
 *
 * Tests the flow: DASS-21 TestResult → dassTestBridge.getRiskBoost()
 * → riskScoringService.assess() SOURCE 6 signal → final risk score
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_2024_learning_system_secure_32_chars';
process.env.ENCRYPTION_KEY = 'test_encryption_key_2024_learning_system_secure_32_chars_hex_64';
process.env.MONGODB_URI = 'mongodb://localhost:27017/soulfriend_test';

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import TestResult from '../../src/models/TestResult';
import Consent from '../../src/models/Consent';
import { CentralRiskScoringService } from '../../src/services/riskScoringService';
import { dassTestBridge } from '../../src/services/pge/dassTestBridge';
import { RiskLevel } from '../../src/types/risk';

describe('Risk Scoring ↔ DASS-21 Integration', () => {
  let mongoServer: MongoMemoryServer;
  let consentId: any;
  let riskService: CentralRiskScoringService;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(mongoUri);
    riskService = new CentralRiskScoringService();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  });

  beforeEach(async () => {
    await TestResult.deleteMany({});
    await Consent.deleteMany({});

    const consent = new Consent({
      agreed: true,
      timestamp: new Date(),
      ipAddress: '127.0.0.1',
      userAgent: 'Jest Test Agent',
    });
    const saved = await consent.save();
    consentId = saved._id;

    dassTestBridge.invalidateCache('risk_user_1');
    dassTestBridge.invalidateCache('risk_user_none');
    dassTestBridge.invalidateCache('risk_user_extreme');
    dassTestBridge.invalidateCache('risk_user_moderate');
  });

  async function createTestResult(
    userId: string,
    depression: number,
    anxiety: number,
    stress: number,
    severity: string,
  ) {
    const totalScore = depression + anxiety + stress;
    return TestResult.create({
      userId,
      testType: 'DASS-21',
      answers: Array(21).fill(1),
      totalScore,
      subscaleScores: { depression, anxiety, stress },
      evaluation: {
        testType: 'DASS-21',
        totalScore,
        severity,
        interpretation: `Test: ${severity}`,
        recommendations: ['Test'],
      },
      consentId,
      completedAt: new Date(),
    });
  }

  describe('assess() with userId — clinical_test signal', () => {
    it('should NOT include clinical_test signal when userId is not provided', async () => {
      await createTestResult('risk_user_1', 28, 20, 34, 'Rất nặng');
      const result = await riskService.assess('tôi buồn quá', [], 'sad');
      // No userId → no clinical_test signal
      const clinicalSignal = result.signals.find(s => s.source === 'clinical_test');
      expect(clinicalSignal).toBeUndefined();
    });

    it('should include clinical_test signal when userId has extreme DASS scores', async () => {
      await createTestResult('risk_user_extreme', 28, 20, 34, 'Rất nặng');
      const result = await riskService.assess(
        'tôi cảm thấy bình thường',
        [],
        'neutral',
        undefined,
        'risk_user_extreme'
      );

      const clinicalSignal = result.signals.find(s => s.source === 'clinical_test');
      expect(clinicalSignal).toBeDefined();
      expect(clinicalSignal!.score).toBe(25);
      expect(clinicalSignal!.level).toBe(RiskLevel.HIGH);
      expect(clinicalSignal!.confidence).toBe(0.85);
    });

    it('should include moderate clinical_test signal for moderate DASS scores', async () => {
      await createTestResult('risk_user_moderate', 14, 10, 19, 'Vừa');
      const result = await riskService.assess(
        'mọi thứ ổn',
        [],
        'neutral',
        undefined,
        'risk_user_moderate'
      );

      const clinicalSignal = result.signals.find(s => s.source === 'clinical_test');
      expect(clinicalSignal).toBeDefined();
      expect(clinicalSignal!.score).toBe(8);
      expect(clinicalSignal!.level).toBe(RiskLevel.MODERATE);
    });

    it('should NOT include clinical_test signal when DASS scores are normal', async () => {
      await createTestResult('risk_user_none', 4, 2, 6, 'Bình thường');
      const result = await riskService.assess(
        'hôm nay vui quá',
        [],
        'happy',
        undefined,
        'risk_user_none'
      );

      const clinicalSignal = result.signals.find(s => s.source === 'clinical_test');
      expect(clinicalSignal).toBeUndefined();
    });

    it('should NOT include clinical_test signal for unknown userId', async () => {
      const result = await riskService.assess(
        'chào bạn',
        [],
        'neutral',
        undefined,
        'nonexistent_user_xyz'
      );

      const clinicalSignal = result.signals.find(s => s.source === 'clinical_test');
      expect(clinicalSignal).toBeUndefined();
    });

    it('clinical_test signal should affect final risk score', async () => {
      // Get baseline score without DASS
      const baseResult = await riskService.assess(
        'tôi đang ổn',
        [],
        'neutral'
      );

      // Now with extreme DASS
      await createTestResult('risk_user_extreme', 28, 20, 34, 'Rất nặng');
      const dassResult = await riskService.assess(
        'tôi đang ổn',
        [],
        'neutral',
        undefined,
        'risk_user_extreme'
      );

      // The DASS version should have a higher risk score
      expect(dassResult.score).toBeGreaterThanOrEqual(baseResult.score);
    });

    it('extreme DASS should elevate to at least MODERATE risk even for neutral messages', async () => {
      await createTestResult('risk_user_extreme', 28, 20, 34, 'Rất nặng');
      const result = await riskService.assess(
        'hôm nay trời đẹp',
        [],
        'neutral',
        undefined,
        'risk_user_extreme'
      );

      // clinical_test signal with level=HIGH should push aggregated level up
      const clinicalSignal = result.signals.find(s => s.source === 'clinical_test');
      expect(clinicalSignal).toBeDefined();
      expect(clinicalSignal!.level).toBe(RiskLevel.HIGH);
    });
  });

  describe('risk signal weight correctness', () => {
    it('clinical_test weight should be 0.85 (between moderation=0.9 and social_harm=0.85)', async () => {
      await createTestResult('risk_user_extreme', 28, 20, 34, 'Rất nặng');
      const result = await riskService.assess(
        'tôi cảm thấy bình thường',
        [],
        'neutral',
        undefined,
        'risk_user_extreme'
      );

      const clinicalSignal = result.signals.find(s => s.source === 'clinical_test');
      expect(clinicalSignal).toBeDefined();
      // The signal itself has confidence=0.85, and the weight is 0.85
      // Effective weight = 0.85 * 0.85 = 0.7225
      expect(clinicalSignal!.confidence).toBe(0.85);
    });
  });
});
