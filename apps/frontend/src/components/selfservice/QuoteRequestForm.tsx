// 询价表单组件
// 创建时间: 2025-12-05 12:00:00
// 作用: 客户下单询价表单

import React, { useState } from 'react';
import { Form, Input, InputNumber, DatePicker, Checkbox, Button, Card, Row, Col, Space, message, Result } from 'antd';
import { PhoneOutlined, MailOutlined, EnvironmentOutlined, InfoCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import AddressAutocomplete from '../AddressAutocomplete/AddressAutocomplete';
import dayjs, { Dayjs } from 'dayjs';

const { TextArea } = Input;

// 服务类型选项
const SERVICE_OPTIONS = [
  { label: '整车 (FTL)', value: 'FTL' },
  { label: '零担 (LTL)', value: 'LTL' },
  { label: '空运 (AIR)', value: 'AIR' },
  { label: '海运 (SEA)', value: 'SEA' },
  { label: '加急 (EXPRESS)', value: 'EXPRESS' },
  { label: '冷链 (COLD)', value: 'COLD' },
];

interface QuoteRequestFormProps {
  onSuccess?: (data: { id: string; code: string; status: string }) => void;
}

const QuoteRequestForm: React.FC<QuoteRequestFormProps> = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [successData, setSuccessData] = useState<{ id: string; code: string; status: string } | null>(null);
  const [originAddressInfo, setOriginAddressInfo] = useState<any>(null);
  const [destinationAddressInfo, setDestinationAddressInfo] = useState<any>(null);

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      // 格式化日期
      const shipDate = values.shipDate ? dayjs(values.shipDate).format('YYYY-MM-DD') : '';

      // 构建请求体 - 2025-12-12 00:15:00 添加 pallets 字段
      const payload = {
        company: values.company || undefined,
        contactName: values.contactName,
        email: values.email,
        phone: values.phone || undefined,
        origin: values.origin,
        destination: values.destination,
        shipDate,
        weightKg: values.weightKg,
        volume: values.volume || undefined,
        pieces: values.pieces || undefined,
        pallets: values.pallets || undefined, // 2025-12-12 00:15:00 添加托盘数量
        services: values.services,
        note: values.note || undefined,
        consent: values.consent,
      };

      // 发送请求
      const response = await fetch('/api/v1/quote-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || '提交失败，请稍后重试');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setSuccessData(result.data);
        setDone(true);
        message.success('已收到您的询价，我们会尽快联系您。');
        onSuccess?.(result.data);
      } else {
        throw new Error('提交失败，请稍后重试');
      }
    } catch (error: any) {
      console.error('提交询价失败:', error);
      message.error(error.message || '提交失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 成功页面
  if (done && successData) {
    return (
      <Card>
        <Result
          status="success"
          title="已收到您的询价"
          subTitle={`询价编号：${successData.code}。我们会尽快联系您（通常 1 个工作日内）。`}
          extra={[
            <Button type="primary" key="new" onClick={() => {
              setDone(false);
              setSuccessData(null);
              form.resetFields();
            }}>
              提交新的询价
            </Button>,
          ]}
        />
      </Card>
    );
  }

  return (
    <Card>
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        initialValues={{
          services: [],
        }}
      >
        {/* 联系方式 */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>联系方式</h3>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="company"
                label="公司名"
              >
                <Input prefix={<InfoCircleOutlined />} placeholder="可选" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contactName"
                label="联系人姓名"
                rules={[{ required: true, message: '请输入联系人姓名' }]}
              >
                <Input prefix={<InfoCircleOutlined />} placeholder="必填" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="必填" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="电话"
              >
                <Input prefix={<PhoneOutlined />} placeholder="可选" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* 货物信息 */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>货物信息</h3>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="origin"
                label="起始地"
                rules={[{ required: true, message: '请输入起始地' }]}
              >
                <AddressAutocomplete
                  placeholder="输入起始地址（支持自动完成）..."
                  onChange={(address, addressInfo) => {
                    form.setFieldsValue({ origin: address });
                    setOriginAddressInfo(addressInfo);
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="destination"
                label="目的地"
                rules={[{ required: true, message: '请输入目的地' }]}
              >
                <AddressAutocomplete
                  placeholder="输入目的地地址（支持自动完成）..."
                  onChange={(address, addressInfo) => {
                    form.setFieldsValue({ destination: address });
                    setDestinationAddressInfo(addressInfo);
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="shipDate"
                label="预计发货日期"
                rules={[{ required: true, message: '请选择预计发货日期' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                  placeholder="选择日期"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="weightKg"
                label="重量 (kg)"
                rules={[
                  { required: true, message: '请输入重量' },
                  { type: 'number', min: 0.01, message: '重量必须大于0' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0.01}
                  step={0.01}
                  placeholder="必填"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="pieces"
                label="件数"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  placeholder="可选"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              {/* 2025-12-12 00:15:00 添加托盘数量字段 */}
              <Form.Item
                name="pallets"
                label="托盘数量"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="可选"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="volume"
                label="体积 (m³)"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0.01}
                  step={0.01}
                  placeholder="可选"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="volume"
                label="体积 (m³)"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0.01}
                  step={0.01}
                  placeholder="可选"
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* 服务类型 */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>服务类型</h3>
          <Form.Item
            name="services"
            rules={[
              { required: true, message: '请至少选择一个服务类型' },
              { type: 'array', min: 1, message: '请至少选择一个服务类型' },
            ]}
          >
            <Checkbox.Group options={SERVICE_OPTIONS} />
          </Form.Item>
        </div>

        {/* 备注 */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>备注</h3>
          <Form.Item
            name="note"
            rules={[
              { max: 500, message: '备注不能超过500字' },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="可选，最多500字"
              showCount
              maxLength={500}
            />
          </Form.Item>
        </div>

        {/* 同意条款 */}
        <Form.Item
          name="consent"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) => {
                if (!value) {
                  return Promise.reject(new Error('必须同意被联系'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Checkbox>
            我同意被联系（必选）
          </Checkbox>
        </Form.Item>

        {/* 提交按钮 */}
        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<CheckCircleOutlined />}
              size="large"
            >
              提交询价
            </Button>
            <Button onClick={() => form.resetFields()}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default QuoteRequestForm;

