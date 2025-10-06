/**
 * 📊 REPORTING SERVICE - HỆ THỐNG BÁO CÁO TỰ ĐỘNG
 * 
 * Service này tạo báo cáo tự động về tiến độ nâng cấp và gửi thông báo
 */

import { monitoringService } from './monitoringService';

export interface ReportData {
  timestamp: Date;
  period: 'daily' | 'weekly' | 'monthly';
  metrics: any;
  progress: any;
  alerts: any[];
  recommendations: string[];
}

export interface NotificationConfig {
  enabled: boolean;
  channels: ('email' | 'slack' | 'webhook')[];
  recipients: string[];
  schedule: 'realtime' | 'hourly' | 'daily' | 'weekly';
}

class ReportingService {
  private config: NotificationConfig = {
    enabled: true,
    channels: ['webhook'],
    recipients: ['admin@soulfriend.com'],
    schedule: 'realtime'
  };

  private lastReportTime: Date = new Date();
  private reportHistory: ReportData[] = [];

  constructor() {
    this.setupAutoReporting();
  }

  // ================================
  // AUTO REPORTING SETUP
  // ================================

  private setupAutoReporting(): void {
    // Real-time alerts
    monitoringService.onAlert((alert) => {
      this.sendRealTimeAlert(alert);
    });

    // Daily reports at 9 AM
    this.scheduleDailyReport();

    // Weekly reports on Monday at 10 AM
    this.scheduleWeeklyReport();

    // Monthly reports on 1st at 11 AM
    this.scheduleMonthlyReport();
  }

  private scheduleDailyReport(): void {
    const now = new Date();
    const nextReport = new Date(now);
    nextReport.setHours(9, 0, 0, 0);
    
    if (nextReport <= now) {
      nextReport.setDate(nextReport.getDate() + 1);
    }

    const timeUntilReport = nextReport.getTime() - now.getTime();
    
    setTimeout(() => {
      this.generateDailyReport();
      this.scheduleDailyReport(); // Schedule next day
    }, timeUntilReport);
  }

  private scheduleWeeklyReport(): void {
    const now = new Date();
    const nextMonday = new Date(now);
    const daysUntilMonday = (1 + 7 - now.getDay()) % 7;
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(10, 0, 0, 0);

    const timeUntilReport = nextMonday.getTime() - now.getTime();
    
    setTimeout(() => {
      this.generateWeeklyReport();
      this.scheduleWeeklyReport(); // Schedule next week
    }, timeUntilReport);
  }

  private scheduleMonthlyReport(): void {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 11, 0, 0, 0);
    
    const timeUntilReport = nextMonth.getTime() - now.getTime();
    
    setTimeout(() => {
      this.generateMonthlyReport();
      this.scheduleMonthlyReport(); // Schedule next month
    }, timeUntilReport);
  }

  // ================================
  // REPORT GENERATION
  // ================================

  public async generateDailyReport(): Promise<ReportData> {
    const metrics = monitoringService.getMetrics();
    const alerts = monitoringService.getAlerts();
    const healthChecks = monitoringService.getHealthChecks();

    const report: ReportData = {
      timestamp: new Date(),
      period: 'daily',
      metrics: {
        performance: metrics.performance,
        errors: metrics.errors,
        user: metrics.user,
        quality: metrics.quality
      },
      progress: {
        overall: metrics.progress.overallProgress,
        phases: Object.fromEntries(metrics.progress.phaseProgress),
        tasks: {
          completed: metrics.progress.completedTasks,
          total: metrics.progress.totalTasks,
          blocked: metrics.progress.blockedTasks
        },
        milestones: metrics.progress.milestonesAchieved
      },
      alerts: alerts.filter(a => !a.resolved),
      recommendations: this.generateRecommendations(metrics, alerts, healthChecks)
    };

    this.reportHistory.push(report);
    await this.sendReport(report);
    
    console.log('📊 Daily report generated:', report);
    return report;
  }

  public async generateWeeklyReport(): Promise<ReportData> {
    const metrics = monitoringService.getMetrics();
    const alerts = monitoringService.getAlerts();
    const healthChecks = monitoringService.getHealthChecks();

    // Calculate weekly trends
    const weeklyTrends = this.calculateTrends('weekly');

    const report: ReportData = {
      timestamp: new Date(),
      period: 'weekly',
      metrics: {
        performance: metrics.performance,
        errors: metrics.errors,
        user: metrics.user,
        quality: metrics.quality,
        trends: weeklyTrends
      },
      progress: {
        overall: metrics.progress.overallProgress,
        phases: Object.fromEntries(metrics.progress.phaseProgress),
        tasks: {
          completed: metrics.progress.completedTasks,
          total: metrics.progress.totalTasks,
          blocked: metrics.progress.blockedTasks
        },
        milestones: metrics.progress.milestonesAchieved
      },
      alerts: alerts.filter(a => !a.resolved),
      recommendations: this.generateRecommendations(metrics, alerts, healthChecks)
    };

    this.reportHistory.push(report);
    await this.sendReport(report);
    
    console.log('📊 Weekly report generated:', report);
    return report;
  }

  public async generateMonthlyReport(): Promise<ReportData> {
    const metrics = monitoringService.getMetrics();
    const alerts = monitoringService.getAlerts();
    const healthChecks = monitoringService.getHealthChecks();

    // Calculate monthly trends
    const monthlyTrends = this.calculateTrends('monthly');

    const report: ReportData = {
      timestamp: new Date(),
      period: 'monthly',
      metrics: {
        performance: metrics.performance,
        errors: metrics.errors,
        user: metrics.user,
        quality: metrics.quality,
        trends: monthlyTrends
      },
      progress: {
        overall: metrics.progress.overallProgress,
        phases: Object.fromEntries(metrics.progress.phaseProgress),
        tasks: {
          completed: metrics.progress.completedTasks,
          total: metrics.progress.totalTasks,
          blocked: metrics.progress.blockedTasks
        },
        milestones: metrics.progress.milestonesAchieved
      },
      alerts: alerts.filter(a => !a.resolved),
      recommendations: this.generateRecommendations(metrics, alerts, healthChecks)
    };

    this.reportHistory.push(report);
    await this.sendReport(report);
    
    console.log('📊 Monthly report generated:', report);
    return report;
  }

  // ================================
  // REAL-TIME ALERTS
  // ================================

  private async sendRealTimeAlert(alert: any): Promise<void> {
    if (!this.config.enabled || this.config.schedule !== 'realtime') return;

    const alertMessage = this.formatAlertMessage(alert);
    
    for (const channel of this.config.channels) {
      await this.sendToChannel(alertMessage, channel);
    }
  }

  private formatAlertMessage(alert: any): string {
    const emojiMap: Record<string, string> = {
      'info': 'ℹ️',
      'warning': '⚠️',
      'error': '❌',
      'critical': '🚨'
    };
    const emoji = emojiMap[alert.level] || '📢';

    return `${emoji} **${alert.level.toUpperCase()} ALERT**
    
**Message:** ${alert.message}
**Time:** ${alert.timestamp.toLocaleString()}
**Context:** ${JSON.stringify(alert.context, null, 2)}

---
*SoulFriend V3.0 Monitoring System*`;
  }

  // ================================
  // REPORT SENDING
  // ================================

  private async sendReport(report: ReportData): Promise<void> {
    if (!this.config.enabled) return;

    const reportMessage = this.formatReportMessage(report);
    
    for (const channel of this.config.channels) {
      await this.sendToChannel(reportMessage, channel);
    }
  }

  private formatReportMessage(report: ReportData): string {
    const periodEmoji = {
      'daily': '📅',
      'weekly': '📊',
      'monthly': '📈'
    }[report.period] || '📋';

    return `${periodEmoji} **${report.period.toUpperCase()} REPORT - SoulFriend V3.0**

**📊 METRICS SUMMARY**
• Performance Score: ${report.metrics.quality.performanceScore}/100
• Error Rate: ${report.metrics.errors.errorRate.toFixed(1)}%
• Active Users: ${report.metrics.user.activeUsers}
• Uptime: ${(report.metrics.performance.uptime / 1000 / 60 / 60).toFixed(1)}h

**🚀 PROGRESS UPDATE**
• Overall Progress: ${report.progress.overall.toFixed(1)}%
• Tasks Completed: ${report.progress.tasks.completed}/${report.progress.tasks.total}
• Blocked Tasks: ${report.progress.tasks.blocked}
• Milestones: ${report.progress.milestones.length}

**🚨 ACTIVE ALERTS**
${report.alerts.length === 0 ? '✅ No active alerts' : 
  report.alerts.map(alert => `• ${alert.level.toUpperCase()}: ${alert.message}`).join('\n')}

**💡 RECOMMENDATIONS**
${report.recommendations.map(rec => `• ${rec}`).join('\n')}

---
*Generated: ${report.timestamp.toLocaleString()}*
*SoulFriend V3.0 Monitoring System*`;
  }

  private async sendToChannel(message: string, channel: string): Promise<void> {
    try {
      switch (channel) {
        case 'email':
          await this.sendEmail(message);
          break;
        case 'slack':
          await this.sendSlack(message);
          break;
        case 'webhook':
          await this.sendWebhook(message);
          break;
      }
    } catch (error) {
      console.error(`Error sending to ${channel}:`, error);
    }
  }

  private async sendEmail(message: string): Promise<void> {
    // In real implementation, would use email service
    console.log('📧 Email notification:', message);
  }

  private async sendSlack(message: string): Promise<void> {
    // In real implementation, would use Slack API
    console.log('💬 Slack notification:', message);
  }

  private async sendWebhook(message: string): Promise<void> {
    // In real implementation, would send to webhook URL
    console.log('🔗 Webhook notification:', message);
  }

  // ================================
  // TREND CALCULATION
  // ================================

  private calculateTrends(period: 'weekly' | 'monthly'): any {
    const now = new Date();
    const cutoff = new Date(now);
    
    if (period === 'weekly') {
      cutoff.setDate(cutoff.getDate() - 7);
    } else {
      cutoff.setMonth(cutoff.getMonth() - 1);
    }

    const recentReports = this.reportHistory.filter(r => r.timestamp >= cutoff);
    
    if (recentReports.length < 2) {
      return { insufficient_data: true };
    }

    const firstReport = recentReports[0];
    const lastReport = recentReports[recentReports.length - 1];

    return {
      performance_trend: this.calculateTrend(
        firstReport.metrics.quality.performanceScore,
        lastReport.metrics.quality.performanceScore
      ),
      error_trend: this.calculateTrend(
        firstReport.metrics.errors.errorRate,
        lastReport.metrics.errors.errorRate
      ),
      progress_trend: this.calculateTrend(
        firstReport.progress.overall,
        lastReport.progress.overall
      ),
      user_trend: this.calculateTrend(
        firstReport.metrics.user.activeUsers,
        lastReport.metrics.user.activeUsers
      )
    };
  }

  private calculateTrend(oldValue: number, newValue: number): 'up' | 'down' | 'stable' {
    const change = ((newValue - oldValue) / oldValue) * 100;
    
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  }

  // ================================
  // RECOMMENDATIONS
  // ================================

  private generateRecommendations(metrics: any, alerts: any[], healthChecks: any[]): string[] {
    const recommendations: string[] = [];

    // Performance recommendations
    if (metrics.performance.pageLoadTime > 3000) {
      recommendations.push('Optimize page load time - currently above 3 seconds');
    }

    if (metrics.performance.memoryUsage > 0.8) {
      recommendations.push('Investigate memory usage - currently above 80%');
    }

    // Error recommendations
    if (metrics.errors.errorRate > 5) {
      recommendations.push('Address high error rate - currently above 5%');
    }

    if (alerts.filter(a => !a.resolved && a.level === 'critical').length > 0) {
      recommendations.push('Resolve critical alerts immediately');
    }

    // Progress recommendations
    if (metrics.progress.blockedTasks > 0) {
      recommendations.push(`Unblock ${metrics.progress.blockedTasks} blocked tasks`);
    }

    if (metrics.progress.overallProgress < 50) {
      recommendations.push('Accelerate development progress - currently below 50%');
    }

    // Health recommendations
    const unhealthyChecks = healthChecks.filter(h => h.status !== 'healthy');
    if (unhealthyChecks.length > 0) {
      recommendations.push(`Fix ${unhealthyChecks.length} unhealthy system components`);
    }

    // Quality recommendations
    if (metrics.quality.codeCoverage < 80) {
      recommendations.push('Improve test coverage - currently below 80%');
    }

    if (metrics.quality.userSatisfaction < 4) {
      recommendations.push('Improve user satisfaction - currently below 4/5');
    }

    // Default recommendations if no issues
    if (recommendations.length === 0) {
      recommendations.push('System running smoothly - continue current approach');
      recommendations.push('Consider proactive optimizations for better performance');
    }

    return recommendations;
  }

  // ================================
  // PUBLIC API
  // ================================

  public getReportHistory(): ReportData[] {
    return [...this.reportHistory];
  }

  public getLastReport(): ReportData | null {
    return this.reportHistory.length > 0 ? this.reportHistory[this.reportHistory.length - 1] : null;
  }

  public updateConfig(newConfig: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public async generateCustomReport(period: 'daily' | 'weekly' | 'monthly'): Promise<ReportData> {
    switch (period) {
      case 'daily':
        return this.generateDailyReport();
      case 'weekly':
        return this.generateWeeklyReport();
      case 'monthly':
        return this.generateMonthlyReport();
    }
  }

  public getSystemStatus(): any {
    const metrics = monitoringService.getMetrics();
    const alerts = monitoringService.getActiveAlerts();
    const healthChecks = monitoringService.getHealthChecks();

    return {
      status: alerts.length === 0 ? 'healthy' : 'warning',
      lastReport: this.getLastReport(),
      totalReports: this.reportHistory.length,
      config: this.config,
      summary: {
        performance: metrics.quality.performanceScore,
        errors: metrics.errors.totalErrors,
        progress: metrics.progress.overallProgress,
        alerts: alerts.length,
        health: healthChecks.filter(h => h.status === 'healthy').length / healthChecks.length
      }
    };
  }
}

// ================================
// EXPORT SINGLETON
// ================================

export const reportingService = new ReportingService();
export default reportingService;
