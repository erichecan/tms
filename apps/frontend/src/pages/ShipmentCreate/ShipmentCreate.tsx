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
} from 'antd';
import {
  TruckOutlined,
  EnvironmentOutlined,
  InboxOutlined,
  SafetyOutlined,
  HomeOutlined,
  ShopOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { shipmentsApi, customersApi } from '../../services/api';
import dayjs, { type Dayjs } from 'dayjs'; // 添加 dayjs 导入用于日期处理 // 2025-09-26 03:30:00

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;



const ShipmentCreate: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [unitSystem, setUnitSystem] = useState<'cm' | 'inch'>('cm');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  
  // 提交确认模式
  const [isConfirmMode, setIsConfirmMode] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);

  // 从localStorage恢复表单状态
  const CACHE_KEY = 'shipment_form_cache';
  
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

  // 商品库数据
  const productLibrary = [
    { id: '1', name: '标准纸箱', length: 30, width: 20, height: 15, weight: 0.5, unit: 'cm' },
    { id: '2', name: '大号纸箱', length: 50, width: 35, height: 25, weight: 1.2, unit: 'cm' },
    { id: '3', name: '小型包裹', length: 20, width: 15, height: 10, weight: 0.3, unit: 'cm' },
    { id: '4', name: '托盘货物', length: 120, width: 80, height: 15, weight: 25, unit: 'cm' },
    { id: '5', name: '家具', length: 200, width: 80, height: 40, weight: 50, unit: 'cm' },
    { id: '6', name: '电子产品', length: 40, width: 30, height: 20, weight: 2, unit: 'cm' },
  ];

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

  // 处理商品库选择
  const handleProductSelect = (product: any) => {
    const { length, width, height, weight, unit } = product;
    
    // 转换单位
    let finalLength = length;
    let finalWidth = width;
    let finalHeight = height;
    
    if (unit === 'cm' && unitSystem === 'inch') {
      finalLength = convertToInch(length);
      finalWidth = convertToInch(width);
      finalHeight = convertToInch(height);
    } else if (unit === 'inch' && unitSystem === 'cm') {
      finalLength = convertToCm(length);
      finalWidth = convertToCm(width);
      finalHeight = convertToCm(height);
    }
    
    form.setFieldsValue({
      cargoLength: parseFloat(finalLength.toFixed(1)),
      cargoWidth: parseFloat(finalWidth.toFixed(1)),
      cargoHeight: parseFloat(finalHeight.toFixed(1)),
      cargoWeight: weight,
      cargoDescription: product.name
    });
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
        customerId: values.customerId,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        customerEmail: values.customerEmail,
        priority: values.priority,
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
  const renderBasicInfoSection = () => (
    <Card title="基础信息" style={{ marginBottom: 12 }}>
      <Row gutter={[12, 8]}>
        <Col span={12}>
          <Form.Item
            name="customerId"
            label="客户选择"
            rules={[{ required: true, message: '请选择客户' }]}
          >
            <Select
              showSearch
              placeholder="搜索并选择客户"
              optionFilterProp="children"
              onSearch={handleCustomerSearch}
              loading={customerSearchLoading}
              filterOption={false}
              notFoundContent={customerSearchLoading ? '搜索中...' : '暂无客户'}
              allowClear
            >
              {customers.map(customer => (
                <Option key={customer.id} value={customer.id}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{customer.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {customer.contactInfo?.phone} • {customer.email}
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
            label="客户姓名"
            rules={[{ required: true, message: '请输入客户姓名' }]}
          >
            <Input placeholder="请输入客户姓名" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="customerPhone"
            label="联系电话"
            rules={[
              { required: true, message: '请输入联系电话' },
              { 
                pattern: /^(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$|^1[3-9]\d{9}$/, 
                message: '请输入有效的手机号码（支持北美和中国格式）' 
              }
            ]}
          >
            <Input placeholder="请输入联系电话（如：+1-555-123-4567 或 13812345678）" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="customerEmail"
            label="邮箱地址"
            rules={[
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱地址" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="priority"
            label="优先级"
          >
            <Select>
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

  // 地址与时间模块 - 修改为左右布局，符合北美地址习惯 // 2025-01-27 15:30:00
  const renderAddressTimeSection = () => (
    <Card title="地址与时间" style={{ marginBottom: 12 }}>
      <Row gutter={[16, 8]}>
        {/* 发货人信息 - 左侧 */}
        <Col span={12}>
          <Card size="small" title={
            <span>
              <EnvironmentOutlined /> 发货人信息 (Shipper)
            </span>
          } style={{ height: '100%' }}>
            <Row gutter={[8, 6]}>
        <Col span={24}>
                <Form.Item
                  name="shipperName"
                  label="发货人姓名"
                  rules={[{ required: true, message: '请输入发货人姓名' }]}
                >
                  <Input placeholder="请输入发货人姓名" />
                </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item
                  name="shipperCompany"
                  label="公司名称"
          >
                  <Input placeholder="请输入公司名称（可选）" />
          </Form.Item>
        </Col>
              <Col span={24}>
                <Form.Item
                  name="shipperAddress1"
                  label="地址行1 (Address Line 1)"
                  rules={[{ required: true, message: '请输入地址行1' }]}
                >
                  <Input placeholder="请输入街道地址" />
          </Form.Item>
        </Col>
              <Col span={24}>
                <Form.Item
                  name="shipperAddress2"
                  label="地址行2 (Address Line 2)"
                >
                  <Input placeholder="请输入公寓号、套房号等（可选）" />
          </Form.Item>
        </Col>
              <Col span={12}>
                <Form.Item
                  name="shipperCity"
                  label="城市 (City)"
                  rules={[{ required: true, message: '请输入城市' }]}
                >
                  <Input placeholder="请输入城市" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="shipperProvince"
                  label="省份/州 (Province/State)"
                  rules={[{ required: true, message: '请输入省份/州' }]}
                >
                  <Input placeholder="请输入省份/州" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="shipperPostalCode"
                  label="邮政编码 (Postal Code)"
                  rules={[{ required: true, message: '请输入邮政编码' }]}
                >
                  <Input placeholder="请输入邮政编码" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="shipperCountry"
                  label="国家 (Country)"
                  rules={[{ required: true, message: '请选择国家' }]}
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
                  label="联系电话"
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
                  label="邮箱地址"
                  rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
                >
                  <Input placeholder="请输入邮箱地址（可选）" />
                </Form.Item>
              </Col>
              <Col span={24}>
          <Form.Item name="pickupDate" label="取货日期" rules={[{ required: true, message: '请选择取货日期' }]}>
            <DatePicker 
              format="YYYY-MM-DD"
              style={{ width: '100%' }} 
              placeholder="选择取货日期"
              disabledDate={(current) => current && current < dayjs().startOf('day')} // 禁用过去的日期 // 2025-09-26 03:30:00
            />
          </Form.Item>
        </Col>
              <Col span={24}>
          <Form.Item name="pickupTimeRange" label="取货时间段(小时)" rules={[{ required: true, message: '请选择取货时间段' }]}>
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
            <Row gutter={[12, 12]}>
        <Col span={24}>
                <Form.Item
                  name="receiverName"
                  label="收货人姓名"
                  rules={[{ required: true, message: '请输入收货人姓名' }]}
                >
                  <Input placeholder="请输入收货人姓名" />
                </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item
                  name="receiverCompany"
                  label="公司名称"
          >
                  <Input placeholder="请输入公司名称（可选）" />
          </Form.Item>
        </Col>
              <Col span={24}>
                <Form.Item
                  name="receiverAddress1"
                  label="地址行1 (Address Line 1)"
                  rules={[{ required: true, message: '请输入地址行1' }]}
                >
                  <Input placeholder="请输入街道地址" />
          </Form.Item>
        </Col>
              <Col span={24}>
                <Form.Item
                  name="receiverAddress2"
                  label="地址行2 (Address Line 2)"
                >
                  <Input placeholder="请输入公寓号、套房号等（可选）" />
          </Form.Item>
        </Col>
              <Col span={12}>
                <Form.Item
                  name="receiverCity"
                  label="城市 (City)"
                  rules={[{ required: true, message: '请输入城市' }]}
                >
                  <Input placeholder="请输入城市" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="receiverProvince"
                  label="省份/州 (Province/State)"
                  rules={[{ required: true, message: '请输入省份/州' }]}
                >
                  <Input placeholder="请输入省份/州" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="receiverPostalCode"
                  label="邮政编码 (Postal Code)"
                  rules={[{ required: true, message: '请输入邮政编码' }]}
                >
                  <Input placeholder="请输入邮政编码" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="receiverCountry"
                  label="国家 (Country)"
                  rules={[{ required: true, message: '请选择国家' }]}
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
                  label="联系电话"
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
                  name="receiverEmail"
                  label="邮箱地址"
                  rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
                >
                  <Input placeholder="请输入邮箱地址（可选）" />
                </Form.Item>
              </Col>
              <Col span={24}>
          <Form.Item name="deliveryDate" label="送达日期" rules={[{ required: true, message: '请选择送达日期' }]}>
            <DatePicker 
              format="YYYY-MM-DD"
              style={{ width: '100%' }} 
              placeholder="选择送达日期"
              disabledDate={(current) => current && current < dayjs().startOf('day')} // 禁用过去的日期 // 2025-09-26 03:30:00
            />
          </Form.Item>
        </Col>
              <Col span={24}>
          <Form.Item name="deliveryTimeRange" label="送达时间段(小时)" rules={[{ required: true, message: '请选择送达时间段' }]}>
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
          <Form.Item name="addressType" label="地址类型">
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
          <Form.Item name="distance" label="预估距离 (公里)">
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
            label="箱数/件数"
            rules={[{ required: true, message: '请输入数量' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="数量"
              min={1}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="cargoPalletCount" label="托盘数">
            <InputNumber
              style={{ width: '100%' }}
              placeholder="托盘数"
              min={0}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="cargoValue" label="货物价值 (元)">
            <InputNumber
              style={{ width: '100%' }}
              placeholder="货物价值"
              min={0}
              precision={2}
            />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item label="快速选择商品">
            <Select
              placeholder="从商品库中选择常用商品"
              allowClear
              onSelect={handleProductSelect}
              style={{ marginBottom: '12px' }}
            >
              {productLibrary.map(product => (
                <Option key={product.id} value={product.id}>
                  {product.name} ({product.length}×{product.width}×{product.height} {product.unit}, {product.weight}kg)
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="cargoDescription" label="货物描述">
            <TextArea
              rows={3}
              placeholder="请详细描述货物内容、包装方式等"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="cargoIsFragile" label="易碎品" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="cargoIsDangerous" label="危险品" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  // 服务与保险模块 // 2025-09-24 14:05:00
  const renderServicesSection = () => (
    <Card title="服务与保险" style={{ marginBottom: 12 }}>
      <Row gutter={[12, 8]}>
        <Col span={24}>
          <Title level={5}>
            <SafetyOutlined /> 保险服务
          </Title>
        </Col>
        <Col span={12}>
          <Form.Item name="insurance" label="购买保险" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="保险金额 (元)"
            shouldUpdate={(prevValues, currentValues) => prevValues.insurance !== currentValues.insurance}
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
          <Form.Item name="requiresTailgate" label="需要尾板" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="requiresAppointment" label="需要预约" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="waitingTime" label="等候时间 (分钟)">
            <InputNumber
              style={{ width: '100%' }}
              placeholder="等候时间"
              min={0}
              max={480}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="deliveryInstructions" label="配送说明">
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
          <Form.Item name="specialRequirements" label="选择特殊需求">
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
    <div style={{ minHeight: '100vh', padding: '16px', backgroundColor: '#f5f5f5' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Card>
          <div style={{ marginBottom: '16px' }}>
            <Title level={2}>
              <TruckOutlined /> 创建运单
            </Title>
            <Text type="secondary">请填写运单信息</Text>
          </div>

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
              }}
            >
              {/* 单页布局 - 显示所有模块 */}
              {renderBasicInfoSection()}
              {renderAddressTimeSection()}
              {renderCargoSection()}
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
      </div>
    </div>
  );
};

export default ShipmentCreate;
