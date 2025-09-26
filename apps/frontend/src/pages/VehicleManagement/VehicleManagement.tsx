import React, { useState, useEffect } from 'react';
import { Button, Card, Table, Typography, message, Tag, Space, Tooltip, Modal, Form, Input, Select, InputNumber } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { vehiclesApi } from '../../services/api';

const { Title } = Typography;

interface Vehicle {
  id: string;
  plateNumber: string;
  vehicleType: string;
  capacity: number;
  status: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

const VehicleManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const response = await vehiclesApi.getVehicles();
      setVehicles(response.data.data || []);
    } catch (error) {
      console.error('Failed to load vehicles:', error);
      message.error('加载车辆失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await vehiclesApi.deleteVehicle(id);
      message.success('删除成功');
      loadVehicles();
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
      message.error('删除车辆失败');
    }
  };

  const handleAddVehicle = () => {
    setIsAddModalVisible(true);
    form.resetFields();
  };

  const handleConfirmAdd = async () => {
    try {
      const values = await form.validateFields();
      await vehiclesApi.createVehicle(values);
      message.success('车辆添加成功');
      setIsAddModalVisible(false);
      form.resetFields();
      loadVehicles();
    } catch (error) {
      console.error('Failed to add vehicle:', error);
      message.error('添加车辆失败');
    }
  };

  const columns = [
    {
      title: '车牌号',
      dataIndex: 'plateNumber',
      key: 'plateNumber',
    },
    {
      title: '车辆类型',
      dataIndex: 'vehicleType',
      key: 'vehicleType',
      render: (type: string) => (
        <Tag color="blue">{type}</Tag>
      ),
    },
    {
      title: '载重容量',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (capacity: number) => `${capacity}kg`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '可用' : '不可用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Vehicle) => (
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
        <Title level={3}>车辆管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddVehicle}>
          新增车辆
        </Button>
      </div>
      
      <Card>
        <Table
          columns={columns}
          dataSource={vehicles}
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

      {/* 新增车辆弹窗 */}
      <Modal
        title="新增车辆"
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
            name="plateNumber"
            label="车牌号"
            rules={[{ required: true, message: '请输入车牌号' }]}
          >
            <Input placeholder="请输入车牌号" />
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
              <Select.Option value="平板车">平板车</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="capacity"
            label="载重容量 (kg)"
            rules={[{ required: true, message: '请输入载重容量' }]}
          >
            <InputNumber 
              placeholder="请输入载重容量" 
              min={0}
              max={50000}
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item
            name="status"
            label="状态"
            initialValue="active"
          >
            <Select>
              <Select.Option value="active">可用</Select.Option>
              <Select.Option value="inactive">不可用</Select.Option>
              <Select.Option value="maintenance">维护中</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VehicleManagement;