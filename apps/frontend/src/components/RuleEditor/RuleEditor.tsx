import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Button,
  Space,
  Card,
  Row,
  Col,
  Typography,
  Divider,
  Alert,
  List,
  Tag,
  Popconfirm,
  message,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { rulesApi } from '../../services/api';
import { Rule, RuleType, RuleStatus, RuleCondition, RuleAction } from '../../types/index';

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface RuleEditorProps {
  rule?: Rule | null;
  onSave: () => void;
  onCancel: () => void;
}

const RuleEditor: React.FC<RuleEditorProps> = ({ rule, onSave, onCancel }) => {
  const [form] = Form.useForm();
  const [conditions, setConditions] = useState<RuleCondition[]>([]);
  const [actions, setActions] = useState<RuleAction[]>([]);
  const [similarRules, setSimilarRules] = useState<Rule[]>([]);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (rule) {
      form.setFieldsValue({
        name: rule.name,
        description: rule.description,
        type: rule.type,
        priority: rule.priority,
        status: rule.status === RuleStatus.ACTIVE,
      });
      setConditions(rule.conditions || []);
      setActions(rule.actions || []);
    } else {
      form.resetFields();
      setConditions([]);
      setActions([]);
    }
    setSimilarRules([]);
    setConflicts([]);
  }, [rule, form]);

  const handleAddCondition = () => {
    const newCondition: RuleCondition = {
      fact: '',
      operator: '',
      value: '',
    };
    setConditions([...conditions, newCondition]);
  };

  const handleRemoveCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    setConditions(newConditions);
  };

  const handleUpdateCondition = (index: number, field: keyof RuleCondition, value: string) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setConditions(newConditions);
  };

  const handleAddAction = () => {
    const newAction: RuleAction = {
      type: '',
      parameters: {},
    };
    setActions([...actions, newAction]);
  };

  const handleRemoveAction = (index: number) => {
    const newActions = actions.filter((_, i) => i !== index);
    setActions(newActions);
  };

  const handleUpdateAction = (index: number, field: keyof RuleAction, value: any) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setActions(newActions);
  };

  const handleFuzzyMatch = async () => {
    try {
      const formValues = form.getFieldsValue();
      const ruleData = {
        ...formValues,
        conditions,
        actions,
      };

      const response = await rulesApi.fuzzyMatchRules(ruleData);
      setSimilarRules(response.data?.similarRules || []);
    } catch (error) {
      console.error('Failed to perform fuzzy match:', error);
    }
  };

  const handleConflictDetection = async () => {
    try {
      const formValues = form.getFieldsValue();
      const ruleData = {
        ...formValues,
        conditions,
        actions,
      };

      const response = await rulesApi.detectRuleConflicts(ruleData);
      setConflicts(response.data?.conflicts || []);
    } catch (error) {
      console.error('Failed to detect conflicts:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const formValues = form.getFieldsValue();
      
      const ruleData = {
        ...formValues,
        status: formValues.status ? RuleStatus.ACTIVE : RuleStatus.INACTIVE,
        conditions,
        actions,
      };

      if (rule) {
        await rulesApi.updateRule(rule.id, ruleData);
        message.success('规则更新成功');
      } else {
        await rulesApi.createRule(ruleData);
        message.success('规则创建成功');
      }

      onSave();
    } catch (error) {
      console.error('Failed to save rule:', error);
      message.error('保存规则失败');
    } finally {
      setLoading(false);
    }
  };

  const factOptions = [
    { value: 'customerLevel', label: '客户等级' },
    { value: 'weight', label: '货物总重(kg)' },
    { value: 'distance', label: '运输距离(km)' },
    { value: 'destinationPostcode', label: '目的地邮编' },
    { value: 'requiresTailgate', label: '是否需要尾板' },
    { value: 'pickupDate', label: '取货日期' },
    { value: 'deliveryDate', label: '送达日期' },
  ];

  const operatorOptions = [
    { value: 'equals', label: '等于' },
    { value: 'notEquals', label: '不等于' },
    { value: 'greaterThan', label: '大于' },
    { value: 'lessThan', label: '小于' },
    { value: 'greaterThanOrEqual', label: '大于等于' },
    { value: 'lessThanOrEqual', label: '小于等于' },
    { value: 'contains', label: '包含' },
    { value: 'startsWith', label: '开头是' },
    { value: 'endsWith', label: '结尾是' },
  ];

  const actionTypeOptions = [
    { value: 'applyDiscount', label: '应用折扣(百分比)' },
    { value: 'addFee', label: '增加附加费(固定金额)' },
    { value: 'modifyBaseRate', label: '修改基础费率(元/公里)' },
    { value: 'setDriverCommission', label: '设置司机提成(百分比)' },
    { value: 'setFixedAmount', label: '设置固定金额' },
  ];

  return (
    <div>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          type: RuleType.PRICING,
          priority: 100,
          status: true,
        }}
      >
        <Row gutter={24}>
          <Col span={12}>
            <Card title="基本信息" size="small">
              <Form.Item
                name="name"
                label="规则名称"
                rules={[{ required: true, message: '请输入规则名称' }]}
              >
                <Input placeholder="请输入规则名称" />
              </Form.Item>

              <Form.Item
                name="description"
                label="规则描述"
                rules={[{ required: true, message: '请输入规则描述' }]}
              >
                <TextArea rows={3} placeholder="请输入规则描述" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="type"
                    label="规则类型"
                    rules={[{ required: true, message: '请选择规则类型' }]}
                  >
                    <Select placeholder="请选择规则类型">
                      <Option value={RuleType.PRICING}>计费规则</Option>
                      <Option value={RuleType.PAYROLL}>薪酬规则</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="priority"
                    label="优先级"
                    rules={[{ required: true, message: '请输入优先级' }]}
                  >
                    <InputNumber
                      min={1}
                      max={1000}
                      placeholder="请输入优先级"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="status"
                label="状态"
                valuePropName="checked"
              >
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="规则验证" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="default"
                  icon={<ExclamationCircleOutlined />}
                  onClick={handleFuzzyMatch}
                  block
                >
                  模糊匹配检测
                </Button>
                <Button
                  type="default"
                  icon={<CheckCircleOutlined />}
                  onClick={handleConflictDetection}
                  block
                >
                  冲突检测
                </Button>
              </Space>

              {similarRules.length > 0 && (
                <Alert
                  message="检测到相似规则"
                  description={
                    <List
                      size="small"
                      dataSource={similarRules}
                      renderItem={(item) => (
                        <List.Item>
                          <Text>{item.name}</Text>
                          <Tag color="orange">相似度: {(item as any).similarity}%</Tag>
                        </List.Item>
                      )}
                    />
                  }
                  type="warning"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              )}

              {conflicts.length > 0 && (
                <Alert
                  message="检测到规则冲突"
                  description={
                    <List
                      size="small"
                      dataSource={conflicts}
                      renderItem={(item) => (
                        <List.Item>
                          <Text>{item}</Text>
                        </List.Item>
                      )}
                    />
                  }
                  type="error"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              )}
            </Card>
          </Col>
        </Row>

        <Divider />

        <Card title="触发条件 (IF...)" size="small">
          <div style={{ marginBottom: 16 }}>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddCondition}
              block
            >
              添加条件
            </Button>
          </div>

          {conditions.map((condition, index) => (
            <Card
              key={index}
              size="small"
              style={{ marginBottom: 8 }}
              title={`条件 ${index + 1}`}
              extra={
                <Popconfirm
                  title="确定要删除这个条件吗？"
                  onConfirm={() => handleRemoveCondition(index)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                  />
                </Popconfirm>
              }
            >
              <Row gutter={16}>
                <Col span={8}>
                  <Select
                    placeholder="选择字段"
                    value={condition.fact}
                    onChange={(value) => handleUpdateCondition(index, 'fact', value)}
                    style={{ width: '100%' }}
                  >
                    {factOptions.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col span={8}>
                  <Select
                    placeholder="选择操作符"
                    value={condition.operator}
                    onChange={(value) => handleUpdateCondition(index, 'operator', value)}
                    style={{ width: '100%' }}
                  >
                    {operatorOptions.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col span={8}>
                  <Input
                    placeholder="输入值"
                    value={condition.value}
                    onChange={(e) => handleUpdateCondition(index, 'value', e.target.value)}
                  />
                </Col>
              </Row>
            </Card>
          ))}
        </Card>

        <Divider />

        <Card title="执行动作 (THEN...)" size="small">
          <div style={{ marginBottom: 16 }}>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddAction}
              block
            >
              添加动作
            </Button>
          </div>

          {actions.map((action, index) => (
            <Card
              key={index}
              size="small"
              style={{ marginBottom: 8 }}
              title={`动作 ${index + 1}`}
              extra={
                <Popconfirm
                  title="确定要删除这个动作吗？"
                  onConfirm={() => handleRemoveAction(index)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                  />
                </Popconfirm>
              }
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Select
                    placeholder="选择动作类型"
                    value={action.type}
                    onChange={(value) => handleUpdateAction(index, 'type', value)}
                    style={{ width: '100%' }}
                  >
                    {actionTypeOptions.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col span={12}>
                  <Input
                    placeholder="输入参数值"
                    value={action.parameters?.value || ''}
                    onChange={(e) => handleUpdateAction(index, 'parameters', { value: e.target.value })}
                  />
                </Col>
              </Row>
            </Card>
          ))}
        </Card>

        <Divider />

        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel}>
              取消
            </Button>
            <Button
              type="primary"
              onClick={handleSave}
              loading={loading}
            >
              保存规则
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default RuleEditor;