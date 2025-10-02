import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Select,
  DatePicker,
  message,
  Tooltip,
  Row,
  Col,
  Typography,
  Tabs,
  Statistic,
} from 'antd';
import {
  DollarOutlined,
  FileTextOutlined,
  DownloadOutlined,
  EyeOutlined,
    ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { financeApi, customersApi, driversApi } from '../../services/api';
import { FinancialRecord, Statement, StatementType } from '../../types/index';
import PageLayout from '../../components/Layout/PageLayout'; // 2025-09-29 13:40:00 恢复PageLayout导入，与创建运单页面保持一致
import { formatCurrency } from '../../utils/formatCurrency';
import FinancialDashboard from '../../components/FinancialReports/FinancialDashboard'; // 2025-10-02 18:10:00 整合财务报表功能

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const FinanceManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([]);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [isStatementModalVisible, setIsStatementModalVisible] = useState(false);
  const [statementType, setStatementType] = useState<StatementType>(StatementType.CUSTOMER);

  const [form] = Form.useForm();

  useEffect(() => {
    loadFinancialRecords();
    loadStatements();
    loadCustomers();
    loadDrivers();
  }, []);

  const loadFinancialRecords = async () => {
    try {
      setLoading(true);
      const response = await financeApi.getFinancialRecords();
      setFinancialRecords(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load financial records:', error);
      message.error('加载财务记录失败');
    } finally {
      setLoading(false);
    }
  };

  const loadStatements = async () => {
    try {
      const response = await financeApi.getStatements();
      setStatements(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load statements:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await customersApi.getCustomers();
      setCustomers(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const loadDrivers = async () => {
    try {
      const response = await driversApi.getDrivers();
      setDrivers(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load drivers:', error);
    }
  };

  const handleGenerateStatement = async (values: any) => {
    try {
      const { entityId, period } = values;
      const [start, end] = period;
      
      if (statementType === StatementType.CUSTOMER) {
        await financeApi.generateCustomerStatement(entityId, {
          start: start.format('YYYY-MM-DD'),
          end: end.format('YYYY-MM-DD'),
        });
        message.success('客户对账单生成成功');
      } else {
        await financeApi.generateDriverPayrollStatement(entityId, {
          start: start.format('YYYY-MM-DD'),
          end: end.format('YYYY-MM-DD'),
        });
        message.success('司机薪酬结算单生成成功');
      }
      
      setIsStatementModalVisible(false);
      loadStatements();
    } catch (error) {
      console.error('Failed to generate statement:', error);
      message.error('生成结算单失败');
    }
  };

  const getStatementTypeTag = (type: StatementType) => {
    const typeMap: Record<StatementType, { color: string; text: string }> = {
      [StatementType.CUSTOMER]: { color: 'blue', text: '客户对账单' },
      [StatementType.DRIVER]: { color: 'green', text: '司机薪酬单' },
    };
    
    const typeInfo = typeMap[type] || { color: 'default', text: type };
    return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
  };

  const getStatementStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
      pending: { color: 'orange', text: '待处理', icon: <ClockCircleOutlined /> },
      generated: { color: 'blue', text: '已生成', icon: <FileTextOutlined /> },
      paid: { color: 'green', text: '已支付', icon: <CheckCircleOutlined /> },
      overdue: { color: 'red', text: '逾期', icon: <ExclamationCircleOutlined /> },
    };
    
    const statusInfo = statusMap[status] || { color: 'default', text: status, icon: null };
    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    );
  };

  const financialRecordColumns = [
    {
      title: '记录ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => text.slice(0, 8) + '...',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'revenue' ? 'green' : 'red'}>
          {type === 'revenue' ? '收入' : '支出'}
        </Tag>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number | string, record: FinancialRecord) => {
        // 使用安全的货币格式化函数，彻底解决 toFixed 错误 // 2025-01-27 15:36:00
        const prefix = record.type === 'revenue' ? '+$' : '-$';
        return (
          <Text strong style={{ color: record.type === 'revenue' ? '#52c41a' : '#ff4d4f' }}>
            {formatCurrency(amount, 2, prefix)}
          </Text>
        );
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  const statementColumns = [
    {
      title: '结算单号',
      dataIndex: 'statementNumber',
      key: 'statementNumber',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: StatementType) => getStatementTypeTag(type),
    },
    {
      title: '关联实体',
      dataIndex: 'entityName',
      key: 'entityName',
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number | string) => {
        // 使用安全的货币格式化函数，彻底解决 toFixed 错误 // 2025-01-27 15:36:00
        return (
          <Text strong style={{ color: '#1890ff' }}>
            {formatCurrency(amount, 2, '$')}
          </Text>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatementStatusTag(status),
    },
    {
      title: '生成时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any) => (
        <Space size="middle">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => {
                // 实现查看详情逻辑
                message.info('查看详情功能待实现');
              }}
            />
          </Tooltip>
          <Tooltip title="下载结算单">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => {
                // 实现下载逻辑
                message.info('下载功能待实现');
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const totalRevenue = financialRecords
    .filter(record => record.type === 'revenue')
    .reduce((sum, record) => sum + record.amount, 0);

  const totalExpenses = financialRecords
    .filter(record => record.type === 'expense')
    .reduce((sum, record) => sum + record.amount, 0);

  const netProfit = totalRevenue - totalExpenses;

  return (
    <PageLayout>
      <div style={{ padding: '24px', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'phase-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">财务管理</h1>
          <p className="page-description">综合财务管理平台 - 记录、结算、报表</p>
        </div>
        <Button 
          type="primary" 
          icon={<FileTextOutlined />}
          onClick={() => {
            // TODO: 实现生成结算单功能
            console.log('生成结算单');
          }}
        >
          生成结算单
        </Button>
      </div>

      {/* 2025-10-02 18:10:00 - 添加标签页来整合财务报表功能 */}
      <Tabs defaultActiveKey="records" size="large">
        <Tabs.TabPane 
          tab={
            <span>
              <DollarOutlined />
              财务记录
            </span>
          } 
          key="records"
        >
          {/* 财务概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card className="stats-card">
            <Statistic
              title="总收入"
              value={totalRevenue}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="stats-card">
            <Statistic
              title="总支出"
              value={totalExpenses}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="stats-card">
            <Statistic
              title="净利润"
              value={netProfit}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: netProfit > 0 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs 
        defaultActiveKey="records"
        items={[
          {
            key: 'records',
            label: '财务记录',
            children: (
              <Card className="content-card">
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Title level={4} style={{ margin: 0 }}>财务记录</Title>
                    <Text type="secondary">共 {financialRecords.length} 条记录</Text>
                  </div>
                </div>

                <Table
                  columns={financialRecordColumns}
                  dataSource={financialRecords}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    total: financialRecords.length,
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                  }}
                />
              </Card>
            )
          },
          {
            key: 'statements',
            label: '结算单管理',
            children: (
              <Card className="content-card">
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Title level={4} style={{ margin: 0 }}>结算单列表</Title>
                    <Text type="secondary">共 {statements.length} 个结算单</Text>
                  </div>
                  <Space>
                    <Button
                      type="primary"
                      icon={<FileTextOutlined />}
                      onClick={() => {
                        setStatementType(StatementType.CUSTOMER);
                        setIsStatementModalVisible(true);
                      }}
                    >
                      生成客户对账单
                    </Button>
                    <Button
                      type="primary"
                      icon={<FileTextOutlined />}
                      onClick={() => {
                        setStatementType(StatementType.DRIVER);
                        setIsStatementModalVisible(true);
                      }}
                    >
                      生成司机薪酬单
                    </Button>
                  </Space>
                </div>

                <Table
                  columns={statementColumns}
                  dataSource={statements}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    total: statements.length,
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                  }}
                />
              </Card>
            )
          }
        ]}
      />

      {/* 生成结算单模态框 */}
      <Modal
        title={`生成${statementType === StatementType.CUSTOMER ? '客户对账单' : '司机薪酬单'}`}
        open={isStatementModalVisible}
        onCancel={() => setIsStatementModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGenerateStatement}
        >
          <Form.Item
            name="entityId"
            label={statementType === StatementType.CUSTOMER ? '选择客户' : '选择司机'}
            rules={[{ required: true, message: `请选择${statementType === StatementType.CUSTOMER ? '客户' : '司机'}` }]}
          >
            <Select placeholder={`请选择${statementType === StatementType.CUSTOMER ? '客户' : '司机'}`}>
              {(statementType === StatementType.CUSTOMER ? customers : drivers).map(entity => (
                <Option key={entity.id} value={entity.id}>
                  {entity.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="period"
            label="结算周期"
            rules={[{ required: true, message: '请选择结算周期' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
        </Tabs.TabPane>
        
        <Tabs.TabPane 
          tab={
            <span>
              <BarChartOutlined />
              财务报表
            </span>
          } 
          key="reports"
        >
          <div style={{ padding: '16px 0' }}>
            <Card>
              <Title level={4}>📊 财务分析报表</Title>
              <Text type="secondary">全面的财务数据分析和报表生成功能</Text>
              <FinancialDashboard />
            </Card>
          </div>
        </Tabs.TabPane>
      </Tabs>
      </div>
    </PageLayout>
  );
};

export default FinanceManagement;
