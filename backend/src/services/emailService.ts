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
      // Use port 465 (SSL) if port 587 (TLS) fails - more reliable for Railway
      const smtpPort = config.SMTP_PORT || 587;
      const useSecure = smtpPort === 465;
      
      this.transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: smtpPort,
        secure: useSecure, // true for 465 (SSL), false for 587 (TLS/STARTTLS)
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false, // For self-signed certificates
          ciphers: 'SSLv3', // Try different cipher for Railway compatibility
        },
        // Connection timeout settings (increased for Railway/production)
        connectionTimeout: 30000, // 30 seconds for initial connection (Railway may be slower)
        socketTimeout: 30000, // 30 seconds for socket operations
        greetingTimeout: 20000, // 20 seconds for SMTP greeting
        // Retry settings
        pool: true, // Use connection pooling
        maxConnections: 5, // Maximum number of connections in pool
        maxMessages: 100, // Maximum messages per connection
        // Rate limiting
        rateDelta: 1000, // Time window for rate limiting (1 second)
        rateLimit: 5, // Maximum messages per rateDelta
      });

      this.isConfigured = true;
      logger.info('✅ Email service initialized');
      
      // Test connection asynchronously (non-blocking)
      // Don't await - let it test in background
      this.testConnection().catch(error => {
        logger.warn('⚠️  Email service connection test failed (non-blocking):', error);
        // Don't fail initialization - email will retry on send
      });
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
   * Send email with retry logic and timeout handling
   */
  async send(options: EmailOptions, retries: number = 2): Promise<void> {
    if (!this.isReady()) {
      logger.warn('⚠️  Email service not configured. Email not sent.');
      logger.warn('   Email content:', options);
      return;
    }

    const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const mailOptions = {
          from: options.from || config.SMTP_USER || 'noreply@soulfriend.vn',
          to: recipients,
          subject: options.subject,
          text: options.text,
          html: options.html || options.text?.replace(/\n/g, '<br>'),
        };

        // Add timeout to sendMail operation (increased for Railway)
        const sendPromise = this.transporter!.sendMail(mailOptions);
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Email send timeout')), 25000); // 25 second timeout (Railway may be slower)
        });

        const info = await Promise.race([sendPromise, timeoutPromise]);

        // CRITICAL: Only log success if we have messageId (proves SMTP server accepted the email)
        if (info.messageId) {
          logger.info(`📧 ✅ EMAIL SENT SUCCESSFULLY to ${recipients}`, {
            messageId: info.messageId,
            subject: options.subject,
            attempt: attempt + 1,
            response: info.response,
          });

          console.log('📧 ✅ EMAIL SENT SUCCESSFULLY:', {
            to: recipients,
            subject: options.subject,
            messageId: info.messageId,
            response: info.response,
          });
        } else {
          logger.warn(`⚠️  Email send completed but no messageId received for ${recipients}`);
          console.warn('⚠️  Email send completed but no messageId - email may not have been delivered');
        }

        return; // Success - exit retry loop
      } catch (error: any) {
        const isLastAttempt = attempt === retries;
        
        // Detailed error logging for debugging
        logger.error(`❌ Email send error (attempt ${attempt + 1}/${retries + 1}):`, {
          to: recipients,
          subject: options.subject,
          errorCode: error.code,
          errorMessage: error.message,
          errorCommand: error.command,
          errorResponse: error.response,
          errorResponseCode: error.responseCode,
          stack: error.stack?.substring(0, 200),
        });
        
        if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
          logger.warn(`⚠️  Email send timeout (attempt ${attempt + 1}/${retries + 1})`);
          console.error(`⚠️  Email timeout details:`, {
            code: error.code,
            command: error.command,
            message: error.message,
          });
          
          if (isLastAttempt) {
            logger.error('❌ Failed to send email after retries (timeout):', {
              to: recipients,
              subject: options.subject,
              error: error.message,
              errorCode: error.code,
              smtpHost: config.SMTP_HOST,
              smtpPort: config.SMTP_PORT,
            });
            console.error('❌ Email send failed after all retries. Check SMTP configuration and network connectivity.');
            // Don't throw - email failures shouldn't break the app
            return;
          }
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1))); // Increased backoff
          continue;
        }

        // Authentication errors
        if (error.code === 'EAUTH' || error.responseCode === 535) {
          logger.error('❌ SMTP Authentication failed:', {
            to: recipients,
            error: error.message,
            smtpUser: config.SMTP_USER,
          });
          console.error('❌ SMTP AUTH ERROR - Check SMTP_USER and SMTP_PASS credentials');
          // Don't retry on auth errors
          return;
        }

        // Other errors
        if (isLastAttempt) {
          logger.error('❌ Failed to send email after retries:', {
            to: recipients,
            subject: options.subject,
            error: error.message || error,
            errorCode: error.code,
            errorResponse: error.response,
          });
          console.error('❌ Email send failed:', error);
          // Don't throw - email failures shouldn't break the app
          return;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
      }
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
   * Test email connection with timeout
   */
  async testConnection(): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      // Use Promise.race to add timeout to verify()
      const verifyPromise = this.transporter!.verify();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Connection test timeout')), 5000); // 5 second timeout
      });

      await Promise.race([verifyPromise, timeoutPromise]);
      logger.info('✅ Email service connection verified');
      console.log('✅ Email service connection verified');
      return true;
    } catch (error: any) {
      // Don't log as error - connection test failures are expected in some environments
      if (error.message?.includes('timeout')) {
        logger.warn('⚠️  Email service connection test timeout (will retry on send)');
      } else {
        logger.warn('⚠️  Email service connection test failed (will retry on send):', error.code || error.message);
      }
      // Don't throw - allow email service to work even if test fails
      // Connection will be established on first actual send
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;

