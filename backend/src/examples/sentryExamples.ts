/**
 * SENTRY USAGE EXAMPLES
 * Copy các functions này vào code của bạn
 */

import { Request, Response, NextFunction } from 'express';
import { 
  captureException, 
  captureMessage, 
  logger,
  setUserContext,
  clearUserContext,
  addBreadcrumb,
  withSpan,
  setTags,
  setContext
} from '../config/sentry';

// Extend Express Request type
declare module 'express' {
  interface Request {
    user?: {
      id: string;
      email: string;
      username?: string;
    };
  }
}

// ============================================================================
// EXAMPLE 1: Basic Error Logging
// ============================================================================

export async function exampleErrorLogging() {
  try {
    // Your code that might throw error
    throw new Error('Something went wrong');
  } catch (error) {
    // Capture error with context
    if (error instanceof Error) {
      captureException(error, {
        action: 'example_action',
        userId: 'user123',
        endpoint: '/api/example'
      });
    }
    
    // Re-throw if needed
    throw error;
  }
}

// ============================================================================
// EXAMPLE 2: User Context Tracking
// ============================================================================

export function exampleUserLogin(user: any) {
  // Set user context sau khi login
  setUserContext(user.id, user.email, user.username);
  
  // Log successful login
  logger.info('User logged in', {
    userId: user.id,
    loginTime: new Date().toISOString()
  });
}

export function exampleUserLogout() {
  // Clear user context khi logout
  clearUserContext();
  
  logger.info('User logged out');
}

// ============================================================================
// EXAMPLE 3: Breadcrumbs for Debugging Trail
// ============================================================================

export async function exampleWithBreadcrumbs(userId: string, testType: string) {
  // Add breadcrumb - user started action
  addBreadcrumb('User started clinical test', 'user', 'info', {
    userId,
    testType
  });
  
  try {
    // Add breadcrumb - fetching test questions
    addBreadcrumb('Fetching test questions', 'api', 'info', {
      testType
    });
    
    const questions = await fetchTestQuestions(testType);
    
    // Add breadcrumb - questions fetched
    addBreadcrumb('Questions fetched successfully', 'api', 'info', {
      questionCount: questions.length
    });
    
    return questions;
  } catch (error) {
    // Error will include all breadcrumbs
    if (error instanceof Error) {
      captureException(error, {
        action: 'fetch_test_questions',
        testType,
        userId
      });
    }
    throw error;
  }
}

async function fetchTestQuestions(testType: string) {
  // Mock function
  return [];
}

// ============================================================================
// EXAMPLE 4: Performance Tracking
// ============================================================================

export async function examplePerformanceTracking(userId: string) {
  // Track database query performance
  const user = await withSpan('database.findUser', async () => {
    return await findUserById(userId);
  });
  
  // Track external API call performance
  const tests = await withSpan('database.getUserTests', async () => {
    return await getUserTests(userId);
  });
  
  return { user, tests };
}

async function findUserById(userId: string) {
  // Mock function
  return { id: userId, name: 'Test User' };
}

async function getUserTests(userId: string) {
  // Mock function
  return [];
}

// ============================================================================
// EXAMPLE 5: Structured Logging
// ============================================================================

export function exampleStructuredLogging() {
  // Debug log
  logger.debug('Debugging variable value', {
    variable: 'testVar',
    value: 123
  });
  
  // Info log
  logger.info('Operation completed successfully', {
    operation: 'user_registration',
    duration: 250
  });
  
  // Warning log
  logger.warn('Rate limit approaching', {
    current: 90,
    limit: 100,
    percentage: 90
  });
  
  // Error log
  logger.error('Payment failed', {
    errorCode: 'CARD_DECLINED',
    amount: 100,
    currency: 'USD'
  });
}

// ============================================================================
// EXAMPLE 6: Express Route with Full Sentry Integration
// ============================================================================

export async function exampleExpressRoute(req: Request, res: Response) {
  try {
    // Set user context from JWT token
    if (req.user) {
      setUserContext(req.user.id, req.user.email);
    }
    
    // Add breadcrumb
    addBreadcrumb('Starting user test submission', 'user', 'info', {
      testType: req.body.testType,
      userId: req.user?.id
    });
    
    // Track performance
    const result = await withSpan('process.testSubmission', async () => {
      return await processTestSubmission(req.body);
    });
    
    // Log success
    logger.info('Test submitted successfully', {
      userId: req.user?.id,
      testId: result.id,
      score: result.totalScore
    });
    
    res.json(result);
  } catch (error) {
    // Capture error with full context
    if (error instanceof Error) {
      captureException(error, {
        action: 'submit_test',
        userId: req.user?.id,
        testType: req.body.testType,
        endpoint: req.path,
        method: req.method,
        ip: req.ip
      });
    }
    
    res.status(500).json({ error: 'Failed to submit test' });
  }
}

async function processTestSubmission(data: any) {
  // Mock function
  return { id: '123', totalScore: 85 };
}

// ============================================================================
// EXAMPLE 7: Tags and Context
// ============================================================================

export function exampleTagsAndContext() {
  // Set custom tags (for filtering in Sentry)
  setTags({
    environment: 'production',
    version: '1.2.3',
    region: 'us-east-1'
  });
  
  // Set custom context
  setContext('payment', {
    provider: 'stripe',
    amount: 100,
    currency: 'USD',
    customerId: 'cus_123'
  });
  
  // Now any errors will include these tags and context
}

// ============================================================================
// EXAMPLE 8: MongoDB Error Handling
// ============================================================================

export async function exampleMongoDBError(userId: string, testData: any) {
  try {
    addBreadcrumb('Saving test result to MongoDB', 'database', 'info', {
      userId,
      testType: testData.testType
    });
    
    const result = await withSpan('mongodb.saveTestResult', async () => {
      return await saveTestResult(testData);
    });
    
    logger.info('Test result saved', {
      testId: result.id,
      userId
    });
    
    return result;
  } catch (error) {
    // Check if it's a MongoDB error
    if (error instanceof Error) {
      if (error.name === 'MongoError' && 'code' in error) {
        captureException(error, {
          action: 'save_test_result',
          errorType: 'mongodb',
          errorCode: (error as any).code,
          userId
        });
      } else {
        captureException(error, {
          action: 'save_test_result',
          userId
        });
      }
    }
    
    throw error;
  }
}

async function saveTestResult(data: any) {
  // Mock function
  return { id: '123' };
}

// ============================================================================
// EXAMPLE 9: External API Call with Retry
// ============================================================================

export async function exampleExternalAPIWithRetry(email: string) {
  let attempt = 0;
  const maxAttempts = 3;
  
  while (attempt < maxAttempts) {
    attempt++;
    
    try {
      addBreadcrumb(`Sending email (attempt ${attempt})`, 'api', 'info', {
        email,
        attempt
      });
      
      const result = await withSpan('api.sendgrid.send', async () => {
        return await sendEmail(email);
      });
      
      logger.info('Email sent successfully', {
        email,
        attempt,
        messageId: result.messageId
      });
      
      return result;
    } catch (error) {
      if (attempt === maxAttempts) {
        // Final attempt failed
        if (error instanceof Error) {
          captureException(error, {
            action: 'send_email',
            email,
            attempts: maxAttempts,
            provider: 'sendgrid'
          });
        }
        throw error;
      }
      
      // Log retry
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.warn(`Email send failed, retrying...`, {
        email,
        attempt,
        error: errorMsg
      });
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

async function sendEmail(email: string) {
  // Mock function
  return { messageId: 'msg_123' };
}

// ============================================================================
// EXAMPLE 10: Middleware Error Handler
// ============================================================================

export function sentryErrorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Add request context
  addBreadcrumb('Error occurred', 'error', 'error', {
    path: req.path,
    method: req.method,
    statusCode: res.statusCode
  });
  
  // Capture error with full request context
  captureException(error, {
    path: req.path,
    method: req.method,
    query: req.query,
    body: req.body,
    headers: req.headers,
    ip: req.ip,
    userId: req.user?.id
  });
  
  // Pass to next error handler
  next(error);
}

// ============================================================================
// USAGE IN YOUR CODE
// ============================================================================

/*
// In your routes/controllers:
import { 
  captureException, 
  logger, 
  setUserContext,
  addBreadcrumb 
} from '../config/sentry';

router.post('/api/tests/submit', async (req, res) => {
  try {
    setUserContext(req.user.id, req.user.email);
    addBreadcrumb('Test submission started', 'user', 'info');
    
    const result = await processTest(req.body);
    
    logger.info('Test submitted successfully', { 
      testId: result.id,
      userId: req.user.id 
    });
    
    res.json(result);
  } catch (error) {
    captureException(error, {
      action: 'submit_test',
      userId: req.user.id
    });
    res.status(500).json({ error: 'Failed' });
  }
});
*/
