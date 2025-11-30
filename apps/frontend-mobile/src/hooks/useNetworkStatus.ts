// 2025-11-30T12:15:00Z Created by Assistant: 网络状态检测 Hook
import { useState, useEffect } from 'react';

export interface UseNetworkStatusResult {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType?: string;
}

export function useNetworkStatus(): UseNetworkStatusResult {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [connectionType, setConnectionType] = useState<string | undefined>();

  useEffect(() => {
    // 更新在线状态
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // 检测连接类型（如果支持）
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      setConnectionType(connection.effectiveType);
      
      // 判断是否为慢速连接
      const slowTypes = ['slow-2g', '2g'];
      setIsSlowConnection(slowTypes.includes(connection.effectiveType));

      // 监听连接变化
      const updateConnection = () => {
        setConnectionType(connection.effectiveType);
        setIsSlowConnection(slowTypes.includes(connection.effectiveType));
      };

      connection.addEventListener('change', updateConnection);

      return () => {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
        connection.removeEventListener('change', updateConnection);
      };
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  return {
    isOnline,
    isSlowConnection,
    connectionType,
  };
}

