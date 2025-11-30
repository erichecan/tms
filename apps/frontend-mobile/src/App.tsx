import { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import ShipmentDetail from './pages/ShipmentDetail/ShipmentDetail';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import NetworkStatus from './components/NetworkStatus/NetworkStatus';
import { setupOfflineSync } from './services/offlineService'; // 2025-11-30T12:30:00Z Added by Assistant: 离线同步
import './App.css';

// Basic mobile routes. Timestamp: 2025-09-23T00:00:00Z
// 2025-11-30T11:00:00Z Added by Assistant: 添加运单详情页面路由
// 2025-11-30T12:25:00Z Added by Assistant: 添加错误边界和网络状态检测
export default function App() {
  useEffect(() => {
    // 初始化离线同步
    const cleanup = setupOfflineSync();
    return cleanup;
  }, []);

  return (
    <ErrorBoundary>
      <NetworkStatus showToast={true} />
      <Suspense fallback={<div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>加载中...</div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/shipment/:id" element={<ShipmentDetail />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}


