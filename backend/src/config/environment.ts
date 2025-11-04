/**
 * Environment configuration for SoulFriend V3.0
 * Centralizes all environment variable handling with validation
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment validation schema
interface EnvironmentConfig {
  // Application
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  APP_NAME: string;

  // Database
  MONGODB_URI: string;
  MONGO_DB_NAME: string;

  // Security
  JWT_SECRET: string;
  ENCRYPTION_KEY: string;

  // Admin
  DEFAULT_ADMIN_USERNAME: string;
  DEFAULT_ADMIN_EMAIL: string;
  DEFAULT_ADMIN_PASSWORD: string;

  // CORS
  CORS_ORIGIN: string[];

  // Optional services
  REDIS_URL?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;

  // Logging
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  LOG_FILE?: string;

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;

  // File upload
  MAX_FILE_SIZE: number;
  UPLOAD_PATH: string;

  // External APIs
  OPENAI_API_KEY?: string;
  GEMINI_API_KEY?: string;
  AZURE_COGNITIVE_KEY?: string;
  // Legacy (deprecated)
  CEREBRAS_API_KEY?: string;

  // Monitoring
  SENTRY_DSN?: string;
  HEALTH_CHECK_INTERVAL: number;

  // Backup
  BACKUP_SCHEDULE?: string;
  BACKUP_RETENTION_DAYS: number;
  BACKUP_PATH: string;
}

/**
 * Parse and validate environment variables
 */
function parseEnvironment(): EnvironmentConfig {
  // Helper functions
  const getEnv = (key: string, defaultValue?: string): string => {
    const value = process.env[key] || defaultValue;
    if (!value) {
      throw new Error(`Environment variable ${key} is required`);
    }
    return value;
  };

  const getEnvNumber = (key: string, defaultValue?: number): number => {
    const value = process.env[key];
    if (!value && defaultValue === undefined) {
      throw new Error(`Environment variable ${key} is required`);
    }
    const parsed = parseInt(value || defaultValue?.toString() || '0', 10);
    if (isNaN(parsed)) {
      throw new Error(`Environment variable ${key} must be a number`);
    }
    return parsed;
  };

  const getEnvArray = (key: string, defaultValue: string[] = []): string[] => {
    const value = process.env[key];
    if (!value) {
      return defaultValue;
    }
    return value.split(',').map(item => item.trim());
  };

  const getEnvOptional = (key: string): string | undefined => {
    return process.env[key];
  };

  // Validate NODE_ENV
  const nodeEnv = process.env.NODE_ENV as EnvironmentConfig['NODE_ENV'];
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be development, production, or test');
  }

  // Validate LOG_LEVEL
  const logLevel = (process.env.LOG_LEVEL || 'info') as EnvironmentConfig['LOG_LEVEL'];
  if (!['error', 'warn', 'info', 'debug'].includes(logLevel)) {
    throw new Error('LOG_LEVEL must be error, warn, info, or debug');
  }

  return {
    // Application
    NODE_ENV: nodeEnv,
    PORT: getEnvNumber('PORT', 5000),
    APP_NAME: getEnv('APP_NAME', 'SoulFriend V3.0 Expert Edition'),

    // Database
    MONGODB_URI: getEnv('MONGODB_URI', 'mongodb://localhost:27017/soulfriend'),
    MONGO_DB_NAME: getEnv('MONGO_DB_NAME', 'soulfriend'),

    // Security
    JWT_SECRET: getEnv('JWT_SECRET'),
    ENCRYPTION_KEY: getEnv('ENCRYPTION_KEY'),

    // Admin
    DEFAULT_ADMIN_USERNAME: getEnv('DEFAULT_ADMIN_USERNAME', 'admin'),
    DEFAULT_ADMIN_EMAIL: getEnv('DEFAULT_ADMIN_EMAIL', 'admin@soulfriend.com'),
    DEFAULT_ADMIN_PASSWORD: getEnv('DEFAULT_ADMIN_PASSWORD'),

    // CORS
    CORS_ORIGIN: getEnvArray('CORS_ORIGIN', [
      'http://localhost:3000',
      'https://soulfriend-kendo260599s-projects.vercel.app',
      'https://soulfriend.vercel.app',
      'file://'
    ]),

    // Optional services
    REDIS_URL: getEnvOptional('REDIS_URL'),
    SMTP_HOST: getEnvOptional('SMTP_HOST'),
    SMTP_PORT: process.env.SMTP_PORT ? getEnvNumber('SMTP_PORT') : undefined,
    SMTP_USER: getEnvOptional('SMTP_USER'),
    SMTP_PASS: getEnvOptional('SMTP_PASS'),

    // Logging
    LOG_LEVEL: logLevel,
    LOG_FILE: getEnvOptional('LOG_FILE'),

    // Rate limiting
    RATE_LIMIT_WINDOW_MS: getEnvNumber('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),

    // File upload
    MAX_FILE_SIZE: getEnvNumber('MAX_FILE_SIZE', 10485760), // 10MB
    UPLOAD_PATH: getEnv('UPLOAD_PATH', 'uploads/'),

    // External APIs
    OPENAI_API_KEY: getEnvOptional('OPENAI_API_KEY'),
    GEMINI_API_KEY: getEnvOptional('GEMINI_API_KEY'),
    AZURE_COGNITIVE_KEY: getEnvOptional('AZURE_COGNITIVE_KEY'),
    // Legacy (deprecated)
    CEREBRAS_API_KEY: getEnvOptional('CEREBRAS_API_KEY'),

    // Monitoring
    SENTRY_DSN: getEnvOptional('SENTRY_DSN'),
    HEALTH_CHECK_INTERVAL: getEnvNumber('HEALTH_CHECK_INTERVAL', 30000), // 30 seconds

    // Backup
    BACKUP_SCHEDULE: getEnvOptional('BACKUP_SCHEDULE'),
    BACKUP_RETENTION_DAYS: getEnvNumber('BACKUP_RETENTION_DAYS', 30),
    BACKUP_PATH: getEnv('BACKUP_PATH', '/backups'),
  };
}

/**
 * Validate critical security settings
 */
function validateSecurity(config: EnvironmentConfig): void {
  // JWT Secret validation
  if (config.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  // Encryption key validation
  if (config.ENCRYPTION_KEY.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
  }

  // Production-specific validations
  if (config.NODE_ENV === 'production') {
    // Check for default/weak passwords
    const weakPasswords = ['password', '123456', 'admin', 'test'];
    if (weakPasswords.some(weak => config.DEFAULT_ADMIN_PASSWORD.toLowerCase().includes(weak))) {
      throw new Error('DEFAULT_ADMIN_PASSWORD is too weak for production');
    }

    // Ensure HTTPS in production CORS origins
    const hasInsecureOrigins = config.CORS_ORIGIN.some(
      origin => origin.startsWith('http://') && !origin.includes('localhost')
    );
    if (hasInsecureOrigins) {
      console.warn('⚠️  Warning: Insecure HTTP origins detected in production CORS settings');
    }

    // Check for development secrets
    if (config.JWT_SECRET.includes('dev') || config.JWT_SECRET.includes('test')) {
      throw new Error('JWT_SECRET appears to be a development key. Use a production secret.');
    }
  }
}

/**
 * Log configuration summary (without sensitive data)
 */
function logConfiguration(config: EnvironmentConfig): void {
  console.log('🔧 SoulFriend V3.0 Configuration:');
  console.log(`   Environment: ${config.NODE_ENV}`);
  console.log(`   Port: ${config.PORT}`);
  console.log(`   Database: ${config.MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);
  console.log(`   CORS Origins: ${config.CORS_ORIGIN.join(', ')}`);
  console.log(`   Log Level: ${config.LOG_LEVEL}`);
  console.log(`   Redis: ${config.REDIS_URL ? 'Enabled' : 'Disabled'}`);
  console.log(`   SMTP: ${config.SMTP_HOST ? 'Enabled' : 'Disabled'}`);
    console.log(
      `   External APIs: ${config.OPENAI_API_KEY ? 'OpenAI ✓' : ''} ${config.GEMINI_API_KEY ? 'Gemini ✓' : ''} ${config.AZURE_COGNITIVE_KEY ? 'Azure ✓' : ''}`
    );
  console.log(`   Monitoring: ${config.SENTRY_DSN ? 'Sentry ✓' : 'Local only'}`);
}

// Parse and validate configuration
let config: EnvironmentConfig;

try {
  config = parseEnvironment();
  validateSecurity(config);

  if (config.NODE_ENV !== 'test') {
    logConfiguration(config);
  }
} catch (error) {
  console.error('❌ Configuration Error:', (error as Error).message);
  console.error('💡 Please check your environment variables and try again.');

  // Don't exit process in test environment
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  } else {
    // In test environment, throw error instead of exiting
    throw error;
  }
}

export default config;

// Export individual config sections for convenience
export const {
  NODE_ENV,
  PORT,
  APP_NAME,
  MONGODB_URI,
  MONGO_DB_NAME,
  JWT_SECRET,
  ENCRYPTION_KEY,
  DEFAULT_ADMIN_USERNAME,
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
  CORS_ORIGIN,
  REDIS_URL,
  LOG_LEVEL,
  LOG_FILE,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  MAX_FILE_SIZE,
  UPLOAD_PATH,
  OPENAI_API_KEY,
  GEMINI_API_KEY,
  AZURE_COGNITIVE_KEY,
  // Legacy (deprecated)
  CEREBRAS_API_KEY,
  SENTRY_DSN,
  HEALTH_CHECK_INTERVAL,
  BACKUP_SCHEDULE,
  BACKUP_RETENTION_DAYS,
  BACKUP_PATH,
} = config;
