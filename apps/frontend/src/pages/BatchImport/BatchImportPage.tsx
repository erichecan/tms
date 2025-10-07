// 批量导入页面
// 创建时间: 2025-09-29 15:05:00
// 作用: 运单批量导入功能的主页面

import React from 'react';
import { Typography } from 'antd';

import BatchImport from '../../components/BatchImport/BatchImport';

const { Title, Text } = Typography;

const BatchImportPage: React.FC = () => {
  return (
    <div style={{ margin: '0 0 0 24px' }}>
      <div style={{ marginBottom: 16 }}>
        <Title level={3}>📥 运单批量导入</Title>
        <Text type="secondary">支持CSV格式文件批量导入运单数据，提高录入效率</Text>
      </div>
      
      <BatchImport />
    </div>
  );
};

export default BatchImportPage;
