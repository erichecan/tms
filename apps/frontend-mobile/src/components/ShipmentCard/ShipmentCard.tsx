// 2025-11-30T10:40:00Z Created by Assistant: 运单卡片组件
import { Card, Tag, Button, Space } from 'antd-mobile';
import { RightOutline } from 'antd-mobile-icons';
import { Shipment, ShipmentStatus } from '../../types';

interface ShipmentCardProps {
  shipment: Shipment;
  actionLabel?: string;
  actionLoading?: boolean;
  onActionClick?: (shipment: Shipment) => void;
  onClick?: (shipment: Shipment) => void;
}

// 状态标签颜色映射
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

// 状态文本映射
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

export default function ShipmentCard({
  shipment,
  actionLabel,
  actionLoading = false,
  onActionClick,
  onClick,
}: ShipmentCardProps) {
  const shipmentId = shipment.id;
  const number = shipment.shipmentNumber || shipment.shipmentNo || shipmentId;
  const pickup = shipment.pickupAddress;
  const delivery = shipment.deliveryAddress;
  const status = shipment.status;
  
  const statusColor = statusColorMap[status] || 'default';
  const statusText = statusTextMap[status] || status;

  const formatAddress = (address?: { city?: string; addressLine1?: string }) => {
    if (!address) return '未提供';
    const parts = [address.city, address.addressLine1].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : '未提供';
  };

  return (
    <Card
      onClick={() => onClick?.(shipment)}
      style={{
        marginBottom: 12,
        borderRadius: 8,
      }}
      bodyStyle={{
        padding: '16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
            运单号: {number}
          </div>
          <Tag color={statusColor as any} style={{ marginTop: 4 }}>
            {statusText}
          </Tag>
        </div>
        {onClick && (
          <RightOutline style={{ fontSize: 20, color: '#999', marginLeft: 8 }} />
        )}
      </div>

      <Space direction="vertical" style={{ width: '100%', '--gap': '8px' }}>
        <div style={{ fontSize: 14, color: '#333' }}>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: '#888' }}>取货：</span>
            <span>{formatAddress(pickup)}</span>
          </div>
          <div>
            <span style={{ color: '#888' }}>送达：</span>
            <span>{formatAddress(delivery)}</span>
          </div>
        </div>

        {shipment.customerName && (
          <div style={{ fontSize: 13, color: '#888' }}>
            客户：{shipment.customerName}
          </div>
        )}

        {actionLabel && onActionClick && (
          <Button
            color="primary"
            block
            loading={actionLoading}
            onClick={(e) => {
              e.stopPropagation();
              onActionClick(shipment);
            }}
            style={{ marginTop: 8 }}
          >
            {actionLabel}
          </Button>
        )}
      </Space>
    </Card>
  );
}

