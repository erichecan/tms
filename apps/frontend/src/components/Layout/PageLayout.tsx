import React, { useState } from 'react';
import { Layout } from 'antd';
import Sidebar from '../Sidebar/Sidebar';

const { Content } = Layout;

interface PageLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, showSidebar = true }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onCollapse={setSidebarCollapsed} 
      />
      <Layout style={{ marginLeft: 0 }}>
        <Content
          style={{
            margin: '0',
            padding: '24px 24px 24px 24px',
            paddingLeft: sidebarCollapsed ? '104px' : '264px', // 侧边栏宽度 + 24px间距
            background: '#ffffff',
            minHeight: '100vh',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default PageLayout;
