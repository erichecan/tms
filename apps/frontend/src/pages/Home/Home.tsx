import React from 'react';
import { Card, Button, Typography, Row, Col, Divider } from 'antd';
import { 
  TruckOutlined, 
  PlusOutlined, 
  TeamOutlined, 
  DollarOutlined,
  UserOutlined,
  SettingOutlined 
} from '@ant-design/icons';
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

      {/* 首页三大模块入口 - 符合PRD v3.0-PC设计 */}
      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            style={{ textAlign: 'center', height: '100%' }}
            styles={{ body: { padding: '40px 20px' } }}
          >
            <div style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }}>
              <PlusOutlined />
            </div>
            <Title level={3}>创建运单</Title>
            <Paragraph style={{ marginBottom: '24px' }}>
              快速创建新的运输订单，客户选择后自动填充默认地址，支持货物信息和附加服务
            </Paragraph>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => navigate('/create-shipment')}
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
            styles={{ body: { padding: '40px 20px' } }}
          >
            <div style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }}>
              <TeamOutlined />
            </div>
            <Title level={3}>车队管理</Title>
            <Paragraph style={{ marginBottom: '24px' }}>
              管理在途司机车辆、空闲资源列表、地图轨迹显示，支持行程调度和历史回放
            </Paragraph>
            <Button
              size="large"
              icon={<TeamOutlined />}
              onClick={() => navigate('/fleet-management')}
              block
            >
              进入车队管理
            </Button>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            style={{ textAlign: 'center', height: '100%' }}
            styles={{ body: { padding: '40px 20px' } }}
          >
            <div style={{ fontSize: '48px', color: '#fa8c16', marginBottom: '16px' }}>
              <DollarOutlined />
            </div>
            <Title level={3}>财务结算</Title>
            <Paragraph style={{ marginBottom: '24px' }}>
              查看应收应付记录，按客户聚合的财务数据，支持导出和详情查看
            </Paragraph>
            <Button
              size="large"
              icon={<DollarOutlined />}
              onClick={() => navigate('/finance-settlement')}
              block
            >
              进入财务结算
            </Button>
          </Card>
        </Col>
      </Row>

      {/* 快速操作区域 */}
      <Divider style={{ margin: '40px 0' }} />
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card
            hoverable
            size="small"
            onClick={() => navigate('/customers')}
            style={{ textAlign: 'center' }}
          >
            <UserOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }} />
            <div>客户管理</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            hoverable
            size="small"
            onClick={() => navigate('/admin/shipments')}
            style={{ textAlign: 'center' }}
          >
            <TruckOutlined style={{ fontSize: '24px', color: '#52c41a', marginBottom: '8px' }} />
            <div>运单管理</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            hoverable
            size="small"
            onClick={() => navigate('/admin/drivers')}
            style={{ textAlign: 'center' }}
          >
            <TeamOutlined style={{ fontSize: '24px', color: '#722ed1', marginBottom: '8px' }} />
            <div>司机管理</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            hoverable
            size="small"
            onClick={() => navigate('/admin/rules')}
            style={{ textAlign: 'center' }}
          >
            <SettingOutlined style={{ fontSize: '24px', color: '#fa8c16', marginBottom: '8px' }} />
            <div>系统设置</div>
          </Card>
        </Col>
      </Row>

      <Divider style={{ margin: '60px 0' }} />

      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card>
            <Title level={3}>TMS v3.0-PC 核心功能</Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', color: '#1890ff', marginBottom: '8px' }}>
                    📦
                  </div>
                  <Title level={5}>运单生命周期</Title>
                  <Paragraph style={{ fontSize: '14px' }}>
                    创建→调度→执行→POD→完成，完整的状态机流转
                  </Paragraph>
                </div>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', color: '#52c41a', marginBottom: '8px' }}>
                    🚛
                  </div>
                  <Title level={5}>行程管理</Title>
                  <Paragraph style={{ fontSize: '14px' }}>
                    支持多运单挂载，联程/多段运输，降低空驶率
                  </Paragraph>
                </div>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', color: '#fa8c16', marginBottom: '8px' }}>
                    👥
                  </div>
                  <Title level={5}>客户管理</Title>
                  <Paragraph style={{ fontSize: '14px' }}>
                    默认地址自动填充，历史运单和财务记录查看
                  </Paragraph>
                </div>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', color: '#722ed1', marginBottom: '8px' }}>
                    🗺️
                  </div>
                  <Title level={5}>车队可视化</Title>
                  <Paragraph style={{ fontSize: '14px' }}>
                    在途列表、空闲资源、地图轨迹、历史回放
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
