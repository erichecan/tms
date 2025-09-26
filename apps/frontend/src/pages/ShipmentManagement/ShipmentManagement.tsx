import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  message,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Typography,
  Divider,
  Steps,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  TruckOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { shipmentsApi } from '../../services/api';
import { Shipment, ShipmentStatus } from '../../types/index';

const { Title, Text } = Typography;
const { Step } = Steps;

const ShipmentManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewingShipment, setViewingShipment] = useState<Shipment | null>(null);
  

  useEffect(() => {
    loadShipments();
  }, []);

  const loadShipments = async () => {
    try {
      setLoading(true);
      const response = await shipmentsApi.getShipments();
      setShipments(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load shipments:', error);
      message.error('加载运单失败');
    } finally {
      setLoading(false);
    }
  };

  // 移除弹窗创建/编辑逻辑 // 2025-09-25 23:42:00

  const handleViewShipment = (shipment: Shipment) => {
    setViewingShipment(shipment);
    setIsViewModalVisible(true);
  };

  const handleDeleteShipment = async (shipmentId: string) => {
    try {
      await shipmentsApi.deleteShipment(shipmentId);
      message.success('运单删除成功');
      loadShipments();
    } catch (error) {
      console.error('Failed to delete shipment:', error);
      message.error('删除运单失败');
    }
  };

  // 移除保存逻辑 // 2025-09-25 23:42:00

  const getStatusTag = (status: ShipmentStatus) => {
    const statusMap: Record<ShipmentStatus, { color: string; text: string; icon: React.ReactNode }> = {
      [ShipmentStatus.PENDING]: { color: 'orange', text: '待处理', icon: <ClockCircleOutlined /> },
      [ShipmentStatus.IN_TRANSIT]: { color: 'blue', text: '运输中', icon: <TruckOutlined /> },
      [ShipmentStatus.COMPLETED]: { color: 'green', text: '已完成', icon: <CheckCircleOutlined /> },
      [ShipmentStatus.CANCELLED]: { color: 'red', text: '已取消', icon: <ExclamationCircleOutlined /> },
    };
    
    const statusInfo = statusMap[status] || { color: 'default', text: status, icon: null };
    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    );
  };

  const getStatusStep = (status: ShipmentStatus) => {
    const statusSteps = [
      { key: ShipmentStatus.PENDING, title: '待处理', description: '运单已创建，等待处理' },
      { key: ShipmentStatus.IN_TRANSIT, title: '运输中', description: '货物正在运输途中' },
      { key: ShipmentStatus.COMPLETED, title: '已完成', description: '货物已送达，运单完成' },
    ];
    
    const currentStep = statusSteps.findIndex(step => step.key === status);
    return currentStep >= 0 ? currentStep : 0;
  };

  const columns = [
    {
      title: '运单号',
      dataIndex: 'shipmentNumber',
      key: 'shipmentNumber',
      render: (text: string, record: Shipment) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ID: {record.id.slice(0, 8)}...
          </Text>
        </div>
      ),
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
      render: (text: string) => text || '未分配',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: ShipmentStatus) => getStatusTag(status),
    },
    {
      title: '预估费用',
      dataIndex: 'estimatedCost',
      key: 'estimatedCost',
      render: (cost: number | string) => (
        <Text strong style={{ color: '#1890ff' }}>
          ¥{cost ? (typeof cost === 'number' ? cost.toFixed(2) : parseFloat(cost).toFixed(2)) : '0.00'}
        </Text>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Shipment) => (
        <Space size="middle">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewShipment(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个运单吗？"
            description="删除后无法恢复，请谨慎操作。"
            onConfirm={() => handleDeleteShipment(record.id)}
            okText="确定"
            cancelText="取消"
            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
          >
            <Tooltip title="删除运单">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">运单管理</h1>
        <p className="page-description">管理运输订单和跟踪状态</p>
      </div>

      <Card className="content-card">
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>运单列表</Title>
            <Text type="secondary">共 {shipments.length} 个运单</Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => window.open('/create-shipment', '_blank')}
          >
            新建运单
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={shipments}
          rowKey="id"
          loading={loading}
          pagination={{
            total: shipments.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
        />
      </Card>

      {/* 运单表单 */}
      {/* 移除弹窗创建方式，统一跳转到新建页面 */}

      {/* 运单详情查看 */}
      <Modal
        title="运单详情"
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={1000}
      >
        {viewingShipment && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>运单号：</Text>
                <div>{viewingShipment.shipmentNumber}</div>
              </Col>
              <Col span={12}>
                <Text strong>状态：</Text>
                <div>{getStatusTag(viewingShipment.status)}</div>
              </Col>
            </Row>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>客户：</Text>
                <div>{viewingShipment.customerName}</div>
              </Col>
              <Col span={12}>
                <Text strong>司机：</Text>
                <div>{viewingShipment.driverName}</div>
              </Col>
            </Row>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>取货地址：</Text>
                <div>
                  {viewingShipment.pickupAddress.street}, {viewingShipment.pickupAddress.city}, {viewingShipment.pickupAddress.state} {viewingShipment.pickupAddress.postalCode}
                </div>
              </Col>
              <Col span={12}>
                <Text strong>送达地址：</Text>
                <div>
                  {viewingShipment.deliveryAddress.street}, {viewingShipment.deliveryAddress.city}, {viewingShipment.deliveryAddress.state} {viewingShipment.deliveryAddress.postalCode}
                </div>
              </Col>
            </Row>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>预估费用：</Text>
                <div style={{ color: '#1890ff', fontWeight: 'bold' }}>
                  ¥{viewingShipment.estimatedCost ? Number(viewingShipment.estimatedCost).toFixed(2) : '0.00'}
                </div>
              </Col>
              <Col span={12}>
                <Text strong>重量：</Text>
                <div>{viewingShipment.weight || 0} kg</div>
              </Col>
            </Row>
            <Divider />
            <div>
              <Text strong>备注：</Text>
              <div>{viewingShipment.description || '无'}</div>
            </div>
            <Divider />
            <div>
              <Text strong>状态进度：</Text>
              <div style={{ marginTop: 16 }}>
                <Steps
                  current={getStatusStep(viewingShipment.status)}
                  size="small"
                >
                  <Step title="待处理" description="运单已创建" />
                  <Step title="运输中" description="货物运输中" />
                  <Step title="已完成" description="货物已送达" />
                </Steps>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ShipmentManagement;
