// 2025-11-30T10:55:00Z Created by Assistant: 运单详情页面
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NavBar, Card, Tag, Button, Space, Skeleton, Toast, Divider } from 'antd-mobile';
import { LeftOutline, PhoneFill, EnvironmentOutline } from 'antd-mobile-icons'; // 2025-11-30T13:25:00Z Fixed by Assistant: 修复图标名称
import { driverShipmentsApi, DRIVER_STORAGE_KEY } from '../../services/api';
import { Shipment, ShipmentStatus } from '../../types';
import PODUploader from '../../components/PODUploader/PODUploader'; // 2025-11-30T11:35:00Z Added by Assistant: POD上传组件
import { navigateToAddress, makePhoneCall, formatAddress as formatAddressUtil } from '../../services/navigationService'; // 2025-11-30T11:45:00Z Added by Assistant: 导航服务
import MapView from '../../components/MapView/MapView'; // 2025-11-30T12:10:00Z Added by Assistant: 地图组件

const actionLabelMap: Record<string, string> = {
  pending: '确认接单',
  assigned: '开始取货',
  confirmed: '开始取货',
  picked_up: '开始运输',
  in_transit: '确认送达',
};

const statusColorMap: Record<string, string> = {
  pending: 'default',
  assigned: 'primary',
  confirmed: 'primary',
  scheduled: 'primary',
  pickup_in_progress: 'warning',
  picked_up: 'warning',
  in_transit: 'processing',
  delivered: 'success',
  completed: 'success',
  cancelled: 'danger',
  exception: 'danger',
};

const statusTextMap: Record<string, string> = {
  pending: '待接单',
  assigned: '已分配',
  confirmed: '已确认',
  scheduled: '已安排',
  pickup_in_progress: '提货中',
  picked_up: '已提货',
  in_transit: '运输中',
  delivered: '已送达',
  completed: '已完成',
  cancelled: '已取消',
  exception: '异常',
};

export default function ShipmentDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const driverId = localStorage.getItem(DRIVER_STORAGE_KEY);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null); // 2025-11-30T12:10:00Z Added by Assistant: 当前位置

  useEffect(() => {
    if (!id || !driverId) {
      Toast.show({
        icon: 'fail',
        content: '参数错误',
      });
      navigate('/dashboard');
      return;
    }
    loadShipment();
    loadCurrentLocation();
  }, [id, driverId, navigate]);

  // 获取当前位置
  const loadCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('获取当前位置失败:', error);
          // 不影响其他功能，静默失败
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    }
  }; // 2025-11-30T12:10:00Z Added by Assistant: 获取当前位置

  const loadShipment = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await driverShipmentsApi.getShipment(id);
      setShipment(response.data?.data || null);
    } catch (error: any) {
      console.error('加载运单详情失败:', error);
      const errorMessage = error?.response?.data?.error?.message || '加载失败，请稍后重试';
      Toast.show({
        icon: 'fail',
        content: errorMessage,
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceStatus = async () => {
    if (!shipment || !driverId) return;
    setActionLoading(true);
    try {
      switch (shipment.status) {
        case 'confirmed':
        case ShipmentStatus.ASSIGNED:
          await driverShipmentsApi.startPickup(shipment.id, driverId);
          break;
        case 'pending':
          await driverShipmentsApi.startPickup(shipment.id, driverId);
          break;
        case ShipmentStatus.PICKED_UP:
          await driverShipmentsApi.startTransit(shipment.id, driverId);
          break;
        case ShipmentStatus.IN_TRANSIT:
          await driverShipmentsApi.completeDelivery(shipment.id, driverId);
          break;
        default:
          Toast.show({
            icon: 'fail',
            content: '当前状态无需操作',
          });
          setActionLoading(false);
          return;
      }
      Toast.show({
        icon: 'success',
        content: '状态更新成功',
      });
      await loadShipment();
    } catch (error: any) {
      console.error('更新状态失败:', error);
      const errorMessage = error?.response?.data?.error?.message || '状态更新失败，请稍后再试';
      Toast.show({
        icon: 'fail',
        content: errorMessage,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatAddress = (address?: { city?: string; province?: string; addressLine1?: string }) => {
    return formatAddressUtil(address as any);
  };

  const handleCall = (phone?: string) => {
    try {
      if (!phone) {
        Toast.show({
          icon: 'fail',
          content: '未提供联系电话',
        });
        return;
      }
      makePhoneCall(phone);
    } catch (error: any) {
      Toast.show({
        icon: 'fail',
        content: error.message || '拨打电话失败',
      });
    }
  };

  const handleNavigate = (address?: { latitude?: number; longitude?: number; addressLine1?: string; city?: string; province?: string }) => {
    try {
      if (!address) {
        Toast.show({
          icon: 'fail',
          content: '地址信息未提供',
        });
        return;
      }
      navigateToAddress(address as any);
    } catch (error: any) {
      Toast.show({
        icon: 'fail',
        content: error.message || '导航失败',
      });
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <NavBar onBack={() => navigate('/dashboard')}>运单详情</NavBar>
        <div style={{ padding: '16px' }}>
          <Skeleton animated />
          <Skeleton animated style={{ marginTop: 12 }} />
          <Skeleton animated style={{ marginTop: 12 }} />
        </div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <NavBar onBack={() => navigate('/dashboard')}>运单详情</NavBar>
        <div style={{ padding: '40px 16px', textAlign: 'center' }}>
          <p>运单不存在</p>
          <Button color="primary" onClick={() => navigate('/dashboard')} style={{ marginTop: 16 }}>
            返回任务列表
          </Button>
        </div>
      </div>
    );
  }

  const status = shipment.status;
  const statusColor = statusColorMap[status] || 'default';
  const statusText = statusTextMap[status] || status;
  const actionLabel = actionLabelMap[status];
  const number = shipment.shipmentNumber || shipment.shipmentNo || shipment.id;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: 80 }}>
      <NavBar
        onBack={() => navigate('/dashboard')}
        style={{ background: '#1890ff', color: '#fff' }}
      >
        运单详情
      </NavBar>

      <div style={{ padding: '12px' }}>
        {/* 运单基本信息 */}
        <Card style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>
                运单号: {number}
              </div>
              <Tag color={statusColor as any}>{statusText}</Tag>
            </div>
          </div>
          {shipment.customerName && (
            <div style={{ fontSize: 14, color: '#888', marginTop: 8 }}>
              客户：{shipment.customerName}
            </div>
          )}
        </Card>

        {/* 提货信息 */}
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>提货信息</div>
          <Space direction="vertical" style={{ width: '100%', '--gap': '12px' }}>
            <div>
              <div style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>
                <EnvironmentOutline style={{ marginRight: 4 }} />
                地址
              </div>
              <div style={{ fontSize: 15, color: '#333' }}>
                {formatAddress(shipment.pickupAddress)}
              </div>
            </div>
            {shipment.pickupAddress && (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  size="small"
                  color="primary"
                  fill="outline"
                  onClick={() => handleNavigate(shipment.pickupAddress)}
                >
                  导航
                </Button>
                {shipment.pickupAddress && (shipment.pickupAddress as any).phone && (
                  <Button
                    size="small"
                    color="primary"
                    fill="outline"
                    onClick={() => handleCall((shipment.pickupAddress as any).phone)}
                  >
                    <PhoneFill style={{ marginRight: 4 }} />
                    电话
                  </Button>
                )}
              </div>
            )}
          </Space>
        </Card>

        {/* 送达信息 */}
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>送达信息</div>
          <Space direction="vertical" style={{ width: '100%', '--gap': '12px' }}>
            <div>
              <div style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>
                <EnvironmentOutline style={{ marginRight: 4 }} />
                地址
              </div>
              <div style={{ fontSize: 15, color: '#333' }}>
                {formatAddress(shipment.deliveryAddress)}
              </div>
            </div>
            {shipment.deliveryAddress && (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  size="small"
                  color="primary"
                  fill="outline"
                  onClick={() => handleNavigate(shipment.deliveryAddress)}
                >
                  导航
                </Button>
                {shipment.deliveryAddress && (shipment.deliveryAddress as any).phone && (
                  <Button
                    size="small"
                    color="primary"
                    fill="outline"
                    onClick={() => handleCall((shipment.deliveryAddress as any).phone)}
                  >
                    <PhoneFill style={{ marginRight: 4 }} />
                    电话
                  </Button>
                )}
              </div>
            )}
          </Space>
        </Card>

        {/* 地图视图 */}
        {/* 2025-11-30T21:15:00 修复：使用 shipment.pickupAddress 和 shipment.deliveryAddress 而不是未定义的 pickup 和 delivery 变量 */}
        {((shipment.pickupAddress as any)?.latitude && (shipment.pickupAddress as any)?.longitude) || 
         ((shipment.deliveryAddress as any)?.latitude && (shipment.deliveryAddress as any)?.longitude) ? (
          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>路线地图</div>
            <MapView
              pickup={shipment.pickupAddress as any}
              delivery={shipment.deliveryAddress as any}
              currentLocation={currentLocation || undefined}
              showRoute={true}
              height="250px"
              onNavigate={(location) => {
                navigateToAddress(location as any);
              }}
            />
          </Card>
        ) : null}

        {/* POD上传 - 已送达或已完成状态时显示 */}
        {(status === ShipmentStatus.DELIVERED || status === 'delivered' || status === 'completed') && (
          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>签收凭证</div>
            <PODUploader
              shipmentId={shipment.id}
              onUploadSuccess={() => {
                // 上传成功后刷新运单信息
                loadShipment();
              }}
              onUploadError={(error) => {
                console.error('POD上传失败:', error);
              }}
              maxCount={3}
            />
          </Card>
        )}

        {/* 操作按钮 */}
        {actionLabel && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px', background: '#fff', borderTop: '1px solid #eee' }}>
            <Button
              block
              color="primary"
              size="large"
              loading={actionLoading}
              onClick={handleAdvanceStatus}
            >
              {actionLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

