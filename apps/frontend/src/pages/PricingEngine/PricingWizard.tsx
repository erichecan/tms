// 向导式计费规则创建界面
// 创建时间: 2025-09-29 02:50:00
// 作用: 6步向导式界面创建计费规则模板

import React, { useState } from 'react';
import { 
  Card, 
  Steps, 
  Button, 
  Form, 
  Input, 
  Select, 
  Switch, 
  Row, 
  Col, 
  Typography, 
  Space, 
  Tag, 
  Divider, 
  InputNumber,
  Button as AntdButton,
  Tooltip,
  Alert,
  Radio,
  Checkbox,
  Slider,
  Modal,
  List,
  Icon,
  message
} from 'antd';
import { 
  ShoppingCartOutlined, 
  TruckOutlined, 
  EnvironmentOutlined,
  DollarCircleOutlined,
  TeamOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  RightOutlined,
  LeftOutlined,
  HeartOutlined,
  BankOutlined,
  ContainerOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface WizardData {
  // Step 1: 业务场景
  scenario: string;
  scenarioDescription: string;
  
  // Step 2: 路线条件
  pickupType: string;
  pickupWarehouse: string;
  deliveryType: string;
  deliveryWarehouse: string;
  requiresAppointment: boolean;
  appointmentTime: string;
  baseDistanceKm: number;
  waitingTimeLimit: number;
  
  // Step 3: 费用结构
  baseFee: number;
  distanceTierEnabled: boolean;
  distanceTierThreshold: number;
  distanceTierRate: number;
  waitingFeeEnabled: boolean;
  waitingFeeThreshold: number;
  waitingFeeAmount: number;
  palletFeeEnabled: boolean;
  palletFeeAmount: number;
  
  // Step 4: 司机薪酬
  driverBasePay: number;
  distanceBonusEnabled: boolean;
  distanceBonusRate: number;
  waitingBonusEnabled: boolean;
  waitingBonusAmount: number;
  driverSharingEnabled: boolean;
  driverSharingAmount: number;
  
  // Step 5: 成本分摊
  warehouseCost: number;
  fleetCostAllocation: string;
  fuelCostRate: number;
  
  // Step 6: 规则名称
  templateName: string;
  templateDescription: string;
}

const PricingWizardPage: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [wizardData, setWizardData] = useState<WizardData>({
    scenario: '',
    scenarioDescription: '',
    pickupType: 'OWN_WAREHOUSE',
    pickupWarehouse: 'WH_07',
    deliveryType: 'THIRD_PARTY_WAREHOUSE',
    deliveryWarehouse: 'AMZ_YYZ9',
    requiresAppointment: true,
    appointmentTime: '19:00',
    baseDistanceKm: 25,
    waitingTimeLimit: 180,
    baseFee: 180,
    distanceTierEnabled: true,
    distanceTierThreshold: 25,
    distanceTierRate: 20,
    waitingFeeEnabled: true,
    waitingFeeThreshold: 180,
    waitingFeeAmount: 30,
    palletFeeEnabled: false,
    palletFeeAmount: 5,
    driverBasePay: 80,
    distanceBonusEnabled: false,
    distanceBonusRate: 0.8,
    waitingBonusEnabled: true,
    waitingBonusAmount: 20,
    driverSharingEnabled: true,
    driverSharingAmount: 20,
    warehouseCost: 40,
    fleetCostAllocation: 'auto_calculated',
    fuelCostRate: 0.6,
    templateName: '',
    templateDescription: ''
  });

  const steps = [
    {
      title: '业务场景',
      icon: <ShoppingCartOutlined />,
      description: '选择您的业务场景类型'
    },
    {
      title: '路线条件',
      icon: <EnvironmentOutlined />,
      description: '设置取货和送货条件'
    },
    {
      title: '费用结构',
      icon: <DollarCircleOutlined />,
      description: '构建收费规则'
    },
    {
      title: '司机薪酬',
      icon: <TeamOutlined />,
      description: '制定司机报酬方案'
    },
    {
      title: '成本分摊',
      icon: <BankOutlined />,
      description: '配置内部成本分摊'
    },
    {
      title: '完成',
      icon: <CheckCircleOutlined />,
      description: '确认并创建规则'
    }
  ];

  // =====================================================
  // Step 1: 业务场景选择
  // =====================================================
  
  const renderScenarioSelection = () => (
    <Card>
      <Title level={4} style={{ textAlign: 'center', marginBottom: '32px' }}>
        🎯 选择您的业务场景类型
      </Title>
      
      <Row gutter={[24, 24]}>
        {[
          {
            key: 'WASTE_COLLECTION',
            title: '🗑️ 垃圾清运',
            icon: '🗑️',
            description: '内部仓库 → 垃圾填埋场 → 返回',
            features: ['固定价格', '返程计算', '环境友好', '内部成本'],
            example: '司机A载垃圾纸皮从7号仓到填埋场',
            complexity: '简单'
          },
          {
            key: 'WAREHOUSE_TRANSFER',
            title: '📦 仓库转运',
            icon: '📦',
            description: '内部仓库 → 第三方仓库',
            features: ['距离计费', '预约管理', '等候计费', '板费计算'],
            example: '司机B从7号仓运10板货到亚马逊YYZ9',
            complexity: '中等'
          },
          {
            key: 'CLIENT_DIRECT',
            title: '🚛 客户直运',
            icon: '🚛',
            description: '客户地址 → 最终目的地',
            features: ['门到门', '客户等级', '即时定价', '灵活路线'],
            example: '从客户仓库直接运到目标地址',
            complexity: '可定制'
          }
        ].map(scenario => (
          <Col span={8} key={scenario.key}>
            <Card
              hoverable
              className={`scenario-card ${wizardData.scenario === scenario.key ? 'selected' : ''}`}
              onClick={() => {
                setWizardData({ ...wizardData, scenario: scenario.key });
                if (scenario.key === 'WASTE_COLLECTION') {
                  // 自动设置垃圾清运相关的参数
                  form.setFieldsValue({
                    pickupWarehouse: 'WH_07',
                    deliveryWarehouse: 'LANDFILL_01',
                    requiresAppointment: false,
                    baseDistanceKm: 25,
                    baseFee: 40,
                    driverBasePay: 30,
                    warehouseCost: 40
                  });
                } else if (scenario.key === 'WAREHOUSE_TRANSFER') {
                  // 自动设置仓库转运相关的参数
                  form.setFieldsValue({
                    pickupWarehouse: 'WH_07',
                    deliveryWarehouse: 'AMZ_YYZ9',
                    requiresAppointment: true,
                    baseDistanceKm: 25,
                    baseFee: 180,
                    distanceTierEnabled: true,
                    waitingFeeEnabled: true,
                    driverBasePay: 80
                  });
                }
              }}
              style={{
                height: '100%',
                border: wizardData.scenario === scenario.key ? '2px solid #1890ff' : '1px solid #d9d9d9',
                transform: wizardData.scenario === scenario.key ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>{scenario.icon}</div>
                <Title level={5}>{scenario.title}</Title>
                <Text type="secondary">{scenario.description}</Text>
                
                <Divider />
                
                <div>特点:</div>
                {scenario.features.map((feature, index) => (
                  <Tag key={index} color="blue" style={{ margin: '2px' }}>
                    {feature}
                  </Tag>
                ))}
                
                <Divider />
                
                <Alert 
                  message={`复杂度: ${scenario.complexity}`} 
                  type="info" 
                  size="small"
                  style={{ marginBottom: '8px' }}
                />
                <Text style={{ fontSize: '11px', color: '#666' }}>
                  示例: {scenario.example}
                </Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {wizardData.scenario && (
        <Alert 
          message="已选择业务场景" 
          description={`您选择了: ${wizardData.scenario === 'WASTE_COLLECTION' ? '垃圾清运' : wizardData.scenario === 'WAREHOUSE_TRANSFER' ? '仓库转运' : '客户直运'}`}
          type="success" 
          style={{ marginTop: '24px' }}
          showIcon
        />
      )}
    </Card>
  );

  // =====================================================
  // Step 2: 路线条件设置
  // =====================================================
  
  const renderRouteConditions = () => (
    <Card>
      <Title level={4} style={{ textAlign: 'center', marginBottom: '32px' }}>
        🗺️ 设置路线与条件
      </Title>
      
      <Form form={form} layout="vertical">
        {/* 取货地点配置 */}
        <Card size="small" title={<><EnvironmentOutlined /> 取货地点配置</>} style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="取货地点类型"
                name="pickupType"
                initialValue={wizardData.pickupType}
              >
                <Select size="large">
                  <Option value="OWN_WAREHOUSE">内部仓库</Option>
                  <Option value="CLIENT_LOCATION">客户地址</Option>
                  <Option value="INTERNAL">内部地点</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="取货仓库"
                name="pickupWarehouse"
                initialValue={wizardData.pickupWarehouse}
              >
                <Select size="large">
                  <Option value="WH_07">7号仓库</Option>
                  <Option value="WH_09">9号仓库</Option>
                  <Option value="CLIENT_SITE">客户场地</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 送货地点配置 */}
        <Card size="small" title={<><TruckOutlined /> 送货地点配置</>} style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="送货地点类型"
                name="deliveryType"
                initialValue={wizardData.deliveryType}
              >
                <Select size="large">
                  <Option value="THIRD_PARTY_WAREHOUSE">第三方仓库</Option>
                  <Option value="DISPOSAL_SITE">垃圾处理场</Option>
                  <Option value="CLIENT_ADDRESS">客户地址</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="送货仓库"
                name="deliveryWarehouse"
                initialValue={wizardData.deliveryWarehouse}
              >
                <Select size="large">
                  <Option value="AMZ_YYZ9">亚马逊YYZ9</Option>
                  <Option value="LANDFILL_01">垃圾填埋场</Option>
                  <Option value="CUSTOMER_DEST">客户目的地</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 时间与距离配置 */}
        <Card size="small" title={<><ClockCircleOutlined /> 时间与距离配置</>}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="需要预约时间"
                name="requiresAppointment"
                initialValue={wizardData.requiresAppointment}
              >
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="基础距离范围 (km)"
                name="baseDistanceKm"
                initialValue={wizardData.baseDistanceKm}
              >
                <InputNumber 
                  min={1} 
                  max={100} 
                  style={{ width: '100%' }}
                  addonAfter="km"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="免费等候时间 (分钟)"
                name="waitingTimeLimit"
                initialValue={wizardData.waitingTimeLimit}
              >
                <InputNumber 
                  min={0} 
                  max={480} 
                  style={{ width: '100%' }}
                  addonAfter="分钟"
                />
              </Form.Item>
            </Col>
          </Row>
          
          {wizardData.requiresAppointment && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="预约配送时间"
                  name="appointmentTime"
                  initialValue={wizardData.appointmentTime}
                >
                  <Select>
                    <Option value="09:00">09:00</Option>
                    <Option value="10:00">10:00</Option>
                    <Option value="14:00">14:00</Option>
                    <Option value="19:00">19:00</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}
        </Card>
      </Form>
    </Card>
  );

  // =====================================================
  // Step 3: 费用结构可视化配置
  // =====================================================
  
  const renderPricingStructure = () => (
    <Card>
      <Title level={4} style={{ textAlign: 'center', marginBottom: '32px' }}>
        💰 构建您的费用结构
      </Title>
      
      <Form form={form} layout="vertical">
        {/* 基础费用 */}
        <Card size="small" title={<><DollarCircleOutlined /> 基础费用</>} style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="基础运费"
                name="baseFee"
                initialValue={wizardData.baseFee}
              >
                <InputNumber 
                  min={0} 
                  precision={2}
                  addonBefore="$" 
                  addonAfter="CAD"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Alert 
                message="包含项目" 
                description="基础运输服务、燃油、司机时间成本" 
                type="info"
                size="small"
              />
            </Col>
          </Row>
        </Card>

        {/* 阶梯距离费 */}
        <Card size="small" title={<><EnvironmentOutlined /> 阶梯距离费</>} style={{ marginBottom: '24px' }}>
          <Form.Item name="distanceTierEnabled" initialValue={wizardData.distanceTierEnabled}>
            <Radio.Group>
              <Radio value={true}>启用阶梯收费</Radio>
              <Radio value={false}>固定价格</Radio>
            </Radio.Group>
          </Form.Item>
          
          {wizardData.distanceTierEnabled && (
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="基础距离阈值 (km)"
                  name="distanceTierThreshold"
                  initialValue={wizardData.distanceTierThreshold}
                >
                  <InputNumber 
                    min={1} 
                    max={100} 
                    style={{ width: '100%' }}
                    addonAfter="km"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="每阶梯费用"
                  name="distanceTierRate"
                  initialValue={wizardData.distanceTierRate}
                >
                  <InputNumber 
                    min={0} 
                    precision={2}
                    addonBefore="$" 
                    addonAfter="CAD"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Alert 
                  message="收费逻辑"
                  description="超出基础距离，每20km收取固定费用"
                  type="info"
                  size="small"
                />
              </Col>
            </Row>
          )}
        </Card>

        {/* 等候费用 */}
        <Card size="small" title={<><ClockCircleOutlined /> 等候费用</>} style={{ marginBottom: '24px' }}>
          <Form.Item name="waitingFeeEnabled" initialValue={wizardData.waitingFeeEnabled}>
            <Radio.Group>
              <Radio value={true}>启用等候费</Radio>
              <Radio value={false}>不收取等候费</Radio>
            </Radio.Group>
          </Form.Item>
          
          {wizardData.waitingFeeEnabled && (
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="等候时间阈值 (分钟)"
                  name="waitingFeeThreshold"
                  initialValue={wizardData.waitingFeeThreshold}
                >
                  <InputNumber 
                    min={30} 
                    max={480} 
                    style={{ width: '100%' }}
                    addonAfter="分钟"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="等候费用"
                  name="waitingFeeAmount"
                  initialValue={wizardData.waitingFeeAmount}
                >
                  <InputNumber 
                    min={0} 
                    precision={2}
                    addonBefore="$" 
                    addonAfter="CAD"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Alert 
                  message="收费说明"
                  description="超时等候产生额外费用，部分给司机"
                  type="warning"
                  size="small"
                />
              </Col>
            </Row>
          )}
        </Card>

        {/* 板费配置 */}
        <Card size="small" title={<><ContainerOutlined /> 额外费用配置</>}>
          <Form.Item name="palletFeeEnabled" initialValue={wizardData.palletFeeEnabled}>
            <Radio.Group>
              <Radio value={true}>启用板数收费</Radio>
              <Radio value={false}>不收取板费</Radio>
            </Radio.Group>
          </Form.Item>
          
          {wizardData.palletFeeEnabled && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="每板费用"
                  name="palletFeeAmount"
                  initialValue={wizardData.palletFeeAmount}
                >
                  <InputNumber 
                    min={0} 
                    precision={2}
                    addonBefore="$" 
                    addonAfter="CAD/板"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Alert 
                  message="计费说明"
                  description="按实际板数收费，常用干电商转运"
                  type="info"
                  size="small"
                />
              </Col>
            </Row>
          )}
        </Card>
      </Form>
    </Card>
  );

  // =====================================================
  // Step 4: 司机薪酬设计
  // =====================================================
  
  const renderDriverCompensation = () => (
    <Card>
      <Title level={4} style={{ textAlign: 'center', marginBottom: '32px' }}>
        👨‍💼 司机报酬设计
      </Title>
      
      <Form form={form} layout="vertical">
        {/* 基础工资 */}
        <Card size="small" title={<><TeamOutlined /> 基础薪酬</>} style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="基础工资"
                name="driverBasePay"
                initialValue={wizardData.driverBasePay}
              >
                <InputNumber 
                  min={0} 
                  max={500}
                  precision={2}
                  addonBefore="$" 
                  addonAfter="CAD"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Alert 
                message="工资说明" 
                description="与运费关联的基础报酬，与难度和距离成正比" 
                type="info"
                size="small"
              />
            </Col>
          </Row>
        </Card>

        {/* 距离奖金 */}
        <Card size="small" title={<><EnvironmentOutlined /> 绩效奖金</>} style={{ marginBottom: '24px' }}>
          <Form.Item name="distanceBonusEnabled" initialValue={wizardData.distanceBonusEnabled}>
            <Radio.Group>
              <Radio value={true}>启用距离奖金</Radio>
              <Radio value={false}>固定工资制</Radio>
            </Radio.Group>
          </Form.Item>
          
          {wizardData.distanceBonusEnabled && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="距离奖金率 (每km)"
                  name="distanceBonusRate"
                  initialValue={wizardData.distanceBonusRate}
                >
                  <InputNumber 
                    min={0} 
                    precision={2}
                    addonBefore="$" 
                    addonAfter="CAD/km"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Alert 
                  message="奖励机制" 
                  description="鼓励司机高效工作，多劳多得" 
                  type="success"
                  size="small"
                />
              </Col>
            </Row>
          )}
        </Card>

        {/* 等候奖金 */}
        <Card size="small" title={<><ClockCircleOutlined /> 等候补偿</>} style={{ marginBottom: '24px' }}>
          <Form.Item name="waitingBonusEnabled" initialValue={wizardData.waitingBonusEnabled}>
            <Radio.Group>
              <Radio value={true}>等候有奖金</Radio>
              <Radio value={false}>等候无补偿</Radio>
            </Radio.Group>
          </Form.Item>
          
          {wizardData.waitingBonusEnabled && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="等候奖金"
                  name="waitingBonusAmount"
                  initialValue={wizardData.waitingBonusAmount}
                >
                  <InputNumber 
                    min={0} 
                    precision={2}
                    addonBefore="$" 
                    addonAfter="CAD"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Alert 
                  message="奖金逻辑" 
                  description="等候超时司机获得额外补偿" 
                  type="warning"
                  size="small"
                />
              </Col>
            </Row>
          )}
        </Card>

        {/* 分成机制 */}
        <Card size="small" title={<><HeartOutlined /> 分成机制</>}>
          <Form.Item name="driverSharingEnabled" initialValue={wizardData.driverSharingEnabled}>
            <Radio.Group>
              <Radio value={true}>从总收入中分成</Radio>
              <Radio value={false}>固定薪酬制</Radio>
            </Radio.Group>
          </Form.Item>
          
          {wizardData.driverSharingEnabled && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="司机分成金额"
                  name="driverSharingAmount"
                  initialValue={wizardData.driverSharingAmount}
                >
                  <InputNumber 
                    min={0} 
                    precision={2}
                    addonBefore="$" 
                    addonAfter="CAD"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Alert 
                  message="分成说明" 
                  description="从客户支付的等候费中分给司机的金额" 
                  type="success"
                  size="small"
                />
              </Col>
            </Row>
          )}
        </Card>
      </Form>
    </Card>
  );

  // =====================================================
  // Step 5: 成本分摊配置
  // =====================================================
  
  const renderCostAllocation = () => (
    <Card>
      <Title level={4} style={{ textAlign: 'center', marginBottom: '32px' }}>
        🏪 内部成本分摊
      </Title>
      
      <Form form={form} layout="vertical">
        {/* 仓库成本 */}
        <Card size="small" title={<><BankOutlined /> 仓库运营成本</>} style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="仓库处理费用"
                name="warehouseCost"
                initialValue={wizardData.warehouseCost}
              >
                <InputNumber 
                  min={0} 
                  precision={2}
                  addonBefore="$" 
                  addonAfter="CAD"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Alert 
                message="成本项目" 
                description="仓库人工、设备使用、库存管理等费用" 
                type="info"
                size="small"
              />
            </Col>
          </Row>
        </Card>

        {/* 车队成本 */}
        <Card size="small" title={<><TruckOutlined /> 车队运营成本</>} style={{ marginBottom: '24px' }}>
          <Form.Item name="fleetCostAllocation" initialValue={wizardData.fleetCostAllocation}>
            <Radio.Group>
              <Radio value="auto_calculated">自动计算</Radio>
              <Radio value="fixed_cost">固定成本</Radio>
              <Radio value="per_km">按公里计费</Radio>
            </Radio.Group>
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="燃油成本率 (每km)"
                name="fuelCostRate"
                initialValue={wizardData.fuelCostRate}
              >
                <InputNumber 
                  min={0} 
                  precision={2}
                  addonBefore="$" 
                  addonAfter="CAD/km"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Alert 
                message="车队成本" 
                description="燃油、车辆折旧、保险、维护等费用" 
                type="warning"
                size="small"
              />
            </Col>
          </Row>
        </Card>

        {/* 成本分摊说明 */}
        <Alert 
          message="成本分摊流程" 
          description={
            <div>
              <p>1. 客户支付总运费 → 总收入</p>
              <p>2. 扣除内部运营成本（仓库+车队+管理）</p>
              <p>3. 扣除司机薪酬和奖金</p>
              <p>4. 剩余部分为公司净利润</p>
            </div>
          }
          type="info"
        />
      </Form>
    </Card>
  );

  // =====================================================
  // Step 6: 完成创建
  // =====================================================
  
  const renderCompletion = () => {
    const handleComplete = async () => {
      setLoading(true);
      try {
        const formValues = form.getFieldsValue();
        
        // 构建完整的模板数据
        const templateData = {
          name: wizardData.templateName,
          description: wizardData.templateDescription,
          type: wizardData.scenario,
          businessConditions: {
            pickupType: formValues.pickupType,
            deliveryType: formValues.deliveryType,
            requiresAppointment: formValues.requiresAppointment,
            baseDistanceKm: formValues.baseDistanceKm,
            waitingTimeLimit: formValues.waitingTimeLimit
          },
          pricingRules: [
            {
              name: "基础运费",
              component: "BASE_FEE",
              formula: formValues.baseFee,
              priority: 100
            },
            ...(formValues.distanceTierEnabled ? [{
              name: "阶梯距离费",
              component: "DISTANCE_TIER",
              condition: `distance > ${formValues.distanceTierThreshold}`,
              formula: `formValues.baseFee + floor((distance-${formValues.distanceTierThreshold})/20) * ${formValues.distanceTierRate}`,
              priority: 110
            }] : []),
            ...(formValues.waitingFeeEnabled ? [{
              name: "等候费",
              component: "WAITING_FEE",
              condition: `waitingTime > ${formValues.waitingFeeThreshold}`,
              formula: formValues.waitingFeeAmount,
              priority: 200
            }] : [])
          ],
          driverRules: [
            {
              name: "基础工资",
              component: "BASE_DRIVER_PAY",
              formula: formValues.driverBasePay,
              priority: 100
            },
            ...(formValues.waitingBonusEnabled ? [{
              name: "等候奖金",
              component: "WAITING_BONUS",
              condition: `waitingTime > ${formValues.waitingFeeThreshold}`,
              formula: formValues.waitingBonusAmount,
              priority: 150
            }] : []),
            ...(formValues.driverSharingEnabled ? [{
              name: "分成",
              component: "DRIVER_SHARING",
              formula: formValues.driverSharingAmount,
              driverSharing: formValues.driverSharingAmount,
              priority: 300
            }] : [])
          ],
          costAllocation: {
            WAREHOUSE_COST: formValues.warehouseCost,
            FLEET_COST: formValues.fleetCostAllocation,
            FUEL_COST_RATE: formValues.fuelCostRate
          }
        };

        const response = await axios.post('/api/pricing/templates', templateData);
        
        if (response.data.success) {
          message.success('计费模板创建成功！');
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          message.error(response.data.error?.message || '创建失败');
        }
      } catch (error: any) {
        message.error(error.response?.data?.error?.message || '创建过程中发生错误');
      } finally {
        setLoading(false);
      }
    };

    return (
      <Card>
        <Title level={4} style={{ textAlign: 'center', marginBottom: '32px' }}>
          ✅ 完成计费模板创建
        </Title>
        
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="模板名称"
                name="templateName"
                rules={[{ required: true, message: '请输入模板名称' }]}
                initialValue={wizardData.templateName}
              >
                <Input 
                  placeholder="例: 垃圾清运标准模板" 
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="适用场景"
                name="scenario"
                initialValue={wizardData.scenario}
              >
                <Select size="large" disabled>
                  <Option value="WASTE_COLLECTION">🗑️ 垃圾清运</Option>
                  <Option value="WAREHOUSE_TRANSFER">📦 仓库转运</Option>
                  <Option value="CLIENT_DIRECT">🚛 客户直运</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="模板描述"
            name="templateDescription"
            initialValue={wizardData.templateDescription}
          >
            <Input.TextArea 
              rows={3}
              placeholder="描述此模板的使用场景、特点和注意事项"
            />
          </Form.Item>
        </Form>

        {/* 预览创建的内容 */}
        <Divider>模板预览</Divider>
        <Alert 
          message="创建的计费规则包含以下内容" 
          description={
            <div>
              <p>• 业务场景: {['', '垃圾清运', '仓库转运', '客户直运'][parseInt(wizardData.scenario.replace(/\D/g, '')) || 0]}</p>
              <p>• 收费规则: 基础费用 + 距离费用 + 等候费用</p>
              <p>• 司机薪酬: 基础工资 + 等候奖金 + 绩效分成</p>
              <p>• 成本分摊: 仓库成本 + 车队成本（自动计算）</p>
            </div>
          }
          type="success"
        />

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Space size="large">
            <Button size="large" onClick={() => setPreviewModalVisible(true)}>
              预览规则
            </Button>
            <Button 
              type="primary" 
              size="large" 
              loading={loading}
              onClick={handleComplete}
              icon={<CheckCircleOutlined />}
            >
              {loading ? '创建中...' : '创建模板'}
            </Button>
          </Space>
        </div>
      </Card>
    );
  };

  // =====================================================
  // 预览模态框
  // =====================================================
  
  const renderPreviewModal = () => (
    <Modal
      title="计费规则预览"
      open={previewModalVisible}
      onCancel={() => setPreviewModalVisible(false)}
      width={800}
      footer={[
        <Button key="close" onClick={() => setPreviewModalVisible(false)}>
          关闭
        </Button>
      ]}
    >
      <div>
        <Title level={5}>业务条件</Title>
        <List
          size="small"
          dataSource={[
            { name: '取货类型', value: form.getFieldValue('pickupType') || 'OWN_WAREHOUSE' },
            { name: '送货类型', value: form.getFieldValue('deliveryType') || 'THIRD_PARTY_WAREHOUSE' },
            { name: '基础距离', value: `${form.getFieldValue('baseDistanceKm') || 25}km` },
            { name: '免费等候', value: `${form.getFieldValue('waitingTimeLimit') || 180}分钟` }
          ]}
          renderItem={item => (
            <List.Item>
              <Text strong>{item.name}:</Text> <Text>{item.value}</Text>
            </List.Item>
          )}
        />

        <Divider />

        <Title level={5}>收费规则</Title>
        <List
          size="small"
          dataSource={[
            { name: '基础运费', value: `$${form.getFieldValue('baseFee') || 0} CAD` },
            { name: '阶梯距离费', value: form.getFieldValue('distanceTierEnabled') ? '启用' : '禁用' },
            { name: '等候费用', value: form.getFieldValue('waitingFeeEnabled') ? '启用' : '禁用' }
          ]}
          renderItem={item => (
            <List.Item>
              <Text strong>{item.name}:</Text> <Text>{item.value}</Text>
            </List.Item>
          )}
        />

        <Divider />

        <Title level={5}>司机薪酬</Title>
        <List
          size="small"
          dataSource={[
            { name: '基础工资', value: `$${form.getFieldValue('driverBasePay') || 0} CAD` },
            { name: '等候奖金', value: form.getFieldValue('waitingBonusEnabled') ? '启用' : '禁用' },
            { name: '分成机制', value: form.getFieldValue('driverSharingEnabled') ? '启用' : '禁用' }
          ]}
          renderItem={item => (
            <List.Item>
              <Text strong>{item.name}:</Text> <Text>{item.value}</Text>
            </List.Item>
          )}
        />
      </div>
    </Modal>
  );

  // =====================================================
  // 主渲染函数
  // =====================================================

  const stepsContent = [
    renderScenarioSelection(),
    renderRouteConditions(),
    renderPricingStructure(),
    renderDriverCompensation(),
    renderCostAllocation(),
    renderCompletion()
  ];

  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={3} style={{ textAlign: 'center', marginBottom: '32px' }}>
        🧙‍♂️ 智能计费规则创建向导
      </Title>
      
      <Steps current={current} items={steps} />
      
      <div style={{ marginTop: '24px' }}>
        {stepsContent[current]}
      </div>
      
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Space size="middle">
          {current > 0 && (
            <Button size="large" onClick={prev} icon={<LeftOutlined />}>
              上一步
            </Button>
          )}
          {current < steps.length - 1 && (
            <Button type="primary" size="large" onClick={next} icon={<RightOutlined />}>
              下一步
            </Button>
          )}
        </Space>
      </div>

      {renderPreviewModal()}
    </div>
  );
};

export default PricingWizardPage;
