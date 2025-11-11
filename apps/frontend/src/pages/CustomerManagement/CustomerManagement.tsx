import React, { useState, useEffect } from 'react';
import { Button, Card, Table, Typography, message, Tag, Space, Tooltip, Modal, Form, Input, Select, Row, Col, Divider, Statistic } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, HistoryOutlined, DollarOutlined, EnvironmentOutlined, DownloadOutlined } from '@ant-design/icons';
import { customersApi, shipmentsApi } from '../../services/api';
import { useCustomers } from '../../hooks'; // 2025-10-31 10:01:00 使用统一的数据管理 Hook
import { Customer, Shipment, ShipmentAddress } from '../../types';
import PageLayout from '../../components/Layout/PageLayout'; // 2025-09-29 13:40:00 恢复PageLayout导入，与创建运单页面保持一致
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateTime } from '../../utils/timeUtils'; // 2025-10-02 16:38:00 引入时间格式化工具

const { Title } = Typography;

const CustomerManagement: React.FC = () => {
  // 2025-10-31 10:01:00 使用统一的数据管理 Hook
  const { customers, loading, reload: reloadCustomers } = useCustomers();
  
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isFinanceModalVisible, setIsFinanceModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerShipments, setCustomerShipments] = useState<Shipment[]>([]);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);
  const [form] = Form.useForm();

  const handleDelete = async (id: string) => {
    try {
      await customersApi.deleteCustomer(id);
      message.success('删除成功');
      reloadCustomers(); // 2025-11-11 10:15:05 修复：调用正确的刷新方法
    } catch (error) {
      console.error('Failed to delete customer:', error);
      message.error('删除客户失败');
    }
  };

  const handleAddCustomer = () => {
    setIsAddModalVisible(true);
    form.resetFields();
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsEditModalVisible(true);
    
    // 填充表单数据
    form.setFieldsValue({
      name: customer.name,
      email: customer.contactInfo.email, // 2025-09-27 03:15:00 修复数据结构
      phone: customer.contactInfo.phone,
      address: customer.contactInfo.address.street,
      level: customer.level
    });
  };

  const handleViewHistory = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsHistoryModalVisible(true);
    await loadCustomerShipments(customer.id);
  };

  const handleViewDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailModalVisible(true);
  };

  const handleViewFinance = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsFinanceModalVisible(true);
  };

  const handleCreateShipment = (customer: Customer) => {
    // 跳转到创建运单页面，并传递客户信息
    window.location.href = `/create-shipment?customerId=${customer.id}`;
  };

  const loadCustomerShipments = async (customerId: string) => {
    try {
      setShipmentsLoading(true);
      const response = await shipmentsApi.getShipments({ customerId });
      setCustomerShipments(response.data.data || []);
    } catch (error) {
      console.error('Failed to load customer shipments:', error);
      message.error('加载运单历史失败');
    } finally {
      setShipmentsLoading(false);
    }
  };

  const handleConfirmAdd = async () => {
    try {
      const values = await form.validateFields();
      
      // 转换表单数据为后端API期望的格式
      const customerData = {
        name: values.name,
        level: values.level,
        contactInfo: {
          email: values.email,
          phone: values.phone,
          address: {
            street: values.pickupAddressLine1 || '测试街道',
            city: values.pickupCity || '测试城市',
            state: values.pickupProvince || '测试省份',
            postalCode: values.pickupPostalCode || '100000',
            country: values.pickupCountry || '中国'
          }
        },
        billingInfo: {
          companyName: values.name,
          taxId: 'TEST001',
          billingAddress: {
            street: values.pickupAddressLine1 || '测试街道',
            city: values.pickupCity || '测试城市',
            state: values.pickupProvince || '测试省份',
            postalCode: values.pickupPostalCode || '100000',
            country: values.pickupCountry || '中国'
          }
        }
      };
      
      await customersApi.createCustomer(customerData);
      message.success('客户添加成功');
      setIsAddModalVisible(false);
      form.resetFields();
      reloadCustomers();
    } catch (error) {
      console.error('Failed to add customer:', error);
      message.error('添加客户失败');
    }
  };

  const handleConfirmEdit = async () => {
    try {
      const values = await form.validateFields();
      
      if (!editingCustomer) return;
      
      // 转换表单数据为后端API期望的格式
      const customerData = {
        name: values.name,
        level: values.level,
        contactInfo: {
          email: values.email,
          phone: values.phone,
          address: {
            street: values.pickupAddressLine1 || '测试街道',
            city: values.pickupCity || '测试城市',
            state: values.pickupProvince || '测试省份',
            postalCode: values.pickupPostalCode || '100000',
            country: values.pickupCountry || '中国'
          }
        },
        billingInfo: {
          companyName: values.name,
          taxId: 'TEST001',
          billingAddress: {
            street: values.pickupAddressLine1 || '测试街道',
            city: values.pickupCity || '测试城市',
            state: values.pickupProvince || '测试省份',
            postalCode: values.pickupPostalCode || '100000',
            country: values.pickupCountry || '中国'
          }
        }
      };
      
      await customersApi.updateCustomer(editingCustomer.id, customerData);
      message.success('客户更新成功');
      setIsEditModalVisible(false);
      setEditingCustomer(null);
      form.resetFields();
      reloadCustomers();
    } catch (error) {
      console.error('Failed to update customer:', error);
      message.error('更新客户失败');
    }
  };

  const columns = [
    {
      title: '客户姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '客户等级',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: string) => {
        const normalized = (level || '').toLowerCase();
        const text =
          normalized === 'vip1' ? 'VIP1' :
          normalized === 'vip2' ? 'VIP2' :
          normalized === 'vip3' ? 'VIP3' :
          normalized === 'vip4' ? 'VIP4' :
          normalized === 'vip5' ? 'VIP5' : 'VIP1';
        return <Tag color="purple">{text}</Tag>;
      },
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '默认取货地址',
      dataIndex: 'defaultPickupAddress',
      key: 'defaultPickupAddress',
      render: (address: ShipmentAddress) => 
        address ? `${address.city} ${address.addressLine1}` : '-',
    },
    {
      title: '默认送货地址',
      dataIndex: 'defaultDeliveryAddress',
      key: 'defaultDeliveryAddress',
      render: (address: ShipmentAddress) => 
        address ? `${address.city} ${address.addressLine1}` : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Customer) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="运单历史">
            <Button 
              type="text" 
              icon={<HistoryOutlined />} 
              onClick={() => handleViewHistory(record)}
            />
          </Tooltip>
          <Tooltip title="财务记录">
            <Button 
              type="text" 
              icon={<DollarOutlined />} 
              onClick={() => handleViewFinance(record)}
            />
          </Tooltip>
          <Tooltip title="快速创建运单">
            <Button 
              type="text" 
              icon={<PlusOutlined />} 
              onClick={() => handleCreateShipment(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEditCustomer(record)}
            />
          </Tooltip>
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
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3}>客户管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCustomer}>
          新增客户
        </Button>
      </div>

      
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Input.Search
              placeholder="搜索客户姓名、电话、邮箱"
              onSearch={(value) => {
                // TODO: 实现客户搜索功能
                console.log('搜索客户:', value);
              }}
              enterButton
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="筛选状态"
              style={{ width: '100%' }}
              allowClear
              onChange={(value) => {
                // TODO: 实现客户状态筛选
                console.log('筛选状态:', value);
              }}
            >
              <Select.Option value="active">活跃客户</Select.Option>
              <Select.Option value="inactive">非活跃客户</Select.Option>
            </Select>
          </Col>
          <Col span={6}>
            <Select
              placeholder="排序方式"
              style={{ width: '100%' }}
              defaultValue="name_asc"
              onChange={(value) => {
                // TODO: 实现客户排序
                console.log('排序方式:', value);
              }}
            >
              <Select.Option value="name_asc">姓名升序</Select.Option>
              <Select.Option value="name_desc">姓名降序</Select.Option>
              <Select.Option value="created_desc">创建时间降序</Select.Option>
              <Select.Option value="created_asc">创建时间升序</Select.Option>
            </Select>
          </Col>
        </Row>
      </Card>
      
      <Card style={{ width: '100%' }}>
        <Table
          columns={columns}
          dataSource={customers}
          rowKey="id"
          loading={loading}
          scroll={{ x: 800 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
            pageSizeOptions: ['10', '20', '50', '100'],
            defaultPageSize: 20,
            showLessItems: false,
          }}
        />
      </Card>

      
      <Modal
        title="新增客户"
        open={isAddModalVisible}
        onOk={handleConfirmAdd}
        onCancel={() => {
          setIsAddModalVisible(false);
          form.resetFields();
        }}
        okText="确认"
        cancelText="取消"
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="客户姓名"
            rules={[{ required: true, message: '请输入客户姓名' }]}
          >
            <Input placeholder="请输入客户姓名" />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱（可选）" />
          </Form.Item>
          
          <Form.Item
            name="phone"
            label="电话"
            rules={[{ required: true, message: '请输入电话号码' }]}
          >
            <Input placeholder="请输入电话号码" />
          </Form.Item>
          
          <Form.Item
            name="level"
            label="客户等级"
            initialValue="vip1"
          >
            <Select>
              <Select.Option value="vip1">VIP1</Select.Option>
              <Select.Option value="vip2">VIP2</Select.Option>
              <Select.Option value="vip3">VIP3</Select.Option>
              <Select.Option value="vip4">VIP4</Select.Option>
              <Select.Option value="vip5">VIP5</Select.Option>
            </Select>
          </Form.Item>
          
          <Divider>默认地址设置</Divider>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="pickupCountry"
                label="取货地址-国家"
                initialValue="中国"
              >
                <Input placeholder="国家" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="pickupProvince"
                label="取货地址-省份"
              >
                <Input placeholder="省份" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="pickupCity"
                label="取货地址-城市"
              >
                <Input placeholder="城市" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="pickupPostalCode"
                label="取货地址-邮编"
              >
                <Input placeholder="邮编" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="pickupAddressLine1"
            label="取货地址-详细地址"
          >
            <Input placeholder="详细地址" />
          </Form.Item>
          
          <Form.Item
            name="pickupIsResidential"
            label="取货地址类型"
            valuePropName="checked"
          >
            <input type="checkbox" /> 住宅地址
          </Form.Item>
        </Form>
      </Modal>

      
      <Modal
        title="编辑客户"
        open={isEditModalVisible}
        onOk={handleConfirmEdit}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingCustomer(null);
          form.resetFields();
        }}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="客户姓名"
            rules={[{ required: true, message: '请输入客户姓名' }]}
          >
            <Input placeholder="请输入客户姓名" />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          
          <Form.Item
            name="phone"
            label="电话"
            rules={[{ required: true, message: '请输入电话号码' }]}
          >
            <Input placeholder="请输入电话号码" />
          </Form.Item>
          
          <Form.Item
            name="address"
            label="地址"
            rules={[{ required: true, message: '请输入地址' }]}
          >
            <Input placeholder="请输入地址" />
          </Form.Item>
          
          <Form.Item
            name="level"
            label="客户等级"
            initialValue="vip1"
          >
            <Select>
              <Select.Option value="vip1">VIP1</Select.Option>
              <Select.Option value="vip2">VIP2</Select.Option>
              <Select.Option value="vip3">VIP3</Select.Option>
              <Select.Option value="vip4">VIP4</Select.Option>
              <Select.Option value="vip5">VIP5</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      
      <Modal
        title={`${selectedCustomer?.name} - 运单历史`}
        open={isHistoryModalVisible}
        onCancel={() => setIsHistoryModalVisible(false)}
        footer={null}
        width={1200}
        destroyOnHidden
      >
        <Table
          dataSource={customerShipments}
          loading={shipmentsLoading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          columns={[
            {
              title: '运单号',
              dataIndex: 'shipmentNumber',
              key: 'shipmentNumber',
              width: 120,
            },
            {
              title: '状态',
              dataIndex: 'status',
              key: 'status',
              width: 100,
              render: (status: string) => {
                const statusMap: { [key: string]: { color: string; text: string } } = {
                  'pending': { color: 'orange', text: '待处理' },
                  'quoted': { color: 'blue', text: '已报价' },
                  'confirmed': { color: 'green', text: '已确认' },
                  'assigned': { color: 'purple', text: '已分配' },
                  'picked_up': { color: 'cyan', text: '已取货' },
                  'in_transit': { color: 'blue', text: '运输中' },
                  'delivered': { color: 'green', text: '已送达' },
                  'completed': { color: 'green', text: '已完成' },
                  'cancelled': { color: 'red', text: '已取消' },
                };
                const statusInfo = statusMap[status] || { color: 'default', text: status };
                return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
              },
            },
            {
              title: '发货地址',
              dataIndex: ['pickupAddress', 'street'],
              key: 'pickupAddress',
              width: 150,
              render: (_text: string, record: Shipment) => // 2025-09-26 22:35:00 修复未使用参数
                record.pickupAddress ? `${record.pickupAddress.city} ${record.pickupAddress.street}` : '-',
            },
            {
              title: '收货地址',
              dataIndex: ['deliveryAddress', 'street'],
              key: 'deliveryAddress',
              width: 150,
              render: (_text: string, record: Shipment) => // 2025-09-26 22:35:00 修复未使用参数
                record.deliveryAddress ? `${record.deliveryAddress.city} ${record.deliveryAddress.street}` : '-',
            },
            {
              title: '货物重量',
              dataIndex: 'weight',
              key: 'weight',
              width: 100,
              render: (weight: number) => `${weight}kg`,
            },
            {
              title: '预计费用',
              dataIndex: 'estimatedCost',
              key: 'estimatedCost',
              width: 120,
              render: (cost: number) => formatCurrency(cost),
            },
            {
              title: '创建时间',
              dataIndex: 'createdAt',
              key: 'createdAt',
              width: 150,
              render: (date: string) => formatDateTime(date),
            },
            {
              title: '操作',
              key: 'action',
              width: 100,
              render: (_: unknown, _record: Shipment) => ( // 2025-09-26 22:35:00 修复未使用参数
                <Space size="small">
                  <Tooltip title="查看详情">
                    <Button type="text" icon={<EyeOutlined />} size="small" />
                  </Tooltip>
                </Space>
              ),
            },
          ]}
        />
      </Modal>

      
      <Modal
        title={`${selectedCustomer?.name} - 客户详情`}
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedCustomer && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small" title="基本信息">
                  <p><strong>姓名:</strong> {selectedCustomer.name}</p>
                  <p><strong>电话:</strong> {selectedCustomer.phone}</p>
                  <p><strong>邮箱:</strong> {selectedCustomer.email || '-'}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="默认地址">
                  <p><strong>取货地址:</strong></p>
                  {selectedCustomer.defaultPickupAddress ? (
                    <p style={{ marginLeft: 16, fontSize: '12px' }}>
                      {selectedCustomer.defaultPickupAddress.country} {selectedCustomer.defaultPickupAddress.province} {selectedCustomer.defaultPickupAddress.city}<br/>
                      {selectedCustomer.defaultPickupAddress.addressLine1}
                    </p>
                  ) : (
                    <p style={{ marginLeft: 16, color: '#999' }}>未设置</p>
                  )}
                  <p><strong>送货地址:</strong></p>
                  {selectedCustomer.defaultDeliveryAddress ? (
                    <p style={{ marginLeft: 16, fontSize: '12px' }}>
                      {selectedCustomer.defaultDeliveryAddress.country} {selectedCustomer.defaultDeliveryAddress.province} {selectedCustomer.defaultDeliveryAddress.city}<br/>
                      {selectedCustomer.defaultDeliveryAddress.addressLine1}
                    </p>
                  ) : (
                    <p style={{ marginLeft: 16, color: '#999' }}>未设置</p>
                  )}
                </Card>
              </Col>
            </Row>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Space>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => handleCreateShipment(selectedCustomer)}
                >
                  快速创建运单
                </Button>
                <Button 
                  icon={<HistoryOutlined />}
                  onClick={() => {
                    setIsDetailModalVisible(false);
                    handleViewHistory(selectedCustomer);
                  }}
                >
                  查看运单历史
                </Button>
                <Button 
                  icon={<DollarOutlined />}
                  onClick={() => {
                    setIsDetailModalVisible(false);
                    handleViewFinance(selectedCustomer);
                  }}
                >
                  查看财务记录
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>

      
      <Modal
        title={`${selectedCustomer?.name} - 财务记录详情`}
        open={isFinanceModalVisible}
        onCancel={() => setIsFinanceModalVisible(false)}
        footer={null}
        width={1200}
      >
        <div>
          
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="总应收"
                  value={12500}
                  prefix="$"
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="已收款"
                  value={11800}
                  prefix="$"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="未收款"
                  value={700}
                  prefix="$"
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="回款率"
                  value={94.4}
                  suffix="%"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

          
          <Card title="财务记录明细" size="small">
            <Table
              dataSource={[
                {
                  id: 'F001',
                  type: 'receivable',
                  amount: 2500,
                  status: 'paid',
                  dueDate: '2025-09-15',
                  paidDate: '2025-09-14',
                  description: '运单 SHIP-20250915-001 运费',
                  shipmentNo: 'SHIP-20250915-001',
                },
                {
                  id: 'F002',
                  type: 'receivable',
                  amount: 3200,
                  status: 'paid',
                  dueDate: '2025-09-20',
                  paidDate: '2025-09-18',
                  description: '运单 SHIP-20250920-002 运费',
                  shipmentNo: 'SHIP-20250920-002',
                },
                {
                  id: 'F003',
                  type: 'receivable',
                  amount: 1800,
                  status: 'paid',
                  dueDate: '2025-09-25',
                  paidDate: '2025-09-23',
                  description: '运单 SHIP-20250925-003 运费',
                  shipmentNo: 'SHIP-20250925-003',
                },
                {
                  id: 'F004',
                  type: 'receivable',
                  amount: 1500,
                  status: 'paid',
                  dueDate: '2025-09-28',
                  paidDate: '2025-09-27',
                  description: '运单 SHIP-20250928-004 运费',
                  shipmentNo: 'SHIP-20250928-004',
                },
                {
                  id: 'F005',
                  type: 'receivable',
                  amount: 2800,
                  status: 'paid',
                  dueDate: '2025-09-30',
                  paidDate: '2025-09-29',
                  description: '运单 SHIP-20250930-005 运费',
                  shipmentNo: 'SHIP-20250930-005',
                },
                {
                  id: 'F006',
                  type: 'receivable',
                  amount: 700,
                  status: 'pending',
                  dueDate: '2025-10-05',
                  paidDate: null,
                  description: '运单 SHIP-20251005-006 运费',
                  shipmentNo: 'SHIP-20251005-006',
                },
              ]}
              columns={[
                {
                  title: '记录类型',
                  dataIndex: 'type',
                  key: 'type',
                  width: 100,
                  render: (type: string) => (
                    <Tag color={type === 'receivable' ? 'blue' : 'green'}>
                      {type === 'receivable' ? '应收' : '应付'}
                    </Tag>
                  ),
                },
                {
                  title: '金额',
                  dataIndex: 'amount',
                  key: 'amount',
                  width: 100,
                  render: (amount: number) => `$${amount.toLocaleString()}`,
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  key: 'status',
                  width: 100,
                  render: (status: string) => (
                    <Tag color={status === 'paid' ? 'green' : 'orange'}>
                      {status === 'paid' ? '已收款' : '待收款'}
                    </Tag>
                  ),
                },
                {
                  title: '到期日期',
                  dataIndex: 'dueDate',
                  key: 'dueDate',
                  width: 100,
                },
                {
                  title: '收款日期',
                  dataIndex: 'paidDate',
                  key: 'paidDate',
                  width: 100,
                  render: (date: string | null) => date || '-',
                },
                {
                  title: '运单号',
                  dataIndex: 'shipmentNo',
                  key: 'shipmentNo',
                  width: 150,
                  render: (shipmentNo: string) => (
                    <Button type="link" size="small">
                      {shipmentNo}
                    </Button>
                  ),
                },
                {
                  title: '描述',
                  dataIndex: 'description',
                  key: 'description',
                },
                {
                  title: '操作',
                  key: 'action',
                  width: 100,
                  render: (_, record) => (
                    <Space size="small">
                      <Button type="link" size="small" icon={<EyeOutlined />}>
                        详情
                      </Button>
                      {record.status === 'pending' && (
                        <Button type="link" size="small" danger>
                          催收
                        </Button>
                      )}
                    </Space>
                  ),
                },
              ]}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </Card>

          
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Space>
              <Button icon={<DownloadOutlined />}>
                导出财务记录
              </Button>
              <Button type="primary" icon={<DollarOutlined />}>
                创建收款记录
              </Button>
            </Space>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerManagement;