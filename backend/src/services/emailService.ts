/**
 * Email Service
 * Handles email sending for HITL alerts and notifications
 * Uses nodemailer with SMTP
 */

import nodemailer from 'nodemailer';
import logger from '../utils/logger';
import config from '../config/environment';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize email transporter
   */
  private initialize(): void {
    // Check if SMTP is configured
    if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS) {
      logger.warn('⚠️  SMTP not configured. Email service disabled.');
      logger.warn('   Set SMTP_HOST, SMTP_USER, SMTP_PASS in environment variables');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT || 587,
        secure: config.SMTP_PORT === 465, // true for 465, false for other ports
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false, // For self-signed certificates
        },
      });

      this.isConfigured = true;
      logger.info('✅ Email service initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize email service:', error);
    }
  }

  /**
   * Check if email service is ready
   */
  isReady(): boolean {
    return this.isConfigured && this.transporter !== null;
  }

  /**
   * Send email
   */
  async send(options: EmailOptions): Promise<void> {
    if (!this.isReady()) {
      logger.warn('⚠️  Email service not configured. Email not sent.');
      logger.warn('   Email content:', options);
      return;
    }

    try {
      const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;

      const mailOptions = {
        from: options.from || config.SMTP_USER || 'noreply@soulfriend.vn',
        to: recipients,
        subject: options.subject,
        text: options.text,
        html: options.html || options.text?.replace(/\n/g, '<br>'),
      };

      const info = await this.transporter!.sendMail(mailOptions);

      logger.info(`📧 Email sent successfully to ${recipients}`, {
        messageId: info.messageId,
        subject: options.subject,
      });

      console.log('📧 Email sent:', {
        to: recipients,
        subject: options.subject,
        messageId: info.messageId,
      });
    } catch (error) {
      logger.error('❌ Failed to send email:', error);
      console.error('Email error:', error);
      throw error;
    }
  }

  /**
   * Send HITL critical alert email
   */
  async sendCriticalAlert(
    alert: {
      id: string;
      timestamp: Date;
      userId: string;
      sessionId: string;
      riskType: string;
      riskLevel: string;
      userMessage: string;
      detectedKeywords: string[];
    },
    recipients: string[]
  ): Promise<void> {
    const subject = `🚨 CRITICAL ALERT: ${alert.riskType.toUpperCase()} - ${alert.id}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .alert-box { background: #ff4444; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .info-box { background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 10px 0; }
            .label { font-weight: bold; color: #666; }
            .value { margin-left: 10px; }
            .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="alert-box">
            <h2>🚨 CRITICAL INTERVENTION REQUIRED</h2>
            <p><strong>IMMEDIATE ACTION REQUIRED</strong></p>
            <p>Please acknowledge this alert within 5 minutes.</p>
          </div>

          <div class="info-box">
            <div><span class="label">Alert ID:</span><span class="value">${alert.id}</span></div>
            <div><span class="label">Timestamp:</span><span class="value">${alert.timestamp.toISOString()}</span></div>
            <div><span class="label">User ID:</span><span class="value">${alert.userId}</span></div>
            <div><span class="label">Session ID:</span><span class="value">${alert.sessionId}</span></div>
            <div><span class="label">Risk Type:</span><span class="value">${alert.riskType}</span></div>
            <div><span class="label">Risk Level:</span><span class="value">${alert.riskLevel}</span></div>
          </div>

          <div class="info-box">
            <div><span class="label">Detected Keywords:</span></div>
            <div class="value">${alert.detectedKeywords.join(', ')}</div>
          </div>

          <div class="info-box">
            <div><span class="label">User Message:</span></div>
            <div class="value" style="margin-top: 10px; padding: 10px; background: white; border-left: 3px solid #ff4444;">
              "${alert.userMessage}"
            </div>
          </div>

          <div style="margin-top: 20px;">
            <a href="https://soulfriend-admin.vercel.app/alerts/${alert.id}" class="button">
              View Alert Dashboard
            </a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
            <p>This is an automated alert from SoulFriend HITL System.</p>
            <p>If you did not expect this email, please contact the system administrator.</p>
          </div>
        </body>
      </html>
    `;

    const text = `
🚨 CRITICAL INTERVENTION REQUIRED

Alert ID: ${alert.id}
Timestamp: ${alert.timestamp.toISOString()}
User ID: ${alert.userId}
Session ID: ${alert.sessionId}
Risk Type: ${alert.riskType}
Risk Level: ${alert.riskLevel}

Detected Keywords: ${alert.detectedKeywords.join(', ')}

User Message: "${alert.userMessage}"

IMMEDIATE ACTION REQUIRED
Please acknowledge this alert within 5 minutes.

Dashboard: https://soulfriend-admin.vercel.app/alerts/${alert.id}
    `.trim();

    await this.send({
      to: recipients,
      subject,
      html,
      text,
    });
  }

  /**
   * Test email connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      await this.transporter!.verify();
      logger.info('✅ Email service connection verified');
      return true;
    } catch (error) {
      logger.error('❌ Email service connection failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;

