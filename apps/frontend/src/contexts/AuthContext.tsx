import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
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
  const isLoggingInRef = useRef<boolean>(false); // 2025-11-29T19:30:00 防止登录过程中触发验证
  const isValidatingRef = useRef<boolean>(false); // 2025-11-29T19:30:00 防止重复验证

  useEffect(() => {
    // 验证现有 token - 2025-10-10 18:10:00
    // 2025-11-29T19:30:00 延迟验证，避免在组件初始化时立即失败
    const timer = setTimeout(() => {
      if (!isLoggingInRef.current) {
        validateToken();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const validateToken = async () => {
    // 2025-11-29T19:30:00 防止重复验证
    if (isValidatingRef.current) {
      return;
    }

    try {
      isValidatingRef.current = true;
      const storedToken = localStorage.getItem('jwt_token');

      if (!storedToken) {
        setToken(null);
        setUser(null);
        setLoading(false);
        return;
      }

      // 2025-11-29T19:30:00 如果已经有 user 和 token，且 token 匹配，跳过验证（登录时已设置）
      if (user && token === storedToken) {
        setLoading(false);
        return;
      }

      // 2025-11-29T19:30:00 验证 token
      try {
        const response = await authApi.getProfile();
        // 2025-11-29T19:30:00 后端返回格式为 { success: true, data: { user: {...} } }
        const userData = response.data?.data?.user || response.data?.user || response.data;
        setUser(userData);
        setToken(storedToken);
      } catch (error: unknown) {
        // 2025-11-29T19:30:00 验证失败时的处理
        const axiosError = error as { response?: { status?: number } };
        
        // 如果是 401，说明 token 无效
        if (axiosError.response?.status === 401) {
          console.warn('Token validation failed: 401 Unauthorized');
          // 2025-11-29T19:30:00 在开发环境下，如果只有 token 没有 user，暂时保留 token（可能是登录成功但验证失败）
          if (import.meta.env.DEV && storedToken && !user) {
            console.warn('[DEV MODE] Keeping token despite validation failure, will retry later');
            setToken(storedToken);
          } else {
            localStorage.removeItem('jwt_token');
            setToken(null);
            setUser(null);
          }
        } else {
          // 其他错误（网络错误等），在开发环境下暂时保留 token
          console.error('Failed to validate token:', error);
          if (import.meta.env.DEV && storedToken) {
            console.warn('[DEV MODE] Network error during validation, keeping token');
            setToken(storedToken);
          } else {
            localStorage.removeItem('jwt_token');
            setToken(null);
            setUser(null);
          }
        }
      }
    } finally {
      setLoading(false);
      isValidatingRef.current = false;
    }
  }

  const login = async (credentials: UserLoginPayload) => {
    isLoggingInRef.current = true;
    setLoading(true);
    try {
      const response = await authApi.login(credentials);
      // 修复：后端返回格式为 { success: true, data: { token, user } }
      const { token: newToken, user: userData } = response.data.data;
      localStorage.setItem('jwt_token', newToken);
      setToken(newToken);
      setUser(userData);
      // 2025-11-29T19:30:00 登录成功后，不需要再次验证（已经有 user 数据）
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
      // 2025-11-29T19:30:00 延迟重置登录标志，避免立即触发验证
      setTimeout(() => {
        isLoggingInRef.current = false;
      }, 500);
    }
  }

  const logout = () => {
    localStorage.removeItem('jwt_token');
    setToken(null);
    setUser(null);
    isLoggingInRef.current = false;
  }

  // 2025-11-29T19:30:00 改进 isAuthenticated 计算：在开发环境下更宽松
  const isAuthenticated = import.meta.env.DEV
    ? !!token // 开发环境：有 token 就认为已认证（直到验证失败）
    : !!token && !!user; // 生产环境：需要 token 和 user 都存在

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