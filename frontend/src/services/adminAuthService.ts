/**
 * Admin Authentication Service
 * Hệ thống xác thực admin cho chức năng nghiên cứu
 */

export interface AdminUser {
  id: string;
  username: string;
  role: 'admin' | 'researcher' | 'superadmin';
  permissions: string[];
  lastLogin: Date;
  isActive: boolean;
}

export interface AdminSession {
  userId: string;
  token: string;
  expiresAt: Date;
  permissions: string[];
}

class AdminAuthService {
  private adminUsers: Map<string, AdminUser> = new Map();
  private activeSessions: Map<string, AdminSession> = new Map();
  private sessionTokens: Map<string, string> = new Map();

  constructor() {
    this.initializeAdminUsers();
  }

  /**
   * Khởi tạo admin users - CHỈ 1 TÀI KHOẢN DUY NHẤT
   */
  private initializeAdminUsers(): void {
    const adminUsers: AdminUser[] = [
      {
        id: 'admin',
        username: 'admin',
        role: 'superadmin',
        permissions: ['*'], // Tất cả quyền
        lastLogin: new Date(),
        isActive: true
      }
    ];

    adminUsers.forEach(user => {
      this.adminUsers.set(user.id, user);
    });
  }

  /**
   * Đăng nhập admin
   */
  login(username: string, password: string): { success: boolean; token?: string; user?: AdminUser; error?: string } {
    const user = Array.from(this.adminUsers.values()).find(u => u.username === username);
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (!user.isActive) {
      return { success: false, error: 'Account is disabled' };
    }

    // Verify password (simplified - in real app, use proper hashing)
    const validPasswords: { [key: string]: string } = {
      'admin': 'Kendo2605@'
    };

    if (validPasswords[user.id] !== password) {
      return { success: false, error: 'Invalid password' };
    }

    // Create session
    const token = this.generateToken();
    const session: AdminSession = {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      permissions: user.permissions
    };

    this.activeSessions.set(token, session);
    this.sessionTokens.set(user.id, token);

    // Update last login
    user.lastLogin = new Date();
    this.adminUsers.set(user.id, user);

    return { success: true, token, user };
  }

  /**
   * Đăng xuất
   */
  logout(token: string): boolean {
    const session = this.activeSessions.get(token);
    if (session) {
      this.activeSessions.delete(token);
      this.sessionTokens.delete(session.userId);
      return true;
    }
    return false;
  }

  /**
   * Xác thực token
   */
  authenticateToken(token: string): { valid: boolean; user?: AdminUser; session?: AdminSession } {
    const session = this.activeSessions.get(token);
    
    if (!session) {
      return { valid: false };
    }

    if (session.expiresAt < new Date()) {
      this.activeSessions.delete(token);
      this.sessionTokens.delete(session.userId);
      return { valid: false };
    }

    const user = this.adminUsers.get(session.userId);
    if (!user || !user.isActive) {
      this.activeSessions.delete(token);
      this.sessionTokens.delete(session.userId);
      return { valid: false };
    }

    return { valid: true, user, session };
  }

  /**
   * Kiểm tra quyền
   */
  hasPermission(token: string, permission: string): boolean {
    const auth = this.authenticateToken(token);
    
    if (!auth.valid || !auth.session) {
      return false;
    }

    // Superadmin has all permissions
    if (auth.session.permissions.includes('*')) {
      return true;
    }

    return auth.session.permissions.includes(permission);
  }

  /**
   * Lấy thông tin user từ token
   */
  getUserFromToken(token: string): AdminUser | null {
    const auth = this.authenticateToken(token);
    return auth.valid ? auth.user || null : null;
  }

  /**
   * Lấy danh sách admin users (chỉ superadmin)
   */
  getAdminUsers(token: string): AdminUser[] | null {
    if (!this.hasPermission(token, '*')) {
      return null;
    }

    // Chỉ trả về admin duy nhất
    return Array.from(this.adminUsers.values()).filter(user => user.id === 'admin');
  }

  /**
   * Tạo admin user mới - BỊ VÔ HIỆU HÓA (chỉ 1 admin duy nhất)
   */
  createAdminUser(token: string, userData: Omit<AdminUser, 'id' | 'lastLogin'>): { success: boolean; userId?: string; error?: string } {
    return { success: false, error: 'Chỉ được phép có 1 tài khoản admin duy nhất' };
  }

  /**
   * Cập nhật admin user - CHỈ CHO PHÉP CẬP NHẬT THÔNG TIN CÁ NHÂN
   */
  updateAdminUser(token: string, userId: string, updates: Partial<AdminUser>): { success: boolean; error?: string } {
    if (!this.hasPermission(token, '*')) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Chỉ cho phép cập nhật admin duy nhất
    if (userId !== 'admin') {
      return { success: false, error: 'Chỉ được phép cập nhật tài khoản admin duy nhất' };
    }

    const user = this.adminUsers.get(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Chỉ cho phép cập nhật một số thông tin nhất định
    const allowedUpdates = ['lastLogin', 'isActive'];
    const filteredUpdates: Partial<AdminUser> = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        const value = updates[key as keyof AdminUser];
        if (value !== undefined) {
          (filteredUpdates as any)[key] = value;
        }
      }
    });

    const updatedUser = { ...user, ...filteredUpdates };
    this.adminUsers.set(userId, updatedUser);
    return { success: true };
  }

  /**
   * Xóa admin user - BỊ VÔ HIỆU HÓA (chỉ 1 admin duy nhất)
   */
  deleteAdminUser(token: string, userId: string): { success: boolean; error?: string } {
    return { success: false, error: 'Không được phép xóa tài khoản admin duy nhất' };
  }

  /**
   * Lấy thống kê sessions
   */
  getSessionStats(token: string): any | null {
    if (!this.hasPermission(token, '*')) {
      return null;
    }

    const now = new Date();
    const activeSessions = Array.from(this.activeSessions.values()).filter(s => s.expiresAt > now);
    
    return {
      totalSessions: this.activeSessions.size,
      activeSessions: activeSessions.length,
      expiredSessions: this.activeSessions.size - activeSessions.length,
      totalUsers: this.adminUsers.size,
      activeUsers: Array.from(this.adminUsers.values()).filter(u => u.isActive).length
    };
  }

  /**
   * Làm mới token
   */
  refreshToken(token: string): { success: boolean; newToken?: string; error?: string } {
    const auth = this.authenticateToken(token);
    
    if (!auth.valid || !auth.session) {
      return { success: false, error: 'Invalid token' };
    }

    // Generate new token
    const newToken = this.generateToken();
    const newSession: AdminSession = {
      ...auth.session,
      token: newToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    // Remove old session and add new one
    this.activeSessions.delete(token);
    this.activeSessions.set(newToken, newSession);
    this.sessionTokens.set(auth.session.userId, newToken);

    return { success: true, newToken };
  }

  /**
   * Tạo token ngẫu nhiên
   */
  private generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Làm sạch sessions hết hạn
   */
  cleanupExpiredSessions(): number {
    const now = new Date();
    let cleaned = 0;

    const entries = Array.from(this.activeSessions.entries());
    for (const [token, session] of entries) {
      if (session.expiresAt < now) {
        this.activeSessions.delete(token);
        this.sessionTokens.delete(session.userId);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Lấy audit log (chỉ superadmin)
   */
  getAuditLog(token: string, limit: number = 100): any[] | null {
    if (!this.hasPermission(token, '*')) {
      return null;
    }

    // Simplified audit log - in real app, store in database
    const auditLog = [
      {
        timestamp: new Date(),
        action: 'system_startup',
        userId: 'system',
        details: 'Admin authentication service initialized'
      },
      {
        timestamp: new Date(Date.now() - 3600000),
        action: 'user_login',
        userId: 'admin',
        details: 'Admin user logged in'
      }
    ];

    return auditLog.slice(0, limit);
  }
}

export const adminAuthService = new AdminAuthService();
export default adminAuthService;
