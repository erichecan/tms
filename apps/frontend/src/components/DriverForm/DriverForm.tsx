// 统一的司机创建/编辑表单组件
// 创建时间：2025-11-30T12:15:00Z
// 用途：统一司机创建和编辑表单，确保数据格式一致性和用户体验一致性

import React, { useEffect } from 'react';
import { Form, Input, Select } from 'antd';
import { Driver } from '../../types';
import {
  phoneValidationRule,
  extractPhoneDigits,
} from '../../utils/validationRules';

const { Option } = Select;

interface DriverFormProps {
  form: any; // Ant Design Form 实例
  initialValues?: Partial<Driver>;
  mode?: 'create' | 'edit' | 'quick'; // quick 模式用于快速添加，字段较少
}

/**
 * 英语水平选项
 */
const ENGLISH_LEVELS = [
  { value: 'basic', label: 'Basic' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'fluent', label: 'Fluent' },
];

/**
 * 其他语言选项
 */
const OTHER_LANGUAGES = [
  { value: 'mandarin', label: '普通话' },
  { value: 'cantonese', label: '广东话' },
  { value: 'french', label: '法语' },
  { value: 'spanish', label: '西班牙语' },
  { value: 'punjabi', label: '旁遮普语' },
];

/**
 * 加拿大驾照等级选项
 */
const LICENSE_CLASSES = [
  { value: 'G', label: 'Class G (Ontario)' },
  { value: 'G1', label: 'Class G1' },
  { value: 'G2', label: 'Class G2' },
  { value: 'AZ', label: 'Class AZ (Tractor-Trailer)' },
  { value: 'DZ', label: 'Class DZ (Straight Truck)' },
  { value: 'CZ', label: 'Class CZ (Bus)' },
  { value: 'BZ', label: 'Class BZ (School Bus)' },
  { value: 'M', label: 'Class M (Motorcycle)' },
];

const DriverForm: React.FC<DriverFormProps> = ({ form, initialValues, mode = 'create' }) => {
  useEffect(() => {
    if (initialValues && mode === 'edit') {
      form.setFieldsValue({
        name: initialValues.name,
        phone: initialValues.phone,
        age: initialValues.age,
        licenseNumber: initialValues.licenseNumber,
        englishLevel: initialValues.englishLevel,
        otherLanguages: initialValues.otherLanguages || [],
        licenseClass: initialValues.licenseClass,
      });
    }
  }, [initialValues, mode, form]);

  const isQuickMode = mode === 'quick';

  return (
    <Form form={form} layout="vertical">
      <Form.Item
        name="name"
        label="姓名"
        rules={[{ required: true, message: '请输入姓名' }]}
      >
        <Input placeholder="张三" />
      </Form.Item>
      
      {!isQuickMode && (
        <Form.Item
          name="age"
          label="年龄"
          rules={[{ required: false, message: '请输入年龄' }]}
        >
          <Input type="number" placeholder="30（可选）" />
        </Form.Item>
      )}
      
      <Form.Item
        name="phone"
        label="手机号"
        rules={[
          { required: true, message: '请输入手机号' },
          phoneValidationRule
        ]}
      >
        <Input placeholder="416-555-1234 或 (416) 555-1234" />
      </Form.Item>
      
      <Form.Item
        name="licenseNumber"
        label="驾照号"
        rules={isQuickMode ? [{ required: true, message: '请输入驾照号' }] : []}
      >
        <Input placeholder="请输入驾照号" />
      </Form.Item>
      
      <Form.Item
        name="englishLevel"
        label="英语水平"
        rules={[{ required: false }]}
      >
        <Select placeholder="选择英语水平（可选）">
          {ENGLISH_LEVELS.map(level => (
            <Option key={level.value} value={level.value}>
              {level.label}
            </Option>
          ))}
        </Select>
      </Form.Item>
      
      <Form.Item
        name="otherLanguages"
        label="其他语言"
      >
        <Select
          mode="multiple"
          placeholder="选择其他语言"
        >
          {OTHER_LANGUAGES.map(lang => (
            <Option key={lang.value} value={lang.value}>
              {lang.label}
            </Option>
          ))}
        </Select>
      </Form.Item>
      
      <Form.Item
        name="licenseClass"
        label="驾照等级（加拿大）"
        rules={[{ required: false }]}
      >
        <Select placeholder="选择驾照等级（可选）">
          {LICENSE_CLASSES.map(license => (
            <Option key={license.value} value={license.value}>
              {license.label}
            </Option>
          ))}
        </Select>
      </Form.Item>
    </Form>
  );
};

/**
 * 将表单数据转换为后端API期望的格式
 */
export const transformDriverFormData = (values: any, mode: 'create' | 'edit' | 'quick' = 'create') => {
  const phoneDigitsOnly = extractPhoneDigits(values.phone);
  
  const baseData: any = {
    name: values.name,
    phone: phoneDigitsOnly, // 只发送数字
    status: 'available',
  };
  
  if (values.age) {
    baseData.age = values.age;
  }
  
  if (values.licenseNumber) {
    baseData.licenseNumber = values.licenseNumber;
  } else if (mode === 'quick') {
    // 快速模式：如果没有填写驾照号，生成一个临时驾照号
    baseData.licenseNumber = `LIC${Date.now()}`;
  }
  
  if (values.englishLevel) {
    baseData.englishLevel = values.englishLevel;
  }
  
  if (values.otherLanguages && values.otherLanguages.length > 0) {
    baseData.otherLanguages = values.otherLanguages;
  }
  
  if (values.licenseClass) {
    baseData.licenseClass = values.licenseClass;
  }
  
  // 快速模式：后端API要求vehicleInfo，但我们在前端不显示给用户，使用默认值
  if (mode === 'quick') {
    baseData.vehicleInfo = {
      type: 'van',
      licensePlate: `TEMP${Date.now()}`, // 临时车牌号，后端会自动处理
      capacity: 1000, // 默认载重
      dimensions: {
        length: 300, // 默认长度
        width: 200,  // 默认宽度
        height: 200  // 默认高度
      }
    };
  }
  
  return baseData;
};

export default DriverForm;

