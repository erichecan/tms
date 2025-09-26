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
  UserOutlined,
  PhoneOutlined,
  CarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { driversApi } from '../../services/api';
import { Driver } from '../../types/index';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const DriverManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewingDriver, setViewingDriver] = useState<Driver | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const response = await driversApi.getDrivers();
      setDrivers(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load drivers:', error);
      message.error('加载司机列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDriver = () => {
    setEditingDriver(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver);
    form.setFieldsValue({
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      licenseNumber: driver.licenseNumber,
      vehicleType: driver.vehicleType,
    });
    setIsModalVisible(true);
  };

  const handleViewDriver = (driver: Driver) => {
    setViewingDriver(driver);
    setIsViewModalVisible(true);
  };

  const handleDeleteDriver = async (driverId: string) => {
    try {
      await driversApi.deleteDriver(driverId);
      message.success('司机删除成功');
      loadDrivers();
    } catch (error) {
      console.error('Failed to delete driver:', error);
      message.error('删除司机失败');
    }
  };

  const handleSaveDriver = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingDriver) {
        await driversApi.updateDriver(editingDriver.id, values);
        message.success('司机信息更新成功');
      } else {
        await driversApi.createDriver(values);
        message.success('司机创建成功');
      }
      
      setIsModalVisible(false);
      loadDrivers();
    } catch (error) {
      console.error('Failed to save driver:', error);
      message.error(editingDriver ? '更新司机失败' : '创建司机失败');
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap = {
      active: { color: 'green', text: '可用' },
      busy: { color: 'orange', text: '忙碌' },
      offline: { color: 'red', text: '离线' },
      inactive: { color: 'default', text: '停用' },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '司机信息',
      key: 'driverInfo',
      render: (_: any, record: Driver) => (
        <div>
          <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
            <UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            {record.name}
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ID: {record.id.slice(0, 8)}...
          </Text>
        </div>
      ),
    },
    {
      title: '联系方式',
      key: 'contact',
      render: (_: any, record: Driver) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <PhoneOutlined style={{ marginRight: 4, fontSize: '12px' }} />
            <Text style={{ fontSize: '12px' }}>{record.phone}</Text>
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.email}
          </Text>
        </div>
      ),
    },
    {
      title: '驾驶证号',
      dataIndex: 'licenseNumber',
      key: 'licenseNumber',
      render: (text: string) => (
        <Text code style={{ fontSize: '12px' }}>
          {text}
        </Text>
      ),
    },
    {
      title: '车辆类型',
      dataIndex: 'vehicleType',
      key: 'vehicleType',
      render: (text: string) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <CarOutlined style={{ marginRight: 4, color: '#52c41a' }} />
          <Text>{text}</Text>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status || 'active'),
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
      render: (_: any, record: Driver) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDriver(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditDriver(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个司机吗？"
            description="删除后无法恢复"
            onConfirm={() => handleDeleteDriver(record.id)}
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
        <h1 className="page-title">司机管理</h1>
        <p className="page-description">管理司机信息和车辆分配</p>
      </div>

      <Card className="content-card">
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>司机列表</Title>
            <Text type="secondary">共 {drivers.length} 名司机</Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateDriver}
          >
            添加司机
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={drivers}
          rowKey="id"
          loading={loading}
          pagination={{
            total: drivers.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
        />
      </Card>

      {/* 司机表单 */}
      <Modal
        title={editingDriver ? '编辑司机' : '添加司机'}
        open={isModalVisible}
        onOk={handleSaveDriver}
        onCancel={() => setIsModalVisible(false)}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            vehicleType: 'truck',
            status: 'active',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="司机姓名"
                rules={[{ required: true, message: '请输入司机姓名' }]}
              >
                <Input placeholder="请输入司机姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="联系电话"
                rules={[
                  { required: true, message: '请输入联系电话' },
                  { 
                    pattern: /^(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$|^1[3-9]\d{9}$/, 
                    message: '请输入有效的手机号码' 
                  }
                ]}
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱地址"
                rules={[
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input placeholder="请输入邮箱地址" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="licenseNumber"
                label="驾驶证号"
                rules={[{ required: true, message: '请输入驾驶证号' }]}
              >
                <Input placeholder="请输入驾驶证号" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="vehicleType"
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
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态">
                  <Option value="active">可用</Option>
                  <Option value="busy">忙碌</Option>
                  <Option value="offline">离线</Option>
                  <Option value="inactive">停用</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 司机详情查看 */}
      <Modal
        title="司机详情"
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {viewingDriver && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>司机姓名：</Text>
                <div>{viewingDriver.name}</div>
              </Col>
              <Col span={12}>
                <Text strong>联系电话：</Text>
                <div>{viewingDriver.phone}</div>
              </Col>
            </Row>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>邮箱地址：</Text>
                <div>{viewingDriver.email}</div>
              </Col>
              <Col span={12}>
                <Text strong>驾驶证号：</Text>
                <div style={{ fontFamily: 'monospace' }}>{viewingDriver.licenseNumber}</div>
              </Col>
            </Row>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>车辆类型：</Text>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <CarOutlined style={{ marginRight: 4, color: '#52c41a' }} />
                  {viewingDriver.vehicleType}
                </div>
              </Col>
              <Col span={12}>
                <Text strong>状态：</Text>
                <div>{getStatusTag(viewingDriver.status || 'active')}</div>
              </Col>
            </Row>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>创建时间：</Text>
                <div>{new Date(viewingDriver.createdAt).toLocaleString()}</div>
              </Col>
              <Col span={12}>
                <Text strong>更新时间：</Text>
                <div>{new Date(viewingDriver.updatedAt).toLocaleString()}</div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DriverManagement;
