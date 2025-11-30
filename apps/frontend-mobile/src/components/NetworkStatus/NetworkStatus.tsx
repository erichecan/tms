// 2025-11-30T12:20:00Z Created by Assistant: 网络状态提示组件
import { useEffect } from 'react';
import { Toast } from 'antd-mobile';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

interface NetworkStatusProps {
  showToast?: boolean; // 是否显示 Toast 提示
}

export default function NetworkStatus({ showToast = true }: NetworkStatusProps) {
  const { isOnline, isSlowConnection } = useNetworkStatus();

  useEffect(() => {
    if (!isOnline && showToast) {
      Toast.show({
        icon: 'fail',
        content: '网络连接已断开',
        duration: 3000,
      });
    }
  }, [isOnline, showToast]);

  useEffect(() => {
    if (isOnline && isSlowConnection && showToast) {
      Toast.show({
        icon: 'loading',
        content: '网络连接较慢',
        duration: 2000,
      });
    }
  }, [isOnline, isSlowConnection, showToast]);

  // 显示网络状态指示器
  if (!isOnline) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: '#ff4d4f',
          color: '#fff',
          padding: '8px 16px',
          textAlign: 'center',
          fontSize: 14,
          zIndex: 9999,
        }}
      >
        网络连接已断开，请检查网络设置
      </div>
    );
  }

  if (isSlowConnection) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: '#faad14',
          color: '#fff',
          padding: '8px 16px',
          textAlign: 'center',
          fontSize: 14,
          zIndex: 9999,
        }}
      >
        网络连接较慢，请稍候...
      </div>
    );
  }

  return null;
}

