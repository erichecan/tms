// 线路管理与路线优化页面
// 创建时间: 2025-11-29T11:25:04Z
// 第二阶段：线路与站点管理 - 2.1 线路管理（已整合路线优化功能）

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Tabs,
  Popconfirm,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  ApartmentOutlined,
  DollarOutlined,
  BranchesOutlined,
} from '@ant-design/icons';
import { routesApi } from '../../services/api';
import RouteOptimization from '../../components/RouteOptimization/RouteOptimization'; // 2025-11-29T11:25:04Z 整合路线优化组件

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Route {
  id: string;
  routeCode: string;
  routeName: string;
  routeType: 'regular' | 'express' | 'dedicated' | 'flexible';
  originLocation: string;
  originLatitude?: number;
  originLongitude?: number;
  destinationLocation: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
  totalDistanceKm?: number;
  estimatedDurationHours?: number;
  tollFee: number;
  fuelCostPerKm?: number;
  description?: string;
  isActive: boolean;
}

interface RouteSegment {
  id: string;
  routeId: string;
  segmentOrder: number;
  segmentName?: string;
  startLocation: string;
  endLocation: string;
  distanceKm: number;
  tollFee: number;
}

const RouteManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('routes'); // 2025-11-29T11:25:04Z 默认显示线路管理

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    setLoading(true);
    try {
      const response = await routesApi.getRoutes({ page: 1, limit: 100 });
      setRoutes(response.data?.data || []);
    } catch (error: any) {
      message.error('加载线路列表失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRoute(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (route: Route) => {
    setEditingRoute(route);
    form.setFieldsValue({
      ...route,
      originLatitude: route.originLatitude,
      originLongitude: route.originLongitude,
      destinationLatitude: route.destinationLatitude,
      destinationLongitude: route.destinationLongitude,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await routesApi.deleteRoute(id);
      message.success('删除成功');
      loadRoutes();
    } catch (error: any) {
      message.error('删除失败: ' + (error.message || '未知错误'));
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingRoute) {
        await routesApi.updateRoute(editingRoute.id, values);
        message.success('更新成功');
      } else {
        await routesApi.createRoute(values);
        message.success('创建成功');
      }
      setIsModalVisible(false);
      form.resetFields();
      loadRoutes();
    } catch (error: any) {
      message.error('操作失败: ' + (error.message || '未知错误'));
    }
  };

  const getRouteTypeColor = (type: string) => {
    const colors = {
      regular: 'blue',
      express: 'green',
      dedicated: 'orange',
      flexible: 'purple',
    };
    return colors[type as keyof typeof colors] || 'default';
  };

  const getRouteTypeText = (type: string) => {
    const texts = {
      regular: '常规',
      express: '快线',
      dedicated: '专线',
      flexible: '灵活',
    };
    return texts[type as keyof typeof texts] || type;
  };

  const columns = [
    {
      title: '线路编码',
      dataIndex: 'routeCode',
      key: 'routeCode',
    },
    {
      title: '线路名称',
      dataIndex: 'routeName',
      key: 'routeName',
    },
    {
      title: '线路类型',
      dataIndex: 'routeType',
      key: 'routeType',
      render: (type: string) => (
        <Tag color={getRouteTypeColor(type)}>
          {getRouteTypeText(type)}
        </Tag>
      ),
    },
    {
      title: '起点',
      dataIndex: 'originLocation',
      key: 'originLocation',
      ellipsis: true,
    },
    {
      title: '终点',
      dataIndex: 'destinationLocation',
      key: 'destinationLocation',
      ellipsis: true,
    },
    {
      title: '里程 (km)',
      dataIndex: 'totalDistanceKm',
      key: 'totalDistanceKm',
      render: (km: number) => km ? `${km.toLocaleString()}` : '—',
    },
    {
      title: '过路费',
      dataIndex: 'tollFee',
      key: 'tollFee',
      render: (fee: number) => fee > 0 ? `$${fee.toFixed(2)}` : '—',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Route) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条线路吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ margin: '0 0 0 24px' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            <ApartmentOutlined /> 线路管理
          </Title>
          <Text type="secondary">管理运输线路，定义起点、终点、里程和过路费</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          新建线路
        </Button>
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'routes',
              label: (
                <span>
                  <ApartmentOutlined /> 线路管理
                </span>
              ),
              children: (
                <Table
                  columns={columns}
                  dataSource={routes}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              ),
            },
            {
              key: 'optimization',
              label: (
                <span>
                  <BranchesOutlined /> 路线优化
                </span>
              ),
              children: (
                <RouteOptimization /> // 2025-11-29T11:25:04Z 整合路线优化组件
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={editingRoute ? '编辑线路' : '新建线路'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="routeCode"
                label="线路编码"
                rules={[{ required: true, message: '请输入线路编码' }]}
              >
                <Input placeholder="如：RT001" disabled={!!editingRoute} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="routeType"
                label="线路类型"
                rules={[{ required: true, message: '请选择线路类型' }]}
              >
                <Select placeholder="请选择线路类型">
                  <Option value="regular">常规</Option>
                  <Option value="express">快线</Option>
                  <Option value="dedicated">专线</Option>
                  <Option value="flexible">灵活</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="routeName"
            label="线路名称"
            rules={[{ required: true, message: '请输入线路名称' }]}
          >
            <Input placeholder="如：多伦多-渥太华" />
          </Form.Item>

          <Divider>起点信息</Divider>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="originLocation"
                label="起点位置"
                rules={[{ required: true, message: '请输入起点位置' }]}
              >
                <Input placeholder="详细地址" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="originLatitude" label="纬度">
                <InputNumber style={{ width: '100%' }} placeholder="纬度" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="originLongitude" label="经度">
                <InputNumber style={{ width: '100%' }} placeholder="经度" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>终点信息</Divider>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="destinationLocation"
                label="终点位置"
                rules={[{ required: true, message: '请输入终点位置' }]}
              >
                <Input placeholder="详细地址" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="destinationLatitude" label="纬度">
                <InputNumber style={{ width: '100%' }} placeholder="纬度" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="destinationLongitude" label="经度">
                <InputNumber style={{ width: '100%' }} placeholder="经度" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>线路参数</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="totalDistanceKm" label="总里程 (km)">
                <InputNumber style={{ width: '100%' }} min={0} placeholder="总里程" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="estimatedDurationHours" label="预估时长 (小时)">
                <InputNumber style={{ width: '100%' }} min={0} placeholder="预估时长" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tollFee" label="过路费">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} prefix="$" placeholder="过路费" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="fuelCostPerKm" label="每公里燃油成本">
            <InputNumber style={{ width: '100%' }} min={0} precision={2} prefix="$" placeholder="每公里燃油成本" />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="线路描述" />
          </Form.Item>

          <Form.Item name="isActive" label="启用状态" valuePropName="checked" initialValue={true}>
            <Select>
              <Option value={true}>启用</Option>
              <Option value={false}>停用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RouteManagement;

