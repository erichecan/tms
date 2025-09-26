// 运单详情打印组件
// 创建时间: 2025-09-26 17:40:00

import React from 'react';
import { Button, Card, Row, Col, Typography, Tag, Divider, Space } from 'antd';
import { PrinterOutlined, DownloadOutlined } from '@ant-design/icons';
import { Shipment, ShipmentStatus } from '../../types/index';
import { formatCurrency } from '../../utils/formatCurrency';

const { Title, Text } = Typography;

interface ShipmentDetailsProps {
  shipment: Shipment;
  onPrint?: () => void;
  onDownloadPDF?: () => void;
}

const ShipmentDetails: React.FC<ShipmentDetailsProps> = ({ 
  shipment, 
  onPrint, 
  onDownloadPDF 
}) => {
  const getStatusTag = (status: ShipmentStatus) => {
    const statusMap: Record<ShipmentStatus, { color: string; text: string }> = {
      [ShipmentStatus.PENDING]: { color: 'orange', text: '待处理' },
      [ShipmentStatus.QUOTED]: { color: 'blue', text: '已报价' },
      [ShipmentStatus.CONFIRMED]: { color: 'green', text: '已确认' },
      [ShipmentStatus.ASSIGNED]: { color: 'purple', text: '已分配' },
      [ShipmentStatus.PICKED_UP]: { color: 'geekblue', text: '已取货' },
      [ShipmentStatus.IN_TRANSIT]: { color: 'blue', text: '运输中' },
      [ShipmentStatus.DELIVERED]: { color: 'green', text: '已送达' },
      [ShipmentStatus.COMPLETED]: { color: 'green', text: '已完成' },
      [ShipmentStatus.CANCELLED]: { color: 'red', text: '已取消' },
      [ShipmentStatus.EXCEPTION]: { color: 'red', text: '异常' },
    };
    return statusMap[status] || { color: 'default', text: '未知' };
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

      {/* 运单详情 */}
      <Card title="运单详情" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Text strong>运单号：</Text>
            <Text code>{shipment.shipmentNumber}</Text>
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
            <Text strong>客户：</Text>
            <Text>{shipment.customerName || '未指定'}</Text>
          </Col>
          <Col span={12}>
            <Text strong>司机：</Text>
            <Text>{shipment.driverName || '未分配'}</Text>
          </Col>
        </Row>
        <Divider />

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Text strong>预估费用：</Text>
            <Text>{formatCurrency(shipment.estimatedCost)}</Text>
          </Col>
          <Col span={12}>
            <Text strong>实际费用：</Text>
            <Text>{formatCurrency(shipment.actualCost)}</Text>
          </Col>
        </Row>
        <Divider />

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Text strong>重量：</Text>
            <Text>{shipment.weight} kg</Text>
          </Col>
          <Col span={12}>
            <Text strong>创建时间：</Text>
            <Text>{new Date(shipment.createdAt).toLocaleString()}</Text>
          </Col>
        </Row>
      </Card>

      {/* 地址信息 */}
      <Card title="地址信息" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Title level={5}>取货地址</Title>
            <div>
              <Text>{shipment.pickupAddress.street}</Text><br />
              <Text>{shipment.pickupAddress.city}, {shipment.pickupAddress.state}</Text><br />
              <Text>邮编: {shipment.pickupAddress.postalCode}</Text>
            </div>
          </Col>
          <Col span={12}>
            <Title level={5}>送货地址</Title>
            <div>
              <Text>{shipment.deliveryAddress.street}</Text><br />
              <Text>{shipment.deliveryAddress.city}, {shipment.deliveryAddress.state}</Text><br />
              <Text>邮编: {shipment.deliveryAddress.postalCode}</Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 时间信息 */}
      <Card title="时间信息">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Text strong>取货时间：</Text>
            <Text>{new Date(shipment.pickupDate).toLocaleString()}</Text>
          </Col>
          <Col span={12}>
            <Text strong>送货时间：</Text>
            <Text>{shipment.deliveryDate ? new Date(shipment.deliveryDate).toLocaleString() : '未设置'}</Text>
          </Col>
        </Row>
        {shipment.description && (
          <>
            <Divider />
            <div>
              <Text strong>货物描述：</Text><br />
              <Text>{shipment.description}</Text>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default ShipmentDetails;
