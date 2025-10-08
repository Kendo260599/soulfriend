/**
 * Type declarations for Express Request extensions
 */

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export {};
