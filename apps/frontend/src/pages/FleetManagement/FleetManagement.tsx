import React, { useState, useEffect, useCallback, useMemo } from 'react'; // 2025-11-11T15:25:48Z Added by Assistant: useCallback for location polling // 2025-11-11 10:20:05 引入useMemo生成地图标记
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
  DollarOutlined
} from '@ant-design/icons';
import { Trip, TripStatus, Driver, Vehicle, DriverStatus, VehicleStatus } from '../../types';
import { useDataContext } from '../../contexts/DataContext'; // 2025-11-11T16:00:00Z Added by Assistant: Use global data context
// 2025-11-30T12:45:00Z Added by Assistant: 使用统一的司机和车辆表单组件
import DriverForm, { transformDriverFormData } from '../../components/DriverForm/DriverForm';
import VehicleForm, { transformVehicleFormData } from '../../components/VehicleForm/VehicleForm';
import { driversApi, vehiclesApi, tripsApi, locationApi } from '../../services/api'; // 2025-11-11T15:25:48Z Added by Assistant: Real-time location API
import GoogleMap from '../../components/GoogleMap/GoogleMap'; // 2025-11-11 10:20:05 启用地图组件展示实时位置
import { formatDateTime } from '../../utils/timeUtils';
import DriverPayroll from '../../components/DriverPerformance/DriverPerformance'; // 2025-11-30 06:55:00 修复：组件实际导出的是 DriverPayroll
// 2025-11-30 03:15:00 移除：车辆维护组件（根据计划要求）
// import VehicleMaintenance from '../../components/VehicleMaintenance/VehicleMaintenance';
import ScheduleManagement from '../../components/ScheduleManagement/ScheduleManagement'; // 2025-11-29T11:25:04Z 排班管理组件

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
  // 2025-11-11T16:00:00Z Added by Assistant: Use global data context for cross-page synchronization
  const { availableDrivers, reloadDrivers, availableVehicles, reloadVehicles } = useDataContext();
  
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
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null); // 2025-11-11 10:20:05 地图标记选中状态

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

  const mapMarkers = useMemo(() => {
    return realTimeLocations
      .filter((location) => typeof location.latitude === 'number' && typeof location.longitude === 'number')
      .map((location) => ({
        id: location.key,
        position: {
          lat: Number(location.latitude),
          lng: Number(location.longitude),
        },
        title: location.plateNumber || location.driverName || '未命名车辆',
        info: `
          <div>
            <strong>${location.plateNumber || '车辆'}</strong><br/>
            司机：${location.driverName || '未知'}<br/>
            状态：${location.vehicleStatus || location.driverStatus || '未知'}<br/>
            更新时间：${location.lastLocationUpdate ? formatDateTime(location.lastLocationUpdate) : '未知'}
          </div>
        `,
      }));
  }, [realTimeLocations]);

  const mapCenter = useMemo(() => {
    if (mapMarkers.length > 0) {
      return mapMarkers[0].position;
    }
    // 默认中心坐标（多伦多市政厅）
    return { lat: 43.653481, lng: -79.383934 };
  }, [mapMarkers]);

  const handleMarkerClick = useCallback((markerId: string) => {
    setSelectedMarkerId(markerId);
    const target = realTimeLocations.find((location) => location.key === markerId);
    if (target) {
      message.info(`${target.plateNumber || target.driverName || '车辆'}：${target.vehicleStatus || target.driverStatus || '状态未知'}`);
    }
  }, [realTimeLocations]);

  // 2025-11-30T10:30:00Z Updated by Assistant: 优化行程数据加载，支持多种状态
  const loadTripsData = async () => {
    try {
      setLoading(true);
      const tripsResult = await tripsApi.getTrips();
      const allTrips = tripsResult.data?.data || [];
      // 2025-11-30T10:30:00Z 支持多种状态：ongoing, planned（已计划但未开始也算在途）
      const ongoingTrips = allTrips.filter((trip: Trip) => 
        trip.status === TripStatus.ONGOING || trip.status === TripStatus.PLANNED
      );
      setInTransitTrips(ongoingTrips);
      
      // 如果没有在途行程，显示提示信息
      if (ongoingTrips.length === 0 && allTrips.length > 0) {
        console.log('当前没有在途行程，但有其他状态的行程:', allTrips.map((t: Trip) => ({ tripNo: t.tripNo, status: t.status })));
      }
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
                  {/* 左侧：在途行程和空闲资源 */}
                  <Col span={14}>
                    <Card 
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>在途行程</span>
                          <Button 
                            type="link" 
                            size="small"
                            onClick={loadFleetData}
                            loading={loading}
                          >
                            刷新
                          </Button>
                        </div>
                      }
                      style={{ marginBottom: 16 }}
                    >
                      {inTransitTrips.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                          <TruckOutlined style={{ fontSize: 48, marginBottom: 16, color: '#d9d9d9' }} />
                          <div>当前没有在途行程</div>
                          <div style={{ fontSize: 12, marginTop: 8 }}>
                            创建新行程或查看已完成行程
                          </div>
                        </div>
                      ) : (
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
                      )}
                    </Card>
                    
                    <Card title="空闲资源">
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <Card size="small" title={`空闲司机 (${availableDrivers.length})`} extra={<Button type="link" size="small" onClick={() => setIsAddDriverVisible(true)}>添加</Button>}>
                            {availableDrivers.length === 0 ? (
                              <div style={{ textAlign: 'center', padding: '20px 0', color: '#999', fontSize: 12 }}>
                                暂无空闲司机
                              </div>
                            ) : (
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
                            )}
                          </Card>
                        </Col>
                        <Col span={12}>
                          <Card size="small" title={`空闲车辆 (${availableVehicles.length})`} extra={<Button type="link" size="small" onClick={() => setIsAddVehicleVisible(true)}>添加</Button>}>
                            {availableVehicles.length === 0 ? (
                              <div style={{ textAlign: 'center', padding: '20px 0', color: '#999', fontSize: 12 }}>
                                暂无空闲车辆
                              </div>
                            ) : (
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
                            )}
                          </Card>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                  
                  {/* 右侧：实时位置地图 */}
                  <Col span={10}>
                    <Card 
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>
                            <EnvironmentOutlined /> 实时位置
                          </span>
                          <Button 
                            type="link" 
                            size="small"
                            onClick={handleManualLocationRefresh}
                            loading={locationLoading}
                          >
                            刷新
                          </Button>
                        </div>
                      }
                      style={{ height: '100%' }}
                    >
                      {locationError && (
                        <Alert
                          message="位置数据获取失败"
                          description={locationError}
                          type="warning"
                          showIcon
                          style={{ marginBottom: 16 }}
                        />
                      )}
                      
                      {realTimeLocations.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
                          <EnvironmentOutlined style={{ fontSize: 48, marginBottom: 16, color: '#d9d9d9' }} />
                          <div>暂无实时位置数据</div>
                          <div style={{ fontSize: 12, marginTop: 8 }}>
                            车辆和司机位置将显示在地图上
                          </div>
                        </div>
                      ) : (
                        <div style={{ height: '600px', width: '100%' }}>
                          <GoogleMap
                            center={mapCenter}
                            markers={mapMarkers}
                            onMarkerClick={handleMarkerClick}
                            zoom={12}
                          />
                          {lastLocationSync && (
                            <div style={{ marginTop: 8, fontSize: 12, color: '#999', textAlign: 'center' }}>
                              最后更新: {formatDateTime(lastLocationSync.toISOString())}
                            </div>
                          )}
                        </div>
                      )}
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
                  <DriverPayroll /> {/* 2025-11-30 06:55:00 修复：使用正确的组件名 */}
                </Card>
              </div>
            )
          },
          // 2025-11-30 03:15:00 移除：车辆维护 Tab（根据计划要求）
          // {
          //   key: "maintenance",
          //   label: (
          //     <span>
          //       <ToolOutlined />
          //       车辆维护
          //     </span>
          //   ),
          //   children: (
          //     <div style={{ padding: '16px 0' }}>
          //       <Card>
          //         <Title level={4}>🔧 车辆维护记录</Title>
          //         <Text type="secondary">管理车辆维护记录，跟踪车辆状态和保养计划</Text>
          //         <VehicleMaintenance />
          //       </Card>
          //     </div>
          //   )
          // },
          {
            key: "schedule",
            label: (
              <span>
                <TeamOutlined />
                排班管理
              </span>
            ),
            children: (
              <div style={{ padding: '16px 0' }}>
                <Card>
                  <Title level={4}>📅 排班管理</Title>
                  <Text type="secondary">
                    管理司机排班，支持自定义字段（客户名称、目的地、优先级、货品类目、里程、联系电话等），
                    通过表头配置进行一键排序归类，精准筛选快速定位目标信息
                  </Text>
                  <ScheduleManagement />
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
            // 2025-11-30T12:45:00Z Updated by Assistant: 使用统一的表单数据转换函数
            const driverData = transformDriverFormData(values, 'create');
            await driversApi.createDriver(driverData);
            message.success('司机已添加');
            setIsAddDriverVisible(false);
            driverForm.resetFields();
            // 2025-11-11T16:00:00Z Added by Assistant: Refresh global data context for cross-page synchronization
            await reloadDrivers();
            loadTripsData();
          } catch (e: any) {
            console.error('Failed to add driver:', e);
            const errorMessage = e?.response?.data?.error?.message || e?.message || '添加司机失败';
            message.error(errorMessage);
          }
        }}
        width={720}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Card size="small" title="司机信息">
              {/* 2025-11-30T12:45:00Z Updated by Assistant: 使用统一的司机表单组件 */}
              <DriverForm form={driverForm} mode="create" />
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
            // 2025-11-11T16:00:00Z Added by Assistant: Refresh global data context for cross-page synchronization
            await reloadVehicles();
            loadTripsData();
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