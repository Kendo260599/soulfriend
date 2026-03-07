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
 * @version 1.0.0
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
    // dS = A·S
    let dS = matVec(A, S);

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
 */
export function findOptimalIntervention(
  S: Vec,
  A: Mat,
  B?: Mat,
  steps = 5,
  dt = 0.1,
  intensityLevels = [0.5, 0.7, 1.0],
): InterventionCandidate[] {
  const interventionB = B ?? defaultInterventionMatrix();
  const S_PA = positiveAttractor();
  const W = defaultWeightMatrix();
  const { required: internalForce } = escapeForceRequired(A, S);

  const candidates: InterventionCandidate[] = [];

  // Current state metrics (baseline)
  const currentEBH = computeEBHScore({
    loopStrength: 0, // simplified — use 0 for comparison
    negativeInertia: 0,
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
        loopStrength: 0,
        negativeInertia: 0,
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
      loopStrength: 0,
      negativeInertia: 0,
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
