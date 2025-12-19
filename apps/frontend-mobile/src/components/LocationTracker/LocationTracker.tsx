// 2025-11-30T11:15:00Z Created by Assistant: 位置追踪组件
// 2025-12-19 11:40:00 需求：默认开启但可记忆关闭；仅在存在进行中运单时才上报
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from '../../hooks/useLocation';
import { Toast, Dialog } from 'antd-mobile';
import { LocationFill } from 'antd-mobile-icons';

interface LocationTrackerProps {
  autoStart?: boolean; // 是否自动开始追踪
  showIndicator?: boolean; // 是否显示追踪状态指示器
  interval?: number; // 上报间隔（毫秒）
  distanceThreshold?: number; // 距离阈值（米）
  hasOngoingShipment?: boolean; // 是否存在进行中运单（决定是否允许上报） // 2025-12-19 11:40:00
}

const LOCATION_TRACKING_ENABLED_KEY = 'mobile_location_tracking_enabled'; // 2025-12-19 11:40:00 记忆司机手动开关

export default function LocationTracker({
  autoStart = false,
  showIndicator = true,
  interval = 30000,
  distanceThreshold = 50,
  hasOngoingShipment = false,
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
  const [userEnabled, setUserEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem(LOCATION_TRACKING_ENABLED_KEY);
    if (stored === null) return true; // 默认开启 // 2025-12-19 11:40:00
    return stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem(LOCATION_TRACKING_ENABLED_KEY, String(userEnabled)); // 2025-12-19 11:40:00
  }, [userEnabled]);

  const effectiveEnabled = useMemo(() => {
    // 仅进行中运单时允许上报 // 2025-12-19 11:40:00
    return userEnabled && hasOngoingShipment;
  }, [userEnabled, hasOngoingShipment]);

  // 自动开始追踪
  useEffect(() => {
    if (!autoStart) return;

    // 无进行中运单或用户关闭时，确保停止 // 2025-12-19 11:40:00
    if (!effectiveEnabled) {
      if (isTracking) stopTracking();
      return;
    }

    if (isSupported && !isTracking) {
      handleStartTracking();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, isSupported, effectiveEnabled, isTracking]);

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
    // 2025-12-19 11:40:00：切换“用户开关”，并记忆；实际追踪由 effectiveEnabled 决定
    if (userEnabled) {
      setUserEnabled(false);
      if (isTracking) handleStopTracking();
      return;
    }

    setUserEnabled(true);
    if (!hasOngoingShipment) {
      Toast.show({
        icon: 'success',
        content: '已开启位置上报，将在有进行中运单时自动上报',
        duration: 2500,
      });
      return;
    }
    handleStartTracking();
  };

  // 如果不需要显示指示器，只执行追踪逻辑
  if (!showIndicator) {
    return null;
  }

  const indicatorColor = effectiveEnabled ? (isTracking ? '#52c41a' : '#1677ff') : '#999'; // 2025-12-19 11:40:00

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
        background: indicatorColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 999,
        cursor: 'pointer',
      }}
      title={
        !userEnabled
          ? '位置上报已关闭（点击开启）'
          : !hasOngoingShipment
            ? '等待进行中运单（点击可关闭开关）'
            : isTracking
              ? '位置上报中，点击关闭'
              : '点击开启位置上报'
      }
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

