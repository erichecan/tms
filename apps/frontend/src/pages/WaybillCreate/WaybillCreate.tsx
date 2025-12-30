import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Radio, DatePicker, InputNumber, Space, Typography, ConfigProvider, Tooltip, Row, Col, message } from 'antd';
import { PrinterOutlined, SaveOutlined, ReloadOutlined, PlusOutlined, DeleteOutlined, FileImageOutlined } from '@ant-design/icons';
import { shipmentsApi } from '../../services/api';
import { INITIAL_AMAZON_TEMPLATE, INITIAL_DEFAULT_TEMPLATE, WaybillData } from '../../types/waybill';
import dayjs from 'dayjs';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './WaybillCreate.css';

const { Title, Text } = Typography;

interface WaybillCreateProps {
    readOnly?: boolean;
    initialData?: WaybillData;
}

const WaybillCreate: React.FC<WaybillCreateProps> = ({ readOnly = false, initialData }) => {
    const [form] = Form.useForm();
    const [templateType, setTemplateType] = useState<'AMAZON' | 'DEFAULT'>('AMAZON');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (initialData) {
            form.setFieldsValue(initialData);
            setTemplateType(initialData.templateType);
        } else {
            form.setFieldsValue(INITIAL_AMAZON_TEMPLATE);
        }
    }, [form, initialData]);

    const handleReset = () => {
        if (templateType === 'AMAZON') {
            form.setFieldsValue({ ...INITIAL_AMAZON_TEMPLATE });
        } else {
            form.setFieldsValue({ ...INITIAL_DEFAULT_TEMPLATE });
        }
        message.info('Form reset to default');
    };

    const handleSave = async () => {
        try {
            const values: WaybillData = await form.validateFields();
            setSaving(true);

            console.log('Form Values:', values);

            // Transform WaybillData to Shipment format for backend

            let shipperLocation = values.locations?.find(l => l.type === 'PICKUP') || values.locations?.[0];
            let receiverLocation = values.locations?.find(l => l.type === 'DROP' || l.type === 'FULFILLMENT') || values.locations?.[1] || values.locations?.[0];

            // If Amazon template with only 1 location (Fulfillment/Drop), we need a shipper.
            if (templateType === 'AMAZON' && values.locations?.length === 1) {
                if (!shipperLocation) shipperLocation = values.locations[0];
            }

            // Fallbacks
            if (!shipperLocation) shipperLocation = { companyName: 'Unknown Shipper', addressLine: 'N/A', city: 'N/A', province: 'N/A', postalCode: 'N/A', type: 'PICKUP', phone: '', id: 'dummy_s', contactPerson: '' };
            if (!receiverLocation) receiverLocation = { companyName: 'Unknown Receiver', addressLine: 'N/A', city: 'N/A', province: 'N/A', postalCode: 'N/A', type: 'DROP', phone: '', id: 'dummy_r', contactPerson: '' };

            const pickupDate = values.deliveryDate ? dayjs(values.deliveryDate).subtract(4, 'hour').toISOString() : dayjs().toISOString();
            const deliveryDate = values.deliveryDate ? dayjs(values.deliveryDate).toISOString() : dayjs().add(4, 'hour').toISOString();

            const shipmentPayload = {
                shipmentNumber: values.waybillNumber,
                distanceKm: values.distanceKm, // Pass manual distance for pricing engine
                customerName: receiverLocation.companyName || shipperLocation.companyName || 'Unknown Customer',

                shipper: {
                    name: shipperLocation.companyName || 'Unknown Sender',
                    phone: shipperLocation.phone || '000-000-0000',
                    address: {
                        addressLine1: shipperLocation.addressLine || 'N/A',
                        city: shipperLocation.city || 'N/A',
                        province: shipperLocation.province || 'N/A',
                        postalCode: shipperLocation.postalCode || 'N/A',
                        country: 'Canada'
                    }
                },
                receiver: {
                    name: receiverLocation.companyName || 'Unknown Receiver',
                    phone: receiverLocation.phone || '000-000-0000',
                    address: {
                        addressLine1: receiverLocation.addressLine || 'N/A',
                        city: receiverLocation.city || 'N/A',
                        province: receiverLocation.province || 'N/A',
                        postalCode: receiverLocation.postalCode || 'N/A',
                        country: 'Canada'
                    }
                },
                cargoItems: values.goods?.map(g => ({
                    description: g.name || g.description || 'General Cargo',
                    quantity: parseInt(String(g.items || g.pallets || 1), 10),
                    weight: parseFloat((g.weight || '0').replace(/[^0-9.]/g, '')),
                    dimensions: { length: 0, width: 0, height: 0 },
                    value: 0
                })) || [],

                pickupAt: pickupDate,
                deliveryAt: deliveryDate,

                saveAsDraft: true,
                initialStatus: 'draft',

                notes: `Template: ${templateType}. \n${values.note || ''}`
            };

            console.log('Sending Payload:', shipmentPayload);

            await shipmentsApi.createShipment(shipmentPayload);
            message.success('Waybill saved to Shipments successfully!');
        } catch (error: any) {
            console.error('Save Error:', error);
            const errorMsg = error.response?.data?.error?.message || error.message || 'Failed to save shipment.';
            message.error(`Failed to save: ${errorMsg}`);
        } finally {
            setSaving(false);
        }
    };

    const handleTemplateChange = (e: any) => {
        const newType = e.target.value;
        const currentValues = form.getFieldsValue(true);
        let newData = newType === 'AMAZON' ? { ...INITIAL_AMAZON_TEMPLATE } : { ...INITIAL_DEFAULT_TEMPLATE };

        // Preserve common fields
        newData.waybillNumber = currentValues.waybillNumber;
        newData.deliveryDate = currentValues.deliveryDate;
        newData.note = currentValues.note;

        form.setFieldsValue(newData);
        setTemplateType(newType);
    };

    // Direct PDF Download
    const handleDownloadPDF = async () => {
        const element = document.querySelector('.wb-paper') as HTMLElement;
        if (!element) return;

        // Clone the element to render it offline with "Print" styles
        const clone = element.cloneNode(true) as HTMLElement;
        clone.classList.add('wb-pdf-capture');
        document.body.appendChild(clone);

        try {
            message.loading('Generating PDF...', 1);

            // Wait a moment for images to settle in cloned DOM
            await new Promise(r => setTimeout(r, 500));

            const canvas = await html2canvas(clone, {
                scale: 1.5, // Reduced scale for file size optimization
                useCORS: true,
                logging: false,
                windowWidth: 210 * 3.78, // A4 width in pixels approx
            });

            // Use JPEG with 0.6 quality for significant size reduction
            const imgData = canvas.toDataURL('image/jpeg', 0.6);
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
            pdf.save(`Waybill_${dayjs().format('YYYYMMDD_HHmmss')}.pdf`);

            message.success('PDF Downloaded successfully!');
        } catch (error) {
            console.error('PDF Generation Error:', error);
            message.error('Failed to generate PDF');
        } finally {
            document.body.removeChild(clone);
        }
    };



    // Watch delivery date to sync with "Time In"
    const deliveryDate = Form.useWatch('deliveryDate', form);

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#1890ff',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                },
                components: {
                    Input: { colorBgContainer: '#ffffff', borderRadius: 4 },
                }
            }}
        >
            <div className="wb-workspace">
                {/* Toolbar */}
                <div className="wb-toolbar no-print">
                    <div className="flex items-center gap-4">
                        <Title level={4} style={{ margin: 0 }}>Create Waybill</Title>
                        <Radio.Group value={templateType} onChange={handleTemplateChange} buttonStyle="solid">
                            <Radio.Button value="AMAZON">Amazon Template</Radio.Button>
                            <Radio.Button value="DEFAULT">Default Template</Radio.Button>
                        </Radio.Group>
                    </div>
                    <Space>
                        <Tooltip title="Reset Form"><Button icon={<ReloadOutlined />} onClick={handleReset} /></Tooltip>
                        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>Save Waybill</Button>
                        {readOnly && <Button icon={<PrinterOutlined />} onClick={handleDownloadPDF}>Print / PDF</Button>}
                    </Space>
                </div>


                {/* The Form Content - Looks like a document but editable */}
                <Form form={form} component={false} layout="vertical" disabled={readOnly}>
                    <div className="wb-paper">
                        {templateType === 'AMAZON' ? (
                            <AmazonTemplateForm form={form} deliveryDate={deliveryDate} readOnly={readOnly} />
                        ) : (
                            <DefaultTemplateForm form={form} readOnly={readOnly} />
                        )}
                    </div>
                </Form>
            </div>
        </ConfigProvider >
    );
};


/* ====================================================================================
   IMAGE PASTE COMPONENT
   ==================================================================================== */
const ImagePasteZone: React.FC<{
    value?: string;
    onChange?: (val: string) => void;
    placeholder: string;
}> = ({ value, onChange, placeholder }) => {

    // Handle paste event
    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64 = event.target?.result as string;
                    onChange?.(base64);
                    message.success('Image pasted successfully');
                };
                if (blob) reader.readAsDataURL(blob);
                e.preventDefault();
                return;
            }
        }
    };

    // Handle dropping an image file
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const items = e.dataTransfer.files;
        if (items && items[0] && items[0].type.indexOf('image') !== -1) {
            const reader = new FileReader();
            reader.onload = (event) => {
                onChange?.(event.target?.result as string);
            };
            reader.readAsDataURL(items[0]);
        }
    };

    return (
        <div
            className="wb-image-paste-zone"
            onPaste={handlePaste}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            tabIndex={0} // Make focusable for paste
        >
            {value ? (
                <img src={value} alt="Pasted content" />
            ) : (
                <div className="wb-placeholder">
                    <FileImageOutlined style={{ fontSize: 24 }} />
                    <div className="text-center">{placeholder}</div>
                    <div className="text-xs text-gray-400">(Click & Paste Ctrl+V)</div>
                </div>
            )}
            {/* Clear button on hover if value exists */}
            {value && (
                <div
                    className="absolute top-1 right-1 bg-white rounded-full p-1 cursor-pointer shadow-md no-print hover:text-red-500"
                    onClick={(e) => { e.stopPropagation(); onChange?.(''); }}
                >
                    <DeleteOutlined />
                </div>
            )}
        </div>
    );
};


/* ====================================================================================
   TEMPLATE A: AMAZON WAREHOUSE
   ==================================================================================== */
const AmazonTemplateForm: React.FC<{ form: any, deliveryDate: any, readOnly?: boolean }> = ({ deliveryDate, readOnly }) => {
    return (
        <div className="flex flex-col h-full wb-bordered-box">
            {/* Header */}
            <div className="wb-header-row px-8 pt-6">
                <div>
                    <div className="text-2xl font-serif italic font-bold">Apony Inc.</div>
                </div>
                <div className="text-center">
                    <Text strong style={{ fontSize: 24, letterSpacing: '2px' }}>DELIVERY ORDER</Text>
                    <div className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Bill of Lading</div>
                </div>
                <div className="text-right">
                    <Text type="secondary" style={{ fontSize: 12 }}>Waybill Number</Text>
                    <Form.Item name="waybillNumber" noStyle>
                        <Input className="text-right text-lg font-bold font-mono wb-input-transparent" style={{ textAlign: 'right', width: 150 }} placeholder="Y001-XXXX" />
                    </Form.Item>
                </div>
            </div>

            {/* Barcode & ISA Section - Images */}
            <Row className="wb-row-border" style={{ minHeight: 140 }}>
                <Col span={6} className="wb-col-border bg-gray-50 flex items-center justify-center p-4">
                    <Text strong style={{ fontSize: 18, textAlign: 'center' }}>Shipment Appointment<br />(ISA)</Text>
                </Col>
                <Col span={18} className="flex p-4 gap-4">
                    {/* ISA Number Image */}
                    <div className="flex-1 flex flex-col">
                        <Text type="secondary" className="text-xs mb-1 text-center">ISA Number (Image)</Text>
                        <Form.Item name="isaImage" noStyle>
                            <ImagePasteZone placeholder="Paste ISA #" />
                        </Form.Item>
                    </div>
                    {/* Barcode Image */}
                    <div className="flex-1 flex flex-col">
                        <Text type="secondary" className="text-xs mb-1 text-center">Barcode (Image)</Text>
                        <Form.Item name="barcodeImage" noStyle>
                            <ImagePasteZone placeholder="Paste Barcode" />
                        </Form.Item>
                    </div>
                </Col>
            </Row>

            {/* Info Rows */}
            <div className="flex flex-col">
                {/* Fulfillment Center - One Generic Block */}
                <InfoRow label="Fulfillment Center">
                    <Form.List name="locations">
                        {(fields) => {
                            const field = fields[0];
                            return field ? (
                                <div className="w-full flex gap-4">
                                    <Form.Item name={[field.name, 'alias']} noStyle>
                                        <Input placeholder="Alias (Y001)" className="wb-input-transparent font-bold" style={{ width: '80px' }} />
                                    </Form.Item>
                                    <Form.Item name={[field.name, 'addressLine']} noStyle>
                                        <Input.TextArea
                                            placeholder="Full Address (Street, City, Province, Zip)..."
                                            className="wb-input-transparent flex-1"
                                            autoSize={{ minRows: 1, maxRows: 3 }}
                                        />
                                    </Form.Item>
                                </div>
                            ) : <Text type="secondary" italic>No Location Data</Text>
                        }}
                    </Form.List>
                </InfoRow>

                <InfoRow label="Delivery Date">
                    <Form.Item name="deliveryDate" noStyle>
                        <DatePicker showTime format="YYYY-MM-DD HH:mm" className="wb-input-transparent w-full font-bold" suffixIcon={null} placeholder="Select Appointment Date" />
                    </Form.Item>
                </InfoRow>

                <InfoRow label="Reference Code">
                    <Form.Item name="referenceCode" noStyle>
                        <Input className="wb-input-transparent font-mono text-center w-full" placeholder="REF-CODE" />
                    </Form.Item>
                </InfoRow>

                <InfoRow label="Distance (km)">
                    <Form.Item name="distanceKm" noStyle>
                        <InputNumber className="wb-input-transparent font-mono text-center w-full" placeholder="0.0" precision={1} />
                    </Form.Item>
                </InfoRow>
            </div>

            {/* Goods Table */}
            <div className="p-0 mt-8 flex-1">
                <div className="wb-table-wrapper">
                    <table className="wb-table">
                        <thead>
                            <tr>
                                <th style={{ width: '20%' }}>Pallet Count</th>
                                <th style={{ width: '20%' }}>Item Count</th>
                                <th style={{ width: '40%' }}>PRO</th>
                                <th>PO List</th>
                                <th className="w-10 no-print"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <Form.List name="goods">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map((field) => (
                                            <tr key={field.key} className="hover:bg-blue-50 transition-colors">
                                                <td><Form.Item name={[field.name, 'pallets']} noStyle><InputNumber className="wb-input-transparent w-full text-center" controls={false} /></Form.Item></td>
                                                <td><Form.Item name={[field.name, 'items']} noStyle><InputNumber className="wb-input-transparent w-full text-center" controls={false} /></Form.Item></td>
                                                <td><Form.Item name={[field.name, 'proNumber']} noStyle><Input className="wb-input-transparent text-center" /></Form.Item></td>
                                                <td><Form.Item name={[field.name, 'poList']} noStyle><Input className="wb-input-transparent text-center" /></Form.Item></td>
                                                <td className="no-print text-center p-0">
                                                    {!readOnly && <DeleteOutlined className="cursor-pointer text-gray-400 hover:text-red-500 transition-colors" onClick={() => remove(field.name)} />}
                                                </td>
                                            </tr>
                                        ))}
                                        {!readOnly && (
                                            <tr className="no-print hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => add()}>
                                                <td colSpan={5} className="text-center py-2 text-blue-500 text-xs font-bold dashed-border"><PlusOutlined /> Add Goods Line</td>
                                            </tr>
                                        )}
                                    </>
                                )}
                            </Form.List>
                            <tr className="bg-gray-100 font-bold border-t">
                                <td className="pl-4">Total</td>
                                <td><Form.Item name="totalPallets" noStyle><InputNumber className="wb-input-transparent w-full text-center font-bold" readOnly variant="borderless" /></Form.Item></td>
                                <td colSpan={3}></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-black flex mt-auto" style={{ height: 220 }}>
                <div className="w-1/3 border-r border-black p-6 flex flex-col justify-between items-center bg-gray-50 text-center">
                    <div className="w-full flex items-center justify-center gap-2 mt-4">
                        <Text type="secondary" className="text-sm uppercase whitespace-nowrap">Client Name:</Text>
                        <Form.Item name="customerName" noStyle>
                            <Input
                                className="wb-input-transparent font-bold text-base w-40 text-center"
                                placeholder="Enter Name"
                                style={{ borderBottom: '1px solid #d9d9d9', borderRadius: 0, padding: '0 4px' }}
                            />
                        </Form.Item>
                    </div>

                    <div className="text-center text-sm">
                        <Text type="secondary">Authorized Carrier</Text><br />
                        <Text strong>Apony Logistics</Text>
                    </div>
                </div>
                <div className="w-2/3 p-6 flex flex-col relative">
                    <div className="font-bold mb-2">Amazon Stamp:</div>
                    <Text type="secondary" className="absolute top-10 left-6 italic text-xs">(Please stamp and sign here)</Text>

                    <Form.Item name="note" noStyle>
                        {/* Notes might be less relevant if this area is for stamping, reducing size */}
                        <Input.TextArea className="wb-input-transparent flex-1 mt-6 text-sm" placeholder="Notes..." style={{ minHeight: '40px' }} />
                    </Form.Item>

                    <Row gutter={32} justify="end" className="mt-auto">
                        <Col>
                            <Space size="small" direction="vertical" align="center">
                                <Text strong>Time In</Text>
                                {/* Time In is Delivery Date (Read Only) */}
                                <div className="border-b border-black min-w-[100px] h-8 flex items-end justify-center">
                                    {deliveryDate ? dayjs(deliveryDate).format('HH:mm') : '--:--'}
                                </div>
                            </Space>
                        </Col>
                        <Col>
                            <Space size="small" direction="vertical" align="center">
                                <Text strong>Time Out</Text>
                                {/* Time Out is Editable by Driver/Admin */}
                                <Form.Item name="timeOut" noStyle>
                                    <Input className="wb-input-transparent border-b border-black text-center font-bold" style={{ width: '100px', borderBottom: '1px solid black' }} placeholder="--:--" />
                                </Form.Item>
                            </Space>
                        </Col>
                    </Row>
                </div>
            </div>
        </div>
    );
};

const InfoRow: React.FC<{ label: string, children: React.ReactNode }> = ({ label, children }) => (
    <Row className="wb-row-border min-h-[60px]">
        <Col span={6} className="wb-col-border bg-gray-50 flex items-center justify-center font-medium p-2 text-center">
            {label}
        </Col>
        <Col span={18} className="flex items-center p-4">
            {children}
        </Col>
    </Row>
);


/* ====================================================================================
   TEMPLATE B: DEFAULT COMPANY BoL
   ==================================================================================== */
const DefaultTemplateForm: React.FC<{ form: any, readOnly?: boolean }> = ({ form, readOnly }) => (
    <div className="flex flex-col h-full relative">
        {/* Header */}
        <div className="wb-header-row px-0">
            <div className="flex flex-col justify-center">
                <div className="text-3xl font-serif italic font-bold text-blue-900">Apony Inc.</div>
                <Text type="secondary">Logistics & Transportation</Text>
            </div>
            <div className="text-center">
                <Title level={2} style={{ margin: 0, textTransform: 'uppercase' }}>APONY INC.</Title>
                <Title level={5} style={{ margin: 0, letterSpacing: '4px' }}>BILL OF LADING</Title>
            </div>
            <div className="text-right">
                <Text type="secondary" style={{ fontSize: 12 }}>BoL Number</Text>
                <Form.Item name="waybillNumber" noStyle>
                    <Input className="text-right text-lg font-bold font-mono wb-input-transparent" style={{ textAlign: 'right', width: 150 }} placeholder="AUTO-GEN" />
                </Form.Item>
            </div>
        </div>

        {/* Addresses Container */}
        <div className="flex flex-col gap-6">
            <Form.List name="locations">
                {(fields) => {
                    const getField = (type: string) => {
                        const idx = form.getFieldValue('locations')?.findIndex((l: any) => l.type === type);
                        return idx !== undefined && idx !== -1 ? { field: fields[idx], index: idx } : null;
                    };

                    return (
                        <>
                            <AddressSection title="SHIP FROM / PICK UP AT" fieldMeta={getField('PICKUP')} />
                            <AddressSection title="SHIP TO / DELIVER TO" fieldMeta={getField('DROP')} />
                            <AddressSection title="BILL TO" fieldMeta={getField('BILL_TO')} />
                        </>
                    )
                }}
            </Form.List>
        </div>

        {/* Goods Table */}
        <div className="mt-8">
            <div className="wb-table-wrapper">
                <table className="wb-table">
                    <thead>
                        <tr>
                            <th className="pl-4">Bill of Goods</th>
                            <th className="text-center w-24">Pallets</th>
                            <th className="text-center w-24">Items</th>
                            <th className="text-center w-32">Weight</th>
                            <th className="pl-4">Description</th>
                            <th className="w-10 no-print"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <Form.List name="goods">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(f => (
                                        <tr key={f.key} className="hover:bg-blue-50 transition-colors">
                                            <td><Form.Item name={[f.name, 'name']} noStyle><Input className="wb-input-transparent" placeholder="Item Name" /></Form.Item></td>
                                            <td><Form.Item name={[f.name, 'pallets']} noStyle><InputNumber className="wb-input-transparent w-full text-center" controls={false} /></Form.Item></td>
                                            <td><Form.Item name={[f.name, 'items']} noStyle><InputNumber className="wb-input-transparent w-full text-center" controls={false} /></Form.Item></td>
                                            <td><Form.Item name={[f.name, 'weight']} noStyle><Input className="wb-input-transparent text-center" /></Form.Item></td>
                                            <td><Form.Item name={[f.name, 'description']} noStyle><Input className="wb-input-transparent" placeholder="Description" /></Form.Item></td>
                                            <td className="no-print text-center p-0">
                                                {!readOnly && <DeleteOutlined className="cursor-pointer text-gray-400 hover:text-red-500 transition-colors" onClick={() => remove(f.name)} />}
                                            </td>
                                        </tr>
                                    ))}
                                    {!readOnly && (
                                        <tr className="no-print hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => add()}>
                                            <td colSpan={6} className="text-center py-2 text-blue-500 text-xs font-bold dashed-border"><PlusOutlined /> Add Item</td>
                                        </tr>
                                    )}
                                </>
                            )}
                        </Form.List>
                        <tr className="bg-gray-100 font-bold border-t">
                            <td className="pl-4 py-3">Totals:</td>
                            <td><Form.Item name="totalPallets" noStyle><InputNumber className="wb-input-transparent w-full text-center font-bold" readOnly variant="borderless" /></Form.Item></td>
                            <td colSpan={4}></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 border-t-2 border-black pt-6">
            <Row gutter={48}>
                <Col span={12} className="space-y-4">
                    <div className="flex items-center border-b border-gray-200 pb-2">
                        <Text strong className="w-32">Delivery Date: </Text>
                        <Form.Item name="deliveryDate" noStyle>
                            <DatePicker showTime format="YYYY-MM-DD HH:mm" className="wb-input-transparent flex-1" suffixIcon={null} placeholder="Select Date & Time" />
                        </Form.Item>
                    </div>
                    <div className="flex items-center border-b border-gray-200 pb-2">
                        <Text strong className="w-32">Distance (km): </Text>
                        <Form.Item name="distanceKm" noStyle>
                            <InputNumber className="wb-input-transparent flex-1" placeholder="0.0" precision={1} />
                        </Form.Item>
                    </div>
                </Col>
                <Col span={12} className="flex flex-col justify-end">
                    <div className="border-b-2 border-black w-full h-12"></div>
                    <Text strong className="text-center mt-2">Consignee Signature</Text>
                </Col>
            </Row>
        </div>

        {/* Notes Area */}
        <div className="mt-4 border-t border-black pt-2">
            <Text strong>Note:</Text>
            <Form.Item name="note" noStyle><Input.TextArea className="wb-input-transparent" autoSize /></Form.Item>
        </div>
    </div>
);

const AddressSection: React.FC<{ title: string, fieldMeta: any }> = ({ title, fieldMeta }) => {
    if (!fieldMeta) return null;
    const { field } = fieldMeta;

    return (
        <div className="wb-section bg-white">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                <div className="w-2 h-6 bg-blue-600 rounded-sm"></div>
                <Text strong style={{ fontSize: 14, color: '#1890ff', textTransform: 'uppercase' }}>{title}</Text>
            </div>

            <div className="wb-address-grid">
                <div className="wb-label">Company</div>
                <div className="col-span-3"><Form.Item name={[field.name, 'companyName']} noStyle><Input className="wb-input-transparent font-bold border-b border-gray-200" placeholder="Company Name" /></Form.Item></div>

                <div className="wb-label">Address</div>
                <div className="col-span-3">
                    <Form.Item name={[field.name, 'addressLine']} noStyle>
                        <Input.TextArea
                            className="wb-input-transparent border-b border-gray-200"
                            placeholder="Full Address (Street, City, Prov, Postal Code)"
                            autoSize={{ minRows: 2, maxRows: 3 }}
                        />
                    </Form.Item>
                </div>

                <div className="wb-label">Contact</div>
                <div><Form.Item name={[field.name, 'contactPerson']} noStyle><Input className="wb-input-transparent border-b border-gray-200" placeholder="Name" /></Form.Item></div>

                <div className="wb-label pl-4">Phone</div>
                <div><Form.Item name={[field.name, 'phone']} noStyle><Input className="wb-input-transparent border-b border-gray-200" placeholder="(555) 555-5555" /></Form.Item></div>
            </div>
        </div>
    )
}

export default WaybillCreate;
