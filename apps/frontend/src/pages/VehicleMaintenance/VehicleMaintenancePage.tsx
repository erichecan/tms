// 车辆维护记录页面
// 创建时间: 2025-09-29 15:40:00
// 作用: 车辆维护记录功能的主页面

import React from 'react';
import { Typography } from 'antd';
import PageLayout from '../../components/Layout/PageLayout';
import VehicleMaintenance from '../../components/VehicleMaintenance/VehicleMaintenance';

const { Title, Text } = Typography;

const VehicleMaintenancePage: React.FC = () => {
  return (
    <PageLayout>
      <div style={{ padding: '24px', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: 16 }}>
          <Title level={3}>🔧 车辆维护记录</Title>
          <Text type="secondary">管理车辆维护记录，跟踪车辆状态和保养计划</Text>
        </div>
        
        <VehicleMaintenance />
      </div>
    </PageLayout>
  );
};

export default VehicleMaintenancePage;
