import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import config from '../config/environment';

// Rate limiting configuration
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || {
      success: false,
      message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau.',
        retryAfter: Math.round(windowMs / 1000),
      });
    },
  });
};

// General API rate limiting
export const apiRateLimit = createRateLimit(
  config.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  config.RATE_LIMIT_MAX_REQUESTS || 100 // 100 requests per window
);

// Strict rate limiting for auth endpoints
export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts per window
  'Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút.'
);

// Strict rate limiting for chatbot endpoints
export const chatbotRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  20, // 20 requests per minute
  'Quá nhiều yêu cầu chatbot, vui lòng thử lại sau.'
);

// Strict rate limiting for admin endpoints
export const adminRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  10, // 10 requests per minute
  'Quá nhiều yêu cầu admin, vui lòng thử lại sau.'
);

// Security headers configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

// IP whitelist middleware (for admin endpoints)
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

    if (!clientIP || !allowedIPs.includes(clientIP)) {
      return res.status(403).json({
        success: false,
        message: 'Truy cập bị từ chối từ IP này.',
      });
    }

    next();
  };
};

// Request size limiting middleware
export const requestSizeLimit = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const maxSizeBytes = parseSize(maxSize);

    if (contentLength > maxSizeBytes) {
      return res.status(413).json({
        success: false,
        message: 'Kích thước yêu cầu quá lớn.',
      });
    }

    next();
  };
};

// Parse size string to bytes
function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) {
    return 10 * 1024 * 1024;
  } // Default 10MB

  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';

  return Math.floor(value * (units[unit] || 1));
}

// Security logging middleware
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Log suspicious activities
  const suspiciousPatterns = [
    /\.\.\//, // Directory traversal
    /<script/i, // XSS attempts
    /union\s+select/i, // SQL injection
    /javascript:/i, // JavaScript injection
  ];

  const url = req.url;
  const userAgent = req.headers['user-agent'] || '';
  const body = JSON.stringify(req.body || {});

  const isSuspicious = suspiciousPatterns.some(
    pattern => pattern.test(url) || pattern.test(userAgent) || pattern.test(body)
  );

  if (isSuspicious) {
    console.warn('🚨 Suspicious activity detected:', {
      ip: req.ip,
      url,
      userAgent,
      timestamp: new Date().toISOString(),
    });
  }

  // Log response time for performance monitoring
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (duration > 5000) {
      // Log slow requests (>5s)
      console.warn('🐌 Slow request detected:', {
        method: req.method,
        url,
        duration: `${duration}ms`,
        ip: req.ip,
      });
    }
  });

  next();
};

// CORS configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = config.CORS_ORIGIN || ['http://localhost:3000'];

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Request validation middleware
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  // Check for required headers
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        success: false,
        message: 'Content-Type phải là application/json.',
      });
    }
  }

  // Validate request ID if present
  const requestId = req.headers['x-request-id'];
  if (requestId && typeof requestId !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'X-Request-ID header không hợp lệ.',
    });
  }

  next();
};

// Error handling for security middleware
export const securityErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'Truy cập bị từ chối bởi CORS.',
    });
  }

  // Log security errors
  console.error('Security error:', {
    error: err.message,
    ip: req.ip,
    url: req.url,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString(),
  });

  next(err);
};
