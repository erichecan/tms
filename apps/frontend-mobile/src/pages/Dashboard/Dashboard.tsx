// 2025-11-11 10:15:05 重构：司机移动端任务面板
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, driverShipmentsApi, DRIVER_STORAGE_KEY, TOKEN_STORAGE_KEY, clearSession } from '../../services/api';
import { Shipment, ShipmentStatus } from '../../types';

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
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!driverId || !token) {
      clearSession();
      navigate('/login');
      return;
    }
    loadShipments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId, token]);

  const loadShipments = async () => {
    if (!driverId) return;
    try {
      setLoading(true);
      const response = await driverShipmentsApi.getDriverShipments();
      setShipments(response.data?.data || []);
      setFeedback(null);
    } catch (error) {
      console.error('加载司机运单失败:', error);
      setFeedback('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
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
          setFeedback('当前状态无需操作');
          setActionLoading(null);
          return;
      }
      setFeedback('状态更新成功');
      await loadShipments();
    } catch (error) {
      console.error('更新状态失败:', error);
      setFeedback('状态更新失败，请稍后再试');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePODUpload = async (shipmentId: string, file: File | undefined | null) => {
    if (!file) return;
    try {
      setUploadingId(shipmentId);
      await driverShipmentsApi.uploadShipmentPOD(shipmentId, file);
      setFeedback('签收凭证上传成功');
      await loadShipments();
    } catch (error) {
      console.error('上传签收凭证失败:', error);
      setFeedback('上传失败，请稍后重试');
    } finally {
      setUploadingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      navigate('/login');
    }
  };

  const renderShipmentCard = (shipment: Shipment) => {
    const shipmentId = shipment.id;
    const number = shipment.shipmentNumber || shipment.shipmentNo || shipmentId;
    const pickup = shipment.pickupAddress;
    const delivery = shipment.deliveryAddress;
    const nextActionLabel = actionLabelMap[shipment.status];

    return (
      <div key={shipmentId} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16, background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <strong>{number}</strong>
          <span style={{ color: '#1890ff' }}>{shipment.status}</span>
        </div>
        <div style={{ fontSize: 14, marginBottom: 8 }}>
          <div>取货：{pickup ? `${pickup.city || ''} ${pickup.addressLine1 || ''}` : '未提供'}</div>
          <div>送达：{delivery ? `${delivery.city || ''} ${delivery.addressLine1 || ''}` : '未提供'}</div>
        </div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
          客户：{shipment.customerName || '—'}
        </div>
        {nextActionLabel && (
          <button
            onClick={() => handleAdvanceStatus(shipment)}
            disabled={actionLoading === shipmentId}
            style={{
              width: '100%',
              height: 40,
              background: '#1890ff',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              marginBottom: 8,
            }}
          >
            {actionLoading === shipmentId ? '处理中...' : nextActionLabel}
          </button>
        )}
        {shipment.status === ShipmentStatus.DELIVERED && (
          <div>
            <label style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>上传签收凭证：</label>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => handlePODUpload(shipmentId, event.target.files?.[0])}
              disabled={uploadingId === shipmentId}
            />
            {uploadingId === shipmentId && <div style={{ fontSize: 12, color: '#888' }}>上传中...</div>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: 16 }}>
      <header style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, margin: 0 }}>司机任务面板</h1>
          <div style={{ fontSize: 12, color: '#888' }}>司机编号：{driverId || '未登录'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={loadShipments} style={{ padding: '8px 12px' }} disabled={loading}>
            {loading ? '刷新中...' : '刷新'}
          </button>
          <button onClick={handleLogout} style={{ padding: '8px 12px', background: '#fff', border: '1px solid #f5222d', color: '#f5222d' }}>
            退出
          </button>
        </div>
      </header>
      {feedback && (
        <div style={{ marginBottom: 12, padding: 8, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6, fontSize: 12 }}>
          {feedback}
        </div>
      )}
      {loading ? (
        <div style={{ fontSize: 14 }}>正在加载任务...</div>
      ) : shipments.length === 0 ? (
        <div style={{ fontSize: 14, color: '#888' }}>当前没有待处理运单，祝您一路顺风！</div>
      ) : (
        shipments.map(renderShipmentCard)
      )}
    </div>
  );
}
