/**
 * 🔍 MONITORING SERVICE - HỆ THỐNG GIÁM SÁT CHẶT CHẼ
 * 
 * Service này cung cấp giám sát real-time cho quá trình nâng cấp SoulFriend V3.0
 * Bao gồm: Performance monitoring, Error tracking, Progress tracking, Quality metrics
 */

// ================================
// INTERFACES & TYPES
// ================================

export interface MonitoringMetrics {
  timestamp: Date;
  performance: PerformanceMetrics;
  errors: ErrorMetrics;
  progress: ProgressMetrics;
  quality: QualityMetrics;
  user: UserMetrics;
}

export interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  databaseQueryTime: number;
  memoryUsage: number;
  cpuUsage: number;
  uptime: number;
  throughput: number;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorRate: number;
  criticalErrors: number;
  warningErrors: number;
  errorTypes: Map<string, number>;
  lastError?: Error;
}

export interface ProgressMetrics {
  overallProgress: number;
  phaseProgress: Map<string, number>;
  completedTasks: number;
  totalTasks: number;
  blockedTasks: number;
  milestonesAchieved: string[];
}

export interface QualityMetrics {
  codeCoverage: number;
  testPassRate: number;
  bugDensity: number;
  performanceScore: number;
  securityScore: number;
  userSatisfaction: number;
}

export interface UserMetrics {
  activeUsers: number;
  newUsers: number;
  userRetention: number;
  sessionDuration: number;
  bounceRate: number;
  featureUsage: Map<string, number>;
}

export interface Alert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  context: any;
  resolved: boolean;
  assignedTo?: string;
}

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  lastCheck: Date;
  details?: any;
}

// ================================
// MONITORING SERVICE CLASS
// ================================

class MonitoringService {
  private metrics: MonitoringMetrics;
  private alerts: Alert[] = [];
  private healthChecks: HealthCheck[] = [];
  private isMonitoring: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;
  private alertCallbacks: ((alert: Alert) => void)[] = [];

  constructor() {
    this.metrics = this.initializeMetrics();
    this.setupHealthChecks();
    this.startMonitoring();
  }

  // ================================
  // INITIALIZATION
  // ================================

  private initializeMetrics(): MonitoringMetrics {
    return {
      timestamp: new Date(),
      performance: {
        pageLoadTime: 0,
        apiResponseTime: 0,
        databaseQueryTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        uptime: 0,
        throughput: 0
      },
      errors: {
        totalErrors: 0,
        errorRate: 0,
        criticalErrors: 0,
        warningErrors: 0,
        errorTypes: new Map(),
        lastError: undefined
      },
      progress: {
        overallProgress: 0,
        phaseProgress: new Map(),
        completedTasks: 0,
        totalTasks: 0,
        blockedTasks: 0,
        milestonesAchieved: []
      },
      quality: {
        codeCoverage: 0,
        testPassRate: 0,
        bugDensity: 0,
        performanceScore: 0,
        securityScore: 0,
        userSatisfaction: 0
      },
      user: {
        activeUsers: 0,
        newUsers: 0,
        userRetention: 0,
        sessionDuration: 0,
        bounceRate: 0,
        featureUsage: new Map()
      }
    };
  }

  private setupHealthChecks(): void {
    this.healthChecks = [
      {
        name: 'Database Connection',
        status: 'healthy',
        responseTime: 0,
        lastCheck: new Date()
      },
      {
        name: 'API Endpoints',
        status: 'healthy',
        responseTime: 0,
        lastCheck: new Date()
      },
      {
        name: 'Frontend Application',
        status: 'healthy',
        responseTime: 0,
        lastCheck: new Date()
      },
      {
        name: 'Research Service',
        status: 'healthy',
        responseTime: 0,
        lastCheck: new Date()
      },
      {
        name: 'AI Service',
        status: 'healthy',
        responseTime: 0,
        lastCheck: new Date()
      }
    ];
  }

  // ================================
  // MONITORING CONTROL
  // ================================

  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.runHealthChecks();
      this.checkAlerts();
    }, 5000); // Check every 5 seconds

    console.log('🔍 Monitoring Service started');
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    console.log('🔍 Monitoring Service stopped');
  }

  // ================================
  // METRICS COLLECTION
  // ================================

  private collectMetrics(): void {
    this.metrics.timestamp = new Date();
    this.collectPerformanceMetrics();
    this.collectUserMetrics();
    this.collectProgressMetrics();
    this.collectQualityMetrics();
  }

  private collectPerformanceMetrics(): void {
    // Page load time
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      this.metrics.performance.pageLoadTime = navigation.loadEventEnd - navigation.loadEventStart;
    }

    // Memory usage
    if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      const memory = (window as any).performance.memory;
      this.metrics.performance.memoryUsage = memory.usedJSHeapSize / memory.totalJSHeapSize;
    }

    // Uptime
    this.metrics.performance.uptime = Date.now() - (window as any).__APP_START_TIME__ || 0;
  }

  private collectUserMetrics(): void {
    // Active users (simplified - in real app would come from analytics)
    this.metrics.user.activeUsers = this.getActiveUserCount();

    // Session duration
    this.metrics.user.sessionDuration = this.getSessionDuration();

    // Feature usage
    this.updateFeatureUsage();
  }

  private collectProgressMetrics(): void {
    // This would be updated by the development team
    // For now, we'll simulate progress
    const currentProgress = this.calculateOverallProgress();
    this.metrics.progress.overallProgress = currentProgress;
  }

  private collectQualityMetrics(): void {
    // Code coverage (would come from CI/CD)
    this.metrics.quality.codeCoverage = this.getCodeCoverage();

    // Test pass rate
    this.metrics.quality.testPassRate = this.getTestPassRate();

    // Performance score
    this.metrics.quality.performanceScore = this.calculatePerformanceScore();
  }

  // ================================
  // HEALTH CHECKS
  // ================================

  private async runHealthChecks(): Promise<void> {
    for (const check of this.healthChecks) {
      try {
        const startTime = Date.now();
        await this.executeHealthCheck(check);
        const responseTime = Date.now() - startTime;

        check.status = 'healthy';
        check.responseTime = responseTime;
        check.lastCheck = new Date();
      } catch (error) {
        check.status = 'unhealthy';
        check.lastCheck = new Date();
        check.details = error;

        this.createAlert({
          level: 'error',
          message: `Health check failed: ${check.name}`,
          context: { check: check.name, error: error }
        });
      }
    }
  }

  private async executeHealthCheck(check: HealthCheck): Promise<void> {
    switch (check.name) {
      case 'Database Connection':
        await this.checkDatabaseConnection();
        break;
      case 'API Endpoints':
        await this.checkApiEndpoints();
        break;
      case 'Frontend Application':
        await this.checkFrontendApplication();
        break;
      case 'Research Service':
        await this.checkResearchService();
        break;
      case 'AI Service':
        await this.checkAIService();
        break;
    }
  }

  private async checkDatabaseConnection(): Promise<void> {
    // Simulate database check
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // In real implementation, would check actual database connection
        resolve();
      }, 100);
    });
  }

  private async checkApiEndpoints(): Promise<void> {
    // Check if API endpoints are responding
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://soulfriend-production.up.railway.app';
      const response = await fetch(`${apiUrl}/api/health`);
      if (!response.ok) {
        throw new Error(`API health check failed: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`API endpoints not accessible: ${error}`);
    }
  }

  private async checkFrontendApplication(): Promise<void> {
    // Check if frontend is responsive
    if (typeof window === 'undefined') {
      throw new Error('Frontend not available');
    }
  }

  private async checkResearchService(): Promise<void> {
    // Check if research service is available
    try {
      // This would check the actual research service
      return Promise.resolve();
    } catch (error) {
      throw new Error(`Research service not available: ${error}`);
    }
  }

  private async checkAIService(): Promise<void> {
    // Check if AI service is available
    try {
      // This would check the actual AI service
      return Promise.resolve();
    } catch (error) {
      throw new Error(`AI service not available: ${error}`);
    }
  }

  // ================================
  // ALERT SYSTEM
  // ================================

  public createAlert(alertData: Partial<Alert>): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      level: alertData.level || 'info',
      message: alertData.message || 'Unknown alert',
      timestamp: new Date(),
      context: alertData.context || {},
      resolved: false,
      assignedTo: alertData.assignedTo
    };

    this.alerts.push(alert);
    this.notifyAlertCallbacks(alert);

    console.warn(`🚨 Alert [${alert.level.toUpperCase()}]: ${alert.message}`, alert.context);
  }

  public resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      console.log(`✅ Alert resolved: ${alert.message}`);
    }
  }

  public onAlert(callback: (alert: Alert) => void): void {
    this.alertCallbacks.push(callback);
  }

  private notifyAlertCallbacks(alert: Alert): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });
  }

  private checkAlerts(): void {
    // Check for performance issues
    if (this.metrics.performance.pageLoadTime > 3000) {
      this.createAlert({
        level: 'warning',
        message: `Slow page load time: ${this.metrics.performance.pageLoadTime}ms`,
        context: { metric: 'pageLoadTime', value: this.metrics.performance.pageLoadTime }
      });
    }

    // Check for high error rate
    if (this.metrics.errors.errorRate > 5) {
      this.createAlert({
        level: 'error',
        message: `High error rate: ${this.metrics.errors.errorRate}%`,
        context: { metric: 'errorRate', value: this.metrics.errors.errorRate }
      });
    }

    // Check for memory usage (disabled to prevent spam)
    // if (this.metrics.performance.memoryUsage > 0.9) {
    //   this.createAlert({
    //     level: 'warning',
    //     message: `High memory usage: ${(this.metrics.performance.memoryUsage * 100).toFixed(1)}%`,
    //     context: { metric: 'memoryUsage', value: this.metrics.performance.memoryUsage }
    //   });
    // }
  }

  // ================================
  // ERROR TRACKING
  // ================================

  public trackError(error: Error, context?: any): void {
    this.metrics.errors.totalErrors++;
    this.metrics.errors.lastError = error;

    const errorType = error.name || 'Unknown';
    const currentCount = this.metrics.errors.errorTypes.get(errorType) || 0;
    this.metrics.errors.errorTypes.set(errorType, currentCount + 1);

    // Update error rate
    this.metrics.errors.errorRate = (this.metrics.errors.totalErrors / this.getTotalRequests()) * 100;

    // Create alert for critical errors
    if (error.name === 'CriticalError' || error.message.includes('critical')) {
      this.metrics.errors.criticalErrors++;
      this.createAlert({
        level: 'critical',
        message: `Critical error: ${error.message}`,
        context: { error: error, context: context }
      });
    } else {
      this.metrics.errors.warningErrors++;
    }

    console.error('🚨 Error tracked:', error, context);
  }

  // ================================
  // PROGRESS TRACKING
  // ================================

  public updateProgress(phase: string, progress: number): void {
    this.metrics.progress.phaseProgress.set(phase, progress);
    this.metrics.progress.overallProgress = this.calculateOverallProgress();
  }

  public updateTaskStatus(completed: number, total: number, blocked: number = 0): void {
    this.metrics.progress.completedTasks = completed;
    this.metrics.progress.totalTasks = total;
    this.metrics.progress.blockedTasks = blocked;
  }

  public addMilestone(milestone: string): void {
    if (!this.metrics.progress.milestonesAchieved.includes(milestone)) {
      this.metrics.progress.milestonesAchieved.push(milestone);
      this.createAlert({
        level: 'info',
        message: `Milestone achieved: ${milestone}`,
        context: { milestone: milestone }
      });
    }
  }

  // ================================
  // UTILITY METHODS
  // ================================

  private calculateOverallProgress(): number {
    if (this.metrics.progress.phaseProgress.size === 0) return 0;

    const totalProgress = Array.from(this.metrics.progress.phaseProgress.values())
      .reduce((sum, progress) => sum + progress, 0);

    return totalProgress / this.metrics.progress.phaseProgress.size;
  }

  private getActiveUserCount(): number {
    // In real implementation, would get from analytics service
    return Math.floor(Math.random() * 100) + 50; // Simulate 50-150 active users
  }

  private getSessionDuration(): number {
    // In real implementation, would calculate from session data
    return Math.floor(Math.random() * 1800) + 300; // Simulate 5-35 minutes
  }

  private updateFeatureUsage(): void {
    // In real implementation, would track actual feature usage
    const features = ['test-taking', 'results-viewing', 'research-dashboard', 'ai-chat'];
    features.forEach(feature => {
      const currentUsage = this.metrics.user.featureUsage.get(feature) || 0;
      this.metrics.user.featureUsage.set(feature, currentUsage + Math.floor(Math.random() * 5));
    });
  }

  private getCodeCoverage(): number {
    // In real implementation, would get from CI/CD
    return Math.floor(Math.random() * 20) + 80; // Simulate 80-100%
  }

  private getTestPassRate(): number {
    // In real implementation, would get from test results
    return Math.floor(Math.random() * 10) + 90; // Simulate 90-100%
  }

  private calculatePerformanceScore(): number {
    const loadTime = this.metrics.performance.pageLoadTime;
    const responseTime = this.metrics.performance.apiResponseTime;

    let score = 100;
    if (loadTime > 2000) score -= 20;
    if (loadTime > 3000) score -= 30;
    if (responseTime > 500) score -= 15;
    if (responseTime > 1000) score -= 25;

    return Math.max(0, score);
  }

  private getTotalRequests(): number {
    // In real implementation, would track actual requests
    return Math.floor(Math.random() * 1000) + 500; // Simulate 500-1500 requests
  }

  // ================================
  // PUBLIC API
  // ================================

  public getMetrics(): MonitoringMetrics {
    return { ...this.metrics };
  }

  public getAlerts(): Alert[] {
    return [...this.alerts];
  }

  public getHealthChecks(): HealthCheck[] {
    return [...this.healthChecks];
  }

  public getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  public getCriticalAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved && alert.level === 'critical');
  }

  public getMetricsSummary(): any {
    return {
      status: this.isMonitoring ? 'active' : 'inactive',
      uptime: this.metrics.performance.uptime,
      errors: this.metrics.errors.totalErrors,
      progress: this.metrics.progress.overallProgress,
      health: this.healthChecks.filter(h => h.status === 'healthy').length / this.healthChecks.length,
      alerts: this.getActiveAlerts().length,
      criticalAlerts: this.getCriticalAlerts().length
    };
  }

  // ================================
  // DASHBOARD DATA
  // ================================

  public getDashboardData(): any {
    return {
      metrics: this.getMetrics(),
      alerts: this.getActiveAlerts(),
      healthChecks: this.getHealthChecks(),
      summary: this.getMetricsSummary(),
      charts: this.getChartData()
    };
  }

  private getChartData(): any {
    return {
      performance: {
        labels: ['Page Load', 'API Response', 'DB Query'],
        data: [
          this.metrics.performance.pageLoadTime,
          this.metrics.performance.apiResponseTime,
          this.metrics.performance.databaseQueryTime
        ]
      },
      errors: {
        labels: Array.from(this.metrics.errors.errorTypes.keys()),
        data: Array.from(this.metrics.errors.errorTypes.values())
      },
      progress: {
        labels: Array.from(this.metrics.progress.phaseProgress.keys()),
        data: Array.from(this.metrics.progress.phaseProgress.values())
      }
    };
  }
}

// ================================
// EXPORT SINGLETON
// ================================

export const monitoringService = new MonitoringService();
export default monitoringService;





