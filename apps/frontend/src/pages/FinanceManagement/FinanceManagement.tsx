import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Select,
  DatePicker,
  message,
  Tooltip,
  Row,
  Col,
  Typography,
  Tabs,
  Statistic,
  Popconfirm,
  InputNumber,
  Input,
  Switch,
} from 'antd';
import {
  DollarOutlined,
  FileTextOutlined,
  DownloadOutlined,
  EyeOutlined,
    ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { financeApi, costsApi, vehiclesApi } from '../../services/api'; // 2025-11-29T11:25:04Z 整合成本核算API
import { useDataContext } from '../../contexts/DataContext'; // 2025-11-11T16:00:00Z Added by Assistant: Use global data context
import { FinancialRecord, Statement, StatementType } from '../../types/index';

import { formatCurrency } from '../../utils/formatCurrency';
import FinancialDashboard from '../../components/FinancialReports/FinancialDashboard'; // 2025-10-02 18:10:00 整合财务报表功能
import dayjs from 'dayjs'; // 2025-11-29T11:25:04Z 整合成本核算

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const FinanceManagement: React.FC = () => {
  // 2025-11-11T16:00:00Z Added by Assistant: Use global data context for cross-page synchronization
  const { customers, allDrivers: drivers } = useDataContext();
  
  const [loading, setLoading] = useState(false);
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([]);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [isStatementModalVisible, setIsStatementModalVisible] = useState(false);
  const [statementType, setStatementType] = useState<StatementType>(StatementType.CUSTOMER);
  
  // 2025-11-29T11:25:04Z 整合成本核算功能
  const [vehicleCosts, setVehicleCosts] = useState<any[]>([]);
  const [costCategories, setCostCategories] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [costSummary, setCostSummary] = useState<any>(null);
  const [isCostModalVisible, setIsCostModalVisible] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [editingCost, setEditingCost] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [costFilters, setCostFilters] = useState({
    vehicleId: undefined as string | undefined,
    costType: undefined as string | undefined,
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
  });

  const [form] = Form.useForm();
  const [costForm] = Form.useForm(); // 2025-11-29T11:25:04Z 成本记录表单
  const [categoryForm] = Form.useForm(); // 2025-11-29T11:25:04Z 成本分类表单

  useEffect(() => {
    loadFinancialRecords();
    loadStatements();
    loadCostData(); // 2025-11-29T11:25:04Z 加载成本数据
  }, [costFilters]); // 2025-11-29T11:25:04Z 成本筛选变化时重新加载

  const loadFinancialRecords = async () => {
    try {
      setLoading(true);
      const response = await financeApi.getFinancialRecords();
      setFinancialRecords(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load financial records:', error);
      message.error('加载财务记录失败');
    } finally {
      setLoading(false);
    }
  };

  const loadStatements = async () => {
    try {
      const response = await financeApi.getStatements();
      setStatements(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load statements:', error);
    }
  };

  // 2025-11-29T11:25:04Z 加载成本数据
  const loadCostData = async () => {
    try {
      setLoading(true);
      // 加载成本记录
      const costsResponse = await costsApi.getVehicleCosts({
        ...costFilters,
        page: 1,
        limit: 100,
      });
      setVehicleCosts(costsResponse.data?.data || []);
      
      // 加载成本汇总
      const summaryResponse = await costsApi.getCostSummary(costFilters);
      setCostSummary(summaryResponse.data?.data || null);
      
      // 加载成本分类
      const categoriesResponse = await costsApi.getCostCategories({ isActive: true });
      setCostCategories(categoriesResponse.data?.data || []);
      
      // 加载车辆列表
      const vehiclesResponse = await vehiclesApi.getVehicles();
      setVehicles(vehiclesResponse.data?.data || []);
    } catch (error: any) {
      message.error('加载成本数据失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 2025-10-31 09:59:00 客户和司机数据由 Hooks 自动加载

  const handleGenerateStatement = async (values: unknown) => {
    try {
      const { entityId, period } = values;
      const [start, end] = period;
      
      if (statementType === StatementType.CUSTOMER) {
        await financeApi.generateCustomerStatement(entityId, {
          start: start.format('YYYY-MM-DD'),
          end: end.format('YYYY-MM-DD'),
        });
        message.success('客户对账单生成成功');
      } else {
        await financeApi.generateDriverPayrollStatement(entityId, {
          start: start.format('YYYY-MM-DD'),
          end: end.format('YYYY-MM-DD'),
        });
        message.success('司机薪酬结算单生成成功');
      }
      
      setIsStatementModalVisible(false);
      loadStatements();
    } catch (error) {
      console.error('Failed to generate statement:', error);
      message.error('生成结算单失败');
    }
  };

  // 2025-11-29T11:25:04Z 成本核算处理函数
  const handleCostSubmit = async (values: any) => {
    try {
      const costData = {
        vehicleId: values.vehicleId,
        costCategoryId: values.costCategoryId,
        costDate: values.costDate.format('YYYY-MM-DD'),
        costAmount: values.costAmount,
        currency: values.currency || 'CAD',
        costType: values.costType,
        description: values.description,
        paymentStatus: values.paymentStatus || 'unpaid',
        paymentDate: values.paymentDate ? values.paymentDate.format('YYYY-MM-DD') : null,
        notes: values.notes,
      };

      if (editingCost) {
        await costsApi.updateVehicleCost(editingCost.id, costData);
        message.success('更新成本记录成功');
      } else {
        await costsApi.createVehicleCost(costData);
        message.success('创建成本记录成功');
      }

      setIsCostModalVisible(false);
      costForm.resetFields();
      setEditingCost(null);
      loadCostData();
    } catch (error: any) {
      message.error('操作失败: ' + (error.message || '未知错误'));
    }
  };

  const handleCategorySubmit = async (values: any) => {
    try {
      const categoryData = {
        categoryName: values.categoryName,
        categoryType: values.categoryType,
        description: values.description,
        isActive: values.isActive !== false,
      };

      if (editingCategory) {
        await costsApi.updateCostCategory(editingCategory.id, categoryData);
        message.success('更新成本分类成功');
      } else {
        await costsApi.createCostCategory(categoryData);
        message.success('创建成本分类成功');
      }

      setIsCategoryModalVisible(false);
      categoryForm.resetFields();
      setEditingCategory(null);
      loadCostData();
    } catch (error: any) {
      message.error('操作失败: ' + (error.message || '未知错误'));
    }
  };

  const getStatementTypeTag = (type: StatementType) => {
    const typeMap: Record<StatementType, { color: string; text: string }> = {
      [StatementType.CUSTOMER]: { color: 'blue', text: '客户对账单' },
      [StatementType.DRIVER]: { color: 'green', text: '司机薪酬单' },
    };
    
    const typeInfo = typeMap[type] || { color: 'default', text: type };
    return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
  };

  const getStatementStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
      pending: { color: 'orange', text: '待处理', icon: <ClockCircleOutlined /> },
      generated: { color: 'blue', text: '已生成', icon: <FileTextOutlined /> },
      paid: { color: 'green', text: '已支付', icon: <CheckCircleOutlined /> },
      overdue: { color: 'red', text: '逾期', icon: <ExclamationCircleOutlined /> },
    };
    
    const statusInfo = statusMap[status] || { color: 'default', text: status, icon: null };
    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    );
  };

  const financialRecordColumns = [
    {
      title: '记录ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => text.slice(0, 8) + '...',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'revenue' ? 'green' : 'red'}>
          {type === 'revenue' ? '收入' : '支出'}
        </Tag>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number | string, record: FinancialRecord) => {
        // 使用安全的货币格式化函数，彻底解决 toFixed 错误 // 2025-01-27 15:36:00
        const prefix = record.type === 'revenue' ? '+$' : '-$';
        return (
          <Text strong style={{ color: record.type === 'revenue' ? '#52c41a' : '#ff4d4f' }}>
            {formatCurrency(amount, 2, prefix)}
          </Text>
        );
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  const statementColumns = [
    {
      title: '结算单号',
      dataIndex: 'statementNumber',
      key: 'statementNumber',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: StatementType) => getStatementTypeTag(type),
    },
    {
      title: '关联实体',
      dataIndex: 'entityName',
      key: 'entityName',
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number | string) => {
        // 使用安全的货币格式化函数，彻底解决 toFixed 错误 // 2025-01-27 15:36:00
        return (
          <Text strong style={{ color: '#1890ff' }}>
            {formatCurrency(amount, 2, '$')}
          </Text>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatementStatusTag(status),
    },
    {
      title: '生成时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown) => (
        <Space size="middle">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => {
                // 实现查看详情逻辑
                message.info('查看详情功能待实现');
              }}
            />
          </Tooltip>
          <Tooltip title="下载结算单">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => {
                // 实现下载逻辑
                message.info('下载功能待实现');
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const totalRevenue = financialRecords
    .filter(record => record.type === 'revenue')
    .reduce((sum, record) => sum + record.amount, 0);

  const totalExpenses = financialRecords
    .filter(record => record.type === 'expense')
    .reduce((sum, record) => sum + record.amount, 0);

  const netProfit = totalRevenue - totalExpenses;

  return (
    <div style={{ margin: '0 0 0 24px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'phase-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">财务管理</h1>
          <p className="page-description">综合财务管理平台 - 记录、结算、报表</p>
        </div>
        <Button 
          type="primary" 
          icon={<FileTextOutlined />}
          onClick={() => {
            // 2025-11-24T19:40:00Z Updated by Assistant: 实现生成结算单功能
            setIsStatementModalVisible(true);
          }}
        >
          生成结算单
        </Button>
      </div>

      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card className="stats-card">
            <Statistic
              title="总收入"
              value={totalRevenue}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="stats-card">
            <Statistic
              title="总支出"
              value={totalExpenses}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="stats-card">
            <Statistic
              title="净利润"
              value={netProfit}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: netProfit > 0 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs 
        defaultActiveKey="records" 
        size="large"
        items={[
          {
            key: "records",
            label: (
              <span>
                <DollarOutlined />
                财务记录
              </span>
            ),
            children: (
              <Card className="content-card">
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Title level={4} style={{ margin: 0 }}>财务记录</Title>
                    <Text type="secondary">共 {financialRecords.length} 条记录</Text>
                  </div>
                </div>

                <Table
                  columns={financialRecordColumns}
                  dataSource={financialRecords}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    total: financialRecords.length,
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                  }}
                />
              </Card>
            )
          },
          {
            key: 'statements',
            label: (
              <span>
                <FileTextOutlined />
                结算单管理
              </span>
            ),
            children: (
              <Card className="content-card">
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Title level={4} style={{ margin: 0 }}>结算单列表</Title>
                    <Text type="secondary">共 {statements.length} 个结算单</Text>
                  </div>
                  <Space>
                    <Button
                      type="primary"
                      icon={<FileTextOutlined />}
                      onClick={() => {
                        setStatementType(StatementType.CUSTOMER);
                        setIsStatementModalVisible(true);
                      }}
                    >
                      生成客户对账单
                    </Button>
                    <Button
                      type="primary"
                      icon={<FileTextOutlined />}
                      onClick={() => {
                        setStatementType(StatementType.DRIVER);
                        setIsStatementModalVisible(true);
                      }}
                    >
                      生成司机薪酬单
                    </Button>
                  </Space>
                </div>

                <Table
                  columns={statementColumns}
                  dataSource={statements}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    total: statements.length,
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                  }}
                />
              </Card>
            )
          },
          {
            key: 'costs',
            label: (
              <span>
                <BarChartOutlined /> 成本核算
              </span>
            ),
            children: (
              <div>
                {/* 2025-11-29T11:25:04Z 成本核算功能整合 */}
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Title level={4} style={{ margin: 0 }}>车辆成本核算</Title>
                    <Text type="secondary">管理车辆运营成本，进行成本分析和对比</Text>
                  </div>
                  <Space>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setEditingCost(null);
                        costForm.resetFields();
                        setIsCostModalVisible(true);
                      }}
                    >
                      新建成本记录
                    </Button>
                    <Button
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setEditingCategory(null);
                        categoryForm.resetFields();
                        setIsCategoryModalVisible(true);
                      }}
                    >
                      新建成本分类
                    </Button>
                  </Space>
                </div>

                {/* 筛选器 */}
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={6}>
                    <Select
                      placeholder="选择车辆"
                      style={{ width: '100%' }}
                      allowClear
                      value={costFilters.vehicleId}
                      onChange={(value) => setCostFilters(prev => ({ ...prev, vehicleId: value }))}
                    >
                      {vehicles.map(v => (
                        <Option key={v.id} value={v.id}>
                          {v.plateNumber || v.plate || v.id}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={6}>
                    <Select
                      placeholder="选择成本类型"
                      style={{ width: '100%' }}
                      allowClear
                      value={costFilters.costType}
                      onChange={(value) => setCostFilters(prev => ({ ...prev, costType: value }))}
                    >
                      <Option value="fuel">燃油</Option>
                      <Option value="toll">过路费</Option>
                      <Option value="labor">人工</Option>
                      <Option value="insurance">保险</Option>
                      <Option value="depreciation">折旧</Option>
                      <Option value="other">其他</Option>
                    </Select>
                  </Col>
                  <Col span={12}>
                    <RangePicker
                      style={{ width: '100%' }}
                      onChange={(dates) => {
                        if (dates) {
                          setCostFilters(prev => ({
                            ...prev,
                            startDate: dates[0]?.format('YYYY-MM-DD'),
                            endDate: dates[1]?.format('YYYY-MM-DD'),
                          }));
                        } else {
                          setCostFilters(prev => ({
                            ...prev,
                            startDate: undefined,
                            endDate: undefined,
                          }));
                        }
                      }}
                    />
                  </Col>
                </Row>

                {/* 统计卡片 */}
                {costSummary && (
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={6}>
                      <Card>
                        <Statistic
                          title="总成本"
                          value={costSummary.totalCost}
                          prefix="$"
                          precision={2}
                          valueStyle={{ color: '#cf1322' }}
                        />
                      </Card>
                    </Col>
                    {Object.entries(costSummary.costByType || {}).map(([type, amount]: [string, any]) => (
                      <Col span={6} key={type}>
                        <Card>
                          <Statistic
                            title={type === 'fuel' ? '燃油' : type === 'toll' ? '过路费' : type === 'labor' ? '人工' : type === 'insurance' ? '保险' : type === 'depreciation' ? '折旧' : '其他'}
                            value={amount}
                            prefix="$"
                            precision={2}
                            valueStyle={{ color: '#1890ff' }}
                          />
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}

                {/* 成本记录表格 */}
                <Table
                  columns={[
                    {
                      title: '日期',
                      dataIndex: 'costDate',
                      key: 'costDate',
                      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
                    },
                    {
                      title: '车辆',
                      dataIndex: 'vehicleId',
                      key: 'vehicleId',
                      render: (vehicleId: string) => {
                        const vehicle = vehicles.find(v => v.id === vehicleId);
                        return vehicle ? (vehicle.plateNumber || vehicle.plate || vehicleId) : vehicleId;
                      },
                    },
                    {
                      title: '成本类型',
                      dataIndex: 'costType',
                      key: 'costType',
                      render: (type: string) => {
                        const typeMap: Record<string, { color: string; text: string }> = {
                          fuel: { color: 'orange', text: '燃油' },
                          toll: { color: 'green', text: '过路费' },
                          labor: { color: 'purple', text: '人工' },
                          insurance: { color: 'cyan', text: '保险' },
                          depreciation: { color: 'red', text: '折旧' },
                          other: { color: 'default', text: '其他' },
                        };
                        const typeInfo = typeMap[type] || { color: 'default', text: type };
                        return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
                      },
                    },
                    {
                      title: '金额',
                      dataIndex: 'costAmount',
                      key: 'costAmount',
                      render: (amount: number, record: any) => (
                        <Text strong style={{ color: '#cf1322' }}>
                          {record.currency || 'CAD'} {amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                      ),
                    },
                    {
                      title: '描述',
                      dataIndex: 'description',
                      key: 'description',
                      ellipsis: true,
                    },
                    {
                      title: '支付状态',
                      dataIndex: 'paymentStatus',
                      key: 'paymentStatus',
                      render: (status: string) => {
                        const statusMap: Record<string, { color: string; text: string }> = {
                          paid: { color: 'green', text: '已支付' },
                          partial: { color: 'orange', text: '部分支付' },
                          unpaid: { color: 'red', text: '未支付' },
                        };
                        const statusInfo = statusMap[status] || { color: 'default', text: status };
                        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
                      },
                    },
                    {
                      title: '操作',
                      key: 'action',
                      render: (_: any, record: any) => (
                        <Space>
                          <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => {
                              setEditingCost(record);
                              costForm.setFieldsValue({
                                ...record,
                                costDate: dayjs(record.costDate),
                                paymentDate: record.paymentDate ? dayjs(record.paymentDate) : null,
                              });
                              setIsCostModalVisible(true);
                            }}
                          >
                            编辑
                          </Button>
                          <Popconfirm
                            title="确定要删除这条成本记录吗？"
                            onConfirm={async () => {
                              try {
                                await costsApi.deleteVehicleCost(record.id);
                                message.success('删除成功');
                                loadCostData();
                              } catch (error: any) {
                                message.error('删除失败: ' + (error.message || '未知错误'));
                              }
                            }}
                            okText="确定"
                            cancelText="取消"
                          >
                            <Button type="link" danger icon={<DeleteOutlined />}>
                              删除
                            </Button>
                          </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                  dataSource={vehicleCosts}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </div>
            )
          },
          {
            key: "reports",
            label: (
              <span>
                <BarChartOutlined />
                财务报表
              </span>
            ),
            children: (
              <div style={{ padding: '16px 0' }}>
                <Card>
                  <Title level={4}>📊 财务分析报表</Title>
                  <Text type="secondary">全面的财务数据分析和报表生成功能</Text>
                  <FinancialDashboard />
                </Card>
              </div>
            )
          }
        ]}
      />

      <Modal
        title={`生成${statementType === StatementType.CUSTOMER ? '客户对账单' : '司机薪酬单'}`}
        open={isStatementModalVisible}
        onCancel={() => setIsStatementModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGenerateStatement}
        >
          <Form.Item
            name="entityId"
            label={statementType === StatementType.CUSTOMER ? '选择客户' : '选择司机'}
            rules={[{ required: true, message: `请选择${statementType === StatementType.CUSTOMER ? '客户' : '司机'}` }]}
          >
            <Select placeholder={`请选择${statementType === StatementType.CUSTOMER ? '客户' : '司机'}`}>
              {(statementType === StatementType.CUSTOMER ? customers : drivers).map(entity => (
                <Option key={entity.id} value={entity.id}>
                  {entity.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="period"
            label="结算周期"
            rules={[{ required: true, message: '请选择结算周期' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 2025-11-29T11:25:04Z 成本记录 Modal */}
      <Modal
        title={editingCost ? '编辑成本记录' : '新建成本记录'}
        open={isCostModalVisible}
        onCancel={() => {
          setIsCostModalVisible(false);
          costForm.resetFields();
          setEditingCost(null);
        }}
        onOk={() => costForm.submit()}
        width={700}
        destroyOnClose
      >
        <Form
          form={costForm}
          layout="vertical"
          onFinish={handleCostSubmit}
        >
          <Form.Item
            name="vehicleId"
            label="车辆"
            rules={[{ required: true, message: '请选择车辆' }]}
          >
            <Select placeholder="请选择车辆">
              {vehicles.map(v => (
                <Option key={v.id} value={v.id}>
                  {v.plateNumber || v.plate || v.id}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="costCategoryId"
            label="成本分类"
            rules={[{ required: true, message: '请选择成本分类' }]}
          >
            <Select placeholder="请选择成本分类">
              {costCategories.map(cat => (
                <Option key={cat.id} value={cat.id}>
                  {cat.categoryName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="costDate"
                label="成本日期"
                rules={[{ required: true, message: '请选择成本日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="costType"
                label="成本类型"
                rules={[{ required: true, message: '请选择成本类型' }]}
              >
                <Select placeholder="请选择成本类型">
                  <Option value="fuel">燃油</Option>
                  <Option value="toll">过路费</Option>
                  <Option value="labor">人工</Option>
                  <Option value="insurance">保险</Option>
                  <Option value="depreciation">折旧</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="costAmount"
                label="金额"
                rules={[{ required: true, message: '请输入金额' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  placeholder="请输入金额"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="currency"
                label="货币"
                initialValue="CAD"
              >
                <Select>
                  <Option value="CAD">CAD</Option>
                  <Option value="USD">USD</Option>
                  <Option value="CNY">CNY</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="paymentStatus"
                label="支付状态"
                initialValue="unpaid"
              >
                <Select>
                  <Option value="paid">已支付</Option>
                  <Option value="partial">部分支付</Option>
                  <Option value="unpaid">未支付</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="paymentDate"
                label="支付日期"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>

          <Form.Item
            name="notes"
            label="备注"
          >
            <Input.TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 2025-11-29T11:25:04Z 成本分类 Modal */}
      <Modal
        title={editingCategory ? '编辑成本分类' : '新建成本分类'}
        open={isCategoryModalVisible}
        onCancel={() => {
          setIsCategoryModalVisible(false);
          categoryForm.resetFields();
          setEditingCategory(null);
        }}
        onOk={() => categoryForm.submit()}
        width={600}
        destroyOnClose
      >
        <Form
          form={categoryForm}
          layout="vertical"
          onFinish={handleCategorySubmit}
        >
          <Form.Item
            name="categoryName"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>

          <Form.Item
            name="categoryType"
            label="分类类型"
            rules={[{ required: true, message: '请选择分类类型' }]}
          >
            <Select placeholder="请选择分类类型">
              <Option value="fuel">燃油</Option>
              <Option value="toll">过路费</Option>
              <Option value="labor">人工</Option>
              <Option value="insurance">保险</Option>
              <Option value="depreciation">折旧</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="状态"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FinanceManagement;
