// 路径优化算法组件
// 创建时间: 2025-09-29 21:40:00
// 作用: 行程路径优化和智能路线规划

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Select,
  Input,
  Typography,
  Space,
  Tag,
  Table,
  Progress,
  Alert,
  Modal,
  Form,
  InputNumber,
  Switch,
  message,
  Divider,
  Statistic,
  Timeline,
  Tooltip,
} from 'antd';
import {
  BranchesOutlined,
  CarOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  BulbOutlined,
  CalculatorOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface RouteOptimizationParams {
  algorithm: 'nearest_neighbor' | 'genetic' | 'simulated_annealing' | 'ant_colony';
  maxDistance: number;
  maxTime: number;
  fuelEfficiency: boolean;
  trafficAvoidance: boolean;
  driverPreferences: boolean;
  vehicleCapacity: number;
}

interface OptimizedRoute {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  driverName: string;
  stops: RouteStop[];
  totalDistance: number;
  totalTime: number;
  totalCost: number;
  efficiency: number;
  status: 'optimized' | 'in_progress' | 'completed';
}

interface RouteStop {
  id: string;
  address: string;
  type: 'pickup' | 'delivery';
  priority: 'high' | 'medium' | 'low';
  timeWindow: {
    start: string;
    end: string;
  };
  estimatedDuration: number;
  actualArrival?: string;
  actualDeparture?: string;
}

interface OptimizationResult {
  algorithm: string;
  executionTime: number;
  originalCost: number;
  optimizedCost: number;
  savings: number;
  improvement: number;
  routes: OptimizedRoute[];
}

const RouteOptimization: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationParams, setOptimizationParams] = useState<RouteOptimizationParams>({
    algorithm: 'nearest_neighbor',
    maxDistance: 500,
    maxTime: 480,
    fuelEfficiency: true,
    trafficAvoidance: true,
    driverPreferences: false,
    vehicleCapacity: 1000,
  });
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);

  const mockRoutes: OptimizedRoute[] = [
    {
      id: 'R001',
      vehicleId: 'V001',
      vehiclePlate: '京A12345',
      driverName: '张三',
      stops: [
        {
          id: 'S001',
          address: '北京市朝阳区xxx街道',
          type: 'pickup',
          priority: 'high',
          timeWindow: { start: '09:00', end: '10:00' },
          estimatedDuration: 30,
        },
        {
          id: 'S002',
          address: '北京市海淀区yyy路',
          type: 'delivery',
          priority: 'medium',
          timeWindow: { start: '11:00', end: '12:00' },
          estimatedDuration: 20,
        },
        {
          id: 'S003',
          address: '北京市西城区zzz街',
          type: 'pickup',
          priority: 'low',
          timeWindow: { start: '14:00', end: '15:00' },
          estimatedDuration: 25,
        },
      ],
      totalDistance: 45.2,
      totalTime: 180,
      totalCost: 280,
      efficiency: 85.5,
      status: 'optimized',
    },
    {
      id: 'R002',
      vehicleId: 'V002',
      vehiclePlate: '京B67890',
      driverName: '李四',
      stops: [
        {
          id: 'S004',
          address: '北京市东城区aaa大道',
          type: 'delivery',
          priority: 'high',
          timeWindow: { start: '08:30', end: '09:30' },
          estimatedDuration: 35,
        },
        {
          id: 'S005',
          address: '北京市丰台区bbb路',
          type: 'pickup',
          priority: 'medium',
          timeWindow: { start: '13:00', end: '14:00' },
          estimatedDuration: 30,
        },
      ],
      totalDistance: 32.8,
      totalTime: 150,
      totalCost: 220,
      efficiency: 92.3,
      status: 'optimized',
    },
  ];

  const handleOptimize = async () => {
    setOptimizing(true);
    setLoading(true);

    try {
      // 模拟优化过程
      await new Promise(resolve => setTimeout(resolve, 3000));

      const result: OptimizationResult = {
        algorithm: optimizationParams.algorithm,
        executionTime: 2.8,
        originalCost: 650,
        optimizedCost: 500,
        savings: 150,
        improvement: 23.1,
        routes: mockRoutes,
      };

      setOptimizationResult(result);
      message.success('路径优化完成！');
    } catch (error) {
      message.error('路径优化失败');
    } finally {
      setOptimizing(false);
      setLoading(false);
    }
  };

  const getAlgorithmName = (algorithm: string) => {
    const names = {
      nearest_neighbor: '最近邻算法',
      genetic: '遗传算法',
      simulated_annealing: '模拟退火算法',
      ant_colony: '蚁群算法',
    };
    return names[algorithm as keyof typeof names] || algorithm;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      optimized: 'green',
      in_progress: 'blue',
      completed: 'gray',
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts = {
      optimized: '已优化',
      in_progress: '进行中',
      completed: '已完成',
    };
    return texts[status as keyof typeof texts] || status;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'red',
      medium: 'orange',
      low: 'green',
    };
    return colors[priority as keyof typeof colors] || 'default';
  };

  const routeColumns = [
    {
      title: '车辆信息',
      key: 'vehicle',
      render: (_, record: OptimizedRoute) => (
        <Space>
          <CarOutlined />
          <div>
            <div><Text strong>{record.vehiclePlate}</Text></div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.driverName}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '停靠点',
      dataIndex: 'stops',
      key: 'stops',
      render: (stops: RouteStop[]) => (
        <div>
          <Badge count={stops.length} showZero color="blue" />
          <div style={{ marginTop: 4 }}>
            {stops.map((stop, index) => (
              <Tag 
                key={stop.id} 
                color={getPriorityColor(stop.priority)} 
                size="small"
                style={{ marginBottom: 2 }}
              >
                {index + 1}. {stop.type === 'pickup' ? '取货' : '送货'}
              </Tag>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: '总距离',
      dataIndex: 'totalDistance',
      key: 'totalDistance',
      render: (distance: number) => `${distance} km`,
      sorter: (a: OptimizedRoute, b: OptimizedRoute) => a.totalDistance - b.totalDistance,
    },
    {
      title: '总时间',
      dataIndex: 'totalTime',
      key: 'totalTime',
      render: (time: number) => `${Math.floor(time / 60)}h ${time % 60}m`,
      sorter: (a: OptimizedRoute, b: OptimizedRoute) => a.totalTime - b.totalTime,
    },
    {
      title: '总成本',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (cost: number) => `¥${cost}`,
      sorter: (a: OptimizedRoute, b: OptimizedRoute) => a.totalCost - b.totalCost,
    },
    {
      title: '效率',
      dataIndex: 'efficiency',
      key: 'efficiency',
      render: (efficiency: number) => (
        <div>
          <Progress 
            percent={efficiency} 
            size="small" 
            status={efficiency >= 90 ? 'success' : efficiency >= 70 ? 'normal' : 'exception'}
          />
          <Text style={{ fontSize: '12px' }}>{efficiency}%</Text>
        </div>
      ),
      sorter: (a: OptimizedRoute, b: OptimizedRoute) => a.efficiency - b.efficiency,
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
  ];

  return (
    <div>
      {/* 优化控制面板 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Text strong>优化算法:</Text>
              <Select
                value={optimizationParams.algorithm}
                onChange={(value) => setOptimizationParams({...optimizationParams, algorithm: value})}
                style={{ width: 120 }}
              >
                <Option value="nearest_neighbor">最近邻</Option>
                <Option value="genetic">遗传算法</Option>
                <Option value="simulated_annealing">模拟退火</Option>
                <Option value="ant_colony">蚁群算法</Option>
              </Select>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Text strong>最大距离:</Text>
              <InputNumber
                value={optimizationParams.maxDistance}
                onChange={(value) => setOptimizationParams({...optimizationParams, maxDistance: value || 500})}
                min={100}
                max={1000}
                step={50}
                style={{ width: 80 }}
                suffix="km"
              />
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Text strong>最大时间:</Text>
              <InputNumber
                value={optimizationParams.maxTime}
                onChange={(value) => setOptimizationParams({...optimizationParams, maxTime: value || 480})}
                min={120}
                max={720}
                step={30}
                style={{ width: 80 }}
                suffix="min"
              />
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Button 
                type="primary" 
                icon={<ThunderboltOutlined />}
                onClick={handleOptimize}
                loading={optimizing}
                disabled={optimizing}
              >
                开始优化
              </Button>
              <Button 
                icon={<BulbOutlined />}
                onClick={() => setIsConfigModalVisible(true)}
              >
                高级配置
              </Button>
            </Space>
          </Col>
        </Row>

        {/* 优化选项 */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={8} md={6}>
            <Space>
              <Switch
                checked={optimizationParams.fuelEfficiency}
                onChange={(checked) => setOptimizationParams({...optimizationParams, fuelEfficiency: checked})}
                size="small"
              />
              <Text>燃油效率优先</Text>
            </Space>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Space>
              <Switch
                checked={optimizationParams.trafficAvoidance}
                onChange={(checked) => setOptimizationParams({...optimizationParams, trafficAvoidance: checked})}
                size="small"
              />
              <Text>避开拥堵</Text>
            </Space>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Space>
              <Switch
                checked={optimizationParams.driverPreferences}
                onChange={(checked) => setOptimizationParams({...optimizationParams, driverPreferences: checked})}
                size="small"
              />
              <Text>司机偏好</Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 优化结果 */}
      {optimizationResult && (
        <Card title="优化结果" style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="使用算法"
                value={getAlgorithmName(optimizationResult.algorithm)}
                prefix={<CalculatorOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="执行时间"
                value={optimizationResult.executionTime}
                suffix="秒"
                prefix={<ClockCircleOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="成本节省"
                value={optimizationResult.savings}
                prefix="¥"
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="效率提升"
                value={optimizationResult.improvement}
                suffix="%"
                prefix={<ThunderboltOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
          </Row>

          <Alert
            message="优化完成"
            description={`使用${getAlgorithmName(optimizationResult.algorithm)}算法，共节省成本¥${optimizationResult.savings}，效率提升${optimizationResult.improvement}%`}
            type="success"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Card>
      )}

      {/* 优化后的路线列表 */}
      <Card title="优化后的路线" extra={<BranchesOutlined />}>
        <Table
          columns={routeColumns}
          dataSource={optimizationResult?.routes || mockRoutes}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 高级配置模态框 */}
      <Modal
        title="高级优化配置"
        open={isConfigModalVisible}
        onCancel={() => setIsConfigModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="车辆容量">
            <InputNumber
              value={optimizationParams.vehicleCapacity}
              onChange={(value) => setOptimizationParams({...optimizationParams, vehicleCapacity: value || 1000})}
              style={{ width: '100%' }}
              min={100}
              max={5000}
              step={100}
              suffix="kg"
            />
          </Form.Item>
          
          <Form.Item label="优化权重">
            <Row gutter={16}>
              <Col span={12}>
                <Text>距离权重</Text>
                <InputNumber
                  style={{ width: '100%', marginTop: 4 }}
                  min={0}
                  max={1}
                  step={0.1}
                  defaultValue={0.4}
                />
              </Col>
              <Col span={12}>
                <Text>时间权重</Text>
                <InputNumber
                  style={{ width: '100%', marginTop: 4 }}
                  min={0}
                  max={1}
                  step={0.1}
                  defaultValue={0.3}
                />
              </Col>
            </Row>
          </Form.Item>

          <Form.Item label="约束条件">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Switch defaultChecked>司机工作时间限制</Switch>
              <Switch defaultChecked>车辆载重限制</Switch>
              <Switch defaultChecked>客户时间窗口</Switch>
              <Switch>天气因素考虑</Switch>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RouteOptimization;
