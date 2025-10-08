/**
 * Routes cho quản trị admin
 */

import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin';
import TestResult from '../models/TestResult';
import Consent from '../models/Consent';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

/**
 * POST /api/admin/login
 * Đăng nhập admin
 */
router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('Username không được để trống'),
    body('password').isLength({ min: 6 }).withMessage('Password phải có ít nhất 6 ký tự'),
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

      const { username, password } = req.body;

      // Tìm admin trong database
      const admin = await Admin.findOne({ username });
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Tên đăng nhập hoặc mật khẩu không chính xác',
        });
      }

      // Kiểm tra password
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Tên đăng nhập hoặc mật khẩu không chính xác',
        });
      }

      // Tạo JWT token
      const token = jwt.sign(
        { adminId: admin._id, username: admin.username },
        process.env.JWT_SECRET || 'soulfriend_secret_key',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          token,
          admin: {
            id: admin._id,
            username: admin.username,
            email: admin.email,
          },
        },
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi đăng nhập',
      });
    }
  }
);

/**
 * GET /api/admin/dashboard
 * Lấy thống kê tổng quan cho dashboard admin
 */
router.get('/dashboard', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    // Thống kê tổng quan
    const totalConsents = await Consent.countDocuments({ agreed: true });
    const totalTests = await TestResult.countDocuments({});

    // Thống kê theo ngày
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const todayConsents = await Consent.countDocuments({
      agreed: true,
      timestamp: { $gte: startOfDay },
    });
    const todayTests = await TestResult.countDocuments({
      completedAt: { $gte: startOfDay },
    });

    // Thống kê theo loại test
    const testStats = await TestResult.aggregate([
      {
        $group: {
          _id: '$testType',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalConsents,
          totalTests,
          todayConsents,
          todayTests,
        },
        testStats,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy dữ liệu dashboard',
    });
  }
});

/**
 * GET /api/admin/test-results
 * Lấy danh sách kết quả test với phân trang và lọc
 */
router.get('/test-results', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const testType = req.query.testType as string;
    const skip = (page - 1) * limit;

    // Tạo filter query
    const filter: any = {};
    if (testType && testType !== 'all') {
      filter.testType = testType;
    }

    // Lấy dữ liệu với phân trang
    const testResults = await TestResult.find(filter)
      .populate('consentId', 'timestamp ipAddress')
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await TestResult.countDocuments(filter);

    res.json({
      success: true,
      data: {
        testResults,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Test results error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy kết quả test',
    });
  }
});

/**
 * GET /api/admin/export
 * Xuất dữ liệu ra file CSV
 */
router.get('/export', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const testType = req.query.testType as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    // Tạo filter query
    const filter: any = {};
    if (testType && testType !== 'all') {
      filter.testType = testType;
    }
    if (startDate && endDate) {
      filter.completedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const testResults = await TestResult.find(filter)
      .populate('consentId', 'timestamp ipAddress')
      .sort({ completedAt: -1 });

    // Tạo CSV content
    const csvHeaders = 'ID,Loại Test,Tổng Điểm,Đánh Giá,Ngày Hoàn Thành,IP Address\n';
    const csvRows = testResults
      .map(result => {
        const consent = result.consentId as any;
        return [
          result._id,
          result.testType,
          result.totalScore,
          result.evaluation?.severity || '',
          result.completedAt.toISOString(),
          consent?.ipAddress || '',
        ].join(',');
      })
      .join('\n');

    const csvContent = csvHeaders + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=soulfriend_data.csv');
    res.send(csvContent);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xuất dữ liệu',
    });
  }
});

export default router;
