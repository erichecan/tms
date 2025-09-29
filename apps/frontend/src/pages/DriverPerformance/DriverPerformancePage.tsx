// 司机绩效考核和薪酬计算页面
// 创建时间: 2025-09-29 15:55:00
// 作用: 司机绩效考核和薪酬计算功能的主页面

import React from 'react';
import { Typography } from 'antd';
import PageLayout from '../../components/Layout/PageLayout';
import DriverPerformance from '../../components/DriverPerformance/DriverPerformance';

const { Title, Text } = Typography;

const DriverPerformancePage: React.FC = () => {
  return (
    <PageLayout>
      <div style={{ padding: '24px', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: 16 }}>
          <Title level={3}>👨‍💼 司机绩效考核</Title>
          <Text type="secondary">管理司机绩效考核、薪酬计算和绩效分析</Text>
        </div>
        
        <DriverPerformance />
      </div>
    </PageLayout>
  );
};

export default DriverPerformancePage;
