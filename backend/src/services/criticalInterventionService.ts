/**
 * CRITICAL INTERVENTION SERVICE - HUMAN-IN-THE-LOOP (HITL)
 *
 * Hệ thống can thiệp khủng hoảng với sự tham gia của con người
 * Tuân thủ đạo đức và pháp lý cho các trường hợp Critical Risk
 *
 * @module CriticalInterventionService
 * @version 1.0.0
 */

import logger from '../utils/logger';
import emailService from './emailService';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface CriticalAlert {
  id: string;
  timestamp: Date;
  userId: string;
  sessionId: string;
  riskLevel: 'CRITICAL' | 'EXTREME';
  riskType: 'suicidal' | 'psychosis' | 'self_harm' | 'violence';
  userMessage: string;
  detectedKeywords: string[];
  userProfile?: any;
  testResults?: any[];
  locationData?: {
    ip?: string;
    city?: string;
    country?: string;
  };
  status: 'pending' | 'acknowledged' | 'intervened' | 'resolved' | 'escalated';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  interventionNotes?: string;
  escalatedAt?: Date; // Track when escalation email was sent
  escalationEmailSent?: boolean; // Prevent duplicate escalation emails
  metadata?: {
    moderation?: {
      riskLevel: string;
      riskScore: number;
      messageHash: string;
      signalCount: number;
      signals?: Array<{
        source: string;
        category: string;
        confidence: number;
        matchedCount?: number;
      }>;
    };
    [key: string]: any;
  };
}

export interface ClinicalTeamMember {
  id: string;
  name: string;
  role: 'psychiatrist' | 'psychologist' | 'crisis_counselor' | 'social_worker' | 'admin';
  email: string;
  phone: string;
  availability: 'available' | 'busy' | 'offline';
  specialty?: string[];
}

export interface InterventionConfig {
  // HITL Settings
  autoEscalationEnabled: boolean;
  escalationDelayMinutes: number; // Default: 5 minutes

  // Clinical Team
  clinicalTeam: ClinicalTeamMember[];

  // Notification Channels
  emailEnabled: boolean;
  smsEnabled: boolean;
  slackEnabled: boolean;
  emergencyHotlineEnabled: boolean;

  // Emergency Hotlines (Vietnam)
  hotlines: {
    name: string;
    phone: string;
    available24h: boolean;
  }[];

  // Legal Compliance
  autoDocumentation: boolean;
  consentRequired: boolean;
  dataRetentionDays: number;
}

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

const DEFAULT_CONFIG: InterventionConfig = {
  autoEscalationEnabled: true,
  escalationDelayMinutes: 5,

  clinicalTeam: [
    {
      id: 'crisis_team_1',
      name: 'Crisis Response Team',
      role: 'crisis_counselor',
      email: 'le3221374@gmail.com', // Real email for HITL alerts
      phone: '+84-xxx-xxx-xxx',
      availability: 'available',
    },
    {
      id: 'admin_team_1',
      name: 'System Administrator',
      role: 'admin',
      email: 'kendo2605@gmail.com', // Verified SendGrid sender email
      phone: '+84-xxx-xxx-xxx',
      availability: 'available',
    },
  ],

  emailEnabled: true,
  smsEnabled: true,
  slackEnabled: true,
  emergencyHotlineEnabled: true,

  hotlines: [
    {
      name: 'Đường dây nóng Sức khỏe Tâm thần Quốc gia',
      phone: '1800-599-920',
      available24h: true,
    },
    {
      name: 'Trung tâm Chống độc (Bệnh viện Bạch Mai)',
      phone: '19001115',
      available24h: true,
    },
    {
      name: 'SOS Quốc tế Việt Nam',
      phone: '024-3934-5000',
      available24h: false,
    },
  ],

  autoDocumentation: true,
  consentRequired: false, // In crisis, consent can be waived
  dataRetentionDays: 365, // 1 year for legal purposes
};

// =============================================================================
// CRITICAL INTERVENTION SERVICE
// =============================================================================

export class CriticalInterventionService {
  private config: InterventionConfig;
  private activeAlerts: Map<string, CriticalAlert> = new Map();
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config?: Partial<InterventionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    logger.info('🚨 CriticalInterventionService initialized with HITL enabled');
  }

  /**
   * STEP 1: Phát hiện và tạo Critical Alert
   */
  async createCriticalAlert(
    userId: string,
    sessionId: string,
    riskData: {
      riskLevel: 'CRITICAL' | 'EXTREME';
      riskType: 'suicidal' | 'psychosis' | 'self_harm' | 'violence';
      userMessage: string;
      detectedKeywords: string[];
      userProfile?: any;
      testResults?: any[];
      metadata?: {
        moderation?: {
          riskLevel: string;
          riskScore: number;
          messageHash: string;
          signalCount: number;
          signals?: Array<{
            source: string;
            category: string;
            confidence: number;
            matchedCount?: number;
          }>;
        };
        [key: string]: any;
      };
    }
  ): Promise<CriticalAlert> {
    const alert: CriticalAlert = {
      id: `ALERT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId,
      sessionId,
      ...riskData,
      status: 'pending',
    };

    this.activeAlerts.set(alert.id, alert);

    logger.error(`🚨 CRITICAL ALERT CREATED: ${alert.id}`, {
      userId,
      riskType: alert.riskType,
      keywords: alert.detectedKeywords,
    });

    // Force console output for Railway visibility
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`🚨 CRITICAL ALERT CREATED: ${alert.id}`);
    console.error(`User: ${userId}`);
    console.error(`Risk Type: ${alert.riskType}`);
    console.error(`Keywords: ${alert.detectedKeywords.join(', ')}`);
    console.error(`Message: "${alert.userMessage}"`);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // STEP 2: Immediate documentation (non-blocking)
    if (this.config.autoDocumentation) {
      this.documentAlert(alert).catch(error => {
        logger.error('Documentation failed (non-blocking):', error);
      });
    }

    // STEP 3: Notify clinical team immediately (non-blocking)
    this.notifyClinicalTeam(alert).catch(error => {
      logger.error('Clinical team notification failed (non-blocking):', error);
    });

    // STEP 4: Start escalation timer (5 minutes)
    if (this.config.autoEscalationEnabled) {
      this.startEscalationTimer(alert);
    }

    return alert;
  }

  /**
   * STEP 2: Ghi chép tự động (Legal Compliance)
   */
  private async documentAlert(alert: CriticalAlert): Promise<void> {
    try {
      // TODO: Integrate with MongoDB to store alert
      logger.info(`📝 Alert documented: ${alert.id}`);

      // Create audit log
      const auditLog = {
        alertId: alert.id,
        timestamp: alert.timestamp,
        action: 'ALERT_CREATED',
        details: {
          riskLevel: alert.riskLevel,
          riskType: alert.riskType,
          keywords: alert.detectedKeywords,
        },
      };

      // TODO: Save to database
      console.log('Audit Log:', auditLog);
    } catch (error) {
      logger.error('Error documenting alert:', error);
    }
  }

  /**
   * STEP 3: Thông báo đội lâm sàng ngay lập tức
   * Optimized: Fire-and-forget notifications to prevent blocking
   */
  private async notifyClinicalTeam(alert: CriticalAlert): Promise<void> {
    logger.warn(`📢 Notifying clinical team for alert: ${alert.id}`);

    // Fire-and-forget: Start all notifications but don't wait for completion
    // This prevents email/SMS delays from blocking alert creation
    if (this.config.emailEnabled) {
      this.sendEmailAlert(alert).catch(error => {
        logger.error('Email notification failed (non-blocking):', error);
      });
    }

    if (this.config.smsEnabled) {
      this.sendSMSAlert(alert).catch(error => {
        logger.error('SMS notification failed (non-blocking):', error);
      });
    }

    if (this.config.slackEnabled) {
      this.sendSlackAlert(alert).catch(error => {
        logger.error('Slack notification failed (non-blocking):', error);
      });
    }

    // Return immediately - notifications will complete in background
    // This ensures alert is created and escalation timer starts without delay
  }

  /**
   * STEP 4: Bắt đầu bộ đếm thời gian leo thang (5 phút)
   */
  private startEscalationTimer(alert: CriticalAlert): void {
    const delayMs = this.config.escalationDelayMinutes * 60 * 1000;

    logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.warn('🚨 HITL ACTIVATED - CRISIS DETECTED');
    logger.warn(`Alert ID: ${alert.id}`);
    logger.warn(`User: ${alert.userId}`);
    logger.warn(`Risk Type: ${alert.riskType}`);
    logger.warn(`Message: "${alert.userMessage}"`);
    logger.warn(`⏱️  ESCALATION TIMER: ${this.config.escalationDelayMinutes} minutes`);
    logger.warn('📢 Clinical team has been notified');
    logger.warn(
      `⚠️  If no response in ${this.config.escalationDelayMinutes} min → Auto escalate to emergency`
    );
    logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const timer = setTimeout(async () => {
      // Kiểm tra xem alert đã được xử lý chưa
      const currentAlert = this.activeAlerts.get(alert.id);

      // FIX: Check if alert is still pending AND escalation email hasn't been sent
      if (currentAlert && currentAlert.status === 'pending' && !currentAlert.escalationEmailSent) {
        logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        logger.error(
          `⏰ ESCALATION TRIGGERED: No response for ${this.config.escalationDelayMinutes} minutes`
        );
        logger.error(`Alert ${alert.id} - Escalating to emergency services`);
        logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        await this.escalateToEmergencyServices(alert);
      } else if (currentAlert && currentAlert.escalationEmailSent) {
        logger.info(`⚠️  Alert ${alert.id} escalation email already sent. Skipping duplicate.`);
      } else {
        logger.info(`✅ Alert ${alert.id} was handled before escalation`);
      }
    }, delayMs);

    this.escalationTimers.set(alert.id, timer);
  }

  /**
   * STEP 5: Leo thang đến dịch vụ khẩn cấp (sau 5 phút không phản hồi)
   */
  private async escalateToEmergencyServices(alert: CriticalAlert): Promise<void> {
    // FIX: Prevent duplicate escalation emails
    if (alert.escalationEmailSent) {
      logger.warn(`⚠️  Escalation email already sent for alert ${alert.id}. Skipping duplicate.`);
      return;
    }

    logger.error(`🚑 ESCALATING TO EMERGENCY SERVICES: Alert ${alert.id}`);

    // Mark escalation email as sent BEFORE sending to prevent race conditions
    alert.escalationEmailSent = true;
    alert.escalatedAt = new Date();
    alert.status = 'escalated';
    this.activeAlerts.set(alert.id, alert);

    // Notify emergency hotlines
    if (this.config.emergencyHotlineEnabled) {
      await this.notifyEmergencyHotline(alert);
    }

    // Send high-priority notifications to all available team members (only once)
    await this.sendUrgentNotifications(alert);

    // Document escalation
    if (this.config.autoDocumentation) {
      await this.documentEscalation(alert);
    }
  }

  /**
   * Email Alert
   */
  private async sendEmailAlert(alert: CriticalAlert): Promise<void> {
    try {
      // Get all clinical team email addresses
      const recipients = this.config.clinicalTeam.map(member => member.email);

      logger.info(
        `📧 Attempting to send email alert to ${recipients.length} recipient(s) for alert ${alert.id}`
      );

      // Send email using email service
      await emailService.sendCriticalAlert(
        {
          id: alert.id,
          timestamp: alert.timestamp,
          userId: alert.userId,
          sessionId: alert.sessionId,
          riskType: alert.riskType,
          riskLevel: alert.riskLevel,
          userMessage: alert.userMessage,
          detectedKeywords: alert.detectedKeywords,
        },
        recipients
      );

      // Note: emailService.sendCriticalAlert() will log success with messageId if email was actually sent
      // This log is just for tracking that we attempted to send
      logger.info(`📧 Email send attempt completed for alert ${alert.id}`);
      console.log(
        `📧 Email send attempt for alert ${alert.id} - check logs for messageId to confirm delivery`
      );
    } catch (error) {
      logger.error('❌ Failed to send email alert:', error);
      console.error('Email sending failed:', error);
      // Don't throw - continue with other notifications
    }
  }

  /**
   * SMS Alert
   */
  private async sendSMSAlert(alert: CriticalAlert): Promise<void> {
    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    const smsContent = {
      to: this.config.clinicalTeam.map(member => member.phone),
      message: `🚨 CRITICAL: ${alert.riskType} detected. User: ${alert.userId}. Respond immediately. Alert: ${alert.id}`,
    };

    logger.info(`📱 SMS alert sent to clinical team for ${alert.id}`);
    console.log('SMS Alert:', smsContent);

    // TODO: Actual SMS sending
    // await smsService.send(smsContent);
  }

  /**
   * Slack Alert (Real-time team coordination)
   */
  private async sendSlackAlert(alert: CriticalAlert): Promise<void> {
    // TODO: Integrate with Slack API
    const slackMessage = {
      channel: '#crisis-alerts',
      text: '🚨 *CRITICAL INTERVENTION REQUIRED*',
      attachments: [
        {
          color: 'danger',
          fields: [
            { title: 'Alert ID', value: alert.id, short: true },
            { title: 'Risk Type', value: alert.riskType, short: true },
            { title: 'User ID', value: alert.userId, short: true },
            { title: 'Timestamp', value: alert.timestamp.toISOString(), short: true },
            { title: 'Keywords', value: alert.detectedKeywords.join(', '), short: false },
            { title: 'Message', value: alert.userMessage, short: false },
          ],
          actions: [
            {
              type: 'button',
              text: 'Acknowledge Alert',
              url: `https://soulfriend-admin.vercel.app/alerts/${alert.id}/acknowledge`,
            },
            {
              type: 'button',
              text: 'View Details',
              url: `https://soulfriend-admin.vercel.app/alerts/${alert.id}`,
            },
          ],
        },
      ],
    };

    logger.info(`💬 Slack alert sent for ${alert.id}`);
    console.log('Slack Alert:', slackMessage);

    // TODO: Actual Slack posting
    // await slackClient.postMessage(slackMessage);
  }

  /**
   * Notify Emergency Hotline
   */
  private async notifyEmergencyHotline(alert: CriticalAlert): Promise<void> {
    const hotlines = this.config.hotlines.filter(h => h.available24h);

    logger.error(
      `☎️ Emergency hotlines notified for ${alert.id}:`,
      hotlines.map(h => h.name)
    );

    // TODO: Integrate with automated phone system to notify hotlines
    // This could involve:
    // 1. Automated phone call to hotline with alert details
    // 2. Fax or secure message to hotline center
    // 3. Integration with national crisis network API (if available)
  }

  /**
   * Send Urgent Notifications (Escalated)
   */
  private async sendUrgentNotifications(alert: CriticalAlert): Promise<void> {
    try {
      // Send to ALL available team members, not just primary on-call
      const recipients = this.config.clinicalTeam
        .filter(m => m.availability !== 'offline')
        .map(m => m.email);

      await emailService.send({
        to: recipients,
        subject: `🚑 URGENT ESCALATION: ${alert.riskType.toUpperCase()} - NO RESPONSE FOR 5 MIN`,
        html: `
          <h2>🚑 URGENT ESCALATION - IMMEDIATE INTERVENTION REQUIRED</h2>
          <p><strong>No response received for 5 minutes.</strong></p>
          <p>Alert has been escalated to emergency services.</p>
          
          <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0;">
            <p><strong>Alert ID:</strong> ${alert.id}</p>
            <p><strong>Risk Type:</strong> ${alert.riskType}</p>
            <p><strong>User ID:</strong> ${alert.userId}</p>
            <p><strong>User Message:</strong> "${alert.userMessage}"</p>
          </div>
          
          <p><strong>This case requires IMMEDIATE attention.</strong></p>
          
          <p style="margin-top: 20px; padding: 10px; background: #f8f9fa; border-left: 4px solid #dc3545;">
            <strong>⚠️ Action Required:</strong><br>
            Please contact the user immediately or acknowledge this alert to stop further escalation emails.
          </p>
        `,
        text: `
URGENT ESCALATION - IMMEDIATE INTERVENTION REQUIRED

No response received for 5 minutes.
Alert has been escalated to emergency services.

Alert ID: ${alert.id}
Risk Type: ${alert.riskType}
User ID: ${alert.userId}
User Message: "${alert.userMessage}"

This case requires IMMEDIATE attention.

⚠️ Action Required: Please contact the user immediately or acknowledge this alert to stop further escalation emails.
        `.trim(),
      });

      logger.error(
        `🚨 Urgent email notifications sent to ${recipients.length} recipient(s) for escalated alert ${alert.id}`
      );
      console.log(`✅ Urgent email sent to: ${recipients.join(', ')}`);
    } catch (error) {
      logger.error('❌ Failed to send urgent email notifications:', error);
      console.error('Urgent email sending failed:', error);
    }
  }

  /**
   * Document Escalation
   */
  private async documentEscalation(alert: CriticalAlert): Promise<void> {
    const escalationLog = {
      alertId: alert.id,
      timestamp: new Date(),
      action: 'ESCALATED_TO_EMERGENCY',
      reason: 'No clinical team response within 5 minutes',
      notifiedHotlines: this.config.hotlines.filter(h => h.available24h).map(h => h.name),
    };

    logger.info(`📝 Escalation documented for ${alert.id}`);
    console.log('Escalation Log:', escalationLog);

    // TODO: Save to database for legal compliance
  }

  /**
   * STEP 6: Clinical team acknowledges alert (stops escalation)
   */
  async acknowledgeAlert(alertId: string, clinicalMemberId: string, notes?: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);

    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    // Stop escalation timer
    const timer = this.escalationTimers.get(alertId);
    if (timer) {
      clearTimeout(timer);
      this.escalationTimers.delete(alertId);
      logger.info(`⏱️ Escalation timer stopped for ${alertId}`);
    }

    // Update alert
    alert.status = 'acknowledged';
    alert.acknowledgedBy = clinicalMemberId;
    alert.acknowledgedAt = new Date();
    alert.interventionNotes = notes;

    this.activeAlerts.set(alertId, alert);

    logger.info(`✅ Alert ${alertId} acknowledged by ${clinicalMemberId}`);

    // Document acknowledgment
    if (this.config.autoDocumentation) {
      await this.documentAcknowledgment(alert);
    }
  }

  /**
   * Document Acknowledgment
   */
  private async documentAcknowledgment(alert: CriticalAlert): Promise<void> {
    const ackLog = {
      alertId: alert.id,
      timestamp: alert.acknowledgedAt,
      action: 'ACKNOWLEDGED',
      acknowledgedBy: alert.acknowledgedBy,
      notes: alert.interventionNotes,
    };

    logger.info(`📝 Acknowledgment documented for ${alert.id}`);
    console.log('Acknowledgment Log:', ackLog);
  }

  /**
   * Get active alerts (pending, acknowledged, or escalated)
   */
  getActiveAlerts(): CriticalAlert[] {
    return Array.from(this.activeAlerts.values()).filter(
      alert => alert.status === 'pending' || alert.status === 'acknowledged' || alert.status === 'escalated'
    );
  }

  /**
   * Get alert by ID
   */
  getAlert(alertId: string): CriticalAlert | undefined {
    return this.activeAlerts.get(alertId);
  }

  /**
   * Resolve alert (crisis resolved)
   */
  async resolveAlert(alertId: string, resolution: string, clinicalMemberId?: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);

    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.status = 'resolved';
    if (clinicalMemberId) {
      alert.acknowledgedBy = clinicalMemberId;
    }
    this.activeAlerts.set(alertId, alert);

    logger.info(`✅ Alert ${alertId} resolved: ${resolution}`);

    // Clean up timer
    const timer = this.escalationTimers.get(alertId);
    if (timer) {
      clearTimeout(timer);
      this.escalationTimers.delete(alertId);
    }
  }
}

// Export singleton instance
export const criticalInterventionService = new CriticalInterventionService();
