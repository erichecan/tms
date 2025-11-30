// 规则创建教程页面
// 创建时间: 2025-11-30 07:30:00

import React from 'react';
import PageLayout from '../../components/Layout/PageLayout'; // 2025-11-30 07:35:00 修复：使用默认导出
import RuleGuide from '../../components/RuleGuide/RuleGuide';

const RuleGuidePage: React.FC = () => {
  return (
    <PageLayout>
      <div style={{ margin: '24px' }}>
        <RuleGuide />
      </div>
    </PageLayout>
  );
};

export default RuleGuidePage;

