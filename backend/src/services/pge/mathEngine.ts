/**
 * PGE MATH ENGINE
 * 
 * Psychological Gravity Engine — Linear Algebra & Dynamical Systems Core
 * 
 * Thực hiện các phép toán cốt lõi:
 * - Vector operations: dot, add, scale, norm
 * - Matrix operations: multiply, transpose
 * - Potential energy: U(S) = ½ SᵀWS
 * - Force: F = −∇U(S) = −WS
 * - Eigenvalue approximation (power iteration)
 * - Feedback loop detection (DFS on adjacency matrix)
 * 
 * Toàn bộ triển khai pure TypeScript — không phụ thuộc thư viện bên ngoài.
 * 
 * @module services/pge/mathEngine
 * @version 11.0.0 — Phase 13: Real-Time Expert Monitoring + Phase 3-12
 */

import { PSY_VARIABLES, PSY_DIMENSION, IStateVector, PSY_GROUPS } from '../../models/PsychologicalState';
import { IFeedbackLoop } from '../../models/InteractionMatrix';

// ════════════════════════════════════════════════════════════════
// TYPE ALIASES
// ════════════════════════════════════════════════════════════════
export type Vec = number[];     // Vector ℝⁿ
export type Mat = number[][];   // Matrix ℝⁿˣⁿ

// ════════════════════════════════════════════════════════════════
// VECTOR OPERATIONS
// ════════════════════════════════════════════════════════════════

/** Convert IStateVector to number[] (ordered by PSY_VARIABLES) */
export function stateToVec(s: IStateVector): Vec {
  return PSY_VARIABLES.map(v => s[v] ?? 0);
}

/** Convert number[] back to IStateVector */
export function vecToState(v: Vec): IStateVector {
  const s: any = {};
  PSY_VARIABLES.forEach((name, i) => {
    s[name] = Math.max(0, Math.min(1, v[i] ?? 0));
  });
  return s as IStateVector;
}

/** Zero vector */
export function zeros(n: number = PSY_DIMENSION): Vec {
  return new Array(n).fill(0);
}

/** Dot product: a · b */
export function dot(a: Vec, b: Vec): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

/** Vector addition: a + b */
export function vecAdd(a: Vec, b: Vec): Vec {
  return a.map((v, i) => v + b[i]);
}

/** Vector subtraction: a - b */
export function vecSub(a: Vec, b: Vec): Vec {
  return a.map((v, i) => v - b[i]);
}

/** Scalar multiplication: c * a */
export function vecScale(a: Vec, c: number): Vec {
  return a.map(v => v * c);
}

/** L2 norm: ||a|| */
export function vecNorm(a: Vec): number {
  return Math.sqrt(dot(a, a));
}

/** Clamp each element to [0, 1] */
export function vecClamp(a: Vec, min = 0, max = 1): Vec {
  return a.map(v => Math.max(min, Math.min(max, v)));
}

/** Mean of negative emotion group (indices 0-7) */
export function negativeMean(v: Vec): number {
  const neg = v.slice(0, 8);
  return neg.reduce((s, x) => s + x, 0) / neg.length;
}

/** Mean of positive emotion group (indices 8-11) */
export function positiveMean(v: Vec): number {
  const pos = v.slice(8, 12);
  return pos.reduce((s, x) => s + x, 0) / pos.length;
}

// ════════════════════════════════════════════════════════════════
// MATRIX OPERATIONS
// ════════════════════════════════════════════════════════════════

/** Identity matrix n×n */
export function eye(n: number = PSY_DIMENSION): Mat {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );
}

/** Zero matrix n×n */
export function zeroMat(n: number = PSY_DIMENSION): Mat {
  return Array.from({ length: n }, () => new Array(n).fill(0));
}

/** Matrix-vector multiply: A·v */
export function matVec(A: Mat, v: Vec): Vec {
  return A.map(row => dot(row, v));
}

/** Matrix transpose */
export function transpose(A: Mat): Mat {
  const n = A.length;
  const m = A[0].length;
  return Array.from({ length: m }, (_, j) =>
    Array.from({ length: n }, (_, i) => A[i][j])
  );
}

/** Matrix multiply: A·B */
export function matMul(A: Mat, B: Mat): Mat {
  const Bt = transpose(B);
  return A.map(row => Bt.map(col => dot(row, col)));
}

/** Frobenius norm: ||A||_F */
export function matNorm(A: Mat): number {
  let sum = 0;
  for (const row of A) for (const v of row) sum += v * v;
  return Math.sqrt(sum);
}

// ════════════════════════════════════════════════════════════════
// POTENTIAL ENERGY & FORCE
// ════════════════════════════════════════════════════════════════

/**
 * Default weight matrix W.
 * Trọng số negative emotions > positive emotions.
 * W là ma trận đường chéo: W_ii = weight of variable i.
 */
export function defaultWeightMatrix(): Mat {
  const W = zeroMat();
  const weights: Record<string, number> = {
    // Negative emotions — trọng số cao (đóng góp nhiều vào năng lượng bất ổn)
    stress: 1.2, anxiety: 1.3, sadness: 1.1, anger: 1.0,
    loneliness: 1.1, shame: 0.9, guilt: 0.8, hopelessness: 1.5,
    // Positive emotions — trọng số âm (giảm năng lượng bất ổn)
    hope: -1.4, calmness: -1.0, joy: -0.9, gratitude: -0.8,
    // Cognition
    selfWorth: -1.2, selfEfficacy: -1.0, rumination: 1.4, cognitiveClarity: -0.7,
    // Behavioral
    avoidance: 0.8, helpSeeking: -0.6, socialEngagement: -0.7, motivation: -0.8,
    // Social
    trustInOthers: -0.6, perceivedSupport: -0.9, fearOfJudgment: 0.7,
    // Energy
    mentalFatigue: 1.0,
  };

  PSY_VARIABLES.forEach((v, i) => {
    W[i][i] = weights[v] ?? 0;
  });
  return W;
}

/**
 * Potential energy: U(S) = ½ SᵀWS
 * Giá trị cao → tâm lý bất ổn
 */
export function potentialEnergy(S: Vec, W?: Mat): number {
  const w = W ?? defaultWeightMatrix();
  const ws = matVec(w, S);
  return 0.5 * dot(S, ws);
}

/**
 * Psychological force: F = −∇U(S) = −WS
 * Hệ thống "trôi" theo hướng giảm năng lượng
 */
export function psychologicalForce(S: Vec, W?: Mat): Vec {
  const w = W ?? defaultWeightMatrix();
  return vecScale(matVec(w, S), -1);
}

// ════════════════════════════════════════════════════════════════
// EMOTIONAL INERTIA
// ════════════════════════════════════════════════════════════════

/**
 * Tính autocorrelation (quán tính) cho 1 biến qua chuỗi thời gian.
 * I_i = corr(s_i(t), s_i(t-1))
 */
export function autocorrelation(series: number[]): number {
  if (series.length < 3) return 0;
  const n = series.length - 1;
  const x = series.slice(0, n);
  const y = series.slice(1, n + 1);
  const mx = x.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a = x[i] - mx;
    const b = y[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const denom = Math.sqrt(dx * dy);
  return denom > 1e-9 ? num / denom : 0;
}

/**
 * Emotional inertia tổng hợp cho nhóm negative.
 * I_neg = mean(I_stress, I_anxiety, I_sadness, ...)
 */
export function negativeInertia(stateHistory: Vec[]): number {
  if (stateHistory.length < 3) return 0;
  
  const negIndices = [0, 1, 2, 3, 4, 5, 6, 7]; // stress..hopelessness
  const inertias = negIndices.map(idx => {
    const series = stateHistory.map(s => s[idx]);
    return autocorrelation(series);
  });
  
  return inertias.reduce((s, v) => s + v, 0) / inertias.length;
}

// ════════════════════════════════════════════════════════════════
// EIGENVALUE (Power Iteration Approximation)
// ════════════════════════════════════════════════════════════════

/**
 * Power iteration để tìm dominant eigenvalue (spectral radius).
 * Nếu |λ_max| > 1 → hệ bất ổn, phát tán.
 */
export function spectralRadius(A: Mat, iterations = 50): number {
  const n = A.length;
  // Deterministic initial vector (seeded by dimension to avoid random fluctuation)
  let v = Array.from({ length: n }, (_, i) => Math.sin(i + 1) * 0.5 + 0.5);
  let vNorm = vecNorm(v);
  v = vecScale(v, 1 / vNorm);

  let eigenvalue = 0;
  for (let iter = 0; iter < iterations; iter++) {
    const Av = matVec(A, v);
    eigenvalue = dot(v, Av);
    vNorm = vecNorm(Av);
    if (vNorm < 1e-12) break;
    v = vecScale(Av, 1 / vNorm);
  }

  return Math.abs(eigenvalue);
}

// ════════════════════════════════════════════════════════════════
// FEEDBACK LOOP DETECTION (DFS on Weighted Directed Graph)
// ════════════════════════════════════════════════════════════════

/**
 * Tìm strongly connected cycles (feedback loops) trong ma trận A.
 * threshold: chỉ xét edges có |weight| > threshold.
 */
export function detectFeedbackLoops(
  A: Mat,
  threshold = 0.15,
  maxLoopLength = 5
): IFeedbackLoop[] {
  const n = A.length;
  const loops: IFeedbackLoop[] = [];

  // Build adjacency list (only significant edges)
  const adj: Map<number, Array<{ to: number; weight: number }>> = new Map();
  for (let i = 0; i < n; i++) {
    const edges: Array<{ to: number; weight: number }> = [];
    for (let j = 0; j < n; j++) {
      if (i !== j && Math.abs(A[i][j]) > threshold) {
        edges.push({ to: j, weight: A[i][j] });
      }
    }
    adj.set(i, edges);
  }

  // DFS from each node to find cycles
  const visited = new Set<string>(); // canonical cycle representations

  function dfs(start: number, current: number, path: number[], weights: number[], depth: number) {
    if (depth > maxLoopLength) return;

    const edges = adj.get(current) || [];
    for (const edge of edges) {
      if (edge.to === start && path.length >= 2) {
        // Found cycle
        const cyclePath = [...path, start];
        const canonical = canonicalizeCycle(cyclePath);
        if (!visited.has(canonical)) {
          visited.add(canonical);
          const allWeights = [...weights, edge.weight];
          const totalWeight = allWeights.reduce((s, w) => s + w, 0);
          const avgWeight = totalWeight / allWeights.length;
          loops.push({
            path: cyclePath.map(i => PSY_VARIABLES[i]),
            totalWeight,
            avgWeight,
            type: totalWeight > 0 ? 'positive' : 'negative',
            length: cyclePath.length - 1,
          });
        }
      } else if (!path.includes(edge.to)) {
        dfs(start, edge.to, [...path, edge.to], [...weights, edge.weight], depth + 1);
      }
    }
  }

  for (let i = 0; i < n; i++) {
    dfs(i, i, [i], [], 1);
  }

  // Sort by total weight descending (strongest loops first)
  return loops.sort((a, b) => Math.abs(b.totalWeight) - Math.abs(a.totalWeight)).slice(0, 20);
}

/** Canonical representation of a cycle (rotation-invariant) */
function canonicalizeCycle(cycle: number[]): string {
  const core = cycle.slice(0, -1); // remove last (=first)
  const rotations: string[] = [];
  for (let i = 0; i < core.length; i++) {
    rotations.push([...core.slice(i), ...core.slice(0, i)].join(','));
  }
  return rotations.sort()[0];
}

// ════════════════════════════════════════════════════════════════
// INTERACTION MATRIX LEARNING (Ridge Regression)
// ════════════════════════════════════════════════════════════════

/**
 * Học ma trận A từ chuỗi trạng thái bằng Ridge Regression.
 * 
 * Min ||S(t+1) − A·S(t)||² + λ||A||²_F
 * 
 * Giải: A = (ΣS(t)S(t)ᵀ + λI)⁻¹ · ΣS(t+1)S(t)ᵀ
 * 
 * Vì đảo ma trận 24×24 phức tạp, ta dùng per-row regression:
 * A[i,:] = (XᵀX + λI)⁻¹ · Xᵀy[i]
 */
export function learnInteractionMatrix(
  stateHistory: Vec[],
  lambda = 0.01
): { matrix: Mat; loss: number } {
  if (stateHistory.length < 3) {
    return { matrix: defaultInteractionMatrix(), loss: 0 };
  }

  const n = PSY_DIMENSION;
  const T = stateHistory.length - 1;

  // X = [S(0), S(1), ..., S(T-1)]ᵀ — shape (T, n)
  // Y = [S(1), S(2), ..., S(T)]ᵀ — shape (T, n)
  const X = stateHistory.slice(0, T);
  const Y = stateHistory.slice(1, T + 1);

  // XᵀX (n×n)
  const XtX = zeroMat(n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let t = 0; t < T; t++) sum += X[t][i] * X[t][j];
      XtX[i][j] = sum;
    }
  }

  // Add regularization: XᵀX + λI
  for (let i = 0; i < n; i++) XtX[i][i] += lambda;

  // Invert (XᵀX + λI) — using Gauss-Jordan
  const inv = invertMatrix(XtX);
  if (!inv) {
    return { matrix: defaultInteractionMatrix(), loss: 0 };
  }

  // For each row i of A:
  // XᵀY[:,i] (n×1), then A[i,:] = inv · XᵀY[:,i]
  const A = zeroMat(n);
  for (let i = 0; i < n; i++) {
    // XᵀY[:,i]
    const xty = zeros(n);
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let t = 0; t < T; t++) sum += X[t][j] * Y[t][i];
      xty[j] = sum;
    }
    // A[i,:] = inv · xty
    A[i] = matVec(inv, xty);
  }

  // Compute loss
  let loss = 0;
  for (let t = 0; t < T; t++) {
    const predicted = matVec(A, X[t]);
    const diff = vecSub(Y[t], predicted);
    loss += dot(diff, diff);
  }
  loss /= T;

  return { matrix: A, loss };
}

/**
 * Gauss-Jordan matrix inversion for n×n matrix.
 * Returns null if singular.
 */
function invertMatrix(M: Mat): Mat | null {
  const n = M.length;
  // Augmented matrix [M | I]
  const aug: number[][] = M.map((row, i) => [
    ...row.map(v => v),
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ]);

  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxVal = Math.abs(aug[col][col]);
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > maxVal) {
        maxVal = Math.abs(aug[row][col]);
        maxRow = row;
      }
    }
    if (maxVal < 1e-12) return null; // singular

    // Swap
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    // Scale pivot row
    const pivot = aug[col][col];
    for (let j = 0; j < 2 * n; j++) aug[col][j] /= pivot;

    // Eliminate
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = aug[row][col];
      for (let j = 0; j < 2 * n; j++) aug[row][j] -= factor * aug[col][j];
    }
  }

  return aug.map(row => row.slice(n));
}

// ════════════════════════════════════════════════════════════════
// DEFAULT INTERACTION MATRIX (Prior knowledge from psychology)
// ════════════════════════════════════════════════════════════════

/**
 * Ma trận tương tác mặc định dựa trên kiến thức tâm lý học.
 * Sử dụng khi chưa có đủ dữ liệu để học.
 */
export function defaultInteractionMatrix(): Mat {
  const A = zeroMat();

  // Helper: set A[to][from] = weight
  function set(from: string, to: string, weight: number) {
    const fi = PSY_VARIABLES.indexOf(from as any);
    const ti = PSY_VARIABLES.indexOf(to as any);
    if (fi >= 0 && ti >= 0) A[ti][fi] = weight;
  }

  // ── Negative emotion cascades ──
  set('stress', 'anxiety', 0.6);
  set('stress', 'mentalFatigue', 0.5);
  set('stress', 'rumination', 0.4);
  set('stress', 'sadness', 0.3);
  
  set('anxiety', 'rumination', 0.55);
  set('anxiety', 'avoidance', 0.5);
  set('anxiety', 'fearOfJudgment', 0.45);
  set('anxiety', 'mentalFatigue', 0.3);
  
  set('sadness', 'hopelessness', 0.5);
  set('sadness', 'loneliness', 0.4);
  set('sadness', 'motivation', -0.4);
  
  set('loneliness', 'sadness', 0.45);
  set('loneliness', 'hopelessness', 0.35);
  set('loneliness', 'trustInOthers', -0.3);
  
  set('shame', 'selfWorth', -0.55);
  set('shame', 'avoidance', 0.5);
  set('shame', 'fearOfJudgment', 0.45);
  
  set('guilt', 'rumination', 0.4);
  set('guilt', 'selfWorth', -0.3);
  
  set('anger', 'stress', 0.35);
  set('anger', 'socialEngagement', -0.3);
  
  set('hopelessness', 'motivation', -0.6);
  set('hopelessness', 'helpSeeking', -0.5);
  set('hopelessness', 'selfEfficacy', -0.45);
  set('hopelessness', 'hope', -0.55);
  
  // ── Rumination feedback loops ──
  set('rumination', 'stress', 0.5);
  set('rumination', 'anxiety', 0.45);
  set('rumination', 'sadness', 0.4);
  set('rumination', 'cognitiveClarity', -0.5);
  set('rumination', 'mentalFatigue', 0.4);
  
  // ── Positive buffers ──
  set('hope', 'motivation', 0.5);
  set('hope', 'helpSeeking', 0.4);
  set('hope', 'selfEfficacy', 0.35);
  set('hope', 'hopelessness', -0.5);
  
  set('calmness', 'anxiety', -0.45);
  set('calmness', 'stress', -0.4);
  set('calmness', 'cognitiveClarity', 0.4);
  
  set('joy', 'hope', 0.35);
  set('joy', 'motivation', 0.3);
  set('joy', 'sadness', -0.3);
  
  set('gratitude', 'hope', 0.3);
  set('gratitude', 'trustInOthers', 0.25);
  set('gratitude', 'perceivedSupport', 0.3);
  
  // ── Cognition interactions ──
  set('selfWorth', 'stress', -0.4);
  set('selfWorth', 'hope', 0.35);
  set('selfWorth', 'motivation', 0.3);
  
  set('selfEfficacy', 'avoidance', -0.4);
  set('selfEfficacy', 'motivation', 0.4);
  set('selfEfficacy', 'helpSeeking', 0.3);
  
  set('cognitiveClarity', 'rumination', -0.4);
  set('cognitiveClarity', 'selfEfficacy', 0.3);
  
  // ── Social interactions ──
  set('perceivedSupport', 'loneliness', -0.5);
  set('perceivedSupport', 'hope', 0.35);
  set('perceivedSupport', 'helpSeeking', 0.3);
  
  set('trustInOthers', 'socialEngagement', 0.4);
  set('trustInOthers', 'helpSeeking', 0.35);
  
  set('fearOfJudgment', 'avoidance', 0.5);
  set('fearOfJudgment', 'socialEngagement', -0.4);
  set('fearOfJudgment', 'helpSeeking', -0.35);
  
  // ── Behavioral consequences ──
  set('avoidance', 'loneliness', 0.4);
  set('avoidance', 'selfEfficacy', -0.3);
  
  set('socialEngagement', 'loneliness', -0.45);
  set('socialEngagement', 'perceivedSupport', 0.35);
  
  set('mentalFatigue', 'cognitiveClarity', -0.4);
  set('mentalFatigue', 'motivation', -0.35);
  set('mentalFatigue', 'calmness', -0.25);

  // ── Self-maintenance (diagonal) ──
  // Mỗi biến có xu hướng duy trì giá trị hiện tại (emotional inertia)
  for (let i = 0; i < PSY_DIMENSION; i++) {
    A[i][i] = 0.85; // 85% persistence
  }

  return A;
}

// ════════════════════════════════════════════════════════════════
// TRAJECTORY SIMULATION
// ════════════════════════════════════════════════════════════════

/**
 * Mô phỏng quỹ đạo tâm lý: S(t+1) = S(t) + Δt·(A·S(t) + B·I(t))
 * 
 * @param S0 — trạng thái ban đầu
 * @param A — interaction matrix
 * @param steps — số bước mô phỏng
 * @param dt — time step (default 0.1 — nhỏ hơn cho accurate hơn)
 * @param I — external input vector (optional)
 * @param B — sensitivity matrix (optional, default identity)
 */
export function simulateTrajectory(
  S0: Vec,
  A: Mat,
  steps = 10,
  dt = 0.1,
  I?: Vec,
  B?: Mat,
): Vec[] {
  const trajectory: Vec[] = [S0];
  let S = [...S0];

  for (let t = 0; t < steps; t++) {
    // dS = (A − I)·S  (continuous-time rate derived from discrete transition A)
    // A is a discrete-time transition matrix (S_next = A·S), so the
    // continuous-time rate of change is (A − I)·S, NOT A·S.
    let dS = vecSub(matVec(A, S), S);

    // + B·I if external input provided
    if (I && B) {
      const bI = matVec(B, I);
      dS = vecAdd(dS, bI);
    } else if (I) {
      dS = vecAdd(dS, I);
    }

    // S(t+1) = S(t) + dt·dS
    S = vecClamp(vecAdd(S, vecScale(dS, dt)));
    trajectory.push([...S]);
  }

  return trajectory;
}

// ════════════════════════════════════════════════════════════════
// EBH SCORE COMPUTATION
// ════════════════════════════════════════════════════════════════

/**
 * Emotional Black Hole Score — kết hợp 4 chỉ số:
 * 
 * EBH = α·L + β·I + γ·U_norm − δ·H
 * 
 * L = loop strength (normalized)
 * I = negative emotional inertia
 * U_norm = normalized potential energy
 * H = hope component
 * 
 * Trả về giá trị trong [0, 1]
 */
export function computeEBHScore(params: {
  loopStrength: number;    // sum of positive feedback loop weights
  negativeInertia: number; // autocorrelation of negative emotions
  potentialEnergy: number; // U(S) 
  hopeLevel: number;       // current hope value [0,1]
}): number {
  const { loopStrength, negativeInertia: inertia, potentialEnergy: U, hopeLevel } = params;

  // Weights (tunable)
  const alpha = 0.25; // loop contribution
  const beta = 0.30;  // inertia contribution  
  const gamma = 0.30; // energy contribution
  const delta = 0.15; // hope reduction

  // Normalize components to [0,1]
  const L = Math.min(1, Math.max(0, loopStrength / 3)); // 3 = max expected loop weight
  const I = Math.max(0, Math.min(1, inertia)); // already in [-1,1], clamp to [0,1]
  const Unorm = Math.min(1, Math.max(0, U / 2)); // 2 = max expected energy
  const H = Math.max(0, Math.min(1, hopeLevel));

  const raw = alpha * L + beta * I + gamma * Unorm - delta * H;
  return Math.max(0, Math.min(1, raw));
}

/**
 * Classify zone from EBH score
 */
export function classifyZone(ebhScore: number): 'safe' | 'caution' | 'risk' | 'critical' | 'black_hole' {
  if (ebhScore >= 0.8) return 'black_hole';
  if (ebhScore >= 0.6) return 'critical';
  if (ebhScore >= 0.4) return 'risk';
  if (ebhScore >= 0.2) return 'caution';
  return 'safe';
}

/**
 * Detect attractor state from current state vector
 */
export function detectAttractor(S: Vec): string {
  const neg = negativeMean(S);
  const pos = positiveMean(S);
  const stress = S[0];
  const anxiety = S[1];
  const sadness = S[2];
  const hopelessness = S[7];
  const hope = S[8];
  const motivation = S[19];
  const mentalFatigue = S[23];
  const rumination = S[14];

  // Depression attractor: high sadness/hopelessness, low hope/motivation
  if (sadness > 0.6 && hopelessness > 0.5 && hope < 0.2 && motivation < 0.3) {
    return 'depression';
  }
  // Burnout attractor: high stress/fatigue, low motivation
  if (stress > 0.6 && mentalFatigue > 0.6 && motivation < 0.3) {
    return 'burnout';
  }
  // Anxiety spiral: high anxiety/rumination
  if (anxiety > 0.6 && rumination > 0.5 && S[16] > 0.4) { // avoidance
    return 'anxiety_spiral';
  }
  // Growth: high positive, low negative
  if (pos > 0.6 && neg < 0.2) {
    return 'growth';
  }
  // Recovery: moderate positive, declining negative
  if (pos > 0.4 && neg < 0.4) {
    return 'recovery';
  }
  // Stable: everything moderate
  return 'stable';
}

/**
 * Find dominant emotion from state vector
 */
export function findDominantEmotion(S: Vec): string {
  let maxVal = -1;
  let maxIdx = 0;
  for (let i = 0; i < S.length; i++) {
    if (S[i] > maxVal) {
      maxVal = S[i];
      maxIdx = i;
    }
  }
  return PSY_VARIABLES[maxIdx];
}

// ════════════════════════════════════════════════════════════════
// POSITIVE ATTRACTOR & ESCAPE FORCE (PGE Phase 2)
// ════════════════════════════════════════════════════════════════

/**
 * Positive Attractor S_PA — "Emotional Star" target state.
 * Trạng thái mục tiêu lý tưởng: negative thấp, positive cao,
 * cognitive/behavioral/social tích cực.
 * 
 * S_PA = [stress=0.05, anxiety=0.05, sadness=0.05, anger=0.02,
 *         loneliness=0.05, shame=0.02, guilt=0.02, hopelessness=0.01,
 *         hope=0.85, calmness=0.80, joy=0.75, gratitude=0.70,
 *         selfWorth=0.80, selfEfficacy=0.75, rumination=0.05, cognitiveClarity=0.80,
 *         avoidance=0.05, helpSeeking=0.65, socialEngagement=0.70, motivation=0.80,
 *         trustInOthers=0.65, perceivedSupport=0.70, fearOfJudgment=0.05,
 *         mentalFatigue=0.05]
 */
export function positiveAttractor(): Vec {
  return [
    // Negative emotions — rất thấp
    0.05, 0.05, 0.05, 0.02, 0.05, 0.02, 0.02, 0.01,
    // Positive emotions — cao
    0.85, 0.80, 0.75, 0.70,
    // Cognition — tích cực
    0.80, 0.75, 0.05, 0.80,
    // Behavioral — active
    0.05, 0.65, 0.70, 0.80,
    // Social — connected
    0.65, 0.70, 0.05,
    // Energy — refreshed
    0.05,
  ];
}

/**
 * Emotional Star Score — đo khoảng cách đến Positive Attractor.
 * 
 * ES = η·Hope + θ·SelfWorth + λ·Support − μ·Stress
 *    + ε·Motivation + ζ·Calmness − ι·Hopelessness
 * 
 * Trả về [0, 1], cao = gần Emotional Star hơn.
 */
export function computeESScore(S: Vec): number {
  // Coefficients
  const eta = 0.20;     // Hope weight
  const theta = 0.15;   // SelfWorth weight
  const lambda = 0.12;  // PerceivedSupport weight
  const mu = 0.12;      // Stress penalty
  const epsilon = 0.12; // Motivation weight
  const zeta = 0.10;    // Calmness weight
  const iota = 0.10;    // Hopelessness penalty
  const kappa = 0.09;   // Joy weight

  // Variable indices from PSY_VARIABLES
  const hope = S[8];
  const selfWorth = S[12];
  const perceivedSupport = S[21];
  const stress = S[0];
  const motivation = S[19];
  const calmness = S[9];
  const hopelessness = S[7];
  const joy = S[10];

  const raw = eta * hope + theta * selfWorth + lambda * perceivedSupport
            - mu * stress + epsilon * motivation + zeta * calmness
            - iota * hopelessness + kappa * joy;

  return Math.max(0, Math.min(1, raw));
}

/**
 * Khoảng cách đến Positive Attractor: ||S − S_PA||
 */
export function distanceToAttractor(S: Vec): number {
  const PA = positiveAttractor();
  return vecNorm(vecSub(S, PA));
}

/**
 * Internal Attractor Force — lực hút của EBH giữ user lại.
 * ||A·S|| — càng lớn thì user bị hút về attractor tiêu cực càng mạnh.
 */
export function internalAttractorForce(A: Mat, S: Vec): number {
  return vecNorm(matVec(A, S));
}

/**
 * Escape Force Required — lực cần thiết để thoát khỏi EBH.
 * ||B·I|| > ||A·S|| thì mới escape được.
 * Trả về: { required: ||A·S||, direction: −A·S (normalized) }
 */
export function escapeForceRequired(A: Mat, S: Vec): {
  required: number;
  direction: Vec;
} {
  const AS = matVec(A, S);
  const norm = vecNorm(AS);
  // Direction to escape = opposite of gravitational pull
  const direction = norm > 1e-12
    ? vecScale(AS, -1 / norm)
    : zeros();

  return { required: norm, direction };
}

/**
 * Compute escape force achieved by intervention: ||B·I||
 */
export function escapeForceAchieved(B: Mat, I: Vec): number {
  return vecNorm(matVec(B, I));
}

// ════════════════════════════════════════════════════════════════
// INTERVENTION MATRIX B (24×4)
// ════════════════════════════════════════════════════════════════

/**
 * Default Intervention Matrix B[24×4].
 * Maps 4 intervention types → changes in 24 psychological variables.
 * 
 * Columns: [cognitive_reframing, social_connection, behavioral_activation, emotional_regulation]
 * Rows: 24 PSY_VARIABLES
 * 
 * B[i][j] = expected change in variable i per unit of intervention j
 * Positive = increases the variable, Negative = decreases it.
 * 
 * Ý nghĩa: Khi áp dụng cognitive_reframing (cột 0) với cường độ I[0]:
 *   - rumination giảm (B[14][0] = -0.4)
 *   - cognitiveClarity tăng (B[15][0] = +0.35)
 *   - selfWorth tăng (B[12][0] = +0.3)
 *   - hopelessness giảm (B[7][0] = -0.35)
 *   etc.
 */
export function defaultInterventionMatrix(): Mat {
  // 24 rows × 4 columns
  const B: Mat = Array.from({ length: PSY_DIMENSION }, () => new Array(4).fill(0));

  // Helper: set B[varIdx][interventionIdx] = weight
  function set(variable: string, intervention: number, weight: number) {
    const idx = PSY_VARIABLES.indexOf(variable as any);
    if (idx >= 0) B[idx][intervention] = weight;
  }

  // ── Column 0: Cognitive Reframing ──
  // Targets: rumination↓, cognitiveClarity↑, selfWorth↑, hopelessness↓, selfEfficacy↑
  set('rumination', 0, -0.40);
  set('cognitiveClarity', 0, 0.35);
  set('selfWorth', 0, 0.30);
  set('hopelessness', 0, -0.35);
  set('selfEfficacy', 0, 0.25);
  set('hope', 0, 0.30);
  set('guilt', 0, -0.20);
  set('shame', 0, -0.25);
  set('stress', 0, -0.15);
  set('anxiety', 0, -0.15);
  set('sadness', 0, -0.10);

  // ── Column 1: Social Connection ──
  // Targets: loneliness↓, perceivedSupport↑, socialEngagement↑, trustInOthers↑
  set('loneliness', 1, -0.45);
  set('perceivedSupport', 1, 0.40);
  set('socialEngagement', 1, 0.40);
  set('trustInOthers', 1, 0.30);
  set('helpSeeking', 1, 0.25);
  set('hope', 1, 0.20);
  set('joy', 1, 0.25);
  set('gratitude', 1, 0.20);
  set('fearOfJudgment', 1, -0.20);
  set('avoidance', 1, -0.25);
  set('sadness', 1, -0.15);

  // ── Column 2: Behavioral Activation ──
  // Targets: motivation↑, avoidance↓, mentalFatigue↓, selfEfficacy↑
  set('motivation', 2, 0.40);
  set('avoidance', 2, -0.40);
  set('mentalFatigue', 2, -0.25);
  set('selfEfficacy', 2, 0.30);
  set('joy', 2, 0.25);
  set('hope', 2, 0.20);
  set('sadness', 2, -0.20);
  set('hopelessness', 2, -0.20);
  set('stress', 2, -0.10);
  set('socialEngagement', 2, 0.15);
  set('calmness', 2, 0.10);

  // ── Column 3: Emotional Regulation ──
  // Targets: anxiety↓, stress↓, calmness↑, anger↓, mentalFatigue↓
  set('anxiety', 3, -0.40);
  set('stress', 3, -0.40);
  set('calmness', 3, 0.40);
  set('anger', 3, -0.30);
  set('mentalFatigue', 3, -0.20);
  set('cognitiveClarity', 3, 0.20);
  set('rumination', 3, -0.25);
  set('fearOfJudgment', 3, -0.15);
  set('hope', 3, 0.15);
  set('selfWorth', 3, 0.10);
  set('gratitude', 3, 0.15);

  return B;
}

// ════════════════════════════════════════════════════════════════
// INTERVENTION VECTORS (Predefined I vectors)
// ════════════════════════════════════════════════════════════════

/**
 * Predefined single-intervention vectors.
 * Each focuses on one intervention type with intensity 1.0.
 */
export function interventionVector(type: number, intensity = 1.0): Vec {
  const I = new Array(4).fill(0);
  I[type] = intensity;
  return I;
}

/**
 * Composite intervention: multiple types with varying intensities.
 */
export function compositeIntervention(intensities: number[]): Vec {
  return intensities.slice(0, 4).concat(new Array(Math.max(0, 4 - intensities.length)).fill(0));
}

// ════════════════════════════════════════════════════════════════
// OPTIMAL INTERVENTION SEARCH
// ════════════════════════════════════════════════════════════════

export interface InterventionCandidate {
  type: number;                // intervention index 0-3
  typeName: string;            // human-readable name
  intensity: number;           // intervention intensity
  interventionVec: Vec;        // 4D intervention vector  
  predictedState: Vec;         // predicted state after intervention
  predictedEBH: number;        // predicted EBH after
  predictedES: number;         // predicted ES after
  distanceToPA: number;        // ||S_predicted − S_PA||
  escapeForce: number;         // ||B·I|| — force generated
  escapeRatio: number;         // ||B·I|| / ||A·S|| — escape ratio
  effectiveness: number;       // combined effectiveness score [0, 1]
  reason: string;              // explanation in Vietnamese  
}

const INTERVENTION_NAMES = [
  'cognitive_reframing',
  'social_connection', 
  'behavioral_activation',
  'emotional_regulation',
];

const INTERVENTION_LABELS_VN = [
  'Tái cấu trúc nhận thức',
  'Kết nối xã hội',
  'Kích hoạt hành vi',
  'Điều chỉnh cảm xúc',
];

/**
 * Find optimal intervention to minimize ||S(t+k) − S_PA||.
 * 
 * Algorithm:
 * 1. For each intervention type i ∈ {0,1,2,3}:
 *    - Create I = [0,...,intensity,...,0] at position i
 *    - Simulate: S_future = simulateTrajectory(S, A, steps, dt, I, B)
 *    - Compute d_i = ||S_future[-1] − S_PA||
 * 2. Also try composite interventions (2 types combined)
 * 3. Return sorted by effectiveness
 * 
 * @param S — current state (24D)
 * @param A — interaction matrix (24×24)
 * @param B — intervention matrix (24×4), optional (uses default)
 * @param steps — simulation steps (default 5)
 * @param dt — time step (default 0.1)
 * @param intensityLevels — intensities to try (default [0.5, 0.7, 1.0])
 * @param currentLoopStrength — current feedback loop strength for accurate EBH comparison
 * @param currentInertia — current negative inertia for accurate EBH comparison
 */
export function findOptimalIntervention(
  S: Vec,
  A: Mat,
  B?: Mat,
  steps = 5,
  dt = 0.1,
  intensityLevels = [0.5, 0.7, 1.0],
  currentLoopStrength = 0,
  currentInertia = 0,
): InterventionCandidate[] {
  const interventionB = B ?? defaultInterventionMatrix();
  const S_PA = positiveAttractor();
  const W = defaultWeightMatrix();
  const { required: internalForce } = escapeForceRequired(A, S);

  const candidates: InterventionCandidate[] = [];

  // Current state metrics (baseline)
  const currentEBH = computeEBHScore({
    loopStrength: currentLoopStrength,
    negativeInertia: currentInertia,
    potentialEnergy: potentialEnergy(S, W),
    hopeLevel: S[8],
  });
  const currentES = computeESScore(S);
  const currentDist = distanceToAttractor(S);

  // ── Single interventions ──
  for (let type = 0; type < 4; type++) {
    for (const intensity of intensityLevels) {
      const I = interventionVector(type, intensity);
      
      // Simulate trajectory with intervention
      const trajectory = simulateTrajectory(S, A, steps, dt, I, interventionB);
      const predictedState = trajectory[trajectory.length - 1];

      // Compute metrics
      const predU = potentialEnergy(predictedState, W);
      const predEBH = computeEBHScore({
        loopStrength: currentLoopStrength,
        negativeInertia: currentInertia,
        potentialEnergy: predU,
        hopeLevel: predictedState[8],
      });
      const predES = computeESScore(predictedState);
      const predDist = distanceToAttractor(predictedState);
      const force = escapeForceAchieved(interventionB, I);
      const ratio = internalForce > 1e-12 ? force / internalForce : force;

      // Effectiveness = weighted combination of improvements
      const ebhImprovement = Math.max(0, currentEBH - predEBH); // lower EBH = better
      const esImprovement = Math.max(0, predES - currentES);     // higher ES = better
      const distImprovement = Math.max(0, currentDist - predDist); // closer to PA = better
      const effectiveness = Math.min(1,
        0.35 * (ebhImprovement / Math.max(0.01, currentEBH)) +
        0.30 * (esImprovement / Math.max(0.01, 1 - currentES)) +
        0.20 * (distImprovement / Math.max(0.01, currentDist)) +
        0.15 * Math.min(1, ratio)
      );

      candidates.push({
        type,
        typeName: INTERVENTION_NAMES[type],
        intensity,
        interventionVec: I,
        predictedState,
        predictedEBH: predEBH,
        predictedES: predES,
        distanceToPA: predDist,
        escapeForce: force,
        escapeRatio: ratio,
        effectiveness,
        reason: generateInterventionReason(type, S, effectiveness, ratio),
      });
    }
  }

  // ── Top-2 composite interventions ──
  // Find best 2 single types, combine them
  const bestByType = new Map<number, InterventionCandidate>();
  for (const c of candidates) {
    const existing = bestByType.get(c.type);
    if (!existing || c.effectiveness > existing.effectiveness) {
      bestByType.set(c.type, c);
    }
  }
  const sortedTypes = [...bestByType.entries()]
    .sort((a, b) => b[1].effectiveness - a[1].effectiveness);

  if (sortedTypes.length >= 2) {
    const [type1, best1] = sortedTypes[0];
    const [type2, best2] = sortedTypes[1];
    const compositeI = compositeIntervention([0, 0, 0, 0].map((_, i) => {
      if (i === type1) return best1.intensity * 0.6;
      if (i === type2) return best2.intensity * 0.4;
      return 0;
    }));

    const trajectory = simulateTrajectory(S, A, steps, dt, compositeI, interventionB);
    const predictedState = trajectory[trajectory.length - 1];
    const predU = potentialEnergy(predictedState, W);
    const predEBH = computeEBHScore({
      loopStrength: currentLoopStrength,
      negativeInertia: currentInertia,
      potentialEnergy: predU,
      hopeLevel: predictedState[8],
    });
    const predES = computeESScore(predictedState);
    const predDist = distanceToAttractor(predictedState);
    const force = escapeForceAchieved(interventionB, compositeI);
    const ratio = internalForce > 1e-12 ? force / internalForce : force;

    const ebhImprovement = Math.max(0, currentEBH - predEBH);
    const esImprovement = Math.max(0, predES - currentES);
    const distImprovement = Math.max(0, currentDist - predDist);
    const effectiveness = Math.min(1,
      0.35 * (ebhImprovement / Math.max(0.01, currentEBH)) +
      0.30 * (esImprovement / Math.max(0.01, 1 - currentES)) +
      0.20 * (distImprovement / Math.max(0.01, currentDist)) +
      0.15 * Math.min(1, ratio)
    );

    candidates.push({
      type: -1, // composite
      typeName: `${INTERVENTION_NAMES[type1]}+${INTERVENTION_NAMES[type2]}`,
      intensity: 1.0,
      interventionVec: compositeI,
      predictedState,
      predictedEBH: predEBH,
      predictedES: predES,
      distanceToPA: predDist,
      escapeForce: force,
      escapeRatio: ratio,
      effectiveness,
      reason: `Kết hợp ${INTERVENTION_LABELS_VN[type1]} và ${INTERVENTION_LABELS_VN[type2]} để tối đa hóa hiệu quả thoát khỏi vùng nguy hiểm.`,
    });
  }

  // Sort by effectiveness (descending)
  return candidates.sort((a, b) => b.effectiveness - a.effectiveness);
}

// ════════════════════════════════════════════════════════════════
// PHASE 4: TOPOLOGY-INTERVENTION STRATEGY MAPPING
// ════════════════════════════════════════════════════════════════

/**
 * TOPOLOGY → INTERVENTION STRATEGY MAP
 * 
 * Maps topology profiles to intervention type priority weights.
 * Higher weight = higher priority for that intervention type.
 * 
 * ┌──────────────┬──────────┬──────────┬──────────┬──────────┐
 * │ Profile      │ Cogn.Ref │ Social   │ Behav.   │ Emot.Reg │
 * ├──────────────┼──────────┼──────────┼──────────┼──────────┤
 * │ fragile      │ 0.6      │ 1.4      │ 0.7      │ 1.3      │
 * │ chaotic      │ 0.8      │ 0.9      │ 0.7      │ 1.6      │
 * │ stuck        │ 1.5      │ 1.0      │ 1.3      │ 0.8      │
 * │ resilient    │ 1.1      │ 1.1      │ 1.4      │ 0.8      │
 * │ transitional │ 1.2      │ 1.1      │ 1.0      │ 1.2      │
 * └──────────────┴──────────┴──────────┴──────────┴──────────┘
 * 
 * Rationale:
 * - fragile: Need safety → emotional_regulation + social_connection
 * - chaotic: Need grounding → emotional_regulation (mindfulness, grounding)
 * - stuck: Need disruption → cognitive_reframing + behavioral_activation
 * - resilient: Capitalize → behavioral_activation + growth
 * - transitional: Support change → cognitive_reframing + emotional_regulation
 */
export type TopologyProfile = 'fragile' | 'chaotic' | 'stuck' | 'resilient' | 'transitional';

const TOPOLOGY_STRATEGY_MAP: Record<TopologyProfile, [number, number, number, number]> = {
  fragile:      [0.6, 1.4, 0.7, 1.3], // social + emotional first
  chaotic:      [0.8, 0.9, 0.7, 1.6], // emotional regulation dominant
  stuck:        [1.5, 1.0, 1.3, 0.8], // cognitive + behavioral to break patterns
  resilient:    [1.1, 1.1, 1.4, 0.8], // behavioral activation to grow
  transitional: [1.2, 1.1, 1.0, 1.2], // balanced with cognitive + emotional
};

const TOPOLOGY_STRATEGY_REASONS: Record<TopologyProfile, string> = {
  fragile: 'Hồ sơ topology mong manh — ưu tiên kết nối xã hội & điều chỉnh cảm xúc để xây dựng an toàn.',
  chaotic: 'Hồ sơ topology hỗn loạn — ưu tiên grounding & điều chỉnh cảm xúc để ổn định hệ thống.',
  stuck: 'Hồ sơ topology mắc kẹt — ưu tiên tái cấu trúc nhận thức & kích hoạt hành vi để phá vỡ mẫu hình.',
  resilient: 'Hồ sơ topology kiên cường — ưu tiên kích hoạt hành vi để phát huy thế mạnh & phát triển.',
  transitional: 'Hồ sơ topology chuyển đổi — chiến lược cân bằng nhận thức & cảm xúc để hỗ trợ quá trình thay đổi.',
};

/**
 * Get intervention type priority weights based on topology profile.
 * Returns 4 weights corresponding to [cognitive, social, behavioral, emotional].
 */
export function getTopologyWeights(profile: TopologyProfile): [number, number, number, number] {
  return TOPOLOGY_STRATEGY_MAP[profile] ?? [1.0, 1.0, 1.0, 1.0];
}

/**
 * Get strategy reasoning based on topology profile.
 */
export function getTopologyStrategyReason(profile: TopologyProfile): string {
  return TOPOLOGY_STRATEGY_REASONS[profile] ?? '';
}

/**
 * Apply topology weights to intervention candidates.
 * Boosts effectiveness of interventions aligned with topology strategy.
 * 
 * effectivenessNew = effectiveness * (0.6 + 0.4 * weight)
 * 
 * This ensures baseline interventions are still considered (60% base),
 * but topology-aligned ones get a significant boost (up to ~124% of original).
 */
export function applyTopologyWeights(
  candidates: InterventionCandidate[],
  profile: TopologyProfile,
): InterventionCandidate[] {
  const weights = getTopologyWeights(profile);
  const strategyReason = getTopologyStrategyReason(profile);

  return candidates.map(c => {
    if (c.type < 0 || c.type >= weights.length) {
      // Composite interventions — apply average weight of constituent types
      return c;
    }
    const w = weights[c.type];
    const boostedEffectiveness = Math.min(1, c.effectiveness * (0.6 + 0.4 * w));
    return {
      ...c,
      effectiveness: boostedEffectiveness,
      reason: `${c.reason} | ${strategyReason}`,
    };
  }).sort((a, b) => b.effectiveness - a.effectiveness);
}

/**
 * Generate Vietnamese explanation for why an intervention is recommended
 */
function generateInterventionReason(type: number, S: Vec, effectiveness: number, escapeRatio: number): string {
  const reasons: string[][] = [
    // cognitive_reframing
    [
      'Suy nghĩ lặp đang cao, cần tái cấu trúc nhận thức để phá vỡ vòng lặp tiêu cực.',
      'Cảm giác tuyệt vọng cao — thay đổi góc nhìn sẽ giúp tìm lại hy vọng.',
      'Giá trị bản thân thấp — cần thách thức các suy nghĩ tự phê phán.',
    ],
    // social_connection
    [
      'Cô đơn đang cao, kết nối xã hội sẽ giúp giảm cảm giác bị cô lập.',
      'Hỗ trợ xã hội thấp — cần tăng cường kết nối với người thân, bạn bè.',
      'Né tránh xã hội đang cao — khuyến khích tham gia hoạt động nhóm nhỏ.',
    ],
    // behavioral_activation
    [
      'Động lực thấp, cần kích hoạt hành vi để phá vỡ chu trình trì hoãn.',
      'Né tránh cao — chia nhỏ mục tiêu và thực hiện từng bước nhỏ sẽ giúp tăng tự tin.',
      'Mệt mỏi tinh thần cao — hoạt động thể chất nhẹ sẽ giúp phục hồi năng lượng.',
    ],
    // emotional_regulation
    [
      'Lo âu và căng thẳng đang cao, cần kỹ thuật thư giãn để ổn định cảm xúc.',
      'Tức giận đang cao — hít thở sâu và mindfulness sẽ giúp điều chỉnh.',
      'Cần grounding techniques để quay về hiện tại và giảm suy nghĩ lặp.',
    ],
  ];

  if (type < 0 || type >= reasons.length) return '';

  // Pick reason based on dominant variable for this intervention type
  const dominantVars = [
    [S[14], S[7], S[12]],  // rumination, hopelessness, selfWorth (for cognitive)
    [S[4], S[21], S[16]],  // loneliness, perceivedSupport(inverted), avoidance (for social)
    [S[19], S[16], S[23]], // motivation(inverted), avoidance, mentalFatigue (for behavioral)
    [S[1], S[0], S[3]],   // anxiety, stress, anger (for emotional)
  ];

  const vars = dominantVars[type];
  let maxIdx = 0;
  let maxVal = vars[0];
  for (let i = 1; i < vars.length; i++) {
    // For positive variables (like motivation), invert the check
    const check = type === 2 && i === 0 ? 1 - vars[i] : vars[i];
    if (check > maxVal) {
      maxVal = check;
      maxIdx = i;
    }
  }

  return reasons[type][maxIdx];
}

/**
 * Simulate trajectory WITH and WITHOUT intervention for comparison.
 * Returns both trajectories for visualization.
 */
export function compareTrajectories(
  S: Vec,
  A: Mat,
  B: Mat,
  I: Vec,
  steps = 10,
  dt = 0.1,
): { withoutIntervention: Vec[]; withIntervention: Vec[] } {
  return {
    withoutIntervention: simulateTrajectory(S, A, steps, dt),
    withIntervention: simulateTrajectory(S, A, steps, dt, I, B),
  };
}

// ════════════════════════════════════════════════════════════════
// INTERVENTION MATRIX LEARNING (B matrix from outcomes)
// ════════════════════════════════════════════════════════════════

/**
 * Learn Intervention Matrix B from historical intervention outcomes.
 * 
 * Given (preState, intervention, postState) triples:
 *   ΔS = postState - preState - A·preState·Δt  (residual after natural dynamics)
 *   ΔS ≈ B·I·Δt → B ≈ (ΔS/Δt) · I_pseudo_inverse
 * 
 * Uses ridge regression per-row:
 *   B[i,:] = (IᵀI + λI)⁻¹ · Iᵀ · ΔS[i,:]
 * 
 * @param outcomes — array of { preState, postState, interventionVec }
 * @param A — interaction matrix (to remove natural dynamics)
 * @param dt — time step used between pre and post
 * @param lambda — regularization
 */
export function learnInterventionMatrix(
  outcomes: Array<{ preState: Vec; postState: Vec; interventionVec: Vec }>,
  A: Mat,
  dt = 1.0,
  lambda = 0.1,
): { matrix: Mat; loss: number } {
  if (outcomes.length < 3) {
    return { matrix: defaultInterventionMatrix(), loss: 0 };
  }

  const n = PSY_DIMENSION; // 24
  const m = 4; // intervention dimension
  const T = outcomes.length;

  // Compute residuals: ΔS_residual = (postState - preState)/dt - A·preState
  const residuals: Vec[] = outcomes.map(o => {
    const naturalDynamics = matVec(A, o.preState);
    const rawChange = vecScale(vecSub(o.postState, o.preState), 1 / dt);
    return vecSub(rawChange, naturalDynamics);
  });

  // Intervention vectors (T × m)
  const interventions: Vec[] = outcomes.map(o => o.interventionVec);

  // IᵀI (m×m) + λI
  const ItI: Mat = Array.from({ length: m }, () => new Array(m).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) {
      let sum = 0;
      for (let t = 0; t < T; t++) sum += interventions[t][i] * interventions[t][j];
      ItI[i][j] = sum;
    }
    ItI[i][i] += lambda; // regularization
  }

  // Invert IᵀI (4×4 — small, easy)
  const inv = invertSmallMatrix(ItI);
  if (!inv) {
    return { matrix: defaultInterventionMatrix(), loss: 0 };
  }

  // For each row i of B:
  // Iᵀ·residuals[:,i] (m×1), then B[i,:] = inv · Iᵀ·res
  const B: Mat = Array.from({ length: n }, () => new Array(m).fill(0));
  let totalLoss = 0;

  for (let i = 0; i < n; i++) {
    const ItRes = new Array(m).fill(0);
    for (let j = 0; j < m; j++) {
      let sum = 0;
      for (let t = 0; t < T; t++) sum += interventions[t][j] * residuals[t][i];
      ItRes[j] = sum;
    }
    // B[i,:] = inv · ItRes
    for (let j = 0; j < m; j++) {
      let sum = 0;
      for (let k = 0; k < m; k++) sum += inv[j][k] * ItRes[k];
      B[i][j] = sum;
    }

    // Compute loss for this row
    for (let t = 0; t < T; t++) {
      let predicted = 0;
      for (let j = 0; j < m; j++) predicted += B[i][j] * interventions[t][j];
      const diff = residuals[t][i] - predicted;
      totalLoss += diff * diff;
    }
  }

  totalLoss /= (T * n);
  return { matrix: B, loss: totalLoss };
}

/**
 * Invert a small matrix (4×4) using Gauss-Jordan.
 */
function invertSmallMatrix(M: Mat): Mat | null {
  const n = M.length;
  const aug: number[][] = M.map((row, i) => [
    ...row.map(v => v),
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ]);

  for (let col = 0; col < n; col++) {
    let maxVal = Math.abs(aug[col][col]);
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > maxVal) {
        maxVal = Math.abs(aug[row][col]);
        maxRow = row;
      }
    }
    if (maxVal < 1e-12) return null;
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    const pivot = aug[col][col];
    for (let j = 0; j < 2 * n; j++) aug[col][j] /= pivot;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = aug[row][col];
      for (let j = 0; j < 2 * n; j++) aug[row][j] -= factor * aug[col][j];
    }
  }
  return aug.map(row => row.slice(n));
}

// ════════════════════════════════════════════════════════════════
// EARLY WARNING & TRAJECTORY ANALYSIS
// ════════════════════════════════════════════════════════════════

/**
 * Generate early warning from trajectory
 */
export function analyzeTrajectoryWarning(trajectory: Vec[]): {
  warning: boolean;
  type?: 'approaching_attractor' | 'increasing_inertia' | 'loop_strengthening' | 'hope_depleting';
  message?: string;
} {
  if (trajectory.length < 3) return { warning: false };

  const last = trajectory[trajectory.length - 1];
  const first = trajectory[0];

  // Check hope depletion
  const hopeFirst = first[8];
  const hopeLast = last[8];
  if (hopeFirst > 0.2 && hopeLast < 0.1) {
    return {
      warning: true,
      type: 'hope_depleting',
      message: 'Quỹ đạo cho thấy hy vọng đang suy giảm nghiêm trọng. Cần can thiệp để củng cố nguồn lực tích cực.',
    };
  }

  // Check approaching depression attractor
  const negLast = negativeMean(last);
  const negFirst = negativeMean(first);
  if (negLast > 0.6 && negLast > negFirst + 0.15) {
    return {
      warning: true,
      type: 'approaching_attractor',
      message: 'Quỹ đạo cảm xúc đang tiến về vùng attractor tiêu cực. Các cảm xúc tiêu cực đang tăng cường lẫn nhau.',
    };
  }

  // Check increasing stress-anxiety loop
  const stressLast = last[0];
  const anxietyLast = last[1];
  if (stressLast > 0.7 && anxietyLast > 0.7) {
    return {
      warning: true,
      type: 'loop_strengthening',
      message: 'Vòng lặp stress-anxiety đang mạnh lên. Cần phá vỡ chu trình bằng kỹ thuật thư giãn hoặc giải quyết nguồn stress.',
    };
  }

  return { warning: false };
}

// ════════════════════════════════════════════════════════════════
// PHASE 3 — TOPOLOGY MAPPER: Fixed Points, Basins, Landscape
// ════════════════════════════════════════════════════════════════

/**
 * Fixed-Point types for dynamical system analysis
 */
export interface FixedPoint {
  state: Vec;                     // S* where F(S*) ≈ 0
  type: 'stable' | 'unstable' | 'saddle'; // stability classification
  eigenvalues: number[];          // real parts of eigenvalues of Jacobian
  label: string;                  // human-readable attractor name
  labelVi: string;                // Vietnamese label
  basin?: number;                 // index of basin this point belongs to
}

export interface BasinCell {
  x: number;    // PCA coordinate 1
  y: number;    // PCA coordinate 2
  basin: number; // which attractor this cell flows to (-1 = divergent)
  energy: number; // potential energy at this point
  forceX: number; // force vector X component (for phase portrait)
  forceY: number; // force vector Y component
}

export interface TopologyData {
  fixedPoints: FixedPoint[];
  basins: BasinCell[];
  pcaAxes: { pc1: Vec; pc2: Vec; mean: Vec }; // PCA projection info
  gridSize: number;
  userPosition: { x: number; y: number };     // user's current position in PCA space
  userTrajectory: Array<{ x: number; y: number }>; // projected trajectory
  bifurcationEvents: BifurcationEvent[];
}

export interface BifurcationEvent {
  type: 'birth' | 'death' | 'merge' | 'split';
  timestamp: number;
  description: string;
  descriptionVi: string;
  affectedPoints: FixedPoint[];
}

// ─────────────────────────────────────────────
// PCA — Simple 2-component Principal Component Analysis
// ─────────────────────────────────────────────

/**
 * Compute 2-component PCA from a set of state vectors.
 * Returns principal directions + mean for projection.
 * 
 * Uses power iteration on covariance matrix (no external libs).
 */
export function computePCA(states: Vec[]): { pc1: Vec; pc2: Vec; mean: Vec } {
  const n = states[0]?.length || PSY_DIMENSION;
  
  // If not enough states, use preset axes (neg_mean vs pos_mean directions)
  if (states.length < 3) {
    const pc1 = zeros(n);
    const pc2 = zeros(n);
    // PC1: negative emotions direction
    for (let i = 0; i < 8; i++) pc1[i] = 1 / Math.sqrt(8);
    // PC2: positive emotions direction
    for (let i = 8; i < 12; i++) pc2[i] = 1 / Math.sqrt(4);
    return { pc1, pc2, mean: zeros(n) };
  }

  // Mean
  const mean = zeros(n);
  for (const s of states) for (let i = 0; i < n; i++) mean[i] += s[i];
  for (let i = 0; i < n; i++) mean[i] /= states.length;

  // Centered data
  const centered = states.map(s => vecSub(s, mean));

  // Covariance matrix C (n×n)
  const C = zeroMat(n);
  for (const c of centered) {
    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        C[i][j] += c[i] * c[j];
        if (i !== j) C[j][i] += c[i] * c[j];
      }
    }
  }
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      C[i][j] /= (states.length - 1);

  // Power iteration for PC1
  let v1 = Array.from({ length: n }, (_, i) => Math.sin(i + 1));
  let norm1 = vecNorm(v1);
  v1 = vecScale(v1, 1 / norm1);

  for (let iter = 0; iter < 100; iter++) {
    const Cv = matVec(C, v1);
    norm1 = vecNorm(Cv);
    if (norm1 < 1e-12) break;
    v1 = vecScale(Cv, 1 / norm1);
  }

  // Deflation: C2 = C - λ1 * v1 * v1^T
  const lambda1 = dot(matVec(C, v1), v1);
  const C2 = C.map((row, i) => row.map((val, j) => val - lambda1 * v1[i] * v1[j]));

  // Power iteration for PC2
  let v2 = Array.from({ length: n }, (_, i) => Math.cos(i + 1));
  let norm2 = vecNorm(v2);
  v2 = vecScale(v2, 1 / norm2);

  for (let iter = 0; iter < 100; iter++) {
    const Cv = matVec(C2, v2);
    norm2 = vecNorm(Cv);
    if (norm2 < 1e-12) break;
    v2 = vecScale(Cv, 1 / norm2);
  }

  // Ensure orthogonality
  const proj = dot(v2, v1);
  v2 = vecSub(v2, vecScale(v1, proj));
  const n2 = vecNorm(v2);
  if (n2 > 1e-12) v2 = vecScale(v2, 1 / n2);

  return { pc1: v1, pc2: v2, mean };
}

/**
 * Project a state vector onto 2D PCA space.
 */
export function projectToPCA(S: Vec, pca: { pc1: Vec; pc2: Vec; mean: Vec }): { x: number; y: number } {
  const centered = vecSub(S, pca.mean);
  return {
    x: dot(centered, pca.pc1),
    y: dot(centered, pca.pc2),
  };
}

/**
 * Reconstruct a full state vector from 2D PCA coordinates.
 * S_approx = mean + x * pc1 + y * pc2
 */
export function reconstructFromPCA(
  x: number, y: number,
  pca: { pc1: Vec; pc2: Vec; mean: Vec },
): Vec {
  return vecClamp(
    vecAdd(pca.mean, vecAdd(vecScale(pca.pc1, x), vecScale(pca.pc2, y)))
  );
}

// ─────────────────────────────────────────────
// Fixed-Point Finder (Newton-Raphson on dS/dt = (A-I)·S = 0)
// ─────────────────────────────────────────────

/**
 * Find equilibria of the system dS/dt = (A-I)·S = 0.
 * 
 * For linear system S(t+1) = A·S(t), equilibrium when A·S* = S* → (A-I)·S* = 0.
 * The origin is always an equilibrium. We also search for others by:
 * 1. Starting from multiple initial conditions
 * 2. Newton-Raphson: S_{k+1} = S_k - J(S_k)^{-1} · F(S_k)
 *    where F(S) = (A-I)·S and J = A-I
 * 3. Cluster nearby solutions
 * 
 * For our clamped [0,1] system, we also find boundary equilibria
 * where states saturate at 0 or 1.
 * 
 * @param A — interaction matrix (24×24)
 * @param numSeeds — number of random starting points
 * @returns array of unique fixed points
 */
export function findFixedPoints(A: Mat, numSeeds = 20): FixedPoint[] {
  const n = A.length;
  
  // J = A - I (Jacobian for linear system)
  const J: Mat = A.map((row, i) => row.map((val, j) => val - (i === j ? 1 : 0)));
  
  const rawPoints: Vec[] = [];
  
  // Seed 0: origin (always equilibrium for linear system)
  rawPoints.push(zeros(n));
  
  // Seed 1: positive attractor
  rawPoints.push(positiveAttractor());
  
  // Generate diverse seeds
  const seeds = generateDiverseSeeds(n, numSeeds);
  
  for (const seed of seeds) {
    const fp = newtonRaphson(J, seed, 50);
    if (fp) rawPoints.push(fp);
  }
  
  // Also try: check if fixed PA-like state is stable under A
  const paTrajectory = simulateTrajectory(positiveAttractor(), A, 100, 0.05);
  const paConverged = paTrajectory[paTrajectory.length - 1];
  rawPoints.push(paConverged);
  
  // Try known attractor archetypes as seeds
  const archetypes = getAttractorArchetypes();
  for (const arch of archetypes) {
    const trajectory = simulateTrajectory(arch.state, A, 100, 0.05);
    rawPoints.push(trajectory[trajectory.length - 1]);
  }
  
  // Cluster nearby points (distance < 0.1)
  const uniquePoints = clusterFixedPoints(rawPoints, 0.1);
  
  // Classify each point
  return uniquePoints.map(state => classifyFixedPoint(state, A));
}

/**
 * Newton-Raphson iteration for F(S) = J·S = 0 with clamping to [0,1].
 * Returns converged point or null if divergent.
 */
function newtonRaphson(J: Mat, seed: Vec, maxIter: number): Vec | null {
  const n = J.length;
  let S = [...seed];
  
  // Try to invert J
  const Jinv = invertMatrix(J);
  if (!Jinv) {
    // J is singular → use damped iteration: S_{k+1} = S_k - α·F(S_k)
    const alpha = 0.01;
    for (let iter = 0; iter < maxIter * 2; iter++) {
      const F = matVec(J, S);
      const fnorm = vecNorm(F);
      if (fnorm < 1e-6) return vecClamp(S);
      S = vecClamp(vecSub(S, vecScale(F, alpha)));
    }
    const finalF = matVec(J, S);
    return vecNorm(finalF) < 0.01 ? vecClamp(S) : null;
  }
  
  for (let iter = 0; iter < maxIter; iter++) {
    const F = matVec(J, S);
    const fnorm = vecNorm(F);
    if (fnorm < 1e-6) return vecClamp(S);
    
    // S_{k+1} = S_k - J^{-1} · F(S_k)
    const delta = matVec(Jinv, F);
    S = vecClamp(vecSub(S, delta));
  }
  
  const finalF = matVec(J, S);
  return vecNorm(finalF) < 0.01 ? vecClamp(S) : null;
}

/**
 * Generate diverse seed points for fixed-point search.
 * Uses quasi-random (Halton-like) sequences across state space.
 */
function generateDiverseSeeds(n: number, count: number): Vec[] {
  const seeds: Vec[] = [];
  // Primes for Halton sequence
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89];
  
  for (let k = 1; k <= count; k++) {
    const seed = new Array(n);
    for (let d = 0; d < n; d++) {
      // Halton sequence for dimension d
      const base = primes[d % primes.length];
      let result = 0;
      let f = 1;
      let idx = k;
      while (idx > 0) {
        f /= base;
        result += f * (idx % base);
        idx = Math.floor(idx / base);
      }
      seed[d] = result;
    }
    seeds.push(seed);
  }
  return seeds;
}

/**
 * Known attractor archetype states for seeding fixed-point search.
 */
function getAttractorArchetypes(): Array<{ state: Vec; label: string }> {
  const n = PSY_DIMENSION;
  
  // Depression: high sadness/hopelessness, low everything positive
  const depression = zeros(n);
  depression[2] = 0.8; depression[7] = 0.7; depression[4] = 0.6;
  depression[0] = 0.5; depression[1] = 0.4; depression[14] = 0.6;
  depression[8] = 0.05; depression[19] = 0.1; depression[12] = 0.1;
  
  // Burnout: high stress/fatigue, depleted motivation
  const burnout = zeros(n);
  burnout[0] = 0.8; burnout[23] = 0.8; burnout[19] = 0.1;
  burnout[1] = 0.5; burnout[14] = 0.5; burnout[15] = 0.2;
  burnout[8] = 0.15; burnout[12] = 0.2;
  
  // Anxiety spiral: high anxiety/rumination/avoidance
  const anxietySpiral = zeros(n);
  anxietySpiral[1] = 0.8; anxietySpiral[14] = 0.7; anxietySpiral[16] = 0.6;
  anxietySpiral[22] = 0.6; anxietySpiral[0] = 0.5; anxietySpiral[9] = 0.1;
  
  // Growth: high positive, low negative
  const growth = zeros(n);
  growth[8] = 0.8; growth[9] = 0.7; growth[10] = 0.7; growth[11] = 0.6;
  growth[12] = 0.75; growth[13] = 0.7; growth[19] = 0.8;
  growth[0] = 0.1; growth[1] = 0.1;
  
  // Disengagement: flat, low everything
  const disengagement = new Array(n).fill(0.3);
  disengagement[19] = 0.1; disengagement[17] = 0.1; disengagement[18] = 0.1;
  
  return [
    { state: depression, label: 'depression' },
    { state: burnout, label: 'burnout' },
    { state: anxietySpiral, label: 'anxiety_spiral' },
    { state: growth, label: 'growth' },
    { state: disengagement, label: 'disengagement' },
  ];
}

/**
 * Cluster nearby fixed points (merge points closer than threshold).
 */
function clusterFixedPoints(points: Vec[], threshold: number): Vec[] {
  const clusters: Vec[][] = [];
  
  for (const p of points) {
    let merged = false;
    for (const cluster of clusters) {
      // Check distance to cluster centroid
      const centroid = cluster[0].map((_, i) =>
        cluster.reduce((sum, c) => sum + c[i], 0) / cluster.length
      );
      if (vecNorm(vecSub(p, centroid)) < threshold) {
        cluster.push(p);
        merged = true;
        break;
      }
    }
    if (!merged) clusters.push([p]);
  }
  
  // Return centroids
  return clusters.map(cluster => {
    const n = cluster[0].length;
    const centroid = zeros(n);
    for (const p of cluster) for (let i = 0; i < n; i++) centroid[i] += p[i];
    for (let i = 0; i < n; i++) centroid[i] /= cluster.length;
    return vecClamp(centroid);
  });
}

// ─────────────────────────────────────────────
// Stability Classifier (Jacobian Eigenvalue Analysis)
// ─────────────────────────────────────────────

/**
 * Classify a fixed point by computing eigenvalues of the Jacobian.
 * 
 * For S(t+1) = clamp(A·S(t)):
 * - Jacobian at interior point = A
 * - If all |eigenvalues(A)| < 1 → stable
 * - If any |eigenvalue(A)| > 1 → unstable
 * - Mixed → saddle
 * 
 * We approximate eigenvalues by power iteration + deflation.
 */
function classifyFixedPoint(state: Vec, A: Mat): FixedPoint {
  const n = A.length;
  
  // Compute effective Jacobian at this point
  // For clamped system: J[i][j] = A[i][j] if 0 < state[i] < 1, else 0
  const Jeff: Mat = A.map((row, i) => {
    if (state[i] <= 0.001 || state[i] >= 0.999) {
      // Boundary: derivative is 0 (clamped)
      return new Array(n).fill(0);
    }
    return [...row];
  });
  
  // Compute eigenvalue magnitudes via iterative deflation
  const eigenvalues = computeEigenvalues(Jeff, 6); // top 6
  
  // Classify stability
  const maxEig = Math.max(...eigenvalues.map(Math.abs));
  const minEig = Math.min(...eigenvalues.map(Math.abs));
  
  let type: 'stable' | 'unstable' | 'saddle';
  if (maxEig < 1.0) {
    type = 'stable';
  } else if (minEig > 1.0) {
    type = 'unstable';
  } else {
    type = 'saddle';
  }
  
  // Label based on dominant variables
  const label = labelFixedPoint(state);
  const labelVi = labelFixedPointVi(state);
  
  return { state, type, eigenvalues, label, labelVi };
}

/**
 * Compute top-k eigenvalues via power iteration + deflation.
 */
function computeEigenvalues(M: Mat, k: number): number[] {
  const n = M.length;
  const eigenvalues: number[] = [];
  let currentM = M.map(r => [...r]);
  
  for (let i = 0; i < Math.min(k, n); i++) {
    // Power iteration
    let v = Array.from({ length: n }, (_, j) => Math.sin(j * (i + 1) + 1));
    let vn = vecNorm(v);
    if (vn < 1e-12) break;
    v = vecScale(v, 1 / vn);
    
    let lambda = 0;
    for (let iter = 0; iter < 80; iter++) {
      const Mv = matVec(currentM, v);
      lambda = dot(v, Mv);
      vn = vecNorm(Mv);
      if (vn < 1e-12) break;
      v = vecScale(Mv, 1 / vn);
    }
    
    eigenvalues.push(lambda);
    
    // Deflation: M = M - λ·v·vᵀ
    currentM = currentM.map((row, ri) =>
      row.map((val, ci) => val - lambda * v[ri] * v[ci])
    );
  }
  
  return eigenvalues;
}

/**
 * Label a fixed point based on its state vector profile.
 */
function labelFixedPoint(state: Vec): string {
  const neg = negativeMean(state);
  const pos = positiveMean(state);
  const allLow = state.every(v => v < 0.2);
  
  if (allLow || vecNorm(state) < 0.3) return 'origin';
  
  // Use existing detectAttractor for base label
  const baseLabel = detectAttractor(state);
  return baseLabel;
}

/**
 * Vietnamese labels for fixed points.
 */
function labelFixedPointVi(state: Vec): string {
  const label = labelFixedPoint(state);
  const map: Record<string, string> = {
    'origin': 'Gốc tọa độ (trạng thái trung lập)',
    'depression': 'Hố trầm cảm',
    'burnout': 'Vùng kiệt sức',
    'anxiety_spiral': 'Xoáy lo âu',
    'growth': 'Đỉnh phát triển',
    'recovery': 'Vùng phục hồi',
    'stable': 'Trạng thái ổn định',
    'disengagement': 'Vùng rút lui',
  };
  return map[label] || 'Điểm cân bằng';
}

// ─────────────────────────────────────────────
// Basin of Attraction Mapper
// ─────────────────────────────────────────────

/**
 * Map basins of attraction by simulating trajectory from each grid cell.
 * Projects onto 2D PCA space, simulates forward, and assigns to nearest attractor.
 * 
 * @param A — interaction matrix
 * @param fixedPoints — known attractor states
 * @param pca — PCA projection info
 * @param gridSize — resolution of the grid (default 25 = 25×25)
 * @param W — weight matrix for potential energy
 */
export function mapBasins(
  A: Mat,
  fixedPoints: FixedPoint[],
  pca: { pc1: Vec; pc2: Vec; mean: Vec },
  gridSize = 25,
  W?: Mat,
): BasinCell[] {
  const weight = W ?? defaultWeightMatrix();
  const stablePoints = fixedPoints.filter(fp => fp.type === 'stable');
  const cells: BasinCell[] = [];
  
  // Determine grid range from PCA (centered on mean)
  const range = 2.0; // [-2, 2] in PCA space
  const step = (2 * range) / (gridSize - 1);
  
  for (let xi = 0; xi < gridSize; xi++) {
    for (let yi = 0; yi < gridSize; yi++) {
      const x = -range + xi * step;
      const y = -range + yi * step;
      
      // Reconstruct full state from PCA coordinates
      const S = reconstructFromPCA(x, y, pca);
      
      // Simulate trajectory to find where it converges
      const trajectory = simulateTrajectory(S, A, 50, 0.05);
      const finalState = trajectory[trajectory.length - 1];
      
      // Find nearest stable attractor
      let basin = -1;
      let minDist = Infinity;
      for (let i = 0; i < stablePoints.length; i++) {
        const dist = vecNorm(vecSub(finalState, stablePoints[i].state));
        if (dist < minDist) {
          minDist = dist;
          basin = i;
        }
      }
      // If too far from any attractor, mark as divergent
      if (minDist > 1.0) basin = -1;
      
      // Compute potential energy and force at this point
      const energy = potentialEnergy(S, weight);
      const force = psychologicalForce(S, weight);
      const projForce = projectToPCA(vecAdd(S, force), pca);
      const projS = { x, y };
      
      cells.push({
        x, y,
        basin,
        energy,
        forceX: projForce.x - projS.x,
        forceY: projForce.y - projS.y,
      });
    }
  }
  
  return cells;
}

// ─────────────────────────────────────────────
// Landscape Surface Generator
// ─────────────────────────────────────────────

/**
 * Generate potential energy landscape on 2D PCA grid.
 * Returns energy values for contour/heatmap visualization.
 * 
 * (Already included in mapBasins — energy field in BasinCell)
 * This function provides a lightweight version (energy only).
 */
export function generateLandscapeSurface(
  pca: { pc1: Vec; pc2: Vec; mean: Vec },
  W?: Mat,
  gridSize = 40,
  range = 2.0,
): { x: number[]; y: number[]; energy: number[][] } {
  const weight = W ?? defaultWeightMatrix();
  const xCoords: number[] = [];
  const yCoords: number[] = [];
  const energy: number[][] = [];
  
  const step = (2 * range) / (gridSize - 1);
  
  for (let xi = 0; xi < gridSize; xi++) {
    const xVal = -range + xi * step;
    xCoords.push(xVal);
  }
  for (let yi = 0; yi < gridSize; yi++) {
    const yVal = -range + yi * step;
    yCoords.push(yVal);
  }
  
  for (let yi = 0; yi < gridSize; yi++) {
    const row: number[] = [];
    for (let xi = 0; xi < gridSize; xi++) {
      const S = reconstructFromPCA(xCoords[xi], yCoords[yi], pca);
      row.push(potentialEnergy(S, weight));
    }
    energy.push(row);
  }
  
  return { x: xCoords, y: yCoords, energy };
}

// ─────────────────────────────────────────────
// Phase Portrait Generator (Vector Field)
// ─────────────────────────────────────────────

/**
 * Generate vector field for phase portrait visualization.
 * At each grid point: compute dS/dt = (A-I)·S direction,
 * project onto PCA space.
 * 
 * (Already included in mapBasins — forceX/forceY fields)
 * This provides an optimized sparse version for arrow overlay.
 */
export function generatePhasePortrait(
  A: Mat,
  pca: { pc1: Vec; pc2: Vec; mean: Vec },
  gridSize = 15,
  range = 2.0,
): Array<{ x: number; y: number; dx: number; dy: number; magnitude: number }> {
  const arrows: Array<{ x: number; y: number; dx: number; dy: number; magnitude: number }> = [];
  const step = (2 * range) / (gridSize - 1);
  
  // J = A - I
  const n = A.length;
  const J = A.map((row, i) => row.map((val, j) => val - (i === j ? 1 : 0)));
  
  for (let xi = 0; xi < gridSize; xi++) {
    for (let yi = 0; yi < gridSize; yi++) {
      const x = -range + xi * step;
      const y = -range + yi * step;
      
      const S = reconstructFromPCA(x, y, pca);
      
      // dS/dt = (A-I)·S = J·S
      const dS = matVec(J, S);
      
      // Project dS onto PCA
      const dx = dot(dS, pca.pc1);
      const dy = dot(dS, pca.pc2);
      const magnitude = Math.sqrt(dx * dx + dy * dy);
      
      // Normalize arrows for visualization (cap magnitude)
      const maxLen = step * 0.8;
      const scale = magnitude > maxLen ? maxLen / magnitude : 1;
      
      arrows.push({
        x, y,
        dx: dx * scale,
        dy: dy * scale,
        magnitude,
      });
    }
  }
  
  return arrows;
}

// ─────────────────────────────────────────────
// Bifurcation Detection
// ─────────────────────────────────────────────

/**
 * Detect bifurcation events by comparing fixed points between
 * two interaction matrices (before/after matrix update).
 * 
 * Birth: new attractor appears
 * Death: attractor disappears  
 * Merge: two attractors collapse into one
 * Split: one attractor splits into two
 */
export function detectBifurcation(
  oldFixedPoints: FixedPoint[],
  newFixedPoints: FixedPoint[],
): BifurcationEvent[] {
  const events: BifurcationEvent[] = [];
  const threshold = 0.2; // distance threshold for matching
  
  // Match old → new points
  const matched = new Set<number>();
  const oldMatched = new Set<number>();
  
  for (let i = 0; i < oldFixedPoints.length; i++) {
    let bestJ = -1;
    let bestDist = Infinity;
    for (let j = 0; j < newFixedPoints.length; j++) {
      if (matched.has(j)) continue;
      const dist = vecNorm(vecSub(oldFixedPoints[i].state, newFixedPoints[j].state));
      if (dist < bestDist) {
        bestDist = dist;
        bestJ = j;
      }
    }
    if (bestDist < threshold && bestJ >= 0) {
      matched.add(bestJ);
      oldMatched.add(i);
      
      // Check stability change
      if (oldFixedPoints[i].type !== newFixedPoints[bestJ].type) {
        events.push({
          type: 'split', // stability change is a local bifurcation
          timestamp: Date.now(),
          description: `Attractor "${oldFixedPoints[i].label}" changed stability: ${oldFixedPoints[i].type} → ${newFixedPoints[bestJ].type}`,
          descriptionVi: `Điểm hút "${oldFixedPoints[i].labelVi}" thay đổi tính ổn định: ${oldFixedPoints[i].type} → ${newFixedPoints[bestJ].type}`,
          affectedPoints: [oldFixedPoints[i], newFixedPoints[bestJ]],
        });
      }
    }
  }
  
  // Unmatched old points = deaths
  for (let i = 0; i < oldFixedPoints.length; i++) {
    if (!oldMatched.has(i)) {
      events.push({
        type: 'death',
        timestamp: Date.now(),
        description: `Attractor "${oldFixedPoints[i].label}" (${oldFixedPoints[i].type}) disappeared`,
        descriptionVi: `Điểm hút "${oldFixedPoints[i].labelVi}" (${oldFixedPoints[i].type}) đã biến mất`,
        affectedPoints: [oldFixedPoints[i]],
      });
    }
  }
  
  // Unmatched new points = births
  for (let j = 0; j < newFixedPoints.length; j++) {
    if (!matched.has(j)) {
      events.push({
        type: 'birth',
        timestamp: Date.now(),
        description: `New attractor "${newFixedPoints[j].label}" (${newFixedPoints[j].type}) appeared`,
        descriptionVi: `Điểm hút mới "${newFixedPoints[j].labelVi}" (${newFixedPoints[j].type}) xuất hiện`,
        affectedPoints: [newFixedPoints[j]],
      });
    }
  }
  
  // Detect merges: multiple old → single new
  // (already captured as deaths + birth, but we can detect closeness)
  const unmatched_old = [...oldMatched].length < oldFixedPoints.length;
  const unmatched_new = matched.size < newFixedPoints.length;
  if (oldFixedPoints.length > newFixedPoints.length + 1 && unmatched_old) {
    events.push({
      type: 'merge',
      timestamp: Date.now(),
      description: `Multiple attractors merged: ${oldFixedPoints.length} → ${newFixedPoints.length} fixed points`,
      descriptionVi: `Nhiều điểm hút hợp nhất: ${oldFixedPoints.length} → ${newFixedPoints.length} điểm cố định`,
      affectedPoints: oldFixedPoints.filter((_, i) => !oldMatched.has(i)),
    });
  }
  
  if (newFixedPoints.length > oldFixedPoints.length + 1 && unmatched_new) {
    events.push({
      type: 'split',
      timestamp: Date.now(),
      description: `Attractor split: ${oldFixedPoints.length} → ${newFixedPoints.length} fixed points`,
      descriptionVi: `Điểm hút phân tách: ${oldFixedPoints.length} → ${newFixedPoints.length} điểm cố định`,
      affectedPoints: newFixedPoints.filter((_, j) => !matched.has(j)),
    });
  }
  
  return events;
}

// ════════════════════════════════════════════════════════════════
// PHASE 6 — PREDICTIVE EARLY WARNING SYSTEM
// Critical Slowing Down (CSD) indicators, time-series forecasting,
// risk probability estimation, composite warning index.
// ════════════════════════════════════════════════════════════════

/**
 * CSD Indicators — Critical Slowing Down metrics
 * Dynamical systems theory: before a tipping point, variance ↑ and
 * autocorrelation at lag-1 ↑ (system takes longer to recover).
 */
export interface CSDIndicators {
  variance: number;              // recent window variance of EBH
  varianceTrend: number;         // slope of variance over sliding windows (>0 = growing)
  autocorrelation: number;       // lag-1 autocorrelation of EBH series
  autocorrelationTrend: number;  // slope of AC over sliding windows
  flickering: boolean;           // rapid zone transitions detected
  flickeringCount: number;       // number of zone changes in recent window
  skewness: number;              // right-skew = pulling toward higher EBH
  compositeIndex: number;        // weighted CSD index [0,1]
  interpretation: string;        // Vietnamese human-readable
  interpretationLevel: 'low' | 'moderate' | 'high' | 'critical';
}

/**
 * Forecast point at a specific horizon
 */
export interface ForecastPoint {
  horizon: number;               // days ahead
  horizonLabel: string;          // "1 ngày", "3 ngày", "7 ngày"
  predictedEBH: number;         // point forecast
  predictedZone: string;
  confidenceLow: number;        // 90% CI lower bound
  confidenceHigh: number;       // 90% CI upper bound
  riskProbability: number;      // P(zone >= 'risk') at this horizon
  criticalProbability: number;  // P(zone >= 'critical') at this horizon
}

/**
 * Full forecast result
 */
export interface ForecastResult {
  userId: string;
  generatedAt: number;
  currentEBH: number;
  currentZone: string;
  csd: CSDIndicators;
  forecasts: ForecastPoint[];
  trendDirection: 'improving' | 'stable' | 'deteriorating';
  trendStrength: number;         // magnitude of trend [0,1]
  compositeRisk: number;         // overall risk score [0,1]
  alertLevel: 'none' | 'watch' | 'warning' | 'alert';
  alertMessage: string;          // Vietnamese
  recommendations: string[];     // Vietnamese actionable items
}

// ─────────────────────────────────────────────
// Sliding window variance & autocorrelation
// ─────────────────────────────────────────────

/**
 * Compute variance of a numeric series.
 */
export function seriesVariance(xs: number[]): number {
  if (xs.length < 2) return 0;
  const mu = xs.reduce((a, b) => a + b, 0) / xs.length;
  return xs.reduce((a, x) => a + (x - mu) ** 2, 0) / (xs.length - 1);
}

/**
 * Compute lag-1 autocorrelation of a series.
 * AC(1) = Cov(x_t, x_{t-1}) / Var(x)
 */
export function lag1Autocorrelation(xs: number[]): number {
  if (xs.length < 3) return 0;
  const mu = xs.reduce((a, b) => a + b, 0) / xs.length;
  let cov = 0, v = 0;
  for (let i = 1; i < xs.length; i++) {
    cov += (xs[i] - mu) * (xs[i - 1] - mu);
    v += (xs[i] - mu) ** 2;
  }
  v += (xs[0] - mu) ** 2;
  return v > 1e-12 ? cov / v : 0;
}

/**
 * Compute skewness of a series (Fisher's).
 */
export function seriesSkewness(xs: number[]): number {
  if (xs.length < 3) return 0;
  const n = xs.length;
  const mu = xs.reduce((a, b) => a + b, 0) / n;
  const s2 = xs.reduce((a, x) => a + (x - mu) ** 2, 0) / (n - 1);
  const s = Math.sqrt(s2);
  if (s < 1e-12) return 0;
  const m3 = xs.reduce((a, x) => a + ((x - mu) / s) ** 3, 0) / n;
  return m3;
}

/**
 * Linear regression slope of a series (OLS).
 * Returns slope β₁ where y = β₀ + β₁·x
 */
export function linearSlope(ys: number[]): number {
  const n = ys.length;
  if (n < 2) return 0;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let i = 0; i < n; i++) {
    sx += i;
    sy += ys[i];
    sxx += i * i;
    sxy += i * ys[i];
  }
  const denom = n * sxx - sx * sx;
  return Math.abs(denom) < 1e-12 ? 0 : (n * sxy - sx * sy) / denom;
}

/**
 * Compute CSD indicators from a time series of EBH scores and zones.
 * 
 * @param ebhSeries — EBH scores ordered oldest→newest
 * @param zoneSeries — corresponding zones
 * @param windowSize — sliding window for variance/AC trends (default 5)
 */
export function computeCSDIndicators(
  ebhSeries: number[],
  zoneSeries: string[],
  windowSize: number = 5,
): CSDIndicators {
  const n = ebhSeries.length;

  // Base metrics on full series
  const variance = seriesVariance(ebhSeries);
  const ac = lag1Autocorrelation(ebhSeries);
  const skewness = seriesSkewness(ebhSeries);

  // Sliding window trends
  let varianceTrend = 0;
  let acTrend = 0;
  if (n >= windowSize * 2) {
    const varWindows: number[] = [];
    const acWindows: number[] = [];
    for (let i = 0; i <= n - windowSize; i++) {
      const window = ebhSeries.slice(i, i + windowSize);
      varWindows.push(seriesVariance(window));
      acWindows.push(lag1Autocorrelation(window));
    }
    varianceTrend = linearSlope(varWindows);
    acTrend = linearSlope(acWindows);
  }

  // Flickering: count zone transitions in recent window
  const recentZones = zoneSeries.slice(-Math.min(10, n));
  let transitions = 0;
  for (let i = 1; i < recentZones.length; i++) {
    if (recentZones[i] !== recentZones[i - 1]) transitions++;
  }
  const flickering = transitions >= 3;

  // Composite CSD index [0,1]
  // Weighted combination: variance trend (0.25), AC trend (0.25), 
  // absolute AC (0.2), flickering (0.15), skewness (0.15)
  const normVarTrend = Math.min(1, Math.max(0, varianceTrend * 20)); // scale up
  const normAcTrend = Math.min(1, Math.max(0, acTrend * 10));
  const normAc = Math.min(1, Math.max(0, ac));
  const normFlicker = flickering ? Math.min(1, transitions / 5) : 0;
  const normSkew = Math.min(1, Math.max(0, skewness / 2)); // positive skew = bad

  const compositeIndex = Math.min(1,
    0.25 * normVarTrend +
    0.25 * normAcTrend +
    0.20 * normAc +
    0.15 * normFlicker +
    0.15 * normSkew
  );

  // Interpretation
  let level: CSDIndicators['interpretationLevel'];
  let interpretation: string;
  if (compositeIndex < 0.2) {
    level = 'low';
    interpretation = 'Hệ thống ổn định, không có dấu hiệu chuyển pha.';
  } else if (compositeIndex < 0.45) {
    level = 'moderate';
    interpretation = 'Phát hiện một số dấu hiệu bất ổn. Cần theo dõi thêm.';
  } else if (compositeIndex < 0.7) {
    level = 'high';
    interpretation = 'Cảnh báo: Nhiều chỉ số CSD tăng cao. Hệ thống có thể đang tiến gần điểm chuyển pha.';
  } else {
    level = 'critical';
    interpretation = 'NGUY HIỂM: Chỉ số CSD rất cao. Hệ thống rất có thể sắp chuyển pha sang trạng thái tiêu cực.';
  }

  return {
    variance,
    varianceTrend,
    autocorrelation: ac,
    autocorrelationTrend: acTrend,
    flickering,
    flickeringCount: transitions,
    skewness,
    compositeIndex,
    interpretation,
    interpretationLevel: level,
  };
}

// ─────────────────────────────────────────────
// Double Exponential Smoothing (Holt's method)
// ─────────────────────────────────────────────

/**
 * Holt's Double Exponential Smoothing for time series with trend.
 * 
 * Level:   L(t) = α·y(t) + (1-α)·(L(t-1) + T(t-1))
 * Trend:   T(t) = β·(L(t) - L(t-1)) + (1-β)·T(t-1)
 * Forecast: F(t+h) = L(t) + h·T(t)
 * 
 * @param series — historical values (oldest→newest)
 * @param horizons — array of steps ahead to forecast
 * @param alpha — smoothing factor for level (0,1), default 0.3
 * @param beta — smoothing factor for trend (0,1), default 0.1
 * @returns predicted values at each horizon + fitted residuals for CI
 */
export function holtForecast(
  series: number[],
  horizons: number[],
  alpha: number = 0.3,
  beta: number = 0.1,
): { predictions: number[]; residuals: number[]; level: number; trend: number } {
  if (series.length < 2) {
    const val = series[0] ?? 0;
    return {
      predictions: horizons.map(() => val),
      residuals: [0],
      level: val,
      trend: 0,
    };
  }

  // Initialize: L(0) = y(0), T(0) = y(1) - y(0)
  let L = series[0];
  let T = series[1] - series[0];
  const residuals: number[] = [];

  for (let t = 1; t < series.length; t++) {
    const prevL = L;
    L = alpha * series[t] + (1 - alpha) * (L + T);
    T = beta * (L - prevL) + (1 - beta) * T;
    const fitted = prevL + T;
    residuals.push(series[t] - fitted);
  }

  // Forecast at each horizon
  const predictions = horizons.map(h => {
    const pred = L + h * T;
    return Math.max(0, Math.min(1, pred)); // clamp to [0,1] for EBH
  });

  return { predictions, residuals, level: L, trend: T };
}

/**
 * Estimate confidence intervals from residuals using standard deviation.
 * 90% CI: ±1.645σ, widening with sqrt(h) for increasing uncertainty.
 */
export function forecastConfidenceInterval(
  prediction: number,
  residuals: number[],
  horizon: number,
  zScore: number = 1.645, // 90% CI
): { low: number; high: number } {
  const sigma = Math.sqrt(seriesVariance(residuals));
  const width = zScore * sigma * Math.sqrt(horizon);
  return {
    low: Math.max(0, prediction - width),
    high: Math.min(1, prediction + width),
  };
}

// ─────────────────────────────────────────────
// Risk Probability Estimation
// ─────────────────────────────────────────────

/** EBH threshold for each risk zone — must match classifyZone() thresholds */
const ZONE_THRESHOLDS = {
  risk: 0.4,       // EBH >= 0.4 → risk zone (classifyZone uses 0.4)
  critical: 0.6,   // EBH >= 0.6 → critical  (classifyZone uses 0.6)
  black_hole: 0.8, // EBH >= 0.8 → black hole (classifyZone uses 0.8)
};

/**
 * Estimate probability of entering a zone using forecast distribution.
 * Assumes forecast ~ Normal(prediction, sigma²·h).
 * P(EBH >= threshold) = 1 - Φ((threshold - prediction) / (sigma·√h))
 */
export function estimateZoneRiskProbability(
  prediction: number,
  residuals: number[],
  horizon: number,
  threshold: number,
): number {
  const sigma = Math.sqrt(seriesVariance(residuals));
  if (sigma < 1e-8) {
    // No variance → deterministic comparison
    return prediction >= threshold ? 1.0 : 0.0;
  }
  const se = sigma * Math.sqrt(Math.max(1, horizon));
  const z = (threshold - prediction) / se;
  // Use standard normal CDF approximation (Abramowitz & Stegun)
  return 1 - normalCDF(z);
}

/**
 * Standard normal CDF approximation.
 * Abramowitz & Stegun formula 26.2.17 — max error 7.5×10⁻⁸.
 */
export function normalCDF(x: number): number {
  if (x < -8) return 0;
  if (x > 8) return 1;
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX / 2);
  return 0.5 * (1.0 + sign * y);
}

// ─────────────────────────────────────────────
// Trend Detection
// ─────────────────────────────────────────────

/**
 * Detect trend direction and strength from EBH series.
 */
export function detectTrend(ebhSeries: number[]): {
  direction: 'improving' | 'stable' | 'deteriorating';
  strength: number;
} {
  if (ebhSeries.length < 3) return { direction: 'stable', strength: 0 };

  const slope = linearSlope(ebhSeries);
  const range = Math.max(...ebhSeries) - Math.min(...ebhSeries);
  
  // Normalize strength relative to range
  const strength = range > 0.01 ? Math.min(1, Math.abs(slope) / range * ebhSeries.length) : 0;

  if (slope < -0.005 && strength > 0.1) return { direction: 'improving', strength };
  if (slope > 0.005 && strength > 0.1) return { direction: 'deteriorating', strength };
  return { direction: 'stable', strength };
}

// ─────────────────────────────────────────────
// Composite Risk Score & Alert Level
// ─────────────────────────────────────────────

/**
 * Compute composite risk score combining:
 * - Current EBH (30%)
 * - CSD composite index (25%)
 * - Trend strength × direction (20%)
 * - Max forecast risk probability (25%)
 */
export function computeCompositeRisk(
  currentEBH: number,
  csdIndex: number,
  trendDirection: string,
  trendStrength: number,
  maxRiskProb: number,
): number {
  const trendFactor = trendDirection === 'deteriorating' ? trendStrength :
                      trendDirection === 'improving'     ? -trendStrength * 0.5 : 0;
  
  return Math.min(1, Math.max(0,
    0.30 * currentEBH +
    0.25 * csdIndex +
    0.20 * Math.max(0, trendFactor) +
    0.25 * maxRiskProb
  ));
}

/**
 * Determine alert level from composite risk.
 */
export function getAlertLevel(compositeRisk: number): 'none' | 'watch' | 'warning' | 'alert' {
  if (compositeRisk < 0.20) return 'none';
  if (compositeRisk < 0.40) return 'watch';
  if (compositeRisk < 0.65) return 'warning';
  return 'alert';
}

/**
 * Generate Vietnamese alert message for given level.
 */
export function getAlertMessage(
  level: string,
  trendDirection: string,
  csdLevel: string,
  maxRiskProb: number,
  horizonLabel: string,
): string {
  switch (level) {
    case 'none':
      return 'Trạng thái ổn định. Không phát hiện nguy cơ đáng lo ngại.';
    case 'watch':
      return `Cần theo dõi: ${trendDirection === 'deteriorating' ? 'Xu hướng xấu đi.' : 'Một số chỉ số bất thường.'} Xác suất rủi ro ${(maxRiskProb * 100).toFixed(0)}% trong ${horizonLabel}.`;
    case 'warning':
      return `CẢNH BÁO: ${csdLevel === 'high' || csdLevel === 'critical' ? 'Chỉ số CSD cao — hệ thống có thể sắp chuyển pha.' : 'Xu hướng xấu đi rõ rệt.'} Xác suất rủi ro ${(maxRiskProb * 100).toFixed(0)}% trong ${horizonLabel}. Cần can thiệp.`;
    case 'alert':
      return `🚨 BÁO ĐỘNG: Nguy cơ rất cao. Xác suất chuyển vùng nguy hiểm ${(maxRiskProb * 100).toFixed(0)}% trong ${horizonLabel}. Cần can thiệp NGAY.`;
    default:
      return '';
  }
}

/**
 * Generate actionable recommendations based on alert level and CSD.
 */
export function generateForecastRecommendations(
  alertLevel: string,
  csd: CSDIndicators,
  trendDirection: string,
  currentZone: string,
): string[] {
  const recs: string[] = [];

  if (alertLevel === 'none') {
    recs.push('Tiếp tục duy trì thói quen chăm sóc sức khỏe tâm lý hiện tại.');
    return recs;
  }

  // CSD-based
  if (csd.varianceTrend > 0.01) {
    recs.push('Biến động cảm xúc đang tăng — thực hành kỹ thuật điều hòa cảm xúc (hít thở sâu, grounding).');
  }
  if (csd.autocorrelation > 0.6) {
    recs.push('Cảm xúc tiêu cực bám dai — cần phá vỡ chu kỳ bằng hoạt động thể chất hoặc kết nối xã hội.');
  }
  if (csd.flickering) {
    recs.push('Trạng thái tâm lý dao động mạnh — giảm các yếu tố kích thích, tạo routine ổn định.');
  }

  // Trend-based
  if (trendDirection === 'deteriorating') {
    recs.push('Xu hướng xấu đi — xem xét các nguồn stress gần đây và tìm cách giải quyết.');
  }

  // Zone-based
  if (currentZone === 'risk' || currentZone === 'critical' || currentZone === 'black_hole') {
    recs.push('Hiện đang trong vùng nguy hiểm — liên hệ chuyên gia tâm lý hoặc đường dây nóng 1800-599-920.');
  }

  // Alert-level specific
  if (alertLevel === 'warning' || alertLevel === 'alert') {
    recs.push('Ưu tiên giấc ngủ, dinh dưỡng và vận động trong vài ngày tới.');
    recs.push('Chia sẻ với người thân tin cậy về tình trạng hiện tại.');
  }
  if (alertLevel === 'alert') {
    recs.push('Đề nghị tham vấn chuyên gia sức khỏe tâm thần trong 24-48 giờ tới.');
  }

  return recs;
}

// ════════════════════════════════════════════════════════════════
// PHASE 7: ADAPTIVE SESSION MANAGER — Session Metrics
// ════════════════════════════════════════════════════════════════

/**
 * Compute session-level EBH delta.
 * Negative = improved, Positive = worsened.
 */
export function computeSessionDelta(
  ebhScores: number[]
): { deltaEBH: number; minEBH: number; maxEBH: number; trend: string } {
  if (ebhScores.length === 0) return { deltaEBH: 0, minEBH: 0, maxEBH: 0, trend: 'stable' };
  const startEBH = ebhScores[0];
  const endEBH = ebhScores[ebhScores.length - 1];
  const delta = endEBH - startEBH;
  const minEBH = Math.min(...ebhScores);
  const maxEBH = Math.max(...ebhScores);
  const trend = delta < -0.05 ? 'improving' : delta > 0.05 ? 'deteriorating' : 'stable';
  return { deltaEBH: delta, minEBH, maxEBH, trend };
}

/**
 * Count messages until user first reaches a safe-ish zone.
 * Returns -1 if user never reached zone threshold.
 */
export function messagesToRecovery(
  ebhScores: number[],
  threshold: number = 0.3
): number {
  // If user starts below threshold, they're already safe
  if (ebhScores.length === 0 || ebhScores[0] <= threshold) return 0;
  for (let i = 1; i < ebhScores.length; i++) {
    if (ebhScores[i] <= threshold) return i;
  }
  return -1; // never recovered
}

/**
 * Compute engagement level from message count and session duration.
 * Uses messages-per-minute as proxy for user engagement.
 */
export function computeEngagementLevel(
  messageCount: number,
  durationMinutes: number
): 'low' | 'medium' | 'high' {
  if (durationMinutes <= 0 || messageCount <= 1) return 'low';
  const rate = messageCount / durationMinutes;
  // < 0.5 msg/min = low, 0.5-2 = medium, >2 = high
  if (rate < 0.5) return 'low';
  if (rate <= 2.0) return 'medium';
  return 'high';
}

/**
 * Session effectiveness score [0, 1].
 * Combines EBH improvement, ES improvement, and recovery speed.
 */
export function sessionEffectivenessScore(params: {
  startEBH: number;
  endEBH: number;
  startES: number;
  endES: number;
  messageCount: number;
  recovered: boolean;
}): number {
  const { startEBH, endEBH, startES, endES, messageCount, recovered } = params;

  // EBH improvement component (0-0.4) — lower EBH is better
  const ebhDelta = startEBH - endEBH; // positive = improved
  const ebhScore = Math.max(0, Math.min(0.4, ebhDelta * 0.8));

  // ES improvement component (0-0.3) — higher ES is better
  const esDelta = endES - startES; // positive = improved
  const esScore = Math.max(0, Math.min(0.3, esDelta * 0.6));

  // Recovery component (0-0.2)
  const recoveryScore = recovered ? 0.2 : 0;

  // Efficiency component (0-0.1) — fewer messages = more efficient
  const efficiencyScore = messageCount > 0
    ? Math.max(0, 0.1 * (1 - Math.min(messageCount, 30) / 30))
    : 0;

  return Math.min(1, ebhScore + esScore + recoveryScore + efficiencyScore);
}

/**
 * Exponential Moving Average for time series.
 * alpha ∈ (0, 1): higher = more weight on recent values.
 */
export function exponentialMovingAverage(
  values: number[],
  alpha: number = 0.3
): number[] {
  if (values.length === 0) return [];
  const ema: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    ema.push(alpha * values[i] + (1 - alpha) * ema[i - 1]);
  }
  return ema;
}

/**
 * Estimate recovery rate: how many EBH points per message the user recovers.
 * Positive = faster recovery. Averaged over sessions.
 */
export function estimateRecoveryRate(
  sessionDeltas: Array<{ deltaEBH: number; messageCount: number }>
): number {
  const validSessions = sessionDeltas.filter(s => s.deltaEBH < 0 && s.messageCount > 1);
  if (validSessions.length === 0) return 0;
  const rates = validSessions.map(s => Math.abs(s.deltaEBH) / s.messageCount);
  return rates.reduce((sum, r) => sum + r, 0) / rates.length;
}

/**
 * Classify session type based on initial state and trajectory.
 */
export function classifySessionType(
  startEBH: number,
  startZone: string,
  trend: string
): 'crisis' | 'intervention' | 'maintenance' | 'growth' {
  if (startZone === 'critical' || startZone === 'black_hole') return 'crisis';
  if (startZone === 'risk' || startEBH >= 0.5) return 'intervention';
  if (trend === 'improving' && startEBH < 0.3) return 'growth';
  return 'maintenance';
}

/**
 * Predict optimal engagement window.
 * Uses hourly session effectiveness patterns to find best hours.
 * Returns array of recommended hours [0-23] sorted by effectiveness.
 */
export function predictOptimalHours(
  sessionHistory: Array<{ hour: number; effectiveness: number }>
): number[] {
  if (sessionHistory.length === 0) return [9, 14, 20]; // defaults: morning, afternoon, evening

  // Group by hour
  const hourMap: Record<number, number[]> = {};
  for (const s of sessionHistory) {
    if (!hourMap[s.hour]) hourMap[s.hour] = [];
    hourMap[s.hour].push(s.effectiveness);
  }

  // Average effectiveness per hour
  const hourAvg: Array<{ hour: number; avg: number }> = [];
  for (const [hour, effs] of Object.entries(hourMap)) {
    const avg = effs.reduce((s, v) => s + v, 0) / effs.length;
    hourAvg.push({ hour: parseInt(hour), avg });
  }

  // Sort by effectiveness descending
  hourAvg.sort((a, b) => b.avg - a.avg);
  return hourAvg.slice(0, 3).map(h => h.hour);
}

/**
 * Session readiness score [0, 1].
 * Assesses whether the user is ready for a productive session.
 * Factors: time since last session, last session result, current forecast.
 */
export function sessionReadinessScore(params: {
  hoursSinceLastSession: number;
  lastSessionEffectiveness: number;
  currentEBH: number;
  forecastAlertLevel: string;
}): { score: number; recommendation: string } {
  const { hoursSinceLastSession, lastSessionEffectiveness, currentEBH, forecastAlertLevel } = params;

  // Time factor (0-0.3): optimal ~12-48h spacing
  let timeFactor: number;
  if (hoursSinceLastSession < 2) timeFactor = 0.05;      // too soon
  else if (hoursSinceLastSession < 12) timeFactor = 0.15; // soon but ok
  else if (hoursSinceLastSession <= 48) timeFactor = 0.3; // optimal
  else if (hoursSinceLastSession <= 168) timeFactor = 0.2; // a bit late
  else timeFactor = 0.1; // too long since last

  // Momentum factor (0-0.3): recent progress carries forward
  const momentumFactor = Math.min(0.3, lastSessionEffectiveness * 0.5);

  // Need factor (0-0.25): higher EBH = more need for session
  const needFactor = Math.min(0.25, currentEBH * 0.4);

  // Urgency factor (0-0.15): forecast-driven
  let urgencyFactor = 0;
  if (forecastAlertLevel === 'alert') urgencyFactor = 0.15;
  else if (forecastAlertLevel === 'warning') urgencyFactor = 0.1;
  else if (forecastAlertLevel === 'watch') urgencyFactor = 0.05;

  const score = Math.min(1, timeFactor + momentumFactor + needFactor + urgencyFactor);

  // Generate recommendation
  let recommendation: string;
  if (score >= 0.7) recommendation = 'Thời điểm rất tốt để bắt đầu phiên tâm lý mới.';
  else if (score >= 0.5) recommendation = 'Có thể bắt đầu phiên mới — hiệu quả trung bình.';
  else if (score >= 0.3) recommendation = 'Chưa phải thời điểm lý tưởng — hãy thử lại sau vài giờ.';
  else recommendation = 'Nên nghỉ ngơi trước khi bắt đầu phiên tiếp theo.';

  return { score, recommendation };
}

/**
 * Compute session depth: how deeply user engaged with their emotions.
 * Based on variance of state vector changes within session.
 */
export function computeSessionDepth(
  stateVectors: Vec[]
): number {
  if (stateVectors.length < 2) return 0;

  // Compute deltas between consecutive states
  const deltas: number[] = [];
  for (let i = 1; i < stateVectors.length; i++) {
    const diff = stateVectors[i].reduce(
      (sum, v, j) => sum + Math.abs(v - stateVectors[i - 1][j]), 0
    ) / stateVectors[i].length;
    deltas.push(diff);
  }

  // Higher average delta = deeper engagement
  const avgDelta = deltas.reduce((s, v) => s + v, 0) / deltas.length;

  // Normalize to [0, 1]: delta of 0.15 per dimension ≈ deep engagement
  return Math.min(1, avgDelta / 0.15);
}

// ════════════════════════════════════════════════════════════════
// ██████  PHASE 8: COHORT ANALYTICS
// ════════════════════════════════════════════════════════════════

/**
 * Compute centroid (mean vector) of a cluster of state vectors.
 */
export function computeCentroid(vectors: Vec[]): Vec {
  if (vectors.length === 0) return [];
  const dim = vectors[0].length;
  const sum = new Array(dim).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < dim; i++) sum[i] += v[i];
  }
  return sum.map(s => s / vectors.length);
}

/**
 * Compute within-cluster variance (average squared distance to centroid).
 */
export function clusterVariance(vectors: Vec[], centroid: Vec): number {
  if (vectors.length === 0) return 0;
  let total = 0;
  for (const v of vectors) {
    let dist2 = 0;
    for (let i = 0; i < centroid.length; i++) {
      dist2 += (v[i] - centroid[i]) ** 2;
    }
    total += dist2;
  }
  return total / vectors.length;
}

/**
 * K-Means clustering for state vectors.
 * Returns cluster assignments (index per vector) and centroids.
 */
export function kMeansClustering(
  vectors: Vec[],
  k: number,
  maxIterations: number = 30
): { assignments: number[]; centroids: Vec[] } {
  if (vectors.length === 0 || k <= 0) return { assignments: [], centroids: [] };
  const n = vectors.length;
  const dim = vectors[0].length;
  k = Math.min(k, n);

  // Initialize centroids: pick k evenly spaced vectors
  const centroids: Vec[] = [];
  for (let i = 0; i < k; i++) {
    const idx = Math.floor((i * n) / k);
    centroids.push([...vectors[idx]]);
  }

  let assignments = new Array(n).fill(0);

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign each vector to nearest centroid
    const newAssignments = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let minDist = Infinity;
      let bestC = 0;
      for (let c = 0; c < k; c++) {
        let dist = 0;
        for (let d = 0; d < dim; d++) {
          dist += (vectors[i][d] - centroids[c][d]) ** 2;
        }
        if (dist < minDist) { minDist = dist; bestC = c; }
      }
      newAssignments[i] = bestC;
    }

    // Check convergence
    let changed = false;
    for (let i = 0; i < n; i++) {
      if (newAssignments[i] !== assignments[i]) { changed = true; break; }
    }
    assignments = newAssignments;
    if (!changed) break;

    // Recompute centroids
    for (let c = 0; c < k; c++) {
      const members = vectors.filter((_, i) => assignments[i] === c);
      if (members.length > 0) {
        const cent = computeCentroid(members);
        for (let d = 0; d < dim; d++) centroids[c][d] = cent[d];
      }
    }
  }

  return { assignments, centroids };
}

/**
 * Cosine similarity between two vectors.
 * Returns value in [-1, 1], higher = more similar.
 */
export function cosineSimilarity(a: Vec, b: Vec): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom > 0 ? dot / denom : 0;
}

/**
 * Compute per-dimension z-score of a user's mean state vs population.
 * Returns array of { dimension, zScore, percentile }.
 */
export function computePopulationZScores(
  userMean: Vec,
  populationMeans: Vec[]
): Array<{ dimension: number; zScore: number; percentile: number }> {
  if (populationMeans.length < 2) return [];
  const dim = userMean.length;
  const results: Array<{ dimension: number; zScore: number; percentile: number }> = [];

  for (let d = 0; d < dim; d++) {
    const vals = populationMeans.map(v => v[d] ?? 0);
    const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
    const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
    const std = Math.sqrt(variance);

    const zScore = std > 1e-9 ? (userMean[d] - mean) / std : 0;
    // Approximate percentile from z-score using logistic CDF
    const percentile = 1 / (1 + Math.exp(-1.7 * zScore));

    results.push({ dimension: d, zScore, percentile });
  }
  return results;
}

/**
 * Compute cohort recovery benchmark.
 * Given an array of session effectiveness scores for a cohort,
 * returns { mean, median, p25, p75, rank } where rank is the user's percentile.
 */
export function cohortBenchmark(
  cohortScores: number[],
  userScore: number
): { mean: number; median: number; p25: number; p75: number; rank: number } {
  if (cohortScores.length === 0) {
    return { mean: 0, median: 0, p25: 0, p75: 0, rank: 0.5 };
  }
  const sorted = [...cohortScores].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((s, v) => s + v, 0) / n;
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
  const p25 = sorted[Math.floor(n * 0.25)];
  const p75 = sorted[Math.floor(n * 0.75)];
  const rank = sorted.filter(s => s <= userScore).length / n;
  return { mean, median, p25, p75, rank };
}

/**
 * Detect common state transition patterns across population.
 * Input: array of user trajectories (each = array of zone labels).
 * Returns top-k most frequent bigram transitions with counts.
 */
export function mineTransitionPatterns(
  trajectories: string[][],
  topK: number = 10
): Array<{ from: string; to: string; count: number; probability: number }> {
  const bigramCounts: Record<string, number> = {};
  let totalBigrams = 0;

  for (const traj of trajectories) {
    for (let i = 1; i < traj.length; i++) {
      const key = `${traj[i - 1]}→${traj[i]}`;
      bigramCounts[key] = (bigramCounts[key] || 0) + 1;
      totalBigrams++;
    }
  }

  return Object.entries(bigramCounts)
    .map(([key, count]) => {
      const [from, to] = key.split('→');
      return { from, to, count, probability: totalBigrams > 0 ? count / totalBigrams : 0 };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, topK);
}

/**
 * Compute intervention effectiveness by cohort.
 * Groups interventions by type, computes mean deltaEBH per type.
 */
export function interventionEffectivenessByCohort(
  records: Array<{ interventionType: string; deltaEBH: number }>
): Array<{ type: string; count: number; avgDeltaEBH: number; successRate: number }> {
  const groups: Record<string, { deltas: number[] }> = {};

  for (const r of records) {
    if (!groups[r.interventionType]) groups[r.interventionType] = { deltas: [] };
    groups[r.interventionType].deltas.push(r.deltaEBH);
  }

  return Object.entries(groups)
    .map(([type, g]) => {
      const avg = g.deltas.reduce((s, v) => s + v, 0) / g.deltas.length;
      const successRate = g.deltas.filter(d => d < 0).length / g.deltas.length; // negative delta = improvement
      return { type, count: g.deltas.length, avgDeltaEBH: avg, successRate };
    })
    .sort((a, b) => a.avgDeltaEBH - b.avgDeltaEBH); // best (most negative) first
}

/**
 * Compute population-level summary statistics.
 */
export function populationSummary(
  ebhScores: number[],
  effectivenessScores: number[]
): {
  totalUsers: number;
  ebh: { mean: number; std: number; dangerCount: number; safeCount: number };
  effectiveness: { mean: number; std: number };
} {
  const n = ebhScores.length;
  if (n === 0) return {
    totalUsers: 0,
    ebh: { mean: 0, std: 0, dangerCount: 0, safeCount: 0 },
    effectiveness: { mean: 0, std: 0 },
  };

  const ebhMean = ebhScores.reduce((s, v) => s + v, 0) / n;
  const ebhStd = Math.sqrt(ebhScores.reduce((s, v) => s + (v - ebhMean) ** 2, 0) / n);
  const dangerCount = ebhScores.filter(e => e > 0.6).length;
  const safeCount = ebhScores.filter(e => e <= 0.3).length;

  const effMean = effectivenessScores.length > 0
    ? effectivenessScores.reduce((s, v) => s + v, 0) / effectivenessScores.length : 0;
  const effStd = effectivenessScores.length > 1
    ? Math.sqrt(effectivenessScores.reduce((s, v) => s + (v - effMean) ** 2, 0) / effectivenessScores.length) : 0;

  return {
    totalUsers: n,
    ebh: { mean: ebhMean, std: ebhStd, dangerCount, safeCount },
    effectiveness: { mean: effMean, std: effStd },
  };
}

// ════════════════════════════════════════════════════════════════
// ██████  PHASE 9: NARRATIVE INTELLIGENCE
// ════════════════════════════════════════════════════════════════

/** Vietnamese stop words for TF-IDF filtering */
const VI_STOP_WORDS = new Set([
  'của', 'và', 'là', 'có', 'nhưng', 'hoặc', 'nếu', 'thì', 'vì',
  'nên', 'rất', 'quá', 'cũng', 'đã', 'đang', 'sẽ', 'không',
  'bị', 'được', 'cho', 'đến', 'từ', 'trong', 'ngoài',
  'trên', 'dưới', 'với', 'bởi', 'theo', 'qua',
  'tôi', 'em', 'mình', 'bạn', 'nó', 'họ', 'chúng',
  'đây', 'đó', 'kia', 'này', 'nắy', 'vậy',
  'cái', 'các', 'những', 'một', 'hai', 'ba',
  'đi', 'đến', 'lên', 'xuống', 'vào', 'ra',
  'rồi', 'lắm', 'nữa', 'vẫn', 'chỉ', 'hơi',
  'biết', 'nghĩ', 'thấy', 'muốn', 'cần', 'phải',
  'còn', 'nào', 'gì', 'sao', 'ai', 'đâu',
  'làm', 'hay', 'lại', 'nửa', 'khi', 'lúc',
]);

/** Theme keywords for Vietnamese psychological context */
const THEME_KEYWORDS: Record<string, string[]> = {
  'công_việc': ['công việc', 'làm việc', 'sếp', 'đồng nghiệp', 'công ty', 'lương', 'nghỉ việc', 'thăng chức', 'deadline', 'stress công việc', 'dự án'],
  'gia_đình': ['gia đình', 'bố mẹ', 'anh chị em', 'con cái', 'chồng', 'vợ', 'bố', 'mẹ', 'nhà', 'hôn nhân', 'ly hôn'],
  'học_tập': ['học', 'thi', 'điểm', 'trường', 'lớp', 'giáo viên', 'sinh viên', 'bài tập', 'luận văn', 'đồ án'],
  'mối_quan_hệ': ['bạn bè', 'người yêu', 'chia tay', 'cô đơn', 'bị bỏ rơi', 'tin tưởng', 'phản bội', 'đổ vỡ', 'xã hội'],
  'sức_khoẻ': ['sức khỏe', 'bệnh', 'đau', 'mệt', 'giấc ngủ', 'ngủ', 'sụt cân', 'thuốc', 'bác sĩ', 'bệnh viện'],
  'tài_chính': ['tiền', 'nợ', 'trả nợ', 'thiếu tiền', 'thu nhập', 'chi tiêu', 'tiết kiệm', 'tài chính'],
  'bản_thân': ['bản thân', 'tự ti', 'xấu hổ', 'tội lỗi', 'giá trị', 'không xứng đáng', 'thất bại', 'bất lực', 'vô dụng'],
  'khủng_hoảng': ['chết', 'tự tử', 'tự hại', 'không muốn sống', 'tuyệt vọng', 'bế tắc', 'sụp đổ', 'không lối thoát'],
  'tương_lai': ['tương lai', 'mơ ước', 'kế hoạch', 'mục tiêu', 'hy vọng', 'lo lắng tương lai', 'sợ hãi'],
};

/**
 * Extract themes from text using keyword matching.
 * Returns matched themes with hit counts.
 */
export function extractThemes(
  text: string
): Array<{ theme: string; hits: number }> {
  const lower = text.toLowerCase();
  const results: Array<{ theme: string; hits: number }> = [];

  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    let hits = 0;
    for (const kw of keywords) {
      // Count occurrences
      let idx = 0;
      while ((idx = lower.indexOf(kw, idx)) !== -1) {
        hits++;
        idx += kw.length;
      }
    }
    if (hits > 0) results.push({ theme, hits });
  }

  return results.sort((a, b) => b.hits - a.hits);
}

/**
 * Compute TF-IDF scores for significant words in a corpus of documents.
 * Returns top-K terms by TF-IDF score.
 */
export function computeTfIdf(
  documents: string[],
  topK: number = 20
): Array<{ term: string; score: number }> {
  if (documents.length === 0) return [];

  // Tokenize
  const tokenized = documents.map(doc =>
    doc.toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1 && !VI_STOP_WORDS.has(w))
  );

  // Document frequency
  const df: Record<string, number> = {};
  for (const tokens of tokenized) {
    const unique = new Set(tokens);
    for (const t of unique) {
      df[t] = (df[t] || 0) + 1;
    }
  }

  // TF-IDF per term (aggregated across all docs)
  const tfidf: Record<string, number> = {};
  const N = documents.length;

  for (const tokens of tokenized) {
    const tf: Record<string, number> = {};
    for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
    const maxTf = Math.max(...Object.values(tf), 1);

    for (const [term, count] of Object.entries(tf)) {
      const normalizedTf = count / maxTf;
      const idf = Math.log((N + 1) / ((df[term] || 0) + 1)) + 1;
      tfidf[term] = (tfidf[term] || 0) + normalizedTf * idf;
    }
  }

  return Object.entries(tfidf)
    .map(([term, score]) => ({ term, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Detect linguistic markers in text.
 * Counts rumination (repetitive negative patterns), avoidance markers,
 * and hope expressions.
 */
export function detectLinguisticMarkers(texts: string[]): {
  rumination: number;   // 0-1
  avoidance: number;    // 0-1
  hopeExpression: number; // 0-1
  totalMarkers: number;
} {
  const RUMINATION_PATTERNS = [
    'tại sao', 'lúc nào cũng', 'cứ lặp lại', 'không thể ngừng',
    'suốt ngày', 'mãi không', 'luôn luôn', 'lại thế',
    'cứ nghĩ', 'không quên được', 'không bỏ được',
  ];
  const AVOIDANCE_PATTERNS = [
    'không muốn nói', 'bỏ qua đi', 'không quan trọng',
    'không sao đâu', 'thôi kệ', 'mặc kệ', 'trốn tránh',
    'không dám', 'ngại', 'sợ',
  ];
  const HOPE_PATTERNS = [
    'hy vọng', 'tin tưởng', 'sẽ tốt hơn', 'cố gắng', 'thử lại',
    'cơ hội', 'khá hơn', 'vui', 'hạnh phúc', 'biết ơn',
    'cảm ơn', 'tích cực', 'lạc quan', 'tự tin',
  ];

  let rumCount = 0, avdCount = 0, hopeCount = 0;
  const combined = texts.join(' ').toLowerCase();

  for (const p of RUMINATION_PATTERNS) {
    let idx = 0;
    while ((idx = combined.indexOf(p, idx)) !== -1) { rumCount++; idx += p.length; }
  }
  for (const p of AVOIDANCE_PATTERNS) {
    let idx = 0;
    while ((idx = combined.indexOf(p, idx)) !== -1) { avdCount++; idx += p.length; }
  }
  for (const p of HOPE_PATTERNS) {
    let idx = 0;
    while ((idx = combined.indexOf(p, idx)) !== -1) { hopeCount++; idx += p.length; }
  }

  const total = rumCount + avdCount + hopeCount;
  const maxNorm = Math.max(total, 1);

  return {
    rumination: Math.min(1, rumCount / maxNorm),
    avoidance: Math.min(1, avdCount / maxNorm),
    hopeExpression: Math.min(1, hopeCount / maxNorm),
    totalMarkers: total,
  };
}

/**
 * Detect story arcs from a sequence of EBH scores.
 * Classifies sub-sequences into crisis, recovery, or growth arcs.
 */
export function detectStoryArcs(
  ebhScores: number[],
  windowSize: number = 5
): Array<{ type: 'crisis' | 'recovery' | 'growth' | 'plateau'; startIdx: number; endIdx: number; avgEBH: number }> {
  if (ebhScores.length < windowSize) return [];

  const arcs: Array<{ type: 'crisis' | 'recovery' | 'growth' | 'plateau'; startIdx: number; endIdx: number; avgEBH: number }> = [];

  for (let i = 0; i <= ebhScores.length - windowSize; i += Math.max(1, Math.floor(windowSize / 2))) {
    const window = ebhScores.slice(i, i + windowSize);
    const avg = window.reduce((s, v) => s + v, 0) / window.length;
    const trend = window[window.length - 1] - window[0];

    let type: 'crisis' | 'recovery' | 'growth' | 'plateau';
    if (avg > 0.6 && trend > 0) type = 'crisis';
    else if (trend < -0.1) type = 'recovery';
    else if (avg < 0.3 && trend <= 0) type = 'growth';
    else type = 'plateau';

    arcs.push({ type, startIdx: i, endIdx: i + windowSize - 1, avgEBH: avg });
  }

  // Merge consecutive same-type arcs
  const merged: typeof arcs = [];
  for (const arc of arcs) {
    const last = merged[merged.length - 1];
    if (last && last.type === arc.type) {
      last.endIdx = arc.endIdx;
      last.avgEBH = (last.avgEBH + arc.avgEBH) / 2;
    } else {
      merged.push({ ...arc });
    }
  }

  return merged;
}

/**
 * Score narrative coherence: how logically consistent is the emotional trajectory.
 * Based on autocorrelation smoothness — low jitter = high coherence.
 */
export function narrativeCoherence(ebhScores: number[]): number {
  if (ebhScores.length < 3) return 0.5;

  let jitter = 0;
  for (let i = 2; i < ebhScores.length; i++) {
    // Direction change = incoherence
    const d1 = ebhScores[i - 1] - ebhScores[i - 2];
    const d2 = ebhScores[i] - ebhScores[i - 1];
    if (d1 * d2 < 0) jitter++; // sign change
  }

  const maxChanges = ebhScores.length - 2;
  return 1 - (jitter / maxChanges);
}

/**
 * Compute theme-emotion correlation.
 * Given themes per message and corresponding EBH/ES scores,
 * returns which themes correlate with higher/lower EBH.
 */
export function themeEmotionCorrelation(
  themeHits: Array<{ theme: string; hits: number }>[],
  ebhScores: number[]
): Array<{ theme: string; avgEBH: number; occurrences: number; impact: 'trigger' | 'neutral' | 'protective' }> {
  if (themeHits.length !== ebhScores.length) return [];

  const themeStats: Record<string, { totalEBH: number; count: number }> = {};

  for (let i = 0; i < themeHits.length; i++) {
    for (const th of themeHits[i]) {
      if (!themeStats[th.theme]) themeStats[th.theme] = { totalEBH: 0, count: 0 };
      themeStats[th.theme].totalEBH += ebhScores[i];
      themeStats[th.theme].count++;
    }
  }

  const overallAvgEBH = ebhScores.length > 0
    ? ebhScores.reduce((s, v) => s + v, 0) / ebhScores.length : 0;

  return Object.entries(themeStats)
    .map(([theme, stats]) => {
      const avgEBH = stats.totalEBH / stats.count;
      const impact: 'trigger' | 'neutral' | 'protective' =
        avgEBH > overallAvgEBH + 0.1 ? 'trigger' :
        avgEBH < overallAvgEBH - 0.1 ? 'protective' : 'neutral';
      return { theme, avgEBH, occurrences: stats.count, impact };
    })
    .sort((a, b) => b.avgEBH - a.avgEBH);
}

// ════════════════════════════════════════════════════════════════
// ██████  PHASE 10: RESILIENCE & GROWTH DYNAMICS
// ════════════════════════════════════════════════════════════════

export type GrowthPhase = 'decline' | 'stagnation' | 'early_growth' | 'acceleration' | 'consolidation' | 'mastery';

export interface GrowthMilestone {
  type: 'zone_upgrade' | 'resilience_gain' | 'breakthrough' | 'stability_achieved' | 'protective_activated';
  index: number;
  fromValue: number;
  toValue: number;
  significance: number;
  description: string;
}

export interface ProtectiveFactor {
  category: 'behavioral' | 'cognitive' | 'social' | 'narrative' | 'intervention';
  name: string;
  strength: number;
  activationFrequency: number;
  ebhImpact: number;
  confidence: number;
}

/**
 * Compute bounce-back rate from EBH dips.
 * Detects local peaks (dips = high EBH) and measures how quickly EBH decreases afterward.
 * Returns 0-1 where 1 = instant recovery, 0 = no recovery.
 */
export function computeBounceBackRate(ebhSeries: number[], windowSize: number = 5): number {
  if (ebhSeries.length < windowSize * 2) return 0.5;

  const recoveryRates: number[] = [];

  for (let i = windowSize; i < ebhSeries.length - windowSize; i++) {
    // Detect local peak (dip in wellbeing = high EBH)
    const before = ebhSeries.slice(i - windowSize, i);
    const after = ebhSeries.slice(i + 1, i + 1 + windowSize);
    const avgBefore = before.reduce((s, v) => s + v, 0) / before.length;
    const avgAfter = after.reduce((s, v) => s + v, 0) / after.length;

    if (ebhSeries[i] > avgBefore + 0.05 && ebhSeries[i] > avgAfter + 0.05) {
      // Found a dip peak — measure recovery speed
      const peakEBH = ebhSeries[i];
      let recoverySteps = 0;
      for (let j = i + 1; j < Math.min(i + windowSize * 2, ebhSeries.length); j++) {
        recoverySteps++;
        if (ebhSeries[j] < peakEBH * 0.7) break; // recovered 30%+
      }
      recoveryRates.push(1 - (recoverySteps / (windowSize * 2)));
    }
  }

  if (recoveryRates.length === 0) {
    // No dips detected — check if consistently low (good) or high (bad)
    const avgEBH = ebhSeries.reduce((s, v) => s + v, 0) / ebhSeries.length;
    return avgEBH < 0.3 ? 0.8 : 0.4;
  }

  return Math.max(0, Math.min(1, recoveryRates.reduce((s, v) => s + v, 0) / recoveryRates.length));
}

/**
 * Compute growth velocity using exponential moving average of EBH changes.
 * Positive velocity = EBH decreasing (improving).
 * Returns value in [-1, 1].
 */
export function computeGrowthVelocity(ebhSeries: number[], alpha: number = 0.3): number {
  if (ebhSeries.length < 3) return 0;

  let emaVelocity = 0;
  for (let i = 1; i < ebhSeries.length; i++) {
    const delta = ebhSeries[i - 1] - ebhSeries[i]; // positive = improving
    emaVelocity = alpha * delta + (1 - alpha) * emaVelocity;
  }

  return Math.max(-1, Math.min(1, emaVelocity * 5)); // scale to [-1, 1]
}

/**
 * Compute stability index from recent EBH variance.
 * High stability + low EBH = genuine resilience.
 * Returns 0-1.
 */
export function computeStabilityIndex(ebhSeries: number[], recentWindow: number = 10): number {
  if (ebhSeries.length < 3) return 0.5;

  const recent = ebhSeries.slice(-Math.min(recentWindow, ebhSeries.length));
  const mean = recent.reduce((s, v) => s + v, 0) / recent.length;
  const variance = recent.reduce((s, v) => s + (v - mean) ** 2, 0) / recent.length;

  // Low variance = high stability. Scale: var=0 → 1.0, var=0.1 → ~0.37
  return Math.exp(-variance * 10);
}

/**
 * Detect growth milestones from state history.
 * Identifies zone upgrades, sustained improvements, and breakthrough moments.
 */
export function detectGrowthMilestones(
  states: Array<{ ebhScore: number; zone: string; index: number }>
): GrowthMilestone[] {
  if (states.length < 5) return [];

  const milestones: GrowthMilestone[] = [];
  const ZONE_ORDER = ['black_hole', 'critical', 'risk', 'caution', 'safe'];

  // 1) Zone upgrades
  for (let i = 1; i < states.length; i++) {
    const prevRank = ZONE_ORDER.indexOf(states[i - 1].zone);
    const currRank = ZONE_ORDER.indexOf(states[i].zone);
    if (currRank > prevRank && prevRank >= 0) {
      milestones.push({
        type: 'zone_upgrade',
        index: states[i].index,
        fromValue: states[i - 1].ebhScore,
        toValue: states[i].ebhScore,
        significance: (currRank - prevRank) / (ZONE_ORDER.length - 1),
        description: `Vượt từ ${states[i - 1].zone} lên ${states[i].zone}`,
      });
    }
  }

  // 2) Breakthrough: largest single-step EBH drop
  let maxDrop = 0, maxDropIdx = -1;
  for (let i = 1; i < states.length; i++) {
    const drop = states[i - 1].ebhScore - states[i].ebhScore;
    if (drop > maxDrop) { maxDrop = drop; maxDropIdx = i; }
  }
  if (maxDrop > 0.1 && maxDropIdx >= 0) {
    milestones.push({
      type: 'breakthrough',
      index: states[maxDropIdx].index,
      fromValue: states[maxDropIdx - 1].ebhScore,
      toValue: states[maxDropIdx].ebhScore,
      significance: Math.min(1, maxDrop * 2),
      description: `Bước ngoặt: EBH giảm ${(maxDrop * 100).toFixed(0)}%`,
    });
  }

  // 3) Stability achieved: 5+ consecutive states in same safe/caution zone
  let streakStart = 0;
  for (let i = 1; i < states.length; i++) {
    if (states[i].zone !== states[streakStart].zone) {
      const streakLen = i - streakStart;
      if (streakLen >= 5 && ['safe', 'caution'].includes(states[streakStart].zone)) {
        milestones.push({
          type: 'stability_achieved',
          index: states[streakStart].index,
          fromValue: states[streakStart].ebhScore,
          toValue: states[i - 1].ebhScore,
          significance: Math.min(1, streakLen / 10),
          description: `Ổn định ${streakLen} phiên trong vùng ${states[streakStart].zone}`,
        });
      }
      streakStart = i;
    }
  }

  return milestones.sort((a, b) => b.significance - a.significance);
}

/**
 * Model expected recovery trajectory using logistic curve.
 * Compares to actual trajectory and classifies progress.
 */
export function modelRecoveryTrajectory(
  ebhSeries: number[],
  baselineEBH: number,
  targetEBH: number = 0.2
): {
  expectedCurve: number[];
  actualCurve: number[];
  deviation: number;
  phase: 'ahead' | 'on_track' | 'behind' | 'stalled';
  projectedSessionsToSafe: number | null;
} {
  const n = ebhSeries.length;
  if (n < 3) return { expectedCurve: [], actualCurve: ebhSeries, deviation: 0, phase: 'on_track', projectedSessionsToSafe: null };

  // Logistic decay model: E(t) = target + (baseline - target) / (1 + e^(k*(t - t0)))
  const k = 0.15;  // growth rate
  const t0 = n * 0.5; // midpoint
  const range = baselineEBH - targetEBH;

  const expectedCurve = Array.from({ length: n }, (_, t) =>
    targetEBH + range / (1 + Math.exp(k * (t - t0)))
  );

  // Deviation: mean difference (negative = ahead of expected)
  let totalDev = 0;
  for (let i = 0; i < n; i++) {
    totalDev += ebhSeries[i] - expectedCurve[i];
  }
  const deviation = totalDev / n;

  // Classify phase
  const recentActual = ebhSeries.slice(-3).reduce((s, v) => s + v, 0) / 3;
  const recentExpected = expectedCurve.slice(-3).reduce((s, v) => s + v, 0) / 3;
  const recentDelta = recentActual - recentExpected;

  let phase: 'ahead' | 'on_track' | 'behind' | 'stalled';
  if (recentDelta < -0.05) phase = 'ahead';
  else if (recentDelta < 0.05) phase = 'on_track';
  else if (computeGrowthVelocity(ebhSeries.slice(-5)) > -0.02) phase = 'stalled';
  else phase = 'behind';

  // Project sessions to safe zone using current velocity
  let projectedSessionsToSafe: number | null = null;
  if (recentActual > targetEBH) {
    const velocity = computeGrowthVelocity(ebhSeries.slice(-10));
    if (velocity > 0.01) {
      projectedSessionsToSafe = Math.ceil((recentActual - targetEBH) / (velocity * 0.2));
      if (projectedSessionsToSafe > 200) projectedSessionsToSafe = null;
    }
  } else {
    projectedSessionsToSafe = 0;
  }

  return { expectedCurve, actualCurve: ebhSeries, deviation, phase, projectedSessionsToSafe };
}

/**
 * Composite resilience index combining bounce-back, stability, growth, and protective strength.
 * Returns 0-1.
 */
export function computeResilienceIndex(params: {
  bounceBackRate: number;
  growthVelocity: number;
  stabilityIndex: number;
  protectiveStrength: number;
}): number {
  const { bounceBackRate, growthVelocity, stabilityIndex, protectiveStrength } = params;

  // Normalize growthVelocity from [-1,1] to [0,1]
  const normalizedGrowth = (growthVelocity + 1) / 2;

  // Weighted combination
  const resilience =
    0.30 * bounceBackRate +
    0.25 * normalizedGrowth +
    0.25 * stabilityIndex +
    0.20 * protectiveStrength;

  return Math.max(0, Math.min(1, resilience));
}

/**
 * Classify growth phase based on EBH trajectory and resilience.
 */
export function classifyGrowthPhase(
  ebhSeries: number[],
  resilienceIndex: number
): GrowthPhase {
  if (ebhSeries.length < 3) return 'stagnation';

  const velocity = computeGrowthVelocity(ebhSeries);
  const recentAvg = ebhSeries.slice(-5).reduce((s, v) => s + v, 0) / Math.min(5, ebhSeries.length);

  if (velocity < -0.1) return 'decline';
  if (velocity < 0.02 && resilienceIndex < 0.4) return 'stagnation';
  if (velocity >= 0.02 && velocity < 0.15) return 'early_growth';
  if (velocity >= 0.15) return 'acceleration';
  if (recentAvg < 0.25 && resilienceIndex > 0.7) return 'mastery';
  if (resilienceIndex > 0.6 && velocity >= 0) return 'consolidation';

  return 'stagnation';
}

/**
 * Estimate relapse probability based on resilience and CSD warning signals.
 * Returns 0-1.
 */
export function estimateRelapseProbability(params: {
  resilienceIndex: number;
  recentVarianceTrend: number;   // positive = increasing variance = bad
  recentAutoCorrelation: number; // higher = more persistent patterns = bad
  currentZone: string;
}): number {
  const { resilienceIndex, recentVarianceTrend, recentAutoCorrelation, currentZone } = params;

  const zoneRisk: Record<string, number> = {
    safe: 0.05, caution: 0.2, risk: 0.5, critical: 0.75, black_hole: 0.9,
  };

  const baseRisk = zoneRisk[currentZone] ?? 0.3;
  const varianceContribution = Math.max(0, recentVarianceTrend) * 0.5;
  const acContribution = Math.max(0, recentAutoCorrelation - 0.5) * 0.3;
  const resilienceProtection = resilienceIndex * 0.4;

  const prob = baseRisk + varianceContribution + acContribution - resilienceProtection;
  return Math.max(0, Math.min(1, prob));
}

/**
 * Identify protective factors from theme + intervention + EBH correlation.
 * Positive factors = those present when EBH decreases.
 */
export function identifyProtectiveFactors(
  timeline: Array<{ themes: string[]; ebhScore: number; interventionType?: string }>,
  overallAvgEBH: number
): ProtectiveFactor[] {
  if (timeline.length < 5) return [];

  const factorStats: Record<string, { totalImpact: number; count: number; recoveryCount: number }> = {};

  for (let i = 1; i < timeline.length; i++) {
    const ebhDelta = timeline[i].ebhScore - timeline[i - 1].ebhScore; // negative = improvement
    const isRecovery = ebhDelta < -0.03;

    // Themes as factors
    for (const theme of timeline[i].themes) {
      const key = `narrative:${theme}`;
      if (!factorStats[key]) factorStats[key] = { totalImpact: 0, count: 0, recoveryCount: 0 };
      factorStats[key].totalImpact += ebhDelta;
      factorStats[key].count++;
      if (isRecovery) factorStats[key].recoveryCount++;
    }

    // Intervention as factor
    if (timeline[i].interventionType) {
      const key = `intervention:${timeline[i].interventionType}`;
      if (!factorStats[key]) factorStats[key] = { totalImpact: 0, count: 0, recoveryCount: 0 };
      factorStats[key].totalImpact += ebhDelta;
      factorStats[key].count++;
      if (isRecovery) factorStats[key].recoveryCount++;
    }
  }

  return Object.entries(factorStats)
    .filter(([_, s]) => s.count >= 3) // minimum appearances
    .map(([key, stats]) => {
      const [catStr, name] = key.split(':');
      const category = catStr as ProtectiveFactor['category'];
      const avgImpact = stats.totalImpact / stats.count;
      const activationFreq = stats.count / timeline.length;

      return {
        category,
        name,
        strength: Math.max(0, Math.min(1, -avgImpact * 5)), // negative impact = protective
        activationFrequency: activationFreq,
        ebhImpact: avgImpact,
        confidence: Math.min(0.95, 0.3 + stats.count * 0.05),
      };
    })
    .filter(f => f.strength > 0.1) // only meaningful protective factors
    .sort((a, b) => b.strength - a.strength);
}

/**
 * Compute escape velocity: is current growth momentum sufficient to escape
 * the gravitational pull of negative attractors?
 * Uses kinetic energy (growth momentum) vs potential energy (residual gravity).
 */
export function computeEscapeVelocity(
  currentState: Vec,
  growthVelocity: number,
  interactionMatrix: Mat
): { escapeVelocity: number; currentMomentum: number; sufficient: boolean } {
  // Potential energy = gravitational pull toward attractors
  const pe = potentialEnergy(currentState, interactionMatrix);
  const normalizedPE = Math.abs(pe) / (currentState.length * 10); // normalize

  // Kinetic energy = growth momentum
  const ke = Math.max(0, growthVelocity); // only positive momentum counts

  // Escape velocity threshold
  const escapeVelocity = Math.sqrt(2 * normalizedPE);

  return {
    escapeVelocity,
    currentMomentum: ke,
    sufficient: ke >= escapeVelocity * 0.8, // 80% threshold for practical purposes
  };
}

/**
 * Compute growth momentum across dimensions.
 * Returns a vector showing direction of growth per psychological variable.
 * Positive values = improving, negative = worsening.
 */
export function computeGrowthMomentum(stateHistory: Vec[], windowSize: number = 5): Vec {
  if (stateHistory.length < 2) return stateHistory[0]?.map(() => 0) || [];

  const recent = stateHistory.slice(-Math.min(windowSize, stateHistory.length));
  const dim = recent[0].length;
  const momentum: number[] = new Array(dim).fill(0);

  for (let d = 0; d < dim; d++) {
    // Weighted linear regression slope per dimension
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < recent.length; i++) {
      sumX += i;
      sumY += recent[i][d];
      sumXY += i * recent[i][d];
      sumX2 += i * i;
    }
    const n = recent.length;
    const denom = n * sumX2 - sumX * sumX;
    momentum[d] = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
  }

  return momentum;
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 11: ADAPTIVE TREATMENT PLANNING & CLINICAL INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════════

export interface PrioritizedGoal {
  dimension: string;
  priority: number;       // 0-1 composite
  urgency: number;        // how bad right now
  impact: number;         // how much improvement possible
  tractability: number;   // how responsive to intervention
  currentValue: number;
  targetValue: number;
}

export interface GoalTimeline {
  estimatedSessions: number;
  weeklyMilestones: Vec[];
  confidence: number;
}

export interface GoalProgress {
  overallProgress: number;
  dimensionProgress: Record<string, number>;
}

export interface DischargeReadiness {
  score: number;          // 0-1
  ready: boolean;
  blockers: string[];
}

export interface PlanAdaptation {
  shouldAdapt: boolean;
  urgency: 'low' | 'medium' | 'high';
  reason: string;
}

export interface SessionBriefingScore {
  priority: 'routine' | 'elevated' | 'urgent';
  focusAreas: string[];
}

/**
 * Multi-criteria treatment priority ranking.
 * Priority = 0.4 * urgency + 0.35 * impact + 0.25 * tractability
 */
export function computeTreatmentPriority(
  currentState: Vec,
  targetState: Vec,
  interventionResponsiveness: number[], // per-dimension responsiveness 0-1
): PrioritizedGoal[] {
  const dim = Math.min(currentState.length, targetState.length);
  const goals: PrioritizedGoal[] = [];

  for (let d = 0; d < dim; d++) {
    const gap = Math.abs(currentState[d] - targetState[d]);
    if (gap < 0.01) continue; // already at target

    // Urgency: how far from target (normalized)
    const urgency = Math.min(1, gap);

    // Impact: how much room for improvement from current toward target
    const impact = Math.min(1, gap / Math.max(0.01, Math.abs(targetState[d])));

    // Tractability: how responsive this dimension is to interventions
    const tractability = interventionResponsiveness[d] ?? 0.5;

    const priority = 0.4 * urgency + 0.35 * impact + 0.25 * tractability;

    goals.push({
      dimension: String(d),
      priority: Math.min(1, Math.max(0, priority)),
      urgency,
      impact,
      tractability,
      currentValue: currentState[d],
      targetValue: targetState[d],
    });
  }

  goals.sort((a, b) => b.priority - a.priority);
  return goals;
}

/**
 * Projects logistic recovery curve toward target.
 * Returns estimated sessions and weekly milestone vectors.
 */
export function generateGoalTimeline(
  currentState: Vec,
  targetState: Vec,
  recoveryRate: number,        // from recovery trajectory modeling
  growthVelocity: number,      // from resilience engine
  sessionFrequency: number,    // sessions per week
): GoalTimeline {
  const dim = currentState.length;
  const effectiveRate = Math.max(0.01, recoveryRate * (1 + growthVelocity));

  // Estimate sessions via max dimension gap
  let maxGap = 0;
  for (let d = 0; d < dim; d++) {
    maxGap = Math.max(maxGap, Math.abs(currentState[d] - targetState[d]));
  }

  // Logistic growth: sessions = ln(maxGap / threshold) / effectiveRate
  const threshold = 0.05;
  const estimatedSessions = maxGap > threshold
    ? Math.ceil(Math.log(maxGap / threshold) / effectiveRate)
    : 1;

  // Generate weekly milestones
  const totalWeeks = Math.max(1, Math.ceil(estimatedSessions / Math.max(1, sessionFrequency)));
  const milestones: Vec[] = [];

  for (let w = 0; w <= totalWeeks; w++) {
    const t = w / totalWeeks;
    const logistic = 1 / (1 + Math.exp(-6 * (t - 0.5))); // S-curve 0→1
    const milestone = currentState.map((c, d) => c + (targetState[d] - c) * logistic);
    milestones.push(milestone);
  }

  // Confidence based on data quality and rate stability
  const confidence = Math.min(1, 0.3 + effectiveRate * 2 + (growthVelocity > 0 ? 0.2 : 0));

  return { estimatedSessions, weeklyMilestones: milestones, confidence: Math.min(1, confidence) };
}

/**
 * Vector projection: how far along baseline→target is the current state.
 * Returns overall progress (0-1) and per-dimension progress.
 */
export function computeGoalProgress(
  baselineState: Vec,
  currentState: Vec,
  targetState: Vec,
  dimensionNames: string[],
): GoalProgress {
  const dim = baselineState.length;
  let totalTravel = 0, totalDistance = 0;
  const dimensionProgress: Record<string, number> = {};

  for (let d = 0; d < dim; d++) {
    const fullDist = targetState[d] - baselineState[d];
    const traveled = currentState[d] - baselineState[d];

    const progress = Math.abs(fullDist) > 0.001
      ? Math.min(1, Math.max(0, traveled / fullDist))
      : 1; // already at target

    const name = dimensionNames[d] ?? `dim_${d}`;
    dimensionProgress[name] = progress;
    totalTravel += traveled * traveled;
    totalDistance += fullDist * fullDist;
  }

  const overallProgress = totalDistance > 0.001
    ? Math.min(1, Math.max(0, Math.sqrt(totalTravel) / Math.sqrt(totalDistance)))
    : 1;

  return { overallProgress, dimensionProgress };
}

/**
 * Composite discharge readiness score.
 * Uses clinical gating: all critical factors must pass minimum thresholds.
 */
export function computeDischargeReadiness(params: {
  resilienceIndex: number;
  stabilityIndex: number;
  relapseProbability: number;
  growthPhase: GrowthPhase;
  ebhScore: number;
  sessionsInSafeZone: number;
  goalCompletionRatio: number;
}): DischargeReadiness {
  const blockers: string[] = [];

  // Gates — must meet these minimums
  if (params.resilienceIndex < 0.5) blockers.push('Chỉ số phục hồi thấp (< 50%)');
  if (params.stabilityIndex < 0.6) blockers.push('Chưa đủ ổn định (< 60%)');
  if (params.relapseProbability > 0.3) blockers.push('Nguy cơ tái phát cao (> 30%)');
  if (params.ebhScore > 0.3) blockers.push('EBH score vẫn cao (> 0.3)');
  if (params.sessionsInSafeZone < 3) blockers.push('Cần ≥ 3 phiên liên tiếp trong vùng an toàn');
  if (params.goalCompletionRatio < 0.7) blockers.push('Chưa hoàn thành đủ mục tiêu (< 70%)');

  const phaseScore: Record<string, number> = {
    decline: 0, stagnation: 0.1, early_growth: 0.3,
    acceleration: 0.5, consolidation: 0.8, mastery: 1.0,
  };

  if ((phaseScore[params.growthPhase] ?? 0) < 0.5)
    blockers.push(`Giai đoạn tăng trưởng chưa đủ (${params.growthPhase})`);

  // Composite score
  const score = Math.min(1, Math.max(0,
    0.20 * params.resilienceIndex +
    0.15 * params.stabilityIndex +
    0.20 * (1 - params.relapseProbability) +
    0.15 * (1 - Math.min(1, params.ebhScore)) +
    0.10 * Math.min(1, params.sessionsInSafeZone / 5) +
    0.10 * params.goalCompletionRatio +
    0.10 * (phaseScore[params.growthPhase] ?? 0)
  ));

  return { score, ready: blockers.length === 0 && score >= 0.7, blockers };
}

/**
 * Determines when a treatment plan needs revision.
 */
export function computePlanAdaptation(params: {
  forecastTrend: 'improving' | 'stable' | 'worsening';
  actualVsExpected: number;   // deviation from recovery trajectory
  newRiskFactors: boolean;
  interventionEffectiveness: number; // 0-1
}): PlanAdaptation {
  let score = 0;
  const reasons: string[] = [];

  if (params.forecastTrend === 'worsening') { score += 0.4; reasons.push('Xu hướng dự báo xấu đi'); }
  if (params.actualVsExpected < -0.15) { score += 0.3; reasons.push('Chậm hơn quỹ đạo kỳ vọng'); }
  if (params.newRiskFactors) { score += 0.2; reasons.push('Phát hiện yếu tố rủi ro mới'); }
  if (params.interventionEffectiveness < 0.3) { score += 0.1; reasons.push('Can thiệp hiện tại kém hiệu quả'); }

  const urgency: PlanAdaptation['urgency'] = score > 0.6 ? 'high' : score > 0.3 ? 'medium' : 'low';

  return {
    shouldAdapt: score > 0.25,
    urgency,
    reason: reasons.length > 0 ? reasons.join('; ') : 'Kế hoạch đang diễn ra tốt',
  };
}

/**
 * Ranks session urgency and generates focus areas.
 */
export function computeSessionBriefingScore(params: {
  lastSessionDelta: number;     // EBH change since last session
  daysSinceLastSession: number;
  currentZone: string;
  alertLevel: string;           // from forecast
  activeGoals: number;
  completedGoals: number;
  topRiskDimensions: string[];  // top dimensions with concerning scores
}): SessionBriefingScore {
  let urgencyScore = 0;
  const focusAreas: string[] = [];

  // Zone urgency
  const zoneWeights: Record<string, number> = {
    safe: 0, caution: 0.2, risk: 0.4, critical: 0.7, black_hole: 1.0,
  };
  urgencyScore += (zoneWeights[params.currentZone] ?? 0) * 0.3;

  // Delta urgency
  if (params.lastSessionDelta > 0.1) {
    urgencyScore += 0.2;
    focusAreas.push('EBH tăng kể từ phiên trước');
  }

  // Gap urgency
  if (params.daysSinceLastSession > 14) {
    urgencyScore += 0.15;
    focusAreas.push('Khoảng cách phiên dài');
  }

  // Alert urgency
  if (params.alertLevel === 'high' || params.alertLevel === 'critical') {
    urgencyScore += 0.25;
    focusAreas.push('Cảnh báo sớm từ dự báo');
  }

  // Risk dimensions
  if (params.topRiskDimensions.length > 0) {
    focusAreas.push(...params.topRiskDimensions.slice(0, 3));
  }

  // Goal status
  if (params.activeGoals > 0 && params.completedGoals === 0) {
    focusAreas.push('Chưa hoàn thành mục tiêu nào');
  }

  const priority: SessionBriefingScore['priority'] =
    urgencyScore > 0.5 ? 'urgent' : urgencyScore > 0.25 ? 'elevated' : 'routine';

  return { priority, focusAreas };
}

// ════════════════════════════════════════════════════════════════
// PHASE 12: OUTCOMES & CONTINUOUS LEARNING ENGINE
// ════════════════════════════════════════════════════════════════

// ─── Types ───

export interface TreatmentOutcome {
  expectedProgress: number;
  actualProgress: number;
  progressIndex: number;       // actual/expected (>1 = ahead of schedule)
  variance: number;
  clinicallySignificant: boolean;
}

export interface InterventionEffectivenessResult {
  effectSize: number;          // Cohen's d equivalent
  efficacy: number;            // -1 to +1
  confidence: number;          // 0-1
}

export interface ForecastAccuracy {
  mape: number;                // Mean Absolute Percentage Error
  directionAccuracy: number;   // 0-1: % of correct trend predictions
  calibration: number;         // predicted confidence vs actual error
  bias: number;                // systematic over/under prediction
}

export interface ExpertSignalAggregation {
  avgEmpathy: number;
  avgSafety: number;
  avgAccuracy: number;
  avgCulturalFit: number;
  avgOverall: number;
  totalReviews: number;
  issueFrequency: Record<string, number>;
  retrainRate: number;
  consensusScore: number;
}

export interface OutcomesBenchmark {
  userProgressRate: number;
  cohortAvgProgressRate: number;
  percentile: number;          // 0-100
  fasterThanAvg: boolean;
}

export interface SafetyContextScore {
  contextualRisk: number;      // 0-1
  escalationRisk: number;      // 0-1
  triggerDimensions: string[];
  expertAlertLevel: 'routine' | 'elevated' | 'urgent';
}

/**
 * Compute treatment outcome: expected vs actual progress against a goal.
 * expectedTimeline in sessions, actualDuration in sessions elapsed.
 */
export function computeTreatmentOutcome(
  goalBaseline: Vec,
  currentState: Vec,
  targetState: Vec,
  expectedTimeline: number,
  actualDuration: number
): TreatmentOutcome {
  const dim = goalBaseline.length;
  if (dim === 0 || expectedTimeline <= 0) {
    return { expectedProgress: 0, actualProgress: 0, progressIndex: 0, variance: 0, clinicallySignificant: false };
  }

  // Expected progress: linear interpolation capped at 1
  const expectedProgress = Math.min(1, actualDuration / expectedTimeline);

  // Actual progress via vector projection
  let totalDist = 0, traveled = 0;
  for (let i = 0; i < dim; i++) {
    const full = targetState[i] - goalBaseline[i];
    const done = currentState[i] - goalBaseline[i];
    totalDist += full * full;
    traveled += full * done;
  }
  const actualProgress = totalDist > 0.001
    ? Math.max(0, Math.min(1, traveled / totalDist))
    : 1;

  const progressIndex = expectedProgress > 0.01
    ? actualProgress / expectedProgress
    : actualProgress > 0 ? 2 : 0;

  const variance = actualProgress - expectedProgress;

  // Clinical significance: minimum detectable effect ≥ 0.15
  const clinicallySignificant = actualProgress >= 0.15 && actualProgress > expectedProgress * 0.5;

  return { expectedProgress, actualProgress, progressIndex, variance, clinicallySignificant };
}

/**
 * Compute intervention effectiveness using effect size (Cohen's d analog).
 * Pre/post state vectors compared with pooled SD estimate.
 */
export function computeInterventionEffectiveness(
  preState: Vec,
  postState: Vec,
  sampleSize: number
): InterventionEffectivenessResult {
  const dim = preState.length;
  if (dim === 0) return { effectSize: 0, efficacy: 0, confidence: 0 };

  // Compute mean change per dimension
  let sumDelta = 0, sumDelta2 = 0;
  for (let i = 0; i < dim; i++) {
    const delta = postState[i] - preState[i];
    sumDelta += delta;
    sumDelta2 += delta * delta;
  }
  const meanDelta = sumDelta / dim;
  const sdDelta = Math.sqrt(Math.max(0, sumDelta2 / dim - meanDelta * meanDelta));

  // Effect size (Cohen's d)
  const effectSize = sdDelta > 0.01 ? meanDelta / sdDelta : meanDelta * 10;

  // Efficacy: -1 to +1 (negative = worsened overall)
  // We want negative change on negative dims to be positive efficacy
  const efficacy = Math.max(-1, Math.min(1, -effectSize * 0.5));

  // Confidence from sample size (logistic Bayesian approximation)
  const confidence = Math.min(0.95, 1 - 1 / (1 + sampleSize * 0.1));

  return { effectSize, efficacy, confidence };
}

/**
 * Compute forecast accuracy by comparing predicted EBH trajectory with actual.
 */
export function computeForecastAccuracy(
  predicted: number[],
  actual: number[]
): ForecastAccuracy {
  const n = Math.min(predicted.length, actual.length);
  if (n === 0) return { mape: 1, directionAccuracy: 0, calibration: 0, bias: 0 };

  let sumAPE = 0, correctDir = 0, sumBias = 0;

  for (let i = 0; i < n; i++) {
    const a = actual[i];
    const p = predicted[i];
    const absErr = Math.abs(p - a);
    sumAPE += a > 0.01 ? absErr / a : absErr;
    sumBias += p - a;

    if (i > 0) {
      const predDir = predicted[i] - predicted[i - 1];
      const actDir = actual[i] - actual[i - 1];
      if ((predDir >= 0 && actDir >= 0) || (predDir < 0 && actDir < 0)) {
        correctDir++;
      }
    }
  }

  const mape = sumAPE / n;
  const directionAccuracy = n > 1 ? correctDir / (n - 1) : 0;
  const bias = sumBias / n;

  // Calibration: how well prediction spread matches actual error
  const avgAbsErr = sumAPE / n;
  const calibration = Math.max(0, 1 - avgAbsErr);

  return { mape, directionAccuracy, calibration, bias };
}

/**
 * Aggregate expert review signals into a quality summary.
 */
export function aggregateExpertSignals(
  reviews: Array<{
    empathy: number; safety: number; accuracy: number;
    culturalFit: number; overall: number;
    issues: Array<{ type: string }>;
    shouldRetrain: boolean;
  }>
): ExpertSignalAggregation {
  const n = reviews.length;
  if (n === 0) {
    return {
      avgEmpathy: 0, avgSafety: 0, avgAccuracy: 0, avgCulturalFit: 0,
      avgOverall: 0, totalReviews: 0, issueFrequency: {},
      retrainRate: 0, consensusScore: 0,
    };
  }

  let sE = 0, sS = 0, sA = 0, sC = 0, sO = 0, retrainCount = 0;
  const issueCounts: Record<string, number> = {};

  for (const r of reviews) {
    sE += r.empathy; sS += r.safety; sA += r.accuracy;
    sC += r.culturalFit; sO += r.overall;
    if (r.shouldRetrain) retrainCount++;
    for (const issue of r.issues) {
      issueCounts[issue.type] = (issueCounts[issue.type] || 0) + 1;
    }
  }

  const avgOverall = sO / n;
  // Consensus: low variance in overall ratings = high consensus
  let varianceSum = 0;
  for (const r of reviews) {
    varianceSum += (r.overall - avgOverall) ** 2;
  }
  const stdDev = Math.sqrt(varianceSum / n);
  const consensusScore = Math.max(0, 1 - stdDev / 2); // stdDev=0 → 1, stdDev≥2 → 0

  return {
    avgEmpathy: sE / n, avgSafety: sS / n, avgAccuracy: sA / n,
    avgCulturalFit: sC / n, avgOverall,
    totalReviews: n,
    issueFrequency: issueCounts,
    retrainRate: retrainCount / n,
    consensusScore,
  };
}

/**
 * Compute user outcome benchmarked against a cohort.
 * progressRate = total EBH improvement per session.
 */
export function computeOutcomeBenchmark(
  userEBHStart: number,
  userEBHCurrent: number,
  userSessions: number,
  cohortProgressRates: number[]
): OutcomesBenchmark {
  const userProgressRate = userSessions > 0
    ? (userEBHStart - userEBHCurrent) / userSessions
    : 0;

  if (cohortProgressRates.length === 0) {
    return { userProgressRate, cohortAvgProgressRate: 0, percentile: 50, fasterThanAvg: userProgressRate > 0 };
  }

  const sorted = [...cohortProgressRates].sort((a, b) => a - b);
  const cohortAvgProgressRate = sorted.reduce((s, v) => s + v, 0) / sorted.length;

  // Percentile rank
  const below = sorted.filter(r => r < userProgressRate).length;
  const percentile = Math.round((below / sorted.length) * 100);

  return {
    userProgressRate,
    cohortAvgProgressRate,
    percentile,
    fasterThanAvg: userProgressRate > cohortAvgProgressRate,
  };
}

/**
 * Contextualize a safety event with psychological state data.
 * Returns risk scoring considering the user's current trajectory.
 */
export function contextualizeSafetyEvent(params: {
  eventSeverity: number;     // 0-1 from violation severity
  currentEBH: number;
  zone: string;
  trendDirection: string;
  resilienceIndex: number;
  recentVolatility: number;  // EBH std dev over recent window
}): SafetyContextScore {
  const { eventSeverity, currentEBH, zone, trendDirection, resilienceIndex, recentVolatility } = params;

  // Zone risk multiplier
  const zoneMultiplier: Record<string, number> = {
    safe: 0.3, caution: 0.6, risk: 0.8, critical: 1.0, black_hole: 1.0,
  };
  const zm = zoneMultiplier[zone] ?? 0.5;

  // Trend factor: worsening trend amplifies risk
  const trendFactor = trendDirection === 'worsening' ? 1.3
    : trendDirection === 'stable' ? 1.0 : 0.7;

  // Contextual risk
  const contextualRisk = Math.min(1,
    eventSeverity * 0.4 +
    (1 - resilienceIndex) * 0.2 +
    zm * 0.2 +
    recentVolatility * 0.2
  ) * trendFactor;

  // Escalation risk
  const escalationRisk = Math.min(1,
    contextualRisk * 0.5 +
    currentEBH * 0.3 +
    recentVolatility * 0.2
  );

  // Alert level
  const expertAlertLevel: SafetyContextScore['expertAlertLevel'] =
    contextualRisk > 0.7 ? 'urgent'
    : contextualRisk > 0.4 ? 'elevated'
    : 'routine';

  // Trigger dimensions: high EBH dims
  const triggerDimensions: string[] = [];
  if (currentEBH > 0.6) triggerDimensions.push('EBH cao');
  if (recentVolatility > 0.15) triggerDimensions.push('Biến động mạnh');
  if (trendDirection === 'worsening') triggerDimensions.push('Xu hướng xấu');
  if (resilienceIndex < 0.3) triggerDimensions.push('Phục hồi yếu');

  return { contextualRisk: Math.min(1, contextualRisk), escalationRisk, triggerDimensions, expertAlertLevel };
}

/**
 * Compute user feedback signal: maps discrete feedback to a continuous learning signal.
 * Returns a correction weight in [-1, +1] where positive = AI responded well.
 */
export function computeFeedbackSignal(
  rating: 'helpful' | 'not_helpful',
  emotionChange: 'feel_better' | 'same' | 'still_confused' | 'feel_worse'
): { signal: number; weight: number } {
  const ratingVal = rating === 'helpful' ? 1 : -1;
  const emotionVal: Record<string, number> = {
    feel_better: 1, same: 0, still_confused: -0.5, feel_worse: -1,
  };
  const eVal = emotionVal[emotionChange] ?? 0;

  // Combined signal: 60% emotion change, 40% explicit rating
  const signal = 0.6 * eVal + 0.4 * ratingVal;
  // Weight: stronger signal = more confident
  const weight = Math.abs(signal);

  return { signal, weight };
}

// ════════════════════════════════════════════════════════════════
// PHASE 13: REAL-TIME EXPERT MONITORING
// ════════════════════════════════════════════════════════════════

// ─── Types ───

export interface MonitoringThresholds {
  ebhWarning: number;      // EBH threshold to trigger warning (default 0.5)
  ebhCritical: number;     // EBH threshold to trigger critical alert (default 0.7)
  declineRateWarning: number; // EBH increase per session to flag rapid decline (default 0.15)
  volatilityWarning: number;  // Volatility threshold (default 0.2)
}

export type MonitoringAlertType =
  | 'zone_transition'   // User moved to a worse zone
  | 'ebh_threshold'     // EBH crossed a threshold
  | 'rapid_decline'     // EBH increasing fast (worsening)
  | 'forecast_warning'  // Forecast predicts bad trajectory
  | 'high_volatility';  // Emotional state is very unstable

export type MonitoringAlertSeverity = 'info' | 'warning' | 'critical';

export interface MonitoringAlertTrigger {
  type: MonitoringAlertType;
  severity: MonitoringAlertSeverity;
  message: string;
  data: Record<string, number | string>;
}

export interface UserMonitoringSnapshot {
  userId: string;
  currentEBH: number;
  currentES: number;
  zone: string;
  trend: 'improving' | 'stable' | 'declining' | 'rapid_decline';
  riskScore: number;
  sessionCount: number;
  lastActiveAt: Date;
  alertCount: number;
}

// ─── Default Thresholds ───

export const DEFAULT_MONITORING_THRESHOLDS: MonitoringThresholds = {
  ebhWarning: 0.5,
  ebhCritical: 0.7,
  declineRateWarning: 0.15,
  volatilityWarning: 0.2,
};

// ─── Functions ───

/**
 * Classify trend from recent EBH values.
 * Uses linear regression slope of last N values.
 */
export function classifyMonitoringTrend(
  ebhHistory: number[]
): 'improving' | 'stable' | 'declining' | 'rapid_decline' {
  if (ebhHistory.length < 2) return 'stable';

  const n = Math.min(ebhHistory.length, 10);
  const recent = ebhHistory.slice(-n);

  // Simple linear regression slope
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += recent[i]; sumXY += i * recent[i]; sumX2 += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);

  // Slope > 0 means EBH increasing (worsening), < 0 means decreasing (improving)
  if (slope < -0.03) return 'improving';
  if (slope > 0.08) return 'rapid_decline';
  if (slope > 0.02) return 'declining';
  return 'stable';
}

/**
 * Compute monitoring risk score combining EBH, ES, zone, and trend.
 * Range: 0 (safe) to 1 (extreme risk).
 */
export function computeMonitoringRiskScore(
  ebh: number,
  esScore: number,
  zone: string,
  trendSlope: number,
  recentVolatility: number,
): number {
  // Zone weight
  const zoneWeight: Record<string, number> = {
    safe: 0, mild: 0.15, moderate: 0.35, danger: 0.6, critical: 0.85
  };
  const zW = zoneWeight[zone] ?? 0.5;

  // EBH component (already 0-1, higher = worse)
  const ebhComponent = Math.min(1, ebh);

  // ES inverse (lower ES = more risk, ES is 0-1 where 1 = good)
  const esComponent = 1 - Math.min(1, Math.max(0, esScore));

  // Trend component (positive slope = worsening)
  const trendComponent = Math.min(1, Math.max(0, trendSlope * 3));

  // Volatility component
  const volComponent = Math.min(1, recentVolatility * 2);

  // Weighted combination
  return Math.min(1, 0.35 * ebhComponent + 0.25 * zW + 0.15 * esComponent + 0.15 * trendComponent + 0.10 * volComponent);
}

/**
 * Check if a state update should trigger a monitoring alert.
 * Compares previous and current state against thresholds.
 */
export function checkMonitoringTriggers(
  prev: { ebh: number; zone: string } | null,
  current: { ebh: number; zone: string; esScore: number },
  ebhHistory: number[],
  thresholds: MonitoringThresholds,
): MonitoringAlertTrigger[] {
  const triggers: MonitoringAlertTrigger[] = [];

  // 1. EBH threshold crossing
  if (current.ebh >= thresholds.ebhCritical && (!prev || prev.ebh < thresholds.ebhCritical)) {
    triggers.push({
      type: 'ebh_threshold',
      severity: 'critical',
      message: `EBH vượt ngưỡng nguy hiểm: ${current.ebh.toFixed(3)}`,
      data: { ebh: current.ebh, threshold: thresholds.ebhCritical },
    });
  } else if (current.ebh >= thresholds.ebhWarning && (!prev || prev.ebh < thresholds.ebhWarning)) {
    triggers.push({
      type: 'ebh_threshold',
      severity: 'warning',
      message: `EBH vượt ngưỡng cảnh báo: ${current.ebh.toFixed(3)}`,
      data: { ebh: current.ebh, threshold: thresholds.ebhWarning },
    });
  }

  // 2. Zone transition (worse)
  const ZONE_RANK: Record<string, number> = { safe: 0, mild: 1, moderate: 2, danger: 3, critical: 4 };
  if (prev) {
    const prevRank = ZONE_RANK[prev.zone] ?? 0;
    const curRank = ZONE_RANK[current.zone] ?? 0;
    if (curRank > prevRank && curRank >= 2) {
      const sev: MonitoringAlertSeverity = curRank >= 3 ? 'critical' : 'warning';
      triggers.push({
        type: 'zone_transition',
        severity: sev,
        message: `Chuyển vùng: ${prev.zone} → ${current.zone}`,
        data: { from: prev.zone, to: current.zone },
      });
    }
  }

  // 3. Rapid decline
  if (ebhHistory.length >= 3) {
    const recent3 = ebhHistory.slice(-3);
    const avgIncrease = (recent3[recent3.length - 1] - recent3[0]) / (recent3.length - 1);
    if (avgIncrease >= thresholds.declineRateWarning) {
      triggers.push({
        type: 'rapid_decline',
        severity: avgIncrease >= thresholds.declineRateWarning * 2 ? 'critical' : 'warning',
        message: `Suy giảm nhanh: EBH tăng ${avgIncrease.toFixed(3)}/lần gần đây`,
        data: { avgIncrease, recentEBH: recent3[recent3.length - 1] },
      });
    }
  }

  // 4. High volatility
  if (ebhHistory.length >= 5) {
    const recent = ebhHistory.slice(-5);
    const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
    const variance = recent.reduce((s, v) => s + (v - mean) ** 2, 0) / recent.length;
    const volatility = Math.sqrt(variance);
    if (volatility >= thresholds.volatilityWarning) {
      triggers.push({
        type: 'high_volatility',
        severity: 'warning',
        message: `Trạng thái không ổn định: volatility ${volatility.toFixed(3)}`,
        data: { volatility, mean },
      });
    }
  }

  return triggers;
}
