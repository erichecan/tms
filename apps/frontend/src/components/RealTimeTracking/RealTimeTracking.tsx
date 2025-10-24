// 实时位置跟踪组件
// 创建时间: 2025-09-29 21:30:00
// 作用: 车队实时位置更新和跟踪功能

import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Switch,
  Typography,
  Space,
  Tag,
  List,
  Avatar,
  Badge,
  Tooltip,
  Alert,
  Modal,
  Form,
  Input,
  Select,
  message,
  Divider,
  Statistic,
  Timeline,
} from 'antd';
import {
  EnvironmentOutlined,
  CarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  AimOutlined,
} from '@ant-design/icons';
// ============================================================================
// 地图相关组件导入 - 二期开发功能 (2025-01-27 18:15:00)
// 状态: 已注释，二期恢复
// 说明: 以下导入的地图组件在一期版本中暂时不使用，二期时取消注释
// ============================================================================
// import GoogleMap from '../GoogleMap/GoogleMap';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface VehicleLocation {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  driverName: string;
  driverPhone: string;
  latitude: number;
  longitude: number;
  speed: number;
  direction: number;
  timestamp: string;
  status: 'online' | 'offline' | 'parked' | 'driving';
  batteryLevel: number;
  fuelLevel: number;
  lastUpdate: string;
}

interface TripInfo {
  id: string;
  tripNo: string;
  from: string;
  to: string;
  status: 'planned' | 'in_progress' | 'completed';
  estimatedArrival: string;
  actualProgress: number;
}

const RealTimeTracking: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [vehicleLocations, setVehicleLocations] = useState<VehicleLocation[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleLocation | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [updateInterval, setUpdateInterval] = useState(5); // 秒
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadVehicleLocations();
    
    if (realTimeEnabled) {
      startRealTimeUpdates();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [realTimeEnabled, updateInterval]);

  const loadVehicleLocations = async () => {
    setLoading(true);
    try {
      // 模拟实时位置数据
      const mockLocations: VehicleLocation[] = [
        {
          id: 'L001',
          vehicleId: 'V001',
          vehiclePlate: '京A12345',
          driverName: '张三',
          driverPhone: '13800138000',
          latitude: 39.9042 + (Math.random() - 0.5) * 0.01,
          longitude: 116.4074 + (Math.random() - 0.5) * 0.01,
          speed: Math.floor(Math.random() * 60),
          direction: Math.floor(Math.random() * 360),
          timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          status: 'driving',
          batteryLevel: 85,
          fuelLevel: 75,
          lastUpdate: dayjs().subtract(Math.floor(Math.random() * 60), 'second').format('HH:mm:ss'),
        },
        {
          id: 'L002',
          vehicleId: 'V002',
          vehiclePlate: '京B67890',
          driverName: '李四',
          driverPhone: '13900139000',
          latitude: 39.9142 + (Math.random() - 0.5) * 0.01,
          longitude: 116.4174 + (Math.random() - 0.5) * 0.01,
          speed: Math.floor(Math.random() * 40),
          direction: Math.floor(Math.random() * 360),
          timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          status: 'parked',
          batteryLevel: 92,
          fuelLevel: 60,
          lastUpdate: dayjs().subtract(Math.floor(Math.random() * 120), 'second').format('HH:mm:ss'),
        },
        {
          id: 'L003',
          vehicleId: 'V003',
          vehiclePlate: '京C11111',
          driverName: '王五',
          driverPhone: '13700137000',
          latitude: 39.9242 + (Math.random() - 0.5) * 0.01,
          longitude: 116.4274 + (Math.random() - 0.5) * 0.01,
          speed: Math.floor(Math.random() * 80),
          direction: Math.floor(Math.random() * 360),
          timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          status: 'driving',
          batteryLevel: 78,
          fuelLevel: 45,
          lastUpdate: dayjs().subtract(Math.floor(Math.random() * 30), 'second').format('HH:mm:ss'),
        },
      ];

      setVehicleLocations(mockLocations);
    } catch (error) {
      console.error('加载车辆位置失败:', error);
      message.error('加载车辆位置失败');
    } finally {
      setLoading(false);
    }
  };

  const startRealTimeUpdates = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      // 模拟位置更新
      setVehicleLocations(prevLocations => 
        prevLocations.map(location => ({
          ...location,
          latitude: location.latitude + (Math.random() - 0.5) * 0.001,
          longitude: location.longitude + (Math.random() - 0.5) * 0.001,
          speed: Math.floor(Math.random() * 80),
          direction: Math.floor(Math.random() * 360),
          timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          lastUpdate: dayjs().format('HH:mm:ss'),
        }))
      );
    }, updateInterval * 1000);
  };

  const handleVehicleClick = (vehicle: VehicleLocation) => {
    setSelectedVehicle(vehicle);
    setIsDetailModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      online: 'green',
      offline: 'red',
      parked: 'orange',
      driving: 'blue',
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts = {
      online: '在线',
      offline: '离线',
      parked: '停车',
      driving: '行驶中',
    };
    return texts[status as keyof typeof colors] || status;
  };

  const getSpeedColor = (speed: number) => {
    if (speed === 0) return '#999';
    if (speed < 30) return '#52c41a';
    if (speed < 60) return '#fa8c16';
    return '#f5222d';
  };

  const getTripInfo = (vehicleId: string): TripInfo | null => {
    // 模拟行程信息
    const mockTrips: TripInfo[] = [
      {
        id: 'T001',
        tripNo: 'TRIP-20250929-001',
        from: '北京仓库',
        to: '上海客户',
        status: 'in_progress',
        estimatedArrival: '18:30',
        actualProgress: 65,
      },
      {
        id: 'T002',
        tripNo: 'TRIP-20250929-002',
        from: '上海仓库',
        to: '杭州客户',
        status: 'planned',
        estimatedArrival: '20:00',
        actualProgress: 0,
      },
    ];

    return mockTrips.find(trip => trip.id === `T00${vehicleId.slice(-1)}`) || null;
  };

  const mapMarkers = vehicleLocations.map(location => ({
    id: location.id,
    position: { lat: location.latitude, lng: location.longitude },
    title: location.vehiclePlate,
    info: `
      <div style="min-width: 200px;">
        <h4>${location.vehiclePlate}</h4>
        <p><strong>司机:</strong> ${location.driverName}</p>
        <p><strong>电话:</strong> ${location.driverPhone}</p>
        <p><strong>状态:</strong> <span style="color: ${getStatusColor(location.status)}">${getStatusText(location.status)}</span></p>
        <p><strong>速度:</strong> ${location.speed} km/h</p>
        <p><strong>最后更新:</strong> ${location.lastUpdate}</p>
        <p><strong>电池:</strong> ${location.batteryLevel}% | <strong>燃油:</strong> ${location.fuelLevel}%</p>
      </div>
    `,
  }));

  return (
    <div>
      
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Space>
              <Text strong>实时跟踪:</Text>
              <Switch
                checked={realTimeEnabled}
                onChange={setRealTimeEnabled}
                checkedChildren="开启"
                unCheckedChildren="关闭"
              />
              {realTimeEnabled && (
                <Tag color="green" icon={<ThunderboltOutlined />}>
                  实时更新中
                </Tag>
              )}
            </Space>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Space>
              <Text strong>更新间隔:</Text>
              <Select
                value={updateInterval}
                onChange={setUpdateInterval}
                style={{ width: 100 }}
                disabled={!realTimeEnabled}
              >
                <Option value={3}>3秒</Option>
                <Option value={5}>5秒</Option>
                <Option value={10}>10秒</Option>
                <Option value={30}>30秒</Option>
              </Select>
            </Space>
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Space>
              <Button 
                icon={<ReloadOutlined />}
                onClick={loadVehicleLocations}
                loading={loading}
              >
                手动刷新
              </Button>
              <Button 
                icon={<GlobalOutlined />}
                type="primary"
              >
                全屏地图
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        
        
        
        
        
        
        
        
        <Col xs={24} lg={16}>
          <Card title="车辆位置信息" extra={<AimOutlined />}>
            <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <GlobalOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                <Title level={5}>地图功能将在二期版本提供</Title>
                <Text type="secondary">
                  当前版本暂不支持地图显示，但车辆状态信息完全可用
                </Text>
                <div style={{ marginTop: '20px' }}>
                  <Text type="secondary">车辆位置信息：</Text>
                  <div style={{ marginTop: '10px', fontSize: '12px' }}>
                    {vehicleLocations.map((location, index) => (
                      <div key={index} style={{ marginBottom: '5px' }}>
                        <Text strong>{location.vehiclePlate}:</Text>
                        <Text> 经度 {location.longitude.toFixed(6)}, 纬度 {location.latitude.toFixed(6)}</Text>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        
        <Col xs={24} lg={8}>
          <Card title="车辆状态列表">
            <List
              dataSource={vehicleLocations}
              renderItem={(location) => {
                const trip = getTripInfo(location.vehicleId);
                return (
                  <List.Item
                    key={location.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleVehicleClick(location)}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          icon={<CarOutlined />} 
                          style={{ backgroundColor: getStatusColor(location.status) }}
                        />
                      }
                      title={
                        <Space>
                          <Text strong>{location.vehiclePlate}</Text>
                          <Tag color={getStatusColor(location.status)} size="small">
                            {getStatusText(location.status)}
                          </Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <div><UserOutlined /> {location.driverName}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                            <Text type="secondary">
                              <ClockCircleOutlined /> {location.lastUpdate}
                            </Text>
                            <Text style={{ color: getSpeedColor(location.speed) }}>
                              {location.speed} km/h
                            </Text>
                          </div>
                          {trip && (
                            <div style={{ marginTop: 4 }}>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                行程: {trip.tripNo}
                              </Text>
                              <div style={{ marginTop: 2 }}>
                                <Progress 
                                  percent={trip.actualProgress} 
                                  size="small" 
                                  status={trip.status === 'in_progress' ? 'active' : 'normal'}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          </Card>

          
          <Card title="统计信息" style={{ marginTop: 16 }}>
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <Statistic
                  title="在线车辆"
                  value={vehicleLocations.filter(v => v.status === 'online' || v.status === 'driving').length}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="离线车辆"
                  value={vehicleLocations.filter(v => v.status === 'offline').length}
                  prefix={<ExclamationCircleOutlined />}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="行驶中"
                  value={vehicleLocations.filter(v => v.status === 'driving').length}
                  prefix={<CarOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="停车中"
                  value={vehicleLocations.filter(v => v.status === 'parked').length}
                  prefix={<PauseCircleOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      
      <Modal
        title={`车辆详情 - ${selectedVehicle?.vehiclePlate}`}
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedVehicle && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small" title="基本信息">
                  <p><strong>车牌号:</strong> {selectedVehicle.vehiclePlate}</p>
                  <p><strong>司机:</strong> {selectedVehicle.driverName}</p>
                  <p><strong>电话:</strong> {selectedVehicle.driverPhone}</p>
                  <p><strong>状态:</strong> 
                    <Tag color={getStatusColor(selectedVehicle.status)} style={{ marginLeft: 8 }}>
                      {getStatusText(selectedVehicle.status)}
                    </Tag>
                  </p>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="实时数据">
                  <p><strong>速度:</strong> <span style={{ color: getSpeedColor(selectedVehicle.speed) }}>
                    {selectedVehicle.speed} km/h
                  </span></p>
                  <p><strong>方向:</strong> {selectedVehicle.direction}°</p>
                  <p><strong>电池电量:</strong> {selectedVehicle.batteryLevel}%</p>
                  <p><strong>燃油量:</strong> {selectedVehicle.fuelLevel}%</p>
                </Card>
              </Col>
            </Row>
            
            <Divider>位置信息</Divider>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <p><strong>纬度:</strong> {selectedVehicle.latitude.toFixed(6)}</p>
                <p><strong>经度:</strong> {selectedVehicle.longitude.toFixed(6)}</p>
              </Col>
              <Col span={12}>
                <p><strong>最后更新:</strong> {selectedVehicle.lastUpdate}</p>
                <p><strong>时间戳:</strong> {selectedVehicle.timestamp}</p>
              </Col>
            </Row>

            {selectedVehicle.batteryLevel < 20 && (
              <Alert
                message="电池电量低"
                description="车辆电池电量低于20%，建议及时充电"
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}

            {selectedVehicle.fuelLevel < 15 && (
              <Alert
                message="燃油不足"
                description="车辆燃油量低于15%，建议及时加油"
                type="error"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RealTimeTracking;
