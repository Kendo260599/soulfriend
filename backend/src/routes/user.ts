/**
 * Routes cho quản lý quyền riêng tư và dữ liệu người dùng
 */

import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { MockDataStore } from '../utils/mockDataStore';

const router = express.Router();

/**
 * GET /api/user/data
 * Lấy tất cả dữ liệu cá nhân của người dùng
 */
router.get('/data', async (req: Request, res: Response) => {
  try {
    // Trong thực tế, cần xác thực người dùng qua JWT token
    // Tạm thời sử dụng mock data

    const userData = {
      personalInfo: {
        name: 'Test User',
        age: 25,
        email: 'user@example.com',
        createdAt: new Date().toISOString(),
      },
      testResults: MockDataStore.getAllTestResults(),
      consentHistory: MockDataStore.getAllConsents(),
      dataProcessingLog: [
        {
          action: 'data_access',
          timestamp: new Date().toISOString(),
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        },
      ],
    };

    // Log access for audit trail
    console.log(`[AUDIT] Data access request from IP: ${req.ip} at ${new Date().toISOString()}`);

    res.json({
      success: true,
      message: 'Dữ liệu cá nhân được tải thành công',
      data: userData,
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tải dữ liệu cá nhân',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

/**
 * GET /api/user/export
 * Xuất dữ liệu cá nhân ở định dạng JSON
 */
router.get('/export', async (req: Request, res: Response) => {
  try {
    const userData = {
      exportInfo: {
        exportedAt: new Date().toISOString(),
        exportFormat: 'JSON',
        version: '1.0',
        purpose: 'User data portability (GDPR Article 20)',
      },
      personalInfo: {
        name: 'Test User',
        age: 25,
        email: 'user@example.com',
        createdAt: new Date().toISOString(),
      },
      testResults: MockDataStore.getAllTestResults(),
      consentHistory: MockDataStore.getAllConsents(),
      privacySettings: {
        dataProcessingConsent: true,
        marketingConsent: false,
        analyticsConsent: true,
        lastUpdated: new Date().toISOString(),
      },
    };

    // Log export for audit trail
    console.log(`[AUDIT] Data export request from IP: ${req.ip} at ${new Date().toISOString()}`);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="soulfriend-data-${new Date().toISOString().split('T')[0]}.json"`
    );
    res.json(userData);
  } catch (error) {
    console.error('Error exporting user data:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xuất dữ liệu',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

/**
 * POST /api/user/withdraw-consent
 * Rút lại sự đồng ý xử lý dữ liệu
 */
router.post('/withdraw-consent', async (req: Request, res: Response) => {
  try {
    // Log consent withdrawal
    console.log(
      `[AUDIT] Consent withdrawal request from IP: ${req.ip} at ${new Date().toISOString()}`
    );

    // Trong thực tế, cập nhật database để đánh dấu consent đã bị rút lại
    const withdrawalRecord = {
      action: 'consent_withdrawal',
      timestamp: new Date().toISOString(),
      ipAddress: req.ip,
      reason: 'User initiated withdrawal',
      legalBasis: 'GDPR Article 7(3)',
    };

    // Mock implementation
    MockDataStore.logAction(withdrawalRecord);

    res.json({
      success: true,
      message:
        'Đã rút lại sự đồng ý thành công. Dữ liệu của bạn sẽ chỉ được lưu trữ theo yêu cầu pháp lý.',
      withdrawalId: `withdrawal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      effectiveDate: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error withdrawing consent:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể rút lại đồng ý',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

/**
 * DELETE /api/user/data
 * Xóa tất cả dữ liệu cá nhân (Right to be forgotten)
 */
router.delete('/data', async (req: Request, res: Response) => {
  try {
    // Log deletion request for audit trail
    console.log(`[AUDIT] Data deletion request from IP: ${req.ip} at ${new Date().toISOString()}`);

    // Trong thực tế, cần:
    // 1. Xác thực danh tính người dùng
    // 2. Kiểm tra có nghĩa vụ pháp lý nào yêu cầu giữ lại dữ liệu không
    // 3. Xóa dữ liệu từ tất cả hệ thống (database, backup, cache, logs)
    // 4. Thông báo cho các bên thứ ba (nếu có)

    // Mock implementation
    const deletionRecord = {
      action: 'data_deletion',
      timestamp: new Date().toISOString(),
      ipAddress: req.ip,
      deletionId: `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      legalBasis: 'GDPR Article 17 (Right to erasure)',
      dataCategories: [
        'personal_information',
        'test_results',
        'consent_records',
        'usage_analytics',
      ],
    };

    // Clear mock data
    MockDataStore.clearAllUserData();
    MockDataStore.logAction(deletionRecord);

    res.json({
      success: true,
      message: 'Tất cả dữ liệu cá nhân đã được xóa thành công',
      deletionId: deletionRecord.deletionId,
      deletedAt: deletionRecord.timestamp,
      retentionPeriod: 'Dữ liệu audit sẽ được giữ lại 3 năm theo yêu cầu pháp lý',
    });
  } catch (error) {
    console.error('Error deleting user data:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xóa dữ liệu',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

/**
 * POST /api/user/update-consent
 * Cập nhật tùy chọn đồng ý
 */
router.post(
  '/update-consent',
  [
    body('dataProcessing').isBoolean().withMessage('dataProcessing phải là boolean'),
    body('marketing').optional().isBoolean().withMessage('marketing phải là boolean'),
    body('analytics').optional().isBoolean().withMessage('analytics phải là boolean'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: errors.array(),
        });
      }

      const { dataProcessing, marketing = false, analytics = false } = req.body;

      // Log consent update
      console.log(`[AUDIT] Consent update from IP: ${req.ip} at ${new Date().toISOString()}`);

      const consentUpdate = {
        action: 'consent_update',
        timestamp: new Date().toISOString(),
        ipAddress: req.ip,
        consentId: `consent_update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        settings: {
          dataProcessing,
          marketing,
          analytics,
        },
      };

      MockDataStore.logAction(consentUpdate);

      res.json({
        success: true,
        message: 'Tùy chọn đồng ý đã được cập nhật',
        consentId: consentUpdate.consentId,
        updatedAt: consentUpdate.timestamp,
      });
    } catch (error) {
      console.error('Error updating consent:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể cập nhật tùy chọn đồng ý',
        error: process.env.NODE_ENV === 'development' ? error : undefined,
      });
    }
  }
);

/**
 * GET /api/user/audit-log
 * Lấy lịch sử truy cập và xử lý dữ liệu
 */
router.get('/audit-log', async (req: Request, res: Response) => {
  try {
    // Log audit log access
    console.log(`[AUDIT] Audit log access from IP: ${req.ip} at ${new Date().toISOString()}`);

    const auditLog = MockDataStore.getAuditLog();

    res.json({
      success: true,
      message: 'Lấy lịch sử audit thành công',
      data: auditLog,
      note: 'Chỉ hiển thị hoạt động trong 90 ngày gần nhất',
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tải lịch sử audit',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

export default router;
