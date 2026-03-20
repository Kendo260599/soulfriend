/**
 * CONSENT ENFORCEMENT MIDDLEWARE
 *
 * Verifies user has active, specific consent before processing requests.
 * Integrates with the granular Consent model for GDPR Art. 6 & 7 compliance.
 *
 * SECURITY: In production, fails CLOSED for critical consent types
 * (dataProcessing, research) to protect user data. Fails OPEN for
 * non-critical types (analytics, marketing) for better UX.
 *
 * This can be controlled via environment variable:
 *   CONSENT_FAIL_MODE=closed  - Block requests on consent errors (safer)
 *   CONSENT_FAIL_MODE=open    - Allow requests on consent errors (available)
 *
 * Usage:
 *   router.post('/chat', requireConsent('dataProcessing'), chatHandler);
 *   router.post('/test', requireConsent('dataProcessing', 'aiProcessing'), testHandler);
 *
 * @module middleware/consentEnforcement
 * @version 1.1.0
 */

import { Request, Response, NextFunction } from 'express';
import Consent, { IConsent } from '../models/Consent';
import logger from '../utils/logger';

// Valid consent type keys matching the Consent model
type ConsentType = 'dataProcessing' | 'analytics' | 'research' | 'aiProcessing' | 'marketing';

// Critical consent types that should FAIL CLOSED (block on error)
const CRITICAL_CONSENT_TYPES: ConsentType[] = ['dataProcessing', 'research'];

// Determine fail mode from environment (default: closed for security)
const CONSENT_FAIL_MODE = process.env.CONSENT_FAIL_MODE || 'closed';
const FAIL_CLOSED = CONSENT_FAIL_MODE === 'closed';

/**
 * Extract userId from request
 * Checks multiple sources: body, query, params, admin context
 */
function extractUserId(req: Request): string | null {
  return (
    (req.body as any)?.userId ||
    (req.query?.userId as string) ||
    (req.params?.userId as string) ||
    null
  );
}

/**
 * Middleware factory: require specific consent types before processing
 *
 * @param requiredTypes - One or more consent types that must be active
 * @returns Express middleware function
 *
 * @example
 * // Require data processing consent
 * router.post('/chat', requireConsent('dataProcessing'), handler);
 *
 * // Require multiple consent types
 * router.post('/research', requireConsent('dataProcessing', 'research'), handler);
 */
export function requireConsent(...requiredTypes: ConsentType[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = extractUserId(req);

      // If no userId, allow request (anonymous users — consent checked differently)
      if (!userId) {
        return next();
      }

      // Look up the most recent active consent for this user
      const consent = await (Consent as any).getActiveConsent(userId) as IConsent | null;

      if (!consent) {
        logger.warn(`[Consent] No active consent found for user ${userId}`);
        return res.status(403).json({
          success: false,
          message: 'Không tìm thấy sự đồng ý hoạt động. Vui lòng cập nhật tùy chọn đồng ý.',
          code: 'CONSENT_REQUIRED',
          requiredTypes,
        });
      }

      // Check each required consent type
      const missingConsents: string[] = [];
      for (const type of requiredTypes) {
        if (!consent.consentTypes?.[type]) {
          missingConsents.push(type);
        }
      }

      if (missingConsents.length > 0) {
        logger.warn(
          `[Consent] User ${userId} missing consent types: ${missingConsents.join(', ')}`
        );
        return res.status(403).json({
          success: false,
          message: `Thiếu sự đồng ý cho: ${missingConsents.join(', ')}. Vui lòng cập nhật tùy chọn.`,
          code: 'CONSENT_INSUFFICIENT',
          missingConsents,
        });
      }

      // Consent verified — attach to request for downstream use
      (req as any).consent = consent;
      next();
    } catch (error) {
      logger.error('[Consent] Error checking consent:', error);

      // SECURITY FIX: Determine if we should fail closed based on consent types
      const hasCriticalConsent = requiredTypes.some(type =>
        CRITICAL_CONSENT_TYPES.includes(type)
      );

      if (hasCriticalConsent && FAIL_CLOSED) {
        // Fail closed for critical data types (block request)
        logger.error(
          `[Consent] CRITICAL: Failed to verify critical consent types [${requiredTypes.join(', ')}] ` +
          `for user ${extractUserId(req)}. Blocked request for security.`
        );
        return res.status(503).json({
          success: false,
          message: 'Không thể xác minh đồng ý. Vui lòng thử lại sau.',
          code: 'CONSENT_CHECK_FAILED',
          retryable: true,
        });
      }

      // For non-critical types, fail open (allow but log)
      logger.warn(
        `[Consent] Non-critical consent check failed, allowing request (fail open mode). ` +
        `Required types: ${requiredTypes.join(', ')}`
      );
      next();
    }
  };
}

/**
 * Middleware: Check consent but don't block (soft enforcement)
 * Logs warnings for analytics/research consent but allows request to proceed
 * This is used for optional features that don't require consent
 */
export function checkConsent(...types: ConsentType[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = extractUserId(req);
      if (!userId) return next();

      const consent = await (Consent as any).getActiveConsent(userId) as IConsent | null;

      if (consent) {
        const missing = types.filter(t => !consent.consentTypes?.[t]);
        if (missing.length > 0) {
          logger.info(
            `[Consent] Soft check: user ${userId} missing optional consents: ${missing.join(', ')}`
          );
        }
        (req as any).consent = consent;
        (req as any).consentMissing = missing;
      } else {
        (req as any).consent = null;
        (req as any).consentMissing = types;
      }

      next();
    } catch (error) {
      logger.error('[Consent] Soft check error:', error);
      next();
    }
  };
}

export default { requireConsent, checkConsent };
