// 2025-11-30T11:15:00Z Created by Assistant: 位置追踪组件
import { useEffect, useState } from 'react';
import { useLocation } from '../../hooks/useLocation';
import { Toast, Dialog } from 'antd-mobile';
import { LocationFill } from 'antd-mobile-icons';

interface LocationTrackerProps {
  autoStart?: boolean; // 是否自动开始追踪
  showIndicator?: boolean; // 是否显示追踪状态指示器
  interval?: number; // 上报间隔（毫秒）
  distanceThreshold?: number; // 距离阈值（米）
}

export default function LocationTracker({
  autoStart = false,
  showIndicator = true,
  interval = 30000,
  distanceThreshold = 50,
}: LocationTrackerProps) {
  const {
    isTracking,
    isSupported,
    hasPermission,
    error,
    startTracking,
    stopTracking,
    requestPermission,
  } = useLocation();

  const [requestingPermission, setRequestingPermission] = useState(false);

  // 自动开始追踪
  useEffect(() => {
    if (autoStart && isSupported && hasPermission && !isTracking) {
      handleStartTracking();
    }
  }, [autoStart, isSupported, hasPermission, isTracking]);

  // 处理错误
  useEffect(() => {
    if (error) {
      let errorMessage = '位置获取失败';
      
      switch (error.code) {
        case GeolocationPositionError.PERMISSION_DENIED:
          errorMessage = '位置权限被拒绝，请在设置中允许位置访问';
          break;
        case GeolocationPositionError.POSITION_UNAVAILABLE:
          errorMessage = '无法获取位置信息';
          break;
        case GeolocationPositionError.TIMEOUT:
          errorMessage = '获取位置超时';
          break;
      }

      Toast.show({
        icon: 'fail',
        content: errorMessage,
        duration: 3000,
      });
    }
  }, [error]);

  // 请求权限
  const handleRequestPermission = async () => {
    setRequestingPermission(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        Toast.show({
          icon: 'success',
          content: '位置权限已授予',
          duration: 2000,
        });
        if (autoStart) {
          await handleStartTracking();
        }
      } else {
        Dialog.alert({
          content: '需要位置权限才能使用位置上报功能，请在浏览器设置中允许位置访问',
          confirmText: '我知道了',
        });
      }
    } catch (err) {
      console.error('Failed to request permission:', err);
    } finally {
      setRequestingPermission(false);
    }
  };

  // 开始追踪
  const handleStartTracking = async () => {
    if (!isSupported) {
      Toast.show({
        icon: 'fail',
        content: '您的浏览器不支持位置服务',
      });
      return;
    }

    if (hasPermission === false) {
      await handleRequestPermission();
      return;
    }

    if (hasPermission === null) {
      // 权限状态未知，先请求权限
      const granted = await requestPermission();
      if (!granted) {
        return;
      }
    }

    try {
      await startTracking({
        interval,
        distanceThreshold,
        enableHighAccuracy: false, // 默认不使用高精度，节省电量
      });
      Toast.show({
        icon: 'success',
        content: '位置上报已开启',
        duration: 2000,
      });
    } catch (err: any) {
      console.error('Failed to start tracking:', err);
      
      if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
        await handleRequestPermission();
      } else {
        Toast.show({
          icon: 'fail',
          content: '启动位置上报失败',
          duration: 3000,
        });
      }
    }
  };

  // 停止追踪
  const handleStopTracking = () => {
    stopTracking();
    Toast.show({
      icon: 'success',
      content: '位置上报已关闭',
      duration: 2000,
    });
  };

  // 切换追踪状态
  const toggleTracking = () => {
    if (isTracking) {
      handleStopTracking();
    } else {
      handleStartTracking();
    }
  };

  // 如果不需要显示指示器，只执行追踪逻辑
  if (!showIndicator) {
    return null;
  }

  return (
    <div
      onClick={toggleTracking}
      style={{
        position: 'fixed',
        bottom: 80,
        right: 16,
        width: 48,
        height: 48,
        borderRadius: 24,
        background: isTracking ? '#52c41a' : '#999',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 999,
        cursor: 'pointer',
      }}
      title={isTracking ? '位置上报中，点击关闭' : '点击开启位置上报'}
    >
      <LocationFill
        style={{
          fontSize: 24,
          color: '#fff',
          animation: isTracking ? 'pulse 2s infinite' : 'none',
        }}
      />
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

