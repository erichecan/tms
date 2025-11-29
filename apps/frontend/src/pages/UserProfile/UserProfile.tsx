// 个人资料页面
// 创建时间: 2025-11-29T11:25:04Z
// 完成 Home.tsx 中的 TODO：实现个人资料页面

import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Space,
  Typography,
  Avatar,
  Divider,
  Row,
  Col,
} from 'antd';
import {
  UserOutlined,
  SaveOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { usersApi } from '../../services/api';

const { Title, Text } = Typography;

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        phone: user.phone,
      });
    }
  }, [user, form]);

  const handleSubmit = async (values: any) => {
    if (!user?.id) {
      message.error('用户信息不存在');
      return;
    }

    setLoading(true);
    try {
      await usersApi.updateUser(user.id, values);
      message.success('个人资料更新成功');
    } catch (error: any) {
      message.error(`更新失败: ${error.response?.data?.error?.message || error.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: 800, margin: '0 auto' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Avatar size={80} icon={<UserOutlined />} style={{ marginBottom: 16 }} />
            <Title level={4} style={{ margin: 0 }}>{user?.name || '用户'}</Title>
            <Text type="secondary">{user?.email || ''}</Text>
          </div>

          <Divider />

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="姓名"
                  rules={[{ required: true, message: '请输入姓名' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="请输入姓名" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label="邮箱"
                  rules={[
                    { required: true, message: '请输入邮箱' },
                    { type: 'email', message: '请输入有效的邮箱地址' },
                  ]}
                >
                  <Input type="email" placeholder="请输入邮箱" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="phone"
              label="手机号"
              rules={[
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
              ]}
            >
              <Input placeholder="请输入手机号" />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                  保存
                </Button>
                <Button
                  icon={<LockOutlined />}
                  onClick={() => {
                    message.info('修改密码功能待实现');
                  }}
                >
                  修改密码
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
};

export default UserProfile;

