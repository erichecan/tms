// 运单详情组件 - 符合PRD v3.0-PC设计
// 创建时间: 2025-01-27 15:30:00

import React, { useState } from 'react';
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
  message
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
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [availableTrips, setAvailableTrips] = useState<Trip[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [pods, setPods] = useState<POD[]>([]);
  const [form] = Form.useForm();
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

  const handlePODUpload = (file: any) => {
    // TODO: 实现POD上传逻辑
    message.success('POD上传成功');
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
          .shipment-details { 
            font-family: Arial, sans-serif; 
            font-size: 12px;
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 10px; 
            margin-bottom: 20px; 
          }
          .section { 
            margin-bottom: 15px; 
            border-bottom: 1px solid #ccc; 
            padding-bottom: 10px; 
          }
          .signature-area { 
            margin-top: 30px; 
            border: 1px solid #000; 
            height: 80px; 
            padding: 10px; 
          }
        }
      </style>
    `;

    // 创建打印内容
    const printContent = `
      ${printStyles}
      <div class="shipment-details">
        <div class="header">
          <h1>运输单据</h1>
          <h2>SHIPMENT DOCUMENT</h2>
        </div>
        
        <div class="section">
          <h3>运单信息 / Shipment Information</h3>
          <p><strong>运单号 / Shipment No.:</strong> ${shipment.shipmentNumber}</p>
          <p><strong>状态 / Status:</strong> ${getStatusTag(shipment.status).text}</p>
          <p><strong>创建时间 / Created:</strong> ${new Date(shipment.createdAt).toLocaleString()}</p>
        </div>

        <div class="section">
          <h3>客户信息 / Customer Information</h3>
          <p><strong>客户名称 / Customer:</strong> ${shipment.customerName || '未指定'}</p>
        </div>

        <div class="section">
          <h3>司机信息 / Driver Information</h3>
          <p><strong>司机姓名 / Driver:</strong> ${shipment.driverName || '未分配'}</p>
        </div>

        <div class="section">
          <h3>地址信息 / Address Information</h3>
          <div style="display: flex; justify-content: space-between;">
            <div style="width: 48%;">
              <h4>取货地址 / Pickup Address</h4>
              <p>${shipment.pickupAddress.street}</p>
              <p>${shipment.pickupAddress.city}, ${shipment.pickupAddress.state}</p>
              <p>邮编: ${shipment.pickupAddress.postalCode}</p>
            </div>
            <div style="width: 48%;">
              <h4>送货地址 / Delivery Address</h4>
              <p>${shipment.deliveryAddress.street}</p>
              <p>${shipment.deliveryAddress.city}, ${shipment.deliveryAddress.state}</p>
              <p>邮编: ${shipment.deliveryAddress.postalCode}</p>
            </div>
          </div>
        </div>

        <div class="section">
          <h3>货物信息 / Cargo Information</h3>
          <p><strong>重量 / Weight:</strong> ${shipment.weight} kg</p>
          <p><strong>描述 / Description:</strong> ${shipment.description || '无'}</p>
          <p><strong>取货时间 / Pickup Date:</strong> ${new Date(shipment.pickupDate).toLocaleDateString()}</p>
          ${shipment.deliveryDate ? `<p><strong>送货时间 / Delivery Date:</strong> ${new Date(shipment.deliveryDate).toLocaleDateString()}</p>` : ''}
        </div>

        <div class="section">
          <h3>费用信息 / Cost Information</h3>
          <p><strong>预估费用 / Estimated Cost:</strong> ${formatCurrency(shipment.estimatedCost)}</p>
          ${shipment.actualCost ? `<p><strong>实际费用 / Actual Cost:</strong> ${formatCurrency(shipment.actualCost)}</p>` : ''}
        </div>

        <div class="signature-area">
          <div style="display: flex; justify-content: space-between;">
            <div style="width: 30%;">
              <p><strong>发货人签字 / Shipper Signature:</strong></p>
              <div style="height: 40px; border-bottom: 1px solid #000;"></div>
              <p>日期 / Date: _______________</p>
            </div>
            <div style="width: 30%;">
              <p><strong>司机签字 / Driver Signature:</strong></p>
              <div style="height: 40px; border-bottom: 1px solid #000;"></div>
              <p>日期 / Date: _______________</p>
            </div>
            <div style="width: 30%;">
              <p><strong>收货人签字 / Receiver Signature:</strong></p>
              <div style="height: 40px; border-bottom: 1px solid #000;"></div>
              <p>日期 / Date: _______________</p>
            </div>
          </div>
        </div>
      </div>
    `;

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
                <div>
                  <Text>{shipment.shipperAddress.country} {shipment.shipperAddress.province} {shipment.shipperAddress.city}</Text><br />
                  <Text>{shipment.shipperAddress.addressLine1}</Text><br />
                  <Text>邮编: {shipment.shipperAddress.postalCode}</Text>
                  {shipment.shipperAddress.isResidential && <Tag color="blue">住宅</Tag>}
                </div>
              </Col>
              <Col span={12}>
                <Title level={5}>收货地址</Title>
                <div>
                  <Text>{shipment.receiverAddress.country} {shipment.receiverAddress.province} {shipment.receiverAddress.city}</Text><br />
                  <Text>{shipment.receiverAddress.addressLine1}</Text><br />
                  <Text>邮编: {shipment.receiverAddress.postalCode}</Text>
                  {shipment.receiverAddress.isResidential && <Tag color="blue">住宅</Tag>}
                </div>
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
            {shipment.tags.length > 0 && (
              <>
                <Divider />
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Text strong>标签：</Text>
                    <Space>
                      {shipment.tags.map((tag, index) => (
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
            >
              <Button icon={<UploadOutlined />}>
                上传POD图片
              </Button>
            </Upload>
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">已上传 {pods.length} 张POD图片</Text>
            </div>
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
            onClick={onDownloadPDF}
          >
            下载 PDF
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
            label="选择司机"
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
            label="选择车辆"
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
    </div>
  );
};

export default ShipmentDetails;
