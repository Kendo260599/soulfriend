/**
 * Rate Limiting Middleware
 * Protect against brute force and DDoS attacks
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

export class RateLimiter {
  private store: RateLimitStore = {};
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    
    // Clean up old entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  middleware = (req: Request, res: Response, next: NextFunction): void => {
    const key = this.getKey(req);
    const now = Date.now();

    if (!this.store[key] || now > this.store[key].resetTime) {
      this.store[key] = {
        count: 1,
        resetTime: now + this.windowMs
      };
      return next();
    }

    this.store[key].count++;

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', this.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, this.maxRequests - this.store[key].count));
    res.setHeader('X-RateLimit-Reset', new Date(this.store[key].resetTime).toISOString());

    if (this.store[key].count > this.maxRequests) {
      res.status(429).json({
        error: 'Too many requests',
        message: 'Bạn đã vượt quá giới hạn yêu cầu. Vui lòng thử lại sau.',
        retryAfter: Math.ceil((this.store[key].resetTime - now) / 1000)
      });
      return;
    }

    next();
  };

  private getKey(req: Request): string {
    // Use IP address and user ID if available
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userId = (req as any).user?.id || '';
    return `${ip}:${userId}`;
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (now > this.store[key].resetTime) {
        delete this.store[key];
      }
    });
  }
}

// Stricter rate limiting for authentication endpoints
export class AuthRateLimiter extends RateLimiter {
  constructor() {
    super(15 * 60 * 1000, 5); // 5 attempts per 15 minutes
  }
}

// Default rate limiter
export const rateLimiter = new RateLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
);

// Auth rate limiter
export const authRateLimiter = new AuthRateLimiter();

export default rateLimiter;

