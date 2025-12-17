// 询价请求列表页面
// 创建时间: 2025-12-05 12:00:00
// 作用: 调度/管理员查看和处理询价请求

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Input,
  Select,
  DatePicker,
  message,
  Typography,
  Row,
  Col,
} from 'antd';
import {
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import axios from 'axios';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// 询价请求接口
interface QuoteRequest {
  id: string;
  code: string;
  contactName: string;
  company?: string;
  email: string;
  phone?: string;
  origin: string;
  destination: string;
  shipDate: string;
  weightKg: number;
  volume?: number;
  pieces?: number;
  pallets?: number; // 2025-12-12 00:15:00 添加托盘数量字段
  services: string[];
  note?: string;
  status: 'open' | 'pending' | 'contacted' | 'closed';
  assigneeId?: string;
  createdAt: string;
  updatedAt: string;
}

const QuoteRequestsList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: undefined as string | undefined,
    keyword: '',
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
    serviceType: undefined as string | undefined,
  });

  useEffect(() => {
    loadQuoteRequests();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadQuoteRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params: any = {
        page: pagination.current,
        limit: pagination.pageSize,
      };

      if (filters.status) {
        params.status = filters.status;
      }
      if (filters.keyword) {
        params.keyword = filters.keyword;
      }
      if (filters.startDate) {
        params.startDate = filters.startDate;
      }
      if (filters.endDate) {
        params.endDate = filters.endDate;
      }
      if (filters.serviceType) {
        params.serviceType = filters.serviceType;
      }

      const response = await axios.get('/api/v1/admin/quote-requests', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      });

      if (response.data.success) {
        setQuoteRequests(response.data.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
        }));
      } else {
        throw new Error(response.data.error?.message || '加载失败');
      }
    } catch (error: any) {
      console.error('加载询价请求失败:', error);
      message.error(error.response?.data?.error?.message || '加载询价请求失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (record: QuoteRequest) => {
    navigate(`/admin/quote-requests/${record.id}`);
  };

  const handleStatusFilterChange = (value: string) => {
    setFilters(prev => ({ ...prev, status: value || undefined }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, keyword: e.target.value }));
  };

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setFilters(prev => ({
        ...prev,
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD'),
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        startDate: undefined,
        endDate: undefined,
      }));
    }
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleServiceTypeFilterChange = (value: string) => {
    setFilters(prev => ({ ...prev, serviceType: value || undefined }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    loadQuoteRequests();
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      open: { color: 'blue', text: '待处理' },
      pending: { color: 'orange', text: '处理中' },
      contacted: { color: 'green', text: '已联系' },
      closed: { color: 'default', text: '已关闭' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '询价编号',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      fixed: 'left' as const,
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '联系人',
      dataIndex: 'contactName',
      key: 'contactName',
      width: 120,
      render: (_: string, record: QuoteRequest) => (
        <div>
          <div>{record.contactName}</div>
          {record.company && (
            <Text type="secondary" style={{ fontSize: 12 }}>{record.company}</Text>
          )}
        </div>
      ),
    },
    {
      title: '联系方式',
      key: 'contact',
      width: 200,
      render: (_: string, record: QuoteRequest) => (
        <div>
          <div>{record.email}</div>
          {record.phone && (
            <Text type="secondary" style={{ fontSize: 12 }}>{record.phone}</Text>
          )}
        </div>
      ),
    },
    {
      title: '路线',
      key: 'route',
      width: 250,
      render: (_: string, record: QuoteRequest) => (
        <div>
          <div>{record.origin}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>→ {record.destination}</Text>
        </div>
      ),
    },
    {
      title: '预计发货日期',
      dataIndex: 'shipDate',
      key: 'shipDate',
      width: 120,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD'),
    },
    {
      title: '重量',
      dataIndex: 'weightKg',
      key: 'weightKg',
      width: 100,
      render: (text: number) => `${text} kg`,
    },
    {
      title: '件数',
      dataIndex: 'pieces',
      key: 'pieces',
      width: 80,
      render: (text: number | undefined) => text ? `${text} 件` : '-',
    },
    {
      title: '托盘数量', // 2025-12-12 00:15:00 添加托盘数量列
      dataIndex: 'pallets',
      key: 'pallets',
      width: 100,
      render: (text: number | undefined) => text ? `${text} 托` : '-',
    },
    {
      title: '服务类型',
      dataIndex: 'services',
      key: 'services',
      width: 200,
      render: (services: string[]) => (
        <Space wrap>
          {services.map(service => (
            <Tag key={service} color="blue">{service}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: string, record: QuoteRequest) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div style={{ margin: '0 0 0 24px' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>询价请求管理</Title>
          <Text type="secondary">查看和处理客户询价请求</Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={loadQuoteRequests}
        >
          刷新
        </Button>
      </div>

      <Card>
        {/* 筛选器 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Input
              placeholder="搜索编号、联系人、邮箱"
              prefix={<SearchOutlined />}
              value={filters.keyword}
              onChange={handleKeywordChange}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="状态筛选"
              style={{ width: '100%' }}
              allowClear
              value={filters.status}
              onChange={handleStatusFilterChange}
            >
              <Select.Option value="open">待处理</Select.Option>
              <Select.Option value="pending">处理中</Select.Option>
              <Select.Option value="contacted">已联系</Select.Option>
              <Select.Option value="closed">已关闭</Select.Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="服务类型"
              style={{ width: '100%' }}
              allowClear
              value={filters.serviceType}
              onChange={handleServiceTypeFilterChange}
            >
              <Select.Option value="FTL">整车</Select.Option>
              <Select.Option value="LTL">零担</Select.Option>
              <Select.Option value="AIR">空运</Select.Option>
              <Select.Option value="SEA">海运</Select.Option>
              <Select.Option value="EXPRESS">加急</Select.Option>
              <Select.Option value="COLD">冷链</Select.Option>
            </Select>
          </Col>
          <Col span={6}>
            <RangePicker
              style={{ width: '100%' }}
              onChange={handleDateRangeChange}
            />
          </Col>
          <Col span={4}>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
          </Col>
        </Row>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={quoteRequests}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1500 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize }));
            },
          }}
        />
      </Card>
    </div>
  );
};

export default QuoteRequestsList;

