/**
 * Async Error Handler Wrapper for Express Routes
 *
 * Wraps async Express route handlers to catch any errors and forward them
 * to the error handling middleware. This prevents unhandled promise rejections
 * that would otherwise result in generic 500 errors.
 *
 * Usage:
 * ```typescript
 * import { asyncHandler } from '../middleware/asyncHandler';
 *
 * router.get('/example', asyncHandler(async (req, res) => {
 *   const data = await someAsyncOperation();
 *   res.json({ success: true, data });
 * }));
 * ```
 *
 * @module middleware/asyncHandler
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Type definition for async Express route handler functions
 */
type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;

/**
 * Wraps an async function to catch errors and forward to error middleware
 *
 * @param fn - The async route handler function to wrap
 * @returns Express RequestHandler that handles async errors
 *
 * @example
 * ```typescript
 * router.post('/login', asyncHandler(async (req, res) => {
 *   const user = await User.findOne({ email: req.body.email });
 *   if (!user) {
 *     throw new Error('User not found'); // Will be caught and forwarded to error handler
 *   }
 *   res.json({ user });
 * }));
 * ```
 */
export const asyncHandler = (fn: AsyncFunction): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Alternative implementation using try-catch
 * Can be used if you prefer explicit error handling
 */
export const asyncHandlerTryCatch = (fn: AsyncFunction): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

export default asyncHandler;
