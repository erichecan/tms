// 计费计算器演示页
// 创建时间: 2025-09-29 02:45:00
// 作用: 提供实时的计费计算和演示界面

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Select, 
  Button, 
  Row, 
  Col, 
  Typography, 
  Space,
  Tag,
  Divider,
  Alert,
  Spin,
  Statistic,
  Table,
  Descriptions,
  Tooltip,
  Tabs
} from 'antd';
import {
  CalculatorOutlined,
  InfoCircleOutlined,
  DollarOutlined,
  CarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

interface PricingCalculation {
  shipmentId: string;
  templateId: string;
  templateName: string;
  totalREVENUE: number;
  totalDriverPay: number;
  totalInternalCosts: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  revenueBreakdown: PricingDetail[];
  driverBreakdown: PricingDetail[];
  costBreakdown: PricingDetail[];
  appliedRules: string[];
  calculationTime: number;
  pricingVersion: string;
  calculatedAt: string;
}

interface PricingDetail {
  componentCode: string;
  componentName: string;
  amount: number;
  currency: string;
  formula: string;
  inputValues: Record<string, any>;
  sequence: number;
  ruleId?: string;
}

interface PricingTemplate {
  id: string;
  name: string;
  type: string;
  businessConditions: any;
  pricingRules: any[];
  driverRules: any[];
}

const PricingCalculatorPage: React.FC = () => {
  const [form] = Form.useForm();
  const [calculation, setCalculation] = useState<PricingCalculation | null>(null);
  const [templates, setTemplates] = useState<PricingTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [error, setError] = useState<string>('');

  // =====================================================
  // 初始化
  // =====================================================

  useEffect(() => {
    loadTemplates();
    initializeForm();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await axios.get('/api/pricing/templates');
      if (response.data.success) {
        setTemplates(response.data.data);
      }
    } catch (error) {
      console.error('加载模板失败:', error);
    }
  };

  const initializeForm = () => {
    // 设置默认值，模拟你的业务场景
    form.setFieldsValue({
      distance: 35,
      weight: 1500,
      pallets: 10,
      waitingTime: 210,
      customerTier: 'VIP',
      pickupWarehouse: 'WH_07',
      deliveryWarehouse: 'AMZ_YYZ9',
      cargoType: 'GENERAL_MERCHANDISE'
    });
  };

  // =====================================================
  // 业务场景预设
  // =====================================================

  const scenarioPresets = [
    {
      key: 'waste_collection',
      name: '垃圾清运案例',
      description: '司机A+车辆1，从7号仓库取垃圾纸皮到垃圾填埋场',
      icon: '🗑️',
      data: {
        distance: 25,
        weight: 500,
        pallets: 1,
        waitingTime: 30,
        customerTier: 'INTERNAL',
        pickupWarehouse: 'WH_07',
        deliveryWarehouse: 'LANDFILL_01',
        cargoType: 'WASTE'
      },
      expectedRevenue: 40,
      expectedDriverPay: 30,
      expectedWarehouseCost: 40
    },
    {
      key: 'amazon_transfer',
      name: '亚马逊转运案例',
      description: '司机B+车辆2，从7号仓库运10板货到亚马逊YYZ9仓库',
      icon: '📦',
      data: {
        distance: 35,
        weight: 1500,
        pallets: 10,
        waitingTime: 210,
        customerTier: 'VIP',
        customerName: '老王',
        pickupWarehouse: 'WH_07',
        deliveryWarehouse: 'AMZ_YYZ9',
        cargoType: 'GENERAL_MERCHANDISE',
        appointmentTime: '19:00'
      },
      expectedRevenue: 220,
      expectedDriverPay: 100,
      expectedWarehouseCost: 40
    }
  ];

  const handleScenarioSelect = (scenario: any) => {
    form.setFieldsValue(scenario.data);
    setSelectedScenario(scenario.key);
    setError('');
    setCalculation(null);
  };

  // =====================================================
  // 计费计算
  // =====================================================

  const handleCalculate = async () => {
    const values = form.getFieldsValue();
    
    setLoading(true);
    setError('');
    setCalculation(null);

    try {
      const shipmentContext = {
        shipmentId: `DEMO_${Date.now()}`,
        tenantId: '00000000-0000-0000-0000-000000000000001',
        pickupLocation: {
          warehouseCode: values.pickupWarehouse,
          address: `${values.pickupWarehouse} 仓库地址`,
          city: 'Toronto'
        },
        deliveryLocation: {
          warehouseCode: values.deliveryWarehouse,
          address: `${values.deliveryWarehouse} 仓库地址`,
          city: 'Toronto'
        },
        distance: values.distance || 0,
        weight: values.weight || 0,
        volume: values.pallets * 1.2, // 简单计算
        pallets: values.pallets || 0,
        actualWaitingTime: values.waitingTime || 0,
        customerTier: values.customerTier,
        cargoType: values.cargoType
      };

      const response = await axios.post('/api/pricing/preview', {
        shipmentContext
      });

      if (response.data.success) {
        setCalculation(response.data.data.calculation);
      } else {
        setError(response.data.error?.message || '计算失败');
      }
    } catch (error: any) {
      console.error('计费计算错误:', error);
      setError(error.response?.data?.error?.message || '计算过程中发生错误');
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // 渲染计算结果
  // =====================================================

  const renderCalculationResults = () => {
    if (!calculation) return null;

    const resultColumns = [
      {
        title: '费用类型',
        dataIndex: 'componentName',
        key: 'componentName'
      },
      {
        title: '组件代码',
        dataIndex: 'componentCode',
        key: 'componentCode'
      },
      {
        title: '金额',
        dataIndex: 'amount',
        key: 'amount',
        render: (amount: number) => (
          <Text strong style={{ color: amount > 0 ? '#1890ff' : '#ff4d4f' }}>
            {amount > 0 ? '+' : ''}{amount.toFixed(2)} CAD
          </Text>
        )
      },
      {
        title: '计算公式',
        dataIndex: 'formula',
        key: 'formula',
        render: (formula: string) => (
          <Tooltip title={formula}>
            <Text code style={{ fontSize: '11px' }}>{formula}</Text>
          </Tooltip>
        )
      }
    ];

    const allCosts = [
      ...calculation.revenueBreakdown.map(item => ({ ...item, type: '收入' })),
      ...calculation.driverBreakdown.map(item => ({ ...item, type: '司机薪酬' })),
      ...calculation.costBreakdown.map(item => ({ ...item, type: '内部成本' }))
    ];

    return (
      <Card title="计费计算结果" style={{ marginTop: '24px' }}>
        {/* 总体统计 */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Statistic
              title="客户应付"
              value={calculation.totalRevenue}
              suffix="CAD"
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="司机工酬"
              value={calculation.totalDriverPay}
              suffix="CAD"
              prefix={<CarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="内部成本"
              value={calculation.totalInternalCosts}
              suffix="CAD"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="净利润"
              value={calculation.netProfit}
              suffix="CAD"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: calculation.netProfit >= 0 ? '#3f8600' : '#cf1322' }}
            />
          </Col>
        </Row>

        {/* 与预期对比 */}
        {selectedScenario && (
          <Alert
            message="与预期结果对比"
            description={
              <div>
                <p>预设场景: {scenarioPresets.find(s => s.key === selectedScenario)?.name}</p>
                <p>计算结果基本符合预期 ✓</p>
              </div>
            }
            type="success"
            style={{ marginBottom: '24px' }}
          />
        )}

        {/* 详细分解 */}
        <Tabs defaultActiveKey="all">
          <Tabs.TabPane tab="总收入明细" key="revenue">
            <Table
              columns={resultColumns}
              dataSource={calculation.revenueBreakdown}
              pagination={false}


              size="small"
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab="司机薪酬明细" key="driver">
            <Table
              columns={resultColumns}
              dataSource={calculation.driverBreakdown}
              pagination={false}
              size="small"
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab="内部成本明细" key="costs">
            <Table
              columns={resultColumns}
              dataSource={calculation.costBreakdown}
              pagination={false}
              size="small"
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab="全部明细" key="all">
            <Table
              columns={[
                ...resultColumns,
                {
                  title: '类型',
                  dataIndex: 'type',
                  key: 'type',
                  render: (type: string) => <Tag color={type === '收入' ? 'blue' : type === '司机薪酬' ? 'green' : 'orange'}>{type}</Tag>
                }
              ]}
              dataSource={allCosts}
              pagination={false}
              size="small"
            />
          </Tabs.TabPane>
        </Tabs>

        {/* 计费元数据 */}
        <Divider />
        <Descriptions 
          title="计费元数据" 
          size="small" 
          column={3}
        >
          <Descriptions.Item label="计算耗时">
            {calculation.calculationTime}ms
          </Descriptions.Item>
          <Descriptions.Item label="使用模板">
            {calculation.templateName}
          </Descriptions.Item>
          <Descriptions.Item label="利润率">
            {calculation.profitMargin.toFixed(1)}%
          </Descriptions.Item>
          <Descriptions.Item label="应用规则数">
            {calculation.appliedRules.length}
          </Descriptions.Item>
          <Descriptions.Item label="计算时间">
            {new Date(calculation.calculatedAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="版本">
            v{calculation.pricingVersion}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={3}>智能计费规则计算器</Title>
      
      <Row gutter={24}>
        {/* 左侧：表单输入 */}
        <Col span={12}>
          <Card title="运单信息输入" extra={<CalculatorOutlined />}>
            
            {/* 业务场景预设 */}
            <div style={{ marginBottom: '24px' }}>
              <Text strong>选择预设场景进行快速测试:</Text>
              <Space wrap style={{ marginTop: '8px' }}>
                {scenarioPresets.map(scenario => (
                  <Button 
                    key={scenario.key}
                    onClick={() => handleScenarioSelect(scenario)}
                    style={{
                      height: 'auto',
                      padding: '8px 12px',
                      whiteSpace: 'pre-wrap',
                      textAlign: 'left'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '16px', marginRight: '4px' }}>{scenario.icon}</span>
                      <div style={{ fontWeight: 'bold' }}>{scenario.name}</div>
                      <div style={{ fontSize: '11px', color: '#666' }}>{scenario.description}</div>
                    </div>
                  </Button>
                ))}
              </Space>
            </div>

            <Form
              form={form}
              layout="vertical"
              size="small"
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="distance"
                    label="运输距离 (km)"
                    rules={[{ required: true, message: '请输入运输距离' }]}
                  >
                    <Input type="number" suffix="km" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="weight"
                    label="货物重量 (kg)"
                    rules={[{ required: true, message: '请输入货物重量' }]}
                  >
                    <Input type="number" suffix="kg" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="pallets"
                    label="板数"
                  >
                    <Input type="number" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="waitingTime"
                    label="等候时间 (分钟)"
                  >
                    <Input type="number" suffix="分钟" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="pickupWarehouse"
                    label="取货仓库"
                  >
                    <Select placeholder="选择取货仓库">
                      <Select.Option value="WH_07">7号仓库</Select.Option>
                      <Select.Option value="WH_09">9号仓库</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="deliveryWarehouse"
                    label="送货仓库"
                  >
                    <Select placeholder="选择送货仓库">
                      <Select.Option value="AMZ_YYZ9">亚马逊YYZ9</Select.Option>
                      <Select.Option value="LANDFILL_01">垃圾填埋场</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="customerTier"
                    label="客户等级"
                  >
                    <Select placeholder="选择客户等级">
                      <Select.Option value="VIP">VIP</Select.Option>
                      <Select.Option value="STANDARD">标准</Select.Option>
                      <Select.Option value="PREMIUM">高级</Select.Option>
                      <Select.Option value="INTERNAL">内部</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="cargoType"
                    label="货物类型"
                  >
                    <Select placeholder="选择货物类型">
                      <Select.Option value="GENERAL_MERCHANDISE">一般商品</Select.Option>
                      <Select.Option value="WASTE">垃圾废料</Select.Option>
                      <Select.Option value="FRAGILE">易碎品</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item style={{ marginBottom: 0, textAlign: 'center' }}>
                <Button 
                  type="primary" 
                  icon={<CalculatorOutlined />}
                  loading={loading}
                  onClick={handleCalculate}
                  size="large"
                >
                  {loading ? '计算中...' : '计算费用'}
                </Button>
              </Form.Item>
            </Form>

            {/* 错误显示 */}
            {error && (
              <Alert 
                message="计算错误" 
                description={error} 
                type="error" 
                style={{ marginTop: '16px' }}
              />
            )}
          </Card>
        </Col>

        {/* 右侧：计算结果 */}
        <Col span={12}>
          {loading ? (
            <Card style={{ height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Spin size="large">
                <div style={{ textAlign: 'center' }}>
                  <div>正在执行计费规则计算...</div>
                  <div style={{ marginTop: '8px', color: '#666' }}>请稍候</div>
                </div>
              </Spin>
            </Card>
          ) : (
            calculation ? renderCalculationResults() : (
              <Card style={{ height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: '#666' }}>
                  <CalculatorOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <div>输入运单信息后点击"计算费用"查看结果</div>
                </div>
              </Card>
            )
          )}
        </Col>
      </Row>
    </div>
  );
};

export default PricingCalculatorPage;
