// 2025-11-11 10:15:05 新增：通知提醒占位组件
import React from 'react';
import { Card, List, Tag } from 'antd';
import { BellOutlined } from '@ant-design/icons';

const sampleNotifications = [
  {
    id: 'notify-1',
    title: '司机王师傅已抵达取货点',
    time: '刚刚',
    level: 'info',
  },
  {
    id: 'notify-2',
    title: '运单 TMS20251011001 费用已确认',
    time: '5 分钟前',
    level: 'success',
  },
  {
    id: 'notify-3',
    title: '客户 ABC Logistics 提交了新的询价',
    time: '15 分钟前',
    level: 'warning',
  },
];

const levelColorMap: Record<string, 'blue' | 'green' | 'orange'> = {
  info: 'blue',
  success: 'green',
  warning: 'orange',
};

const NotificationCenterPlaceholder: React.FC = () => {
  return (
    <Card
      title={<span><BellOutlined /> 通知提醒</span>}
      extra={<Tag color="purple">实时功能即将上线</Tag>}
      size="small"
    >
      <List
        dataSource={sampleNotifications}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              title={item.title}
              description={item.time}
            />
            <Tag color={levelColorMap[item.level] || 'blue'}>{item.level}</Tag>
          </List.Item>
        )}
      />
    </Card>
  );
};

export default NotificationCenterPlaceholder;

