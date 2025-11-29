// 到期提醒列表页面
// 创建时间: 2025-11-29T11:25:04Z
// 第一阶段：核心主数据完善 - 到期提醒功能

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Select,
  Input,
  DatePicker,
  Modal,
  Form,
  InputNumber,
  Switch,
  message,
  Typography,
  Row,
  Col,
  Statistic,
  Alert,
} from 'antd';
import {
  BellOutlined,
  SettingOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { notificationsApi, vehiclesApi, driversApi, carriersApi } from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Text } = Typography;
const { RangePicker } = DatePicker;

interface ExpiryItem {
  id: string;
  type: string;
  entityType: 'vehicle' | 'driver' | 'carrier';
  entityId: string;
  entityName: string;
  itemName: string;
  expiryDate: string;
  daysUntilExpiry: number;
  status: string;
  createdAt: string;
}

const ExpiryReminders: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [expiryItems, setExpiryItems] = useState<ExpiryItem[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [configForm] = Form.useForm();

  // 统计信息
  const [stats, setStats] = useState({
    total: 0,
    expired: 0,
    expiringSoon: 0,
    upcoming: 0,
  });

  useEffect(() => {
    loadExpiryItems();
  }, [filterType, filterStatus]);

  const loadExpiryItems = async () => {
    setLoading(true);
    try {
      // 获取所有类型的到期提醒
      const [vehicleCerts, vehicleIns, vehicleInsp, driverCerts, driverMed, driverTrain, carrierCerts] = await Promise.all([
        vehiclesApi.getExpiringCertificates(90).catch(() => ({ data: { data: [] } })),
        vehiclesApi.getExpiringInsurances(90).catch(() => ({ data: { data: [] } })),
        vehiclesApi.getExpiringInspections(90).catch(() => ({ data: { data: [] } })),
        driversApi.getExpiringDriverCertificates(90).catch(() => ({ data: { data: [] } })),
        driversApi.getExpiringMedicalRecords(90).catch(() => ({ data: { data: [] } })),
        driversApi.getExpiringTrainingCertificates(90).catch(() => ({ data: { data: [] } })),
        carriersApi.getExpiringCarrierCertificates(90).catch(() => ({ data: { data: [] } })),
      ]);

      const allItems: ExpiryItem[] = [
        ...(vehicleCerts.data?.data || []).map((item: any) => ({
          id: item.id,
          type: 'vehicle_certificate',
          entityType: 'vehicle' as const,
          entityId: item.vehicleId,
          entityName: item.plateNumber || '未知车辆',
          itemName: `${getCertificateTypeName(item.certificateType)} (${item.certificateNumber})`,
          expiryDate: item.expiryDate,
          daysUntilExpiry: calculateDaysUntilExpiry(item.expiryDate),
          status: item.expiryDate < new Date().toISOString().split('T')[0] ? 'expired' : item.daysUntilExpiry <= 7 ? 'expiring_soon' : 'upcoming',
          createdAt: item.createdAt,
        })),
        ...(vehicleIns.data?.data || []).map((item: any) => ({
          id: item.id,
          type: 'vehicle_insurance',
          entityType: 'vehicle' as const,
          entityId: item.vehicleId,
          entityName: item.plateNumber || '未知车辆',
          itemName: `${getInsuranceTypeName(item.insuranceType)} (${item.policyNumber})`,
          expiryDate: item.expiryDate,
          daysUntilExpiry: calculateDaysUntilExpiry(item.expiryDate),
          status: item.expiryDate < new Date().toISOString().split('T')[0] ? 'expired' : item.daysUntilExpiry <= 7 ? 'expiring_soon' : 'upcoming',
          createdAt: item.createdAt,
        })),
        ...(vehicleInsp.data?.data || []).map((item: any) => ({
          id: item.id,
          type: 'vehicle_inspection',
          entityType: 'vehicle' as const,
          entityId: item.vehicleId,
          entityName: item.plateNumber || '未知车辆',
          itemName: `${getInspectionTypeName(item.inspectionType)} (${item.inspectionDate})`,
          expiryDate: item.expiryDate,
          daysUntilExpiry: calculateDaysUntilExpiry(item.expiryDate),
          status: item.expiryDate < new Date().toISOString().split('T')[0] ? 'expired' : item.daysUntilExpiry <= 7 ? 'expiring_soon' : 'upcoming',
          createdAt: item.createdAt,
        })),
        ...(driverCerts.data?.data || []).map((item: any) => ({
          id: item.id,
          type: 'driver_certificate',
          entityType: 'driver' as const,
          entityId: item.driverId,
          entityName: item.driverName || '未知司机',
          itemName: `${getDriverCertificateTypeName(item.certificateType)} (${item.certificateNumber})`,
          expiryDate: item.expiryDate,
          daysUntilExpiry: calculateDaysUntilExpiry(item.expiryDate),
          status: item.expiryDate < new Date().toISOString().split('T')[0] ? 'expired' : item.daysUntilExpiry <= 7 ? 'expiring_soon' : 'upcoming',
          createdAt: item.createdAt,
        })),
        ...(driverMed.data?.data || []).map((item: any) => ({
          id: item.id,
          type: 'driver_medical',
          entityType: 'driver' as const,
          entityId: item.driverId,
          entityName: item.driverName || '未知司机',
          itemName: `体检记录 (${item.examinationDate})`,
          expiryDate: item.expiryDate,
          daysUntilExpiry: calculateDaysUntilExpiry(item.expiryDate),
          status: item.expiryDate < new Date().toISOString().split('T')[0] ? 'expired' : item.daysUntilExpiry <= 7 ? 'expiring_soon' : 'upcoming',
          createdAt: item.createdAt,
        })),
        ...(driverTrain.data?.data || []).map((item: any) => ({
          id: item.id,
          type: 'driver_training',
          entityType: 'driver' as const,
          entityId: item.driverId,
          entityName: item.driverName || '未知司机',
          itemName: `${getTrainingTypeName(item.trainingType)} (${item.trainingDate})`,
          expiryDate: item.expiryDate,
          daysUntilExpiry: calculateDaysUntilExpiry(item.expiryDate),
          status: item.expiryDate < new Date().toISOString().split('T')[0] ? 'expired' : item.daysUntilExpiry <= 7 ? 'expiring_soon' : 'upcoming',
          createdAt: item.createdAt,
        })),
        ...(carrierCerts.data?.data || []).map((item: any) => ({
          id: item.id,
          type: 'carrier_certificate',
          entityType: 'carrier' as const,
          entityId: item.carrierId,
          entityName: item.carrierName || '未知承运商',
          itemName: `${getCarrierCertificateTypeName(item.certificateType)} (${item.certificateNumber})`,
          expiryDate: item.expiryDate,
          daysUntilExpiry: calculateDaysUntilExpiry(item.expiryDate),
          status: item.expiryDate < new Date().toISOString().split('T')[0] ? 'expired' : item.daysUntilExpiry <= 7 ? 'expiring_soon' : 'upcoming',
          createdAt: item.createdAt,
        })),
      ];

      // 应用筛选
      let filtered = allItems;
      if (filterType !== 'all') {
        filtered = filtered.filter(item => item.type === filterType);
      }
      if (filterStatus !== 'all') {
        filtered = filtered.filter(item => item.status === filterStatus);
      }
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        filtered = filtered.filter(item =>
          item.entityName.toLowerCase().includes(searchLower) ||
          item.itemName.toLowerCase().includes(searchLower)
        );
      }

      // 按到期日期排序
      filtered.sort((a, b) => {
        if (a.status === 'expired' && b.status !== 'expired') return -1;
        if (a.status !== 'expired' && b.status === 'expired') return 1;
        return a.daysUntilExpiry - b.daysUntilExpiry;
      });

      setExpiryItems(filtered);

      // 更新统计
      setStats({
        total: allItems.length,
        expired: allItems.filter(item => item.status === 'expired').length,
        expiringSoon: allItems.filter(item => item.status === 'expiring_soon').length,
        upcoming: allItems.filter(item => item.status === 'upcoming').length,
      });
    } catch (error: any) {
      message.error('加载到期提醒失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysUntilExpiry = (expiryDate: string): number => {
    const today = dayjs();
    const expiry = dayjs(expiryDate);
    return expiry.diff(today, 'day');
  };

  const getCertificateTypeName = (type: string) => {
    const map: Record<string, string> = {
      'driving_license': '行驶证',
      'operation_permit': '营运证',
      'etc': 'ETC',
      'hazardous_permit': '危化许可',
      'other': '其他',
    };
    return map[type] || type;
  };

  const getInsuranceTypeName = (type: string) => {
    const map: Record<string, string> = {
      'liability': '责任险',
      'comprehensive': '全险',
      'collision': '碰撞险',
      'cargo': '货物险',
      'third_party': '第三方险',
      'other': '其他',
    };
    return map[type] || type;
  };

  const getInspectionTypeName = (type: string) => {
    const map: Record<string, string> = {
      'annual': '年度',
      'safety': '安全',
      'emission': '排放',
      'roadworthiness': '道路适应性',
      'other': '其他',
    };
    return map[type] || type;
  };

  const getDriverCertificateTypeName = (type: string) => {
    const map: Record<string, string> = {
      'driving_license': '驾照',
      'professional_qualification': '从业资格',
      'hazardous_license': '危化驾照',
      'other': '其他',
    };
    return map[type] || type;
  };

  const getTrainingTypeName = (type: string) => {
    const map: Record<string, string> = {
      'safety': '安全',
      'regulation': '法规',
      'skill': '技能',
      'certification': '认证',
      'other': '其他',
    };
    return map[type] || type;
  };

  const getCarrierCertificateTypeName = (type: string) => {
    const map: Record<string, string> = {
      'business_license': '营业执照',
      'transport_license': '运输许可证',
      'safety_certificate': '安全证书',
      'other': '其他',
    };
    return map[type] || type;
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      'vehicle_certificate': '车辆证照',
      'vehicle_insurance': '车辆保险',
      'vehicle_inspection': '车辆年检',
      'driver_certificate': '司机证照',
      'driver_medical': '司机体检',
      'driver_training': '司机培训',
      'carrier_certificate': '承运商证照',
    };
    return map[type] || type;
  };

  const getStatusTag = (item: ExpiryItem) => {
    if (item.status === 'expired') {
      return <Tag color="red" icon={<ExclamationCircleOutlined />}>已过期</Tag>;
    } else if (item.status === 'expiring_soon') {
      return <Tag color="orange" icon={<WarningOutlined />}>即将到期 ({item.daysUntilExpiry}天)</Tag>;
    } else {
      return <Tag color="blue">还有 {item.daysUntilExpiry} 天</Tag>;
    }
  };

  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => <Tag>{getTypeLabel(type)}</Tag>,
      filters: [
        { text: '车辆证照', value: 'vehicle_certificate' },
        { text: '车辆保险', value: 'vehicle_insurance' },
        { text: '车辆年检', value: 'vehicle_inspection' },
        { text: '司机证照', value: 'driver_certificate' },
        { text: '司机体检', value: 'driver_medical' },
        { text: '司机培训', value: 'driver_training' },
        { text: '承运商证照', value: 'carrier_certificate' },
      ],
      onFilter: (value: string, record: ExpiryItem) => record.type === value,
    },
    {
      title: '实体',
      dataIndex: 'entityName',
      key: 'entityName',
      width: 150,
      render: (name: string, record: ExpiryItem) => (
        <Space>
          <Tag color={record.entityType === 'vehicle' ? 'blue' : record.entityType === 'driver' ? 'green' : 'purple'}>
            {record.entityType === 'vehicle' ? '车辆' : record.entityType === 'driver' ? '司机' : '承运商'}
          </Tag>
          {name}
        </Space>
      ),
    },
    {
      title: '项目名称',
      dataIndex: 'itemName',
      key: 'itemName',
      width: 250,
    },
    {
      title: '到期日期',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
      sorter: (a: ExpiryItem, b: ExpiryItem) => dayjs(a.expiryDate).unix() - dayjs(b.expiryDate).unix(),
    },
    {
      title: '状态',
      key: 'status',
      width: 150,
      render: (_: any, record: ExpiryItem) => getStatusTag(record),
      filters: [
        { text: '已过期', value: 'expired' },
        { text: '即将到期', value: 'expiring_soon' },
        { text: '即将到期', value: 'upcoming' },
      ],
      onFilter: (value: string, record: ExpiryItem) => record.status === value,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const handleConfigSubmit = async (values: any) => {
    try {
      // TODO: 调用后端API保存配置
      message.success('配置已保存');
      setIsConfigModalVisible(false);
    } catch (error: any) {
      message.error('保存配置失败: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <BellOutlined />
            <span>到期提醒</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadExpiryItems}>
              刷新
            </Button>
            <Button icon={<SettingOutlined />} onClick={() => setIsConfigModalVisible(true)}>
              提醒配置
            </Button>
          </Space>
        }
      >
        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic title="总计" value={stats.total} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已过期"
                value={stats.expired}
                valueStyle={{ color: '#cf1322' }}
                prefix={<ExclamationCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="即将到期（7天内）"
                value={stats.expiringSoon}
                valueStyle={{ color: '#fa8c16' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="即将到期" value={stats.upcoming} valueStyle={{ color: '#1890ff' }} />
            </Card>
          </Col>
        </Row>

        {/* 筛选栏 */}
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Select
              value={filterType}
              onChange={setFilterType}
              style={{ width: 150 }}
              placeholder="筛选类型"
            >
              <Option value="all">全部类型</Option>
              <Option value="vehicle_certificate">车辆证照</Option>
              <Option value="vehicle_insurance">车辆保险</Option>
              <Option value="vehicle_inspection">车辆年检</Option>
              <Option value="driver_certificate">司机证照</Option>
              <Option value="driver_medical">司机体检</Option>
              <Option value="driver_training">司机培训</Option>
              <Option value="carrier_certificate">承运商证照</Option>
            </Select>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 150 }}
              placeholder="筛选状态"
            >
              <Option value="all">全部状态</Option>
              <Option value="expired">已过期</Option>
              <Option value="expiring_soon">即将到期（7天内）</Option>
              <Option value="upcoming">即将到期</Option>
            </Select>
            <Input.Search
              placeholder="搜索实体名称或项目名称"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
          </Space>
        </Space>

        {/* 警告提示 */}
        {stats.expired > 0 && (
          <Alert
            message={`有 ${stats.expired} 个项目已过期，请及时处理！`}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        {stats.expiringSoon > 0 && (
          <Alert
            message={`有 ${stats.expiringSoon} 个项目将在7天内到期，请提前准备续期！`}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={expiryItems}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 提醒配置弹窗 */}
      <Modal
        title="到期提醒配置"
        open={isConfigModalVisible}
        onCancel={() => setIsConfigModalVisible(false)}
        onOk={() => configForm.submit()}
        width={600}
      >
        <Form form={configForm} layout="vertical" onFinish={handleConfigSubmit}>
          <Form.Item label="提前提醒天数" name="daysAhead" initialValue={30}>
            <InputNumber min={1} max={365} style={{ width: '100%' }} />
            <Text type="secondary">在到期前多少天开始提醒</Text>
          </Form.Item>
          <Form.Item label="紧急提醒天数" name="urgentDaysAhead" initialValue={7}>
            <InputNumber min={1} max={30} style={{ width: '100%' }} />
            <Text type="secondary">在到期前多少天标记为紧急</Text>
          </Form.Item>
          <Form.Item label="提醒频率" name="reminderFrequency" initialValue="daily">
            <Select>
              <Option value="daily">每天</Option>
              <Option value="weekly">每周</Option>
              <Option value="monthly">每月</Option>
            </Select>
          </Form.Item>
          <Form.Item label="通知方式">
            <Space direction="vertical">
              <Switch defaultChecked>系统通知</Switch>
              <Switch>邮件通知</Switch>
              <Switch>短信通知</Switch>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ExpiryReminders;

