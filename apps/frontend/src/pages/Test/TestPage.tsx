import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const TestPage: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <Title level={1}>测试页面</Title>
      <Title level={3}>如果你能看到这个页面，说明路由工作正常！</Title>
    </div>
  );
};

export default TestPage;
