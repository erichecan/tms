// 2025-11-11T15:35:32Z Added by Assistant: Driver authentication via backend
// 2025-11-30T10:36:00Z Refactored by Assistant: 使用 Ant Design Mobile 组件重构登录页面
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Form, Input, Button, Toast } from 'antd-mobile';
import { authApi, TOKEN_STORAGE_KEY } from '../../services/api';
import { LoginPayload } from '../../types';

export default function Login() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 邮箱格式验证
  const validateEmail = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error('请输入邮箱'));
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return Promise.reject(new Error('请输入有效的邮箱地址'));
    }
    return Promise.resolve();
  };

  // 密码验证
  const validatePassword = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error('请输入密码'));
    }
    if (value.length < 6) {
      return Promise.reject(new Error('密码长度至少6位'));
    }
    return Promise.resolve();
  };

  const handleSubmit = async (values: { email: string; password: string }) => {
    const payload: LoginPayload = {
      email: values.email.trim(),
      password: values.password.trim(),
    };

    try {
      setLoading(true);
      const authResponse = await authApi.login(payload);
      if (!authResponse.user || !localStorage.getItem(TOKEN_STORAGE_KEY)) {
        throw new Error('登录响应无效');
      }
      Toast.show({
        icon: 'success',
        content: '登录成功',
      });
      navigate('/dashboard');
    } catch (err: any) {
      console.error('司机登录失败:', err);
      const errorMessage = err?.response?.data?.error?.message || err?.message || '登录失败，请检查账号或稍后再试';
      Toast.show({
        icon: 'fail',
        content: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <NavBar back={null} style={{ background: '#1890ff', color: '#fff' }}>
        司机登录
      </NavBar>
      
      <div style={{ 
        padding: '40px 24px', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 45px)',
      }}>
        <div style={{ 
          marginBottom: 40, 
          textAlign: 'center' 
        }}>
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: 'bold', 
            margin: 0,
            color: '#333',
          }}>
            TMS 物流系统
          </h1>
          <p style={{ 
            fontSize: 14, 
            color: '#888', 
            marginTop: 8 
          }}>
            司机移动端
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          footer={
            <Button
              block
              type="submit"
              color="primary"
              size="large"
              loading={loading}
              style={{ marginTop: 16 }}
            >
              {loading ? '登录中...' : '进入任务面板'}
            </Button>
          }
        >
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ validator: validateEmail }]}
          >
            <Input 
              placeholder="请输入邮箱" 
              type="email"
              clearable
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ validator: validatePassword }]}
          >
            <Input 
              placeholder="请输入密码" 
              type="password"
              clearable
              autoComplete="current-password"
            />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
