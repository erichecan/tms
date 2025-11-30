import React, { useEffect } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserLoginPayload } from '../../types/index';

const { Title } = Typography;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading, isAuthenticated } = useAuth();
  const [form] = Form.useForm();

  // 2025-11-29T19:30:00 如果已经登录，重定向到目标页面或首页
  useEffect(() => {
    if (isAuthenticated && !loading) {
      const redirectPath = sessionStorage.getItem('redirectAfterLogin') || '/';
      sessionStorage.removeItem('redirectAfterLogin');
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const onFinish = async (values: UserLoginPayload) => {
    try {
      await login(values);
      message.success('登录成功！');
      
      // 2025-11-29T19:30:00 等待认证状态更新完成
      // 导航逻辑由 useEffect 处理，会导航到保存的页面或首页
      const redirectPath = sessionStorage.getItem('redirectAfterLogin') || '/';
      sessionStorage.removeItem('redirectAfterLogin');
      
      // 延迟导航，确保状态已更新
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 100);
    } catch (error: unknown) {
      // 2025-11-29T19:30:00 移除开发环境的临时 token 逻辑，改为显示真实错误
      const axiosError = error as { response?: { data?: { message?: string } } };
      const errorMessage = axiosError.response?.data?.message || '登录失败，请检查用户名和密码';
      
      if (import.meta.env.DEV) {
        console.error('[DEV MODE] Login error:', error);
      }
      
      message.error(errorMessage);
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