
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
  Spin,
  Collapse,
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
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { shipmentsApi, customersApi, pricingApi } from '../../services/api'; // 2025-01-27 16:45:00 恢复customersApi用于客户管理功能
import dayjs, { type Dayjs } from 'dayjs'; // 添加 dayjs 导入用于日期处理 // 2025-09-26 03:30:00
import { v4 as uuidv4 } from 'uuid'; // UUID 生成库 // 2025-10-08 14:20:00


const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;



const ShipmentCreate: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<unknown[]>([]); // 2025-01-27 16:45:00 恢复客户列表状态
  const [customersLoading, setCustomersLoading] = useState(false); // 2025-01-27 16:45:00 恢复客户加载状态
  const [unitSystem, setUnitSystem] = useState<'cm' | 'inch'>('cm');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  
  // 实时计费相关状态 - 2025-10-01 21:40:00
  const [realTimePricing, setRealTimePricing] = useState<{
    totalCost: number;
    breakdown: {
      baseFee: number;
      distanceFee: number;
      weightFee: number;
      volumeFee: number;
      additionalFees: number;
    };
    loading: boolean;
  }>({
    totalCost: 0,
    breakdown: {
      baseFee: 0,
      distanceFee: 0,
      weightFee: 0,
      volumeFee: 0,
      additionalFees: 0
    },
    loading: false
  });
  // 移除商品明细动态管理（根据产品文档） // 2025-10-01 13:45:00
  
  // 提交确认模式
  const [isConfirmMode, setIsConfirmMode] = useState(false);
  const [submittedData, setSubmittedData] = useState<unknown>(null);
  const [estimatedDistance, setEstimatedDistance] = useState<number>(0); // 估算距离(公里)
  const [isManualDistance, setIsManualDistance] = useState<boolean>(false); // 是否手动输入距离

  // 客户管理相关状态 - 2025-01-27 16:45:00 新增客户管理功能
  const [isAddCustomerModalVisible, setIsAddCustomerModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<unknown>(null); // 2025-10-27 重新添加以修复未定义错误
  const [customerForm] = Form.useForm(); // 独立的客户表单实例 // 2025-10-01 21:55:00
  
  // 2025-10-28 新增：安全合规部分展开状态
  const [safetySectionActiveKeys, setSafetySectionActiveKeys] = useState<string[]>([]);
  
  // 状态说明：已移除包裹与商品明细独立模块 // 2025-10-01 13:40:10

  // 相关增删改函数已删除 // 2025-10-01 13:45:00

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
  
  // 城市间距离估算表 (单位: 公里)
  const cityDistanceEstimates: { [key: string]: number } = {
    // 安大略省内部
    'Toronto-Ottawa': 450,
    'Toronto-Hamilton': 65,
    'Toronto-London': 185,
    'Toronto-Windsor': 375,
    'Toronto-Kingston': 260,
    'Ottawa-Hamilton': 420,
    'Ottawa-London': 570,
    'Ottawa-Windsor': 760,
    'Ottawa-Kingston': 190,
    
    // 跨省距离
    'Toronto-Montreal': 540,
    'Toronto-Quebec': 780,
    'Toronto-Vancouver': 3350,
    'Toronto-Calgary': 2650,
    'Toronto-Edmonton': 2750,
    'Ottawa-Montreal': 200,
    'Ottawa-Quebec': 440,
    
    // 默认估算值
    'same_city': 25,
    'same_province': 150,
    'different_province': 800,
  };

  // 基于地址估算距离
  const estimateDistance = (pickupAddress: string, deliveryAddress: string): number => {
    if (!pickupAddress || !deliveryAddress) return 0;
    
    // 提取城市信息 (简单实现)
    const pickupCity = extractCityFromAddress(pickupAddress);
    const deliveryCity = extractCityFromAddress(deliveryAddress);
    
    if (pickupCity === deliveryCity) {
      return cityDistanceEstimates['same_city'];
    }
    
    // 查找精确匹配
    const routeKey1 = `${pickupCity}-${deliveryCity}`;
    const routeKey2 = `${deliveryCity}-${pickupCity}`;
    
    if (cityDistanceEstimates[routeKey1]) {
      return cityDistanceEstimates[routeKey1];
    }
    if (cityDistanceEstimates[routeKey2]) {
      return cityDistanceEstimates[routeKey2];
    }
    
    // 基于省份估算
    const pickupProvince = extractProvinceFromAddress(pickupAddress);
    const deliveryProvince = extractProvinceFromAddress(deliveryAddress);
    
    if (pickupProvince === deliveryProvince) {
      return cityDistanceEstimates['same_province'];
    } else {
      return cityDistanceEstimates['different_province'];
    }
  };

  // 从地址中提取城市信息
  const extractCityFromAddress = (address: string): string => {
    // 简单实现：查找常见城市名称
    const cities = ['Toronto', 'Ottawa', 'Montreal', 'Quebec', 'Vancouver', 'Calgary', 'Edmonton', 'Hamilton', 'London', 'Windsor', 'Kingston'];
    
    for (const city of cities) {
      if (address.toLowerCase().includes(city.toLowerCase())) {
        return city;
      }
    }
    
    // 如果没有找到，返回第一个词作为城市
    return address.split(',')[0].trim();
  };

  // 从地址中提取省份信息
  const extractProvinceFromAddress = (address: string): string => {
    const provinces = ['ON', 'QC', 'BC', 'AB', 'MB', 'SK', 'NS', 'NB', 'NL', 'PE', 'YT', 'NT', 'NU'];
    
    for (const province of provinces) {
      if (address.toUpperCase().includes(province)) {
        return province;
      }
    }
    
    return 'Unknown';
  };

  // 地址变化时自动估算距离
  const handleAddressChange = () => {
    const pickupAddress = form.getFieldValue('shipperAddress1') || '';
    const deliveryAddress = form.getFieldValue('consigneeAddress1') || '';
    
    if (pickupAddress && deliveryAddress && !isManualDistance) {
      const distance = estimateDistance(pickupAddress, deliveryAddress);
      setEstimatedDistance(distance);
      form.setFieldsValue({ estimatedDistance: distance });
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
      // 只验证客户表单字段，而不是整个运单表单 // 2025-10-01 21:55:00
      const values = await customerForm.validateFields();
      
      // 转换表单数据为后端API期望的格式
      const customerData = {
        name: values.name,
        level: values.level || 'standard',
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
      customerForm.resetFields(); // 重置客户表单而不是运单表单 // 2025-10-01 21:55:00
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
      const newValues: unknown = {};
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
      
      // 2025-10-28 新增：处理多行货物数据
      let finalLength = 0;
      let finalWidth = 0;
      let finalHeight = 0;
      let finalWeight = 0;
      let cargoQuantity = 0;
      
      if (values.cargoItems && Array.isArray(values.cargoItems)) {
        // 使用Form.List的多行数据
        values.cargoItems.forEach((item: unknown) => {
          const cargoItem = item || {};
          if (unitSystem === 'inch') {
            finalLength += (cargoItem.length ? convertToCm(cargoItem.length) : 0);
            finalWidth += (cargoItem.width ? convertToCm(cargoItem.width) : 0);
            finalHeight += (cargoItem.height ? convertToCm(cargoItem.height) : 0);
          } else {
            finalLength += (cargoItem.length || 0);
            finalWidth += (cargoItem.width || 0);
            finalHeight += (cargoItem.height || 0);
          }
          
          if (weightUnit === 'lb') {
            finalWeight += (cargoItem.weight ? convertToKg(cargoItem.weight) : 0);
          } else {
            finalWeight += (cargoItem.weight || 0);
          }
          
          cargoQuantity += (cargoItem.quantity || 0);
        });
      } else {
        // 兼容旧代码：确保单位统一为cm和kg
        finalLength = values.cargoLength;
        finalWidth = values.cargoWidth;
        finalHeight = values.cargoHeight;
        finalWeight = values.cargoWeight;
        
        if (unitSystem === 'inch') {
          finalLength = convertToCm(values.cargoLength);
          finalWidth = convertToCm(values.cargoWidth);
          finalHeight = convertToCm(values.cargoHeight);
        }
        
        if (weightUnit === 'lb') {
          finalWeight = convertToKg(values.cargoWeight);
        }
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
        // 订单元信息精简：仅保留销售渠道与销售备注 // 2025-10-01 10:20:45
        salesChannel: values.salesChannel,
        sellerNotes: values.sellerNotes,
        customerId: values.customerId,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        customerEmail: values.customerEmail,
        priority: values.priority,
        // 根据产品文档移除包裹与商品明细独立模块 // 2025-10-01 13:46:30
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
        cargoQuantity: cargoQuantity || values.cargoQuantity || 0, // 2025-10-28 修复：使用计算后的数量
        cargoPalletCount: values.cargoPalletCount || 0,
        cargoValue: values.cargoValue || 0,
        cargoDescription: values.cargoDescription || '',
        cargoIsFragile: values.cargoIsFragile || false,
        cargoIsDangerous: values.cargoIsDangerous || false,
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
        estimatedCost: realTimePricing.totalCost, // 2025-10-27 修复：使用实时计费数据而非calculateEstimatedCost
        // 2025-10-28 新增：保留多行货物数据
        cargoItems: values.cargoItems || []
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
      const createRes = await shipmentsApi.createShipment(submittedData);
      const createdId = createRes?.data?.id || createRes?.data?.data?.id; // 兼容不同返回结构 // 2025-10-01 14:06:30
      
      message.success('运单创建成功！');
      clearCache();
      // 跳转到运单管理，并请求自动打开指派窗口 // 2025-10-01 14:06:30
      navigate('/admin/shipments', { state: { autoAssignShipmentId: createdId } });
    } catch (error: unknown) {
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
  const calculateEstimatedCost = (values: unknown): number => {
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

  // 实时计费计算函数 - 集成后端计费引擎 // 2025-10-08 14:30:00 修复API参数格式
  const calculateRealTimePricing = async (values: unknown) => {
    // 检查是否有必要的字段（修复：使用正确的字段名）// 2025-10-08 17:10:00
    if (!values.shipperAddress1 || !values.receiverAddress1 || !values.cargoWeight) {
      // 静默返回，等待用户填写完所有必要字段 // 2025-10-08 17:10:00
      return;
    }

    setRealTimePricing(prev => ({ ...prev, loading: true }));

    try {
      // 构建运单上下文用于后端计费引擎 - 修复字段名并使用Google Maps距离 // 2025-10-10 17:15:00
      const shipmentContext = {
        shipmentId: uuidv4(), // 使用真实 UUID 用于预览 // 2025-10-08 14:20:00
        tenantId: '00000000-0000-0000-0000-000000000001',
        pickupLocation: {
          address: values.shipperAddress1, // 修复：使用正确的字段名
          city: values.shipperCity || 'Toronto'
        },
        deliveryLocation: {
          address: values.receiverAddress1, // 修复：使用正确的字段名
          city: values.receiverCity || 'Toronto'
        },
        // 使用估算距离或手动输入距离 // 2025-01-27 18:05:00
        distance: values.distance || estimatedDistance || 25,
        weight: values.cargoWeight || 100, // 默认100kg
        volume: values.cargoLength && values.cargoWidth && values.cargoHeight 
          ? values.cargoLength * values.cargoWidth * values.cargoHeight / 1000000 // 转换为立方米
          : 1, // 默认1立方米
        pallets: values.cargoPalletCount || 1
      };

      // 构建完整请求参数 - 2025-10-08 14:30:00
      const requestPayload = {
        shipmentContext: shipmentContext,
        forceRecalculate: false
      };

      // 调用后端计费引擎API - 修复：包装请求参数 // 2025-10-08
      const response = await pricingApi.calculateCost(requestPayload);
      
      // 修复：后端返回 {success, data: {...}}，需要访问 response.data.data // 2025-10-10 17:40:00
      if (response.data?.success && response.data.data?.totalRevenue) {
        const pricingData = response.data.data;
        
        // 调试日志 - 查看完整返回数据 // 2025-10-10 17:40:00
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 后端计费引擎返回完整数据:', JSON.stringify(pricingData, null, 2));
          console.log('🔍 revenueBreakdown:', pricingData.revenueBreakdown);
        }
        
        // 解析费用明细 - 2025-10-10 17:40:00 优化解析逻辑
        const revenueBreakdown = pricingData.revenueBreakdown || [];
        const breakdown = {
          baseFee: revenueBreakdown.find((r: unknown) => r.componentCode === 'BASE_FEE' || r.componentCode === 'BASE_PRICE')?.amount || 0,
          distanceFee: revenueBreakdown.find((r: unknown) => r.componentCode === 'DISTANCE_FEE')?.amount || 0,
          weightFee: revenueBreakdown.find((r: unknown) => r.componentCode === 'WEIGHT_FEE')?.amount || 0,
          volumeFee: revenueBreakdown.find((r: unknown) => r.componentCode === 'VOLUME_FEE')?.amount || 0,
          additionalFees: revenueBreakdown
            .filter((r: unknown) => !['BASE_FEE', 'BASE_PRICE', 'DISTANCE_FEE', 'WEIGHT_FEE', 'VOLUME_FEE'].includes(r.componentCode))
            .reduce((sum: number, r: unknown) => sum + (r.amount || 0), 0)
        };

        setRealTimePricing({
          totalCost: Math.round(pricingData.totalRevenue),
          breakdown: {
            baseFee: Math.round(breakdown.baseFee),
            distanceFee: Math.round(breakdown.distanceFee),
            weightFee: Math.round(breakdown.weightFee),
            volumeFee: Math.round(breakdown.volumeFee),
            additionalFees: Math.round(breakdown.additionalFees)
          },
          loading: false
        });
        
        // 开发环境显示计费详情 // 2025-10-10 17:40:00
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ 计费引擎成功 - 总费用:', pricingData.totalRevenue, '元', '| 明细:', breakdown);
        }
        
        return; // 成功后直接返回，不执行降级逻辑
      }
      
      // 如果响应格式不对，记录警告但继续降级 // 2025-10-10 17:40:00
      console.warn('⚠️ 计费引擎返回格式不符合预期，降级到本地计算', response.data);

    } catch (error: unknown) {
      console.error('⚠️ 实时计费计算失败，降级到本地计算:', error);
      
      // 打印详细错误信息以便调试 - 2025-10-08 14:30:00
      if (error.response) {
        console.error('后端返回错误:', {
          status: error.response.status,
          data: error.response.data,
          message: error.response.data?.error?.message || error.response.data?.message
        });
      }
      
      // 降级到本地计算 - 使用实际表单数据动态计算
      const baseFee = 100;
      const distance = values.distance || 0; // 不设默认值，让用户看到真实计算
      const distanceFee = distance * 2;
      const weight = values.cargoWeight || 0;
      const weightFee = weight * 0.5;
      
      let volumeFee = 0;
      if (values.cargoLength && values.cargoWidth && values.cargoHeight) {
        const volume = values.cargoLength * values.cargoWidth * values.cargoHeight;
        volumeFee = volume * 0.01;
      }

      let additionalFees = 0;
      if (values.insurance) additionalFees += 20;
      if (values.requiresTailgate) additionalFees += 30;
      if (values.requiresAppointment) additionalFees += 15;

      const totalCost = baseFee + distanceFee + weightFee + volumeFee + additionalFees;

      setRealTimePricing({
        totalCost: Math.round(totalCost),
        breakdown: {
          baseFee,
          distanceFee: Math.round(distanceFee),
          weightFee: Math.round(weightFee),
          volumeFee: Math.round(volumeFee),
          additionalFees
        },
        loading: false
      });
      
      // 开发环境显示本地计算详情 // 2025-10-08 17:10:00
      if (process.env.NODE_ENV === 'development') {
        console.log('💡 降级到本地计算 - 总费用:', totalCost, '元');
      }
    }
  };

  // 表单字段变化处理 - 2025-10-08 11:25:00 修复字段名
  const handleFormChange = (changedValues: unknown, allValues: unknown) => {
    // 检查是否是需要触发计费的字段（修复：使用正确的字段名）
    const pricingFields = [
      'shipperAddress1', 'shipperCity', 'shipperProvince', 'shipperPostalCode',
      'receiverAddress1', 'receiverCity', 'receiverProvince', 'receiverPostalCode',
      'cargoWeight', 'cargoLength', 'cargoWidth', 'cargoHeight',
      'distance', 'cargoPalletCount',
      'insurance', 'requiresTailgate', 'requiresAppointment'
    ];

    const shouldTriggerPricing = Object.keys(changedValues).some(field => 
      pricingFields.includes(field)
    );

    if (shouldTriggerPricing) {
      // 延迟执行，避免频繁计算
      setTimeout(() => {
        calculateRealTimePricing(allValues);
      }, 500);
    }
  };

  // 实时费用显示组件 - 2025-10-01 21:40:00
  const renderRealTimePricing = () => (
    <Card title="实时费用预估" style={{ marginBottom: 12 }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            {realTimePricing.loading ? (
              <div>
                <Spin size="large" />
                <div style={{ marginTop: 8, color: '#666' }}>正在计算费用...</div>
              </div>
            ) : realTimePricing.totalCost > 0 ? (
              <div>
                <Text strong style={{ fontSize: '28px', color: '#1890ff' }}>
                  ${realTimePricing.totalCost}
                </Text>
                <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                  预估总费用
                </div>
              </div>
            ) : (
              <div style={{ color: '#999' }}>
                请填写地址和货物信息以查看费用预估
              </div>
            )}
          </div>
        </Col>
        {realTimePricing.totalCost > 0 && (
          <Col span={24}>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ fontSize: '12px', color: '#666' }}>
              <Row gutter={[8, 4]}>
                <Col span={12}>基础费用: ${realTimePricing.breakdown.baseFee}</Col>
                <Col span={12}>距离费用: ${realTimePricing.breakdown.distanceFee}</Col>
                <Col span={12}>重量费用: ${realTimePricing.breakdown.weightFee}</Col>
                <Col span={12}>体积费用: ${realTimePricing.breakdown.volumeFee}</Col>
                {realTimePricing.breakdown.additionalFees > 0 && (
                  <Col span={24}>附加服务: ${realTimePricing.breakdown.additionalFees}</Col>
                )}
              </Row>
            </div>
          </Col>
        )}
      </Row>
    </Card>
  );

  // 单页模块化布局 - 基础信息模块 // 2025-09-24 14:05:00
  // 渲染订单元信息部分：仅保留销售渠道与销售备注 // 2025-10-01 10:22:30
  const renderOrderInfoSection = () => (
    <Card title="订单元信息" style={{ marginBottom: 12 }}>
      
      <Row gutter={[0, 8]}>
        <Col span={24}>
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
        <Col span={24}>
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
        <Col span={16}>
          <Form.Item
            name="customerId"
            label="客户选择 (Customer)"
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
              {customers.map((customer: unknown) => {
                const details = [customer.phone, customer.email].filter(Boolean).join(' / '); // 2025-10-02 16:55:10 同行展示并按存在与否拼接
                return (
                  <Option key={customer.id} value={customer.id}>
                    <div style={{ display: 'flex', alignItems: 'center', lineHeight: '1.4' }}>
                      <span style={{ fontWeight: 500 }}>{customer.name}</span>
                      {details && (
                        <span style={{ fontSize: '12px', color: '#666', marginLeft: 8 }}>{details}</span>
                      )}
                    </div>
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="priority"
            label="客户等级 (Customer Level)"
            style={{ marginBottom: 8 }}
          >
            <Select placeholder="VIP1">
              <Option value="vip1">VIP1</Option>
              <Option value="vip2">VIP2</Option>
              <Option value="vip3">VIP3</Option>
              <Option value="vip4">VIP4</Option>
              <Option value="vip5">VIP5</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="customerName"
            label="客户联系人 (Contact Person)"
            rules={[{ required: true, message: '请输入联系人' }]}
            style={{ marginBottom: 8 }}
          >
            <Input placeholder="请输入联系人" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="customerPhone"
            label="联系电话 (Phone)"
            rules={[
              { required: true, message: '请输入联系电话' },
              { 
                pattern: /^(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$|^1[3-9]\d{9}$/, 
                message: '请输入有效的手机号码（支持北美和中国格式）' 
              }
            ]}
            style={{ marginBottom: 8 }}
          >
            <Input placeholder="如：+1-555-123-4567 或 13812345678" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="customerEmail"
            label="邮箱地址 (Email)"
            rules={[
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
            style={{ marginBottom: 8 }}
          >
            <Input placeholder="请输入邮箱地址" />
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
                  label="地址行1 (Address Line 1) 🌍"
                  rules={[{ required: true, message: '请输入地址行1' }]}
                  style={{ marginBottom: 8 }}
                  tooltip="输入完整街道地址，系统将自动估算运输距离"
                >
                  <Input 
                    placeholder="输入街道地址..." 
                    onChange={handleAddressChange}
                  />
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
                  label="地址行1 (Address Line 1) 🌍"
                  rules={[{ required: true, message: '请输入地址行1' }]}
                  style={{ marginBottom: 8 }}
                  tooltip="输入完整街道地址，系统将自动估算运输距离"
                >
                  <Input 
                    placeholder="输入街道地址..." 
                    onChange={handleAddressChange}
                  />
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
              placeholder="系统自动估算"
              min={0}
              precision={1}
              value={estimatedDistance}
              onChange={(value) => {
                setEstimatedDistance(value || 0);
                setIsManualDistance(true);
              }}
            />
          </Form.Item>
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>
  );

  // 2025-10-28 重构：货物信息改为支持多行添加的表格式输入
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
        
        {/* 2025-10-28 新增：支持多行货物信息 */}
        <Col span={24}>
          <Form.List name="cargoItems" initialValue={[{}]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Card 
                    key={field.key} 
                    size="small" 
                    style={{ marginBottom: 12 }}
                    extra={
                      fields.length > 1 && (
                        <Button 
                          type="text" 
                          danger 
                          size="small"
                          onClick={() => remove(field.name)}
                        >
                          删除
                        </Button>
                      )
                    }
                  >
                    <Row gutter={[8, 0]}>
                      <Col span={3}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'length']}
                          label={`长${unitSystem}`}
                          rules={[{ required: true, message: '请输入长度' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber placeholder="长" min={0} precision={1} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'width']}
                          label={`宽${unitSystem}`}
                          rules={[{ required: true, message: '请输入宽度' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber placeholder="宽" min={0} precision={1} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'height']}
                          label={`高${unitSystem}`}
                          rules={[{ required: true, message: '请输入高度' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber placeholder="高" min={0} precision={1} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'weight']}
                          label={`重量${weightUnit}`}
                          rules={[{ required: true, message: '请输入重量' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber placeholder="重量" min={0} precision={1} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        <Form.Item {...field} name={[field.name, 'quantity']} label="件数" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                          <InputNumber placeholder="件数" min={1} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        <Form.Item {...field} name={[field.name, 'pallets']} label="托盘" style={{ marginBottom: 0 }}>
                          <InputNumber placeholder="托盘" min={0} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        <Form.Item {...field} name={[field.name, 'value']} label="价值" style={{ marginBottom: 0 }}>
                          <InputNumber placeholder="价值" min={0} precision={2} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item {...field} name={[field.name, 'description']} label="描述" style={{ marginBottom: 0 }}>
                          <Input placeholder="描述" />
                        </Form.Item>
                      </Col>
                      <Col span={1}>
                        <Form.Item {...field} name={[field.name, 'fragile']} label="易碎" valuePropName="checked" style={{ marginBottom: 0 }}>
                          <Switch size="small" />
                        </Form.Item>
                      </Col>
                      <Col span={1}>
                        <Form.Item {...field} name={[field.name, 'dangerous']} label="危险" valuePropName="checked" style={{ marginBottom: 0 }}>
                          <Switch size="small" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ marginTop: 8 }}>
                  添加货物
                </Button>
              </>
            )}
          </Form.List>
        </Col>
      </Row>
    </Card>
  );

  // 服务与保险模块 - 行间距缩小到8px // 2025-09-30 10:45:00
  // 渲染安全合规部分 - 2025-10-28 改为可折叠，默认关闭
  const renderSafetyComplianceSection = () => {
    const cargoType = Form.useWatch('cargoType', form);
    
    // 监听货物类型变化，如果是危险品则自动展开
    useEffect(() => {
      if (cargoType === 'DANGEROUS') {
        setSafetySectionActiveKeys(['safety-compliance']);
      } else if (cargoType && cargoType !== 'DANGEROUS') {
        // 如果不是危险品，自动折叠
        setSafetySectionActiveKeys([]);
      }
    }, [cargoType]);

    return (
      <Collapse 
        activeKey={safetySectionActiveKeys}
        onChange={(keys) => setSafetySectionActiveKeys(keys as string[])}
        style={{ marginBottom: 12 }}
      >
        <Collapse.Panel 
          header={<><SafetyCertificateOutlined /> 安全合规 <Text type="secondary" style={{ fontSize: '12px', marginLeft: 8 }}>(可选)</Text></>}
          key="safety-compliance"
        >
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
        </Collapse.Panel>
      </Collapse>
    );
  };

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
                  <div>${submittedData.cargoValue || 0}</div>
                </Col>
              </Row>
            </Col>
            <Col span={24}>
              <Title level={5}>费用预估</Title>
              <Text strong style={{ fontSize: '24px', color: '#1890ff' }}>
                ${realTimePricing.totalCost} {/* 2025-10-27 修复：使用实时计费数据而非submittedData中的旧数据 */}
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
    <div style={{ margin: '0 0 0 24px' }}>
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
              onValuesChange={handleFormChange}
              initialValues={{
                priority: 'vip1',
                addressType: 'residential',
                shipperCountry: 'CA',
                receiverCountry: 'CA',
                insurance: false,
                requiresTailgate: false,
                requiresAppointment: false,
                cargoIsFragile: false,
                cargoIsDangerous: false,
                // 字段初始值（订单元信息精简后保留） // 2025-10-01 10:24:10
                salesChannel: 'DIRECT',
                cargoType: 'GENERAL',
                requiresColdChain: false,
                needSignature: false,
              }}
            >
              
              {renderBasicInfoSection()}
              {renderAddressTimeSection()}
              
              {renderCargoSection()}
              {renderSafetyComplianceSection()}
              {renderServicesSection()}

              
              {renderRealTimePricing()}

              
              
              
                  
                  
                  
                  
                  
                  <Row gutter={16}>
                    <Col span={24}>
                      <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f5f5f5', borderRadius: '8px' }}>
                        <Title level={5}>运输距离估算</Title>
                        <Divider style={{ margin: '12px 0' }} />
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                          <div>
                            <Text type="secondary">当前估算距离：</Text>
                            <Text strong>{estimatedDistance} km</Text>
                          </div>
                          <div>
                            <Text type="secondary">估算方式：</Text>
                            <Text strong>基于城市间直线距离</Text>
                          </div>
                          <div>
                            <Text type="secondary">说明：</Text>
                            <Text strong>地图功能将在二期版本提供，当前使用简单距离估算</Text>
                          </div>
                        </Space>
                      </div>
                    </Col>
                  </Row>

              
              {renderOrderInfoSection()}

              
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

      
      <Modal
        title="新增客户"
        open={isAddCustomerModalVisible}
        onOk={handleAddCustomer}
        onCancel={() => {
          setIsAddCustomerModalVisible(false);
          customerForm.resetFields(); // 关闭时重置客户表单 // 2025-10-01 21:55:00
        }}
        okText="确认"
        cancelText="取消"
        width={800}
      >
        <Form form={customerForm} layout="vertical">
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
  );
};

export default ShipmentCreate;
