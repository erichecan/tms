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
import BOLDocument from '../BOLDocument/BOLDocument'; // 2025-10-10 12:40:00 使用新的BOL组件
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
  const [isCostDetailVisible, setIsCostDetailVisible] = useState(false); // 2025-10-08 17:25:00 费用明细弹窗
  // 将后端运单结构映射到BOL模板所需结构 // 2025-10-06 00:18:45
  const mapShipmentToBOLShape = (s: unknown) => {
    const anyS: unknown = s || {};
    const pickup = anyS.pickupAddress || anyS.shipperAddress || anyS.shipper?.address || {};
    const delivery = anyS.deliveryAddress || anyS.receiverAddress || anyS.receiver?.address || {};
    return {
      ...anyS,
      shipper: anyS.shipper || { name: anyS.customerName || anyS.customer?.name || '', address: {
        addressLine1: pickup.addressLine1 || pickup.street || '',
        city: pickup.city || '',
        province: pickup.province || pickup.state || '',
        postalCode: pickup.postalCode || '',
        country: pickup.country || ''
      }},
      receiver: anyS.receiver || { name: anyS.receiverName || '', address: {
        addressLine1: delivery.addressLine1 || delivery.street || '',
        city: delivery.city || '',
        province: delivery.province || delivery.state || '',
        postalCode: delivery.postalCode || '',
        country: delivery.country || ''
      }},
      shipperAddress: anyS.shipperAddress || {
        addressLine1: pickup.addressLine1 || pickup.street || '',
        city: pickup.city || '',
        province: pickup.province || pickup.state || '',
        postalCode: pickup.postalCode || '',
        country: pickup.country || ''
      },
      receiverAddress: anyS.receiverAddress || {
        addressLine1: delivery.addressLine1 || delivery.street || '',
        city: delivery.city || '',
        province: delivery.province || delivery.state || '',
        postalCode: delivery.postalCode || '',
        country: delivery.country || ''
      },
      billTo: anyS.billTo || anyS.customerName || anyS.customer?.name || '',
    };
  };

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

  const handlePODUpload = async (file: unknown) => {
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
    // 使用新的BOL组件进行打印 - 2025-10-10 12:45:00
    // 直接调用BOLDocument组件的打印功能
    const bolElement = document.querySelector('.bol-document');
    if (bolElement) {
      // 如果找到了BOL元素，直接打印
      window.print();
    } else {
      // 如果没有找到，创建一个临时的BOL文档用于打印
      const printContainer = document.createElement('div');
      printContainer.style.position = 'fixed';
      printContainer.style.left = '-10000px';
      printContainer.style.top = '0';
      printContainer.style.width = '21cm';
      
      // 创建一个临时的BOL组件
      const tempBolElement = document.createElement('div');
      tempBolElement.className = 'bol-document';
      tempBolElement.innerHTML = `
        <div class="bol-header">
          <div class="bol-title">BILL OF LADING</div>
          <div class="bol-not-negotiable">NOT NEGOTIABLE</div>
          <div class="company-info">
            <div class="company-name">TMS Transport Ltd.</div>
            <div>LTL Customer Service: 1-800-667-8556</div>
          </div>
        </div>
        <div class="bol-meta">
          <div class="bol-date">Date: ${new Date(shipment.createdAt).toLocaleDateString()}</div>
          <div class="bol-number">BOL Number: ${shipment.shipmentNo || shipment.id}</div>
        </div>
        <div class="bol-section">
          <div class="section-title">SHIPPER INFORMATION</div>
          <div class="shipper-info">
            <div>Shipper Name (FROM): ${shipment.shipperName || 'N/A'}</div>
            <div>Street Address: ${shipment.shipperAddress?.addressLine1 || 'N/A'}</div>
            <div>City/Town: ${shipment.shipperAddress?.city} Province/State: ${shipment.shipperAddress?.province}</div>
            <div>Postal/Zip Code: ${shipment.shipperAddress?.postalCode} Phone #: ${shipment.shipperPhone || 'N/A'}</div>
          </div>
        </div>
        <div class="bol-section">
          <div class="section-title">CONSIGNEE INFORMATION</div>
          <div class="consignee-info">
            <div>Consignee Name (TO): ${shipment.receiverName || 'N/A'}</div>
            <div>Street Address: ${shipment.receiverAddress?.addressLine1 || 'N/A'}</div>
            <div>City/Town: ${shipment.receiverAddress?.city} Province/State: ${shipment.receiverAddress?.province}</div>
            <div>Postal/Zip Code: ${shipment.receiverAddress?.postalCode} Phone #: ${shipment.receiverPhone || 'N/A'}</div>
          </div>
        </div>
        <div class="bol-section">
          <div class="section-title">COMMODITY/DESCRIPTION OF GOODS</div>
          <table class="cargo-table">
            <thead>
              <tr>
                <th>S</th>
                <th>D</th>
                <th>M</th>
                <th>LBS</th>
                <th>NO</th>
                <th>LOO OH</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${shipment.packageCount || 1}</td>
                <td>${shipment.description || 'General Cargo'}</td>
                <td>KG</td>
                <td>${shipment.weightKg}</td>
                <td>${shipment.packageCount || 1}</td>
                <td>${shipment.lengthCm || 0} x ${shipment.widthCm || 0} x ${shipment.heightCm || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
      
      printContainer.appendChild(tempBolElement);
      document.body.appendChild(printContainer);

      // 打开新窗口打印
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>BOL打印</title>
            <style>
              @page { size: A4; margin: 1cm; }
              body { margin: 0; font-family: Arial, sans-serif; }
              .bol-document { width: 21cm; min-height: 29.7cm; padding: 1cm; }
              .bol-header { border: 2px solid #000; padding: 8px; text-align: center; margin-bottom: 8px; }
              .bol-title { font-size: 18pt; font-weight: bold; margin-bottom: 4px; }
              .bol-not-negotiable { font-size: 10pt; font-weight: bold; margin-bottom: 4px; }
              .company-info { font-size: 8pt; }
              .company-name { font-size: 12pt; font-weight: bold; margin-bottom: 2px; }
              .bol-meta { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 9pt; }
              .bol-section { border: 1px solid #000; margin-bottom: 6px; padding: 6px; }
              .section-title { font-weight: bold; font-size: 9pt; margin-bottom: 4px; text-transform: uppercase; background-color: #f0f0f0; padding: 2px; }
              .shipper-info, .consignee-info { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 8pt; }
              .cargo-table { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 8pt; }
              .cargo-table th, .cargo-table td { border: 1px solid #000; padding: 3px; text-align: left; }
              .cargo-table th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
            </style>
          </head>
          <body>
            ${tempBolElement.outerHTML}
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
          document.body.removeChild(printContainer);
        }, 500);
      }
    }
  };

  // 使用新的BOL组件生成PDF - 2025-10-10 12:45:00
  const handleDownloadPDF = async () => {
    try {
      // 创建一个隐藏的BOL组件用于PDF生成
      const pdfContainer = document.createElement('div');
      pdfContainer.style.position = 'fixed';
      pdfContainer.style.left = '-10000px';
      pdfContainer.style.top = '0';
      pdfContainer.style.width = '21cm';
      
      // 创建一个临时的BOL组件
      const tempBolElement = document.createElement('div');
      tempBolElement.className = 'bol-document';
      tempBolElement.innerHTML = `
        <div class="bol-header">
          <div class="bol-title">BILL OF LADING</div>
          <div class="bol-not-negotiable">NOT NEGOTIABLE</div>
          <div class="company-info">
            <div class="company-name">TMS Transport Ltd.</div>
            <div>LTL Customer Service: 1-800-667-8556</div>
          </div>
        </div>
        <div class="bol-meta">
          <div class="bol-date">Date: ${new Date(shipment.createdAt).toLocaleDateString()}</div>
          <div class="bol-number">BOL Number: ${shipment.shipmentNo || shipment.id}</div>
        </div>
        <div class="bol-section">
          <div class="section-title">SHIPPER INFORMATION</div>
          <div class="shipper-info">
            <div>Shipper Name (FROM): ${shipment.shipperName || 'N/A'}</div>
            <div>Street Address: ${shipment.shipperAddress?.addressLine1 || 'N/A'}</div>
            <div>City/Town: ${shipment.shipperAddress?.city} Province/State: ${shipment.shipperAddress?.province}</div>
            <div>Postal/Zip Code: ${shipment.shipperAddress?.postalCode} Phone #: ${shipment.shipperPhone || 'N/A'}</div>
          </div>
        </div>
        <div class="bol-section">
          <div class="section-title">CONSIGNEE INFORMATION</div>
          <div class="consignee-info">
            <div>Consignee Name (TO): ${shipment.receiverName || 'N/A'}</div>
            <div>Street Address: ${shipment.receiverAddress?.addressLine1 || 'N/A'}</div>
            <div>City/Town: ${shipment.receiverAddress?.city} Province/State: ${shipment.receiverAddress?.province}</div>
            <div>Postal/Zip Code: ${shipment.receiverAddress?.postalCode} Phone #: ${shipment.receiverPhone || 'N/A'}</div>
          </div>
        </div>
        <div class="bol-section">
          <div class="section-title">COMMODITY/DESCRIPTION OF GOODS</div>
          <table class="cargo-table">
            <thead>
              <tr>
                <th>S</th>
                <th>D</th>
                <th>M</th>
                <th>LBS</th>
                <th>NO</th>
                <th>LOO OH</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${shipment.packageCount || 1}</td>
                <td>${shipment.description || 'General Cargo'}</td>
                <td>KG</td>
                <td>${shipment.weightKg}</td>
                <td>${shipment.packageCount || 1}</td>
                <td>${shipment.lengthCm || 0} x ${shipment.widthCm || 0} x ${shipment.heightCm || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
      
      pdfContainer.appendChild(tempBolElement);
      document.body.appendChild(pdfContainer);

      const bolElement = pdfContainer.querySelector('.bol-document') as HTMLElement;
      const canvas = await html2canvas(bolElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // 创建PDF文档
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      // 添加第一页
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // 如果内容超过一页，添加新页面
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // 保存PDF
      const fileName = `BOL-${shipment.shipmentNo || shipment.id}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      document.body.removeChild(pdfContainer);
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

  const handleStart = (e: unknown) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const { x, y } = getPos(e.nativeEvent, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleMove = (e: unknown) => {
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
                <Button 
                  type="link" 
                  size="small" 
                  onClick={() => setIsCostDetailVisible(true)}
                  style={{ padding: 0, marginLeft: 4 }}
                >
                  （费用明细）
                </Button>
              </Col>
              <Col span={12}>
                <Text strong>最终费用：</Text>
                <Text>{formatCurrency(shipment.finalCost)}</Text>
              </Col>
            </Row>
          </Card>

          
          <Card title="地址信息" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Title level={5}>发货地址</Title>
                {(() => {
                  const anyS: unknown = shipment as any; // 2025-10-02 11:00:20 兼容不同数据结构
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
                  const anyS: unknown = shipment as any;
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
                      {(shipment as any).tags.map((tag: unknown, index: number) => (
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
    },
  ];

  return (
    <div>
      
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

      
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={tabItems}
      />

      
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
          } catch (error) {
    console.error(error);
  }
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
          } catch (error) {
    console.error(error);
  }
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

      
      <Modal
        title="费用明细"
        open={isCostDetailVisible}
        onCancel={() => setIsCostDetailVisible(false)}
        footer={null}
        width={520}
      >
        <div>
          <div style={{ marginBottom: 12 }}>
            <Text strong>运单号：</Text>
            <Text code>{shipment.shipmentNumber}</Text>
          </div>
          <Divider />
          <Space direction="vertical" style={{ width: '100%' }}>
            <div><Text type="secondary">基础费用</Text><div>￥{Math.round(Number((shipment as any).breakdown?.baseFee || 100))}</div></div>
            <div><Text type="secondary">距离费用</Text><div>￥{Math.round(Number((shipment as any).breakdown?.distanceFee || 0))}</div></div>
            <div><Text type="secondary">重量费用</Text><div>￥{Math.round(Number((shipment as any).breakdown?.weightFee || 0))}</div></div>
            <div><Text type="secondary">体积费用</Text><div>￥{Math.round(Number((shipment as any).breakdown?.volumeFee || 0))}</div></div>
            <div><Text type="secondary">其他费用</Text><div>￥{Math.round(Number((shipment as any).breakdown?.additionalFees || 0))}</div></div>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ fontWeight: 600 }}>预估总额：￥{Math.round(Number(shipment.estimatedCost ?? (shipment as any).previewCost ?? 0))}</div>
          </Space>
          <div style={{ marginTop: 12 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>以上为预估结果，实际以计费引擎结算为准。</Text>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ShipmentDetails;
