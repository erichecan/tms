// 规则版本管理页面
// 创建时间: 2025-09-29 21:55:00
// 作用: 规则版本管理和发布审批流程的主页面

import React from 'react';
import { Typography } from 'antd';
import PageLayout from '../../components/Layout/PageLayout';
import RuleVersionManagement from '../../components/RuleVersionManagement/RuleVersionManagement';

const { Title, Text } = Typography;

const RuleVersionManagementPage: React.FC = () => {
  return (
    <PageLayout>
      <div style={{ marginBottom: 16 }}>
        <Title level={3}>📋 规则版本管理</Title>
        <Text type="secondary">规则版本管理和发布审批流程</Text>
      </div>
        
      <RuleVersionManagement />
    </PageLayout>
  );
};

export default RuleVersionManagementPage;
