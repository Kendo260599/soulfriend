/**
 * Tests for Bayesian Prior Matrix Learning
 * 
 * Validates that learnInteractionMatrix with Bayesian prior:
 * 1. With sparse data → stays close to prior (population/default)
 * 2. With abundant data → converges toward data-driven matrix
 * 3. Without prior → behaves like classic ridge (backward compatible)
 * 4. Mathematical correctness of MAP estimation
 */
import {
  learnInteractionMatrix,
  defaultInteractionMatrix,
  zeroMat,
  Vec,
  Mat,
} from '../../src/services/pge/mathEngine';
import { PSY_VARIABLES } from '../../src/models/PsychologicalState';

const N = PSY_VARIABLES.length; // 24

// Helper: generate synthetic state history from known dynamics
function generateStates(A: Mat, S0: Vec, steps: number, noise = 0.01): Vec[] {
  const states: Vec[] = [S0];
  let S = [...S0];
  for (let t = 0; t < steps; t++) {
    const next: number[] = new Array(N).fill(0);
    for (let i = 0; i < N; i++) {
      let sum = 0;
      for (let j = 0; j < N; j++) sum += A[i][j] * S[j];
      // Add small noise + clamp [0, 1]
      next[i] = Math.max(0, Math.min(1, sum + (Math.random() - 0.5) * noise));
    }
    states.push(next);
    S = next;
  }
  return states;
}

// Helper: compute Frobenius distance between matrices
function matDist(A: Mat, B: Mat): number {
  let sum = 0;
  for (let i = 0; i < A.length; i++) {
    for (let j = 0; j < A[i].length; j++) {
      const d = A[i][j] - B[i][j];
      sum += d * d;
    }
  }
  return Math.sqrt(sum);
}

// Helper: random initial state
function randomState(): Vec {
  return Array.from({ length: N }, () => 0.2 + Math.random() * 0.6);
}

describe('Bayesian Prior Matrix Learning', () => {

  const prior = defaultInteractionMatrix();

  // Create a "true" matrix that differs from prior
  const trueMatrix: Mat = (() => {
    const A = defaultInteractionMatrix();
    // Modify some interactions to create a different "true" dynamics
    const si = PSY_VARIABLES.indexOf('stress');
    const ai = PSY_VARIABLES.indexOf('anxiety');
    const hi = PSY_VARIABLES.indexOf('hope');
    const mi = PSY_VARIABLES.indexOf('motivation');
    A[ai][si] = 0.9;  // stronger stress→anxiety
    A[mi][hi] = 0.8;  // stronger hope→motivation
    A[si][ai] = 0.7;  // stronger anxiety→stress feedback
    return A;
  })();

  describe('Backward Compatibility (no prior)', () => {

    test('without prior → classic ridge regression (shrink toward zero)', () => {
      const S0 = randomState();
      const states = generateStates(trueMatrix, S0, 30, 0.005);
      
      const withoutPrior = learnInteractionMatrix(states, 0.05);
      const withNullPrior = learnInteractionMatrix(states, 0.05, null);
      
      // Both should produce identical results
      const dist = matDist(withoutPrior.matrix, withNullPrior.matrix);
      expect(dist).toBeLessThan(1e-10);
    });

    test('with < 3 states and no prior → returns default matrix', () => {
      const { matrix } = learnInteractionMatrix([randomState(), randomState()], 0.05);
      const dist = matDist(matrix, defaultInteractionMatrix());
      expect(dist).toBeLessThan(1e-10);
    });

    test('with < 3 states and prior → returns prior (not default)', () => {
      const customPrior = zeroMat(N);
      customPrior[0][0] = 0.99;
      const { matrix } = learnInteractionMatrix([randomState(), randomState()], 0.05, customPrior);
      expect(matrix[0][0]).toBeCloseTo(0.99);
    });
  });

  describe('Bayesian Shrinkage Behavior', () => {

    test('sparse data (5 states) → matrix close to prior', () => {
      const S0 = randomState();
      const states = generateStates(trueMatrix, S0, 4, 0.01); // 5 states total

      const resultWithPrior = learnInteractionMatrix(states, 0.05, prior);
      const resultNoPrior = learnInteractionMatrix(states, 0.05);

      const distToPrior_withPrior = matDist(resultWithPrior.matrix, prior);
      const distToPrior_noPrior = matDist(resultNoPrior.matrix, prior);

      // With Bayesian prior, result should be CLOSER to prior than without
      expect(distToPrior_withPrior).toBeLessThan(distToPrior_noPrior);
    });

    test('abundant data → matrix departs further from prior than sparse data', () => {
      const S0 = randomState();
      const sparse = generateStates(trueMatrix, S0, 10, 0.005);
      const abundant = generateStates(trueMatrix, S0, 200, 0.005);

      const resultSparse = learnInteractionMatrix(sparse, 0.05, prior);
      const resultAbundant = learnInteractionMatrix(abundant, 0.05, prior);

      const distSparse = matDist(resultSparse.matrix, prior);
      const distAbundant = matDist(resultAbundant.matrix, prior);

      // More data → departs further from prior (data-driven)
      expect(distAbundant).toBeGreaterThan(distSparse);
    });

    test('interpolation: more data → less prior influence', () => {
      const S0 = randomState();
      const states5 = generateStates(trueMatrix, S0, 4, 0.005);
      const states20 = generateStates(trueMatrix, S0, 19, 0.005);
      const states80 = generateStates(trueMatrix, S0, 79, 0.005);

      const result5 = learnInteractionMatrix(states5, 0.05, prior);
      const result20 = learnInteractionMatrix(states20, 0.05, prior);
      const result80 = learnInteractionMatrix(states80, 0.05, prior);

      const distToPrior5 = matDist(result5.matrix, prior);
      const distToPrior20 = matDist(result20.matrix, prior);
      const distToPrior80 = matDist(result80.matrix, prior);

      // More data → farther from prior (data dominates over prior)
      expect(distToPrior5).toBeLessThan(distToPrior20);
      expect(distToPrior20).toBeLessThan(distToPrior80);
    });
  });

  describe('Mathematical Correctness', () => {

    test('with identity prior and λ→∞ → matrix approaches identity', () => {
      const identityPrior = zeroMat(N);
      for (let i = 0; i < N; i++) identityPrior[i][i] = 1;

      const S0 = randomState();
      const states = generateStates(trueMatrix, S0, 10, 0.01);

      // Very large lambda → prior dominates
      const result = learnInteractionMatrix(states, 1000, identityPrior);
      
      const distToIdentity = matDist(result.matrix, identityPrior);
      // Should be very close to identity with λ=1000
      expect(distToIdentity).toBeLessThan(0.5);
    });

    test('with small λ and prior → prior influence is proportional to λ', () => {
      const S0 = randomState();
      const states = generateStates(trueMatrix, S0, 50, 0.005);

      // Small λ → less prior influence; large λ → more prior influence
      const smallLambda = learnInteractionMatrix(states, 0.01, prior);
      const largeLambda = learnInteractionMatrix(states, 1.0, prior);

      const distToPrior_small = matDist(smallLambda.matrix, prior);
      const distToPrior_large = matDist(largeLambda.matrix, prior);

      // Larger λ → closer to prior
      expect(distToPrior_large).toBeLessThan(distToPrior_small);
    });

    test('prior = zero matrix → equivalent to classic ridge', () => {
      const zeroPrior = zeroMat(N);
      
      const S0 = randomState();
      const states = generateStates(trueMatrix, S0, 20, 0.01);

      const withZeroPrior = learnInteractionMatrix(states, 0.05, zeroPrior);
      const classicRidge = learnInteractionMatrix(states, 0.05);

      const dist = matDist(withZeroPrior.matrix, classicRidge.matrix);
      // Zero prior is mathematically identical to classic ridge
      expect(dist).toBeLessThan(1e-10);
    });

    test('loss is computed from data fit only (not regularization)', () => {
      const S0 = randomState();
      const states = generateStates(trueMatrix, S0, 20, 0.01);

      const result1 = learnInteractionMatrix(states, 0.05, prior);
      const result2 = learnInteractionMatrix(states, 0.5, prior);

      // Higher λ → worse data fit (more regularization pulls away from data)
      expect(result2.loss).toBeGreaterThanOrEqual(result1.loss - 0.01);
    });
  });

  describe('Clinical Relevance', () => {

    test('new user (few messages) → preserves population psychological pathways', () => {
      const S0 = randomState();
      const states = generateStates(trueMatrix, S0, 5, 0.02); // only 6 states

      const result = learnInteractionMatrix(states, 0.05, prior);

      // Key pathways from prior (default) should still be present:
      const si = PSY_VARIABLES.indexOf('stress');
      const ai = PSY_VARIABLES.indexOf('anxiety');
      const ri = PSY_VARIABLES.indexOf('rumination');

      // stress → anxiety should still be positive (clinical knowledge preserved)
      expect(result.matrix[ai][si]).toBeGreaterThan(0.1);
      // anxiety → rumination should still be positive
      expect(result.matrix[ri][ai]).toBeGreaterThan(0.1);
    });

    test('experienced user (many messages) → learned matrix diverges from prior', () => {
      const S0 = randomState();
      const fewStates = generateStates(trueMatrix, S0, 6, 0.005);
      const manyStates = generateStates(trueMatrix, S0, 100, 0.005);

      const resultFew = learnInteractionMatrix(fewStates, 0.05, prior);
      const resultMany = learnInteractionMatrix(manyStates, 0.05, prior);

      const distFew = matDist(resultFew.matrix, prior);
      const distMany = matDist(resultMany.matrix, prior);

      // Experienced user (more data) → matrix moves further from prior
      // reflecting individual dynamics adaptation
      expect(distMany).toBeGreaterThan(distFew);
    });

    test('diagonal (emotional inertia) preserved in sparse data', () => {
      const S0 = randomState();
      const states = generateStates(trueMatrix, S0, 5, 0.02);

      const result = learnInteractionMatrix(states, 0.05, prior);

      // Diagonal should be near 0.85 (prior default inertia) with sparse data
      let diagSum = 0;
      for (let i = 0; i < N; i++) diagSum += result.matrix[i][i];
      const avgDiag = diagSum / N;
      
      // Should be reasonably close to 0.85 (prior diagonal)
      expect(avgDiag).toBeGreaterThan(0.5);
      expect(avgDiag).toBeLessThan(1.2);
    });
  });
});
