/**
 * Offline Training Enhancement Service
 * Cải thiện chất lượng responses khi offline bằng cách:
 * 1. Better similarity matching với training data
 * 2. Template-based response generation từ best matches
 * 3. Adaptive learning từ user feedback
 */

import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

interface TrainingSample {
  input: string;
  output: string;
  metadata: {
    topic: string;
    quality: number;
    hasDecomposition?: boolean;
    hasOptions?: boolean;
    hasAssumptions?: boolean;
  };
}

interface SimilarityMatch {
  sample: TrainingSample;
  similarity: number;
  matchedKeywords: string[];
  topicMatch: boolean;
}

interface OfflineResponse {
  message: string;
  confidence: number;
  source: 'template_match' | 'adaptive' | 'fallback';
  matchedSamples: number;
}

export class OfflineTrainingService {
  private trainingSamples: TrainingSample[] = [];
  private topicKeywords: Map<string, string[]> = new Map();
  private qualityScores: Map<string, number> = new Map(); // Track quality per topic
  private initialized: boolean = false;

  constructor() {
    this.loadTrainingData();
    this.buildTopicKeywords();
  }

  /**
   * Load và index training data
   */
  private loadTrainingData(): void {
    try {
      const possiblePaths = [
        path.join(__dirname, '../../training_samples.jsonl'),
        path.join(process.cwd(), 'training_samples.jsonl'),
        path.join(process.cwd(), 'backend/training_samples.jsonl'),
      ];

      let samplesPath: string | null = null;
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          samplesPath = testPath;
          break;
        }
      }

      if (samplesPath) {
        const content = fs.readFileSync(samplesPath, 'utf-8');
        this.trainingSamples = content
          .split('\n')
          .filter(line => line.trim())
          .map(line => JSON.parse(line));
        this.initialized = true;
        logger.info(
          `✅ Loaded ${this.trainingSamples.length} training samples for offline learning`
        );
      } else {
        logger.warn('Training samples not found, offline mode will use basic fallback');
      }
    } catch (error) {
      logger.error('Error loading training data:', error);
    }
  }

  /**
   * Build keyword index cho các topics
   */
  private buildTopicKeywords(): void {
    const topicMap = new Map<string, Set<string>>();

    this.trainingSamples.forEach(sample => {
      const topic = sample.metadata.topic;
      if (!topicMap.has(topic)) {
        topicMap.set(topic, new Set());
      }

      // Extract keywords từ input
      const words = sample.input
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 2 && !this.isStopWord(w));

      words.forEach(word => topicMap.get(topic)!.add(word));
    });

    topicMap.forEach((keywords, topic) => {
      this.topicKeywords.set(topic, Array.from(keywords));
    });

    logger.info(`✅ Built keyword index for ${topicMap.size} topics`);
  }

  /**
   * Advanced similarity matching với TF-IDF approach
   */
  findBestMatches(userMessage: string, count: number = 5): SimilarityMatch[] {
    if (!this.initialized || this.trainingSamples.length === 0) {
      return [];
    }

    const lowerMessage = userMessage.toLowerCase();
    const messageWords = lowerMessage.split(/\s+/).filter(w => w.length > 2 && !this.isStopWord(w));

    // Calculate word frequency trong user message
    const messageWordFreq = new Map<string, number>();
    messageWords.forEach(word => {
      messageWordFreq.set(word, (messageWordFreq.get(word) || 0) + 1);
    });

    // Score each sample
    const scored: SimilarityMatch[] = this.trainingSamples.map(sample => {
      const sampleLower = sample.input.toLowerCase();
      const sampleWords = sampleLower.split(/\s+/).filter(w => w.length > 2 && !this.isStopWord(w));

      let similarity = 0;
      const matchedKeywords: string[] = [];

      // 1. Exact keyword matching (higher weight)
      messageWords.forEach(word => {
        if (sampleWords.includes(word)) {
          similarity += 3; // Higher weight for exact match
          matchedKeywords.push(word);
        }
      });

      // 2. Partial word matching (lower weight)
      messageWords.forEach(word => {
        sampleWords.forEach(sampleWord => {
          if (sampleWord.includes(word) || word.includes(sampleWord)) {
            similarity += 1;
            if (!matchedKeywords.includes(word)) {
              matchedKeywords.push(word);
            }
          }
        });
      });

      // 3. Topic-based boost
      const topic = sample.metadata.topic;
      const topicKeywords = this.topicKeywords.get(topic) || [];
      const topicMatches = messageWords.filter(w => topicKeywords.includes(w)).length;
      if (topicMatches > 0) {
        similarity += topicMatches * 2; // Boost for topic relevance
      }

      // 4. Quality boost
      const quality = sample.metadata.quality || 5;
      similarity += (quality / 10) * 2; // Boost for higher quality samples

      return {
        sample,
        similarity,
        matchedKeywords,
        topicMatch: topicMatches > 0,
      };
    });

    // Sort by similarity và return top matches
    return scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, count)
      .filter(match => match.similarity > 0); // Only return matches with similarity > 0
  }

  /**
   * Generate offline response từ best matches
   */
  generateOfflineResponse(userMessage: string): OfflineResponse {
    const matches = this.findBestMatches(userMessage, 3);

    if (matches.length === 0) {
      // No matches found, use generic fallback
      return {
        message: this.generateGenericFallback(userMessage),
        confidence: 0.3,
        source: 'fallback',
        matchedSamples: 0,
      };
    }

    // Use best match nếu similarity cao
    const bestMatch = matches[0];
    if (bestMatch.similarity >= 5) {
      // High similarity - use template directly với minor adaptation
      const adapted = this.adaptResponse(bestMatch.sample.output, userMessage);
      return {
        message: adapted,
        confidence: Math.min(0.9, bestMatch.similarity / 10),
        source: 'template_match',
        matchedSamples: matches.length,
      };
    }

    // Medium similarity - combine multiple templates
    if (matches.length >= 2) {
      const combined = this.combineResponses(matches.slice(0, 2), userMessage);
      return {
        message: combined,
        confidence: 0.7,
        source: 'adaptive',
        matchedSamples: matches.length,
      };
    }

    // Low similarity - use single template với adaptation
    const adapted = this.adaptResponse(bestMatch.sample.output, userMessage);
    return {
      message: adapted,
      confidence: 0.6,
      source: 'template_match',
      matchedSamples: 1,
    };
  }

  /**
   * Adapt response từ template để match user message tốt hơn
   */
  private adaptResponse(template: string, userMessage: string): string {
    // Simple adaptation - replace generic phrases với specific ones từ user message
    let adapted = template;

    // Extract key phrases từ user message
    const userPhrases = this.extractKeyPhrases(userMessage);

    // Replace generic references nếu có
    userPhrases.forEach(phrase => {
      if (phrase.length > 3) {
        // Keep original template structure, just ensure relevance
        adapted = adapted.replace(/vấn đề/g, phrase);
      }
    });

    return adapted;
  }

  /**
   * Combine multiple responses để tạo richer output
   */
  private combineResponses(matches: SimilarityMatch[], userMessage: string): string {
    const bestMatch = matches[0].sample;
    const secondMatch = matches.length > 1 ? matches[1].sample : null;

    // Use best match as base
    let combined = bestMatch.output;

    // Add extra options từ second match nếu có
    if (secondMatch && secondMatch.output.includes('Phương án')) {
      // Extract additional options từ second match
      const optionPattern = /Phương án\s*([A-Z])[:\s]+(.+?)(?=\nPhương án|$)/gis;
      const additionalOptions: string[] = [];
      let match;

      while ((match = optionPattern.exec(secondMatch.output)) !== null) {
        if (!combined.includes(match[1])) {
          additionalOptions.push(`Phương án ${match[1]}: ${match[2].trim()}`);
        }
      }

      if (additionalOptions.length > 0) {
        // Insert before Assumption section
        combined = combined.replace(
          /(\*\*Assumption)/,
          `${additionalOptions.join('\n\n')}\n\n**Assumption`
        );
      }
    }

    return combined;
  }

  /**
   * Extract key phrases từ message
   */
  private extractKeyPhrases(message: string): string[] {
    const phrases: string[] = [];
    const lower = message.toLowerCase();

    // Common Vietnamese phrases
    const commonPhrases = [
      'công việc',
      'gia đình',
      'con nhỏ',
      'lo âu',
      'kiệt sức',
      'khó ngủ',
      'thức giấc',
      'thuyết trình',
      'mối quan hệ',
    ];

    commonPhrases.forEach(phrase => {
      if (lower.includes(phrase)) {
        phrases.push(phrase);
      }
    });

    return phrases;
  }

  /**
   * Generate generic fallback khi không có matches
   */
  private generateGenericFallback(message: string): string {
    const lower = message.toLowerCase();

    // Detect topic từ keywords
    if (lower.includes('ngủ') || lower.includes('thức giấc')) {
      return `**Mục tiêu:** Ngủ ngon hơn trong 2 tuần
**Ràng buộc:** 10 phút/ngày, không thuốc
**Biến số chính:** Giờ đi ngủ, Caffeine, Màn hình trước ngủ

**Phương án:**
🔥 10× Phương án A: 120s thở box + tắt màn hình 60' trước ngủ
Phương án B: Nhật ký worry time 15' lúc 18:00

**Assumption:** Thiếu vệ sinh giấc ngủ là nguyên nhân
**Test:** Latency < 20' sau 7 ngày

⚠️ Đây là mô phỏng phong cách tư duy, không thay thế chuyên gia.`;
    }

    if (lower.includes('lo âu') || lower.includes('sợ') || lower.includes('căng thẳng')) {
      return `**Mục tiêu:** Giảm lo âu trong 4 tuần
**Ràng buộc:** 2 buổi luyện tập, không chuyên gia
**Biến số chính:** Nhịp tim, Số câu nói trôi chảy

**Phương án:**
🔥 10× Phương án A: Diễn tập 3 vòng 2-2-1 phút + ghi âm
Phương án B: Kịch bản 3 bullet + hook 15s

**Assumption:** Thiếu chuẩn bị cấu trúc
**Test:** So nhịp tim trước/sau; target -10%

⚠️ Đây là mô phỏng phong cách tư duy, không thay thế chuyên gia.`;
    }

    if (lower.includes('kiệt sức') || lower.includes('mệt')) {
      return `**Mục tiêu:** Giảm kiệt sức trong 14 ngày
**Ràng buộc:** 10 phút/ngày, không thuốc
**Biến số chính:** Giờ ngủ, Tải công việc, Hỗ trợ xã hội

**Phương án:**
🔥 10× Phương án A: Box breathing 120s + tắt màn hình 60' trước ngủ
Phương án B: Worry time 15 phút lúc 18:00

**Assumption:** Thiếu vệ sinh giấc ngủ là yếu tố chính
**Test:** Theo dõi sleep latency 7 ngày; target < 20 phút

⚠️ Đây là mô phỏng phong cách tư duy, không thay thế chuyên gia.`;
    }

    // Generic fallback
    return `**Mục tiêu:** Cải thiện tình trạng trong 2-4 tuần
**Ràng buộc:** 10 phút/ngày, Self-help an toàn
**Biến số chính:** Tần suất thực hành, Tuân thủ

**Phương án:**
Phương án A: Can thiệp ngắn 5-10 phút/ngày
Phương án B: Theo dõi nhật ký cảm xúc

**Assumption:** Can thiệp đúng sẽ có tác động
**Test:** Đo lường cải thiện sau 2 tuần

⚠️ Đây là mô phỏng phong cách tư duy, không thay thế chuyên gia.`;
  }

  /**
   * Record feedback để improve offline responses
   */
  recordFeedback(
    userMessage: string,
    response: string,
    wasHelpful: boolean,
    quality?: number
  ): void {
    // Track quality per topic
    const matches = this.findBestMatches(userMessage, 1);
    if (matches.length > 0) {
      const topic = matches[0].sample.metadata.topic;
      const currentQuality = this.qualityScores.get(topic) || 5;
      const newQuality = wasHelpful
        ? Math.min(10, currentQuality + 0.1)
        : Math.max(1, currentQuality - 0.1);

      this.qualityScores.set(topic, newQuality);

      logger.info(
        `📊 Updated quality score for topic "${topic}": ${currentQuality.toFixed(1)} → ${newQuality.toFixed(1)}`
      );
    }
  }

  /**
   * Check if word is stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = [
      'và',
      'của',
      'cho',
      'với',
      'từ',
      'đến',
      'trong',
      'này',
      'đó',
      'mình',
      'em',
      'tôi',
      'bạn',
      'của',
      'là',
      'có',
      'được',
      'sẽ',
      'vì',
      'để',
      'nhưng',
      'nếu',
      'khi',
      'thì',
      'mà',
      'nên',
    ];
    return stopWords.includes(word.toLowerCase());
  }

  /**
   * Get statistics về offline training
   */
  getStats(): {
    totalSamples: number;
    topics: number;
    averageQuality: number;
  } {
    const topics = new Set(this.trainingSamples.map(s => s.metadata.topic));
    const avgQuality =
      this.trainingSamples.reduce((sum, s) => sum + (s.metadata.quality || 5), 0) /
      this.trainingSamples.length;

    return {
      totalSamples: this.trainingSamples.length,
      topics: topics.size,
      averageQuality: avgQuality,
    };
  }
}

export const offlineTrainingService = new OfflineTrainingService();
export default offlineTrainingService;
