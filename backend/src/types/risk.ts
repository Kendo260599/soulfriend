/**
 * Unified Risk Level Types
 *
 * Single source of truth for all risk-related types across the application.
 * Replaces 4+ inconsistent naming schemes:
 *   - chatbotService:          'CRISIS' | 'HIGH' | 'MED' | 'LOW'
 *   - moderationService:       'low' | 'moderate' | 'high' | 'critical'
 *   - crisisManagementData:    'low' | 'medium' | 'high' | 'critical'
 *   - enhancedChatbotService:  'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
 *   - HITL models:             'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'EXTREME'
 *
 * @module types/risk
 * @version 1.0.0
 */

// =============================================================================
// CANONICAL RISK LEVELS
// =============================================================================

/**
 * Canonical risk level enum — used across ALL services.
 *
 * NONE     → No risk detected
 * LOW      → Minimal concern, routine support
 * MODERATE → Some concern, monitor closely
 * HIGH     → Significant risk, professional referral
 * CRITICAL → Immediate danger, activate HITL crisis intervention
 * EXTREME  → Imminent threat, activate HITL + emergency services
 */
export enum RiskLevel {
  NONE = 'NONE',
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  EXTREME = 'EXTREME',
}

/**
 * Risk levels that trigger HITL (Human-In-The-Loop) intervention
 */
export const HITL_TRIGGER_LEVELS: ReadonlySet<RiskLevel> = new Set([
  RiskLevel.CRITICAL,
  RiskLevel.EXTREME,
]);

/**
 * Risk levels that require professional referral
 */
export const REFERRAL_LEVELS: ReadonlySet<RiskLevel> = new Set([
  RiskLevel.HIGH,
  RiskLevel.CRITICAL,
  RiskLevel.EXTREME,
]);

/**
 * Check if a risk level triggers HITL intervention
 */
export function isHITLTrigger(level: RiskLevel): boolean {
  return HITL_TRIGGER_LEVELS.has(level);
}

/**
 * Check if a risk level requires professional referral
 */
export function requiresReferral(level: RiskLevel): boolean {
  return REFERRAL_LEVELS.has(level);
}

// =============================================================================
// RISK TYPES
// =============================================================================

/**
 * Type of risk detected
 */
export type RiskType = 'suicidal' | 'self_harm' | 'psychosis' | 'violence' | 'general';

// =============================================================================
// RISK SCORING
// =============================================================================

/**
 * Numeric risk score (0-100)
 */
export type RiskScore = number;

/**
 * Result from a single risk detection source
 */
export interface RiskSignal {
  source: 'lexical' | 'crisis_keywords' | 'moderation' | 'sentiment' | 'ai' | 'history';
  level: RiskLevel;
  score: RiskScore;
  confidence: number; // 0..1
  details?: {
    category?: string;
    matchedKeywords?: string[];
    riskType?: RiskType;
  };
}

/**
 * Aggregated risk assessment — output of CentralRiskScoringService
 */
export interface RiskAssessment {
  /** Final determined risk level */
  level: RiskLevel;
  /** Numeric risk score 0-100 */
  score: RiskScore;
  /** Detected risk type */
  riskType: RiskType;
  /** Individual signals that contributed */
  signals: RiskSignal[];
  /** Whether HITL should be activated */
  shouldActivateHITL: boolean;
  /** Whether professional referral is needed */
  shouldRefer: boolean;
  /** Risk factors identified */
  riskFactors: string[];
  /** Recommended actions */
  recommendations: string[];
  /** Timestamp of assessment */
  timestamp: Date;
}

// =============================================================================
// BACKWARD COMPATIBILITY — Mapping from old naming schemes
// =============================================================================

/**
 * Map old lowercase risk levels to canonical RiskLevel.
 * Handles: 'low', 'moderate', 'medium', 'high', 'critical'
 */
export function fromLowercase(level: string): RiskLevel {
  const mapping: Record<string, RiskLevel> = {
    none: RiskLevel.NONE,
    low: RiskLevel.LOW,
    moderate: RiskLevel.MODERATE,
    medium: RiskLevel.MODERATE, // 'medium' → MODERATE
    high: RiskLevel.HIGH,
    critical: RiskLevel.CRITICAL,
    extreme: RiskLevel.EXTREME,
  };
  return mapping[level.toLowerCase()] ?? RiskLevel.NONE;
}

/**
 * Map old uppercase risk levels to canonical RiskLevel.
 * Handles: 'CRISIS', 'HIGH', 'MED', 'LOW', 'MEDIUM', 'CRITICAL'
 */
export function fromUppercase(level: string): RiskLevel {
  const mapping: Record<string, RiskLevel> = {
    NONE: RiskLevel.NONE,
    LOW: RiskLevel.LOW,
    MED: RiskLevel.MODERATE, // 'MED' → MODERATE
    MEDIUM: RiskLevel.MODERATE, // 'MEDIUM' → MODERATE
    MODERATE: RiskLevel.MODERATE,
    HIGH: RiskLevel.HIGH,
    CRISIS: RiskLevel.CRITICAL, // 'CRISIS' → CRITICAL
    CRITICAL: RiskLevel.CRITICAL,
    EXTREME: RiskLevel.EXTREME,
  };
  return mapping[level.toUpperCase()] ?? RiskLevel.NONE;
}

/**
 * Convert RiskLevel to numeric score for memory storage
 */
export function toNumericScore(level: RiskLevel): number {
  const mapping: Record<RiskLevel, number> = {
    [RiskLevel.NONE]: 0,
    [RiskLevel.LOW]: 2,
    [RiskLevel.MODERATE]: 5,
    [RiskLevel.HIGH]: 7,
    [RiskLevel.CRITICAL]: 9,
    [RiskLevel.EXTREME]: 10,
  };
  return mapping[level] ?? 0;
}

/**
 * Convert numeric score back to RiskLevel
 */
export function fromNumericScore(score: number): RiskLevel {
  if (score >= 9) return RiskLevel.EXTREME;
  if (score >= 7) return RiskLevel.CRITICAL;
  if (score >= 5) return RiskLevel.HIGH;
  if (score >= 3) return RiskLevel.MODERATE;
  if (score >= 1) return RiskLevel.LOW;
  return RiskLevel.NONE;
}

/**
 * Compare two risk levels. Returns:
 *  -1 if a < b
 *   0 if a === b
 *   1 if a > b
 */
export function compareRiskLevels(a: RiskLevel, b: RiskLevel): -1 | 0 | 1 {
  const order: Record<RiskLevel, number> = {
    [RiskLevel.NONE]: 0,
    [RiskLevel.LOW]: 1,
    [RiskLevel.MODERATE]: 2,
    [RiskLevel.HIGH]: 3,
    [RiskLevel.CRITICAL]: 4,
    [RiskLevel.EXTREME]: 5,
  };
  const diff = order[a] - order[b];
  return diff < 0 ? -1 : diff > 0 ? 1 : 0;
}

/**
 * Return the higher of two risk levels
 */
export function maxRiskLevel(a: RiskLevel, b: RiskLevel): RiskLevel {
  return compareRiskLevels(a, b) >= 0 ? a : b;
}
