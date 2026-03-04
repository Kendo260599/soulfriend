/**
 * ANONYMIZATION SERVICE
 *
 * Server-side data anonymization & pseudonymization for GDPR compliance.
 * Provides:
 *   - HMAC-based pseudonymization (reversible with key)
 *   - k-anonymity via generalization
 *   - Field-level redaction
 *   - Research data export with de-identification
 *
 * @module services/anonymizationService
 * @version 1.0.0
 */

import crypto from 'crypto';
import logger from '../utils/logger';

// =============================================================================
// TYPES
// =============================================================================

export interface AnonymizationConfig {
  /** HMAC secret for pseudonymization (from env) */
  hmacSecret: string;
  /** Fields to always redact (replace with [REDACTED]) */
  redactFields: string[];
  /** Fields to pseudonymize (HMAC hash) */
  pseudonymizeFields: string[];
  /** Age generalization bucket size (e.g., 5 → 20-24, 25-29) */
  ageBucketSize: number;
}

export interface AnonymizedRecord {
  [key: string]: any;
  _anonymized: true;
  _anonymizedAt: string;
  _anonymizationVersion: string;
}

// =============================================================================
// SERVICE
// =============================================================================

export class AnonymizationService {
  private config: AnonymizationConfig;

  constructor(config?: Partial<AnonymizationConfig>) {
    this.config = {
      hmacSecret: process.env.ANONYMIZATION_SECRET || process.env.ENCRYPTION_KEY || 'default-anonymization-key',
      redactFields: [
        'password', 'passwordHash', 'token', 'refreshToken',
        'ipAddress', 'ip', 'userAgent', 'phone', 'address',
      ],
      pseudonymizeFields: [
        'userId', 'email', 'name', 'sessionId', 'expertId',
        'reviewedBy', 'acknowledgedBy',
      ],
      ageBucketSize: 5,
      ...config,
    };
  }

  // =========================================================================
  // PSEUDONYMIZATION (HMAC-based, consistent for same input)
  // =========================================================================

  /**
   * Pseudonymize a value using HMAC-SHA256
   * Same input always produces the same output (for joining anonymous datasets)
   */
  pseudonymize(value: string): string {
    if (!value) return '';
    return 'ANON_' + crypto
      .createHmac('sha256', this.config.hmacSecret)
      .update(value.toLowerCase().trim())
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Pseudonymize an email — preserves domain for analytics
   */
  pseudonymizeEmail(email: string): string {
    if (!email || !email.includes('@')) return this.pseudonymize(email);
    const [local, domain] = email.split('@');
    return this.pseudonymize(local) + '@' + domain;
  }

  // =========================================================================
  // GENERALIZATION (k-anonymity support)
  // =========================================================================

  /**
   * Generalize age into bucket (e.g., 23 → "20-24")
   */
  generalizeAge(age: number): string {
    const bucket = this.config.ageBucketSize;
    const lower = Math.floor(age / bucket) * bucket;
    const upper = lower + bucket - 1;
    return `${lower}-${upper}`;
  }

  /**
   * Generalize date to month precision (remove day/time)
   */
  generalizeDate(date: Date | string): string {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Generalize location to region level
   */
  generalizeLocation(location: string): string {
    // For Vietnamese cities, generalize to region
    const regions: Record<string, string> = {
      'hà nội': 'Miền Bắc',
      'hải phòng': 'Miền Bắc',
      'đà nẵng': 'Miền Trung',
      'huế': 'Miền Trung',
      'hồ chí minh': 'Miền Nam',
      'cần thơ': 'Miền Nam',
    };

    const normalized = location.toLowerCase().trim();
    for (const [city, region] of Object.entries(regions)) {
      if (normalized.includes(city)) return region;
    }
    return 'Khác';
  }

  // =========================================================================
  // REDACTION
  // =========================================================================

  /**
   * Redact a field value completely
   */
  redact(_value: any): string {
    return '[REDACTED]';
  }

  /**
   * Partially redact (e.g., email: j***@gmail.com)
   */
  partialRedact(value: string, visibleChars: number = 1): string {
    if (!value || value.length <= visibleChars) return '***';

    if (value.includes('@')) {
      const [local, domain] = value.split('@');
      return local.substring(0, visibleChars) + '***@' + domain;
    }

    return value.substring(0, visibleChars) + '***';
  }

  // =========================================================================
  // RECORD-LEVEL ANONYMIZATION
  // =========================================================================

  /**
   * Anonymize an entire record/object based on config
   */
  anonymizeRecord(record: any): AnonymizedRecord {
    if (!record || typeof record !== 'object') {
      return record;
    }

    const anonymized: any = Array.isArray(record) ? [...record] : { ...record };

    for (const key of Object.keys(anonymized)) {
      // Skip internal MongoDB fields
      if (key === '_id' || key === '__v') continue;

      // Redact sensitive fields
      if (this.config.redactFields.includes(key)) {
        anonymized[key] = this.redact(anonymized[key]);
        continue;
      }

      // Pseudonymize identity fields
      if (this.config.pseudonymizeFields.includes(key)) {
        if (key === 'email' || key.toLowerCase().includes('email')) {
          anonymized[key] = this.pseudonymizeEmail(anonymized[key]);
        } else {
          anonymized[key] = this.pseudonymize(String(anonymized[key]));
        }
        continue;
      }

      // Handle age generalization
      if (key === 'age' && typeof anonymized[key] === 'number') {
        anonymized[key] = this.generalizeAge(anonymized[key]);
        continue;
      }

      // Recursively anonymize nested objects
      if (anonymized[key] && typeof anonymized[key] === 'object' && !Array.isArray(anonymized[key]) && !(anonymized[key] instanceof Date)) {
        anonymized[key] = this.anonymizeRecord(anonymized[key]);
      }
    }

    return {
      ...anonymized,
      _anonymized: true,
      _anonymizedAt: new Date().toISOString(),
      _anonymizationVersion: '1.0',
    };
  }

  /**
   * Anonymize an array of records
   */
  anonymizeDataset(records: any[]): AnonymizedRecord[] {
    return records.map(r => this.anonymizeRecord(r));
  }

  // =========================================================================
  // RESEARCH EXPORT HELPERS
  // =========================================================================

  /**
   * Prepare test results for research export (de-identified)
   */
  anonymizeTestResult(testResult: any): AnonymizedRecord {
    const anonymized = this.anonymizeRecord(testResult);

    // Additional: generalize dates
    if (anonymized.completedAt) {
      anonymized.completedAt = this.generalizeDate(anonymized.completedAt);
    }
    if (anonymized.createdAt) {
      anonymized.createdAt = this.generalizeDate(anonymized.createdAt);
    }

    // Remove raw answers, keep only scores
    if (anonymized.answers) {
      anonymized.answers = '[REDACTED - scores preserved]';
    }

    return anonymized;
  }

  /**
   * Prepare conversation data for research (de-identified)
   */
  anonymizeConversation(conversation: any): AnonymizedRecord {
    const anonymized = this.anonymizeRecord(conversation);

    // Redact actual message content, keep metadata
    if (anonymized.messages && Array.isArray(anonymized.messages)) {
      anonymized.messages = anonymized.messages.map((msg: any) => ({
        role: msg.role,
        timestamp: msg.timestamp ? this.generalizeDate(msg.timestamp) : undefined,
        messageLength: typeof msg.content === 'string' ? msg.content.length : 0,
        // Content is redacted
        content: '[REDACTED]',
      }));
    }

    return anonymized;
  }

  /**
   * Prepare HITL feedback for research (de-identified)
   */
  anonymizeFeedback(feedback: any): AnonymizedRecord {
    const anonymized = this.anonymizeRecord(feedback);

    // Keep clinical metrics, pseudonymize identifiers
    // userMessage should be redacted for research
    if (anonymized.userMessage) {
      anonymized.userMessageLength = anonymized.userMessage.length;
      anonymized.userMessage = '[REDACTED]';
    }

    return anonymized;
  }

  // =========================================================================
  // UTILITY
  // =========================================================================

  /**
   * Check if a record has been anonymized
   */
  isAnonymized(record: any): boolean {
    return record?._anonymized === true;
  }

  /**
   * Get anonymization stats for a dataset
   */
  getAnonymizationStats(records: AnonymizedRecord[]): {
    totalRecords: number;
    fieldsRedacted: number;
    fieldsPseudonymized: number;
  } {
    let fieldsRedacted = 0;
    let fieldsPseudonymized = 0;

    for (const record of records) {
      for (const [, value] of Object.entries(record)) {
        if (value === '[REDACTED]') fieldsRedacted++;
        if (typeof value === 'string' && value.startsWith('ANON_')) fieldsPseudonymized++;
      }
    }

    return {
      totalRecords: records.length,
      fieldsRedacted,
      fieldsPseudonymized,
    };
  }
}

// Export singleton
export const anonymizationService = new AnonymizationService();
export default anonymizationService;
