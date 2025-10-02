// 司机绩效考核和薪酬计算组件 (简化版本)
// 创建时间: 2025-09-29 15:50:00 (简化于 2025-10-02 19:05:00)
// 作用: 基础司机管理和简单薪酬记录

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
  Divider,
} from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  CarOutlined,
  CalendarOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  licenseClass: string;
  status: 'available' | 'busy' | 'offline';
  joinDate: string;
}

interface SalaryRecord {
  id: string;
  driverId: string;
  driverName: string;
  month: string;
  tripsCompleted: number;
  totalDistance: number;
  baseSalary: number;
  tripBonus: number;
  fuelAllowance: number;
  totalEarnings: number;
  status: 'pending' | 'paid';
  payDate?: string;
}

const DriverPerformance: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SalaryRecord | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 模拟数据 - 实际项目中应该调用API
      const mockDrivers: Driver[] = [
        {
          id: 'D001',
          name: '张三',
          phone: '13800138000',
          licenseNumber: 'A123456789',
          licenseClass: 'A1',
          status: 'available',
          joinDate: '2024-01-15',
        },
        {
          id: 'D002',
          name: '李四',
          phone: '13900139000',
          licenseNumber: 'A987654321',
          licenseClass: 'A2',
          status: 'busy',
          joinDate: '2024-02-20',
        },
        {
          id: 'D003',
          name: '王五',
          phone: '13700137000',
          licenseNumber: 'B111111111',
          licenseClass: 'B1',
          status: 'available',
          joinDate: '2024-03-10',
        },
      ];

      const mockSalaryRecords: SalaryRecord[] = [
        {
          id: 'Salary001',
          driverId: 'D001',
          driverName: '张三',
          month: '2024-09',
          tripsCompleted: 45,
          totalDistance: 3200,
          baseSalary: 4000,
          tripBonus: 2250,
          fuelAllowance: 1200,
          totalEarnings: 7450,
          status: 'paid',
          payDate: '2024-10-01',
        },
        {
          id: 'Salary002',
          driverId: 'D002',
          driverName: '李四',
          month: '2024-09',
          tripsCompleted: 38,
          totalDistance: 2800,
          baseSalary: 4000,
          tripBonus: 1900,
          fuelAllowance: 1000,
          totalEarnings: 6900,
          status: 'paid',
          payDate: '2024-10-01',
        },
        {
          id: 'Salary003',
          driverId: 'D003',
          driverName: '王五',
          month: '2024-09',
          tripsCompleted: 52,
          totalDistance: 4100,
          baseSalary: 4000,
          tripBonus: 2600,
          fuelAllowance: 1500,
          totalEarnings: 8100,
          status: 'pending',
        },
      ];

      setDrivers(mockDrivers);
      setSalaryRecords(mockSalaryRecords);
    } catch (error) {
      console.error('Failed to load data:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditRecord = (record: SalaryRecord) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingRecord) {
        // 编辑记录
        const updatedRecord = { ...editingRecord, ...values };
        setSalaryRecords(prev => 
          prev.map(record => record.id === editingRecord.id ? updatedRecord : record)
        );
        message.success('薪酬记录更新成功');
      } else {
        // 新增记录
        const newRecord: SalaryRecord = {
          id: `Salary${Date.now()}`,
          ...values,
          status: 'pending',
        };
        setSalaryRecords(prev => [...prev, newRecord]);
        message.success('薪酬记录添加成功');
      }
      
      setIsModalVisible(false);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleDeleteRecord = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条薪酬记录吗？',
      onOk: () => {
        setSalaryRecords(prev => prev.filter(record => record.id !== id));
        message.success('删除成功');
      },
    });
  };

  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待处理' },
      paid: { color: 'green', text: '已支付' },
    };
    
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const driverColumns = [
    {
      title: '司机姓名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <UserOutlined />
          {name}
        </Space>
      ),
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '驾照号',
      dataIndex: 'licenseNumber',
      key: 'licenseNumber',
    },
    {
      title: '驾照等级',
      dataIndex: 'licenseClass',
      key: 'licenseClass',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig: Record<string, { color: string; text: string }> = {
          available: { color: 'green', text: '空闲' },
          busy: { color: 'blue', text: '在途' },
          offline: { color: 'gray', text: '离线' },
        };
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '入职日期',
      dataIndex: 'joinDate',
      key: 'joinDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  const salaryColumns = [
    {
      title: '司机姓名',
      dataIndex: 'driverName',
      key: 'driverName',
    },
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
    },
    {
      title: '完成行程',
      dataIndex: 'tripsCompleted',
      key: 'tripsCompleted',
      render: (count: number) => `${count} 次`,
    },
    {
      title: '总里程',
      dataIndex: 'totalDistance',
      key: 'totalDistance',
      render: (distance: number) => `${distance} km`,
    },
    {
      title: '基础工资',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      render: (amount: number) => `¥${amount.toLocaleString()}`,
    },
    {
      title: '行程奖金',
      dataIndex: 'tripBonus',
      key: 'tripBonus',
      render: (amount: number) => `¥${amount.toLocaleString()}`,
    },
    {
      title: '燃油补贴',
      dataIndex: 'fuelAllowance',
      key: 'fuelAllowance',
      render: (amount: number) => `¥${amount.toLocaleString()}`,
    },
    {
      title: '总薪酬',
      dataIndex: 'totalEarnings',
      key: 'totalEarnings',
      render: (amount: number) => (
        <Text strong style={{ color: '#1890ff' }}>
          ¥{amount.toLocaleString()}
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '支付日期',
      dataIndex: 'payDate',
      key: 'payDate',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: SalaryRecord) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditRecord(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteRecord(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 统计信息
  const getStatistics = () => {
    const totalDrivers = drivers.length;
    const availableDrivers = drivers.filter(d => d.status === 'available').length;
    const paidRecords = salaryRecords.filter(r => r.status === 'paid').length;
    const pendingRecords = salaryRecords.filter(r => r.status === 'pending').length;
    const totalPaidAmount = salaryRecords
      .filter(r => r.status === 'paid')
      .reduce((sum, r) => sum + r.totalEarnings, 0);

    return {
      totalDrivers,
      availableDrivers,
      paidRecords,
      pendingRecords,
      totalPaidAmount,
    };
  };

  const statistics = getStatistics();

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title="总司机数"
              value={statistics.totalDrivers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title="空闲司机"
              value={statistics.availableDrivers}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title="已付薪酬记录"
              value={statistics.paidRecords}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 司机列表 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <UserOutlined />
                司机列表
              </Space>
            }
          >
            <Table
              columns={driverColumns}
              dataSource={drivers}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* 薪酬记录 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <DollarOutlined />
                薪酬记录
              </Space>
            }
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleAddRecord}
              >
                添加工资记录
              </Button>
            }
          >
            <Table
              columns={salaryColumns}
              dataSource={salaryRecords}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* 薪酬记录编辑模态框 */}
      <Modal
        title={editingRecord ? '编辑薪酬记录' : '添加工资记录'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="driverId"
            label="选择司机"
            rules={[{ required: true, message: '请选择司机' }]}
          >
            <Select placeholder="选择司机">
              {drivers.map(driver => (
                <Option key={driver.id} value={driver.id}>
                  {driver.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="month"
            label="工资月份"
            rules={[{ required: true, message: '请选择月份' }]}
          >
            <DatePicker.picker
              picker="month"
              placeholder="选择月份"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="baseSalary"
                label="基础工资"
                rules={[{ required: true, message: '请输入基础工资' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="基础工资"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="tripBonus"
                label="行程奖金"
                rules={[{ required: true, message: '请输入行程奖金' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="行程奖金"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fuelAllowance"
                label="燃油补贴"
                rules={[{ required: true, message: '请输入燃油补贴' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="燃油补贴"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="tripsCompleted"
                label="完成行程数"
                rules={[{ required: true, message: '请输入行程数' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="行程数"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default DriverPerformance;