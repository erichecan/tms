// 2025-11-11 10:15:05 新增：客户自助服务入口页面
import React, { useState } from 'react';
import { Card, Form, Input, InputNumber, Button, Tabs, Typography, Row, Col, Divider, Space, message, Result, Descriptions, Modal } from 'antd';
import { PhoneOutlined, MailOutlined, EnvironmentOutlined, InfoCircleOutlined, CheckCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { shipmentsApi } from '../../services/api';
import { Shipment } from '../../types';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CustomerPortal: React.FC = () => {
  const [createForm] = Form.useForm();
  const [lookupForm] = Form.useForm();
  const [createdShipmentNo, setCreatedShipmentNo] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<Shipment | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const handleCreateShipment = async () => {
    try {
      const values = await createForm.validateFields();
      setCreateLoading(true);

      const duplicateResponse = await shipmentsApi.getShipments({
        customerPhone: values.customerPhone,
        status: ['pending', 'confirmed', 'assigned'],
        limit: 1,
      });
      const duplicates = duplicateResponse.data?.data || [];
      if (duplicates.length > 0) {
        const shouldContinue = await new Promise<boolean>((resolve) => {
          Modal.confirm({
            title: '发现未完成的运单',
            content: '系统检测到该联系电话存在未完成的运单，确认继续创建新的运单吗？',
            okText: '继续创建',
            cancelText: '取消',
            onOk: () => resolve(true),
            onCancel: () => resolve(false),
          });
        });
        if (!shouldContinue) {
          setCreateLoading(false);
          message.info('已取消提交，请先处理现有运单。');
          return;
        }
      }

      const payload = {
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        customerEmail: values.customerEmail,
        shipper: {
          name: values.shipperName || values.customerName,
          phone: values.customerPhone,
          address: {
            addressLine1: values.pickupAddress,
            city: values.pickupCity,
            province: values.pickupProvince,
            postalCode: values.pickupPostalCode,
            country: values.pickupCountry || 'CA',
            isResidential: values.pickupIsResidential || false,
          },
        },
        receiver: {
          name: values.receiverName,
          phone: values.receiverPhone,
          address: {
            addressLine1: values.deliveryAddress,
            city: values.deliveryCity,
            province: values.deliveryProvince,
            postalCode: values.deliveryPostalCode,
            country: values.deliveryCountry || 'CA',
            isResidential: values.deliveryIsResidential || false,
          },
        },
        cargoDescription: values.cargoDescription,
        cargoWeight: values.cargoWeight,
        cargoQuantity: values.cargoQuantity,
        source: 'self-service', // 2025-11-11 10:15:05 标记自助下单来源
        status: 'pending',
      };
      const response = await shipmentsApi.createShipment(payload);
      const createdNo = response.data?.data?.shipmentNumber || response.data?.data?.shipment_no || response.data?.data?.id || '未获取到运单号';
      setCreatedShipmentNo(createdNo);
      message.success('运单提交成功，我们的团队会尽快联系您');
      createForm.resetFields();
    } catch (error) {
      console.error('自助下单失败:', error);
      message.error('提交失败，请稍后重试');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleLookupShipment = async () => {
    try {
      const values = await lookupForm.validateFields();
      setLookupLoading(true);
      const response = await shipmentsApi.getShipments({
        shipmentNumber: values.shipmentNumber,
        customerPhone: values.customerPhone,
      });
      const list = response.data?.data || [];
      if (list.length === 0) {
        setLookupResult(null);
        message.warning('未查询到匹配的运单，请核对信息');
        return;
      }
      setLookupResult(list[0]);
    } catch (error) {
      console.error('查询运单失败:', error);
      message.error('查询失败，请稍后重试');
    } finally {
      setLookupLoading(false);
    }
  };

  const renderCreateForm = () => (
    <Card>
      <Title level={4}>在线提交运输需求</Title>
      <Text type="secondary">填写以下信息，我们将在30分钟内与您确认订单。</Text>
      <Divider />
      <Form
        form={createForm}
        layout="vertical"
        onFinish={handleCreateShipment}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="customerName"
              label="联系人姓名"
              rules={[{ required: true, message: '请输入联系人姓名' }]}
            >
              <Input prefix={<InfoCircleOutlined />} placeholder="张先生 / Ms. Zhang" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="customerPhone"
              label="联系电话"
              rules={[{ required: true, message: '请输入联系电话' }]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="+1 416 000 0000" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="customerEmail"
              label="联系邮箱"
              rules={[{ type: 'email', message: '请输入有效邮箱' }]}
            >
              <Input prefix={<MailOutlined />} placeholder="you@example.com" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="receiverPhone"
              label="收货人电话"
              rules={[{ required: true, message: '请输入收货人电话' }]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="+1 905 000 0000" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="pickupAddress"
              label="取货地址"
              rules={[{ required: true, message: '请输入取货地址' }]}
            >
              <Input prefix={<EnvironmentOutlined />} placeholder="街道 + 门牌号" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="deliveryAddress"
              label="送货地址"
              rules={[{ required: true, message: '请输入送货地址' }]}
            >
              <Input prefix={<EnvironmentOutlined />} placeholder="街道 + 门牌号" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="pickupCity" label="取货城市" rules={[{ required: true, message: '请输入取货城市' }]}>
              <Input placeholder="Toronto" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="pickupProvince" label="省份" rules={[{ required: true, message: '请输入省份' }]}>
              <Input placeholder="ON" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="deliveryCity" label="送货城市" rules={[{ required: true, message: '请输入送货城市' }]}>
              <Input placeholder="Ottawa" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="deliveryProvince" label="省份" rules={[{ required: true, message: '请输入省份' }]}>
              <Input placeholder="ON" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="pickupPostalCode" label="取货邮编">
              <Input placeholder="A1A 1A1" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="deliveryPostalCode" label="送货邮编">
              <Input placeholder="K1A 0B1" />
            </Form.Item>
          </Col>
        </Row>
        <Divider />
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="cargoDescription"
              label="货物描述"
              rules={[{ required: true, message: '请输入货物描述' }]}
            >
              <TextArea rows={3} placeholder="如：10托盘杂货，需尾板" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="cargoWeight"
              label="总重量 (kg)"
              rules={[{ required: true, message: '请输入重量' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="cargoQuantity"
              label="件数"
              rules={[{ required: true, message: '请输入件数' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Space style={{ marginTop: 16 }}>
          <Button type="primary" htmlType="submit" loading={createLoading} icon={<CheckCircleOutlined />}>
            提交运单
          </Button>
          <Button onClick={() => createForm.resetFields()}>
            重置
          </Button>
        </Space>
      </Form>
      {createdShipmentNo && (
        <Result
          status="success"
          title="感谢提交！"
          subTitle={`您的运单编号：${createdShipmentNo}。我们的客服会尽快联系您确认细节。`}
        />
      )}
    </Card>
  );

  const renderLookupForm = () => (
    <Card>
      <Title level={4}>运单状态查询</Title>
      <Text type="secondary">输入运单号和下单电话，实时查看运输进度。</Text>
      <Divider />
      <Form
        form={lookupForm}
        layout="vertical"
        onFinish={handleLookupShipment}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="shipmentNumber"
              label="运单编号"
              rules={[{ required: true, message: '请输入运单编号' }]}
            >
              <Input placeholder="TMS20251011001" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="customerPhone"
              label="下单电话"
              rules={[{ required: true, message: '请输入下单时的电话' }]}
            >
              <Input placeholder="+1 416 000 0000" />
            </Form.Item>
          </Col>
        </Row>
        <Button type="primary" htmlType="submit" loading={lookupLoading} icon={<SearchOutlined />}>
          查询运单
        </Button>
      </Form>
      {lookupResult && (
        <>
          <Divider />
          <Descriptions title="运单信息" bordered column={1}>
            <Descriptions.Item label="运单号">{lookupResult.shipmentNumber || lookupResult.shipmentNo}</Descriptions.Item>
            <Descriptions.Item label="当前状态">{lookupResult.status}</Descriptions.Item>
            <Descriptions.Item label="取货地址">
              {lookupResult.pickupAddress ? `${(lookupResult.pickupAddress as any).city || ''} ${(lookupResult.pickupAddress as any).addressLine1 || ''}` : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="送货地址">
              {lookupResult.deliveryAddress ? `${(lookupResult.deliveryAddress as any).city || ''} ${(lookupResult.deliveryAddress as any).addressLine1 || ''}` : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="预估费用">{lookupResult.estimatedCost ? `$${lookupResult.estimatedCost}` : '待确认'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{lookupResult.createdAt}</Descriptions.Item>
          </Descriptions>
        </>
      )}
    </Card>
  );

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px' }}>
      <Card style={{ marginBottom: 24, background: '#f0f5ff', borderColor: '#91d5ff' }}>
        <Title level={3}>客户自助服务中心</Title>
        <Text type="secondary">
          提交新的运输需求或查询现有运单状态，我们将为您提供快速响应与透明进度。
        </Text>
      </Card>
      <Tabs
        defaultActiveKey="create"
        items={[
          {
            key: 'create',
            label: '在线下单',
            children: renderCreateForm(),
          },
          {
            key: 'lookup',
            label: '运单查询',
            children: renderLookupForm(),
          },
        ]}
      />
    </div>
  );
};

export default CustomerPortal;

