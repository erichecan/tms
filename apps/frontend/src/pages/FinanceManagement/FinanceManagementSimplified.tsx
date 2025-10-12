// 简化版财务结算页面
// 创建时间: 2025-10-10 18:00:00
// 目标: 简单、清晰、专业的财务管理

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Statistic,
  Row,
  Col,
  Typography,
  Tabs,
  message,
  Modal,
  DatePicker,
} from 'antd';
import {
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { financeApi, shipmentsApi } from '../../services/api';
import FinancialDashboard from '../../components/FinancialReports/FinancialDashboard'; // 2025-10-12 09:33:00
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

interface FinancialSummary {
  totalReceivable: number;
  totalPayable: number;
  monthlyRevenue: number;
  monthlyProfit: number;
}

interface AccountItem {
  id: string;
  entityId: string;
  entityName: string;
  shipmentCount: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  status: string;
}

const FinanceManagementSimplified: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalReceivable: 0,
    totalPayable: 0,
    monthlyRevenue: 0,
    monthlyProfit: 0,
  });
  
  const [receivables, setReceivables] = useState<AccountItem[]>([]);
  const [payables, setPayables] = useState<AccountItem[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  useEffect(() => {
    loadFinancialData();
  }, [dateRange]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      
      // 加载财务汇总数据
      // TODO: 调用真实API
      // const summaryRes = await financeApi.getSummary();
      
      // 临时模拟数据 - 2025-10-10 18:00:00
      setSummary({
        totalReceivable: 12500,
        totalPayable: 4200,
        monthlyRevenue: 18300,
        monthlyProfit: 6100,
      });

      // 模拟应收账款数据
      setReceivables([
        {
          id: '1',
          entityId: 'cust-1',
          entityName: 'ABC物流公司',
          shipmentCount: 12,
          totalAmount: 3500,
          paidAmount: 0,
          unpaidAmount: 3500,
          status: 'pending',
        },
        {
          id: '2',
          entityId: 'cust-2',
          entityName: 'XYZ贸易公司',
          shipmentCount: 8,
          totalAmount: 2800,
          paidAmount: 1000,
          unpaidAmount: 1800,
          status: 'partial',
        },
      ]);

      // 模拟应付账款数据
      setPayables([
        {
          id: '1',
          entityId: 'driver-1',
          entityName: '李司机',
          shipmentCount: 15,
          totalAmount: 1850,
          paidAmount: 0,
          unpaidAmount: 1850,
          status: 'pending',
        },
        {
          id: '2',
          entityId: 'driver-2',
          entityName: '王司机',
          shipmentCount: 12,
          totalAmount: 1420,
          paidAmount: 1420,
          unpaidAmount: 0,
          status: 'paid',
        },
      ]);

    } catch (error) {
      console.error('加载财务数据失败:', error);
      message.error('加载财务数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 标记收款 - 2025-10-10 18:00:00
  const handleMarkAsPaid = async (record: AccountItem) => {
    try {
      // TODO: 调用真实API
      // await financeApi.markAsPaid(record.id);
      message.success(`已标记 ${record.entityName} 的款项为已收`);
      loadFinancialData();
    } catch (error) {
      message.error('标记失败');
    }
  };

  // 应收账款列表列定义
  const receivableColumns = [
    {
      title: '客户名称',
      dataIndex: 'entityName',
      key: 'entityName',
      width: 200,
    },
    {
      title: '运单数',
      dataIndex: 'shipmentCount',
      key: 'shipmentCount',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '应收金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => <Text strong>${amount.toFixed(2)}</Text>,
    },
    {
      title: '已收金额',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => <Text type="success">${amount.toFixed(2)}</Text>,
    },
    {
      title: '未收金额',
      dataIndex: 'unpaidAmount',
      key: 'unpaidAmount',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => (
        <Text type={amount > 0 ? 'warning' : 'secondary'} strong>
          ${amount.toFixed(2)}
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          pending: { color: 'orange', text: '待收款' },
          partial: { color: 'blue', text: '部分收款' },
          paid: { color: 'green', text: '已收款' },
        };
        const config = statusMap[status] || statusMap.pending;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: AccountItem) => (
        <Space size="small">
          {record.unpaidAmount > 0 && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleMarkAsPaid(record)}
            >
              标记收款
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<FileTextOutlined />}
          >
            对账单
          </Button>
        </Space>
      ),
    },
  ];

  // 应付账款列表列定义
  const payableColumns = [
    {
      title: '司机姓名',
      dataIndex: 'entityName',
      key: 'entityName',
      width: 200,
    },
    {
      title: '任务数',
      dataIndex: 'shipmentCount',
      key: 'shipmentCount',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '应付金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => <Text strong>${amount.toFixed(2)}</Text>,
    },
    {
      title: '已付金额',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => <Text type="success">${amount.toFixed(2)}</Text>,
    },
    {
      title: '未付金额',
      dataIndex: 'unpaidAmount',
      key: 'unpaidAmount',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => (
        <Text type={amount > 0 ? 'warning' : 'secondary'} strong>
          ${amount.toFixed(2)}
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          pending: { color: 'orange', text: '待支付' },
          partial: { color: 'blue', text: '部分支付' },
          paid: { color: 'green', text: '已支付' },
        };
        const config = statusMap[status] || statusMap.pending;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: AccountItem) => (
        <Space size="small">
          {record.unpaidAmount > 0 && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleMarkAsPaid(record)}
            >
              标记支付
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<FileTextOutlined />}
          >
            支付清单
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 财务概览统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="应收账款"
              value={summary.totalReceivable}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#1890ff' }}
              suffix="CAD"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="应付账款"
              value={summary.totalPayable}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#ff4d4f' }}
              suffix="CAD"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="本月收入"
              value={summary.monthlyRevenue}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#52c41a' }}
              suffix="CAD"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="本月利润"
              value={summary.monthlyProfit}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#722ed1' }}
              suffix="CAD"
            />
          </Card>
        </Col>
      </Row>

      {/* 财务管理Tab */}
      <Card>
        <Tabs defaultActiveKey="receivable">
          <TabPane tab="📥 应收账款" key="receivable">
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
              <Space>
                <RangePicker
                  value={dateRange}
                  onChange={(dates) => dates && setDateRange([dates[0]!, dates[1]!])}
                />
                <Button onClick={loadFinancialData}>刷新</Button>
              </Space>
              <Button type="primary" icon={<DownloadOutlined />}>
                导出对账单
              </Button>
            </div>
            <Table
              columns={receivableColumns}
              dataSource={receivables}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </TabPane>

          <TabPane tab="📤 应付账款" key="payable">
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
              <Space>
                <RangePicker
                  value={dateRange}
                  onChange={(dates) => dates && setDateRange([dates[0]!, dates[1]!])}
                />
                <Button onClick={loadFinancialData}>刷新</Button>
              </Space>
              <Button type="primary" icon={<DownloadOutlined />}>
                导出支付清单
              </Button>
            </div>
            <Table
              columns={payableColumns}
              dataSource={payables}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </TabPane>

          <TabPane tab="📊 财务报表" key="reports">
            <FinancialDashboard />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default FinanceManagementSimplified;

