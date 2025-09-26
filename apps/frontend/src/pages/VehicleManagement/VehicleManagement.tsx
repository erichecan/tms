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
  message,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Typography,
  Divider,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Vehicle {
  id: string;
  plateNumber: string;
  type: string;
  capacity: number;
  status: string;
  driverId?: string;
  driverName?: string;
  createdAt: string;
  updatedAt: string;
}

const VehicleManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      // TODO: 实现车辆API调用
      // const response = await vehiclesApi.getVehicles();
      // setVehicles(response.data?.data || []);
      
      // 模拟数据
      const mockVehicles: Vehicle[] = [
        {
          id: '1',
          plateNumber: '京A12345',
          type: 'truck',
          capacity: 10000,
          status: 'available',
          driverName: '李司机',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: '2',
          plateNumber: '京B67890',
          type: 'van',
          capacity: 5000,
          status: 'in_use',
          driverName: '王司机',
          createdAt: '2025-01-02T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
        },
      ];
      setVehicles(mockVehicles);
    } catch (error) {
      console.error('Failed to load vehicles:', error);
      message.error('加载车辆列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVehicle = () => {
    setEditingVehicle(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    form.setFieldsValue({
      plateNumber: vehicle.plateNumber,
      type: vehicle.type,
      capacity: vehicle.capacity,
      status: vehicle.status,
    });
    setIsModalVisible(true);
  };

  const handleViewVehicle = (vehicle: Vehicle) => {
    setViewingVehicle(vehicle);
    setIsViewModalVisible(true);
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    try {
      // TODO: 实现车辆删除API
      // await vehiclesApi.deleteVehicle(vehicleId);
      message.success('车辆删除成功');
      loadVehicles();
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
      message.error('删除车辆失败');
    }
  };

  const handleSaveVehicle = async () => {
    try {
      const values = await form.validateFields();
      
      // TODO: 实现车辆保存API
      if (editingVehicle) {
        // await vehiclesApi.updateVehicle(editingVehicle.id, values);
        message.success('车辆信息更新成功');
      } else {
        // await vehiclesApi.createVehicle(values);
        message.success('车辆创建成功');
      }
      
      setIsModalVisible(false);
      loadVehicles();
    } catch (error) {
      console.error('Failed to save vehicle:', error);
      message.error(editingVehicle ? '更新车辆失败' : '创建车辆失败');
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap = {
      available: { color: 'green', text: '可用' },
      in_use: { color: 'orange', text: '使用中' },
      maintenance: { color: 'red', text: '维修中' },
      inactive: { color: 'default', text: '停用' },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getTypeText = (type: string) => {
    const typeMap = {
      truck: '卡车',
      van: '面包车',
      pickup: '皮卡',
      trailer: '拖车',
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  const columns = [
    {
      title: '车辆信息',
      key: 'vehicleInfo',
      render: (_: any, record: Vehicle) => (
        <div>
          <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
            <CarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            {record.plateNumber}
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {getTypeText(record.type)}
          </Text>
        </div>
      ),
    },
    {
      title: '载重能力',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (capacity: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          {capacity} kg
        </Text>
      ),
    },
    {
      title: '当前司机',
      key: 'driver',
      render: (_: any, record: Vehicle) => (
        <div>
          {record.driverName ? (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircleOutlined style={{ marginRight: 4, color: '#52c41a', fontSize: '12px' }} />
              <Text style={{ fontSize: '12px' }}>{record.driverName}</Text>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <CloseCircleOutlined style={{ marginRight: 4, color: '#ff4d4f', fontSize: '12px' }} />
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
      render: (status: string) => getStatusTag(status),
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
      render: (_: any, record: Vehicle) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewVehicle(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditVehicle(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这辆车吗？"
            description="删除后无法恢复"
            onConfirm={() => handleDeleteVehicle(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
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
        <h1 className="page-title">车辆管理</h1>
        <p className="page-description">管理车辆信息和司机分配</p>
      </div>

      <Card className="content-card">
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>车辆列表</Title>
            <Text type="secondary">共 {vehicles.length} 辆车</Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateVehicle}
          >
            添加车辆
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={vehicles}
          rowKey="id"
          loading={loading}
          pagination={{
            total: vehicles.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
        />
      </Card>

      {/* 车辆表单 */}
      <Modal
        title={editingVehicle ? '编辑车辆' : '添加车辆'}
        open={isModalVisible}
        onOk={handleSaveVehicle}
        onCancel={() => setIsModalVisible(false)}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            type: 'truck',
            status: 'available',
            capacity: 10000,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="plateNumber"
                label="车牌号"
                rules={[{ required: true, message: '请输入车牌号' }]}
              >
                <Input placeholder="请输入车牌号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="车辆类型"
                rules={[{ required: true, message: '请选择车辆类型' }]}
              >
                <Select placeholder="请选择车辆类型">
                  <Option value="truck">卡车</Option>
                  <Option value="van">面包车</Option>
                  <Option value="pickup">皮卡</Option>
                  <Option value="trailer">拖车</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="capacity"
                label="载重能力 (kg)"
                rules={[{ required: true, message: '请输入载重能力' }]}
              >
                <InputNumber
                  placeholder="请输入载重能力"
                  min={0}
                  max={50000}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态">
                  <Option value="available">可用</Option>
                  <Option value="in_use">使用中</Option>
                  <Option value="maintenance">维修中</Option>
                  <Option value="inactive">停用</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 车辆详情查看 */}
      <Modal
        title="车辆详情"
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {viewingVehicle && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>车牌号：</Text>
                <div style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 'bold' }}>
                  {viewingVehicle.plateNumber}
                </div>
              </Col>
              <Col span={12}>
                <Text strong>车辆类型：</Text>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <CarOutlined style={{ marginRight: 4, color: '#1890ff' }} />
                  {getTypeText(viewingVehicle.type)}
                </div>
              </Col>
            </Row>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>载重能力：</Text>
                <div style={{ color: '#52c41a', fontWeight: 'bold' }}>
                  {viewingVehicle.capacity} kg
                </div>
              </Col>
              <Col span={12}>
                <Text strong>状态：</Text>
                <div>{getStatusTag(viewingVehicle.status)}</div>
              </Col>
            </Row>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>当前司机：</Text>
                <div>
                  {viewingVehicle.driverName ? (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleOutlined style={{ marginRight: 4, color: '#52c41a' }} />
                      {viewingVehicle.driverName}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <CloseCircleOutlined style={{ marginRight: 4, color: '#ff4d4f' }} />
                      <Text type="secondary">未分配</Text>
                    </div>
                  )}
                </div>
              </Col>
              <Col span={12}>
                <Text strong>创建时间：</Text>
                <div>{new Date(viewingVehicle.createdAt).toLocaleString()}</div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VehicleManagement;
