/**
 * Advanced logging system for SoulFriend V3.0
 * Provides structured logging with different levels and outputs
 */

import fs from 'fs';
import path from 'path';

import config from '../config/environment';

// Log levels
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

// Log entry interface
export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  metadata?: any;
  stack?: string;
  requestId?: string;
  userId?: string;
  ip?: string;
}

class Logger {
  private logLevel: LogLevel;
  private logFile?: string;
  private logStream?: fs.WriteStream;

  constructor() {
    // Set log level from config
    this.logLevel = this.getLogLevelFromString(config.LOG_LEVEL);

    // Setup file logging if configured
    if (config.LOG_FILE) {
      this.setupFileLogging(config.LOG_FILE);
    }
  }

  private getLogLevelFromString(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'error':
        return LogLevel.ERROR;
      case 'warn':
        return LogLevel.WARN;
      case 'info':
        return LogLevel.INFO;
      case 'debug':
        return LogLevel.DEBUG;
      default:
        return LogLevel.INFO;
    }
  }

  private setupFileLogging(logFile: string): void {
    try {
      // Ensure log directory exists
      const logDir = path.dirname(logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      // Create write stream
      this.logStream = fs.createWriteStream(logFile, { flags: 'a' });
      this.logFile = logFile;

      // Handle stream errors
      this.logStream.on('error', error => {
        console.error('Log file write error:', error);
      });

      console.log(`📝 Logging to file: ${logFile}`);
    } catch (error) {
      console.error('Failed to setup file logging:', error);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatLogEntry(
    level: LogLevel,
    message: string,
    metadata?: any,
    stack?: string
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      metadata,
      stack,
    };
  }

  private writeLog(entry: LogEntry): void {
    // Console output with colors
    this.writeToConsole(entry);

    // File output
    if (this.logStream) {
      this.writeToFile(entry);
    }

    // Send to external services (Sentry, etc.)
    this.sendToExternalServices(entry);
  }

  private writeToConsole(entry: LogEntry): void {
    const { timestamp, level, message, metadata } = entry;
    const timeStr = new Date(timestamp).toLocaleTimeString();

    let colorCode = '';
    const resetCode = '\x1b[0m';

    switch (level) {
      case 'ERROR':
        colorCode = '\x1b[31m'; // Red
        break;
      case 'WARN':
        colorCode = '\x1b[33m'; // Yellow
        break;
      case 'INFO':
        colorCode = '\x1b[36m'; // Cyan
        break;
      case 'DEBUG':
        colorCode = '\x1b[90m'; // Gray
        break;
    }

    let logMessage = `${colorCode}[${timeStr}] ${level}:${resetCode} ${message}`;

    if (metadata && Object.keys(metadata).length > 0) {
      logMessage += `\n${colorCode}Metadata:${resetCode} ${JSON.stringify(metadata, null, 2)}`;
    }

    if (entry.stack) {
      logMessage += `\n${colorCode}Stack:${resetCode} ${entry.stack}`;
    }

    console.log(logMessage);
  }

  private writeToFile(entry: LogEntry): void {
    if (!this.logStream) {
      return;
    }

    try {
      const logLine = JSON.stringify(entry) + '\n';
      this.logStream.write(logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private sendToExternalServices(entry: LogEntry): void {
    // Send errors to Sentry if configured
    if (config.SENTRY_DSN && entry.level === 'ERROR') {
      // TODO: Implement Sentry integration
      // Sentry.captureException(new Error(entry.message), {
      //   extra: entry.metadata,
      //   tags: { component: 'soulfriend-backend' }
      // });
    }
  }

  // Public logging methods
  error(message: string, metadata?: any, error?: Error): void {
    if (!this.shouldLog(LogLevel.ERROR)) {
      return;
    }

    const entry = this.formatLogEntry(LogLevel.ERROR, message, metadata, error?.stack);

    this.writeLog(entry);
  }

  warn(message: string, metadata?: any): void {
    if (!this.shouldLog(LogLevel.WARN)) {
      return;
    }

    const entry = this.formatLogEntry(LogLevel.WARN, message, metadata);
    this.writeLog(entry);
  }

  info(message: string, metadata?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) {
      return;
    }

    const entry = this.formatLogEntry(LogLevel.INFO, message, metadata);
    this.writeLog(entry);
  }

  debug(message: string, metadata?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) {
      return;
    }

    const entry = this.formatLogEntry(LogLevel.DEBUG, message, metadata);
    this.writeLog(entry);
  }

  // Specialized logging methods
  security(message: string, metadata?: any): void {
    this.warn(`🔒 SECURITY: ${message}`, { ...metadata, category: 'security' });
  }

  audit(action: string, userId?: string, metadata?: any): void {
    this.info(`📋 AUDIT: ${action}`, {
      ...metadata,
      category: 'audit',
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  performance(operation: string, duration: number, metadata?: any): void {
    const level = duration > 1000 ? LogLevel.WARN : LogLevel.INFO;
    const message = `⚡ PERFORMANCE: ${operation} took ${duration}ms`;

    if (level === LogLevel.WARN) {
      this.warn(message, { ...metadata, category: 'performance', duration });
    } else {
      this.info(message, { ...metadata, category: 'performance', duration });
    }
  }

  database(operation: string, collection?: string, metadata?: any): void {
    this.debug(`🗄️  DATABASE: ${operation}`, {
      ...metadata,
      category: 'database',
      collection,
    });
  }

  api(method: string, path: string, statusCode: number, duration: number, metadata?: any): void {
    const level =
      statusCode >= 400 ? LogLevel.ERROR : statusCode >= 300 ? LogLevel.WARN : LogLevel.INFO;

    const message = `🌐 API: ${method} ${path} - ${statusCode} (${duration}ms)`;

    const logMetadata = {
      ...metadata,
      category: 'api',
      method,
      path,
      statusCode,
      duration,
    };

    switch (level) {
      case LogLevel.ERROR:
        this.error(message, logMetadata);
        break;
      case LogLevel.WARN:
        this.warn(message, logMetadata);
        break;
      default:
        this.info(message, logMetadata);
    }
  }

  // Cleanup method
  close(): void {
    if (this.logStream) {
      this.logStream.end();
    }
  }
}

// Singleton instance
export const logger = new Logger();

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down logger...');
  logger.close();
});

process.on('SIGTERM', () => {
  logger.info('Shutting down logger...');
  logger.close();
});

// Export for convenience
export default logger;
