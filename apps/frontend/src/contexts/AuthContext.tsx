import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { authApi } from '../services/api';
import { UserLoginPayload, User } from '../types/index';

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
    // On initial load, try to validate token or fetch user info if token exists
    if (token) {
      validateToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await authApi.getProfile();
      setUser(response.data.user);
    } catch (error) {
      console.error('Token validation failed:', error);
      localStorage.removeItem('jwt_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: UserLoginPayload) => {
    setLoading(true);
    try {
      // 临时自动登录 - 跳过API调用
      if (credentials.email === 'admin@demo.tms-platform.com' && credentials.password === 'password') {
        const mockUser = {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'admin@demo.tms-platform.com',
          name: 'Admin User',
          role: 'admin',
          tenantId: '00000000-0000-0000-0000-000000000001',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const mockToken = 'mock_jwt_token_' + Date.now();
        localStorage.setItem('jwt_token', mockToken);
        setToken(mockToken);
        setUser(mockUser);
        setLoading(false);
        return;
      }
      
      const response = await authApi.login(credentials);
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('jwt_token', newToken);
      setToken(newToken);
      setUser(userData);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    setToken(null);
    setUser(null);
  };

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