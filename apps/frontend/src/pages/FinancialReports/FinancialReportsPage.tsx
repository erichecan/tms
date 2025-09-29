// 财务报告页面
// 创建时间: 2025-09-29 15:20:00
// 作用: 高级财务分析和报表功能的主页面

import React from 'react';
import { Typography, Card } from 'antd';
import PageLayout from '../../components/Layout/PageLayout';
import FinancialDashboard from '../../components/FinancialReports/FinancialDashboard';

const { Title, Text } = Typography;

const FinancialReportsPage: React.FC = () => {
  return (
    <PageLayout>
      <div style={{ padding: '24px', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: 16 }}>
          <Title level={3}>📊 财务分析报表</Title>
          <Text type="secondary">全面的财务数据分析和报表生成功能</Text>
        </div>
        
        <FinancialDashboard />
      </div>
    </PageLayout>
  );
};

export default FinancialReportsPage;
