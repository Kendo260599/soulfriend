/**
 * MODEL IMPROVEMENT SERVICE
 * 
 * V5 Learning Pipeline — Module 6: Continuous Model Improvement
 * 3 cấp độ học:
 * Level 1 — Prompt Optimization (điều chỉnh prompt)
 * Level 2 — RAG Improvement (cập nhật knowledge base)
 * Level 3 — Fine-tuning (chỉ khi đủ dataset)
 * 
 * @module services/modelImprovementService
 * @version 5.0.0
 */

import { logger } from '../utils/logger';
import trainingDataCurationService from './trainingDataCurationService';
import redisService from './redisService';

interface PromptVersion {
  version: string;
  systemPrompt: string;
  createdAt: Date;
  metrics: {
    avgOverallScore: number;
    avgHelpfulRate: number;
    sampleSize: number;
  };
  status: 'active' | 'testing' | 'archived';
}

interface ImprovementPlan {
  level: 1 | 2 | 3;
  action: string;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedImpact: string;
  status: 'planned' | 'in_progress' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

class ModelImprovementService {
  private currentPromptVersion = '1.0';
  private improvementPlans: ImprovementPlan[] = [];

  private isFineTuningEnabled(): boolean {
    const raw = (process.env.FINE_TUNING_ENABLED || '').toLowerCase().trim();
    return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
  }

  // ===========================
  // LEVEL 1: PROMPT OPTIMIZATION
  // ===========================

  /**
   * Phân tích patterns từ feedback để cải thiện prompt
   */
  async analyzeForPromptOptimization(): Promise<any> {
    try {
      const EvaluationScore = (await import('../models/EvaluationScore')).default;
      const UserFeedback = (await import('../models/UserFeedback')).default;

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Low-scoring areas
      const lowScores = await EvaluationScore.aggregate([
        { $match: { timestamp: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: null,
            avgEmpathy: { $avg: '$empathyScore' },
            avgHelpfulness: { $avg: '$helpfulnessScore' },
            avgSafety: { $avg: '$safetyScore' },
            avgClinical: { $avg: '$clinicalAlignment' },
            totalCount: { $sum: 1 },
          },
        },
      ]);

      // Negative feedback patterns
      const negativeFeedbacks = await UserFeedback.find({
        timestamp: { $gte: thirtyDaysAgo },
        $or: [
          { rating: 'not_helpful' },
          { emotionChange: { $in: ['still_confused', 'feel_worse'] } },
        ],
      }).limit(50).lean();

      // Generate improvement suggestions
      const suggestions: string[] = [];
      if (lowScores.length) {
        const s = lowScores[0];
        if (s.avgEmpathy < 0.7) suggestions.push('Tăng cường empathy trong prompt (thêm acknowledgment, reflection)');
        if (s.avgHelpfulness < 0.7) suggestions.push('Thêm coping strategies cụ thể vào prompt');
        if (s.avgSafety < 0.8) suggestions.push('Tăng safety guardrails trong system prompt');
        if (s.avgClinical < 0.7) suggestions.push('Bổ sung clinical guidelines vào context');
      }

      if (negativeFeedbacks.length > 10) {
        suggestions.push('Phân tích chi tiết negative feedbacks để tìm pattern');
      }

      return {
        currentVersion: this.currentPromptVersion,
        analysisDate: new Date(),
        sampleSize: lowScores[0]?.totalCount || 0,
        weakAreas: lowScores.length ? lowScores[0] : {},
        negativeFeedbackCount: negativeFeedbacks.length,
        suggestions,
        recommendedAction: suggestions.length > 0 ? 'optimize_prompt' : 'no_action_needed',
      };
    } catch (error) {
      logger.error('[ModelImprovement] Prompt analysis failed:', error);
      return { error: 'Analysis failed' };
    }
  }

  /**
   * Áp dụng prompt improvement
   */
  async applyPromptImprovement(newSystemPrompt: string, version: string): Promise<boolean> {
    try {
      // Store in Redis for instant deployment
      await redisService.set(
        'sf:prompt:active',
        JSON.stringify({
          version,
          systemPrompt: newSystemPrompt,
          activatedAt: new Date().toISOString(),
        }),
        0 // no TTL
      );

      // Store version history
      await redisService.set(
        `sf:prompt:history:${version}`,
        JSON.stringify({
          version,
          systemPrompt: newSystemPrompt,
          createdAt: new Date().toISOString(),
          status: 'active',
        }),
        0
      );

      this.currentPromptVersion = version;
      logger.info(`[ModelImprovement] Activated prompt version ${version}`);
      return true;
    } catch (error) {
      logger.error('[ModelImprovement] Failed to apply prompt improvement:', error);
      return false;
    }
  }

  // ===========================
  // LEVEL 2: RAG IMPROVEMENT
  // ===========================

  /**
   * Cập nhật knowledge base từ curated data
   */
  async updateKnowledgeBase(): Promise<any> {
    try {
      const { vectorStore } = await import('./vectorStore');

      // Get approved training data
      const TrainingDataset = (await import('../models/TrainingDataset')).default;
      const approvedData = await TrainingDataset.find({ 
        status: 'approved',
        qualityScore: { $gte: 0.8 },
      }).lean();

      let addedCount = 0;

      for (const data of approvedData) {
        try {
          // Create knowledge entry for RAG
          const knowledgeEntry = `Câu hỏi: ${data.input}\nPhản hồi chuẩn: ${data.expectedOutput}`;
          
          const embedding = await vectorStore.createEmbedding(knowledgeEntry);
          await vectorStore.upsert({
            id: `curated_${(data as any)._id}`,
            values: embedding,
            metadata: {
              userId: 'system',
              type: 'insight',
              content: knowledgeEntry,
              timestamp: Date.now(),
              category: data.category,
              confidence: data.qualityScore,
              source: data.sourceType,
            },
          });

          addedCount++;
        } catch {
          // Skip individual failures
        }
      }

      logger.info(`[ModelImprovement] Updated RAG knowledge base with ${addedCount} entries`);
      return {
        level: 2,
        action: 'rag_update',
        addedDocuments: addedCount,
        totalApproved: approvedData.length,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('[ModelImprovement] RAG update failed:', error);
      return { error: 'RAG update failed' };
    }
  }

  // ===========================
  // LEVEL 3: FINE-TUNING
  // ===========================

  /**
   * Kiểm tra xem đã đủ data cho fine-tuning chưa
   */
  async checkFineTuningReadiness(): Promise<any> {
    try {
      const TrainingDataset = (await import('../models/TrainingDataset')).default;
      
      const stats = await TrainingDataset.aggregate([
        { $match: { status: { $in: ['approved', 'used'] } } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            avgQuality: { $avg: '$qualityScore' },
          },
        },
      ]);

      const totalApproved = stats.reduce((sum: number, s: any) => sum + s.count, 0);
      const avgQuality = stats.length
        ? stats.reduce((sum: number, s: any) => sum + s.avgQuality, 0) / stats.length
        : 0;

      const MIN_SAMPLES = 500;
      const MIN_QUALITY = 0.75;
      const featureEnabled = this.isFineTuningEnabled();

      return {
        level: 3,
        featureEnabled,
        ready: totalApproved >= MIN_SAMPLES && avgQuality >= MIN_QUALITY,
        totalSamples: totalApproved,
        minRequired: MIN_SAMPLES,
        avgQuality: Number(avgQuality.toFixed(3)),
        minQuality: MIN_QUALITY,
        categoryDistribution: stats,
        gateStatus: featureEnabled ? 'enabled' : 'disabled',
        recommendation: totalApproved < MIN_SAMPLES
          ? `Cần thêm ${MIN_SAMPLES - totalApproved} training samples`
          : avgQuality < MIN_QUALITY
            ? 'Cần cải thiện chất lượng dữ liệu'
            : 'Sẵn sàng cho fine-tuning',
      };
    } catch (error) {
      logger.error('[ModelImprovement] Fine-tuning readiness check failed:', error);
      return { error: 'Check failed' };
    }
  }

  /**
   * Trigger fine-tuning job (placeholder — cần OpenAI Fine-tuning API)
   */
  async triggerFineTuning(): Promise<any> {
    if (!this.isFineTuningEnabled()) {
      return {
        status: 'not_enabled',
        message: 'Fine-tuning hiện đang bị tắt. Bật FINE_TUNING_ENABLED=true để cho phép trigger.',
      };
    }

    const readiness = await this.checkFineTuningReadiness();
    if (!readiness.ready) {
      return {
        status: 'not_ready',
        reason: readiness.recommendation,
      };
    }

    const trainingRunId = `FT_${Date.now()}`;
    const dataset = await trainingDataCurationService.exportForTraining(trainingRunId);

    // TODO: Implement actual OpenAI Fine-tuning API call
    // const fineTuneJob = await openai.fineTuning.jobs.create({
    //   training_file: uploadedFile.id,
    //   model: 'gpt-4o-mini-2024-07-18',
    // });

    logger.warn(`[ModelImprovement] Fine-tuning requested but provider integration is not implemented. trainingRunId=${trainingRunId}, dataset=${dataset.length}`);

    return {
      status: 'not_implemented',
      trainingRunId,
      datasetSize: dataset.length,
      message: 'Fine-tuning provider integration chưa được triển khai. Dataset đã được export để chuẩn bị tích hợp.',
    };
  }

  // ===========================
  // ORCHESTRATOR
  // ===========================

  /**
   * Chạy full improvement cycle
   */
  async runImprovementCycle(): Promise<any> {
    logger.info('[ModelImprovement] Starting improvement cycle...');

    const results: any = {
      timestamp: new Date(),
      steps: [],
    };

    // Step 1: Curate training data
    try {
      const expertCurated = await trainingDataCurationService.curateFromExpertReviews();
      const autoCurated = await trainingDataCurationService.curateFromHighQualityInteractions();
      results.steps.push({
        step: 'data_curation',
        status: 'completed',
        expertCurated,
        autoCurated,
      });
    } catch (error) {
      results.steps.push({ step: 'data_curation', status: 'failed', error: String(error) });
    }

    // Step 2: Analyze for prompt optimization
    try {
      const promptAnalysis = await this.analyzeForPromptOptimization();
      results.steps.push({
        step: 'prompt_analysis',
        status: 'completed',
        ...promptAnalysis,
      });
    } catch (error) {
      results.steps.push({ step: 'prompt_analysis', status: 'failed', error: String(error) });
    }

    // Step 3: Check fine-tuning readiness
    try {
      const ftReadiness = await this.checkFineTuningReadiness();
      results.steps.push({
        step: 'fine_tuning_check',
        status: 'completed',
        ...ftReadiness,
      });
    } catch (error) {
      results.steps.push({ step: 'fine_tuning_check', status: 'failed', error: String(error) });
    }

    logger.info('[ModelImprovement] Improvement cycle completed');
    return results;
  }
}

export const modelImprovementService = new ModelImprovementService();
export default modelImprovementService;
