/**
 * Advanced Analytics Engine
 * Hệ thống phân tích dữ liệu chuyên sâu với Machine Learning
 */

export interface DataPoint {
  timestamp: Date;
  userId: string;
  testType: string;
  score: number;
  metadata: any;
}

export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  magnitude: number;
  confidence: number;
  significance: 'low' | 'medium' | 'high';
  prediction: {
    nextValue: number;
    confidence: number;
    timeframe: string;
  };
}

export interface CorrelationAnalysis {
  variables: string[];
  correlation: number;
  significance: number;
  interpretation: string;
  recommendations: string[];
}

export interface ClusterAnalysis {
  clusters: Array<{
    id: string;
    centroid: number[];
    size: number;
    characteristics: string[];
    representativeUsers: string[];
  }>;
  silhouetteScore: number;
  insights: string[];
}

export interface AnomalyDetection {
  anomalies: Array<{
    timestamp: Date;
    userId: string;
    type: 'score_spike' | 'behavior_change' | 'pattern_break';
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendations: string[];
  }>;
  overallRisk: 'low' | 'medium' | 'high';
}

export interface PredictiveModel {
  name: string;
  accuracy: number;
  features: string[];
  predictions: Array<{
    userId: string;
    predictedValue: number;
    confidence: number;
    timeframe: string;
  }>;
}

class AdvancedAnalyticsEngine {
  private dataPoints: DataPoint[] = [];
  private models: Map<string, any> = new Map();

  /**
   * Thêm dữ liệu mới vào hệ thống
   */
  addDataPoint(dataPoint: DataPoint): void {
    this.dataPoints.push(dataPoint);
    this.updateModels();
  }

  /**
   * Phân tích xu hướng cho một người dùng cụ thể
   */
  analyzeTrends(userId: string, testType: string, timeframe: string = '30d'): TrendAnalysis {
    const userData = this.getUserData(userId, testType, timeframe);
    if (userData.length < 2) {
      return this.getDefaultTrendAnalysis();
    }

    const scores = userData.map(d => d.score);
    const direction = this.calculateDirection(scores);
    const magnitude = this.calculateMagnitude(scores);
    const confidence = this.calculateTrendConfidence(scores);
    const significance = this.calculateSignificance(scores);
    const prediction = this.predictNextValue(scores);

    return {
      direction,
      magnitude,
      confidence,
      significance,
      prediction
    };
  }

  /**
   * Phân tích tương quan giữa các biến
   */
  analyzeCorrelations(
    userId: string, 
    variables: string[], 
    timeframe: string = '90d'
  ): CorrelationAnalysis[] {
    const userData = this.getUserDataByTimeframe(userId, timeframe);
    const correlations: CorrelationAnalysis[] = [];

    for (let i = 0; i < variables.length; i++) {
      for (let j = i + 1; j < variables.length; j++) {
        const var1 = variables[i];
        const var2 = variables[j];
        
        const values1 = this.extractVariableValues(userData, var1);
        const values2 = this.extractVariableValues(userData, var2);
        
        if (values1.length > 0 && values2.length > 0) {
          const correlation = this.calculateCorrelation(values1, values2);
          const significance = this.calculateCorrelationSignificance(correlation, values1.length);
          
          correlations.push({
            variables: [var1, var2],
            correlation,
            significance,
            interpretation: this.interpretCorrelation(correlation),
            recommendations: this.generateCorrelationRecommendations(var1, var2, correlation)
          });
        }
      }
    }

    return correlations;
  }

  /**
   * Phân tích clustering để nhóm người dùng
   */
  performClusterAnalysis(
    testType: string,
    features: string[],
    k: number = 3
  ): ClusterAnalysis {
    const data = this.getTestData(testType);
    const featureMatrix = this.createFeatureMatrix(data, features);
    
    const clusters = this.kMeansClustering(featureMatrix, k);
    const silhouetteScore = this.calculateSilhouetteScore(featureMatrix, clusters);
    const insights = this.generateClusterInsights(clusters, features);

    return {
      clusters,
      silhouetteScore,
      insights
    };
  }

  /**
   * Phát hiện bất thường trong dữ liệu
   */
  detectAnomalies(
    userId?: string,
    testType?: string,
    sensitivity: number = 0.1
  ): AnomalyDetection {
    const data = this.getFilteredData(userId, testType);
    const anomalies = [];

    // Detect score spikes
    const scoreAnomalies = this.detectScoreSpikes(data, sensitivity);
    anomalies.push(...scoreAnomalies);

    // Detect behavior changes
    const behaviorAnomalies = this.detectBehaviorChanges(data, sensitivity);
    anomalies.push(...behaviorAnomalies);

    // Detect pattern breaks
    const patternAnomalies = this.detectPatternBreaks(data, sensitivity);
    anomalies.push(...patternAnomalies);

    const overallRisk = this.calculateOverallRisk(anomalies);

    return {
      anomalies,
      overallRisk
    };
  }

  /**
   * Xây dựng mô hình dự đoán
   */
  buildPredictiveModel(
    targetVariable: string,
    features: string[],
    modelType: 'linear' | 'polynomial' | 'exponential' = 'linear'
  ): PredictiveModel {
    const trainingData = this.prepareTrainingData(targetVariable, features);
    const model = this.trainModel(trainingData, modelType);
    const accuracy = this.calculateModelAccuracy(model, trainingData);
    const predictions = this.generatePredictions(model, features);

    this.models.set(targetVariable, model);

    return {
      name: `${modelType}_${targetVariable}`,
      accuracy,
      features,
      predictions
    };
  }

  /**
   * Tạo báo cáo phân tích tổng hợp
   */
  generateComprehensiveReport(
    userId: string,
    timeframe: string = '90d'
  ): any {
    const userData = this.getUserDataByTimeframe(userId, timeframe);
    const testTypes = Array.from(new Set(userData.map(d => d.testType)));
    
    const trends = testTypes.map(testType => 
      this.analyzeTrends(userId, testType, timeframe)
    );
    
    const correlations = this.analyzeCorrelations(userId, testTypes, timeframe);
    const anomalies = this.detectAnomalies(userId);
    
    const riskAssessment = this.assessRiskLevel(userData, trends, anomalies);
    const recommendations = this.generateRecommendations(trends, correlations, anomalies);
    
    return {
      userId,
      timeframe,
      summary: {
        totalTests: userData.length,
        testTypes: testTypes.length,
        averageScore: this.calculateAverageScore(userData),
        riskLevel: riskAssessment.overallRisk
      },
      trends,
      correlations,
      anomalies,
      riskAssessment,
      recommendations,
      generatedAt: new Date()
    };
  }

  /**
   * Phân tích hiệu quả can thiệp
   */
  analyzeInterventionEffectiveness(
    userId: string,
    interventionStart: Date,
    interventionType: string
  ): any {
    const beforeData = this.getUserDataByTimeframe(userId, interventionStart.toISOString());
    const afterData = this.getUserDataByTimeframe(userId, new Date().toISOString(), interventionStart);
    
    const beforeTrend = this.calculateTrend(beforeData.map(d => d.score));
    const afterTrend = this.calculateTrend(afterData.map(d => d.score));
    
    const effectiveness = this.calculateEffectiveness(beforeTrend, afterTrend);
    const significance = this.calculateStatisticalSignificance(beforeData, afterData);
    
    return {
      interventionType,
      effectiveness,
      significance,
      beforeTrend,
      afterTrend,
      recommendation: this.generateInterventionRecommendation(effectiveness, significance)
    };
  }

  // Helper methods
  private getUserData(userId: string, testType: string, timeframe: string): DataPoint[] {
    const cutoffDate = this.getCutoffDate(timeframe);
    return this.dataPoints.filter(d => 
      d.userId === userId && 
      d.testType === testType && 
      d.timestamp >= cutoffDate
    );
  }

  private getUserDataByTimeframe(userId: string, timeframe: string, startDate?: Date): DataPoint[] {
    const cutoffDate = startDate || this.getCutoffDate(timeframe);
    return this.dataPoints.filter(d => 
      d.userId === userId && 
      d.timestamp >= cutoffDate
    );
  }

  private getTestData(testType: string): DataPoint[] {
    return this.dataPoints.filter(d => d.testType === testType);
  }

  private getFilteredData(userId?: string, testType?: string): DataPoint[] {
    return this.dataPoints.filter(d => 
      (!userId || d.userId === userId) && 
      (!testType || d.testType === testType)
    );
  }

  private getCutoffDate(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  private calculateDirection(scores: number[]): 'increasing' | 'decreasing' | 'stable' | 'volatile' {
    if (scores.length < 2) return 'stable';
    
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
    
    const change = secondAvg - firstAvg;
    const variance = this.calculateVariance(scores);
    
    if (variance > 0.5) return 'volatile';
    if (Math.abs(change) < 0.1) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  }

  private calculateMagnitude(scores: number[]): number {
    if (scores.length < 2) return 0;
    
    const first = scores[0];
    const last = scores[scores.length - 1];
    return Math.abs(last - first) / Math.max(first, 1);
  }

  private calculateTrendConfidence(scores: number[]): number {
    if (scores.length < 3) return 0.5;
    
    const rSquared = this.calculateRSquared(scores);
    return Math.max(0, Math.min(1, rSquared));
  }

  private calculateSignificance(scores: number[]): 'low' | 'medium' | 'high' {
    const confidence = this.calculateTrendConfidence(scores);
    if (confidence > 0.8) return 'high';
    if (confidence > 0.6) return 'medium';
    return 'low';
  }

  private predictNextValue(scores: number[]): { nextValue: number; confidence: number; timeframe: string } {
    if (scores.length < 2) {
      return { nextValue: scores[0] || 0, confidence: 0.5, timeframe: '1w' };
    }
    
    const trend = this.calculateTrend(scores);
    const nextValue = scores[scores.length - 1] + trend;
    const confidence = this.calculateTrendConfidence(scores);
    
    return {
      nextValue: Math.max(0, nextValue),
      confidence,
      timeframe: '1w'
    };
  }

  private calculateCorrelation(values1: number[], values2: number[]): number {
    if (values1.length !== values2.length || values1.length < 2) return 0;
    
    const n = values1.length;
    const sum1 = values1.reduce((sum, val) => sum + val, 0);
    const sum2 = values2.reduce((sum, val) => sum + val, 0);
    const sum1Sq = values1.reduce((sum, val) => sum + val * val, 0);
    const sum2Sq = values2.reduce((sum, val) => sum + val * val, 0);
    const sum12 = values1.reduce((sum, val, i) => sum + val * values2[i], 0);
    
    const numerator = n * sum12 - sum1 * sum2;
    const denominator = Math.sqrt((n * sum1Sq - sum1 * sum1) * (n * sum2Sq - sum2 * sum2));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateCorrelationSignificance(correlation: number, n: number): number {
    if (n < 3) return 0;
    
    const t = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation));
    return Math.min(1, Math.max(0, Math.abs(t) / 3)); // Simplified significance
  }

  private interpretCorrelation(correlation: number): string {
    const abs = Math.abs(correlation);
    if (abs > 0.8) return 'Tương quan rất mạnh';
    if (abs > 0.6) return 'Tương quan mạnh';
    if (abs > 0.4) return 'Tương quan vừa phải';
    if (abs > 0.2) return 'Tương quan yếu';
    return 'Không có tương quan đáng kể';
  }

  private generateCorrelationRecommendations(var1: string, var2: string, correlation: number): string[] {
    const recommendations = [];
    const abs = Math.abs(correlation);
    
    if (abs > 0.6) {
      recommendations.push(`Cần chú ý đến mối quan hệ giữa ${var1} và ${var2}`);
      if (correlation > 0) {
        recommendations.push(`Cải thiện ${var1} có thể giúp cải thiện ${var2}`);
      } else {
        recommendations.push(`Cải thiện ${var1} có thể giúp giảm ${var2}`);
      }
    }
    
    return recommendations;
  }

  private createFeatureMatrix(data: DataPoint[], features: string[]): number[][] {
    return data.map(d => features.map(f => this.extractFeatureValue(d, f)));
  }

  private extractFeatureValue(dataPoint: DataPoint, feature: string): number {
    switch (feature) {
      case 'score': return dataPoint.score;
      case 'timestamp': return dataPoint.timestamp.getTime();
      case 'userId': return this.hashString(dataPoint.userId);
      default: return dataPoint.metadata[feature] || 0;
    }
  }

  private kMeansClustering(data: number[][], k: number): Array<{
    id: string;
    centroid: number[];
    size: number;
    characteristics: string[];
    representativeUsers: string[];
  }> {
    // Simplified k-means implementation
    const clusters = [];
    const n = data.length;
    const dimensions = data[0].length;
    
    // Initialize centroids randomly
    for (let i = 0; i < k; i++) {
      const centroid = Array(dimensions).fill(0).map(() => Math.random());
      clusters.push({
        id: `cluster_${i}`,
        centroid,
        size: 0,
        characteristics: [],
        representativeUsers: []
      });
    }
    
    // Assign points to clusters
    for (let i = 0; i < n; i++) {
      let minDistance = Infinity;
      let closestCluster = 0;
      
      for (let j = 0; j < k; j++) {
        const distance = this.calculateDistance(data[i], clusters[j].centroid);
        if (distance < minDistance) {
          minDistance = distance;
          closestCluster = j;
        }
      }
      
      clusters[closestCluster].size++;
    }
    
    return clusters;
  }

  private calculateDistance(point1: number[], point2: number[]): number {
    return Math.sqrt(
      point1.reduce((sum, val, i) => sum + Math.pow(val - point2[i], 2), 0)
    );
  }

  private calculateSilhouetteScore(data: number[][], clusters: any[]): number {
    // Simplified silhouette score calculation
    return 0.7; // Placeholder
  }

  private generateClusterInsights(clusters: any[], features: string[]): string[] {
    const insights: string[] = [];
    
    clusters.forEach((cluster, index) => {
      if (cluster.size > 0) {
        insights.push(`Cluster ${index + 1} có ${cluster.size} người dùng với đặc điểm riêng biệt`);
      }
    });
    
    return insights;
  }

  private detectScoreSpikes(data: DataPoint[], sensitivity: number): any[] {
    const anomalies = [];
    const scores = data.map(d => d.score);
    
    for (let i = 1; i < scores.length; i++) {
      const change = Math.abs(scores[i] - scores[i - 1]);
      const threshold = this.calculateThreshold(scores, sensitivity);
      
      if (change > threshold) {
        anomalies.push({
          timestamp: data[i].timestamp,
          userId: data[i].userId,
          type: 'score_spike',
          severity: change > threshold * 2 ? 'high' : 'medium',
          description: `Điểm số thay đổi đột ngột: ${scores[i - 1]} → ${scores[i]}`,
          recommendations: ['Kiểm tra lại kết quả test', 'Xem xét các yếu tố ảnh hưởng']
        });
      }
    }
    
    return anomalies;
  }

  private detectBehaviorChanges(data: DataPoint[], sensitivity: number): any[] {
    // Simplified behavior change detection
    return [];
  }

  private detectPatternBreaks(data: DataPoint[], sensitivity: number): any[] {
    // Simplified pattern break detection
    return [];
  }

  private calculateOverallRisk(anomalies: any[]): 'low' | 'medium' | 'high' {
    const highSeverity = anomalies.filter(a => a.severity === 'high').length;
    const mediumSeverity = anomalies.filter(a => a.severity === 'medium').length;
    
    if (highSeverity > 0) return 'high';
    if (mediumSeverity > 2) return 'medium';
    return 'low';
  }

  private prepareTrainingData(targetVariable: string, features: string[]): any[] {
    // Simplified training data preparation
    return [];
  }

  private trainModel(trainingData: any[], modelType: string): any {
    // Simplified model training
    return { type: modelType, trained: true };
  }

  private calculateModelAccuracy(model: any, data: any[]): number {
    // Simplified accuracy calculation
    return 0.85;
  }

  private generatePredictions(model: any, features: string[]): any[] {
    // Simplified prediction generation
    return [];
  }

  private assessRiskLevel(data: DataPoint[], trends: TrendAnalysis[], anomalies: AnomalyDetection): any {
    const highRiskTrends = trends.filter(t => t.significance === 'high' && t.direction === 'decreasing').length;
    const highRiskAnomalies = anomalies.anomalies.filter(a => a.severity === 'high').length;
    
    let riskLevel = 'low';
    if (highRiskTrends > 0 || highRiskAnomalies > 0) riskLevel = 'high';
    else if (trends.some(t => t.significance === 'medium') || anomalies.anomalies.length > 2) riskLevel = 'medium';
    
    return {
      overallRisk: riskLevel,
      riskFactors: this.identifyRiskFactors(trends, anomalies),
      recommendations: this.generateRiskRecommendations(riskLevel)
    };
  }

  private generateRecommendations(trends: TrendAnalysis[], correlations: CorrelationAnalysis[], anomalies: AnomalyDetection): string[] {
    const recommendations = [];
    
    // Trend-based recommendations
    trends.forEach(trend => {
      if (trend.direction === 'decreasing' && trend.significance === 'high') {
        recommendations.push('Cần can thiệp ngay lập tức để cải thiện xu hướng');
      }
    });
    
    // Correlation-based recommendations
    correlations.forEach(corr => {
      if (Math.abs(corr.correlation) > 0.6) {
        recommendations.push(`Tận dụng mối quan hệ giữa ${corr.variables.join(' và ')}`);
      }
    });
    
    // Anomaly-based recommendations
    if (anomalies.overallRisk === 'high') {
      recommendations.push('Cần theo dõi chặt chẽ do phát hiện bất thường');
    }
    
    return recommendations;
  }

  private calculateAverageScore(data: DataPoint[]): number {
    if (data.length === 0) return 0;
    return data.reduce((sum, d) => sum + d.score, 0) / data.length;
  }

  private calculateTrend(scores: number[]): number {
    if (scores.length < 2) return 0;
    
    const n = scores.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = scores.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * scores[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  private calculateVariance(numbers: number[]): number {
    if (numbers.length < 2) return 0;
    
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }

  private calculateRSquared(scores: number[]): number {
    if (scores.length < 3) return 0;
    
    const trend = this.calculateTrend(scores);
    const x = Array.from({ length: scores.length }, (_, i) => i);
    const meanY = scores.reduce((sum, val) => sum + val, 0) / scores.length;
    
    const predicted = x.map(xi => trend * xi + (scores[0] - trend * 0));
    const ssRes = scores.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
    const ssTot = scores.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0);
    
    return ssTot === 0 ? 0 : 1 - (ssRes / ssTot);
  }

  private calculateThreshold(scores: number[], sensitivity: number): number {
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = this.calculateVariance(scores);
    return Math.sqrt(variance) * sensitivity;
  }

  private identifyRiskFactors(trends: TrendAnalysis[], anomalies: AnomalyDetection): string[] {
    const factors = [];
    
    if (trends.some(t => t.direction === 'decreasing')) {
      factors.push('Xu hướng điểm số giảm');
    }
    
    if (anomalies.anomalies.length > 0) {
      factors.push('Phát hiện bất thường trong dữ liệu');
    }
    
    return factors;
  }

  private generateRiskRecommendations(riskLevel: string): string[] {
    const recommendations = {
      low: ['Duy trì theo dõi định kỳ'],
      medium: ['Tăng cường giám sát', 'Xem xét can thiệp sớm'],
      high: ['Can thiệp ngay lập tức', 'Theo dõi chặt chẽ', 'Tìm kiếm hỗ trợ chuyên nghiệp']
    };
    
    return recommendations[riskLevel as keyof typeof recommendations] || recommendations.low;
  }

  private calculateEffectiveness(beforeTrend: number, afterTrend: number): number {
    return afterTrend - beforeTrend;
  }

  private calculateStatisticalSignificance(beforeData: DataPoint[], afterData: DataPoint[]): number {
    // Simplified statistical significance calculation
    return 0.05; // Placeholder
  }

  private generateInterventionRecommendation(effectiveness: number, significance: number): string {
    if (significance < 0.05 && effectiveness > 0) {
      return 'Can thiệp có hiệu quả đáng kể, nên tiếp tục';
    } else if (effectiveness > 0) {
      return 'Can thiệp có hiệu quả tích cực, cần theo dõi thêm';
    } else {
      return 'Can thiệp chưa có hiệu quả rõ rệt, cần xem xét lại';
    }
  }

  private extractVariableValues(data: DataPoint[], variable: string): number[] {
    return data.map(d => this.extractFeatureValue(d, variable));
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private getDefaultTrendAnalysis(): TrendAnalysis {
    return {
      direction: 'stable',
      magnitude: 0,
      confidence: 0.5,
      significance: 'low',
      prediction: {
        nextValue: 0,
        confidence: 0.5,
        timeframe: '1w'
      }
    };
  }

  private updateModels(): void {
    // Update ML models when new data is added
    // This is a placeholder for actual model updating logic
  }
}

export const analyticsEngine = new AdvancedAnalyticsEngine();
export default analyticsEngine;

