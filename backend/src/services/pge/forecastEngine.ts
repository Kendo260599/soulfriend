/**
 * FORECAST ENGINE — Predictive Early Warning System
 * 
 * PGE Phase 6: Combines CSD indicators, Holt's exponential smoothing,
 * and risk probability estimation to generate multi-horizon forecasts.
 * 
 * Pipeline:
 * 1. Gather historical EBH/zone time series from PsychologicalState
 * 2. Compute CSD indicators (variance trend, autocorrelation trend, flickering)
 * 3. Run Holt's double exponential smoothing for 1/3/7-day horizons
 * 4. Estimate risk probabilities at each horizon
 * 5. Compute composite risk score and alert level
 * 6. Generate Vietnamese recommendations
 * 
 * @module services/pge/forecastEngine
 * @version 1.0.0 — Phase 6
 */

import logger from '../../utils/logger';
import PsychologicalState from '../../models/PsychologicalState';
import {
  computeEBHScore,
  classifyZone,
  computeCSDIndicators,
  holtForecast,
  forecastConfidenceInterval,
  estimateZoneRiskProbability,
  detectTrend,
  computeCompositeRisk,
  getAlertLevel,
  getAlertMessage,
  generateForecastRecommendations,
  CSDIndicators,
  ForecastPoint,
  ForecastResult,
} from './mathEngine';

// ════════════════════════════════════════════════════════════════
// CONFIGURATION
// ════════════════════════════════════════════════════════════════

/** Minimum data points required for meaningful forecast */
const MIN_SERIES_LENGTH = 5;

/** Forecast horizons in "messages ahead" (proxy for time) */
const FORECAST_HORIZONS = [
  { steps: 3,  label: '1 ngày',  days: 1 },
  { steps: 9,  label: '3 ngày',  days: 3 },
  { steps: 21, label: '7 ngày',  days: 7 },
];

/** Cache TTL: 5 minutes */
const CACHE_TTL_MS = 5 * 60 * 1000;

/** Maximum historical states to fetch */
const MAX_HISTORY = 100;

// ════════════════════════════════════════════════════════════════
// FORECAST ENGINE CLASS
// ════════════════════════════════════════════════════════════════

class ForecastEngineService {
  private cache: Map<string, { result: ForecastResult; expiry: number }> = new Map();
  private static readonly MAX_CACHE_SIZE = 200;

  private evictIfNeeded(): void {
    if (this.cache.size > ForecastEngineService.MAX_CACHE_SIZE) {
      const oldest = this.cache.keys().next().value;
      if (oldest) this.cache.delete(oldest);
    }
  }

  /**
   * Generate full forecast for a user.
   * Returns CSD indicators, multi-horizon predictions, risk probabilities,
   * composite risk score, alert level, and recommendations.
   */
  async generateForecast(userId: string): Promise<ForecastResult> {
    // Check cache
    const cached = this.cache.get(userId);
    if (cached && cached.expiry > Date.now()) {
      return cached.result;
    }

    // 1. Gather historical data
    const states = await PsychologicalState.find({ userId })
      .sort({ timestamp: 1 })
      .select('ebhScore zone negativeInertia loopStrength potentialEnergy hopeDelta timestamp')
      .limit(MAX_HISTORY)
      .lean();

    if (states.length < MIN_SERIES_LENGTH) {
      const result = this.buildInsufficientDataResult(userId, states);
      this.cache.set(userId, { result, expiry: Date.now() + CACHE_TTL_MS });
      this.evictIfNeeded();
      return result;
    }

    // 2. Extract time series
    const ebhSeries = states.map(s => s.ebhScore ?? 0);
    const zoneSeries = states.map(s => s.zone ?? 'safe');
    const currentEBH = ebhSeries[ebhSeries.length - 1];
    const currentZone = zoneSeries[zoneSeries.length - 1];

    // 3. Compute CSD indicators
    const csd = computeCSDIndicators(ebhSeries, zoneSeries);

    // 4. Run Holt's forecast
    const { predictions, residuals, level, trend } = holtForecast(
      ebhSeries,
      FORECAST_HORIZONS.map(h => h.steps),
    );

    // 5. Build forecast points with CI and risk probabilities
    const forecasts: ForecastPoint[] = FORECAST_HORIZONS.map((h, i) => {
      const pred = predictions[i];
      const ci = forecastConfidenceInterval(pred, residuals, h.steps);
      const riskProb = estimateZoneRiskProbability(pred, residuals, h.steps, 0.5);
      const critProb = estimateZoneRiskProbability(pred, residuals, h.steps, 0.7);

      return {
        horizon: h.days,
        horizonLabel: h.label,
        predictedEBH: pred,
        predictedZone: classifyZone(pred),
        confidenceLow: ci.low,
        confidenceHigh: ci.high,
        riskProbability: riskProb,
        criticalProbability: critProb,
      };
    });

    // 6. Trend detection
    const { direction: trendDirection, strength: trendStrength } = detectTrend(ebhSeries);

    // 7. Composite risk & alert
    const maxRiskProb = Math.max(...forecasts.map(f => f.riskProbability));
    const compositeRisk = computeCompositeRisk(
      currentEBH, csd.compositeIndex, trendDirection, trendStrength, maxRiskProb,
    );
    const alertLevel = getAlertLevel(compositeRisk);

    // Find the most dangerous horizon for the alert message
    const worstForecast = forecasts.reduce((a, b) => a.riskProbability > b.riskProbability ? a : b);
    const alertMessage = getAlertMessage(
      alertLevel, trendDirection, csd.interpretationLevel,
      worstForecast.riskProbability, worstForecast.horizonLabel,
    );

    // 8. Recommendations
    const recommendations = generateForecastRecommendations(
      alertLevel, csd, trendDirection, currentZone,
    );

    const result: ForecastResult = {
      userId,
      generatedAt: Date.now(),
      currentEBH,
      currentZone,
      csd,
      forecasts,
      trendDirection,
      trendStrength,
      compositeRisk,
      alertLevel,
      alertMessage,
      recommendations,
    };

    // Cache result
    this.cache.set(userId, { result, expiry: Date.now() + CACHE_TTL_MS });
    this.evictIfNeeded();

    logger.info('[ForecastEngine] Forecast generated', {
      userId: userId.substring(0, 8),
      currentEBH: currentEBH.toFixed(3),
      csdIndex: csd.compositeIndex.toFixed(3),
      trendDirection,
      compositeRisk: compositeRisk.toFixed(3),
      alertLevel,
      dataPoints: states.length,
    });

    return result;
  }

  /**
   * Get only CSD indicators for a user (lighter than full forecast).
   */
  async getCSDIndicators(userId: string): Promise<CSDIndicators> {
    const states = await PsychologicalState.find({ userId })
      .sort({ timestamp: 1 })
      .select('ebhScore zone')
      .limit(MAX_HISTORY)
      .lean();

    if (states.length < MIN_SERIES_LENGTH) {
      return {
        variance: 0,
        varianceTrend: 0,
        autocorrelation: 0,
        autocorrelationTrend: 0,
        flickering: false,
        flickeringCount: 0,
        skewness: 0,
        compositeIndex: 0,
        interpretation: 'Chưa đủ dữ liệu để phân tích (cần tối thiểu 5 điểm dữ liệu).',
        interpretationLevel: 'low',
      };
    }

    const ebhSeries = states.map(s => s.ebhScore ?? 0);
    const zoneSeries = states.map(s => s.zone ?? 'safe');
    return computeCSDIndicators(ebhSeries, zoneSeries);
  }

  /**
   * Invalidate cache for a user (call after new state is saved).
   */
  invalidateCache(userId: string): void {
    this.cache.delete(userId);
  }

  /**
   * Build result when insufficient data is available.
   */
  private buildInsufficientDataResult(
    userId: string,
    states: any[],
  ): ForecastResult {
    const currentEBH = states.length > 0 ? (states[states.length - 1].ebhScore ?? 0) : 0;
    const currentZone = states.length > 0 ? (states[states.length - 1].zone ?? 'safe') : 'safe';

    return {
      userId,
      generatedAt: Date.now(),
      currentEBH,
      currentZone,
      csd: {
        variance: 0,
        varianceTrend: 0,
        autocorrelation: 0,
        autocorrelationTrend: 0,
        flickering: false,
        flickeringCount: 0,
        skewness: 0,
        compositeIndex: 0,
        interpretation: `Chưa đủ dữ liệu (${states.length}/${MIN_SERIES_LENGTH}). Cần thêm vài phiên trò chuyện.`,
        interpretationLevel: 'low',
      },
      forecasts: FORECAST_HORIZONS.map(h => ({
        horizon: h.days,
        horizonLabel: h.label,
        predictedEBH: currentEBH,
        predictedZone: currentZone,
        confidenceLow: 0,
        confidenceHigh: 1,
        riskProbability: 0,
        criticalProbability: 0,
      })),
      trendDirection: 'stable',
      trendStrength: 0,
      compositeRisk: 0,
      alertLevel: 'none',
      alertMessage: 'Chưa đủ dữ liệu để dự báo. Tiếp tục trò chuyện để hệ thống thu thập thêm thông tin.',
      recommendations: ['Tiếp tục sử dụng ứng dụng để hệ thống có đủ dữ liệu phân tích.'],
    };
  }
}

// Singleton
export const forecastEngine = new ForecastEngineService();
export default forecastEngine;
