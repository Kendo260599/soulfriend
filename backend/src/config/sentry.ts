/**
 * Sentry Configuration - SoulFriend V4.0
 * Error monitoring, performance tracking & profiling for production
 * 
 * Setup according to Sentry Node.js SDK documentation:
 * https://docs.sentry.io/platforms/javascript/guides/node/
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import config from './environment';

/**
 * Initialize Sentry for error tracking and performance monitoring
 * Auto-enables in production (NODE_ENV=production) or when SENTRY_ENABLED=true
 * 
 * Features:
 * - Error tracking with stack traces
 * - Performance monitoring (tracing)
 * - Profiling integration
 * - Automatic breadcrumbs
 * - Release tracking
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
      
      // Release tracking for better error grouping
      release: process.env.RENDER_GIT_COMMIT || 'development',
      
      // Performance Monitoring
      // Capture 100% of transactions for complete visibility
      tracesSampleRate: 1.0,
      
      // Profiling - captures function-level performance data
      // Sample 100% of traced transactions for detailed insights
      profilesSampleRate: 1.0,
      
      // PII (Personally Identifiable Information) Collection
      // Sends default PII data like IP addresses, user agents
      // Helps with debugging and user context in errors
      sendDefaultPii: true,
      
      // Integrations
      integrations: [
        // Node.js profiling for performance insights
        nodeProfilingIntegration(),
        
        // Console logging integration - captures console.log, console.error, etc.
        Sentry.consoleIntegration({
          levels: ['log', 'warn', 'error'], // Capture these console levels
        }),
      ],
      
      // Enable debug mode in development
      debug: config.NODE_ENV === 'development',

      // Error filtering - customize what gets sent to Sentry
      beforeSend(event, hint) {
        // Don't send errors in development unless explicitly enabled
        if (config.NODE_ENV === 'development' && !isSentryEnabled) {
          return null;
        }

        // Filter out specific error types
        const error = hint.originalException;
        if (error instanceof Error) {
          const message = error.message.toLowerCase();
          
          // Don't send database connection errors (handled gracefully)
          if (message.includes('mongoservererror') || 
              message.includes('econnrefused') ||
              message.includes('connection refused')) {
            return null;
          }
          
          // Don't send Redis connection errors (non-critical)
          if (message.includes('redis') && message.includes('connect')) {
            return null;
          }
          
          // Don't send validation errors (expected user input errors)
          if (message.includes('validation') || message.includes('invalid input')) {
            return null;
          }
        }
        
        // Add custom context
        if (event.request) {
          event.tags = {
            ...event.tags,
            route: event.request.url,
            method: event.request.method,
          };
        }

        return event;
      },
      
      // Breadcrumbs - customize what context is captured
      beforeBreadcrumb(breadcrumb) {
        // Filter out noisy breadcrumbs
        if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
          return null; // Skip console.log breadcrumbs
        }
        return breadcrumb;
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
 * Capture an exception and send to Sentry with optional context
 * @param error - The error object to capture
 * @param context - Additional context data (user info, request details, etc.)
 * @example
 * captureException(error, {
 *   userId: '12345',
 *   action: 'create_user',
 *   endpoint: '/api/users'
 * });
 */
export function captureException(error: Error, context?: Record<string, any>): string | undefined {
  if (context) {
    Sentry.setContext('custom', context);
  }
  return Sentry.captureException(error);
}

/**
 * Capture a message and send to Sentry
 * @param message - The message to log
 * @param level - Severity level (fatal, error, warning, info, debug)
 * @example
 * captureMessage('User payment processed successfully', 'info');
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): string {
  return Sentry.captureMessage(message, level);
}

/**
 * Log a message to Sentry (will appear in Logs view)
 * Unlike captureMessage, this is for general logging not just errors
 * @param message - Log message
 * @param level - Log level (debug, info, warning, error)
 * @param context - Additional context data
 * @example
 * logToSentry('User logged in successfully', 'info', { userId: '123' });
 */
export function logToSentry(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>
): void {
  // Use console methods which are captured by consoleIntegration
  const logData = context ? `${message} ${JSON.stringify(context)}` : message;
  
  switch (level) {
    case 'debug':
      console.debug(`[Sentry] ${logData}`);
      break;
    case 'info':
      console.log(`[Sentry] ${logData}`);
      break;
    case 'warning':
      console.warn(`[Sentry] ${logData}`);
      break;
    case 'error':
      console.error(`[Sentry] ${logData}`);
      break;
  }
}

/**
 * Sentry Logger - Structured logging interface
 * Mimics Sentry.logger API for easier migration
 */
export const logger = {
  /**
   * Log debug message
   * @example logger.debug('Variable value:', { value: 123 });
   */
  debug(message: string, context?: Record<string, any>): void {
    logToSentry(message, 'debug', context);
  },

  /**
   * Log info message
   * @example logger.info('User triggered test log', { action: 'test_log' });
   */
  info(message: string, context?: Record<string, any>): void {
    logToSentry(message, 'info', context);
  },

  /**
   * Log warning message
   * @example logger.warn('Rate limit approaching', { current: 90, limit: 100 });
   */
  warn(message: string, context?: Record<string, any>): void {
    logToSentry(message, 'warning', context);
  },

  /**
   * Log error message
   * @example logger.error('Failed to process', { errorCode: 'TIMEOUT' });
   */
  error(message: string, context?: Record<string, any>): void {
    logToSentry(message, 'error', context);
  },
};

/**
 * Set user context for error tracking
 * Attaches user info to all subsequent errors
 * @param userId - Unique user identifier
 * @param email - User email (optional)
 * @param username - Username (optional)
 */
export function setUserContext(userId: string, email?: string, username?: string): void {
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
}

/**
 * Clear user context (e.g., on logout)
 * Removes user info from subsequent errors
 */
export function clearUserContext(): void {
  Sentry.setUser(null);
}

/**
 * Add a breadcrumb for debugging context
 * Breadcrumbs are like a trail of events leading up to an error
 * @param message - Breadcrumb message
 * @param category - Category (navigation, user, api, etc.)
 * @param level - Severity level
 * @param data - Additional data
 * @example
 * addBreadcrumb('User clicked payment button', 'user', 'info', { amount: 100 });
 */
export function addBreadcrumb(
  message: string,
  category: string = 'custom',
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Start a new span for performance tracking
 * Use this to track performance of specific operations
 * @param name - Span name (e.g., 'database.query', 'api.call')
 * @param callback - Function to execute within the span
 * @example
 * await withSpan('database.findUser', async () => {
 *   return await User.findById(id);
 * });
 */
export async function withSpan<T>(
  name: string,
  callback: () => Promise<T>
): Promise<T> {
  return await Sentry.startSpan(
    {
      name,
      op: 'function',
    },
    callback
  );
}

/**
 * Set custom tags for filtering errors in Sentry dashboard
 * @param tags - Key-value pairs of tags
 * @example
 * setTags({ environment: 'staging', version: '1.2.3' });
 */
export function setTags(tags: Record<string, string>): void {
  Sentry.setTags(tags);
}

/**
 * Set custom context data
 * @param name - Context name
 * @param context - Context data object
 * @example
 * setContext('payment', { provider: 'stripe', amount: 100 });
 */
export function setContext(name: string, context: Record<string, any> | null): void {
  Sentry.setContext(name, context);
}
