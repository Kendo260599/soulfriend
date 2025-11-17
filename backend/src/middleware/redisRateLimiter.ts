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

  // Memory-based fallback for when Redis is unavailable
  const memoryStore = new Map<string, { count: number; resetTime: number }>();

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Generate unique key for this request
      const identifier = keyGenerator(req);
      const key = `ratelimit:${req.path}:${identifier}`;
      const windowSeconds = Math.ceil(windowMs / 1000);

      // Wait a bit for Redis to connect (max 2 seconds)
      let retries = 10;
      while (!redisService.isReady() && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Wait 200ms
        retries--;
      }

      // If Redis still not ready after waiting, use memory-based fallback
      if (!redisService.isReady()) {
        console.warn('⚠️ Redis not ready, using memory-based rate limiting fallback');
        
        // Clean up expired entries
        const now = Date.now();
        for (const [k, v] of memoryStore.entries()) {
          if (v.resetTime < now) {
            memoryStore.delete(k);
          }
        }

        // Check memory store
        const record = memoryStore.get(key);
        if (record && record.resetTime > now) {
          if (record.count >= maxRequests) {
            const retryAfter = Math.ceil((record.resetTime - now) / 1000);
            res.set({
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': record.resetTime.toString(),
              'Retry-After': retryAfter.toString(),
            });
            return res.status(429).json({
              error: 'Too Many Requests',
              message: message + ' (memory fallback)',
              retryAfter,
            });
          }
          // Increment count
          record.count++;
          res.set({
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': Math.max(0, maxRequests - record.count).toString(),
            'X-RateLimit-Reset': record.resetTime.toString(),
          });
        } else {
          // Create new record
          memoryStore.set(key, {
            count: 1,
            resetTime: now + windowMs,
          });
          res.set({
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': (maxRequests - 1).toString(),
            'X-RateLimit-Reset': (now + windowMs).toString(),
          });
        }
        return next();
      }

      // Redis is ready - use Redis-based rate limiting
      // NOTE: redisService.isRateLimited already adds 'ratelimit:' prefix
      // So we pass the key WITHOUT the prefix
      const keyWithoutPrefix = `${req.path}:${identifier}`;
      
      console.log('✅ Rate limiter check:', {
        path: req.path,
        identifier,
        keyWithoutPrefix,
        redisReady: redisService.isReady(),
      });

      // Check rate limit (redisService adds 'ratelimit:' prefix internally)
      const isLimited = await redisService.isRateLimited(keyWithoutPrefix, maxRequests, windowSeconds);

      if (isLimited) {
        // Get remaining TTL (add prefix for TTL check)
        const ttl = await redisService.ttl(`ratelimit:${keyWithoutPrefix}`);
        
        console.log('🚫 Rate limit exceeded:', {
          key: `ratelimit:${keyWithoutPrefix}`,
          maxRequests,
          ttl,
        });

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
      const fullKey = `ratelimit:${keyWithoutPrefix}`;
      const currentCount = await client.get(fullKey);
      const count = currentCount ? parseInt(currentCount) : 0;

      console.log('✅ Rate limit OK:', {
        key: fullKey,
        currentCount: count,
        remaining: Math.max(0, maxRequests - count),
      });

      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, maxRequests - count).toString(),
        'X-RateLimit-Reset': (Date.now() + windowSeconds * 1000).toString(),
      });

      next();
    } catch (error) {
      // If rate limiting fails, log error but don't block request
      console.error('❌ Rate limiter error:', error);
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
