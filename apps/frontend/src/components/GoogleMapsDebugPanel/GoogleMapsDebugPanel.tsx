// ============================================================================
// Google Maps 调试面板
// 创建时间: 2025-01-27 14:45:00
// 说明: 在开发模式下显示 Google Maps API 调用统计
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Card, Statistic, Table, Button, Space, Tag } from 'antd';
import { ReloadOutlined, ClearOutlined } from '@ant-design/icons';
import { getCallStats, resetStats, clearCache, GoogleMapsCallStats } from '../../services/googleMaps';

interface GoogleMapsDebugPanelProps {
  visible?: boolean;
}

const GoogleMapsDebugPanel: React.FC<GoogleMapsDebugPanelProps> = ({ visible = true }) => {
  const [stats, setStats] = useState<GoogleMapsCallStats>(getCallStats());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 2025-01-27 14:45:00 自动刷新统计
  useEffect(() => {
    if (!autoRefresh || !visible) return;

    const interval = setInterval(() => {
      setStats(getCallStats());
    }, 500);

    return () => clearInterval(interval);
  }, [autoRefresh, visible]);

  // 2025-01-27 14:45:00 手动刷新
  const handleRefresh = () => {
    setStats(getCallStats());
  };

  // 2025-01-27 14:45:00 重置统计
  const handleReset = () => {
    resetStats();
    setStats(getCallStats());
  };

  // 2025-01-27 14:45:00 清除缓存
  const handleClearCache = () => {
    clearCache();
    console.log('✅ [Debug Panel] Cache cleared');
  };

  if (!visible) return null;

  // 2025-01-27 14:45:00 计算会话时长
  const sessionDuration = Math.floor((Date.now() - stats.sessionStart) / 1000);
  const sessionMinutes = Math.floor(sessionDuration / 60);
  const sessionSeconds = sessionDuration % 60;

  // 2025-01-27 14:45:00 表格列定义
  const columns = [
    {
      title: '调用类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeLabels: Record<string, string> = {
          js_api_load: 'JS API 加载',
          static_maps: '静态地图',
          geocoding: '地址解析',
          reverse_geocoding: '反向地址解析',
          distance_matrix: '距离矩阵',
          directions: '路线计算',
          places_autocomplete: '地址自动完成',
          places_details: '地点详情',
          elevation: '海拔',
        };
        return <Tag color="blue">{typeLabels[type] || type}</Tag>;
      },
    },
    {
      title: '调用次数',
      dataIndex: 'count',
      key: 'count',
      align: 'right' as const,
      render: (count: number) => <strong>{count}</strong>,
    },
  ];

  const tableData = Object.entries(stats.byType).map(([type, count]) => ({
    key: type,
    type,
    count,
  }));

  return (
    <Card
      title={
        <Space>
          <span>🗺️ Google Maps 调用统计</span>
          <Tag color="orange">开发模式</Tag>
        </Space>
      }
      size="small"
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 400,
        maxHeight: '80vh',
        overflow: 'auto',
        zIndex: 9999,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
      extra={
        <Space>
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            title="刷新统计"
          />
          <Button
            type="text"
            size="small"
            icon={<ClearOutlined />}
            onClick={handleReset}
            title="重置统计"
          />
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* 2025-01-27 14:45:00 总体统计 */}
        <div>
          <Statistic
            title="总调用次数"
            value={stats.total}
            valueStyle={{ color: stats.total > 100 ? '#cf1322' : '#3f8600' }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
            会话时长: {sessionMinutes}分 {sessionSeconds}秒
          </div>
        </div>

        {/* 2025-01-27 14:45:00 按类型统计 */}
        {tableData.length > 0 ? (
          <Table
            columns={columns}
            dataSource={tableData}
            pagination={false}
            size="small"
            style={{ marginTop: 8 }}
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#999', padding: 16 }}>
            暂无调用记录
          </div>
        )}

        {/* 2025-01-27 14:45:00 操作按钮 */}
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button size="small" onClick={handleClearCache}>
            清除缓存
          </Button>
          <Button
            size="small"
            type={autoRefresh ? 'primary' : 'default'}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '停止自动刷新' : '开始自动刷新'}
          </Button>
        </Space>
      </Space>
    </Card>
  );
};

export default GoogleMapsDebugPanel;
