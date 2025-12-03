// 车辆管理组件
// 创建时间: 2025-12-02T20:15:00Z
// 用途：车辆管理，包括车辆列表和月度费用管理（油费、lease、保险、维护费用）

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  message,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { Vehicle, VehicleStatus } from '../../types';
import { vehiclesApi, costsApi } from '../../services/api';
import { useDataContext } from '../../contexts/DataContext';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { MonthPicker } = DatePicker;

interface VehicleCost {
  id: string;
  vehicleId: string;
  costDate: string;
  costAmount: number;
  costType: 'fuel' | 'toll' | 'labor' | 'insurance' | 'depreciation' | 'other';
  description?: string;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  paymentDate?: string;
  notes?: string;
}

interface MonthlyCost {
  month: string; // YYYY-MM
  fuel: number; // 油费
  lease: number; // Lease费用
  insurance: number; // 保险
  maintenance: number; // 维护费用
}

const VehicleManagement: React.FC = () => {
  const { allVehicles, reloadVehicles } = useDataContext();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isCostModalVisible, setIsCostModalVisible] = useState(false);
  const [editingCost, setEditingCost] = useState<MonthlyCost | null>(null);
  const [vehicleCosts, setVehicleCosts] = useState<Record<string, VehicleCost[]>>({});
  const [costForm] = Form.useForm();

  useEffect(() => {
    loadVehicles();
  }, [allVehicles]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      if (allVehicles && allVehicles.length > 0) {
        setVehicles(allVehicles);
      } else {
        const response = await vehiclesApi.getVehicles();
        const vehicleList = response.data?.data || [];
        setVehicles(vehicleList);
      }
    } catch (error) {
      console.error('加载车辆列表失败:', error);
      message.error('加载车辆列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadVehicleCosts = async (vehicleId: string) => {
    try {
      const response = await costsApi.getVehicleCosts({
        vehicleId,
        page: 1,
        limit: 1000,
      });
      const costs = response.data?.data || [];
      setVehicleCosts(prev => ({
        ...prev,
        [vehicleId]: costs,
      }));
      return costs;
    } catch (error) {
      console.error('加载车辆费用失败:', error);
      return [];
    }
  };

  // 将费用列表转换为月度费用格式
  const groupCostsByMonth = (costs: VehicleCost[]): Record<string, MonthlyCost> => {
    const monthlyData: Record<string, MonthlyCost> = {};
    
    costs.forEach(cost => {
      const month = dayjs(cost.costDate).format('YYYY-MM');
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          fuel: 0,
          lease: 0,
          insurance: 0,
          maintenance: 0,
        };
      }
      
      switch (cost.costType) {
        case 'fuel':
          monthlyData[month].fuel += cost.costAmount;
          break;
        case 'insurance':
          monthlyData[month].insurance += cost.costAmount;
          break;
        case 'labor':
          monthlyData[month].maintenance += cost.costAmount;
          break;
        case 'other':
          // 根据描述判断是否为 lease 费用
          if (cost.description?.toLowerCase().includes('lease')) {
            monthlyData[month].lease += cost.costAmount;
          } else {
            monthlyData[month].maintenance += cost.costAmount;
          }
          break;
        default:
          monthlyData[month].maintenance += cost.costAmount;
      }
    });
    
    return monthlyData;
  };

  const handleAddMonthlyCost = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setEditingCost(null);
    // 2025-12-02T20:50:00Z 修复：先重置表单，然后设置 dayjs 对象
    costForm.resetFields();
    // 使用 setTimeout 确保在 Modal 渲染后设置值
    setTimeout(() => {
      costForm.setFieldsValue({
        month: dayjs(),
        fuel: undefined,
        lease: undefined,
        insurance: undefined,
        maintenance: undefined,
      });
    }, 0);
    setIsCostModalVisible(true);
  };

  const handleEditMonthlyCost = async (vehicle: Vehicle, month: string) => {
    setSelectedVehicle(vehicle);
    
    // 加载该车辆的费用数据
    const costs = vehicleCosts[vehicle.id] || await loadVehicleCosts(vehicle.id);
    const monthlyData = groupCostsByMonth(costs);
    const monthlyCost = monthlyData[month];
    
    if (monthlyCost) {
      setEditingCost(monthlyCost);
      // 2025-12-02T20:50:00Z 修复：确保 dayjs 对象有效
      const monthDayjs = dayjs(month, 'YYYY-MM');
      if (!monthDayjs.isValid()) {
        message.error('月份格式无效');
        return;
      }
      // 使用 setTimeout 确保在 Modal 渲染后设置值
      setTimeout(() => {
        costForm.setFieldsValue({
          month: monthDayjs,
          fuel: monthlyCost.fuel || 0,
          lease: monthlyCost.lease || 0,
          insurance: monthlyCost.insurance || 0,
          maintenance: monthlyCost.maintenance || 0,
        });
      }, 0);
      setIsCostModalVisible(true);
    } else {
      message.warning('该月份暂无费用记录');
    }
  };

  const handleSaveMonthlyCost = async () => {
    try {
      const values = await costForm.validateFields();
      if (!selectedVehicle) return;

      // 2025-12-02T20:50:00Z 修复：确保 values.month 是 dayjs 对象
      const monthValue = values.month;
      if (!monthValue) {
        message.error('请选择月份');
        return;
      }
      
      // 如果已经是 dayjs 对象，直接使用；否则尝试解析
      const monthDayjs = dayjs.isDayjs(monthValue) ? monthValue : dayjs(monthValue);
      if (!monthDayjs.isValid()) {
        message.error('月份格式无效');
        return;
      }

      const month = monthDayjs.format('YYYY-MM');
      const firstDayOfMonth = monthDayjs.startOf('month').format('YYYY-MM-DD');
      
      // 获取或创建成本分类（这里简化处理，使用默认分类）
      let costCategories: any[] = [];
      try {
        const categoriesResponse = await costsApi.getCostCategories();
        costCategories = categoriesResponse.data?.data || [];
      } catch (error) {
        console.error('获取成本分类失败:', error);
      }

      const costTypes = [
        { type: 'fuel' as const, amount: values.fuel || 0, label: '油费' },
        { type: 'other' as const, amount: values.lease || 0, label: 'Lease费用', description: 'Lease费用' },
        { type: 'insurance' as const, amount: values.insurance || 0, label: '保险' },
        { type: 'labor' as const, amount: values.maintenance || 0, label: '维护费用' },
      ];

      // 如果有编辑的费用，先删除该月的旧记录
      if (editingCost) {
        const costsToDelete = (vehicleCosts[selectedVehicle.id] || []).filter(
          cost => dayjs(cost.costDate).format('YYYY-MM') === month
        );
        
        for (const cost of costsToDelete) {
          try {
            await costsApi.deleteVehicleCost(cost.id);
          } catch (error) {
            console.error('删除旧费用记录失败:', error);
          }
        }
      }

      // 创建新的费用记录
      let successCount = 0;
      for (const costType of costTypes) {
        if (costType.amount > 0) {
          try {
            // 查找对应的成本分类
            const category = costCategories.find(
              cat => cat.category_code === costType.type || cat.name?.includes(costType.label)
            ) || costCategories[0]; // 如果没有找到，使用第一个分类

            await costsApi.createVehicleCost({
              vehicleId: selectedVehicle.id,
              costCategoryId: category?.id || '',
              costDate: firstDayOfMonth,
              costAmount: costType.amount,
              costType: costType.type,
              description: costType.description || costType.label,
              currency: 'CAD',
              paymentStatus: 'unpaid',
            });
            successCount++;
          } catch (error: any) {
            console.error(`创建${costType.label}失败:`, error);
            message.error(`创建${costType.label}失败: ${error?.response?.data?.error?.message || error.message}`);
          }
        }
      }

      if (successCount > 0) {
        message.success(`成功保存${successCount}项费用`);
        setIsCostModalVisible(false);
        costForm.resetFields();
        setSelectedVehicle(null);
        setEditingCost(null);
        
        // 重新加载费用数据
        if (selectedVehicle) {
          await loadVehicleCosts(selectedVehicle.id);
        }
      }
    } catch (error: any) {
      console.error('保存月度费用失败:', error);
      message.error(`保存失败: ${error?.response?.data?.error?.message || error.message}`);
    }
  };

  const getStatusColor = (status: VehicleStatus) => {
    const colorMap: Record<VehicleStatus, string> = {
      [VehicleStatus.AVAILABLE]: 'green',
      [VehicleStatus.BUSY]: 'blue',
      [VehicleStatus.MAINTENANCE]: 'orange',
      [VehicleStatus.OFFLINE]: 'default',
      [VehicleStatus.INACTIVE]: 'red',
    };
    return colorMap[status] || 'default';
  };

  const getStatusText = (status: VehicleStatus) => {
    const textMap: Record<VehicleStatus, string> = {
      [VehicleStatus.AVAILABLE]: '可用',
      [VehicleStatus.BUSY]: '使用中',
      [VehicleStatus.MAINTENANCE]: '维护中',
      [VehicleStatus.OFFLINE]: '离线',
      [VehicleStatus.INACTIVE]: '停用',
    };
    return textMap[status] || status;
  };

  const columns = [
    {
      title: '车牌号',
      dataIndex: 'plateNumber',
      key: 'plateNumber',
      width: 120,
    },
    {
      title: '车型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
    },
    {
      title: '载重 (kg)',
      dataIndex: 'capacityKg',
      key: 'capacityKg',
      width: 100,
      render: (value: number) => value?.toLocaleString() || '—',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: VehicleStatus) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: Vehicle) => (
        <Space>
          <Button
            type="link"
            icon={<DollarOutlined />}
            onClick={() => handleAddMonthlyCost(record)}
          >
            费用
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4}>🚛 车辆管理</Title>
            <Text type="secondary">管理车辆信息和月度费用（油费、lease、保险、维护费用）</Text>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={vehicles}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 辆车辆`,
          }}
          expandable={{
            expandedRowRender: (record: Vehicle) => {
              const costs = vehicleCosts[record.id] || [];
              const monthlyData = groupCostsByMonth(costs);
              const months = Object.keys(monthlyData).sort().reverse();

              return (
                <div style={{ padding: '16px 0' }}>
                  <Title level={5}>月度费用记录</Title>
                  {months.length === 0 ? (
                    <Text type="secondary">暂无费用记录，点击"费用"按钮添加</Text>
                  ) : (
                    <Table
                      columns={[
                        {
                          title: '月份',
                          dataIndex: 'month',
                          key: 'month',
                          width: 120,
                        },
                        {
                          title: '油费',
                          dataIndex: 'fuel',
                          key: 'fuel',
                          width: 120,
                          render: (value: number) => `$${value.toFixed(2)}`,
                        },
                        {
                          title: 'Lease费用',
                          dataIndex: 'lease',
                          key: 'lease',
                          width: 120,
                          render: (value: number) => `$${value.toFixed(2)}`,
                        },
                        {
                          title: '保险',
                          dataIndex: 'insurance',
                          key: 'insurance',
                          width: 120,
                          render: (value: number) => `$${value.toFixed(2)}`,
                        },
                        {
                          title: '维护费用',
                          dataIndex: 'maintenance',
                          key: 'maintenance',
                          width: 120,
                          render: (value: number) => `$${value.toFixed(2)}`,
                        },
                        {
                          title: '总计',
                          key: 'total',
                          width: 120,
                          render: (_: unknown, row: MonthlyCost & { vehicleId: string }) => (
                            <Text strong>
                              ${(row.fuel + row.lease + row.insurance + row.maintenance).toFixed(2)}
                            </Text>
                          ),
                        },
                        {
                          title: '操作',
                          key: 'action',
                          width: 100,
                          render: (_: unknown, row: MonthlyCost & { vehicleId: string }) => (
                            <Button
                              type="link"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => handleEditMonthlyCost(record, row.month)}
                            >
                              编辑
                            </Button>
                          ),
                        },
                      ]}
                      dataSource={months.map(month => ({ ...monthlyData[month], vehicleId: record.id }))}
                      rowKey="month"
                      pagination={false}
                      size="small"
                    />
                  )}
                </div>
              );
            },
            rowExpandable: () => true,
            onExpand: async (expanded, record: Vehicle) => {
              if (expanded && !vehicleCosts[record.id]) {
                await loadVehicleCosts(record.id);
              }
            },
          }}
        />
      </Card>

      <Modal
        title={editingCost ? '编辑月度费用' : '添加月度费用'}
        open={isCostModalVisible}
        onCancel={() => {
          setIsCostModalVisible(false);
          // 2025-12-02T20:50:00Z 修复：重置表单时使用 initialValues 确保 MonthPicker 有有效值
          costForm.resetFields();
          costForm.setFieldsValue({
            month: dayjs(),
          });
          setSelectedVehicle(null);
          setEditingCost(null);
        }}
        onOk={handleSaveMonthlyCost}
        width={600}
        okText="保存"
        cancelText="取消"
        destroyOnClose={true} // 2025-12-02T20:50:00Z 修复：关闭时销毁表单，避免状态残留
      >
        <Form 
          form={costForm} 
          layout="vertical"
          preserve={false} // 2025-12-02T20:52:00Z 修复：不保留字段值，避免状态残留
        >
          <Form.Item
            name="month"
            label="月份"
            rules={[
              { required: true, message: '请选择月份' },
            ]}
            getValueFromEvent={(value) => {
              // 2025-12-02T20:52:00Z 修复：确保返回的是 dayjs 对象
              if (!value) return null;
              if (dayjs.isDayjs(value)) return value;
              const parsed = dayjs(value);
              return parsed.isValid() ? parsed : null;
            }}
          >
            <MonthPicker
              style={{ width: '100%' }}
              format="YYYY-MM"
              placeholder="选择月份"
              disabled={!!editingCost}
              picker="month"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fuel"
                label="油费 (CAD)"
                rules={[{ required: false, message: '请输入油费' }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="0.00"
                  prefix="$"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lease"
                label="Lease费用 (CAD)"
                rules={[{ required: false, message: '请输入Lease费用' }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="0.00"
                  prefix="$"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="insurance"
                label="保险 (CAD)"
                rules={[{ required: false, message: '请输入保险费用' }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="0.00"
                  prefix="$"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maintenance"
                label="维护费用 (CAD)"
                rules={[{ required: false, message: '请输入维护费用' }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="0.00"
                  prefix="$"
                />
              </Form.Item>
            </Col>
          </Row>

          {selectedVehicle && (
            <Form.Item label="车辆信息">
              <Text type="secondary">
                {selectedVehicle.plateNumber} - {selectedVehicle.type}
              </Text>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default VehicleManagement;

