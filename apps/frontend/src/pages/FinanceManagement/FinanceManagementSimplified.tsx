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
import { financeApi } from '../../services/api'; // 2025-11-11 10:15:05 财务模块对接后端接口
import FinancialDashboard from '../../components/FinancialReports/FinancialDashboard'; // 2025-10-12 09:33:00
import dayjs from 'dayjs';
import { Statement } from '../../types'; // 2025-11-11 10:15:05 引入财务报表类型

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

  const mapStatementToAccountItem = (statement: Statement): AccountItem => {
    const paid = statement.status === 'paid' || statement.status === 'settled';
    const total = Number(statement.totalAmount || 0);
    const items = Array.isArray(statement.items) ? statement.items.length : 0;
    return {
      id: statement.id,
      entityId: statement.entityId,
      entityName: statement.entityName,
      shipmentCount: items,
      totalAmount: total,
      paidAmount: paid ? total : 0,
      unpaidAmount: paid ? 0 : total,
      status: statement.status || 'pending',
    };
  }; // 2025-11-11 10:15:05 新增：映射财务报表数据

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      const [start, end] = dateRange;
      const params = {
        startDate: start.format('YYYY-MM-DD'),
        endDate: end.format('YYYY-MM-DD'),
      };
      const [customerRes, driverRes] = await Promise.all([
        financeApi.getStatements({ ...params, type: 'customer' }),
        financeApi.getStatements({ ...params, type: 'driver' }),
      ]);
      const customerStatements = customerRes.data?.data || [];
      const driverStatements = driverRes.data?.data || [];
      const receivableItems = customerStatements.map(mapStatementToAccountItem);
      const payableItems = driverStatements.map(mapStatementToAccountItem);
      setReceivables(receivableItems);
      setPayables(payableItems);
      const totalReceivable = receivableItems.reduce((sum, item) => sum + item.totalAmount, 0);
      const totalPayable = payableItems.reduce((sum, item) => sum + item.totalAmount, 0);
      setSummary({
        totalReceivable,
        totalPayable,
        monthlyRevenue: totalReceivable,
        monthlyProfit: totalReceivable - totalPayable,
      });
    } catch (error) {
      console.error('加载财务数据失败:', error);
      message.error('加载财务数据失败');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (items: AccountItem[], filename: string) => {
    if (items.length === 0) {
      message.info('暂无数据可导出');
      return;
    }
    const header = ['名称', '运单数', '应收金额', '已收金额', '未收金额', '状态'];
    const rows = items.map(item => [
      item.entityName,
      item.shipmentCount,
      item.totalAmount,
      item.paidAmount,
      item.unpaidAmount,
      item.status,
    ]);
    const csvContent = [header, ...rows]
      .map(columns => columns.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    message.success('导出成功');
  }; // 2025-11-11 10:15:05 新增：导出CSV工具方法

  const handleExport = (type: 'receivable' | 'payable') => {
    if (type === 'receivable') {
      exportToCSV(receivables, `customer-statements-${Date.now()}.csv`);
    } else {
      exportToCSV(payables, `driver-statements-${Date.now()}.csv`);
    }
  }; // 2025-11-11 10:15:05 新增：导出按钮处理

  // 标记收款 - 2025-10-10 18:00:00, 2025-11-29T11:25:04Z 完成：调用真实API
  const handleMarkAsPaid = async (record: AccountItem) => {
    try {
      await financeApi.markAsPaid(record.id, record.unpaidAmount);
      message.success(`已标记 ${record.entityName} 的款项为已收`);
      loadFinancialData();
    } catch (error: any) {
      message.error(`标记失败: ${error.response?.data?.error?.message || error.message || '未知错误'}`);
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
      render: (_: unknown, record: AccountItem) => (
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
      render: (_: unknown, record: AccountItem) => (
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
              <Button type="primary" icon={<DownloadOutlined />} onClick={() => handleExport('receivable')}>
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
              <Button type="primary" icon={<DownloadOutlined />} onClick={() => handleExport('payable')}>
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

