// 财务分析仪表板组件
// 创建时间: 2025-09-29 15:15:00
// 作用: 提供高级财务分析和报表功能

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Select,
  Button,
  Table,
  Typography,
  Space,
  Divider,
  Progress,
  Tag,
  Tooltip,
  Alert,
  Tabs,
  List,
  Avatar,
  Badge,
} from 'antd';
import {
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PieChartOutlined,
  BarChartOutlined,
  LineChartOutlined,
  FileExcelOutlined,
  DownloadOutlined,
  CalendarOutlined,
  UserOutlined,
  TruckOutlined,
  BankOutlined,
  WalletOutlined,
  CreditCardOutlined,
  PayCircleOutlined,
  FundOutlined,
} from '@ant-design/icons';
import { financeApi } from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  customerCount: number;
  shipmentCount: number;
  averageOrderValue: number;
  paymentRate: number;
}

interface CustomerFinancialData {
  customerId: string;
  customerName: string;
  totalRevenue: number;
  totalPayments: number;
  outstandingAmount: number;
  paymentRate: number;
  lastPaymentDate: string;
  shipmentCount: number;
}

interface MonthlyTrend {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  shipmentCount: number;
}

const FinancialDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);
  const [reportType, setReportType] = useState('overview');
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [customerData, setCustomerData] = useState<CustomerFinancialData[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);

  useEffect(() => {
    loadFinancialData();
  }, [dateRange, reportType]);

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      // 模拟API调用 - 实际项目中应该调用真实的API
      const mockSummary: FinancialSummary = {
        totalRevenue: 125000,
        totalExpenses: 85000,
        netProfit: 40000,
        profitMargin: 32.0,
        customerCount: 45,
        shipmentCount: 234,
        averageOrderValue: 534.19,
        paymentRate: 94.5,
      };

      const mockCustomerData: CustomerFinancialData[] = [
        {
          customerId: 'C001',
          customerName: '张三公司',
          totalRevenue: 15000,
          totalPayments: 14200,
          outstandingAmount: 800,
          paymentRate: 94.7,
          lastPaymentDate: '2025-09-28',
          shipmentCount: 25,
        },
        {
          customerId: 'C002',
          customerName: '李四物流',
          totalRevenue: 12000,
          totalPayments: 12000,
          outstandingAmount: 0,
          paymentRate: 100,
          lastPaymentDate: '2025-09-25',
          shipmentCount: 18,
        },
        {
          customerId: 'C003',
          customerName: '王五贸易',
          totalRevenue: 8500,
          totalPayments: 7650,
          outstandingAmount: 850,
          paymentRate: 90.0,
          lastPaymentDate: '2025-09-20',
          shipmentCount: 12,
        },
      ];

      const mockMonthlyTrends: MonthlyTrend[] = [
        { month: '2025-07', revenue: 98000, expenses: 72000, profit: 26000, shipmentCount: 180 },
        { month: '2025-08', revenue: 112000, expenses: 78000, profit: 34000, shipmentCount: 205 },
        { month: '2025-09', revenue: 125000, expenses: 85000, profit: 40000, shipmentCount: 234 },
      ];

      setFinancialSummary(mockSummary);
      setCustomerData(mockCustomerData);
      setMonthlyTrends(mockMonthlyTrends);
    } catch (error) {
      console.error('加载财务数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format: 'excel' | 'pdf') => {
    message.success(`正在导出${format.toUpperCase()}格式报表...`);
    // 实际项目中应该调用导出API
  };

  const customerColumns = [
    {
      title: '客户名称',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (text: string, record: CustomerFinancialData) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div>{text}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.customerId}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '总收入',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      render: (value: number) => `¥${value.toLocaleString()}`,
      sorter: (a: CustomerFinancialData, b: CustomerFinancialData) => a.totalRevenue - b.totalRevenue,
    },
    {
      title: '已收款',
      dataIndex: 'totalPayments',
      key: 'totalPayments',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '未收款',
      dataIndex: 'outstandingAmount',
      key: 'outstandingAmount',
      render: (value: number) => (
        <Tag color={value > 0 ? 'red' : 'green'}>
          ¥{value.toLocaleString()}
        </Tag>
      ),
    },
    {
      title: '回款率',
      dataIndex: 'paymentRate',
      key: 'paymentRate',
      render: (value: number) => (
        <div>
          <Progress 
            percent={value} 
            size="small" 
            status={value >= 95 ? 'success' : value >= 80 ? 'normal' : 'exception'}
          />
          <Text style={{ fontSize: '12px' }}>{value}%</Text>
        </div>
      ),
      sorter: (a: CustomerFinancialData, b: CustomerFinancialData) => a.paymentRate - b.paymentRate,
    },
    {
      title: '运单数',
      dataIndex: 'shipmentCount',
      key: 'shipmentCount',
      render: (value: number) => <Badge count={value} showZero color="blue" />,
    },
    {
      title: '最后收款',
      dataIndex: 'lastPaymentDate',
      key: 'lastPaymentDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
  ];

  const trendColumns = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
    },
    {
      title: '收入',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (value: number) => (
        <Statistic value={value} prefix="¥" valueStyle={{ fontSize: '14px' }} />
      ),
    },
    {
      title: '支出',
      dataIndex: 'expenses',
      key: 'expenses',
      render: (value: number) => (
        <Statistic value={value} prefix="¥" valueStyle={{ fontSize: '14px', color: '#cf1322' }} />
      ),
    },
    {
      title: '利润',
      dataIndex: 'profit',
      key: 'profit',
      render: (value: number) => (
        <Statistic 
          value={value} 
          prefix="¥" 
          valueStyle={{ 
            fontSize: '14px', 
            color: value > 0 ? '#3f8600' : '#cf1322' 
          }} 
        />
      ),
    },
    {
      title: '运单数',
      dataIndex: 'shipmentCount',
      key: 'shipmentCount',
      render: (value: number) => <Badge count={value} showZero color="blue" />,
    },
  ];

  const tabItems = [
    {
      key: 'overview',
      label: '财务概览',
      children: (
        <div>
          {/* 关键指标卡片 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="总收入"
                  value={financialSummary?.totalRevenue}
                  prefix={<DollarOutlined />}
                  suffix="元"
                  valueStyle={{ color: '#3f8600' }}
                />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">
                    <ArrowUpOutlined /> 较上月 +12.5%
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="总支出"
                  value={financialSummary?.totalExpenses}
                  prefix={<WalletOutlined />}
                  suffix="元"
                  valueStyle={{ color: '#cf1322' }}
                />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">
                    <ArrowDownOutlined /> 较上月 +8.2%
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="净利润"
                  value={financialSummary?.netProfit}
                  prefix={<FundOutlined />}
                  suffix="元"
                  valueStyle={{ color: '#1890ff' }}
                />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">
                    利润率: {financialSummary?.profitMargin}%
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="平均订单价值"
                  value={financialSummary?.averageOrderValue}
                  prefix={<CreditCardOutlined />}
                  suffix="元"
                  precision={2}
                />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">
                    总运单: {financialSummary?.shipmentCount} 单
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>

          {/* 回款率分析 */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="回款率分析" extra={<PieChartOutlined />}>
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <Progress
                    type="circle"
                    percent={financialSummary?.paymentRate}
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                    format={(percent) => `${percent}%`}
                  />
                  <div style={{ marginTop: 16 }}>
                    <Text type="secondary">总体回款率</Text>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="客户分布" extra={<BarChartOutlined />}>
                <List
                  dataSource={[
                    { label: '活跃客户', value: financialSummary?.customerCount, color: '#52c41a' },
                    { label: '高价值客户', value: Math.round((financialSummary?.customerCount || 0) * 0.3), color: '#1890ff' },
                    { label: 'VIP客户', value: Math.round((financialSummary?.customerCount || 0) * 0.1), color: '#722ed1' },
                  ]}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<div style={{ width: 12, height: 12, backgroundColor: item.color, borderRadius: '50%' }} />}
                        title={item.label}
                      />
                      <Statistic value={item.value} suffix="家" valueStyle={{ fontSize: '16px' }} />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'customers',
      label: '客户财务',
      children: (
        <Card 
          title="客户财务详情" 
          extra={
            <Space>
              <Button 
                icon={<DownloadOutlined />} 
                onClick={() => exportReport('excel')}
              >
                导出Excel
              </Button>
              <Button 
                icon={<FileExcelOutlined />} 
                onClick={() => exportReport('pdf')}
              >
                导出PDF
              </Button>
            </Space>
          }
        >
          <Table
            columns={customerColumns}
            dataSource={customerData}
            rowKey="customerId"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 800 }}
          />
        </Card>
      ),
    },
    {
      key: 'trends',
      label: '趋势分析',
      children: (
        <Card title="月度财务趋势" extra={<LineChartOutlined />}>
          <Table
            columns={trendColumns}
            dataSource={monthlyTrends}
            rowKey="month"
            pagination={false}
          />
        </Card>
      ),
    },
  ];

  return (
    <div>
      {/* 控制面板 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Space>
              <Text strong>时间范围:</Text>
              <RangePicker
                value={dateRange}
                onChange={(dates) => dates && setDateRange(dates)}
                format="YYYY-MM-DD"
              />
            </Space>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Space>
              <Text strong>报表类型:</Text>
              <Select
                value={reportType}
                onChange={setReportType}
                style={{ width: 120 }}
              >
                <Option value="overview">概览</Option>
                <Option value="detailed">详细</Option>
                <Option value="comparison">对比</Option>
              </Select>
            </Space>
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Space>
              <Button 
                type="primary" 
                icon={<CalendarOutlined />}
                onClick={loadFinancialData}
                loading={loading}
              >
                刷新数据
              </Button>
              <Button 
                icon={<DownloadOutlined />}
                onClick={() => exportReport('excel')}
              >
                导出报表
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 主要内容 */}
      <Tabs
        defaultActiveKey="overview"
        items={tabItems}
        size="large"
        style={{ background: 'white', padding: '24px', borderRadius: '8px' }}
      />
    </div>
  );
};

export default FinancialDashboard;
