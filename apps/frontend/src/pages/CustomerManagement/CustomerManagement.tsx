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
  Tabs,
  Statistic,
  DatePicker,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  DollarOutlined,
  HistoryOutlined,
  StarOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { customersApi, shipmentsApi, financeApi } from '../../services/api';
import { Customer } from '../../types/index';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

interface CustomerShipment {
  id: string;
  shipmentNumber: string;
  status: string;
  estimatedCost: number;
  createdAt: string;
}

interface CustomerFinancial {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
}

const CustomerManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [customerShipments, setCustomerShipments] = useState<CustomerShipment[]>([]);
  const [customerFinancials, setCustomerFinancials] = useState<CustomerFinancial[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await customersApi.getCustomers();
      setCustomers(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
      message.error('加载客户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerShipments = async (customerId: string) => {
    try {
      const response = await shipmentsApi.getShipments({ customerId });
      setCustomerShipments(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load customer shipments:', error);
    }
  };

  const loadCustomerFinancials = async (customerId: string) => {
    try {
      const response = await financeApi.getFinancialRecords({ customerId });
      setCustomerFinancials(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load customer financials:', error);
    }
  };

  const handleCreateCustomer = () => {
    setEditingCustomer(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    form.setFieldsValue({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      level: customer.level,
      contactInfo: customer.contactInfo,
      billingInfo: customer.billingInfo,
    });
    setIsModalVisible(true);
  };

  const handleViewCustomer = async (customer: Customer) => {
    setViewingCustomer(customer);
    setIsViewModalVisible(true);
    await loadCustomerShipments(customer.id);
    await loadCustomerFinancials(customer.id);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      await customersApi.deleteCustomer(customerId);
      message.success('客户删除成功');
      loadCustomers();
    } catch (error) {
      console.error('Failed to delete customer:', error);
      message.error('删除客户失败');
    }
  };

  const handleSaveCustomer = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingCustomer) {
        await customersApi.updateCustomer(editingCustomer.id, values);
        message.success('客户信息更新成功');
      } else {
        await customersApi.createCustomer(values);
        message.success('客户创建成功');
      }
      
      setIsModalVisible(false);
      loadCustomers();
    } catch (error) {
      console.error('Failed to save customer:', error);
      message.error(editingCustomer ? '更新客户失败' : '创建客户失败');
    }
  };

  const getLevelTag = (level: string) => {
    const levelMap = {
      standard: { color: 'blue', text: '标准客户' },
      premium: { color: 'gold', text: '高级客户' },
      vip: { color: 'purple', text: 'VIP客户' },
      enterprise: { color: 'red', text: '企业客户' },
    };
    
    const config = levelMap[level as keyof typeof levelMap] || { color: 'default', text: level };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getStatusTag = (status: string) => {
    const statusMap = {
      active: { color: 'green', text: '活跃' },
      inactive: { color: 'red', text: '停用' },
      pending: { color: 'orange', text: '待审核' },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '客户信息',
      key: 'customerInfo',
      render: (_: any, record: Customer) => (
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
      render: (_: any, record: Customer) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <PhoneOutlined style={{ marginRight: 4, fontSize: '12px' }} />
            <Text style={{ fontSize: '12px' }}>{record.contactInfo?.phone || '未设置'}</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <MailOutlined style={{ marginRight: 4, fontSize: '12px' }} />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.email}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: '客户等级',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => getLevelTag(level),
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
      render: (_: any, record: Customer) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewCustomer(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditCustomer(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个客户吗？"
            description="删除后无法恢复"
            onConfirm={() => handleDeleteCustomer(record.id)}
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

  const shipmentColumns = [
    {
      title: '运单号',
      dataIndex: 'shipmentNumber',
      key: 'shipmentNumber',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '费用',
      dataIndex: 'estimatedCost',
      key: 'estimatedCost',
      render: (cost: number) => `¥${cost?.toFixed(2) || '0.00'}`,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  const financialColumns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'receivable' ? 'green' : 'blue'}>
          {type === 'receivable' ? '应收' : '应付'}
        </Tag>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount?.toFixed(2) || '0.00'}`,
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
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">客户管理</h1>
        <p className="page-description">管理客户信息和业务记录</p>
      </div>

      <Card className="content-card">
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>客户列表</Title>
            <Text type="secondary">共 {customers.length} 个客户</Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateCustomer}
          >
            添加客户
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={customers}
          rowKey="id"
          loading={loading}
          pagination={{
            total: customers.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
        />
      </Card>

      {/* 客户表单 */}
      <Modal
        title={editingCustomer ? '编辑客户' : '添加客户'}
        open={isModalVisible}
        onOk={handleSaveCustomer}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            level: 'standard',
            status: 'active',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="客户名称"
                rules={[{ required: true, message: '请输入客户名称' }]}
              >
                <Input placeholder="请输入客户名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱地址"
                rules={[
                  { required: true, message: '请输入邮箱地址' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input placeholder="请输入邮箱地址" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="level"
                label="客户等级"
                rules={[{ required: true, message: '请选择客户等级' }]}
              >
                <Select placeholder="请选择客户等级">
                  <Option value="standard">标准客户</Option>
                  <Option value="premium">高级客户</Option>
                  <Option value="vip">VIP客户</Option>
                  <Option value="enterprise">企业客户</Option>
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
                  <Option value="active">活跃</Option>
                  <Option value="inactive">停用</Option>
                  <Option value="pending">待审核</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider>联系信息</Divider>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['contactInfo', 'phone']}
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
            <Col span={12}>
              <Form.Item
                name={['contactInfo', 'address']}
                label="联系地址"
              >
                <Input placeholder="请输入联系地址" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>财务信息</Divider>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['billingInfo', 'companyName']}
                label="公司名称"
              >
                <Input placeholder="请输入公司名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={['billingInfo', 'taxId']}
                label="税号"
              >
                <Input placeholder="请输入税号" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name={['billingInfo', 'billingAddress']}
            label="账单地址"
          >
            <TextArea placeholder="请输入账单地址" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 客户详情查看 */}
      <Modal
        title="客户详情"
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={1000}
      >
        {viewingCustomer && (
          <div>
            <Tabs defaultActiveKey="basic">
              <TabPane tab="基本信息" key="basic">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Text strong>客户名称：</Text>
                    <div>{viewingCustomer.name}</div>
                  </Col>
                  <Col span={12}>
                    <Text strong>邮箱地址：</Text>
                    <div>{viewingCustomer.email}</div>
                  </Col>
                </Row>
                <Divider />
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Text strong>客户等级：</Text>
                    <div>{getLevelTag(viewingCustomer.level)}</div>
                  </Col>
                  <Col span={12}>
                    <Text strong>状态：</Text>
                    <div>{getStatusTag(viewingCustomer.status || 'active')}</div>
                  </Col>
                </Row>
                <Divider />
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Text strong>联系电话：</Text>
                    <div>{viewingCustomer.contactInfo?.phone || '未设置'}</div>
                  </Col>
                  <Col span={12}>
                    <Text strong>联系地址：</Text>
                    <div>{viewingCustomer.contactInfo?.address || '未设置'}</div>
                  </Col>
                </Row>
                <Divider />
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Text strong>创建时间：</Text>
                    <div>{new Date(viewingCustomer.createdAt).toLocaleString()}</div>
                  </Col>
                  <Col span={12}>
                    <Text strong>更新时间：</Text>
                    <div>{new Date(viewingCustomer.updatedAt).toLocaleString()}</div>
                  </Col>
                </Row>
              </TabPane>
              
              <TabPane tab="运单历史" key="shipments">
                <div style={{ marginBottom: 16 }}>
                  <Row gutter={16}>
                    <Col span={6}>
                      <Statistic
                        title="总运单数"
                        value={customerShipments.length}
                        prefix={<HistoryOutlined />}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="总费用"
                        value={customerShipments.reduce((sum, s) => sum + (s.estimatedCost || 0), 0)}
                        precision={2}
                        prefix="¥"
                        prefix={<DollarOutlined />}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="平均费用"
                        value={customerShipments.length > 0 ? customerShipments.reduce((sum, s) => sum + (s.estimatedCost || 0), 0) / customerShipments.length : 0}
                        precision={2}
                        prefix="¥"
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="客户评级"
                        value={viewingCustomer.level === 'vip' ? 5 : viewingCustomer.level === 'premium' ? 4 : 3}
                        suffix="/ 5"
                        prefix={<StarOutlined />}
                      />
                    </Col>
                  </Row>
                </div>
                <Table
                  columns={shipmentColumns}
                  dataSource={customerShipments}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 5 }}
                />
              </TabPane>
              
              <TabPane tab="财务记录" key="financials">
                <div style={{ marginBottom: 16 }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Statistic
                        title="应收总额"
                        value={customerFinancials.filter(f => f.type === 'receivable').reduce((sum, f) => sum + (f.amount || 0), 0)}
                        precision={2}
                        prefix="¥"
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="应付总额"
                        value={customerFinancials.filter(f => f.type === 'payable').reduce((sum, f) => sum + (f.amount || 0), 0)}
                        precision={2}
                        prefix="¥"
                        valueStyle={{ color: '#cf1322' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="净余额"
                        value={customerFinancials.filter(f => f.type === 'receivable').reduce((sum, f) => sum + (f.amount || 0), 0) - customerFinancials.filter(f => f.type === 'payable').reduce((sum, f) => sum + (f.amount || 0), 0)}
                        precision={2}
                        prefix="¥"
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Col>
                  </Row>
                </div>
                <Table
                  columns={financialColumns}
                  dataSource={customerFinancials}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 5 }}
                />
              </TabPane>
            </Tabs>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomerManagement;
