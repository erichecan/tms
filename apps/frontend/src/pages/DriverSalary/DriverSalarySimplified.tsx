// 简化版司机薪酬页面
// 创建时间: 2025-10-10 18:05:00
// 目标: 司机一目了然看到收入和任务完成情况

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Statistic,
  Row,
  Col,
  Typography,
  Select,
  Tag,
  Progress,
  Space,
  Button,
} from 'antd';
import {
  TrophyOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { driversApi, shipmentsApi } from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface DriverStats {
  driverId: string;
  driverName: string;
  completedTasks: number;
  totalIncome: number;
  onTimeRate: number;
  podUploadRate: number; // POD上传完成率 - 2025-10-10 18:15:00
  avgIncomePerTask: number;
}

interface TaskRecord {
  id: string;
  date: string;
  shipmentNumber: string;
  route: string;
  income: number;
  status: 'completed' | 'delayed' | 'cancelled';
  onTime: boolean;
}

const DriverSalarySimplified: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [driverStats, setDriverStats] = useState<DriverStats | null>(null);
  const [taskRecords, setTaskRecords] = useState<TaskRecord[]>([]);

  useEffect(() => {
    loadDrivers();
  }, []);

  useEffect(() => {
    if (selectedDriverId) {
      loadDriverStats(selectedDriverId);
      loadDriverTasks(selectedDriverId);
    }
  }, [selectedDriverId]);

  const loadDrivers = async () => {
    try {
      const response = await driversApi.getDrivers();
      const driverList = response.data?.data || [];
      setDrivers(driverList);
      
      if (driverList.length > 0 && !selectedDriverId) {
        setSelectedDriverId(driverList[0].id);
      }
    } catch (error) {
      console.error('加载司机列表失败:', error);
    }
  };

  const loadDriverStats = async (driverId: string) => {
    try {
      setLoading(true);
      
      // TODO: 调用真实API
      // const response = await driversApi.getStats(driverId);
      
      // 临时模拟数据 - 2025-10-10 18:15:00
      const driver = drivers.find(d => d.id === driverId);
      setDriverStats({
        driverId,
        driverName: driver?.name || '司机',
        completedTasks: 24,
        totalIncome: 1850,
        onTimeRate: 95.8,
        podUploadRate: 91.7, // POD上传完成率 - 2025-10-10 18:15:00
        avgIncomePerTask: 77.08,
      });
    } catch (error) {
      console.error('加载司机统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDriverTasks = async (driverId: string) => {
    try {
      // TODO: 调用真实API
      // const response = await shipmentsApi.getDriverShipments(driverId);
      
      // 临时模拟数据 - 2025-10-10 18:05:00
      setTaskRecords([
        {
          id: '1',
          date: '2025-10-10',
          shipmentNumber: 'TMS202510100001',
          route: 'Toronto → Markham',
          income: 85,
          status: 'completed',
          onTime: true,
        },
        {
          id: '2',
          date: '2025-10-09',
          shipmentNumber: 'TMS202510090023',
          route: 'North York → Scarborough',
          income: 72,
          status: 'completed',
          onTime: true,
        },
        {
          id: '3',
          date: '2025-10-09',
          shipmentNumber: 'TMS202510090024',
          route: 'Mississauga → Brampton',
          income: 65,
          status: 'completed',
          onTime: false,
        },
      ]);
    } catch (error) {
      console.error('加载司机任务失败:', error);
    }
  };

  const taskColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => dayjs(date).format('MM/DD'),
    },
    {
      title: '运单号',
      dataIndex: 'shipmentNumber',
      key: 'shipmentNumber',
      width: 180,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '路线',
      dataIndex: 'route',
      key: 'route',
      width: 250,
    },
    {
      title: '收入',
      dataIndex: 'income',
      key: 'income',
      width: 100,
      align: 'right' as const,
      render: (income: number) => <Text strong>${income.toFixed(2)}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
          completed: { color: 'green', text: '已完成', icon: <CheckCircleOutlined /> },
          delayed: { color: 'orange', text: '延迟', icon: <WarningOutlined /> },
          cancelled: { color: 'red', text: '取消', icon: null },
        };
        const config = statusMap[status] || statusMap.completed;
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: '准时',
      dataIndex: 'onTime',
      key: 'onTime',
      width: 80,
      align: 'center' as const,
      render: (onTime: boolean) => (
        onTime ? <Tag color="green">✅</Tag> : <Tag color="orange">⚠️</Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3}>司机薪酬</Title>
        <Space>
          <Text>选择司机：</Text>
          <Select
            style={{ width: 200 }}
            value={selectedDriverId}
            onChange={setSelectedDriverId}
            placeholder="请选择司机"
          >
            {drivers.map(driver => (
              <Option key={driver.id} value={driver.id}>
                {driver.name}
              </Option>
            ))}
          </Select>
          <Button type="primary" icon={<DownloadOutlined />}>
            导出明细
          </Button>
        </Space>
      </div>

      
      {driverStats && (
        <>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="完成任务数"
                  value={driverStats.completedTasks}
                  prefix={<TrophyOutlined />}
                  suffix="单"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总收入"
                  value={driverStats.totalIncome}
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
                  title="准时完成率"
                  value={driverStats.onTimeRate}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: driverStats.onTimeRate >= 95 ? '#52c41a' : '#faad14' }}
                />
                <Progress 
                  percent={driverStats.onTimeRate} 
                  showInfo={false}
                  strokeColor={driverStats.onTimeRate >= 95 ? '#52c41a' : '#faad14'}
                  style={{ marginTop: 8 }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="POD上传完成率"
                  value={driverStats.podUploadRate}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: driverStats.podUploadRate >= 90 ? '#52c41a' : '#faad14' }}
                />
                <Progress 
                  percent={driverStats.podUploadRate} 
                  showInfo={false}
                  strokeColor={driverStats.podUploadRate >= 90 ? '#52c41a' : '#faad14'}
                  style={{ marginTop: 8 }}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}

      
      <Card title="任务明细">
        <Table
          columns={taskColumns}
          dataSource={taskRecords}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 15,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          summary={(pageData) => {
            const totalIncome = pageData.reduce((sum, record) => sum + record.income, 0);
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={3}>
                  <Text strong>本页小计</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <Text strong style={{ color: '#1890ff' }}>
                    ${totalIncome.toFixed(2)}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} colSpan={2} />
              </Table.Summary.Row>
            );
          }}
        />
      </Card>
    </div>
  );
};

export default DriverSalarySimplified;

