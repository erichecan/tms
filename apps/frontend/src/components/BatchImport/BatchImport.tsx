// 批量导入组件
// 创建时间: 2025-09-29 15:00:00
// 作用: 支持运单批量导入功能（CSV模板支持）

import React, { useState, useRef } from 'react';
import {
  Card,
  Button,
  Upload,
  Table,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Typography,
  Space,
  Progress,
  Alert,
  Divider,
  Row,
  Col,
  Tag,
  Tooltip,
  Statistic,
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { shipmentsApi } from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
  total: number;
}

interface ShipmentData {
  externalOrderNo: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shipperName: string;
  shipperPhone: string;
  shipperAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  cargoDescription: string;
  cargoWeight: number;
  cargoLength: number;
  cargoWidth: number;
  cargoHeight: number;
  cargoValue: number;
  priority: string;
  pickupDate: string;
  deliveryDate: string;
}

const BatchImport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [importData, setImportData] = useState<ShipmentData[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [isResultModalVisible, setIsResultModalVisible] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  // 2025-11-24T18:15:00Z Updated by Assistant: 修复类型，使用 HTMLInputElement 而不是 any
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件上传
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const lines = csvText.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          message.error('CSV文件格式不正确，至少需要包含标题行和数据行');
          return;
        }

        // 解析CSV数据
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data: ShipmentData[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          if (values.length === headers.length) {
            data.push({
              externalOrderNo: values[0] || `BATCH-${Date.now()}-${i}`,
              customerName: values[1] || '',
              customerPhone: values[2] || '',
              customerEmail: values[3] || '',
              shipperName: values[4] || '',
              shipperPhone: values[5] || '',
              shipperAddress: values[6] || '',
              receiverName: values[7] || '',
              receiverPhone: values[8] || '',
              receiverAddress: values[9] || '',
              cargoDescription: values[10] || '',
              cargoWeight: parseFloat(values[11]) || 0,
              cargoLength: parseFloat(values[12]) || 0,
              cargoWidth: parseFloat(values[13]) || 0,
              cargoHeight: parseFloat(values[14]) || 0,
              cargoValue: parseFloat(values[15]) || 0,
              priority: values[16] || 'NORMAL',
              pickupDate: values[17] || dayjs().format('YYYY-MM-DD'),
              deliveryDate: values[18] || dayjs().add(1, 'day').format('YYYY-MM-DD'),
            });
          }
        }

        setImportData(data);
        setIsPreviewModalVisible(true);
        message.success(`成功解析 ${data.length} 条运单数据`);
      } catch (error) {
        console.error('CSV解析错误:', error);
        message.error('CSV文件解析失败，请检查文件格式');
      }
    };
    reader.readAsText(file, 'UTF-8');
    return false; // 阻止默认上传行为
  };

  // 下载CSV模板
  const downloadTemplate = () => {
    const headers = [
      'externalOrderNo',
      'customerName',
      'customerPhone',
      'customerEmail',
      'shipperName',
      'shipperPhone',
      'shipperAddress',
      'receiverName',
      'receiverPhone',
      'receiverAddress',
      'cargoDescription',
      'cargoWeight',
      'cargoLength',
      'cargoWidth',
      'cargoHeight',
      'cargoValue',
      'priority',
      'pickupDate',
      'deliveryDate'
    ];

    const sampleData = [
      'EC-20250929-001',
      '张三',
      '13800138000',
      'zhangsan@example.com',
      '北京仓库',
      '010-12345678',
      '北京市朝阳区xxx街道xxx号',
      '李四',
      '13900139000',
      '上海市浦东新区xxx路xxx号',
      '电子产品',
      '5.5',
      '30',
      '20',
      '15',
      '1200.00',
      'HIGH',
      '2025-09-30',
      '2025-10-01'
    ];

    const csvContent = [headers, sampleData].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'shipment_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 执行批量导入
  const executeImport = async () => {
    setLoading(true);
    setUploadProgress(0);
    
    try {
      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
        total: importData.length
      };

      // 分批处理，避免一次性发送过多请求
      const batchSize = 5;
      for (let i = 0; i < importData.length; i += batchSize) {
        const batch = importData.slice(i, i + batchSize);
        
        const promises = batch.map(async (data, index) => {
          try {
            const shipmentData = {
              externalOrderNo: data.externalOrderNo,
              salesChannel: 'DIRECT',
              tags: ['BATCH_IMPORT'],
              shipper: {
                name: data.shipperName,
                phone: data.shipperPhone,
                address: {
                  country: 'CN',
                  province: '北京市',
                  city: '北京市',
                  postalCode: '100000',
                  addressLine1: data.shipperAddress,
                  isResidential: false
                }
              },
              receiver: {
                name: data.receiverName,
                phone: data.receiverPhone,
                address: {
                  country: 'CN',
                  province: '上海市',
                  city: '上海市',
                  postalCode: '200000',
                  addressLine1: data.receiverAddress,
                  isResidential: true
                }
              },
              packages: [{
                boxName: 'Package-1',
                length: data.cargoLength,
                width: data.cargoWidth,
                height: data.cargoHeight,
                dimensionUnit: 'cm',
                weight: data.cargoWeight,
                weightUnit: 'kg',
                declaredValue: data.cargoValue,
                currency: 'CNY',
                remark: data.cargoDescription
              }],
              items: [{
                sku: `SKU-${data.externalOrderNo}`,
                description: data.cargoDescription,
                quantity: 1,
                unitWeight: data.cargoWeight,
                unitPrice: data.cargoValue,
                currency: 'CNY'
              }],
              cargoType: 'GENERAL',
              fragile: false,
              insured: false,
              priority: data.priority,
              pickupDate: data.pickupDate,
              deliveryDate: data.deliveryDate
            };

            await shipmentsApi.createShipment(shipmentData);
            results.success++;
          } catch (error: unknown) {
            results.failed++;
            results.errors.push(`第${i + index + 1}行: ${error.message || '导入失败'}`);
          }
        });

        await Promise.all(promises);
        setUploadProgress(Math.round(((i + batchSize) / importData.length) * 100));
      }

      setImportResult(results);
      setIsResultModalVisible(true);
      setIsPreviewModalVisible(false);
      
      if (results.success > 0) {
        message.success(`成功导入 ${results.success} 条运单`);
      }
      if (results.failed > 0) {
        message.warning(`${results.failed} 条运单导入失败`);
      }
    } catch (error) {
      console.error('批量导入错误:', error);
      message.error('批量导入过程中发生错误');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // 预览表格列配置
  const previewColumns = [
    { title: '序号', dataIndex: 'index', key: 'index', width: 60 },
    { title: '订单号', dataIndex: 'externalOrderNo', key: 'externalOrderNo', width: 120 },
    { title: '客户姓名', dataIndex: 'customerName', key: 'customerName', width: 100 },
    { title: '客户电话', dataIndex: 'customerPhone', key: 'customerPhone', width: 120 },
    { title: '发货人', dataIndex: 'shipperName', key: 'shipperName', width: 100 },
    { title: '收货人', dataIndex: 'receiverName', key: 'receiverName', width: 100 },
    { title: '货物描述', dataIndex: 'cargoDescription', key: 'cargoDescription', width: 150 },
    { title: '重量(kg)', dataIndex: 'cargoWeight', key: 'cargoWeight', width: 80 },
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80 },
    { title: '取货日期', dataIndex: 'pickupDate', key: 'pickupDate', width: 100 },
    { title: '送达日期', dataIndex: 'deliveryDate', key: 'deliveryDate', width: 100 },
  ];

  return (
    <div>
      <Card title="运单批量导入" style={{ marginBottom: 24 }}>
        <Alert
          message="批量导入说明"
          description="支持CSV格式文件批量导入运单。请先下载模板文件，按照模板格式填写数据后上传。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Row gutter={[24, 24]}>
          <Col span={12}>
            <Card size="small" title="📥 上传CSV文件">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Upload
                  accept=".csv"
                  beforeUpload={handleFileUpload}
                  showUploadList={false}
                  ref={fileInputRef}
                >
                  <Button icon={<UploadOutlined />} size="large" style={{ width: '100%' }}>
                    选择CSV文件
                  </Button>
                </Upload>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  支持.csv格式，文件大小不超过10MB
                </Text>
              </Space>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card size="small" title="📋 下载模板">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button 
                  icon={<DownloadOutlined />} 
                  size="large" 
                  style={{ width: '100%' }}
                  onClick={downloadTemplate}
                >
                  下载CSV模板
                </Button>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  包含示例数据和字段说明
                </Text>
              </Space>
            </Card>
          </Col>
        </Row>

        
        {loading && (
          <div style={{ marginTop: 24 }}>
            <Text>导入进度:</Text>
            <Progress percent={uploadProgress} status="active" />
          </div>
        )}
      </Card>

      
      <Modal
        title="数据预览"
        open={isPreviewModalVisible}
        onCancel={() => setIsPreviewModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsPreviewModalVisible(false)}>
            取消
          </Button>,
          <Button 
            key="import" 
            type="primary" 
            loading={loading}
            onClick={executeImport}
          >
            确认导入 ({importData.length} 条)
          </Button>
        ]}
        width={1200}
      >
        <div style={{ marginBottom: 16 }}>
          <Statistic title="待导入运单数量" value={importData.length} />
        </div>
        
        <Table
          columns={previewColumns}
          dataSource={importData.map((item, index) => ({ ...item, index: index + 1 }))}
          rowKey="externalOrderNo"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
          size="small"
        />
      </Modal>

      
      <Modal
        title="导入结果"
        open={isResultModalVisible}
        onCancel={() => setIsResultModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsResultModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {importResult && (
          <div>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Statistic 
                  title="总计" 
                  value={importResult.total} 
                  prefix={<InfoCircleOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="成功" 
                  value={importResult.success} 
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="失败" 
                  value={importResult.failed} 
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<ExclamationCircleOutlined />}
                />
              </Col>
            </Row>

            {importResult.errors.length > 0 && (
              <div>
                <Title level={5}>错误详情:</Title>
                <Alert
                  message="以下运单导入失败"
                  description={
                    <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                      {importResult.errors.map((error, index) => (
                        <li key={index} style={{ marginBottom: 4 }}>
                          {error}
                        </li>
                      ))}
                    </ul>
                  }
                  type="error"
                  showIcon
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BatchImport;
