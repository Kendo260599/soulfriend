/**
 * Encryption utilities for SoulFriend V3.0
 * Provides secure encryption/decryption for sensitive data
 */

import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

export class EncryptionService {
  private encryptionKey: Buffer;

  constructor() {
    const key = process.env.ENCRYPTION_KEY;

    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    if (key.length < 32) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
    }

    // Derive a consistent key from the environment variable
    this.encryptionKey = crypto.scryptSync(key, 'soulfriend-salt', KEY_LENGTH);
  }

  /**
   * Encrypt sensitive data
   * @param plaintext - The data to encrypt
   * @returns Encrypted data with IV and auth tag
   */
  encrypt(plaintext: string): string {
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv);
      cipher.setAAD(Buffer.from('soulfriend-aad'));

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      // Combine IV + authTag + encrypted data
      const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]);

      return combined.toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed: ${(error as Error).message}`);
    }
  }

  /**
   * Decrypt sensitive data
   * @param encryptedData - The encrypted data to decrypt
   * @returns Decrypted plaintext
   */
  decrypt(encryptedData: string): string {
    try {
      const combined = Buffer.from(encryptedData, 'base64');

      // Extract components
      const iv = combined.subarray(0, IV_LENGTH);
      const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
      const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH);

      const decipher = crypto.createDecipheriv(ALGORITHM, this.encryptionKey, iv);
      decipher.setAAD(Buffer.from('soulfriend-aad'));
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${(error as Error).message}`);
    }
  }

  /**
   * Hash sensitive data (one-way)
   * @param data - The data to hash
   * @param salt - Optional salt (will generate if not provided)
   * @returns Hash with salt
   */
  hash(data: string, salt?: string): { hash: string; salt: string } {
    try {
      const actualSalt = salt || crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync(data, actualSalt, 64).toString('hex');

      return { hash, salt: actualSalt };
    } catch (error) {
      throw new Error(`Hashing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Verify hashed data
   * @param data - The original data
   * @param hash - The stored hash
   * @param salt - The salt used for hashing
   * @returns True if data matches hash
   */
  verifyHash(data: string, hash: string, salt: string): boolean {
    try {
      const { hash: computedHash } = this.hash(data, salt);
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a secure random token
   * @param length - Token length in bytes (default: 32)
   * @returns Random token as hex string
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate a secure random password
   * @param length - Password length (default: 16)
   * @returns Random password
   */
  generatePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }

    return password;
  }

  /**
   * Encrypt test result data specifically
   * @param testResult - Test result object
   * @returns Encrypted test result
   */
  encryptTestResult(testResult: any): any {
    const sensitiveFields = ['answers', 'evaluation', 'personalInfo'];
    const encrypted = { ...testResult };

    sensitiveFields.forEach(field => {
      if (encrypted[field]) {
        encrypted[field] = this.encrypt(JSON.stringify(encrypted[field]));
      }
    });

    return encrypted;
  }

  /**
   * Decrypt test result data specifically
   * @param encryptedTestResult - Encrypted test result object
   * @returns Decrypted test result
   */
  decryptTestResult(encryptedTestResult: any): any {
    const sensitiveFields = ['answers', 'evaluation', 'personalInfo'];
    const decrypted = { ...encryptedTestResult };

    sensitiveFields.forEach(field => {
      if (decrypted[field] && typeof decrypted[field] === 'string') {
        try {
          decrypted[field] = JSON.parse(this.decrypt(decrypted[field]));
        } catch (error) {
          // Field might not be encrypted, leave as is
        }
      }
    });

    return decrypted;
  }

  /**
   * Encrypt personal information
   * @param personalInfo - Personal information object
   * @returns Encrypted personal information
   */
  encryptPersonalInfo(personalInfo: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    [key: string]: any;
  }): any {
    const encrypted: any = {};

    Object.keys(personalInfo).forEach(key => {
      if (personalInfo[key]) {
        encrypted[key] = this.encrypt(personalInfo[key].toString());
      }
    });

    return encrypted;
  }

  /**
   * Decrypt personal information
   * @param encryptedPersonalInfo - Encrypted personal information object
   * @returns Decrypted personal information
   */
  decryptPersonalInfo(encryptedPersonalInfo: any): any {
    const decrypted: any = {};

    Object.keys(encryptedPersonalInfo).forEach(key => {
      if (encryptedPersonalInfo[key]) {
        try {
          decrypted[key] = this.decrypt(encryptedPersonalInfo[key]);
        } catch (error) {
          // Field might not be encrypted, leave as is
          decrypted[key] = encryptedPersonalInfo[key];
        }
      }
    });

    return decrypted;
  }
}

// Singleton instance
export const encryptionService = new EncryptionService();

// Utility functions for backward compatibility
export const encrypt = (data: string): string => encryptionService.encrypt(data);
export const decrypt = (encryptedData: string): string => encryptionService.decrypt(encryptedData);
export const hashData = (data: string, salt?: string) => encryptionService.hash(data, salt);
export const verifyHash = (data: string, hash: string, salt: string): boolean =>
  encryptionService.verifyHash(data, hash, salt);
export const generateToken = (length?: number): string => encryptionService.generateToken(length);
export const generatePassword = (length?: number): string =>
  encryptionService.generatePassword(length);
