// 询价请求页面
// 创建时间: 2025-12-05 12:00:00
// 作用: 客户下单询价页面

import React from 'react';
import { Typography } from 'antd';
import QuoteRequestForm from '../../components/selfservice/QuoteRequestForm';

const { Title, Paragraph } = Typography;

const QuoteRequestPage: React.FC = () => {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>下单询价</Title>
        <Paragraph type="secondary">
          填写以下信息后提交，我们的调度会尽快联系您（通常 1 个工作日内）。
        </Paragraph>
      </div>
      <QuoteRequestForm />
    </div>
  );
};

export default QuoteRequestPage;

