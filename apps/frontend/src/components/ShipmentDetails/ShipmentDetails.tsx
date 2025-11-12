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
  ExclamationCircleOutlined,
  EditOutlined
} from '@ant-design/icons';
import { 
  Shipment, 
  ShipmentStatus, 
  Driver, 
  Vehicle, 
  Trip, 
  TimelineEvent,
  EventType,
  POD,
  DriverStatus,
  VehicleStatus
} from '../../types/index';
import { formatCurrency } from '../../utils/formatCurrency';
import jsPDF from 'jspdf'; // 2025-10-02 11:15:00 引入 jsPDF 以生成PDF
import html2canvas from 'html2canvas'; // 2025-10-02 11:15:00 将DOM渲染为图片嵌入PDF
import BOLDocument from '../BOLDocument/BOLDocument'; // 2025-10-10 12:40:00 使用新的BOL组件
import { driversApi, vehiclesApi, shipmentsApi } from '../../services/api'; // 2025-10-02 11:05:20 引入创建司机/车辆API // 2025-11-11 10:15:05 引入运单详情API
import { useDataContext } from '../../contexts/DataContext'; // 2025-11-11T16:00:00Z Added by Assistant: Use global data context
import { formatDateTime } from '../../utils/timeUtils'; // 2025-11-11 10:15:05 引入时间格式化工具
import type { RcFile } from 'antd/es/upload/interface'; // 2025-11-11 10:15:05 引入上传文件类型定义

const { Title, Text } = Typography;

interface ShipmentDetailsProps {
  shipment: Shipment;
  onPrint?: () => void;
  onDownloadPDF?: () => void;
  onStatusUpdate?: (shipmentId: string, status: ShipmentStatus) => Promise<void> | void; // 2025-11-11 10:15:05 调整：传递运单ID与目标状态
  onAssignDriver?: (driverId: string, vehicleId: string) => void;
  onMountTrip?: (tripId: string) => void;
  onEdit?: () => void; // 2025-10-28 新增：编辑回调
}

const ShipmentDetails: React.FC<ShipmentDetailsProps> = ({ 
  shipment, 
  onPrint,
  onDownloadPDF,
  onStatusUpdate,
  onAssignDriver,
  onMountTrip,
  onEdit
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [isMountModalVisible, setIsMountModalVisible] = useState(false);
  const [isESignVisible, setIsESignVisible] = useState(false); // 2025-10-02 15:32:10 电子签弹窗
  const canvasRef = useRef<HTMLCanvasElement | null>(null); // 2025-10-02 15:32:10 签名画布引用
  const [isDrawing, setIsDrawing] = useState(false); // 2025-10-02 15:32:10 绘制状态
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null); // 2025-10-02 15:32:10 签名图片
  // 2025-11-11T16:00:00Z Added by Assistant: Use global data context - removes duplicate hook calls
  const { availableDrivers, allDrivers, availableVehicles, allVehicles } = useDataContext();
  
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
  useEffect(() => {
    let isMounted = true; // 2025-11-11 10:15:05 避免组件卸载后的状态更新
    // 2025-11-11 10:15:05 新增：同步时间线与POD数据
    const timelineSource = Array.isArray((shipment as any).timeline)
      ? (shipment.timeline as TimelineEvent[])
      : Array.isArray((shipment as any).timeline?.items)
      ? (shipment as any).timeline.items
      : Array.isArray((shipment as any).timeline?.events)
      ? (shipment as any).timeline.events
      : [];
    if (isMounted) {
      setTimelineEvents(timelineSource);
    }
    const podSource = Array.isArray((shipment as any).pods) ? (shipment.pods as POD[]) : [];
    if (isMounted) {
      setPods(podSource);
    }
    if (timelineSource.length === 0 && shipment.id) {
      shipmentsApi.getShipmentTimeline(shipment.id).then((res) => {
        const fetchedTimeline = (res.data?.data || res.data || []) as TimelineEvent[];
        if (isMounted) {
          setTimelineEvents(fetchedTimeline);
        }
      }).catch((error) => {
        console.warn('加载运单时间线失败:', error);
      });
    }
    if (podSource.length === 0 && shipment.id) {
      shipmentsApi.getShipmentPODs(shipment.id).then((res) => {
        const fetchedPods = (res.data?.data || res.data || []) as POD[];
        if (isMounted) {
          setPods(fetchedPods);
        }
      }).catch((error) => {
        console.warn('加载POD列表失败:', error);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [shipment]);

  const mapShipmentToBOLShape = (s: unknown) => {
    const anyS: any = s || {};
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

  // 2025-10-31 09:57:00 司机和车辆数据由 Hooks 自动加载，移除手动加载逻辑

  const getStatusTag = (status: ShipmentStatus) => {
    const statusMap: Record<ShipmentStatus, { color: string; text: string }> = {
      [ShipmentStatus.PENDING]: { color: 'orange', text: '待处理' }, // 2025-11-11 10:15:05 补充状态映射
      [ShipmentStatus.QUOTED]: { color: 'blue', text: '已报价' }, // 2025-11-11 10:15:05 补充状态映射
      [ShipmentStatus.CONFIRMED]: { color: 'cyan', text: '已确认' }, // 2025-11-11 10:15:05 补充状态映射
      [ShipmentStatus.CREATED]: { color: 'blue', text: '已创建' },
      [ShipmentStatus.ASSIGNED]: { color: 'purple', text: '已分配' },
      [ShipmentStatus.PICKED_UP]: { color: 'geekblue', text: '已取货' },
      [ShipmentStatus.IN_TRANSIT]: { color: 'cyan', text: '运输中' },
      [ShipmentStatus.DELIVERED]: { color: 'green', text: '已送达' },
      [ShipmentStatus.COMPLETED]: { color: 'success', text: '已完成' },
      [ShipmentStatus.CANCELED]: { color: 'red', text: '已取消' },
      [ShipmentStatus.CANCELLED]: { color: 'red', text: '已取消' }, // 2025-11-11 10:15:05 兼容英式拼写
      [ShipmentStatus.EXCEPTION]: { color: 'red', text: '异常' },
    };
    return statusMap[status] || { color: 'default', text: '未知' };
  };

  const timelineColorMap: Record<string, string> = {
    [EventType.CREATED]: 'blue',
    [EventType.ASSIGNED]: 'purple',
    [EventType.PICKED_UP]: 'geekblue',
    [EventType.IN_TRANSIT]: 'cyan',
    [EventType.DELIVERED]: 'green',
    [EventType.COMPLETED]: 'green',
    [EventType.POD_UPLOADED]: 'lime',
    [EventType.EXCEPTION_SET]: 'red',
    [EventType.EXCEPTION_RESOLVED]: 'orange',
    [EventType.CANCELED]: 'red',
  }; // 2025-11-11 10:15:05 新增：时间线颜色映射

  const timelineTextMap: Record<string, string> = {
    [EventType.CREATED]: '运单已创建',
    [EventType.ASSIGNED]: '已完成指派',
    [EventType.PICKED_UP]: '司机已取货',
    [EventType.IN_TRANSIT]: '运输中',
    [EventType.DELIVERED]: '货物已送达',
    [EventType.COMPLETED]: '运单已完结',
    [EventType.POD_UPLOADED]: '签收凭证已上传',
    [EventType.EXCEPTION_SET]: '运单标记异常',
    [EventType.EXCEPTION_RESOLVED]: '异常已处理',
    [EventType.CANCELED]: '运单已取消',
  }; // 2025-11-11 10:15:05 新增：时间线文案映射

  const getNextStatus = (currentStatus: ShipmentStatus): ShipmentStatus | null => {
    const statusFlow: Record<ShipmentStatus, ShipmentStatus | null> = {
      [ShipmentStatus.PENDING]: ShipmentStatus.CONFIRMED, // 2025-11-11 10:15:05 调整状态推进
      [ShipmentStatus.QUOTED]: ShipmentStatus.CONFIRMED, // 2025-11-11 10:15:05 调整状态推进
      [ShipmentStatus.CREATED]: ShipmentStatus.CONFIRMED, // 2025-11-11 10:15:05 调整状态推进
      [ShipmentStatus.CONFIRMED]: ShipmentStatus.ASSIGNED, // 2025-11-11 10:15:05 调整状态推进
      [ShipmentStatus.ASSIGNED]: ShipmentStatus.PICKED_UP,
      [ShipmentStatus.PICKED_UP]: ShipmentStatus.IN_TRANSIT,
      [ShipmentStatus.IN_TRANSIT]: ShipmentStatus.DELIVERED,
      [ShipmentStatus.DELIVERED]: ShipmentStatus.COMPLETED,
      [ShipmentStatus.COMPLETED]: null,
      [ShipmentStatus.CANCELED]: null,
      [ShipmentStatus.EXCEPTION]: null,
      [ShipmentStatus.CANCELLED]: null,
    };
    return statusFlow[currentStatus] || null;
  };

  const handleStatusUpdate = async (newStatus: ShipmentStatus) => {
    // 2025-11-11 10:15:05 调整：携带运单ID调用外部状态推进
    if (onStatusUpdate) {
      await onStatusUpdate(shipment.id, newStatus);
    }
  };

  const handleAssignDriver = () => {
    // 2025-10-31 10:30:00 修复：打开模态框时设置表单初始值
    setIsAssignModalVisible(true);
    form.setFieldsValue({
      driverId: shipment.driverId || undefined,
      vehicleId: (shipment as any).vehicleId || undefined,
    });
  };

  const handleMountTrip = () => {
    setIsMountModalVisible(true);
    // TODO: 加载可用行程
  };

  const handlePODUpload = async (file: RcFile) => {
    // 2025-11-11 10:15:05 调整：使用统一API上传POD并刷新列表
    try {
      const response = await shipmentsApi.uploadShipmentPOD(shipment.id, file);
      const createdPod = (response.data?.data || response.data) as POD;
      setPods((prev) => {
        const existing = prev.filter((item) => item.id !== createdPod?.id);
        return [createdPod, ...existing];
      });
      message.success('POD上传成功');
    } catch (error) {
      console.error('POD upload error:', error);
      message.error('POD上传失败，请检查网络连接');
    }
    return false; // 阻止默认上传行为
  };

  // 2025-10-31 10:30:00 修复：从所有司机/车辆中查找，不仅仅限于available状态
  const getDriverName = (driverId: string) => {
    const driver = allDrivers.find(d => d.id === driverId) || availableDrivers.find(d => d.id === driverId);
    return driver ? `${driver.name} (${driver.phone || '无电话'})` : '未知司机';
  };

  const getVehiclePlate = (vehicleId: string) => {
    const vehicle = allVehicles.find(v => v.id === vehicleId) || availableVehicles.find(v => v.id === vehicleId);
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
        scale: 1.5, // 2025-10-28 优化：降低scale减小PDF体积（从2降到1.5）
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false, // 禁用日志
        windowWidth: 794, // 明确指定宽度（A4：210mm = 794px at 72dpi）
        windowHeight: 1123 // 明确指定高度（A4：297mm = 1123px at 72dpi）
      });
      
      // 2025-10-28 优化：使用JPEG格式降低文件体积（从PNG改为JPEG，质量0.92）
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      
      // 创建PDF文档
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      // 添加第一页
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // 如果内容超过一页，添加新页面
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
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
          {/* 2025-10-28 优化：合并指派操作和指派信息到一个Card */}
          <Card 
            title="当前指派信息"
            extra={
              <Space>
                <Button 
                  type="primary" 
                  size="small"
                  icon={<TeamOutlined />}
                  onClick={handleAssignDriver}
                >
                  直接指派司机车辆
                </Button>
                <Button 
                  size="small"
                  icon={<TruckOutlined />}
                  onClick={handleMountTrip}
                >
                  挂载到行程
                </Button>
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>指派司机：</Text>
                {/* 2025-10-29 10:22:30 优化：显示司机姓名而非UUID */}
                <Text>{shipment.driverId ? getDriverName(shipment.driverId as string) : '未指派'}</Text>
              </Col>
              <Col span={12}>
                <Text strong>指派车辆：</Text>
                {/* 若后端暂未返回车辆ID，则保持“未指派” */}
                <Text>{(shipment as any).vehicleId ? getVehiclePlate((shipment as any).vehicleId as string) : '未指派'}</Text>
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
              {(() => {
                const nextStatus = getNextStatus(shipment.status);
                return nextStatus ? (
                <Button 
                  type="primary" 
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleStatusUpdate(nextStatus)}
                >
                  推进到 {getStatusTag(nextStatus).text}
                </Button>
                ) : null;
              })()}
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
            {(shipment.status === ShipmentStatus.COMPLETED || shipment.status === ShipmentStatus.CANCELED || shipment.status === ShipmentStatus.CANCELLED) && (
              <div style={{ marginTop: 8, fontSize: '12px', color: '#f5222d' }}>
                <Text type="danger" style={{ fontSize: '12px' }}>
                  运单已完成或已取消，无法上传POD
                </Text>
              </div>
            )}
            <List
              style={{ marginTop: 12 }}
              dataSource={pods}
              locale={{ emptyText: '暂无签收凭证' }}
              renderItem={(pod) => (
                <List.Item>
                  <Space size="small">
                    <a href={pod.filePath} target="_blank" rel="noreferrer">
                      查看签收凭证
                    </a>
                    <Text type="secondary">
                      {pod.uploadedAt ? formatDateTime(pod.uploadedAt) : '时间未知'}
                    </Text>
                    {pod.uploadedBy && (
                      <Text type="secondary">上传人：{pod.uploadedBy}</Text>
                    )}
                  </Space>
                </List.Item>
              )}
            />{/* 2025-11-11 10:15:05 新增：展示POD列表 */}
          </Card>

          <Card title="状态时间线">
            <Timeline>
              {timelineEvents.length === 0 ? (
                <Timeline.Item color="gray">
                  <Text type="secondary">暂无状态记录</Text>
                </Timeline.Item>
              ) : (
                timelineEvents.map((event, index) => {
                  const extraContent = event.extra
                    ? typeof event.extra === 'string'
                      ? event.extra
                      : JSON.stringify(event.extra)
                    : null;
                  return (
                  <Timeline.Item
                    key={event.id || `${event.eventType}-${index}`}
                    color={timelineColorMap[event.eventType] || 'blue'}
                  >
                    <Text strong>{timelineTextMap[event.eventType] || event.eventType}</Text>
                    <br />
                    <Text type="secondary">
                      {event.timestamp ? formatDateTime(event.timestamp) : '时间未知'}
                    </Text>
                    {extraContent && (
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                        {extraContent}
                      </div>
                    )}
                  </Timeline.Item>
                  );
                })
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
          {/* 2025-10-28 新增：编辑运单按钮（在打印运单左边） */}
          {onEdit && (
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              onClick={onEdit}
            >
              编辑运单
            </Button>
          )}
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
        onOk={async () => {
          try {
            const values = await form.validateFields();
            console.log('🔍 指派表单值:', values); // 2025-10-28 调试
            
            // 2025-10-28 修复：实现真正的指派逻辑
            if (onAssignDriver) {
              await onAssignDriver(values.driverId, values.vehicleId);
              // 2025-10-28 修复：调用成功后关闭模态框并重置表单
              setIsAssignModalVisible(false);
              form.resetFields();
              // 注意：成功消息应该由父组件显示，避免重复
            } else {
              // 如果没有传递回调，显示提示
              message.warning('指派功能需要后端API支持');
              setIsAssignModalVisible(false);
            }
          } catch (error: unknown) {
            console.error('指派失败:', error);
            // 2025-10-28 增强错误信息
            if (error && typeof error === 'object' && 'response' in error) {
              const axiosError = error as { response?: { data?: { error?: { message?: string }, message?: string } } };
              const errorMsg = axiosError.response?.data?.error?.message || axiosError.response?.data?.message || '指派失败，请检查输入';
              message.error(errorMsg);
            } else {
              message.error('指派失败，请检查输入');
            }
          }
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
                  {vehicle.plateNumber} ({(vehicle as any).vehicleType || vehicle.type || '未知类型'})
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
