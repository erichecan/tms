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
      <Layout style={{ marginLeft: sidebarCollapsed ? 80 : 240 }}>
        <Content
          style={{
            margin: '0',
            padding: '24px',
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
