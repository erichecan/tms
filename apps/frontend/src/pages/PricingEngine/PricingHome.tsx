// 计费定价首页
// 创建时间: 2025-09-29 03:00:00
// 作用: 智能计费规则引擎的入口页面

import React from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Space, 
  Button, 
  Divider,
  Timeline,
  Tag,
  Statistic
} from 'antd';
import { 
  CalculatorOutlined,
  SettingOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  HeartOutlined,
  BankOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;

const PricingHomePage: React.FC = () => {
  const navigate = useNavigate();

  // 业务场景统计
  const scenarioStats = [
    { name: '垃圾清运', count: 12, revenue: '480 CAD', drivers: 8 },
    { name: '仓库转运', count: 45, revenue: '9,900 CAD', drivers: 15 },
    { name: '客户直运', count: 28, revenue: '6,720 CAD', drivers: 12 }
  ];

  // 功能特点
  const features = [
    {
      icon: <SettingOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
      title: '规则向导',
      description: '6步向导轻松创建计费规则模板',
      path: '/admin/pricing/wizard',
      color: 'blue'
    },
    {
      icon: <EyeOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
      title: '模板 관리',
      description: '可视化管理所有计费模板',
      path: '/admin/pricing/templates',
      color: 'green'
    },
    {
      icon: <CalculatorOutlined style={{ fontSize: '24px', color: '#f5222d' }} />,
      title: '费用计算器',
      description: '实时预览计费结果',
      path: '/admin/pricing/calculator',
      color: 'red'
    }
  ];

  // 系统优势
  const advantages = [
    '🚀 业务场景驱动：预设垃圾清运、仓库转运等典型场景',
    '💰 灵活计费：支持固定费用、阶梯收费、条件触发',
    '👥 多维度核算：客户费用、司机薪酬、内部成本独立核算',
    '⚡ 实时计算：毫秒级响应，支持复杂公式计算',
    '📊 透明度高：详细的费用分解和计算轨迹',
    '🔧 操作简单：可视化规则配置，无需编程知识'
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 头部 */}
      <Card style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Row align="middle">
          <Col span={16}>
            <Title level={2} style={{ color: 'white', marginBottom: '8px' }}>
              🧙‍♂️ 智能计费规则引擎
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px', marginBottom: '16px' }}>
              基于您的业务场景，智能创建和管理计费规则，实现运单费用的自动化计算和多维度成本分摊
            </Paragraph>
            <Space size="middle">
              <Button 
                type="primary" 
                size="large"
                icon={<ThunderboltOutlined />}
                onClick={() => navigate('/admin/pricing/wizard')}
                style={{ background: '#fff', color: '#667eea', border: 'none' }}
              >
                开始创建规则
              </Button>
              <Button 
                size="large"
                icon={<CalculatorOutlined />}
                onClick={() => navigate('/admin/pricing/calculator')}
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
              >
                测试计算
              </Button>
            </Space>
          </Col>
          <Col span={8} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '80px' }}>⚡</div>
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>智能引擎</Text>
          </Col>
        </Row>
      </Card>

      {/* 业务场景统计 */}
      <Row gutter={16} style={{ marginBottom: '32px' }}>
        <Col span={8}>
          <Card title={<><HeartOutlined /> 垃圾清运</>}>
            <Statistic title="今日运单" value={scenarioStats[0].count} />
            <Statistic title="今日收入" value={scenarioStats[0].revenue} prefix="$" />
            <Text type="secondary">活跃司机: {scenarioStats[0].drivers} 名</Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card title={<><BankOutlined /> 仓库转运</>}>
            <Statistic title="今日运单" value={scenarioStats[1].count} />
            <Statistic title="今日收入" value={scenarioStats[1].revenue} prefix="$" />
            <Text type="secondary">活跃司机: {scenarioStats[1].drivers} 名</Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card title={<><TruckOutlined /> 客户直运</>}>
            <Statistic title="今日运单" value={scenarioStats[2].count} />
            <Statistic title="今日收入" value={scenarioStats[2].revenue} prefix="$" />
            <Text type="secondary">活跃司机: {scenarioStats[2].drivers} 名</Text>
          </Card>
        </Col>
      </Row>

      {/* 主要功能 */}
      <Card title={<Title level={4}><CalculatorOutlined /> 主要功能</Title>} style={{ marginBottom: '32px' }}>
        <Row gutter={[24, 24]}>
          {features.map((feature, index) => (
            <Col span={8} key={index}>
              <Card
                hoverable
                style={{ height: '100%', textAlign: 'center' }}
                onClick={() => navigate(feature.path)}
              >
                <div style={{ marginBottom: '16px' }}>
                  {feature.icon}
                </div>
                <Title level={5}>{feature.title}</Title>
                <Paragraph>{feature.description}</Paragraph>
                <Button 
                  type="link" 
                  icon={<RightOutlined />}
                  onClick={() => navigate(feature.path)}
                >
                  立即体验
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 系统优势 */}
      <Row gutter={24}>
        <Col span={16}>
          <Card title={<Title level={4}>🌟 系统优势</Title>}>
            <Title level={5}>为什么选择我们的智能计费引擎？</Title>
            <ul style={{ paddingLeft: '20px', fontSize: '16px', lineHeight: '32px' }}>
              {advantages.map((advantage, index) => (
                <li key={index}>{advantage}</li>
              ))}
            </ul>
            
            <Divider />
            
            <Title level={5}>📋 支持的业务场景</Title>
            <Space wrap>
              <Tag color="orange" style={{ fontSize: '14px', padding: '4px 12px' }}>🗑️ 垃圾清运</Tag>
              <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>📦 仓库转运</Tag>
              <Tag color="green" style={{ fontSize: '14px', padding: '4px 12px' }}>🚛 客户直运</Tag>
              <Tag color="purple" style={{ fontSize: '14px', padding: '4px 12px' }}>🏗️ 建筑物流</Tag>
              <Tag color="red" style={{ fontSize: '14px', padding: '4px 12px' }}>❄️ 冷链运输</Tag>
            </Space>
          </Card>
        </Col>
        
        <Col span={8}>
          <Card title={<Title level={4}>⏱️ 操作流程</Title>}>
            <Timeline
              items={[
                {
                  dot: '1️⃣',
                  children: '选择业务场景',
                },
                {
                  dot: '2️⃣',
                  children: '设置路线条件',
                },
                {
                  dot: '3️⃣',
                  children: '构建费用结构',
                },
                {
                  dot: '4️⃣',
                  children: '设计司机薪酬',
                },
                {
                  dot: '5️⃣',
                  children: '配置成本分摊',
                },
                {
                  dot: '6️⃣',
                  children: '完成规则创建',
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* 底部CTA */}
      <Card 
        style={{ 
          marginTop: '24px', 
          textAlign: 'center', 
          background: 'linear-gradient(45deg, #f0f8ff, #e6f7ff)',
          border: '1px solid #91d5ff'
        }}
      >
        <Title level={4}>🚀 准备开始了吗？</Title>
        <Paragraph style={{ fontSize: '16px', marginBottom: '24px' }}>
          仅需6个步骤，5分钟即可创建您的专属计费规则！
        </Paragraph>
        <Space size="large">
          <Button 
            type="primary" 
            size="large"
            icon={<ThunderboltOutlined />}
            onClick={() => navigate('/admin/pricing/wizard')}
          >
            创建第一条规则
          </Button>
          <Button 
            size="large"
            icon={<EyeOutlined />}
            onClick={() => navigate('/admin/pricing/templates')}
          >
            查看现有模板
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default PricingHomePage;
