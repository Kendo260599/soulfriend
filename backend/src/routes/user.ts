/**
 * GDPR-Compliant User Data Routes
 *
 * Real MongoDB-backed endpoints for:
 *  - GDPR Art. 15: Right of access (GET /data)
 *  - GDPR Art. 20: Data portability (GET /export)
 *  - GDPR Art. 17: Right to erasure (DELETE /data)
 *  - GDPR Art. 7(3): Consent withdrawal (POST /withdraw-consent)
 *  - GDPR Art. 6 & 7: Consent management (POST /update-consent)
 *  - Audit trail access (GET /audit-log)
 *
 * @module routes/user
 * @version 2.0.0
 */

import express, { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticateAdmin } from '../middleware/auth';
import { auditLogger } from '../middleware/auditLogger';
import logger from '../utils/logger';

// Models
import Consent from '../models/Consent';
import { ConversationLog } from '../models/ConversationLog';
import TestResult from '../models/TestResult';
import CriticalAlert from '../models/CriticalAlert';
import InterventionMessage from '../models/InterventionMessage';
import AuditLogModel from '../models/AuditLog';
import LongTermMemory from '../models/LongTermMemory';

// Services
import { memorySystem } from '../services/memorySystem';

const router = express.Router();

/**
 * Helper: Extract target userId from request
 * Admin can specify userId in query param; otherwise uses session-based userId from body
 */
function getTargetUserId(req: Request): string | null {
  return (
    (req.query.userId as string) ||
    (req.body?.userId as string) ||
    null
  );
}

// =============================================================================
// GET /api/user/data — GDPR Art. 15: Right of Access
// =============================================================================
router.get(
  '/data',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = getTargetUserId(req);
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId là bắt buộc (query param hoặc body)',
      });
    }

    // Parallel fetch all user data from MongoDB
    const [
      consents,
      conversations,
      testResults,
      criticalAlerts,
      interventionMessages,
    ] = await Promise.all([
      Consent.find({ userId }).sort({ timestamp: -1 }).lean(),
      ConversationLog.find({ userId }).sort({ timestamp: -1 }).limit(500).lean(),
      TestResult.find({
        consentId: { $in: await Consent.find({ userId }).distinct('_id') },
      }).sort({ completedAt: -1 }).lean(),
      CriticalAlert.find({ userId }).sort({ timestamp: -1 }).lean(),
      InterventionMessage.find({ userId }).sort({ timestamp: -1 }).lean(),
    ]);

    // Log data access for audit trail
    auditLogger.logDataAccess(
      userId,
      'user_data',
      'read',
      'personal_info',
      'GDPR Art. 6(1)(c) - Legal obligation'
    );

    const userData = {
      userId,
      accessedAt: new Date().toISOString(),
      legalBasis: 'GDPR Art. 15 - Right of access',
      data: {
        consentHistory: consents,
        conversations: conversations.map(c => ({
          conversationId: c.conversationId,
          sessionId: c.sessionId,
          timestamp: c.timestamp,
          userMessage: c.userMessage,
          aiResponse: c.aiResponse,
          userSentiment: c.userSentiment,
        })),
        testResults: testResults.map(t => ({
          testType: t.testType,
          totalScore: t.totalScore,
          subscaleScores: t.subscaleScores,
          evaluation: t.evaluation,
          completedAt: t.completedAt,
        })),
        criticalAlerts: criticalAlerts.map(a => ({
          alertId: a.alertId,
          timestamp: a.timestamp,
          riskLevel: a.riskLevel,
          riskType: a.riskType,
          status: a.status,
        })),
        interventionMessages: interventionMessages.length,
      },
      summary: {
        totalConversations: conversations.length,
        totalTestResults: testResults.length,
        totalAlerts: criticalAlerts.length,
        totalConsents: consents.length,
      },
    };

    res.json({
      success: true,
      message: 'Dữ liệu cá nhân được tải thành công',
      data: userData,
    });
  })
);

// =============================================================================
// GET /api/user/export — GDPR Art. 20: Data Portability
// =============================================================================
router.get(
  '/export',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = getTargetUserId(req);
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId là bắt buộc',
      });
    }

    // Fetch ALL data — no limits for export
    const [consents, conversations, testResults, criticalAlerts, interventionMessages] =
      await Promise.all([
        Consent.find({ userId }).sort({ timestamp: -1 }).lean(),
        ConversationLog.find({ userId }).sort({ timestamp: -1 }).lean(),
        TestResult.find({
          consentId: { $in: await Consent.find({ userId }).distinct('_id') },
        }).lean(),
        CriticalAlert.find({ userId }).sort({ timestamp: -1 }).lean(),
        InterventionMessage.find({ userId }).sort({ timestamp: -1 }).lean(),
      ]);

    // Audit log
    auditLogger.logGDPR(
      'data_export',
      userId,
      'GDPR Art. 20 - Data portability',
      ['personal_info', 'test_results', 'conversations', 'crisis_alerts'],
      { format: 'JSON', totalRecords: conversations.length + testResults.length }
    );

    const exportData = {
      exportInfo: {
        exportedAt: new Date().toISOString(),
        exportFormat: 'JSON',
        version: '2.0',
        purpose: 'User data portability (GDPR Article 20)',
        userId,
      },
      consentHistory: consents,
      conversations,
      testResults,
      criticalAlerts,
      interventionMessages,
      metadata: {
        totalConversations: conversations.length,
        totalTestResults: testResults.length,
        totalAlerts: criticalAlerts.length,
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="soulfriend-data-${userId}-${new Date().toISOString().split('T')[0]}.json"`
    );
    res.json(exportData);
  })
);

// =============================================================================
// POST /api/user/withdraw-consent — GDPR Art. 7(3)
// =============================================================================
router.post(
  '/withdraw-consent',
  [
    body('userId').notEmpty().withMessage('userId là bắt buộc'),
    body('reason').optional().isString(),
  ],
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { userId, reason } = req.body;

    // Withdraw all active consents for this user
    const result = await (Consent as any).withdrawConsent(userId, reason || 'User initiated withdrawal');

    // Audit log
    auditLogger.logGDPR(
      'consent_withdrawal',
      userId,
      'GDPR Art. 7(3) - Right to withdraw consent',
      ['consent'],
      {
        reason,
        withdrawnCount: result.modifiedCount,
        ipAddress: req.ip,
      }
    );

    logger.info(`[GDPR] Consent withdrawn for user ${userId}: ${result.modifiedCount} records updated`);

    res.json({
      success: true,
      message: 'Đã rút lại sự đồng ý thành công. Dữ liệu của bạn sẽ chỉ được lưu trữ theo yêu cầu pháp lý.',
      withdrawnCount: result.modifiedCount,
      effectiveDate: new Date().toISOString(),
    });
  })
);

// =============================================================================
// DELETE /api/user/data — GDPR Art. 17: Right to Erasure
// =============================================================================
router.delete(
  '/data',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = getTargetUserId(req);
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId là bắt buộc',
      });
    }

    const deletionId = `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const deletionSummary: Record<string, number> = {};

    // 1. Delete memories from Redis, Pinecone, MongoDB LongTermMemory
    try {
      await memorySystem.deleteUserMemories(userId);
      deletionSummary.memories = 1; // bulk operation
    } catch (err) {
      logger.error(`[GDPR] Error deleting memories for ${userId}:`, err);
      deletionSummary.memoriesError = 1;
    }

    // 2. Delete conversations
    const convResult = await ConversationLog.deleteMany({ userId });
    deletionSummary.conversations = convResult.deletedCount || 0;

    // 3. Delete test results (by consentId linkage)
    const userConsentIds = await Consent.find({ userId }).distinct('_id');
    if (userConsentIds.length > 0) {
      const trResult = await TestResult.deleteMany({ consentId: { $in: userConsentIds } });
      deletionSummary.testResults = trResult.deletedCount || 0;
    }

    // 4. Delete critical alerts
    const alertResult = await CriticalAlert.deleteMany({ userId });
    deletionSummary.criticalAlerts = alertResult.deletedCount || 0;

    // 5. Delete intervention messages
    const msgResult = await InterventionMessage.deleteMany({ userId });
    deletionSummary.interventionMessages = msgResult.deletedCount || 0;

    // 6. Withdraw and mark consents (keep for legal audit, mark as withdrawn)
    await (Consent as any).withdrawConsent(userId, 'Data deletion request - GDPR Art. 17');
    const consentCount = await Consent.countDocuments({ userId });
    deletionSummary.consentsWithdrawn = consentCount;

    // 7. Audit log this deletion (keeping audit records for legal compliance)
    auditLogger.logGDPR(
      'data_deletion',
      userId,
      'GDPR Art. 17 - Right to erasure',
      ['personal_info', 'test_results', 'conversations', 'crisis_alerts', 'memories'],
      {
        deletionId,
        deletionSummary,
        ipAddress: req.ip,
      }
    );

    logger.info(`[GDPR] Data deletion completed for user ${userId}:`, deletionSummary);

    res.json({
      success: true,
      message: 'Tất cả dữ liệu cá nhân đã được xóa thành công',
      deletionId,
      deletedAt: new Date().toISOString(),
      deletionSummary,
      retentionNote: 'Dữ liệu audit sẽ được giữ lại 3 năm theo yêu cầu pháp lý',
    });
  })
);

// =============================================================================
// POST /api/user/update-consent — Granular Consent Management
// =============================================================================
router.post(
  '/update-consent',
  [
    body('userId').notEmpty().withMessage('userId là bắt buộc'),
    body('dataProcessing').isBoolean().withMessage('dataProcessing phải là boolean'),
    body('analytics').optional().isBoolean().withMessage('analytics phải là boolean'),
    body('research').optional().isBoolean().withMessage('research phải là boolean'),
    body('aiProcessing').optional().isBoolean().withMessage('aiProcessing phải là boolean'),
    body('marketing').optional().isBoolean().withMessage('marketing phải là boolean'),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array(),
      });
    }

    const {
      userId,
      dataProcessing,
      analytics = false,
      research = false,
      aiProcessing = false,
      marketing = false,
    } = req.body;

    // Create new consent record (append-only for auditability)
    const newConsent = await Consent.create({
      userId,
      agreed: dataProcessing, // Core processing consent
      timestamp: new Date(),
      consentTypes: {
        dataProcessing,
        analytics,
        research,
        aiProcessing,
        marketing,
      },
      consentVersion: '2.0',
      policyVersion: process.env.PRIVACY_POLICY_VERSION || '1.0',
      source: 'web',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    });

    // Audit log
    auditLogger.logGDPR(
      'consent_update',
      userId,
      'GDPR Art. 6(1)(a) - Consent',
      ['consent'],
      {
        consentId: newConsent._id,
        consentTypes: { dataProcessing, analytics, research, aiProcessing, marketing },
      }
    );

    res.json({
      success: true,
      message: 'Tùy chọn đồng ý đã được cập nhật',
      consentId: newConsent._id,
      updatedAt: newConsent.timestamp,
    });
  })
);

// =============================================================================
// GET /api/user/audit-log — User Audit Trail Access
// =============================================================================
router.get(
  '/audit-log',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = getTargetUserId(req);
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId là bắt buộc',
      });
    }

    // Retrieve from MongoDB AuditLog
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const auditLogs = await AuditLogModel.find({
      userId,
      timestamp: { $gte: ninetyDaysAgo },
    })
      .sort({ timestamp: -1 })
      .limit(200)
      .lean();

    // Audit the audit access
    auditLogger.logDataAccess(
      userId,
      'audit_log',
      'read',
      'audit_trail',
      'GDPR Art. 15 - Right of access'
    );

    res.json({
      success: true,
      message: 'Lấy lịch sử audit thành công',
      data: auditLogs,
      count: auditLogs.length,
      note: 'Chỉ hiển thị hoạt động trong 90 ngày gần nhất',
    });
  })
);

export default router;
