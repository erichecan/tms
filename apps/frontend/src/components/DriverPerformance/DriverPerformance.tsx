// 司机薪酬管理组件
// 创建时间: 2025-09-29 15:50:00
// 2025-11-30T11:00:00Z Updated by Assistant: 重构为自动生成逻辑，支持双周/按月切换，添加详情查看

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
  Radio,
  Descriptions,
  List,
  Badge,
  Alert,
} from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  CalendarOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { financeApi, driversApi } from '../../services/api';
import { useDataContext } from '../../contexts/DataContext';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface PayrollSummary {
  period: string;
  driverId: string;
  driverName: string;
  tripsCompleted: number;
  shipmentsCompleted: number;
  totalDistance: number;
  totalEarnings: number;
  baseSalary: number;
  tripBonus: number;
  fuelAllowance: number;
  status: 'pending' | 'paid';
  payDate?: string;
  statementId?: string;
  trips: Array<{
    tripId: string;
    tripNo: string;
    shipments: Array<{
      shipmentId: string;
      shipmentNumber: string;
      amount: number;
      completedAt: string;
    }>;
  }>;
}

const DriverPayroll: React.FC = () => {
  const { reloadDrivers } = useDataContext();
  const [loading, setLoading] = useState(false);
  const [payrollData, setPayrollData] = useState<PayrollSummary[]>([]);
  const [periodType, setPeriodType] = useState<'biweekly' | 'monthly'>('monthly');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | undefined>(undefined);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PayrollSummary | null>(null);
  const [editingRecord, setEditingRecord] = useState<PayrollSummary | null>(null);
  const [drivers, setDrivers] = useState<Array<{id: string, name: string}>>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    loadDrivers();
    loadPayrollData();
  }, [periodType, dateRange, selectedDriverId]);

  const loadDrivers = async () => {
    try {
      const response = await driversApi.getDrivers();
      const driversList = response.data?.data || [];
      setDrivers(driversList.map((d: any) => ({ id: d.id, name: d.name })));
    } catch (error) {
      console.error('Failed to load drivers:', error);
    }
  };

  const loadPayrollData = async () => {
    setLoading(true);
    try {
      const params: any = {
        periodType,
      };
      
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      
      if (selectedDriverId) {
        params.driverId = selectedDriverId;
      }

      const response = await financeApi.getDriverPayrollSummary(params);
      // 2025-11-30T11:15:00Z Fixed by Assistant: 确保 payrollData 始终是数组，处理各种响应格式
      let data: PayrollSummary[] = [];
      
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          data = response.data;
        } else if (typeof response.data === 'object') {
          // 如果返回的是对象，尝试提取数组
          const arrayData = (response.data as any).data || (response.data as any).records || [];
          data = Array.isArray(arrayData) ? arrayData : [];
        }
      }
      
      setPayrollData(data);
    } catch (error: any) {
      console.error('Failed to load payroll data:', error);
      const errorMessage = error?.response?.data?.error?.message || error?.message || '加载薪酬数据失败';
      message.error(errorMessage);
      setPayrollData([]); // 确保设置为空数组
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = () => {
    // 2025-11-30T11:00:00Z 添加工资记录作为临时补救入口
    setEditingRecord(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleViewDetails = (record: PayrollSummary) => {
    setSelectedRecord(record);
    setIsDetailModalVisible(true);
  };

  const handleEditRecord = (record: PayrollSummary) => {
    setEditingRecord(record);
    form.setFieldsValue({
      driverId: record.driverId,
      period: record.period,
      baseSalary: record.baseSalary,
      tripBonus: record.tripBonus,
      fuelAllowance: record.fuelAllowance,
      status: record.status,
      payDate: record.payDate ? dayjs(record.payDate) : undefined,
    });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      // 2025-11-30T11:00:00Z 临时补救：手动添加工资记录
      message.warning('手动添加工资记录功能正在开发中，建议使用自动生成的薪酬数据');
      
      // TODO: 实现手动添加工资记录的API调用
      // await financeApi.createPayrollRecord(values);
      
      setIsModalVisible(false);
      form.resetFields();
      await loadPayrollData();
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待处理' },
      paid: { color: 'green', text: '已支付' },
    };
    
    const config: { color: string; text: string } = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const payrollColumns = [
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
      title: '周期',
      dataIndex: 'period',
      key: 'period',
      sorter: (a: PayrollSummary, b: PayrollSummary) => {
        if (a.period < b.period) return -1;
        if (a.period > b.period) return 1;
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
      sorter: (a: PayrollSummary, b: PayrollSummary) => a.tripsCompleted - b.tripsCompleted,
    },
    {
      title: '完成运单',
      dataIndex: 'shipmentsCompleted',
      key: 'shipmentsCompleted',
      render: (count: number) => (
        <Space>
          <Badge count={count} showZero style={{ backgroundColor: '#52c41a' }} />
        </Space>
      ),
      sorter: (a: PayrollSummary, b: PayrollSummary) => a.shipmentsCompleted - b.shipmentsCompleted,
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
      sorter: (a: PayrollSummary, b: PayrollSummary) => a.totalDistance - b.totalDistance,
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
      sorter: (a: PayrollSummary, b: PayrollSummary) => a.totalEarnings - b.totalEarnings,
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
      onFilter: (value: string, record: PayrollSummary) => record.status === value,
    },
    {
      title: '支付日期',
      dataIndex: 'payDate',
      key: 'payDate',
      render: (date: string | undefined) => date ? dayjs(date).format('YYYY-MM-DD') : (
        <Text type="secondary" style={{ fontStyle: 'italic' }}>未支付</Text>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: PayrollSummary) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            查看详情
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditRecord(record)}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  // 统计信息
  const getStatistics = () => {
    // 2025-11-30T11:10:00Z Fixed by Assistant: 确保 payrollData 是数组
    const data = Array.isArray(payrollData) ? payrollData : [];
    
    const totalRecords = data.length;
    const pendingRecords = data.filter(r => r.status === 'pending').length;
    const paidRecords = data.filter(r => r.status === 'paid').length;
    const totalPaidAmount = data
      .filter(r => r.status === 'paid')
      .reduce((sum, r) => sum + (r.totalEarnings || 0), 0);
    const totalPendingAmount = data
      .filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + (r.totalEarnings || 0), 0);
    const averageSalary = totalRecords > 0 
      ? data.reduce((sum, r) => sum + (r.totalEarnings || 0), 0) / totalRecords 
      : 0;

    return {
      totalRecords,
      pendingRecords,
      paidRecords,
      totalPaidAmount,
      totalPendingAmount,
      averageSalary,
    };
  };

  const statistics = getStatistics();

  return (
    <div>
      {/* 筛选和汇总类型切换 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={6}>
            <Text strong>汇总类型：</Text>
            <Radio.Group 
              value={periodType} 
              onChange={(e) => setPeriodType(e.target.value)}
              style={{ marginLeft: 8 }}
            >
              <Radio.Button value="monthly">按月</Radio.Button>
              <Radio.Button value="biweekly">双周</Radio.Button>
            </Radio.Group>
          </Col>
          <Col span={8}>
            <Text strong>日期范围：</Text>
            <RangePicker
              style={{ marginLeft: 8, width: '100%' }}
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
              allowClear
            />
          </Col>
          <Col span={6}>
            <Text strong>司机筛选：</Text>
            <Select
              style={{ marginLeft: 8, width: '100%' }}
              placeholder="全部司机"
              allowClear
              value={selectedDriverId}
              onChange={setSelectedDriverId}
            >
              {drivers.map(driver => (
                <Option key={driver.id} value={driver.id}>
                  {driver.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={loadPayrollData}
              loading={loading}
            >
              刷新
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 统计卡片 */}
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
              title="待支付金额"
              value={statistics.totalPendingAmount}
              prefix="$"
              precision={0}
              valueStyle={{ color: '#faad14', fontSize: '24px' }}
              suffix={
                <span style={{ fontSize: '14px', color: '#999' }}>
                  待支付薪酬总额
                </span>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* 说明提示 */}
      <Alert
        message="薪酬数据说明"
        description={
          <div>
            <p>• 薪酬记录会在运单完成并指派司机后自动生成</p>
            <p>• 系统根据规则引擎自动计算司机薪酬（基础工资、行程奖金、燃油补贴）</p>
            <p>• 点击"查看详情"可以查看该周期内包含的所有行程和运单信息</p>
            <p>• "添加工资记录"功能用于临时补救，建议优先使用自动生成的数据</p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

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
            添加工资记录（临时补救）
          </Button>
        }
      >
        {(!Array.isArray(payrollData) || payrollData.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            <DollarOutlined style={{ fontSize: 48, marginBottom: 16, color: '#d9d9d9' }} />
            <div>当前没有薪酬记录</div>
            <div style={{ fontSize: 12, marginTop: 8 }}>
              完成运单并指派司机后，系统会自动生成薪酬记录
            </div>
          </div>
        ) : (
          <Table
            columns={payrollColumns}
            dataSource={payrollData}
            rowKey={(record) => `${record.period}_${record.driverId}`}
            loading={loading}
            pagination={{ 
              pageSize: 10, 
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `第 ${range[0]}-${range[1]} 条/共 ${total} 条记录`,
            }}
            scroll={{ x: 1400 }}
            onRow={(record) => ({
              onClick: () => handleViewDetails(record),
              style: { cursor: 'pointer' }
            })}
            summary={() => {
              const data = Array.isArray(payrollData) ? payrollData : [];
              return (
                <Table.Summary>
                  <Table.Summary.Row style={{ background: '#fafafa' }}>
                    <Table.Summary.Cell index={0} colSpan={8}>
                      <Text strong style={{ fontSize: '16px' }}>总计:</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={8}>
                      <Text strong style={{ color: '#1890ff', fontSize: '18px' }}>
                        ${data.reduce((sum, r) => sum + (r.totalEarnings || 0), 0).toLocaleString()}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={9} colSpan={3} />
                  </Table.Summary.Row>
                </Table.Summary>
              );
            }}
          />
        )}
      </Card>

      {/* 详情查看模态框 */}
      <Modal
        title={`薪酬详情 - ${selectedRecord?.driverName} (${selectedRecord?.period})`}
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={900}
      >
        {selectedRecord && (
          <div>
            <Descriptions title="薪酬汇总" bordered column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="司机姓名">{selectedRecord.driverName}</Descriptions.Item>
              <Descriptions.Item label="周期">{selectedRecord.period}</Descriptions.Item>
              <Descriptions.Item label="完成行程">{selectedRecord.tripsCompleted} 次</Descriptions.Item>
              <Descriptions.Item label="完成运单">{selectedRecord.shipmentsCompleted} 单</Descriptions.Item>
              <Descriptions.Item label="总里程">{selectedRecord.totalDistance.toLocaleString()} km</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(selectedRecord.status)}</Descriptions.Item>
              <Descriptions.Item label="基础工资">${selectedRecord.baseSalary.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="行程奖金">${selectedRecord.tripBonus.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="燃油补贴">${selectedRecord.fuelAllowance.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="总薪酬">
                <Text strong style={{ color: '#1890ff', fontSize: '18px' }}>
                  ${selectedRecord.totalEarnings.toLocaleString()}
                </Text>
              </Descriptions.Item>
              {selectedRecord.payDate && (
                <Descriptions.Item label="支付日期">
                  {dayjs(selectedRecord.payDate).format('YYYY-MM-DD')}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider>包含的行程和运单</Divider>

            {selectedRecord.trips.length === 0 ? (
              <Alert
                message="暂无行程数据"
                description="该周期内没有关联的行程记录"
                type="info"
                showIcon
              />
            ) : (
              <List
                dataSource={selectedRecord.trips}
                renderItem={(trip) => (
                  <List.Item>
                    <Card 
                      size="small" 
                      title={
                        <Space>
                          <Badge count={trip.shipments.length} showZero style={{ backgroundColor: '#1890ff' }} />
                          <span>行程: {trip.tripNo}</span>
                        </Space>
                      }
                      style={{ width: '100%' }}
                    >
                      <List
                        size="small"
                        dataSource={trip.shipments}
                        renderItem={(shipment) => (
                          <List.Item>
                            <List.Item.Meta
                              title={
                                <Space>
                                  <Text strong>运单: {shipment.shipmentNumber}</Text>
                                  <Tag color="blue">${shipment.amount.toLocaleString()}</Tag>
                                </Space>
                              }
                              description={`完成时间: ${dayjs(shipment.completedAt).format('YYYY-MM-DD HH:mm')}`}
                            />
                          </List.Item>
                        )}
                      />
                    </Card>
                  </List.Item>
                )}
              />
            )}
          </div>
        )}
      </Modal>

      {/* 添加工资记录模态框（临时补救） */}
      <Modal
        title="添加工资记录（临时补救）"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingRecord(null);
        }}
        width={700}
        destroyOnClose
      >
        <Alert
          message="临时补救功能"
          description="此功能用于手动添加工资记录，建议优先使用系统自动生成的薪酬数据。"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
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
                name="period"
                label="工资周期"
                rules={[{ required: true, message: '请输入周期' }]}
              >
                <Input placeholder={periodType === 'monthly' ? '例如：2024-01' : '例如：2024-01-01 to 2024-01-14'} />
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
            </Col>
          </Row>

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
