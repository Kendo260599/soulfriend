/**
 * Sentry Logger Usage Examples
 * Shows how to use the new logger interface
 */

import { logger } from '../config/sentry';

// ============================================
// EXAMPLE 1: Basic Logging
// ============================================

// Debug log (for development debugging)
logger.debug('Variable value check', { 
  userId: '12345',
  value: 123 
});

// Info log (general information)
logger.info('User triggered test log', { 
  action: 'test_log',
  timestamp: new Date().toISOString()
});

// Warning log (potential issues)
logger.warn('Rate limit approaching', { 
  current: 90,
  limit: 100,
  percentage: 90
});

// Error log (errors that don't throw exceptions)
logger.error('Failed to send email', { 
  recipient: 'user@example.com',
  errorCode: 'SMTP_TIMEOUT',
  retryCount: 3
});

// ============================================
// EXAMPLE 2: API Request Logging
// ============================================

export function logAPIRequest(endpoint: string, method: string, userId?: string) {
  logger.info('API request received', {
    endpoint,
    method,
    userId,
    timestamp: Date.now(),
  });
}

// Usage:
// logAPIRequest('/api/users', 'POST', 'user123');

// ============================================
// EXAMPLE 3: Database Operation Logging
// ============================================

export function logDatabaseQuery(operation: string, collection: string, duration: number) {
  if (duration > 1000) {
    // Log slow queries as warnings
    logger.warn('Slow database query detected', {
      operation,
      collection,
      duration,
      threshold: 1000,
    });
  } else {
    // Normal queries as debug
    logger.debug('Database query executed', {
      operation,
      collection,
      duration,
    });
  }
}

// Usage:
// logDatabaseQuery('find', 'users', 1500); // Will log as warning

// ============================================
// EXAMPLE 4: User Action Logging
// ============================================

export function logUserAction(userId: string, action: string, metadata?: Record<string, any>) {
  logger.info('User action', {
    userId,
    action,
    ...metadata,
    timestamp: new Date().toISOString(),
  });
}

// Usage:
// logUserAction('user123', 'payment_completed', { amount: 100, currency: 'USD' });
// logUserAction('user456', 'profile_updated', { fields: ['email', 'name'] });

// ============================================
// EXAMPLE 5: Error Context Logging
// ============================================

export function logErrorContext(error: Error, context: Record<string, any>) {
  logger.error('Error occurred with context', {
    errorMessage: error.message,
    errorStack: error.stack,
    ...context,
  });
}

// Usage:
// try {
//   await processPayment(userId, amount);
// } catch (error) {
//   logErrorContext(error as Error, {
//     userId: 'user123',
//     amount: 100,
//     paymentMethod: 'card',
//   });
// }

// ============================================
// EXAMPLE 6: Performance Logging
// ============================================

export function logPerformance(operation: string, startTime: number) {
  const duration = Date.now() - startTime;
  
  if (duration > 3000) {
    logger.warn('Slow operation detected', {
      operation,
      duration,
      threshold: 3000,
    });
  } else {
    logger.debug('Operation completed', {
      operation,
      duration,
    });
  }
}

// Usage:
// const start = Date.now();
// await someExpensiveOperation();
// logPerformance('someExpensiveOperation', start);

// ============================================
// EXAMPLE 7: Business Event Logging
// ============================================

export function logBusinessEvent(eventName: string, data: Record<string, any>) {
  logger.info(`Business event: ${eventName}`, {
    event: eventName,
    ...data,
    timestamp: new Date().toISOString(),
  });
}

// Usage:
// logBusinessEvent('user_registered', { userId: 'user123', plan: 'premium' });
// logBusinessEvent('payment_received', { amount: 100, currency: 'USD' });
// logBusinessEvent('subscription_cancelled', { userId: 'user123', reason: 'too_expensive' });

// ============================================
// EXAMPLE 8: Integration with Express Middleware
// ============================================

import { Request, Response, NextFunction } from 'express';

export function sentryLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  // Log incoming request
  logger.debug('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
  });
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    
    if (logLevel === 'error') {
      logger.error('Request failed', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
      });
    } else {
      logger.info('Request completed', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
      });
    }
  });
  
  next();
}

// Usage in index.ts:
// app.use(sentryLoggerMiddleware);

// ============================================
// IMPORTANT NOTES
// ============================================

/*
1. All logs appear in Sentry Logs view (not just Issues)
2. Logs are automatically correlated with traces and errors
3. Context data is searchable in Sentry dashboard
4. Use appropriate log levels:
   - debug: Development debugging, verbose info
   - info: Important events, user actions
   - warn: Potential issues, degraded performance
   - error: Errors that don't throw exceptions

5. Logs are captured by consoleIntegration, so they work even 
   if Sentry is disabled (will just console.log locally)

6. In production, all logs are sent to Sentry with full context
7. Query logs in Sentry: https://sentry.io/organizations/[org]/logs/

Search examples in Sentry:
- message:"User triggered test log"
- action:test_log
- userId:12345
- duration:>1000
- level:error
*/
