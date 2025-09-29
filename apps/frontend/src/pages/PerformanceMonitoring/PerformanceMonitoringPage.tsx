// 性能监控页面
// 创建时间: 2025-09-29 22:05:00
// 作用: 系统性能监控和缓存策略管理的主页面

import React from 'react';
import { Typography } from 'antd';
import PageLayout from '../../components/Layout/PageLayout';
import PerformanceMonitoring from '../../components/PerformanceMonitoring/PerformanceMonitoring';

const { Title, Text } = Typography;

const PerformanceMonitoringPage: React.FC = () => {
  return (
    <PageLayout>
      <div style={{ padding: '24px', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: 16 }}>
          <Title level={3}>📊 性能监控</Title>
          <Text type="secondary">系统性能监控和缓存策略管理</Text>
        </div>
        
        <PerformanceMonitoring />
      </div>
    </PageLayout>
  );
};

export default PerformanceMonitoringPage;
