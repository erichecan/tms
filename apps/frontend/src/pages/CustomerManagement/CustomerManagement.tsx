import React, { useState, useEffect } from 'react';
import { Button, Card, Table, Typography, message, Tag, Space, Tooltip, Modal, Form, Input, Select, Tabs } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, HistoryOutlined } from '@ant-design/icons';
import { customersApi, shipmentsApi } from '../../services/api';
import { Customer, Shipment } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';

const { Title } = Typography;

const CustomerManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerShipments, setCustomerShipments] = useState<Shipment[]>([]);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await customersApi.getCustomers();
      setCustomers(response.data.data || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
      message.error('加载客户失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await customersApi.deleteCustomer(id);
      message.success('删除成功');
      loadCustomers();
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
      email: customer.contactInfo?.email,
      phone: customer.contactInfo?.phone,
      address: customer.contactInfo?.address?.street,
      level: customer.level
    });
  };

  const handleViewHistory = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsHistoryModalVisible(true);
    await loadCustomerShipments(customer.id);
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
            street: values.address || '测试街道',
            city: '测试城市',
            state: '测试省份',
            postalCode: '100000',
            country: '中国'
          }
        },
        billingInfo: {
          companyName: values.name,
          taxId: 'TEST001',
          billingAddress: {
            street: values.address || '测试街道',
            city: '测试城市',
            state: '测试省份',
            postalCode: '100000',
            country: '中国'
          }
        }
      };
      
      await customersApi.createCustomer(customerData);
      message.success('客户添加成功');
      setIsAddModalVisible(false);
      form.resetFields();
      loadCustomers();
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
            street: values.address || '测试街道',
            city: '测试城市',
            state: '测试省份',
            postalCode: '100000',
            country: '中国'
          }
        },
        billingInfo: {
          companyName: values.name,
          taxId: 'TEST001',
          billingAddress: {
            street: values.address || '测试街道',
            city: '测试城市',
            state: '测试省份',
            postalCode: '100000',
            country: '中国'
          }
        }
      };
      
      await customersApi.updateCustomer(editingCustomer.id, customerData);
      message.success('客户更新成功');
      setIsEditModalVisible(false);
      setEditingCustomer(null);
      form.resetFields();
      loadCustomers();
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
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => (
        <Tag color={level === 'vip' ? 'gold' : level === 'premium' ? 'purple' : 'blue'}>
          {level === 'vip' ? 'VIP' : level === 'premium' ? '高级' : '普通'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Customer) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="text" icon={<EyeOutlined />} />
          </Tooltip>
          <Tooltip title="运单历史">
            <Button 
              type="text" 
              icon={<HistoryOutlined />} 
              onClick={() => handleViewHistory(record)}
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
      
      <Card>
        <Table
          columns={columns}
          dataSource={customers}
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

      {/* 新增客户弹窗 */}
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
            initialValue="standard"
          >
            <Select>
              <Select.Option value="standard">普通</Select.Option>
              <Select.Option value="premium">高级</Select.Option>
              <Select.Option value="vip">VIP</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑客户模态框 */}
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
            initialValue="standard"
          >
            <Select>
              <Select.Option value="standard">普通</Select.Option>
              <Select.Option value="premium">高级</Select.Option>
              <Select.Option value="vip">VIP</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 运单历史模态框 */}
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
              render: (text: string, record: Shipment) => 
                record.pickupAddress ? `${record.pickupAddress.city} ${record.pickupAddress.street}` : '-',
            },
            {
              title: '收货地址',
              dataIndex: ['deliveryAddress', 'street'],
              key: 'deliveryAddress',
              width: 150,
              render: (text: string, record: Shipment) => 
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
              render: (date: string) => new Date(date).toLocaleString('zh-CN'),
            },
            {
              title: '操作',
              key: 'action',
              width: 100,
              render: (_: any, record: Shipment) => (
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
    </div>
  );
};

export default CustomerManagement;