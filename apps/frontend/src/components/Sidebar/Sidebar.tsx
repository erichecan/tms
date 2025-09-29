import React, { useState } from 'react';
import { Layout, Menu, Button, Tooltip } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  PlusOutlined,
  TeamOutlined,
  DollarOutlined,
  TruckOutlined,
  UserOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FileTextOutlined,
  CarOutlined,
  UploadOutlined,
  BarChartOutlined,
  ToolOutlined,
  TrophyOutlined,
  EnvironmentOutlined,
  BranchesOutlined,
  HistoryOutlined,
  DashboardOutlined,
  LockOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Sider } = Layout;

interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const handleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    onCollapse?.(collapsed);
  };

  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/create-shipment',
      icon: <PlusOutlined />,
      label: '创建运单',
    },
    {
      key: '/fleet-management',
      icon: <TruckOutlined />,
      label: '车队管理',
    },
    {
      key: '/finance-settlement',
      icon: <DollarOutlined />,
      label: '财务结算',
    },
    {
      type: 'divider',
    },
    {
      key: '/customers',
      icon: <UserOutlined />,
      label: '客户管理',
    },
    {
      key: '/trip-management',
      icon: <CarOutlined />,
      label: '行程管理',
    },
    {
      type: 'divider',
    },
    {
      key: '/admin',
      icon: <SettingOutlined />,
      label: '管理后台',
      children: [
        {
          key: '/admin/shipments',
          icon: <FileTextOutlined />,
          label: '运单管理',
        },
        {
          key: '/admin/batch-import',
          icon: <UploadOutlined />,
          label: '批量导入',
        },
        {
          key: '/admin/drivers',
          icon: <TeamOutlined />,
          label: '司机管理',
        },
        {
          key: '/admin/vehicles',
          icon: <TruckOutlined />,
          label: '车辆管理',
        },
        {
          key: '/admin/rules',
          icon: <SettingOutlined />,
          label: '规则管理',
        },
        {
          key: '/admin/financial-reports',
          icon: <BarChartOutlined />,
          label: '财务报告',
        },
        {
          key: '/admin/vehicle-maintenance',
          icon: <ToolOutlined />,
          label: '车辆维护',
        },
        {
          key: '/admin/driver-performance',
          icon: <TrophyOutlined />,
          label: '司机绩效',
        },
        {
          key: '/admin/real-time-tracking',
          icon: <EnvironmentOutlined />,
          label: '实时跟踪',
        },
        {
          key: '/admin/route-optimization',
          icon: <BranchesOutlined />,
          label: '路径优化',
        },
        {
          key: '/admin/rule-version-management',
          icon: <HistoryOutlined />,
          label: '规则版本',
        },
        {
          key: '/admin/performance-monitoring',
          icon: <DashboardOutlined />,
          label: '性能监控',
        },
        {
          key: '/admin/granular-permissions',
          icon: <LockOutlined />,
          label: '权限控制',
        },
      ],
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={isCollapsed}
      width={240}
      collapsedWidth={80}
      style={{
        background: '#fff',
        borderRight: '1px solid #f0f0f0',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 1000,
      }}
    >
      {/* Logo区域 */}
      <div
        style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          padding: isCollapsed ? '0' : '0 24px',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        {isCollapsed ? (
          <TruckOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <TruckOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '8px' }} />
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
              TMS v3.0-PC
            </span>
          </div>
        )}
      </div>

      {/* 导航菜单 */}
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{
          borderRight: 0,
          height: 'calc(100vh - 64px)',
          overflowY: 'auto',
        }}
      />

      {/* 收窄/展开按钮 */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: isCollapsed ? '50%' : '16px',
          transform: isCollapsed ? 'translateX(-50%)' : 'none',
        }}
      >
        <Tooltip title={isCollapsed ? '展开导航' : '收窄导航'} placement="right">
          <Button
            type="text"
            icon={isCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => handleCollapse(!isCollapsed)}
            style={{
              width: isCollapsed ? '32px' : 'auto',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
        </Tooltip>
      </div>
    </Sider>
  );
};

export default Sidebar;
