import React, { useState, useEffect, useCallback } from 'react'; // 2025-11-11T15:25:48Z Added by Assistant: useCallback for location polling
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Table, 
  Tag, 
  Button, 
  Badge, 
  List,
  Avatar,
  Divider,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tabs,
  Alert,
  Space
} from 'antd';
import { 
  TeamOutlined, 
  TruckOutlined, 
  HistoryOutlined,
  EnvironmentOutlined,
  ToolOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { Trip, TripStatus, Driver, Vehicle, DriverStatus, VehicleStatus } from '../../types';
import { useDrivers, useVehicles } from '../../hooks'; // 2025-10-31 09:50:00 使用统一的数据管理 Hook
import { driversApi, vehiclesApi, tripsApi, locationApi } from '../../services/api'; // 2025-11-11T15:25:48Z Added by Assistant: Real-time location API
// ============================================================================
// 地图相关组件导入 - 二期开发功能 (2025-01-27 18:10:00)
// 状态: 已注释，二期恢复
// 说明: 以下导入的地图组件在一期版本中暂时不使用，二期时取消注释
// ============================================================================
// import GoogleMap from '../../components/GoogleMap/GoogleMap';
// import mapsService from '../../services/mapsService';
import { formatDateTime } from '../../utils/timeUtils';
import DriverPerformance from '../../components/DriverPerformance/DriverPerformance';
import VehicleMaintenance from '../../components/VehicleMaintenance/VehicleMaintenance';

const { Title, Text } = Typography;

type RealTimeLocation = {
  key: string;
  vehicleId: string;
  plateNumber?: string | null;
  vehicleType?: string | null;
  vehicleStatus?: string | null;
  driverId?: string | null;
  driverName?: string | null;
  driverStatus?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  speed?: number | null;
  accuracy?: number | null;
  lastLocationUpdate?: string | null;
  tripId?: string | null;
  tripNo?: string | null;
  tripStatus?: string | null;
}; // 2025-11-11T15:25:48Z Added by Assistant: Real-time location data shape

const FleetManagement: React.FC = () => {
  // 2025-10-31 09:50:00 使用统一的数据管理 Hook
  const { drivers: availableDrivers, loading: driversLoading, reload: reloadDrivers } = useDrivers({ 
    status: DriverStatus.AVAILABLE 
  });
  
  const { vehicles: availableVehicles, loading: vehiclesLoading, reload: reloadVehicles } = useVehicles({ 
    status: VehicleStatus.AVAILABLE 
  });
  
  const [loading, setLoading] = useState(false);
  const [inTransitTrips, setInTransitTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [tripToAssign, setTripToAssign] = useState<Trip | null>(null); // 2025-11-11 10:15:05 新增：行程指派上下文
  const [isTripAssignModalVisible, setIsTripAssignModalVisible] = useState(false); // 2025-11-11 10:15:05 新增：行程指派弹窗
  const [isAddDriverVisible, setIsAddDriverVisible] = useState(false);
  const [isAddVehicleVisible, setIsAddVehicleVisible] = useState(false);
  const [driverForm] = Form.useForm();
  const [vehicleForm] = Form.useForm();
  const [tripAssignForm] = Form.useForm(); // 2025-11-11 10:15:05 新增：行程指派表单
  const [locationLoading, setLocationLoading] = useState(false); // 2025-11-11T15:25:48Z Added by Assistant: Location loading indicator
  const [realTimeLocations, setRealTimeLocations] = useState<RealTimeLocation[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [lastLocationSync, setLastLocationSync] = useState<Date | null>(null);

  const fetchRealTimeLocations = useCallback(async (feedback = false) => {
    try {
      setLocationLoading(true);
      const response = await locationApi.getRealTimeLocations();
      const records = response.data?.data ?? [];

      const normalized: RealTimeLocation[] = records.map((item: any) => {
        const parsePayload = (payload: any): { latitude?: number | null; longitude?: number | null; speed?: number | null; accuracy?: number | null } => {
          if (!payload) return {};
          if (typeof payload === 'string') {
            try {
              const parsed = JSON.parse(payload);
              return {
                latitude: parsed.latitude ?? parsed.lat ?? null,
                longitude: parsed.longitude ?? parsed.lng ?? null,
                speed: parsed.speed ?? null,
                accuracy: parsed.accuracy ?? null
              };
            } catch {
              return {};
            }
          }
          return {
            latitude: payload.latitude ?? payload.lat ?? null,
            longitude: payload.longitude ?? payload.lng ?? null,
            speed: payload.speed ?? null,
            accuracy: payload.accuracy ?? null
          };
        };

        const vehicleLocation = parsePayload(item.current_location);
        const driverLocation = parsePayload(item.driver_location);

        return {
          key: item.vehicle_id || item.driver_id || Math.random().toString(36).slice(2),
          vehicleId: item.vehicle_id,
          plateNumber: item.plate_number,
          vehicleType: item.vehicle_type,
          vehicleStatus: item.vehicle_status,
          driverId: item.driver_id,
          driverName: item.driver_name,
          driverStatus: item.driver_status,
          latitude: vehicleLocation.latitude ?? driverLocation.latitude ?? null,
          longitude: vehicleLocation.longitude ?? driverLocation.longitude ?? null,
          speed: vehicleLocation.speed ?? driverLocation.speed ?? null,
          accuracy: vehicleLocation.accuracy ?? driverLocation.accuracy ?? null,
          lastLocationUpdate: item.last_location_update,
          tripId: item.trip_id,
          tripNo: item.trip_no,
          tripStatus: item.trip_status
        };
      });

      setRealTimeLocations(normalized);
      setLastLocationSync(new Date());
      setLocationError(null);
      if (feedback) {
        message.success('已刷新实时位置数据');
      }
    } catch (error) {
      console.error('获取实时位置失败:', error);
      setLocationError('无法获取实时位置数据，请稍后重试');
      if (feedback) {
        message.error('刷新实时位置失败');
      }
    } finally {
      setLocationLoading(false);
    }
  }, []); // 2025-11-11T15:25:48Z Added by Assistant: Real-time location fetcher

  useEffect(() => {
    fetchRealTimeLocations();
    const timer = window.setInterval(() => {
      fetchRealTimeLocations();
    }, 15000);

    return () => window.clearInterval(timer);
  }, [fetchRealTimeLocations]); // 2025-11-11T15:25:48Z Added by Assistant: Start polling loop

  const handleManualLocationRefresh = () => {
    void fetchRealTimeLocations(true);
  }; // 2025-11-11T15:25:48Z Added by Assistant: Manual refresh handler

  // ============================================================================
  // 地图相关状态 - 二期开发功能 (2025-01-27 18:10:00)
  // 状态: 已注释，二期恢复
  // 说明: 以下地图相关状态在一期版本中暂时不使用，二期时取消注释
  // ============================================================================
  // 地图中心与标记 - 默认中心点: 3401 Dufferin St, North York, ON M6A 2T9
  // const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 43.7615, lng: -79.4635 });
  // const [mapMarkers, setMapMarkers] = useState<Array<{ id: string; position: { lat: number; lng: number }; title?: string; info?: string }>>([]);

  // 2025-10-31 09:50:00 只加载行程数据，司机和车辆数据由 Hooks 自动加载
  const loadTripsData = async () => {
    // 2025-11-11 10:15:05 新增：行程数据加载
    try {
      setLoading(true);
      const tripsResult = await tripsApi.getTrips();
      const allTrips = tripsResult.data?.data || [];
      const ongoingTrips = allTrips.filter((trip: Trip) => trip.status === TripStatus.ONGOING);
      setInTransitTrips(ongoingTrips);
    } catch (error) {
      console.error('获取行程数据失败:', error);
      setInTransitTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFleetData = async () => {
    // 2025-11-11 10:15:05 新增：统一刷新车队数据
    await Promise.all([
      reloadDrivers(),
      reloadVehicles(),
      loadTripsData(),
      fetchRealTimeLocations(),
    ]);
  };

  useEffect(() => {
    loadTripsData();
  }, []);

  // ============================================================================
  // 地图初始化逻辑 - 二期开发功能 (2025-01-27 18:10:00)
  // 状态: 已注释，二期恢复
  // 说明: 以下地图初始化逻辑在一期版本中暂时不使用，二期时取消注释
  // ============================================================================
  // 初始化地图服务并将默认中心设为 3401 Dufferin St, North York, ON M6A 2T9
  // useEffect(() => {
  //   (async () => {
  //     try {
  //       await mapsService.initialize();
  //       const addr = '3401 Dufferin St, North York, ON M6A 2T9';
  //       const info = await mapsService.geocodeAddress(addr);
  //       if (info?.latitude && info?.longitude) {
  //         setMapCenter({ lat: info.latitude, lng: info.longitude });
  //       }
  //     } catch (e) {
  //       // 保持默认中心（多伦多）即可
  //       console.warn('地图服务初始化或地理编码失败，使用默认中心点', e);
  //       // 显示用户友好的错误信息
  //       message.warning('地图服务暂时不可用，但页面功能正常');
  //     }
  //   })();
  // }, []);

  const getDriverName = (driverId: string) => {
    const fromRealtime = realTimeLocations.find(location => location.driverId === driverId);
    if (fromRealtime?.driverName) {
      return fromRealtime.driverName;
    }
    const allDrivers = [...availableDrivers, ...inTransitTrips.map((trip: Trip) => ({ id: trip.driverId, name: `司机${trip.driverId}`, phone: '', status: DriverStatus.BUSY, tenantId: '', createdAt: '', updatedAt: '' }))];
    const driver = allDrivers.find((d: Driver) => d.id === driverId);
    return driver ? driver.name : '未分配';
  };

  const getVehiclePlate = (vehicleId: string) => {
    const fromRealtime = realTimeLocations.find(location => location.vehicleId === vehicleId);
    if (fromRealtime?.plateNumber) {
      return fromRealtime.plateNumber;
    }
    const allVehicles = [...availableVehicles, ...inTransitTrips.map((trip: Trip) => ({ id: trip.vehicleId, plateNumber: `车辆${trip.vehicleId}`, type: '', capacityKg: 0, status: VehicleStatus.BUSY, tenantId: '', createdAt: '', updatedAt: '' }))];
    const vehicle = allVehicles.find((v: Vehicle) => v.id === vehicleId);
    return vehicle ? vehicle.plateNumber : '未分配';
  };

  // 检查是否需要显示指派按钮 - 2025-10-08 18:30:00
  const needsAssignment = (record: Trip) => {
    const driverName = getDriverName(record.driverId);
    const vehiclePlate = getVehiclePlate(record.vehicleId);
    return driverName === '未分配' || vehiclePlate === '未分配';
  };

  // 处理指派司机车辆 - 2025-10-08 18:30:00
  const handleAssignDriverVehicle = (trip: Trip) => {
    setTripToAssign(trip);
    tripAssignForm.setFieldsValue({
      driverId: trip.driverId || undefined,
      vehicleId: trip.vehicleId || undefined,
    });
    setIsTripAssignModalVisible(true); // 2025-11-11 10:15:05 新增：打开指派弹窗
  };

  const getStatusColor = (status: TripStatus) => {
    const colorMap = {
      [TripStatus.PLANNED]: 'blue',
      [TripStatus.ONGOING]: 'green',
      [TripStatus.COMPLETED]: 'success',
      [TripStatus.CANCELLED]: 'red'
    };
    return colorMap[status] || 'default';
  };

  const getStatusText = (status: TripStatus) => {
    const textMap = {
      [TripStatus.PLANNED]: '规划中',
      [TripStatus.ONGOING]: '执行中',
      [TripStatus.COMPLETED]: '已完成',
      [TripStatus.CANCELLED]: '已取消'
    };
    return textMap[status] || status;
  };

  const inTransitColumns = [
    {
      title: '行程',
      dataIndex: 'tripNo',
      key: 'tripNo',
      width: 140,
      render: (_: unknown, record: Trip) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{record.tripNo}</span>
          <Badge count={record.shipments.length} color="#1890ff" style={{ backgroundColor: '#1890ff' }} />
        </div>
      )
    },
    {
      title: '司机 / 车辆',
      key: 'driverVehicle',
      width: 180,
      render: (_: unknown, record: Trip) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: getDriverName(record.driverId) === '未分配' ? '#ff4d4f' : 'inherit' }}>
                {getDriverName(record.driverId)}
              </div>
              <div style={{ fontSize: 12, color: getVehiclePlate(record.vehicleId) === '未分配' ? '#ff4d4f' : '#888' }}>
                {getVehiclePlate(record.vehicleId)}
              </div>
            </div>
            {needsAssignment(record) && (
              <Button 
                type="primary" 
                size="small"
                onClick={(e) => {
                  e.stopPropagation(); // 阻止行点击事件
                  handleAssignDriverVehicle(record);
                }}
                style={{ marginLeft: 8 }}
              >
                指派
              </Button>
            )}
          </div>
        </div>
      )
    },
    {
      title: '时间',
      key: 'timeRange',
      width: 160,
      render: (_: unknown, record: Trip) => (
        <div style={{ fontSize: 11 }}>
          <div><strong>开始:</strong> <span style={{ fontSize: 10 }}>{formatDateTime(record.startTimePlanned)}</span></div>
          <div><strong>预计完:</strong> <span style={{ fontSize: 10, color: '#888' }}>{formatDateTime(record.endTimePlanned)}</span></div>
        </div>
      )
    },
  ];

  const realTimeColumns = [
    {
      title: '车辆',
      dataIndex: 'plateNumber',
      key: 'plateNumber',
      width: 160,
      render: (_: unknown, record: RealTimeLocation) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.plateNumber ?? '未命名车辆'}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.vehicleType ?? '类型未知'}</Text>
        </Space>
      )
    },
    {
      title: '司机',
      dataIndex: 'driverName',
      key: 'driverName',
      width: 160,
      render: (_: unknown, record: RealTimeLocation) => (
        <Space direction="vertical" size={0}>
          <Text>{record.driverName ?? '未分配'}</Text>
          <Tag color={record.driverStatus === 'active' ? 'green' : 'default'} style={{ marginTop: 4 }}>
            {record.driverStatus ?? '未知'}
          </Tag>
        </Space>
      )
    },
    {
      title: '当前位置',
      key: 'coordinates',
      width: 200,
      render: (_: unknown, record: RealTimeLocation) => (
        <div>
          <Text>纬度: {record.latitude != null ? record.latitude.toFixed(4) : '—'}</Text>
          <br />
          <Text>经度: {record.longitude != null ? record.longitude.toFixed(4) : '—'}</Text>
        </div>
      )
    },
    {
      title: '行程',
      key: 'trip',
      width: 160,
      render: (_: unknown, record: RealTimeLocation) => (
        <Space direction="vertical" size={0}>
          <Text>{record.tripNo ?? '无活跃行程'}</Text>
          <Tag color={record.tripStatus === 'ongoing' ? 'blue' : record.tripStatus === 'planned' ? 'cyan' : 'default'}>
            {record.tripStatus ?? '空闲'}
          </Tag>
        </Space>
      )
    },
    {
      title: '最近更新时间',
      dataIndex: 'lastLocationUpdate',
      key: 'lastLocationUpdate',
      width: 180,
      render: (value: string | null | undefined) => value ? formatDateTime(value) : '—'
    }
  ]; // 2025-11-11T15:25:48Z Added by Assistant: Real-time table columns

  const trackedVehicleCount = realTimeLocations.length;
  const activeTripCount = realTimeLocations.filter(location => location.tripStatus === 'ongoing').length;
  const idleVehicleCount = realTimeLocations.filter(location => !location.tripId).length; // 2025-11-11T15:25:48Z Added by Assistant: Location summary metrics

  const handleTripClick = (trip: Trip) => {
    setSelectedTrip(trip);
  };

  return (
    <div style={{ margin: '0 0 0 24px' }}>
      <div style={{ marginBottom: 16 }}>
        <Title level={3}>车队管理</Title>
        <Text type="secondary">
          综合车队管理平台 - 在途行程、司机车辆、实时跟踪
        </Text>
      </div>

      <Tabs 
        defaultActiveKey="fleet" 
        size="large"
        items={[
          {
            key: "fleet",
            label: (
              <span>
                <TruckOutlined />
                车队管理
              </span>
            ),
            children: (
              <div>
                <Row gutter={[24, 24]}>
                  <Col span={14}>
                    <Card title="在途行程" style={{ marginBottom: 16 }}>
                      <Table
                        columns={inTransitColumns}
                        dataSource={inTransitTrips}
                        rowKey="id"
                        loading={loading}
                        pagination={false}
                        size="small"
                        scroll={{ x: 500 }}
                        onRow={(record) => ({
                          onClick: () => handleTripClick(record),
                          style: { cursor: 'pointer' }
                        })}
                      />
                    </Card>
                    
                    <Card title="空闲资源">
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <Card size="small" title={`空闲司机 (${availableDrivers.length})`} extra={<Button type="link" onClick={() => setIsAddDriverVisible(true)}>添加司机</Button>}>
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
                          </Card>
                        </Col>
                        <Col span={12}>
                          <Card size="small" title={`空闲车辆 (${availableVehicles.length})`} extra={<Button type="link" onClick={() => setIsAddVehicleVisible(true)}>添加车辆</Button>}>
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
                          </Card>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                  
                  <Col span={10}>
                    <Card
                      title="车队实时位置"
                      extra={
                        <Space size="small">
                          <Tag color="blue">追踪车辆 {trackedVehicleCount}</Tag>
                          <Tag color="green">在途 {activeTripCount}</Tag>
                          <Tag color="default">空闲 {idleVehicleCount}</Tag>
                          <Button size="small" onClick={handleManualLocationRefresh} loading={locationLoading}>
                            手动刷新
                          </Button>
                        </Space>
                      }
                    >
                      {locationError && (
                        <Alert
                          type="warning"
                          message={locationError}
                          showIcon
                          closable
                          style={{ marginBottom: 16 }}
                        />
                      )}
                      <Table<RealTimeLocation>
                        columns={realTimeColumns}
                        dataSource={realTimeLocations}
                        rowKey="key"
                        pagination={false}
                        size="small"
                        loading={locationLoading}
                        locale={{
                          emptyText: locationLoading ? '正在加载实时位置…' : '暂无实时位置数据'
                        }}
                        footer={() => (
                          <Space size="small">
                            <EnvironmentOutlined />
                            <Text type="secondary">
                              最近同步时间：{lastLocationSync ? formatDateTime(lastLocationSync.toISOString()) : '尚未同步'}
                            </Text>
                          </Space>
                        )}
                      />
                      <div style={{ borderRadius: 8, overflow: 'hidden', marginTop: 16, border: '1px solid #e6f4ff' }}>
                        <iframe
                          title="fleet-map-embed"
                          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2886.325825843657!2d-79.38393422385343!3d43.65348145245269!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x882b34d8a2f166ed%3A0xee1e8fa9045b1ba7!2sToronto%20City%20Hall!5e0!3m2!1szh-CN!2sca!4v1731309300"
                          style={{ width: '100%', height: 220, border: 0 }}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </div> {/* 2025-11-11 10:15:05 新增：基础地图嵌入占位 */}
                    </Card>
                  </Col>
                </Row>

                <div style={{ marginTop: 24, textAlign: 'center' }}>
                  <Button 
                    type="link" 
                    icon={<HistoryOutlined />}
                    onClick={() => {
                      console.log('查看历史记录');
                    }}
                  >
                    查看历史记录
                  </Button>
                </div>
              </div>
            )
          },
          {
            key: "driver-payroll",
            label: (
              <span>
                <DollarOutlined />
                司机薪酬
              </span>
            ),
            children: (
              <div style={{ padding: '16px 0' }}>
                <Card>
                  <Title level={4}>💰 司机薪酬管理</Title>
                  <Text type="secondary">管理司机工资发放、薪酬计算和支付记录</Text>
                  <DriverPerformance />
                </Card>
              </div>
            )
          },
          {
            key: "maintenance",
            label: (
              <span>
                <ToolOutlined />
                车辆维护
              </span>
            ),
            children: (
              <div style={{ padding: '16px 0' }}>
                <Card>
                  <Title level={4}>🔧 车辆维护记录</Title>
                  <Text type="secondary">管理车辆维护记录，跟踪车辆状态和保养计划</Text>
                  <VehicleMaintenance />
                </Card>
              </div>
            )
          }
        ]}
      />

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
                <p><strong>计划开始:</strong> {formatDateTime(selectedTrip.startTimePlanned)}</p>
                <p><strong>计划完成:</strong> {formatDateTime(selectedTrip.endTimePlanned)}</p>
                {selectedTrip.startTimeActual && (
                  <p><strong>实际开始:</strong> {formatDateTime(selectedTrip.startTimeActual)}</p>
                )}
                {selectedTrip.endTimeActual && (
                  <p><strong>实际完成:</strong> {formatDateTime(selectedTrip.endTimeActual)}</p>
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

      <Modal
        title="指派司机/车辆"
        open={isTripAssignModalVisible}
        onCancel={() => {
          setIsTripAssignModalVisible(false);
          tripAssignForm.resetFields();
          setTripToAssign(null);
        }}
        onOk={async () => {
          try {
            const values = await tripAssignForm.validateFields();
            if (!tripToAssign) {
              return;
            }
            await tripsApi.updateTrip(tripToAssign.id, {
              driverId: values.driverId || null,
              vehicleId: values.vehicleId || null,
            });
            message.success('行程指派成功'); // 2025-11-11 10:15:05 新增：行程指派成功提示
            setIsTripAssignModalVisible(false);
            tripAssignForm.resetFields();
            setTripToAssign(null);
            await loadFleetData();
          } catch (error) {
            console.error('指派行程失败:', error);
            message.error('指派行程失败');
          }
        }}
        okText="保存指派"
        cancelText="取消"
      >
        <Form form={tripAssignForm} layout="vertical">
          <Form.Item
            name="driverId"
            label="司机"
            rules={[{ required: false }]}
          >
            <Select
              placeholder="选择司机（可留空）"
              allowClear
            >
              {tripToAssign?.driverId && !availableDrivers.some(driver => driver.id === tripToAssign.driverId) && (
                <Select.Option value={tripToAssign.driverId}>
                  {getDriverName(tripToAssign.driverId)}（当前）
                </Select.Option>
              )}
              {availableDrivers.map((driver) => (
                <Select.Option key={driver.id} value={driver.id}>
                  {driver.name}（{driver.phone}）
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="vehicleId"
            label="车辆"
            rules={[{ required: false }]}
          >
            <Select
              placeholder="选择车辆（可留空）"
              allowClear
            >
              {tripToAssign?.vehicleId && !availableVehicles.some(vehicle => vehicle.id === tripToAssign.vehicleId) && (
                <Select.Option value={tripToAssign.vehicleId}>
                  {getVehiclePlate(tripToAssign.vehicleId)}（当前）
                </Select.Option>
              )}
              {availableVehicles.map((vehicle) => (
                <Select.Option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plateNumber}（{vehicle.type}）
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加司机"
        open={isAddDriverVisible}
        onCancel={() => { setIsAddDriverVisible(false); driverForm.resetFields(); }}
        onOk={async () => {
          try {
            const values = await driverForm.validateFields();
            await driversApi.createDriver({
              name: values.name,
              phone: values.phone,
              age: values.age || '',
              englishProficiency: values.englishProficiency || '',
              otherLanguages: values.otherLanguages || [],
              licenseClass: values.licenseClass || '',
              status: 'available'
            });
            message.success('司机已添加');
            setIsAddDriverVisible(false);
            driverForm.resetFields();
            loadFleetData();
          } catch (e) {
            console.error('Failed to add driver:', e);
            message.error('添加司机失败');
          }
        }}
        width={720}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Card size="small" title="司机信息">
              <Form form={driverForm} layout="vertical">
                <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}> 
                  <Input placeholder="张三" />
                </Form.Item>
                <Form.Item label="年龄" name="age" rules={[{ required: true, message: '请输入年龄' }]}> 
                  <Input type="number" placeholder="30" />
                </Form.Item>
                <Form.Item label="手机号" name="phone" rules={[{ required: true, message: '请输入手机号' }]}> 
                  <Input placeholder="13800000000" />
                </Form.Item>
                <Form.Item label="英语水平" name="englishLevel"> 
                  <Select options={[{ label: 'Basic', value: 'basic' }, { label: 'Intermediate', value: 'intermediate' }, { label: 'Fluent', value: 'fluent' }]} placeholder="选择英语水平" />
                </Form.Item>
                <Form.Item label="其他语言" name="otherLanguages"> 
                  <Select
                    mode="multiple"
                    placeholder="选择其他语言"
                    options={[{ label: '普通话', value: 'mandarin' }, { label: '广东话', value: 'cantonese' }, { label: '法语', value: 'french' }]}
                  />
                </Form.Item>
                <Form.Item label="驾照等级" name="licenseClass"> 
                  <Select
                    placeholder="选择驾照等级"
                    options={[
                      { label: 'Class G (Ontario)', value: 'G' },
                      { label: 'Class G1', value: 'G1' },
                      { label: 'Class G2', value: 'G2' },
                      { label: 'Class AZ (Tractor-Trailer)', value: 'AZ' },
                      { label: 'Class DZ (Straight Truck)', value: 'DZ' },
                      { label: 'Class CZ (Bus)', value: 'CZ' },
                      { label: 'Class BZ (School Bus)', value: 'BZ' },
                      { label: 'Class M (Motorcycle)', value: 'M' }
                    ]}
                  />
                </Form.Item>
              </Form>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title="全部司机">
              <List
                size="small"
                dataSource={availableDrivers}
                renderItem={(driver) => (
                  <List.Item>
                    <List.Item.Meta title={driver.name} description={driver.phone} />
                    <Tag color="green">空闲</Tag>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </Modal>

      <Modal
        title="添加车辆"
        open={isAddVehicleVisible}
        onCancel={() => { setIsAddVehicleVisible(false); vehicleForm.resetFields(); }}
        onOk={async () => {
          try {
            const values = await vehicleForm.validateFields();
            await vehiclesApi.createVehicle({
              plateNumber: values.plateNumber,
              type: values.type,
              capacityKg: Number(values.capacityKg) || 0,
              status: 'available'
            });
            message.success('车辆已添加');
            setIsAddVehicleVisible(false);
            vehicleForm.resetFields();
            loadFleetData();
          } catch (e) {
            console.error('Failed to add vehicle:', e);
            message.error('添加车辆失败');
          }
        }}
        width={720}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Card size="small" title="车辆信息">
              <Form form={vehicleForm} layout="vertical">
                <Form.Item label="车牌号" name="plateNumber" rules={[{ required: true, message: '请输入车牌号' }]}>
                  <Input placeholder="京A12345" />
                </Form.Item>
                <Form.Item label="车型" name="type" rules={[{ required: true, message: '请选择车型' }]}>
                  <Select options={[{ label: '厢式货车', value: '厢式货车' }, { label: '平板车', value: '平板车' }, { label: '冷链车', value: '冷链车' }]} />
                </Form.Item>
                <Form.Item label="载重(kg)" name="capacityKg" rules={[{ required: true, message: '请输入载重' }]}>
                  <Input type="number" placeholder="3000" />
                </Form.Item>
              </Form>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title="全部车辆">
              <List
                size="small"
                dataSource={availableVehicles}
                renderItem={(vehicle) => (
                  <List.Item>
                    <List.Item.Meta title={vehicle.plateNumber} description={`${vehicle.type} - ${vehicle.capacityKg}kg`} />
                    <Tag color="green">空闲</Tag>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </Modal>
    </div>
  );
};

export default FleetManagement;