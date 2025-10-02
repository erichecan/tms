import React, { useState, useEffect } from 'react';
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
  // 菜单展开状态管理 - 添加时间戳注释 @ 2025-09-30 09:15:00
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  const handleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    onCollapse?.(collapsed);
  };

  // 根据当前路径自动展开对应的菜单 - 添加时间戳注释 @ 2025-09-30 09:15:00
  useEffect(() => {
    // 2025-10-01 15:06:20 特殊处理：当进入“运单管理”时不要展开“管理后台”下拉
    if (location.pathname.startsWith('/admin/shipments')) {
      setOpenKeys([]);
      return;
    }

    if (location.pathname.startsWith('/admin')) {
      setOpenKeys(['/admin']);
    } else {
      setOpenKeys([]);
    }
  }, [location.pathname]);

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
    // 将运单管理移动到创建运单与车队管理之间 // 2025-10-01 14:20:30
    {
      key: '/admin/shipments',
      icon: <FileTextOutlined />,
      label: '运单管理',
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
    // 2025-10-02 18:55:00 - 行程管理已整合到车队管理页面中
    {
      type: 'divider',
    },
    {
      key: '/admin',
      icon: <SettingOutlined />,
      label: '管理后台',
      children: [
        // 运单管理已提升到一级菜单 // 2025-10-01 14:20:30
        {
          key: '/admin/batch-import',
          icon: <UploadOutlined />,
          label: '批量导入',
        },
        // 2025-10-02 17:25:00 - 司机管理和车辆管理功能已整合到车队管理中
        {
          key: '/admin/rules',
          icon: <SettingOutlined />,
          label: '规则管理',
        },
        // 2025-10-02 18:35:00 - 已整合的页面功能已移除:
        // - 财务报告 → 整合到财务管理页面(财务报表标签页)
        // - 车辆维护 → 整合到车队管理页面(车辆维护标签页)
        // - 司机绩效 → 整合到车队管理页面(司机绩效标签页)
        // - 实时跟踪 → 整合到车队管理页面(实时跟踪标签页)
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
        // 2025-10-02 18:35:00 - 性能监控 → 整合到仪表板页面(系统监控标签页)
        {
          key: '/admin/granular-permissions',
          icon: <LockOutlined />,
          label: '权限控制',
        },
      ],
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    // 2025-10-01 15:06:20 点击“运单管理”时，显式收起“管理后台”下拉
    if (key === '/admin/shipments') {
      setOpenKeys([]);
    }
    navigate(key);
  };

  // 处理菜单展开/收起事件 - 添加时间戳注释 @ 2025-09-30 09:15:00
  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
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
        openKeys={openKeys}
        items={menuItems}
        onClick={handleMenuClick}
        onOpenChange={handleOpenChange}
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
