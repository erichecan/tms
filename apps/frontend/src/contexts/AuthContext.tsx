import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/index';
import { authApi } from '../services/api';
import { UserLoginPayload } from '../types/index';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: UserLoginPayload) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('jwt_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 验证现有 token - 2025-10-10 18:10:00
    validateToken();
  }, []);

  const validateToken = async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        // 开发环境下，由于后端跳过认证，直接设置用户信息 - 2025-10-10 18:10:00
        if (import.meta.env.DEV) {
          const mockUser = {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'dev@tms-platform.com',
            name: 'Dev User',
            role: 'admin',
            tenantId: '00000000-0000-0000-0000-000000000001',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as User;
          setUser(mockUser);
          setToken(token);
          console.log('[DEV MODE] Using mock user:', mockUser);
        } else {
          // 生产环境：调用后端验证 token - 2025-10-10 18:10:00
          try {
            const response = await authApi.getProfile();
            setUser(response.data);
            setToken(token);
          } catch (error) {
            console.error('Token validation failed:', error);
            localStorage.removeItem('jwt_token');
            setToken(null);
            setUser(null);
          }
        }
      }
    } catch (error) {
      console.error('Failed to validate token:', error);
    } finally {
      setLoading(false);
    }
  }

  const login = async (credentials: UserLoginPayload) => {
    setLoading(true);
    try {
      const response = await authApi.login(credentials);
      // 修复：后端返回格式为 { success: true, data: { token, user } }
      const { token: newToken, user: userData } = response.data.data;
      localStorage.setItem('jwt_token', newToken);
      setToken(newToken);
      setUser(userData);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  const logout = () => {
    localStorage.removeItem('jwt_token');
    setToken(null);
    setUser(null);
  }

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};