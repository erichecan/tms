// 询价请求详情页面
// 创建时间: 2025-12-05 12:00:00
// 作用: 查看询价详情、更新状态、添加跟进记录

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Typography,
  Timeline,
  Divider,
  Row,
  Col,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';

const { Title, Text } = Typography;
const { TextArea } = Input;

// 询价请求接口
interface QuoteRequest {
  id: string;
  code: string;
  contactName: string;
  company?: string;
  email: string;
  phone?: string;
  origin: string;
  destination: string;
  shipDate: string;
  weightKg: number;
  volume?: number;
  pieces?: number;
  pallets?: number; // 2025-12-12 00:15:00 添加托盘数量字段
  services: string[];
  note?: string;
  status: 'open' | 'pending' | 'contacted' | 'closed';
  assigneeId?: string;
  createdAt: string;
  updatedAt: string;
}

// 跟进记录接口
interface Followup {
  id: string;
  quoteRequestId: string;
  assigneeId?: string;
  note: string;
  nextActionAt?: string;
  createdAt: string;
}

const QuoteRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [quoteRequest, setQuoteRequest] = useState<QuoteRequest | null>(null);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [isFollowupModalVisible, setIsFollowupModalVisible] = useState(false);
  const [statusForm] = Form.useForm();
  const [followupForm] = Form.useForm();

  useEffect(() => {
    if (id) {
      loadQuoteRequest();
    }
  }, [id]);

  const loadQuoteRequest = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/v1/admin/quote-requests/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setQuoteRequest(response.data.data);
        setFollowups(response.data.data.followups || []);
      } else {
        throw new Error(response.data.error?.message || '加载失败');
      }
    } catch (error: any) {
      console.error('加载询价请求详情失败:', error);
      message.error(error.response?.data?.error?.message || '加载询价请求详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (values: any) => {
    if (!id) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`/api/v1/admin/quote-requests/${id}`, {
        status: values.status,
        assigneeId: values.assigneeId || undefined,
        note: values.note || undefined,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        message.success('状态更新成功');
        setIsStatusModalVisible(false);
        statusForm.resetFields();
        loadQuoteRequest();
      } else {
        throw new Error(response.data.error?.message || '更新失败');
      }
    } catch (error: any) {
      console.error('更新状态失败:', error);
      message.error(error.response?.data?.error?.message || '更新状态失败');
    }
  };

  const handleAddFollowup = async (values: any) => {
    if (!id) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/v1/admin/quote-requests/${id}/followups`, {
        note: values.note,
        nextActionAt: values.nextActionAt ? dayjs(values.nextActionAt).toISOString() : undefined,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        message.success('跟进记录添加成功');
        setIsFollowupModalVisible(false);
        followupForm.resetFields();
        loadQuoteRequest();
      } else {
        throw new Error(response.data.error?.message || '添加失败');
      }
    } catch (error: any) {
      console.error('添加跟进记录失败:', error);
      message.error(error.response?.data?.error?.message || '添加跟进记录失败');
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      open: { color: 'blue', text: '待处理' },
      pending: { color: 'orange', text: '处理中' },
      contacted: { color: 'green', text: '已联系' },
      closed: { color: 'default', text: '已关闭' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  if (loading && !quoteRequest) {
    return <div>加载中...</div>;
  }

  if (!quoteRequest) {
    return <div>询价请求不存在</div>;
  }

  return (
    <div style={{ margin: '0 0 0 24px' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/quote-requests')}>
            返回列表
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            询价详情：{quoteRequest.code}
          </Title>
          {getStatusTag(quoteRequest.status)}
        </Space>
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              statusForm.setFieldsValue({
                status: quoteRequest.status,
                assigneeId: quoteRequest.assigneeId,
                note: quoteRequest.note,
              });
              setIsStatusModalVisible(true);
            }}
          >
            更新状态
          </Button>
          <Button
            type="default"
            icon={<CheckCircleOutlined />}
            onClick={() => {
              followupForm.resetFields();
              setIsFollowupModalVisible(true);
            }}
          >
            添加跟进
          </Button>
        </Space>
      </div>

      <Row gutter={16}>
        <Col span={16}>
          {/* 基本信息 */}
          <Card title="基本信息" style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="询价编号">{quoteRequest.code}</Descriptions.Item>
              <Descriptions.Item label="提交时间">
                {dayjs(quoteRequest.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="联系人">{quoteRequest.contactName}</Descriptions.Item>
              <Descriptions.Item label="公司">{quoteRequest.company || '—'}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{quoteRequest.email}</Descriptions.Item>
              <Descriptions.Item label="电话">{quoteRequest.phone || '—'}</Descriptions.Item>
              <Descriptions.Item label="起始地" span={2}>{quoteRequest.origin}</Descriptions.Item>
              <Descriptions.Item label="目的地" span={2}>{quoteRequest.destination}</Descriptions.Item>
              <Descriptions.Item label="预计发货日期">
                {dayjs(quoteRequest.shipDate).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="重量">{quoteRequest.weightKg} kg</Descriptions.Item>
              {quoteRequest.volume && (
                <Descriptions.Item label="体积">{quoteRequest.volume} m³</Descriptions.Item>
              )}
              {quoteRequest.pieces && (
                <Descriptions.Item label="件数">{quoteRequest.pieces}</Descriptions.Item>
              )}
              {quoteRequest.pallets && (
                <Descriptions.Item label="托盘数量">{quoteRequest.pallets} 托</Descriptions.Item>
              )}
              <Descriptions.Item label="服务类型" span={2}>
                <Space wrap>
                  {quoteRequest.services.map(service => (
                    <Tag key={service} color="blue">{service}</Tag>
                  ))}
                </Space>
              </Descriptions.Item>
              {quoteRequest.note && (
                <Descriptions.Item label="备注" span={2}>{quoteRequest.note}</Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* 跟进记录 */}
          <Card title="跟进记录">
            <Timeline>
              {followups.length === 0 ? (
                <Timeline.Item>
                  <Text type="secondary">暂无跟进记录</Text>
                </Timeline.Item>
              ) : (
                followups.map(followup => (
                  <Timeline.Item
                    key={followup.id}
                    dot={<UserOutlined style={{ fontSize: 16 }} />}
                  >
                    <div>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>{followup.note}</Text>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(followup.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                        </Text>
                        {followup.nextActionAt && (
                          <>
                            <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                              | 下次跟进：{dayjs(followup.nextActionAt).format('YYYY-MM-DD HH:mm')}
                            </Text>
                          </>
                        )}
                      </div>
                    </div>
                  </Timeline.Item>
                ))
              )}
            </Timeline>
          </Card>
        </Col>
      </Row>

      {/* 更新状态模态框 */}
      <Modal
        title="更新状态"
        open={isStatusModalVisible}
        onCancel={() => {
          setIsStatusModalVisible(false);
          statusForm.resetFields();
        }}
        onOk={() => statusForm.submit()}
      >
        <Form
          form={statusForm}
          layout="vertical"
          onFinish={handleUpdateStatus}
        >
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Select.Option value="open">待处理</Select.Option>
              <Select.Option value="pending">处理中</Select.Option>
              <Select.Option value="contacted">已联系</Select.Option>
              <Select.Option value="closed">已关闭</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="note" label="备注">
            <TextArea rows={4} placeholder="可选" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加跟进模态框 */}
      <Modal
        title="添加跟进记录"
        open={isFollowupModalVisible}
        onCancel={() => {
          setIsFollowupModalVisible(false);
          followupForm.resetFields();
        }}
        onOk={() => followupForm.submit()}
      >
        <Form
          form={followupForm}
          layout="vertical"
          onFinish={handleAddFollowup}
        >
          <Form.Item
            name="note"
            label="跟进备注"
            rules={[{ required: true, message: '请输入跟进备注' }]}
          >
            <TextArea rows={4} placeholder="请输入跟进内容" />
          </Form.Item>
          <Form.Item name="nextActionAt" label="下次跟进时间">
            <Input type="datetime-local" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QuoteRequestDetail;

