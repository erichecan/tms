import React, { useState, useEffect } from 'react';
import { Button, Space, Typography, message, Tag, Tooltip, Card, Table, Modal, Divider, Badge, Radio, Form, Input, InputNumber, Select, Row, Col } from 'antd'; // 2025-10-02 02:55:10 增加 Badge 用于费用标签 // 2025-10-02 15:12:30 引入 Radio 用于选择行程 // 2025-10-10 17:45:00 添加Form组件用于编辑
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
import { smartDispatch } from '../../algorithms/dispatch'; // 2025-10-10 18:29:00 引入智能调度算法


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
  
  // 编辑相关状态 - 2025-10-10 17:45:00
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm] = Form.useForm();
  
  // 智能调度相关状态 - 2025-10-10 17:50:00
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDispatchModalVisible, setIsDispatchModalVisible] = useState(false);
  const [dispatchResults, setDispatchResults] = useState<any[]>([]);
  const [dispatchLoading, setDispatchLoading] = useState(false);

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

  // 转换后端数据格式到前端期望格式 - 2025-10-08 18:40:00
  const transformShipmentData = (backendShipment: any): Shipment => {
    const anyS = backendShipment || {};
    
    return {
      id: anyS.id,
      shipmentNo: anyS.shipmentNumber || anyS.shipment_no || anyS.id, // 兼容不同字段名
      customerId: anyS.customerId || anyS.customer_id,
      status: anyS.status,
      
      // 地址信息转换
      shipperAddress: anyS.shipperAddress || anyS.pickupAddress || {
        country: anyS.pickup_address?.country || '',
        province: anyS.pickup_address?.province || anyS.pickup_address?.state || '',
        city: anyS.pickup_address?.city || '',
        postalCode: anyS.pickup_address?.postalCode || anyS.pickup_address?.postal_code || '',
        addressLine1: anyS.pickup_address?.addressLine1 || anyS.pickup_address?.street || '',
        isResidential: anyS.pickup_address?.isResidential || false
      },
      receiverAddress: anyS.receiverAddress || anyS.deliveryAddress || {
        country: anyS.delivery_address?.country || '',
        province: anyS.delivery_address?.province || anyS.delivery_address?.state || '',
        city: anyS.delivery_address?.city || '',
        postalCode: anyS.delivery_address?.postalCode || anyS.delivery_address?.postal_code || '',
        addressLine1: anyS.delivery_address?.addressLine1 || anyS.delivery_address?.street || '',
        isResidential: anyS.delivery_address?.isResidential || false
      },
      
      // 货物信息转换
      weightKg: anyS.weightKg || anyS.weight_kg || anyS.cargoInfo?.weight || anyS.cargo_info?.weight || 0,
      lengthCm: anyS.lengthCm || anyS.length_cm || anyS.cargoInfo?.dimensions?.length || anyS.cargo_info?.dimensions?.length || 0,
      widthCm: anyS.widthCm || anyS.width_cm || anyS.cargoInfo?.dimensions?.width || anyS.cargo_info?.dimensions?.width || 0,
      heightCm: anyS.heightCm || anyS.height_cm || anyS.cargoInfo?.dimensions?.height || anyS.cargo_info?.dimensions?.height || 0,
      description: anyS.description || anyS.cargoInfo?.description || anyS.cargo_info?.description || '',
      
      // 费用信息
      estimatedCost: anyS.estimatedCost || anyS.estimated_cost || anyS.previewCost || 0,
      finalCost: anyS.finalCost || anyS.actual_cost || anyS.actualCost || 0,
      
      // 其他字段
      tags: anyS.tags || [],
      services: anyS.services || {},
      pricingComponents: anyS.pricingComponents || anyS.pricing_components || [],
      pricingRuleTrace: anyS.pricingRuleTrace || anyS.pricing_rule_trace || [],
      costCurrency: anyS.costCurrency || anyS.cost_currency || 'CAD',
      assignedDriverId: anyS.assignedDriverId || anyS.driver_id || anyS.assigned_driver_id,
      assignedVehicleId: anyS.assignedVehicleId || anyS.assigned_vehicle_id,
      tenantId: anyS.tenantId || anyS.tenant_id,
      createdAt: anyS.createdAt || anyS.created_at,
      updatedAt: anyS.updatedAt || anyS.updated_at,
      
      // 兼容字段
      shipmentNumber: anyS.shipmentNumber || anyS.shipment_no || anyS.id,
      pickupAddress: anyS.pickupAddress || anyS.pickup_address,
      deliveryAddress: anyS.deliveryAddress || anyS.delivery_address,
      cargoInfo: anyS.cargoInfo || anyS.cargo_info,
      driverId: anyS.driverId || anyS.driver_id,
      actualCost: anyS.actualCost || anyS.actual_cost,
      additionalFees: anyS.additionalFees || anyS.additional_fees || [],
      appliedRules: anyS.appliedRules || anyS.applied_rules || [],
      timeline: anyS.timeline || {}
    };
  };

  const handleView = (shipment: Shipment) => {
    // 转换数据格式后再显示 - 2025-10-08 18:40:00
    const transformedShipment = transformShipmentData(shipment);
    setViewingShipment(transformedShipment);
    setIsViewModalVisible(true);
    setIsEditMode(false); // 重置编辑模式
  };

  // 处理编辑运单 - 2025-10-10 18:26:00 完善编辑字段
  const handleEdit = () => {
    if (viewingShipment) {
      // 将运单数据填充到编辑表单
      editForm.setFieldsValue({
        // 发货人信息
        shipperName: viewingShipment.pickupAddress?.name || viewingShipment.shipperName,
        shipperPhone: viewingShipment.pickupAddress?.phone || viewingShipment.shipperPhone,
        shipperCompany: viewingShipment.pickupAddress?.company || viewingShipment.shipperCompany,
        // 收货人信息
        receiverName: viewingShipment.deliveryAddress?.name || viewingShipment.receiverName,
        receiverPhone: viewingShipment.deliveryAddress?.phone || viewingShipment.receiverPhone,
        receiverCompany: viewingShipment.deliveryAddress?.company || viewingShipment.receiverCompany,
        // 货物信息
        cargoWeight: viewingShipment.cargoWeight,
        cargoLength: viewingShipment.cargoLength,
        cargoWidth: viewingShipment.cargoWidth,
        cargoHeight: viewingShipment.cargoHeight,
        cargoDescription: viewingShipment.cargoDescription,
        // 配送信息
        deliveryInstructions: viewingShipment.deliveryInstructions,
        estimatedCost: viewingShipment.estimatedCost
      });
      setIsEditMode(true);
    }
  };

  // 保存编辑 - 2025-10-10 17:45:00
  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields();
      await shipmentsApi.updateShipment(viewingShipment!.id, values);
      message.success('运单更新成功');
      setIsEditMode(false);
      loadShipments();
      
      // 更新查看的运单数据
      const updatedShipment = { ...viewingShipment, ...values };
      setViewingShipment(updatedShipment as Shipment);
    } catch (error) {
      console.error('更新运单失败:', error);
      message.error('更新运单失败');
    }
  };

  // 取消编辑 - 2025-10-10 17:45:00
  const handleCancelEdit = () => {
    setIsEditMode(false);
    editForm.resetFields();
  };

  // 智能调度 - 2025-10-10 18:30:00 使用真实算法（贪心+遗传）
  const handleSmartDispatch = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请至少选择一个待分配的运单');
      return;
    }

    setDispatchLoading(true);
    setIsDispatchModalVisible(true);

    try {
      // 使用真实的智能调度算法 - 2025-10-10 18:30:00
      const selectedShipments = shipments.filter(s => selectedRowKeys.includes(s.id));
      
      // 调用智能调度算法（贪心 + 遗传混合策略）
      const dispatchResult = smartDispatch({
        shipments: selectedShipments,
        drivers: drivers,
        constraints: {
          maxDistance: 100, // 最大调度距离100km
          maxDriverWorkload: 5 // 每个司机最多5个运单
        }
      });
      
      setDispatchResults(dispatchResult.assignments);
      
      // 显示调度结果
      message.success(
        `🤖 智能调度完成！使用${dispatchResult.algorithm === 'greedy' ? '贪心算法' : '遗传算法'}为 ${dispatchResult.assignments.length} 个运单找到最优方案 ` +
        `(耗时: ${dispatchResult.executionTime}ms, 节省: $${dispatchResult.totalSaving.toFixed(2)})`
      , 8);
      
      console.log('📊 智能调度结果:', {
        algorithm: dispatchResult.algorithm,
        shipmentCount: dispatchResult.assignments.length,
        totalCost: dispatchResult.totalCost,
        totalSaving: dispatchResult.totalSaving,
        executionTime: dispatchResult.executionTime
      });
    } catch (error) {
      console.error('智能调度失败:', error);
      message.error('智能调度失败，请稍后重试');
      setIsDispatchModalVisible(false);
    } finally {
      setDispatchLoading(false);
    }
  };

  // 应用调度结果 - 2025-10-10 18:27:00 修复API调用格式
  const handleApplyDispatch = async () => {
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];
    
    try {
      // 批量分配运单到司机
      for (const result of dispatchResults) {
        try {
          // 修复API调用格式 - 2025-10-10 18:27:00
          // assignDriver(shipmentId, driverId, notes)
          await shipmentsApi.assignDriver(
            result.shipmentId, 
            result.driverId, 
            '智能调度自动分配'
          );
          successCount++;
        } catch (err: any) {
          failCount++;
          errors.push(`运单${result.shipmentNumber}: ${err.message || '分配失败'}`);
          console.error(`分配运单${result.shipmentNumber}失败:`, err);
        }
      }
      
      // 显示结果统计
      if (successCount > 0) {
        message.success(`调度方案已应用！成功: ${successCount}个, 失败: ${failCount}个`);
      } else {
        message.error(`调度方案应用失败！所有${failCount}个运单都未能分配`);
      }
      
      // 如果有错误，显示详情
      if (errors.length > 0 && errors.length <= 3) {
        errors.forEach(err => message.warning(err, 5));
      }
      
      setIsDispatchModalVisible(false);
      setSelectedRowKeys([]);
      loadShipments();
    } catch (error) {
      console.error('应用调度方案失败:', error);
      message.error('应用调度方案失败');
    }
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

  // 稍后挂载处理函数 - 2025-10-08 17:15:00
  const handleAssignLater = async () => {
    if (!assigningShipment) {
      return message.warning('请选择运单');
    }
    
    try {
      // 更新运单状态为待指派，稍后处理 // 2025-10-08 17:15:00
      await shipmentsApi.updateShipmentStatus(assigningShipment.id, 'pending');
      message.success('运单已标记为待指派，稍后可以重新分配行程');
      setIsAssignModalVisible(false);
      setAssigningShipment(null);
      setSelectedTripId(null);
      loadShipments();
    } catch (error) {
      console.error('更新运单状态失败:', error);
      message.error('操作失败，请重试');
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
    <div>
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
          <Tooltip title="编辑运单">
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

  // 智能调度表格选择配置 - 2025-10-10 17:50:00
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys);
    },
    getCheckboxProps: (record: Shipment) => ({
      disabled: record.status !== 'created' && record.status !== 'pending', // 只允许选择待分配的运单
    }),
  };

  return (
    <div style={{ margin: '0 0 0 24px' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3}>运单管理</Title>
        <Space>
          {selectedRowKeys.length > 0 && (
            <Button 
              type="dashed" 
              icon={<ClockCircleOutlined />} 
              onClick={handleSmartDispatch}
            >
              🤖 智能调度 ({selectedRowKeys.length}个运单)
            </Button>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admin/shipments/create')}>{/* 跳转创建页 // 2025-10-02 02:55:10 */}
            创建运单
          </Button>
        </Space>
      </div>
      
      <Card>
        <Table
          columns={columns}
          dataSource={shipments}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          scroll={{ x: 1100 }} // 2025-10-02 16:27:20 开启水平滚动，确保列宽生效
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 运单详情弹窗 - 2025-10-10 18:25:00 修复编辑按钮重叠问题 */}
      <Modal
        title={isEditMode ? '编辑运单' : '运单详情'}
        open={isViewModalVisible}
        onCancel={() => {
          setIsViewModalVisible(false);
          setViewingShipment(null);
          setIsEditMode(false);
        }}
        footer={
          isEditMode ? (
            <Space>
              <Button onClick={handleCancelEdit}>取消</Button>
              <Button type="primary" onClick={handleSaveEdit}>保存修改</Button>
            </Space>
          ) : (
            <Space>
              <Button onClick={() => setIsViewModalVisible(false)}>关闭</Button>
              {viewingShipment && (
                <Button 
                  type="primary" 
                  icon={<EditOutlined />} 
                  onClick={handleEdit}
                >
                  编辑运单
                </Button>
              )}
            </Space>
          )
        }
        width={1000}
      >
        {viewingShipment && !isEditMode && (
          <ShipmentDetails 
            shipment={viewingShipment}
            onPrint={() => {
              window.print();
            }}
          />
        )}
        
        {viewingShipment && isEditMode && (
          <Form form={editForm} layout="vertical">
            <Divider>发货人信息</Divider>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="shipperName"
                  label="发货人姓名"
                  rules={[{ required: true, message: '请输入发货人姓名' }]}
                >
                  <Input placeholder="请输入发货人姓名" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="shipperPhone"
                  label="联系电话"
                  rules={[{ required: true, message: '请输入联系电话' }]}
                >
                  <Input placeholder="请输入联系电话" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="shipperCompany"
                  label="公司名称"
                >
                  <Input placeholder="请输入公司名称（可选）" />
                </Form.Item>
              </Col>
            </Row>
            
            <Divider>收货人信息</Divider>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="receiverName"
                  label="收货人姓名"
                  rules={[{ required: true, message: '请输入收货人姓名' }]}
                >
                  <Input placeholder="请输入收货人姓名" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="receiverPhone"
                  label="联系电话"
                  rules={[{ required: true, message: '请输入联系电话' }]}
                >
                  <Input placeholder="请输入联系电话" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="receiverCompany"
                  label="公司名称"
                >
                  <Input placeholder="请输入公司名称（可选）" />
                </Form.Item>
              </Col>
            </Row>
            
            <Divider>货物信息</Divider>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="cargoWeight"
                  label="货物重量 (kg)"
                  rules={[{ required: true, message: '请输入货物重量' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入重量" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="cargoLength"
                  label="长度 (cm)"
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="长度" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="cargoWidth"
                  label="宽度 (cm)"
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="宽度" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="cargoHeight"
                  label="高度 (cm)"
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="高度" />
                </Form.Item>
              </Col>
              <Col span={16}>
                <Form.Item
                  name="cargoDescription"
                  label="货物描述"
                >
                  <Input.TextArea rows={2} placeholder="请输入货物描述" />
                </Form.Item>
              </Col>
            </Row>
            
            <Divider>配送信息</Divider>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="deliveryInstructions"
                  label="配送说明"
                >
                  <Input.TextArea rows={3} placeholder="请输入配送说明" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="estimatedCost"
                  label="预估费用 ($)"
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="预估费用" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}
      </Modal>

      {/* 指派车辆/行程弹窗 // 2025-10-02 15:12:30 */}
      <Modal
        title="指派车辆/行程"
        open={isAssignModalVisible}
        onCancel={() => {
          setIsAssignModalVisible(false);
          setAssigningShipment(null);
          setSelectedTripId(null);
        }}
        onOk={handleConfirmMountToTrip}
        okText="挂载到行程"
        width={640}
        footer={[
          <Button key="cancel" onClick={() => {
            setIsAssignModalVisible(false);
            setAssigningShipment(null);
            setSelectedTripId(null);
          }}>
            取消
          </Button>,
          <Button 
            key="later" 
            type="default" 
            onClick={handleAssignLater}
            style={{ marginRight: 8 }}
          >
            稍后挂载
          </Button>,
          <Button 
            key="assign" 
            type="primary" 
            onClick={handleConfirmMountToTrip}
            disabled={!selectedTripId}
          >
            挂载到行程
          </Button>
        ]}
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
                    <div style={{ textAlign: 'center', padding: 20 }}>
                      <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>
                        暂无可用行程
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        您可以点击"稍后挂载"将运单标记为待指派状态，稍后创建行程时再分配
                      </Text>
                    </div>
                  )}
                </Space>
              </Radio.Group>
            </div>
          </div>
        )}
      </Modal>

      {/* 智能调度结果弹窗 - 2025-10-10 17:50:00 */}
      <Modal
        title="🤖 智能调度推荐方案"
        open={isDispatchModalVisible}
        onCancel={() => {
          setIsDispatchModalVisible(false);
          setDispatchResults([]);
        }}
        footer={[
          <Button key="cancel" onClick={() => setIsDispatchModalVisible(false)}>
            取消
          </Button>,
          <Button 
            key="apply" 
            type="primary" 
            onClick={handleApplyDispatch}
            loading={dispatchLoading}
          >
            应用全部分配
          </Button>
        ]}
        width={800}
      >
        {dispatchLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '24px', marginBottom: '16px' }}>🔄</div>
            <Text>正在计算最优调度方案...</Text>
          </div>
        ) : (
          <div>
            {dispatchResults.length > 0 && (
              <>
                <Card size="small" style={{ marginBottom: 16, background: '#f0f5ff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                    <div style={{ textAlign: 'center' }}>
                      <Text type="secondary">运单数</Text>
                      <div><Text strong style={{ fontSize: 24 }}>{dispatchResults.length}</Text></div>
                    </div>
                    <Divider type="vertical" style={{ height: 40 }} />
                    <div style={{ textAlign: 'center' }}>
                      <Text type="secondary">预计总成本</Text>
                      <div><Text strong style={{ fontSize: 24, color: '#1890ff' }}>
                        ${dispatchResults.reduce((sum, r) => sum + r.estimatedCost, 0).toFixed(2)}
                      </Text></div>
                    </div>
                    <Divider type="vertical" style={{ height: 40 }} />
                    <div style={{ textAlign: 'center' }}>
                      <Text type="secondary">预计节省</Text>
                      <div><Text strong style={{ fontSize: 24, color: '#52c41a' }}>
                        ${dispatchResults.reduce((sum, r) => sum + r.saving, 0).toFixed(2)}
                      </Text></div>
                    </div>
                  </div>
                </Card>

                <Divider>分配方案详情</Divider>

                {dispatchResults.map((result, index) => (
                  <Card key={result.shipmentId} size="small" style={{ marginBottom: 12 }}>
                    <Row gutter={16} align="middle">
                      <Col span={12}>
                        <div>
                          <Tag color="blue">{result.shipmentNumber}</Tag>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {result.route}
                          </Text>
                        </div>
                      </Col>
                      <Col span={4}>
                        <div style={{ textAlign: 'center' }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>距离</Text>
                          <div><Text strong>{result.distance.toFixed(1)} km</Text></div>
                        </div>
                      </Col>
                      <Col span={4}>
                        <div style={{ textAlign: 'center' }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>成本</Text>
                          <div><Text strong>${result.estimatedCost.toFixed(2)}</Text></div>
                        </div>
                      </Col>
                      <Col span={4}>
                        <div style={{ textAlign: 'center' }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>节省</Text>
                          <div><Text strong style={{ color: '#52c41a' }}>${result.saving.toFixed(2)}</Text></div>
                        </div>
                      </Col>
                    </Row>
                    <Divider style={{ margin: '8px 0' }} />
                    <div>
                      <UserAddOutlined /> <Text strong>推荐司机：</Text>
                      <Tag color="green" style={{ marginLeft: 8 }}>{result.driverName}</Tag>
                    </div>
                  </Card>
                ))}
              </>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
};

export default ShipmentManagement;