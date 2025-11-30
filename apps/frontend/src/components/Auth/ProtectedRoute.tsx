import React, { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Spin } from 'antd';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, token } = useAuth();
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // 2025-11-29T19:30:00 延迟重定向，避免在验证过程中立即重定向
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // 在开发环境下，给一点时间让认证状态更新
      const timer = setTimeout(() => {
        // 如果还是没有认证，且确实没有 token，才重定向
        const storedToken = localStorage.getItem('jwt_token');
        if (!storedToken && !token) {
          setShouldRedirect(true);
        } else if (import.meta.env.DEV) {
          // 开发环境下，如果有 token，即使 user 为 null，也暂时允许访问
          // 这样可以避免登录循环
          setShouldRedirect(false);
        } else {
          setShouldRedirect(true);
        }
      }, import.meta.env.DEV ? 500 : 100);
      
      return () => clearTimeout(timer);
    } else {
      setShouldRedirect(false);
    }
  }, [loading, isAuthenticated, token]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large">
          <div style={{ padding: '50px' }}>
            <div>Loading...</div>
          </div>
        </Spin>
      </div>
    );
  }

  // 2025-11-29T19:30:00 改进认证检查逻辑
  if (shouldRedirect || (!isAuthenticated && !token && !loading)) {
    // 保存当前路径，以便登录后重定向回来
    const currentPath = location.pathname + location.search;
    if (currentPath !== '/login') {
      sessionStorage.setItem('redirectAfterLogin', currentPath);
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;