import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Space, Button } from 'antd';
import {
  DollarOutlined,
  TruckOutlined,
  TeamOutlined,
  FileTextOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { shipmentsApi, rulesApi, customersApi, driversApi } from '../../services/api';
import { formatCurrency } from '../../utils/formatCurrency';



interface DashboardStats {
  totalShipments: number;
  activeRules: number;
  totalCustomers: number;
  totalDrivers: number;
  monthlyRevenue: number;
  revenueGrowth: number;
}

interface RecentShipment {
  id: string;
  shipmentNumber: string;
  customerName: string;
  status: string;
  estimatedCost: number | null | undefined;
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalShipments: 0,
    activeRules: 0,
    totalCustomers: 0,
    totalDrivers: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
  });
  const [recentShipments, setRecentShipments] = useState<RecentShipment[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 并行加载所有数据
      const [shipmentsRes, rulesRes, customersRes, driversRes] = await Promise.all([
        shipmentsApi.getShipments({ limit: 5 }),
        rulesApi.getRules({ status: 'active' }),
        customersApi.getCustomers({ limit: 1 }),
        driversApi.getDrivers({ limit: 1 }),
      ]);

      // 计算统计数据
      const totalShipments = shipmentsRes.data?.pagination?.total || 0;
      const activeRules = rulesRes.data?.pagination?.total || 0;
      const totalCustomers = customersRes.data?.pagination?.total || 0;
      const totalDrivers = driversRes.data?.pagination?.total || 0;
      
      // 模拟月度收入和增长率
      const monthlyRevenue = totalShipments * 500; // 假设平均每单500元
      const revenueGrowth = 12.5; // 模拟增长率

      setStats({
        totalShipments,
        activeRules,
        totalCustomers,
        totalDrivers,
        monthlyRevenue,
        revenueGrowth,
      });

      // 设置最近运单数据
      if (shipmentsRes.data?.data) {
        // 调试：检查 estimatedCost 的数据类型 // 2025-01-27 15:35:00
        console.log('Shipment data types:', shipmentsRes.data.data.map((shipment: any) => ({
          id: shipment.id,
          estimatedCost: shipment.estimatedCost,
          estimatedCostType: typeof shipment.estimatedCost
        })));
        setRecentShipments(shipmentsRes.data.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待处理' },
      in_transit: { color: 'blue', text: '运输中' },
      completed: { color: 'green', text: '已完成' },
      cancelled: { color: 'red', text: '已取消' },
    };
    
    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const shipmentColumns = [
    {
      title: '运单号',
      dataIndex: 'shipmentNumber',
      key: 'shipmentNumber',
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '预估费用',
      dataIndex: 'estimatedCost',
      key: 'estimatedCost',
      render: (cost: number | string | null | undefined) => {
        // 使用安全的货币格式化函数，彻底解决 toFixed 错误 // 2025-09-26 17:50:00
        try {
          return formatCurrency(cost, 2, '¥');
        } catch (error) {
          console.error('Error formatting cost in Dashboard:', error, 'cost:', cost);
          return '¥0.00';
        }
      },
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
      render: (_: any, record: RecentShipment) => (
        <Space size="middle">
          <Button
            type="link"
            onClick={() => navigate(`/shipments/${record.id}`)}
          >
            查看详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">仪表盘</h1>
        <p className="page-description">欢迎使用TMS智能物流运营平台</p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stats-card">
            <Statistic
              title="总运单数"
              value={stats.totalShipments}
              prefix={<TruckOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stats-card">
            <Statistic
              title="活跃规则"
              value={stats.activeRules}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stats-card">
            <Statistic
              title="客户总数"
              value={stats.totalCustomers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stats-card">
            <Statistic
              title="司机总数"
              value={stats.totalDrivers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 收入统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card className="content-card">
            <Statistic
              title="月度收入"
              value={stats.monthlyRevenue}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card className="content-card">
            <Statistic
              title="收入增长率"
              value={stats.revenueGrowth}
              precision={1}
              suffix="%"
              prefix={stats.revenueGrowth > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              valueStyle={{ color: stats.revenueGrowth > 0 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 最近运单 */}
      <Card
        className="content-card"
        title="最近运单"
        extra={
          <Button type="primary" onClick={() => navigate('/shipments')}>
            查看全部
          </Button>
        }
      >
        <Table
          columns={shipmentColumns}
          dataSource={recentShipments}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default Dashboard;
