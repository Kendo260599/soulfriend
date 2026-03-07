/**
 * AuthContext - User Authentication State Management
 * 
 * Manages login/register/logout for regular users.
 * Stores JWT token in localStorage for persistence.
 * Privacy-first: minimal data stored.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

const API_URL = (process.env.REACT_APP_API_URL || 'https://soulfriend-api.onrender.com').replace(/\/$/, '');

/**
 * Fetch with retry logic for Render cold start (free tier sleeps after inactivity)
 * Retries up to 2 times with increasing delay
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), attempt === 0 ? 15000 : 30000);
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (err: any) {
      if (attempt === retries) throw err;
      // Wait before retry (2s, 5s)
      await new Promise(r => setTimeout(r, attempt === 0 ? 2000 : 5000));
    }
  }
  throw new Error('Network request failed');
}

interface UserData {
  id: string;
  email: string;
  displayName: string;
}

interface AuthContextType {
  user: UserData | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('userToken');
    const savedUser = localStorage.getItem('userData');

    if (savedToken && savedUser) {
      try {
        // Check token expiration
        const payload = JSON.parse(atob(savedToken.split('.')[1]));
        if (payload.exp && payload.exp > Date.now() / 1000) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        } else {
          // Token expired
          localStorage.removeItem('userToken');
          localStorage.removeItem('userData');
        }
      } catch {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetchWithRetry(`${API_URL}/api/v2/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok && response.status >= 500) {
        return { success: false, error: 'Máy chủ đang khởi động lại, vui lòng thử lại sau 30 giây' };
      }

      let data;
      try {
        data = await response.json();
      } catch {
        return { success: false, error: 'Máy chủ trả về phản hồi không hợp lệ. Thử lại sau.' };
      }

      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        return { success: true };
      } else {
        return { success: false, error: data.message || data.errors?.[0] || 'Đăng nhập thất bại' };
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return { success: false, error: 'Máy chủ phản hồi quá chậm (đang khởi động). Vui lòng thử lại.' };
      }
      return { success: false, error: 'Không thể kết nối máy chủ. Kiểm tra kết nối mạng và thử lại.' };
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    // Frontend validation
    if (password.length < 8) {
      return { success: false, error: 'Mật khẩu tối thiểu 8 ký tự' };
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { success: false, error: 'Mật khẩu phải có chữ hoa, chữ thường và số' };
    }

    try {
      const response = await fetchWithRetry(`${API_URL}/api/v2/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok && response.status >= 500) {
        return { success: false, error: 'Máy chủ đang khởi động lại, vui lòng thử lại sau 30 giây' };
      }

      let data;
      try {
        data = await response.json();
      } catch {
        return { success: false, error: 'Máy chủ trả về phản hồi không hợp lệ. Thử lại sau.' };
      }

      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        return { success: true };
      } else {
        return { success: false, error: data.message || data.errors?.[0] || 'Đăng ký thất bại' };
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return { success: false, error: 'Máy chủ phản hồi quá chậm (đang khởi động). Vui lòng thử lại.' };
      }
      return { success: false, error: 'Không thể kết nối máy chủ. Kiểm tra kết nối mạng và thử lại.' };
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
