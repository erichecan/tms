import React, { useState, useEffect, useMemo } from 'react';
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
import { usePermissions } from '../../contexts/PermissionContext'; // 2025-11-11 10:15:05 引入权限上下文
import { Permission } from '../../types/permissions'; // 2025-11-11 10:15:05 引入权限枚举

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
  const { hasAllPermissions } = usePermissions(); // 2025-11-11 10:15:05 使用权限校验

  const handleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    onCollapse?.(collapsed);
  };

  // 根据当前路径自动展开对应的菜单 - 添加时间戳注释 @ 2025-09-30 09:15:00
  useEffect(() => {
    // 2025-10-03 20:25:00 特殊处理：当进入一级菜单项时不要展开"管理后台"下拉
    const topLevelAdminPaths = [
      '/admin/shipments',  // 运单管理
      '/admin/fleet',      // 车队管理
      '/admin/customers',  // 客户管理
      '/admin/currencies', // 货币管理
    ];
    
    const isTopLevelPath = topLevelAdminPaths.some(path => location.pathname.startsWith(path));
    
    if (isTopLevelPath) {
      setOpenKeys([]);
      return;
    }

    if (location.pathname.startsWith('/admin')) {
      setOpenKeys(['/admin']);
    } else {
      setOpenKeys([]);
    }
  }, [location.pathname]);

  interface NavigationItem {
    key?: string;
    icon?: React.ReactNode;
    label?: React.ReactNode;
    type?: 'divider';
    requiredPermissions?: Permission[];
    children?: NavigationItem[];
  }

  const filterMenuItems = (items: NavigationItem[]): NavigationItem[] =>
    items
      .map((item) => {
        if (item.type === 'divider') {
          return item;
        }
        const required = item.requiredPermissions || [];
        const allowed = required.length === 0 || hasAllPermissions(required);
        if (!allowed) {
          if (item.children) {
            const filteredChildren = filterMenuItems(item.children);
            if (filteredChildren.length === 0) {
              return null;
            }
            return { ...item, children: filteredChildren };
          }
          return null;
        }
        if (item.children) {
          const filteredChildren = filterMenuItems(item.children);
          if (filteredChildren.length === 0) {
            return null;
          }
          return { ...item, children: filteredChildren };
        }
        return item;
      })
      .filter((item): item is NavigationItem => Boolean(item));

  const removeExtraDividers = (items: NavigationItem[]): NavigationItem[] => {
    const result: NavigationItem[] = [];
    items.forEach((item) => {
      if (item.type === 'divider') {
        if (result.length === 0 || result[result.length - 1].type === 'divider') {
          return;
        }
        result.push(item);
      } else {
        result.push(item);
      }
    });
    if (result[result.length - 1]?.type === 'divider') {
      result.pop();
    }
    return result;
  };

  const convertToMenuItems = (items: NavigationItem[]): MenuProps['items'] =>
    items.map((item) => {
      if (item.type === 'divider') {
        return { type: 'divider' } as MenuProps['items'][number];
      }
      return {
        key: item.key!,
        icon: item.icon,
        label: item.label,
        children: item.children ? convertToMenuItems(item.children) : undefined,
      };
    });

  const menuItems = useMemo(() => {
    const rawMenuItems: NavigationItem[] = [
      {
        key: '/',
        icon: <HomeOutlined />,
        label: '首页',
      },
      {
        key: '/create-shipment',
        icon: <PlusOutlined />,
        label: '创建运单',
        requiredPermissions: [Permission.SHIPMENT_CREATE],
      },
      {
        key: '/admin/shipments',
        icon: <FileTextOutlined />,
        label: '运单管理',
        requiredPermissions: [Permission.SHIPMENT_READ],
      },
      {
        key: '/admin/fleet',
        icon: <TruckOutlined />,
        label: '车队管理',
        requiredPermissions: [Permission.TRIP_READ],
      },
      {
        key: '/finance-settlement',
        icon: <DollarOutlined />,
        label: '财务结算',
        requiredPermissions: [Permission.FINANCE_READ],
      },
      { type: 'divider' },
      {
        key: '/customers',
        icon: <UserOutlined />,
        label: '客户管理',
        requiredPermissions: [Permission.CUSTOMER_READ],
      },
      { type: 'divider' },
      {
        key: '/admin',
        icon: <SettingOutlined />,
        label: '管理后台',
        requiredPermissions: [Permission.SYSTEM_ADMIN],
        children: [
          {
            key: '/admin/batch-import',
            icon: <UploadOutlined />,
            label: '批量导入',
            requiredPermissions: [Permission.SHIPMENT_CREATE],
          },
          {
            key: '/admin/rules',
            icon: <SettingOutlined />,
            label: '规则管理',
            requiredPermissions: [Permission.SYSTEM_CONFIG],
          },
          {
            key: '/admin/rule-version-management',
            icon: <HistoryOutlined />,
            label: '规则版本',
            requiredPermissions: [Permission.SYSTEM_CONFIG],
          },
          {
            key: '/admin/granular-permissions',
            icon: <LockOutlined />,
            label: '权限控制',
            requiredPermissions: [Permission.SYSTEM_ADMIN],
          },
        ],
      },
    ];
    const filtered = filterMenuItems(rawMenuItems);
    const cleaned = removeExtraDividers(filtered);
    return convertToMenuItems(cleaned);
  }, [hasAllPermissions]); // 2025-11-11 10:15:05 基于权限动态生成菜单

  const handleMenuClick = ({ key }: { key: string }) => {
    // 2025-10-03 20:25:00 点击一级菜单项时，显式收起"管理后台"下拉
    const topLevelAdminPaths = [
      '/admin/shipments',  // 运单管理
      '/admin/fleet',      // 车队管理
      '/admin/customers',  // 客户管理
      '/admin/currencies', // 货币管理
    ];
    
    if (topLevelAdminPaths.includes(key)) {
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
