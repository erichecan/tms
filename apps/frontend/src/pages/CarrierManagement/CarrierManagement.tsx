// 承运商管理页面
// 创建时间: 2025-11-29T11:25:04Z
// 第一阶段：核心主数据完善 - 1.3 承运商管理

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
  Tag,
  Space,
  Row,
  Col,
  Typography,
  Popconfirm,
  Tabs,
  Rate,
  Divider,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  StarOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { carriersApi } from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface Carrier {
  id: string;
  name: string;
  code?: string;
  serviceLevel: 'standard' | 'premium' | 'vip';
  status: 'active' | 'inactive' | 'suspended' | 'blacklisted';
  ratingScore: number;
  totalShipments: number;
  onTimeRate: number;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
}

const CarrierManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null);
  const [form] = Form.useForm();

  // 详情页数据
  const [certificates, setCertificates] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [activeDetailTab, setActiveDetailTab] = useState('info');

  useEffect(() => {
    loadCarriers();
  }, []);

  const loadCarriers = async () => {
    setLoading(true);
    try {
      const response = await carriersApi.getCarriers();
      setCarriers(response.data?.data || []);
    } catch (error: any) {
      message.error('加载承运商列表失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCarrier(null);
    form.resetFields();
    form.setFieldsValue({
      serviceLevel: 'standard',
      status: 'active',
    });
    setIsModalVisible(true);
  };

  const handleEdit = (carrier: Carrier) => {
    setEditingCarrier(carrier);
    form.setFieldsValue({
      ...carrier,
      address: carrier.address ? (typeof carrier.address === 'string' ? JSON.parse(carrier.address) : carrier.address) : undefined,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await carriersApi.deleteCarrier(id);
      message.success('删除成功');
      loadCarriers();
    } catch (error: any) {
      message.error('删除失败: ' + error.message);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        address: values.address ? JSON.stringify(values.address) : undefined,
      };

      if (editingCarrier) {
        await carriersApi.updateCarrier(editingCarrier.id, data);
        message.success('更新成功');
      } else {
        await carriersApi.createCarrier(data);
        message.success('创建成功');
      }
      setIsModalVisible(false);
      loadCarriers();
    } catch (error: any) {
      message.error('操作失败: ' + error.message);
    }
  };

  const handleViewDetails = async (carrier: Carrier) => {
    setSelectedCarrier(carrier);
    setIsDetailModalVisible(true);
    await loadCarrierDetails(carrier.id);
  };

  const loadCarrierDetails = async (carrierId: string) => {
    try {
      const [certsRes, ratingsRes, quotesRes] = await Promise.all([
        carriersApi.getCarrierCertificates(carrierId),
        carriersApi.getCarrierRatings(carrierId),
        carriersApi.getCarrierQuotes(carrierId),
      ]);
      setCertificates(certsRes.data?.data || []);
      setRatings(ratingsRes.data?.data || []);
      setQuotes(quotesRes.data?.data || []);
    } catch (error: any) {
      message.error('加载详情失败: ' + error.message);
    }
  };

  const columns = [
    {
      title: '承运商名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '代码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '服务等级',
      dataIndex: 'serviceLevel',
      key: 'serviceLevel',
      render: (level: string) => {
        const colorMap: Record<string, string> = {
          'standard': 'default',
          'premium': 'blue',
          'vip': 'gold',
        };
        const textMap: Record<string, string> = {
          'standard': '标准',
          'premium': '高级',
          'vip': 'VIP',
        };
        return <Tag color={colorMap[level]}>{textMap[level]}</Tag>;
      },
    },
    {
      title: '综合评分',
      dataIndex: 'ratingScore',
      key: 'ratingScore',
      render: (score: number) => (
        <Space>
          <Rate disabled value={score} allowHalf style={{ fontSize: 14 }} />
          <Text>{score.toFixed(1)}</Text>
        </Space>
      ),
    },
    {
      title: '总运单数',
      dataIndex: 'totalShipments',
      key: 'totalShipments',
    },
    {
      title: '准点率',
      dataIndex: 'onTimeRate',
      key: 'onTimeRate',
      render: (rate: number) => `${rate.toFixed(1)}%`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          'active': 'green',
          'inactive': 'default',
          'suspended': 'orange',
          'blacklisted': 'red',
        };
        const textMap: Record<string, string> = {
          'active': '活跃',
          'inactive': '非活跃',
          'suspended': '已暂停',
          'blacklisted': '黑名单',
        };
        return <Tag color={colorMap[status]}>{textMap[status]}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Carrier) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetails(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 证照表格列
  const certificateColumns = [
    {
      title: '证照类型',
      dataIndex: 'certificateType',
      key: 'certificateType',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          'business_license': '营业执照',
          'transport_permit': '运输许可证',
          'hazardous_permit': '危化许可',
          'cold_chain': '冷链资质',
          'insurance': '保险',
          'other': '其他',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '证照编号',
      dataIndex: 'certificateNumber',
      key: 'certificateNumber',
    },
    {
      title: '到期日期',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: any) => {
        if (!record.expiryDate) return null;
        const expiry = dayjs(record.expiryDate);
        const today = dayjs();
        const daysUntilExpiry = expiry.diff(today, 'day');
        
        if (daysUntilExpiry < 0) {
          return <Tag color="red">已过期</Tag>;
        } else if (daysUntilExpiry <= 30) {
          return <Tag color="orange">即将到期 ({daysUntilExpiry}天)</Tag>;
        } else {
          return <Tag color="green">正常</Tag>;
        }
      },
    },
  ];

  // 评分表格列
  const ratingColumns = [
    {
      title: '评分类型',
      dataIndex: 'ratingType',
      key: 'ratingType',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          'service': '服务',
          'punctuality': '准点',
          'safety': '安全',
          'communication': '沟通',
          'overall': '综合',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '评分',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => (
        <Space>
          <Rate disabled value={score} allowHalf style={{ fontSize: 14 }} />
          <Text>{score.toFixed(1)}</Text>
        </Space>
      ),
    },
    {
      title: '评论',
      dataIndex: 'comment',
      key: 'comment',
    },
    {
      title: '评分时间',
      dataIndex: 'ratedAt',
      key: 'ratedAt',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
  ];

  // 报价表格列
  const quoteColumns = [
    {
      title: '起点',
      dataIndex: 'routeFrom',
      key: 'routeFrom',
    },
    {
      title: '终点',
      dataIndex: 'routeTo',
      key: 'routeTo',
    },
    {
      title: '距离(km)',
      dataIndex: 'distanceKm',
      key: 'distanceKm',
    },
    {
      title: '报价金额',
      dataIndex: 'quotedPrice',
      key: 'quotedPrice',
      render: (price: number, record: any) => `${record.currency || 'CNY'} ${price.toLocaleString()}`,
    },
    {
      title: '预计天数',
      dataIndex: 'estimatedDays',
      key: 'estimatedDays',
    },
    {
      title: '状态',
      dataIndex: 'quoteStatus',
      key: 'quoteStatus',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          'pending': 'orange',
          'accepted': 'green',
          'rejected': 'red',
          'expired': 'default',
        };
        const textMap: Record<string, string> = {
          'pending': '待处理',
          'accepted': '已接受',
          'rejected': '已拒绝',
          'expired': '已过期',
        };
        return <Tag color={colorMap[status]}>{textMap[status]}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={4}>承运商管理</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            添加承运商
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={carriers}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      {/* 创建/编辑弹窗 */}
      <Modal
        title={editingCarrier ? '编辑承运商' : '添加承运商'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="承运商名称" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="code" label="承运商代码">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="companyType" label="公司类型">
                <Select>
                  <Option value="individual">个人</Option>
                  <Option value="company">公司</Option>
                  <Option value="cooperative">合作社</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="serviceLevel" label="服务等级" rules={[{ required: true }]}>
                <Select>
                  <Option value="standard">标准</Option>
                  <Option value="premium">高级</Option>
                  <Option value="vip">VIP</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="registrationNumber" label="工商注册号">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="taxId" label="税号">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="contactPerson" label="联系人">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="contactPhone" label="联系电话">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="contactEmail" label="联系邮箱">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="businessScope" label="经营范围">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select>
              <Option value="active">活跃</Option>
              <Option value="inactive">非活跃</Option>
              <Option value="suspended">已暂停</Option>
              <Option value="blacklisted">黑名单</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title={`承运商详情 - ${selectedCarrier?.name}`}
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={1000}
      >
        {selectedCarrier && (
          <div>
            <Tabs activeKey={activeDetailTab} onChange={setActiveDetailTab}>
              <TabPane tab="基本信息" key="info">
                <Row gutter={16}>
                  <Col span={12}>
                    <Card size="small">
                      <Statistic
                        title="综合评分"
                        value={selectedCarrier.ratingScore}
                        prefix={<StarOutlined />}
                        precision={1}
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small">
                      <Statistic
                        title="总运单数"
                        value={selectedCarrier.totalShipments}
                        prefix={<DollarOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>
                <Divider />
                <Row gutter={16}>
                  <Col span={12}>
                    <p><strong>承运商名称:</strong> {selectedCarrier.name}</p>
                    <p><strong>代码:</strong> {selectedCarrier.code || '-'}</p>
                    <p><strong>服务等级:</strong> 
                      <Tag color={selectedCarrier.serviceLevel === 'vip' ? 'gold' : selectedCarrier.serviceLevel === 'premium' ? 'blue' : 'default'}>
                        {selectedCarrier.serviceLevel === 'vip' ? 'VIP' : selectedCarrier.serviceLevel === 'premium' ? '高级' : '标准'}
                      </Tag>
                    </p>
                    <p><strong>状态:</strong> 
                      <Tag color={selectedCarrier.status === 'active' ? 'green' : selectedCarrier.status === 'suspended' ? 'orange' : selectedCarrier.status === 'blacklisted' ? 'red' : 'default'}>
                        {selectedCarrier.status === 'active' ? '活跃' : selectedCarrier.status === 'suspended' ? '已暂停' : selectedCarrier.status === 'blacklisted' ? '黑名单' : '非活跃'}
                      </Tag>
                    </p>
                  </Col>
                  <Col span={12}>
                    <p><strong>联系人:</strong> {selectedCarrier.contactPerson || '-'}</p>
                    <p><strong>联系电话:</strong> {selectedCarrier.contactPhone || '-'}</p>
                    <p><strong>联系邮箱:</strong> {selectedCarrier.contactEmail || '-'}</p>
                    <p><strong>准点率:</strong> {selectedCarrier.onTimeRate.toFixed(1)}%</p>
                  </Col>
                </Row>
              </TabPane>

              <TabPane tab="证照管理" key="certificates">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Table
                    columns={certificateColumns}
                    dataSource={certificates}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                  />
                </Space>
              </TabPane>

              <TabPane tab="评分记录" key="ratings">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Table
                    columns={ratingColumns}
                    dataSource={ratings}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                  />
                </Space>
              </TabPane>

              <TabPane tab="报价记录" key="quotes">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Table
                    columns={quoteColumns}
                    dataSource={quotes}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                  />
                </Space>
              </TabPane>
            </Tabs>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CarrierManagement;

