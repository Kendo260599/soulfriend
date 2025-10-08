/**
 * Tests for admin routes
 */

// Set test environment before any imports
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_2024_learning_system_secure_32_chars';
process.env.ENCRYPTION_KEY = 'test_encryption_key_2024_learning_system_secure_32_chars_hex_64';
process.env.MONGODB_URI = 'mongodb://localhost:27017/soulfriend_test';
process.env.DEFAULT_ADMIN_USERNAME = 'test_admin';
process.env.DEFAULT_ADMIN_EMAIL = 'test@soulfriend.vn';
process.env.DEFAULT_ADMIN_PASSWORD = 'TestPassword123!@#XYZ';

import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Admin from '../../src/models/Admin';
import jwt from 'jsonwebtoken';

// Create a simple Express app for testing without database connection
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import { errorHandler } from '../../src/middleware/errorHandler';
import adminRoutes from '../../src/routes/admin';

const app = express();

// Basic middleware setup
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());

// Routes
app.use('/api/admin', adminRoutes);

// Error handling
app.use(errorHandler);

describe('Admin Routes', () => {
  let adminToken: string;
  let adminId: string;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    // Check if already connected
    if (mongoose.connection.readyState === 0) {
      // Start in-memory MongoDB instance
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      
      // Connect to the in-memory database
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    // Only close if we created the connection
    if (mongoServer) {
      await mongoose.connection.close();
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    // Clear database between tests
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  beforeEach(async () => {
    // Create test admin
    const admin = new Admin({
      username: 'testadmin',
      email: 'test@soulfriend.com',
      password: 'TestPassword123!',
      fullName: 'Test Administrator',
      role: 'super_admin'
    });
    const savedAdmin = await admin.save();
    adminId = (savedAdmin._id as any).toString();

    // Generate JWT token
    adminToken = jwt.sign(
      { adminId: savedAdmin._id, username: savedAdmin.username },
      process.env.JWT_SECRET || 'test_jwt_secret_key_for_testing_only',
      { expiresIn: '24h' }
    );
  });

  describe('POST /api/admin/login', () => {
    it('should login with valid credentials', async () => {
      const loginData = {
        username: 'testadmin',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/admin/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Đăng nhập thành công');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.admin.username).toBe('testadmin');
      expect(response.body.data.admin.email).toBe('test@soulfriend.com');
    });

    it('should reject invalid username', async () => {
      const loginData = {
        username: 'wronguser',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/admin/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('không chính xác');
    });

    it('should reject invalid password', async () => {
      const loginData = {
        username: 'testadmin',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/admin/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('không chính xác');
    });

    it('should validate required fields', async () => {
      const loginData = {
        username: '',
        password: 'short'
      };

      const response = await request(app)
        .post('/api/admin/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Dữ liệu không hợp lệ');
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/admin/dashboard', () => {
    it('should get dashboard data with valid token', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overview).toBeDefined();
      expect(response.body.data.overview.totalConsents).toBeDefined();
      expect(response.body.data.overview.totalTests).toBeDefined();
      expect(response.body.data.testStats).toBeDefined();
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token xác thực');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('không hợp lệ');
    });

    it('should reject request with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token xác thực');
    });
  });

  describe('GET /api/admin/test-results', () => {
    it('should get test results with pagination', async () => {
      const response = await request(app)
        .get('/api/admin/test-results?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.testResults).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });

    it('should filter test results by type', async () => {
      const response = await request(app)
        .get('/api/admin/test-results?testType=GAD-7')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.testResults).toBeDefined();
    });

    it('should use default pagination values', async () => {
      const response = await request(app)
        .get('/api/admin/test-results')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });
  });

  describe('GET /api/admin/export', () => {
    it('should export data as CSV', async () => {
      const response = await request(app)
        .get('/api/admin/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('soulfriend_data.csv');
    });

    it('should export filtered data', async () => {
      const startDate = '2023-01-01';
      const endDate = '2023-12-31';
      
      const response = await request(app)
        .get(`/api/admin/export?testType=GAD-7&startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
    });
  });

  describe('Authentication Middleware', () => {
    it('should reject expired token', async () => {
      // Create expired token
      const expiredToken = jwt.sign(
        { adminId: adminId, username: 'testadmin' },
        process.env.JWT_SECRET || 'test_jwt_secret_key_for_testing_only',
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('hết hạn');
    });

    it('should reject token for non-existent admin', async () => {
      // Create token with non-existent admin ID
      const fakeToken = jwt.sign(
        { adminId: '507f1f77bcf86cd799439011', username: 'fakeadmin' },
        process.env.JWT_SECRET || 'test_jwt_secret_key_for_testing_only',
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${fakeToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('không tồn tại');
    });

    it('should reject token for inactive admin', async () => {
      // Deactivate admin
      await Admin.findByIdAndUpdate(adminId, { isActive: false });

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('vô hiệu hóa');
    });
  });

  describe('Admin Role Authorization', () => {
    let regularAdminToken: string;

    beforeEach(async () => {
      // Create regular admin (not super_admin)
      const regularAdmin = new Admin({
        username: 'regularadmin',
        email: 'regular@soulfriend.com',
        password: 'TestPassword123!',
        fullName: 'Regular Administrator',
        role: 'admin'
      });
      const savedRegularAdmin = await regularAdmin.save();

      regularAdminToken = jwt.sign(
        { adminId: savedRegularAdmin._id, username: savedRegularAdmin.username },
        process.env.JWT_SECRET || 'test_jwt_secret_key_for_testing_only',
        { expiresIn: '24h' }
      );
    });

    it('should allow regular admin to access dashboard', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${regularAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should allow regular admin to view test results', async () => {
      const response = await request(app)
        .get('/api/admin/test-results')
        .set('Authorization', `Bearer ${regularAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
