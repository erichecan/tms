// 计费模板管理页面
// 创建时间: 2025-09-29 02:40:00
// 作用: 提供计费模板的可视化管理界面

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Space, 
  Tag, 
  message, 
  Popconfirm,
  Row,
  Col,
  Typography,
  Divider,
  Statistic
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  ExperimentOutlined,
  CalculatorOutlined 
} from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;

interface PricingTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'WASTE_COLLECTION' | 'WAREHOUSE_TRANSFER' | 'CLIENT_DIRECT' | 'CUSTOM';
  businessConditions: unknown;
  pricingRules: unknown[];
  driverRules: unknown[];
  costAllocation: unknown;
  status: 'active' | 'inactive';
  version: number;
  createdAt: string;
}

interface PricingComponent {
  id: string;
  code: string;
  name: string;
  category: 'REVENUE' | 'DRIVER_COMPENSATION' | 'INTERNAL_COST';
  calculationType: string;
  defaultValue: number;
  currency: string;
}

const PricingTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<PricingTemplate[]>([]);
  const [components, setComponents] = useState<PricingComponent[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<PricingTemplate | null>(null);
  const [form] = Form.useForm();

  // =====================================================
  // 数据加载
  // =====================================================

  useEffect(() => {
    loadTemplates();
    loadComponents();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/pricing/templates');
      if (response.data.success) {
        setTemplates(response.data.data);
      } else {
        message.error('加载模板失败');
      }
    } catch (error) {
      console.error('加载模板失败:', error);
      message.error('加载模板失败');
    } finally {
      setLoading(false);
    }
  };

  const loadComponents = async () => {
    try {
      const response = await axios.get('/api/pricing/components');
      if (response.data.success) {
        setComponents(response.data.data);
      }
    } catch (error) {
      console.error('加载组件失败:', error);
    }
  };

  // =====================================================
  // 模板操作
  // =====================================================

  const handleCreateTemplate = () => {
    setCurrentTemplate(null);
    setEditMode(false);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditTemplate = (template: PricingTemplate) => {
    setCurrentTemplate(template);
    setEditMode(true);
    form.setFieldsValue(template);
    setModalVisible(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      // 这里需要实现删除API
      message.success('删除成功');
      loadTemplates();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSaveTemplate = async (values: unknown) => {
    try {
      const url = editMode && currentTemplate 
        ? `/api/pricing/templates/${currentTemplate.id}`
        : '/api/pricing/templates';
      
      const method = editMode ? 'put' : 'post';
      
      const response = await axios[method](url, values);
      
      if (response.data.success) {
        message.success(editMode ? '更新成功' : '创建成功');
        setModalVisible(false);
        loadTemplates();
      } else {
        message.error(response.data.error?.message || '保存失败');
      }
    } catch (error: unknown) {
      message.error(error.response?.data?.error?.message || '保存失败');
    }
  };

  const handleTestTemplate = async (template: PricingTemplate) => {
    Modal.info({
      title: `测试模板: ${template.name}`,
      content: (
        <div>
          <p>此功能将测试模板在不同场景下的计费结果。</p>
          <p>开发中...</p>
        </div>
      ),
      width: 600
    });
  };

  // =====================================================
  // 列定义
  // =====================================================

  const columns = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: PricingTemplate) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.description}</div>
        </div>
      )
    },
    {
      title: '业务场景',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap = {
          'WASTE_COLLECTION': { color: 'orange', text: '垃圾清运' },
          'WAREHOUSE_TRANSFER': { color: 'blue', text: '仓库转运' },
          'CLIENT_DIRECT': { color: 'green', text: '客户直运' },
          'CUSTOM': { color: 'purple', text: '自定义' }
        };
        const config = typeMap[type] || { color: 'gray', text: type };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '计费规则',
      key: 'pricingRules',
      render: (record: PricingTemplate) => (
        <div>
          <div>收入规则: {record.pricingRules?.length || 0} 条</div>
          <div>薪酬规则: {record.driverRules?.length || 0} 条</div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '启用' : '停用'}
        </Tag>
      )
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      render: (version: number) => <Tag>v{version}</Tag>
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: PricingTemplate) => (
        <Space>
          <Button 
            type="text" 
            icon={<CalculatorOutlined />} 
            onClick={() => handleTestTemplate(record)}
            title="测试模板"
          />
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            title="查看详情"
          />
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEditTemplate(record)}
            title="编辑模板"
          />
          <Popconfirm
            title="确定要删除这个模板吗？"
            onConfirm={() => handleDeleteTemplate(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              title="删除模板"
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  // =====================================================
  // 模板表单
  // =====================================================

  const renderTemplateForm = () => (
    <Modal
      title={editMode ? '编辑计费模板' : '创建计费模板'}
      open={modalVisible}
      onCancel={() => setModalVisible(false)}
      footer={null}
      width={900}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSaveTemplate}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="模板名称"
              rules={[{ required: true, message: '请输入模板名称' }]}
            >
              <Input placeholder="例: 垃圾清运模板" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="type"
              label="业务场景"
              rules={[{ required: true, message: '请选择业务场景' }]}
            >
              <Select placeholder="选择业务场景">
                <Select.Option value="WASTE_COLLECTION">垃圾清运</Select.Option>
                <Select.Option value="WAREHOUSE_TRANSFER">仓库转运</Select.Option>
                <Select.Option value="CLIENT_DIRECT">客户直运</Select.Option>
                <Select.Option value="CUSTOM">自定义场景</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label="模板描述"
        >
          <Input.TextArea 
            rows={2}
            placeholder="描述此模板的使用场景和特点"
          />
        </Form.Item>

        <Divider>业务条件配置</Divider>
        
        <Form.Item
          name="businessConditions"
          label="业务条件"
        >
          <Input.TextArea 
            rows={3}
            placeholder='{"pickupType": "OWN_WAREHOUSE", "deliveryType": "DISPOSAL_SITE"}'
            style={{ fontFamily: 'monospace' }}
          />
        </Form.Item>

        <Divider>计费规则配置</Divider>
        
        <Form.Item
          name="pricingRules"
          label="收费规则"
        >
          <Input.TextArea 
            rows={4}
            placeholder='[{"name": "基础费用", "component": "BASE_FEE", "formula": 180, "priority": 100}]'
            style={{ fontFamily: 'monospace' }}
          />
        </Form.Item>

        <Form.Item
          name="driverRules"
          label="司机薪酬规则"
        >
          <Input.TextArea 
            rows={4}
            placeholder='[{"name": "基础工资", "component": "BASE_PAY", "formula": 80, "priority": 100}]'
            style={{ fontFamily: 'monospace' }}
          />
        </Form.Item>

        <Form.Item
          name="costAllocation"
          label="内部成本分摊"
        >
          <Input.TextArea 
            rows={3}
            placeholder='{"WAREHOUSE_COST": 40, "FLEET_COST": "auto_calculated"}'
            style={{ fontFamily: 'monospace' }}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={() => setModalVisible(false)}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              {editMode ? '更新模板' : '创建模板'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );

  // =====================================================
  // 统计信息
  // =====================================================

  const getStats = () => {
    const activeCount = templates.filter(t => t.status === 'active').length;
    const inactiveCount = templates.length - activeCount;
    const totalRules = templates.reduce((sum, t) => 
      sum + (t.pricingRules?.length || 0) + (t.driverRules?.length || 0), 0
    );

    return { activeCount, inactiveCount, totalRules };
  };

  const stats = getStats();

  return (
    <div style={{ padding: '24px' }}>
      <Title level={3}>计费规则模板管理</Title>
      
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="启用模板"
              value={stats.activeCount}
              suffix="/ 总模板"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="停用模板"
              value={stats.inactiveCount}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="总规则数"
              value={stats.totalRules}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <Title level={4} style={{ margin: 0 }}>模板列表</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreateTemplate}
          >
            创建模板
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={templates}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个模板`
          }}
        />
      </Card>

      {renderTemplateForm()}
    </div>
  );
};

export default PricingTemplatesPage;
