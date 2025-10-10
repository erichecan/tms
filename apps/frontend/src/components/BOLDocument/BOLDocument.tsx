import React from 'react';
import { Shipment } from '../../types';
import './BOLDocument.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface BOLDocumentProps {
  shipment: Shipment;
  showPrintButton?: boolean;
}

const BOLDocument: React.FC<BOLDocumentProps> = ({ shipment, showPrintButton = true }) => {
  const handlePrint = () => {
    window.print();
  };

  const generatePDF = async () => {
    try {
      // 获取BOL文档元素
      const element = document.querySelector('.bol-document');
      if (!element) {
        console.error('找不到BOL文档元素');
        return;
      }

      // 使用html2canvas将HTML转换为canvas
      const canvas = await html2canvas(element as HTMLElement, {
        scale: 2, // 提高分辨率
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
      
      console.log('✅ PDF生成成功:', fileName);
    } catch (error) {
      console.error('❌ PDF生成失败:', error);
    }
  };

  return (
    <div className="bol-document">
      {/* BOL Header */}
      <div className="bol-header">
        <div className="bol-title">BILL OF LADING</div>
        <div className="bol-not-negotiable">NOT NEGOTIABLE</div>
        <div className="company-info">
          <div className="company-name">TMS Transport Ltd.</div>
          <div>LTL Customer Service: 1-800-667-8556</div>
          <div>TL Customer Service: 1-800-667-1138</div>
        </div>
      </div>

      {/* Date and BOL Number */}
      <div className="bol-meta">
        <div className="bol-date">Date: {new Date(shipment.createdAt).toLocaleDateString()}</div>
        <div className="bol-number">BOL Number: {shipment.shipmentNo || shipment.id}</div>
      </div>

      {/* Shipper Information */}
      <div className="bol-section">
        <div className="section-title">SHIPPER INFORMATION</div>
        <div className="shipper-info">
          <div>Shipper Name (FROM): {shipment.shipperName || 'N/A'}</div>
          <div>Street Address: {shipment.shipperAddress?.addressLine1 || 'N/A'}</div>
          <div>City/Town: {shipment.shipperAddress?.city} Province/State: {shipment.shipperAddress?.province}</div>
          <div>Postal/Zip Code: {shipment.shipperAddress?.postalCode} Phone #: {shipment.shipperPhone || 'N/A'}</div>
        </div>
      </div>

      {/* Consignee Information */}
      <div className="bol-section">
        <div className="section-title">CONSIGNEE INFORMATION</div>
        <div className="consignee-info">
          <div>Consignee Name (TO): {shipment.receiverName || 'N/A'}</div>
          <div>Street Address: {shipment.receiverAddress?.addressLine1 || 'N/A'}</div>
          <div>City/Town: {shipment.receiverAddress?.city} Province/State: {shipment.receiverAddress?.province}</div>
          <div>Postal/Zip Code: {shipment.receiverAddress?.postalCode} Phone #: {shipment.receiverPhone || 'N/A'}</div>
        </div>
      </div>

      {/* BOL and Order Numbers */}
      <div className="bol-section">
        <div className="section-title">ORDER INFORMATION</div>
        <div className="order-info">
          <div>BOL Number: {shipment.shipmentNo || shipment.id}</div>
          <div>Customer Order Number: {shipment.customerOrderNumber || 'N/A'}</div>
          <div>Purchase Order #: {shipment.purchaseOrderNumber || 'N/A'}</div>
          <div>Quote Number: N/A</div>
        </div>
      </div>

      {/* Freight Charges */}
      <div className="freight-section">
        <div>Freight Charges (*Check One)</div>
        <div className="freight-options">
          <label><input type="checkbox" checked={shipment.paymentType === 'prepaid'} readOnly /> Prepaid</label>
          <label><input type="checkbox" checked={shipment.paymentType === 'collect'} readOnly /> Collect</label>
          <label><input type="checkbox" checked={shipment.paymentType === 'third_party'} readOnly /> Third Party</label>
        </div>
        <div className="freight-note">*If not marked Shipment will move COLLECT</div>
      </div>

      {/* Cargo Details Table */}
      <div className="cargo-section">
        <div className="section-title">COMMODITY/DESCRIPTION OF GOODS</div>
        <table className="cargo-table">
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
              <td>{shipment.packageCount || 1}</td>
              <td>{shipment.description || 'General Cargo'}</td>
              <td>KG</td>
              <td>{shipment.weightKg}</td>
              <td>{shipment.packageCount || 1}</td>
              <td>{shipment.lengthCm || 0} x {shipment.widthCm || 0} x {shipment.heightCm || 0}</td>
            </tr>
          </tbody>
        </table>
        <div className="total-pieces">Total Pcs: {shipment.packageCount || 1}</div>
        <div className="dimension-note">*If no Dimensions are provided, shipments will move at 2,000 lbs per skid spot</div>
      </div>

      {/* Weight and Emergency Contact */}
      <div className="weight-section">
        <div className="weight-info">
          <div>Total Weight: {shipment.weightKg} kg</div>
          <div>Emergency Response Phone: 1-800-667-8556</div>
        </div>
      </div>

      {/* Additional Services */}
      <div className="services-section">
        <div className="section-title">Additional Services (additional charges applicable)</div>
        <div className="services-grid">
          <label><input type="checkbox" checked={shipment.services?.needAppointment} readOnly /> Private Residence Pickup</label>
          <label><input type="checkbox" checked={shipment.services?.needAppointment} readOnly /> Private Residence Delivery</label>
          <label><input type="checkbox" checked={shipment.services?.loadingAssist} readOnly /> Power Tailgate Pickup</label>
          <label><input type="checkbox" checked={shipment.services?.loadingAssist} readOnly /> Power Tailgate Delivery</label>
          <label><input type="checkbox" readOnly /> Heated Service</label>
          <label><input type="checkbox" readOnly /> Dangerous Goods</label>
          <label><input type="checkbox" readOnly /> Trade Show Pickup</label>
          <label><input type="checkbox" readOnly /> Trade Show Delivery</label>
          <label><input type="checkbox" checked={shipment.services?.needAppointment} readOnly /> Appointment</label>
          <label><input type="checkbox" readOnly /> Other</label>
        </div>
      </div>

      {/* Declared Value */}
      <div className="declared-value-section">
        <div className="declared-value">
          <div>Declared Value: $ {shipment.declaredValue || 0}</div>
          <div className="currency-options">
            <label><input type="checkbox" checked={true} readOnly /> CDN</label>
            <label><input type="checkbox" readOnly /> US</label>
          </div>
        </div>
        <div className="liability-clause">
          Maximum Liability of Carrier shall not exceed $ 2.00 per pound per article unless a Declared Value is entered here (additional fee will be charged for this).
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="terms-section">
        <div className="section-title">TERMS AND CONDITIONS</div>
        <div className="terms-text">
          RECEIVED, subject to individually determined rates or contracts that have been agreed upon in writing between the carrier and shipper, if applicable, otherwise to the rates, classifications and rules that have been established by the carrier and are available to the shipper, on request. The shipper certifies that he is familiar with all the terms and conditions of the bill of lading, including those on the back hereof, and the said terms and conditions are hereby agreed to by the shipper and accepted for himself and his assigns.
        </div>
      </div>

      {/* Signatures */}
      <div className="signatures">
        <div className="signature-section">
          <div className="signature-title">Shipper Signatures</div>
          <div>Shipper's Name (print): {shipment.shipperName || '_________________'}</div>
          <div>Shipper's Signature: _________________</div>
          <div>Date: {shipment.pickupDate ? new Date(shipment.pickupDate).toLocaleDateString() : new Date(shipment.createdAt).toLocaleDateString()}</div>
        </div>
        <div className="signature-section">
          <div className="signature-title">Carrier/Driver to Complete</div>
          <div className="cube-factor">
            <div>Cube Factor: ___ x ___ pcs = ___ Total Cube</div>
            <div>Total Lineal Feet Used: ___ Total Number of Pieces Received: ___</div>
            <div className="cube-note">Subject to 10 lbs per cubic foot or 1000 lbs per lineal foot used over 10 feet of trailer.</div>
          </div>
          <div className="checkboxes">
            <label><input type="checkbox" readOnly /> Shippers Load & Count</label>
            <label><input type="checkbox" readOnly /> Shippers Risk of Damage</label>
            <label><input type="checkbox" readOnly /> Uncrated</label>
            <label><input type="checkbox" readOnly /> Wrapped Pallets</label>
          </div>
          <div>Driver's Name (print): _________________</div>
          <div>Driver's Signature: _________________</div>
          <div>Date: _________ Time In: ___ AM/PM Time Out: ___ AM/PM</div>
        </div>
      </div>

      {/* Footer */}
      <div className="bol-footer">
        connecting the continent tms-platform.com
      </div>

      {/* Print Button (hidden when printing) */}
      {showPrintButton && (
        <div className="print-actions no-print">
          <button onClick={handlePrint} className="print-btn">打印 BOL</button>
          <button onClick={generatePDF} className="pdf-btn">生成 PDF</button>
        </div>
      )}
    </div>
  );
};

export default BOLDocument;
