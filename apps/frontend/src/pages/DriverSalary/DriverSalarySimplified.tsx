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
  DatePicker,
  message,
} from 'antd';
import {
  TrophyOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { financeApi } from '../../services/api'; // Use financeApi to get payroll summary
import { useDataContext } from '../../contexts/DataContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface DriverStats {
  driverId: string;
  driverName: string;
  completedTasks: number;
  totalIncome: number;
  onTimeRate: number;
  podUploadRate: number;
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
  const { allDrivers: drivers } = useDataContext();

  const [loading, setLoading] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs(),
  ]);
  const [driverStats, setDriverStats] = useState<DriverStats | null>(null);
  const [taskRecords, setTaskRecords] = useState<TaskRecord[]>([]);

  // 自动选择第一个司机
  useEffect(() => {
    if (drivers.length > 0 && !selectedDriverId) {
      setSelectedDriverId(drivers[0].id);
    }
  }, [drivers, selectedDriverId]);

  useEffect(() => {
    if (selectedDriverId) {
      loadDriverData(selectedDriverId);
    }
  }, [selectedDriverId, dateRange]);

  const loadDriverData = async (driverId: string) => {
    try {
      setLoading(true);

      const summaryRes = await financeApi.getDriverPayrollSummary({
        driverId,
        startDate: dateRange[0].toISOString(),
        endDate: dateRange[1].toISOString(),
        periodType: 'monthly', // Default grouping
      });

      const summaries = summaryRes.data?.data || summaryRes.data || [];

      // Since we might get multiple period groups, we aggregate them for the stats view
      // and flatten them for the table view.

      let totalIncome = 0;
      let completedTasks = 0;
      let totalTasksForRate = 0;
      let onTimeCount = 0;

      const allTasks: TaskRecord[] = [];

      summaries.forEach((summary: any) => {
        totalIncome += Number(summary.totalEarnings || 0);
        completedTasks += Number(summary.shipmentsCompleted || 0);

        // Flatten trips/shipments
        summary.trips?.forEach((trip: any) => {
          trip.shipments?.forEach((shipment: any) => {
            // Basic task record construction
            allTasks.push({
              id: shipment.shipmentId,
              date: shipment.completedAt || dayjs().toISOString(),
              shipmentNumber: shipment.shipmentNumber,
              route: 'Unknown Route', // Need API to populate route if vital
              income: Number(shipment.amount || 0),
              status: 'completed', // Only completed shipments are in payroll
              onTime: true, // TODO: Need real data for on-time calculation
            });

            // For mock rates since API doesn't return rates directly yet
            totalTasksForRate++;
            onTimeCount++; // Assume on time for now as we lack this data in summary
          });
        });
      });

      // Find driver info
      const driver = drivers.find(d => d.id === driverId);

      setDriverStats({
        driverId,
        driverName: driver?.name || '未知司机',
        completedTasks,
        totalIncome,
        onTimeRate: totalTasksForRate > 0 ? (onTimeCount / totalTasksForRate) * 100 : 100,
        podUploadRate: 100, // Placeholder
        avgIncomePerTask: completedTasks > 0 ? totalIncome / completedTasks : 0,
      });

      setTaskRecords(allTasks.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()));

    } catch (error: any) {
      console.error('加载司机薪酬数据失败:', error);
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
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
    // {
    //   title: '路线',
    //   dataIndex: 'route',
    //   key: 'route',
    //   width: 250,
    // },
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
    // {
    //   title: '准时',
    //   dataIndex: 'onTime',
    //   key: 'onTime',
    //   width: 80,
    //   align: 'center' as const,
    //   render: (onTime: boolean) => (
    //     onTime ? <Tag color="green">✅</Tag> : <Tag color="orange">⚠️</Tag>
    //   ),
    // },
  ];

  return (
    <div style={{ padding: '24px' }}>

      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3}>司机薪酬</Title>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0], dates[1]]);
              }
            }}
          />
          <Select
            style={{ width: 200 }}
            value={selectedDriverId}
            onChange={setSelectedDriverId}
            placeholder="请选择司机"
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
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
                <Table.Summary.Cell index={0} colSpan={2}>
                  <Text strong>本页小计</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <Text strong style={{ color: '#1890ff' }}>
                    ${totalIncome.toFixed(2)}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} colSpan={1} />
              </Table.Summary.Row>
            );
          }}
        />
      </Card>
    </div>
  );
};

export default DriverSalarySimplified;

