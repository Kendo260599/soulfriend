import { Request, Response, NextFunction } from 'express';
import redisService from '../services/redisService';

/**
 * Redis-based Rate Limiter Middleware
 * Prevents API abuse by limiting requests per time window
 */

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  keyGenerator?: (req: Request) => string; // Custom key generator
}

/**
 * Create rate limiter middleware
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = (req: Request) => {
      // Default: use userId if authenticated, otherwise IP
      const userId = (req as any).user?.id || (req as any).user?._id;
      return userId ? `user:${userId}` : `ip:${req.ip}`;
    },
  } = config;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if Redis is ready, if not try to connect
      if (!redisService.isReady()) {
        try {
          await redisService.connect();
        } catch (error) {
          // If Redis connection fails, skip rate limiting but log it
          console.warn('⚠️ Redis not available, skipping rate limiting');
          return next();
        }
      }

      // Generate unique key for this request
      const identifier = keyGenerator(req);
      const key = `ratelimit:${req.path}:${identifier}`;
      const windowSeconds = Math.ceil(windowMs / 1000);

      // Check rate limit
      const isLimited = await redisService.isRateLimited(key, maxRequests, windowSeconds);

      if (isLimited) {
        // Get remaining TTL
        const ttl = await redisService.ttl(key);
        
        // Set rate limit headers
        res.set({
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': (Date.now() + ttl * 1000).toString(),
          'Retry-After': ttl.toString(),
        });

        return res.status(429).json({
          error: 'Too Many Requests',
          message,
          retryAfter: ttl,
        });
      }

      // Set rate limit headers for successful requests
      const client = redisService.getClient();
      const currentCount = await client.get(key);
      const count = currentCount ? parseInt(currentCount) : 0;

      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, maxRequests - count).toString(),
        'X-RateLimit-Reset': (Date.now() + windowSeconds * 1000).toString(),
      });

      next();
    } catch (error) {
      // If rate limiting fails, log error but don't block request
      console.error('Rate limiter error:', error);
      next();
    }
  };
}

/**
 * Pre-configured rate limiters
 */

// General API rate limiter: 100 requests per minute
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  message: 'Too many API requests, please try again in a minute',
});

// Auth rate limiter: 5 login attempts per 15 minutes
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Too many login attempts, please try again in 15 minutes',
  keyGenerator: (req: Request) => `ip:${req.ip}`, // Always use IP for auth
});

// Chatbot rate limiter: 20 messages per minute
export const chatbotRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20,
  message: 'Too many chat messages, please slow down',
  keyGenerator: (req: Request) => {
    // Use userId from body if available, otherwise IP
    const userId = (req.body as any)?.userId;
    return userId ? `chatbot:user:${userId}` : `chatbot:ip:${req.ip}`;
  },
});

// Heavy operation rate limiter: 10 requests per 5 minutes
export const heavyOperationRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 10,
  message: 'This operation is rate-limited, please try again later',
});

export default {
  createRateLimiter,
  apiRateLimiter,
  authRateLimiter,
  chatbotRateLimiter,
  heavyOperationRateLimiter,
};
