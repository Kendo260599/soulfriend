/**
 * Expert Authentication Routes
 * Login, registration, and profile management for crisis intervention experts
 */

import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Expert, { IExpert } from '../models/Expert';
import logger from '../utils/logger';

const router = express.Router();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'soulfriend-expert-jwt-secret-change-in-prod';
const JWT_EXPIRES_IN = '7d'; // Token valid for 7 days

// =============================================================================
// POST /api/v2/expert/register
// Register new expert (for initial setup)
// =============================================================================

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, phone, specialty } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters',
      });
    }

    // Check if expert already exists
    const existingExpert = await Expert.findOne({ email: email.toLowerCase() });
    if (existingExpert) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered',
      });
    }

    // Create expert
    const expert = new Expert({
      email: email.toLowerCase(),
      password, // Will be hashed by pre-save hook
      name,
      role: role || 'crisis_counselor',
      phone,
      specialty: specialty || ['crisis_intervention'],
      verified: false, // Admin needs to verify
      active: false, // Admin needs to activate
      availability: 'offline',
    });

    await expert.save();

    logger.info(`✅ New expert registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please wait for admin verification.',
      expert: {
        id: expert._id,
        email: expert.email,
        name: expert.name,
        role: expert.role,
        verified: expert.verified,
        active: expert.active,
      },
    });
  } catch (error) {
    logger.error('Error registering expert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register expert',
    });
  }
});

// =============================================================================
// POST /api/v2/expert/login
// Expert login
// =============================================================================

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    // Find expert (include password field)
    const expert = await Expert.findOne({ email: email.toLowerCase() }).select('+password');

    if (!expert) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Check if expert is active and verified
    if (!expert.active) {
      return res.status(403).json({
        success: false,
        error: 'Account is not active. Please contact administrator.',
      });
    }

    if (!expert.verified) {
      return res.status(403).json({
        success: false,
        error: 'Email not verified. Please wait for admin verification.',
      });
    }

    // Check password
    const isPasswordValid = await expert.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Update last login
    expert.lastLogin = new Date();
    expert.availability = 'available'; // Set to available on login
    await expert.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        expertId: expert._id,
        email: expert.email,
        name: expert.name,
        role: expert.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    logger.info(`✅ Expert logged in: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      expert: {
        id: expert._id,
        email: expert.email,
        name: expert.name,
        role: expert.role,
        specialty: expert.specialty,
        availability: expert.availability,
        interventionStats: expert.interventionStats,
      },
    });
  } catch (error) {
    logger.error('Error logging in expert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login',
    });
  }
});

// =============================================================================
// POST /api/v2/expert/logout
// Expert logout (update availability)
// =============================================================================

router.post('/logout', authenticateExpert, async (req: Request, res: Response) => {
  try {
    const expertId = (req as any).expert.expertId;

    // Update availability to offline
    await Expert.findByIdAndUpdate(expertId, {
      availability: 'offline',
    });

    logger.info(`✅ Expert logged out: ${expertId}`);

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    logger.error('Error logging out expert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to logout',
    });
  }
});

// =============================================================================
// GET /api/v2/expert/profile
// Get expert profile
// =============================================================================

router.get('/profile', authenticateExpert, async (req: Request, res: Response) => {
  try {
    const expertId = (req as any).expert.expertId;

    const expert = await Expert.findById(expertId);
    if (!expert) {
      return res.status(404).json({
        success: false,
        error: 'Expert not found',
      });
    }

    res.status(200).json({
      success: true,
      expert: {
        id: expert._id,
        email: expert.email,
        name: expert.name,
        role: expert.role,
        phone: expert.phone,
        specialty: expert.specialty,
        availability: expert.availability,
        verified: expert.verified,
        active: expert.active,
        lastLogin: expert.lastLogin,
        interventionStats: expert.interventionStats,
        createdAt: expert.createdAt,
      },
    });
  } catch (error) {
    logger.error('Error fetching expert profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
    });
  }
});

// =============================================================================
// PATCH /api/v2/expert/availability
// Update expert availability status
// =============================================================================

router.patch('/availability', authenticateExpert, async (req: Request, res: Response) => {
  try {
    const expertId = (req as any).expert.expertId;
    const { availability } = req.body;

    if (!['available', 'busy', 'offline'].includes(availability)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid availability status',
      });
    }

    const expert = await Expert.findByIdAndUpdate(
      expertId,
      { availability },
      { new: true }
    );

    logger.info(`✅ Expert availability updated: ${expertId} -> ${availability}`);

    res.status(200).json({
      success: true,
      message: 'Availability updated',
      availability: expert?.availability,
    });
  } catch (error) {
    logger.error('Error updating expert availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update availability',
    });
  }
});

// =============================================================================
// MIDDLEWARE: Authenticate Expert via JWT
// =============================================================================

export function authenticateExpert(req: Request, res: Response, next: any) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Attach expert info to request
    (req as any).expert = {
      expertId: decoded.expertId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };

    next();
  } catch (error) {
    logger.error('JWT verification failed:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
}

export default router;

