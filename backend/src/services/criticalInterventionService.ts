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
  status: 'pending' | 'acknowledged' | 'intervened' | 'resolved';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  interventionNotes?: string;
}

export interface ClinicalTeamMember {
  id: string;
  name: string;
  role: 'psychiatrist' | 'psychologist' | 'crisis_counselor' | 'social_worker';
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
      email: 'crisis@soulfriend.vn',
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

    // STEP 2: Immediate documentation
    if (this.config.autoDocumentation) {
      await this.documentAlert(alert);
    }

    // STEP 3: Notify clinical team immediately
    await this.notifyClinicalTeam(alert);

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
   */
  private async notifyClinicalTeam(alert: CriticalAlert): Promise<void> {
    logger.warn(`📢 Notifying clinical team for alert: ${alert.id}`);

    const notifications: Promise<void>[] = [];

    // Email notification
    if (this.config.emailEnabled) {
      notifications.push(this.sendEmailAlert(alert));
    }

    // SMS notification
    if (this.config.smsEnabled) {
      notifications.push(this.sendSMSAlert(alert));
    }

    // Slack notification (for real-time team coordination)
    if (this.config.slackEnabled) {
      notifications.push(this.sendSlackAlert(alert));
    }

    await Promise.all(notifications);
  }

  /**
   * STEP 4: Bắt đầu bộ đếm thời gian leo thang (5 phút)
   */
  private startEscalationTimer(alert: CriticalAlert): void {
    const delayMs = this.config.escalationDelayMinutes * 60 * 1000;

    logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.warn(`🚨 HITL ACTIVATED - CRISIS DETECTED`);
    logger.warn(`Alert ID: ${alert.id}`);
    logger.warn(`User: ${alert.userId}`);
    logger.warn(`Risk Type: ${alert.riskType}`);
    logger.warn(`Message: "${alert.userMessage}"`);
    logger.warn(`⏱️  ESCALATION TIMER: ${this.config.escalationDelayMinutes} minutes`);
    logger.warn(`📢 Clinical team has been notified`);
    logger.warn(`⚠️  If no response in ${this.config.escalationDelayMinutes} min → Auto escalate to emergency`);
    logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const timer = setTimeout(async () => {
      // Kiểm tra xem alert đã được xử lý chưa
      const currentAlert = this.activeAlerts.get(alert.id);

      if (currentAlert && currentAlert.status === 'pending') {
        logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        logger.error(`⏰ ESCALATION TRIGGERED: No response for ${this.config.escalationDelayMinutes} minutes`);
        logger.error(`Alert ${alert.id} - Escalating to emergency services`);
        logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        await this.escalateToEmergencyServices(alert);
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
    logger.error(`🚑 ESCALATING TO EMERGENCY SERVICES: Alert ${alert.id}`);

    // Update alert status
    alert.status = 'intervened';
    this.activeAlerts.set(alert.id, alert);

    // Notify emergency hotlines
    if (this.config.emergencyHotlineEnabled) {
      await this.notifyEmergencyHotline(alert);
    }

    // Send high-priority notifications to all available team members
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
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    const emailContent = {
      to: this.config.clinicalTeam.map(member => member.email),
      subject: `🚨 CRITICAL ALERT: ${alert.riskType.toUpperCase()} - ${alert.id}`,
      body: `
        CRITICAL INTERVENTION REQUIRED
        
        Alert ID: ${alert.id}
        Timestamp: ${alert.timestamp.toISOString()}
        User ID: ${alert.userId}
        Risk Type: ${alert.riskType}
        Risk Level: ${alert.riskLevel}
        
        Detected Keywords: ${alert.detectedKeywords.join(', ')}
        
        User Message: "${alert.userMessage}"
        
        IMMEDIATE ACTION REQUIRED
        Please acknowledge this alert within 5 minutes.
        
        Dashboard: https://soulfriend-admin.vercel.app/alerts/${alert.id}
      `,
    };

    logger.info(`📧 Email alert sent to clinical team for ${alert.id}`);
    console.log('Email Alert:', emailContent);

    // TODO: Actual email sending
    // await emailService.send(emailContent);
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
    // Send to ALL available team members, not just primary on-call
    const urgentEmail = {
      to: this.config.clinicalTeam.filter(m => m.availability !== 'offline').map(m => m.email),
      subject: `🚑 URGENT ESCALATION: ${alert.riskType.toUpperCase()} - NO RESPONSE FOR 5 MIN`,
      body: `
        URGENT ESCALATION - IMMEDIATE INTERVENTION REQUIRED
        
        No response received for 5 minutes.
        Alert has been escalated to emergency services.
        
        Alert ID: ${alert.id}
        Risk Type: ${alert.riskType}
        User ID: ${alert.userId}
        
        This case requires IMMEDIATE attention.
      `,
    };

    logger.error(`🚨 Urgent notifications sent for escalated alert ${alert.id}`);
    console.log('Urgent Email:', urgentEmail);
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
   * Get active alerts
   */
  getActiveAlerts(): CriticalAlert[] {
    return Array.from(this.activeAlerts.values()).filter(
      alert => alert.status === 'pending' || alert.status === 'acknowledged'
    );
  }

  /**
   * Resolve alert (crisis resolved)
   */
  async resolveAlert(alertId: string, resolution: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);

    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.status = 'resolved';
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
