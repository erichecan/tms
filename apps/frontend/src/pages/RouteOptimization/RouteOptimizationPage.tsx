// 路径优化页面
// 创建时间: 2025-09-29 21:45:00
// 作用: 行程路径优化和智能路线规划的主页面

import React from 'react';
import { Typography } from 'antd';
import PageLayout from '../../components/Layout/PageLayout';
import RouteOptimization from '../../components/RouteOptimization/RouteOptimization';

const { Title, Text } = Typography;

const RouteOptimizationPage: React.FC = () => {
  return (
    <PageLayout>
      <div style={{ padding: '24px', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: 16 }}>
          <Title level={3}>🗺️ 路径优化</Title>
          <Text type="secondary">智能路线规划和行程优化算法</Text>
        </div>
        
        <RouteOptimization />
      </div>
    </PageLayout>
  );
};

export default RouteOptimizationPage;
