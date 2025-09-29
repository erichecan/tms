// 规则版本管理组件
// 创建时间: 2025-09-29 21:50:00
// 作用: 规则版本管理和发布审批流程

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Tag,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  Steps,
  Timeline,
  Alert,
  Tooltip,
  Popconfirm,
  message,
  Divider,
  Badge,
  Progress,
  Upload,
  Descriptions,
} from 'antd';
import {
  FileTextOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  UploadOutlined,
  BranchesOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

interface RuleVersion {
  id: string;
  ruleId: string;
  ruleName: string;
  version: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'deprecated';
  author: string;
  reviewer?: string;
  createdAt: string;
  updatedAt: string;
  effectiveDate?: string;
  description: string;
  changes: string[];
  approvalComments?: string;
  rejectionReason?: string;
}

interface ApprovalWorkflow {
  id: string;
  ruleVersionId: string;
  currentStep: number;
  steps: ApprovalStep[];
  status: 'in_progress' | 'completed' | 'rejected';
  startedAt: string;
  completedAt?: string;
}

interface ApprovalStep {
  id: string;
  name: string;
  approver: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  actionAt?: string;
  deadline?: string;
}

const RuleVersionManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [ruleVersions, setRuleVersions] = useState<RuleVersion[]>([]);
  const [isVersionModalVisible, setIsVersionModalVisible] = useState(false);
  const [isWorkflowModalVisible, setIsWorkflowModalVisible] = useState(false);
  const [selectedRule, setSelectedRule] = useState<RuleVersion | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadRuleVersions();
  }, []);

  const loadRuleVersions = async () => {
    setLoading(true);
    try {
      // 模拟数据
      const mockVersions: RuleVersion[] = [
        {
          id: 'RV001',
          ruleId: 'R001',
          ruleName: '基础运费规则',
          version: 'v2.1.0',
          status: 'active',
          author: '张三',
          reviewer: '李四',
          createdAt: '2025-09-28 10:00:00',
          updatedAt: '2025-09-28 15:30:00',
          effectiveDate: '2025-10-01 00:00:00',
          description: '优化基础运费计算逻辑，增加阶梯式定价',
          changes: [
            '调整基础运费计算方式',
            '增加阶梯式定价规则',
            '优化特殊区域运费',
          ],
        },
        {
          id: 'RV002',
          ruleId: 'R001',
          ruleName: '基础运费规则',
          version: 'v2.0.5',
          status: 'deprecated',
          author: '张三',
          reviewer: '李四',
          createdAt: '2025-09-20 09:00:00',
          updatedAt: '2025-09-25 14:20:00',
          effectiveDate: '2025-09-25 00:00:00',
          description: '修复运费计算中的小数精度问题',
          changes: [
            '修复小数精度问题',
            '优化计算性能',
          ],
        },
        {
          id: 'RV003',
          ruleId: 'R002',
          ruleName: '距离计费规则',
          version: 'v1.3.0',
          status: 'pending',
          author: '王五',
          reviewer: undefined,
          createdAt: '2025-09-29 08:30:00',
          updatedAt: '2025-09-29 08:30:00',
          description: '新增超长距离优惠机制',
          changes: [
            '新增超长距离优惠',
            '调整距离分段计算',
            '优化配送效率评估',
          ],
        },
        {
          id: 'RV004',
          ruleId: 'R003',
          ruleName: '重量计费规则',
          version: 'v1.0.0',
          status: 'draft',
          author: '赵六',
          reviewer: undefined,
          createdAt: '2025-09-29 16:00:00',
          updatedAt: '2025-09-29 16:00:00',
          description: '新增重量计费规则',
          changes: [
            '建立重量计费基础框架',
            '设置重量分段标准',
            '配置超重附加费用',
          ],
        },
      ];

      setRuleVersions(mockVersions);
    } catch (error) {
      message.error('加载规则版本失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'default',
      pending: 'processing',
      approved: 'success',
      rejected: 'error',
      active: 'green',
      deprecated: 'gray',
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts = {
      draft: '草稿',
      pending: '待审核',
      approved: '已通过',
      rejected: '已拒绝',
      active: '生效中',
      deprecated: '已废弃',
    };
    return texts[status as keyof typeof texts] || status;
  };

  const handleCreateVersion = () => {
    form.resetFields();
    setSelectedRule(null);
    setIsVersionModalVisible(true);
  };

  const handleEditVersion = (record: RuleVersion) => {
    setSelectedRule(record);
    form.setFieldsValue({
      ruleName: record.ruleName,
      version: record.version,
      description: record.description,
      changes: record.changes.join('\n'),
    });
    setIsVersionModalVisible(true);
  };

  const handleViewWorkflow = (record: RuleVersion) => {
    // 模拟审批流程数据
    const mockWorkflow: ApprovalWorkflow = {
      id: 'WF001',
      ruleVersionId: record.id,
      currentStep: 1,
      status: 'in_progress',
      startedAt: record.createdAt,
      steps: [
        {
          id: 'S001',
          name: '技术审核',
          approver: '技术负责人',
          status: 'approved',
          comments: '技术方案可行，同意发布',
          actionAt: '2025-09-28 11:00:00',
        },
        {
          id: 'S002',
          name: '业务审核',
          approver: '业务负责人',
          status: 'pending',
          deadline: '2025-09-30 18:00:00',
        },
        {
          id: 'S003',
          name: '最终审批',
          approver: '部门经理',
          status: 'pending',
          deadline: '2025-10-01 12:00:00',
        },
      ],
    };

    setSelectedWorkflow(mockWorkflow);
    setIsWorkflowModalVisible(true);
  };

  const handleSubmitForApproval = (record: RuleVersion) => {
    Modal.confirm({
      title: '提交审核确认',
      content: `确定要提交规则版本 ${record.version} 进行审核吗？`,
      onOk: () => {
        // 更新状态为pending
        setRuleVersions(prev => 
          prev.map(item => 
            item.id === record.id 
              ? { ...item, status: 'pending' as const }
              : item
          )
        );
        message.success('已提交审核');
      },
    });
  };

  const handleApprove = (record: RuleVersion) => {
    Modal.confirm({
      title: '审核通过确认',
      content: `确定要审核通过规则版本 ${record.version} 吗？`,
      onOk: () => {
        setRuleVersions(prev => 
          prev.map(item => 
            item.id === record.id 
              ? { ...item, status: 'approved' as const }
              : item
          )
        );
        message.success('审核通过');
      },
    });
  };

  const handleReject = (record: RuleVersion) => {
    Modal.confirm({
      title: '审核拒绝确认',
      content: `确定要拒绝规则版本 ${record.version} 吗？`,
      onOk: () => {
        setRuleVersions(prev => 
          prev.map(item => 
            item.id === record.id 
              ? { ...item, status: 'rejected' as const }
              : item
          )
        );
        message.success('已拒绝');
      },
    });
  };

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'ruleName',
      key: 'ruleName',
      render: (text: string, record: RuleVersion) => (
        <Space>
          <FileTextOutlined />
          <div>
            <div><Text strong>{text}</Text></div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              版本: {record.version}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
      filters: [
        { text: '草稿', value: 'draft' },
        { text: '待审核', value: 'pending' },
        { text: '已通过', value: 'approved' },
        { text: '已拒绝', value: 'rejected' },
        { text: '生效中', value: 'active' },
        { text: '已废弃', value: 'deprecated' },
      ],
      onFilter: (value: string, record: RuleVersion) => record.status === value,
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      render: (author: string) => (
        <Space>
          <UserOutlined />
          {author}
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
      sorter: (a: RuleVersion, b: RuleVersion) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: '生效时间',
      dataIndex: 'effectiveDate',
      key: 'effectiveDate',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: RuleVersion) => (
        <Space>
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
            />
          </Tooltip>
          
          {record.status === 'draft' && (
            <Tooltip title="编辑">
              <Button 
                type="text" 
                icon={<EditOutlined />} 
                size="small"
                onClick={() => handleEditVersion(record)}
              />
            </Tooltip>
          )}

          {record.status === 'draft' && (
            <Tooltip title="提交审核">
              <Button 
                type="text" 
                icon={<SafetyCertificateOutlined />} 
                size="small"
                onClick={() => handleSubmitForApproval(record)}
              />
            </Tooltip>
          )}

          {record.status === 'pending' && (
            <>
              <Tooltip title="审核通过">
                <Button 
                  type="text" 
                  icon={<CheckCircleOutlined />} 
                  size="small"
                  onClick={() => handleApprove(record)}
                />
              </Tooltip>
              <Tooltip title="审核拒绝">
                <Button 
                  type="text" 
                  icon={<ExclamationCircleOutlined />} 
                  size="small"
                  onClick={() => handleReject(record)}
                />
              </Tooltip>
            </>
          )}

          {(record.status === 'pending' || record.status === 'approved') && (
            <Tooltip title="查看审批流程">
              <Button 
                type="text" 
                icon={<BranchesOutlined />} 
                size="small"
                onClick={() => handleViewWorkflow(record)}
              />
            </Tooltip>
          )}

          <Tooltip title="下载">
            <Button 
              type="text" 
              icon={<DownloadOutlined />} 
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 操作栏 */}
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleCreateVersion}
              >
                新建版本
              </Button>
              <Button icon={<UploadOutlined />}>
                批量导入
              </Button>
              <Button icon={<HistoryOutlined />}>
                版本历史
              </Button>
            </Space>
          </Col>
          <Col>
            <Space>
              <Text type="secondary">
                共 {ruleVersions.length} 个版本
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 规则版本列表 */}
      <Card title="规则版本列表" extra={<HistoryOutlined />}>
        <Table
          columns={columns}
          dataSource={ruleVersions}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 版本编辑模态框 */}
      <Modal
        title={selectedRule ? '编辑规则版本' : '新建规则版本'}
        open={isVersionModalVisible}
        onCancel={() => setIsVersionModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            console.log('Form values:', values);
            message.success(selectedRule ? '更新成功' : '创建成功');
            setIsVersionModalVisible(false);
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="ruleName"
                label="规则名称"
                rules={[{ required: true, message: '请输入规则名称' }]}
              >
                <Input placeholder="请输入规则名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="version"
                label="版本号"
                rules={[{ required: true, message: '请输入版本号' }]}
              >
                <Input placeholder="例如: v1.0.0" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="版本描述"
            rules={[{ required: true, message: '请输入版本描述' }]}
          >
            <TextArea rows={3} placeholder="请描述此版本的主要变更" />
          </Form.Item>

          <Form.Item
            name="changes"
            label="变更内容"
            rules={[{ required: true, message: '请输入变更内容' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="请逐行描述具体的变更内容"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {selectedRule ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setIsVersionModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 审批流程模态框 */}
      <Modal
        title="审批流程详情"
        open={isWorkflowModalVisible}
        onCancel={() => setIsWorkflowModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedWorkflow && (
          <div>
            <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="流程ID">
                {selectedWorkflow.id}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(selectedWorkflow.status)}>
                  {selectedWorkflow.status === 'in_progress' ? '进行中' : 
                   selectedWorkflow.status === 'completed' ? '已完成' : '已拒绝'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="开始时间">
                {dayjs(selectedWorkflow.startedAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="完成时间">
                {selectedWorkflow.completedAt ? 
                  dayjs(selectedWorkflow.completedAt).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Steps
              current={selectedWorkflow.currentStep}
              direction="vertical"
              size="small"
            >
              {selectedWorkflow.steps.map((step, index) => (
                <Step
                  key={step.id}
                  title={step.name}
                  description={
                    <div>
                      <div>审批人: {step.approver}</div>
                      {step.status === 'approved' && (
                        <div style={{ color: '#52c41a' }}>
                          ✓ 已通过 {step.actionAt && dayjs(step.actionAt).format('MM-DD HH:mm')}
                        </div>
                      )}
                      {step.status === 'rejected' && (
                        <div style={{ color: '#f5222d' }}>
                          ✗ 已拒绝 {step.actionAt && dayjs(step.actionAt).format('MM-DD HH:mm')}
                        </div>
                      )}
                      {step.status === 'pending' && (
                        <div style={{ color: '#1890ff' }}>
                          ⏳ 待审批
                          {step.deadline && ` (截止: ${dayjs(step.deadline).format('MM-DD HH:mm')})`}
                        </div>
                      )}
                      {step.comments && (
                        <div style={{ marginTop: 4, fontSize: '12px', color: '#666' }}>
                          备注: {step.comments}
                        </div>
                      )}
                    </div>
                  }
                  status={
                    step.status === 'approved' ? 'finish' :
                    step.status === 'rejected' ? 'error' :
                    step.status === 'pending' ? 'process' : 'wait'
                  }
                />
              ))}
            </Steps>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RuleVersionManagement;
