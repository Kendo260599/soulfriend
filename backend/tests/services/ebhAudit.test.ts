/**
 * EBH (Emotional Black Hole) Analysis Audit Tests
 * 
 * Tests for BUG 11-13 found during EBH deep audit:
 * - BUG 11 (🔴 Critical): simulateTrajectory used wrong dynamics (dS=A·S instead of dS=(A-I)·S)
 * - BUG 12 (🟡 Medium): Zone thresholds mismatch between classifyZone and ZONE_THRESHOLDS
 * - BUG 13 (🟡 Medium): findOptimalIntervention ignored loopStrength & negativeInertia
 */

import {
  simulateTrajectory,
  defaultInteractionMatrix,
  defaultWeightMatrix,
  computeEBHScore,
  classifyZone,
  findOptimalIntervention,
  potentialEnergy,
  positiveAttractor,
  computeESScore,
  distanceToAttractor,
  vecNorm,
  vecSub,
  stateToVec,
  zeros,
  estimateZoneRiskProbability,
} from '../../src/services/pge/mathEngine';
import { PSY_DIMENSION, PSY_VARIABLES } from '../../src/models/PsychologicalState';

// ════════════════════════════════════════════════════════════════
// BUG 11: simulateTrajectory dynamics correction
// ════════════════════════════════════════════════════════════════

describe('BUG 11: simulateTrajectory uses correct (A-I)·S dynamics', () => {
  const A = defaultInteractionMatrix();

  test('trajectory should NOT diverge — all values stay bounded < 1 interior', () => {
    // Start with moderate negative state
    const S0 = zeros(PSY_DIMENSION);
    S0[0] = 0.5; // stress
    S0[1] = 0.4; // anxiety
    S0[2] = 0.3; // sadness
    S0[8] = 0.3; // hope

    const trajectory = simulateTrajectory(S0, A, 20, 0.1);

    // With correct dynamics (A-I), diagonal = -0.15 → convergent
    // Variables should NOT all saturate at 0 or 1
    const lastState = trajectory[trajectory.length - 1];
    const allAtBounds = lastState.every(v => v <= 0.01 || v >= 0.99);
    expect(allAtBounds).toBe(false);
  });

  test('trajectory should converge toward equilibrium, not explode', () => {
    const S0 = zeros(PSY_DIMENSION);
    S0[0] = 0.6; // stress
    S0[8] = 0.4; // hope

    const trajectory = simulateTrajectory(S0, A, 50, 0.1);

    // Total movement should decrease over time (convergence)
    const earlyDelta = vecNorm(vecSub(trajectory[5], trajectory[0]));
    const lateDelta = vecNorm(vecSub(trajectory[50], trajectory[45]));
    expect(lateDelta).toBeLessThan(earlyDelta);
  });

  test('zero state should remain near zero (true equilibrium)', () => {
    const S0 = zeros(PSY_DIMENSION);
    const trajectory = simulateTrajectory(S0, A, 10, 0.1);
    const lastState = trajectory[trajectory.length - 1];

    // (A-I)·0 = 0 → no change
    expect(vecNorm(lastState)).toBeCloseTo(0, 5);
  });

  test('with dt=1, one step should approximate A·S directly', () => {
    // S(t+1) = S(t) + 1·(A-I)·S(t) = A·S(t)
    const S0 = zeros(PSY_DIMENSION);
    S0[0] = 0.5; // stress
    const trajectory = simulateTrajectory(S0, A, 1, 1.0);

    // Expected: A·S0 — stress column of A applied to stress=0.5
    // A[0][0] = 0.85 → stress → 0.85 * 0.5 = 0.425
    // Other variables get spillover from stress
    const result = trajectory[1];
    expect(result[0]).toBeCloseTo(0.425, 2); // stress decayed by 85%
    expect(result[1]).toBeGreaterThan(0);     // anxiety increased (stress→anxiety = 0.6)
  });

  test('positive attractor should be approximately stable under A', () => {
    const PA = positiveAttractor();
    const trajectory = simulateTrajectory(PA, A, 30, 0.1);
    const lastState = trajectory[trajectory.length - 1];

    // PA should not diverge dramatically
    const drift = vecNorm(vecSub(lastState, PA));
    // Allow some drift since PA is not an exact fixed point of default A
    expect(drift).toBeLessThan(2.0); // should not explode
  });

  test('intervention should have visible positive effect on trajectory', () => {
    const S0 = zeros(PSY_DIMENSION);
    S0[0] = 0.7; // high stress
    S0[1] = 0.6; // high anxiety
    S0[8] = 0.2; // low hope

    // Without intervention
    const trajNone = simulateTrajectory(S0, A, 10, 0.1);

    // With emotional regulation intervention
    const B = Array.from({ length: PSY_DIMENSION }, () => new Array(4).fill(0));
    // Simple: intervention reduces stress
    B[0][3] = -0.4;  // emotional_regulation reduces stress
    B[1][3] = -0.4;  // reduces anxiety
    B[9][3] = 0.4;   // increases calmness
    const I = [0, 0, 0, 1.0]; // emotional_regulation at full intensity

    const trajIntervention = simulateTrajectory(S0, A, 10, 0.1, I, B);

    const stressWithout = trajNone[trajNone.length - 1][0];
    const stressWith = trajIntervention[trajIntervention.length - 1][0];
    expect(stressWith).toBeLessThan(stressWithout);
  });
});

// ════════════════════════════════════════════════════════════════
// BUG 12: Zone threshold consistency
// ════════════════════════════════════════════════════════════════

describe('BUG 12: Zone thresholds are consistent', () => {
  test('classifyZone boundaries should match risk probability thresholds', () => {
    // These boundary values should classify correctly
    expect(classifyZone(0.0)).toBe('safe');
    expect(classifyZone(0.19)).toBe('safe');
    expect(classifyZone(0.2)).toBe('caution');
    expect(classifyZone(0.39)).toBe('caution');
    expect(classifyZone(0.4)).toBe('risk');
    expect(classifyZone(0.59)).toBe('risk');
    expect(classifyZone(0.6)).toBe('critical');
    expect(classifyZone(0.79)).toBe('critical');
    expect(classifyZone(0.8)).toBe('black_hole');
    expect(classifyZone(1.0)).toBe('black_hole');
  });

  test('estimateZoneRiskProbability uses thresholds consistent with classifyZone', () => {
    // If a user is predicted at EBH=0.45, they should be in 'risk' zone.
    // The risk probability for the "risk threshold" should be >50%
    // since prediction (0.45) exceeds the threshold (0.4).
    const residuals = [0.01, -0.01, 0.02, -0.02]; // small noise
    const prob = estimateZoneRiskProbability(0.45, residuals, 1, 0.4);
    expect(prob).toBeGreaterThan(0.5);
  });

  test('prediction exactly at boundary should have ~50% probability', () => {
    const residuals = [0.05, -0.05, 0.03, -0.03, 0.04, -0.04];
    // Prediction at threshold → ~50% probability
    const prob = estimateZoneRiskProbability(0.4, residuals, 1, 0.4);
    expect(prob).toBeCloseTo(0.5, 1);
  });
});

// ════════════════════════════════════════════════════════════════
// BUG 13: findOptimalIntervention uses accurate EBH
// ════════════════════════════════════════════════════════════════

describe('BUG 13: findOptimalIntervention uses full EBH formula', () => {
  const A = defaultInteractionMatrix();

  test('with high loopStrength, currentEBH baseline should be higher', () => {
    const S = zeros(PSY_DIMENSION);
    S[0] = 0.7; S[1] = 0.6; S[2] = 0.5; S[7] = 0.5; S[8] = 0.15;

    // Verify computeEBHScore correctly uses loopStrength and inertia
    const W = defaultWeightMatrix();
    const U = potentialEnergy(S, W);

    const ebhNoLoop = computeEBHScore({
      loopStrength: 0, negativeInertia: 0,
      potentialEnergy: U, hopeLevel: S[8],
    });

    const ebhWithLoop = computeEBHScore({
      loopStrength: 2.5, negativeInertia: 0.6,
      potentialEnergy: U, hopeLevel: S[8],
    });

    // Loop + inertia should significantly raise EBH
    // α*min(1, 2.5/3) + β*0.6 ≈ 0.25*0.833 + 0.30*0.6 ≈ 0.208+0.180 = 0.388
    expect(ebhWithLoop).toBeGreaterThan(ebhNoLoop + 0.3);

    // Verify findOptimalIntervention passes these through by checking predictedEBH
    const candidates = findOptimalIntervention(S, A, undefined, 5, 0.1, [0.7], 2.5, 0.6);
    // All predicted EBH should reflect the loopStrength component
    for (const c of candidates.slice(0, 3)) {
      expect(c.predictedEBH).toBeGreaterThan(ebhNoLoop * 0.5);
    }
  });

  test('predicted EBH should include loopStrength component', () => {
    const S = zeros(PSY_DIMENSION);
    S[0] = 0.6; S[8] = 0.2;

    const candidates = findOptimalIntervention(S, A, undefined, 5, 0.1, [0.7], 2.0, 0.5);

    // The predicted EBH should be higher than if loopStrength=0
    // because α=0.25 * min(1, 2.0/3) ≈ 0.167 is added
    for (const c of candidates.slice(0, 3)) {
      const baseEBH = computeEBHScore({
        loopStrength: 0,
        negativeInertia: 0,
        potentialEnergy: potentialEnergy(c.predictedState),
        hopeLevel: c.predictedState[8],
      });
      expect(c.predictedEBH).toBeGreaterThanOrEqual(baseEBH);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// COMPREHENSIVE EBH SCORING EDGE CASES
// ════════════════════════════════════════════════════════════════

describe('EBH scoring formula edge cases', () => {
  test('all-zero inputs → EBH = 0', () => {
    const ebh = computeEBHScore({
      loopStrength: 0,
      negativeInertia: 0,
      potentialEnergy: 0,
      hopeLevel: 0,
    });
    expect(ebh).toBe(0);
  });

  test('maximum pathological state → EBH close to 1', () => {
    const ebh = computeEBHScore({
      loopStrength: 5,    // very high loops
      negativeInertia: 1, // maximally stuck
      potentialEnergy: 4, // very high energy
      hopeLevel: 0,       // no hope
    });
    expect(ebh).toBeGreaterThan(0.8);
    expect(ebh).toBeLessThanOrEqual(1);
  });

  test('high hope reduces EBH score', () => {
    const base = computeEBHScore({
      loopStrength: 1, negativeInertia: 0.5,
      potentialEnergy: 1, hopeLevel: 0,
    });
    const withHope = computeEBHScore({
      loopStrength: 1, negativeInertia: 0.5,
      potentialEnergy: 1, hopeLevel: 1,
    });
    expect(withHope).toBeLessThan(base);
  });

  test('negative potential energy (healthy) clamps to 0 contribution', () => {
    const ebh = computeEBHScore({
      loopStrength: 0,
      negativeInertia: 0,
      potentialEnergy: -2, // negative = healthy
      hopeLevel: 0.5,
    });
    // Only hope contributes (negatively): raw = -0.15 * 0.5 = -0.075 → clamp to 0
    expect(ebh).toBe(0);
  });

  test('EBH is always in [0, 1]', () => {
    const extremes = [
      { loopStrength: 100, negativeInertia: 5, potentialEnergy: 100, hopeLevel: 0 },
      { loopStrength: -10, negativeInertia: -5, potentialEnergy: -100, hopeLevel: 10 },
      { loopStrength: 0, negativeInertia: 0, potentialEnergy: 0, hopeLevel: 0 },
    ];
    for (const params of extremes) {
      const ebh = computeEBHScore(params);
      expect(ebh).toBeGreaterThanOrEqual(0);
      expect(ebh).toBeLessThanOrEqual(1);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// TRAJECTORY CONVERGENCE PROPERTY TESTS
// ════════════════════════════════════════════════════════════════

describe('Trajectory mathematical properties', () => {
  const A = defaultInteractionMatrix();

  test('long trajectory should converge (distance between consecutive steps → 0)', () => {
    const S0 = zeros(PSY_DIMENSION);
    S0[0] = 0.5; S0[1] = 0.4; S0[2] = 0.3;
    S0[8] = 0.3; S0[9] = 0.3;

    const trajectory = simulateTrajectory(S0, A, 100, 0.1);

    // Check convergence: distance between last steps should be very small
    const lastDelta = vecNorm(vecSub(trajectory[100], trajectory[99]));
    const earlyDelta = vecNorm(vecSub(trajectory[10], trajectory[9]));
    expect(lastDelta).toBeLessThan(earlyDelta);
    expect(lastDelta).toBeLessThan(0.01); // effectively converged
  });

  test('EBH along trajectory should be monotonic or oscillating (not exploding)', () => {
    const S0 = zeros(PSY_DIMENSION);
    S0[0] = 0.7; S0[1] = 0.6; S0[7] = 0.5; S0[8] = 0.15;
    S0[14] = 0.5; // rumination

    const W = defaultWeightMatrix();
    const trajectory = simulateTrajectory(S0, A, 20, 0.1);

    const ebhScores = trajectory.map(tv => computeEBHScore({
      loopStrength: 0,
      negativeInertia: 0,
      potentialEnergy: potentialEnergy(tv, W),
      hopeLevel: tv[8],
    }));

    // EBH should not jump wildly — max step-to-step change should be reasonable
    for (let i = 1; i < ebhScores.length; i++) {
      const delta = Math.abs(ebhScores[i] - ebhScores[i - 1]);
      expect(delta).toBeLessThan(0.2); // no >0.2 jumps per step
    }
  });
});
