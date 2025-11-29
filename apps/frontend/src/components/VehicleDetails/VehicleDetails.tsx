// 车辆详情组件 - 扩展版（含证照、保险、年检、设备管理）
// 创建时间: 2025-11-29T11:25:04Z
// 第一阶段：核心主数据完善 - 1.1 车辆档案完善

import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Upload,
  message,
  Tag,
  Space,
  Row,
  Col,
  Typography,
  Popconfirm,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { vehiclesApi, fileApi } from '../../services/api';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { Text } = Typography;
const { Option } = Select;

interface VehicleDetailsProps {
  vehicleId: string;
  vehicle?: {
    id: string;
    plateNumber: string;
    type: string;
    status: string;
  };
  onClose?: () => void;
}

const VehicleDetails: React.FC<VehicleDetailsProps> = ({ vehicleId, vehicle, onClose }) => {
  const [activeTab, setActiveTab] = useState('certificates');
  const [loading, setLoading] = useState(false);
  
  // 证照数据
  const [certificates, setCertificates] = useState<any[]>([]);
  const [isCertificateModalVisible, setIsCertificateModalVisible] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<any>(null);
  const [certificateForm] = Form.useForm();

  // 保险数据
  const [insurances, setInsurances] = useState<any[]>([]);
  const [isInsuranceModalVisible, setIsInsuranceModalVisible] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<any>(null);
  const [insuranceForm] = Form.useForm();

  // 年检数据
  const [inspections, setInspections] = useState<any[]>([]);
  const [isInspectionModalVisible, setIsInspectionModalVisible] = useState(false);
  const [editingInspection, setEditingInspection] = useState<any>(null);
  const [inspectionForm] = Form.useForm();

  // 设备数据
  const [devices, setDevices] = useState<any[]>([]);
  const [isDeviceModalVisible, setIsDeviceModalVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState<any>(null);
  const [deviceForm] = Form.useForm();

  // 加载数据
  useEffect(() => {
    if (vehicleId) {
      loadAllData();
    }
  }, [vehicleId, activeTab]);

  const loadAllData = async () => {
    if (!vehicleId) return;
    
    setLoading(true);
    try {
      switch (activeTab) {
        case 'certificates':
          await loadCertificates();
          break;
        case 'insurances':
          await loadInsurances();
          break;
        case 'inspections':
          await loadInspections();
          break;
        case 'devices':
          await loadDevices();
          break;
      }
    } catch (error: any) {
      message.error('加载数据失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCertificates = async () => {
    try {
      const response = await vehiclesApi.getVehicleCertificates(vehicleId);
      setCertificates(response.data?.data || []);
    } catch (error: any) {
      message.error('加载证照失败: ' + error.message);
    }
  };

  const loadInsurances = async () => {
    try {
      const response = await vehiclesApi.getVehicleInsurances(vehicleId);
      setInsurances(response.data?.data || []);
    } catch (error: any) {
      message.error('加载保险失败: ' + error.message);
    }
  };

  const loadInspections = async () => {
    try {
      const response = await vehiclesApi.getVehicleInspections(vehicleId);
      setInspections(response.data?.data || []);
    } catch (error: any) {
      message.error('加载年检失败: ' + error.message);
    }
  };

  const loadDevices = async () => {
    try {
      const response = await vehiclesApi.getVehicleDevices(vehicleId);
      setDevices(response.data?.data || []);
    } catch (error: any) {
      message.error('加载设备失败: ' + error.message);
    }
  };

  // 证照管理
  const handleCreateCertificate = () => {
    setEditingCertificate(null);
    certificateForm.resetFields();
    setIsCertificateModalVisible(true);
  };

  const handleEditCertificate = (record: any) => {
    setEditingCertificate(record);
    certificateForm.setFieldsValue({
      ...record,
      issueDate: record.issueDate ? dayjs(record.issueDate) : null,
      expiryDate: record.expiryDate ? dayjs(record.expiryDate) : null,
    });
    setIsCertificateModalVisible(true);
  };

  const handleDeleteCertificate = async (id: string) => {
    try {
      await vehiclesApi.deleteVehicleCertificate(id);
      message.success('删除成功');
      loadCertificates();
    } catch (error: any) {
      message.error('删除失败: ' + error.message);
    }
  };

  const handleCertificateSubmit = async (values: any) => {
    try {
      let filePath = values.file_path || editingCertificate?.file_path;
      
      // 如果有上传的文件，先上传文件
      if (values.uploadedFile) {
        try {
          const uploadResponse = await fileApi.uploadFile(values.uploadedFile, 'vehicle_certificate');
          filePath = uploadResponse.data?.data?.filePath || uploadResponse.data?.filePath;
          message.success('文件上传成功');
        } catch (uploadError: any) {
          message.warning('文件上传失败，但证照信息已保存: ' + uploadError.message);
        }
      }

      const data = {
        ...values,
        issueDate: values.issueDate ? values.issueDate.format('YYYY-MM-DD') : null,
        expiryDate: values.expiryDate.format('YYYY-MM-DD'),
        file_path: filePath,
      };
      delete data.uploadedFile; // 移除临时文件字段

      if (editingCertificate) {
        await vehiclesApi.updateVehicleCertificate(editingCertificate.id, data);
        message.success('更新成功');
      } else {
        await vehiclesApi.createVehicleCertificate(vehicleId, data);
        message.success('创建成功');
      }
      setIsCertificateModalVisible(false);
      certificateForm.resetFields();
      loadCertificates();
    } catch (error: any) {
      message.error('操作失败: ' + error.message);
    }
  };

  // 保险管理（类似逻辑）
  const handleCreateInsurance = () => {
    setEditingInsurance(null);
    insuranceForm.resetFields();
    setIsInsuranceModalVisible(true);
  };

  const handleEditInsurance = (record: any) => {
    setEditingInsurance(record);
    insuranceForm.setFieldsValue({
      ...record,
      startDate: record.startDate ? dayjs(record.startDate) : null,
      expiryDate: record.expiryDate ? dayjs(record.expiryDate) : null,
    });
    setIsInsuranceModalVisible(true);
  };

  const handleDeleteInsurance = async (id: string) => {
    try {
      await vehiclesApi.deleteVehicleInsurance(id);
      message.success('删除成功');
      loadInsurances();
    } catch (error: any) {
      message.error('删除失败: ' + error.message);
    }
  };

  const handleInsuranceSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        startDate: values.startDate.format('YYYY-MM-DD'),
        expiryDate: values.expiryDate.format('YYYY-MM-DD'),
        coverageAmount: values.coverageAmount ? parseFloat(values.coverageAmount) : null,
        premiumAmount: values.premiumAmount ? parseFloat(values.premiumAmount) : null,
      };

      if (editingInsurance) {
        await vehiclesApi.updateVehicleInsurance(editingInsurance.id, data);
        message.success('更新成功');
      } else {
        await vehiclesApi.createVehicleInsurance(vehicleId, data);
        message.success('创建成功');
      }
      setIsInsuranceModalVisible(false);
      loadInsurances();
    } catch (error: any) {
      message.error('操作失败: ' + error.message);
    }
  };

  // 年检管理（类似逻辑）
  const handleCreateInspection = () => {
    setEditingInspection(null);
    inspectionForm.resetFields();
    setIsInspectionModalVisible(true);
  };

  const handleEditInspection = (record: any) => {
    setEditingInspection(record);
    inspectionForm.setFieldsValue({
      ...record,
      inspectionDate: record.inspectionDate ? dayjs(record.inspectionDate) : null,
      expiryDate: record.expiryDate ? dayjs(record.expiryDate) : null,
      nextInspectionDate: record.nextInspectionDate ? dayjs(record.nextInspectionDate) : null,
      mileageAtInspection: record.mileageAtInspection,
    });
    setIsInspectionModalVisible(true);
  };

  const handleDeleteInspection = async (id: string) => {
    try {
      await vehiclesApi.deleteVehicleInspection(id);
      message.success('删除成功');
      loadInspections();
    } catch (error: any) {
      message.error('删除失败: ' + error.message);
    }
  };

  const handleInspectionSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        inspectionDate: values.inspectionDate.format('YYYY-MM-DD'),
        expiryDate: values.expiryDate.format('YYYY-MM-DD'),
        nextInspectionDate: values.nextInspectionDate ? values.nextInspectionDate.format('YYYY-MM-DD') : null,
        mileageAtInspection: values.mileageAtInspection ? parseFloat(values.mileageAtInspection) : null,
      };

      if (editingInspection) {
        await vehiclesApi.updateVehicleInspection(editingInspection.id, data);
        message.success('更新成功');
      } else {
        await vehiclesApi.createVehicleInspection(vehicleId, data);
        message.success('创建成功');
      }
      setIsInspectionModalVisible(false);
      loadInspections();
    } catch (error: any) {
      message.error('操作失败: ' + error.message);
    }
  };

  // 设备管理（类似逻辑）
  const handleCreateDevice = () => {
    setEditingDevice(null);
    deviceForm.resetFields();
    setIsDeviceModalVisible(true);
  };

  const handleEditDevice = (record: any) => {
    setEditingDevice(record);
    deviceForm.setFieldsValue({
      ...record,
      installDate: record.installDate ? dayjs(record.installDate) : null,
      lastMaintenanceDate: record.lastMaintenanceDate ? dayjs(record.lastMaintenanceDate) : null,
      lastSignalTime: record.lastSignalTime ? dayjs(record.lastSignalTime) : null,
    });
    setIsDeviceModalVisible(true);
  };

  const handleDeleteDevice = async (id: string) => {
    try {
      await vehiclesApi.deleteVehicleDevice(id);
      message.success('删除成功');
      loadDevices();
    } catch (error: any) {
      message.error('删除失败: ' + error.message);
    }
  };

  const handleDeviceSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        installDate: values.installDate ? values.installDate.format('YYYY-MM-DD') : null,
        lastMaintenanceDate: values.lastMaintenanceDate ? values.lastMaintenanceDate.format('YYYY-MM-DD') : null,
        lastSignalTime: values.lastSignalTime ? values.lastSignalTime.format('YYYY-MM-DD HH:mm:ss') : null,
        batteryLevel: values.batteryLevel ? parseInt(values.batteryLevel) : null,
      };

      if (editingDevice) {
        await vehiclesApi.updateVehicleDevice(editingDevice.id, data);
        message.success('更新成功');
      } else {
        await vehiclesApi.createVehicleDevice(vehicleId, data);
        message.success('创建成功');
      }
      setIsDeviceModalVisible(false);
      loadDevices();
    } catch (error: any) {
      message.error('操作失败: ' + error.message);
    }
  };

  // 检查是否即将到期
  const isExpiringSoon = (expiryDate: string, daysAhead: number = 30) => {
    const expiry = dayjs(expiryDate);
    const today = dayjs();
    const daysUntilExpiry = expiry.diff(today, 'day');
    return daysUntilExpiry >= 0 && daysUntilExpiry <= daysAhead;
  };

  const getExpiryTag = (expiryDate: string) => {
    if (!expiryDate) return null;
    const expiry = dayjs(expiryDate);
    const today = dayjs();
    const daysUntilExpiry = expiry.diff(today, 'day');
    
    if (daysUntilExpiry < 0) {
      return <Tag color="red">已过期</Tag>;
    } else if (daysUntilExpiry <= 7) {
      return <Tag color="red">即将到期 ({daysUntilExpiry}天)</Tag>;
    } else if (daysUntilExpiry <= 30) {
      return <Tag color="orange">即将到期 ({daysUntilExpiry}天)</Tag>;
    } else {
      return <Tag color="green">正常</Tag>;
    }
  };

  // 证照表格列
  const certificateColumns = [
    {
      title: '证照类型',
      dataIndex: 'certificateType',
      key: 'certificateType',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          'driving_license': '行驶证',
          'operation_permit': '营运证',
          'etc': 'ETC',
          'hazardous_permit': '危化许可',
          'other': '其他',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '证照编号',
      dataIndex: 'certificateNumber',
      key: 'certificateNumber',
    },
    {
      title: '发证日期',
      dataIndex: 'issueDate',
      key: 'issueDate',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '到期日期',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: any) => getExpiryTag(record.expiryDate),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditCertificate(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除吗？"
            onConfirm={() => handleDeleteCertificate(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 保险表格列
  const insuranceColumns = [
    {
      title: '保险类型',
      dataIndex: 'insuranceType',
      key: 'insuranceType',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          'liability': '责任险',
          'comprehensive': '全险',
          'collision': '碰撞险',
          'cargo': '货物险',
          'third_party': '第三方险',
          'other': '其他',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '保险公司',
      dataIndex: 'insuranceCompany',
      key: 'insuranceCompany',
    },
    {
      title: '保单号',
      dataIndex: 'policyNumber',
      key: 'policyNumber',
    },
    {
      title: '保额',
      dataIndex: 'coverageAmount',
      key: 'coverageAmount',
      render: (amount: number) => amount ? `¥${amount.toLocaleString()}` : '-',
    },
    {
      title: '到期日期',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: any) => getExpiryTag(record.expiryDate),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditInsurance(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除吗？"
            onConfirm={() => handleDeleteInsurance(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 年检表格列
  const inspectionColumns = [
    {
      title: '年检类型',
      dataIndex: 'inspectionType',
      key: 'inspectionType',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          'annual': '年度',
          'safety': '安全',
          'emission': '排放',
          'roadworthiness': '道路适应性',
          'other': '其他',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '年检日期',
      dataIndex: 'inspectionDate',
      key: 'inspectionDate',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '到期日期',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      render: (result: string) => {
        const colorMap: Record<string, string> = {
          'passed': 'green',
          'failed': 'red',
          'conditional': 'orange',
        };
        const textMap: Record<string, string> = {
          'passed': '通过',
          'failed': '未通过',
          'conditional': '有条件通过',
        };
        return <Tag color={colorMap[result]}>{textMap[result]}</Tag>;
      },
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: any) => getExpiryTag(record.expiryDate),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditInspection(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除吗？"
            onConfirm={() => handleDeleteInspection(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 设备表格列
  const deviceColumns = [
    {
      title: '设备类型',
      dataIndex: 'deviceType',
      key: 'deviceType',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          'gps': 'GPS',
          'obd': 'OBD',
          'temp_sensor': '温控传感器',
          'tire_pressure': '胎压监测',
          'camera': '摄像头',
          'other': '其他',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '设备序列号',
      dataIndex: 'deviceSerial',
      key: 'deviceSerial',
    },
    {
      title: '设备型号',
      dataIndex: 'deviceModel',
      key: 'deviceModel',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          'active': 'green',
          'inactive': 'default',
          'maintenance': 'orange',
          'replaced': 'red',
        };
        const textMap: Record<string, string> = {
          'active': '正常',
          'inactive': '未激活',
          'maintenance': '维护中',
          'replaced': '已更换',
        };
        return <Tag color={colorMap[status]}>{textMap[status]}</Tag>;
      },
    },
    {
      title: '电池电量',
      dataIndex: 'batteryLevel',
      key: 'batteryLevel',
      render: (level: number) => level !== null && level !== undefined ? `${level}%` : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditDevice(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除吗？"
            onConfirm={() => handleDeleteDevice(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={`车辆详情 - ${vehicle?.plateNumber || vehicleId}`}
        extra={
          <Button onClick={onClose}>关闭</Button>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="证照管理" key="certificates">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text strong>车辆证照列表</Text>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateCertificate}>
                  添加证照
                </Button>
              </div>
              <Table
                columns={certificateColumns}
                dataSource={certificates}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
              />
            </Space>
          </TabPane>

          <TabPane tab="保险管理" key="insurances">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text strong>车辆保险列表</Text>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateInsurance}>
                  添加保险
                </Button>
              </div>
              <Table
                columns={insuranceColumns}
                dataSource={insurances}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
              />
            </Space>
          </TabPane>

          <TabPane tab="年检管理" key="inspections">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text strong>车辆年检记录</Text>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateInspection}>
                  添加年检记录
                </Button>
              </div>
              <Table
                columns={inspectionColumns}
                dataSource={inspections}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
              />
            </Space>
          </TabPane>

          <TabPane tab="设备管理" key="devices">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text strong>车辆设备列表</Text>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateDevice}>
                  添加设备
                </Button>
              </div>
              <Table
                columns={deviceColumns}
                dataSource={devices}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
              />
            </Space>
          </TabPane>
        </Tabs>
      </Card>

      {/* 证照编辑弹窗 */}
      <Modal
        title={editingCertificate ? '编辑证照' : '添加证照'}
        open={isCertificateModalVisible}
        onCancel={() => setIsCertificateModalVisible(false)}
        onOk={() => certificateForm.submit()}
        width={600}
      >
        <Form form={certificateForm} layout="vertical" onFinish={handleCertificateSubmit}>
          <Form.Item name="certificateType" label="证照类型" rules={[{ required: true }]}>
            <Select>
              <Option value="driving_license">行驶证</Option>
              <Option value="operation_permit">营运证</Option>
              <Option value="etc">ETC</Option>
              <Option value="hazardous_permit">危化许可</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="certificateNumber" label="证照编号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="issueDate" label="发证日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="expiryDate" label="到期日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="issuingAuthority" label="发证机关">
            <Input />
          </Form.Item>
          <Form.Item name="uploadedFile" label="证照文件">
            <Upload
              beforeUpload={(file) => {
                // 限制文件大小和类型
                const isImage = file.type.startsWith('image/');
                const isPDF = file.type === 'application/pdf';
                if (!isImage && !isPDF) {
                  message.error('只能上传图片或PDF文件！');
                  return false;
                }
                const isLt10M = file.size / 1024 / 1024 < 10;
                if (!isLt10M) {
                  message.error('文件大小不能超过10MB！');
                  return false;
                }
                // 将文件保存到表单字段，在提交时上传
                certificateForm.setFieldsValue({ uploadedFile: file });
                return false; // 阻止自动上传
              }}
              accept="image/*,.pdf"
              maxCount={1}
              onRemove={() => {
                certificateForm.setFieldsValue({ uploadedFile: undefined });
              }}
            >
              <Button icon={<UploadOutlined />}>上传证照文件</Button>
            </Upload>
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              支持图片（JPG、PNG）或PDF文件，最大10MB。文件将在保存证照时上传。
            </Text>
            {editingCertificate?.file_path && (
              <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                当前文件：{editingCertificate.file_path}
              </Text>
            )}
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 保险编辑弹窗 */}
      <Modal
        title={editingInsurance ? '编辑保险' : '添加保险'}
        open={isInsuranceModalVisible}
        onCancel={() => setIsInsuranceModalVisible(false)}
        onOk={() => insuranceForm.submit()}
        width={600}
      >
        <Form form={insuranceForm} layout="vertical" onFinish={handleInsuranceSubmit}>
          <Form.Item name="insuranceType" label="保险类型" rules={[{ required: true }]}>
            <Select>
              <Option value="liability">责任险</Option>
              <Option value="comprehensive">全险</Option>
              <Option value="collision">碰撞险</Option>
              <Option value="cargo">货物险</Option>
              <Option value="third_party">第三方险</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="insuranceCompany" label="保险公司" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="policyNumber" label="保单号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="coverageAmount" label="保额">
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="premiumAmount" label="保费">
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="startDate" label="开始日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="expiryDate" label="到期日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 年检编辑弹窗 */}
      <Modal
        title={editingInspection ? '编辑年检记录' : '添加年检记录'}
        open={isInspectionModalVisible}
        onCancel={() => setIsInspectionModalVisible(false)}
        onOk={() => inspectionForm.submit()}
        width={600}
      >
        <Form form={inspectionForm} layout="vertical" onFinish={handleInspectionSubmit}>
          <Form.Item name="inspectionType" label="年检类型" rules={[{ required: true }]}>
            <Select>
              <Option value="annual">年度</Option>
              <Option value="safety">安全</Option>
              <Option value="emission">排放</Option>
              <Option value="roadworthiness">道路适应性</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="inspectionDate" label="年检日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="expiryDate" label="到期日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="result" label="结果" rules={[{ required: true }]}>
            <Select>
              <Option value="passed">通过</Option>
              <Option value="failed">未通过</Option>
              <Option value="conditional">有条件通过</Option>
            </Select>
          </Form.Item>
          <Form.Item name="mileageAtInspection" label="年检时里程(km)">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="nextInspectionDate" label="下次年检日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 设备编辑弹窗 */}
      <Modal
        title={editingDevice ? '编辑设备' : '添加设备'}
        open={isDeviceModalVisible}
        onCancel={() => setIsDeviceModalVisible(false)}
        onOk={() => deviceForm.submit()}
        width={600}
      >
        <Form form={deviceForm} layout="vertical" onFinish={handleDeviceSubmit}>
          <Form.Item name="deviceType" label="设备类型" rules={[{ required: true }]}>
            <Select>
              <Option value="gps">GPS</Option>
              <Option value="obd">OBD</Option>
              <Option value="temp_sensor">温控传感器</Option>
              <Option value="tire_pressure">胎压监测</Option>
              <Option value="camera">摄像头</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="deviceSerial" label="设备序列号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="deviceModel" label="设备型号">
            <Input />
          </Form.Item>
          <Form.Item name="manufacturer" label="制造商">
            <Input />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select>
              <Option value="active">正常</Option>
              <Option value="inactive">未激活</Option>
              <Option value="maintenance">维护中</Option>
              <Option value="replaced">已更换</Option>
            </Select>
          </Form.Item>
          <Form.Item name="batteryLevel" label="电池电量(%)">
            <Input type="number" min={0} max={100} />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VehicleDetails;

