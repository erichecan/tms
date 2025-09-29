// 实时跟踪页面
// 创建时间: 2025-09-29 21:35:00
// 作用: 车队实时位置跟踪功能的主页面

import React from 'react';
import { Typography } from 'antd';
import PageLayout from '../../components/Layout/PageLayout';
import RealTimeTracking from '../../components/RealTimeTracking/RealTimeTracking';

const { Title, Text } = Typography;

const RealTimeTrackingPage: React.FC = () => {
  return (
    <PageLayout>
      <div style={{ padding: '24px', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: 16 }}>
          <Title level={3}>📍 实时位置跟踪</Title>
          <Text type="secondary">车队实时位置监控和跟踪管理</Text>
        </div>
        
        <RealTimeTracking />
      </div>
    </PageLayout>
  );
};

export default RealTimeTrackingPage;
