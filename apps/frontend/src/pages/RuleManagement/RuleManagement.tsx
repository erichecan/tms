import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  message,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Typography,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import RuleEditor from '../../components/RuleEditor/RuleEditor';
import { rulesApi } from '../../services/api';
import { Rule, RuleType, RuleStatus } from '../../types/index';


const { Title, Text } = Typography;


const RuleManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewingRule, setViewingRule] = useState<Rule | null>(null);


  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const response = await rulesApi.getRules();
      setRules(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load rules:', error);
      message.error('加载规则失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = () => {
    setEditingRule(null);
    setIsEditorVisible(true);
  };

  const handleEditRule = (rule: Rule) => {
    setEditingRule(rule);
    setIsEditorVisible(true);
  };

  const handleViewRule = (rule: Rule) => {
    setViewingRule(rule);
    setIsViewModalVisible(true);
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await rulesApi.deleteRule(ruleId);
      message.success('规则删除成功');
      loadRules();
    } catch (error) {
      console.error('Failed to delete rule:', error);
      message.error('删除规则失败');
    }
  };

  const handleToggleStatus = async (rule: Rule) => {
    try {
      const newStatus = rule.status === RuleStatus.ACTIVE ? RuleStatus.INACTIVE : RuleStatus.ACTIVE;
      await rulesApi.updateRule(rule.id, { ...rule, status: newStatus });
      message.success(`规则已${newStatus === RuleStatus.ACTIVE ? '启用' : '禁用'}`);
      loadRules();
    } catch (error) {
      console.error('Failed to toggle rule status:', error);
      message.error('更新规则状态失败');
    }
  };

  const handleEditorSave = () => {
    setIsEditorVisible(false);
    setEditingRule(null);
    loadRules();
  };

  const handleEditorCancel = () => {
    setIsEditorVisible(false);
    setEditingRule(null);
  };

  const getRuleTypeTag = (type: RuleType) => {
    const typeMap: Record<RuleType, { color: string; text: string }> = {
      [RuleType.PRICING]: { color: 'blue', text: '计费规则' },
      [RuleType.PAYROLL]: { color: 'green', text: '薪酬规则' },
    };
    
    const typeInfo = typeMap[type] || { color: 'default', text: type };
    return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
  };

  const getStatusTag = (status: RuleStatus) => {
    const statusMap: Record<RuleStatus, { color: string; text: string; icon: React.ReactNode }> = {
      [RuleStatus.ACTIVE]: { color: 'green', text: '启用', icon: <CheckCircleOutlined /> },
      [RuleStatus.INACTIVE]: { color: 'red', text: '禁用', icon: <CloseCircleOutlined /> },
    };
    
    const statusInfo = statusMap[status] || { color: 'default', text: status, icon: null };
    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    );
  };

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Rule) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.description}
          </Text>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: RuleType) => getRuleTypeTag(type),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: number) => (
        <Tag color={priority <= 100 ? 'blue' : priority <= 200 ? 'orange' : 'red'}>
          {priority}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: RuleStatus) => getStatusTag(status),
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
      render: (_: any, record: Rule) => (
        <Space size="middle">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewRule(record)}
            />
          </Tooltip>
          <Tooltip title="编辑规则">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditRule(record)}
            />
          </Tooltip>
          <Tooltip title={record.status === RuleStatus.ACTIVE ? '禁用规则' : '启用规则'}>
            <Button
              type="text"
              icon={record.status === RuleStatus.ACTIVE ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
              onClick={() => handleToggleStatus(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个规则吗？"
            description="删除后无法恢复，请谨慎操作。"
            onConfirm={() => handleDeleteRule(record.id)}
            okText="确定"
            cancelText="取消"
            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
          >
            <Tooltip title="删除规则">
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
    <div style={{ margin: '0 0 0 24px' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1 className="page-title" style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold' }}>规则管理</h1>
        <p className="page-description" style={{ margin: 0, color: '#666' }}>管理计费规则和司机薪酬规则</p>
      </div>

      <Card className="content-card">
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>规则列表</Title>
            <Text type="secondary">共 {rules.length} 条规则</Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateRule}
          >
            新建规则
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={rules}
          rowKey="id"
          loading={loading}
          pagination={{
            total: rules.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
        />
      </Card>

      
      <Modal
        title={editingRule ? '编辑规则' : '新建规则'}
        open={isEditorVisible}
        onCancel={handleEditorCancel}
        footer={null}
        width={1200}
        destroyOnHidden
      >
        <RuleEditor
          rule={editingRule}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
        />
      </Modal>

      
      <Modal
        title="规则详情"
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {viewingRule && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>规则名称：</Text>
                <div>{viewingRule.name}</div>
              </Col>
              <Col span={12}>
                <Text strong>规则类型：</Text>
                <div>{getRuleTypeTag(viewingRule.type)}</div>
              </Col>
            </Row>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>优先级：</Text>
                <div>{viewingRule.priority}</div>
              </Col>
              <Col span={12}>
                <Text strong>状态：</Text>
                <div>{getStatusTag(viewingRule.status)}</div>
              </Col>
            </Row>
            <Divider />
            <div>
              <Text strong>规则描述：</Text>
              <div>{viewingRule.description}</div>
            </div>
            <Divider />
            <div>
              <Text strong>触发条件：</Text>
              <div style={{ marginTop: 8 }}>
                <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                  {JSON.stringify(viewingRule.conditions, null, 2)}
                </pre>
              </div>
            </div>
            <Divider />
            <div>
              <Text strong>执行动作：</Text>
              <div style={{ marginTop: 8 }}>
                <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                  {JSON.stringify(viewingRule.actions, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RuleManagement;
