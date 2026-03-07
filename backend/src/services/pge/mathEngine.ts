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
  let v = Array.from({ length: n }, () => Math.random());
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
          const totalWeight = [...weights, edge.weight].reduce((s, w) => s + w, 0);
          const avgWeight = totalWeight / weights.length + 1;
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
