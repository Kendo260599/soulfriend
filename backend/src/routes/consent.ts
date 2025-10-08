/**
 * Routes cho việc xử lý đồng ý tham gia khảo sát
 */

import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Consent from '../models/Consent';
import { MockDataStore } from '../utils/mockDataStore';

const router = express.Router();

/**
 * POST /api/consent
 * Lưu thông tin đồng ý tham gia khảo sát của người dùng
 */
router.post(
  '/',
  [
    body('agreed').isBoolean().withMessage('Trạng thái đồng ý phải là boolean'),
    body('timestamp').isISO8601().withMessage('Timestamp không hợp lệ'),
    body('ipAddress').optional().isIP().withMessage('IP address không hợp lệ'),
    body('userAgent').optional().isString().withMessage('User agent phải là string'),
  ],
  async (req: Request, res: Response) => {
    try {
      // Kiểm tra validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: errors.array(),
        });
      }

      const { agreed, timestamp, ipAddress, userAgent } = req.body;

      // Chỉ lưu khi người dùng đồng ý
      if (!agreed) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng đồng ý tham gia khảo sát để tiếp tục',
        });
      }

      // Kiểm tra kết nối MongoDB
      if (mongoose.connection.readyState !== 1) {
        // Sử dụng mock data store
        const consent = MockDataStore.createConsent({
          agreed,
          timestamp: new Date(timestamp),
          ipAddress: ipAddress || req.ip,
          userAgent: userAgent || req.get('User-Agent'),
        });

        return res.status(201).json({
          success: true,
          message: 'Đã lưu thông tin đồng ý thành công (Mock mode)',
          consentId: consent.id,
        });
      }

      // Tạo consent record mới trong MongoDB
      const consent = new Consent({
        agreed,
        timestamp: new Date(timestamp),
        ipAddress: ipAddress || req.ip,
        userAgent: userAgent || req.get('User-Agent'),
      });

      await consent.save();

      res.status(201).json({
        success: true,
        message: 'Đã lưu thông tin đồng ý thành công',
        consentId: consent._id,
      });
    } catch (error) {
      console.error('Error saving consent:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lưu thông tin đồng ý',
      });
    }
  }
);

/**
 * GET /api/consent/stats
 * Lấy thống kê về số lượng đồng ý tham gia
 */
router.get('/stats', async (req, res) => {
  try {
    const totalConsents = await Consent.countDocuments({ agreed: true });
    const todayConsents = await Consent.countDocuments({
      agreed: true,
      timestamp: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    });

    res.json({
      success: true,
      data: {
        totalConsents,
        todayConsents,
      },
    });
  } catch (error) {
    console.error('Error getting consent stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê',
    });
  }
});

export default router;
