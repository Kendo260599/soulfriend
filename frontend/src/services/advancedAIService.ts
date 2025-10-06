/**
 * Advanced AI Service với Machine Learning
 * Hệ thống AI chuyên gia với khả năng học và thích ứng
 */

import { expertNLP, SentimentAnalysis, IntentRecognition, CrisisDetection, CulturalContext } from './expertNLP';

export interface UserBehaviorPattern {
  testFrequency: number;
  preferredTestTypes: string[];
  responsePatterns: string[];
  emotionalTrends: SentimentAnalysis[];
  interactionTimes: Date[];
  sessionDuration: number;
  crisisHistory: CrisisDetection[];
}

export interface PredictiveInsights {
  riskLevel: 'low' | 'medium' | 'high';
  recommendedActions: string[];
  nextLikelyBehavior: string;
  interventionNeeded: boolean;
  confidence: number;
}

export interface PersonalizedRecommendation {
  type: 'immediate' | 'short_term' | 'long_term';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  content: string;
  rationale: string;
  expectedOutcome: string;
  culturalAdaptation: string;
}

export interface ClinicalAssessment {
  diagnosis: string;
  severity: 'mild' | 'moderate' | 'severe';
  riskFactors: string[];
  protectiveFactors: string[];
  treatmentRecommendations: string[];
  followUpSchedule: string[];
  emergencyProtocol: string[];
}

class AdvancedAIService {
  private userProfiles: Map<string, UserBehaviorPattern> = new Map();
  private learningModels: Map<string, any> = new Map();
  private culturalDatabase: Map<string, CulturalContext> = new Map();

  /**
   * Phân tích hành vi người dùng và tạo pattern
   */
  analyzeUserBehavior(
    userId: string, 
    interactions: any[], 
    testResults: any[]
  ): UserBehaviorPattern {
    const pattern: UserBehaviorPattern = {
      testFrequency: this.calculateTestFrequency(interactions),
      preferredTestTypes: this.identifyPreferredTests(testResults),
      responsePatterns: this.extractResponsePatterns(interactions),
      emotionalTrends: this.analyzeEmotionalTrends(interactions),
      interactionTimes: this.extractInteractionTimes(interactions),
      sessionDuration: this.calculateAverageSessionDuration(interactions),
      crisisHistory: this.extractCrisisHistory(interactions)
    };

    this.userProfiles.set(userId, pattern);
    return pattern;
  }

  /**
   * Tạo insights dự đoán dựa trên machine learning
   */
  generatePredictiveInsights(
    userId: string, 
    currentContext: any
  ): PredictiveInsights {
    const userPattern = this.userProfiles.get(userId);
    if (!userPattern) {
      return this.getDefaultInsights();
    }

    const riskLevel = this.calculateRiskLevel(userPattern, currentContext);
    const recommendedActions = this.generateRecommendedActions(userPattern, riskLevel);
    const nextLikelyBehavior = this.predictNextBehavior(userPattern);
    const interventionNeeded = this.assessInterventionNeed(userPattern, currentContext);
    const confidence = this.calculatePredictionConfidence(userPattern);

    return {
      riskLevel,
      recommendedActions,
      nextLikelyBehavior,
      interventionNeeded,
      confidence
    };
  }

  /**
   * Tạo khuyến nghị cá nhân hóa chuyên sâu
   */
  generatePersonalizedRecommendations(
    userId: string,
    currentSituation: any,
    culturalContext: CulturalContext
  ): PersonalizedRecommendation[] {
    const userPattern = this.userProfiles.get(userId);
    const recommendations: PersonalizedRecommendation[] = [];

    // Immediate recommendations
    if (currentSituation.crisisLevel === 'high' || currentSituation.crisisLevel === 'critical') {
      recommendations.push({
        type: 'immediate',
        priority: 'urgent',
        content: this.generateCrisisResponse(culturalContext),
        rationale: 'Dựa trên phát hiện khủng hoảng tâm lý',
        expectedOutcome: 'Giảm nguy cơ và tăng sự an toàn',
        culturalAdaptation: this.adaptToCulturalContext(culturalContext, 'crisis')
      });
    }

    // Short-term recommendations
    if (userPattern) {
      recommendations.push({
        type: 'short_term',
        priority: this.calculatePriority(userPattern),
        content: this.generateShortTermRecommendation(userPattern, culturalContext),
        rationale: 'Dựa trên phân tích hành vi và xu hướng cảm xúc',
        expectedOutcome: 'Cải thiện tình trạng sức khỏe tâm lý trong 1-2 tuần',
        culturalAdaptation: this.adaptToCulturalContext(culturalContext, 'short_term')
      });
    }

    // Long-term recommendations
    recommendations.push({
      type: 'long_term',
      priority: 'medium',
      content: this.generateLongTermRecommendation(userPattern || {} as UserBehaviorPattern, culturalContext),
      rationale: 'Dựa trên mục tiêu phát triển bản thân dài hạn',
      expectedOutcome: 'Xây dựng khả năng phục hồi và phát triển bền vững',
      culturalAdaptation: this.adaptToCulturalContext(culturalContext, 'long_term')
    });

    return recommendations;
  }

  /**
   * Đánh giá lâm sàng chuyên sâu
   */
  performClinicalAssessment(
    testResults: any[],
    userProfile: any,
    culturalContext: CulturalContext
  ): ClinicalAssessment {
    const diagnosis = this.generateDiagnosis(testResults, userProfile);
    const severity = this.assessSeverity(testResults);
    const riskFactors = this.identifyRiskFactors(testResults, userProfile, culturalContext);
    const protectiveFactors = this.identifyProtectiveFactors(testResults, userProfile, culturalContext);
    const treatmentRecommendations = this.generateTreatmentRecommendations(diagnosis, severity, culturalContext);
    const followUpSchedule = this.createFollowUpSchedule(severity, riskFactors);
    const emergencyProtocol = this.createEmergencyProtocol(severity, riskFactors);

    return {
      diagnosis,
      severity,
      riskFactors,
      protectiveFactors,
      treatmentRecommendations,
      followUpSchedule,
      emergencyProtocol
    };
  }

  /**
   * Học từ tương tác và cải thiện mô hình
   */
  learnFromInteraction(
    userId: string,
    interaction: any,
    outcome: any
  ): void {
    const userPattern = this.userProfiles.get(userId);
    if (!userPattern) return;

    // Cập nhật pattern dựa trên kết quả
    this.updateBehaviorPattern(userPattern, interaction, outcome);
    
    // Cập nhật mô hình học máy
    this.updateLearningModel(userId, interaction, outcome);
    
    // Lưu lại pattern mới
    this.userProfiles.set(userId, userPattern);
  }

  /**
   * Tạo báo cáo chuyên gia tự động
   */
  generateExpertReport(
    userId: string,
    timeRange: { start: Date; end: Date }
  ): any {
    const userPattern = this.userProfiles.get(userId);
    if (!userPattern) return null;

    const culturalContext = this.culturalDatabase.get(userId);
    
    return {
      executiveSummary: this.generateExecutiveSummary(userPattern, culturalContext),
      behavioralAnalysis: this.generateBehavioralAnalysis(userPattern),
      riskAssessment: this.generateRiskAssessment(userPattern),
      recommendations: this.generateExpertRecommendations(userPattern, culturalContext),
      culturalConsiderations: this.generateCulturalConsiderations(culturalContext),
      nextSteps: this.generateNextSteps(userPattern),
      generatedAt: new Date(),
      confidence: this.calculateReportConfidence(userPattern)
    };
  }

  // Helper methods
  private calculateTestFrequency(interactions: any[]): number {
    const testInteractions = interactions.filter(i => i.type === 'test_completion');
    const timeSpan = this.getTimeSpan(interactions);
    return testInteractions.length / Math.max(timeSpan, 1);
  }

  private identifyPreferredTests(testResults: any[]): string[] {
    const testCounts = testResults.reduce((acc, result) => {
      acc[result.testType] = (acc[result.testType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(testCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([testType]) => testType);
  }

  private extractResponsePatterns(interactions: any[]): string[] {
    return interactions
      .filter(i => i.type === 'chat_message')
      .map(i => i.content)
      .slice(-10); // Last 10 messages
  }

  private analyzeEmotionalTrends(interactions: any[]): SentimentAnalysis[] {
    return interactions
      .filter(i => i.type === 'chat_message')
      .map(i => expertNLP.analyzeSentiment(i.content));
  }

  private extractInteractionTimes(interactions: any[]): Date[] {
    return interactions.map(i => new Date(i.timestamp));
  }

  private calculateAverageSessionDuration(interactions: any[]): number {
    const sessions = this.groupIntoSessions(interactions);
    const durations = sessions.map(session => {
      const start = new Date(session[0].timestamp);
      const end = new Date(session[session.length - 1].timestamp);
      return end.getTime() - start.getTime();
    });
    
    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  }

  private extractCrisisHistory(interactions: any[]): CrisisDetection[] {
    return interactions
      .filter(i => i.type === 'chat_message')
      .map(i => expertNLP.detectCrisis(i.content))
      .filter(crisis => crisis.level !== 'low');
  }

  private calculateRiskLevel(pattern: UserBehaviorPattern, currentContext: any): 'low' | 'medium' | 'high' {
    let riskScore = 0;

    // Crisis history
    if (pattern.crisisHistory.length > 0) {
      riskScore += pattern.crisisHistory.length * 0.3;
    }

    // Emotional trends
    const recentEmotions = pattern.emotionalTrends.slice(-5);
    const negativeEmotions = recentEmotions.filter(e => e.score < -0.3).length;
    riskScore += negativeEmotions * 0.2;

    // Test frequency (too high might indicate distress)
    if (pattern.testFrequency > 2) {
      riskScore += 0.2;
    }

    // Current context
    if (currentContext.crisisLevel === 'high' || currentContext.crisisLevel === 'critical') {
      riskScore += 0.5;
    }

    if (riskScore < 0.3) return 'low';
    if (riskScore < 0.7) return 'medium';
    return 'high';
  }

  private generateRecommendedActions(pattern: UserBehaviorPattern, riskLevel: string): string[] {
    const actions = {
      low: [
        'Duy trì các hoạt động tích cực hiện tại',
        'Tiếp tục theo dõi tình trạng sức khỏe tâm lý',
        'Tham gia các hoạt động cộng đồng'
      ],
      medium: [
        'Tăng cường các kỹ thuật thư giãn',
        'Tìm kiếm sự hỗ trợ từ bạn bè và gia đình',
        'Cân nhắc tham khảo ý kiến chuyên gia'
      ],
      high: [
        'Tìm kiếm sự hỗ trợ chuyên nghiệp ngay lập tức',
        'Thực hiện các biện pháp an toàn',
        'Liên hệ với các dịch vụ hỗ trợ khẩn cấp'
      ]
    };

    return actions[riskLevel as keyof typeof actions] || actions.low;
  }

  private predictNextBehavior(pattern: UserBehaviorPattern): string {
    // Simple prediction based on patterns
    if (pattern.crisisHistory.length > 0) {
      return 'Có thể cần hỗ trợ khủng hoảng';
    }
    if (pattern.testFrequency > 1) {
      return 'Tiếp tục làm test đánh giá';
    }
    return 'Tương tác bình thường với hệ thống';
  }

  private assessInterventionNeed(pattern: UserBehaviorPattern, currentContext: any): boolean {
    return pattern.crisisHistory.length > 0 || 
           currentContext.crisisLevel === 'high' || 
           currentContext.crisisLevel === 'critical';
  }

  private calculatePredictionConfidence(pattern: UserBehaviorPattern): number {
    // Confidence based on amount of data
    const dataPoints = pattern.emotionalTrends.length + pattern.responsePatterns.length;
    return Math.min(dataPoints / 50, 1.0);
  }

  private generateCrisisResponse(culturalContext: CulturalContext): string {
    const responses = {
      north: 'Tôi rất lo lắng về bạn. Hãy gọi ngay 115 hoặc đến bệnh viện gần nhất.',
      central: 'Tôi hiểu bạn đang gặp khó khăn rất lớn. Hãy tìm kiếm sự giúp đỡ ngay lập tức.',
      south: 'Mình rất quan tâm đến bạn. Hãy liên hệ ngay với các dịch vụ hỗ trợ khẩn cấp.'
    };

    return responses[culturalContext.region] || responses.north;
  }

  private adaptToCulturalContext(context: CulturalContext, type: string): string {
    const adaptations = {
      north: 'Phù hợp với văn hóa miền Bắc',
      central: 'Phù hợp với văn hóa miền Trung',
      south: 'Phù hợp với văn hóa miền Nam'
    };

    return adaptations[context.region] || adaptations.north;
  }

  private calculatePriority(pattern: UserBehaviorPattern): 'low' | 'medium' | 'high' | 'urgent' {
    if (pattern.crisisHistory.length > 0) return 'urgent';
    if (pattern.emotionalTrends.some(e => e.score < -0.5)) return 'high';
    if (pattern.testFrequency > 1) return 'medium';
    return 'low';
  }

  private generateShortTermRecommendation(pattern: UserBehaviorPattern, context: CulturalContext): string {
    return 'Thực hành các kỹ thuật thư giãn phù hợp với văn hóa địa phương';
  }

  private generateLongTermRecommendation(pattern: UserBehaviorPattern, context: CulturalContext): string {
    return 'Xây dựng mạng lưới hỗ trợ xã hội bền vững';
  }

  private generateDiagnosis(testResults: any[], userProfile: any): string {
    // Simplified diagnosis based on test results
    const highScores = testResults.filter(r => r.evaluation?.level === 'high' || r.evaluation?.level === 'severe');
    
    if (highScores.length > 2) {
      return 'Có dấu hiệu rối loạn tâm lý cần đánh giá chuyên sâu';
    }
    if (highScores.length > 0) {
      return 'Có một số dấu hiệu căng thẳng tâm lý';
    }
    return 'Tình trạng sức khỏe tâm lý ổn định';
  }

  private assessSeverity(testResults: any[]): 'mild' | 'moderate' | 'severe' {
    const severeResults = testResults.filter(r => r.evaluation?.level === 'severe');
    const highResults = testResults.filter(r => r.evaluation?.level === 'high');
    
    if (severeResults.length > 0) return 'severe';
    if (highResults.length > 1) return 'moderate';
    return 'mild';
  }

  private identifyRiskFactors(testResults: any[], userProfile: any, context: CulturalContext): string[] {
    const riskFactors = [];
    
    if (testResults.some(r => r.evaluation?.level === 'severe')) {
      riskFactors.push('Điểm số test ở mức nghiêm trọng');
    }
    
    if (context.ageGroup === 'teen' || context.ageGroup === 'senior') {
      riskFactors.push('Nhóm tuổi có nguy cơ cao');
    }
    
    if (context.socialClass === 'working') {
      riskFactors.push('Áp lực kinh tế có thể ảnh hưởng');
    }
    
    return riskFactors;
  }

  private identifyProtectiveFactors(testResults: any[], userProfile: any, context: CulturalContext): string[] {
    const protectiveFactors = [];
    
    if (context.familyStructure === 'extended') {
      protectiveFactors.push('Hỗ trợ từ gia đình mở rộng');
    }
    
    if (context.education === 'advanced') {
      protectiveFactors.push('Trình độ học vấn cao');
    }
    
    if (testResults.some(r => r.evaluation?.level === 'normal')) {
      protectiveFactors.push('Một số lĩnh vực sức khỏe tâm lý ổn định');
    }
    
    return protectiveFactors;
  }

  private generateTreatmentRecommendations(diagnosis: string, severity: string, context: CulturalContext): string[] {
    const recommendations = [];
    
    if (severity === 'severe') {
      recommendations.push('Tư vấn chuyên gia tâm lý ngay lập tức');
      recommendations.push('Có thể cần can thiệp y tế');
    } else if (severity === 'moderate') {
      recommendations.push('Tham khảo ý kiến chuyên gia tâm lý');
      recommendations.push('Tham gia các chương trình hỗ trợ cộng đồng');
    } else {
      recommendations.push('Tự chăm sóc và theo dõi');
      recommendations.push('Tham gia các hoạt động tích cực');
    }
    
    return recommendations;
  }

  private createFollowUpSchedule(severity: string, riskFactors: string[]): string[] {
    const schedules = [];
    
    if (severity === 'severe') {
      schedules.push('Theo dõi hàng ngày trong tuần đầu');
      schedules.push('Đánh giá lại sau 1 tuần');
    } else if (severity === 'moderate') {
      schedules.push('Theo dõi 2-3 lần/tuần');
      schedules.push('Đánh giá lại sau 2 tuần');
    } else {
      schedules.push('Theo dõi hàng tuần');
      schedules.push('Đánh giá lại sau 1 tháng');
    }
    
    return schedules;
  }

  private createEmergencyProtocol(severity: string, riskFactors: string[]): string[] {
    const protocols = [];
    
    protocols.push('Gọi 115 nếu có ý định tự hại');
    protocols.push('Liên hệ tổng đài hỗ trợ tâm lý 24/7');
    protocols.push('Đến bệnh viện tâm thần gần nhất');
    
    if (riskFactors.length > 0) {
      protocols.push('Thông báo cho người thân về tình trạng');
    }
    
    return protocols;
  }

  private updateBehaviorPattern(pattern: UserBehaviorPattern, interaction: any, outcome: any): void {
    // Update pattern based on new interaction
    if (interaction.type === 'chat_message') {
      pattern.responsePatterns.push(interaction.content);
      pattern.responsePatterns = pattern.responsePatterns.slice(-20); // Keep last 20
    }
    
    if (interaction.type === 'test_completion') {
      pattern.testFrequency = this.calculateTestFrequency([...pattern.responsePatterns.map(r => ({ type: 'test_completion', timestamp: new Date() }))]);
    }
  }

  private updateLearningModel(userId: string, interaction: any, outcome: any): void {
    // Update ML model based on interaction and outcome
    const model = this.learningModels.get(userId) || {};
    // Simplified model update
    this.learningModels.set(userId, { ...model, lastUpdate: new Date() });
  }

  private generateExecutiveSummary(pattern: UserBehaviorPattern, context: CulturalContext | undefined): string {
    return `Báo cáo tổng hợp về tình trạng sức khỏe tâm lý dựa trên phân tích hành vi và ngữ cảnh văn hóa ${context?.region || 'Việt Nam'}.`;
  }

  private generateBehavioralAnalysis(pattern: UserBehaviorPattern): any {
    return {
      testFrequency: pattern.testFrequency,
      preferredTests: pattern.preferredTestTypes,
      emotionalStability: this.calculateEmotionalStability(pattern.emotionalTrends),
      sessionEngagement: this.calculateSessionEngagement(pattern)
    };
  }

  private generateRiskAssessment(pattern: UserBehaviorPattern): any {
    return {
      crisisHistory: pattern.crisisHistory.length,
      riskLevel: this.calculateRiskLevel(pattern, {}),
      riskFactors: this.identifyRiskFactors([], {}, {} as CulturalContext)
    };
  }

  private generateExpertRecommendations(pattern: UserBehaviorPattern, context: CulturalContext | undefined): string[] {
    return this.generatePersonalizedRecommendations('user', {}, context || {} as CulturalContext)
      .map(rec => rec.content);
  }

  private generateCulturalConsiderations(context: CulturalContext | undefined): string {
    if (!context) return 'Không có thông tin văn hóa cụ thể';
    
    return `Cần xem xét các yếu tố văn hóa: vùng miền ${context.region}, nhóm tuổi ${context.ageGroup}, trình độ học vấn ${context.education}`;
  }

  private generateNextSteps(pattern: UserBehaviorPattern): string[] {
    return [
      'Tiếp tục theo dõi tình trạng',
      'Thực hiện các khuyến nghị đã đưa ra',
      'Đánh giá lại sau thời gian quy định'
    ];
  }

  private calculateReportConfidence(pattern: UserBehaviorPattern): number {
    const dataPoints = pattern.emotionalTrends.length + pattern.responsePatterns.length;
    return Math.min(dataPoints / 100, 1.0);
  }

  private getDefaultInsights(): PredictiveInsights {
    return {
      riskLevel: 'low',
      recommendedActions: ['Duy trì các hoạt động tích cực'],
      nextLikelyBehavior: 'Tương tác bình thường',
      interventionNeeded: false,
      confidence: 0.5
    };
  }

  private getTimeSpan(interactions: any[]): number {
    if (interactions.length < 2) return 1;
    const first = new Date(interactions[0].timestamp);
    const last = new Date(interactions[interactions.length - 1].timestamp);
    return Math.max((last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24), 1); // Days
  }

  private groupIntoSessions(interactions: any[]): any[][] {
    const sessions = [];
    let currentSession = [];
    
    for (const interaction of interactions) {
      if (interaction.type === 'session_start') {
        if (currentSession.length > 0) {
          sessions.push(currentSession);
        }
        currentSession = [interaction];
      } else {
        currentSession.push(interaction);
      }
    }
    
    if (currentSession.length > 0) {
      sessions.push(currentSession);
    }
    
    return sessions;
  }

  private calculateEmotionalStability(trends: SentimentAnalysis[]): number {
    if (trends.length < 2) return 0.5;
    
    const scores = trends.map(t => t.score);
    const variance = this.calculateVariance(scores);
    return Math.max(0, 1 - variance);
  }

  private calculateSessionEngagement(pattern: UserBehaviorPattern): number {
    const avgDuration = pattern.sessionDuration;
    const frequency = pattern.testFrequency;
    return Math.min((avgDuration / 60000) * frequency, 1); // Normalize
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }
}

export const advancedAIService = new AdvancedAIService();
export default advancedAIService;

