import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Alert, Spin, Form, Input, message } from 'antd';
import { EnvironmentOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import mapsService from '../../services/mapsService';

const { Title, Text } = Typography;

const MapsTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<{
    initialization: boolean;
    geocoding: boolean;
    reverseGeocoding: boolean;
    error?: string;
  } | null>(null);
  const [address, setAddress] = useState('3401 Dufferin St, North York, ON M6A 2T9');
  const [geocodingResult, setGeocodingResult] = useState<any>(null);
  const [form] = Form.useForm();

  const runMapsTest = async () => {
    setLoading(true);
    setTestResults(null);
    setGeocodingResult(null);

    try {
      const results = {
        initialization: false,
        geocoding: false,
        reverseGeocoding: false,
      };

      // 测试1: 初始化地图服务
      console.log('🚀 开始测试地图服务初始化...');
      try {
        await mapsService.initialize();
        results.initialization = true;
        console.log('✅ 地图服务初始化成功');
      } catch (error) {
        console.error('❌ 地图服务初始化失败:', error);
        results.error = `初始化失败: ${error instanceof Error ? error.message : String(error)}`;
        setTestResults(results);
        setLoading(false);
        return;
      }

      // 测试2: 地址解析（Geocoding）
      console.log('🚀 开始测试地址解析...');
      try {
        const geocodeResult = await mapsService.geocodeAddress(address);
        results.geocoding = true;
        setGeocodingResult(geocodeResult);
        console.log('✅ 地址解析成功:', geocodeResult);
      } catch (error) {
        console.error('❌ 地址解析失败:', error);
        results.error = `地址解析失败: ${error instanceof Error ? error.message : String(error)}`;
      }

      // 测试3: 反向地址解析
      console.log('🚀 开始测试反向地址解析...');
      try {
        const reverseResult = await mapsService.reverseGeocode(43.7615, -79.4635);
        results.reverseGeocoding = true;
        console.log('✅ 反向地址解析成功:', reverseResult);
      } catch (error) {
        console.error('❌ 反向地址解析失败:', error);
        if (!results.error) {
          results.error = `反向地址解析失败: ${error instanceof Error ? error.message : String(error)}`;
        }
      }

      setTestResults(results);
      console.log('📊 测试结果:', results);

    } catch (error) {
      console.error('💥 测试过程中发生未知错误:', error);
      setTestResults({
        initialization: false,
        geocoding: false,
        reverseGeocoding: false,
        error: `未知错误: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddressTest = async (values: { address: string }) => {
    setAddress(values.address);
    await runMapsTest();
  };

  useEffect(() => {
    // 页面加载时自动运行测试
    runMapsTest();
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>🗺️ Google Maps API 测试页面</Title>
      <Text type="secondary">此页面专门用于测试 Google Maps API 的调用情况</Text>

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
              placeholder="请输入要测试的地址，例如：3401 Dufferin St, North York, ON M6A 2T9"
              prefix={<EnvironmentOutlined />}
            />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              运行地图API测试
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
              <Text strong>地图服务初始化:</Text>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {testResults.reverseGeocoding ? (
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
              ) : (
                <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '16px' }} />
              )}
              <Text strong>反向地址解析:</Text>
              <Text>{testResults.reverseGeocoding ? '成功' : '失败'}</Text>
            </div>

            {testResults.error && (
              <Alert
                message="测试错误"
                description={testResults.error}
                type="error"
                showIcon
              />
            )}

            {geocodingResult && (
              <Card size="small" title="地址解析结果">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Text><strong>格式化地址:</strong> {geocodingResult.formattedAddress}</Text>
                  <Text><strong>纬度:</strong> {geocodingResult.latitude}</Text>
                  <Text><strong>经度:</strong> {geocodingResult.longitude}</Text>
                  <Text><strong>城市:</strong> {geocodingResult.city || 'N/A'}</Text>
                  <Text><strong>省份:</strong> {geocodingResult.province || 'N/A'}</Text>
                  <Text><strong>国家:</strong> {geocodingResult.country || 'N/A'}</Text>
                  <Text><strong>邮政编码:</strong> {geocodingResult.postalCode || 'N/A'}</Text>
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
            message="Google Maps API 计费问题"
            description="如果测试失败，请检查 Google Cloud 项目是否已启用计费功能。错误信息通常为 'REQUEST_DENIED' 或 'You must enable Billing on the Google Cloud Project'"
            type="warning"
            showIcon
          />
          
          <Alert
            message="API 密钥配置"
            description="确保 VITE_GOOGLE_MAPS_API_KEY 环境变量已正确设置，并且 API 密钥具有必要的权限（Geocoding API、Maps JavaScript API）"
            type="info"
            showIcon
          />
          
          <Alert
            message="网络连接问题"
            description="检查网络连接是否正常，确保能够访问 Google Maps API 服务"
            type="info"
            showIcon
          />
        </div>
      </Card>

      {loading && (
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Spin size="large" />
          <Text style={{ display: 'block', marginTop: '8px' }}>正在测试地图 API...</Text>
        </div>
      )}
    </div>
  );
};

export default MapsTest;