/**
 * TOPOLOGY MAPPER SERVICE
 *
 * PGE Phase 3 — Psychological Landscape & Dynamical Topology
 *
 * Orchestrates:
 * - Fixed-point discovery (equilibria of emotional dynamics)
 * - Stability classification (stable/unstable/saddle via eigenvalues)
 * - Basin-of-attraction mapping (which initial states flow to which attractor)
 * - Potential energy landscape surface (2D PCA projection)
 * - Phase portrait (vector field arrows)
 * - Bifurcation event detection (when matrix updates change topology)
 * - Topology profile classification for intervention routing (Phase 4)
 *
 * @module services/pge/topologyMapper
 * @version 3.0.0 — PGE Phase 3
 */

import { logger } from '../../utils/logger';
import PsychologicalState, { PSY_DIMENSION } from '../../models/PsychologicalState';
import InteractionMatrix from '../../models/InteractionMatrix';
import {
  Vec, Mat,
  stateToVec, zeros,
  defaultInteractionMatrix, defaultWeightMatrix,
  simulateTrajectory, vecNorm, vecSub,
  computeEBHScore, computeESScore, potentialEnergy,
  classifyZone, detectAttractor, positiveAttractor,
  distanceToAttractor,
  // Phase 3 functions
  computePCA, projectToPCA, reconstructFromPCA,
  findFixedPoints, mapBasins, generateLandscapeSurface,
  generatePhasePortrait, detectBifurcation,
  TopologyData, FixedPoint, BasinCell, BifurcationEvent,
} from './mathEngine';

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════

export type TopologyProfile =
  | 'fragile'        // 1 deep negative attractor, weak positive
  | 'chaotic'        // many unstable points, no clear stable basin
  | 'stuck'          // strong inertia toward current (not-great) state
  | 'resilient'      // strong positive attractor, shallow negative basins
  | 'transitional';  // between basins, direction uncertain

export interface TopologyProfileInfo {
  profile: TopologyProfile;
  confidence: number;        // [0,1]
  description: string;       // Vietnamese description
  dominantAttractor: string; // label of strongest attractor
  numStable: number;
  numUnstable: number;
  numSaddle: number;
}

export interface FullTopologyResult {
  topology: TopologyData;
  profile: TopologyProfileInfo;
  landscape: {
    x: number[];
    y: number[];
    energy: number[][];
  };
  phasePortrait: Array<{ x: number; y: number; dx: number; dy: number; magnitude: number }>;
}

// ═══════════════════════════════════════════════════
// CACHE — topologies are expensive, cache per-user
// ═══════════════════════════════════════════════════

interface TopologyCache {
  result: FullTopologyResult;
  matrixHash: string;
  timestamp: number;
}

const cache = new Map<string, TopologyCache>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function matrixHash(A: Mat): string {
  // Fast hash: sample diagonal + corners + frobenius
  let h = 0;
  for (let i = 0; i < A.length; i++) {
    h += A[i][i] * (i + 1);
    if (i < A.length - 1) h += A[i][i + 1] * 0.1;
  }
  return h.toFixed(6);
}

// ═══════════════════════════════════════════════════
// MAIN SERVICE
// ═══════════════════════════════════════════════════

class TopologyMapperService {

  /**
   * Compute full topology for a user.
   * Returns fixed points, basins, landscape, phase portrait, user position.
   */
  async computeTopology(userId: string): Promise<FullTopologyResult> {
    try {
      // 1. Get user's interaction matrix
      const A = await this.getUserMatrix(userId);
      const W = defaultWeightMatrix();

      // Check cache
      const hash = matrixHash(A);
      const cached = cache.get(userId);
      if (cached && cached.matrixHash === hash && Date.now() - cached.timestamp < CACHE_TTL) {
        // Update user position even with cached topology
        const currentState = await this.getCurrentState(userId);
        const states = await this.getStateHistory(userId, 50);
        if (currentState) {
          cached.result.topology.userPosition = projectToPCA(
            currentState, cached.result.topology.pcaAxes
          );
          cached.result.topology.userTrajectory = states.map(
            s => projectToPCA(s, cached.result.topology.pcaAxes)
          );
        }
        return cached.result;
      }

      // 2. Get state history for PCA
      const states = await this.getStateHistory(userId, 100);
      const currentState = await this.getCurrentState(userId);

      // 3. Compute PCA from state history
      const pca = computePCA(states.length >= 3 ? states : [
        zeros(PSY_DIMENSION),
        positiveAttractor(),
        currentState || zeros(PSY_DIMENSION),
      ]);

      // 4. Find fixed points
      logger.info(`[TopologyMapper] Finding fixed points for user ${userId}`);
      const fixedPoints = findFixedPoints(A, 15);
      logger.info(`[TopologyMapper] Found ${fixedPoints.length} fixed points`);

      // 5. Map basins of attraction
      const basins = mapBasins(A, fixedPoints, pca, 25, W);

      // 6. Assign basin indices to fixed points
      const stablePoints = fixedPoints.filter(fp => fp.type === 'stable');
      fixedPoints.forEach(fp => {
        let bestBasin = -1;
        let bestDist = Infinity;
        stablePoints.forEach((sp, i) => {
          const d = vecNorm(vecSub(fp.state, sp.state));
          if (d < bestDist) { bestDist = d; bestBasin = i; }
        });
        fp.basin = bestBasin;
      });

      // 7. User position in PCA space
      const userPos = currentState
        ? projectToPCA(currentState, pca)
        : { x: 0, y: 0 };
      const userTrajectory = states.map(s => projectToPCA(s, pca));

      // 8. Landscape surface
      const landscape = generateLandscapeSurface(pca, W, 30, 2.0);

      // 9. Phase portrait
      const phasePortrait = generatePhasePortrait(A, pca, 12, 2.0);

      // 10. Classify topology profile
      const profile = this.classifyTopologyProfile(
        fixedPoints, currentState || zeros(PSY_DIMENSION), A
      );

      // 11. Build result
      const result: FullTopologyResult = {
        topology: {
          fixedPoints,
          basins,
          pcaAxes: pca,
          gridSize: 25,
          userPosition: userPos,
          userTrajectory,
          bifurcationEvents: [],
        },
        profile,
        landscape,
        phasePortrait,
      };

      // Update cache
      cache.set(userId, { result, matrixHash: hash, timestamp: Date.now() });

      return result;
    } catch (error) {
      logger.error('[TopologyMapper] Error computing topology:', error);
      throw error;
    }
  }

  /**
   * Detect bifurcation when matrix is updated.
   * Call this before/after matrix learning.
   */
  async detectMatrixBifurcation(
    userId: string,
    oldMatrix: Mat,
    newMatrix: Mat,
  ): Promise<BifurcationEvent[]> {
    try {
      const oldFP = findFixedPoints(oldMatrix, 10);
      const newFP = findFixedPoints(newMatrix, 10);
      const events = detectBifurcation(oldFP, newFP);

      if (events.length > 0) {
        logger.info(`[TopologyMapper] Bifurcation detected for user ${userId}:`,
          events.map(e => e.descriptionVi));
        
        // Update cached topology with bifurcation events
        const cached = cache.get(userId);
        if (cached) {
          cached.result.topology.bifurcationEvents = [
            ...events,
            ...cached.result.topology.bifurcationEvents.slice(0, 10), // keep last 10
          ];
        }
      }

      return events;
    } catch (error) {
      logger.error('[TopologyMapper] Bifurcation detection failed:', error);
      return [];
    }
  }

  // ═══════════════════════════════════════════════════
  // TOPOLOGY PROFILE CLASSIFICATION (Phase 4 bridge)
  // ═══════════════════════════════════════════════════

  /**
   * Classify the user's psychological topology into a profile type.
   * Used by intervention engine to select strategies.
   */
  classifyTopologyProfile(
    fixedPoints: FixedPoint[],
    currentState: Vec,
    A: Mat,
  ): TopologyProfileInfo {
    const stable = fixedPoints.filter(fp => fp.type === 'stable');
    const unstable = fixedPoints.filter(fp => fp.type === 'unstable');
    const saddle = fixedPoints.filter(fp => fp.type === 'saddle');

    // Find which stable point user is closest to
    let closestStable: FixedPoint | null = null;
    let closestDist = Infinity;
    for (const fp of stable) {
      const d = vecNorm(vecSub(currentState, fp.state));
      if (d < closestDist) { closestDist = d; closestStable = fp; }
    }

    // Analyze negative vs positive attractors
    const negativeAttractors = stable.filter(fp =>
      ['depression', 'burnout', 'anxiety_spiral', 'disengagement'].includes(fp.label)
    );
    const positiveAttractors = stable.filter(fp =>
      ['growth', 'recovery'].includes(fp.label)
    );

    let profile: TopologyProfile;
    let confidence: number;
    let description: string;

    // ── FRAGILE: deep negative attractor dominates ──
    if (negativeAttractors.length > 0 && positiveAttractors.length === 0) {
      profile = 'fragile';
      confidence = 0.8;
      description = 'Hệ thống cảm xúc có xu hướng bị hút về vùng tiêu cực mạnh. ' +
        'Không có điểm hút tích cực rõ ràng. Cần xây dựng nguồn lực xã hội.';
    }
    // ── CHAOTIC: many unstable points, no clear direction ──
    else if (unstable.length >= 3 || (saddle.length > stable.length)) {
      profile = 'chaotic';
      confidence = 0.7;
      description = 'Trạng thái cảm xúc không ổn định, dao động giữa nhiều hướng. ' +
        'Cần kỹ thuật grounding để ổn định trước khi can thiệp sâu.';
    }
    // ── STUCK: user near a moderate attractor with high inertia ──
    else if (closestDist < 0.3 && closestStable &&
             !['growth', 'recovery'].includes(closestStable.label)) {
      profile = 'stuck';
      confidence = 0.75;
      description = `Đang bị "mắc kẹt" gần trạng thái "${closestStable.labelVi}". ` +
        'Quán tính cảm xúc cao. Cần tái cấu trúc nhận thức để tạo đột phá.';
    }
    // ── RESILIENT: strong positive attractor ──
    else if (positiveAttractors.length > 0 && 
             closestStable && ['growth', 'recovery'].includes(closestStable.label)) {
      profile = 'resilient';
      confidence = 0.8;
      description = 'Hệ thống cảm xúc có độ đàn hồi tốt với điểm hút tích cực mạnh. ' +
        'Tập trung duy trì và kích hoạt hành vi tích cực.';
    }
    // ── TRANSITIONAL: between basins ──
    else {
      profile = 'transitional';
      confidence = 0.6;
      description = 'Đang ở giai đoạn chuyển tiếp giữa các trạng thái cảm xúc. ' +
        'Hướng đi chưa rõ ràng — can thiệp có thể tạo ảnh hưởng lớn.';
    }

    const dominantAttractor = closestStable?.label || 'unknown';

    return {
      profile,
      confidence,
      description,
      dominantAttractor,
      numStable: stable.length,
      numUnstable: unstable.length,
      numSaddle: saddle.length,
    };
  }

  // ═══════════════════════════════════════════════════
  // DATA ACCESS HELPERS
  // ═══════════════════════════════════════════════════

  private async getUserMatrix(userId: string): Promise<Mat> {
    try {
      const matrixDoc = await InteractionMatrix.findOne({
        userId,
        scope: 'individual',
      }).sort({ updatedAt: -1 });

      if (matrixDoc?.matrix) {
        return matrixDoc.matrix as unknown as Mat;
      }

      // Fallback to population matrix
      const popMatrix = await InteractionMatrix.findOne({
        scope: 'population',
      }).sort({ updatedAt: -1 });

      if (popMatrix?.matrix) {
        return popMatrix.matrix as unknown as Mat;
      }

      return defaultInteractionMatrix();
    } catch {
      return defaultInteractionMatrix();
    }
  }

  private async getCurrentState(userId: string): Promise<Vec | null> {
    try {
      const latest = await PsychologicalState.findOne({ userId })
        .sort({ extractedAt: -1 });
      if (latest?.stateVector) {
        return stateToVec(latest.stateVector);
      }
      return null;
    } catch {
      return null;
    }
  }

  private async getStateHistory(userId: string, limit: number): Promise<Vec[]> {
    try {
      const states = await PsychologicalState.find({ userId })
        .sort({ extractedAt: -1 })
        .limit(limit)
        .lean();

      return states
        .reverse()
        .filter(s => s.stateVector)
        .map(s => stateToVec(s.stateVector));
    } catch {
      return [];
    }
  }

  /**
   * Invalidate cache for user (e.g., after matrix update)
   */
  invalidateCache(userId: string): void {
    cache.delete(userId);
  }
}

export const topologyMapper = new TopologyMapperService();
