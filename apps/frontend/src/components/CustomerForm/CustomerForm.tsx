// 统一的客户创建/编辑表单组件
// 创建时间：2025-11-30T12:00:00Z
// 用途：统一客户创建和编辑表单，确保数据格式一致性和用户体验一致性

import React, { useEffect } from 'react';
import { Form, Input, Select, Row, Col, Divider, Space } from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  HomeOutlined, 
  BankOutlined,
  EnvironmentOutlined 
} from '@ant-design/icons';
import { Customer } from '../../types';
import {
  phoneValidationRule,
  emailOptionalValidationRule,
  postalCodeValidationRule,
  formatPostalCode,
} from '../../utils/validationRules';

const { Option } = Select;

interface CustomerFormProps {
  form: any; // Ant Design Form 实例
  initialValues?: Partial<Customer>;
  mode?: 'create' | 'edit';
}

/**
 * 加拿大省份选项
 */
const CANADIAN_PROVINCES = [
  { value: 'ON', label: '安大略省 (Ontario)' },
  { value: 'BC', label: '不列颠哥伦比亚省 (British Columbia)' },
  { value: 'QC', label: '魁北克省 (Quebec)' },
  { value: 'AB', label: '艾伯塔省 (Alberta)' },
  { value: 'MB', label: '曼尼托巴省 (Manitoba)' },
  { value: 'SK', label: '萨斯喀彻温省 (Saskatchewan)' },
  { value: 'NS', label: '新斯科舍省 (Nova Scotia)' },
  { value: 'NB', label: '新不伦瑞克省 (New Brunswick)' },
  { value: 'NL', label: '纽芬兰与拉布拉多省 (Newfoundland and Labrador)' },
  { value: 'PE', label: '爱德华王子岛省 (Prince Edward Island)' },
  { value: 'NT', label: '西北地区 (Northwest Territories)' },
  { value: 'YT', label: '育空地区 (Yukon)' },
  { value: 'NU', label: '努纳武特地区 (Nunavut)' },
];

/**
 * 客户等级选项（统一）
 */
const CUSTOMER_LEVELS = [
  { value: 'standard', label: '普通' },
  { value: 'premium', label: '高级' },
  { value: 'vip', label: 'VIP' },
];

const CustomerForm: React.FC<CustomerFormProps> = ({ form, initialValues, mode = 'create' }) => {
  useEffect(() => {
    if (initialValues && mode === 'edit') {
      // 填充表单数据
      const contactInfo = (initialValues as any).contactInfo || {};
      const address = contactInfo.address || {};
      const billingInfo = (initialValues as any).billingInfo || {};
      const billingAddress = billingInfo.billingAddress || {};
      
      form.setFieldsValue({
        name: initialValues.name,
        email: contactInfo.email || '',
        phone: contactInfo.phone || '',
        level: (initialValues as any).level || 'standard',
        // 地址信息
        pickupCountry: address.country || 'Canada',
        pickupProvince: address.state || '',
        pickupCity: address.city || '',
        pickupPostalCode: address.postalCode || '',
        pickupAddressLine1: address.street || '',
        pickupAddressLine2: address.addressLine2 || '',
        // 账单信息
        companyName: billingInfo.companyName || initialValues.name,
        taxId: billingInfo.taxId || '',
        billingStreet: billingAddress.street || address.street || '',
        billingCity: billingAddress.city || address.city || '',
        billingProvince: billingAddress.state || address.state || '',
        billingPostalCode: billingAddress.postalCode || address.postalCode || '',
        billingCountry: billingAddress.country || address.country || 'Canada',
        paymentTerms: billingInfo.paymentTerms || 'Net 30',
      });
    }
  }, [initialValues, mode, form]);

  return (
    <Form 
      form={form} 
      layout="vertical" 
      requiredMark={false}
      style={{ 
        maxWidth: '100%',
      }}
    >
      {/* 基本信息 */}
      <div style={{ marginBottom: 24 }}>
        <Space style={{ marginBottom: 16, fontSize: 14, color: '#8c8c8c', fontWeight: 500 }}>
          <UserOutlined />
          <span>基本信息</span>
        </Space>
        
        <Form.Item
          name="name"
          label={<span style={{ fontSize: 13, fontWeight: 500 }}>客户姓名</span>}
          style={{ marginBottom: 16 }}
        >
          <Input 
            placeholder="请输入客户姓名（可选）" 
            size="large"
            style={{ borderRadius: 6 }}
          />
        </Form.Item>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="email"
              label={<span style={{ fontSize: 13, fontWeight: 500 }}>邮箱</span>}
              rules={emailOptionalValidationRule}
              style={{ marginBottom: 16 }}
            >
              <Input 
                prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="example@email.com（可选）" 
                size="large"
                style={{ borderRadius: 6 }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="phone"
              label={<span style={{ fontSize: 13, fontWeight: 500 }}>电话</span>}
              rules={[phoneValidationRule]}
              style={{ marginBottom: 16 }}
            >
              <Input 
                prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="416-123-4567（可选）" 
                size="large"
                style={{ borderRadius: 6 }}
              />
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item
          name="level"
          label={<span style={{ fontSize: 13, fontWeight: 500 }}>客户等级</span>}
          initialValue="standard"
          style={{ marginBottom: 0 }}
        >
          <Select 
            size="large"
            style={{ borderRadius: 6 }}
          >
            {CUSTOMER_LEVELS.map(level => (
              <Option key={level.value} value={level.value}>
                {level.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </div>
      
      <Divider style={{ margin: '24px 0' }}>
        <Space>
          <EnvironmentOutlined style={{ color: '#8c8c8c' }} />
          <span style={{ fontSize: 13, color: '#8c8c8c', fontWeight: 500 }}>默认地址设置（可选）</span>
        </Space>
      </Divider>
      
      <div style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="pickupCountry"
              label={<span style={{ fontSize: 13, fontWeight: 500 }}>国家</span>}
              initialValue="Canada"
              style={{ marginBottom: 16 }}
            >
              <Select 
                placeholder="选择国家（可选）"
                size="large"
                style={{ borderRadius: 6 }}
              >
                <Option value="Canada">加拿大 (Canada)</Option>
                <Option value="US">美国 (United States)</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="pickupProvince"
              label={<span style={{ fontSize: 13, fontWeight: 500 }}>省份/州</span>}
              style={{ marginBottom: 16 }}
            >
              <Select
                placeholder="选择省份（可选）"
                showSearch
                allowClear
                size="large"
                style={{ borderRadius: 6 }}
                filterOption={(input, option) =>
                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {CANADIAN_PROVINCES.map(province => (
                  <Option key={province.value} value={province.value}>
                    {province.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="pickupCity"
              label={<span style={{ fontSize: 13, fontWeight: 500 }}>城市</span>}
              style={{ marginBottom: 16 }}
            >
              <Input 
                placeholder="例如：Toronto, Vancouver（可选）" 
                size="large"
                style={{ borderRadius: 6 }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="pickupPostalCode"
              label={<span style={{ fontSize: 13, fontWeight: 500 }}>邮政编码</span>}
              rules={[postalCodeValidationRule]}
              style={{ marginBottom: 16 }}
            >
              <Input 
                placeholder="A1A 1A1（可选）" 
                size="large"
                style={{ borderRadius: 6 }}
                onChange={(e) => {
                  const formatted = formatPostalCode(e.target.value);
                  if (formatted !== e.target.value) {
                    form.setFieldsValue({ pickupPostalCode: formatted });
                  }
                }}
              />
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item
          name="pickupAddressLine1"
          label={<span style={{ fontSize: 13, fontWeight: 500 }}>地址行1</span>}
          style={{ marginBottom: 16 }}
        >
          <Input 
            placeholder="例如：123 Main Street（可选）" 
            size="large"
            style={{ borderRadius: 6 }}
          />
        </Form.Item>
        
        <Form.Item
          name="pickupAddressLine2"
          label={<span style={{ fontSize: 13, fontWeight: 500 }}>地址行2</span>}
          style={{ marginBottom: 0 }}
        >
          <Input 
            placeholder="例如：Suite 100, Unit 5（可选）" 
            size="large"
            style={{ borderRadius: 6 }}
          />
        </Form.Item>
      </div>
      
      <Divider style={{ margin: '24px 0' }}>
        <Space>
          <BankOutlined style={{ color: '#8c8c8c' }} />
          <span style={{ fontSize: 13, color: '#8c8c8c', fontWeight: 500 }}>账单信息（可选）</span>
        </Space>
      </Divider>
      
      <div>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="companyName"
              label={<span style={{ fontSize: 13, fontWeight: 500 }}>公司名称</span>}
              style={{ marginBottom: 16 }}
            >
              <Input 
                placeholder="公司名称（可选）" 
                size="large"
                style={{ borderRadius: 6 }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="taxId"
              label={<span style={{ fontSize: 13, fontWeight: 500 }}>税号</span>}
              style={{ marginBottom: 16 }}
            >
              <Input 
                placeholder="税号（可选）" 
                size="large"
                style={{ borderRadius: 6 }}
              />
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="billingProvince"
              label={<span style={{ fontSize: 13, fontWeight: 500 }}>账单地址-省份/州</span>}
              style={{ marginBottom: 16 }}
            >
              <Select
                placeholder="选择省份（可选）"
                showSearch
                allowClear
                size="large"
                style={{ borderRadius: 6 }}
              >
                {CANADIAN_PROVINCES.map(province => (
                  <Option key={province.value} value={province.value}>
                    {province.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="billingCity"
              label={<span style={{ fontSize: 13, fontWeight: 500 }}>账单地址-城市</span>}
              style={{ marginBottom: 16 }}
            >
              <Input 
                placeholder="城市（可选）" 
                size="large"
                style={{ borderRadius: 6 }}
              />
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="billingPostalCode"
              label={<span style={{ fontSize: 13, fontWeight: 500 }}>账单地址-邮政编码</span>}
              rules={[postalCodeValidationRule]}
              style={{ marginBottom: 16 }}
            >
              <Input 
                placeholder="A1A 1A1（可选）"
                size="large"
                style={{ borderRadius: 6 }}
                onChange={(e) => {
                  const formatted = formatPostalCode(e.target.value);
                  if (formatted !== e.target.value) {
                    form.setFieldsValue({ billingPostalCode: formatted });
                  }
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="billingCountry"
              label={<span style={{ fontSize: 13, fontWeight: 500 }}>账单地址-国家</span>}
              initialValue="Canada"
              style={{ marginBottom: 16 }}
            >
              <Select 
                size="large"
                style={{ borderRadius: 6 }}
              >
                <Option value="Canada">加拿大 (Canada)</Option>
                <Option value="US">美国 (United States)</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item
          name="billingStreet"
          label={<span style={{ fontSize: 13, fontWeight: 500 }}>账单地址-街道</span>}
          style={{ marginBottom: 16 }}
        >
          <Input 
            placeholder="街道地址（可选）" 
            size="large"
            style={{ borderRadius: 6 }}
          />
        </Form.Item>
        
        <Form.Item
          name="paymentTerms"
          label={<span style={{ fontSize: 13, fontWeight: 500 }}>付款条款</span>}
          initialValue="Net 30"
          style={{ marginBottom: 0 }}
        >
          <Input 
            placeholder="例如：Net 30（可选）" 
            size="large"
            style={{ borderRadius: 6 }}
          />
        </Form.Item>
      </div>
    </Form>
  );
};

/**
 * 将表单数据转换为后端API期望的格式
 */
export const transformCustomerFormData = (values: any) => {
  return {
    name: values.name,
    level: values.level || 'standard',
    contactInfo: {
      email: values.email || '',
      phone: values.phone,
      address: {
        street: values.pickupAddressLine1 || '',
        addressLine2: values.pickupAddressLine2 || '',
        city: values.pickupCity || '',
        state: values.pickupProvince || '',
        postalCode: values.pickupPostalCode || '',
        country: values.pickupCountry || 'Canada'
      },
      contactPerson: values.name
    },
    billingInfo: {
      companyName: values.companyName || values.name,
      taxId: values.taxId || 'N/A',
      billingAddress: {
        street: (values.billingStreet || values.pickupAddressLine1 || '') + 
                (values.pickupAddressLine2 ? `, ${values.pickupAddressLine2}` : ''),
        city: values.billingCity || values.pickupCity || '',
        state: values.billingProvince || values.pickupProvince || '',
        postalCode: values.billingPostalCode || values.pickupPostalCode || '',
        country: values.billingCountry || values.pickupCountry || 'Canada'
      },
      paymentTerms: values.paymentTerms || 'Net 30'
    }
  };
};

export default CustomerForm;

