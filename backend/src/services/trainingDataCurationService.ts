/**
 * TRAINING DATA CURATION SERVICE
 * 
 * V5 Learning Pipeline — Module 5: Data Curation Pipeline
 * Lọc, anonymize, kiểm duyệt dữ liệu trước khi đưa vào training
 * 
 * @module services/trainingDataCurationService
 * @version 5.0.0
 */

import TrainingDataset from '../models/TrainingDataset';
import ExpertReview from '../models/ExpertReview';
import EvaluationScore from '../models/EvaluationScore';
import InteractionEvent from '../models/InteractionEvent';
import { logger } from '../utils/logger';
import crypto from 'crypto';

// Vietnamese PII patterns
const PII_PATTERNS = [
  /\b\d{9,12}\b/g, // Phone numbers
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Emails
  /\b\d{9}\b/g, // CCCD/CMND
  /\b\d{1,4}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g, // Dates (could be birthdays)
  /\b(?:số nhà|đường|phường|quận|huyện|tỉnh|thành phố)\s+[^\s,]+/gi, // Addresses
];

// Unsafe content patterns
const UNSAFE_PATTERNS = [
  /cách tự (tử|vẫn|sát|hại|kết liễu)/gi,
  /phương pháp (tự tử|chết)/gi,
  /thuốc.{0,20}(liều|quá liều|tự tử)/gi,
  /hướng dẫn.{0,20}(tự hại|tự tử)/gi,
];

class TrainingDataCurationService {
  /**
   * Curate training data từ expert reviews (highest quality)
   */
  async curateFromExpertReviews(): Promise<number> {
    const reviews = await ExpertReview.find({
      status: 'reviewed',
      shouldRetrain: true,
    })
      .populate('interactionEventId')
      .lean();

    let curatedCount = 0;

    for (const review of reviews) {
      try {
        const interaction = review.interactionEventId as any;
        if (!interaction) continue;

        // Anonymize input
        const anonymizedInput = this.anonymizeText(interaction.userText);
        
        // Check for unsafe content
        if (this.containsUnsafeContent(anonymizedInput)) {
          logger.warn(`[DataCuration] Skipping unsafe content in review ${review._id}`);
          continue;
        }

        // Check for duplicates
        const isDuplicate = await this.isDuplicate(anonymizedInput);
        if (isDuplicate) continue;

        const dataset = new TrainingDataset({
          datasetId: `TD_${crypto.randomUUID().substring(0, 12)}`,
          version: '1.0',
          input: anonymizedInput,
          expectedOutput: review.correctedResponse,
          sourceType: 'expert_correction',
          sourceInteractionId: interaction._id,
          sourceExpertReviewId: review._id,
          qualityScore: this.calculateQualityScore(review),
          qualityChecks: {
            personalDataRemoved: true,
            unsafeContentRemoved: true,
            anonymized: true,
            expertValidated: true,
            duplicateChecked: true,
          },
          category: this.categorizeContent(anonymizedInput, review.correctedResponse),
          tags: this.extractTags(review),
          difficulty: this.assessDifficulty(review),
          status: 'approved', // Expert-reviewed = auto-approved
        });

        await dataset.save();
        curatedCount++;

        // Mark review as applied
        await ExpertReview.findByIdAndUpdate(review._id, { status: 'applied' });
      } catch (error) {
        logger.error(`[DataCuration] Error curating review ${review._id}:`, error);
      }
    }

    logger.info(`[DataCuration] Curated ${curatedCount} training pairs from expert reviews`);
    return curatedCount;
  }

  /**
   * Curate từ high-quality auto-evaluated interactions
   */
  async curateFromHighQualityInteractions(): Promise<number> {
    // Get interactions with high evaluation scores & positive user feedback
    const highQualityEvals = await EvaluationScore.find({
      overallScore: { $gte: 0.85 },
      grade: { $in: ['A'] },
      needsHumanReview: false,
    })
      .populate('interactionEventId')
      .limit(100)
      .lean();

    let curatedCount = 0;

    for (const evaluation of highQualityEvals) {
      try {
        const interaction = evaluation.interactionEventId as any;
        if (!interaction) continue;

        const anonymizedInput = this.anonymizeText(interaction.userText);
        
        if (this.containsUnsafeContent(anonymizedInput)) continue;
        if (await this.isDuplicate(anonymizedInput)) continue;

        const dataset = new TrainingDataset({
          datasetId: `TD_${crypto.randomUUID().substring(0, 12)}`,
          version: '1.0',
          input: anonymizedInput,
          expectedOutput: this.anonymizeText(interaction.aiResponse),
          sourceType: 'high_quality_auto',
          sourceInteractionId: interaction._id,
          qualityScore: evaluation.overallScore,
          qualityChecks: {
            personalDataRemoved: true,
            unsafeContentRemoved: true,
            anonymized: true,
            expertValidated: false,
            duplicateChecked: true,
          },
          category: this.categorizeContent(anonymizedInput, interaction.aiResponse),
          tags: [],
          difficulty: 'medium',
          status: 'pending', // Auto-curated = needs approval
        });

        await dataset.save();
        curatedCount++;
      } catch (error) {
        logger.error('[DataCuration] Error curating high-quality interaction:', error);
      }
    }

    logger.info(`[DataCuration] Curated ${curatedCount} training pairs from high-quality interactions`);
    return curatedCount;
  }

  /**
   * Lấy dataset statistics
   */
  async getDatasetStats(): Promise<any> {
    const stats = await TrainingDataset.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgQuality: { $avg: '$qualityScore' },
        },
      },
    ]);

    const categoryStats = await TrainingDataset.aggregate([
      { $match: { status: { $in: ['approved', 'used'] } } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return {
      byStatus: stats.reduce((acc: any, s: any) => {
        acc[s._id] = { count: s.count, avgQuality: Number(s.avgQuality.toFixed(3)) };
        return acc;
      }, {}),
      byCategory: categoryStats,
      totalApproved: stats.find((s: any) => s._id === 'approved')?.count || 0,
      totalUsed: stats.find((s: any) => s._id === 'used')?.count || 0,
    };
  }

  /**
   * Export approved dataset cho training
   */
  async exportForTraining(trainingRunId: string): Promise<any[]> {
    const datasets = await TrainingDataset.find({ status: 'approved' }).lean();

    // Mark as used
    await TrainingDataset.updateMany(
      { status: 'approved' },
      { $set: { status: 'used', usedInTrainingRun: trainingRunId } }
    );

    return datasets.map(d => ({
      input: d.input,
      output: d.expectedOutput,
      category: d.category,
      quality: d.qualityScore,
    }));
  }

  // ===== PRIVATE HELPERS =====

  private anonymizeText(text: string): string {
    let anonymized = text;
    for (const pattern of PII_PATTERNS) {
      anonymized = anonymized.replace(pattern, '[REMOVED]');
    }
    return anonymized;
  }

  private containsUnsafeContent(text: string): boolean {
    return UNSAFE_PATTERNS.some(p => p.test(text));
  }

  private async isDuplicate(input: string): Promise<boolean> {
    // Simple check: same input within threshold
    const normalized = input.toLowerCase().trim().substring(0, 100);
    const existing = await TrainingDataset.findOne({
      input: { $regex: new RegExp(normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').substring(0, 50)) },
    });
    return !!existing;
  }

  private calculateQualityScore(review: any): number {
    const assessment = review.assessment;
    return (
      (assessment.empathyRating +
        assessment.safetyRating +
        assessment.clinicalAccuracy +
        assessment.culturalFit +
        assessment.overallRating) /
      25 // Scale 5*5 → 0-1
    );
  }

  private categorizeContent(input: string, output: string): string {
    const combined = (input + ' ' + output).toLowerCase();
    if (/khủng hoảng|tự tử|tự hại|nguy hiểm/.test(combined)) return 'crisis';
    if (/lo âu|lo lắng|sợ hãi|bất an/.test(combined)) return 'anxiety';
    if (/trầm cảm|buồn|chán nản|tuyệt vọng/.test(combined)) return 'depression';
    if (/stress|căng thẳng|áp lực|mệt mỏi/.test(combined)) return 'stress';
    if (/thở|thiền|thư giãn|yoga/.test(combined)) return 'coping';
    if (/gia đình|chồng|mẹ|con|vợ/.test(combined)) return 'family';
    if (/công việc|sếp|đồng nghiệp/.test(combined)) return 'work';
    return 'general';
  }

  private extractTags(review: any): string[] {
    const tags: string[] = [];
    if (review.issues) {
      for (const issue of review.issues) {
        tags.push(issue.type);
      }
    }
    return [...new Set(tags)];
  }

  private assessDifficulty(review: any): string {
    const overallRating = review.assessment?.overallRating || 3;
    if (overallRating >= 4.5) return 'easy';
    if (overallRating >= 3) return 'medium';
    if (overallRating >= 2) return 'hard';
    return 'expert';
  }
}

export const trainingDataCurationService = new TrainingDataCurationService();
export default trainingDataCurationService;
