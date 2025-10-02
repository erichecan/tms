// 货币管理页面
// 创建时间: 2025-09-26 17:45:00

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Typography, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  Select, 
  InputNumber,
  message,
  Tooltip,
  Popconfirm
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  // DollarOutlined, // 2025-09-26 22:35:00 暂时未使用
  SettingOutlined
} from '@ant-design/icons';
import { formatCurrency } from '../../utils/formatCurrency';

const { Title, Text } = Typography;

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const CurrencyManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [form] = Form.useForm();

  // 模拟数据
  const mockCurrencies: Currency[] = [
    {
      id: '1',
      code: 'CNY',
      name: '人民币',
      symbol: '$',
      exchangeRate: 1.0,
      isDefault: true,
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    },
    {
      id: '2',
      code: 'USD',
      name: '美元',
      symbol: '$',
      exchangeRate: 7.2,
      isDefault: false,
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    },
    {
      id: '3',
      code: 'EUR',
      name: '欧元',
      symbol: '€',
      exchangeRate: 7.8,
      isDefault: false,
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    },
    {
      id: '4',
      code: 'CAD',
      name: '加元',
      symbol: 'C$',
      exchangeRate: 5.3,
      isDefault: false,
      isActive: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    }
  ];

  useEffect(() => {
    loadCurrencies();
  }, []);

  const loadCurrencies = async () => {
    try {
      setLoading(true);
      // 模拟 API 调用
      setTimeout(() => {
        setCurrencies(mockCurrencies);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to load currencies:', error);
      message.error('加载货币列表失败');
      setLoading(false);
    }
  };

  const handleAddCurrency = () => {
    setIsAddModalVisible(true);
    form.resetFields();
  };

  const handleEditCurrency = (currency: Currency) => {
    setEditingCurrency(currency);
    setIsEditModalVisible(true);
    form.setFieldsValue(currency);
  };

  const handleDeleteCurrency = async (id: string) => {
    try {
      // 模拟删除
      setCurrencies(currencies.filter(c => c.id !== id));
      message.success('删除成功');
    } catch (error) {
      console.error('Failed to delete currency:', error);
      message.error('删除货币失败');
    }
  };

  const handleConfirmAdd = async () => {
    try {
      const values = await form.validateFields();
      const newCurrency: Currency = {
        id: Date.now().toString(),
        ...values,
        isDefault: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setCurrencies([...currencies, newCurrency]);
      message.success('货币添加成功');
      setIsAddModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Failed to add currency:', error);
      message.error('添加货币失败');
    }
  };

  const handleConfirmEdit = async () => {
    try {
      const values = await form.validateFields();
      const updatedCurrencies = currencies.map(c => 
        c.id === editingCurrency?.id 
          ? { ...c, ...values, updatedAt: new Date().toISOString() }
          : c
      );
      
      setCurrencies(updatedCurrencies);
      message.success('货币更新成功');
      setIsEditModalVisible(false);
      setEditingCurrency(null);
      form.resetFields();
    } catch (error) {
      console.error('Failed to update currency:', error);
      message.error('更新货币失败');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const updatedCurrencies = currencies.map(c => ({
        ...c,
        isDefault: c.id === id
      }));
      
      setCurrencies(updatedCurrencies);
      message.success('默认货币设置成功');
    } catch (error) {
      console.error('Failed to set default currency:', error);
      message.error('设置默认货币失败');
    }
  };

  const columns = [
    {
      title: '货币代码',
      dataIndex: 'code',
      key: 'code',
      render: (code: string, record: Currency) => (
        <Space>
          <Text code>{code}</Text>
          {record.isDefault && <Tag color="gold">默认</Tag>}
        </Space>
      ),
    },
    {
      title: '货币名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '符号',
      dataIndex: 'symbol',
      key: 'symbol',
      render: (symbol: string) => (
        <Text strong style={{ fontSize: '16px' }}>{symbol}</Text>
      ),
    },
    {
      title: '汇率',
      dataIndex: 'exchangeRate',
      key: 'exchangeRate',
      render: (rate: number) => (
        <Text>{formatCurrency(rate, 4, '')}</Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Currency) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEditCurrency(record)}
            />
          </Tooltip>
          {!record.isDefault && (
            <Tooltip title="设为默认">
              <Button 
                type="text" 
                icon={<SettingOutlined />} 
                onClick={() => handleSetDefault(record.id)}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="确定要删除这个货币吗？"
            onConfirm={() => handleDeleteCurrency(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button 
                type="text" 
                icon={<DeleteOutlined />} 
                danger
                disabled={record.isDefault}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3}>货币管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCurrency}>
          新增货币
        </Button>
      </div>
      
      <Card>
        <Table
          columns={columns}
          dataSource={currencies}
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

      {/* 新增货币弹窗 */}
      <Modal
        title="新增货币"
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
            name="code"
            label="货币代码"
            rules={[{ required: true, message: '请输入货币代码' }]}
          >
            <Input placeholder="如: USD, EUR, CNY" />
          </Form.Item>
          
          <Form.Item
            name="name"
            label="货币名称"
            rules={[{ required: true, message: '请输入货币名称' }]}
          >
            <Input placeholder="如: 美元, 欧元, 人民币" />
          </Form.Item>
          
          <Form.Item
            name="symbol"
            label="货币符号"
            rules={[{ required: true, message: '请输入货币符号' }]}
          >
            <Input placeholder="如: $, €, $" />
          </Form.Item>
          
          <Form.Item
            name="exchangeRate"
            label="汇率"
            rules={[{ required: true, message: '请输入汇率' }]}
          >
            <InputNumber 
              placeholder="请输入汇率" 
              min={0}
              step={0.0001}
              precision={4}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑货币弹窗 */}
      <Modal
        title="编辑货币"
        open={isEditModalVisible}
        onOk={handleConfirmEdit}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingCurrency(null);
          form.resetFields();
        }}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="货币代码"
            rules={[{ required: true, message: '请输入货币代码' }]}
          >
            <Input placeholder="如: USD, EUR, CNY" />
          </Form.Item>
          
          <Form.Item
            name="name"
            label="货币名称"
            rules={[{ required: true, message: '请输入货币名称' }]}
          >
            <Input placeholder="如: 美元, 欧元, 人民币" />
          </Form.Item>
          
          <Form.Item
            name="symbol"
            label="货币符号"
            rules={[{ required: true, message: '请输入货币符号' }]}
          >
            <Input placeholder="如: $, €, $" />
          </Form.Item>
          
          <Form.Item
            name="exchangeRate"
            label="汇率"
            rules={[{ required: true, message: '请输入汇率' }]}
          >
            <InputNumber 
              placeholder="请输入汇率" 
              min={0}
              step={0.0001}
              precision={4}
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item
            name="isActive"
            label="状态"
            valuePropName="checked"
          >
            <Select>
              <Select.Option value={true}>启用</Select.Option>
              <Select.Option value={false}>禁用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CurrencyManagement;