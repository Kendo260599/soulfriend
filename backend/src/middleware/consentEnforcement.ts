/**
 * CONSENT ENFORCEMENT MIDDLEWARE
 *
 * Verifies user has active, specific consent before processing requests.
 * Integrates with the granular Consent model for GDPR Art. 6 & 7 compliance.
 *
 * Usage:
 *   router.post('/chat', requireConsent('dataProcessing'), chatHandler);
 *   router.post('/test', requireConsent('dataProcessing', 'aiProcessing'), testHandler);
 *
 * @module middleware/consentEnforcement
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import Consent, { IConsent } from '../models/Consent';
import logger from '../utils/logger';

// Valid consent type keys matching the Consent model
type ConsentType = 'dataProcessing' | 'analytics' | 'research' | 'aiProcessing' | 'marketing';

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
      // Fail open for availability — log the error but don't block mental health access
      next();
    }
  };
}

/**
 * Middleware: Check consent but don't block (soft enforcement)
 * Logs warnings for analytics/research consent but allows request to proceed
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
