/**
 * Central Risk Scoring Service
 *
 * Consolidates risk assessment from multiple sources into a single,
 * unified risk evaluation. Replaces the scattered if/else merging
 * in enhancedChatbotService.
 *
 * Sources aggregated:
 * 1. moderationService.assess()    — lexical scanning + external APIs
 * 2. detectCrisis()                — crisis scenario matching
 * 3. assessRisk()                  — history + emotional state analysis
 * 4. socialHarmDecoder.analyze()   — gaslighting, shaming, manipulation detection
 * 5. biasMonitor.check()           — response fairness checks
 *
 * @module services/riskScoringService
 * @version 1.1.0
 */

import {
  RiskLevel,
  RiskType,
  RiskSignal,
  RiskAssessment,
  fromLowercase,
  maxRiskLevel,
  isHITLTrigger,
  requiresReferral,
  toNumericScore,
} from '../types/risk';
import moderationService, { ModerationResult } from './moderationService';
import { detectCrisis, assessRisk, CrisisScenario } from '../data/crisisManagementData';
import { socialHarmDecoder, SocialHarmResult } from './socialHarmDecoder';
import { biasMonitor, BiasCheckResult } from './biasMonitor';
import { logger } from '../utils/logger';

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class CentralRiskScoringService {
  /**
   * Perform comprehensive risk assessment on a user message.
   *
   * This is the SINGLE entry point for all risk evaluation.
   * Services should call this instead of individually calling
   * moderationService, detectCrisis, and assessRisk.
   *
   * @param message      — Raw user message
   * @param userHistory  — Recent message history for this session
   * @param emotionalState — Current detected emotional state
   * @returns RiskAssessment — Unified assessment result
   */
  async assess(
    message: string,
    userHistory: string[] = [],
    emotionalState: string = 'neutral',
    botResponse?: string
  ): Promise<RiskAssessment> {
    const signals: RiskSignal[] = [];
    let detectedCrisis: CrisisScenario | null = null;

    // ─────────────────────────────────────────────────
    // SOURCE 1: Moderation Service (lexical + external APIs)
    // ─────────────────────────────────────────────────
    let moderationResult: ModerationResult | null = null;
    try {
      moderationResult = await moderationService.assess(message);
      if (moderationResult.signals.length > 0) {
        signals.push({
          source: 'moderation',
          level: fromLowercase(moderationResult.riskLevel),
          score: moderationResult.riskScore,
          confidence: Math.max(...moderationResult.signals.map(s => s.confidence), 0),
          details: {
            category: moderationResult.signals.map(s => s.category).join(', '),
            matchedKeywords: moderationResult.signals.flatMap(s => s.matched || []),
          },
        });
      }
    } catch (error) {
      logger.error('Moderation assessment failed:', error);
    }

    // ─────────────────────────────────────────────────
    // SOURCE 2: Crisis Scenario Detection (single call — no duplicates)
    // ─────────────────────────────────────────────────
    try {
      detectedCrisis = detectCrisis(message);
      if (detectedCrisis) {
        const crisisLevel = fromLowercase(detectedCrisis.level);
        signals.push({
          source: 'crisis_keywords',
          level: crisisLevel,
          score: toNumericScore(crisisLevel) * 10,
          confidence: 0.9,
          details: {
            category: detectedCrisis.id,
            matchedKeywords: detectedCrisis.triggers.filter(t =>
              message.toLowerCase().includes(t.toLowerCase())
            ),
            riskType: this.inferRiskType(detectedCrisis),
          },
        });
      }
    } catch (error) {
      logger.error('Crisis detection failed:', error);
    }

    // ─────────────────────────────────────────────────
    // SOURCE 3: History + Emotional State Assessment
    // ─────────────────────────────────────────────────
    try {
      // Note: assessRisk internally calls detectCrisis again,
      // but we only use its history/emotional factors, not its crisis result.
      const riskAssessmentResult = assessRisk(message, userHistory, emotionalState);

      // Only add history-based signals (not the crisis part, already captured above)
      const historyFactors = riskAssessmentResult.riskFactors.filter(
        f => f !== (detectedCrisis?.id || '')
      );

      if (historyFactors.length > 0) {
        signals.push({
          source: 'history',
          level: fromLowercase(riskAssessmentResult.riskLevel),
          score: toNumericScore(fromLowercase(riskAssessmentResult.riskLevel)) * 10,
          confidence: 0.7,
          details: {
            category: historyFactors.join(', '),
          },
        });
      }
    } catch (error) {
      logger.error('Risk assessment from history failed:', error);
    }

    // ─────────────────────────────────────────────────
    // SOURCE 4: Social Harm Decoder (gaslighting, manipulation, shaming)
    // ─────────────────────────────────────────────────
    let socialHarmResult: SocialHarmResult | null = null;
    try {
      socialHarmResult = socialHarmDecoder.analyze(message);
      if (socialHarmResult.detected) {
        signals.push({
          source: 'social_harm',
          level: socialHarmResult.riskLevel,
          score: socialHarmResult.score,
          confidence: socialHarmResult.confidence,
          details: {
            category: socialHarmResult.categories.join(', '),
            matchedKeywords: socialHarmResult.matchedPatterns.flatMap(p => p.matchedKeywords),
            responseGuidance: socialHarmResult.responseGuidance,
          },
        });
      }
    } catch (error) {
      logger.error('Social harm analysis failed:', error);
    }

    // ─────────────────────────────────────────────────
    // SOURCE 5: Bias Monitor (AI response fairness checks)
    // ─────────────────────────────────────────────────
    let biasResult: BiasCheckResult | null = null;
    if (botResponse) {
      try {
        biasResult = biasMonitor.check(botResponse, message);
        if (biasResult.biasDetected) {
          signals.push({
            source: 'bias_monitor',
            level: biasResult.severityLevel,
            score: biasResult.score,
            confidence: biasResult.confidence,
            details: {
              category: biasResult.categories.join(', '),
              matchedKeywords: biasResult.matchedPatterns.flatMap(p => p.matchedPhrases),
              shouldRewrite: biasResult.shouldRewrite,
              corrections: biasResult.corrections,
            },
          });
        }
      } catch (error) {
        logger.error('Bias monitor check failed:', error);
      }
    }

    // ─────────────────────────────────────────────────
    // AGGREGATE: Determine final risk level
    // ─────────────────────────────────────────────────
    const finalLevel = this.aggregateSignals(signals);
    const finalScore = this.calculateScore(signals);
    const riskType = this.determineRiskType(signals, detectedCrisis);
    const recommendations = this.generateRecommendations(finalLevel);

    const assessment: RiskAssessment = {
      level: finalLevel,
      score: finalScore,
      riskType,
      signals,
      shouldActivateHITL: isHITLTrigger(finalLevel),
      shouldRefer: requiresReferral(finalLevel),
      riskFactors: signals
        .flatMap(s => s.details?.matchedKeywords || [])
        .filter((v, i, a) => a.indexOf(v) === i), // deduplicate
      recommendations,
      timestamp: new Date(),
    };

    logger.info('Central risk assessment completed', {
      level: assessment.level,
      score: assessment.score,
      riskType: assessment.riskType,
      signalCount: signals.length,
      shouldHITL: assessment.shouldActivateHITL,
    });

    return assessment;
  }

  /**
   * Aggregate multiple signals into one final risk level.
   * Uses highest-risk-wins strategy with confidence weighting.
   */
  private aggregateSignals(signals: RiskSignal[]): RiskLevel {
    if (signals.length === 0) return RiskLevel.NONE;

    // Start with the highest signal level
    let highest = RiskLevel.NONE;
    for (const signal of signals) {
      // Only consider signals with reasonable confidence
      if (signal.confidence >= 0.3) {
        highest = maxRiskLevel(highest, signal.level);
      }
    }

    return highest;
  }

  /**
   * Calculate weighted numeric risk score (0-100)
   */
  private calculateScore(signals: RiskSignal[]): number {
    if (signals.length === 0) return 0;

    // Source priority weights
    const sourceWeights: Record<string, number> = {
      crisis_keywords: 1.0,
      moderation: 0.9,
      social_harm: 0.85,
      bias_monitor: 0.7,
      sentiment: 0.7,
      history: 0.6,
      ai: 0.8,
      lexical: 0.8,
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const signal of signals) {
      const weight = (sourceWeights[signal.source] || 0.5) * signal.confidence;
      weightedSum += signal.score * weight;
      totalWeight += weight;
    }

    const score = totalWeight > 0 ? weightedSum / totalWeight : 0;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Determine the type of risk from signals and crisis scenario
   */
  private determineRiskType(
    signals: RiskSignal[],
    crisis: CrisisScenario | null
  ): RiskType {
    // Priority 1: From crisis scenario
    if (crisis) {
      return this.inferRiskType(crisis);
    }

    // Priority 2: From social harm signals
    for (const signal of signals) {
      if (signal.source === 'social_harm' && signal.details?.category) {
        const categories = signal.details.category.split(', ');
        if (categories.includes('coercive_control')) {
          return 'coercion';
        }
        if (categories.includes('emotional_manipulation') || categories.includes('gaslighting')) {
          return 'manipulation';
        }
      }
    }

    // Priority 3: From moderation signals
    for (const signal of signals) {
      if (signal.details?.riskType) {
        return signal.details.riskType;
      }
      if (signal.source === 'moderation' && signal.details?.category) {
        const categories = signal.details.category.split(', ');
        if (categories.includes('direct_intent') || categories.includes('ideation')) {
          return 'suicidal';
        }
        if (categories.includes('nssi')) {
          return 'self_harm';
        }
      }
    }

    return 'general';
  }

  /**
   * Infer risk type from crisis scenario ID
   */
  private inferRiskType(crisis: CrisisScenario): RiskType {
    const mapping: Record<string, RiskType> = {
      suicidal_ideation: 'suicidal',
      self_harm: 'self_harm',
      psychosis: 'psychosis',
      violence: 'violence',
      severe_depression: 'general',
      panic_attack: 'general',
    };
    return mapping[crisis.id] || 'general';
  }

  /**
   * Generate action recommendations based on risk level
   */
  private generateRecommendations(level: RiskLevel): string[] {
    switch (level) {
      case RiskLevel.EXTREME:
        return [
          'immediate_intervention',
          'emergency_services',
          'continuous_monitoring',
          'clinical_team_notification',
        ];
      case RiskLevel.CRITICAL:
        return [
          'activate_hitl',
          'emergency_services',
          'continuous_monitoring',
        ];
      case RiskLevel.HIGH:
        return [
          'professional_referral',
          'safety_check',
          'follow_up',
        ];
      case RiskLevel.MODERATE:
        return [
          'monitoring',
          'support_resources',
          'check_in',
        ];
      case RiskLevel.LOW:
        return [
          'general_support',
          'self_care',
          'regular_check',
        ];
      default:
        return ['general_support'];
    }
  }

  /**
   * Get crisis scenario if detected (for response generation)
   */
  getCrisisScenario(message: string): CrisisScenario | null {
    return detectCrisis(message);
  }
}

// Export singleton
export const centralRiskScoringService = new CentralRiskScoringService();
export default centralRiskScoringService;
