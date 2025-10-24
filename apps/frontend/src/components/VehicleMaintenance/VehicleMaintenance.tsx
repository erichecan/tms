// 车辆维护记录组件
// 创建时间: 2025-09-29 15:35:00
// 作用: 管理车辆维护记录功能

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  Progress,
  Alert,
  Tabs,
  Timeline,
  Tooltip,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ToolOutlined,
  CarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { vehiclesApi } from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  maintenanceType: 'routine' | 'repair' | 'inspection' | 'emergency';
  description: string;
  cost: number;
  mileage: number;
  maintenanceDate: string;
  nextMaintenanceDate: string;
  status: 'completed' | 'scheduled' | 'overdue';
  provider: string;
  notes: string;
  attachments: string[];
}

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  year: number;
  mileage: number;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  status: 'active' | 'maintenance' | 'retired';
}

const VehicleMaintenance: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 模拟数据 - 实际项目中应该调用API
      const mockVehicles: Vehicle[] = [
        {
          id: 'V001',
          plate: '京A12345',
          model: '东风天龙',
          year: 2020,
          mileage: 125000,
          lastMaintenanceDate: '2025-09-15',
          nextMaintenanceDate: '2025-10-15',
          status: 'active',
        },
        {
          id: 'V002',
          plate: '京B67890',
          model: '解放J6',
          year: 2019,
          mileage: 98000,
          lastMaintenanceDate: '2025-09-10',
          nextMaintenanceDate: '2025-09-25',
          status: 'maintenance',
        },
      ];

      const mockRecords: MaintenanceRecord[] = [
        {
          id: 'M001',
          vehicleId: 'V001',
          vehiclePlate: '京A12345',
          maintenanceType: 'routine',
          description: '定期保养 - 更换机油、机滤',
          cost: 850,
          mileage: 125000,
          maintenanceDate: '2025-09-15',
          nextMaintenanceDate: '2025-10-15',
          status: 'completed',
          provider: '北京汽修厂',
          notes: '车辆运行正常',
          attachments: [],
        },
        {
          id: 'M002',
          vehicleId: 'V002',
          vehiclePlate: '京B67890',
          maintenanceType: 'repair',
          description: '发动机故障维修',
          cost: 2500,
          mileage: 98000,
          maintenanceDate: '2025-09-10',
          nextMaintenanceDate: '2025-10-10',
          status: 'completed',
          provider: '上海维修中心',
          notes: '更换发动机部件',
          attachments: [],
        },
        {
          id: 'M003',
          vehicleId: 'V001',
          vehiclePlate: '京A12345',
          maintenanceType: 'inspection',
          description: '年检',
          cost: 300,
          mileage: 124500,
          maintenanceDate: '2025-08-20',
          nextMaintenanceDate: '2026-08-20',
          status: 'completed',
          provider: '检测站',
          notes: '年检通过',
          attachments: [],
        },
        {
          id: 'M004',
          vehicleId: 'V002',
          vehiclePlate: '京B67890',
          maintenanceType: 'routine',
          description: '定期保养',
          cost: 0,
          mileage: 98000,
          maintenanceDate: '2025-09-25',
          nextMaintenanceDate: '2025-10-25',
          status: 'scheduled',
          provider: '北京汽修厂',
          notes: '已预约',
          attachments: [],
        },
      ];

      setVehicles(mockVehicles);
      setMaintenanceRecords(mockRecords);
    } catch (error) {
      console.error('加载数据失败:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: MaintenanceRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      maintenanceDate: dayjs(record.maintenanceDate),
      nextMaintenanceDate: dayjs(record.nextMaintenanceDate),
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // 实际项目中应该调用删除API
      setMaintenanceRecords(records => records.filter(record => record.id !== id));
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: unknown) => {
    try {
      const recordData = {
        ...values,
        id: editingRecord?.id || `M${Date.now()}`,
        maintenanceDate: values.maintenanceDate.format('YYYY-MM-DD'),
        nextMaintenanceDate: values.nextMaintenanceDate.format('YYYY-MM-DD'),
        vehiclePlate: vehicles.find(v => v.id === values.vehicleId)?.plate || '',
      };

      if (editingRecord) {
        setMaintenanceRecords(records =>
          records.map(record => record.id === editingRecord.id ? { ...record, ...recordData } : record)
        );
        message.success('更新成功');
      } else {
        setMaintenanceRecords(records => [...records, recordData]);
        message.success('添加成功');
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getMaintenanceTypeColor = (type: string) => {
    const colors = {
      routine: 'blue',
      repair: 'red',
      inspection: 'green',
      emergency: 'orange',
    };
    return colors[type as keyof typeof colors] || 'default';
  };

  const getMaintenanceTypeText = (type: string) => {
    const texts = {
      routine: '定期保养',
      repair: '维修',
      inspection: '检测',
      emergency: '紧急维修',
    };
    return texts[type as keyof typeof texts] || type;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'green',
      scheduled: 'blue',
      overdue: 'red',
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts = {
      completed: '已完成',
      scheduled: '已预约',
      overdue: '已逾期',
    };
    return texts[status as keyof typeof texts] || status;
  };

  const columns = [
    {
      title: '车辆',
      dataIndex: 'vehiclePlate',
      key: 'vehiclePlate',
      render: (plate: string, record: MaintenanceRecord) => (
        <Space>
          <CarOutlined />
          <div>
            <div>{plate}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.maintenanceType === 'routine' ? '定期保养' : 
               record.maintenanceType === 'repair' ? '维修' :
               record.maintenanceType === 'inspection' ? '检测' : '紧急维修'}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '维护类型',
      dataIndex: 'maintenanceType',
      key: 'maintenanceType',
      render: (type: string) => (
        <Tag color={getMaintenanceTypeColor(type)}>
          {getMaintenanceTypeText(type)}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '费用',
      dataIndex: 'cost',
      key: 'cost',
      render: (cost: number) => (
        <Text style={{ color: cost > 0 ? '#cf1322' : '#52c41a' }}>
          {cost > 0 ? `$${cost.toLocaleString()}` : '免费'}
        </Text>
      ),
      sorter: (a: MaintenanceRecord, b: MaintenanceRecord) => a.cost - b.cost,
    },
    {
      title: '里程',
      dataIndex: 'mileage',
      key: 'mileage',
      render: (mileage: number) => `${mileage.toLocaleString()} km`,
      sorter: (a: MaintenanceRecord, b: MaintenanceRecord) => a.mileage - b.mileage,
    },
    {
      title: '维护日期',
      dataIndex: 'maintenanceDate',
      key: 'maintenanceDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
      sorter: (a: MaintenanceRecord, b: MaintenanceRecord) => 
        dayjs(a.maintenanceDate).unix() - dayjs(b.maintenanceDate).unix(),
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
      title: '服务商',
      dataIndex: 'provider',
      key: 'provider',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: MaintenanceRecord) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />}>
            详情
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条维护记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const getVehicleMaintenanceStatus = (vehicle: Vehicle) => {
    const nextDate = dayjs(vehicle.nextMaintenanceDate);
    const today = dayjs();
    const daysDiff = nextDate.diff(today, 'day');
    
    if (daysDiff < 0) return { status: 'overdue', text: '已逾期', color: 'red' };
    if (daysDiff <= 7) return { status: 'warning', text: '即将到期', color: 'orange' };
    return { status: 'normal', text: '正常', color: 'green' };
  };

  const tabItems = [
    {
      key: 'records',
      label: '维护记录',
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>维护记录管理</Title>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加维护记录
            </Button>
          </div>
          
          <Table
            columns={columns}
            dataSource={maintenanceRecords}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
          />
        </div>
      ),
    },
    {
      key: 'vehicles',
      label: '车辆状态',
      children: (
        <div>
          <Row gutter={[16, 16]}>
            {vehicles.map(vehicle => {
              const status = getVehicleMaintenanceStatus(vehicle);
              return (
                <Col xs={24} sm={12} lg={8} key={vehicle.id}>
                  <Card
                    title={
                      <Space>
                        <CarOutlined />
                        {vehicle.plate}
                      </Space>
                    }
                    extra={
                      <Tag color={status.color}>
                        {status.text}
                      </Tag>
                    }
                    size="small"
                  >
                    <Row gutter={[8, 8]}>
                      <Col span={12}>
                        <Text type="secondary">车型</Text>
                        <div>{vehicle.model}</div>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary">年份</Text>
                        <div>{vehicle.year}</div>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary">里程</Text>
                        <div>{vehicle.mileage.toLocaleString()} km</div>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary">下次保养</Text>
                        <div>{dayjs(vehicle.nextMaintenanceDate).format('MM-DD')}</div>
                      </Col>
                    </Row>
                    
                    {status.status === 'overdue' && (
                      <Alert
                        message="车辆已逾期维护"
                        type="error"
                        size="small"
                        style={{ marginTop: 8 }}
                      />
                    )}
                    
                    {status.status === 'warning' && (
                      <Alert
                        message="车辆即将到期维护"
                        type="warning"
                        size="small"
                        style={{ marginTop: 8 }}
                      />
                    )}
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>
      ),
    },
  ];

  return (
    <div>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总车辆数"
              value={vehicles.length}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="本月维护次数"
              value={maintenanceRecords.filter(r => 
                dayjs(r.maintenanceDate).isSame(dayjs(), 'month')
              ).length}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="本月维护费用"
              value={maintenanceRecords
                .filter(r => dayjs(r.maintenanceDate).isSame(dayjs(), 'month'))
                .reduce((sum, r) => sum + r.cost, 0)}
              prefix="$"
              precision={0}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="逾期车辆"
              value={vehicles.filter(v => {
                const status = getVehicleMaintenanceStatus(v);
                return status.status === 'overdue';
              }).length}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      
      <Tabs defaultActiveKey="records" items={tabItems} />

      
      <Modal
        title={editingRecord ? '编辑维护记录' : '添加维护记录'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="vehicleId"
                label="车辆"
                rules={[{ required: true, message: '请选择车辆' }]}
              >
                <Select placeholder="请选择车辆">
                  {vehicles.map(vehicle => (
                    <Option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate} - {vehicle.model}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maintenanceType"
                label="维护类型"
                rules={[{ required: true, message: '请选择维护类型' }]}
              >
                <Select placeholder="请选择维护类型">
                  <Option value="routine">定期保养</Option>
                  <Option value="repair">维修</Option>
                  <Option value="inspection">检测</Option>
                  <Option value="emergency">紧急维修</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="维护描述"
            rules={[{ required: true, message: '请输入维护描述' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入维护描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="cost"
                label="费用"
                rules={[{ required: true, message: '请输入费用' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="费用"
                  min={0}
                  precision={2}
                  prefix="$"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="mileage"
                label="里程"
                rules={[{ required: true, message: '请输入里程' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="里程"
                  min={0}
                  suffix="km"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态">
                  <Option value="completed">已完成</Option>
                  <Option value="scheduled">已预约</Option>
                  <Option value="overdue">已逾期</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="maintenanceDate"
                label="维护日期"
                rules={[{ required: true, message: '请选择维护日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="nextMaintenanceDate"
                label="下次维护日期"
                rules={[{ required: true, message: '请选择下次维护日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="provider" label="服务商">
            <Input placeholder="请输入服务商名称" />
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VehicleMaintenance;
