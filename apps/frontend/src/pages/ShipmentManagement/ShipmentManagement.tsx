import React, { useState, useEffect } from 'react';
import { Button, Space, Typography, message, Tag, Tooltip, Card, Table, Modal, Divider } from 'antd'; // 2025-09-27 03:25:00 移除未使用的Row, Col
import { 
  EyeOutlined, 
  EditOutlined, 
  DeleteOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { shipmentsApi, driversApi } from '../../services/api';
import { Shipment, ShipmentStatus, Driver } from '../../types';
import ShipmentDetails from '../../components/ShipmentDetails/ShipmentDetails'; // 2025-09-27 03:10:00 恢复运单详情组件

const { Title, Text } = Typography;

const ShipmentManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewingShipment, setViewingShipment] = useState<Shipment | null>(null);
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [assigningShipment, setAssigningShipment] = useState<Shipment | null>(null);

  useEffect(() => {
    loadShipments();
    loadDrivers();
  }, []);

  const loadShipments = async () => {
    try {
      setLoading(true);
      const response = await shipmentsApi.getShipments();
      setShipments(response.data.data || []);
    } catch (error) {
      console.error('Failed to load shipments:', error);
      message.error('加载运单失败');
    } finally {
      setLoading(false);
    }
  };

  const loadDrivers = async () => {
    try {
      const response = await driversApi.getDrivers();
      setDrivers(response.data.data || []);
    } catch (error) {
      console.error('Failed to load drivers:', error);
      message.error('加载司机失败');
    }
  };

  const handleView = (shipment: Shipment) => {
    setViewingShipment(shipment);
    setIsViewModalVisible(true);
  };

  const handleAssignDriver = (shipment: Shipment) => {
    setAssigningShipment(shipment);
    setIsAssignModalVisible(true);
  };

  const handleConfirmAssign = async (driverId: string) => {
    if (!assigningShipment) return;
    
    try {
      // 使用专门的指派司机 API，修复 500 错误 // 2025-09-26 17:40:00
      await shipmentsApi.assignDriver(assigningShipment.id, driverId, '系统指派');
      
      message.success('司机指派成功');
      setIsAssignModalVisible(false);
      setAssigningShipment(null);
      loadShipments(); // 重新加载运单列表
    } catch (error) {
      console.error('Failed to assign driver:', error);
      message.error('司机指派失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await shipmentsApi.deleteShipment(id);
      message.success('删除成功');
      loadShipments();
    } catch (error) {
      console.error('Failed to delete shipment:', error);
      message.error('删除运单失败');
    }
  };

  const getStatusTag = (status: ShipmentStatus) => {
    const statusMap: Record<ShipmentStatus, { color: string; text: string; icon: React.ReactNode }> = {
      [ShipmentStatus.PENDING]: { color: 'orange', text: '待处理', icon: <ClockCircleOutlined /> },
      [ShipmentStatus.QUOTED]: { color: 'blue', text: '已报价', icon: <ClockCircleOutlined /> },
      [ShipmentStatus.CONFIRMED]: { color: 'cyan', text: '已确认', icon: <ClockCircleOutlined /> },
      [ShipmentStatus.ASSIGNED]: { color: 'purple', text: '已分配', icon: <ClockCircleOutlined /> },
      [ShipmentStatus.PICKED_UP]: { color: 'geekblue', text: '已取货', icon: <ClockCircleOutlined /> },
      [ShipmentStatus.IN_TRANSIT]: { color: 'blue', text: '运输中', icon: <ClockCircleOutlined /> },
      [ShipmentStatus.DELIVERED]: { color: 'green', text: '已送达', icon: <CheckCircleOutlined /> },
      [ShipmentStatus.COMPLETED]: { color: 'green', text: '已完成', icon: <CheckCircleOutlined /> },
      [ShipmentStatus.CANCELLED]: { color: 'red', text: '已取消', icon: <ClockCircleOutlined /> },
      [ShipmentStatus.EXCEPTION]: { color: 'red', text: '异常', icon: <ClockCircleOutlined /> },
    };
    return statusMap[status] || { color: 'default', text: '未知', icon: <ClockCircleOutlined /> };
  };

  const columns = [
    {
      title: '运单号',
      dataIndex: 'shipmentNumber',
      key: 'shipmentNumber',
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (text: string) => text || '未指定',
    },
    {
      title: '司机',
      dataIndex: 'driverName',
      key: 'driverName',
      render: (text: string, _: Shipment) => (
        <div>
          {text ? (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircleOutlined style={{ marginRight: 4, color: '#52c41a', fontSize: '12px' }} />
              <Text style={{ fontSize: '12px' }}>{text}</Text>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <ClockCircleOutlined style={{ marginRight: 4, color: '#ff4d4f', fontSize: '12px' }} />
              <Text type="secondary" style={{ fontSize: '12px' }}>未分配</Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: ShipmentStatus) => {
        const statusInfo = getStatusTag(status);
        return (
          <Tag color={statusInfo.color} icon={statusInfo.icon}>
            {statusInfo.text}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Shipment) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleView(record)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="text" icon={<EditOutlined />} />
          </Tooltip>
          {!record.driverId && (
            <Tooltip title="指派司机">
              <Button
                type="text"
                icon={<UserAddOutlined />}
                onClick={() => handleAssignDriver(record)}
              />
            </Tooltip>
          )}
          <Tooltip title="删除">
            <Button 
              type="text" 
              icon={<DeleteOutlined />} 
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3}>运单管理</Title>
        <Button type="primary" icon={<PlusOutlined />}>
          创建运单
        </Button>
      </div>
      
      <Card>
        <Table
          columns={columns}
          dataSource={shipments}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 运单详情弹窗 */}
      <Modal
        title="运单详情"
        open={isViewModalVisible}
        onCancel={() => {
          setIsViewModalVisible(false);
          setViewingShipment(null);
        }}
        footer={null}
        width={1000}
      >
        {viewingShipment && (
          <ShipmentDetails 
            shipment={viewingShipment}
            onPrint={() => {
              window.print();
            }}
            onDownloadPDF={() => {
              // TODO: 实现PDF下载功能 // 2025-09-27 03:10:00
              console.log('Download PDF for shipment:', viewingShipment.id);
            }}
          />
        )}
      </Modal>

      {/* 司机指派弹窗 */}
      <Modal
        title="指派司机"
        open={isAssignModalVisible}
        onCancel={() => {
          setIsAssignModalVisible(false);
          setAssigningShipment(null);
        }}
        footer={null}
        width={500}
      >
        {assigningShipment && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>运单号：</Text>
              <Text code>{assigningShipment.shipmentNumber}</Text>
            </div>
            <Divider />
            <div>
              <Text strong style={{ marginBottom: 8, display: 'block' }}>
                选择司机：
              </Text>
              <Space direction="vertical" style={{ width: '100%' }}>
                {drivers
                  .filter(driver => driver.status === 'active')
                  .map(driver => (
                    <Card
                      key={driver.id}
                      size="small"
                      hoverable
                      onClick={() => handleConfirmAssign(driver.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 500 }}>{driver.name}</div>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {driver.phone} • {driver.vehicleInfo.type}
                          </Text>
                        </div>
                        <Button type="primary" size="small">
                          指派
                        </Button>
                      </div>
                    </Card>
                  ))}
                {drivers.filter(driver => driver.status === 'active').length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Text type="secondary">暂无可用的司机</Text>
                  </div>
                )}
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ShipmentManagement;