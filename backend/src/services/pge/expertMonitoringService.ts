/**
 * EXPERT MONITORING SERVICE
 *
 * PGE Phase 13 — Real-Time Expert Monitoring System
 *
 * Provides live monitoring of all active users' psychological states.
 * Hooks into PGE processMessage pipeline to:
 * - Track user PGE states in real-time
 * - Detect threshold crossings (EBH, zone transitions, rapid decline)
 * - Generate monitoring alerts for experts via WebSocket
 * - Provide sortable user lists by risk level
 *
 * Integration:
 * - pgeOrchestrator calls onPGEUpdate() after each processMessage
 * - socketServer calls setBroadcaster() to attach WebSocket emit function
 * - pge.ts routes expose REST endpoints for dashboard data
 *
 * @module services/pge/expertMonitoringService
 * @version 1.0.0 — PGE Phase 13
 */

import { logger } from '../../utils/logger';
import {
  MonitoringThresholds, MonitoringAlertTrigger, MonitoringAlertSeverity,
  MonitoringAlertType, UserMonitoringSnapshot,
  DEFAULT_MONITORING_THRESHOLDS,
  classifyMonitoringTrend, computeMonitoringRiskScore, checkMonitoringTriggers,
} from './mathEngine';
import PsychologicalState from '../../models/PsychologicalState';

// ════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════

export interface MonitoringAlert {
  id: string;
  userId: string;
  type: MonitoringAlertType;
  severity: MonitoringAlertSeverity;
  message: string;
  data: Record<string, number | string>;
  currentEBH: number;
  zone: string;
  timestamp: Date;
}

interface UserTrackingData {
  snapshot: UserMonitoringSnapshot;
  ebhHistory: number[];
  previousState: { ebh: number; zone: string } | null;
}

type BroadcastFunction = (event: string, data: any) => void;

// ════════════════════════════════════════════════════════════════
// SERVICE
// ════════════════════════════════════════════════════════════════

class ExpertMonitoringService {
  private trackedUsers: Map<string, UserTrackingData> = new Map();
  private alertHistory: MonitoringAlert[] = [];
  private thresholds: MonitoringThresholds = { ...DEFAULT_MONITORING_THRESHOLDS };
  private broadcastFn: BroadcastFunction | null = null;
  private alertIdCounter = 0;

  private static readonly MAX_ALERT_HISTORY = 500;
  private static readonly MAX_EBH_HISTORY = 50;
  private static readonly MAX_TRACKED_USERS = 300;

  /**
   * Attach WebSocket broadcast function.
   * Called from socketServer.ts after io initialization.
   */
  setBroadcaster(fn: BroadcastFunction): void {
    this.broadcastFn = fn;
    logger.info('[ExpertMonitoring] Broadcaster attached');
  }

  /**
   * Update monitoring thresholds.
   */
  setThresholds(t: Partial<MonitoringThresholds>): void {
    this.thresholds = { ...this.thresholds, ...t };
    logger.info('[ExpertMonitoring] Thresholds updated:', this.thresholds);
  }

  getThresholds(): MonitoringThresholds {
    return { ...this.thresholds };
  }

  /**
   * MAIN HOOK — called from pgeOrchestrator.processMessage after saving state.
   * Updates user tracking and checks for alert triggers.
   */
  onPGEUpdate(userId: string, result: {
    ebhScore: number;
    esScore: number;
    zone: string;
    dominantEmotion: string;
    sessionId: string;
  }): void {
    const { ebhScore, esScore, zone } = result;
    const now = new Date();

    // Get or create tracking data
    let tracking = this.trackedUsers.get(userId);
    if (!tracking) {
      tracking = {
        snapshot: {
          userId,
          currentEBH: ebhScore,
          currentES: esScore,
          zone,
          trend: 'stable',
          riskScore: 0,
          sessionCount: 1,
          lastActiveAt: now,
          alertCount: 0,
        },
        ebhHistory: [],
        previousState: null,
      };
      this.trackedUsers.set(userId, tracking);
      // Evict oldest tracked user if over limit
      if (this.trackedUsers.size > ExpertMonitoringService.MAX_TRACKED_USERS) {
        const oldest = this.trackedUsers.keys().next().value;
        if (oldest && oldest !== userId) this.trackedUsers.delete(oldest);
      }
    }

    const prevState = tracking.previousState;

    // Update EBH history
    tracking.ebhHistory.push(ebhScore);
    if (tracking.ebhHistory.length > ExpertMonitoringService.MAX_EBH_HISTORY) {
      tracking.ebhHistory.shift();
    }

    // Classify trend
    const trend = classifyMonitoringTrend(tracking.ebhHistory);

    // Compute trend slope for risk score
    let trendSlope = 0;
    if (tracking.ebhHistory.length >= 2) {
      const h = tracking.ebhHistory;
      trendSlope = (h[h.length - 1] - h[h.length - 2]);
    }

    // Compute volatility
    let volatility = 0;
    if (tracking.ebhHistory.length >= 3) {
      const recent = tracking.ebhHistory.slice(-5);
      const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
      volatility = Math.sqrt(recent.reduce((s, v) => s + (v - mean) ** 2, 0) / recent.length);
    }

    // Compute risk score
    const riskScore = computeMonitoringRiskScore(ebhScore, esScore, zone, trendSlope, volatility);

    // Update snapshot
    tracking.snapshot = {
      userId,
      currentEBH: ebhScore,
      currentES: esScore,
      zone,
      trend,
      riskScore,
      sessionCount: tracking.snapshot.sessionCount + 1,
      lastActiveAt: now,
      alertCount: tracking.snapshot.alertCount,
    };

    // Check for alert triggers
    const triggers = checkMonitoringTriggers(
      prevState,
      { ebh: ebhScore, zone, esScore },
      tracking.ebhHistory,
      this.thresholds,
    );

    // Generate alerts
    for (const trigger of triggers) {
      const alert = this.createAlert(userId, trigger, ebhScore, zone);
      tracking.snapshot.alertCount++;

      // Broadcast to experts via WebSocket
      if (this.broadcastFn) {
        this.broadcastFn('pge_monitoring_alert', {
          alert,
          userSnapshot: tracking.snapshot,
        });
      }
    }

    // Broadcast user status update (always, for real-time dashboard)
    if (this.broadcastFn) {
      this.broadcastFn('pge_user_update', {
        snapshot: tracking.snapshot,
        trend,
        riskScore,
      });
    }

    // Update previous state
    tracking.previousState = { ebh: ebhScore, zone };
  }

  /**
   * Create and store a monitoring alert.
   */
  private createAlert(
    userId: string,
    trigger: MonitoringAlertTrigger,
    currentEBH: number,
    zone: string,
  ): MonitoringAlert {
    const alert: MonitoringAlert = {
      id: `mon_${Date.now()}_${++this.alertIdCounter}`,
      userId,
      type: trigger.type,
      severity: trigger.severity,
      message: trigger.message,
      data: trigger.data,
      currentEBH,
      zone,
      timestamp: new Date(),
    };

    this.alertHistory.unshift(alert);
    if (this.alertHistory.length > ExpertMonitoringService.MAX_ALERT_HISTORY) {
      this.alertHistory.pop();
    }

    logger.warn(`[ExpertMonitoring] Alert: [${trigger.severity}] ${trigger.type} for user ${userId.substring(0, 8)}: ${trigger.message}`);
    return alert;
  }

  // ════════════════════════════════════════════════════════════════
  // QUERY METHODS (for API endpoints)
  // ════════════════════════════════════════════════════════════════

  /**
   * Get all actively monitored users sorted by risk score (highest first).
   */
  getActiveUsers(sortBy: 'risk' | 'ebh' | 'lastActive' = 'risk'): UserMonitoringSnapshot[] {
    const users = Array.from(this.trackedUsers.values()).map(t => t.snapshot);

    switch (sortBy) {
      case 'risk': return users.sort((a, b) => b.riskScore - a.riskScore);
      case 'ebh': return users.sort((a, b) => b.currentEBH - a.currentEBH);
      case 'lastActive': return users.sort((a, b) => b.lastActiveAt.getTime() - a.lastActiveAt.getTime());
      default: return users;
    }
  }

  /**
   * Get recent monitoring alerts.
   */
  getRecentAlerts(limit: number = 50): MonitoringAlert[] {
    return this.alertHistory.slice(0, limit);
  }

  /**
   * Get alerts for a specific user.
   */
  getUserAlerts(userId: string, limit: number = 20): MonitoringAlert[] {
    return this.alertHistory.filter(a => a.userId === userId).slice(0, limit);
  }

  /**
   * Get detailed monitoring data for a specific user.
   */
  getUserDetail(userId: string): {
    snapshot: UserMonitoringSnapshot;
    ebhHistory: number[];
    recentAlerts: MonitoringAlert[];
  } | null {
    const tracking = this.trackedUsers.get(userId);
    if (!tracking) return null;

    return {
      snapshot: tracking.snapshot,
      ebhHistory: tracking.ebhHistory,
      recentAlerts: this.getUserAlerts(userId, 10),
    };
  }

  /**
   * Get aggregated monitoring statistics.
   */
  getMonitoringStats(): {
    totalTracked: number;
    byZone: Record<string, number>;
    byTrend: Record<string, number>;
    bySeverity: Record<string, number>;
    criticalUsers: number;
    recentAlertCount: number;
  } {
    const users = this.getActiveUsers();
    const byZone: Record<string, number> = {};
    const byTrend: Record<string, number> = {};
    let criticalUsers = 0;

    for (const u of users) {
      byZone[u.zone] = (byZone[u.zone] || 0) + 1;
      byTrend[u.trend] = (byTrend[u.trend] || 0) + 1;
      if (u.zone === 'danger' || u.zone === 'critical') criticalUsers++;
    }

    // Count alerts in last hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentAlertCount = this.alertHistory.filter(a => a.timestamp.getTime() > oneHourAgo).length;

    const bySeverity: Record<string, number> = { info: 0, warning: 0, critical: 0 };
    for (const a of this.alertHistory.slice(0, 100)) {
      bySeverity[a.severity] = (bySeverity[a.severity] || 0) + 1;
    }

    return {
      totalTracked: users.length,
      byZone,
      byTrend,
      bySeverity,
      criticalUsers,
      recentAlertCount,
    };
  }

  /**
   * Hydrate tracked users from DB on startup.
   * Loads the latest state for each user that was active in the last 7 days.
   */
  async hydrate(): Promise<void> {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Get distinct userIds with recent activity
      const recentUsers = await PsychologicalState.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: {
          _id: '$userId',
          latestEBH: { $last: '$ebhScore' },
          latestZone: { $last: '$zone' },
          count: { $sum: 1 },
          lastActive: { $max: '$createdAt' },
        }},
        { $sort: { lastActive: -1 } },
        { $limit: 200 },
      ]);

      for (const u of recentUsers) {
        // Get EBH history for this user
        const states = await PsychologicalState.find({ userId: u._id })
          .sort({ createdAt: -1 })
          .limit(ExpertMonitoringService.MAX_EBH_HISTORY)
          .select('ebhScore zone')
          .lean();

        const ebhHistory = states.reverse().map((s: any) => s.ebhScore);
        const trend = classifyMonitoringTrend(ebhHistory);

        this.trackedUsers.set(u._id, {
          snapshot: {
            userId: u._id,
            currentEBH: u.latestEBH ?? 0,
            currentES: 0,
            zone: u.latestZone ?? 'safe',
            trend,
            riskScore: 0,
            sessionCount: u.count ?? 0,
            lastActiveAt: u.lastActive ?? new Date(),
            alertCount: 0,
          },
          ebhHistory,
          previousState: ebhHistory.length > 0
            ? { ebh: ebhHistory[ebhHistory.length - 1], zone: u.latestZone ?? 'safe' }
            : null,
        });
      }

      logger.info(`[ExpertMonitoring] Hydrated ${recentUsers.length} users from database`);
    } catch (err) {
      logger.warn('[ExpertMonitoring] Hydration failed:', err instanceof Error ? err.message : err);
    }
  }
}

// Singleton
export const expertMonitoringService = new ExpertMonitoringService();
