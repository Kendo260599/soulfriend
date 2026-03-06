/**
 * AI EXPERIMENT ENGINE
 * 
 * V5 Learning Pipeline — Module 7: AI Experimentation System
 * Mở rộng A/B testing hiện có thành full experiment platform
 * 
 * @module services/aiExperimentEngine
 * @version 5.0.0
 */

import ABExperiment from '../models/ABExperiment';
import InteractionEvent from '../models/InteractionEvent';
import EvaluationScore from '../models/EvaluationScore';
import UserFeedback from '../models/UserFeedback';
import { logger } from '../utils/logger';

interface ExperimentConfig {
  name: string;
  description: string;
  variants: Array<{
    id: string;
    name: string;
    config: Record<string, any>; // prompt, temperature, etc.
    allocation: number; // % traffic (0-100)
  }>;
  metrics: string[]; // ['session_length', 'helpfulness_rating', 'crisis_escalation_rate']
  startDate: Date;
  endDate?: Date;
  minSampleSize: number;
}

interface ExperimentResult {
  experimentId: string;
  variantId: string;
  metrics: Record<string, number>;
  sampleSize: number;
  confidence: number;
  isWinner: boolean;
}

class AIExperimentEngine {
  private activeExperiments: Map<string, ExperimentConfig> = new Map();

  /**
   * Tạo experiment mới
   */
  async createExperiment(config: ExperimentConfig): Promise<any> {
    try {
      // Validate allocations sum to 100
      const totalAllocation = config.variants.reduce((sum, v) => sum + v.allocation, 0);
      if (totalAllocation !== 100) {
        throw new Error(`Variant allocations must sum to 100, got ${totalAllocation}`);
      }

      const experiment = new ABExperiment({
        name: config.name,
        description: config.description,
        variants: config.variants,
        metrics: config.metrics,
        startDate: config.startDate,
        endDate: config.endDate,
        minSampleSize: config.minSampleSize,
        status: 'active',
        results: {},
      });

      const saved = await experiment.save();
      this.activeExperiments.set((saved as any)._id.toString(), config);

      logger.info(`[AIExperiment] Created experiment: ${config.name}`);
      return saved;
    } catch (error) {
      logger.error('[AIExperiment] Failed to create experiment:', error);
      throw error;
    }
  }

  /**
   * Assign user to variant
   */
  assignVariant(experimentId: string, userId: string): string | null {
    const config = this.activeExperiments.get(experimentId);
    if (!config) return null;

    // Deterministic assignment based on userId hash
    const hash = this.hashString(`${experimentId}:${userId}`);
    const bucket = hash % 100;

    let cumulative = 0;
    for (const variant of config.variants) {
      cumulative += variant.allocation;
      if (bucket < cumulative) {
        return variant.id;
      }
    }

    return config.variants[0].id;
  }

  /**
   * Phân tích kết quả experiment
   */
  async analyzeExperiment(experimentId: string): Promise<any> {
    try {
      const experiment = await ABExperiment.findById(experimentId).lean();
      if (!experiment) throw new Error('Experiment not found');

      const results: ExperimentResult[] = [];

      for (const variant of (experiment as any).variants || []) {
        // Get interactions for this variant
        const interactions = await InteractionEvent.find({
          'topicCategory': `experiment:${experimentId}:${variant.id}`,
        }).lean();

        if (!interactions.length) {
          results.push({
            experimentId,
            variantId: variant.id,
            metrics: {},
            sampleSize: 0,
            confidence: 0,
            isWinner: false,
          });
          continue;
        }

        // Calculate metrics
        const interactionIds = interactions.map(i => i._id);

        // Avg session length
        const avgSessionLength = interactions.reduce((sum: number, i: any) => sum + i.conversationDepth, 0) / interactions.length;

        // Helpfulness rating
        const feedbacks = await UserFeedback.find({
          interactionEventId: { $in: interactionIds },
        }).lean();
        const helpfulRate = feedbacks.length
          ? feedbacks.filter(f => f.rating === 'helpful').length / feedbacks.length
          : 0;

        // Evaluation scores
        const evaluations = await EvaluationScore.find({
          interactionEventId: { $in: interactionIds },
        }).lean();
        const avgOverallScore = evaluations.length
          ? evaluations.reduce((sum: number, e: any) => sum + e.overallScore, 0) / evaluations.length
          : 0;

        // Escalation rate
        const escalationRate = interactions.filter(i => i.escalationTriggered).length / interactions.length;

        results.push({
          experimentId,
          variantId: variant.id,
          metrics: {
            avgSessionLength: Number(avgSessionLength.toFixed(1)),
            helpfulRate: Number(helpfulRate.toFixed(3)),
            avgOverallScore: Number(avgOverallScore.toFixed(3)),
            escalationRate: Number(escalationRate.toFixed(4)),
          },
          sampleSize: interactions.length,
          confidence: this.calculateConfidence(interactions.length, (experiment as any).minSampleSize || 100),
          isWinner: false,
        });
      }

      // Determine winner
      if (results.length >= 2) {
        const sorted = [...results].sort(
          (a, b) => (b.metrics.avgOverallScore || 0) - (a.metrics.avgOverallScore || 0)
        );
        if (sorted[0].confidence >= 0.95 && sorted[0].sampleSize >= 100) {
          sorted[0].isWinner = true;
        }
      }

      return {
        experiment: experiment,
        results,
        hasWinner: results.some(r => r.isWinner),
        analysis: this.generateAnalysisSummary(results),
      };
    } catch (error) {
      logger.error('[AIExperiment] Analysis failed:', error);
      throw error;
    }
  }

  /**
   * List all active experiments
   */
  async getActiveExperiments(): Promise<any[]> {
    return ABExperiment.find({ status: 'active' }).sort({ startDate: -1 }).lean();
  }

  /**
   * End experiment and apply winner
   */
  async endExperiment(experimentId: string, winnerId?: string): Promise<any> {
    const result = await ABExperiment.findByIdAndUpdate(
      experimentId,
      {
        $set: {
          status: 'completed',
          endDate: new Date(),
          winner: winnerId,
        },
      },
      { new: true }
    );

    this.activeExperiments.delete(experimentId);
    logger.info(`[AIExperiment] Ended experiment ${experimentId}, winner=${winnerId}`);
    return result;
  }

  // ===== HELPERS =====

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private calculateConfidence(sampleSize: number, minRequired: number): number {
    if (sampleSize >= minRequired * 2) return 0.99;
    if (sampleSize >= minRequired) return 0.95;
    if (sampleSize >= minRequired * 0.5) return 0.80;
    return Math.min(0.7, sampleSize / minRequired);
  }

  private generateAnalysisSummary(results: ExperimentResult[]): string {
    if (results.length < 2) return 'Chưa đủ variants để so sánh';
    
    const winner = results.find(r => r.isWinner);
    if (winner) {
      return `Variant "${winner.variantId}" thắng với overall score ${winner.metrics.avgOverallScore} (confidence: ${(winner.confidence * 100).toFixed(0)}%)`;
    }

    const maxSample = Math.max(...results.map(r => r.sampleSize));
    if (maxSample < 100) {
      return `Cần thêm dữ liệu (hiện có ${maxSample} samples, cần ít nhất 100)`;
    }

    return 'Chưa có winner rõ ràng, tiếp tục thu thập dữ liệu';
  }
}

export const aiExperimentEngine = new AIExperimentEngine();
export default aiExperimentEngine;
