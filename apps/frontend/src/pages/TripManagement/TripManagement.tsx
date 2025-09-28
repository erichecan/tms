import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Card, 
  Table, 
  Typography, 
  message, 
  Tag, 
  Space, 
  Tooltip, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Row, 
  Col, 
  Divider,
  Timeline,
  Badge
} from 'antd';
import { 
  PlusOutlined, 
  EyeOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  TeamOutlined,
  TruckOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { Trip, TripStatus, Driver, Vehicle, Shipment } from '../../types';

const { Title, Text } = Typography;

const TripManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadTrips();
    loadDrivers();
    loadVehicles();
    loadShipments();
  }, []);

  const loadTrips = async () => {
    try {
      setLoading(true);
      // TODO: 实现API调用
      // const response = await tripsApi.getTrips();
      // setTrips(response.data.data || []);
      
      // 模拟数据
      setTrips([
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
          status: TripStatus.PLANNING,
          driverId: 'driver2',
          vehicleId: 'vehicle2',
          legs: [],
          shipments: ['shipment3'],
          startTimePlanned: '2025-01-27T14:00:00Z',
          endTimePlanned: '2025-01-27T20:00:00Z',
          createdAt: '2025-01-27T10:00:00Z',
          updatedAt: '2025-01-27T10:00:00Z'
        }
      ]);
    } catch (error) {
      console.error('Failed to load trips:', error);
      message.error('加载行程失败');
    } finally {
      setLoading(false);
    }
  };

  const loadDrivers = async () => {
    try {
      // TODO: 实现API调用
      setDrivers([
        { id: 'driver1', tenantId: 'tenant1', name: '张三', phone: '13800138001', status: 'busy', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
        { id: 'driver2', tenantId: 'tenant1', name: '李四', phone: '13800138002', status: 'available', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' }
      ]);
    } catch (error) {
      console.error('Failed to load drivers:', error);
    }
  };

  const loadVehicles = async () => {
    try {
      // TODO: 实现API调用
      setVehicles([
        { id: 'vehicle1', tenantId: 'tenant1', plateNumber: '京A12345', type: '厢式货车', capacityKg: 5000, status: 'busy', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
        { id: 'vehicle2', tenantId: 'tenant1', plateNumber: '京B67890', type: '平板车', capacityKg: 8000, status: 'available', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' }
      ]);
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    }
  };

  const loadShipments = async () => {
    try {
      // TODO: 实现API调用
      setShipments([
        { 
          id: 'shipment1', 
          shipmentNo: 'SHIP-001', 
          customerId: 'customer1', 
          status: 'assigned',
          shipperAddress: { country: '中国', province: '北京', city: '北京市', postalCode: '100000', addressLine1: '朝阳区xxx', isResidential: false },
          receiverAddress: { country: '中国', province: '上海', city: '上海市', postalCode: '200000', addressLine1: '浦东新区xxx', isResidential: true },
          weightKg: 100, lengthCm: 50, widthCm: 30, heightCm: 20, description: '电子产品', tags: [], services: {}, estimatedCost: 500, pricingComponents: [], pricingRuleTrace: [], finalCost: undefined, costCurrency: 'CNY', tenantId: 'tenant1', createdAt: '2025-01-27T08:00:00Z', updatedAt: '2025-01-27T08:00:00Z'
        },
        { 
          id: 'shipment2', 
          shipmentNo: 'SHIP-002', 
          customerId: 'customer2', 
          status: 'assigned',
          shipperAddress: { country: '中国', province: '北京', city: '北京市', postalCode: '100000', addressLine1: '海淀区xxx', isResidential: false },
          receiverAddress: { country: '中国', province: '上海', city: '上海市', postalCode: '200000', addressLine1: '黄浦区xxx', isResidential: true },
          weightKg: 200, lengthCm: 60, widthCm: 40, heightCm: 30, description: '服装', tags: [], services: {}, estimatedCost: 800, pricingComponents: [], pricingRuleTrace: [], finalCost: undefined, costCurrency: 'CNY', tenantId: 'tenant1', createdAt: '2025-01-27T08:30:00Z', updatedAt: '2025-01-27T08:30:00Z'
        }
      ]);
    } catch (error) {
      console.error('Failed to load shipments:', error);
    }
  };

  const handleAddTrip = () => {
    setIsAddModalVisible(true);
    form.resetFields();
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setIsEditModalVisible(true);
    form.setFieldsValue({
      tripNo: trip.tripNo,
      driverId: trip.driverId,
      vehicleId: trip.vehicleId,
      startTimePlanned: trip.startTimePlanned,
      endTimePlanned: trip.endTimePlanned,
      shipments: trip.shipments
    });
  };

  const handleViewDetail = (trip: Trip) => {
    setSelectedTrip(trip);
    setIsDetailModalVisible(true);
  };

  const handleStatusChange = async (trip: Trip, newStatus: TripStatus) => {
    try {
      // TODO: 实现API调用
      // await tripsApi.updateTripStatus(trip.id, newStatus);
      message.success(`行程状态已更新为${getStatusText(newStatus)}`);
      loadTrips();
    } catch (error) {
      console.error('Failed to update trip status:', error);
      message.error('更新行程状态失败');
    }
  };

  const getStatusText = (status: TripStatus) => {
    const statusMap = {
      [TripStatus.PLANNING]: '规划中',
      [TripStatus.ONGOING]: '执行中',
      [TripStatus.COMPLETED]: '已完成',
      [TripStatus.CANCELED]: '已取消'
    };
    return statusMap[status] || status;
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

  const getDriverName = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? driver.name : '未知司机';
  };

  const getVehiclePlate = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? vehicle.plateNumber : '未知车辆';
  };

  const getShipmentInfo = (shipmentIds: string[]) => {
    return shipmentIds.map(id => {
      const shipment = shipments.find(s => s.id === id);
      return shipment ? shipment.shipmentNo : id;
    }).join(', ');
  };

  const columns = [
    {
      title: '行程号',
      dataIndex: 'tripNo',
      key: 'tripNo',
      width: 150,
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
      title: '挂载运单',
      dataIndex: 'shipments',
      key: 'shipments',
      width: 200,
      render: (shipments: string[]) => (
        <Badge count={shipments.length} showZero>
          <Text ellipsis={{ tooltip: getShipmentInfo(shipments) }}>
            {getShipmentInfo(shipments)}
          </Text>
        </Badge>
      ),
    },
    {
      title: '计划时间',
      dataIndex: 'startTimePlanned',
      key: 'startTimePlanned',
      width: 150,
      render: (startTime: string, record: Trip) => (
        <div>
          <div>开始: {new Date(startTime).toLocaleString('zh-CN')}</div>
          <div>结束: {new Date(record.endTimePlanned || '').toLocaleString('zh-CN')}</div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Trip) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEditTrip(record)}
            />
          </Tooltip>
          {record.status === TripStatus.PLANNING && (
            <Tooltip title="开始执行">
              <Button 
                type="text" 
                icon={<PlayCircleOutlined />} 
                onClick={() => handleStatusChange(record, TripStatus.ONGOING)}
              />
            </Tooltip>
          )}
          {record.status === TripStatus.ONGOING && (
            <Tooltip title="完成行程">
              <Button 
                type="text" 
                icon={<CheckCircleOutlined />} 
                onClick={() => handleStatusChange(record, TripStatus.COMPLETED)}
              />
            </Tooltip>
          )}
          <Tooltip title="删除">
            <Button 
              type="text" 
              icon={<DeleteOutlined />} 
              danger
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3}>行程管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTrip}>
          创建行程
        </Button>
      </div>
      
      <Card>
        <Table
          columns={columns}
          dataSource={trips}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 创建行程弹窗 */}
      <Modal
        title="创建行程"
        open={isAddModalVisible}
        onOk={() => {
          // TODO: 实现创建逻辑
          message.success('行程创建成功');
          setIsAddModalVisible(false);
          loadTrips();
        }}
        onCancel={() => {
          setIsAddModalVisible(false);
          form.resetFields();
        }}
        okText="确认"
        cancelText="取消"
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="tripNo"
            label="行程号"
            rules={[{ required: true, message: '请输入行程号' }]}
          >
            <Input placeholder="请输入行程号" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="driverId"
                label="司机"
                rules={[{ required: true, message: '请选择司机' }]}
              >
                <Select placeholder="请选择司机">
                  {drivers.map(driver => (
                    <Select.Option key={driver.id} value={driver.id}>
                      {driver.name} ({driver.phone})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="vehicleId"
                label="车辆"
                rules={[{ required: true, message: '请选择车辆' }]}
              >
                <Select placeholder="请选择车辆">
                  {vehicles.map(vehicle => (
                    <Select.Option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plateNumber} ({vehicle.type})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="shipments"
            label="挂载运单"
          >
            <Select mode="multiple" placeholder="请选择要挂载的运单">
              {shipments.map(shipment => (
                <Select.Option key={shipment.id} value={shipment.id}>
                  {shipment.shipmentNo} - {shipment.description}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 行程详情模态框 */}
      <Modal
        title={`${selectedTrip?.tripNo} - 行程详情`}
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={1000}
      >
        {selectedTrip && (
          <div>
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
            <Table
              dataSource={selectedTrip.shipments.map(id => shipments.find(s => s.id === id)).filter(Boolean)}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                { title: '运单号', dataIndex: 'shipmentNo', key: 'shipmentNo' },
                { title: '状态', dataIndex: 'status', key: 'status' },
                { title: '重量', dataIndex: 'weightKg', key: 'weightKg', render: (weight: number) => `${weight}kg` },
                { title: '描述', dataIndex: 'description', key: 'description' },
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TripManagement;
