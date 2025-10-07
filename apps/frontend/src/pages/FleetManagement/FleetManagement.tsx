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
  List,
  Avatar,
  Divider,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tabs
} from 'antd';
import { 
  TeamOutlined, 
  TruckOutlined, 
  EyeOutlined,
  HistoryOutlined,
  EnvironmentOutlined,
  TrophyOutlined,
  ToolOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { Trip, TripStatus, Driver, Vehicle, Shipment, DriverStatus, VehicleStatus } from '../../types';
import { driversApi, vehiclesApi, tripsApi } from '../../services/api';
import GoogleMap from '../../components/GoogleMap/GoogleMap';
import { formatDateTime } from '../../utils/timeUtils';
import RealTimeTracking from '../../components/RealTimeTracking/RealTimeTracking';
import DriverPerformance from '../../components/DriverPerformance/DriverPerformance';
import VehicleMaintenance from '../../components/VehicleMaintenance/VehicleMaintenance';

const { Title, Text } = Typography;

const FleetManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [inTransitTrips, setInTransitTrips] = useState<Trip[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isAddDriverVisible, setIsAddDriverVisible] = useState(false);
  const [isAddVehicleVisible, setIsAddVehicleVisible] = useState(false);
  const [driverForm] = Form.useForm();
  const [vehicleForm] = Form.useForm();

  useEffect(() => {
    loadFleetData();
  }, []);

  const loadFleetData = async () => {
    try {
      setLoading(true);
      
      const [driversRes, vehiclesRes, tripsRes] = await Promise.all([
        driversApi.getDrivers(),
        vehiclesApi.getVehicles(),
        tripsApi.getTrips()
      ]);

      const allDrivers = driversRes.data?.data || [];
      const availableDrivers = allDrivers.filter(driver => driver.status === DriverStatus.AVAILABLE);
      setAvailableDrivers(availableDrivers);

      const allVehicles = vehiclesRes.data?.data || [];
      const availableVehicles = allVehicles.filter(vehicle => vehicle.status === VehicleStatus.AVAILABLE);
      setAvailableVehicles(availableVehicles);

      const allTrips = tripsRes.data?.data || [];
      const inTransitTrips = allTrips.filter(trip => trip.status === TripStatus.ONGOING);
      setInTransitTrips(inTransitTrips);

    } catch (error) {
      console.error('Failed to load fleet data:', error);
      setAvailableDrivers([
        { id: 'driver3', tenantId: 'tenant1', name: '王五', phone: '13800138003', status: DriverStatus.AVAILABLE, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
        { id: 'driver4', tenantId: 'tenant1', name: '赵六', phone: '13800138004', status: DriverStatus.AVAILABLE, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' }
      ]);

      setAvailableVehicles([
        { id: 'vehicle3', tenantId: 'tenant1', plateNumber: '京C11111', type: '厢式货车', capacityKg: 3000, status: VehicleStatus.AVAILABLE, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
        { id: 'vehicle4', tenantId: 'tenant1', plateNumber: '京D22222', type: '平板车', capacityKg: 6000, status: VehicleStatus.AVAILABLE, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' }
      ]);
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
      title: '行程',
      dataIndex: 'tripNo',
      key: 'tripNo',
      width: 140,
      render: (_: any, record: Trip) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{record.tripNo}</span>
          <Badge count={record.shipments.length} color="#1890ff" style={{ backgroundColor: '#1890ff' }} />
        </div>
      )
    },
    {
      title: '司机 / 车辆',
      key: 'driverVehicle',
      width: 140,
      render: (_: any, record: Trip) => (
        <div>
          <div>{getDriverName(record.driverId)}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{getVehiclePlate(record.vehicleId)}</div>
        </div>
      )
    },
    {
      title: '时间',
      key: 'timeRange',
      width: 160,
      render: (_: any, record: Trip) => (
        <div style={{ fontSize: 11 }}>
          <div><strong>开始:</strong> <span style={{ fontSize: 10 }}>{formatDateTime(record.startTimePlanned)}</span></div>
          <div><strong>预计完:</strong> <span style={{ fontSize: 10, color: '#888' }}>{formatDateTime(record.endTimePlanned)}</span></div>
        </div>
      )
    },
  ];

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
                    <Card title="车队实时位置">
                      <GoogleMap
                        center={{ lat: 39.9042, lng: 116.4074 }}
                        zoom={10}
                        height="600px"
                        markers={[
                          {
                            id: 'trip-1',
                            position: { lat: 39.9042, lng: 116.4074 },
                            title: 'TRIP-20250127-001',
                            info: '<div><strong>行程 TRIP-20250127-001</strong><br/>司机：张三<br/>车辆：京A12345<br/>状态：在途</div>',
                          },
                          {
                            id: 'trip-2',
                            position: { lat: 39.9142, lng: 116.4174 },
                            title: 'TRIP-20250127-002',
                            info: '<div><strong>行程 TRIP-20250127-002</strong><br/>司机：李四<br/>车辆：京B67890<br/>状态：在途</div>',
                          },
                        ]}
                        routes={[
                          {
                            from: { lat: 39.9042, lng: 116.4074 },
                            to: { lat: 39.9142, lng: 116.4174 },
                            color: '#1890ff',
                          },
                        ]}
                        onMarkerClick={(markerId) => {
                          console.log('点击标记:', markerId);
                        }}
                      />
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
            key: "tracking",
            label: (
              <span>
                <EnvironmentOutlined />
                实时跟踪
              </span>
            ),
            children: (
              <div style={{ padding: '16px 0' }}>
                <Card>
                  <Title level={4}>📍 实时位置跟踪</Title>
                  <Text type="secondary">车队实时位置监控和跟踪管理</Text>
                  <RealTimeTracking />
                </Card>
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