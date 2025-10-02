// 司机薪酬管理组件
// 创建时间: 2025-09-29 15:50:00
// 修改时间: 2025-10-02 19:40:00 - 改为专注于薪酬管理，移除司机列表

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
  CalendarOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

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

const DriverPayroll: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SalaryRecord | null>(null);
  const [drivers, setDrivers] = useState<Array<{id: string, name: string}>>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 模拟司机数据 - 仅用于薪酬记录选择
      const mockDrivers = [
        { id: 'D001', name: '张三' },
        { id: 'D002', name: '李四' },
        { id: 'D003', name: '王五' },
        { id: 'D004', name: '赵六' },
        { id: 'D005', name: '孙七' },
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
        {
          id: 'Salary004',
          driverId: 'D004',
          driverName: '赵六',
          month: '2024-08',
          tripsCompleted: 41,
          totalDistance: 3050,
          baseSalary: 4000,
          tripBonus: 2050,
          fuelAllowance: 1100,
          totalEarnings: 7150,
          status: 'paid',
          payDate: '2024-09-01',
        },
        {
          id: 'Salary005',
          driverId: 'D005',
          driverName: '孙七',
          month: '2024-08',
          tripsCompleted: 35,
          totalDistance: 2450,
          baseSalary: 4000,
          tripBonus: 1750,
          fuelAllowance: 900,
          totalEarnings: 6650,
          status: 'paid',
          payDate: '2024-09-01',
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
        const driverName = drivers.find(d => d.id === values.driverId);
        const newRecord: SalaryRecord = {
          id: `Salary${Date.now()}`,
          driverName: driverName?.name || '未知司机',
          ...values,
          totalEarnings: (values.baseSalary || 0) + (values.tripBonus || 0) + (values.fuelAllowance || 0),
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
    
    const config: { color: string; text: string } = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const salaryColumns = [
    {
      title: '司机姓名',
      dataIndex: 'driverName',
      key: 'driverName',
      render: (name: string) => (
        <Space>
          <UserOutlined />
          {name}
        </Space>
      ),
    },
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      sorter: (a: SalaryRecord, b: SalaryRecord) => {
        if (a.month < b.month) return -1;
        if (a.month > b.month) return 1;
        return 0;
      },
    },
    {
      title: '完成行程',
      dataIndex: 'tripsCompleted',
      key: 'tripsCompleted',
      render: (count: number) => (
        <Space>
          <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#1890ff' }}>
            {count}
          </span>
          <span>次</span>
        </Space>
      ),
      sorter: (a: SalaryRecord, b: SalaryRecord) => a.tripsCompleted - b.tripsCompleted,
    },
    {
      title: '总里程',
      dataIndex: 'totalDistance',
      key: 'totalDistance',
      render: (distance: number) => (
        <Space>
          <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#52c41a' }}>
            {distance.toLocaleString()}
          </span>
          <span>km</span>
        </Space>
      ),
      sorter: (a: SalaryRecord, b: SalaryRecord) => a.totalDistance - b.totalDistance,
    },
    {
      title: '基础工资',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      render: (amount: number) => (
        <Text strong style={{ fontSize: '14px', color: '#fa8c16' }}>
          ${amount.toLocaleString()}
        </Text>
      ),
    },
    {
      title: '行程奖金',
      dataIndex: 'tripBonus',
      key: 'tripBonus',
      render: (amount: number) => (
        <Text strong style={{ fontSize: '14px', color: '#722ed1' }}>
          ${amount.toLocaleString()}
        </Text>
      ),
    },
    {
      title: '燃油补贴',
      dataIndex: 'fuelAllowance',
      key: 'fuelAllowance',
      render: (amount: number) => (
        <Text strong style={{ fontSize: '14px', color: '#eb2f96' }}>
          ${amount.toLocaleString()}
        </Text>
      ),
    },
    {
      title: '总薪酬',
      dataIndex: 'totalEarnings',
      key: 'totalEarnings',
      render: (amount: number) => (
        <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
          ${amount.toLocaleString()}
        </Text>
      ),
      sorter: (a: SalaryRecord, b: SalaryRecord) => a.totalEarnings - b.totalEarnings,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
      filters: [
        { text: '待处理', value: 'pending' },
        { text: '已支付', value: 'paid' },
      ],
      onFilter: (value: string, record: SalaryRecord) => record.status === value,
    },
    {
      title: '支付日期',
      dataIndex: 'payDate',
      key: 'payDate',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : (
        <Text type="secondary" style={{ fontStyle: 'italic' }}>未支付</Text>
      ),
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
    const totalRecords = salaryRecords.length;
    const pendingRecords = salaryRecords.filter(r => r.status === 'pending').length;
    const paidRecords = salaryRecords.filter(r => r.status === 'paid').length;
    const totalPaidAmount = salaryRecords
      .filter(r => r.status === 'paid')
      .reduce((sum, r) => sum + r.totalEarnings, 0);
    const averageSalary = totalRecords > 0 
      ? salaryRecords.reduce((sum, r) => sum + r.totalEarnings, 0) / totalRecords 
      : 0;


    return {
      totalRecords,
      pendingRecords,
      paidRecords,
      totalPaidAmount,
      averageSalary,
    };
  };

  const statistics = getStatistics();

  return (
    <div>
      {/* 统计卡片 - 重新设计为薪酬相关统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title="总薪酬记录"
              value={statistics.totalRecords}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title="待支付记录"
              value={statistics.pendingRecords}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title="已支付记录"
              value={statistics.paidRecords}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 薪酬总额和平均薪酬 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12}>
          <Card>
            <Statistic
              title="总支付金额"
              value={statistics.totalPaidAmount}
              prefix="$"
              precision={0}
              valueStyle={{ color: '#1890ff', fontSize: '24px' }}
              suffix={
                <span style={{ fontSize: '14px', color: '#999' }}>
                  已支付薪酬总额
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={12} sm={12}>
          <Card>
            <Statistic
              title="平均薪酬"
              value={Math.round(statistics.averageSalary)}
              prefix="$"
              precision={0}
              valueStyle={{ color: '#52c41a', fontSize: '24px' }}
              suffix={
                <span style={{ fontSize: '14px', color: '#999' }}>
                  司机平均月薪
                </span>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* 薪酬记录表格 */}
      <Card
        title={
          <Space>
            <DollarOutlined />
            <span>司机薪酬记录</span>
          </Space>
        }
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddRecord}
            size="large"
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
          pagination={{ 
            pageSize: 10, 
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条记录`,
          }}
          scroll={{ x: 1400 }}
          summary={() => (
            <Table.Summary>
              <Table.Summary.Row style={{ background: '#fafafa' }}>
                <Table.Summary.Cell index={0} colSpan={7}>
                  <Text strong style={{ fontSize: '16px' }}>总计:</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7}>
                  <Text strong style={{ color: '#1890ff', fontSize: '18px' }}>
                    ${salaryRecords.reduce((sum, r) => sum + r.totalEarnings, 0).toLocaleString()}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8} colSpan={3} />
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>

      {/* 薪酬记录编辑模态框 */}
      <Modal
        title={editingRecord ? '编辑薪酬记录' : '添加工资记录'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="driverId"
                label="选择司机"
                rules={[{ required: true, message: '请选择司机' }]}
              >
                <Select placeholder="选择司机" showSearch optionFilterProp="children">
                  {drivers.map(driver => (
                    <Option key={driver.id} value={driver.id}>
                      {driver.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
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
            </Col>
          </Row>

          <Divider>计薪明细</Divider>

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
                  prefix="$"
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
                  prefix="$"
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
                  prefix="$"
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
                  suffix="次"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="totalDistance"
            label="总里程"
            rules={[{ required: true, message: '请输入总里程' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder="总里程"
              suffix="km"
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="支付状态"
            rules={[{ required: true, message: '请选择支付状态' }]}
            initialValue="pending"
          >
            <Select placeholder="选择支付状态">
              <Option value="pending">待处理</Option>
              <Option value="paid">已支付</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="payDate"
            label="支付日期"
            dependencies={['status']}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="选择支付日期"
              disabled={(form.getFieldValue('status') !== 'paid')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DriverPayroll;