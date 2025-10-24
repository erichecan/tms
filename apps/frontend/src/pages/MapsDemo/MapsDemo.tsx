// ============================================================================
// 地图演示页面 - 二期开发功能
// 创建时间: 2025-10-10
// 状态: 已注释，二期恢复
// 说明: 此页面包含Google Maps API演示功能，在一期版本中暂时不使用
// 二期恢复时，请取消注释并确保API密钥配置正确
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Input, Button, Select, Alert, Spin, Divider } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import LogisticsMap from '@/components/Maps/LogisticsMap';
import mapsService from '@/services/mapsService';
import { AddressInfo, LogisticsRoute } from '@/types/maps';
import './MapsDemo.css';

const { Option } = Select;

const MapsDemo: React.FC = () => {
  const [isMapsInitialized, setIsMapsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [pickupAddress, setPickupAddress] = useState<AddressInfo | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<AddressInfo | null>(null);
  const [calculatedRoute, setCalculatedRoute] = useState<LogisticsRoute | null>(null);
  
  const [form] = Form.useForm();

  // 初始化地图服务
  useEffect(() => {
    const initializeMaps = async () => {
      try {
        setIsLoading(true);
        await mapsService.initialize();
        setIsMapsInitialized(true);
        setError(null);
      } catch (err) {
        console.error('Failed to initialize maps:', err);
        setError('地图服务初始化失败，请检查API密钥配置');
      } finally {
        setIsLoading(false);
      }
    };

    initializeMaps();
  }, []);

  // 地址搜索函数
  const searchAddress = async (address: string, type: 'pickup' | 'delivery') => {
    if (!address.trim()) return;
    
    try {
      setIsLoading(true);
      const addressInfo = await mapsService.geocodeAddress(address);
      
      if (type === 'pickup') {
        setPickupAddress(addressInfo);
      } else {
        setDeliveryAddress(addressInfo);
      }
      
      setError(null);
    } catch (err) {
      console.error('Address search failed:', err);
      setError(`地址搜索失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 计算路线
  const calculateRoute = async () => {
    if (!pickupAddress || !deliveryAddress) {
      setError('请先选择取货和送货地址');
      return;
    }

    try {
      setIsLoading(true);
      const route = await mapsService.calculateRoute(pickupAddress, deliveryAddress);
      setCalculatedRoute(route);
      setError(null);
    } catch (err) {
      console.error('Route calculation failed:', err);
      setError(`路线计算失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 预设地址示例
  const presetAddresses = [
    { label: 'WH_07仓库 (示例)', value: '1234 Industrial Rd, Mississauga, ON' },
    { label: 'AMZ_YYZ9仓库 (示例)', value: '2450 Derry Rd E, Mississauga, ON' },
    { label: '多伦多市中心', value: 'Toronto City Hall, Toronto, ON' },
    { label: '密西沙加物流中心', value: '6900 Airport Rd, Mississauga, ON' },
  ];

  return (
    <div className="maps-demo-container">
      <Card title="🗺️ Google Maps API 集成演示" className="demo-card">
        {error && (
          <Alert
            message="错误"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {!isMapsInitialized ? (
          <div className="loading-container">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
            <div style={{ marginTop: 16 }}>正在初始化地图服务...</div>
          </div>
        ) : (
          <>
            
            <Card title="地址配置" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form form={form} layout="vertical">
                    <Form.Item label="取货地址">
                      <Input.Search
                        placeholder="输入取货地址或选择预设地址"
                        enterButton="搜索"
                        onSearch={(value) => searchAddress(value, 'pickup')}
                        loading={isLoading}
                      />
                    </Form.Item>
                    
                    <Form.Item label="预设地址">
                      <Select 
                        placeholder="选择预设地址"
                        onChange={(value) => searchAddress(value, 'pickup')}
                      >
                        {presetAddresses.map(addr => (
                          <Option key={addr.value} value={addr.value}>
                            {addr.label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Form>
                  
                  {pickupAddress && (
                    <div className="address-info">
                      <h4>取货地址信息:</h4>
                      <p><strong>地址:</strong> {pickupAddress.formattedAddress}</p>
                      <p><strong>坐标:</strong> {pickupAddress.latitude.toFixed(6)}, {pickupAddress.longitude.toFixed(6)}</p>
                      {pickupAddress.city && <p><strong>城市:</strong> {pickupAddress.city}</p>}
                    </div>
                  )}
                </Col>

                <Col span={12}>
                  <Form form={form} layout="vertical">
                    <Form.Item label="送货地址">
                      <Input.Search
                        placeholder="输入送货地址或选择预设地址"
                        enterButton="搜索"
                        onSearch={(value) => searchAddress(value, 'delivery')}
                        loading={isLoading}
                      />
                    </Form.Item>
                    
                    <Form.Item label="预设地址">
                      <Select 
                        placeholder="选择预设地址"
                        onChange={(value) => searchAddress(value, 'delivery')}
                      >
                        {presetAddresses.map(addr => (
                          <Option key={addr.value} value={addr.value}>
                            {addr.label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Form>
                  
                  {deliveryAddress && (
                    <div className="address-info">
                      <h4>送货地址信息:</h4>
                      <p><strong>地址:</strong> {deliveryAddress.formattedAddress}</p>
                      <p><strong>坐标:</strong> {deliveryAddress.latitude.toFixed(6)}, {deliveryAddress.longitude.toFixed(6)}</p>
                      {deliveryAddress.city && <p><strong>城市:</strong> {deliveryAddress.city}</p>}
                    </div>
                  )}
                </Col>
              </Row>

              <Divider />
              
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Button 
                  type="primary" 
                  size="large"
                  onClick={calculateRoute}
                  disabled={!pickupAddress || !deliveryAddress || isLoading}
                  loading={isLoading}
                >
                  🚛 计算最优路线
                </Button>
              </div>
            </Card>

            
            <Card title="物流路径地图" size="small">
              <LogisticsMap
                pickupAddress={pickupAddress || undefined}
                deliveryAddress={deliveryAddress || undefined}
                routeData={calculatedRoute || undefined}
                showRoute={!!calculatedRoute}
                showMarkers={true}
                height="500px"
                onMapClick={(lat, lng) => {
                  console.log('地图点击坐标:', lat, lng);
                }}
                onMarkerClick={(address) => {
                  console.log('标记点击:', address);
                }}
              />
            </Card>

            
            {calculatedRoute && (
              <Card title="路线详细信息" size="small" style={{ marginTop: 16 }}>
                <Row gutter={16}>
                  <Col span={8}>
                    <div className="route-stat">
                      <div className="stat-label">总距离</div>
                      <div className="stat-value">{calculatedRoute.optimalRoute.distance.toFixed(1)} km</div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div className="route-stat">
                      <div className="stat-label">预计时间</div>
                      <div className="stat-value">{Math.ceil(calculatedRoute.optimalRoute.duration)} 分钟</div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div className="route-stat">
                      <div className="stat-label">燃油成本</div>
                      <div className="stat-value">CAD ${calculatedRoute.optimalRoute.fuelCost.toFixed(2)}</div>
                    </div>
                  </Col>
                </Row>
                
                <Divider />
                
                <div className="route-breakdown">
                  <h4>成本估算:</h4>
                  <ul>
                    <li>基础费用: CAD $80.00</li>
                    <li>距离费用: CAD ${(calculatedRoute.optimalRoute.distance * 2.00).toFixed(2)}</li>
                    <li>时间成本: CAD ${(calculatedRoute.optimalRoute.duration / 60 * 25).toFixed(2)}</li>
                    <li>燃油成本: CAD ${calculatedRoute.optimalRoute.fuelCost.toFixed(2)}</li>
                    <li><strong>总计: CAD ${(80 + calculatedRoute.optimalRoute.distance * 2.00 + calculatedRoute.optimalRoute.duration / 60 * 25 + calculatedRoute.optimalRoute.fuelCost).toFixed(2)}</strong></li>
                  </ul>
                </div>
              </Card>
            )}

            
            <Card title="功能说明" size="small" style={{ marginTop: 16 }}>
              <div className="feature-description">
                <h4>已实现的功能:</h4>
                <ul>
                  <li>✅ Google Maps JavaScript API 集成</li>
                  <li>✅ 地址搜索和地理编码</li>
                  <li>✅ 物流路径规划和显示</li>
                  <li>✅ 实时交通状况集成</li>
                  <li>✅ 成本估算模型</li>
                  <li>✅ 响应式地图界面</li>
                </ul>
                
                <h4>下一步开发计划:</h4>
                <ul>
                  <li>🔜 多订单路径优化</li>
                  <li>🔜 智能调度算法</li>
                  <li>🔜 实时车辆跟踪</li>
                  <li>🔜 业务场景差异化定价</li>
                </ul>
              </div>
            </Card>
          </>
        )}
      </Card>
    </div>
  );
};

export default MapsDemo;