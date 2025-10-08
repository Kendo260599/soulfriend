/**
 * Advanced error handling middleware for SoulFriend V3.0
 * Provides comprehensive error handling, logging, and user-friendly responses
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'express-validator';

import logger from '../utils/logger';
import config from '../config/environment';

import mongoose from 'mongoose';
// Custom error types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationAppError extends AppError {
  public errors: any[];

  constructor(errors: any[], message: string = 'Validation failed') {
    super(message, 400);
    this.errors = errors;
    this.code = 'VALIDATION_ERROR';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
    this.code = 'AUTHENTICATION_ERROR';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403);
    this.code = 'AUTHORIZATION_ERROR';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
    this.code = 'NOT_FOUND_ERROR';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
    this.code = 'CONFLICT_ERROR';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429);
    this.code = 'RATE_LIMIT_ERROR';
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Format error for client response
 */
function formatErrorResponse(error: any, req: Request): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string,
    },
  };

  // Add details for validation errors
  if (error instanceof ValidationAppError) {
    response.error.details = error.errors;
  }

  // Don't expose sensitive information in production
  if (config.NODE_ENV === 'production') {
    // Only show generic messages for server errors
    if (error.statusCode >= 500) {
      response.error.message = 'Internal server error';
      delete response.error.details;
    }
  } else {
    // In development, include stack trace
    response.error.details = {
      ...response.error.details,
      stack: error.stack,
    };
  }

  return response;
}

/**
 * Handle different types of errors
 */
function handleSpecificErrors(error: any): AppError {
  // Mongoose validation errors
  if (error instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(error.errors).map((err: any) => ({
      field: err.path,
      message: err.message,
      value: err.value,
    }));
    return new ValidationAppError(errors, 'Validation failed');
  }

  // Mongoose cast errors
  if (error instanceof mongoose.Error.CastError) {
    return new AppError(`Invalid ${error.path}: ${error.value}`, 400);
  }

  // MongoDB duplicate key errors
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || 'field';
    return new ConflictError(`${field} already exists`);
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token');
  }

  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired');
  }

  // Multer errors (file upload)
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new AppError('File too large', 413);
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError('Unexpected file field', 400);
  }

  // Return original error if it's already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // Default to internal server error
  return new AppError('Internal server error', 500, false);
}

/**
 * Log error with appropriate level and context
 */
function logError(error: AppError, req: Request): void {
  const metadata = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.headers['x-request-id'],
    userId: (req as any).user?.id,
    body: req.method !== 'GET' ? req.body : undefined,
    query: req.query,
    params: req.params,
  };

  // Log based on error severity
  if (error.statusCode >= 500) {
    logger.error(error.message, metadata, error);
  } else if (error.statusCode >= 400) {
    logger.warn(error.message, metadata);
  } else {
    logger.info(error.message, metadata);
  }

  // Log security-related errors
  if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
    logger.security(`Security violation: ${error.message}`, {
      ...metadata,
      errorType: error.constructor.name,
    });
  }
}

/**
 * Main error handling middleware
 */
export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction): void => {
  // Handle the error
  const appError = handleSpecificErrors(error);

  // Log the error
  logError(appError, req);

  // Send response
  const errorResponse = formatErrorResponse(appError, req);
  res.status(appError.statusCode).json(errorResponse);
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Route ${req.method} ${req.originalUrl}`);
  next(error);
};

/**
 * Request timeout handler
 */
export const timeoutHandler = (timeout: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timer = setTimeout(() => {
      const error = new AppError('Request timeout', 408);
      next(error);
    }, timeout);

    // Clear timeout when response finishes
    res.on('finish', () => {
      clearTimeout(timer);
    });

    next();
  };
};

/**
 * Validation error handler for express-validator
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map((error: any) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error._location,
    }));

    const appError = new ValidationAppError(validationErrors);
    return next(appError);
  }

  next();
};

/**
 * Rate limit error handler
 */
export const rateLimitHandler = (req: Request, res: Response): void => {
  const error = new RateLimitError('Too many requests, please try again later');
  const errorResponse = formatErrorResponse(error, req);

  logger.security('Rate limit exceeded', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    url: req.originalUrl,
  });

  res.status(429).json(errorResponse);
};

/**
 * Graceful shutdown handler
 */
export const gracefulShutdown = (server: any): void => {
  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);

    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

// Note: Error classes are already exported above, no need to re-export
