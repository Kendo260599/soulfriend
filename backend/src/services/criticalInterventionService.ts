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
import CriticalAlertModel from '../models/CriticalAlert';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface CriticalAlert {
  id: string;
  timestamp: Date;
  userId: string;
  sessionId: string;
  riskLevel: 'CRITICAL' | 'EXTREME';
  riskType: 'suicidal' | 'psychosis' | 'self_harm' | 'violence' | 'manipulation' | 'coercion';
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
      name: 'Chuyên Gia Tâm Lý CHUN',
      role: 'crisis_counselor',
      email: 'kendo2605@gmail.com', // Chuyên gia tâm lý chính
      phone: '+84-938021111', // 0938021111
      availability: 'available',
      specialty: ['crisis_intervention', 'mental_health', 'counseling']
    },
    {
      id: 'admin_team_1',
      name: 'System Administrator',
      role: 'admin',
      email: 'le3221374@gmail.com', // Backup admin email
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
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map();
  // In-memory cache for active alerts (synced with MongoDB)
  private alertCache: Map<string, CriticalAlert> = new Map();

  constructor(config?: Partial<InterventionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    logger.info('🚨 CriticalInterventionService initialized with HITL enabled');
    // Load active alerts from MongoDB on startup
    this.loadActiveAlertsFromDB().catch(err => {
      logger.warn('Failed to load alerts from DB on startup:', err);
    });
  }

  /**
   * Load active alerts from MongoDB into memory cache on startup
   */
  private async loadActiveAlertsFromDB(): Promise<void> {
    try {
      const activeAlerts = await CriticalAlertModel.find({
        status: { $in: ['pending', 'acknowledged', 'escalated'] },
      });
      for (const doc of activeAlerts) {
        const alert = this.docToAlert(doc);
        this.alertCache.set(alert.id, alert);
      }
      logger.info(`📋 Loaded ${activeAlerts.length} active alerts from database`);
    } catch (err) {
      logger.error('Failed to load active alerts from DB:', err);
    }
  }

  /** Convert Mongoose document to CriticalAlert interface */
  private docToAlert(doc: any): CriticalAlert {
    return {
      id: doc.alertId,
      timestamp: doc.timestamp,
      userId: doc.userId,
      sessionId: doc.sessionId,
      riskLevel: doc.riskLevel,
      riskType: doc.riskType,
      userMessage: doc.userMessage,
      detectedKeywords: doc.detectedKeywords || [],
      userProfile: doc.userProfile,
      testResults: doc.testResults,
      locationData: doc.locationData,
      status: doc.status,
      acknowledgedBy: doc.acknowledgedBy,
      acknowledgedAt: doc.acknowledgedAt,
      interventionNotes: doc.interventionNotes,
      escalatedAt: doc.escalatedAt,
      escalationEmailSent: doc.escalationEmailSent || false,
      metadata: doc.metadata,
    };
  }

  /**
   * STEP 1: Phát hiện và tạo Critical Alert
   */
  async createCriticalAlert(
    userId: string,
    sessionId: string,
    riskData: {
      riskLevel: 'CRITICAL' | 'EXTREME';
      riskType: 'suicidal' | 'psychosis' | 'self_harm' | 'violence' | 'manipulation' | 'coercion';
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

    this.alertCache.set(alert.id, alert);

    // Persist to MongoDB (non-blocking)
    CriticalAlertModel.create({
      alertId: alert.id,
      timestamp: alert.timestamp,
      userId: alert.userId,
      sessionId: alert.sessionId,
      riskLevel: alert.riskLevel,
      riskType: alert.riskType,
      userMessage: alert.userMessage,
      detectedKeywords: alert.detectedKeywords,
      userProfile: alert.userProfile,
      testResults: alert.testResults,
      locationData: alert.locationData,
      status: alert.status,
      metadata: alert.metadata,
    }).catch(err => {
      logger.error('Failed to persist alert to MongoDB:', err);
    });

    logger.error(`🚨 CRITICAL ALERT CREATED: ${alert.id}`, {
      userId,
      riskType: alert.riskType,
      keywords: alert.detectedKeywords,
    });

    // Force console output for Render visibility
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

      // FIX: Check if alert is still pending AND escalation email hasn't been sent
      const currentAlert = this.alertCache.get(alert.id);
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
    this.alertCache.set(alert.id, alert);

    // Persist escalation to MongoDB
    CriticalAlertModel.findOneAndUpdate(
      { alertId: alert.id },
      { status: 'escalated', escalatedAt: alert.escalatedAt, escalationEmailSent: true }
    ).catch(err => logger.error('Failed to persist escalation:', err));

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
    let alert = this.alertCache.get(alertId);

    // Fallback to DB if not in cache
    if (!alert) {
      const doc = await CriticalAlertModel.findOne({ alertId });
      if (!doc) throw new Error(`Alert ${alertId} not found`);
      alert = this.docToAlert(doc);
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

    this.alertCache.set(alertId, alert);

    // Persist to MongoDB
    CriticalAlertModel.findOneAndUpdate(
      { alertId },
      { status: 'acknowledged', acknowledgedBy: clinicalMemberId, acknowledgedAt: alert.acknowledgedAt, interventionNotes: notes }
    ).catch(err => logger.error('Failed to persist acknowledgment:', err));

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
    return Array.from(this.alertCache.values()).filter(
      alert =>
        alert.status === 'pending' ||
        alert.status === 'acknowledged' ||
        alert.status === 'escalated'
    );
  }

  /**
   * Get all alerts (including resolved) from MongoDB for analytics
   */
  async getAllAlerts(limit: number = 100): Promise<CriticalAlert[]> {
    const docs = await CriticalAlertModel.find()
      .sort({ timestamp: -1 })
      .limit(limit);
    return docs.map(d => this.docToAlert(d));
  }

  /**
   * Get alert stats from entire database
   */
  async getAlertStats(): Promise<{
    total: number;
    pending: number;
    acknowledged: number;
    resolved: number;
    escalated: number;
    avgResponseTimeMs: number;
  }> {
    const [total, pending, acknowledged, resolved, escalated] = await Promise.all([
      CriticalAlertModel.countDocuments(),
      CriticalAlertModel.countDocuments({ status: 'pending' }),
      CriticalAlertModel.countDocuments({ status: 'acknowledged' }),
      CriticalAlertModel.countDocuments({ status: 'resolved' }),
      CriticalAlertModel.countDocuments({ status: 'escalated' }),
    ]);

    // Avg response time for acknowledged alerts
    const ackedAlerts = await CriticalAlertModel.find({
      status: { $in: ['acknowledged', 'resolved'] },
      acknowledgedAt: { $exists: true },
    }).select('timestamp acknowledgedAt');

    let avgResponseTimeMs = 0;
    if (ackedAlerts.length > 0) {
      const totalMs = ackedAlerts.reduce((sum, a) => {
        return sum + (new Date(a.acknowledgedAt!).getTime() - new Date(a.timestamp).getTime());
      }, 0);
      avgResponseTimeMs = totalMs / ackedAlerts.length;
    }

    return { total, pending, acknowledged, resolved, escalated, avgResponseTimeMs };
  }

  /**
   * Get alert by ID
   */
  getAlert(alertId: string): CriticalAlert | undefined {
    return this.alertCache.get(alertId);
  }

  /**
   * Get alert by ID — async version with DB fallback
   */
  async getAlertAsync(alertId: string): Promise<CriticalAlert | null> {
    const cached = this.alertCache.get(alertId);
    if (cached) return cached;
    const doc = await CriticalAlertModel.findOne({ alertId });
    if (!doc) return null;
    const alert = this.docToAlert(doc);
    this.alertCache.set(alertId, alert);
    return alert;
  }

  /**
   * Resolve alert (crisis resolved)
   */
  async resolveAlert(
    alertId: string,
    resolution: string,
    clinicalMemberId?: string
  ): Promise<void> {
    let alert = this.alertCache.get(alertId);

    if (!alert) {
      const doc = await CriticalAlertModel.findOne({ alertId });
      if (!doc) throw new Error(`Alert ${alertId} not found`);
      alert = this.docToAlert(doc);
    }

    alert.status = 'resolved';
    if (clinicalMemberId) {
      alert.acknowledgedBy = clinicalMemberId;
    }
    this.alertCache.set(alertId, alert);

    // Persist to MongoDB
    CriticalAlertModel.findOneAndUpdate(
      { alertId },
      { status: 'resolved', resolvedAt: new Date(), resolution, acknowledgedBy: clinicalMemberId || alert.acknowledgedBy }
    ).catch(err => logger.error('Failed to persist resolution:', err));

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
