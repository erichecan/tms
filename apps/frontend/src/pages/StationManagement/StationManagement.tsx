// 站点与地址管理页面
// 创建时间: 2025-11-29T11:25:04Z
// 第二阶段：线路与站点管理 - 2.2 站点与地址管理（已整合地址管理功能）

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
  Switch,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  ShopOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { stationsApi, customersApi } from '../../services/api'; // 2025-11-29T11:25:04Z 整合地址管理

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Station {
  id: string;
  stationCode: string;
  stationName: string;
  stationType: 'pickup' | 'delivery' | 'transit' | 'warehouse' | 'hub';
  address: string;
  city?: string;
  province?: string;
  latitude?: number;
  longitude?: number;
  contactPerson?: string;
  contactPhone?: string;
  isActive: boolean;
}

interface Warehouse {
  id: string;
  warehouseCode: string;
  warehouseName: string;
  warehouseType: 'distribution' | 'storage' | 'cross_dock' | 'cold_storage';
  address: string;
  city?: string;
  province?: string;
  latitude?: number;
  longitude?: number;
  temperatureControlled: boolean;
  isActive: boolean;
}

interface Hub {
  id: string;
  hubCode: string;
  hubName: string;
  address: string;
  city?: string;
  province?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
}

const StationManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [customers, setCustomers] = useState<any[]>([]); // 2025-11-29T11:25:04Z 客户列表（用于地址管理）
  const [activeTab, setActiveTab] = useState('stations');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'stations') {
        const response = await stationsApi.getStations({ page: 1, limit: 100 });
        setStations(response.data?.data || []);
      } else if (activeTab === 'warehouses') {
        const response = await stationsApi.getWarehouses({ page: 1, limit: 100 });
        setWarehouses(response.data?.data || []);
      } else if (activeTab === 'hubs') {
        const response = await stationsApi.getHubs({ page: 1, limit: 100 });
        setHubs(response.data?.data || []);
      } else if (activeTab === 'addresses') {
        // 2025-11-29T11:25:04Z 加载客户地址
        const response = await customersApi.getCustomers({ page: 1, limit: 100 });
        setCustomers(response.data?.data || []);
      }
    } catch (error: any) {
      message.error('加载数据失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    form.setFieldsValue({
      ...item,
      isActive: item.isActive,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      if (activeTab === 'stations') {
        await stationsApi.deleteStation(id);
      } else if (activeTab === 'warehouses') {
        await stationsApi.deleteWarehouse(id);
      } else if (activeTab === 'hubs') {
        await stationsApi.deleteHub(id);
      }
      message.success('删除成功');
      loadData();
    } catch (error: any) {
      message.error('删除失败: ' + (error.message || '未知错误'));
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingItem) {
        if (activeTab === 'stations') {
          await stationsApi.updateStation(editingItem.id, values);
        } else if (activeTab === 'warehouses') {
          await stationsApi.updateWarehouse(editingItem.id, values);
        } else if (activeTab === 'hubs') {
          await stationsApi.updateHub(editingItem.id, values);
        }
        message.success('更新成功');
      } else {
        if (activeTab === 'stations') {
          await stationsApi.createStation(values);
        } else if (activeTab === 'warehouses') {
          await stationsApi.createWarehouse(values);
        } else if (activeTab === 'hubs') {
          await stationsApi.createHub(values);
        }
        message.success('创建成功');
      }
      setIsModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error: any) {
      message.error('操作失败: ' + (error.message || '未知错误'));
    }
  };

  const getStationTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      pickup: 'blue',
      delivery: 'green',
      transit: 'orange',
      warehouse: 'purple',
      hub: 'red',
    };
    return colors[type] || 'default';
  };

  const getStationTypeText = (type: string) => {
    const texts: Record<string, string> = {
      pickup: '取货点',
      delivery: '送货点',
      transit: '中转站',
      warehouse: '仓库',
      hub: '枢纽',
    };
    return texts[type] || type;
  };

  const getWarehouseTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      distribution: 'blue',
      storage: 'green',
      cross_dock: 'orange',
      cold_storage: 'cyan',
    };
    return colors[type] || 'default';
  };

  const getWarehouseTypeText = (type: string) => {
    const texts: Record<string, string> = {
      distribution: '配送中心',
      storage: '存储仓库',
      cross_dock: '越库中心',
      cold_storage: '冷库',
    };
    return texts[type] || type;
  };

  const stationColumns = [
    {
      title: '站点编码',
      dataIndex: 'stationCode',
      key: 'stationCode',
    },
    {
      title: '站点名称',
      dataIndex: 'stationName',
      key: 'stationName',
    },
    {
      title: '站点类型',
      dataIndex: 'stationType',
      key: 'stationType',
      render: (type: string) => (
        <Tag color={getStationTypeColor(type)}>
          {getStationTypeText(type)}
        </Tag>
      ),
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
    },
    {
      title: '联系人',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
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
      render: (_: any, record: Station) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个站点吗？"
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

  const warehouseColumns = [
    {
      title: '仓库编码',
      dataIndex: 'warehouseCode',
      key: 'warehouseCode',
    },
    {
      title: '仓库名称',
      dataIndex: 'warehouseName',
      key: 'warehouseName',
    },
    {
      title: '仓库类型',
      dataIndex: 'warehouseType',
      key: 'warehouseType',
      render: (type: string) => (
        <Tag color={getWarehouseTypeColor(type)}>
          {getWarehouseTypeText(type)}
        </Tag>
      ),
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: '温控',
      dataIndex: 'temperatureControlled',
      key: 'temperatureControlled',
      render: (controlled: boolean) => (
        <Tag color={controlled ? 'cyan' : 'default'}>
          {controlled ? '是' : '否'}
        </Tag>
      ),
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
      render: (_: any, record: Warehouse) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个仓库吗？"
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

  const hubColumns = [
    {
      title: '枢纽编码',
      dataIndex: 'hubCode',
      key: 'hubCode',
    },
    {
      title: '枢纽名称',
      dataIndex: 'hubName',
      key: 'hubName',
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
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
      render: (_: any, record: Hub) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个枢纽吗？"
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

  const renderFormFields = () => {
    if (activeTab === 'stations') {
      return (
        <>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="stationCode"
                label="站点编码"
                rules={[{ required: true, message: '请输入站点编码' }]}
              >
                <Input placeholder="如：ST001" disabled={!!editingItem} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="stationType"
                label="站点类型"
                rules={[{ required: true, message: '请选择站点类型' }]}
              >
                <Select placeholder="请选择站点类型">
                  <Option value="pickup">取货点</Option>
                  <Option value="delivery">送货点</Option>
                  <Option value="transit">中转站</Option>
                  <Option value="warehouse">仓库</Option>
                  <Option value="hub">枢纽</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="stationName"
            label="站点名称"
            rules={[{ required: true, message: '请输入站点名称' }]}
          >
            <Input placeholder="站点名称" />
          </Form.Item>
          <Form.Item
            name="address"
            label="详细地址"
            rules={[{ required: true, message: '请输入详细地址' }]}
          >
            <TextArea rows={2} placeholder="详细地址" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="city" label="城市">
                <Input placeholder="城市" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="province" label="省份">
                <Input placeholder="省份" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="latitude" label="纬度">
                <InputNumber style={{ width: '100%' }} placeholder="纬度" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="longitude" label="经度">
                <InputNumber style={{ width: '100%' }} placeholder="经度" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contactPerson" label="联系人">
                <Input placeholder="联系人" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contactPhone" label="联系电话">
                <Input placeholder="联系电话" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="isActive" label="启用状态" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </>
      );
    } else if (activeTab === 'warehouses') {
      return (
        <>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="warehouseCode"
                label="仓库编码"
                rules={[{ required: true, message: '请输入仓库编码' }]}
              >
                <Input placeholder="如：WH001" disabled={!!editingItem} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="warehouseType"
                label="仓库类型"
                rules={[{ required: true, message: '请选择仓库类型' }]}
              >
                <Select placeholder="请选择仓库类型">
                  <Option value="distribution">配送中心</Option>
                  <Option value="storage">存储仓库</Option>
                  <Option value="cross_dock">越库中心</Option>
                  <Option value="cold_storage">冷库</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="warehouseName"
            label="仓库名称"
            rules={[{ required: true, message: '请输入仓库名称' }]}
          >
            <Input placeholder="仓库名称" />
          </Form.Item>
          <Form.Item
            name="address"
            label="详细地址"
            rules={[{ required: true, message: '请输入详细地址' }]}
          >
            <TextArea rows={2} placeholder="详细地址" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="city" label="城市">
                <Input placeholder="城市" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="province" label="省份">
                <Input placeholder="省份" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="latitude" label="纬度">
                <InputNumber style={{ width: '100%' }} placeholder="纬度" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="longitude" label="经度">
                <InputNumber style={{ width: '100%' }} placeholder="经度" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="temperatureControlled" label="温控" valuePropName="checked" initialValue={false}>
            <Switch />
          </Form.Item>
          <Form.Item name="isActive" label="启用状态" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </>
      );
    } else if (activeTab === 'hubs') {
      return (
        <>
          <Form.Item
            name="hubCode"
            label="枢纽编码"
            rules={[{ required: true, message: '请输入枢纽编码' }]}
          >
            <Input placeholder="如：HUB001" disabled={!!editingItem} />
          </Form.Item>
          <Form.Item
            name="hubName"
            label="枢纽名称"
            rules={[{ required: true, message: '请输入枢纽名称' }]}
          >
            <Input placeholder="枢纽名称" />
          </Form.Item>
          <Form.Item
            name="address"
            label="详细地址"
            rules={[{ required: true, message: '请输入详细地址' }]}
          >
            <TextArea rows={2} placeholder="详细地址" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="city" label="城市">
                <Input placeholder="城市" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="province" label="省份">
                <Input placeholder="省份" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="latitude" label="纬度">
                <InputNumber style={{ width: '100%' }} placeholder="纬度" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="longitude" label="经度">
                <InputNumber style={{ width: '100%' }} placeholder="经度" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="isActive" label="启用状态" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </>
      );
    }
    return null;
  };

  return (
    <div style={{ margin: '0 0 0 24px' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            <EnvironmentOutlined /> 站点与地址管理
          </Title>
          <Text type="secondary">管理取货点、送货点、中转站、仓库、枢纽和客户地址</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          新建{activeTab === 'stations' ? '站点' : activeTab === 'warehouses' ? '仓库' : '枢纽'}
        </Button>
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'stations',
              label: (
                <span>
                  <HomeOutlined /> 站点管理
                </span>
              ),
              children: (
                <Table
                  columns={stationColumns}
                  dataSource={stations}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              ),
            },
            {
              key: 'warehouses',
              label: (
                <span>
                  <ShopOutlined /> 仓库管理
                </span>
              ),
              children: (
                <Table
                  columns={warehouseColumns}
                  dataSource={warehouses}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              ),
            },
            {
              key: 'hubs',
              label: (
                <span>
                  <EnvironmentOutlined /> 枢纽管理
                </span>
              ),
              children: (
                <Table
                  columns={hubColumns}
                  dataSource={hubs}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              ),
            },
            {
              key: 'addresses',
              label: (
                <span>
                  <HomeOutlined /> 客户地址管理
                </span>
              ),
              children: (
                <div>
                  {/* 2025-11-29T11:25:04Z 客户地址管理 */}
                  <Table
                    columns={[
                      {
                        title: '客户名称',
                        dataIndex: 'name',
                        key: 'name',
                      },
                      {
                        title: '联系电话',
                        dataIndex: 'phone',
                        key: 'phone',
                      },
                      {
                        title: '默认取货地址',
                        dataIndex: ['defaultPickupAddress', 'addressLine1'],
                        key: 'pickupAddress',
                        render: (text: string, record: any) => {
                          const addr = record.defaultPickupAddress;
                          if (!addr) return '—';
                          return `${addr.addressLine1 || ''}, ${addr.city || ''}, ${addr.province || ''}`;
                        },
                        ellipsis: true,
                      },
                      {
                        title: '默认送货地址',
                        dataIndex: ['defaultDeliveryAddress', 'addressLine1'],
                        key: 'deliveryAddress',
                        render: (text: string, record: any) => {
                          const addr = record.defaultDeliveryAddress;
                          if (!addr) return '—';
                          return `${addr.addressLine1 || ''}, ${addr.city || ''}, ${addr.province || ''}`;
                        },
                        ellipsis: true,
                      },
                      {
                        title: '操作',
                        key: 'action',
                        render: (_: any, record: any) => (
                          <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => {
                              // 可以跳转到客户管理页面编辑地址
                              window.location.href = `/admin/customers?edit=${record.id}`;
                            }}
                          >
                            编辑地址
                          </Button>
                        ),
                      },
                    ]}
                    dataSource={customers}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={editingItem ? `编辑${activeTab === 'stations' ? '站点' : activeTab === 'warehouses' ? '仓库' : '枢纽'}` : `新建${activeTab === 'stations' ? '站点' : activeTab === 'warehouses' ? '仓库' : '枢纽'}`}
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
          {renderFormFields()}
        </Form>
      </Modal>
    </div>
  );
};

export default StationManagement;

