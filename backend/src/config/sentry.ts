/**
 * Sentry Configuration
 * Error monitoring and performance tracking for production
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import config from './environment';

/**
 * Initialize Sentry for error tracking and performance monitoring
 * Only runs in production or when SENTRY_ENABLED=true
 */
export function initSentry(): void {
  // Only enable Sentry in production or if explicitly enabled
  const isProduction = config.NODE_ENV === 'production';
  const isSentryEnabled = process.env.SENTRY_ENABLED === 'true';
  
  if (!isProduction && !isSentryEnabled) {
    console.log('ℹ️  Sentry disabled (not in production)');
    return;
  }

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.warn('⚠️  SENTRY_DSN not configured - skipping Sentry initialization');
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment: config.NODE_ENV,
      
      // Performance Monitoring
      tracesSampleRate: config.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // Profiling
      profilesSampleRate: config.NODE_ENV === 'production' ? 0.1 : 1.0,
      integrations: [
        nodeProfilingIntegration(),
      ],

      // Error filtering
      beforeSend(event, hint) {
        // Don't send errors in development unless explicitly enabled
        if (config.NODE_ENV === 'development' && !isSentryEnabled) {
          return null;
        }

        // Filter out specific errors
        const error = hint.originalException;
        if (error instanceof Error) {
          // Don't send MongoDB connection errors (handled gracefully)
          if (error.message.includes('MongoServerError')) {
            return null;
          }
        }

        return event;
      },
    });

    console.log('✅ Sentry initialized successfully');
    console.log(`   Environment: ${config.NODE_ENV}`);
    console.log(`   DSN: ${dsn.substring(0, 30)}...`);
  } catch (error) {
    console.error('❌ Failed to initialize Sentry:', error);
  }
}

/**
 * Capture an exception and send to Sentry
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (context) {
    Sentry.setContext('custom', context);
  }
  Sentry.captureException(error);
}

/**
 * Capture a message and send to Sentry
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export function setUserContext(userId: string, email?: string): void {
  Sentry.setUser({
    id: userId,
    email,
  });
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUserContext(): void {
  Sentry.setUser(null);
}
