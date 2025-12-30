import React from 'react';
import { Card, Button, Typography, Row, Col, Divider } from 'antd';
import { TruckOutlined, PlusOutlined, UnorderedListOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <Title level={1}>
          <TruckOutlined style={{ color: '#1890ff', marginRight: '16px' }} />
          智能物流运营平台
        </Title>
        <Paragraph style={{ fontSize: '18px', color: '#666' }}>
          专业的运输管理系统，为您提供高效、可靠的物流解决方案
        </Paragraph>
      </div>

      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            style={{ textAlign: 'center', height: '100%' }}
            bodyStyle={{ padding: '40px 20px' }}
          >
            <div style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }}>
              <PlusOutlined />
            </div>
            <Title level={3}>创建运单</Title>
            <Paragraph style={{ marginBottom: '24px' }}>
              快速创建新的运输订单，包含详细的货物信息、地址信息和附加服务
            </Paragraph>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => navigate('/admin/waybill/create')}
              block
            >
              开始创建运单
            </Button>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            style={{ textAlign: 'center', height: '100%' }}
            bodyStyle={{ padding: '40px 20px' }}
          >
            <div style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }}>
              <UnorderedListOutlined />
            </div>
            <Title level={3}>运单管理</Title>
            <Paragraph style={{ marginBottom: '24px' }}>
              查看和管理所有运单，跟踪运输状态，分配司机，处理异常情况
            </Paragraph>
            <Button
              size="large"
              icon={<UnorderedListOutlined />}
              onClick={() => navigate('/admin/shipments')}
              block
            >
              进入管理后台
            </Button>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            style={{ textAlign: 'center', height: '100%' }}
            bodyStyle={{ padding: '40px 20px' }}
          >
            <div style={{ fontSize: '48px', color: '#722ed1', marginBottom: '16px' }}>
              <SettingOutlined />
            </div>
            <Title level={3}>系统设置</Title>
            <Paragraph style={{ marginBottom: '24px' }}>
              配置规则引擎、定价策略、用户权限等系统参数
            </Paragraph>
            <Button
              size="large"
              icon={<SettingOutlined />}
              onClick={() => navigate('/admin/rules')}
              block
            >
              系统配置
            </Button>
          </Card>
        </Col>
      </Row>

      <Divider style={{ margin: '60px 0' }} />

      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card>
            <Title level={3}>功能特色</Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', color: '#1890ff', marginBottom: '8px' }}>
                    📦
                  </div>
                  <Title level={5}>详细货物信息</Title>
                  <Paragraph style={{ fontSize: '14px' }}>
                    支持长宽高、重量、箱数、托盘数等详细信息录入
                  </Paragraph>
                </div>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', color: '#52c41a', marginBottom: '8px' }}>
                    🚚
                  </div>
                  <Title level={5}>智能状态管理</Title>
                  <Paragraph style={{ fontSize: '14px' }}>
                    从创建到完成的完整状态流转，实时跟踪运输进度
                  </Paragraph>
                </div>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', color: '#fa8c16', marginBottom: '8px' }}>
                    🛡️
                  </div>
                  <Title level={5}>附加服务</Title>
                  <Paragraph style={{ fontSize: '14px' }}>
                    保险、尾板、预约、等候等多样化服务选项
                  </Paragraph>
                </div>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', color: '#722ed1', marginBottom: '8px' }}>
                    🏠
                  </div>
                  <Title level={5}>地址类型识别</Title>
                  <Paragraph style={{ fontSize: '14px' }}>
                    自动识别住宅地址和商业地址，优化配送策略
                  </Paragraph>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Home;
