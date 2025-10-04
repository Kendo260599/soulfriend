/**
 * Encryption middleware for SoulFriend V3.0
 * Automatically encrypts/decrypts sensitive data in requests/responses
 */

import { Request, Response, NextFunction } from 'express';
import { encryptionService } from '../utils/encryption';

// Fields that should be encrypted
const SENSITIVE_FIELDS = [
  'answers',
  'evaluation',
  'personalInfo',
  'name',
  'email',
  'phone',
  'address',
  'medicalHistory',
  'notes'
];

/**
 * Middleware to encrypt sensitive data in request body
 */
export const encryptRequestData = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = encryptSensitiveFields(req.body);
    }
    next();
  } catch (error) {
    console.error('Encryption middleware error:', error);
    // Don't fail the request, just log the error
    next();
  }
};

/**
 * Middleware to decrypt sensitive data in response
 */
export const decryptResponseData = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(data: any) {
    try {
      if (data && typeof data === 'object') {
        // Parse JSON if it's a string
        let parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        
        // Decrypt sensitive fields
        if (parsedData.data) {
          parsedData.data = decryptSensitiveFields(parsedData.data);
        } else {
          parsedData = decryptSensitiveFields(parsedData);
        }
        
        // Send the decrypted data
        return originalSend.call(this, JSON.stringify(parsedData));
      }
    } catch (error) {
      console.error('Decryption middleware error:', error);
      // If decryption fails, send original data
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Encrypt sensitive fields in an object
 */
function encryptSensitiveFields(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => encryptSensitiveFields(item));
  }

  const encrypted = { ...obj };

  Object.keys(encrypted).forEach(key => {
    if (SENSITIVE_FIELDS.includes(key) && encrypted[key] != null) {
      try {
        // Only encrypt if not already encrypted
        if (typeof encrypted[key] === 'string' && !isEncrypted(encrypted[key])) {
          encrypted[key] = encryptionService.encrypt(encrypted[key]);
        } else if (typeof encrypted[key] === 'object') {
          encrypted[key] = encryptionService.encrypt(JSON.stringify(encrypted[key]));
        }
      } catch (error) {
        console.error(`Failed to encrypt field ${key}:`, error);
        // Keep original value if encryption fails
      }
    } else if (typeof encrypted[key] === 'object') {
      // Recursively encrypt nested objects
      encrypted[key] = encryptSensitiveFields(encrypted[key]);
    }
  });

  return encrypted;
}

/**
 * Decrypt sensitive fields in an object
 */
function decryptSensitiveFields(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => decryptSensitiveFields(item));
  }

  const decrypted = { ...obj };

  Object.keys(decrypted).forEach(key => {
    if (SENSITIVE_FIELDS.includes(key) && decrypted[key] != null) {
      try {
        // Only decrypt if it looks encrypted
        if (typeof decrypted[key] === 'string' && isEncrypted(decrypted[key])) {
          const decryptedValue = encryptionService.decrypt(decrypted[key]);
          
          // Try to parse as JSON, fallback to string
          try {
            decrypted[key] = JSON.parse(decryptedValue);
          } catch {
            decrypted[key] = decryptedValue;
          }
        }
      } catch (error) {
        console.error(`Failed to decrypt field ${key}:`, error);
        // Keep original value if decryption fails
      }
    } else if (typeof decrypted[key] === 'object') {
      // Recursively decrypt nested objects
      decrypted[key] = decryptSensitiveFields(decrypted[key]);
    }
  });

  return decrypted;
}

/**
 * Check if a string looks like encrypted data (base64 encoded)
 */
function isEncrypted(value: string): boolean {
  try {
    // Check if it's a valid base64 string with reasonable length
    return /^[A-Za-z0-9+/]+=*$/.test(value) && value.length > 20;
  } catch {
    return false;
  }
}

/**
 * Middleware specifically for test results encryption
 */
export const encryptTestResult = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body && req.body.answers) {
      // Encrypt test answers
      req.body.encryptedAnswers = encryptionService.encrypt(JSON.stringify(req.body.answers));
      
      // Keep original answers for processing, remove before saving
      req.body._originalAnswers = req.body.answers;
    }
    next();
  } catch (error) {
    console.error('Test result encryption error:', error);
    next();
  }
};

/**
 * Middleware for personal information encryption
 */
export const encryptPersonalInfo = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body && req.body.personalInfo) {
      req.body.personalInfo = encryptionService.encryptPersonalInfo(req.body.personalInfo);
    }
    next();
  } catch (error) {
    console.error('Personal info encryption error:', error);
    next();
  }
};

/**
 * Middleware to decrypt personal information in responses
 */
export const decryptPersonalInfo = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  
  res.json = function(data: any) {
    try {
      if (data && data.personalInfo) {
        data.personalInfo = encryptionService.decryptPersonalInfo(data.personalInfo);
      }
      
      if (data && data.data && Array.isArray(data.data)) {
        data.data = data.data.map((item: any) => {
          if (item.personalInfo) {
            item.personalInfo = encryptionService.decryptPersonalInfo(item.personalInfo);
          }
          return item;
        });
      }
    } catch (error) {
      console.error('Personal info decryption error:', error);
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};
