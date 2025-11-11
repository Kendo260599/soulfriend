/**
 * QStash Configuration for Serverless Messaging & Scheduling
 * Upstash QStash - HTTP-based message queue and scheduler
 */

import { Client } from '@upstash/qstash';
import config from './environment';

export class QStashService {
  private static instance: QStashService;
  private client: Client | null = null;
  private isEnabled: boolean = false;

  private constructor() {
    this.initialize();
  }

  static getInstance(): QStashService {
    if (!QStashService.instance) {
      QStashService.instance = new QStashService();
    }
    return QStashService.instance;
  }

  private initialize(): void {
    // QStash is optional - skip if not configured
    if (!process.env.QSTASH_TOKEN) {
      console.log('⚠️  QStash token not configured - messaging/scheduling disabled');
      return;
    }

    try {
      this.client = new Client({
        token: process.env.QSTASH_TOKEN,
      });
      this.isEnabled = true;
      console.log('✅ QStash client initialized successfully');
    } catch (error) {
      console.error('❌ QStash initialization error:', error);
      this.isEnabled = false;
    }
  }

  /**
   * Check if QStash is enabled and ready
   */
  isReady(): boolean {
    return this.isEnabled && this.client !== null;
  }

  /**
   * Publish a message to an HTTP endpoint
   * @param url - Target HTTP endpoint
   * @param payload - Message payload
   * @param options - Optional delay, headers, etc.
   */
  async publishMessage(
    url: string,
    payload: any,
    options?: {
      delay?: number; // Delay in seconds
      headers?: Record<string, string>;
      retries?: number;
    }
  ): Promise<boolean> {
    if (!this.isReady() || !this.client) {
      console.warn('⚠️  QStash not available, skipping message publish');
      return false;
    }

    try {
      const messageOptions: any = {
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers || {}),
        },
      };

      if (options?.delay) {
        messageOptions.delay = options.delay;
      }

      if (options?.retries) {
        messageOptions.retries = options.retries;
      }

      await this.client.publishJSON({
        url,
        ...messageOptions,
      });

      console.log(`✅ QStash message published to: ${url}`);
      return true;
    } catch (error) {
      console.error('❌ QStash publish error:', error);
      return false;
    }
  }

  /**
   * Schedule a message to be sent at a specific time
   * @param url - Target HTTP endpoint
   * @param payload - Message payload
   * @param scheduleTime - Unix timestamp or cron expression
   */
  async scheduleMessage(
    url: string,
    payload: any,
    scheduleTime: number | string
  ): Promise<string | null> {
    if (!this.isReady() || !this.client) {
      console.warn('⚠️  QStash not available, skipping schedule');
      return null;
    }

    try {
      const result = await this.client.publishJSON({
        url,
        body: payload,
        // @ts-ignore - QStash schedule API
        notBefore: typeof scheduleTime === 'number' ? scheduleTime : undefined,
        cron: typeof scheduleTime === 'string' ? scheduleTime : undefined,
      });

      console.log(`✅ QStash message scheduled for: ${scheduleTime}`);
      return result.messageId;
    } catch (error) {
      console.error('❌ QStash schedule error:', error);
      return null;
    }
  }

  /**
   * Send delayed alert notification (use case: crisis follow-up)
   * @param userId - User ID
   * @param alertData - Alert payload
   * @param delaySeconds - Delay in seconds
   */
  async sendDelayedAlert(
    userId: string,
    alertData: any,
    delaySeconds: number = 3600
  ): Promise<boolean> {
    // Use production URL for QStash to reach (QStash cannot access localhost!)
    const baseUrl = process.env.API_BASE_URL || 'https://soulfriend-api.onrender.com';
    const webhookUrl = `${baseUrl}/api/webhooks/qstash/alert`;
    
    return this.publishMessage(
      webhookUrl,
      {
        userId,
        alertData,
        timestamp: Date.now(),
      },
      { delay: delaySeconds }
    );
  }

  /**
   * Schedule daily report generation
   * @param cronExpression - Cron expression (e.g., "0 9 * * *" for 9 AM daily)
   */
  async scheduleDailyReport(cronExpression: string = '0 9 * * *'): Promise<string | null> {
    // Use production URL for QStash to reach (QStash cannot access localhost!)
    const baseUrl = process.env.API_BASE_URL || 'https://soulfriend-api.onrender.com';
    const webhookUrl = `${baseUrl}/api/webhooks/qstash/daily-report`;
    
    return this.scheduleMessage(
      webhookUrl,
      {
        reportType: 'daily',
        timestamp: Date.now(),
      },
      cronExpression
    );
  }

  /**
   * Get client instance (for advanced usage)
   */
  getClient(): Client | null {
    return this.client;
  }
}

// Export singleton instance
export const qstashService = QStashService.getInstance();
