// 排班管理组件 - 支持自定义字段、表头配置、排序归类、精准筛选
// 创建时间: 2025-11-29T11:25:04Z
// 产品需求：在车队管理中增加排班管理功能

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  InputNumber,
  Space,
  Tag,
  message,
  Drawer,
  Checkbox,
  Row,
  Col,
  Typography,
  Divider,
  Popconfirm,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  FilterOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { driversApi, tripsApi, shipmentsApi } from '../../services/api'; // 2025-11-30 03:00:00 新增：用于自动读取行程和运单数据
import { useDataContext } from '../../contexts/DataContext'; // 2025-11-30 03:00:00 新增：使用统一数据源
import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween'; // 2025-11-30 06:50:00 修复：导入 isBetween 插件
dayjs.extend(isBetween); // 2025-11-30 06:50:00 修复：启用 isBetween 插件

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// 自定义字段类型定义
type CustomFieldType = 'text' | 'number' | 'date' | 'time' | 'list' | 'phone' | 'textarea';

interface CustomFieldDefinition {
  id?: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: CustomFieldType;
  fieldOptions?: string[]; // 列表类型字段的选项
  isRequired?: boolean;
  defaultValue?: any;
  sortOrder?: number;
  isActive?: boolean;
}

interface ScheduleRecord {
  id: string;
  driverId: string;
  driverName?: string;
  scheduleDate: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  plannedHours?: number;
  actualHours?: number;
  status: string;
  notes?: string;
  customFields?: Record<string, any>; // 自定义字段值
}

interface ScheduleManagementProps {
  driverId?: string; // 可选：如果指定，则只显示该司机的排班
  onScheduleUpdate?: () => void;
}

const ScheduleManagement: React.FC<ScheduleManagementProps> = ({ driverId, onScheduleUpdate }) => {
  // 2025-11-30 03:00:00 修复：使用 DataContext 统一数据源
  const { allDrivers, allVehicles } = useDataContext();
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);
  
  // 自定义字段定义
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [isFieldConfigVisible, setIsFieldConfigVisible] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);
  const [fieldForm] = Form.useForm();

  // 表头配置
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [isHeaderConfigVisible, setIsHeaderConfigVisible] = useState(false);

  // 排序和筛选
  const [sortConfig, setSortConfig] = useState<{ field: string; order: 'asc' | 'desc' } | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filterForm] = Form.useForm();

  // 编辑排班
  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleRecord | null>(null);
  const [scheduleForm] = Form.useForm();

  // 日期范围
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  useEffect(() => {
    // 2025-11-30 03:00:00 修复：移除 loadDrivers，使用 DataContext
    loadCustomFieldDefinitions();
    loadSchedules();
  }, [driverId, dateRange, allDrivers.length]); // 依赖 allDrivers.length 确保数据加载后再读取排班

  // 初始化可见列
  useEffect(() => {
    if (customFieldDefinitions.length > 0 && visibleColumns.length === 0) {
      const defaultColumns = [
        'scheduleDate',
        'driverName',
        'shiftType',
        'startTime',
        'endTime',
        'status',
        ...customFieldDefinitions.filter(f => f.isActive).map(f => f.fieldKey),
      ];
      setVisibleColumns(defaultColumns);
    }
  }, [customFieldDefinitions]);

  const loadDrivers = async () => {
    try {
      const response = await driversApi.getDrivers();
      setAllDrivers(response.data?.data || []);
    } catch (error: any) {
      console.error('加载司机列表失败:', error);
    }
  };

  const loadCustomFieldDefinitions = async () => {
    try {
      const response = await driversApi.getScheduleCustomFieldDefinitions(true);
      const fields = response.data?.data || [];
      
      // 如果后端没有字段定义，使用默认字段定义
      if (fields.length === 0) {
        const defaultFields: CustomFieldDefinition[] = [
          { fieldKey: 'customer_name', fieldLabel: '客户名称', fieldType: 'text', isActive: true, sortOrder: 1 },
          { fieldKey: 'destination', fieldLabel: '目的地', fieldType: 'text', isActive: true, sortOrder: 2 },
          { fieldKey: 'priority', fieldLabel: '任务优先级', fieldType: 'list', fieldOptions: ['高优先级', '中优先级', '低优先级'], isActive: true, sortOrder: 3 },
          { fieldKey: 'cargo_type', fieldLabel: '货品类目', fieldType: 'list', fieldOptions: ['食品类', '日用品', '电子产品', '其他'], isActive: true, sortOrder: 4 },
          { fieldKey: 'mileage', fieldLabel: '任务里程', fieldType: 'number', isActive: true, sortOrder: 5 },
          { fieldKey: 'contact_phone', fieldLabel: '联系电话', fieldType: 'phone', isActive: true, sortOrder: 6 },
        ];
        setCustomFieldDefinitions(defaultFields);
      } else {
        // 映射后端数据到前端格式
        setCustomFieldDefinitions(fields.map((f: any) => ({
          id: f.id,
          fieldKey: f.fieldKey,
          fieldLabel: f.fieldLabel,
          fieldType: f.fieldType,
          fieldOptions: f.fieldOptions,
          isRequired: f.isRequired,
          defaultValue: f.defaultValue,
          sortOrder: f.sortOrder,
          isActive: f.isActive,
        })));
      }
    } catch (error: any) {
      console.error('加载自定义字段定义失败:', error);
      // 如果API调用失败，使用默认字段定义
      const defaultFields: CustomFieldDefinition[] = [
        { fieldKey: 'customer_name', fieldLabel: '客户名称', fieldType: 'text', isActive: true, sortOrder: 1 },
        { fieldKey: 'destination', fieldLabel: '目的地', fieldType: 'text', isActive: true, sortOrder: 2 },
        { fieldKey: 'priority', fieldLabel: '任务优先级', fieldType: 'list', fieldOptions: ['高优先级', '中优先级', '低优先级'], isActive: true, sortOrder: 3 },
        { fieldKey: 'cargo_type', fieldLabel: '货品类目', fieldType: 'list', fieldOptions: ['食品类', '日用品', '电子产品', '其他'], isActive: true, sortOrder: 4 },
        { fieldKey: 'mileage', fieldLabel: '任务里程', fieldType: 'number', isActive: true, sortOrder: 5 },
        { fieldKey: 'contact_phone', fieldLabel: '联系电话', fieldType: 'phone', isActive: true, sortOrder: 6 },
      ];
      setCustomFieldDefinitions(defaultFields);
    }
  };

  // 2025-11-30 03:00:00 修复：自动从 trips 和 shipments 读取数据，无需手动创建
  const loadSchedules = async () => {
    setLoading(true);
    try {
      const [start, end] = dateRange;
      
      // 1. 从 trips 表读取行程数据（包含司机、车辆、运单信息）
      const tripsResponse = await tripsApi.getTrips({
        page: 1,
        limit: 1000, // 获取足够多的行程
      });
      const trips = tripsResponse.data?.data || [];
      
      // 2. 从 shipments 表读取已指派司机和车辆的运单
      const shipmentsResponse = await shipmentsApi.getShipments({
        page: 1,
        limit: 1000,
      });
      const shipments = shipmentsResponse.data?.data || [];
      
      // 3. 生成排班记录
      const generatedSchedules: ScheduleRecord[] = [];
      
      // 从行程生成排班（行程包含多个运单）
      trips.forEach((trip: any) => {
        const tripStartTime = trip.startTimePlanned || trip.start_time_planned;
        const tripEndTime = trip.endTimePlanned || trip.end_time_planned;
        
        if (tripStartTime && tripEndTime) {
          const tripDate = dayjs(tripStartTime);
          if (tripDate.isBetween(start, end, 'day', '[]')) {
            const driver = allDrivers.find((d: any) => d.id === trip.driverId);
            const vehicle = allVehicles.find((v: any) => v.id === trip.vehicleId);
            
            generatedSchedules.push({
              id: `trip-${trip.id}`,
              driverId: trip.driverId || '',
              driverName: driver?.name || '未知司机',
              scheduleDate: tripDate.format('YYYY-MM-DD'),
              shiftType: '行程',
              startTime: dayjs(tripStartTime).format('HH:mm'),
              endTime: dayjs(tripEndTime).format('HH:mm'),
              plannedHours: dayjs(tripEndTime).diff(dayjs(tripStartTime), 'hour', true),
              status: trip.status === 'completed' ? 'completed' : trip.status === 'ongoing' ? 'in_progress' : 'planned',
              customFields: {
                tripNo: trip.tripNo || trip.trip_no,
                vehiclePlate: vehicle?.plateNumber || '未知车辆',
                shipmentCount: Array.isArray(trip.shipments) ? trip.shipments.length : 0,
              },
            });
          }
        }
      });
      
      // 从运单生成排班（已指派但未挂载到行程的运单）
      shipments.forEach((shipment: any) => {
        if (shipment.driverId && !shipment.tripId && !shipment.trip_id) {
          const shipmentDate = dayjs(shipment.createdAt || shipment.created_at);
          if (shipmentDate.isBetween(start, end, 'day', '[]')) {
            const driver = allDrivers.find((d: any) => d.id === shipment.driverId);
            const vehicle = allVehicles.find((v: any) => v.id === shipment.vehicleId || shipment.assignedVehicleId);
            
            // 检查是否已从行程中生成过
            const alreadyExists = generatedSchedules.some(
              s => s.driverId === shipment.driverId && 
                   s.scheduleDate === shipmentDate.format('YYYY-MM-DD')
            );
            
            if (!alreadyExists) {
              generatedSchedules.push({
                id: `shipment-${shipment.id}`,
                driverId: shipment.driverId,
                driverName: driver?.name || '未知司机',
                scheduleDate: shipmentDate.format('YYYY-MM-DD'),
                shiftType: '运单',
                startTime: shipmentDate.format('HH:mm'),
                endTime: shipmentDate.add(8, 'hour').format('HH:mm'), // 默认8小时
                plannedHours: 8,
                status: shipment.status === 'completed' ? 'completed' : shipment.status === 'in_transit' ? 'in_progress' : 'planned',
                customFields: {
                  shipmentNumber: shipment.shipmentNumber || shipment.shipment_no,
                  vehiclePlate: vehicle?.plateNumber || '未知车辆',
                },
              });
            }
          }
        }
      });
      
      // 4. 如果指定了 driverId，只显示该司机的排班
      const filteredSchedules = driverId 
        ? generatedSchedules.filter(s => s.driverId === driverId)
        : generatedSchedules;
      
      setSchedules(filteredSchedules);
    } catch (error: any) {
      console.error('加载排班失败:', error);
      message.error('加载排班失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 处理排序
  const handleSort = (field: string) => {
    if (sortConfig?.field === field) {
      if (sortConfig.order === 'asc') {
        setSortConfig({ field, order: 'desc' });
      } else {
        setSortConfig(null);
      }
    } else {
      setSortConfig({ field, order: 'asc' });
    }
  };

  // 处理筛选
  const handleFilter = (values: any) => {
    setFilters(values);
    setIsFilterVisible(false);
  };

  // 清除筛选
  const clearFilters = () => {
    setFilters({});
    filterForm.resetFields();
  };

  // 获取字段定义
  const getFieldDefinition = (fieldKey: string): CustomFieldDefinition | undefined => {
    return customFieldDefinitions.find(f => f.fieldKey === fieldKey);
  };

  // 处理自定义字段值的显示
  const renderCustomFieldValue = (fieldKey: string, value: any) => {
    const fieldDef = getFieldDefinition(fieldKey);
    if (!fieldDef || !value) return '-';

    switch (fieldDef.fieldType) {
      case 'date':
        return dayjs(value).format('YYYY-MM-DD');
      case 'time':
        return typeof value === 'string' ? value : dayjs(value).format('HH:mm');
      case 'list':
        return <Tag color="blue">{value}</Tag>;
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      case 'phone':
        return <Text copyable={{ text: value }}>{value}</Text>;
      default:
        return value;
    }
  };

  // 生成表格列
  const generateColumns = () => {
    const baseColumns: any[] = [
      {
        title: '日期',
        dataIndex: 'scheduleDate',
        key: 'scheduleDate',
        width: 120,
        fixed: 'left',
        sorter: (a: ScheduleRecord, b: ScheduleRecord) => 
          dayjs(a.scheduleDate).unix() - dayjs(b.scheduleDate).unix(),
        render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
      },
      {
        title: '司机',
        dataIndex: 'driverName',
        key: 'driverName',
        width: 120,
        fixed: 'left',
        sorter: (a: ScheduleRecord, b: ScheduleRecord) => 
          (a.driverName || '').localeCompare(b.driverName || ''),
      },
      {
        title: '班次类型',
        dataIndex: 'shiftType',
        key: 'shiftType',
        width: 100,
        render: (type: string) => {
          const typeMap: Record<string, string> = {
            'day': '白班',
            'night': '夜班',
            'overtime': '加班',
            'on_call': '待命',
            'off': '休息',
          };
          return <Tag color={type === 'off' ? 'default' : 'blue'}>{typeMap[type] || type}</Tag>;
        },
        filters: [
          { text: '白班', value: 'day' },
          { text: '夜班', value: 'night' },
          { text: '加班', value: 'overtime' },
          { text: '待命', value: 'on_call' },
          { text: '休息', value: 'off' },
        ],
        onFilter: (value: string, record: ScheduleRecord) => record.shiftType === value,
      },
      {
        title: '工作时间',
        key: 'workTime',
        width: 150,
        render: (_: any, record: ScheduleRecord) => `${record.startTime} - ${record.endTime}`,
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (status: string) => {
          const colorMap: Record<string, string> = {
            'scheduled': 'blue',
            'confirmed': 'cyan',
            'in_progress': 'orange',
            'completed': 'green',
            'cancelled': 'default',
            'absent': 'red',
          };
          const textMap: Record<string, string> = {
            'scheduled': '已排班',
            'confirmed': '已确认',
            'in_progress': '进行中',
            'completed': '已完成',
            'cancelled': '已取消',
            'absent': '缺勤',
          };
          return <Tag color={colorMap[status]}>{textMap[status]}</Tag>;
        },
        filters: [
          { text: '已排班', value: 'scheduled' },
          { text: '已确认', value: 'confirmed' },
          { text: '进行中', value: 'in_progress' },
          { text: '已完成', value: 'completed' },
          { text: '已取消', value: 'cancelled' },
          { text: '缺勤', value: 'absent' },
        ],
        onFilter: (value: string, record: ScheduleRecord) => record.status === value,
      },
    ];

    // 添加自定义字段列
    const customColumns = customFieldDefinitions
      .filter(f => f.isActive && visibleColumns.includes(f.fieldKey))
      .map(fieldDef => {
        const column: any = {
          title: (
            <Space>
              {fieldDef.fieldLabel}
              <Tooltip title="点击排序">
                <Button
                  type="text"
                  size="small"
                  icon={sortConfig?.field === fieldDef.fieldKey ? 
                    (sortConfig.order === 'asc' ? <SortAscendingOutlined /> : <SortDescendingOutlined />) : 
                    <SortAscendingOutlined />
                  }
                  onClick={() => handleSort(fieldDef.fieldKey)}
                />
              </Tooltip>
            </Space>
          ),
          dataIndex: ['customFields', fieldDef.fieldKey],
          key: fieldDef.fieldKey,
          width: 150,
          render: (value: any) => renderCustomFieldValue(fieldDef.fieldKey, value),
        };

        // 根据字段类型添加排序和筛选
        if (fieldDef.fieldType === 'number') {
          column.sorter = (a: ScheduleRecord, b: ScheduleRecord) => {
            const aVal = a.customFields?.[fieldDef.fieldKey] || 0;
            const bVal = b.customFields?.[fieldDef.fieldKey] || 0;
            return Number(aVal) - Number(bVal);
          };
        } else if (fieldDef.fieldType === 'text' || fieldDef.fieldType === 'phone') {
          column.sorter = (a: ScheduleRecord, b: ScheduleRecord) => {
            const aVal = String(a.customFields?.[fieldDef.fieldKey] || '');
            const bVal = String(b.customFields?.[fieldDef.fieldKey] || '');
            return aVal.localeCompare(bVal);
          };
        } else if (fieldDef.fieldType === 'list' && fieldDef.fieldOptions) {
          column.filters = fieldDef.fieldOptions.map(opt => ({ text: opt, value: opt }));
          column.onFilter = (value: string, record: ScheduleRecord) => 
            record.customFields?.[fieldDef.fieldKey] === value;
        }

        return column;
      });

    // 添加操作列
    const actionColumn = {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_: any, record: ScheduleRecord) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditSchedule(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除吗？"
            onConfirm={() => handleDeleteSchedule(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    };

    return [...baseColumns, ...customColumns, actionColumn];
  };

  // 处理排序和筛选后的数据
  const processedSchedules = useMemo(() => {
    let result = [...schedules];

    // 应用筛选
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      
      const fieldDef = getFieldDefinition(key);
      if (fieldDef) {
        if (fieldDef.fieldType === 'text' || fieldDef.fieldType === 'phone') {
          const searchValue = String(value).toLowerCase();
          result = result.filter(r => {
            const fieldValue = String(r.customFields?.[key] || '').toLowerCase();
            return fieldValue.includes(searchValue);
          });
        } else if (fieldDef.fieldType === 'list') {
          result = result.filter(r => r.customFields?.[key] === value);
        }
      }
    });

    // 应用排序
    if (sortConfig) {
      const { field, order } = sortConfig;
      const fieldDef = getFieldDefinition(field);
      
      if (fieldDef) {
        result.sort((a, b) => {
          let aVal = a.customFields?.[field] ?? '';
          let bVal = b.customFields?.[field] ?? '';

          if (fieldDef.fieldType === 'number') {
            aVal = Number(aVal) || 0;
            bVal = Number(bVal) || 0;
          } else if (fieldDef.fieldType === 'text' || fieldDef.fieldType === 'phone') {
            aVal = String(aVal);
            bVal = String(bVal);
          }

          const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          return order === 'asc' ? comparison : -comparison;
        });
      }
    }

    // 文本字段归集：相同内容的排班分组显示
    if (sortConfig && sortConfig.field) {
      const fieldDef = getFieldDefinition(sortConfig.field);
      if (fieldDef && fieldDef.fieldType === 'text') {
        // 已经按文本排序，相同内容会聚集在一起
        // 可以在这里添加分组显示逻辑
      }
    }

    return result;
  }, [schedules, filters, sortConfig, customFieldDefinitions]);

  const handleEditSchedule = (record: ScheduleRecord) => {
    setEditingSchedule(record);
    scheduleForm.setFieldsValue({
      ...record,
      scheduleDate: dayjs(record.scheduleDate),
      startTime: dayjs(record.startTime, 'HH:mm:ss'),
      endTime: dayjs(record.endTime, 'HH:mm:ss'),
      ...record.customFields,
    });
    setIsScheduleModalVisible(true);
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      await driversApi.deleteDriverSchedule(id);
      message.success('删除成功');
      loadSchedules();
      onScheduleUpdate?.();
    } catch (error: any) {
      message.error('删除失败: ' + error.message);
    }
  };

  const handleScheduleSubmit = async (values: any) => {
    try {
      const customFields: Record<string, any> = {};
      customFieldDefinitions.forEach(fieldDef => {
        if (values[fieldDef.fieldKey] !== undefined) {
          customFields[fieldDef.fieldKey] = values[fieldDef.fieldKey];
        }
      });

      const data = {
        scheduleDate: values.scheduleDate.format('YYYY-MM-DD'),
        startTime: values.startTime.format('HH:mm:ss'),
        endTime: values.endTime.format('HH:mm:ss'),
        shiftType: values.shiftType,
        plannedHours: values.plannedHours,
        actualHours: values.actualHours,
        status: values.status,
        notes: values.notes,
        customFields,
      };

      if (editingSchedule) {
        await driversApi.updateDriverSchedule(editingSchedule.id, data);
        message.success('更新成功');
      } else {
        await driversApi.createDriverSchedule(editingSchedule?.driverId || driverId || '', data);
        message.success('创建成功');
      }
      setIsScheduleModalVisible(false);
      scheduleForm.resetFields();
      loadSchedules();
      onScheduleUpdate?.();
    } catch (error: any) {
      message.error('操作失败: ' + error.message);
    }
  };

  const handleFieldConfigSubmit = async (values: any) => {
    try {
      const fieldData = {
        ...values,
        fieldOptions: values.fieldType === 'list' && values.fieldOptions ? 
          values.fieldOptions.split(',').map((s: string) => s.trim()) : undefined,
      };

      if (editingField?.id) {
        // 更新字段定义
        await driversApi.updateScheduleCustomFieldDefinition(editingField.id, fieldData);
        message.success('字段定义更新成功');
      } else {
        // 创建字段定义
        await driversApi.createScheduleCustomFieldDefinition(fieldData);
        message.success('字段定义创建成功');
      }
      
      // 重新加载字段定义
      await loadCustomFieldDefinitions();
      setIsFieldConfigVisible(false);
      fieldForm.resetFields();
      setEditingField(null);
    } catch (error: any) {
      message.error('操作失败: ' + (error.response?.data?.error?.message || error.message || '未知错误'));
    }
  };

  // 渲染自定义字段输入组件
  const renderCustomFieldInput = (fieldDef: CustomFieldDefinition) => {
    const rules = fieldDef.isRequired ? [{ required: true, message: `请输入${fieldDef.fieldLabel}` }] : [];

    switch (fieldDef.fieldType) {
      case 'text':
        return (
          <Form.Item name={fieldDef.fieldKey} label={fieldDef.fieldLabel} rules={rules}>
            <Input placeholder={`请输入${fieldDef.fieldLabel}`} />
          </Form.Item>
        );
      case 'textarea':
        return (
          <Form.Item name={fieldDef.fieldKey} label={fieldDef.fieldLabel} rules={rules}>
            <TextArea rows={3} placeholder={`请输入${fieldDef.fieldLabel}`} />
          </Form.Item>
        );
      case 'number':
        return (
          <Form.Item name={fieldDef.fieldKey} label={fieldDef.fieldLabel} rules={rules}>
            <InputNumber style={{ width: '100%' }} placeholder={`请输入${fieldDef.fieldLabel}`} />
          </Form.Item>
        );
      case 'date':
        return (
          <Form.Item name={fieldDef.fieldKey} label={fieldDef.fieldLabel} rules={rules}>
            <DatePicker style={{ width: '100%' }} placeholder={`请选择${fieldDef.fieldLabel}`} />
          </Form.Item>
        );
      case 'time':
        return (
          <Form.Item name={fieldDef.fieldKey} label={fieldDef.fieldLabel} rules={rules}>
            <TimePicker style={{ width: '100%' }} format="HH:mm" placeholder={`请选择${fieldDef.fieldLabel}`} />
          </Form.Item>
        );
      case 'phone':
        return (
          <Form.Item 
            name={fieldDef.fieldKey} 
            label={fieldDef.fieldLabel} 
            rules={[
              ...rules,
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
            ]}
          >
            <Input placeholder={`请输入${fieldDef.fieldLabel}`} />
          </Form.Item>
        );
      case 'list':
        return (
          <Form.Item name={fieldDef.fieldKey} label={fieldDef.fieldLabel} rules={rules}>
            <Select placeholder={`请选择${fieldDef.fieldLabel}`}>
              {fieldDef.fieldOptions?.map(opt => (
                <Option key={opt} value={opt}>{opt}</Option>
              ))}
            </Select>
          </Form.Item>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <Card
        title="排班管理"
        extra={
          <Space>
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([dates[0], dates[1]]);
                }
              }}
            />
            <Button
              icon={<FilterOutlined />}
              onClick={() => setIsFilterVisible(true)}
            >
              筛选
            </Button>
            <Button
              icon={<SettingOutlined />}
              onClick={() => setIsHeaderConfigVisible(true)}
            >
              表头配置
            </Button>
            <Button
              icon={<SettingOutlined />}
              onClick={() => {
                setEditingField(null);
                fieldForm.resetFields();
                setIsFieldConfigVisible(true);
              }}
            >
              自定义字段
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingSchedule(null);
                scheduleForm.resetFields();
                scheduleForm.setFieldsValue({
                  scheduleDate: dayjs(),
                  shiftType: 'day',
                  startTime: dayjs('08:00', 'HH:mm'),
                  endTime: dayjs('17:00', 'HH:mm'),
                  status: 'scheduled',
                });
                setIsScheduleModalVisible(true);
              }}
            >
              添加排班
            </Button>
            <Button icon={<ReloadOutlined />} onClick={loadSchedules}>
              刷新
            </Button>
          </Space>
        }
      >
        <Table
          columns={generateColumns()}
          dataSource={processedSchedules}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: 1500 }}
        />
      </Card>

      {/* 编辑排班弹窗 */}
      <Modal
        title={editingSchedule ? '编辑排班' : '添加排班'}
        open={isScheduleModalVisible}
        onCancel={() => {
          setIsScheduleModalVisible(false);
          scheduleForm.resetFields();
        }}
        onOk={() => scheduleForm.submit()}
        width={800}
      >
        <Form form={scheduleForm} layout="vertical" onFinish={handleScheduleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="scheduleDate" label="排班日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="shiftType" label="班次类型" rules={[{ required: true }]}>
                <Select>
                  <Option value="day">白班</Option>
                  <Option value="night">夜班</Option>
                  <Option value="overtime">加班</Option>
                  <Option value="on_call">待命</Option>
                  <Option value="off">休息</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startTime" label="开始时间" rules={[{ required: true }]}>
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endTime" label="结束时间" rules={[{ required: true }]}>
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="plannedHours" label="计划工时(小时)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select>
                  <Option value="scheduled">已排班</Option>
                  <Option value="confirmed">已确认</Option>
                  <Option value="in_progress">进行中</Option>
                  <Option value="completed">已完成</Option>
                  <Option value="cancelled">已取消</Option>
                  <Option value="absent">缺勤</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider>自定义字段</Divider>
          {customFieldDefinitions.filter(f => f.isActive).map(fieldDef => (
            <div key={fieldDef.fieldKey}>
              {renderCustomFieldInput(fieldDef)}
            </div>
          ))}

          <Form.Item name="notes" label="备注">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 表头配置弹窗 */}
      <Drawer
        title="表头配置"
        open={isHeaderConfigVisible}
        onClose={() => setIsHeaderConfigVisible(false)}
        width={400}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>选择要显示的列：</Text>
          <Checkbox.Group
            value={visibleColumns}
            onChange={(values) => setVisibleColumns(values as string[])}
            style={{ width: '100%' }}
          >
            <Space direction="vertical">
              <Checkbox value="scheduleDate">日期</Checkbox>
              <Checkbox value="driverName">司机</Checkbox>
              <Checkbox value="shiftType">班次类型</Checkbox>
              <Checkbox value="startTime">开始时间</Checkbox>
              <Checkbox value="endTime">结束时间</Checkbox>
              <Checkbox value="status">状态</Checkbox>
              {customFieldDefinitions.filter(f => f.isActive).map(fieldDef => (
                <Checkbox key={fieldDef.fieldKey} value={fieldDef.fieldKey}>
                  {fieldDef.fieldLabel}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        </Space>
      </Drawer>

      {/* 筛选弹窗 */}
      <Drawer
        title="精准筛选"
        open={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        width={400}
      >
        <Form form={filterForm} layout="vertical" onFinish={handleFilter}>
          {customFieldDefinitions.filter(f => f.isActive).map(fieldDef => {
            if (fieldDef.fieldType === 'text' || fieldDef.fieldType === 'phone') {
              return (
                <Form.Item key={fieldDef.fieldKey} name={fieldDef.fieldKey} label={fieldDef.fieldLabel}>
                  <Input placeholder={`输入关键词或${fieldDef.fieldType === 'phone' ? '号码' : '文本'}进行筛选`} />
                </Form.Item>
              );
            } else if (fieldDef.fieldType === 'list' && fieldDef.fieldOptions) {
              return (
                <Form.Item key={fieldDef.fieldKey} name={fieldDef.fieldKey} label={fieldDef.fieldLabel}>
                  <Select placeholder="选择选项进行筛选" allowClear>
                    {fieldDef.fieldOptions.map(opt => (
                      <Option key={opt} value={opt}>{opt}</Option>
                    ))}
                  </Select>
                </Form.Item>
              );
            }
            return null;
          })}
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                应用筛选
              </Button>
              <Button onClick={clearFilters}>
                清除筛选
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>

      {/* 自定义字段配置弹窗 */}
      <Modal
        title={editingField ? '编辑自定义字段' : '添加自定义字段'}
        open={isFieldConfigVisible}
        onCancel={() => {
          setIsFieldConfigVisible(false);
          fieldForm.resetFields();
          setEditingField(null);
        }}
        onOk={() => fieldForm.submit()}
        width={600}
      >
        <Form form={fieldForm} layout="vertical" onFinish={handleFieldConfigSubmit}>
          <Form.Item name="fieldKey" label="字段键名" rules={[{ required: true }]}>
            <Input placeholder="如：customer_name" disabled={!!editingField} />
          </Form.Item>
          <Form.Item name="fieldLabel" label="字段显示名称" rules={[{ required: true }]}>
            <Input placeholder="如：客户名称" />
          </Form.Item>
          <Form.Item name="fieldType" label="字段类型" rules={[{ required: true }]}>
            <Select>
              <Option value="text">文本</Option>
              <Option value="textarea">多行文本</Option>
              <Option value="number">数字</Option>
              <Option value="date">日期</Option>
              <Option value="time">时间</Option>
              <Option value="phone">电话</Option>
              <Option value="list">列表</Option>
            </Select>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.fieldType !== currentValues.fieldType}
          >
            {({ getFieldValue }) =>
              getFieldValue('fieldType') === 'list' ? (
                <Form.Item name="fieldOptions" label="列表选项" rules={[{ required: true }]}>
                  <TextArea
                    rows={4}
                    placeholder="每行一个选项，或用逗号分隔，如：高优先级,中优先级,低优先级"
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item name="isRequired" valuePropName="checked">
            <Checkbox>必填字段</Checkbox>
          </Form.Item>
          <Form.Item name="sortOrder" label="排序顺序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ScheduleManagement;

