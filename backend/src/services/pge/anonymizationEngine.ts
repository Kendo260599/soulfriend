/**
 * ANONYMIZATION ENGINE
 * 
 * PDD Privacy Layer — đảm bảo không lưu PII trong research data
 * 
 * Chức năng:
 * - SHA256 hash cho userId/sessionId (one-way, irreversible)
 * - PII detection & removal từ text (tên, SĐT, email, địa chỉ)
 * - Separate personal info khỏi research data
 * 
 * Tuân thủ:
 * - GDPR Article 4(5): Pseudonymization
 * - IRB: Minimal risk through de-identification
 * 
 * @module services/pge/anonymizationEngine
 * @version 1.0.0
 */

import crypto from 'crypto';
import { logger } from '../../utils/logger';

// ════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════

/**
 * RESEARCH_SALT phải được set trong environment variables.
 * Dùng crypto.randomBytes(32).toString('hex') để generate.
 * KHÔNG ĐƯỢC hardcode trong production.
 */
const RESEARCH_SALT = process.env.RESEARCH_HASH_SALT || 'soulfriend-research-dev-salt';

/** Vietnamese name patterns (common surnames + given names) */
const VIETNAMESE_SURNAMES = [
  'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ',
  'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý',
];

// ════════════════════════════════════════════════════════════════
// PII PATTERNS (compiled once)
// ════════════════════════════════════════════════════════════════

const PII_PATTERNS: Array<{ pattern: RegExp; replacement: string; label: string }> = [
  // Email addresses
  {
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    replacement: '[EMAIL]',
    label: 'email',
  },
  // Vietnamese phone numbers (10-11 digits, with optional +84/0 prefix)
  {
    pattern: /(?:\+84|0)\d{9,10}/g,
    replacement: '[PHONE]',
    label: 'phone',
  },
  // International phone numbers
  {
    pattern: /\+\d{1,3}[-.\s]?\d{6,12}/g,
    replacement: '[PHONE]',
    label: 'phone_intl',
  },
  // URLs
  {
    pattern: /https?:\/\/[^\s<>"{}|\\^`[\]]+/g,
    replacement: '[URL]',
    label: 'url',
  },
  // IP addresses
  {
    pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    replacement: '[IP]',
    label: 'ip',
  },
  // Vietnamese ID numbers (CCCD: 12 digits, CMND: 9 digits)
  {
    pattern: /\b\d{9}(?:\d{3})?\b/g,
    replacement: '[ID_NUMBER]',
    label: 'id_number',
  },
  // Date of birth patterns (dd/mm/yyyy, dd-mm-yyyy)
  {
    pattern: /\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b/g,
    replacement: '[DATE]',
    label: 'date',
  },
  // Credit card numbers (basic pattern)
  {
    pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    replacement: '[CARD]',
    label: 'credit_card',
  },
];

// ════════════════════════════════════════════════════════════════
// ANONYMIZATION ENGINE CLASS
// ════════════════════════════════════════════════════════════════

class AnonymizationEngine {

  // ────────────────────────────────────────────────
  // HASHING
  // ────────────────────────────────────────────────

  /**
   * SHA256 hash cho userId → participantHash
   * One-way, irreversible. Same userId always → same hash.
   */
  hashUserId(userId: string): string {
    return crypto
      .createHash('sha256')
      .update(userId + RESEARCH_SALT)
      .digest('hex')
      .substring(0, 32); // Use first 32 chars (128 bits — sufficient for research)
  }

  /**
   * SHA256 hash cho sessionId
   */
  hashSessionId(sessionId: string): string {
    return crypto
      .createHash('sha256')
      .update(sessionId + RESEARCH_SALT)
      .digest('hex')
      .substring(0, 32);
  }

  // ────────────────────────────────────────────────
  // PII REMOVAL
  // ────────────────────────────────────────────────

  /**
   * Xóa PII khỏi text
   * 
   * @param text - raw text (user message, therapist note, etc.)
   * @returns Sanitized text (PII replaced with placeholders)
   */
  removePII(text: string): { sanitized: string; piiFound: string[] } {
    let sanitized = text;
    const piiFound: string[] = [];

    // Apply regex patterns
    for (const { pattern, replacement, label } of PII_PATTERNS) {
      // Reset regex lastIndex (global flag)
      pattern.lastIndex = 0;
      if (pattern.test(sanitized)) {
        piiFound.push(label);
        pattern.lastIndex = 0;
        sanitized = sanitized.replace(pattern, replacement);
      }
    }

    // Vietnamese name detection (surname followed by capitalized word)
    for (const surname of VIETNAMESE_SURNAMES) {
      const namePattern = new RegExp(
        `${surname}\\s+[A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ][a-zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]+(?:\\s+[A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ][a-zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]+)*`,
        'g'
      );
      if (namePattern.test(sanitized)) {
        piiFound.push('vietnamese_name');
        sanitized = sanitized.replace(namePattern, '[NAME]');
      }
    }

    return { sanitized, piiFound };
  }

  /**
   * Generate text statistics without preserving content
   * (for research metadata — no text content, only numeric features)
   */
  textToMetrics(text: string): {
    wordCount: number;
    sentenceCount: number;
    avgWordLength: number;
    questionMarkCount: number;
    exclamationCount: number;
  } {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      avgWordLength: words.length > 0
        ? words.reduce((sum, w) => sum + w.length, 0) / words.length
        : 0,
      questionMarkCount: (text.match(/\?/g) || []).length,
      exclamationCount: (text.match(/!/g) || []).length,
    };
  }

  // ────────────────────────────────────────────────
  // BULK OPERATIONS
  // ────────────────────────────────────────────────

  /**
   * Anonymize a batch of records
   */
  anonymizeBatch<T extends { userId: string; sessionId?: string }>(
    records: T[]
  ): Array<T & { participantHash: string; sessionHash?: string }> {
    return records.map(r => ({
      ...r,
      participantHash: this.hashUserId(r.userId),
      sessionHash: r.sessionId ? this.hashSessionId(r.sessionId) : undefined,
    }));
  }
}

// ════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ════════════════════════════════════════════════════════════════

export const anonymizationEngine = new AnonymizationEngine();
