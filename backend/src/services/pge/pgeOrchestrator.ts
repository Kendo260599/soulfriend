/**
 * PSYCHOLOGICAL GRAVITY ENGINE — MAIN ORCHESTRATOR
 * 
 * Dịch vụ trung tâm kết nối toàn bộ PGE pipeline:
 * 
 * 1. Emotion Extraction: text → State Vector S(t)
 * 2. Matrix Learning: {S(t)} → Interaction Matrix A
 * 3. Potential Energy: U(S) = ½ SᵀWS
 * 4. Force: F = −∇U(S)
 * 5. EBH Detection: Emotional Black Hole scoring
 * 6. Trajectory Simulation: S(t+k) prediction
 * 7. Early Warning: cảnh báo sớm
 * 8. Intervention Recommendation: Positive Attractor & Escape Force (Phase 2)
 * 9. Intervention Outcome Tracking & B-matrix Learning
 * 
 * Luồng xử lý:
 * - ASYNC (fire-and-forget after each chat message)
 * - Kết quả lưu MongoDB → frontend query qua API
 * 
 * @module services/pge/pgeOrchestrator
 * @version 2.0.0 — PGE Phase 2: Positive Attractor & Escape Force
 */

import { logger } from '../../utils/logger';
import { PsychologicalState, PSY_VARIABLES, IStateVector } from '../../models/PsychologicalState';
import { InteractionMatrix, IFeedbackLoop } from '../../models/InteractionMatrix';
import { PsychologicalTrajectory } from '../../models/PsychologicalTrajectory';
import { emotionExtractionService } from './emotionExtractor';
import {
  stateToVec, vecToState, potentialEnergy, psychologicalForce,
  vecNorm, negativeInertia, detectFeedbackLoops, computeEBHScore,
  classifyZone, detectAttractor, findDominantEmotion,
  simulateTrajectory, analyzeTrajectoryWarning,
  learnInteractionMatrix, defaultInteractionMatrix,
  spectralRadius, defaultWeightMatrix, Vec,
  computeESScore, distanceToAttractor, escapeForceRequired,
} from './mathEngine';
import { interventionEngine } from './interventionEngine';
import { forecastEngine } from './forecastEngine';
import { sessionManager } from './sessionManager';
import { cohortEngine } from './cohortEngine';

// ════════════════════════════════════════════════════════════════
// CONFIGURATION
// ════════════════════════════════════════════════════════════════

/** Minimum states needed to learn matrix */
const MIN_STATES_FOR_LEARNING = 5;

/** Minimum states needed for inertia calculation */
const MIN_STATES_FOR_INERTIA = 3;

/** Number of trajectory simulation steps */
const TRAJECTORY_STEPS = 10;

/** Lambda for ridge regression */
const REGULARIZATION_LAMBDA = 0.05;

// ════════════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR
// ════════════════════════════════════════════════════════════════

class PGEOrchestrator {
  /**
   * MAIN ENTRY POINT — gọi sau mỗi user message.
   * 
   * Thực hiện toàn bộ PGE pipeline:
   * 1. Extract emotions → state vector
   * 2. Compute energy, force, EBH
   * 3. Save state to DB
   * 4. Update matrix (if enough data)
   * 5. Simulate trajectory
   * 6. Generate warnings
   */
  async processMessage(params: {
    userId: string;
    sessionId: string;
    messageIndex: number;
    userMessage: string;
  }): Promise<{
    stateVector: IStateVector;
    potentialEnergy: number;
    forceNorm: number;
    ebhScore: number;
    esScore: number;
    distanceToPA: number;
    escapeForceRequired: number;
    zone: string;
    dominantEmotion: string;
    attractorState: string;
    earlyWarning?: {
      warning: boolean;
      type?: string;
      message?: string;
    };
    trajectory?: Array<{ step: number; ebhScore: number; zone: string }>;
    intervention?: any;
    forecast?: any;
  }> {
    const { userId, sessionId, messageIndex, userMessage } = params;

    try {
      // ════════════════════════════════════════════
      // STEP 1: Emotion Extraction → State Vector
      // ════════════════════════════════════════════
      const extraction = await emotionExtractionService.extract(userMessage);
      const stateVector = extraction.stateVector;
      const S = stateToVec(stateVector);

      // ════════════════════════════════════════════
      // STEP 2: Get Interaction Matrix
      // ════════════════════════════════════════════
      const matrix = await this.getInteractionMatrix(userId);
      const A = matrix.matrix;

      // ════════════════════════════════════════════
      // STEP 3: Compute Potential Energy & Force
      // ════════════════════════════════════════════
      const W = defaultWeightMatrix();
      const U = potentialEnergy(S, W);
      const F = psychologicalForce(S, W);
      const fNorm = vecNorm(F);

      // ════════════════════════════════════════════
      // STEP 4: Get State History & Compute Inertia
      // ════════════════════════════════════════════
      const history = await this.getRecentStates(userId, sessionId);
      const historyVecs = history.map(h => stateToVec(h.stateVector));
      historyVecs.push(S); // add current

      const inertia = historyVecs.length >= MIN_STATES_FOR_INERTIA
        ? negativeInertia(historyVecs)
        : 0;

      // ════════════════════════════════════════════
      // STEP 5: Detect Feedback Loops
      // ════════════════════════════════════════════
      const loops = detectFeedbackLoops(A);
      const positiveLoops = loops.filter(l => l.type === 'positive');
      const loopStrength = positiveLoops.reduce((sum, l) => sum + Math.abs(l.totalWeight), 0);

      // ════════════════════════════════════════════
      // STEP 6: Compute EBH Score & Zone
      // ════════════════════════════════════════════
      const hopeLevel = stateVector.hope;
      const hopeDelta = history.length > 0
        ? hopeLevel - history[history.length - 1].stateVector.hope
        : 0;

      const ebhScore = computeEBHScore({
        loopStrength,
        negativeInertia: inertia,
        potentialEnergy: U,
        hopeLevel,
      });

      const zone = classifyZone(ebhScore);
      const attractorState = detectAttractor(S);
      const dominantEmotion = findDominantEmotion(S);

      // ════════════════════════════════════════════
      // STEP 7: Save State to DB
      // ════════════════════════════════════════════
      await PsychologicalState.create({
        userId,
        sessionId,
        messageIndex,
        stateVector,
        potentialEnergy: U,
        forceNorm: fNorm,
        ebhScore,
        negativeInertia: inertia,
        loopStrength,
        hopeDelta,
        zone,
        dominantEmotion,
        attractorState,
        sourceText: userMessage.substring(0, 500),
        extractionMethod: extraction.method,
        confidence: extraction.confidence,
      });

      // Invalidate forecast cache (new state means old forecast is stale)
      forecastEngine.invalidateCache(userId);
      sessionManager.invalidateCache(userId);
      cohortEngine.invalidateCache();

      // ════════════════════════════════════════════
      // STEP 8: Simulate Trajectory & Generate Warning
      // ════════════════════════════════════════════
      let earlyWarning: any = { warning: false };
      let trajectoryResult: any[] = [];

      if (ebhScore > 0.3 || zone !== 'safe') {
        // Only simulate trajectory when there's some concern
        const trajVecs = simulateTrajectory(S, A, TRAJECTORY_STEPS, 0.1);
        earlyWarning = analyzeTrajectoryWarning(trajVecs);

        // Compute EBH for each trajectory point
        trajectoryResult = trajVecs.map((tv, i) => {
          const trajU = potentialEnergy(tv, W);
          const trajEBH = computeEBHScore({
            loopStrength,
            negativeInertia: inertia,
            potentialEnergy: trajU,
            hopeLevel: tv[8], // hope index
          });
          return {
            step: i,
            stateVector: vecToState(tv),
            potentialEnergy: trajU,
            ebhScore: trajEBH,
            zone: classifyZone(trajEBH),
          };
        });

        // Save trajectory
        await PsychologicalTrajectory.create({
          userId,
          sessionId,
          initialState: stateVector,
          steps: TRAJECTORY_STEPS,
          deltaT: 0.1,
          trajectory: trajectoryResult,
          predictedZone: trajectoryResult[trajectoryResult.length - 1]?.zone || zone,
          predictedAttractor: detectAttractor(trajVecs[trajVecs.length - 1]),
          convergenceStep: this.findConvergenceStep(trajVecs),
          maxEbhScore: Math.max(...trajectoryResult.map(t => t.ebhScore)),
          earlyWarning: earlyWarning.warning,
          warningType: earlyWarning.type,
          warningMessage: earlyWarning.message,
          matrixVersion: matrix.version,
          confidence: extraction.confidence * 0.8, // trajectory confidence < extraction confidence
        });
      }

      // ════════════════════════════════════════════
      // STEP 8.5: Predictive Early Warning — Forecast (Phase 6)
      // ════════════════════════════════════════════
      let forecastData: any = null;
      try {
        forecastData = await forecastEngine.generateForecast(userId);
        // Attach forecast to the last trajectory record (if one was saved)
        if (forecastData && forecastData.alertLevel !== 'none') {
          await PsychologicalTrajectory.findOneAndUpdate(
            { userId },
            { $set: { forecast: forecastData } },
            { sort: { simulatedAt: -1 } },
          );
        }
      } catch (err) {
        logger.warn('[PGE] Forecast generation failed:', err instanceof Error ? err.message : err);
      }

      // ════════════════════════════════════════════
      // STEP 9: Intervention Recommendation (Phase 2)
      // ════════════════════════════════════════════
      let interventionRecommendation: any = null;
      const esScore = computeESScore(S);
      const dPA = distanceToAttractor(S);
      const { required: reqForce } = escapeForceRequired(A, S);

      // Record outcome of previous intervention (if any)
      interventionEngine.recordOutcome({
        userId,
        sessionId,
        postState: S,
        postEBH: ebhScore,
        interactionMatrix: A,
      }).catch(err => {
        logger.warn('[PGE] Intervention outcome recording failed:', err instanceof Error ? err.message : err);
      });

      // Get new recommendation if needed
      if (ebhScore >= 0.3 || zone !== 'safe') {
        try {
          interventionRecommendation = await interventionEngine.getRecommendation({
            userId,
            sessionId,
            currentState: S,
            interactionMatrix: A,
            ebhScore,
            zone,
            loopStrength,
            negativeInertia: inertia,
          });
        } catch (err) {
          logger.warn('[PGE] Intervention recommendation failed:', err instanceof Error ? err.message : err);
        }
      }

      // ════════════════════════════════════════════
      // STEP 10: Background Matrix Update
      // ════════════════════════════════════════════
      // Only retrain matrix periodically (every 10 messages)
      if (messageIndex > 0 && messageIndex % 10 === 0 && historyVecs.length >= MIN_STATES_FOR_LEARNING) {
        this.updateInteractionMatrix(userId, historyVecs).catch(err => {
          logger.warn('[PGE] Matrix update failed:', err instanceof Error ? err.message : err);
        });
      }

      logger.info('[PGE] processMessage completed', {
        userId: userId.substring(0, 8),
        sessionId: sessionId.substring(0, 8),
        ebhScore: ebhScore.toFixed(3),
        esScore: esScore.toFixed(3),
        zone,
        dominantEmotion,
        attractorState,
        warning: earlyWarning.warning,
        interventionRecommended: !!interventionRecommendation?.recommended,
        forecastAlert: forecastData?.alertLevel || 'none',
      });

      return {
        stateVector,
        potentialEnergy: U,
        forceNorm: fNorm,
        ebhScore,
        esScore,
        distanceToPA: dPA,
        escapeForceRequired: reqForce,
        zone,
        dominantEmotion,
        attractorState,
        earlyWarning,
        trajectory: trajectoryResult.map(t => ({
          step: t.step,
          ebhScore: t.ebhScore,
          zone: t.zone,
        })),
        intervention: interventionRecommendation,
        forecast: forecastData,
      };
    } catch (error) {
      logger.error('[PGE] processMessage failed:', error);
      throw error;
    }
  }

  // ════════════════════════════════════════════════════════════════
  // INTERACTION MATRIX MANAGEMENT
  // ════════════════════════════════════════════════════════════════

  /**
   * Get interaction matrix for user (or population default)
   */
  private async getInteractionMatrix(userId: string): Promise<{
    matrix: number[][];
    version: number;
  }> {
    try {
      // Try user-specific matrix first
      const userMatrix = await InteractionMatrix.findOne({
        userId,
        scope: 'individual',
      }).sort({ version: -1 }).lean();

      if (userMatrix) {
        return { matrix: userMatrix.matrix, version: userMatrix.version };
      }

      // Try population matrix
      const popMatrix = await InteractionMatrix.findOne({
        scope: 'population',
      }).sort({ version: -1 }).lean();

      if (popMatrix) {
        return { matrix: popMatrix.matrix, version: popMatrix.version };
      }

      // Use default (psychology theory-based)
      return { matrix: defaultInteractionMatrix(), version: 0 };
    } catch (error) {
      logger.warn('[PGE] Failed to get interaction matrix:', error);
      return { matrix: defaultInteractionMatrix(), version: 0 };
    }
  }

  /**
   * Update interaction matrix from state history (Ridge Regression)
   */
  private async updateInteractionMatrix(userId: string, stateHistory: Vec[]): Promise<void> {
    if (stateHistory.length < MIN_STATES_FOR_LEARNING) return;

    const { matrix, loss } = learnInteractionMatrix(stateHistory, REGULARIZATION_LAMBDA);
    const loops = detectFeedbackLoops(matrix);
    const sr = spectralRadius(matrix);

    // Get top interactions
    const interactions: Array<{ from: string; to: string; weight: number }> = [];
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        if (i !== j && Math.abs(matrix[i][j]) > 0.1) {
          interactions.push({
            from: PSY_VARIABLES[j],
            to: PSY_VARIABLES[i],
            weight: matrix[i][j],
          });
        }
      }
    }
    interactions.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));

    const strongest = interactions.slice(0, 10);
    const strongestPos = strongest.filter(i => i.weight > 0);
    const strongestNeg = strongest.filter(i => i.weight < 0);

    // Get current version
    const existing = await InteractionMatrix.findOne({
      userId,
      scope: 'individual',
    }).sort({ version: -1 });

    const newVersion = (existing?.version ?? 0) + 1;

    await InteractionMatrix.create({
      userId,
      scope: 'individual',
      matrix,
      dataPointCount: stateHistory.length - 1,
      lastTrainedAt: new Date(),
      regularizationLambda: REGULARIZATION_LAMBDA,
      trainingLoss: loss,
      feedbackLoops: loops,
      eigenvalues: [], // full eigendecomposition is expensive
      spectralRadius: sr,
      isStable: sr < 1,
      strongestPositive: strongestPos,
      strongestNegative: strongestNeg,
      version: newVersion,
    });

    logger.info('[PGE] Interaction matrix updated', {
      userId: userId.substring(0, 8),
      version: newVersion,
      dataPoints: stateHistory.length - 1,
      loss: loss.toFixed(4),
      spectralRadius: sr.toFixed(3),
      loops: loops.length,
    });
  }

  // ════════════════════════════════════════════════════════════════
  // QUERY HELPERS
  // ════════════════════════════════════════════════════════════════

  /**
   * Get recent states for a user in current session
   */
  private async getRecentStates(userId: string, sessionId: string): Promise<any[]> {
    return PsychologicalState.find({
      userId,
      sessionId,
    })
    .sort({ messageIndex: 1 })
    .limit(50)
    .lean();
  }

  /**
   * Find where trajectory converges (dS/dt ≈ 0)
   */
  private findConvergenceStep(trajectory: Vec[]): number {
    for (let i = 1; i < trajectory.length; i++) {
      const diff = trajectory[i].reduce((sum, v, j) => sum + Math.abs(v - trajectory[i-1][j]), 0);
      if (diff < 0.01 * trajectory[i].length) {
        return i;
      }
    }
    return -1; // did not converge
  }

  // ════════════════════════════════════════════════════════════════
  // ANALYTICS API (used by PGE routes)
  // ════════════════════════════════════════════════════════════════

  /**
   * Get user's psychological field map (recent states, trajectory, EBH trend, intervention)
   */
  async getFieldMap(userId: string, days = 30): Promise<{
    currentState: IStateVector | null;
    currentZone: string;
    currentEBH: number;
    currentES: number;
    distanceToPA: number;
    escapeForceRequired: number;
    stateHistory: Array<{
      timestamp: Date;
      ebhScore: number;
      esScore: number;
      zone: string;
      dominantEmotion: string;
      stateVector: IStateVector;
    }>;
    interactionMatrix: {
      feedbackLoops: IFeedbackLoop[];
      topInteractions: Array<{ from: string; to: string; weight: number }>;
      isStable: boolean;
      spectralRadius: number;
    };
    trajectory: {
      predictedZone: string;
      predictedAttractor: string;
      earlyWarning: boolean;
      warningMessage?: string;
    } | null;
    intervention: {
      recommended: boolean;
      type?: string;
      typeName?: string;
      description?: string;
      effectiveness?: number;
      escapeForce?: number;
      escapeRatio?: number;
      reason?: string;
      predictedEBH?: number;
      predictedES?: number;
      trajectoryComparison?: any;
      alternatives?: Array<{ type: string; typeName: string; effectiveness: number; reason: string }>;
    } | null;
    statistics: {
      averageEBH: number;
      maxEBH: number;
      averageES: number;
      timeInZones: Record<string, number>;
      dominantEmotions: Array<{ emotion: string; count: number }>;
    };
    forecast?: any;
  }> {
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);

    // Get all states in period
    const states = await PsychologicalState.find({
      userId,
      timestamp: { $gte: since },
    })
    .sort({ timestamp: -1 })
    .limit(200)
    .lean();

    const current = states[0];

    // Get latest interaction matrix
    const matrixDoc = await InteractionMatrix.findOne({
      userId,
      scope: 'individual',
    }).sort({ version: -1 }).lean();

    // Get latest trajectory
    const trajectory = await PsychologicalTrajectory.findOne({
      userId,
    }).sort({ simulatedAt: -1 }).lean();

    // Compute statistics
    const ebhScores = states.map(s => s.ebhScore);
    const avgEBH = ebhScores.length > 0
      ? ebhScores.reduce((s, v) => s + v, 0) / ebhScores.length
      : 0;
    const maxEBH = ebhScores.length > 0 ? Math.max(...ebhScores) : 0;

    // Time in zones
    const zoneCount: Record<string, number> = {};
    for (const s of states) {
      zoneCount[s.zone] = (zoneCount[s.zone] || 0) + 1;
    }
    const total = states.length || 1;
    const timeInZones: Record<string, number> = {};
    for (const [zone, count] of Object.entries(zoneCount)) {
      timeInZones[zone] = Math.round((count / total) * 100);
    }

    // Dominant emotions frequency
    const emotionCount: Record<string, number> = {};
    for (const s of states) {
      emotionCount[s.dominantEmotion] = (emotionCount[s.dominantEmotion] || 0) + 1;
    }
    const dominantEmotions = Object.entries(emotionCount)
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // ES scores
    const esScores = states.map(s => computeESScore(stateToVec(s.stateVector)));
    const avgES = esScores.length > 0
      ? esScores.reduce((s, v) => s + v, 0) / esScores.length
      : 0;

    // Current ES & PA metrics
    const currentVec = current ? stateToVec(current.stateVector) : null;
    const currentES = currentVec ? computeESScore(currentVec) : 0;
    const currentDistPA = currentVec ? distanceToAttractor(currentVec) : 0;

    // Escape force required
    const A = matrixDoc?.matrix ?? defaultInteractionMatrix();
    const currentEscapeForce = currentVec ? escapeForceRequired(A, currentVec).required : 0;

    // Intervention recommendation (if in danger zone)
    let interventionData: any = null;
    if (current && current.ebhScore >= 0.3 && currentVec) {
      try {
        interventionData = await interventionEngine.getRecommendation({
          userId,
          sessionId: current.sessionId,
          currentState: currentVec,
          interactionMatrix: A,
          ebhScore: current.ebhScore,
          zone: current.zone,
        });
      } catch (err) {
        logger.warn('[PGE] getFieldMap intervention failed:', err);
      }
    }

    return {
      currentState: current?.stateVector ?? null,
      currentZone: current?.zone ?? 'unknown',
      currentEBH: current?.ebhScore ?? 0,
      currentES,
      distanceToPA: currentDistPA,
      escapeForceRequired: currentEscapeForce,
      stateHistory: states.map((s, i) => ({
        timestamp: s.timestamp,
        ebhScore: s.ebhScore,
        esScore: esScores[i] ?? 0,
        zone: s.zone,
        dominantEmotion: s.dominantEmotion,
        stateVector: s.stateVector,
      })).reverse(), // chronological order
      interactionMatrix: {
        feedbackLoops: matrixDoc?.feedbackLoops ?? [],
        topInteractions: [
          ...(matrixDoc?.strongestPositive ?? []),
          ...(matrixDoc?.strongestNegative ?? []),
        ].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)).slice(0, 10),
        isStable: matrixDoc?.isStable ?? true,
        spectralRadius: matrixDoc?.spectralRadius ?? 0,
      },
      trajectory: trajectory ? {
        predictedZone: trajectory.predictedZone,
        predictedAttractor: trajectory.predictedAttractor ?? 'stable',
        earlyWarning: trajectory.earlyWarning,
        warningMessage: trajectory.warningMessage,
      } : null,
      intervention: interventionData,
      statistics: {
        averageEBH: Number(avgEBH.toFixed(3)),
        maxEBH: Number(maxEBH.toFixed(3)),
        averageES: Number(avgES.toFixed(3)),
        timeInZones,
        dominantEmotions,
      },
      forecast: (trajectory as any)?.forecast ?? null,
    };
  }

  /**
   * Get EBH history for trend analysis
   */
  async getEBHTrend(userId: string, days = 30): Promise<Array<{
    date: string;
    avgEBH: number;
    maxEBH: number;
    zone: string;
    messageCount: number;
  }>> {
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);

    const pipeline = [
      { $match: { userId, timestamp: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          avgEBH: { $avg: '$ebhScore' },
          maxEBH: { $max: '$ebhScore' },
          messageCount: { $sum: 1 },
          lastZone: { $last: '$zone' },
        },
      },
      { $sort: { _id: 1 as const } },
    ];

    const results = await PsychologicalState.aggregate(pipeline);
    return results.map((r: any) => ({
      date: r._id,
      avgEBH: Number((r.avgEBH ?? 0).toFixed(3)),
      maxEBH: Number((r.maxEBH ?? 0).toFixed(3)),
      zone: r.lastZone || 'safe',
      messageCount: r.messageCount,
    }));
  }

  /**
   * Get state vector evolution for a specific session
   */
  async getSessionEvolution(userId: string, sessionId: string): Promise<Array<{
    messageIndex: number;
    stateVector: IStateVector;
    ebhScore: number;
    zone: string;
    dominantEmotion: string;
  }>> {
    const states = await PsychologicalState.find({
      userId,
      sessionId,
    }).sort({ messageIndex: 1 }).lean();

    return states.map(s => ({
      messageIndex: s.messageIndex,
      stateVector: s.stateVector,
      ebhScore: s.ebhScore,
      zone: s.zone,
      dominantEmotion: s.dominantEmotion,
    }));
  }

  /**
   * Population-level matrix update (cron job)
   */
  async updatePopulationMatrix(): Promise<void> {
    try {
      // Get all recent states
      const since = new Date(Date.now() - 90 * 24 * 3600 * 1000); // 90 days
      const states = await PsychologicalState.find({
        timestamp: { $gte: since },
      }).sort({ userId: 1, timestamp: 1 }).limit(5000).lean();

      if (states.length < 50) {
        logger.info('[PGE] Not enough data for population matrix update');
        return;
      }

      // Group by user+session and create sequences
      const sequences: Vec[][] = [];
      let currentKey = '';
      let currentSeq: Vec[] = [];

      for (const s of states) {
        const key = `${s.userId}-${s.sessionId}`;
        if (key !== currentKey) {
          if (currentSeq.length >= 3) sequences.push(currentSeq);
          currentSeq = [];
          currentKey = key;
        }
        currentSeq.push(stateToVec(s.stateVector));
      }
      if (currentSeq.length >= 3) sequences.push(currentSeq);

      // Merge all sequences into one
      const allStates: Vec[] = [];
      for (const seq of sequences) {
        allStates.push(...seq);
      }

      if (allStates.length < MIN_STATES_FOR_LEARNING) return;

      const { matrix, loss } = learnInteractionMatrix(allStates, REGULARIZATION_LAMBDA);
      const loops = detectFeedbackLoops(matrix);
      const sr = spectralRadius(matrix);

      const existing = await InteractionMatrix.findOne({
        scope: 'population',
      }).sort({ version: -1 });

      await InteractionMatrix.create({
        userId: 'population',
        scope: 'population',
        matrix,
        dataPointCount: allStates.length - 1,
        lastTrainedAt: new Date(),
        regularizationLambda: REGULARIZATION_LAMBDA,
        trainingLoss: loss,
        feedbackLoops: loops,
        eigenvalues: [],
        spectralRadius: sr,
        isStable: sr < 1,
        strongestPositive: [],
        strongestNegative: [],
        version: (existing?.version ?? 0) + 1,
      });

      logger.info('[PGE] Population matrix updated', {
        dataPoints: allStates.length,
        loss: loss.toFixed(4),
        spectralRadius: sr.toFixed(3),
      });
    } catch (error) {
      logger.error('[PGE] Population matrix update failed:', error);
    }
  }
}

export const pgeOrchestrator = new PGEOrchestrator();
export default pgeOrchestrator;
