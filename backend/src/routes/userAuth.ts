/**
 * User Authentication Routes
 * Register, login, profile for regular users
 * 
 * Privacy-first: minimal data collection
 * - No personal info required
 * - Anonymous display names
 * - Secure JWT tokens
 * 
 * @module routes/userAuth
 */

import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import logger from '../utils/logger';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_EXPIRES_IN = '30d'; // Regular users get longer sessions

// =============================================================================
// POST /api/v2/auth/register
// =============================================================================
router.post(
  '/register',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Email không hợp lệ'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Mật khẩu tối thiểu 8 ký tự')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Mật khẩu phải có chữ hoa, chữ thường và số'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array().map((e) => e.msg),
        });
      }

      const { email, password } = req.body;

      // Check existing user
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Email đã được đăng ký',
        });
      }

      // Create user
      const user = new User({
        email: email.toLowerCase(),
        password,
      });
      await user.save();

      // Generate token
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      logger.info(`✅ New user registered: ${email}`);

      res.status(201).json({
        success: true,
        message: 'Đăng ký thành công',
        token,
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
        },
      });
    } catch (error) {
      logger.error('Error registering user:', error);
      res.status(500).json({
        success: false,
        message: 'Đăng ký thất bại, vui lòng thử lại',
      });
    }
  }
);

// =============================================================================
// POST /api/v2/auth/login
// =============================================================================
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Email không hợp lệ'),
    body('password').notEmpty().withMessage('Mật khẩu không được để trống'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array().map((e) => e.msg),
        });
      }

      const { email, password } = req.body;

      // Find user with password field
      const user = await User.findOne({ email: email.toLowerCase() }).select(
        '+password'
      );
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không chính xác',
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản đã bị khóa',
        });
      }

      // Verify password
      const isValid = await user.comparePassword(password);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không chính xác',
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      logger.info(`✅ User logged in: ${email}`);

      res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        token,
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
        },
      });
    } catch (error) {
      logger.error('Error logging in user:', error);
      res.status(500).json({
        success: false,
        message: 'Đăng nhập thất bại',
      });
    }
  }
);

// =============================================================================
// GET /api/v2/auth/me — Get current user info
// =============================================================================
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Tài khoản không hợp lệ' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc hết hạn' });
  }
});

export default router;
