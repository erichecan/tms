
import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  InputNumber,
  DatePicker,
  TimePicker,
  Switch,
  Row,
  Col,
  Typography,
  Divider,
  message,
  Space,
  Radio,
  Checkbox,
  Modal,
} from 'antd';
import {
  TruckOutlined,
  EnvironmentOutlined,
  InboxOutlined,
  SafetyCertificateOutlined,
  HomeOutlined,
  ShopOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { shipmentsApi, customersApi } from '../../services/api'; // 2025-01-27 16:45:00 恢复customersApi用于客户管理功能
import dayjs, { type Dayjs } from 'dayjs'; // 添加 dayjs 导入用于日期处理 // 2025-09-26 03:30:00
import PageLayout from '../../components/Layout/PageLayout'; // 2025-01-27 17:00:00 添加页面布局组件

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;



const ShipmentCreate: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]); // 2025-01-27 16:45:00 恢复客户列表状态
  const [customersLoading, setCustomersLoading] = useState(false); // 2025-01-27 16:45:00 恢复客户加载状态
  const [unitSystem, setUnitSystem] = useState<'cm' | 'inch'>('cm');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  // 动态初始化商品明细数据 - 默认5行商品明细 // 2025-09-30 10:45:00
  const [cargoItems, setCargoItems] = useState<any[]>(() => {
    // 默认创建5行商品明细
    const defaultItems = [];
    for (let i = 1; i <= 5; i++) {
      defaultItems.push({
        id: i,
        description: '',
        quantity: 1,
        weight: 0,
        length: 0,
        width: 0,
        height: 0,
        value: 0,
        hsCode: '',
        palletCount: 0
      });
    }
    return defaultItems;
  });
  
  // 提交确认模式
  const [isConfirmMode, setIsConfirmMode] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);

  // 客户管理相关状态 - 2025-01-27 16:45:00 新增客户管理功能
  const [isAddCustomerModalVisible, setIsAddCustomerModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  
  // 新增状态管理 - 添加时间戳注释 @ 2025-09-30 09:30:00
  const [packages, setPackages] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 商品明细管理函数 - 2025-09-29 14:50:00 新增商品明细动态管理
  const addCargoItem = () => {
    const newId = Math.max(...cargoItems.map(item => item.id), 0) + 1;
    setCargoItems([...cargoItems, { 
      id: newId, 
      description: '', 
      quantity: 1, 
      weight: 0, 
      length: 0, 
      width: 0, 
      height: 0, 
      value: 0, 
      hsCode: '',
      palletCount: 0
    }]);
  };

  const removeCargoItem = (id: number) => {
    if (cargoItems.length > 1) {
      setCargoItems(cargoItems.filter(item => item.id !== id));
    }
  };

  const updateCargoItem = (id: number, field: string, value: any) => {
    setCargoItems(cargoItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // 从localStorage恢复表单状态
  const CACHE_KEY = 'shipment_form_cache';
  
  // 加载客户数据 - 2025-01-27 16:45:00 新增客户数据加载
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setCustomersLoading(true);
      const response = await customersApi.getCustomers();
      // 2025-01-27 17:10:00 修复API返回结构，后端返回分页对象
      setCustomers(response.data?.data || []);
    } catch (error) {
      console.error('加载客户列表失败:', error);
      message.error('加载客户列表失败');
      setCustomers([]); // 2025-01-27 17:10:00 确保失败时设置为空数组
    } finally {
      setCustomersLoading(false);
    }
  };

  // 客户选择处理 - 2025-01-27 16:45:00 新增客户选择自动填充地址功能
  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      
      // 自动填充客户信息
      form.setFieldsValue({
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
      });

      // 自动填充默认地址
      if (customer.defaultPickupAddress) {
        form.setFieldsValue({
          shipperName: customer.name,
          shipperPhone: customer.phone,
          shipperEmail: customer.email,
          shipperCountry: customer.defaultPickupAddress.country || 'CA',
          shipperProvince: customer.defaultPickupAddress.province || '',
          shipperCity: customer.defaultPickupAddress.city || '',
          shipperPostalCode: customer.defaultPickupAddress.postalCode || '',
          shipperAddress1: customer.defaultPickupAddress.addressLine1 || '',
          shipperAddress2: customer.defaultPickupAddress.addressLine2 || '',
        });
      }

      if (customer.defaultDeliveryAddress) {
        form.setFieldsValue({
          receiverCountry: customer.defaultDeliveryAddress.country || 'CA',
          receiverProvince: customer.defaultDeliveryAddress.province || '',
          receiverCity: customer.defaultDeliveryAddress.city || '',
          receiverPostalCode: customer.defaultDeliveryAddress.postalCode || '',
          receiverAddress1: customer.defaultDeliveryAddress.addressLine1 || '',
          receiverAddress2: customer.defaultDeliveryAddress.addressLine2 || '',
        });
      }
    }
  };

  // 快速创建客户 - 2025-01-27 16:45:00 新增快速创建客户功能

  const handleAddCustomer = async () => {
    try {
      const values = await form.validateFields();
      
      // 转换表单数据为后端API期望的格式
      const customerData = {
        name: values.name,
        level: 'standard',
        contactInfo: {
          email: values.email,
          phone: values.phone,
          address: {
            street: values.pickupAddressLine1 || '测试街道',
            city: values.pickupCity || '测试城市',
            state: values.pickupProvince || '测试省份',
            postalCode: values.pickupPostalCode || '100000',
            country: values.pickupCountry || '中国'
          }
        },
        billingInfo: {
          companyName: values.name,
          taxId: 'TEST001',
          billingAddress: {
            street: values.pickupAddressLine1 || '测试街道',
            city: values.pickupCity || '测试城市',
            state: values.pickupProvince || '测试省份',
            postalCode: values.pickupPostalCode || '100000',
            country: values.pickupCountry || '中国'
          }
        }
      };
      
      const response = await customersApi.createCustomer(customerData);
      const newCustomer = response.data;
      
      // 添加到客户列表
      setCustomers([...customers, newCustomer]);
      
      // 自动选择新创建的客户
      form.setFieldsValue({ customerId: newCustomer.id });
      handleCustomerSelect(newCustomer.id);
      
      setIsAddCustomerModalVisible(false);
      form.resetFields();
      message.success('客户添加成功');
    } catch (error) {
      console.error('Failed to add customer:', error);
      message.error('添加客户失败');
    }
  };
  
  useEffect(() => {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        // Add a check here to ensure parsed is an object and has expected properties
        if (typeof parsed === 'object' && parsed !== null && parsed.formData) { // Ensure parsed.formData exists
          // 处理日期字段，确保使用 dayjs 对象 // 2025-09-26 03:35:00
          const processedFormData = { ...parsed.formData };
          
          // 转换日期字符串为 dayjs 对象
          if (processedFormData.pickupDate && typeof processedFormData.pickupDate === 'string') {
            processedFormData.pickupDate = dayjs(processedFormData.pickupDate);
          }
          if (processedFormData.deliveryDate && typeof processedFormData.deliveryDate === 'string') {
            processedFormData.deliveryDate = dayjs(processedFormData.deliveryDate);
          }
          
          // 转换时间范围
          if (processedFormData.pickupTimeRange && Array.isArray(processedFormData.pickupTimeRange)) {
            processedFormData.pickupTimeRange = processedFormData.pickupTimeRange.map((time: string | Dayjs) => 
              typeof time === 'string' ? dayjs(time) : time
            );
          }
          if (processedFormData.deliveryTimeRange && Array.isArray(processedFormData.deliveryTimeRange)) {
            processedFormData.deliveryTimeRange = processedFormData.deliveryTimeRange.map((time: string | Dayjs) => 
              typeof time === 'string' ? dayjs(time) : time
            );
          }
          
          form.setFieldsValue(processedFormData);
          setUnitSystem(parsed.unitSystem || 'cm');
          setWeightUnit(parsed.weightUnit || 'kg');
        } else {
          console.warn('Cached data is malformed or incomplete, clearing cache.');
          clearCache(); // Clear invalid cache to prevent future issues
        }
      } catch (error) {
        console.error('Failed to parse cached form data:', error);
        clearCache(); // Clear cache on parse error
      }
    }
  }, [form]);

  // 缓存表单数据
  const cacheFormData = () => {
    const formData = form.getFieldsValue();
    
    // 处理日期对象，转换为字符串以便序列化 // 2025-09-26 03:35:00
    const processedFormData = { ...formData };
    
    // 转换 dayjs 对象为字符串
    if (processedFormData.pickupDate && dayjs.isDayjs(processedFormData.pickupDate)) {
      processedFormData.pickupDate = processedFormData.pickupDate.format('YYYY-MM-DD');
    }
    if (processedFormData.deliveryDate && dayjs.isDayjs(processedFormData.deliveryDate)) {
      processedFormData.deliveryDate = processedFormData.deliveryDate.format('YYYY-MM-DD');
    }
    
    // 转换时间范围
    if (processedFormData.pickupTimeRange && Array.isArray(processedFormData.pickupTimeRange)) {
      processedFormData.pickupTimeRange = processedFormData.pickupTimeRange.map((time: string | Dayjs) => 
        dayjs.isDayjs(time) ? time.format('HH:mm') : time
      );
    }
    if (processedFormData.deliveryTimeRange && Array.isArray(processedFormData.deliveryTimeRange)) {
      processedFormData.deliveryTimeRange = processedFormData.deliveryTimeRange.map((time: string | Dayjs) => 
        dayjs.isDayjs(time) ? time.format('HH:mm') : time
      );
    }
    
    const cacheData = {
      formData: processedFormData,
      unitSystem,
      weightUnit,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  };

  // 监听表单变化，自动缓存
  useEffect(() => {
    // 这里我们使用定时器来定期缓存，避免频繁缓存
    const interval = setInterval(cacheFormData, 2000);
    
    return () => {
      clearInterval(interval);
    };
  }, [form, unitSystem, weightUnit]); // Dependencies for useEffect

  // 清除缓存
  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY);
  };

  // 组件挂载时清除可能损坏的缓存 // 2025-09-26 03:35:00
  useEffect(() => {
    clearCache();
  }, []);

  // 单位转换函数
  const convertToCm = (inch: number) => inch * 2.54;
  const convertToInch = (cm: number) => cm / 2.54;
  const convertToKg = (lb: number) => lb * 0.453592; // 单位转换 // 2025-09-24 13:45:00
  const convertToLb = (kg: number) => kg / 0.453592; // 单位转换 // 2025-09-24 13:45:00


  // 移除步骤配置 - 单页布局 // 2025-09-24 14:05:00

  // 特殊需求选项
  const specialRequirementsOptions = [
    { label: '易碎品', value: 'fragile' },
    { label: '危险品', value: 'dangerous' },
    { label: '温控运输', value: 'temperature_controlled' },
    { label: '白手套服务', value: 'white_glove' },
    { label: '上楼服务', value: 'stairs' },
    { label: '周末配送', value: 'weekend_delivery' },
    { label: '夜间配送', value: 'night_delivery' },
    { label: '加急配送', value: 'express' },
  ];

  // 单页布局，无步骤导航 // 2025-09-25 23:10:00

  // 处理单位转换
  const handleUnitChange = (newUnit: 'cm' | 'inch') => {
    const currentValues = form.getFieldsValue(['cargoLength', 'cargoWidth', 'cargoHeight']);
    
    if (newUnit !== unitSystem) {
      // 转换现有值
      const newValues: any = {};
      ['cargoLength', 'cargoWidth', 'cargoHeight'].forEach(field => {
        const value = currentValues[field];
        if (value) {
          if (unitSystem === 'cm' && newUnit === 'inch') {
            newValues[field] = parseFloat(convertToInch(value).toFixed(2));
          } else if (unitSystem === 'inch' && newUnit === 'cm') {
            newValues[field] = parseFloat(convertToCm(value).toFixed(2));
          }
        }
      });
      
      form.setFieldsValue(newValues);
      setUnitSystem(newUnit);
    }
  };

  // 处理重量单位转换（修复0值不转换与单位不更新问题） // 2025-09-24 13:45:00
  const handleWeightUnitChange = (newUnit: 'kg' | 'lb') => {
    const currentWeight = form.getFieldValue('cargoWeight');
    if (newUnit === weightUnit) {
      return;
    }
    let newWeight: number | undefined = undefined;
    if (currentWeight !== undefined && currentWeight !== null && !Number.isNaN(currentWeight)) {
      if (weightUnit === 'kg' && newUnit === 'lb') {
        newWeight = parseFloat(convertToLb(Number(currentWeight)).toFixed(2));
      } else if (weightUnit === 'lb' && newUnit === 'kg') {
        newWeight = parseFloat(convertToKg(Number(currentWeight)).toFixed(2));
      }
    }
    if (newWeight !== undefined) {
      form.setFieldsValue({ cargoWeight: newWeight });
    }
    setWeightUnit(newUnit);
    cacheFormData();
  };


  // 移除步骤导航函数 // 2025-09-25 23:10:00

  // 提交到确认页面
  const handleSubmitToConfirm = async () => {
    try {
      const values = await form.validateFields();
      
      // 确保单位统一为cm和kg
      let finalLength = values.cargoLength;
      let finalWidth = values.cargoWidth;
      let finalHeight = values.cargoHeight;
      let finalWeight = values.cargoWeight;
      
      if (unitSystem === 'inch') {
        finalLength = convertToCm(values.cargoLength);
        finalWidth = convertToCm(values.cargoWidth);
        finalHeight = convertToCm(values.cargoHeight);
      }
      
      if (weightUnit === 'lb') {
        finalWeight = convertToKg(values.cargoWeight);
      }

      // 处理时间范围
      const pickupDateStr = values.pickupDate?.format('YYYY-MM-DD');
      const deliveryDateStr = values.deliveryDate?.format('YYYY-MM-DD');
      const pickupTime = (pickupDateStr && values.pickupTimeRange)
        ? `${pickupDateStr} ${values.pickupTimeRange[0].format('HH')}:00 - ${pickupDateStr} ${values.pickupTimeRange[1].format('HH')}:00`
        : (pickupDateStr ? `${pickupDateStr} 00:00 - ${pickupDateStr} 23:59` : undefined);
      
      const deliveryTime = (deliveryDateStr && values.deliveryTimeRange)
        ? `${deliveryDateStr} ${values.deliveryTimeRange[0].format('HH')}:00 - ${deliveryDateStr} ${values.deliveryTimeRange[1].format('HH')}:00`
        : (deliveryDateStr ? `${deliveryDateStr} 00:00 - ${deliveryDateStr} 23:59` : undefined);

      // 构建运单数据
      const shipmentData = {
        shipmentNumber: `TMS${Date.now()}`,
        // 新增订单元信息字段 - 添加时间戳注释 @ 2025-09-30 09:30:00
        externalOrderNo: values.externalOrderNo,
        salesChannel: values.salesChannel,
        sourceType: values.sourceType,
        tags: selectedTags,
        sellerNotes: values.sellerNotes,
        customerId: values.customerId,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        customerEmail: values.customerEmail,
        priority: values.priority,
        cargoItems: cargoItems.filter(item => item.description), // 只包含有描述的货物
        // 新增包裹和商品信息 - 添加时间戳注释 @ 2025-09-30 09:30:00
        packages: packages.filter(pkg => pkg.length > 0 && pkg.width > 0 && pkg.height > 0 && pkg.weight > 0),
        items: items.filter(item => item.description && item.quantity > 0),
        shipper: {
          name: values.shipperName,
          company: values.shipperCompany,
          phone: values.shipperPhone,
          email: values.shipperEmail,
          address: {
            addressLine1: values.shipperAddress1,
            addressLine2: values.shipperAddress2,
            city: values.shipperCity,
            province: values.shipperProvince,
            postalCode: values.shipperPostalCode,
            country: values.shipperCountry,
            isResidential: values.addressType === 'residential'
          }
        },
        receiver: {
          name: values.receiverName,
          company: values.receiverCompany,
          phone: values.receiverPhone,
          email: values.receiverEmail,
          address: {
            addressLine1: values.receiverAddress1,
            addressLine2: values.receiverAddress2,
            city: values.receiverCity,
            province: values.receiverProvince,
            postalCode: values.receiverPostalCode,
            country: values.receiverCountry,
            isResidential: values.addressType === 'residential'
          }
        },
        pickupDate: pickupTime,
        deliveryDate: deliveryTime,
        addressType: values.addressType,
        distance: values.distance,
        cargoLength: finalLength,
        cargoWidth: finalWidth,
        cargoHeight: finalHeight,
        cargoWeight: finalWeight,
        cargoQuantity: values.cargoQuantity,
        cargoPalletCount: values.cargoPalletCount,
        cargoValue: values.cargoValue,
        cargoDescription: values.cargoDescription,
        cargoIsFragile: values.cargoIsFragile,
        cargoIsDangerous: values.cargoIsDangerous,
        // 新增安全合规字段 - 添加时间戳注释 @ 2025-09-30 09:30:00
        cargoType: values.cargoType,
        dangerousGoodsCode: values.dangerousGoodsCode,
        requiresColdChain: values.requiresColdChain,
        needSignature: values.needSignature,
        deliveryNote: values.deliveryNote,
        insurance: values.insurance,
        insuranceValue: values.insuranceValue,
        requiresTailgate: values.requiresTailgate,
        requiresAppointment: values.requiresAppointment,
        waitingTime: values.waitingTime,
        deliveryInstructions: values.deliveryInstructions,
        specialRequirements: values.specialRequirements || [],
        status: 'pending',
        estimatedCost: calculateEstimatedCost(values),
      };

      setSubmittedData(shipmentData);
      setIsConfirmMode(true);
    } catch (error) {
      console.error('Form validation failed:', error);
      message.error('请检查表单填写是否完整');
    }
  };

  // 最终确认创建运单
  const handleFinalConfirm = async () => {
    if (!submittedData) return;
    
    setLoading(true);
    try {
      console.log('Sending shipment data:', submittedData);
      
      await shipmentsApi.createShipment(submittedData);
      
      message.success('运单创建成功！');
      clearCache();
      navigate('/admin/shipments');
    } catch (error: any) {
      console.error('Failed to create shipment:', error);
      message.error(error.response?.data?.message || '创建运单失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 返回修改
  const handleBackToEdit = () => {
    setIsConfirmMode(false);
    setSubmittedData(null);
  };

  // 计算预估费用（简化版）
  const calculateEstimatedCost = (values: any): number => {
    let baseCost = 100; // 基础费用
    
    // 根据距离计算
    if (values.distance) {
      baseCost += values.distance * 2;
    }
    
    // 根据重量计算
    if (values.cargoWeight) {
      baseCost += values.cargoWeight * 0.5;
    }
    
    // 根据体积计算
    if (values.cargoLength && values.cargoWidth && values.cargoHeight) {
      const volume = values.cargoLength * values.cargoWidth * values.cargoHeight;
      baseCost += volume * 0.01;
    }
    
    // 附加服务费用
    if (values.insurance) {
      baseCost += 20;
    }
    if (values.requiresTailgate) {
      baseCost += 30;
    }
    if (values.requiresAppointment) {
      baseCost += 15;
    }
    
    return Math.round(baseCost);
  };

  // 单页模块化布局 - 基础信息模块 // 2025-09-24 14:05:00
  // 渲染订单元信息部分 - 添加时间戳注释 @ 2025-09-30 09:30:00
  const renderOrderInfoSection = () => (
    <Card title="订单元信息" style={{ marginBottom: 12 }}>
      <Row gutter={[8, 8]}>
        <Col span={8}>
          <Form.Item
            name="externalOrderNo"
            label="外部订单号 (External Order No.)"
            tooltip="第三方平台或系统的订单号"
            style={{ marginBottom: 8 }}
          >
            <Input placeholder="请输入外部订单号" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="salesChannel"
            label="销售渠道 (Sales Channel)"
            rules={[{ required: true, message: '请选择销售渠道' }]}
            style={{ marginBottom: 8 }}
          >
            <Select placeholder="选择销售渠道">
              <Option value="DIRECT">直接销售</Option>
              <Option value="API">API接入</Option>
              <Option value="IMPORT">批量导入</Option>
              <Option value="WEBHOOK">Webhook</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="sourceType"
            label="来源类型 (Source Type)"
            style={{ marginBottom: 8 }}
          >
            <Select placeholder="选择来源类型">
              <Option value="manual">手工录入</Option>
              <Option value="api">API接口</Option>
              <Option value="import">批量导入</Option>
              <Option value="mobile">移动端</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="tags"
            label="标签 (Tags)"
            tooltip="最多10个标签，每个标签长度不超过32字符"
            style={{ marginBottom: 8 }}
          >
            <Select
              mode="tags"
              placeholder="添加标签，按回车确认"
              maxTagCount={10}
              tokenSeparators={[',']}
              onChange={(value) => setSelectedTags(value)}
            >
              <Option value="B2C">B2C</Option>
              <Option value="B2B">B2B</Option>
              <Option value="URGENT">紧急</Option>
              <Option value="FRAGILE">易碎品</Option>
              <Option value="DANGEROUS">危险品</Option>
              <Option value="COLD_CHAIN">冷链</Option>
              <Option value="SIGNATURE_REQUIRED">需签名</Option>
              <Option value="APPOINTMENT">需预约</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="sellerNotes"
            label="销售备注 (Seller Notes)"
            style={{ marginBottom: 8 }}
          >
            <TextArea 
              rows={3} 
              placeholder="请输入销售备注信息"
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  const renderBasicInfoSection = () => (
    <Card 
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>基础信息</span>
          <Button 
            type="primary" 
            size="small" 
            icon={<PlusOutlined />}
            onClick={() => setIsAddCustomerModalVisible(true)}
          >
            添加新客户
          </Button>
        </div>
      }
      style={{ marginBottom: 12 }}
    >
      <Row gutter={[8, 8]}>
        <Col span={12}>
          <Form.Item
            name="customerId"
            label="客户选择 (Customer Selection)"
            rules={[{ required: true, message: '请选择客户' }]}
            style={{ marginBottom: 8 }}
          >
            <Select
              showSearch
              placeholder="搜索并选择客户"
              optionFilterProp="children"
              loading={customersLoading}
              onChange={handleCustomerSelect}
              filterOption={(input, option) => {
                const customer = customers.find(c => c.id === option?.value);
                return customer?.name.toLowerCase().includes(input.toLowerCase()) || false;
              }}
              notFoundContent={customersLoading ? "加载中..." : "暂无客户"}
              allowClear
              popupRender={(menu) => (
                <div>
                  {menu}
                  <div style={{ padding: '8px 12px', borderTop: '1px solid #f0f0f0' }}>
                    <Button 
                      type="link" 
                      size="small" 
                      onClick={() => setIsAddCustomerModalVisible(true)}
                      style={{ width: '100%' }}
                    >
                      + 添加新客户
                    </Button>
                  </div>
                </div>
              )}
            >
              {customers.map((customer: any) => (
                <Option key={customer.id} value={customer.id}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{customer.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {customer.phone} • {customer.email}
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="customerName"
            label="客户姓名 (Customer Name)"
            rules={[{ required: true, message: '请输入客户姓名' }]}
            style={{ marginBottom: 8 }}
          >
            <Input placeholder="请输入客户姓名" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="customerPhone"
            label="联系电话 (Contact Phone)"
            rules={[
              { required: true, message: '请输入联系电话' },
              { 
                pattern: /^(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$|^1[3-9]\d{9}$/, 
                message: '请输入有效的手机号码（支持北美和中国格式）' 
              }
            ]}
            style={{ marginBottom: 8 }}
          >
            <Input placeholder="请输入联系电话（如：+1-555-123-4567 或 13812345678）" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="customerEmail"
            label="邮箱地址 (Email Address)"
            rules={[
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
            style={{ marginBottom: 8 }}
          >
            <Input placeholder="请输入邮箱地址" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="priority"
            label="优先级 (Priority)"
            style={{ marginBottom: 8 }}
          >
            <Select placeholder="普通">
              <Option value="low">低</Option>
              <Option value="normal">普通</Option>
              <Option value="high">高</Option>
              <Option value="urgent">紧急</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  // 地址与时间模块 - 修改为左右布局，符合北美地址习惯，移除地图功能 // 2025-09-30 10:45:00
  const renderAddressTimeSection = () => (
    <Card 
      title="地址与时间"
      style={{ marginBottom: 12 }}
    >
      <Row gutter={[16, 8]}>
        {/* 发货人信息 - 左侧 */}
        <Col span={12}>
          <Card size="small" title={
            <span>
              <EnvironmentOutlined /> 发货人信息 (Shipper)
            </span>
          } style={{ height: '100%' }}>
            <Row gutter={[8, 8]}>
        <Col span={24}>
                <Form.Item
                  name="shipperName"
                  label="发货人姓名 (Shipper Name)"
                  rules={[{ required: true, message: '请输入发货人姓名' }]}
                  style={{ marginBottom: 8 }}
                >
                  <Input placeholder="请输入发货人姓名" />
                </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item
                  name="shipperCompany"
                  label="公司名称 (Company Name)"
                  style={{ marginBottom: 8 }}
          >
                  <Input placeholder="请输入公司名称（可选）" />
          </Form.Item>
        </Col>
              <Col span={24}>
                <Form.Item
                  name="shipperAddress1"
                  label="地址行1 (Address Line 1)"
                  rules={[{ required: true, message: '请输入地址行1' }]}
                  style={{ marginBottom: 8 }}
                >
                  <Input placeholder="请输入街道地址" />
          </Form.Item>
        </Col>
              <Col span={24}>
                <Form.Item
                  name="shipperAddress2"
                  label="地址行2 (Address Line 2)"
                  style={{ marginBottom: 8 }}
                >
                  <Input placeholder="请输入公寓号、套房号等（可选）" />
          </Form.Item>
        </Col>
              <Col span={12}>
                <Form.Item
                  name="shipperCity"
                  label="城市 (City)"
                  rules={[{ required: true, message: '请输入城市' }]}
                  style={{ marginBottom: 8 }}
                >
                  <Input placeholder="请输入城市" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="shipperProvince"
                  label="省份/州 (Province/State)"
                  rules={[{ required: true, message: '请输入省份/州' }]}
                  style={{ marginBottom: 8 }}
                >
                  <Input placeholder="请输入省份/州" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="shipperPostalCode"
                  label="邮政编码 (Postal Code)"
                  rules={[{ required: true, message: '请输入邮政编码' }]}
                  style={{ marginBottom: 8 }}
                >
                  <Input placeholder="请输入邮政编码" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="shipperCountry"
                  label="国家 (Country)"
                  rules={[{ required: true, message: '请选择国家' }]}
                  style={{ marginBottom: 8 }}
                >
                  <Select>
                    <Option value="CA">加拿大 (Canada)</Option>
                    <Option value="US">美国 (United States)</Option>
                    <Option value="CN">中国 (China)</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="shipperPhone"
                  label="联系电话 (Contact Phone)"
                  rules={[
                    { required: true, message: '请输入联系电话' },
                    { pattern: /^(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$|^1[3-9]\d{9}$/, message: '请输入有效的电话号码' }
                  ]}
                >
                  <Input placeholder="如：+1-555-123-4567" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="shipperEmail"
                  label="邮箱地址 (Email Address)"
                  rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
                >
                  <Input placeholder="请输入邮箱地址（可选）" />
                </Form.Item>
              </Col>
              <Col span={24}>
          <Form.Item name="pickupDate" label="取货日期 (Pickup Date)" rules={[{ required: true, message: '请选择取货日期' }]}>
            <DatePicker 
              format="YYYY-MM-DD"
              style={{ width: '100%' }} 
              placeholder="选择取货日期"
              disabledDate={(current) => current && current < dayjs().startOf('day')} // 禁用过去的日期 // 2025-09-26 03:30:00
            />
          </Form.Item>
        </Col>
              <Col span={24}>
          <Form.Item name="pickupTimeRange" label="取货时间段 (Pickup Time Range)" rules={[{ required: true, message: '请选择取货时间段' }]} style={{ marginBottom: 8 }}>
            <TimePicker.RangePicker
              style={{ width: '100%' }}
              format="HH:mm"
              minuteStep={30}
              hourStep={1}
            />
          </Form.Item>
              </Col>
            </Row>
          </Card>
        </Col>
            
        {/* 收货人信息 - 右侧 */}
        <Col span={12}>
          <Card size="small" title={
            <span>
              <EnvironmentOutlined /> 收货人信息 (Receiver)
            </span>
          } style={{ height: '100%' }}>
            <Row gutter={[8, 8]}>
        <Col span={24}>
                <Form.Item
                  name="receiverName"
                  label="收货人姓名 (Receiver Name)"
                  rules={[{ required: true, message: '请输入收货人姓名' }]}
                  style={{ marginBottom: 8 }}
                >
                  <Input placeholder="请输入收货人姓名" />
                </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item
                  name="receiverCompany"
                  label="公司名称 (Company Name)"
                  style={{ marginBottom: 8 }}
          >
                  <Input placeholder="请输入公司名称（可选）" />
          </Form.Item>
        </Col>
              <Col span={24}>
                <Form.Item
                  name="receiverAddress1"
                  label="地址行1 (Address Line 1)"
                  rules={[{ required: true, message: '请输入地址行1' }]}
                  style={{ marginBottom: 8 }}
                >
                  <Input placeholder="请输入街道地址" />
          </Form.Item>
        </Col>
              <Col span={24}>
                <Form.Item
                  name="receiverAddress2"
                  label="地址行2 (Address Line 2)"
                  style={{ marginBottom: 8 }}
                >
                  <Input placeholder="请输入公寓号、套房号等（可选）" />
          </Form.Item>
        </Col>
              <Col span={12}>
                <Form.Item
                  name="receiverCity"
                  label="城市 (City)"
                  rules={[{ required: true, message: '请输入城市' }]}
                  style={{ marginBottom: 8 }}
                >
                  <Input placeholder="请输入城市" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="receiverProvince"
                  label="省份/州 (Province/State)"
                  rules={[{ required: true, message: '请输入省份/州' }]}
                  style={{ marginBottom: 8 }}
                >
                  <Input placeholder="请输入省份/州" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="receiverPostalCode"
                  label="邮政编码 (Postal Code)"
                  rules={[{ required: true, message: '请输入邮政编码' }]}
                  style={{ marginBottom: 8 }}
                >
                  <Input placeholder="请输入邮政编码" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="receiverCountry"
                  label="国家 (Country)"
                  rules={[{ required: true, message: '请选择国家' }]}
                  style={{ marginBottom: 8 }}
                >
                  <Select>
                    <Option value="CA">加拿大 (Canada)</Option>
                    <Option value="US">美国 (United States)</Option>
                    <Option value="CN">中国 (China)</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="receiverPhone"
                  label="联系电话 (Contact Phone)"
                  rules={[
                    { required: true, message: '请输入联系电话' },
                    { pattern: /^(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$|^1[3-9]\d{9}$/, message: '请输入有效的电话号码' }
                  ]}
                  style={{ marginBottom: 8 }}
                >
                  <Input placeholder="如：+1-555-123-4567" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="receiverEmail"
                  label="邮箱地址 (Email Address)"
                  rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
                >
                  <Input placeholder="请输入邮箱地址（可选）" />
                </Form.Item>
              </Col>
              <Col span={24}>
          <Form.Item name="deliveryDate" label="送达日期 (Delivery Date)" rules={[{ required: true, message: '请选择送达日期' }]}>
            <DatePicker 
              format="YYYY-MM-DD"
              style={{ width: '100%' }} 
              placeholder="选择送达日期"
              disabledDate={(current) => current && current < dayjs().startOf('day')} // 禁用过去的日期 // 2025-09-26 03:30:00
            />
          </Form.Item>
        </Col>
              <Col span={24}>
          <Form.Item name="deliveryTimeRange" label="送达时间段 (Delivery Time Range)" rules={[{ required: true, message: '请选择送达时间段' }]}>
            <TimePicker.RangePicker
              style={{ width: '100%' }}
              format="HH:mm"
              minuteStep={30}
              hourStep={1}
            />
          </Form.Item>
        </Col>
            </Row>
          </Card>
        </Col>

        {/* 地址类型和距离 - 底部 */}
        <Col span={24}>
          <Divider style={{ margin: '8px 0' }} />
          <Row gutter={[12, 8]}>
        <Col span={12}>
          <Form.Item name="addressType" label="地址类型 (Address Type)">
            <Radio.Group>
              <Radio.Button value="residential">
                <HomeOutlined /> 住宅地址
              </Radio.Button>
              <Radio.Button value="commercial">
                <ShopOutlined /> 商业地址
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="distance" label="预估距离 (Estimated Distance - km)">
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入距离"
              min={0}
              precision={1}
            />
          </Form.Item>
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>
  );

  // 货物信息模块 // 2025-09-24 14:05:00
  // 渲染多包裹信息部分 - 添加时间戳注释 @ 2025-09-30 09:30:00
  const renderPackagesSection = () => (
    <Card title="包裹信息" style={{ marginBottom: 12 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>
            <InboxOutlined /> 包裹列表
          </Title>
          <Button 
            type="dashed" 
            icon={<PlusOutlined />} 
            onClick={() => {
              const newPackage = {
                id: Date.now(),
                boxName: `包裹${packages.length + 1}`,
                length: 0,
                width: 0,
                height: 0,
                weight: 0,
                declaredValue: 0,
                remark: ''
              };
              setPackages([...packages, newPackage]);
            }}
          >
            添加包裹
          </Button>
        </div>
      </div>
      
      {packages.map((pkg, index) => (
        <Card 
          key={pkg.id} 
          size="small" 
          title={`包裹 ${index + 1}`}
          style={{ marginBottom: 12 }}
          extra={
            <Button 
              type="text" 
              danger 
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => setPackages(packages.filter(p => p.id !== pkg.id))}
            >
              删除
            </Button>
          }
        >
          <Row gutter={[16, 8]}>
            <Col span={6}>
              <Form.Item
                name={['packages', index, 'boxName']}
                label="包裹名称"
                initialValue={pkg.boxName}
                style={{ marginBottom: 8 }}
              >
                <Input placeholder="如：BOX-A" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name={['packages', index, 'length']}
                label={`长度 (${unitSystem})`}
                initialValue={pkg.length}
                rules={[{ required: true, message: '请输入长度' }]}
                style={{ marginBottom: 8 }}
              >
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name={['packages', index, 'width']}
                label={`宽度 (${unitSystem})`}
                initialValue={pkg.width}
                rules={[{ required: true, message: '请输入宽度' }]}
                style={{ marginBottom: 8 }}
              >
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name={['packages', index, 'height']}
                label={`高度 (${unitSystem})`}
                initialValue={pkg.height}
                rules={[{ required: true, message: '请输入高度' }]}
                style={{ marginBottom: 8 }}
              >
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name={['packages', index, 'weight']}
                label={`重量 (${weightUnit})`}
                initialValue={pkg.weight}
                rules={[{ required: true, message: '请输入重量' }]}
                style={{ marginBottom: 8 }}
              >
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name={['packages', index, 'declaredValue']}
                label="申报价值 (CNY)"
                initialValue={pkg.declaredValue}
                style={{ marginBottom: 8 }}
              >
                <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={['packages', index, 'remark']}
                label="备注"
                initialValue={pkg.remark}
                style={{ marginBottom: 8 }}
              >
                <Input placeholder="包裹备注信息" />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      ))}
      
      {packages.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          <InboxOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
          <div>暂无包裹信息，点击上方按钮添加包裹</div>
        </div>
      )}
    </Card>
  );

  // 渲染商品明细部分 - 添加时间戳注释 @ 2025-09-30 09:30:00
  const renderItemsSection = () => (
    <Card title="商品明细" style={{ marginBottom: 12 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>
            <InboxOutlined /> 商品列表
          </Title>
          <Button 
            type="dashed" 
            icon={<PlusOutlined />} 
            onClick={() => {
              const newItem = {
                id: Date.now(),
                sku: '',
                description: '',
                hsCode: '',
                quantity: 1,
                unitWeight: 0,
                unitPrice: 0,
                originCountry: 'CN'
              };
              setItems([...items, newItem]);
            }}
          >
            添加商品
          </Button>
        </div>
      </div>
      
      {items.map((item, index) => (
        <Card 
          key={item.id} 
          size="small" 
          title={`商品 ${index + 1}`}
          style={{ marginBottom: 12 }}
          extra={
            <Button 
              type="text" 
              danger 
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => setItems(items.filter(i => i.id !== item.id))}
            >
              删除
            </Button>
          }
        >
          <Row gutter={[16, 8]}>
            <Col span={6}>
              <Form.Item
                name={['items', index, 'sku']}
                label="SKU"
                initialValue={item.sku}
                style={{ marginBottom: 8 }}
              >
                <Input placeholder="商品SKU" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name={['items', index, 'hsCode']}
                label="海关编码"
                initialValue={item.hsCode}
                style={{ marginBottom: 8 }}
              >
                <Input placeholder="HS Code" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name={['items', index, 'quantity']}
                label="数量"
                initialValue={item.quantity}
                rules={[{ required: true, message: '请输入数量' }]}
                style={{ marginBottom: 8 }}
              >
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name={['items', index, 'originCountry']}
                label="原产国"
                initialValue={item.originCountry}
                style={{ marginBottom: 8 }}
              >
                <Select placeholder="选择原产国">
                  <Option value="CN">中国</Option>
                  <Option value="US">美国</Option>
                  <Option value="JP">日本</Option>
                  <Option value="KR">韩国</Option>
                  <Option value="DE">德国</Option>
                  <Option value="GB">英国</Option>
                  <Option value="CA">加拿大</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={['items', index, 'description']}
                label="商品描述"
                initialValue={item.description}
                rules={[{ required: true, message: '请输入商品描述' }]}
                style={{ marginBottom: 8 }}
              >
                <Input placeholder="详细描述商品" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name={['items', index, 'unitWeight']}
                label={`单位重量 (${weightUnit})`}
                initialValue={item.unitWeight}
                style={{ marginBottom: 8 }}
              >
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name={['items', index, 'unitPrice']}
                label="单价 (CNY)"
                initialValue={item.unitPrice}
                style={{ marginBottom: 8 }}
              >
                <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      ))}
      
      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          <InboxOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
          <div>暂无商品明细，点击上方按钮添加商品</div>
        </div>
      )}
    </Card>
  );

  const renderCargoSection = () => (
    <Card title="货物信息" style={{ marginBottom: 12 }}>
      <Row gutter={[12, 8]}>
        <Col span={24}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <Title level={5} style={{ margin: 0 }}>
              <InboxOutlined /> 货物规格
            </Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Text>单位:</Text>
              <Radio.Group 
                value={unitSystem} 
                onChange={(e) => handleUnitChange(e.target.value)}
                size="small"
              >
                <Radio.Button value="cm">厘米 (cm)</Radio.Button>
                <Radio.Button value="inch">英寸 (inch)</Radio.Button>
              </Radio.Group>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                1 inch = 2.54 cm
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Text>重量单位:</Text>
              <Radio.Group 
                value={weightUnit} 
                onChange={(e) => handleWeightUnitChange(e.target.value)}
                size="small"
              >
                <Radio.Button value="kg">千克 (kg)</Radio.Button>
                <Radio.Button value="lb">磅 (lb)</Radio.Button>
              </Radio.Group>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                1 lb = 0.454 kg
              </Text>
            </div>
          </div>
        </Col>
        <Col span={6}>
          <Form.Item
            name="cargoLength"
            label={`长度 (${unitSystem})`}
            rules={[{ required: true, message: '请输入长度' }]}
            style={{ marginBottom: 8 }}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder={`长度 (${unitSystem})`}
              min={0}
              precision={1}
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name="cargoWidth"
            label={`宽度 (${unitSystem})`}
            rules={[{ required: true, message: '请输入宽度' }]}
            style={{ marginBottom: 8 }}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder={`宽度 (${unitSystem})`}
              min={0}
              precision={1}
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name="cargoHeight"
            label={`高度 (${unitSystem})`}
            rules={[{ required: true, message: '请输入高度' }]}
            style={{ marginBottom: 8 }}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder={`高度 (${unitSystem})`}
              min={0}
              precision={1}
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name="cargoWeight"
            label={`重量 (${weightUnit})`}
            rules={[{ required: true, message: '请输入重量' }]}
            style={{ marginBottom: 8 }}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder={`重量 (${weightUnit})`}
              min={0}
              precision={1}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="cargoQuantity"
            label="箱数/件数 (Package Count)"
            rules={[{ required: true, message: '请输入数量' }]}
            style={{ marginBottom: 8 }}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="数量"
              min={1}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="cargoPalletCount" label="托盘数 (Pallet Count)" style={{ marginBottom: 8 }}>
            <InputNumber
              style={{ width: '100%' }}
              placeholder="托盘数"
              min={0}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="cargoValue" label="货物价值 (Cargo Value - CNY)" style={{ marginBottom: 8 }}>
            <InputNumber
              style={{ width: '100%' }}
              placeholder="货物价值"
              min={0}
              precision={2}
            />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="cargoDescription" label="货物描述 (Cargo Description)" style={{ marginBottom: 8 }}>
            <TextArea
              rows={3}
              placeholder="请详细描述货物内容、包装方式等"
            />
          </Form.Item>
        </Col>
        
        {/* 商品明细管理 - 2025-09-29 14:55:00 新增动态商品明细管理 */}
        <Col span={24}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Title level={5} style={{ margin: 0 }}>商品明细 (Item Details)</Title>
              <Button 
                type="dashed" 
                icon={<PlusOutlined />} 
                onClick={addCargoItem}
                size="small"
              >
                添加商品
              </Button>
            </div>
            
            {cargoItems.map((item, index) => (
              <div 
                key={item.id} 
                style={{ 
                  marginBottom: 4, 
                  padding: 12, 
                  border: '1px solid #f0f0f0', 
                  borderRadius: 6,
                  backgroundColor: '#fafafa'
                }}
              >
                <Row gutter={[8, 8]} align="middle">
                  <Col span={3}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>商品描述</div>
                    <Input
                      size="small"
                      placeholder="商品描述"
                      value={item.description}
                      onChange={(e) => updateCargoItem(item.id, 'description', e.target.value)}
                    />
                  </Col>
                  <Col span={2}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>数量</div>
                    <InputNumber
                      size="small"
                      style={{ width: '100%' }}
                      placeholder="数量"
                      min={1}
                      value={item.quantity}
                      onChange={(value) => updateCargoItem(item.id, 'quantity', value || 1)}
                    />
                  </Col>
                  <Col span={2}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>重量({weightUnit})</div>
                    <InputNumber
                      size="small"
                      style={{ width: '100%' }}
                      placeholder="重量"
                      min={0}
                      precision={1}
                      value={item.weight}
                      onChange={(value) => updateCargoItem(item.id, 'weight', value || 0)}
                    />
                  </Col>
                  <Col span={2}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>长度({unitSystem})</div>
                    <InputNumber
                      size="small"
                      style={{ width: '100%' }}
                      placeholder="长度"
                      min={0}
                      precision={1}
                      value={item.length}
                      onChange={(value) => updateCargoItem(item.id, 'length', value || 0)}
                    />
                  </Col>
                  <Col span={2}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>宽度({unitSystem})</div>
                    <InputNumber
                      size="small"
                      style={{ width: '100%' }}
                      placeholder="宽度"
                      min={0}
                      precision={1}
                      value={item.width}
                      onChange={(value) => updateCargoItem(item.id, 'width', value || 0)}
                    />
                  </Col>
                  <Col span={2}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>高度({unitSystem})</div>
                    <InputNumber
                      size="small"
                      style={{ width: '100%' }}
                      placeholder="高度"
                      min={0}
                      precision={1}
                      value={item.height}
                      onChange={(value) => updateCargoItem(item.id, 'height', value || 0)}
                    />
                  </Col>
                  <Col span={2}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>托盘数</div>
                    <InputNumber
                      size="small"
                      style={{ width: '100%' }}
                      placeholder="托盘数"
                      min={0}
                      value={item.palletCount}
                      onChange={(value) => updateCargoItem(item.id, 'palletCount', value || 0)}
                    />
                  </Col>
                  <Col span={2}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>价值(CNY)</div>
                    <InputNumber
                      size="small"
                      style={{ width: '100%' }}
                      placeholder="价值"
                      min={0}
                      precision={2}
                      value={item.value}
                      onChange={(value) => updateCargoItem(item.id, 'value', value || 0)}
                    />
                  </Col>
                  <Col span={2}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>HS编码</div>
                    <Input
                      size="small"
                      placeholder="HS编码"
                      value={item.hsCode}
                      onChange={(e) => updateCargoItem(item.id, 'hsCode', e.target.value)}
                    />
                  </Col>
                  <Col span={1}>
                    <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                      {cargoItems.length > 5 && (
                        <Button 
                          type="text" 
                          danger 
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => removeCargoItem(item.id)}
                          style={{ padding: 0 }}
                        />
                      )}
                    </div>
                  </Col>
                </Row>
              </div>
            ))}
          </div>
        </Col>
        <Col span={12}>
          <Form.Item name="cargoIsFragile" label="易碎品 (Fragile)" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="cargoIsDangerous" label="危险品 (Dangerous Goods)" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  // 服务与保险模块 - 行间距缩小到8px // 2025-09-30 10:45:00
  // 渲染安全合规部分 - 添加时间戳注释 @ 2025-09-30 09:30:00
  const renderSafetyComplianceSection = () => (
    <Card title="安全合规" style={{ marginBottom: 12 }}>
      <Row gutter={[16, 8]}>
        <Col span={8}>
          <Form.Item
            name="cargoType"
            label="货物类型 (Cargo Type)"
            rules={[{ required: true, message: '请选择货物类型' }]}
            style={{ marginBottom: 8 }}
          >
            <Select placeholder="选择货物类型">
              <Option value="GENERAL">普通货物</Option>
              <Option value="SENSITIVE">敏感货物</Option>
              <Option value="DANGEROUS">危险品</Option>
              <Option value="PERISHABLE">易腐品</Option>
              <Option value="FRAGILE">易碎品</Option>
              <Option value="LIQUID">液体</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="dangerousGoodsCode"
            label="危险品代码 (Dangerous Goods Code)"
            tooltip="如果是危险品，请输入相应的危险品代码"
            style={{ marginBottom: 8 }}
          >
            <Input placeholder="如：UN1234" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="requiresColdChain"
            label="冷链运输 (Cold Chain Required)"
            valuePropName="checked"
            style={{ marginBottom: 8 }}
          >
            <Switch />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="needSignature"
            label="需要签名确认 (Signature Required)"
            valuePropName="checked"
            style={{ marginBottom: 8 }}
          >
            <Switch />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="deliveryNote"
            label="送货单备注 (Delivery Note)"
            style={{ marginBottom: 8 }}
          >
            <TextArea 
              rows={2} 
              placeholder="送货单特殊说明"
              maxLength={200}
            />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  const renderServicesSection = () => (
    <Card title="服务与保险" style={{ marginBottom: 12 }}>
      <Row gutter={[8, 8]}>
        <Col span={24}>
          <Title level={5}>
            <SafetyCertificateOutlined /> 保险服务
          </Title>
        </Col>
        <Col span={12}>
          <Form.Item name="insurance" label="购买保险 (Purchase Insurance)" valuePropName="checked" style={{ marginBottom: 8 }}>
            <Switch />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="保险金额 (Insurance Amount - CNY)"
            shouldUpdate={(prevValues, currentValues) => prevValues.insurance !== currentValues.insurance}
            style={{ marginBottom: 8 }}
          >
            {({ getFieldValue, setFieldValue }) => (
              <InputNumber
                style={{ width: '100%' }}
                placeholder="保险金额"
                min={0}
                precision={2}
                disabled={!getFieldValue('insurance')}
                value={getFieldValue('insuranceValue')}
                onChange={(value) => setFieldValue('insuranceValue', value)}
              />
            )}
          </Form.Item>
        </Col>
        
        <Col span={24}>
          <Divider style={{ margin: '8px 0' }} />
          <Title level={5}>
            <TruckOutlined /> 运输服务
          </Title>
        </Col>
        <Col span={12}>
          <Form.Item name="requiresTailgate" label="需要尾板 (Requires Tailgate)" valuePropName="checked" style={{ marginBottom: 8 }}>
            <Switch />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="requiresAppointment" label="需要预约 (Requires Appointment)" valuePropName="checked" style={{ marginBottom: 8 }}>
            <Switch />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="waitingTime" label="等候时间 (Waiting Time - minutes)" style={{ marginBottom: 8 }}>
            <InputNumber
              style={{ width: '100%' }}
              placeholder="等候时间"
              min={0}
              max={480}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="deliveryInstructions" label="配送说明 (Delivery Instructions)" style={{ marginBottom: 8 }}>
            <Input placeholder="特殊配送要求" />
          </Form.Item>
        </Col>
        
        <Col span={24}>
          <Divider />
          <Title level={5}>
            <QuestionCircleOutlined /> 特殊需求
          </Title>
        </Col>
        <Col span={24}>
          <Form.Item name="specialRequirements" label="选择特殊需求 (Special Requirements)" style={{ marginBottom: 8 }}>
            <Checkbox.Group options={specialRequirementsOptions} />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  // 确认页面组件 // 2025-01-27 16:20:00
  const renderConfirmationPage = () => {
    if (!submittedData) return null;

    return (
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Title level={2}>
            <CheckCircleOutlined /> 确认运单信息
          </Title>
          <Text type="secondary">请仔细核对运单信息，确认无误后点击"创建运单"</Text>
        </div>

        <Card>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Title level={5}>基本信息</Title>
              <Row gutter={16}>
                <Col span={8}>
                  <Text strong>客户姓名：</Text>
                  <div>{submittedData.customerName}</div>
                </Col>
                <Col span={8}>
                  <Text strong>联系电话：</Text>
                  <div>{submittedData.customerPhone}</div>
                </Col>
                <Col span={8}>
                  <Text strong>优先级：</Text>
                  <div>{submittedData.priority}</div>
                </Col>
              </Row>
            </Col>
            <Col span={24}>
              <Title level={5}>发货人信息</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>发货人：</Text>
                  <div>{submittedData.shipper.name}</div>
                  {submittedData.shipper.company && (
                    <>
                      <Text strong style={{ display: 'block', marginTop: 4 }}>公司：</Text>
                      <div>{submittedData.shipper.company}</div>
                    </>
                  )}
                  <Text strong style={{ display: 'block', marginTop: 4 }}>地址：</Text>
                  <div>
                    {submittedData.shipper.address.addressLine1}
                    {submittedData.shipper.address.addressLine2 && <><br />{submittedData.shipper.address.addressLine2}</>}
                    <br />
                    {submittedData.shipper.address.city} {submittedData.shipper.address.province} {submittedData.shipper.address.postalCode}
                    <br />
                    {submittedData.shipper.address.country === 'CA' ? '加拿大' : submittedData.shipper.address.country === 'US' ? '美国' : submittedData.shipper.address.country === 'CN' ? '中国' : submittedData.shipper.address.country}
                  </div>
                  <Text strong style={{ display: 'block', marginTop: 4 }}>联系电话：</Text>
                  <div>{submittedData.shipper.phone}</div>
                  {submittedData.shipper.email && (
                    <>
                      <Text strong style={{ display: 'block', marginTop: 4 }}>邮箱：</Text>
                      <div>{submittedData.shipper.email}</div>
                    </>
                  )}
                </Col>
                <Col span={12}>
                  <Text strong>收货人：</Text>
                  <div>{submittedData.receiver.name}</div>
                  {submittedData.receiver.company && (
                    <>
                      <Text strong style={{ display: 'block', marginTop: 4 }}>公司：</Text>
                      <div>{submittedData.receiver.company}</div>
                    </>
                  )}
                  <Text strong style={{ display: 'block', marginTop: 4 }}>地址：</Text>
                  <div>
                    {submittedData.receiver.address.addressLine1}
                    {submittedData.receiver.address.addressLine2 && <><br />{submittedData.receiver.address.addressLine2}</>}
                    <br />
                    {submittedData.receiver.address.city} {submittedData.receiver.address.province} {submittedData.receiver.address.postalCode}
                    <br />
                    {submittedData.receiver.address.country === 'CA' ? '加拿大' : submittedData.receiver.address.country === 'US' ? '美国' : submittedData.receiver.address.country === 'CN' ? '中国' : submittedData.receiver.address.country}
                  </div>
                  <Text strong style={{ display: 'block', marginTop: 4 }}>联系电话：</Text>
                  <div>{submittedData.receiver.phone}</div>
                  {submittedData.receiver.email && (
                    <>
                      <Text strong style={{ display: 'block', marginTop: 4 }}>邮箱：</Text>
                      <div>{submittedData.receiver.email}</div>
                    </>
                  )}
                </Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 8 }}>
                <Col span={6}>
                  <Text strong>货物规格：</Text>
                  <div>{submittedData.cargoLength}×{submittedData.cargoWidth}×{submittedData.cargoHeight} cm</div>
                </Col>
                <Col span={6}>
                  <Text strong>重量：</Text>
                  <div>{submittedData.cargoWeight} kg</div>
                </Col>
                <Col span={6}>
                  <Text strong>数量：</Text>
                  <div>{submittedData.cargoQuantity} 件</div>
                </Col>
                <Col span={6}>
                  <Text strong>价值：</Text>
                  <div>¥{submittedData.cargoValue || 0}</div>
                </Col>
              </Row>
            </Col>
            <Col span={24}>
              <Title level={5}>费用预估</Title>
              <Text strong style={{ fontSize: '24px', color: '#1890ff' }}>
                ¥{submittedData.estimatedCost}
              </Text>
            </Col>
          </Row>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Space size="large">
              <Button onClick={handleBackToEdit} size="large">
                返回修改
              </Button>
              <Button
                type="primary"
                onClick={handleFinalConfirm}
                loading={loading}
                size="large"
                icon={<CheckCircleOutlined />}
              >
                确认创建运单
              </Button>
            </Space>
          </div>
        </Card>
      </div>
    );
  };

  // 如果是确认模式，显示确认页面
  if (isConfirmMode) {
    return renderConfirmationPage();
  }

  return (
    <PageLayout>
      <div style={{ padding: '24px', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: 16 }}>
          <Title level={3}>
            <TruckOutlined /> 创建运单
          </Title>
          <Text type="secondary">请填写运单信息</Text>
        </div>

        <Card>
          <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 8px' }}>
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                priority: 'normal',
                addressType: 'residential',
                shipperCountry: 'CA',
                receiverCountry: 'CA',
                insurance: false,
                requiresTailgate: false,
                requiresAppointment: false,
                cargoIsFragile: false,
                cargoIsDangerous: false,
                // 新增字段初始值 - 添加时间戳注释 @ 2025-09-30 09:30:00
                salesChannel: 'DIRECT',
                sourceType: 'manual',
                cargoType: 'GENERAL',
                requiresColdChain: false,
                needSignature: false,
              }}
            >
              {/* 单页布局 - 显示所有模块 */}
              {renderOrderInfoSection()}
              {renderBasicInfoSection()}
              {renderAddressTimeSection()}
              {renderPackagesSection()}
              {renderItemsSection()}
              {renderCargoSection()}
              {renderSafetyComplianceSection()}
              {renderServicesSection()}

              {/* 提交按钮 */}
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Space size="large">
                  <Button
                    type="primary"
                    onClick={handleSubmitToConfirm}
                    size="large"
                    icon={<CheckCircleOutlined />}
                  >
                    提交确认
                  </Button>
                  <Button onClick={() => navigate('/admin/shipments')} size="large">
                    返回列表
                  </Button>
                </Space>
              </div>
            </Form>
          </div>
        </Card>

        {/* 快速创建客户模态框 - 与客户管理页面保持一致 // 2025-09-30 10:45:00 */}
      <Modal
        title="新增客户"
        open={isAddCustomerModalVisible}
        onOk={handleAddCustomer}
        onCancel={() => {
          setIsAddCustomerModalVisible(false);
        }}
        okText="确认"
        cancelText="取消"
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="客户姓名"
            rules={[{ required: true, message: '请输入客户姓名' }]}
          >
            <Input placeholder="请输入客户姓名" />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱（可选）" />
          </Form.Item>
          
          <Form.Item
            name="phone"
            label="电话"
            rules={[{ required: true, message: '请输入电话号码' }]}
          >
            <Input placeholder="请输入电话号码" />
          </Form.Item>
          
          <Form.Item
            name="level"
            label="客户等级"
            initialValue="standard"
          >
            <Select>
              <Option value="standard">普通</Option>
              <Option value="premium">高级</Option>
              <Option value="vip">VIP</Option>
            </Select>
          </Form.Item>
          
          <Divider>默认地址设置</Divider>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="pickupCountry"
                label="取货地址-国家"
                initialValue="中国"
              >
                <Input placeholder="国家" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="pickupProvince"
                label="取货地址-省份"
              >
                <Input placeholder="省份" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="pickupCity"
                label="取货地址-城市"
              >
                <Input placeholder="城市" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="pickupPostalCode"
                label="取货地址-邮编"
              >
                <Input placeholder="邮编" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="pickupAddressLine1"
            label="取货地址-详细地址"
          >
            <Input placeholder="详细地址" />
          </Form.Item>
          
          <Form.Item
            name="pickupIsResidential"
            label="取货地址类型"
            valuePropName="checked"
          >
            <input type="checkbox" /> 住宅地址
          </Form.Item>
        </Form>
      </Modal>
      </div>
    </PageLayout>
  );
};

export default ShipmentCreate;
