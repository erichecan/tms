// 细粒度权限控制页面
// 创建时间: 2025-09-29 22:15:00
// 作用: 资源级权限控制和用户角色管理的主页面

import React from 'react';
import { Typography } from 'antd';
import PageLayout from '../../components/Layout/PageLayout';
import GranularPermissions from '../../components/GranularPermissions/GranularPermissions';

const { Title, Text } = Typography;

const GranularPermissionsPage: React.FC = () => {
  return (
    <PageLayout>
      <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: 16 }}>
          <Title level={3}>🔐 细粒度权限控制</Title>
          <Text type="secondary">资源级权限控制和用户角色管理</Text>
        </div>
        
        <GranularPermissions />
      </div>
    </PageLayout>
  );
};

export default GranularPermissionsPage;
