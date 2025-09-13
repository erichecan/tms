import React, { useState } from 'react';
import { Layout as AntLayout, Menu, theme, Button, Space } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  SettingOutlined,
  CarOutlined,
  DollarOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const { Header, Sider, Content } = AntLayout;

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="demo-logo-vertical" style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 6 }} />
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['1']}
          items={[
            {
              key: '1',
              icon: <DashboardOutlined />,
              label: 'Dashboard',
              onClick: () => navigate('/'),
            },
            {
              key: '2',
              icon: <SettingOutlined />,
              label: '规则管理',
              onClick: () => navigate('/rules'),
            },
            {
              key: '3',
              icon: <CarOutlined />,
              label: '运单管理',
              onClick: () => navigate('/shipments'),
            },
            {
              key: '4',
              icon: <DollarOutlined />,
              label: '财务结算',
              onClick: () => navigate('/finance'),
            },
          ]}
        />
      </Sider>
      <AntLayout>
        <Header style={{ padding: 0, background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <Space style={{ marginRight: 24 }}>
            <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>
              退出
            </Button>
          </Space>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default AppLayout;