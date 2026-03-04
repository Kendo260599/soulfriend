/**
 * REQUEST CONTEXT MIDDLEWARE
 *
 * Adds observability context to every HTTP request:
 *  1. Request ID — unique correlation ID for distributed tracing
 *  2. Response time — X-Response-Time header + timing for logs
 *
 * Uses crypto.randomUUID() (Node.js 20+ built-in) — no external deps.
 *
 * @module middleware/requestContext
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import logger from '../utils/logger';

// Extend Express Request type with context fields
declare global {
  namespace Express {
    interface Request {
      id?: string;
      startTime?: number;
    }
  }
}

/**
 * Middleware: Assign a unique request ID and track timing
 *
 * - Accepts incoming `X-Request-Id` header (for upstream propagation)
 * - Generates a new UUID if none provided
 * - Sets `X-Request-Id` response header for downstream tracing
 * - Sets `X-Response-Time` header on response finish
 * - Logs all requests via structured logger.api()
 */
export function requestContext(req: Request, res: Response, next: NextFunction): void {
  // 1. Request ID — accept upstream or generate
  const requestId =
    (req.headers['x-request-id'] as string) ||
    randomUUID();

  req.id = requestId;
  req.startTime = Date.now();

  // Set response headers early so they're always present
  res.setHeader('X-Request-Id', requestId);

  // 2. On finish — calculate duration and log
  res.on('finish', () => {
    const duration = Date.now() - (req.startTime || Date.now());

    // Set response time header (some proxies read this)
    // Note: header may already be sent, but setHeader before finish is safe
    // We'll use a different approach — set it before first write
    // (already set below via writeHead override)

    // Structured API log
    logger.api(req.method, req.originalUrl || req.path, res.statusCode, duration, {
      requestId,
      ip: req.ip,
      userAgent: req.get('User-Agent')?.substring(0, 100),
    });

    // Warn on slow requests
    if (duration > 3000) {
      logger.performance(`Slow request: ${req.method} ${req.path}`, duration, {
        requestId,
        statusCode: res.statusCode,
      });
    }
  });

  // 3. Override writeHead to inject X-Response-Time before headers are sent
  const originalWriteHead = res.writeHead.bind(res);
  (res as any).writeHead = function (
    statusCode: number,
    ...args: any[]
  ) {
    const duration = Date.now() - (req.startTime || Date.now());
    res.setHeader('X-Response-Time', `${duration}ms`);
    return originalWriteHead(statusCode, ...args);
  };

  next();
}

export default requestContext;
