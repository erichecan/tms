// 2025-11-11 10:15:05 重构：司机移动端任务面板
// 2025-11-30T10:45:00Z Refactored by Assistant: 使用 Ant Design Mobile 组件重构任务列表页面
// 2025-12-19 11:41:00 需求：位置上报默认开启且记忆开关；仅在进行中运单存在时才上报
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, PullToRefresh, List, Skeleton, Empty, Toast, Dialog } from 'antd-mobile';
import { CloseOutline } from 'antd-mobile-icons';
import { authApi, driverShipmentsApi, DRIVER_STORAGE_KEY, TOKEN_STORAGE_KEY, clearSession } from '../../services/api';
import { Shipment, ShipmentStatus } from '../../types';
import ShipmentCard from '../../components/ShipmentCard/ShipmentCard';
import LocationTracker from '../../components/LocationTracker/LocationTracker'; // 2025-11-30T11:20:00Z Added by Assistant: 位置追踪组件
import { OfflineService, setupOfflineSync } from '../../services/offlineService'; // 2025-11-30T12:30:00Z Added by Assistant: 离线存储服务

const actionLabelMap: Record<string, string> = {
  pending: '确认接单',
  [ShipmentStatus.ASSIGNED]: '开始取货',
  confirmed: '开始取货',
  [ShipmentStatus.PICKED_UP]: '开始运输',
  [ShipmentStatus.IN_TRANSIT]: '确认送达',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const driverId = localStorage.getItem(DRIVER_STORAGE_KEY);
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [hasOngoingShipment, setHasOngoingShipment] = useState(false); // 2025-12-19 11:41:00

  const computeHasOngoingShipment = (list: Shipment[]): boolean => {
    // 2025-12-19 11:41:00：进行中运单集合（用于位置上报开关）
    const ongoingStatuses = new Set([
      'assigned',
      'confirmed',
      'scheduled',
      'pickup_in_progress',
      'picked_up',
      'in_transit',
    ]);
    return list.some((s: Shipment) => ongoingStatuses.has(String(s.status)));
  };

  useEffect(() => {
    if (!driverId || !token) {
      clearSession();
      navigate('/login');
      return;
    }
    
    // 设置离线同步
    const cleanup = setupOfflineSync();
    
    // 尝试从缓存加载运单
    const cachedShipments = OfflineService.getCachedShipments();
    if (cachedShipments && cachedShipments.length > 0) {
      setShipments(cachedShipments);
      setHasOngoingShipment(computeHasOngoingShipment(cachedShipments)); // 2025-12-19 11:41:00
    }
    
    loadShipments();
    
    return cleanup;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId, token]);

  const loadShipments = async (isRefresh = false) => {
    if (!driverId) return;
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await driverShipmentsApi.getDriverShipments();
      const shipmentsData = response.data?.data || [];
      setShipments(shipmentsData);
      setHasOngoingShipment(computeHasOngoingShipment(shipmentsData)); // 2025-12-19 11:41:00
      
      // 缓存运单列表
      OfflineService.cacheShipments(shipmentsData);
    } catch (error: any) {
      console.error('加载司机运单失败:', error);
      
      // 如果网络错误，尝试从缓存加载
      if (!navigator.onLine || error.code === 'NETWORK_ERROR' || error.message?.includes('network')) {
        const cachedShipments = OfflineService.getCachedShipments();
        if (cachedShipments && cachedShipments.length > 0) {
          setShipments(cachedShipments);
          setHasOngoingShipment(computeHasOngoingShipment(cachedShipments)); // 2025-12-19 11:41:00
          Toast.show({
            icon: 'fail',
            content: '网络连接失败，显示缓存数据',
            duration: 3000,
          });
          return;
        }
      }
      
      const errorMessage = error?.response?.data?.error?.message || '加载失败，请稍后重试';
      Toast.show({
        icon: 'fail',
        content: errorMessage,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 下拉刷新
  const onRefresh = async () => {
    await loadShipments(true);
    Toast.show({
      icon: 'success',
      content: '刷新成功',
      duration: 1000,
    });
  };

  const handleAdvanceStatus = async (shipment: Shipment) => {
    if (!driverId) return;
    const shipmentId = shipment.id;
    setActionLoading(shipmentId);
    try {
      switch (shipment.status) {
        case 'confirmed':
        case ShipmentStatus.ASSIGNED:
          await driverShipmentsApi.startPickup(shipmentId, driverId || undefined);
          break;
        case 'pending':
          await driverShipmentsApi.startPickup(shipmentId, driverId || undefined);
          break;
        case ShipmentStatus.PICKED_UP:
          await driverShipmentsApi.startTransit(shipmentId, driverId || undefined);
          break;
        case ShipmentStatus.IN_TRANSIT:
          await driverShipmentsApi.completeDelivery(shipmentId, driverId || undefined);
          break;
        default:
          Toast.show({
            icon: 'fail',
            content: '当前状态无需操作',
          });
          setActionLoading(null);
          return;
      }
      Toast.show({
        icon: 'success',
        content: '状态更新成功',
      });
      await loadShipments();
    } catch (error: any) {
      console.error('更新状态失败:', error);
      const errorMessage = error?.response?.data?.error?.message || '状态更新失败，请稍后再试';
      Toast.show({
        icon: 'fail',
        content: errorMessage,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    const result = await Dialog.confirm({
      content: '确定要退出登录吗？',
      confirmText: '退出',
      cancelText: '取消',
    });
    if (result) {
      try {
        await authApi.logout();
      } finally {
        clearSession();
        navigate('/login');
      }
    }
  };

  const handleCardClick = (shipment: Shipment) => {
    // TODO: 跳转到运单详情页
    navigate(`/shipment/${shipment.id}`);
  };

  // 加载骨架屏
  const renderSkeleton = () => (
    <div style={{ padding: '16px' }}>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} animated style={{ marginBottom: 12 }} />
      ))}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <NavBar
        right={
          <div onClick={handleLogout} style={{ cursor: 'pointer' }}>
            <CloseOutline fontSize={20} />
          </div>
        }
        style={{ background: '#1890ff', color: '#fff' }}
      >
        司机任务面板
      </NavBar>

      <PullToRefresh onRefresh={onRefresh}>
        {loading && !refreshing ? (
          renderSkeleton()
        ) : shipments.length === 0 ? (
          <Empty
            description="当前没有待处理运单，祝您一路顺风！"
            style={{ marginTop: 60 }}
          />
        ) : (
          <List style={{ padding: '12px', background: '#f5f5f5' }}>
            {shipments.map((shipment) => {
              const actionLabel = actionLabelMap[shipment.status];
              return (
                <ShipmentCard
                  key={shipment.id}
                  shipment={shipment}
                  actionLabel={actionLabel}
                  actionLoading={actionLoading === shipment.id}
                  onActionClick={handleAdvanceStatus}
                  onClick={handleCardClick}
                />
              );
            })}
          </List>
        )}
      </PullToRefresh>
      
      {/* 位置追踪组件 */}
      <LocationTracker
        autoStart={true}
        showIndicator={true}
        interval={30000}
        distanceThreshold={50}
        hasOngoingShipment={hasOngoingShipment}
      />
    </div>
  );
}
