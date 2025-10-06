/**
 * Expert Integration Service
 * Tích hợp tất cả các dịch vụ chuyên gia vào một hệ thống thống nhất
 */

import { expertNLP } from './expertNLP';
import { advancedAIService } from './advancedAIService';
import { analyticsEngine } from './analyticsEngine';
import { clinicalValidationService } from './clinicalValidation';
import { researchPlatform } from './researchPlatform';
import { internationalStandardsService } from './internationalStandards';

export interface ExpertSystemResponse {
  analysis: {
    sentiment: any;
    intent: any;
    crisis: any;
    cultural: any;
  };
  insights: {
    behavioral: any;
    predictive: any;
    clinical: any;
    research: any;
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    clinical: string[];
  };
  compliance: {
    status: any;
    requirements: string[];
    alerts: string[];
  };
  report: {
    summary: string;
    details: any;
    generatedAt: Date;
  };
}

export interface ExpertSystemConfig {
  enableNLP: boolean;
  enableML: boolean;
  enableAnalytics: boolean;
  enableClinical: boolean;
  enableResearch: boolean;
  enableCompliance: boolean;
  culturalContext: any;
  userProfile: any;
}

class ExpertIntegrationService {
  private config: ExpertSystemConfig;

  constructor(config: ExpertSystemConfig) {
    this.config = config;
  }

  /**
   * Phân tích toàn diện với tất cả các hệ thống chuyên gia
   */
  async performComprehensiveAnalysis(
    userInput: string,
    testResults: any[],
    userId: string
  ): Promise<ExpertSystemResponse> {
    const analysis = await this.performMultiSystemAnalysis(userInput, testResults, userId);
    const insights = await this.generateComprehensiveInsights(userInput, testResults, userId);
    const recommendations = await this.generateExpertRecommendations(analysis, insights, userId);
    const compliance = await this.checkComplianceStatus(userId);
    const report = await this.generateExpertReport(analysis, insights, recommendations, compliance);

    return {
      analysis,
      insights,
      recommendations,
      compliance,
      report
    };
  }

  /**
   * Phân tích đa hệ thống
   */
  private async performMultiSystemAnalysis(
    userInput: string,
    testResults: any[],
    userId: string
  ): Promise<any> {
    const analysis: any = {};

    // NLP Analysis
    if (this.config.enableNLP) {
      analysis.sentiment = expertNLP.analyzeSentiment(userInput);
      analysis.intent = expertNLP.recognizeIntent(userInput);
      analysis.crisis = expertNLP.detectCrisis(userInput);
      analysis.cultural = expertNLP.analyzeCulturalContext(userInput, this.config.userProfile);
    }

    // Clinical Analysis
    if (this.config.enableClinical && testResults.length > 0) {
      const clinicalAssessments = testResults.map(result => 
        clinicalValidationService.validateTestResult(
          result.testType,
          result.score,
          this.config.userProfile,
          analysis.cultural
        )
      );
      analysis.clinical = clinicalAssessments;
    }

    return analysis;
  }

  /**
   * Tạo insights toàn diện
   */
  private async generateComprehensiveInsights(
    userInput: string,
    testResults: any[],
    userId: string
  ): Promise<any> {
    const insights: any = {};

    // Behavioral Insights
    if (this.config.enableML) {
      const userPattern = advancedAIService.analyzeUserBehavior(userId, [], testResults);
      insights.behavioral = userPattern;
    }

    // Predictive Insights
    if (this.config.enableML) {
      const predictiveInsights = advancedAIService.generatePredictiveInsights(userId, {});
      insights.predictive = predictiveInsights;
    }

    // Clinical Insights
    if (this.config.enableClinical && testResults.length > 0) {
      const clinicalAssessment = clinicalValidationService.performDifferentialDiagnosis(
        testResults,
        this.config.userProfile,
        this.config.culturalContext
      );
      insights.clinical = clinicalAssessment;
    }

    // Research Insights
    if (this.config.enableResearch) {
      const researchData = testResults.map(result => ({
        studyId: 'main_study',
        participantId: userId,
        timestamp: new Date(),
        dataType: 'test_result' as const,
        data: result,
        metadata: {
          sessionId: 'current_session',
          device: 'web',
          location: 'Vietnam',
          culturalContext: this.config.culturalContext
        }
      }));

      researchData.forEach(data => researchPlatform.collectData(data));
      
      const researchInsights = researchPlatform.createResearchDashboard('main_study');
      insights.research = researchInsights;
    }

    return insights;
  }

  /**
   * Tạo khuyến nghị chuyên gia
   */
  private async generateExpertRecommendations(
    analysis: any,
    insights: any,
    userId: string
  ): Promise<any> {
    const recommendations: any = {
      immediate: [],
      shortTerm: [],
      longTerm: [],
      clinical: []
    };

    // Crisis-based immediate recommendations
    if (analysis.crisis && analysis.crisis.level !== 'low') {
      recommendations.immediate.push(...analysis.crisis.recommendations);
    }

    // AI-based recommendations
    if (this.config.enableML && insights.behavioral) {
      const personalizedRecs = advancedAIService.generatePersonalizedRecommendations(
        userId,
        {},
        this.config.culturalContext
      );
      
      personalizedRecs.forEach(rec => {
        if (rec.type === 'immediate') {
          recommendations.immediate.push(rec.content);
        } else if (rec.type === 'short_term') {
          recommendations.shortTerm.push(rec.content);
        } else if (rec.type === 'long_term') {
          recommendations.longTerm.push(rec.content);
        }
      });
    }

    // Clinical recommendations
    if (this.config.enableClinical && insights.clinical) {
      const clinicalRecs = clinicalValidationService.generateEvidenceBasedRecommendations(
        insights.clinical,
        this.config.userProfile,
        this.config.culturalContext
      );
      recommendations.clinical.push(...clinicalRecs);
    }

    // Cultural adaptation
    recommendations.immediate = this.adaptRecommendationsToCulture(
      recommendations.immediate,
      this.config.culturalContext
    );
    recommendations.shortTerm = this.adaptRecommendationsToCulture(
      recommendations.shortTerm,
      this.config.culturalContext
    );
    recommendations.longTerm = this.adaptRecommendationsToCulture(
      recommendations.longTerm,
      this.config.culturalContext
    );

    return recommendations;
  }

  /**
   * Kiểm tra trạng thái tuân thủ
   */
  private async checkComplianceStatus(userId: string): Promise<any> {
    const compliance: any = {
      status: {},
      requirements: [],
      alerts: []
    };

    if (this.config.enableCompliance) {
      // Check GDPR compliance
      const gdprStatus = internationalStandardsService.assessCompliance('GDPR');
      compliance.status.GDPR = gdprStatus;

      // Check Vietnamese data protection law
      const vnDplStatus = internationalStandardsService.assessCompliance('VN-DPL');
      compliance.status.VN_DPL = vnDplStatus;

      // Check accessibility compliance
      const wcagStatus = internationalStandardsService.assessCompliance('WCAG');
      compliance.status.WCAG = wcagStatus;

      // Generate requirements and alerts
      compliance.requirements = this.generateComplianceRequirements(compliance.status);
      compliance.alerts = this.generateComplianceAlerts(compliance.status);
    }

    return compliance;
  }

  /**
   * Tạo báo cáo chuyên gia
   */
  private async generateExpertReport(
    analysis: any,
    insights: any,
    recommendations: any,
    compliance: any
  ): Promise<any> {
    const report = {
      summary: this.generateExecutiveSummary(analysis, insights, recommendations),
      details: {
        analysis,
        insights,
        recommendations,
        compliance
      },
      generatedAt: new Date()
    };

    return report;
  }

  /**
   * Cập nhật cấu hình hệ thống
   */
  updateConfig(newConfig: Partial<ExpertSystemConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Lấy trạng thái hệ thống
   */
  getSystemStatus(): any {
    return {
      nlp: this.config.enableNLP ? 'active' : 'inactive',
      ml: this.config.enableML ? 'active' : 'inactive',
      analytics: this.config.enableAnalytics ? 'active' : 'inactive',
      clinical: this.config.enableClinical ? 'active' : 'inactive',
      research: this.config.enableResearch ? 'active' : 'inactive',
      compliance: this.config.enableCompliance ? 'active' : 'inactive',
      culturalContext: this.config.culturalContext,
      lastUpdate: new Date()
    };
  }

  /**
   * Thực hiện kiểm tra sức khỏe hệ thống
   */
  async performSystemHealthCheck(): Promise<any> {
    const healthCheck: any = {
      timestamp: new Date(),
      systems: {},
      overall: 'healthy'
    };

    // Check NLP system
    try {
      const testInput = 'Xin chào, tôi cần hỗ trợ';
      expertNLP.analyzeSentiment(testInput);
      healthCheck.systems.nlp = 'healthy';
    } catch (error) {
      healthCheck.systems.nlp = 'unhealthy';
      healthCheck.overall = 'degraded';
    }

    // Check ML system
    try {
      advancedAIService.generatePredictiveInsights('test_user', {});
      healthCheck.systems.ml = 'healthy';
    } catch (error) {
      healthCheck.systems.ml = 'unhealthy';
      healthCheck.overall = 'degraded';
    }

    // Check Analytics system
    try {
      analyticsEngine.addDataPoint({
        timestamp: new Date(),
        userId: 'test_user',
        testType: 'test',
        score: 50,
        metadata: {}
      });
      healthCheck.systems.analytics = 'healthy';
    } catch (error) {
      healthCheck.systems.analytics = 'unhealthy';
      healthCheck.overall = 'degraded';
    }

    // Check Clinical system
    try {
      clinicalValidationService.validateTestResult('test', 50, {}, {});
      healthCheck.systems.clinical = 'healthy';
    } catch (error) {
      healthCheck.systems.clinical = 'unhealthy';
      healthCheck.overall = 'degraded';
    }

    // Check Research system
    try {
      researchPlatform.createStudy({ title: 'Test Study' });
      healthCheck.systems.research = 'healthy';
    } catch (error) {
      healthCheck.systems.research = 'unhealthy';
      healthCheck.overall = 'degraded';
    }

    // Check Compliance system
    try {
      internationalStandardsService.assessCompliance('GDPR');
      healthCheck.systems.compliance = 'healthy';
    } catch (error) {
      healthCheck.systems.compliance = 'unhealthy';
      healthCheck.overall = 'degraded';
    }

    return healthCheck;
  }

  // Helper methods
  private adaptRecommendationsToCulture(recommendations: string[], culturalContext: any): string[] {
    if (!culturalContext) return recommendations;

    return recommendations.map(rec => {
      if (culturalContext.region === 'north') {
        return rec.replace(/bạn/g, 'anh/chị').replace(/mình/g, 'tôi');
      } else if (culturalContext.region === 'south') {
        return rec.replace(/bạn/g, 'bạn').replace(/mình/g, 'mình');
      }
      return rec;
    });
  }

  private generateComplianceRequirements(status: any): string[] {
    const requirements: string[] = [];
    
    Object.entries(status).forEach(([standard, compliance]: [string, any]) => {
      if (compliance.overall !== 'compliant') {
        requirements.push(`Cần cải thiện tuân thủ ${standard}`);
      }
    });
    
    return requirements;
  }

  private generateComplianceAlerts(status: any): string[] {
    const alerts: string[] = [];
    
    Object.entries(status).forEach(([standard, compliance]: [string, any]) => {
      if (compliance.score < 70) {
        alerts.push(`Cảnh báo: ${standard} có điểm tuân thủ thấp (${compliance.score}%)`);
      }
    });
    
    return alerts;
  }

  private generateExecutiveSummary(analysis: any, insights: any, recommendations: any): string {
    let summary = 'Báo cáo phân tích chuyên gia:\n\n';
    
    if (analysis.crisis && analysis.crisis.level !== 'low') {
      summary += `⚠️ Phát hiện khủng hoảng tâm lý mức ${analysis.crisis.level}\n`;
    }
    
    if (insights.predictive && insights.predictive.interventionNeeded) {
      summary += '🔍 Cần can thiệp chuyên môn\n';
    }
    
    if (recommendations.immediate.length > 0) {
      summary += `📋 ${recommendations.immediate.length} khuyến nghị khẩn cấp\n`;
    }
    
    summary += `\nTổng cộng: ${recommendations.immediate.length + recommendations.shortTerm.length + recommendations.longTerm.length} khuyến nghị được đưa ra`;
    
    return summary;
  }
}

// Factory function để tạo instance với cấu hình mặc định
export function createExpertSystem(config?: Partial<ExpertSystemConfig>): ExpertIntegrationService {
  const defaultConfig: ExpertSystemConfig = {
    enableNLP: true,
    enableML: true,
    enableAnalytics: true,
    enableClinical: true,
    enableResearch: true,
    enableCompliance: true,
    culturalContext: {
      region: 'north',
      ageGroup: 'young_adult',
      education: 'intermediate',
      socialClass: 'middle',
      familyStructure: 'nuclear'
    },
    userProfile: {}
  };

  const finalConfig = { ...defaultConfig, ...config };
  return new ExpertIntegrationService(finalConfig);
}

export const expertIntegrationService = createExpertSystem();
export default expertIntegrationService;

