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
  QuestionCircleOutlined, // 2025-11-30 07:20:00 新增：用于教程标签页图标
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

  // 2025-11-30 03:20:00 修复：改进错误处理，显示详细错误信息
  const loadRules = async () => {
    try {
      setLoading(true);
      const response = await rulesApi.getRules();
      // 处理分页响应结构
      const rulesData = response.data?.data || response.data || [];
      setRules(Array.isArray(rulesData) ? rulesData : []);
    } catch (error: any) {
      console.error('Failed to load rules:', error);
      const errorMessage = error?.response?.data?.error?.message || error?.message || '加载规则失败';
      message.error(`加载规则失败: ${errorMessage}`);
      // 如果是权限问题，提供更详细的提示
      if (error?.response?.status === 403) {
        message.warning('您没有权限访问规则管理功能');
      }
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
    } catch (error: any) {
      console.error('Failed to delete rule:', error);
      const errorMessage = error?.response?.data?.error?.message || error?.message || '删除规则失败';
      message.error(`删除规则失败: ${errorMessage}`);
    }
  };

  const handleToggleStatus = async (rule: Rule) => {
    try {
      const newStatus = rule.status === RuleStatus.ACTIVE ? RuleStatus.INACTIVE : RuleStatus.ACTIVE;
      // 2025-11-30T15:30:00Z Added by Assistant: 修复状态切换，只发送必要的字段
      await rulesApi.updateRule(rule.id, { status: newStatus });
      message.success(`规则已${newStatus === RuleStatus.ACTIVE ? '启用' : '禁用'}`);
      loadRules();
    } catch (error: any) {
      console.error('Failed to toggle rule status:', error);
      const errorMessage = error?.response?.data?.error?.message || error?.message || '更新规则状态失败';
      message.error(`更新规则状态失败: ${errorMessage}`);
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
      render: (_: unknown, record: Rule) => (
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
          <Space>
            <Button
              icon={<QuestionCircleOutlined />}
              onClick={() => {
                // 2025-11-30 07:30:00 在新标签页打开教程页面
                window.open('/rules/guide', '_blank');
              }}
            >
              查看教程
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateRule}
            >
              新建规则
            </Button>
          </Space>
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
        destroyOnHidden // 2025-11-30 07:40:00 修复：使用 destroyOnHidden 替代已废弃的 destroyOnClose
        style={{ top: 20 }}
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
                {viewingRule.conditions && viewingRule.conditions.length > 0 ? (
                  <div>
                    {viewingRule.conditions.map((condition: any, index: number) => {
                      const factMap: Record<string, string> = {
                        customerLevel: '客户等级',
                        weight: '货物总重(kg)',
                        distance: '运输距离(km)',
                        destinationPostcode: '目的地邮编',
                        requiresTailgate: '是否需要尾板',
                        pickupDate: '取货日期',
                        deliveryDate: '送达日期',
                      };
                      const operatorMap: Record<string, string> = {
                        equal: '等于',
                        equals: '等于',
                        notEqual: '不等于',
                        notEquals: '不等于',
                        greaterThan: '大于',
                        lessThan: '小于',
                        greaterThanOrEqual: '大于等于',
                        lessThanOrEqual: '小于等于',
                        contains: '包含',
                        startsWith: '开头是',
                        endsWith: '结尾是',
                      };
                      const factLabel = factMap[condition.fact] || condition.fact;
                      const operatorLabel = operatorMap[condition.operator] || condition.operator;
                      return (
                        <div key={index} style={{ marginBottom: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                          <Text>如果 <strong>{factLabel}</strong> {operatorLabel} <strong>{condition.value}</strong></Text>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Text type="secondary">无触发条件</Text>
                )}
              </div>
            </div>
            <Divider />
            <div>
              <Text strong>执行动作：</Text>
              <div style={{ marginTop: 8 }}>
                {viewingRule.actions && viewingRule.actions.length > 0 ? (
                  <div>
                    {viewingRule.actions.map((action: any, index: number) => {
                      const actionTypeMap: Record<string, string> = {
                        applyDiscount: '应用折扣',
                        addFee: '增加附加费',
                        modifyBaseRate: '修改基础费率',
                        setDriverCommission: '设置司机提成',
                        setFixedAmount: '设置固定金额',
                        calculateBaseFee: '计算基础运费',
                      };
                      const actionLabel = actionTypeMap[action.type] || action.type;
                      const params = action.params || action.parameters || {};
                      const paramText = Object.entries(params)
                        .map(([key, value]) => {
                          const keyMap: Record<string, string> = {
                            percentage: '百分比',
                            value: '数值',
                            ratePerKm: '每公里费率',
                            amount: '金额',
                          };
                          const keyLabel = keyMap[key] || key;
                          return `${keyLabel}: ${value}`;
                        })
                        .join(', ');
                      return (
                        <div key={index} style={{ marginBottom: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                          <Text><strong>{actionLabel}</strong>{paramText ? ` (${paramText})` : ''}</Text>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Text type="secondary">无执行动作</Text>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RuleManagement;
