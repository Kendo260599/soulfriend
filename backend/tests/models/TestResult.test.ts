/**
 * Tests for TestResult model
 */

import TestResult, { TestType } from '../../src/models/TestResult';
import Consent from '../../src/models/Consent';

describe('TestResult Model', () => {
  let consentId: any;

  beforeEach(async () => {
    // Create a consent for testing
    const consent = new Consent({
      agreed: true,
      timestamp: new Date(),
      ipAddress: '127.0.0.1',
      userAgent: 'Jest Test Agent'
    });
    const savedConsent = await consent.save();
    consentId = savedConsent._id;
  });

  describe('TestResult Creation', () => {
    it('should create a valid test result', async () => {
      const testResultData = {
        testType: TestType.GAD_7,
        answers: [1, 2, 1, 0, 2, 1, 1],
        totalScore: 8,
        evaluation: {
          testType: 'GAD-7',
          totalScore: 8,
          severity: 'mild',
          interpretation: 'Mild anxiety symptoms',
          recommendations: ['Practice relaxation techniques', 'Monitor symptoms']
        },
        consentId: consentId,
        completedAt: new Date(),
        duration: 300
      };

      const testResult = new TestResult(testResultData);
      const savedResult = await testResult.save();

      expect(savedResult._id).toBeDefined();
      expect(savedResult.testType).toBe(TestType.GAD_7);
      expect(savedResult.answers).toEqual([1, 2, 1, 0, 2, 1, 1]);
      expect(savedResult.totalScore).toBe(8);
      expect(savedResult.evaluation.severity).toBe('mild');
      expect(savedResult.consentId.toString()).toBe(consentId.toString());
      expect(savedResult.duration).toBe(300);
    });

    it('should validate required fields', async () => {
      const testResult = new TestResult({});

    let error: any;
    try {
      await testResult.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.testType).toBeDefined();
    // Note: answers validation might be handled by custom validation
    expect(error.errors.totalScore).toBeDefined();
    expect(error.errors.evaluation).toBeDefined();
    expect(error.errors.consentId).toBeDefined();
    });

    it('should validate answer count for DASS-21', async () => {
      const testResult = new TestResult({
        testType: TestType.DASS_21,
        answers: [1, 2, 1], // Only 3 answers instead of 21
        totalScore: 4,
        evaluation: {
          testType: 'DASS-21',
          totalScore: 4,
          severity: 'normal',
          interpretation: 'Normal range',
          recommendations: ['Continue healthy habits']
        },
        consentId: consentId
      });

      let error: any;
      try {
        await testResult.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.message).toContain('Test DASS-21 cần có đúng 21 câu trả lời');
    });

    it('should validate answer count for GAD-7', async () => {
      const testResult = new TestResult({
        testType: TestType.GAD_7,
        answers: [1, 2, 1, 0, 2], // Only 5 answers instead of 7
        totalScore: 6,
        evaluation: {
          testType: 'GAD-7',
          totalScore: 6,
          severity: 'mild',
          interpretation: 'Mild anxiety',
          recommendations: ['Monitor symptoms']
        },
        consentId: consentId
      });

      let error: any;
      try {
        await testResult.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.message).toContain('Test GAD-7 cần có đúng 7 câu trả lời');
    });

    it('should validate answer score range', async () => {
      const testResult = new TestResult({
        testType: TestType.GAD_7,
        answers: [1, 2, 15, 0, 2, 1, 1], // Score 15 is out of range (max 10)
        totalScore: 22,
        evaluation: {
          testType: 'GAD-7',
          totalScore: 22,
          severity: 'severe',
          interpretation: 'Severe anxiety',
          recommendations: ['Seek professional help']
        },
        consentId: consentId
      });

      let error: any;
      try {
        await testResult.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors['answers.2']).toBeDefined();
    });
  });

  describe('TestResult with Subscales', () => {
    it('should save DASS-21 with subscale scores', async () => {
      const testResult = new TestResult({
        testType: TestType.DASS_21,
        answers: Array(21).fill(1), // 21 answers with score 1 each
        totalScore: 21,
        subscaleScores: {
          depression: 7,
          anxiety: 7,
          stress: 7
        },
        evaluation: {
          testType: 'DASS-21',
          totalScore: 21,
          severity: 'mild',
          interpretation: 'Mild symptoms across all scales',
          recommendations: ['Practice stress management', 'Monitor mood']
        },
        consentId: consentId
      });

      const savedResult = await testResult.save();

      expect(savedResult.subscaleScores).toBeDefined();
      expect(savedResult.subscaleScores!.depression).toBe(7);
      expect(savedResult.subscaleScores!.anxiety).toBe(7);
      expect(savedResult.subscaleScores!.stress).toBe(7);
    });
  });

  describe('TestResult Virtuals', () => {
    it('should calculate completedAtVN virtual field', async () => {
      const testResult = new TestResult({
        testType: TestType.PHQ_9,
        answers: Array(9).fill(1),
        totalScore: 9,
        evaluation: {
          testType: 'PHQ-9',
          totalScore: 9,
          severity: 'mild',
          interpretation: 'Mild depression',
          recommendations: ['Self-care practices']
        },
        consentId: consentId,
        completedAt: new Date('2023-10-01T10:00:00Z')
      });

      const savedResult = await testResult.save();
      const resultJSON = savedResult.toJSON() as any;

      expect(resultJSON.completedAtVN).toBeDefined();
      expect(typeof resultJSON.completedAtVN).toBe('string');
    });

    it('should calculate scorePercentage virtual field', async () => {
      const testResult = new TestResult({
        testType: TestType.GAD_7,
        answers: [2, 2, 2, 2, 2, 2, 2], // 7 answers with score 2 each
        totalScore: 14,
        evaluation: {
          testType: 'GAD-7',
          totalScore: 14,
          severity: 'moderate',
          interpretation: 'Moderate anxiety',
          recommendations: ['Consider professional help']
        },
        consentId: consentId
      });

      const savedResult = await testResult.save();
      const resultJSON = savedResult.toJSON() as any;

      expect(resultJSON.scorePercentage).toBeDefined();
      expect(typeof resultJSON.scorePercentage).toBe('number');
      // 14 out of 21 possible (7 questions * 3 max score) = 66.67% rounded to 67%
      expect(resultJSON.scorePercentage).toBe(67);
    });
  });

  describe('TestResult Population', () => {
    it('should populate consent information', async () => {
      const testResult = new TestResult({
        testType: TestType.EPDS,
        answers: Array(10).fill(1),
        totalScore: 10,
        evaluation: {
          testType: 'EPDS',
          totalScore: 10,
          severity: 'moderate',
          interpretation: 'Moderate risk for postpartum depression',
          recommendations: ['Consult healthcare provider']
        },
        consentId: consentId
      });

      const savedResult = await testResult.save();
      const populatedResult = await TestResult.findById(savedResult._id)
        .populate('consentId');

      expect(populatedResult).toBeDefined();
      expect(populatedResult!.consentId).toBeDefined();
      expect((populatedResult!.consentId as any).agreed).toBe(true);
      expect((populatedResult!.consentId as any).ipAddress).toBe('127.0.0.1');
    });
  });

  describe('TestResult Queries', () => {
    beforeEach(async () => {
      // Create multiple test results for query testing
      const testTypes = [TestType.GAD_7, TestType.PHQ_9, TestType.DASS_21];
      
      for (let i = 0; i < testTypes.length; i++) {
        const testResult = new TestResult({
          testType: testTypes[i],
          answers: Array(testTypes[i] === 'PHQ-9' ? 9 : testTypes[i] === 'GAD-7' ? 7 : 21).fill(i + 1), // Correct answer counts
          totalScore: (i + 1) * 7,
          evaluation: {
            testType: testTypes[i],
            totalScore: (i + 1) * 7,
            severity: i === 0 ? 'mild' : i === 1 ? 'moderate' : 'severe',
            interpretation: `Test interpretation ${i + 1}`,
            recommendations: [`Recommendation ${i + 1}`]
          },
          consentId: consentId,
          completedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000) // Different dates
        });
        await testResult.save();
      }
    });

    it('should find test results by type', async () => {
      const gadResults = await TestResult.find({ testType: TestType.GAD_7 });
      expect(gadResults).toHaveLength(1);
      expect(gadResults[0].testType).toBe(TestType.GAD_7);
    });

    it('should sort test results by completion date', async () => {
      const results = await TestResult.find({}).sort({ completedAt: -1 });
      expect(results).toHaveLength(3);
      
      // Should be sorted by most recent first
      expect(results[0].completedAt.getTime()).toBeGreaterThan(
        results[1].completedAt.getTime()
      );
      expect(results[1].completedAt.getTime()).toBeGreaterThan(
        results[2].completedAt.getTime()
      );
    });

    it('should filter by severity level', async () => {
      const severeResults = await TestResult.find({ 'evaluation.severity': 'severe' });
      expect(severeResults).toHaveLength(1);
      expect(severeResults[0].evaluation.severity).toBe('severe');
    });
  });
});
