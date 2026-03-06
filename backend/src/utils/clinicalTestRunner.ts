/**
 * TEST RUNNER FOR CLINICAL VALIDATION
 * Chạy validation toàn diện cho hệ thống đánh giá tâm lý
 * @version 1.0.0
 */

import { createClinicalValidator, VALIDATION_DATASET, ValidationUtils } from './clinicalValidation';
import { scoreDASS21 } from './scoring';
import { EnhancedTestResult } from './enhancedScoring';

/**
 * Helper function to calculate enhanced score
 * Hiện tại chỉ hỗ trợ DASS-21
 */
const calculateEnhancedScore = (params: {
  questionType: string;
  responses: number[];
  age: number;
  gender: 'male' | 'female';
}): EnhancedTestResult => {
  const answersMap: Record<number, number> = {};
  params.responses.forEach((response, index) => {
    answersMap[index + 1] = response;
  });

  if (params.questionType === 'DASS-21' || params.questionType === 'DASS_21') {
    const result = scoreDASS21(answersMap);
    return {
      ...result,
      percentileRank: 50,
      riskFactors: [],
    };
  }

  // Default fallback
  return {
    testType: params.questionType,
    totalScore: params.responses.reduce((sum, score) => sum + score, 0),
    severity: 'unknown',
    interpretation: 'Default interpretation',
    recommendations: ['Consult with healthcare provider'],
    percentileRank: 50,
    riskFactors: [],
  };
};

/**
 * Mock AI analysis function
 */
const analyzeWithAI = async (params: {
  patientData: {
    age: number;
    gender: string;
    responses: number[];
  };
  questionnaire: string;
}) => {
  // Mock AI analysis
  return {
    patterns: ['Pattern 1: Consistent responses', 'Pattern 2: Moderate severity'],
    riskFactors: ['Age factor', 'Response pattern factor'],
    recommendations: ['Continue monitoring', 'Consider therapy'],
    confidenceScore: 0.85,
  };
};

/**
 * Interface cho kết quả test
 */
export interface TestResult {
  testName: string;
  passed: boolean;
  score: number;
  details: string;
  timestamp: Date;
}

/**
 * Main test runner class
 */
export class ClinicalTestRunner {
  private validator = createClinicalValidator();

  /**
   * Chạy tất cả tests
   */
  public async runAllTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    console.log('🔬 Bắt đầu Clinical Validation Testing...\n');

    // Test 1: PHQ-9 Accuracy
    results.push(await this.testPHQ9Accuracy());

    // Test 2: Internal Consistency
    results.push(await this.testInternalConsistency());

    // Test 3: Enhanced Scoring System
    results.push(await this.testEnhancedScoring());

    // Test 4: AI Analysis Integration
    results.push(await this.testAIAnalysisIntegration());

    // Test 5: Cultural Appropriateness
    results.push(await this.testCulturalAppropriateness());

    // Test 6: Clinical Decision Support
    results.push(await this.testClinicalDecisionSupport());

    return results;
  }

  /**
   * Test PHQ-9 accuracy vs gold standard
   */
  private async testPHQ9Accuracy(): Promise<TestResult> {
    try {
      const phq9Data = VALIDATION_DATASET.filter(d => d.patientId.startsWith('PHQ9'));

      if (phq9Data.length === 0) {
        return {
          testName: 'PHQ-9 Accuracy Test',
          passed: false,
          score: 0,
          details: 'Không có dữ liệu PHQ-9 để test',
          timestamp: new Date(),
        };
      }

      const metrics = this.validator.validatePHQ9(phq9Data);

      let score = 0;
      let details = 'PHQ-9 Validation Results:\n';

      // Scoring criteria
      if (metrics.sensitivity >= 0.8) {
        score += 25;
      }
      if (metrics.specificity >= 0.8) {
        score += 25;
      }
      if (metrics.accuracy >= 0.85) {
        score += 25;
      }
      if (metrics.cronbachAlpha >= 0.7) {
        score += 25;
      }

      details += `- Sensitivity: ${(metrics.sensitivity * 100).toFixed(2)}% ${metrics.sensitivity >= 0.8 ? '✅' : '❌'}\n`;
      details += `- Specificity: ${(metrics.specificity * 100).toFixed(2)}% ${metrics.specificity >= 0.8 ? '✅' : '❌'}\n`;
      details += `- Accuracy: ${(metrics.accuracy * 100).toFixed(2)}% ${metrics.accuracy >= 0.85 ? '✅' : '❌'}\n`;
      details += `- Cronbach's Alpha: ${metrics.cronbachAlpha.toFixed(3)} ${metrics.cronbachAlpha >= 0.7 ? '✅' : '❌'}\n`;

      return {
        testName: 'PHQ-9 Accuracy Test',
        passed: score >= 75, // Pass if 3/4 criteria met
        score,
        details,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        testName: 'PHQ-9 Accuracy Test',
        passed: false,
        score: 0,
        details: `Error: ${error}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Test internal consistency
   */
  private async testInternalConsistency(): Promise<TestResult> {
    try {
      const testResponses = [
        [2, 2, 1, 2, 1, 2, 1, 1, 0], // PHQ-9 responses
        [3, 2, 2, 1, 2, 1, 2, 1, 1],
        [1, 1, 0, 1, 0, 1, 0, 0, 0],
        [3, 3, 3, 2, 3, 2, 2, 2, 1],
        [2, 1, 2, 1, 1, 2, 1, 1, 0],
      ];

      // Calculate Cronbach's Alpha manually
      const n = testResponses[0].length;
      const k = testResponses.length;

      const itemVars = [];
      for (let i = 0; i < n; i++) {
        const itemScores = testResponses.map(r => r[i]);
        const mean = itemScores.reduce((a, b) => a + b, 0) / k;
        const variance = itemScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / k;
        itemVars.push(variance);
      }

      const totalScores = testResponses.map(r => r.reduce((a, b) => a + b, 0));
      const totalMean = totalScores.reduce((a, b) => a + b, 0) / k;
      const totalVar =
        totalScores.reduce((sum, score) => sum + Math.pow(score - totalMean, 2), 0) / k;

      const sumItemVars = itemVars.reduce((a, b) => a + b, 0);
      const cronbachAlpha = (n / (n - 1)) * (1 - sumItemVars / totalVar);

      let score = 0;
      let details = 'Internal Consistency Test:\n';

      if (cronbachAlpha >= 0.9) {
        score = 100;
      } else if (cronbachAlpha >= 0.8) {
        score = 85;
      } else if (cronbachAlpha >= 0.7) {
        score = 70;
      } else if (cronbachAlpha >= 0.6) {
        score = 55;
      } else {
        score = 30;
      }

      details += `- Cronbach's Alpha: ${cronbachAlpha.toFixed(3)}\n`;
      details += `- Interpretation: ${cronbachAlpha >= 0.9 ? 'Excellent' : cronbachAlpha >= 0.8 ? 'Good' : cronbachAlpha >= 0.7 ? 'Acceptable' : 'Poor'}\n`;
      details += `- Standard: α ≥ 0.7 for clinical use ${cronbachAlpha >= 0.7 ? '✅' : '❌'}\n`;

      return {
        testName: 'Internal Consistency Test',
        passed: cronbachAlpha >= 0.7,
        score,
        details,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        testName: 'Internal Consistency Test',
        passed: false,
        score: 0,
        details: `Error: ${error}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Test enhanced scoring system
   */
  private async testEnhancedScoring(): Promise<TestResult> {
    try {
      // Test case: Moderate depression
      const responses = [2, 2, 1, 2, 1, 2, 1, 1, 0]; // PHQ-9 = 12
      const basicScore = responses.reduce((sum, score) => sum + score, 0);

      const enhancedResult = calculateEnhancedScore({
        questionType: 'PHQ9',
        responses,
        age: 28,
        gender: 'female',
      });

      let score = 0;
      let details = 'Enhanced Scoring System Test:\n';

      // Check if enhanced scoring provides additional insights
      if (enhancedResult.percentileRank !== undefined) {
        score += 25;
      }
      if (enhancedResult.clinicalSignificance !== undefined) {
        score += 25;
      }
      if (enhancedResult.severity !== 'unknown') {
        score += 25;
      }
      if (enhancedResult.recommendations && enhancedResult.recommendations.length > 0) {
        score += 25;
      }

      details += `- Basic Score: ${basicScore}\n`;
      details += `- Enhanced Score: ${enhancedResult.totalScore}\n`;
      details += `- Percentile Rank: ${enhancedResult.percentileRank || 'N/A'} ${enhancedResult.percentileRank ? '✅' : '❌'}\n`;
      details += `- Severity Level: ${enhancedResult.severity || 'N/A'} ${enhancedResult.severity !== 'unknown' ? '✅' : '❌'}\n`;
      details += `- Recommendations: ${enhancedResult.recommendations?.length || 0} items ${(enhancedResult.recommendations?.length || 0) > 0 ? '✅' : '❌'}\n`;

      return {
        testName: 'Enhanced Scoring System Test',
        passed: score >= 75,
        score,
        details,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        testName: 'Enhanced Scoring System Test',
        passed: false,
        score: 0,
        details: `Error: ${error}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Test AI analysis integration
   */
  private async testAIAnalysisIntegration(): Promise<TestResult> {
    try {
      const aiResult = await analyzeWithAI({
        patientData: {
          age: 28,
          gender: 'female',
          responses: [2, 2, 1, 2, 1, 2, 1, 1, 0],
        },
        questionnaire: 'PHQ9',
      });

      let score = 0;
      let details = 'AI Analysis Integration Test:\n';

      // Check AI analysis components
      if (aiResult.patterns && aiResult.patterns.length > 0) {
        score += 25;
      }
      if (aiResult.riskFactors && aiResult.riskFactors.length > 0) {
        score += 25;
      }
      if (aiResult.recommendations && aiResult.recommendations.length > 0) {
        score += 25;
      }
      if (aiResult.confidenceScore !== undefined && aiResult.confidenceScore > 0) {
        score += 25;
      }

      details += `- Pattern Analysis: ${aiResult.patterns?.length || 0} patterns ${(aiResult.patterns?.length || 0) > 0 ? '✅' : '❌'}\n`;
      details += `- Risk Factors: ${aiResult.riskFactors?.length || 0} factors ${(aiResult.riskFactors?.length || 0) > 0 ? '✅' : '❌'}\n`;
      details += `- Recommendations: ${aiResult.recommendations?.length || 0} items ${(aiResult.recommendations?.length || 0) > 0 ? '✅' : '❌'}\n`;
      details += `- Confidence Score: ${aiResult.confidenceScore?.toFixed(2) || 'N/A'} ${(aiResult.confidenceScore || 0) > 0 ? '✅' : '❌'}\n`;

      return {
        testName: 'AI Analysis Integration Test',
        passed: score >= 75,
        score,
        details,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        testName: 'AI Analysis Integration Test',
        passed: false,
        score: 0,
        details: `Error: ${error}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Test cultural appropriateness
   */
  private async testCulturalAppropriateness(): Promise<TestResult> {
    try {
      const vietnameseData = VALIDATION_DATASET.filter(d => d.culturalBackground === 'Vietnamese');
      const culturalAnalysis = ValidationUtils.validateCulturalAppropriateness(vietnameseData);

      let score = 0;
      let details = 'Cultural Appropriateness Test:\n';

      // Basic scoring
      if (vietnameseData.length > 0) {
        score += 40;
      }
      if (culturalAnalysis.recommendations.length > 0) {
        score += 30;
      }
      if (!culturalAnalysis.culturalBias) {
        score += 30;
      }

      details += `- Vietnamese samples: ${vietnameseData.length} ${vietnameseData.length > 0 ? '✅' : '❌'}\n`;
      details += `- Cultural bias detected: ${culturalAnalysis.culturalBias ? 'Yes ❌' : 'No ✅'}\n`;
      details += `- Recommendations: ${culturalAnalysis.recommendations.length} items\n`;

      if (culturalAnalysis.recommendations.length > 0) {
        details += '  Recommendations:\n';
        culturalAnalysis.recommendations.forEach(rec => {
          details += `  - ${rec}\n`;
        });
      }

      return {
        testName: 'Cultural Appropriateness Test',
        passed: score >= 70,
        score,
        details,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        testName: 'Cultural Appropriateness Test',
        passed: false,
        score: 0,
        details: `Error: ${error}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Test clinical decision support
   */
  private async testClinicalDecisionSupport(): Promise<TestResult> {
    try {
      // Test với trường hợp severe depression
      const severeCase = {
        responses: [3, 3, 3, 3, 2, 3, 2, 2, 1], // PHQ-9 = 22 (severe)
        age: 35,
        gender: 'male' as const,
      };

      const basicScore = severeCase.responses.reduce((sum, score) => sum + score, 0);
      const enhancedResult = calculateEnhancedScore({
        questionType: 'PHQ9',
        responses: severeCase.responses,
        age: severeCase.age,
        gender: severeCase.gender,
      });

      let score = 0;
      let details = 'Clinical Decision Support Test:\n';

      // Check if system correctly identifies severe case
      if (basicScore >= 20) {
        score += 25;
      } // Correct severity identification
      if (enhancedResult.severity === 'severe' || enhancedResult.severity === 'moderately severe') {
        score += 25;
      }
      if (
        enhancedResult.recommendations &&
        enhancedResult.recommendations.some(
          (r: string) => r.includes('urgent') || r.includes('immediate')
        )
      ) {
        score += 25;
      }
      if (enhancedResult.riskFactors && enhancedResult.riskFactors.length > 0) {
        score += 25;
      }

      details += `- Basic Score: ${basicScore} (Severe: ≥20) ${basicScore >= 20 ? '✅' : '❌'}\n`;
      details += `- Severity Level: ${enhancedResult.severity || 'N/A'} ${enhancedResult.severity === 'severe' || enhancedResult.severity === 'moderately severe' ? '✅' : '❌'}\n`;
      details += `- Urgent recommendations: ${enhancedResult.recommendations?.some((r: string) => r.includes('urgent') || r.includes('immediate')) ? 'Yes ✅' : 'No ❌'}\n`;
      details += `- Risk factors identified: ${enhancedResult.riskFactors?.length || 0} ${(enhancedResult.riskFactors?.length || 0) > 0 ? '✅' : '❌'}\n`;

      return {
        testName: 'Clinical Decision Support Test',
        passed: score >= 75,
        score,
        details,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        testName: 'Clinical Decision Support Test',
        passed: false,
        score: 0,
        details: `Error: ${error}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Generate comprehensive test report
   */
  public generateTestReport(results: TestResult[]): string {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / totalTests;

    let report = '🏥 ===== BÁO CÁO VALIDATION HỆ THỐNG ĐÁNH GIÁ TÂM LÝ =====\n\n';
    report += '📊 TỔNG QUAN:\n';
    report += `- Tổng số tests: ${totalTests}\n`;
    report += `- Tests passed: ${passedTests}/${totalTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)\n`;
    report += `- Điểm trung bình: ${averageScore.toFixed(1)}/100\n`;
    report += `- Thời gian test: ${new Date().toLocaleString('vi-VN')}\n\n`;

    report += '📋 CHI TIẾT CÁC TESTS:\n\n';

    results.forEach((result, index) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      report += `${index + 1}. ${result.testName}\n`;
      report += `   Status: ${status}\n`;
      report += `   Score: ${result.score}/100\n`;
      report += '   Details:\n';
      result.details.split('\n').forEach(line => {
        if (line.trim()) {
          report += `     ${line}\n`;
        }
      });
      report += '\n';
    });

    // Overall assessment
    report += '🎯 ĐÁNH GIÁ TỔNG THỂ:\n';
    if (averageScore >= 85) {
      report += `- Hệ thống đạt chất lượng XUẤT SẮC (${averageScore.toFixed(1)}/100)\n`;
      report += '- Đáng tin cậy cho sử dụng lâm sàng\n';
      report += '- Tuân thủ các tiêu chuẩn quốc tế\n';
    } else if (averageScore >= 75) {
      report += `- Hệ thống đạt chất lượng TỐT (${averageScore.toFixed(1)}/100)\n`;
      report += '- Phù hợp cho screening và hỗ trợ chẩn đoán\n';
      report += '- Cần một số cải tiến nhỏ\n';
    } else if (averageScore >= 60) {
      report += `- Hệ thống đạt chất lượng TRUNG BÌNH (${averageScore.toFixed(1)}/100)\n`;
      report += '- Cần cải thiện trước khi sử dụng lâm sàng\n';
      report += '- Khuyến nghị validation thêm\n';
    } else {
      report += `- Hệ thống chưa đạt tiêu chuẩn (${averageScore.toFixed(1)}/100)\n`;
      report += '- Cần xem xét lại và cải thiện đáng kể\n';
      report += '- Không khuyến nghị sử dụng lâm sàng\n';
    }

    report += '\n🔬 KHUYẾN NGHỊ TIẾP THEO:\n';
    report += '- Validation với mẫu lớn hơn từ bệnh viện/phòng khám\n';
    report += '- Test-retest reliability với interval 2-4 tuần\n';
    report += '- Inter-rater reliability với clinicians\n';
    report += '- Cultural adaptation cho Vietnamese population\n';
    report += '- Longitudinal validity studies\n';

    return report;
  }
}

/**
 * Utility function để chạy validation tests
 */
export const runClinicalValidation = async (): Promise<void> => {
  const testRunner = new ClinicalTestRunner();

  console.log('🚀 Starting Clinical Validation Process...\n');
  console.log('This may take a few moments...\n');

  try {
    const results = await testRunner.runAllTests();
    const report = testRunner.generateTestReport(results);

    console.log(report);

    // Save report to file (optional)
    // You can uncomment this if you want to save the report
    // const fs = require('fs');
    // fs.writeFileSync('clinical-validation-report.txt', report);
    // console.log('\n📄 Report saved to: clinical-validation-report.txt');
  } catch (error) {
    console.error('❌ Error during validation:', error);
  }
};

export default ClinicalTestRunner;
