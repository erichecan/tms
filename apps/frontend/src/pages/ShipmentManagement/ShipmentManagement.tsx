import React, { useState, useEffect } from 'react';
import { Button, Space, Typography, message, Tag, Tooltip, Card, Table, Modal, Divider, Badge, Radio } from 'antd'; // 2025-10-02 02:55:10 增加 Badge 用于费用标签 // 2025-10-02 15:12:30 引入 Radio 用于选择行程
import { 
  EyeOutlined, 
  EditOutlined, 
  DeleteOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { shipmentsApi, driversApi, tripsApi, customersApi } from '../../services/api'; // 2025-10-02 15:12:30 引入 tripsApi 以支持挂载行程 // 2025-10-02 16:20:05 引入 customersApi 用于显示客户
import { Shipment, ShipmentStatus, Driver, Customer } from '../../types';
import ShipmentDetails from '../../components/ShipmentDetails/ShipmentDetails'; // 2025-09-27 03:10:00 恢复运单词情组件
import { useLocation, useNavigate } from 'react-router-dom'; // 2025-10-02 02:55:10 导航至创建页
import { formatDateTime } from '../../utils/timeUtils'; // 2025-10-02 16:38:00 引入时间格式化工具

const { Title, Text } = Typography;

const ShipmentManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]); // 2025-10-02 16:20:05 载入客户用于展示
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewingShipment, setViewingShipment] = useState<Shipment | null>(null);
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [assigningShipment, setAssigningShipment] = useState<Shipment | null>(null);
  const [availableTrips, setAvailableTrips] = useState<any[]>([]); // 2025-10-02 15:12:30 可挂载行程列表
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null); // 2025-10-02 15:12:30 已选择的行程
  const [isCostModalVisible, setIsCostModalVisible] = useState(false); // 费用明细弹窗 // 2025-10-02 02:55:10
  const [costViewingShipment, setCostViewingShipment] = useState<Shipment | null>(null); // 2025-10-02 02:55:10

  const location = useLocation();
  const navigate = useNavigate(); // 2025-10-02 02:55:10

  useEffect(() => {
    loadShipments();
    loadDrivers();
    loadCustomers(); // 2025-10-02 16:20:05 加载客户列表
  }, []);

  // 页面进入后，如果来自创建页且携带 autoAssignShipmentId，则自动打开指派弹窗 // 2025-10-01 14:07:30
  useEffect(() => {
    const state: any = location.state;
    if (state?.autoAssignShipmentId && shipments.length > 0) {
      const target = shipments.find(s => s.id === state.autoAssignShipmentId);
      if (target) {
        handleAssignDriver(target);
      }
    }
  }, [location.state, shipments]);

  const loadShipments = async () => {
    try {
      setLoading(true);
      const response = await shipmentsApi.getShipments();
      setShipments(response.data.data || []);
    } catch (error) {
      console.error('Failed to load shipments:', error);
      message.error('加载运单失败');
    } finally {
      setLoading(false);
    }
  };

  const loadDrivers = async () => {
    try {
      const response = await driversApi.getDrivers();
      setDrivers(response.data.data || []);
    } catch (error) {
      console.error('Failed to load drivers:', error);
      message.error('加载司机失败');
    }
  };

  // 2025-10-02 16:20:05 加载客户列表，确保“客户”来自创建订单信息而非分配
  const loadCustomers = async () => {
    try {
      const response = await customersApi.getCustomers();
      setCustomers(response.data.data || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const getCustomerName = (record: Shipment) => {
    const anyRec = record as any;
    const name = anyRec.customerName || anyRec.customer?.name || anyRec.customer?.contact?.name || anyRec.customer?.contactInfo?.name || anyRec.customer_full_name || anyRec.customer_name;
    if (name) return name;
    const cid = anyRec.customerId || anyRec.customer_id || anyRec.customer?.id;
    if (!cid) return '—';
    const found = customers.find(c => c.id === cid);
    return found?.name || anyRec.customerEmail || '—';
  };

  const handleView = (shipment: Shipment) => {
    setViewingShipment(shipment);
    setIsViewModalVisible(true);
  };

  const handleAssignDriver = async (shipment: Shipment) => { // 2025-10-02 15:12:30 改为加载行程后再打开弹窗（指派车辆/行程）
    setAssigningShipment(shipment);
    try {
      // 2025-10-02 15:12:30 加载在途或规划中的行程，供挂载
      const res = await tripsApi.getTrips({ status: ['planning', 'ongoing'] });
      setAvailableTrips(res.data.data || []);
      setSelectedTripId(null);
    } catch (e) {
      console.error('加载行程失败', e); // 2025-10-02 15:12:30
      message.error('加载行程失败');
    }
    setIsAssignModalVisible(true);
  };

  const handleConfirmMountToTrip = async () => { // 2025-10-02 15:12:30 确认将运单挂载到行程
    if (!assigningShipment || !selectedTripId) {
      return message.warning('请选择一个行程'); // 2025-10-02 15:12:30
    }
    try {
      await tripsApi.mountShipmentsToTrip(selectedTripId, [assigningShipment.id]);
      message.success('已挂载到行程'); // 2025-10-02 15:12:30
      setIsAssignModalVisible(false);
      setAssigningShipment(null);
      loadShipments();
    } catch (error) {
      console.error('挂载行程失败:', error); // 2025-10-02 15:12:30
      message.error('挂载行程失败');
    }
  };

  const handleDelete = async (record: Shipment) => {
    try {
      const anyRec = record as any;
      const sid = record.id || anyRec.shipmentId || anyRec.id;
      if (!sid) {
        message.error('无法获取运单ID');
        return;
      }
      await shipmentsApi.deleteShipment(sid);
      message.success('删除成功');
      loadShipments();
    } catch (error) {
      console.error('Failed to delete shipment:', error);
      message.error('删除运单失败');
    }
  };

  const getStatusTag = (status: ShipmentStatus) => {
    const statusMap: Record<ShipmentStatus, { color: string; text: string; icon: React.ReactNode }> = {
      [ShipmentStatus.PENDING]: { color: 'orange', text: '待处理', icon: <ClockCircleOutlined /> },
      [ShipmentStatus.QUOTED]: { color: 'blue', text: '已报价', icon: <ClockCircleOutlined /> },
      [ShipmentStatus.CONFIRMED]: { color: 'cyan', text: '已确认', icon: <ClockCircleOutlined /> },
      [ShipmentStatus.ASSIGNED]: { color: 'purple', text: '已分配', icon: <ClockCircleOutlined /> },
      [ShipmentStatus.PICKED_UP]: { color: 'geekblue', text: '已取货', icon: <ClockCircleOutlined /> },
      [ShipmentStatus.IN_TRANSIT]: { color: 'blue', text: '运输中', icon: <ClockCircleOutlined /> },
      [ShipmentStatus.DELIVERED]: { color: 'green', text: '已送达', icon: <CheckCircleOutlined /> },
      [ShipmentStatus.COMPLETED]: { color: 'green', text: '已完成', icon: <CheckCircleOutlined /> },
      [ShipmentStatus.CANCELLED]: { color: 'red', text: '已取消', icon: <ClockCircleOutlined /> },
      [ShipmentStatus.EXCEPTION]: { color: 'red', text: '异常', icon: <ClockCircleOutlined /> },
    };
    return statusMap[status] || { color: 'default', text: '未知', icon: <ClockCircleOutlined /> };
  };

  // 表格列定义 // 2025-10-02 02:55:10 根据 docs/request.md 改造
  const columns = [
    {
      title: '单号',
      key: 'numbers',
      width: 200,
      render: (_: any, record: Shipment) => (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.4 }}>
          <Text code>{(record as any).shipmentNumber || (record as any).shipmentNo || record.id}</Text>
          <Text type={(record as any).tripNo ? undefined : 'secondary'} style={{ fontSize: 12 }}>
            {(record as any).tripNo ? `行程：${(record as any).tripNo}` : '未挂载'}
          </Text>
        </div>
      )
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (_text: string, record: Shipment) => getCustomerName(record), // 2025-10-02 16:20:05 显示创建时的客户
    },
    {
      title: '司机 / 车辆',
      key: 'driverVehicle',
      width: 160, // 2025-10-02 16:05:30 缩窄单元格到160px
      render: (_: any, record: Shipment) => {
        const driverText = record.driverName || '未分配';
        const vehicleText = (record as any).vehiclePlate || (record as any).vehicleName || '未分配';
        const assigned = Boolean(record.driverId);
        return (
          <div style={{ maxWidth: 160, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {assigned ? (
                <CheckCircleOutlined style={{ marginRight: 4, color: '#52c41a', fontSize: '12px' }} />
              ) : (
                <ClockCircleOutlined style={{ marginRight: 4, color: '#ff4d4f', fontSize: '12px' }} />
              )}
              <Text style={{ fontSize: '12px' }} ellipsis>
                {driverText}
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 2 }}>
              <Text type={vehicleText === '未分配' ? 'secondary' : undefined} style={{ fontSize: '12px' }} ellipsis>
                {vehicleText}
              </Text>
            </div>
          </div>
        );
      },
    },
    {
      title: '路线',
      key: 'route',
      render: (_: any, record: Shipment) => {
        const pickup = (record.pickupAddress as any)?.code || (record.pickupAddress as any)?.city || '起点';
        const delivery = (record.deliveryAddress as any)?.code || (record.deliveryAddress as any)?.city || '终点';
        return (
          <Space size={4} wrap>
            <Tag color="blue">{pickup}</Tag>
            <span style={{ color: '#999' }}>→</span>
            <Tag color="green">{delivery}</Tag>
          </Space>
        );
      }
    },
    {
      title: '费用预估',
      key: 'estimatedCost',
      render: (_: any, record: Shipment) => {
        const amount = record.estimatedCost ?? (record as any).previewCost;
        return (
          <Badge status="processing" text={amount != null ? `${Math.round(Number(amount))} ` : '—'}>
          </Badge>
        );
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: ShipmentStatus) => {
        const statusInfo = getStatusTag(status);
        return (
          <Tag color={statusInfo.color} icon={statusInfo.icon}>
            {statusInfo.text}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Shipment) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)} />
          </Tooltip>
          <Tooltip title="费用明细">
            <Button type="text" size="small" onClick={() => { setCostViewingShipment(record); setIsCostModalVisible(true); }}>￥</Button>
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleView(record)} />
          </Tooltip>
          {!record.tripNo && (
            <Tooltip title="指派车辆/行程">{/* 2025-10-02 15:12:30 未挂载行程则提供指派入口 */}
              <Button
                type="text"
                size="small"
                icon={<UserAddOutlined />}
                onClick={() => handleAssignDriver(record)}
              />
            </Tooltip>
          )}
          <Tooltip title="删除">
            <Button 
              type="text" 
              size="small"
              danger
              icon={<DeleteOutlined />} 
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3}>运单管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admin/shipments/create')}>{/* 跳转创建页 // 2025-10-02 02:55:10 */}
          创建运单
        </Button>
      </div>
      
      <Card>
        <Table
          columns={columns}
          dataSource={shipments}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1100 }} // 2025-10-02 16:27:20 开启水平滚动，确保列宽生效
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 运单详情弹窗 */}
      <Modal
        title="运单详情"
        open={isViewModalVisible}
        onCancel={() => {
          setIsViewModalVisible(false);
          setViewingShipment(null);
        }}
        footer={null}
        width={1000}
      >
        {viewingShipment && (
          <ShipmentDetails 
            shipment={viewingShipment}
            onPrint={() => {
              window.print();
            }}
          />
        )}
      </Modal>

      {/* 指派车辆/行程弹窗 // 2025-10-02 15:12:30 */}
      <Modal
        title="指派车辆/行程"
        open={isAssignModalVisible}
        onCancel={() => {
          setIsAssignModalVisible(false);
          setAssigningShipment(null);
        }}
        onOk={handleConfirmMountToTrip}
        okText="挂载到行程"
        width={640}
      >
        {assigningShipment && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>运单号：</Text>
              <Text code>{assigningShipment.shipmentNumber}</Text>
            </div>
            <Divider />
            <div>
              <Text strong style={{ marginBottom: 8, display: 'block' }}>选择行程：</Text>
              <Radio.Group
                value={selectedTripId || undefined}
                onChange={(e) => setSelectedTripId(e.target.value)}
                style={{ width: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {availableTrips.map((trip: any) => (
                    <Card key={trip.id} size="small">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 500 }}>{trip.tripNo || trip.id}</div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            计划时间：{formatDateTime(trip.startTimePlanned)} ~ {formatDateTime(trip.endTimePlanned)}
                          </Text>
                        </div>
                        <Radio value={trip.id}>选择</Radio>
                      </div>
                    </Card>
                  ))}
                  {availableTrips.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 12 }}>
                      <Text type="secondary">暂无可用行程</Text>
                    </div>
                  )}
                </Space>
              </Radio.Group>
            </div>
          </div>
        )}
      </Modal>

      {/* 费用明细弹窗 // 2025-10-02 02:55:10 */}
      <Modal
        title="费用明细"
        open={isCostModalVisible}
        onCancel={() => { setIsCostModalVisible(false); setCostViewingShipment(null); }}
        footer={null}
        width={520}
      >
        {costViewingShipment ? (
          <div>
            <div style={{ marginBottom: 12 }}>
              <Text strong>运单号：</Text>
              <Text code>{costViewingShipment.shipmentNumber}</Text>
            </div>
            <Divider />
            <Space direction="vertical" style={{ width: '100%' }}>
              <div><Text type="secondary">基础费用</Text><div>￥{Math.round(Number((costViewingShipment as any).breakdown?.baseFee || 100))}</div></div>
              <div><Text type="secondary">距离费用</Text><div>￥{Math.round(Number((costViewingShipment as any).breakdown?.distanceFee || 0))}</div></div>
              <div><Text type="secondary">重量费用</Text><div>￥{Math.round(Number((costViewingShipment as any).breakdown?.weightFee || 0))}</div></div>
              <div><Text type="secondary">体积费用</Text><div>￥{Math.round(Number((costViewingShipment as any).breakdown?.volumeFee || 0))}</div></div>
              <div><Text type="secondary">其他费用</Text><div>￥{Math.round(Number((costViewingShipment as any).breakdown?.additionalFees || 0))}</div></div>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ fontWeight: 600 }}>预估总额：￥{Math.round(Number(costViewingShipment.estimatedCost ?? (costViewingShipment as any).previewCost ?? 0))}</div>
            </Space>
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>以上为预估结果，实际以计费引擎结算为准。</Text>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default ShipmentManagement;