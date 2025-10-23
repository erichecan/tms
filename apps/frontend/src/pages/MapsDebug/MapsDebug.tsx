// ============================================================================
// 地图调试页面 - 二期开发功能
// 创建时间: 2025-10-10
// 状态: 已注释，二期恢复
// 说明: 此页面包含Google Maps API调试功能，在一期版本中暂时不使用
// 二期恢复时，请取消注释并确保API密钥配置正确
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Alert, Spin, Form, Input, message } from 'antd';
import { EnvironmentOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// 直接导入地图服务进行测试
const MapsDebug: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<{
    initialization: boolean;
    geocoding: boolean;
    error?: string;
    details?: string;
  } | null>(null);
  const [address, setAddress] = useState('3401 Dufferin St, North York, ON M6A 2T9');
  const [geocodingResult, setGeocodingResult] = useState<any>(null);
  const [form] = Form.useForm();

  // 直接测试 Google Maps API
  const testGoogleMapsDirectly = async (testAddress: string) => {
    setLoading(true);
    setTestResults(null);
    setGeocodingResult(null);

    try {
      console.log('🚀 开始直接测试 Google Maps API...');

      const results: {
        initialization: boolean;
        geocoding: boolean;
        error?: string;
        details?: string;
      } = {
        initialization: false,
        geocoding: false,
      };

      // 测试1: 检查 API Key 配置
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      console.log('🔑 API Key 配置:', apiKey ? '已设置' : '未设置');
      
      if (!apiKey) {
        results.error = 'VITE_GOOGLE_MAPS_API_KEY 环境变量未设置';
        setTestResults(results);
        return;
      }

      // 测试2: 直接调用 Geocoding API
      console.log('🔄 测试 Geocoding API...');
      try {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(testAddress)}&key=${apiKey}`;
        
        const response = await fetch(geocodeUrl);
        const data = await response.json();
        
        console.log('📊 Geocoding API 响应:', data);

        if (data.status === 'OK') {
          results.geocoding = true;
          results.initialization = true;
          setGeocodingResult(data.results[0]);
          console.log('✅ Geocoding API 测试成功');
        } else {
          results.error = `Geocoding API 错误: ${data.status}`;
          results.details = data.error_message || '未知错误';
          console.error('❌ Geocoding API 测试失败:', data.status, data.error_message);
        }
      } catch (error) {
        results.error = `Geocoding API 请求失败: ${error instanceof Error ? error.message : String(error)}`;
        console.error('❌ Geocoding API 请求异常:', error);
      }

      setTestResults(results);

    } catch (error) {
      console.error('💥 测试过程中发生未知错误:', error);
      setTestResults({
        initialization: false,
        geocoding: false,
        error: `未知错误: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddressTest = async (values: { address: string }) => {
    setAddress(values.address);
    await testGoogleMapsDirectly(values.address);
  };

  useEffect(() => {
    // 页面加载时自动运行测试
    testGoogleMapsDirectly(address);
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', minHeight: '100vh' }}>
      <Title level={2}>🔧 Google Maps API 直接调试页面</Title>
      <Text type="secondary">此页面绕过认证，直接测试 Google Maps API 连接</Text>

      <Card style={{ marginTop: '24px' }}>
        <Title level={4}>API 配置信息</Title>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Text><strong>API Key 状态:</strong> {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? '✅ 已配置' : '❌ 未配置'}</Text>
          <Text><strong>当前环境:</strong> {import.meta.env.PROD ? '生产环境' : '开发环境'}</Text>
          <Text><strong>主机地址:</strong> {window.location.hostname}</Text>
        </div>
      </Card>

      <Card style={{ marginTop: '24px' }}>
        <Title level={4}>测试配置</Title>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddressTest}
          initialValues={{ address }}
        >
          <Form.Item
            label="测试地址"
            name="address"
            rules={[{ required: true, message: '请输入测试地址' }]}
          >
            <Input 
              placeholder="请输入要测试的地址"
              prefix={<EnvironmentOutlined />}
            />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              运行 API 测试
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {testResults && (
        <Card style={{ marginTop: '24px' }}>
          <Title level={4}>测试结果</Title>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {testResults.initialization ? (
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
              ) : (
                <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '16px' }} />
              )}
              <Text strong>API 初始化:</Text>
              <Text>{testResults.initialization ? '成功' : '失败'}</Text>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {testResults.geocoding ? (
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
              ) : (
                <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '16px' }} />
              )}
              <Text strong>地址解析:</Text>
              <Text>{testResults.geocoding ? '成功' : '失败'}</Text>
            </div>

            {testResults.error && (
              <Alert
                message="测试错误"
                description={
                  <div>
                    <Text>{testResults.error}</Text>
                    {testResults.details && (
                      <div style={{ marginTop: '8px' }}>
                        <Text type="secondary">{testResults.details}</Text>
                      </div>
                    )}
                  </div>
                }
                type="error"
                showIcon
              />
            )}

            {geocodingResult && (
              <Card size="small" title="地址解析结果">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Text><strong>格式化地址:</strong> {geocodingResult.formatted_address}</Text>
                  <Text><strong>纬度:</strong> {geocodingResult.geometry.location.lat}</Text>
                  <Text><strong>经度:</strong> {geocodingResult.geometry.location.lng}</Text>
                  <Text><strong>地址类型:</strong> {geocodingResult.types.join(', ')}</Text>
                  
                  {geocodingResult.address_components && (
                    <div style={{ marginTop: '8px' }}>
                      <Text strong>地址组件:</Text>
                      {geocodingResult.address_components.map((component: any, index: number) => (
                        <div key={index} style={{ marginLeft: '16px' }}>
                          <Text type="secondary">{component.long_name} ({component.short_name}) - {component.types.join(', ')}</Text>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </Card>
      )}

      <Card style={{ marginTop: '24px' }}>
        <Title level={4}>故障排除指南</Title>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Alert
            message="API Key 问题"
            description={
              <div>
                <Text>如果测试失败，请检查：</Text>
                <ul>
                  <li>VITE_GOOGLE_MAPS_API_KEY 环境变量是否正确设置</li>
                  <li>API Key 是否具有 Geocoding API 权限</li>
                  <li>API Key 是否在 Google Cloud 控制台中启用</li>
                </ul>
              </div>
            }
            type="warning"
            showIcon
          />
          
          <Alert
            message="计费问题"
            description="Google Maps API 需要启用计费功能。错误信息通常为 'REQUEST_DENIED' 或 'You must enable Billing on the Google Cloud Project'"
            type="warning"
            showIcon
          />
          
          <Alert
            message="网络限制"
            description="检查网络连接和防火墙设置，确保能够访问 maps.googleapis.com"
            type="info"
            showIcon
          />
        </div>
      </Card>

      {loading && (
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Spin size="large" />
          <Text style={{ display: 'block', marginTop: '8px' }}>正在测试 Google Maps API...</Text>
        </div>
      )}
    </div>
  );
};

// 将此组件设置为无需认证即可访问
export default MapsDebug;