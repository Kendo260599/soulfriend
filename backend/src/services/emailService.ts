/**
 * Email Service
 * Handles email sending for HITL alerts and notifications
 * Supports SendGrid API (preferred) and SMTP fallback
 */

import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import logger from '../utils/logger';
import config from '../config/environment';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

type EmailProvider = 'sendgrid' | 'smtp' | 'none';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;
  private provider: EmailProvider = 'none';

  constructor() {
    this.initialize();
  }

  /**
   * Initialize email service - prefer SendGrid, fallback to SMTP
   */
  private initialize(): void {
    // Priority 1: SendGrid (most reliable for Railway)
    if (config.SENDGRID_API_KEY) {
      try {
        sgMail.setApiKey(config.SENDGRID_API_KEY);
        this.provider = 'sendgrid';
        this.isConfigured = true;
        logger.info('✅ Email service initialized with SendGrid API');
        return;
      } catch (error) {
        logger.error('❌ Failed to initialize SendGrid:', error);
      }
    }

    // Priority 2: SMTP fallback
    if (config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS) {
      try {
        const smtpPort = config.SMTP_PORT || 587;
        const useSecure = smtpPort === 465;
        
        this.transporter = nodemailer.createTransport({
          host: config.SMTP_HOST,
          port: smtpPort,
          secure: useSecure,
          auth: {
            user: config.SMTP_USER,
            pass: config.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false,
            ciphers: 'SSLv3',
          },
          connectionTimeout: 30000,
          socketTimeout: 30000,
          greetingTimeout: 20000,
          pool: true,
          maxConnections: 5,
          maxMessages: 100,
          rateDelta: 1000,
          rateLimit: 5,
        });

        this.provider = 'smtp';
        this.isConfigured = true;
        logger.info('✅ Email service initialized with SMTP');
        
        // Test connection asynchronously (non-blocking)
        this.testConnection().catch(error => {
          logger.warn('⚠️  Email service connection test failed (non-blocking):', error);
        });
        return;
      } catch (error) {
        logger.error('❌ Failed to initialize SMTP:', error);
      }
    }

    // No email service configured
    logger.warn('⚠️  Email service not configured.');
    logger.warn('   Set SENDGRID_API_KEY (recommended) or SMTP_HOST, SMTP_USER, SMTP_PASS');
    this.provider = 'none';
  }

  /**
   * Check if email service is ready
   */
  isReady(): boolean {
    return this.isConfigured && this.provider !== 'none';
  }

  /**
   * Send email with retry logic - uses SendGrid or SMTP based on configuration
   */
  async send(options: EmailOptions, retries: number = 2): Promise<void> {
    if (!this.isReady()) {
      logger.warn('⚠️  Email service not configured. Email not sent.');
      logger.warn('   Email content:', options);
      return;
    }

    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const fromEmail = options.from || config.SMTP_USER || 'noreply@soulfriend.vn';

    // Use SendGrid if available
    if (this.provider === 'sendgrid') {
      await this.sendWithSendGrid(recipients, fromEmail, options, retries);
      return;
    }

    // Fallback to SMTP
    if (this.provider === 'smtp') {
      await this.sendWithSMTP(recipients.join(', '), fromEmail, options, retries);
      return;
    }
  }

  /**
   * Send email using SendGrid API
   */
  private async sendWithSendGrid(
    recipients: string[],
    fromEmail: string,
    options: EmailOptions,
    retries: number
  ): Promise<void> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // SendGrid requires content array or text/html directly
        const msg: any = {
          to: recipients,
          from: fromEmail,
          subject: options.subject,
        };

        // Add text and html content
        if (options.html) {
          msg.html = options.html;
        }
        if (options.text) {
          msg.text = options.text;
        } else if (options.html) {
          // Convert HTML to text if no text provided
          msg.text = options.html.replace(/<[^>]*>/g, '').replace(/\n/g, ' ').trim();
        }

        // SendGrid API call with timeout
        const sendPromise = sgMail.send(msg);
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('SendGrid API timeout')), 15000); // 15 second timeout
        });

        const result = await Promise.race([sendPromise, timeoutPromise]) as any;

        // SendGrid returns [response, body] array or just response
        const response = Array.isArray(result) ? result[0] : result;

        // SendGrid returns response with statusCode
        if (response && (response.statusCode === 200 || response.statusCode === 202)) {
          const messageId = response.headers?.['x-message-id'] || 
                           response.headers?.['X-Message-Id'] || 
                           'N/A';

          logger.info(`📧 ✅ EMAIL SENT SUCCESSFULLY (SendGrid) to ${recipients.join(', ')}`, {
            statusCode: response.statusCode,
            subject: options.subject,
            attempt: attempt + 1,
            messageId: messageId,
          });

          console.log('📧 ✅ EMAIL SENT SUCCESSFULLY (SendGrid):', {
            to: recipients.join(', '),
            subject: options.subject,
            statusCode: response.statusCode,
            messageId: messageId,
          });

          return; // Success
        } else {
          throw new Error(`SendGrid returned status ${response?.statusCode || 'unknown'}`);
        }
      } catch (error: any) {
        const isLastAttempt = attempt === retries;

        logger.error(`❌ SendGrid email error (attempt ${attempt + 1}/${retries + 1}):`, {
          to: recipients.join(', '),
          subject: options.subject,
          errorCode: error.code,
          errorMessage: error.message,
          response: error.response?.body,
        });

        if (isLastAttempt) {
          logger.error('❌ Failed to send email via SendGrid after retries:', {
            to: recipients.join(', '),
            subject: options.subject,
            error: error.message,
          });
          console.error('❌ SendGrid email send failed after all retries');
          return;
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  /**
   * Send email using SMTP (fallback)
   */
  private async sendWithSMTP(
    recipients: string,
    fromEmail: string,
    options: EmailOptions,
    retries: number
  ): Promise<void> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const mailOptions = {
          from: fromEmail,
          to: recipients,
          subject: options.subject,
          text: options.text,
          html: options.html || options.text?.replace(/\n/g, '<br>'),
        };

        const sendPromise = this.transporter!.sendMail(mailOptions);
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Email send timeout')), 25000);
        });

        const info = await Promise.race([sendPromise, timeoutPromise]);

        if (info.messageId) {
          logger.info(`📧 ✅ EMAIL SENT SUCCESSFULLY (SMTP) to ${recipients}`, {
            messageId: info.messageId,
            subject: options.subject,
            attempt: attempt + 1,
            response: info.response,
          });

          console.log('📧 ✅ EMAIL SENT SUCCESSFULLY (SMTP):', {
            to: recipients,
            subject: options.subject,
            messageId: info.messageId,
            response: info.response,
          });
        } else {
          logger.warn(`⚠️  Email send completed but no messageId received for ${recipients}`);
        }

        return; // Success
      } catch (error: any) {
        const isLastAttempt = attempt === retries;
        
        logger.error(`❌ SMTP email error (attempt ${attempt + 1}/${retries + 1}):`, {
          to: recipients,
          subject: options.subject,
          errorCode: error.code,
          errorMessage: error.message,
          errorCommand: error.command,
        });
        
        if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
          if (isLastAttempt) {
            logger.error('❌ Failed to send email via SMTP after retries (timeout):', {
              to: recipients,
              subject: options.subject,
              error: error.message,
            });
            console.error('❌ SMTP email send failed - consider using SendGrid instead');
            return;
          }
          await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
          continue;
        }

        if (error.code === 'EAUTH' || error.responseCode === 535) {
          logger.error('❌ SMTP Authentication failed');
          return;
        }

        if (isLastAttempt) {
          logger.error('❌ Failed to send email via SMTP after retries:', {
            to: recipients,
            subject: options.subject,
            error: error.message || error,
          });
          return;
        }

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
   * Test email connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    if (this.provider === 'sendgrid') {
      // SendGrid doesn't need connection test - API is stateless
      return true;
    }

    if (this.provider === 'smtp') {
      try {
        const verifyPromise = this.transporter!.verify();
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Connection test timeout')), 5000);
        });

        await Promise.race([verifyPromise, timeoutPromise]);
        logger.info('✅ Email service connection verified (SMTP)');
        return true;
      } catch (error: any) {
        if (error.message?.includes('timeout')) {
          logger.warn('⚠️  Email service connection test timeout (will retry on send)');
        } else {
          logger.warn('⚠️  Email service connection test failed (will retry on send):', error.code || error.message);
        }
        return false;
      }
    }

    return false;
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
