// 性能监控组件
// 创建时间: 2025-09-29 22:00:00
// 作用: 系统性能监控和缓存策略管理

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
  Progress,
  Alert,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Slider,
  message,
  Divider,
  Statistic,
  Timeline,
  Tooltip,
  Badge,
  Tabs,
} from 'antd';
import {
  DatabaseOutlined as MemoryOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  BarChartOutlined,
  MonitorOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
// const { TabPane } = Tabs; // 已废弃，改用items属性

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  threshold: {
    warning: number;
    critical: number;
  };
  trend: 'up' | 'down' | 'stable';
  lastUpdate: string;
}

interface CacheStatus {
  id: string;
  name: string;
  type: 'redis' | 'memory' | 'database';
  size: number;
  hitRate: number;
  missRate: number;
  status: 'active' | 'inactive' | 'error';
  lastCleanup: string;
}

interface SystemAlert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
}

const PerformanceMonitoring: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // 秒

  useEffect(() => {
    loadPerformanceData();
    
    const interval = setInterval(() => {
      loadPerformanceData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      // 模拟性能数据
      const mockMetrics: PerformanceMetric[] = [
        {
          id: 'CPU',
          name: 'CPU使用率',
          value: Math.floor(Math.random() * 40) + 20,
          unit: '%',
          status: Math.random() > 0.8 ? 'warning' : 'good',
          threshold: { warning: 80, critical: 95 },
          trend: 'stable',
          lastUpdate: dayjs().format('HH:mm:ss'),
        },
        {
          id: 'MEMORY',
          name: '内存使用率',
          value: Math.floor(Math.random() * 30) + 40,
          unit: '%',
          status: 'good',
          threshold: { warning: 85, critical: 95 },
          trend: 'up',
          lastUpdate: dayjs().format('HH:mm:ss'),
        },
        {
          id: 'DISK',
          name: '磁盘使用率',
          value: Math.floor(Math.random() * 20) + 60,
          unit: '%',
          status: Math.random() > 0.7 ? 'warning' : 'good',
          threshold: { warning: 80, critical: 90 },
          trend: 'up',
          lastUpdate: dayjs().format('HH:mm:ss'),
        },
        {
          id: 'NETWORK',
          name: '网络延迟',
          value: Math.floor(Math.random() * 50) + 10,
          unit: 'ms',
          status: 'good',
          threshold: { warning: 100, critical: 200 },
          trend: 'stable',
          lastUpdate: dayjs().format('HH:mm:ss'),
        },
      ];

      const mockCacheStatus: CacheStatus[] = [
        {
          id: 'REDIS',
          name: 'Redis缓存',
          type: 'redis',
          size: 128,
          hitRate: 85.5,
          missRate: 14.5,
          status: 'active',
          lastCleanup: dayjs().subtract(2, 'hour').format('HH:mm:ss'),
        },
        {
          id: 'MEMORY',
          name: '内存缓存',
          type: 'memory',
          size: 256,
          hitRate: 92.3,
          missRate: 7.7,
          status: 'active',
          lastCleanup: dayjs().subtract(30, 'minute').format('HH:mm:ss'),
        },
        {
          id: 'DB',
          name: '数据库查询缓存',
          type: 'database',
          size: 64,
          hitRate: 78.9,
          missRate: 21.1,
          status: 'active',
          lastCleanup: dayjs().subtract(1, 'hour').format('HH:mm:ss'),
        },
      ];

      const mockAlerts: SystemAlert[] = [
        {
          id: 'A001',
          level: 'warning',
          title: '内存使用率偏高',
          description: '系统内存使用率达到78%，建议关注',
          timestamp: dayjs().subtract(10, 'minute').format('HH:mm:ss'),
          resolved: false,
        },
        {
          id: 'A002',
          level: 'info',
          title: '缓存清理完成',
          description: 'Redis缓存已成功清理，释放空间128MB',
          timestamp: dayjs().subtract(2, 'hour').format('HH:mm:ss'),
          resolved: true,
        },
        {
          id: 'A003',
          level: 'error',
          title: '数据库连接超时',
          description: '检测到数据库连接超时，已自动重连',
          timestamp: dayjs().subtract(5, 'minute').format('HH:mm:ss'),
          resolved: true,
        },
      ];

      setMetrics(mockMetrics);
      setCacheStatus(mockCacheStatus);
      setAlerts(mockAlerts);
    } catch (error) {
      message.error('加载性能数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      good: 'green',
      warning: 'orange',
      critical: 'red',
      active: 'green',
      inactive: 'gray',
      error: 'red',
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts = {
      good: '正常',
      warning: '警告',
      critical: '严重',
      active: '活跃',
      inactive: '非活跃',
      error: '错误',
    };
    return texts[status as keyof typeof texts] || status;
  };

  const getAlertLevelColor = (level: string) => {
    const colors = {
      info: 'blue',
      warning: 'orange',
      error: 'red',
      critical: 'red',
    };
    return colors[level as keyof typeof colors] || 'default';
  };

  const getAlertLevelIcon = (level: string) => {
    const icons = {
      info: <CheckCircleOutlined />,
      warning: <ExclamationCircleOutlined />,
      error: <WarningOutlined />,
      critical: <WarningOutlined />,
    };
    return icons[level as keyof typeof icons] || <CheckCircleOutlined />;
  };

  const getTrendIcon = (trend: string) => {
    const icons = {
      up: '📈',
      down: '📉',
      stable: '➡️',
    };
    return icons[trend as keyof typeof icons] || '➡️';
  };

  const handleClearCache = (cacheId: string) => {
    Modal.confirm({
      title: '清理缓存确认',
      content: '确定要清理此缓存吗？此操作可能影响系统性能。',
      onOk: () => {
        message.success('缓存清理完成');
        loadPerformanceData();
      },
    });
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, resolved: true }
          : alert
      )
    );
    message.success('告警已解决');
  };

  const metricsColumns = [
    {
      title: '指标名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: PerformanceMetric) => (
        <Space>
          <MonitorOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: '当前值',
      key: 'value',
      render: (_, record: PerformanceMetric) => (
        <div>
          <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {record.value}{record.unit}
          </Text>
          <div style={{ marginTop: 4 }}>
            {getTrendIcon(record.trend)}
          </div>
        </div>
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
      title: '阈值',
      key: 'threshold',
      render: (_, record: PerformanceMetric) => (
        <div>
          <div>警告: {record.threshold.warning}{record.unit}</div>
          <div>严重: {record.threshold.critical}{record.unit}</div>
        </div>
      ),
    },
    {
      title: '使用率',
      key: 'usage',
      render: (_, record: PerformanceMetric) => {
        const percentage = (record.value / record.threshold.critical) * 100;
        return (
          <Progress
            percent={Math.min(percentage, 100)}
            status={
              record.status === 'critical' ? 'exception' :
              record.status === 'warning' ? 'active' : 'normal'
            }
            size="small"
          />
        );
      },
    },
    {
      title: '最后更新',
      dataIndex: 'lastUpdate',
      key: 'lastUpdate',
      render: (time: string) => (
        <Text type="secondary">{time}</Text>
      ),
    },
  ];

  const cacheColumns = [
    {
      title: '缓存名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: CacheStatus) => (
        <Space>
          <DatabaseOutlined />
          <div>
            <div><Text strong>{text}</Text></div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.type.toUpperCase()}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => `${size} MB`,
    },
    {
      title: '命中率',
      dataIndex: 'hitRate',
      key: 'hitRate',
      render: (rate: number) => (
        <div>
          <Progress
            percent={rate}
            status={rate >= 90 ? 'success' : rate >= 70 ? 'normal' : 'exception'}
            size="small"
          />
          <Text style={{ fontSize: '12px' }}>{rate}%</Text>
        </div>
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
      title: '最后清理',
      dataIndex: 'lastCleanup',
      key: 'lastCleanup',
      render: (time: string) => (
        <Text type="secondary">{time}</Text>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: CacheStatus) => (
        <Button 
          size="small" 
          onClick={() => handleClearCache(record.id)}
          disabled={record.status !== 'active'}
        >
          清理缓存
        </Button>
      ),
    },
  ];

  const alertColumns = [
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => (
        <Tag color={getAlertLevelColor(level)} icon={getAlertLevelIcon(level)}>
          {level.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (title: string) => <Text strong>{title}</Text>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (description: string) => (
        <Text type="secondary">{description}</Text>
      ),
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (time: string) => (
        <Text type="secondary">{time}</Text>
      ),
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record: SystemAlert) => (
        <Tag color={record.resolved ? 'green' : 'orange'}>
          {record.resolved ? '已解决' : '待处理'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: SystemAlert) => (
        !record.resolved && (
          <Button 
            size="small" 
            onClick={() => handleResolveAlert(record.id)}
          >
            标记已解决
          </Button>
        )
      ),
    },
  ];

  return (
    <div>
      
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Text strong>自动刷新:</Text>
              <Select
                value={refreshInterval}
                onChange={setRefreshInterval}
                style={{ width: 100 }}
              >
                <Option value={10}>10秒</Option>
                <Option value={30}>30秒</Option>
                <Option value={60}>1分钟</Option>
                <Option value={300}>5分钟</Option>
              </Select>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Button 
                icon={<ReloadOutlined />}
                onClick={loadPerformanceData}
                loading={loading}
              >
                手动刷新
              </Button>
              <Button 
                icon={<SettingOutlined />}
                onClick={() => setIsConfigModalVisible(true)}
              >
                监控配置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="系统健康度"
              value={85}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="活跃告警"
              value={alerts.filter(a => !a.resolved).length}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="缓存命中率"
              value={cacheStatus.reduce((acc, cache) => acc + cache.hitRate, 0) / cacheStatus.length}
              suffix="%"
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="平均响应时间"
              value={metrics.find(m => m.id === 'NETWORK')?.value || 0}
              suffix="ms"
              prefix={<ApiOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      
      <Tabs 
        defaultActiveKey="metrics"
        items={[
          {
            key: "metrics",
            label: "性能指标",
            children: (
              <Card title="系统性能指标" extra={<MonitorOutlined />}>
                <Table
                  columns={metricsColumns}
                  dataSource={metrics}
                  rowKey="id"
                  loading={loading}
                  pagination={false}
                />
              </Card>
            )
          },
          {
            key: "cache",
            label: "缓存状态",
            children: (
              <Card title="缓存系统状态" extra={<MemoryOutlined />}>
                <Table
                  columns={cacheColumns}
                  dataSource={cacheStatus}
                  rowKey="id"
                  loading={loading}
                  pagination={false}
                />
              </Card>
            )
          },
          {
            key: "alerts",
            label: "系统告警",
            children: (
              <Card title="系统告警" extra={<ExclamationCircleOutlined />}>
                <Table
                  columns={alertColumns}
                  dataSource={alerts}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            )
          }
        ]}
      />

      
      <Modal
        title="监控配置"
        open={isConfigModalVisible}
        onCancel={() => setIsConfigModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="CPU告警阈值">
            <Row gutter={16}>
              <Col span={12}>
                <Text>警告阈值</Text>
                <InputNumber
                  style={{ width: '100%', marginTop: 4 }}
                  min={50}
                  max={100}
                  defaultValue={80}
                  suffix="%"
                />
              </Col>
              <Col span={12}>
                <Text>严重阈值</Text>
                <InputNumber
                  style={{ width: '100%', marginTop: 4 }}
                  min={80}
                  max={100}
                  defaultValue={95}
                  suffix="%"
                />
              </Col>
            </Row>
          </Form.Item>

          <Form.Item label="内存告警阈值">
            <Row gutter={16}>
              <Col span={12}>
                <Text>警告阈值</Text>
                <InputNumber
                  style={{ width: '100%', marginTop: 4 }}
                  min={50}
                  max={100}
                  defaultValue={85}
                  suffix="%"
                />
              </Col>
              <Col span={12}>
                <Text>严重阈值</Text>
                <InputNumber
                  style={{ width: '100%', marginTop: 4 }}
                  min={80}
                  max={100}
                  defaultValue={95}
                  suffix="%"
                />
              </Col>
            </Row>
          </Form.Item>

          <Form.Item label="缓存配置">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Switch defaultChecked>启用自动缓存清理</Switch>
              <Switch defaultChecked>启用缓存预热</Switch>
              <Switch>启用缓存压缩</Switch>
            </Space>
          </Form.Item>

          <Form.Item label="告警通知">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Switch defaultChecked>邮件通知</Switch>
              <Switch defaultChecked>短信通知</Switch>
              <Switch>钉钉通知</Switch>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PerformanceMonitoring;
