/**
 * AuthContext - User Authentication State Management
 * 
 * Manages login/register/logout for regular users.
 * Stores JWT token in localStorage for persistence.
 * Privacy-first: minimal data stored.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

const API_URL = (process.env.REACT_APP_API_URL || 'https://soulfriend-api.onrender.com').replace(/\/$/, '');

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
      const response = await fetch(`${API_URL}/api/v2/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        return { success: true };
      } else {
        return { success: false, error: data.message || data.errors?.[0] || 'Đăng nhập thất bại' };
      }
    } catch {
      return { success: false, error: 'Không thể kết nối máy chủ' };
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/v2/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        return { success: true };
      } else {
        return { success: false, error: data.message || data.errors?.[0] || 'Đăng ký thất bại' };
      }
    } catch {
      return { success: false, error: 'Không thể kết nối máy chủ' };
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
