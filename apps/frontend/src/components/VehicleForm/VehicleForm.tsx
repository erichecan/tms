// 统一的车辆创建/编辑表单组件
// 创建时间：2025-11-30T12:20:00Z
// 用途：统一车辆创建和编辑表单，确保数据格式一致性和错误处理统一

import React, { useEffect } from 'react';
import { Form, Input, Select } from 'antd';
import { Vehicle } from '../../types';

const { Option } = Select;

interface VehicleFormProps {
  form: any; // Ant Design Form 实例
  initialValues?: Partial<Vehicle>;
  mode?: 'create' | 'edit';
}

/**
 * 车型选项（统一）
 */
const VEHICLE_TYPES = [
  { value: 'van', label: '厢式货车' },
  { value: 'truck', label: '平板车' },
  { value: 'trailer', label: '冷链车' },
  { value: 'pickup', label: '皮卡车' },
  { value: 'suv', label: 'SUV' },
];

const VehicleForm: React.FC<VehicleFormProps> = ({ form, initialValues, mode = 'create' }) => {
  useEffect(() => {
    if (initialValues && mode === 'edit') {
      form.setFieldsValue({
        plateNumber: initialValues.plateNumber,
        type: initialValues.type,
        capacityKg: initialValues.capacityKg,
      });
    }
  }, [initialValues, mode, form]);

  return (
    <Form form={form} layout="vertical">
      <Form.Item
        name="plateNumber"
        label="车牌号"
        rules={[{ required: true, message: '请输入车牌号' }]}
      >
        <Input placeholder="例如：ABC-1234" />
      </Form.Item>
      
      <Form.Item
        name="type"
        label="车型"
        rules={[{ required: true, message: '请选择车型' }]}
      >
        <Select placeholder="选择车型">
          {VEHICLE_TYPES.map(type => (
            <Option key={type.value} value={type.value}>
              {type.label}
            </Option>
          ))}
        </Select>
      </Form.Item>
      
      <Form.Item
        name="capacityKg"
        label="载重(kg)"
        rules={[
          { required: true, message: '请输入载重' },
          { type: 'number', min: 0, message: '载重必须大于0' }
        ]}
      >
        <Input type="number" placeholder="3000" />
      </Form.Item>
    </Form>
  );
};

/**
 * 将表单数据转换为后端API期望的格式
 */
export const transformVehicleFormData = (values: any) => {
  return {
    plateNumber: values.plateNumber,
    type: values.type,
    capacityKg: Number(values.capacityKg || 0),
    status: 'available'
  };
};

export default VehicleForm;

