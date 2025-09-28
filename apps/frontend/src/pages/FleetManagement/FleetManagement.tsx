import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Table, 
  Tag, 
  Space, 
  Button, 
  Badge, 
  Timeline,
  Tabs,
  List,
  Avatar,
  Progress,
  Statistic,
  Divider
} from 'antd';
import { 
  TeamOutlined, 
  TruckOutlined, 
  EnvironmentOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  EyeOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { Trip, TripStatus, Driver, Vehicle, Shipment, DriverStatus, VehicleStatus } from '../../types';
import PageLayout from '../../components/Layout/PageLayout'; // 2025-01-27 17:00:00 添加页面布局组件

const { Title, Text } = Typography;

const FleetManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [inTransitTrips, setInTransitTrips] = useState<Trip[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  useEffect(() => {
    loadFleetData();
  }, []);

  const loadFleetData = async () => {
    try {
      setLoading(true);
      // TODO: 实现API调用
      
      // 模拟数据
      setInTransitTrips([
        {
          id: '1',
          tenantId: 'tenant1',
          tripNo: 'TRIP-20250127-001',
          status: TripStatus.ONGOING,
          driverId: 'driver1',
          vehicleId: 'vehicle1',
          legs: [],
          shipments: ['shipment1', 'shipment2'],
          startTimePlanned: '2025-01-27T09:00:00Z',
          endTimePlanned: '2025-01-27T18:00:00Z',
          startTimeActual: '2025-01-27T09:15:00Z',
          createdAt: '2025-01-27T08:00:00Z',
          updatedAt: '2025-01-27T09:15:00Z'
        },
        {
          id: '2',
          tenantId: 'tenant1',
          tripNo: 'TRIP-20250127-002',
          status: TripStatus.ONGOING,
          driverId: 'driver2',
          vehicleId: 'vehicle2',
          legs: [],
          shipments: ['shipment3'],
          startTimePlanned: '2025-01-27T14:00:00Z',
          endTimePlanned: '2025-01-27T20:00:00Z',
          startTimeActual: '2025-01-27T14:30:00Z',
          createdAt: '2025-01-27T10:00:00Z',
          updatedAt: '2025-01-27T14:30:00Z'
        }
      ]);

      setAvailableDrivers([
        { id: 'driver3', tenantId: 'tenant1', name: '王五', phone: '13800138003', status: DriverStatus.AVAILABLE, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
        { id: 'driver4', tenantId: 'tenant1', name: '赵六', phone: '13800138004', status: DriverStatus.AVAILABLE, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' }
      ]);

      setAvailableVehicles([
        { id: 'vehicle3', tenantId: 'tenant1', plateNumber: '京C11111', type: '厢式货车', capacityKg: 3000, status: VehicleStatus.AVAILABLE, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
        { id: 'vehicle4', tenantId: 'tenant1', plateNumber: '京D22222', type: '平板车', capacityKg: 6000, status: VehicleStatus.AVAILABLE, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' }
      ]);

      setRecentTrips([
        {
          id: '3',
          tenantId: 'tenant1',
          tripNo: 'TRIP-20250126-001',
          status: TripStatus.COMPLETED,
          driverId: 'driver1',
          vehicleId: 'vehicle1',
          legs: [],
          shipments: ['shipment4', 'shipment5'],
          startTimePlanned: '2025-01-26T09:00:00Z',
          endTimePlanned: '2025-01-26T18:00:00Z',
          startTimeActual: '2025-01-26T09:00:00Z',
          endTimeActual: '2025-01-26T17:30:00Z',
          createdAt: '2025-01-26T08:00:00Z',
          updatedAt: '2025-01-26T17:30:00Z'
        }
      ]);
    } catch (error) {
      console.error('Failed to load fleet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDriverName = (driverId: string) => {
    const allDrivers = [...availableDrivers, ...inTransitTrips.map(trip => ({ id: trip.driverId, name: `司机${trip.driverId}`, phone: '', status: DriverStatus.BUSY, tenantId: '', createdAt: '', updatedAt: '' }))];
    const driver = allDrivers.find(d => d.id === driverId);
    return driver ? driver.name : '未知司机';
  };

  const getVehiclePlate = (vehicleId: string) => {
    const allVehicles = [...availableVehicles, ...inTransitTrips.map(trip => ({ id: trip.vehicleId, plateNumber: `车辆${trip.vehicleId}`, type: '', capacityKg: 0, status: VehicleStatus.BUSY, tenantId: '', createdAt: '', updatedAt: '' }))];
    const vehicle = allVehicles.find(v => v.id === vehicleId);
    return vehicle ? vehicle.plateNumber : '未知车辆';
  };

  const getStatusColor = (status: TripStatus) => {
    const colorMap = {
      [TripStatus.PLANNING]: 'blue',
      [TripStatus.ONGOING]: 'green',
      [TripStatus.COMPLETED]: 'success',
      [TripStatus.CANCELED]: 'red'
    };
    return colorMap[status] || 'default';
  };

  const getStatusText = (status: TripStatus) => {
    const textMap = {
      [TripStatus.PLANNING]: '规划中',
      [TripStatus.ONGOING]: '执行中',
      [TripStatus.COMPLETED]: '已完成',
      [TripStatus.CANCELED]: '已取消'
    };
    return textMap[status] || status;
  };

  const inTransitColumns = [
    {
      title: '行程号',
      dataIndex: 'tripNo',
      key: 'tripNo',
      width: 150,
    },
    {
      title: '司机',
      dataIndex: 'driverId',
      key: 'driverId',
      width: 100,
      render: (driverId: string) => getDriverName(driverId),
    },
    {
      title: '车辆',
      dataIndex: 'vehicleId',
      key: 'vehicleId',
      width: 120,
      render: (vehicleId: string) => getVehiclePlate(vehicleId),
    },
    {
      title: '运单数量',
      dataIndex: 'shipments',
      key: 'shipments',
      width: 100,
      render: (shipments: string[]) => (
        <Badge count={shipments.length} showZero color="blue" />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TripStatus) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '预计结束',
      dataIndex: 'endTimePlanned',
      key: 'endTimePlanned',
      width: 150,
      render: (endTime: string) => new Date(endTime).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: Trip) => (
        <Space size="small">
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={() => setSelectedTrip(record)}
          />
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'overview',
      label: '总览',
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="在途行程"
                  value={inTransitTrips.length}
                  prefix={<PlayCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="空闲司机"
                  value={availableDrivers.length}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="空闲车辆"
                  value={availableVehicles.length}
                  prefix={<TruckOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="今日完成"
                  value={recentTrips.length}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="在途行程" size="small">
                <List
                  dataSource={inTransitTrips}
                  renderItem={(trip) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<TruckOutlined />} />}
                        title={trip.tripNo}
                        description={
                          <div>
                            <Text>{getDriverName(trip.driverId)} / {getVehiclePlate(trip.vehicleId)}</Text>
                            <br />
                            <Text type="secondary">
                              预计 {new Date(trip.endTimePlanned || '').toLocaleString('zh-CN')} 完成
                            </Text>
                          </div>
                        }
                      />
                      <Tag color={getStatusColor(trip.status)}>
                        {getStatusText(trip.status)}
                      </Tag>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="空闲资源" size="small">
                <Tabs size="small" items={[
                  {
                    key: 'drivers',
                    label: `司机 (${availableDrivers.length})`,
                    children: (
                      <List
                        dataSource={availableDrivers}
                        renderItem={(driver) => (
                          <List.Item>
                            <List.Item.Meta
                              avatar={<Avatar icon={<TeamOutlined />} />}
                              title={driver.name}
                              description={driver.phone}
                            />
                            <Tag color="green">空闲</Tag>
                          </List.Item>
                        )}
                      />
                    )
                  },
                  {
                    key: 'vehicles',
                    label: `车辆 (${availableVehicles.length})`,
                    children: (
                      <List
                        dataSource={availableVehicles}
                        renderItem={(vehicle) => (
                          <List.Item>
                            <List.Item.Meta
                              avatar={<Avatar icon={<TruckOutlined />} />}
                              title={vehicle.plateNumber}
                              description={`${vehicle.type} - ${vehicle.capacityKg}kg`}
                            />
                            <Tag color="green">空闲</Tag>
                          </List.Item>
                        )}
                      />
                    )
                  }
                ]} />
              </Card>
            </Col>
          </Row>
        </div>
      )
    },
    {
      key: 'inTransit',
      label: '在途管理',
      children: (
      <Card style={{ width: '100%' }}>
        <Table
          columns={inTransitColumns}
          dataSource={inTransitTrips}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="small"
          scroll={{ x: 800 }}
        />
      </Card>
      )
    },
    {
      key: 'map',
      label: '地图轨迹',
      children: (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <EnvironmentOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
            <Title level={4}>地图轨迹功能</Title>
            <Text type="secondary">
              显示当前行程路线与历史回程轨迹，支持筛选某行程进行回放
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              MVP版本使用模拟数据，后续接入GPS/OBD
            </Text>
          </div>
        </Card>
      )
    },
    {
      key: 'history',
      label: '历史记录',
      children: (
        <Card>
          <Table
            columns={[
              ...inTransitColumns.slice(0, -1), // 移除操作列
              {
                title: '实际结束',
                dataIndex: 'endTimeActual',
                key: 'endTimeActual',
                width: 150,
                render: (endTime: string) => endTime ? new Date(endTime).toLocaleString('zh-CN') : '-',
              }
            ]}
            dataSource={recentTrips}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
            size="small"
          />
        </Card>
      )
    }
  ];

  return (
    <PageLayout>
      <div style={{ padding: '24px', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <Title level={3}>车队管理</Title>
        <Text type="secondary">
          管理在途司机车辆、空闲资源列表、地图轨迹显示，支持行程调度和历史回放
        </Text>
      </div>
      
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={tabItems}
      />

      {/* 行程详情模态框 */}
      {selectedTrip && (
        <Card
          title={`${selectedTrip.tripNo} - 行程详情`}
          style={{ marginTop: 16 }}
          extra={
            <Button onClick={() => setSelectedTrip(null)}>
              关闭
            </Button>
          }
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card size="small" title="基本信息">
                <p><strong>行程号:</strong> {selectedTrip.tripNo}</p>
                <p><strong>状态:</strong> <Tag color={getStatusColor(selectedTrip.status)}>{getStatusText(selectedTrip.status)}</Tag></p>
                <p><strong>司机:</strong> {getDriverName(selectedTrip.driverId)}</p>
                <p><strong>车辆:</strong> {getVehiclePlate(selectedTrip.vehicleId)}</p>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" title="时间信息">
                <p><strong>计划开始:</strong> {new Date(selectedTrip.startTimePlanned || '').toLocaleString('zh-CN')}</p>
                <p><strong>计划结束:</strong> {new Date(selectedTrip.endTimePlanned || '').toLocaleString('zh-CN')}</p>
                {selectedTrip.startTimeActual && (
                  <p><strong>实际开始:</strong> {new Date(selectedTrip.startTimeActual).toLocaleString('zh-CN')}</p>
                )}
                {selectedTrip.endTimeActual && (
                  <p><strong>实际结束:</strong> {new Date(selectedTrip.endTimeActual).toLocaleString('zh-CN')}</p>
                )}
              </Card>
            </Col>
          </Row>
          
          <Divider>挂载运单</Divider>
          <div style={{ textAlign: 'center' }}>
            <Badge count={selectedTrip.shipments.length} showZero>
              <Text>共 {selectedTrip.shipments.length} 个运单</Text>
            </Badge>
          </div>
        </Card>
      )}
      </div>
    </PageLayout>
  );
};

export default FleetManagement;
