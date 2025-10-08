/**
 * Audit Logging Middleware
 * Track all sensitive operations for compliance and security
 */

import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

export interface AuditLog {
  timestamp: Date;
  userId?: string;
  userEmail?: string;
  action: string;
  resource: string;
  method: string;
  path: string;
  ip: string;
  userAgent: string;
  statusCode?: number;
  changes?: any;
  result?: 'success' | 'failure';
  errorMessage?: string;
}

export class AuditLogger {
  private logDir: string;
  private logFile: string;

  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.logFile = path.join(this.logDir, 'audit.log');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Log audit entry
   */
  log(entry: AuditLog): void {
    const logEntry = {
      ...entry,
      timestamp: entry.timestamp || new Date(),
    };

    const logLine = JSON.stringify(logEntry) + '\n';

    fs.appendFile(this.logFile, logLine, err => {
      if (err) {
        console.error('Failed to write audit log:', err);
      }
    });

    // In production, also send to external logging service (e.g., CloudWatch, Datadog)
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(logEntry);
    }
  }

  /**
   * Middleware to log all requests
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
        userId: (req as any).user?.id,
        userEmail: (req as any).user?.email,
        action: req.method,
        resource: req.path,
        method: req.method,
        path: req.originalUrl,
        ip: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        statusCode: res.statusCode,
        result: res.statusCode < 400 ? 'success' : 'failure',
      };

      // Only log sensitive endpoints
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
    ];

    const sensitiveMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];

    return (
      sensitiveEndpoints.some(endpoint => path.startsWith(endpoint)) &&
      sensitiveMethods.includes(method)
    );
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
    const log: AuditLog = {
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
    };

    this.log(log);
  }

  /**
   * Log data access
   */
  logDataAccess(
    userId: string,
    resource: string,
    action: 'read' | 'write' | 'delete',
    dataType: string
  ): void {
    this.logAction(`data_${action}`, resource, userId, { dataType }, 'success');
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
    const log: AuditLog = {
      timestamp: new Date(),
      userId,
      userEmail: email,
      action: event,
      resource: 'auth',
      method: 'AUTH',
      path: `/api/auth/${event}`,
      ip: ip || 'unknown',
      userAgent: 'unknown',
      result,
    };

    this.log(log);
  }

  /**
   * Send to external logging service
   */
  private sendToExternalService(entry: AuditLog): void {
    // TODO: Implement integration with external logging service
    // Examples: AWS CloudWatch, Datadog, Loggly, Splunk
    // This is a placeholder for production implementation
  }

  /**
   * Query audit logs
   */
  async queryLogs(filters: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    action?: string;
    result?: 'success' | 'failure';
  }): Promise<AuditLog[]> {
    return new Promise((resolve, reject) => {
      fs.readFile(this.logFile, 'utf8', (err, data) => {
        if (err) {
          return reject(err);
        }

        const logs = data
          .split('\n')
          .filter(line => line.trim())
          .map(line => JSON.parse(line) as AuditLog)
          .filter(log => {
            if (filters.userId && log.userId !== filters.userId) {
              return false;
            }
            if (filters.action && log.action !== filters.action) {
              return false;
            }
            if (filters.result && log.result !== filters.result) {
              return false;
            }
            if (filters.startDate && new Date(log.timestamp) < filters.startDate) {
              return false;
            }
            if (filters.endDate && new Date(log.timestamp) > filters.endDate) {
              return false;
            }
            return true;
          });

        resolve(logs);
      });
    });
  }

  /**
   * Generate audit report
   */
  async generateReport(startDate: Date, endDate: Date): Promise<any> {
    const logs = await this.queryLogs({ startDate, endDate });

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      totalEvents: logs.length,
      successfulEvents: logs.filter(l => l.result === 'success').length,
      failedEvents: logs.filter(l => l.result === 'failure').length,
      uniqueUsers: new Set(logs.map(l => l.userId).filter(Boolean)).size,
      actionBreakdown: this.groupBy(logs, 'action'),
      resourceBreakdown: this.groupBy(logs, 'resource'),
      topUsers: this.getTopUsers(logs, 10),
    };
  }

  private groupBy(logs: AuditLog[], key: keyof AuditLog): any {
    return logs.reduce((acc, log) => {
      const value = log[key] as string;
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as any);
  }

  private getTopUsers(logs: AuditLog[], limit: number): any[] {
    const userCounts = this.groupBy(logs, 'userId');
    return Object.entries(userCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, limit)
      .map(([userId, count]) => ({ userId, count }));
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();
export default auditLogger;
