import { logger } from '../../utils/logger';

export interface TriadicCanaryDecision {
  enabled: boolean;
  reason: 'disabled' | 'kpi_disabled' | 'no_traffic' | 'high_risk_block' | 'out_of_cohort' | 'in_cohort';
  cohortBucket: number;
  canaryPercent: number;
}

export interface TriadicCanaryKpiSnapshot {
  sampleSize: number;
  helpfulnessRate: number;
  unsafeRate: number;
  minHelpfulnessRate: number;
  maxUnsafeRate: number;
}

export interface TriadicCanaryOutcome {
  kpiBreached: boolean;
  autoDisabled: boolean;
  snapshot: TriadicCanaryKpiSnapshot | null;
}

export interface TriadicCanaryDashboardSnapshot {
  canary: {
    enabledByFlag: boolean;
    canaryPercent: number;
    autoDisabledByKpi: boolean;
  };
  thresholds: {
    minHelpfulnessRate: number;
    maxUnsafeRate: number;
    windowSize: number;
    minSamples: number;
  };
  kpi: {
    sampleSize: number;
    helpfulnessRate: number;
    unsafeRate: number;
    readyForGateEvaluation: boolean;
  };
}

export interface TriadicCanaryHistoryPoint {
  timestamp: string;
  sampleSize: number;
  helpfulnessRate: number;
  unsafeRate: number;
  readyForGateEvaluation: boolean;
  autoDisabledByKpi: boolean;
  kpiBreached: boolean;
}

export interface TriadicCanaryAggregatedHistoryPoint {
  bucketStart: string;
  bucketMinutes: number;
  count: number;
  avgHelpfulnessRate: number;
  avgUnsafeRate: number;
  maxSampleSize: number;
  gateReadyRate: number;
  kpiBreachedCount: number;
  autoDisabledObserved: boolean;
}

export interface TriadicCanaryDecisionGateReadiness {
  ready: boolean;
  status: 'pass' | 'fail';
  reasons: string[];
  checks: Array<{
    id: string;
    label: string;
    passed: boolean;
    detail: string;
  }>;
  recommendedActions: Array<{
    id: string;
    priority: 'high' | 'medium' | 'low';
    status: 'todo' | 'in_progress' | 'done';
    action: string;
    owner: 'expert' | 'devops' | 'product';
    etaHours: number;
    sourceCheckId?: string;
  }>;
  snapshot: TriadicCanaryDashboardSnapshot;
}

export interface TriadicCanaryActionStatusTimelineEntry {
  actionId: string;
  status: TriadicActionStatus;
  previousStatus?: TriadicActionStatus;
  updatedAt: string;
  updatedBy?: string;
  note?: string;
  owner: 'expert' | 'devops' | 'product';
  priority: 'high' | 'medium' | 'low';
}

export interface TriadicCanaryActionStatusTimelinePage {
  items: TriadicCanaryActionStatusTimelineEntry[];
  nextCursor: string | null;
}

export interface TriadicCanaryManualReenableResult {
  previousAutoDisabledByKpi: boolean;
  autoDisabledByKpi: boolean;
  updatedAt: string;
  updatedBy?: string;
  reason: string;
  readinessBefore: TriadicCanaryManualReenableReadiness;
}

export interface TriadicCanaryManualReenableReadiness {
  ready: boolean;
  status: 'pass' | 'fail';
  reasons: string[];
  checks: Array<{
    id: string;
    label: string;
    passed: boolean;
    blocking: boolean;
    detail: string;
  }>;
  snapshot: TriadicCanaryDashboardSnapshot;
}

type TriadicActionStatus = 'todo' | 'in_progress' | 'done';

class TriadicCanaryService {
  private readonly flagEnabled = (process.env.V5_TRIADIC_CANARY_ENABLED || 'false').toLowerCase() === 'true';
  private readonly canaryPercent = Math.min(100, Math.max(0, parseInt(process.env.V5_TRIADIC_CANARY_PERCENT || '0', 10) || 0));
  private readonly minHelpfulnessRate = Math.min(1, Math.max(0, parseFloat(process.env.V5_TRIADIC_CANARY_MIN_HELPFULNESS || '0.55')));
  private readonly maxUnsafeRate = Math.min(1, Math.max(0, parseFloat(process.env.V5_TRIADIC_CANARY_MAX_UNSAFE_RATE || '0.05')));
  private readonly kpiWindowSize = Math.max(10, parseInt(process.env.V5_TRIADIC_CANARY_KPI_WINDOW_SIZE || '100', 10));
  private readonly kpiMinSamples = Math.max(5, parseInt(process.env.V5_TRIADIC_CANARY_KPI_MIN_SAMPLES || '20', 10));
  private readonly historyMaxPoints = Math.max(50, parseInt(process.env.V5_TRIADIC_CANARY_HISTORY_MAX_POINTS || '2000', 10));
  private readonly actionHistoryMaxPoints = Math.max(100, parseInt(process.env.V5_TRIADIC_CANARY_ACTION_HISTORY_MAX_POINTS || '5000', 10));
  private canaryAutoDisabled = false;
  private outcomeWindow: Array<{ helpful: number; unsafe: number }> = [];
  private outcomeHistory: TriadicCanaryHistoryPoint[] = [];
  private actionStatusOverrides = new Map<string, {
    status: TriadicActionStatus;
    updatedAt: string;
    updatedBy?: string;
    note?: string;
  }>();
  private actionStatusTimeline: TriadicCanaryActionStatusTimelineEntry[] = [];

  private appendHistoryPoint(point: TriadicCanaryHistoryPoint): void {
    this.outcomeHistory.push(point);
    if (this.outcomeHistory.length > this.historyMaxPoints) {
      this.outcomeHistory.shift();
    }
  }

  private stableBucket(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
    }
    return hash % 100;
  }

  private isHighRisk(riskLevel?: string, crisisLevel?: string): boolean {
    const risk = (riskLevel || '').toUpperCase();
    const crisis = (crisisLevel || '').toLowerCase();
    if (risk === 'HIGH' || risk === 'CRITICAL' || risk === 'EXTREME') {
      return true;
    }
    return crisis === 'high' || crisis === 'critical';
  }

  evaluateUserCanary(input: {
    userId: string;
    riskLevel?: string;
    crisisLevel?: string;
  }): TriadicCanaryDecision {
    const bucket = this.stableBucket(input.userId || 'anonymous');

    if (!this.flagEnabled) {
      return {
        enabled: false,
        reason: 'disabled',
        cohortBucket: bucket,
        canaryPercent: this.canaryPercent,
      };
    }

    if (this.canaryAutoDisabled) {
      return {
        enabled: false,
        reason: 'kpi_disabled',
        cohortBucket: bucket,
        canaryPercent: this.canaryPercent,
      };
    }

    if (this.canaryPercent <= 0) {
      return {
        enabled: false,
        reason: 'no_traffic',
        cohortBucket: bucket,
        canaryPercent: this.canaryPercent,
      };
    }

    if (this.isHighRisk(input.riskLevel, input.crisisLevel)) {
      return {
        enabled: false,
        reason: 'high_risk_block',
        cohortBucket: bucket,
        canaryPercent: this.canaryPercent,
      };
    }

    const enabled = bucket < this.canaryPercent;
    return {
      enabled,
      reason: enabled ? 'in_cohort' : 'out_of_cohort',
      cohortBucket: bucket,
      canaryPercent: this.canaryPercent,
    };
  }

  recordOutcome(input: {
    decision: TriadicCanaryDecision;
    riskLevel?: string;
    crisisLevel?: string;
    qualityScore?: number;
    safetyPassed: boolean;
  }): TriadicCanaryOutcome {
    if (!input.decision.enabled) {
      return { kpiBreached: false, autoDisabled: this.canaryAutoDisabled, snapshot: null };
    }

    const qualityScore = typeof input.qualityScore === 'number' ? input.qualityScore : 0.7;
    const helpful = qualityScore >= this.minHelpfulnessRate ? 1 : 0;
    const unsafe = (!input.safetyPassed || this.isHighRisk(input.riskLevel, input.crisisLevel)) ? 1 : 0;

    this.outcomeWindow.push({ helpful, unsafe });
    if (this.outcomeWindow.length > this.kpiWindowSize) {
      this.outcomeWindow.shift();
    }

    const sampleSize = this.outcomeWindow.length;
    const helpfulCount = this.outcomeWindow.reduce((sum, item) => sum + item.helpful, 0);
    const unsafeCount = this.outcomeWindow.reduce((sum, item) => sum + item.unsafe, 0);
    const helpfulnessRate = sampleSize > 0 ? helpfulCount / sampleSize : 1;
    const unsafeRate = sampleSize > 0 ? unsafeCount / sampleSize : 0;

    const snapshot: TriadicCanaryKpiSnapshot = {
      sampleSize,
      helpfulnessRate,
      unsafeRate,
      minHelpfulnessRate: this.minHelpfulnessRate,
      maxUnsafeRate: this.maxUnsafeRate,
    };

    const historyBase: TriadicCanaryHistoryPoint = {
      timestamp: new Date().toISOString(),
      sampleSize,
      helpfulnessRate,
      unsafeRate,
      readyForGateEvaluation: sampleSize >= this.kpiMinSamples,
      autoDisabledByKpi: this.canaryAutoDisabled,
      kpiBreached: false,
    };

    if (sampleSize < this.kpiMinSamples) {
      this.appendHistoryPoint(historyBase);
      return { kpiBreached: false, autoDisabled: this.canaryAutoDisabled, snapshot };
    }

    const breach = helpfulnessRate < this.minHelpfulnessRate || unsafeRate > this.maxUnsafeRate;
    if (breach) {
      this.canaryAutoDisabled = true;
      this.appendHistoryPoint({
        ...historyBase,
        autoDisabledByKpi: true,
        kpiBreached: true,
      });
      logger.error('[Triadic Canary] KPI threshold breached, auto-disabling canary', snapshot);
      return { kpiBreached: true, autoDisabled: true, snapshot };
    }

    this.appendHistoryPoint(historyBase);

    return { kpiBreached: false, autoDisabled: this.canaryAutoDisabled, snapshot };
  }

  getDashboardSnapshot(): TriadicCanaryDashboardSnapshot {
    const sampleSize = this.outcomeWindow.length;
    const helpfulCount = this.outcomeWindow.reduce((sum, item) => sum + item.helpful, 0);
    const unsafeCount = this.outcomeWindow.reduce((sum, item) => sum + item.unsafe, 0);
    const helpfulnessRate = sampleSize > 0 ? helpfulCount / sampleSize : 1;
    const unsafeRate = sampleSize > 0 ? unsafeCount / sampleSize : 0;

    return {
      canary: {
        enabledByFlag: this.flagEnabled,
        canaryPercent: this.canaryPercent,
        autoDisabledByKpi: this.canaryAutoDisabled,
      },
      thresholds: {
        minHelpfulnessRate: this.minHelpfulnessRate,
        maxUnsafeRate: this.maxUnsafeRate,
        windowSize: this.kpiWindowSize,
        minSamples: this.kpiMinSamples,
      },
      kpi: {
        sampleSize,
        helpfulnessRate,
        unsafeRate,
        readyForGateEvaluation: sampleSize >= this.kpiMinSamples,
      },
    };
  }

  getManualReenableReadiness(): TriadicCanaryManualReenableReadiness {
    const snapshot = this.getDashboardSnapshot();
    const unsafeGateBlocked =
      snapshot.kpi.sampleSize >= snapshot.thresholds.minSamples
      && snapshot.kpi.unsafeRate > snapshot.thresholds.maxUnsafeRate;

    const checks = [
      {
        id: 'auto_disabled_by_kpi',
        label: 'Canary is currently auto-disabled by KPI',
        passed: snapshot.canary.autoDisabledByKpi,
        blocking: true,
        detail: snapshot.canary.autoDisabledByKpi
          ? 'Canary is auto-disabled and can be evaluated for manual recovery.'
          : 'Canary is not auto-disabled by KPI.',
      },
      {
        id: 'unsafe_gate',
        label: 'Unsafe-rate gate allows re-enable',
        passed: !unsafeGateBlocked,
        blocking: true,
        detail: unsafeGateBlocked
          ? `Cannot re-enable canary while unsafe rate ${snapshot.kpi.unsafeRate.toFixed(4)} exceeds threshold ${snapshot.thresholds.maxUnsafeRate.toFixed(4)}.`
          : 'Unsafe-rate gate passed for manual re-enable.',
      },
    ];

    const reasons = checks
      .filter(item => item.blocking && !item.passed)
      .map(item => item.detail);
    const ready = reasons.length === 0;

    return {
      ready,
      status: ready ? 'pass' : 'fail',
      reasons,
      checks,
      snapshot,
    };
  }

  reEnableAfterKpiDisable(input: {
    reason: string;
    updatedBy?: string;
  }): TriadicCanaryManualReenableResult {
    const reason = (input.reason || '').trim();
    if (!reason) {
      throw new Error('reason is required to re-enable canary.');
    }

    const readinessBefore = this.getManualReenableReadiness();
    if (!readinessBefore.ready) {
      throw new Error(readinessBefore.reasons[0] || 'Manual re-enable gate is not ready.');
    }

    const sampleSize = this.outcomeWindow.length;
    const helpfulCount = this.outcomeWindow.reduce((sum, item) => sum + item.helpful, 0);
    const unsafeCount = this.outcomeWindow.reduce((sum, item) => sum + item.unsafe, 0);
    const helpfulnessRate = sampleSize > 0 ? helpfulCount / sampleSize : 1;
    const unsafeRate = sampleSize > 0 ? unsafeCount / sampleSize : 0;

    const previousAutoDisabledByKpi = this.canaryAutoDisabled;
    this.canaryAutoDisabled = false;

    this.appendHistoryPoint({
      timestamp: new Date().toISOString(),
      sampleSize,
      helpfulnessRate,
      unsafeRate,
      readyForGateEvaluation: sampleSize >= this.kpiMinSamples,
      autoDisabledByKpi: false,
      kpiBreached: false,
    });

    logger.info('[Triadic Canary] canary manually re-enabled after KPI disable', {
      updatedBy: input.updatedBy,
      reason,
    });

    return {
      previousAutoDisabledByKpi,
      autoDisabledByKpi: this.canaryAutoDisabled,
      updatedAt: new Date().toISOString(),
      updatedBy: input.updatedBy,
      reason,
      readinessBefore,
    };
  }

  getDashboardHistory(input?: {
    limit?: number;
    minutes?: number;
  }): TriadicCanaryHistoryPoint[] {
    const limit = Math.min(1000, Math.max(1, input?.limit || 200));
    const minutes = Math.min(7 * 24 * 60, Math.max(1, input?.minutes || 24 * 60));
    const threshold = Date.now() - minutes * 60 * 1000;

    return this.outcomeHistory
      .filter(point => new Date(point.timestamp).getTime() >= threshold)
      .slice(-limit);
  }

  getDashboardHistoryAggregated(input?: {
    limit?: number;
    minutes?: number;
    bucketMinutes?: number;
  }): TriadicCanaryAggregatedHistoryPoint[] {
    const limit = Math.min(1000, Math.max(1, input?.limit || 200));
    const minutes = Math.min(7 * 24 * 60, Math.max(1, input?.minutes || 24 * 60));
    const bucketMinutes = Math.min(60, Math.max(1, input?.bucketMinutes || 15));
    const threshold = Date.now() - minutes * 60 * 1000;
    const bucketMs = bucketMinutes * 60 * 1000;

    const filtered = this.outcomeHistory
      .filter(point => new Date(point.timestamp).getTime() >= threshold)
      .slice(-limit);

    const buckets = new Map<number, {
      count: number;
      helpfulnessSum: number;
      unsafeSum: number;
      maxSampleSize: number;
      gateReadyCount: number;
      kpiBreachedCount: number;
      autoDisabledObserved: boolean;
    }>();

    for (const point of filtered) {
      const ts = new Date(point.timestamp).getTime();
      const start = Math.floor(ts / bucketMs) * bucketMs;
      const bucket = buckets.get(start) || {
        count: 0,
        helpfulnessSum: 0,
        unsafeSum: 0,
        maxSampleSize: 0,
        gateReadyCount: 0,
        kpiBreachedCount: 0,
        autoDisabledObserved: false,
      };

      bucket.count += 1;
      bucket.helpfulnessSum += point.helpfulnessRate;
      bucket.unsafeSum += point.unsafeRate;
      bucket.maxSampleSize = Math.max(bucket.maxSampleSize, point.sampleSize);
      bucket.gateReadyCount += point.readyForGateEvaluation ? 1 : 0;
      bucket.kpiBreachedCount += point.kpiBreached ? 1 : 0;
      bucket.autoDisabledObserved = bucket.autoDisabledObserved || point.autoDisabledByKpi;

      buckets.set(start, bucket);
    }

    return Array.from(buckets.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([start, value]) => ({
        bucketStart: new Date(start).toISOString(),
        bucketMinutes,
        count: value.count,
        avgHelpfulnessRate: value.count > 0 ? value.helpfulnessSum / value.count : 0,
        avgUnsafeRate: value.count > 0 ? value.unsafeSum / value.count : 0,
        maxSampleSize: value.maxSampleSize,
        gateReadyRate: value.count > 0 ? value.gateReadyCount / value.count : 0,
        kpiBreachedCount: value.kpiBreachedCount,
        autoDisabledObserved: value.autoDisabledObserved,
      }));
  }

  getDecisionGateReadiness(): TriadicCanaryDecisionGateReadiness {
    const snapshot = this.getDashboardSnapshot();
    const checks = [
      {
        id: 'flag_enabled',
        label: 'Canary feature flag enabled',
        passed: snapshot.canary.enabledByFlag,
        detail: snapshot.canary.enabledByFlag
          ? 'Canary flag is enabled.'
          : 'Canary feature flag is disabled.',
      },
      {
        id: 'traffic_percent',
        label: 'Canary traffic percent > 0',
        passed: snapshot.canary.canaryPercent > 0,
        detail: snapshot.canary.canaryPercent > 0
          ? `Canary traffic percent is ${snapshot.canary.canaryPercent}.`
          : 'Canary traffic percentage is 0.',
      },
      {
        id: 'not_auto_disabled',
        label: 'Canary not auto-disabled by KPI',
        passed: !snapshot.canary.autoDisabledByKpi,
        detail: snapshot.canary.autoDisabledByKpi
          ? 'Canary was auto-disabled due to KPI breach.'
          : 'Canary is active (not auto-disabled).',
      },
      {
        id: 'sample_ready',
        label: 'Enough samples for gate evaluation',
        passed: snapshot.kpi.readyForGateEvaluation,
        detail: snapshot.kpi.readyForGateEvaluation
          ? `Sample size ${snapshot.kpi.sampleSize} meets minimum ${snapshot.thresholds.minSamples}.`
          : 'Not enough samples for gate evaluation.',
      },
      {
        id: 'helpfulness_threshold',
        label: 'Helpfulness rate meets threshold',
        passed: snapshot.kpi.helpfulnessRate >= snapshot.thresholds.minHelpfulnessRate,
        detail: snapshot.kpi.helpfulnessRate >= snapshot.thresholds.minHelpfulnessRate
          ? `Helpfulness ${snapshot.kpi.helpfulnessRate.toFixed(4)} >= ${snapshot.thresholds.minHelpfulnessRate.toFixed(4)}.`
          : 'Helpfulness rate is below threshold.',
      },
      {
        id: 'unsafe_threshold',
        label: 'Unsafe rate is within threshold',
        passed: snapshot.kpi.unsafeRate <= snapshot.thresholds.maxUnsafeRate,
        detail: snapshot.kpi.unsafeRate <= snapshot.thresholds.maxUnsafeRate
          ? `Unsafe rate ${snapshot.kpi.unsafeRate.toFixed(4)} <= ${snapshot.thresholds.maxUnsafeRate.toFixed(4)}.`
          : 'Unsafe rate is above threshold.',
      },
    ];

    const reasons = checks.filter(item => !item.passed).map(item => item.detail);
    const failedCheckIds = new Set(checks.filter(item => !item.passed).map(item => item.id));
    const recommendedActions: Array<{
      id: string;
      priority: 'high' | 'medium' | 'low';
      status: 'todo' | 'in_progress' | 'done';
      action: string;
      owner: 'expert' | 'devops' | 'product';
      etaHours: number;
      sourceCheckId?: string;
    }> = [];

    if (failedCheckIds.has('flag_enabled')) {
      recommendedActions.push({
        id: 'enable_canary_flag',
        priority: 'high',
        status: 'todo',
        action: 'Enable V5_TRIADIC_CANARY_ENABLED to start canary evaluation.',
        owner: 'devops',
        etaHours: 1,
        sourceCheckId: 'flag_enabled',
      });
    }

    if (failedCheckIds.has('traffic_percent')) {
      recommendedActions.push({
        id: 'set_canary_percent',
        priority: 'high',
        status: 'todo',
        action: 'Set V5_TRIADIC_CANARY_PERCENT to a value above 0 for controlled traffic.',
        owner: 'devops',
        etaHours: 1,
        sourceCheckId: 'traffic_percent',
      });
    }

    if (failedCheckIds.has('sample_ready')) {
      recommendedActions.push({
        id: 'collect_more_samples',
        priority: 'medium',
        status: 'todo',
        action: 'Collect more canary interactions before making rollout decisions.',
        owner: 'product',
        etaHours: 24,
        sourceCheckId: 'sample_ready',
      });
    }

    if (failedCheckIds.has('helpfulness_threshold')) {
      recommendedActions.push({
        id: 'improve_helpfulness_strategy',
        priority: 'medium',
        status: 'todo',
        action: 'Refine one-pivot strategy and prompts to improve helpfulness before scaling.',
        owner: 'expert',
        etaHours: 12,
        sourceCheckId: 'helpfulness_threshold',
      });
    }

    if (failedCheckIds.has('unsafe_threshold')) {
      recommendedActions.push({
        id: 'reduce_unsafe_risk',
        priority: 'high',
        status: 'todo',
        action: 'Tighten safety constraints or lower canary traffic while investigating unsafe responses.',
        owner: 'expert',
        etaHours: 4,
        sourceCheckId: 'unsafe_threshold',
      });
    }

    if (failedCheckIds.has('not_auto_disabled')) {
      recommendedActions.push({
        id: 'rollback_review',
        priority: 'high',
        status: 'todo',
        action: 'Keep canary disabled and run rollback review with expert panel before re-enable.',
        owner: 'expert',
        etaHours: 6,
        sourceCheckId: 'not_auto_disabled',
      });
    }

    const actions = recommendedActions.map(item => {
      const override = this.actionStatusOverrides.get(item.id);
      if (!override) {
        return item;
      }

      return {
        ...item,
        status: override.status,
      };
    });

    const ready = reasons.length === 0;
    return {
      ready,
      status: ready ? 'pass' : 'fail',
      reasons,
      checks,
      recommendedActions: actions,
      snapshot,
    };
  }

  updateRecommendedActionStatus(input: {
    actionId: string;
    status: TriadicActionStatus;
    updatedBy?: string;
    note?: string;
  }): {
    actionId: string;
    status: TriadicActionStatus;
    updatedAt: string;
    updatedBy?: string;
    note?: string;
  } {
    const readiness = this.getDecisionGateReadiness();
    const action = readiness.recommendedActions.find(item => item.id === input.actionId);

    if (!action) {
      throw new Error('Unknown actionId for current decision-gate context.');
    }

    if (input.status !== 'todo' && input.status !== 'in_progress' && input.status !== 'done') {
      throw new Error('Invalid action status.');
    }

    const payload = {
      actionId: input.actionId,
      status: input.status,
      updatedAt: new Date().toISOString(),
      updatedBy: input.updatedBy,
      note: input.note,
    };

    const previousStatus = this.actionStatusOverrides.get(input.actionId)?.status || action.status;

    this.actionStatusOverrides.set(input.actionId, {
      status: payload.status,
      updatedAt: payload.updatedAt,
      updatedBy: payload.updatedBy,
      note: payload.note,
    });

    this.actionStatusTimeline.push({
      actionId: payload.actionId,
      status: payload.status,
      previousStatus,
      updatedAt: payload.updatedAt,
      updatedBy: payload.updatedBy,
      note: payload.note,
      owner: action.owner,
      priority: action.priority,
    });
    if (this.actionStatusTimeline.length > this.actionHistoryMaxPoints) {
      this.actionStatusTimeline.shift();
    }

    return payload;
  }

  getActionStatusTimeline(input?: {
    limit?: number;
    actionId?: string;
    since?: string;
    until?: string;
  }): TriadicCanaryActionStatusTimelineEntry[] {
    const page = this.getActionStatusTimelinePage(input);
    return page.items;
  }

  getActionStatusTimelinePage(input?: {
    limit?: number;
    actionId?: string;
    since?: string;
    until?: string;
    cursor?: string;
    sort?: 'newest' | 'oldest';
  }): TriadicCanaryActionStatusTimelinePage {
    const limit = Math.min(1000, Math.max(1, input?.limit || 200));
    const actionId = typeof input?.actionId === 'string' ? input.actionId : undefined;
    const sinceTs = input?.since ? new Date(input.since).getTime() : undefined;
    const untilTs = input?.until ? new Date(input.until).getTime() : undefined;

    const filtered = actionId
      ? this.actionStatusTimeline.filter(item => item.actionId === actionId)
      : this.actionStatusTimeline;

    const filteredByTime = filtered
      .filter(item => {
        const ts = new Date(item.updatedAt).getTime();
        if (typeof sinceTs === 'number' && !Number.isNaN(sinceTs) && ts < sinceTs) {
          return false;
        }
        if (typeof untilTs === 'number' && !Number.isNaN(untilTs) && ts > untilTs) {
          return false;
        }
        return true;
      });

    const direction = input?.sort === 'oldest' ? 'oldest' : 'newest';
    const ordered = direction === 'oldest'
      ? [...filteredByTime]
      : [...filteredByTime].reverse();
    const start = Math.max(0, parseInt(input?.cursor || '0', 10) || 0);
    const items = ordered.slice(start, start + limit);
    const next = start + limit;

    return {
      items,
      nextCursor: next < ordered.length ? String(next) : null,
    };
  }

  selectPivotHint(suggestions?: string[]): string | null {
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      return null;
    }

    const first = suggestions.find(item => typeof item === 'string' && item.trim().length > 0);
    if (!first) {
      return null;
    }
    return first.trim();
  }

  applyOnePivotRule(baseMessage: string, pivotHint: string | null): string {
    if (!pivotHint) {
      return baseMessage;
    }

    const cleanBase = (baseMessage || '').trim();
    const cleanHint = pivotHint.replace(/\s+/g, ' ').trim();
    if (!cleanBase || !cleanHint) {
      return baseMessage;
    }

    const pivotLine = `\n\nNeu phu hop, ban co the thu 1 buoc nho: ${cleanHint}`;
    const merged = `${cleanBase}${pivotLine}`;

    logger.debug('[Triadic Canary] one-pivot hint appended', {
      hintLength: cleanHint.length,
    });

    return merged;
  }
}

export const triadicCanaryService = new TriadicCanaryService();
export default triadicCanaryService;
