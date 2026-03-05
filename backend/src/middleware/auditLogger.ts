/**
 * Audit Logging Middleware
 * Track all sensitive operations for compliance and security
 * Now backed by MongoDB with file-based fallback
 */

import { Request, Response, NextFunction } from 'express';
import AuditLogModel from '../models/AuditLog';

export interface AuditLog {
  timestamp: Date;
  userId?: string;
  userEmail?: string;
  action: string;
  category?: 'auth' | 'data_access' | 'data_modify' | 'data_delete' | 'consent' | 'admin' | 'system';
  resource: string;
  method: string;
  path: string;
  ip: string;
  userAgent: string;
  statusCode?: number;
  changes?: any;
  result?: 'success' | 'failure';
  errorMessage?: string;
  legalBasis?: string;
  dataCategories?: string[];
}

export class AuditLogger {
  constructor() {
    // MongoDB-backed — no file system setup needed
  }

  /**
   * Log audit entry to MongoDB (non-blocking)
   */
  log(entry: AuditLog): void {
    const logEntry = {
      ...entry,
      timestamp: entry.timestamp || new Date(),
      category: entry.category || this.inferCategory(entry.action, entry.method),
      result: entry.result || 'success',
    };

    // Non-blocking persist to MongoDB
    AuditLogModel.create(logEntry).catch(err => {
      console.error('Failed to write audit log to MongoDB:', err);
    });
  }

  /**
   * Derive semantic action name from HTTP method and path
   */
  deriveAction(method: string, path: string): string {
    const lowerPath = path.toLowerCase();
    if (lowerPath.includes('login') || lowerPath.includes('auth')) {
      return method === 'POST' ? 'login' : 'auth_check';
    }
    if (lowerPath.includes('consent')) {
      return method === 'POST' ? 'consent_update' : 'consent_read';
    }
    if (lowerPath.includes('admin')) {
      return `admin_${method.toLowerCase()}`;
    }
    if (method === 'DELETE') return 'data_delete';
    if (method === 'GET') return 'data_access';
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') return 'data_modify';
    return `${method.toLowerCase()}:${path}`;
  }

  /**
   * Infer category from action and method
   */
  private inferCategory(action: string, method: string): string {
    if (action.startsWith('login') || action.startsWith('logout') || action === 'failed_login' || action === 'password_reset') {
      return 'auth';
    }
    if (action.startsWith('data_delete') || method === 'DELETE') return 'data_delete';
    if (action.startsWith('data_read') || action === 'data_access' || method === 'GET') return 'data_access';
    if (action.startsWith('consent') || action.includes('consent')) return 'consent';
    if (action.startsWith('admin')) return 'admin';
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') return 'data_modify';
    return 'system';
  }

  /**
   * Middleware to log all requests to sensitive endpoints
   */
  middleware = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    // Capture response
    const originalSend = res.send;
    res.send = function (data: any): Response {
      res.send = originalSend;

      const duration = Date.now() - startTime;
      const log: AuditLog = {
        timestamp: new Date(),
        userId: (req as any).user?.id || (req as any).expert?.expertId,
        userEmail: (req as any).user?.email || (req as any).expert?.email,
        action: auditLogger.deriveAction(req.method, req.path),
        resource: req.path,
        method: req.method,
        path: req.originalUrl,
        ip: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        statusCode: res.statusCode,
        result: res.statusCode < 400 ? 'success' : 'failure',
      };

      // Log all sensitive endpoints (including GET for data access)
      if (auditLogger.shouldLog(req.path, req.method)) {
        auditLogger.log(log);
      }

      return originalSend.call(this, data);
    };

    next();
  };

  /**
   * Determine if request should be logged
   */
  private shouldLog(path: string, method: string): boolean {
    const sensitiveEndpoints = [
      '/api/admin',
      '/api/user',
      '/api/tests',
      '/api/research',
      '/api/consent',
      '/api/v2/expert',
      '/api/v2/hitl',
      '/api/v2/critical-alerts',
    ];

    // Log ALL methods for sensitive endpoints (including GET for data access auditing)
    return sensitiveEndpoints.some(endpoint => path.startsWith(endpoint));
  }

  /**
   * Log specific action
   */
  logAction(
    action: string,
    resource: string,
    userId?: string,
    changes?: any,
    result: 'success' | 'failure' = 'success'
  ): void {
    this.log({
      timestamp: new Date(),
      userId,
      action,
      resource,
      method: 'SYSTEM',
      path: resource,
      ip: 'system',
      userAgent: 'system',
      changes,
      result,
    });
  }

  /**
   * Log data access (GDPR Art. 30 compliance)
   */
  logDataAccess(
    userId: string,
    resource: string,
    action: 'read' | 'write' | 'delete',
    dataType: string,
    legalBasis?: string
  ): void {
    this.log({
      timestamp: new Date(),
      userId,
      action: `data_${action}`,
      category: action === 'delete' ? 'data_delete' : action === 'write' ? 'data_modify' : 'data_access',
      resource,
      method: 'SYSTEM',
      path: resource,
      ip: 'system',
      userAgent: 'system',
      changes: { dataType },
      result: 'success',
      legalBasis,
      dataCategories: [dataType],
    });
  }

  /**
   * Log authentication events
   */
  logAuth(
    event: 'login' | 'logout' | 'failed_login' | 'password_reset',
    userId?: string,
    email?: string,
    ip?: string,
    result: 'success' | 'failure' = 'success'
  ): void {
    this.log({
      timestamp: new Date(),
      userId,
      userEmail: email,
      action: event,
      category: 'auth',
      resource: 'auth',
      method: 'AUTH',
      path: `/api/auth/${event}`,
      ip: ip || 'unknown',
      userAgent: 'unknown',
      result,
    });
  }

  /**
   * Log GDPR-specific events
   */
  logGDPR(
    action: string,
    userId: string,
    legalBasis: string,
    dataCategories: string[],
    details?: any
  ): void {
    this.log({
      timestamp: new Date(),
      userId,
      action,
      category: action.includes('delete') ? 'data_delete' : 'consent',
      resource: 'gdpr',
      method: 'SYSTEM',
      path: '/gdpr',
      ip: 'system',
      userAgent: 'system',
      changes: details,
      result: 'success',
      legalBasis,
      dataCategories,
    });
  }

  /**
   * Query audit logs from MongoDB
   */
  async queryLogs(filters: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    action?: string;
    category?: string;
    result?: 'success' | 'failure';
    limit?: number;
  }): Promise<AuditLog[]> {
    const query: any = {};

    if (filters.userId) query.userId = filters.userId;
    if (filters.action) query.action = filters.action;
    if (filters.category) query.category = filters.category;
    if (filters.result) query.result = filters.result;
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = filters.startDate;
      if (filters.endDate) query.timestamp.$lte = filters.endDate;
    }

    return AuditLogModel.find(query)
      .sort({ timestamp: -1 })
      .limit(filters.limit || 500)
      .lean();
  }

  /**
   * Generate audit report
   */
  async generateReport(startDate: Date, endDate: Date): Promise<any> {
    return (AuditLogModel as any).generateReport(startDate, endDate);
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();
export default auditLogger;
