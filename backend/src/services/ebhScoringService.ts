import InteractionEvent from '../models/InteractionEvent';

const RISK_TO_NEGATIVITY: Record<string, number> = {
  NONE: 0,
  LOW: 0.2,
  MODERATE: 0.45,
  HIGH: 0.7,
  CRITICAL: 0.9,
  EXTREME: 1,
};

const SENTIMENT_TO_NEGATIVITY: Record<string, number> = {
  very_negative: 1,
  negative: 0.75,
  neutral: 0.4,
  positive: 0.2,
  very_positive: 0.05,
};

type NegativitySample = {
  timestamp: Date;
  score: number;
  riskScore: number;
  sentimentScore: number;
  escalated: boolean;
};

export type EBHComponents = {
  inertia: number;
  negativeDrift: number;
  recoveryLag: number;
  couplingDensity: number;
};

export type EBHComputation = {
  score: number;
  zone: 'safe' | 'watch' | 'risk' | 'critical' | 'black_hole';
  components: EBHComponents;
  zComponents: EBHComponents;
  sampleSize: number;
  period: {
    from: Date;
    to: Date;
  };
};

export type EBHTimelinePoint = {
  index: number;
  period: {
    from: Date;
    to: Date;
  };
  sampleSize: number;
  score: number;
  zone: 'safe' | 'watch' | 'risk' | 'critical' | 'black_hole';
  components: EBHComponents;
};

export type EBHEarlyWarning = {
  type: 'accelerating' | 'threshold_crossing' | 'sustained_high' | 'critical_entry';
  severity: 'low' | 'medium' | 'high';
  message: string;
  atIndex: number;
  timestamp: Date;
  score: number;
};

export type EBHTimelineResult = {
  timeline: EBHTimelinePoint[];
  warnings: EBHEarlyWarning[];
  summary: {
    currentScore: number;
    currentZone: 'safe' | 'watch' | 'risk' | 'critical' | 'black_hole';
    trendSlope: number;
    maxScore: number;
    minScore: number;
  };
};

export type EBHInterventionTier = 'safe' | 'watch' | 'risk' | 'critical' | 'black_hole';

export type EBHInterventionPlan = {
  tier: EBHInterventionTier;
  suggestedActionText: string;
  actions: string[];
  notifyExpert: boolean;
  notifyPriority: 'low' | 'medium' | 'high' | 'urgent';
  followUpHours: number;
};

export type EBHExpertOverview = {
  summary: EBHTimelineResult['summary'];
  warnings: EBHEarlyWarning[];
  timelineCompact: EBHTimelinePoint[];
  suggestedActionText: string;
  interventionPlan: EBHInterventionPlan;
};

class EbhScoringService {
  private clamp01(value: number): number {
    return Math.max(0, Math.min(1, value));
  }

  private mean(values: number[]): number {
    if (!values.length) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private std(values: number[], fallback = 1): number {
    if (values.length < 2) return fallback;
    const avg = this.mean(values);
    const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
    const sigma = Math.sqrt(variance);
    return sigma > 1e-6 ? sigma : fallback;
  }

  private zScore(value: number, meanRef: number, stdRef: number): number {
    return (value - meanRef) / Math.max(stdRef, 1e-6);
  }

  private lag1Autocorrelation(series: number[]): number {
    if (series.length < 3) return 0;

    const x = series.slice(0, series.length - 1);
    const y = series.slice(1);
    const mx = this.mean(x);
    const my = this.mean(y);

    let numerator = 0;
    let dx = 0;
    let dy = 0;

    for (let i = 0; i < x.length; i++) {
      const a = x[i] - mx;
      const b = y[i] - my;
      numerator += a * b;
      dx += a * a;
      dy += b * b;
    }

    const denominator = Math.sqrt(dx * dy);
    if (denominator <= 1e-9) return 0;
    return numerator / denominator;
  }

  private computeRecoveryLag(series: number[], highThreshold = 0.7, recoveryThreshold = 0.4): number {
    if (series.length < 4) return 0;

    const lags: number[] = [];
    for (let i = 0; i < series.length - 1; i++) {
      if (series[i] < highThreshold) continue;

      let lag = 0;
      let recovered = false;
      for (let j = i + 1; j < series.length; j++) {
        lag += 1;
        if (series[j] <= recoveryThreshold) {
          recovered = true;
          break;
        }
      }

      if (recovered) {
        lags.push(lag);
      }
    }

    if (!lags.length) {
      return series.some(v => v >= highThreshold) ? series.length / 2 : 0;
    }

    return this.mean(lags);
  }

  private computeLaggedCorrelation(a: number[], b: number[]): number {
    if (a.length < 3 || b.length < 3) return 0;

    const x = a.slice(0, Math.min(a.length, b.length) - 1);
    const y = b.slice(1, Math.min(a.length, b.length));

    const mx = this.mean(x);
    const my = this.mean(y);

    let numerator = 0;
    let dx = 0;
    let dy = 0;

    for (let i = 0; i < x.length; i++) {
      const da = x[i] - mx;
      const db = y[i] - my;
      numerator += da * db;
      dx += da * da;
      dy += db * db;
    }

    const denominator = Math.sqrt(dx * dy);
    if (denominator <= 1e-9) return 0;
    return numerator / denominator;
  }

  private classify(score: number): 'safe' | 'watch' | 'risk' | 'critical' | 'black_hole' {
    if (score >= 0.8) return 'black_hole';
    if (score >= 0.6) return 'critical';
    if (score >= 0.4) return 'risk';
    if (score >= 0.2) return 'watch';
    return 'safe';
  }

  private deriveTier(score: number): EBHInterventionTier {
    if (score >= 0.8) return 'black_hole';
    if (score >= 0.6) return 'critical';
    if (score >= 0.4) return 'risk';
    if (score >= 0.2) return 'watch';
    return 'safe';
  }

  private compactTimeline(timeline: EBHTimelinePoint[], maxPoints = 8): EBHTimelinePoint[] {
    if (timeline.length <= maxPoints) return timeline;

    const result: EBHTimelinePoint[] = [];
    const step = (timeline.length - 1) / (maxPoints - 1);
    const used = new Set<number>();

    for (let i = 0; i < maxPoints; i++) {
      const idx = Math.round(i * step);
      if (!used.has(idx)) {
        result.push(timeline[idx]);
        used.add(idx);
      }
    }

    result.sort((a, b) => a.index - b.index);
    return result;
  }

  buildInterventionPlan(timelineResult: EBHTimelineResult): EBHInterventionPlan {
    const tier = this.deriveTier(timelineResult.summary.currentScore);
    const hasAcceleration = timelineResult.warnings.some(w => w.type === 'accelerating');
    const hasSustainedHigh = timelineResult.warnings.some(w => w.type === 'sustained_high');

    if (tier === 'black_hole') {
      return {
        tier,
        suggestedActionText: 'EBH ở mức black_hole: cần expert review khẩn, tăng tần suất theo dõi và chuẩn bị escalation quy trình khủng hoảng.',
        actions: [
          'Tạo expert review ticket ngay lập tức.',
          'Kích hoạt giám sát phiên theo thời gian thực.',
          'Ưu tiên checklist an toàn và tuyến hỗ trợ khẩn cấp nếu có tín hiệu nguy cơ.',
        ],
        notifyExpert: true,
        notifyPriority: 'urgent',
        followUpHours: 1,
      };
    }

    if (tier === 'critical') {
      return {
        tier,
        suggestedActionText: 'EBH đang ở vùng critical: cần can thiệp chủ động sớm, đẩy expert monitoring và giảm độ trễ phản hồi.',
        actions: [
          'Đưa user vào danh sách theo dõi ưu tiên cao.',
          'Áp dụng kịch bản hỗ trợ ổn định cảm xúc theo phiên.',
          'Đánh giá lại trong vòng 2-4 giờ với timeline cập nhật.',
        ],
        notifyExpert: true,
        notifyPriority: 'high',
        followUpHours: 4,
      };
    }

    if (tier === 'risk') {
      return {
        tier,
        suggestedActionText: hasAcceleration
          ? 'EBH vùng risk và có xu hướng tăng nhanh: nên can thiệp sớm để tránh vượt ngưỡng critical.'
          : 'EBH vùng risk: cần theo dõi sát và áp dụng can thiệp nhẹ theo phiên.',
        actions: [
          'Bật nhắc coping strategy có cấu trúc (thở sâu, grounding, journaling).',
          'Tăng mật độ check-in trạng thái cảm xúc trong các phiên tiếp theo.',
          'Đặt ngưỡng cảnh báo tự động khi điểm EBH tăng thêm >= 0.1.',
        ],
        notifyExpert: hasAcceleration || hasSustainedHigh,
        notifyPriority: hasAcceleration ? 'high' : 'medium',
        followUpHours: 12,
      };
    }

    if (tier === 'watch') {
      return {
        tier,
        suggestedActionText: 'EBH ở mức watch: duy trì theo dõi định kỳ và củng cố hành vi bảo vệ trước khi có xu hướng xấu.',
        actions: [
          'Theo dõi xu hướng EBH mỗi ngày.',
          'Nhắc kỹ thuật tự điều chỉnh cơ bản và hoạt động tích cực ngắn.',
          'Giữ kênh hỗ trợ mở để user chủ động liên hệ khi khó khăn tăng.',
        ],
        notifyExpert: false,
        notifyPriority: 'low',
        followUpHours: 24,
      };
    }

    return {
      tier,
      suggestedActionText: 'EBH ổn định: tiếp tục theo dõi nền và duy trì chiến lược phòng ngừa tái tăng.',
      actions: [
        'Duy trì baseline monitoring.',
        'Khuyến khích thói quen tích cực và tự đánh giá định kỳ.',
      ],
      notifyExpert: false,
      notifyPriority: 'low',
      followUpHours: 48,
    };
  }

  private linearSlope(values: number[]): number {
    if (values.length < 2) return 0;
    const n = values.length;
    const xs = Array.from({ length: n }, (_, i) => i + 1);
    const meanX = this.mean(xs);
    const meanY = this.mean(values);

    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i++) {
      const dx = xs[i] - meanX;
      numerator += dx * (values[i] - meanY);
      denominator += dx * dx;
    }

    if (denominator <= 1e-9) return 0;
    return numerator / denominator;
  }

  private mapInteractionToSample(event: any): NegativitySample {
    const riskScore = RISK_TO_NEGATIVITY[event.riskLevel] ?? 0;
    const sentimentScore = SENTIMENT_TO_NEGATIVITY[event.sentiment] ?? 0.4;
    const escalationBonus = event.escalationTriggered ? 0.15 : 0;

    return {
      timestamp: new Date(event.timestamp),
      riskScore,
      sentimentScore,
      escalated: !!event.escalationTriggered,
      score: this.clamp01(0.55 * riskScore + 0.45 * sentimentScore + escalationBonus),
    };
  }

  private computeFromSamples(samples: NegativitySample[]): EBHComputation {
    const series = samples.map(s => s.score);
    const riskSeries = samples.map(s => s.riskScore);
    const sentimentSeries = samples.map(s => s.sentimentScore);
    const n = samples.length;

    const inertia = this.clamp01((this.lag1Autocorrelation(series) + 1) / 2);

    const split = Math.max(2, Math.floor(n * 0.66));
    const baseline = series.slice(0, split);
    const recent = series.slice(split);
    const baselineMean = this.mean(baseline);
    const baselineStd = this.std(baseline, 0.2);
    const recentMean = this.mean(recent.length ? recent : baseline);
    const negativeDriftRaw = this.zScore(recentMean, baselineMean, baselineStd);
    const negativeDrift = this.clamp01((negativeDriftRaw + 3) / 6);

    const recoveryLagRaw = this.computeRecoveryLag(series);
    const recoveryLag = this.clamp01(recoveryLagRaw / Math.max(4, n / 3));

    const laggedCoupling = Math.abs(this.computeLaggedCorrelation(riskSeries, sentimentSeries));
    const highCount = series.filter(v => v >= 0.65).length;
    const persistence = highCount > 1
      ? highCount / n
      : 0;
    const couplingDensity = this.clamp01(0.6 * laggedCoupling + 0.4 * persistence);

    const components: EBHComponents = {
      inertia,
      negativeDrift,
      recoveryLag,
      couplingDensity,
    };

    // Pseudo z-scores anchored to conservative operational priors.
    const zComponents: EBHComponents = {
      inertia: this.zScore(inertia, 0.35, 0.2),
      negativeDrift: this.zScore(negativeDrift, 0.35, 0.2),
      recoveryLag: this.zScore(recoveryLag, 0.3, 0.2),
      couplingDensity: this.zScore(couplingDensity, 0.3, 0.2),
    };

    const score = this.clamp01(
      0.28 * components.inertia +
      0.26 * components.negativeDrift +
      0.24 * components.recoveryLag +
      0.22 * components.couplingDensity
    );

    return {
      score,
      zone: this.classify(score),
      components,
      zComponents,
      sampleSize: n,
      period: {
        from: samples[0].timestamp,
        to: samples[samples.length - 1].timestamp,
      },
    };
  }

  private buildTimeline(samples: NegativitySample[], windowSize: number, stepSize: number): EBHTimelinePoint[] {
    const points: EBHTimelinePoint[] = [];
    const safeWindow = Math.max(6, windowSize);
    const safeStep = Math.max(1, stepSize);

    for (let start = 0; start + safeWindow <= samples.length; start += safeStep) {
      const windowSamples = samples.slice(start, start + safeWindow);
      const computed = this.computeFromSamples(windowSamples);
      points.push({
        index: points.length,
        period: computed.period,
        sampleSize: computed.sampleSize,
        score: computed.score,
        zone: computed.zone,
        components: computed.components,
      });
    }

    // Ensure we always include the last window.
    if (samples.length >= safeWindow && points.length) {
      const lastStart = samples.length - safeWindow;
      const lastWindow = samples.slice(lastStart);
      const lastComputed = this.computeFromSamples(lastWindow);
      const alreadyLast = points[points.length - 1].period.to.getTime() === lastComputed.period.to.getTime();
      if (!alreadyLast) {
        points.push({
          index: points.length,
          period: lastComputed.period,
          sampleSize: lastComputed.sampleSize,
          score: lastComputed.score,
          zone: lastComputed.zone,
          components: lastComputed.components,
        });
      }
    }

    return points;
  }

  private detectWarnings(timeline: EBHTimelinePoint[]): EBHEarlyWarning[] {
    const warnings: EBHEarlyWarning[] = [];
    if (timeline.length < 2) return warnings;

    const scores = timeline.map(p => p.score);
    const slope = this.linearSlope(scores);
    const latest = timeline[timeline.length - 1];

    if (slope >= 0.03 && latest.score >= 0.35) {
      warnings.push({
        type: 'accelerating',
        severity: latest.score >= 0.55 ? 'high' : 'medium',
        message: 'EBH trend is accelerating upward. Consider early intervention review.',
        atIndex: latest.index,
        timestamp: latest.period.to,
        score: latest.score,
      });
    }

    for (let i = 1; i < timeline.length; i++) {
      const prev = timeline[i - 1];
      const curr = timeline[i];

      if (prev.score < 0.4 && curr.score >= 0.4) {
        warnings.push({
          type: 'threshold_crossing',
          severity: curr.score >= 0.6 ? 'high' : 'medium',
          message: 'EBH crossed into risk zone.',
          atIndex: curr.index,
          timestamp: curr.period.to,
          score: curr.score,
        });
      }

      if (prev.score < 0.6 && curr.score >= 0.6) {
        warnings.push({
          type: 'critical_entry',
          severity: 'high',
          message: 'EBH entered critical zone. Prioritize expert monitoring.',
          atIndex: curr.index,
          timestamp: curr.period.to,
          score: curr.score,
        });
      }
    }

    const tail = timeline.slice(-3);
    if (tail.length === 3 && tail.every(p => p.score >= 0.55)) {
      const last = tail[tail.length - 1];
      warnings.push({
        type: 'sustained_high',
        severity: 'high',
        message: 'EBH has remained high across consecutive windows.',
        atIndex: last.index,
        timestamp: last.period.to,
        score: last.score,
      });
    }

    return warnings;
  }

  async computeForUser(userId: string, days = 30): Promise<EBHComputation | null> {
    const startDate = new Date(Date.now() - Math.max(days, 1) * 24 * 60 * 60 * 1000);
    const interactions = await InteractionEvent.find({
      userId,
      timestamp: { $gte: startDate },
    })
      .sort({ timestamp: 1 })
      .lean();

    if (interactions.length < 8) return null;

    const samples = interactions.map(i => this.mapInteractionToSample(i));
    return this.computeFromSamples(samples);
  }

  async computeForSession(sessionId: string): Promise<EBHComputation | null> {
    const interactions = await InteractionEvent.find({ sessionId })
      .sort({ timestamp: 1 })
      .lean();

    if (interactions.length < 6) return null;

    const samples = interactions.map(i => this.mapInteractionToSample(i));
    return this.computeFromSamples(samples);
  }

  async computeTimelineForUser(
    userId: string,
    days = 30,
    windowSize = 12,
    stepSize = 4
  ): Promise<EBHTimelineResult | null> {
    const startDate = new Date(Date.now() - Math.max(days, 1) * 24 * 60 * 60 * 1000);
    const interactions = await InteractionEvent.find({
      userId,
      timestamp: { $gte: startDate },
    })
      .sort({ timestamp: 1 })
      .lean();

    if (interactions.length < Math.max(8, windowSize)) return null;

    const samples = interactions.map(i => this.mapInteractionToSample(i));
    const timeline = this.buildTimeline(samples, windowSize, stepSize);
    if (!timeline.length) return null;

    const warnings = this.detectWarnings(timeline);
    const scores = timeline.map(t => t.score);
    const latest = timeline[timeline.length - 1];

    return {
      timeline,
      warnings,
      summary: {
        currentScore: latest.score,
        currentZone: latest.zone,
        trendSlope: this.linearSlope(scores),
        maxScore: Math.max(...scores),
        minScore: Math.min(...scores),
      },
    };
  }

  async getExpertOverviewForUser(
    userId: string,
    days = 30,
    windowSize = 12,
    stepSize = 4,
    maxPoints = 8
  ): Promise<EBHExpertOverview | null> {
    const timelineResult = await this.computeTimelineForUser(userId, days, windowSize, stepSize);
    if (!timelineResult) return null;

    const interventionPlan = this.buildInterventionPlan(timelineResult);

    return {
      summary: timelineResult.summary,
      warnings: timelineResult.warnings,
      timelineCompact: this.compactTimeline(timelineResult.timeline, maxPoints),
      suggestedActionText: interventionPlan.suggestedActionText,
      interventionPlan,
    };
  }
}

export const ebhScoringService = new EbhScoringService();
export default ebhScoringService;
