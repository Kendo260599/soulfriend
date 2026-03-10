/**
 * Tests for Student-t Distribution & Heavy-Tailed Risk Estimation
 * 
 * Validates:
 * 1. Student-t CDF mathematical correctness (against known values)
 * 2. t-quantile inverse correctness
 * 3. Heavy tails → higher crisis probability than Gaussian
 * 4. Convergence to Normal as df → ∞
 * 5. forecastConfidenceInterval with Student-t → wider CIs
 * 6. estimateZoneRiskProbability with Student-t → higher risk estimates
 * 7. regBetaIncomplete & lnGamma correctness
 */
import {
  normalCDF,
  normalQuantile,
  studentTCDF,
  tQuantile,
  regBetaIncomplete,
  lnGamma,
  forecastConfidenceInterval,
  estimateZoneRiskProbability,
  holtForecast,
} from '../../src/services/pge/mathEngine';

describe('Student-t Distribution & Heavy-Tailed Risk', () => {

  // ─────────────────────────────────────────────
  // lnGamma correctness
  // ─────────────────────────────────────────────
  describe('lnGamma', () => {
    test('Γ(1) = 1 → ln(1) = 0', () => {
      expect(lnGamma(1)).toBeCloseTo(0, 8);
    });

    test('Γ(2) = 1 → ln(1) = 0', () => {
      expect(lnGamma(2)).toBeCloseTo(0, 8);
    });

    test('Γ(5) = 24 → ln(24)', () => {
      expect(lnGamma(5)).toBeCloseTo(Math.log(24), 6);
    });

    test('Γ(0.5) = √π', () => {
      expect(Math.exp(lnGamma(0.5))).toBeCloseTo(Math.sqrt(Math.PI), 6);
    });

    test('Γ(10) = 362880', () => {
      expect(lnGamma(10)).toBeCloseTo(Math.log(362880), 4);
    });
  });

  // ─────────────────────────────────────────────
  // regBetaIncomplete
  // ─────────────────────────────────────────────
  describe('regBetaIncomplete', () => {
    test('I_0(a, b) = 0', () => {
      expect(regBetaIncomplete(0, 2, 3)).toBe(0);
    });

    test('I_1(a, b) = 1', () => {
      expect(regBetaIncomplete(1, 2, 3)).toBe(1);
    });

    test('I_0.5(1, 1) = 0.5 (uniform)', () => {
      expect(regBetaIncomplete(0.5, 1, 1)).toBeCloseTo(0.5, 4);
    });

    test('I_0.5(2, 2) ≈ 0.5 (symmetric beta)', () => {
      expect(regBetaIncomplete(0.5, 2, 2)).toBeCloseTo(0.5, 4);
    });
  });

  // ─────────────────────────────────────────────
  // normalCDF / normalQuantile roundtrip
  // ─────────────────────────────────────────────
  describe('Normal distribution', () => {
    test('Φ(0) = 0.5', () => {
      expect(normalCDF(0)).toBeCloseTo(0.5, 6);
    });

    test('Φ(1.645) ≈ 0.95', () => {
      expect(normalCDF(1.645)).toBeCloseTo(0.95, 1);
    });

    test('Φ(-1.96) ≈ 0.025', () => {
      expect(normalCDF(-1.96)).toBeCloseTo(0.025, 1);
    });

    test('normalQuantile(0.975) ≈ 1.96', () => {
      expect(normalQuantile(0.975)).toBeCloseTo(1.96, 2);
    });

    test('normalQuantile(0.5) = 0', () => {
      expect(normalQuantile(0.5)).toBe(0);
    });

    test('roundtrip: normalCDF(normalQuantile(p)) ≈ p', () => {
      for (const p of [0.01, 0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99]) {
        expect(normalCDF(normalQuantile(p))).toBeCloseTo(p, 2);
      }
    });
  });

  // ─────────────────────────────────────────────
  // Student-t CDF
  // ─────────────────────────────────────────────
  describe('studentTCDF', () => {
    test('F_t(0, ν) = 0.5 for all ν (symmetry)', () => {
      for (const df of [3, 5, 10, 30, 100]) {
        expect(studentTCDF(0, df)).toBeCloseTo(0.5, 4);
      }
    });

    test('F_t(∞) → 1, F_t(-∞) → 0', () => {
      expect(studentTCDF(20, 5)).toBeCloseTo(1, 3);
      expect(studentTCDF(-20, 5)).toBeCloseTo(0, 3);
    });

    // Known values: t(0.975, 5) ≈ 2.571
    test('P(T ≤ 2.571 | df=5) ≈ 0.975', () => {
      expect(studentTCDF(2.571, 5)).toBeCloseTo(0.975, 2);
    });

    // t(0.975, 10) ≈ 2.228
    test('P(T ≤ 2.228 | df=10) ≈ 0.975', () => {
      expect(studentTCDF(2.228, 10)).toBeCloseTo(0.975, 2);
    });

    // t(0.95, 3) ≈ 2.353
    test('P(T ≤ 2.353 | df=3) ≈ 0.95', () => {
      expect(studentTCDF(2.353, 3)).toBeCloseTo(0.95, 2);
    });

    test('converges to normal for large df', () => {
      // For df=1000, should be very close to normalCDF
      for (const x of [-2, -1, 0, 1, 2]) {
        const tVal = studentTCDF(x, 1000);
        const nVal = normalCDF(x);
        expect(Math.abs(tVal - nVal)).toBeLessThan(0.01);
      }
    });

    test('heavier tails than Normal: P(|T|>2) is larger for small df', () => {
      // P(T > 2 | df=5) should be > P(Z > 2) ≈ 0.0228
      const tTail = 1 - studentTCDF(2, 5);
      const nTail = 1 - normalCDF(2);
      expect(tTail).toBeGreaterThan(nTail);
    });

    test('tail probability decreases as df increases', () => {
      const tail3 = 1 - studentTCDF(2, 3);
      const tail10 = 1 - studentTCDF(2, 10);
      const tail50 = 1 - studentTCDF(2, 50);
      expect(tail3).toBeGreaterThan(tail10);
      expect(tail10).toBeGreaterThan(tail50);
    });
  });

  // ─────────────────────────────────────────────
  // t-Quantile
  // ─────────────────────────────────────────────
  describe('tQuantile', () => {
    test('tQuantile(0.5, df) = 0 (symmetry)', () => {
      expect(tQuantile(0.5, 10)).toBeCloseTo(0, 3);
    });

    test('tQuantile(0.975, 5) ≈ 2.571', () => {
      expect(tQuantile(0.975, 5)).toBeCloseTo(2.571, 1);
    });

    test('tQuantile(0.975, 10) ≈ 2.228', () => {
      expect(tQuantile(0.975, 10)).toBeCloseTo(2.228, 1);
    });

    test('tQuantile > normalQuantile for same p (wider tails)', () => {
      const tQ = tQuantile(0.975, 5);
      const nQ = normalQuantile(0.975);
      expect(tQ).toBeGreaterThan(nQ);
    });

    test('roundtrip: studentTCDF(tQuantile(p, df), df) ≈ p', () => {
      for (const df of [5, 10, 30]) {
        for (const p of [0.05, 0.25, 0.5, 0.75, 0.95]) {
          expect(studentTCDF(tQuantile(p, df), df)).toBeCloseTo(p, 2);
        }
      }
    });
  });

  // ─────────────────────────────────────────────
  // forecastConfidenceInterval with Student-t
  // ─────────────────────────────────────────────
  describe('forecastConfidenceInterval with Student-t', () => {
    const residuals = [0.05, -0.03, 0.08, -0.02, 0.04, -0.06, 0.01, 0.03];

    test('Student-t CI is wider than Normal CI (small df)', () => {
      const ciNormal = forecastConfidenceInterval(0.4, residuals, 3, 0.90);
      const ciT = forecastConfidenceInterval(0.4, residuals, 3, 0.90, 6);

      const widthNormal = ciNormal.high - ciNormal.low;
      const widthT = ciT.high - ciT.low;
      expect(widthT).toBeGreaterThan(widthNormal);
    });

    test('Student-t CI converges to Normal CI for large df', () => {
      const ciNormal = forecastConfidenceInterval(0.4, residuals, 3, 0.90);
      const ciT = forecastConfidenceInterval(0.4, residuals, 3, 0.90, 500);

      expect(ciT.low).toBeCloseTo(ciNormal.low, 2);
      expect(ciT.high).toBeCloseTo(ciNormal.high, 2);
    });

    test('without df → backward compatible Normal behavior', () => {
      const ci1 = forecastConfidenceInterval(0.4, residuals, 3, 0.90);
      const ci2 = forecastConfidenceInterval(0.4, residuals, 3, 0.90, undefined);
      expect(ci1.low).toBeCloseTo(ci2.low, 8);
      expect(ci1.high).toBeCloseTo(ci2.high, 8);
    });

    test('CI is clamped to [0, 1]', () => {
      const ci = forecastConfidenceInterval(0.95, residuals, 21, 0.90, 6);
      expect(ci.high).toBeLessThanOrEqual(1);
      expect(ci.low).toBeGreaterThanOrEqual(0);
    });
  });

  // ─────────────────────────────────────────────
  // estimateZoneRiskProbability with Student-t
  // ─────────────────────────────────────────────
  describe('estimateZoneRiskProbability with Student-t', () => {
    const residuals = [0.05, -0.03, 0.08, -0.02, 0.04, -0.06, 0.01, 0.03, -0.04, 0.02];

    test('Student-t gives HIGHER risk probability than Normal (core fix)', () => {
      // This is the KEY property: heavy tails → more extreme events
      const riskNormal = estimateZoneRiskProbability(0.35, residuals, 3, 0.5);
      const riskT = estimateZoneRiskProbability(0.35, residuals, 3, 0.5, 8);

      expect(riskT).toBeGreaterThan(riskNormal);
    });

    test('higher risk difference for more extreme thresholds', () => {
      // The tail difference is more pronounced at extreme values
      const diffRisk = estimateZoneRiskProbability(0.3, residuals, 3, 0.5, 5)
        - estimateZoneRiskProbability(0.3, residuals, 3, 0.5);
      const diffCrit = estimateZoneRiskProbability(0.3, residuals, 3, 0.7, 5)
        - estimateZoneRiskProbability(0.3, residuals, 3, 0.7);

      // Both differences should be positive (Student-t gives higher probs)
      expect(diffRisk).toBeGreaterThan(0);
      expect(diffCrit).toBeGreaterThan(0);
    });

    test('converges to Normal for large df', () => {
      const riskN = estimateZoneRiskProbability(0.35, residuals, 3, 0.5);
      const riskT = estimateZoneRiskProbability(0.35, residuals, 3, 0.5, 500);
      expect(Math.abs(riskT - riskN)).toBeLessThan(0.01);
    });

    test('without df → backward compatible', () => {
      const r1 = estimateZoneRiskProbability(0.35, residuals, 3, 0.5);
      const r2 = estimateZoneRiskProbability(0.35, residuals, 3, 0.5, undefined);
      expect(r1).toBeCloseTo(r2, 8);
    });

    test('zero variance → deterministic', () => {
      const zeroResiduals = [0, 0, 0, 0, 0];
      expect(estimateZoneRiskProbability(0.6, zeroResiduals, 3, 0.5, 3)).toBe(1.0);
      expect(estimateZoneRiskProbability(0.4, zeroResiduals, 3, 0.5, 3)).toBe(0.0);
    });
  });

  // ─────────────────────────────────────────────
  // Clinical Scenario: Crisis Underestimation Fix
  // ─────────────────────────────────────────────
  describe('Clinical: Crisis Underestimation Prevention', () => {

    test('new user (10 messages) → Student-t gives higher tail-risk probability', () => {
      // Simulate a new user with increasing EBH trend
      const ebhSeries = [0.15, 0.18, 0.20, 0.22, 0.19, 0.25, 0.23, 0.27, 0.24, 0.26];
      const { predictions, residuals } = holtForecast(ebhSeries, [3, 9]);
      const df = residuals.length - 2; // ~7

      // P(EBH ≥ 0.5) — threshold well above prediction → tail region
      const pNormal = estimateZoneRiskProbability(predictions[0], residuals, 3, 0.5);
      const pT = estimateZoneRiskProbability(predictions[0], residuals, 3, 0.5, df);

      // Student-t heavy tail gives higher probability for far-from-mean thresholds
      expect(pT).toBeGreaterThan(pNormal);
      expect(pT).toBeGreaterThan(0);
      expect(pT).toBeLessThan(1);
    });

    test('experienced user (50+ messages) → difference diminishes', () => {
      // With 50+ messages, df >> 30 → Student-t ≈ Normal
      const ebhSeries = Array.from({ length: 50 }, (_, i) =>
        0.25 + 0.05 * Math.sin(i / 5) + (Math.random() - 0.5) * 0.02
      );
      const { predictions, residuals } = holtForecast(ebhSeries, [3]);
      const df = residuals.length - 2; // ~47

      const pNormal = estimateZoneRiskProbability(predictions[0], residuals, 3, 0.5);
      const pT = estimateZoneRiskProbability(predictions[0], residuals, 3, 0.5, df);

      // Difference should be very small for large df
      expect(Math.abs(pT - pNormal)).toBeLessThan(0.05);
    });

    test('precautionary principle: 7-day horizon CI is wider with Student-t', () => {
      const ebhSeries = [0.30, 0.35, 0.28, 0.32, 0.37, 0.40, 0.33, 0.36];
      const { predictions, residuals } = holtForecast(ebhSeries, [21]);
      const df = residuals.length - 2;

      const ciNormal = forecastConfidenceInterval(predictions[0], residuals, 21, 0.90);
      const ciT = forecastConfidenceInterval(predictions[0], residuals, 21, 0.90, df);

      // 7-day Student-t CI should be wider → captures more uncertainty
      const widthN = ciNormal.high - ciNormal.low;
      const widthT = ciT.high - ciT.low;
      expect(widthT).toBeGreaterThan(widthN);
    });
  });
});
