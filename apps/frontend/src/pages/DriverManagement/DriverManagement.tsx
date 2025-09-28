import React, { useState, useEffect } from 'react';
import { Button, Card, Table, Typography, message, Tag, Space, Tooltip, Modal, Form, Input, Select } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { driversApi } from '../../services/api';
import { Driver } from '../../types';

const { Title } = Typography;

const DriverManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const response = await driversApi.getDrivers();
      setDrivers(response.data.data || []);
    } catch (error) {
      console.error('Failed to load drivers:', error);
      message.error('加载司机失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await driversApi.deleteDriver(id);
      message.success('删除成功');
      loadDrivers();
    } catch (error) {
      console.error('Failed to delete driver:', error);
      message.error('删除司机失败');
    }
  };

  const handleAddDriver = () => {
    setIsAddModalVisible(true);
    form.resetFields();
  };

  const handleConfirmAdd = async () => {
    try {
      const values = await form.validateFields();
      
      // 转换表单数据为后端API期望的格式
      const driverData = {
        name: values.name,
        phone: values.phone,
        licenseNumber: values.licenseNumber,
        vehicleInfo: {
          type: values.vehicleType,
          licensePlate: values.licensePlate || 'TEMP001', // 临时车牌号
          capacity: values.capacity || 1000, // 默认载重
          dimensions: {
            length: values.length || 4,
            width: values.width || 2,
            height: values.height || 2
          }
        }
      };
      
      await driversApi.createDriver(driverData);
      message.success('司机添加成功');
      setIsAddModalVisible(false);
      form.resetFields();
      loadDrivers();
    } catch (error) {
      console.error('Failed to add driver:', error);
      message.error('添加司机失败');
    }
  };

  const columns = [
    {
      title: '司机姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '驾照号',
      dataIndex: 'licenseNumber',
      key: 'licenseNumber',
    },
    {
      title: '车辆类型',
      dataIndex: ['vehicleInfo', 'type'],
      key: 'vehicleType',
      render: (type: string) => (
        <Tag color="blue">{type}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '活跃' : '非活跃'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Driver) => (
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
    <div style={{ padding: '24px', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3}>司机管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddDriver}>
          新增司机
        </Button>
      </div>
      
      <Card>
        <Table
          columns={columns}
          dataSource={drivers}
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

      {/* 新增司机弹窗 */}
      <Modal
        title="新增司机"
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
            label="司机姓名"
            rules={[{ required: true, message: '请输入司机姓名' }]}
          >
            <Input placeholder="请输入司机姓名" />
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
            name="licenseNumber"
            label="驾照号"
            rules={[{ required: true, message: '请输入驾照号' }]}
          >
            <Input placeholder="请输入驾照号" />
          </Form.Item>
          
          <Form.Item
            name="vehicleType"
            label="车辆类型"
            rules={[{ required: true, message: '请选择车辆类型' }]}
          >
            <Select placeholder="请选择车辆类型">
              <Select.Option value="小型货车">小型货车</Select.Option>
              <Select.Option value="中型货车">中型货车</Select.Option>
              <Select.Option value="大型货车">大型货车</Select.Option>
              <Select.Option value="厢式货车">厢式货车</Select.Option>
              <Select.Option value="冷藏车">冷藏车</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="status"
            label="状态"
            initialValue="active"
          >
            <Select>
              <Select.Option value="active">活跃</Select.Option>
              <Select.Option value="inactive">非活跃</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DriverManagement;