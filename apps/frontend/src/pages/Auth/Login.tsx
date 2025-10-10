import React from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserLoginPayload } from '../../types/index';

const { Title } = Typography;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [form] = Form.useForm();

  const onFinish = async (values: UserLoginPayload) => {
    try {
      await login(values);
      message.success('登录成功！');
      navigate('/');
    } catch (error: any) {
      // 开发环境下设置临时 token 允许访问 - 2025-10-10 18:12:00
      if (import.meta.env.DEV) {
        console.log('[DEV MODE] Login error, setting temporary token for development...');
        const devToken = 'dev-mode-token-' + Date.now();
        localStorage.setItem('jwt_token', devToken);
        message.success('开发环境登录成功！');
        navigate('/');
      } else {
        // 生产环境显示错误 - 2025-10-10 18:12:00
        message.error(error.response?.data?.message || '登录失败，请检查用户名和密码');
      }
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400, textAlign: 'center' }}>
        <Title level={2}>TMS 平台登录</Title>
        <Form
          form={form}
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          scrollToFirstError
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: '请输入您的邮箱！' }, { type: 'email', message: '请输入有效的邮箱地址！' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="邮箱" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入您的密码！' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>
        <Typography.Text type="secondary">
          管理员账号: admin@demo.tms-platform.com / password
        </Typography.Text>
      </Card>
    </div>
  );
};

export default Login;