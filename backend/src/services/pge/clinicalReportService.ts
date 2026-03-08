/**
 * CLINICAL REPORT SERVICE
 * 
 * PGE Phase 14 — Advanced Clinical Reporting
 * Aggregates all PGE data for a user into a structured clinical report.
 * 
 * Report sections:
 * 1. Patient Overview — sessions, dates, current zone
 * 2. EBH/ES Trend — score history, averages, direction
 * 3. Zone Distribution — time spent in each zone
 * 4. Emotional Profile — dominant emotions, state vector averages
 * 5. Risk Assessment — current risk, forecast, CSD indicators
 * 6. Treatment Progress — goals, progress, discharge readiness
 * 7. Resilience Profile — resilience index, growth phase
 * 8. Narrative Insights — themes, linguistic markers
 * 9. Intervention Summary — types used, effectiveness
 * 10. Recommendations — current intervention recommendations
 * 
 * @module services/pge/clinicalReportService
 * @version 1.0.0 — PGE Phase 14
 */

import { PsychologicalState } from '../../models/PsychologicalState';
import { SessionMetrics } from '../../models/SessionMetrics';
import { InterventionRecord } from '../../models/InterventionRecord';
import { PSY_VARIABLES, PSY_GROUPS } from '../../models/PsychologicalState';
import { forecastEngine } from './forecastEngine';
import { resilienceEngine } from './resilienceEngine';
import { treatmentPlanEngine } from './treatmentPlanEngine';
import { narrativeIntelligenceEngine } from './narrativeIntelligenceEngine';
import { outcomeLearningEngine } from './outcomeLearningEngine';
import { logger } from '../../utils/logger';

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────

export interface ClinicalReportSection {
  title: string;
  data: Record<string, any>;
}

export interface ClinicalReport {
  reportId: string;
  userId: string;
  generatedAt: Date;
  generatedBy: string; // expertId
  periodStart: Date;
  periodEnd: Date;
  sections: {
    overview: ClinicalReportSection;
    ebhTrend: ClinicalReportSection;
    zoneDistribution: ClinicalReportSection;
    emotionalProfile: ClinicalReportSection;
    riskAssessment: ClinicalReportSection;
    treatmentProgress: ClinicalReportSection;
    resilienceProfile: ClinicalReportSection;
    narrativeInsights: ClinicalReportSection;
    interventionSummary: ClinicalReportSection;
    recommendations: ClinicalReportSection;
  };
}

// ────────────────────────────────────────────────
// Service
// ────────────────────────────────────────────────

class ClinicalReportService {

  async generateReport(userId: string, expertId: string, days: number = 30): Promise<ClinicalReport> {
    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - days);

    const reportId = `RPT-${userId.slice(-6)}-${Date.now().toString(36)}`;

    logger.info(`[ClinicalReport] Generating report ${reportId} for user ${userId} (${days} days)`);

    // Fetch all raw data in parallel
    const [states, sessions, interventions] = await Promise.all([
      PsychologicalState.find({
        userId,
        timestamp: { $gte: periodStart, $lte: periodEnd },
      }).sort({ timestamp: 1 }).lean(),

      SessionMetrics.find({
        userId,
        createdAt: { $gte: periodStart, $lte: periodEnd },
      }).sort({ createdAt: 1 }).lean(),

      InterventionRecord.find({
        userId,
        createdAt: { $gte: periodStart, $lte: periodEnd },
      }).sort({ createdAt: 1 }).lean(),
    ]);

    // Fetch service data with graceful fallbacks
    const [forecast, resilience, treatment, narrative, outcomes] = await Promise.all([
      this.safeCall(() => forecastEngine.generateForecast(userId)),
      this.safeCall(() => resilienceEngine.getResilienceProfile(userId)),
      this.safeCall(() => treatmentPlanEngine.generateTreatmentPlan(userId)),
      this.safeCall(() => narrativeIntelligenceEngine.getFullNarrativeDashboard(userId)),
      this.safeCall(() => outcomeLearningEngine.getUserOutcomeProfile(userId)),
    ]);

    // Build sections
    const overview = this.buildOverview(userId, states, sessions, days);
    const ebhTrend = this.buildEBHTrend(states);
    const zoneDistribution = this.buildZoneDistribution(states);
    const emotionalProfile = this.buildEmotionalProfile(states);
    const riskAssessment = this.buildRiskAssessment(states, forecast);
    const treatmentProgress = this.buildTreatmentProgress(treatment);
    const resilienceProfile = this.buildResilienceProfile(resilience);
    const narrativeInsights = this.buildNarrativeInsights(narrative);
    const interventionSummary = this.buildInterventionSummary(interventions);
    const recommendations = this.buildRecommendations(states, forecast, treatment);

    return {
      reportId,
      userId,
      generatedAt: new Date(),
      generatedBy: expertId,
      periodStart,
      periodEnd,
      sections: {
        overview,
        ebhTrend,
        zoneDistribution,
        emotionalProfile,
        riskAssessment,
        treatmentProgress,
        resilienceProfile,
        narrativeInsights,
        interventionSummary,
        recommendations,
      },
    };
  }

  // ─── Section builders ────────────────────────

  private buildOverview(userId: string, states: any[], sessions: any[], days: number): ClinicalReportSection {
    const latestState = states[states.length - 1];
    const totalMessages = states.length;
    const totalSessions = sessions.length;
    const firstSession = sessions[0]?.startTime || states[0]?.timestamp;
    const lastSession = sessions[sessions.length - 1]?.endTime || latestState?.timestamp;

    return {
      title: 'Tổng Quan Bệnh Nhân',
      data: {
        userId,
        reportPeriodDays: days,
        totalMessages,
        totalSessions,
        firstSessionDate: firstSession,
        lastSessionDate: lastSession,
        currentZone: latestState?.zone || 'N/A',
        currentEBH: latestState?.ebhScore ?? 0,
        currentAttractor: latestState?.attractorState || 'N/A',
        currentDominantEmotion: latestState?.dominantEmotion || 'N/A',
      },
    };
  }

  private buildEBHTrend(states: any[]): ClinicalReportSection {
    const ebhScores = states.map(s => s.ebhScore ?? 0);
    const esScores = states.map(s => {
      const sv = s.stateVector;
      if (!sv) return 0;
      return ((sv.hope || 0) + (sv.calmness || 0) + (sv.joy || 0) + (sv.gratitude || 0)) / 4;
    });

    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const trend = ebhScores.length >= 2
      ? (ebhScores[ebhScores.length - 1] - ebhScores[0]) < -0.05 ? 'improving'
        : (ebhScores[ebhScores.length - 1] - ebhScores[0]) > 0.05 ? 'worsening' : 'stable'
      : 'insufficient_data';

    // Weekly averages
    const weeklyEBH: { week: number; avg: number; count: number }[] = [];
    if (states.length > 0) {
      const start = new Date(states[0].timestamp).getTime();
      for (const s of states) {
        const weekNum = Math.floor((new Date(s.timestamp).getTime() - start) / (7 * 24 * 3600 * 1000));
        if (!weeklyEBH[weekNum]) weeklyEBH[weekNum] = { week: weekNum + 1, avg: 0, count: 0 };
        weeklyEBH[weekNum].avg += s.ebhScore ?? 0;
        weeklyEBH[weekNum].count++;
      }
      for (const w of weeklyEBH) {
        if (w) w.avg = Math.round((w.avg / w.count) * 1000) / 1000;
      }
    }

    return {
      title: 'Xu Hướng EBH & ES',
      data: {
        dataPoints: ebhScores.length,
        ebh: {
          current: ebhScores[ebhScores.length - 1] ?? 0,
          average: Math.round(avg(ebhScores) * 1000) / 1000,
          min: Math.round(Math.min(...(ebhScores.length ? ebhScores : [0])) * 1000) / 1000,
          max: Math.round(Math.max(...(ebhScores.length ? ebhScores : [0])) * 1000) / 1000,
          trend,
        },
        es: {
          current: esScores[esScores.length - 1] ?? 0,
          average: Math.round(avg(esScores) * 1000) / 1000,
        },
        weeklyAverages: weeklyEBH.filter(Boolean),
      },
    };
  }

  private buildZoneDistribution(states: any[]): ClinicalReportSection {
    const zones = { safe: 0, caution: 0, risk: 0, critical: 0, black_hole: 0 };
    for (const s of states) {
      const z = s.zone as keyof typeof zones;
      if (zones[z] !== undefined) zones[z]++;
    }
    const total = states.length || 1;
    const percentages = Object.fromEntries(
      Object.entries(zones).map(([k, v]) => [k, Math.round((v / total) * 1000) / 10])
    );

    // Zone transitions
    let transitions = 0;
    for (let i = 1; i < states.length; i++) {
      if (states[i].zone !== states[i - 1].zone) transitions++;
    }

    return {
      title: 'Phân Bố Vùng Tâm Lý',
      data: {
        counts: zones,
        percentages,
        totalStates: states.length,
        transitions,
        mostFrequentZone: Object.entries(zones).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A',
      },
    };
  }

  private buildEmotionalProfile(states: any[]): ClinicalReportSection {
    if (!states.length) {
      return { title: 'Hồ Sơ Cảm Xúc', data: { message: 'Không có dữ liệu' } };
    }

    // Average each dimension
    const avgVector: Record<string, number> = {};
    for (const v of PSY_VARIABLES) {
      const vals = states.map(s => s.stateVector?.[v] ?? 0);
      avgVector[v] = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 1000) / 1000;
    }

    // Group averages
    const groupAvg = (vars: readonly string[]) => {
      const sum = vars.reduce((acc, v) => acc + (avgVector[v] || 0), 0);
      return Math.round((sum / vars.length) * 1000) / 1000;
    };

    const groups = {
      negativeEmotions: groupAvg(PSY_GROUPS.negativeEmotions),
      positiveEmotions: groupAvg(PSY_GROUPS.positiveEmotions),
      cognition: groupAvg(PSY_GROUPS.cognition),
      behavioral: groupAvg(PSY_GROUPS.behavioral),
      social: groupAvg(PSY_GROUPS.social),
      energy: groupAvg(PSY_GROUPS.energy),
    };

    // Top 5 dominant emotions
    const emotionCounts: Record<string, number> = {};
    for (const s of states) {
      const e = s.dominantEmotion || 'neutral';
      emotionCounts[e] = (emotionCounts[e] || 0) + 1;
    }
    const topEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([emotion, count]) => ({ emotion, count, percentage: Math.round((count / states.length) * 100) }));

    return {
      title: 'Hồ Sơ Cảm Xúc',
      data: {
        averageVector: avgVector,
        groupAverages: groups,
        topDominantEmotions: topEmotions,
        highRiskDimensions: Object.entries(avgVector)
          .filter(([, v]) => v > 0.6)
          .sort((a, b) => b[1] - a[1])
          .map(([dim, val]) => ({ dimension: dim, averageValue: val })),
      },
    };
  }

  private buildRiskAssessment(states: any[], forecast: any): ClinicalReportSection {
    const latest = states[states.length - 1];
    const recentStates = states.slice(-10);
    const recentEBH = recentStates.map(s => s.ebhScore ?? 0);
    const avgRecentEBH = recentEBH.length ? recentEBH.reduce((a, b) => a + b, 0) / recentEBH.length : 0;

    // Crisis episodes
    const crisisStates = states.filter(s => s.zone === 'critical' || s.zone === 'black_hole');

    return {
      title: 'Đánh Giá Rủi Ro',
      data: {
        currentEBH: latest?.ebhScore ?? 0,
        currentZone: latest?.zone || 'N/A',
        recentAverageEBH: Math.round(avgRecentEBH * 1000) / 1000,
        crisisEpisodes: crisisStates.length,
        lastCrisisDate: crisisStates[crisisStates.length - 1]?.timestamp || null,
        forecast: forecast ? {
          predictions: forecast.forecasts?.slice(0, 3) || [],
          riskLevel: forecast.alertLevel || 'unknown',
          csdIndex: forecast.csdIndex ?? null,
          alertLevel: forecast.alertLevel || 'none',
        } : { message: 'Không có dự báo' },
        riskLevel: avgRecentEBH > 0.7 ? 'high'
          : avgRecentEBH > 0.5 ? 'moderate'
          : avgRecentEBH > 0.3 ? 'low'
          : 'minimal',
      },
    };
  }

  private buildTreatmentProgress(treatment: any): ClinicalReportSection {
    if (!treatment) {
      return { title: 'Tiến Trình Điều Trị', data: { message: 'Chưa có kế hoạch điều trị' } };
    }
    return {
      title: 'Tiến Trình Điều Trị',
      data: {
        currentPhase: treatment.currentPhase || 'N/A',
        overallProgress: treatment.overallProgress ?? 0,
        goals: (treatment.goals || []).map((g: any) => ({
          name: g.name || g.goal,
          progress: g.progress ?? 0,
          status: g.status || 'in_progress',
        })),
        sessionFrequency: treatment.recommendedFrequency || 'N/A',
        dischargeReadiness: treatment.dischargeReadiness ?? null,
        adaptations: treatment.adaptations || [],
      },
    };
  }

  private buildResilienceProfile(resilience: any): ClinicalReportSection {
    if (!resilience) {
      return { title: 'Hồ Sơ Phục Hồi', data: { message: 'Chưa có dữ liệu phục hồi' } };
    }
    return {
      title: 'Hồ Sơ Phục Hồi',
      data: {
        resilienceIndex: resilience.resilienceIndex ?? 0,
        growthPhase: resilience.growthPhase || 'N/A',
        protectiveFactors: resilience.protectiveFactors || [],
        milestones: (resilience.milestones || []).slice(0, 5),
        trajectory: resilience.trajectory || 'N/A',
      },
    };
  }

  private buildNarrativeInsights(narrative: any): ClinicalReportSection {
    if (!narrative) {
      return { title: 'Phân Tích Ngôn Ngữ', data: { message: 'Chưa có phân tích' } };
    }
    return {
      title: 'Phân Tích Ngôn Ngữ',
      data: {
        keyThemes: (narrative.themes || []).slice(0, 5),
        linguisticMarkers: narrative.linguisticMarkers || {},
        riskTopics: (narrative.riskTopics || []).slice(0, 3),
        storyArcs: (narrative.storyArcs || []).slice(0, 3),
        overallSentiment: narrative.overallSentiment || 'N/A',
      },
    };
  }

  private buildInterventionSummary(interventions: any[]): ClinicalReportSection {
    if (!interventions.length) {
      return { title: 'Tổng Kết Can Thiệp', data: { message: 'Chưa có can thiệp', totalInterventions: 0 } };
    }

    const byType: Record<string, { count: number; avgEffectiveness: number; totalEff: number }> = {};
    for (const intv of interventions) {
      const t = intv.interventionType || 'unknown';
      if (!byType[t]) byType[t] = { count: 0, avgEffectiveness: 0, totalEff: 0 };
      byType[t].count++;
      byType[t].totalEff += intv.effectiveness ?? 0;
    }
    for (const t of Object.values(byType)) {
      t.avgEffectiveness = Math.round((t.totalEff / t.count) * 1000) / 1000;
    }

    const avgDeltaEBH = interventions
      .filter(i => i.preEBH != null && i.postEBH != null)
      .map(i => i.postEBH - i.preEBH);
    const overallEffect = avgDeltaEBH.length
      ? Math.round((avgDeltaEBH.reduce((a, b) => a + b, 0) / avgDeltaEBH.length) * 1000) / 1000
      : 0;

    return {
      title: 'Tổng Kết Can Thiệp',
      data: {
        totalInterventions: interventions.length,
        byType: Object.entries(byType).map(([type, stats]) => ({
          type,
          count: stats.count,
          avgEffectiveness: stats.avgEffectiveness,
        })),
        overallEBHEffect: overallEffect,
        mostEffectiveType: Object.entries(byType)
          .sort((a, b) => b[1].avgEffectiveness - a[1].avgEffectiveness)[0]?.[0] || 'N/A',
      },
    };
  }

  private buildRecommendations(states: any[], forecast: any, treatment: any): ClinicalReportSection {
    const recommendations: string[] = [];
    const latest = states[states.length - 1];

    if (!latest) {
      return { title: 'Khuyến Nghị', data: { recommendations: ['Cần thu thập thêm dữ liệu'] } };
    }

    // Zone-based recommendations
    if (latest.zone === 'black_hole' || latest.zone === 'critical') {
      recommendations.push('Cần can thiệp khẩn cấp — EBH ở mức nguy hiểm');
      recommendations.push('Tăng tần suất phiên trị liệu lên hàng ngày');
    } else if (latest.zone === 'risk') {
      recommendations.push('Theo dõi chặt chẽ — EBH ở vùng rủi ro');
      recommendations.push('Xem xét tăng can thiệp behavioral_activation');
    } else if (latest.zone === 'caution') {
      recommendations.push('Tiếp tục kế hoạch điều trị hiện tại');
      recommendations.push('Tập trung vào xây dựng yếu tố bảo vệ');
    } else {
      recommendations.push('Trạng thái ổn định — duy trì chế độ bảo trì');
    }

    // Forecast-based
    if (forecast?.riskLevel === 'high') {
      recommendations.push('Dự báo: nguy cơ tăng cao trong 7 ngày tới');
    }
    if (forecast?.csdIndex > 0.7) {
      recommendations.push('Phát hiện tín hiệu CSD — có thể xảy ra chuyển đổi trạng thái');
    }

    // Treatment-based
    if (treatment?.dischargeReadiness > 0.8) {
      recommendations.push('Mức độ sẵn sàng xuất viện cao — xem xét giảm cường độ điều trị');
    }

    return {
      title: 'Khuyến Nghị',
      data: {
        recommendations,
        generatedAt: new Date(),
        priority: latest.zone === 'black_hole' || latest.zone === 'critical' ? 'high'
          : latest.zone === 'risk' ? 'moderate' : 'low',
      },
    };
  }

  // Helper: safe call with fallback
  private async safeCall<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch (err) {
      logger.warn('[ClinicalReport] Service call failed:', err);
      return null;
    }
  }
}

export const clinicalReportService = new ClinicalReportService();
