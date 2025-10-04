/**
 * Tests for Admin model
 */

import Admin from '../../src/models/Admin';

describe('Admin Model', () => {
  describe('Admin Creation', () => {
    it('should create a valid admin', async () => {
      const adminData = {
        username: 'testadmin',
        email: 'test@soulfriend.com',
        password: 'TestPassword123!',
        fullName: 'Test Administrator',
        role: 'admin' as const
      };

      const admin = new Admin(adminData);
      const savedAdmin = await admin.save();

      expect(savedAdmin._id).toBeDefined();
      expect(savedAdmin.username).toBe(adminData.username);
      expect(savedAdmin.email).toBe(adminData.email);
      expect(savedAdmin.fullName).toBe(adminData.fullName);
      expect(savedAdmin.role).toBe(adminData.role);
      expect(savedAdmin.isActive).toBe(true);
      expect(savedAdmin.loginAttempts).toBe(0);
    });

    it('should hash password before saving', async () => {
      const plainPassword = 'TestPassword123!';
      const admin = new Admin({
        username: 'testadmin2',
        email: 'test2@soulfriend.com',
        password: plainPassword,
        fullName: 'Test Administrator 2',
        role: 'admin'
      });

      const savedAdmin = await admin.save();
      
      expect(savedAdmin.password).not.toBe(plainPassword);
      expect(savedAdmin.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });

    it('should validate required fields', async () => {
      const admin = new Admin({});

    let error: any;
    try {
      await admin.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.username).toBeDefined();
    expect(error.errors.email).toBeDefined();
    expect(error.errors.password).toBeDefined();
    expect(error.errors.fullName).toBeDefined();
    });

    it('should enforce unique username', async () => {
      const adminData = {
        username: 'uniquetest',
        email: 'unique1@soulfriend.com',
        password: 'TestPassword123!',
        fullName: 'Unique Test 1',
        role: 'admin' as const
      };

      // Create first admin
      const admin1 = new Admin(adminData);
      await admin1.save();

      // Try to create second admin with same username
      const admin2 = new Admin({
        ...adminData,
        email: 'unique2@soulfriend.com',
        fullName: 'Unique Test 2'
      });

      let error: any;
      try {
        await admin2.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // MongoDB duplicate key error
    });

    it('should enforce unique email', async () => {
      const adminData = {
        username: 'uniquetest1',
        email: 'unique@soulfriend.com',
        password: 'TestPassword123!',
        fullName: 'Unique Test 1',
        role: 'admin' as const
      };

      // Create first admin
      const admin1 = new Admin(adminData);
      await admin1.save();

      // Try to create second admin with same email
      const admin2 = new Admin({
        ...adminData,
        username: 'uniquetest2',
        fullName: 'Unique Test 2'
      });

      let error: any;
      try {
        await admin2.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // MongoDB duplicate key error
    });
  });

  describe('Admin Methods', () => {
    let admin: any;

    beforeEach(async () => {
      admin = new Admin({
        username: 'methodtest',
        email: 'method@soulfriend.com',
        password: 'TestPassword123!',
        fullName: 'Method Test',
        role: 'admin'
      });
      await admin.save();
    });

    it('should compare password correctly', async () => {
      const correctPassword = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';

      const isCorrect = await admin.comparePassword(correctPassword);
      const isWrong = await admin.comparePassword(wrongPassword);

      expect(isCorrect).toBe(true);
      expect(isWrong).toBe(false);
    });

    it('should increment login attempts', async () => {
      expect(admin.loginAttempts).toBe(0);

      await admin.incrementLoginAttempts();
      await admin.reload();

      expect(admin.loginAttempts).toBe(1);
    });

    it('should lock account after 5 failed attempts', async () => {
      // Simulate 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await admin.incrementLoginAttempts();
        await admin.reload();
      }

      expect(admin.loginAttempts).toBe(5);
      expect(admin.lockUntil).toBeDefined();
      expect(admin.isLocked).toBe(true);
    });
  });

  describe('Admin Virtuals', () => {
    it('should calculate isLocked virtual correctly', async () => {
      const admin = new Admin({
        username: 'virtualtest',
        email: 'virtual@soulfriend.com',
        password: 'TestPassword123!',
        fullName: 'Virtual Test',
        role: 'admin'
      });

      // Not locked initially
      expect((admin as any).isLocked).toBe(false);

      // Set lock time in the future
      admin.lockUntil = new Date(Date.now() + 60000); // 1 minute from now
      expect((admin as any).isLocked).toBe(true);

      // Set lock time in the past
      admin.lockUntil = new Date(Date.now() - 60000); // 1 minute ago
      expect((admin as any).isLocked).toBe(false);
    });
  });

  describe('Admin JSON Serialization', () => {
    it('should not include password in JSON output', async () => {
      const admin = new Admin({
        username: 'jsontest',
        email: 'json@soulfriend.com',
        password: 'TestPassword123!',
        fullName: 'JSON Test',
        role: 'admin'
      });

      const savedAdmin = await admin.save();
      const adminJSON = savedAdmin.toJSON();

      expect(adminJSON.password).toBeUndefined();
      expect(adminJSON.username).toBe('jsontest');
      expect(adminJSON.email).toBe('json@soulfriend.com');
    });
  });
});
