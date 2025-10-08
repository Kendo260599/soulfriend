/**
 * Middleware xác thực và phân quyền cho admin
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin';

// Extend Request interface để thêm admin info
declare global {
  namespace Express {
    interface Request {
      admin?: {
        adminId: string;
        username: string;
        role: string;
      };
    }
  }
}

/**
 * Middleware xác thực admin bằng JWT token
 */
export const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Lấy token từ header Authorization
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token xác thực. Vui lòng đăng nhập.',
      });
    }

    const token = authHeader.substring(7); // Bỏ "Bearer " prefix

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'soulfriend_secret_key') as any;

    if (!decoded.adminId) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ',
      });
    }

    // Tìm admin trong database và kiểm tra trạng thái
    const admin = await Admin.findById(decoded.adminId).select('-password');
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin không tồn tại',
      });
    }

    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản admin đã bị vô hiệu hóa',
      });
    }

    // Kiểm tra tài khoản có bị khóa không
    if ((admin as any).isLocked) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản tạm thời bị khóa do đăng nhập sai nhiều lần',
      });
    }

    // Thêm thông tin admin vào request object
    req.admin = {
      adminId: (admin._id as any).toString(),
      username: admin.username,
      role: admin.role,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn. Vui lòng đăng nhập lại.',
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xác thực',
    });
  }
};

/**
 * Middleware kiểm tra quyền super admin
 */
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.admin) {
    return res.status(401).json({
      success: false,
      message: 'Chưa được xác thực',
    });
  }

  if (req.admin.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Cần quyền Super Admin để thực hiện hành động này',
    });
  }

  next();
};

/**
 * Middleware rate limiting cho việc đăng nhập
 * Giới hạn số lần đăng nhập từ một IP
 */
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

export const rateLimitLogin = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 phút
  const maxAttempts = 10; // Tối đa 10 lần trong 15 phút

  const attempts = loginAttempts.get(clientIP);

  if (attempts) {
    // Reset count nếu đã qua window time
    if (now - attempts.lastAttempt > windowMs) {
      loginAttempts.set(clientIP, { count: 1, lastAttempt: now });
    } else if (attempts.count >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: 'Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau 15 phút.',
      });
    } else {
      attempts.count++;
      attempts.lastAttempt = now;
    }
  } else {
    loginAttempts.set(clientIP, { count: 1, lastAttempt: now });
  }

  next();
};

/**
 * Middleware để log các action của admin
 */
export const logAdminAction = (action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const adminInfo = req.admin;
    const timestamp = new Date().toISOString();

    console.log(
      `[${timestamp}] Admin Action: ${action} by ${adminInfo?.username} (${adminInfo?.adminId})`
    );

    // TODO: Có thể lưu vào database để audit trail
    next();
  };
};
