import React, { useState, useEffect } from 'react';
import { Button, Card, Table, Typography, message, Tag, Space, Tooltip, Modal, Form, Input, Select } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { customersApi } from '../../services/api';
import { Customer } from '../../types';

const { Title } = Typography;

const CustomerManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
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

  const handleConfirmAdd = async () => {
    try {
      const values = await form.validateFields();
      await customersApi.createCustomer(values);
      message.success('客户添加成功');
      setIsAddModalVisible(false);
      form.resetFields();
      loadCustomers();
    } catch (error) {
      console.error('Failed to add customer:', error);
      message.error('添加客户失败');
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
          <Tooltip title="编辑">
            <Button type="text" icon={<EditOutlined />} />
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
            initialValue="normal"
          >
            <Select>
              <Select.Option value="normal">普通</Select.Option>
              <Select.Option value="premium">高级</Select.Option>
              <Select.Option value="vip">VIP</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerManagement;