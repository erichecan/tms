import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  message,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Typography,
  Divider,
  Descriptions,
  Steps,
  Timeline,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  TruckOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { shipmentsApi, customersApi, driversApi } from '../../services/api';
import { Shipment, ShipmentStatus } from '../../types/index';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Step } = Steps;

const ShipmentManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewingShipment, setViewingShipment] = useState<Shipment | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    loadShipments();
    loadCustomers();
    loadDrivers();
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

  const loadCustomers = async () => {
    try {
      const response = await customersApi.getCustomers();
      setCustomers(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const loadDrivers = async () => {
    try {
      const response = await driversApi.getDrivers();
      setDrivers(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load drivers:', error);
    }
  };

  const handleCreateShipment = () => {
    setEditingShipment(null);
    form.resetFields();
    setIsFormVisible(true);
  };

  const handleEditShipment = (shipment: Shipment) => {
    setEditingShipment(shipment);
    form.setFieldsValue({
      ...shipment,
      pickupDate: shipment.pickupDate ? new Date(shipment.pickupDate) : null,
      deliveryDate: shipment.deliveryDate ? new Date(shipment.deliveryDate) : null,
    });
    setIsFormVisible(true);
  };

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

  const handleFormSubmit = async (values: any) => {
    try {
      if (editingShipment) {
        await shipmentsApi.updateShipment(editingShipment.id, values);
        message.success('运单更新成功');
      } else {
        await shipmentsApi.createShipment(values);
        message.success('运单创建成功');
      }
      setIsFormVisible(false);
      setEditingShipment(null);
      loadShipments();
    } catch (error) {
      console.error('Failed to save shipment:', error);
      message.error('保存运单失败');
    }
  };

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
    },
    {
      title: '司机',
      dataIndex: 'driverName',
      key: 'driverName',
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
      render: (cost: number) => (
        <Text strong style={{ color: '#1890ff' }}>
          ¥{cost.toFixed(2)}
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
          <Tooltip title="编辑运单">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditShipment(record)}
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
            onClick={handleCreateShipment}
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
      <Modal
        title={editingShipment ? '编辑运单' : '新建运单'}
        open={isFormVisible}
        onCancel={() => setIsFormVisible(false)}
        onOk={() => form.submit()}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="shipmentNumber"
                label="运单号"
                rules={[{ required: true, message: '请输入运单号' }]}
              >
                <Input placeholder="请输入运单号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态">
                  <Option value={ShipmentStatus.PENDING}>待处理</Option>
                  <Option value={ShipmentStatus.IN_TRANSIT}>运输中</Option>
                  <Option value={ShipmentStatus.COMPLETED}>已完成</Option>
                  <Option value={ShipmentStatus.CANCELLED}>已取消</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customerId"
                label="客户"
                rules={[{ required: true, message: '请选择客户' }]}
              >
                <Select placeholder="请选择客户">
                  {customers.map(customer => (
                    <Option key={customer.id} value={customer.id}>
                      {customer.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="driverId"
                label="司机"
                rules={[{ required: true, message: '请选择司机' }]}
              >
                <Select placeholder="请选择司机">
                  {drivers.map(driver => (
                    <Option key={driver.id} value={driver.id}>
                      {driver.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="pickupDate"
                label="取货日期"
                rules={[{ required: true, message: '请选择取货日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="deliveryDate"
                label="送达日期"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="pickupAddress"
                label="取货地址"
                rules={[{ required: true, message: '请输入取货地址' }]}
              >
                <Input placeholder="请输入取货地址" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="deliveryAddress"
                label="送达地址"
                rules={[{ required: true, message: '请输入送达地址' }]}
              >
                <Input placeholder="请输入送达地址" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="estimatedCost"
                label="预估费用"
                rules={[{ required: true, message: '请输入预估费用' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入预估费用"
                  min={0}
                  precision={2}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="weight"
                label="重量 (kg)"
                rules={[{ required: true, message: '请输入重量' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入重量"
                  min={0}
                  precision={2}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="备注"
          >
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>

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
                <div>{viewingShipment.pickupAddress}</div>
              </Col>
              <Col span={12}>
                <Text strong>送达地址：</Text>
                <div>{viewingShipment.deliveryAddress}</div>
              </Col>
            </Row>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>预估费用：</Text>
                <div style={{ color: '#1890ff', fontWeight: 'bold' }}>
                  ¥{viewingShipment.estimatedCost?.toFixed(2) || '0.00'}
                </div>
              </Col>
              <Col span={12}>
                <Text strong>重量：</Text>
                <div>{viewingShipment.weight} kg</div>
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
