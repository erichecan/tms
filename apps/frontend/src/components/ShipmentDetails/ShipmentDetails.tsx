// 运单详情组件 - 符合PRD v3.0-PC设计
// 创建时间: 2025-01-27 15:30:00

import React, { useRef, useState, useEffect } from 'react'; // 2025-10-02 15:32:10 引入 useRef/useEffect 支持签名画布
import { 
  Button, 
  Card, 
  Row, 
  Col, 
  Typography, 
  Tag, 
  Divider, 
  Space, 
  Tabs, 
  Table, 
  Upload, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Timeline,
  Badge,
  message,
  List,
  Avatar
} from 'antd';
import { 
  PrinterOutlined, 
  DownloadOutlined, 
  TeamOutlined, 
  TruckOutlined, 
  PlusOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { 
  Shipment, 
  ShipmentStatus, 
  Driver, 
  Vehicle, 
  Trip, 
  TimelineEvent,
  POD 
} from '../../types/index';
import { formatCurrency } from '../../utils/formatCurrency';
import jsPDF from 'jspdf'; // 2025-10-02 11:15:00 引入 jsPDF 以生成PDF
import html2canvas from 'html2canvas'; // 2025-10-02 11:15:00 将DOM渲染为图片嵌入PDF
import { generateBOLHtml } from '../../templates/BOLTemplate'; // 2025-10-02 11:20:30 引入BOL模板
import { driversApi, vehiclesApi } from '../../services/api'; // 2025-10-02 11:05:20 引入创建司机/车辆API

const { Title, Text } = Typography;

interface ShipmentDetailsProps {
  shipment: Shipment;
  onPrint?: () => void;
  onDownloadPDF?: () => void;
  onStatusUpdate?: (status: ShipmentStatus) => void;
  onAssignDriver?: (driverId: string, vehicleId: string) => void;
  onMountTrip?: (tripId: string) => void;
}

const ShipmentDetails: React.FC<ShipmentDetailsProps> = ({ 
  shipment, 
  onPrint,
  onDownloadPDF,
  onStatusUpdate,
  onAssignDriver,
  onMountTrip
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [isMountModalVisible, setIsMountModalVisible] = useState(false);
  const [isESignVisible, setIsESignVisible] = useState(false); // 2025-10-02 15:32:10 电子签弹窗
  const canvasRef = useRef<HTMLCanvasElement | null>(null); // 2025-10-02 15:32:10 签名画布引用
  const [isDrawing, setIsDrawing] = useState(false); // 2025-10-02 15:32:10 绘制状态
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null); // 2025-10-02 15:32:10 签名图片
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [availableTrips, setAvailableTrips] = useState<Trip[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [pods, setPods] = useState<POD[]>([]);
  const [form] = Form.useForm();
  const [addDriverForm] = Form.useForm(); // 2025-10-02 11:05:20 快速添加司机表单
  const [addVehicleForm] = Form.useForm(); // 2025-10-02 11:05:20 快速添加车辆表单
  const [isQuickAddDriverVisible, setIsQuickAddDriverVisible] = useState(false); // 2025-10-02 11:05:20
  const [isQuickAddVehicleVisible, setIsQuickAddVehicleVisible] = useState(false); // 2025-10-02 11:05:20
  const getStatusTag = (status: ShipmentStatus) => {
    const statusMap: Record<ShipmentStatus, { color: string; text: string }> = {
      [ShipmentStatus.CREATED]: { color: 'blue', text: '已创建' },
      [ShipmentStatus.ASSIGNED]: { color: 'purple', text: '已分配' },
      [ShipmentStatus.PICKED_UP]: { color: 'geekblue', text: '已取货' },
      [ShipmentStatus.IN_TRANSIT]: { color: 'cyan', text: '运输中' },
      [ShipmentStatus.DELIVERED]: { color: 'green', text: '已送达' },
      [ShipmentStatus.COMPLETED]: { color: 'success', text: '已完成' },
      [ShipmentStatus.CANCELED]: { color: 'red', text: '已取消' },
      [ShipmentStatus.EXCEPTION]: { color: 'red', text: '异常' },
    };
    return statusMap[status] || { color: 'default', text: '未知' };
  };

  const getNextStatus = (currentStatus: ShipmentStatus): ShipmentStatus | null => {
    const statusFlow: Record<ShipmentStatus, ShipmentStatus | null> = {
      [ShipmentStatus.CREATED]: ShipmentStatus.ASSIGNED,
      [ShipmentStatus.ASSIGNED]: ShipmentStatus.PICKED_UP,
      [ShipmentStatus.PICKED_UP]: ShipmentStatus.IN_TRANSIT,
      [ShipmentStatus.IN_TRANSIT]: ShipmentStatus.DELIVERED,
      [ShipmentStatus.DELIVERED]: ShipmentStatus.COMPLETED,
      [ShipmentStatus.COMPLETED]: null,
      [ShipmentStatus.CANCELED]: null,
      [ShipmentStatus.EXCEPTION]: null,
    };
    return statusFlow[currentStatus] || null;
  };

  const handleStatusUpdate = (newStatus: ShipmentStatus) => {
    if (onStatusUpdate) {
      onStatusUpdate(newStatus);
    }
  };

  const handleAssignDriver = () => {
    setIsAssignModalVisible(true);
    // TODO: 加载可用司机和车辆
  };

  const handleMountTrip = () => {
    setIsMountModalVisible(true);
    // TODO: 加载可用行程
  };

  const handlePODUpload = async (file: any) => {
    try {
      // 2025-10-02 16:25:00 实现真正的POD上传逻辑，支持手机拍照
      const formData = new FormData();
      formData.append('file', file);
      
      // 调用后端POD上传接口
      const response = await fetch(`${process.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/shipments/${shipment.id}/pod`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-ID': localStorage.getItem('tenantId') || '',
        },
        body: formData,
      });
      
      const result = await response.json();
      if (result.success) {
        message.success('POD上传成功');
        // 刷新POD列表
        setPods([...pods, result.data]);
      } else {
        message.error(result.error?.message || 'POD上传失败');
      }
    } catch (error) {
      console.error('POD upload error:', error);
      message.error('POD上传失败，请检查网络连接');
    }
    return false; // 阻止默认上传行为
  };

  const getDriverName = (driverId: string) => {
    const driver = availableDrivers.find(d => d.id === driverId);
    return driver ? driver.name : '未知司机';
  };

  const getVehiclePlate = (vehicleId: string) => {
    const vehicle = availableVehicles.find(v => v.id === vehicleId);
    return vehicle ? vehicle.plateNumber : '未知车辆';
  };

  const handlePrint = () => {
    // 创建打印样式
    const printStyles = `
      <style>
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          #bol-print-root { width: 190mm; }
          /* 强制一页 A4 打印 */
          @page { size: A4 portrait; margin: 10mm; }
        }
      </style>
    `;

    const bolHtml = generateBOLHtml(shipment, { includeSignatures: !!signatureDataUrl, shipperSignature: signatureDataUrl || null });
    const printContent = `${printStyles}<div id="bol-print-root">${bolHtml}</div>`;

    // 打开新窗口打印
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  // 2025-10-02 11:15:00 将详情区域转成 PDF，可对接外部模板
  const handleDownloadPDF = async () => {
    try {
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-10000px';
      container.style.top = '0';
      container.style.width = '820px';
      container.style.padding = '12px';
      container.innerHTML = `<div id="pdf-root">${generateBOLHtml(shipment, { includeSignatures: !!signatureDataUrl, shipperSignature: signatureDataUrl || null })}</div>`;
      document.body.appendChild(container);

      const pdfEl = container.querySelector('#pdf-root') as HTMLElement;
      const canvas = await html2canvas(pdfEl, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 48; // margins
      const imgHeight = canvas.height * (imgWidth / canvas.width);
      const y = 24;
      pdf.addImage(imgData, 'PNG', 24, y, imgWidth, Math.min(imgHeight, pageHeight - 48));
      pdf.save(`${shipment.shipmentNumber || shipment.id}.pdf`);

      document.body.removeChild(container);
      message.success('PDF 已下载');
    } catch (e) {
      console.error('PDF 生成失败', e);
      message.error('PDF 生成失败');
    }
  };

  // 2025-10-02 15:32:10 电子签：画布事件处理
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
  }, [isESignVisible]);

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    const m = e as MouseEvent;
    return { x: m.clientX - rect.left, y: m.clientY - rect.top };
  };

  const handleStart = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const { x, y } = getPos(e.nativeEvent, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleMove = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e.nativeEvent, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleEnd = () => {
    setIsDrawing(false);
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl(null);
  };

  const handleSaveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSignatureDataUrl(dataUrl);
    message.success('电子签名已保存');
    setIsESignVisible(false);
  };

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <div>
          {/* 运单基本信息 */}
          <Card title="运单信息" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>运单号：</Text>
                <Text code>{shipment.shipmentNo}</Text>
              </Col>
              <Col span={12}>
                <Text strong>状态：</Text>
                <Tag color={getStatusTag(shipment.status).color}>
                  {getStatusTag(shipment.status).text}
                </Tag>
              </Col>
            </Row>
            <Divider />
            
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>重量：</Text>
                <Text>{shipment.weightKg} kg</Text>
              </Col>
              <Col span={12}>
                <Text strong>尺寸：</Text>
                <Text>{shipment.lengthCm}×{shipment.widthCm}×{shipment.heightCm} cm</Text>
              </Col>
            </Row>
            <Divider />
            
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>预估费用：</Text>
                <Text>{formatCurrency(shipment.estimatedCost)}</Text>
              </Col>
              <Col span={12}>
                <Text strong>最终费用：</Text>
                <Text>{formatCurrency(shipment.finalCost)}</Text>
              </Col>
            </Row>
          </Card>

          {/* 地址信息 */}
          <Card title="地址信息" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Title level={5}>发货地址</Title>
                {(() => {
                  const anyS: any = shipment as any; // 2025-10-02 11:00:20 兼容不同数据结构
                  const addr = anyS.shipperAddress || anyS.shipper?.address;
                  if (!addr) {
                    return <Text type="secondary">暂无发货地址</Text>;
                  }
                  return (
                    <div>
                      <Text>{addr.country || ''} {addr.province || addr.state || ''} {addr.city || ''}</Text><br />
                      <Text>{addr.addressLine1 || addr.street || ''}</Text><br />
                      {addr.postalCode && <Text>邮编: {addr.postalCode}</Text>}
                      {addr.isResidential && <Tag color="blue">住宅</Tag>}
                    </div>
                  );
                })()}
              </Col>
              <Col span={12}>
                <Title level={5}>收货地址</Title>
                {(() => {
                  const anyS: any = shipment as any;
                  const addr = anyS.receiverAddress || anyS.receiver?.address;
                  if (!addr) {
                    return <Text type="secondary">暂无收货地址</Text>;
                  }
                  return (
                    <div>
                      <Text>{addr.country || ''} {addr.province || addr.state || ''} {addr.city || ''}</Text><br />
                      <Text>{addr.addressLine1 || addr.street || ''}</Text><br />
                      {addr.postalCode && <Text>邮编: {addr.postalCode}</Text>}
                      {addr.isResidential && <Tag color="blue">住宅</Tag>}
                    </div>
                  );
                })()}
              </Col>
            </Row>
          </Card>

          {/* 货物信息 */}
          <Card title="货物信息">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Text strong>货物描述：</Text><br />
                <Text>{shipment.description || '无'}</Text>
              </Col>
            </Row>
            {(shipment as any).tags && (shipment as any).tags.length > 0 && (
              <>
                <Divider />
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Text strong>标签：</Text>
                    <Space>
                      {(shipment as any).tags.map((tag: any, index: number) => (
                        <Tag key={index}>{tag}</Tag>
                      ))}
                    </Space>
                  </Col>
                </Row>
              </>
            )}
          </Card>
        </div>
      )
    },
    {
      key: 'assignment',
      label: '调度分配',
      children: (
        <div>
          <Card title="指派操作" style={{ marginBottom: 16 }}>
            <Space>
              <Button 
                type="primary" 
                icon={<TeamOutlined />}
                onClick={handleAssignDriver}
              >
                直接指派司机车辆
              </Button>
              <Button 
                icon={<TruckOutlined />}
                onClick={handleMountTrip}
              >
                挂载到行程
              </Button>
            </Space>
          </Card>

          <Card title="当前指派信息">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>指派司机：</Text>
                <Text>{shipment.assignedDriverId || '未指派'}</Text>
              </Col>
              <Col span={12}>
                <Text strong>指派车辆：</Text>
                <Text>{shipment.assignedVehicleId || '未指派'}</Text>
              </Col>
            </Row>
          </Card>
        </div>
      )
    },
    {
      key: 'execution',
      label: '执行状态',
      children: (
        <div>
          <Card title="状态推进" style={{ marginBottom: 16 }}>
            <Space>
              {getNextStatus(shipment.status) && (
                <Button 
                  type="primary" 
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleStatusUpdate(getNextStatus(shipment.status)!)}
                >
                  推进到 {getStatusTag(getNextStatus(shipment.status)!).text}
                </Button>
              )}
              <Button 
                icon={<ExclamationCircleOutlined />}
                danger
              >
                标记异常
              </Button>
            </Space>
          </Card>

          <Card title="POD上传" style={{ marginBottom: 16 }}>
            <Upload
              beforeUpload={handlePODUpload}
              showUploadList={false}
              accept="image/*"
              capture="environment" // 2025-10-02 16:25:00 优化手机体验，优先使用后置摄像头
              multiple={false}
              disabled={shipment.status === 'completed' || shipment.status === 'cancelled'}
            >
              <Button icon={<UploadOutlined />} type="primary">
                拍照上传POD
              </Button>
            </Upload>
            <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                支持手机拍照或从相册选择，已上传 {pods.length} 张POD图片
              </Text>
            </div>
            {(shipment.status === 'completed' || shipment.status === 'cancelled') && (
              <div style={{ marginTop: 8, fontSize: '12px', color: '#f5222d' }}>
                <Text type="danger" style={{ fontSize: '12px' }}>
                  运单已完成或已取消，无法上传POD
                </Text>
              </div>
            )}
          </Card>

          <Card title="状态时间线">
            <Timeline>
              <Timeline.Item color="green">
                <Text strong>运单创建</Text>
                <br />
                <Text type="secondary">{new Date(shipment.createdAt).toLocaleString()}</Text>
              </Timeline.Item>
              {shipment.status !== ShipmentStatus.CREATED && (
                <Timeline.Item color="blue">
                  <Text strong>已分配</Text>
                  <br />
                  <Text type="secondary">等待取货</Text>
                </Timeline.Item>
              )}
              {shipment.status === ShipmentStatus.COMPLETED && (
                <Timeline.Item color="green">
                  <Text strong>已完成</Text>
                  <br />
                  <Text type="secondary">运单完成</Text>
                </Timeline.Item>
              )}
            </Timeline>
          </Card>
        </div>
      )
    }
  ];

  return (
    <div>
      {/* 操作按钮 */}
      <div className="no-print" style={{ marginBottom: 16, textAlign: 'right' }}>
        <Space>
          <Button 
            type="primary" 
            icon={<PrinterOutlined />} 
            onClick={handlePrint}
          >
            打印运单
          </Button>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={handleDownloadPDF}
          >
            下载 PDF
          </Button>
          <Button onClick={() => setIsESignVisible(true)}>
            电子签名
          </Button>
        </Space>
      </div>

      {/* 运单详情标签页 */}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={tabItems}
      />

      {/* 指派司机车辆模态框 */}
      <Modal
        title="指派司机车辆"
        open={isAssignModalVisible}
        onOk={() => {
          // TODO: 实现指派逻辑
          message.success('指派成功');
          setIsAssignModalVisible(false);
        }}
        onCancel={() => setIsAssignModalVisible(false)}
        okText="确认指派"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="driverId"
            label={(
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>选择司机</span>
                <Button type="link" size="small" onClick={() => setIsQuickAddDriverVisible(true)}>+ 添加司机</Button>
              </div>
            )}
            rules={[{ required: true, message: '请选择司机' }]}
          >
            <Select placeholder="请选择司机">
              {availableDrivers.map(driver => (
                <Select.Option key={driver.id} value={driver.id}>
                  {driver.name} ({driver.phone})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="vehicleId"
            label={(
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>选择车辆</span>
                <Button type="link" size="small" onClick={() => setIsQuickAddVehicleVisible(true)}>+ 添加车辆</Button>
              </div>
            )}
            rules={[{ required: true, message: '请选择车辆' }]}
          >
            <Select placeholder="请选择车辆">
              {availableVehicles.map(vehicle => (
                <Select.Option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plateNumber} ({vehicle.type})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 快速添加司机弹窗 // 2025-10-02 11:05:20 */}
      <Modal
        title="添加司机"
        open={isQuickAddDriverVisible}
        onCancel={() => { setIsQuickAddDriverVisible(false); addDriverForm.resetFields(); }}
        onOk={async () => {
          try {
            const values = await addDriverForm.validateFields();
            const res = await driversApi.createDriver({ name: values.name, phone: values.phone, status: 'available' });
            const created = res?.data?.data || res?.data || { id: `drv_${Date.now()}`, name: values.name, phone: values.phone };
            setAvailableDrivers(prev => [created, ...prev]);
            form.setFieldsValue({ driverId: created.id });
            message.success('司机已添加');
            setIsQuickAddDriverVisible(false);
            addDriverForm.resetFields();
          } catch (e) {}
        }}
        okText="保存"
        cancelText="取消"
      >
        <Row gutter={16}>
          <Col span={12}>
            <Card size="small" title="司机信息（紧凑）">
              <Form form={addDriverForm} layout="vertical">
                <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}> 
                  <Input placeholder="张三" />
                </Form.Item>
                <Form.Item name="age" label="年龄" rules={[{ required: true, message: '请输入年龄' }]}> 
                  <Input type="number" placeholder="30" />
                </Form.Item>
                <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}> 
                  <Input placeholder="13800000000" />
                </Form.Item>
                <Form.Item name="englishLevel" label="英语水平" rules={[{ required: true, message: '请选择英语水平' }]}> 
                  <Select options={[{ label: 'Basic', value: 'basic' }, { label: 'Intermediate', value: 'intermediate' }, { label: 'Fluent', value: 'fluent' }]} placeholder="选择英语水平" />
                </Form.Item>
                <Form.Item name="otherLanguages" label="其他语言"> 
                  <Select mode="multiple" placeholder="选择其他语言" options={[{ label: '普通话', value: 'mandarin' }, { label: '广东话', value: 'cantonese' }, { label: '法语', value: 'french' }]} />
                </Form.Item>
                <Form.Item name="licenseClass" label="驾照等级（加拿大）" rules={[{ required: true, message: '请选择驾照等级' }]}> 
                  <Select placeholder="选择驾照等级" options={[{ label: 'Class G (Ontario)', value: 'G' }, { label: 'Class G1', value: 'G1' }, { label: 'Class G2', value: 'G2' }, { label: 'Class AZ (Tractor-Trailer)', value: 'AZ' }, { label: 'Class DZ (Straight Truck)', value: 'DZ' }, { label: 'Class CZ (Bus)', value: 'CZ' }, { label: 'Class BZ (School Bus)', value: 'BZ' }, { label: 'Class M (Motorcycle)', value: 'M' }]} />
                </Form.Item>
              </Form>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title="全部司机（只读列表）">
              <List
                size="small"
                dataSource={availableDrivers}
                renderItem={(driver) => (
                  <List.Item>
                    <List.Item.Meta avatar={<Avatar>{(driver.name || '').slice(0,1)}</Avatar>} title={driver.name} description={driver.phone} />
                    <Tag color="green">空闲</Tag>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </Modal>

      {/* 快速添加车辆弹窗 // 2025-10-02 11:05:20 */}
      <Modal
        title="添加车辆"
        open={isQuickAddVehicleVisible}
        onCancel={() => { setIsQuickAddVehicleVisible(false); addVehicleForm.resetFields(); }}
        onOk={async () => {
          try {
            const values = await addVehicleForm.validateFields();
            const res = await vehiclesApi.createVehicle({ plateNumber: values.plateNumber, type: values.type, capacityKg: Number(values.capacityKg || 0), status: 'available' });
            const created = res?.data?.data || res?.data || { id: `veh_${Date.now()}`, plateNumber: values.plateNumber, type: values.type };
            setAvailableVehicles(prev => [created, ...prev]);
            form.setFieldsValue({ vehicleId: created.id });
            message.success('车辆已添加');
            setIsQuickAddVehicleVisible(false);
            addVehicleForm.resetFields();
          } catch (e) {}
        }}
        okText="保存"
        cancelText="取消"
      >
        <Row gutter={16}>
          <Col span={12}>
            <Card size="small" title="车辆信息（紧凑）">
              <Form form={addVehicleForm} layout="vertical">
                <Form.Item name="plateNumber" label="车牌号" rules={[{ required: true, message: '请输入车牌号' }]}> 
                  <Input placeholder="京A12345" />
                </Form.Item>
                <Form.Item name="type" label="车型" rules={[{ required: true, message: '请选择车型' }]}> 
                  <Select options={[{ label: '厢式货车', value: '厢式货车' }, { label: '平板车', value: '平板车' }, { label: '冷链车', value: '冷链车' }]} />
                </Form.Item>
                <Form.Item name="capacityKg" label="载重(kg)" rules={[{ required: true, message: '请输入载重' }]}> 
                  <Input type="number" placeholder="3000" />
                </Form.Item>
              </Form>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title="全部车辆（只读列表）">
              <List
                size="small"
                dataSource={availableVehicles}
                renderItem={(vehicle) => (
                  <List.Item>
                    <List.Item.Meta title={vehicle.plateNumber} description={`${vehicle.type} - ${vehicle.capacityKg || 0}kg`} />
                    <Tag color="green">空闲</Tag>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </Modal>

      {/* 挂载到行程模态框 */}
      <Modal
        title="挂载到行程"
        open={isMountModalVisible}
        onOk={() => {
          // TODO: 实现挂载逻辑
          message.success('挂载成功');
          setIsMountModalVisible(false);
        }}
        onCancel={() => setIsMountModalVisible(false)}
        okText="确认挂载"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="tripId"
            label="选择行程"
            rules={[{ required: true, message: '请选择行程' }]}
          >
            <Select placeholder="请选择行程">
              {availableTrips.map(trip => (
                <Select.Option key={trip.id} value={trip.id}>
                  {trip.tripNo} - {getDriverName(trip.driverId)} / {getVehiclePlate(trip.vehicleId)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 电子签名弹窗 // 2025-10-02 15:32:10 */}
      <Modal
        title="电子签名"
        open={isESignVisible}
        onCancel={() => setIsESignVisible(false)}
        footer={null}
        width={560}
      >
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary">请在下方空白区域书写签名（支持触屏或鼠标）。</Text>
        </div>
        <div
          style={{ border: '1px solid #ddd', borderRadius: 4, overflow: 'hidden', touchAction: 'none' }}
        >
          <canvas
            ref={canvasRef}
            width={520}
            height={200}
            style={{ display: 'block', background: '#fff' }}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          />
        </div>
        <Space style={{ marginTop: 12 }}>
          <Button onClick={handleClearSignature}>清除</Button>
          <Button type="primary" onClick={handleSaveSignature}>保存签名</Button>
        </Space>
        {signatureDataUrl && (
          <div style={{ marginTop: 12 }}>
            <Text type="secondary">签名预览：</Text>
            <div>
              <img src={signatureDataUrl} alt="签名预览" style={{ maxWidth: '100%', height: 80, objectFit: 'contain' }} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ShipmentDetails;
