// 司机绩效考核和薪酬计算组件
// 创建时间: 2025-09-29 15:50:00
// 作用: 管理司机绩效考核和薪酬计算详情

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  Progress,
  Alert,
  Tabs,
  Timeline,
  Tooltip,
  Avatar,
  Badge,
  Rate,
  Divider,
} from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  TrophyOutlined,
  CalendarOutlined,
  TruckOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  StarOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  EditOutlined,
  EyeOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { driversApi } from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'suspended';
  totalTrips: number;
  totalEarnings: number;
  rating: number;
  lastActiveDate: string;
}

interface PerformanceRecord {
  id: string;
  driverId: string;
  driverName: string;
  period: string;
  totalTrips: number;
  completedTrips: number;
  onTimeRate: number;
  customerRating: number;
  safetyScore: number;
  fuelEfficiency: number;
  totalEarnings: number;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  performanceGrade: 'A' | 'B' | 'C' | 'D';
}

interface SalaryDetail {
  id: string;
  driverId: string;
  driverName: string;
  month: string;
  baseSalary: number;
  tripBonus: number;
  overtimePay: number;
  fuelAllowance: number;
  performanceBonus: number;
  deductions: number;
  netSalary: number;
  status: 'pending' | 'approved' | 'paid';
  paidDate?: string;
}

const DriverPerformance: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [performanceRecords, setPerformanceRecords] = useState<PerformanceRecord[]>([]);
  const [salaryDetails, setSalaryDetails] = useState<SalaryDetail[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PerformanceRecord | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 模拟数据 - 实际项目中应该调用API
      const mockDrivers: Driver[] = [
        {
          id: 'D001',
          name: '张三',
          phone: '13800138000',
          licenseNumber: 'A123456789',
          joinDate: '2023-01-15',
          status: 'active',
          totalTrips: 245,
          totalEarnings: 125000,
          rating: 4.8,
          lastActiveDate: '2025-09-29',
        },
        {
          id: 'D002',
          name: '李四',
          phone: '13900139000',
          licenseNumber: 'A987654321',
          joinDate: '2023-03-20',
          status: 'active',
          totalTrips: 189,
          totalEarnings: 98000,
          rating: 4.6,
          lastActiveDate: '2025-09-28',
        },
        {
          id: 'D003',
          name: '王五',
          phone: '13700137000',
          licenseNumber: 'A555666777',
          joinDate: '2023-06-10',
          status: 'active',
          totalTrips: 156,
          totalEarnings: 78000,
          rating: 4.4,
          lastActiveDate: '2025-09-27',
        },
      ];

      const mockPerformanceRecords: PerformanceRecord[] = [
        {
          id: 'P001',
          driverId: 'D001',
          driverName: '张三',
          period: '2025-09',
          totalTrips: 28,
          completedTrips: 27,
          onTimeRate: 96.4,
          customerRating: 4.8,
          safetyScore: 95,
          fuelEfficiency: 88,
          totalEarnings: 14200,
          baseSalary: 8000,
          bonus: 6200,
          deductions: 0,
          netSalary: 14200,
          performanceGrade: 'A',
        },
        {
          id: 'P002',
          driverId: 'D002',
          driverName: '李四',
          period: '2025-09',
          totalTrips: 22,
          completedTrips: 21,
          onTimeRate: 95.5,
          customerRating: 4.6,
          safetyScore: 92,
          fuelEfficiency: 85,
          totalEarnings: 11800,
          baseSalary: 8000,
          bonus: 3800,
          deductions: 0,
          netSalary: 11800,
          performanceGrade: 'B',
        },
        {
          id: 'P003',
          driverId: 'D003',
          driverName: '王五',
          period: '2025-09',
          totalTrips: 18,
          completedTrips: 17,
          onTimeRate: 94.4,
          customerRating: 4.4,
          safetyScore: 88,
          fuelEfficiency: 82,
          totalEarnings: 9800,
          baseSalary: 8000,
          bonus: 1800,
          deductions: 0,
          netSalary: 9800,
          performanceGrade: 'B',
        },
      ];

      const mockSalaryDetails: SalaryDetail[] = [
        {
          id: 'S001',
          driverId: 'D001',
          driverName: '张三',
          month: '2025-09',
          baseSalary: 8000,
          tripBonus: 4200,
          overtimePay: 800,
          fuelAllowance: 1200,
          performanceBonus: 1000,
          deductions: 0,
          netSalary: 15200,
          status: 'paid',
          paidDate: '2025-09-30',
        },
        {
          id: 'S002',
          driverId: 'D002',
          driverName: '李四',
          month: '2025-09',
          baseSalary: 8000,
          tripBonus: 2800,
          overtimePay: 600,
          fuelAllowance: 1000,
          performanceBonus: 500,
          deductions: 0,
          netSalary: 12900,
          status: 'paid',
          paidDate: '2025-09-30',
        },
        {
          id: 'S003',
          driverId: 'D003',
          driverName: '王五',
          month: '2025-09',
          baseSalary: 8000,
          tripBonus: 1800,
          overtimePay: 400,
          fuelAllowance: 800,
          performanceBonus: 0,
          deductions: 0,
          netSalary: 11000,
          status: 'approved',
        },
      ];

      setDrivers(mockDrivers);
      setPerformanceRecords(mockPerformanceRecords);
      setSalaryDetails(mockSalaryDetails);
    } catch (error) {
      console.error('加载数据失败:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    const colors = {
      A: 'green',
      B: 'blue',
      C: 'orange',
      D: 'red',
    };
    return colors[grade as keyof typeof colors] || 'default';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'green',
      inactive: 'default',
      suspended: 'red',
      pending: 'orange',
      approved: 'blue',
      paid: 'green',
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts = {
      active: '活跃',
      inactive: '非活跃',
      suspended: '暂停',
      pending: '待审核',
      approved: '已审核',
      paid: '已发放',
    };
    return texts[status as keyof typeof texts] || status;
  };

  const performanceColumns = [
    {
      title: '司机',
      dataIndex: 'driverName',
      key: 'driverName',
      render: (name: string, record: PerformanceRecord) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div>{name}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.period}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '运单完成情况',
      key: 'trips',
      render: (_, record: PerformanceRecord) => (
        <div>
          <div>完成: {record.completedTrips}/{record.totalTrips}</div>
          <Progress 
            percent={Math.round((record.completedTrips / record.totalTrips) * 100)} 
            size="small" 
            status={record.completedTrips === record.totalTrips ? 'success' : 'normal'}
          />
        </div>
      ),
    },
    {
      title: '准时率',
      dataIndex: 'onTimeRate',
      key: 'onTimeRate',
      render: (rate: number) => (
        <div>
          <div>{rate}%</div>
          <Progress 
            percent={rate} 
            size="small" 
            status={rate >= 95 ? 'success' : rate >= 85 ? 'normal' : 'exception'}
          />
        </div>
      ),
      sorter: (a: PerformanceRecord, b: PerformanceRecord) => a.onTimeRate - b.onTimeRate,
    },
    {
      title: '客户评分',
      dataIndex: 'customerRating',
      key: 'customerRating',
      render: (rating: number) => (
        <div>
          <Rate disabled value={rating} allowHalf style={{ fontSize: '14px' }} />
          <div style={{ fontSize: '12px', color: '#666' }}>{rating}</div>
        </div>
      ),
      sorter: (a: PerformanceRecord, b: PerformanceRecord) => a.customerRating - b.customerRating,
    },
    {
      title: '安全分数',
      dataIndex: 'safetyScore',
      key: 'safetyScore',
      render: (score: number) => (
        <div>
          <div>{score}</div>
          <Progress 
            percent={score} 
            size="small" 
            status={score >= 90 ? 'success' : score >= 80 ? 'normal' : 'exception'}
          />
        </div>
      ),
      sorter: (a: PerformanceRecord, b: PerformanceRecord) => a.safetyScore - b.safetyScore,
    },
    {
      title: '绩效等级',
      dataIndex: 'performanceGrade',
      key: 'performanceGrade',
      render: (grade: string) => (
        <Tag color={getGradeColor(grade)} style={{ fontSize: '16px', padding: '4px 8px' }}>
          {grade}
        </Tag>
      ),
      sorter: (a: PerformanceRecord, b: PerformanceRecord) => a.performanceGrade.localeCompare(b.performanceGrade),
    },
    {
      title: '薪酬',
      key: 'salary',
      render: (_, record: PerformanceRecord) => (
        <div>
          <div style={{ fontSize: '12px', color: '#666' }}>基础: ¥{record.baseSalary}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>奖金: ¥{record.bonus}</div>
          <div style={{ fontWeight: 'bold', color: '#1890ff' }}>总计: ¥{record.netSalary}</div>
        </div>
      ),
    },
  ];

  const salaryColumns = [
    {
      title: '司机',
      dataIndex: 'driverName',
      key: 'driverName',
      render: (name: string, record: SalaryDetail) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div>{name}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.month}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '基础工资',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '运单奖金',
      dataIndex: 'tripBonus',
      key: 'tripBonus',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '加班费',
      dataIndex: 'overtimePay',
      key: 'overtimePay',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '燃油补贴',
      dataIndex: 'fuelAllowance',
      key: 'fuelAllowance',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '绩效奖金',
      dataIndex: 'performanceBonus',
      key: 'performanceBonus',
      render: (value: number) => (
        <Text style={{ color: value > 0 ? '#52c41a' : '#666' }}>
          {value > 0 ? `+¥${value.toLocaleString()}` : '¥0'}
        </Text>
      ),
    },
    {
      title: '实发工资',
      dataIndex: 'netSalary',
      key: 'netSalary',
      render: (value: number) => (
        <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
          ¥{value.toLocaleString()}
        </Text>
      ),
      sorter: (a: SalaryDetail, b: SalaryDetail) => a.netSalary - b.netSalary,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: SalaryDetail) => (
        <div>
          <Tag color={getStatusColor(status)}>
            {getStatusText(status)}
          </Tag>
          {record.paidDate && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
              发放: {dayjs(record.paidDate).format('MM-DD')}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: SalaryDetail) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />}>
            详情
          </Button>
          {record.status === 'approved' && (
            <Button type="link" size="small" icon={<DollarOutlined />}>
              发放
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const driverColumns = [
    {
      title: '司机信息',
      key: 'driverInfo',
      render: (_, record: Driver) => (
        <Space>
          <Avatar size="large" icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.name}</div>
            <Text type="secondary">{record.phone}</Text>
            <div style={{ fontSize: '12px', color: '#666' }}>
              驾照: {record.licenseNumber}
            </div>
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
    },
    {
      title: '总运单数',
      dataIndex: 'totalTrips',
      key: 'totalTrips',
      render: (trips: number) => (
        <Badge count={trips} showZero color="blue" />
      ),
      sorter: (a: Driver, b: Driver) => a.totalTrips - b.totalTrips,
    },
    {
      title: '总收入',
      dataIndex: 'totalEarnings',
      key: 'totalEarnings',
      render: (earnings: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          ¥{earnings.toLocaleString()}
        </Text>
      ),
      sorter: (a: Driver, b: Driver) => a.totalEarnings - b.totalEarnings,
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => (
        <div>
          <Rate disabled value={rating} allowHalf style={{ fontSize: '16px' }} />
          <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
            {rating}
          </div>
        </div>
      ),
      sorter: (a: Driver, b: Driver) => a.rating - b.rating,
    },
    {
      title: '入职日期',
      dataIndex: 'joinDate',
      key: 'joinDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '最后活跃',
      dataIndex: 'lastActiveDate',
      key: 'lastActiveDate',
      render: (date: string) => dayjs(date).format('MM-DD HH:mm'),
    },
  ];

  const tabItems = [
    {
      key: 'performance',
      label: '绩效考核',
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>司机绩效考核</Title>
            <Button type="primary" icon={<TrophyOutlined />}>
              生成考核报告
            </Button>
          </div>
          
          <Table
            columns={performanceColumns}
            dataSource={performanceRecords}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
          />
        </div>
      ),
    },
    {
      key: 'salary',
      label: '薪酬管理',
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>司机薪酬详情</Title>
            <Space>
              <Button icon={<DownloadOutlined />}>
                导出薪酬单
              </Button>
              <Button type="primary" icon={<DollarOutlined />}>
                批量发放
              </Button>
            </Space>
          </div>
          
          <Table
            columns={salaryColumns}
            dataSource={salaryDetails}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
          />
        </div>
      ),
    },
    {
      key: 'drivers',
      label: '司机档案',
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>司机档案管理</Title>
          </div>
          
          <Table
            columns={driverColumns}
            dataSource={drivers}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1000 }}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* 统计概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃司机"
              value={drivers.filter(d => d.status === 'active').length}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="本月总薪酬"
              value={salaryDetails.reduce((sum, s) => sum + s.netSalary, 0)}
              prefix="¥"
              precision={0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平均评分"
              value={drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length}
              precision={1}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待发放薪酬"
              value={salaryDetails.filter(s => s.status === 'approved').reduce((sum, s) => sum + s.netSalary, 0)}
              prefix="¥"
              precision={0}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要内容 */}
      <Tabs defaultActiveKey="performance" items={tabItems} />
    </div>
  );
};

export default DriverPerformance;
