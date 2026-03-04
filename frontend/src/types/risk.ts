/**
 * Unified Risk Level Types (Frontend)
 *
 * Mirrors backend risk levels for type consistency.
 * The backend sends these values via API responses.
 */

export type RiskLevel = 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'EXTREME';

/**
 * Check if a risk level requires immediate emergency response
 */
export function isEmergencyLevel(level: RiskLevel): boolean {
  return level === 'CRITICAL' || level === 'EXTREME';
}

/**
 * Check if a risk level requires professional referral
 */
export function isReferralLevel(level: RiskLevel): boolean {
  return level === 'HIGH' || level === 'CRITICAL' || level === 'EXTREME';
}
