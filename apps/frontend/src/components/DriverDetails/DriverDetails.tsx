// 司机详情组件 - 扩展版（含资质、违章、培训、排班、班组管理）
// 创建时间: 2025-11-29T11:25:04Z
// 第一阶段：核心主数据完善 - 1.2 司机档案完善

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
  TimePicker,
  InputNumber,
  message,
  Tag,
  Space,
  Row,
  Col,
  Typography,
  Popconfirm,
  Calendar,
  Badge,
  Upload,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { driversApi, fileApi } from '../../services/api';
import dayjs, { Dayjs } from 'dayjs';

const { TabPane } = Tabs;
const { Text } = Typography;
const { Option } = Select;

interface DriverDetailsProps {
  driverId: string;
  driver?: {
    id: string;
    name: string;
    phone: string;
    status: string;
  };
  onClose?: () => void;
}

const DriverDetails: React.FC<DriverDetailsProps> = ({ driverId, driver, onClose }) => {
  const [activeTab, setActiveTab] = useState('certificates');
  const [loading, setLoading] = useState(false);
  
  // 证照数据
  const [certificates, setCertificates] = useState<any[]>([]);
  const [isCertificateModalVisible, setIsCertificateModalVisible] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<any>(null);
  const [certificateForm] = Form.useForm();

  // 违章数据
  const [violations, setViolations] = useState<any[]>([]);
  const [isViolationModalVisible, setIsViolationModalVisible] = useState(false);
  const [editingViolation, setEditingViolation] = useState<any>(null);
  const [violationForm] = Form.useForm();
  const [totalPoints, setTotalPoints] = useState(0);

  // 体检数据
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  const [isMedicalModalVisible, setIsMedicalModalVisible] = useState(false);
  const [editingMedical, setEditingMedical] = useState<any>(null);
  const [medicalForm] = Form.useForm();

  // 培训数据
  const [trainingRecords, setTrainingRecords] = useState<any[]>([]);
  const [isTrainingModalVisible, setIsTrainingModalVisible] = useState(false);
  const [editingTraining, setEditingTraining] = useState<any>(null);
  const [trainingForm] = Form.useForm();

  // 排班数据
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [scheduleForm] = Form.useForm();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

  // 班组数据
  const [groups, setGroups] = useState<any[]>([]);
  const [currentGroup, setCurrentGroup] = useState<any>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);

  useEffect(() => {
    if (driverId) {
      loadAllData();
    }
  }, [driverId, activeTab]);

  const loadAllData = async () => {
    if (!driverId) return;
    
    setLoading(true);
    try {
      switch (activeTab) {
        case 'certificates':
          await loadCertificates();
          break;
        case 'violations':
          await loadViolations();
          break;
        case 'medical':
          await loadMedicalRecords();
          break;
        case 'training':
          await loadTrainingRecords();
          break;
        case 'schedules':
          await loadSchedules();
          break;
        case 'groups':
          await loadGroups();
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
      const response = await driversApi.getDriverCertificates(driverId);
      setCertificates(response.data?.data || []);
    } catch (error: any) {
      message.error('加载证照失败: ' + error.message);
    }
  };

  const loadViolations = async () => {
    try {
      const [violationsRes, pointsRes] = await Promise.all([
        driversApi.getDriverViolations(driverId),
        driversApi.getDriverTotalPoints(driverId),
      ]);
      setViolations(violationsRes.data?.data || []);
      setTotalPoints(pointsRes.data?.data?.totalPoints || 0);
    } catch (error: any) {
      message.error('加载违章失败: ' + error.message);
    }
  };

  const loadMedicalRecords = async () => {
    try {
      const response = await driversApi.getDriverMedicalRecords(driverId);
      setMedicalRecords(response.data?.data || []);
    } catch (error: any) {
      message.error('加载体检记录失败: ' + error.message);
    }
  };

  const loadTrainingRecords = async () => {
    try {
      const response = await driversApi.getDriverTrainingRecords(driverId);
      setTrainingRecords(response.data?.data || []);
    } catch (error: any) {
      message.error('加载培训记录失败: ' + error.message);
    }
  };

  const loadSchedules = async () => {
    try {
      const startDate = selectedDate.startOf('month').format('YYYY-MM-DD');
      const endDate = selectedDate.endOf('month').format('YYYY-MM-DD');
      const response = await driversApi.getDriverSchedules(driverId, { startDate, endDate });
      setSchedules(response.data?.data || []);
    } catch (error: any) {
      message.error('加载排班失败: ' + error.message);
    }
  };

  const loadGroups = async () => {
    try {
      const response = await driversApi.getDriverGroups();
      setGroups(response.data?.data || []);
    } catch (error: any) {
      message.error('加载班组失败: ' + error.message);
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
      await driversApi.deleteDriverCertificate(id);
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
          const uploadResponse = await fileApi.uploadFile(values.uploadedFile, 'driver_certificate');
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
        await driversApi.updateDriverCertificate(editingCertificate.id, data);
        message.success('更新成功');
      } else {
        await driversApi.createDriverCertificate(driverId, data);
        message.success('创建成功');
      }
      setIsCertificateModalVisible(false);
      certificateForm.resetFields();
      loadCertificates();
    } catch (error: any) {
      message.error('操作失败: ' + error.message);
    }
  };

  // 违章管理
  const handleCreateViolation = () => {
    setEditingViolation(null);
    violationForm.resetFields();
    setIsViolationModalVisible(true);
  };

  const handleEditViolation = (record: any) => {
    setEditingViolation(record);
    violationForm.setFieldsValue({
      ...record,
      violationDate: record.violationDate ? dayjs(record.violationDate) : null,
      fineAmount: record.fineAmount,
      pointsDeducted: record.pointsDeducted,
    });
    setIsViolationModalVisible(true);
  };

  const handleDeleteViolation = async (id: string) => {
    try {
      await driversApi.deleteDriverViolation(id);
      message.success('删除成功');
      loadViolations();
    } catch (error: any) {
      message.error('删除失败: ' + error.message);
    }
  };

  const handleViolationSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        violationDate: values.violationDate.format('YYYY-MM-DD'),
        fineAmount: values.fineAmount ? parseFloat(values.fineAmount) : null,
        pointsDeducted: values.pointsDeducted || 0,
      };

      if (editingViolation) {
        await driversApi.updateDriverViolation(editingViolation.id, data);
        message.success('更新成功');
      } else {
        await driversApi.createDriverViolation(driverId, data);
        message.success('创建成功');
      }
      setIsViolationModalVisible(false);
      loadViolations();
    } catch (error: any) {
      message.error('操作失败: ' + error.message);
    }
  };

  // 体检管理
  const handleCreateMedical = () => {
    setEditingMedical(null);
    medicalForm.resetFields();
    setIsMedicalModalVisible(true);
  };

  const handleEditMedical = (record: any) => {
    setEditingMedical(record);
    medicalForm.setFieldsValue({
      ...record,
      examinationDate: record.examinationDate ? dayjs(record.examinationDate) : null,
      expiryDate: record.expiryDate ? dayjs(record.expiryDate) : null,
    });
    setIsMedicalModalVisible(true);
  };

  const handleDeleteMedical = async (id: string) => {
    try {
      await driversApi.deleteDriverMedicalRecord(id);
      message.success('删除成功');
      loadMedicalRecords();
    } catch (error: any) {
      message.error('删除失败: ' + error.message);
    }
  };

  const handleMedicalSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        examinationDate: values.examinationDate.format('YYYY-MM-DD'),
        expiryDate: values.expiryDate ? values.expiryDate.format('YYYY-MM-DD') : null,
      };

      if (editingMedical) {
        await driversApi.updateDriverMedicalRecord(editingMedical.id, data);
        message.success('更新成功');
      } else {
        await driversApi.createDriverMedicalRecord(driverId, data);
        message.success('创建成功');
      }
      setIsMedicalModalVisible(false);
      loadMedicalRecords();
    } catch (error: any) {
      message.error('操作失败: ' + error.message);
    }
  };

  // 培训管理
  const handleCreateTraining = () => {
    setEditingTraining(null);
    trainingForm.resetFields();
    setIsTrainingModalVisible(true);
  };

  const handleEditTraining = (record: any) => {
    setEditingTraining(record);
    trainingForm.setFieldsValue({
      ...record,
      trainingDate: record.trainingDate ? dayjs(record.trainingDate) : null,
      expiryDate: record.expiryDate ? dayjs(record.expiryDate) : null,
      durationHours: record.durationHours,
      score: record.score,
    });
    setIsTrainingModalVisible(true);
  };

  const handleDeleteTraining = async (id: string) => {
    try {
      await driversApi.deleteDriverTrainingRecord(id);
      message.success('删除成功');
      loadTrainingRecords();
    } catch (error: any) {
      message.error('删除失败: ' + error.message);
    }
  };

  const handleTrainingSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        trainingDate: values.trainingDate.format('YYYY-MM-DD'),
        expiryDate: values.expiryDate ? values.expiryDate.format('YYYY-MM-DD') : null,
        durationHours: values.durationHours ? parseFloat(values.durationHours) : null,
        score: values.score ? parseFloat(values.score) : null,
      };

      if (editingTraining) {
        await driversApi.updateDriverTrainingRecord(editingTraining.id, data);
        message.success('更新成功');
      } else {
        await driversApi.createDriverTrainingRecord(driverId, data);
        message.success('创建成功');
      }
      setIsTrainingModalVisible(false);
      loadTrainingRecords();
    } catch (error: any) {
      message.error('操作失败: ' + error.message);
    }
  };

  // 排班管理
  const handleCreateSchedule = () => {
    setEditingSchedule(null);
    scheduleForm.resetFields();
    scheduleForm.setFieldsValue({
      scheduleDate: selectedDate,
      shiftType: 'day',
      startTime: dayjs('08:00', 'HH:mm'),
      endTime: dayjs('17:00', 'HH:mm'),
    });
    setIsScheduleModalVisible(true);
  };

  const handleEditSchedule = (record: any) => {
    setEditingSchedule(record);
    scheduleForm.setFieldsValue({
      ...record,
      scheduleDate: dayjs(record.scheduleDate),
      startTime: dayjs(record.startTime, 'HH:mm:ss'),
      endTime: dayjs(record.endTime, 'HH:mm:ss'),
      plannedHours: record.plannedHours,
      actualHours: record.actualHours,
    });
    setIsScheduleModalVisible(true);
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      await driversApi.deleteDriverSchedule(id);
      message.success('删除成功');
      loadSchedules();
    } catch (error: any) {
      message.error('删除失败: ' + error.message);
    }
  };

  const handleScheduleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        scheduleDate: values.scheduleDate.format('YYYY-MM-DD'),
        startTime: values.startTime.format('HH:mm:ss'),
        endTime: values.endTime.format('HH:mm:ss'),
        plannedHours: values.plannedHours ? parseFloat(values.plannedHours) : null,
        actualHours: values.actualHours ? parseFloat(values.actualHours) : null,
      };

      if (editingSchedule) {
        await driversApi.updateDriverSchedule(editingSchedule.id, data);
        message.success('更新成功');
      } else {
        await driversApi.createDriverSchedule(driverId, data);
        message.success('创建成功');
      }
      setIsScheduleModalVisible(false);
      loadSchedules();
    } catch (error: any) {
      message.error('操作失败: ' + error.message);
    }
  };

  // 获取到期标签
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
          'driving_license': '驾照',
          'professional_qualification': '从业资格',
          'hazardous_license': '危化驾照',
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
      title: '驾照等级',
      dataIndex: 'licenseClass',
      key: 'licenseClass',
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

  // 违章表格列
  const violationColumns = [
    {
      title: '违章类型',
      dataIndex: 'violationType',
      key: 'violationType',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          'speeding': '超速',
          'overload': '超载',
          'red_light': '闯红灯',
          'parking': '违停',
          'license': '证照',
          'other': '其他',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '违章日期',
      dataIndex: 'violationDate',
      key: 'violationDate',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '罚款金额',
      dataIndex: 'fineAmount',
      key: 'fineAmount',
      render: (amount: number) => amount ? `¥${amount.toLocaleString()}` : '-',
    },
    {
      title: '扣分',
      dataIndex: 'pointsDeducted',
      key: 'pointsDeducted',
      render: (points: number) => <Tag color="red">{points}分</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          'pending': 'orange',
          'paid': 'green',
          'appealed': 'blue',
          'dismissed': 'default',
        };
        const textMap: Record<string, string> = {
          'pending': '待处理',
          'paid': '已缴纳',
          'appealed': '申诉中',
          'dismissed': '已撤销',
        };
        return <Tag color={colorMap[status]}>{textMap[status]}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditViolation(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除吗？"
            onConfirm={() => handleDeleteViolation(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 体检表格列
  const medicalColumns = [
    {
      title: '体检类型',
      dataIndex: 'examinationType',
      key: 'examinationType',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          'annual': '年度',
          'pre_employment': '入职',
          'periodic': '定期',
          'special': '特殊',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '体检日期',
      dataIndex: 'examinationDate',
      key: 'examinationDate',
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
      title: '有效期至',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: any) => record.expiryDate ? getExpiryTag(record.expiryDate) : null,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditMedical(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除吗？"
            onConfirm={() => handleDeleteMedical(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 培训表格列
  const trainingColumns = [
    {
      title: '培训类型',
      dataIndex: 'trainingType',
      key: 'trainingType',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          'safety': '安全',
          'regulation': '法规',
          'skill': '技能',
          'certification': '认证',
          'other': '其他',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '培训日期',
      dataIndex: 'trainingDate',
      key: 'trainingDate',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '时长(小时)',
      dataIndex: 'durationHours',
      key: 'durationHours',
    },
    {
      title: '成绩',
      dataIndex: 'score',
      key: 'score',
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      render: (result: string) => {
        const colorMap: Record<string, string> = {
          'passed': 'green',
          'failed': 'red',
          'incomplete': 'orange',
        };
        const textMap: Record<string, string> = {
          'passed': '通过',
          'failed': '未通过',
          'incomplete': '未完成',
        };
        return <Tag color={colorMap[result]}>{textMap[result]}</Tag>;
      },
    },
    {
      title: '证书有效期',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: any) => record.expiryDate ? getExpiryTag(record.expiryDate) : null,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditTraining(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除吗？"
            onConfirm={() => handleDeleteTraining(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 排班表格列
  const scheduleColumns = [
    {
      title: '日期',
      dataIndex: 'scheduleDate',
      key: 'scheduleDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '班次类型',
      dataIndex: 'shiftType',
      key: 'shiftType',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          'day': '白班',
          'night': '夜班',
          'overtime': '加班',
          'on_call': '待命',
          'off': '休息',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '工作时间',
      key: 'workTime',
      render: (_: any, record: any) => `${record.startTime} - ${record.endTime}`,
    },
    {
      title: '计划工时',
      dataIndex: 'plannedHours',
      key: 'plannedHours',
      render: (hours: number) => hours ? `${hours}小时` : '-',
    },
    {
      title: '实际工时',
      dataIndex: 'actualHours',
      key: 'actualHours',
      render: (hours: number) => hours ? `${hours}小时` : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
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
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditSchedule(record)}>
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
    },
  ];

  // 获取日历日期数据
  const getScheduleDateData = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    const daySchedules = schedules.filter(s => s.scheduleDate === dateStr);
    return daySchedules.map(s => ({
      type: s.shiftType === 'off' ? 'default' : 'success',
      content: s.shiftType,
    }));
  };

  return (
    <div>
      <Card
        title={`司机详情 - ${driver?.name || driverId}`}
        extra={
          <Space>
            {activeTab === 'violations' && (
              <Badge count={totalPoints} showZero>
                <Tag color="red">总扣分: {totalPoints}分</Tag>
              </Badge>
            )}
            <Button onClick={onClose}>关闭</Button>
          </Space>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="资质证照" key="certificates">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text strong>司机证照列表</Text>
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

          <TabPane tab="违章记录" key="violations">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text strong>违章记录列表</Text>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateViolation}>
                  添加违章记录
                </Button>
              </div>
              <Table
                columns={violationColumns}
                dataSource={violations}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
              />
            </Space>
          </TabPane>

          <TabPane tab="体检记录" key="medical">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text strong>体检记录列表</Text>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateMedical}>
                  添加体检记录
                </Button>
              </div>
              <Table
                columns={medicalColumns}
                dataSource={medicalRecords}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
              />
            </Space>
          </TabPane>

          <TabPane tab="培训记录" key="training">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text strong>培训记录列表</Text>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateTraining}>
                  添加培训记录
                </Button>
              </div>
              <Table
                columns={trainingColumns}
                dataSource={trainingRecords}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
              />
            </Space>
          </TabPane>

          <TabPane tab="排班管理" key="schedules">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text strong>排班管理</Text>
                <Space>
                  <DatePicker
                    picker="month"
                    value={selectedDate}
                    onChange={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        loadSchedules();
                      }
                    }}
                  />
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateSchedule}>
                    添加排班
                  </Button>
                </Space>
              </div>
              <Row gutter={16}>
                <Col span={12}>
                  <Calendar
                    value={selectedDate}
                    onChange={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        loadSchedules();
                      }
                    }}
                    dateCellRender={(value) => {
                      const dateStr = value.format('YYYY-MM-DD');
                      const daySchedules = schedules.filter(s => s.scheduleDate === dateStr);
                      return (
                        <div>
                          {daySchedules.map((s, idx) => (
                            <Tag key={idx} color={s.shiftType === 'off' ? 'default' : 'blue'} style={{ fontSize: '10px', margin: '2px' }}>
                              {s.shiftType === 'day' ? '白' : s.shiftType === 'night' ? '夜' : s.shiftType === 'off' ? '休' : s.shiftType}
                            </Tag>
                          ))}
                        </div>
                      );
                    }}
                  />
                </Col>
                <Col span={12}>
                  <Table
                    columns={scheduleColumns}
                    dataSource={schedules}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                  />
                </Col>
              </Row>
            </Space>
          </TabPane>

          <TabPane tab="班组管理" key="groups">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text strong>所属班组</Text>
              </div>
              <Table
                columns={[
                  { title: '班组名称', dataIndex: 'name', key: 'name' },
                  { title: '班组代码', dataIndex: 'code', key: 'code' },
                  { title: '类型', dataIndex: 'groupType', key: 'groupType' },
                  { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={status === 'active' ? 'green' : 'default'}>{status === 'active' ? '活跃' : '非活跃'}</Tag> },
                ]}
                dataSource={groups}
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
              <Option value="driving_license">驾照</Option>
              <Option value="professional_qualification">从业资格</Option>
              <Option value="hazardous_license">危化驾照</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="certificateNumber" label="证照编号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="licenseClass" label="驾照等级">
            <Input placeholder="如：A1, A2, B1, B2, C1, C2" />
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
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 违章编辑弹窗 */}
      <Modal
        title={editingViolation ? '编辑违章记录' : '添加违章记录'}
        open={isViolationModalVisible}
        onCancel={() => setIsViolationModalVisible(false)}
        onOk={() => violationForm.submit()}
        width={600}
      >
        <Form form={violationForm} layout="vertical" onFinish={handleViolationSubmit}>
          <Form.Item name="violationType" label="违章类型" rules={[{ required: true }]}>
            <Select>
              <Option value="speeding">超速</Option>
              <Option value="overload">超载</Option>
              <Option value="red_light">闯红灯</Option>
              <Option value="parking">违停</Option>
              <Option value="license">证照</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="violationDate" label="违章日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="location" label="地点">
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fineAmount" label="罚款金额">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="pointsDeducted" label="扣分" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} max={12} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select>
              <Option value="pending">待处理</Option>
              <Option value="paid">已缴纳</Option>
              <Option value="appealed">申诉中</Option>
              <Option value="dismissed">已撤销</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 体检编辑弹窗 */}
      <Modal
        title={editingMedical ? '编辑体检记录' : '添加体检记录'}
        open={isMedicalModalVisible}
        onCancel={() => setIsMedicalModalVisible(false)}
        onOk={() => medicalForm.submit()}
        width={600}
      >
        <Form form={medicalForm} layout="vertical" onFinish={handleMedicalSubmit}>
          <Form.Item name="examinationType" label="体检类型" rules={[{ required: true }]}>
            <Select>
              <Option value="annual">年度</Option>
              <Option value="pre_employment">入职</Option>
              <Option value="periodic">定期</Option>
              <Option value="special">特殊</Option>
            </Select>
          </Form.Item>
          <Form.Item name="examinationDate" label="体检日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="result" label="结果" rules={[{ required: true }]}>
            <Select>
              <Option value="passed">通过</Option>
              <Option value="failed">未通过</Option>
              <Option value="conditional">有条件通过</Option>
            </Select>
          </Form.Item>
          <Form.Item name="expiryDate" label="有效期至">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="medicalInstitution" label="体检机构">
            <Input />
          </Form.Item>
          <Form.Item name="doctorName" label="医生姓名">
            <Input />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 培训编辑弹窗 */}
      <Modal
        title={editingTraining ? '编辑培训记录' : '添加培训记录'}
        open={isTrainingModalVisible}
        onCancel={() => setIsTrainingModalVisible(false)}
        onOk={() => trainingForm.submit()}
        width={600}
      >
        <Form form={trainingForm} layout="vertical" onFinish={handleTrainingSubmit}>
          <Form.Item name="trainingType" label="培训类型" rules={[{ required: true }]}>
            <Select>
              <Option value="safety">安全</Option>
              <Option value="regulation">法规</Option>
              <Option value="skill">技能</Option>
              <Option value="certification">认证</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="trainingDate" label="培训日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="trainingProvider" label="培训机构">
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="durationHours" label="培训时长(小时)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="score" label="成绩">
                <InputNumber style={{ width: '100%' }} min={0} max={100} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="result" label="结果" rules={[{ required: true }]}>
            <Select>
              <Option value="passed">通过</Option>
              <Option value="failed">未通过</Option>
              <Option value="incomplete">未完成</Option>
            </Select>
          </Form.Item>
          <Form.Item name="certificateNumber" label="证书编号">
            <Input />
          </Form.Item>
          <Form.Item name="expiryDate" label="证书有效期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 排班编辑弹窗 */}
      <Modal
        title={editingSchedule ? '编辑排班' : '添加排班'}
        open={isScheduleModalVisible}
        onCancel={() => setIsScheduleModalVisible(false)}
        onOk={() => scheduleForm.submit()}
        width={600}
      >
        <Form form={scheduleForm} layout="vertical" onFinish={handleScheduleSubmit}>
          <Form.Item name="scheduleDate" label="排班日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="shiftType" label="班次类型" rules={[{ required: true }]}>
            <Select>
              <Option value="day">白班</Option>
              <Option value="night">夜班</Option>
              <Option value="overtime">加班</Option>
              <Option value="on_call">待命</Option>
              <Option value="off">休息</Option>
            </Select>
          </Form.Item>
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
              <Form.Item name="actualHours" label="实际工时(小时)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
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
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DriverDetails;

