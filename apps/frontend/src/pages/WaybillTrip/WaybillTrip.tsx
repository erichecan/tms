import React, { useState } from 'react';
import { Table, Button, Card, Typography, Space, Input, Modal, Tag, Alert } from 'antd';
import { CarOutlined, PrinterOutlined, FilePdfOutlined } from '@ant-design/icons';
import { WaybillData } from '../../types/waybill';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// Mock Data Source for Demo
const MOCK_WAYBILLS: WaybillData[] = [
    {
        id: 'wb_1',
        templateType: 'AMAZON',
        waybillNumber: 'Y001-AF',
        deliveryDate: '2025-12-18 12:00',
        driverAlias: 'AF',
        locations: [{ id: 'l1', type: 'FULFILLMENT', alias: 'Y001', companyName: 'Amazon Y001', addressLine: '789 Salem Rd', city: 'Ajax', province: 'ON', postalCode: 'L1Z 1G1', contactPerson: '', phone: '' }],
        goods: [],
        totalPallets: 12,
        status: 'SUBMITTED'
    },
    {
        id: 'wb_2',
        templateType: 'DEFAULT',
        waybillNumber: 'LT-AF',
        deliveryDate: '2025-12-18 14:00',
        driverAlias: 'AF',
        locations: [{ id: 'l2', type: 'PICKUP', alias: 'LT', companyName: 'Letian', addressLine: '675 Harwood Ave', city: 'Ajax', province: 'ON', postalCode: '', contactPerson: '', phone: '' }],
        goods: [],
        totalPallets: 10,
        status: 'SUBMITTED'
    },
    {
        id: 'wb_3',
        templateType: 'AMAZON',
        waybillNumber: 'YYZ1-AF',
        deliveryDate: '2025-12-19 10:00',
        driverAlias: 'AF',
        locations: [{ id: 'l3', type: 'FULFILLMENT', alias: 'YYZ1', companyName: 'Amazon YYZ1', addressLine: 'Creditview Rd', city: 'Brampton', province: 'ON', postalCode: '', contactPerson: '', phone: '' }],
        goods: [],
        totalPallets: 5,
        status: 'SUBMITTED'
    }
];

const WaybillTrip: React.FC = () => {
    const [selectedRows, setSelectedRows] = useState<WaybillData[]>([]);
    const [tripSheetId, setTripSheetId] = useState('');
    const [showManifest, setShowManifest] = useState(false);

    const onSelectChange = (newSelectedRowKeys: React.Key[], selectedRows: WaybillData[]) => {
        setSelectedRows(selectedRows);
    };

    const generateTripSheet = () => {
        if (selectedRows.length === 0) return;

        // Validation: Check if same driver?
        const drivers = new Set(selectedRows.map(r => r.driverAlias).filter(Boolean));
        if (drivers.size > 1) {
            Modal.warning({ title: 'Driver Mismatch', content: 'Selected waybills have different drivers assigned.' });
            return;
        }
        const commonDriver = Array.from(drivers)[0] || '??';

        // Generate ID: Alias1-Alias2-...-Driver
        // Sort aliases to be deterministic? Or sequence based? User implicitly selects sequence?
        // Let's use sequence in list or explicit sort. Here just order of selection (or list).
        const addressAliases = selectedRows.map(r => {
            // Find main alias (Destination for Amazon, Pickup for Default? Or just the primary alias)
            const loc = r.locations.find(l => l.alias);
            return loc?.alias || 'UNK';
        });

        const newId = [...addressAliases, commonDriver].join('-');
        setTripSheetId(newId);
        setShowManifest(true);
    };

    const rowSelection = {
        onChange: onSelectChange,
    };

    const columns = [
        { title: 'Waybill #', dataIndex: 'waybillNumber', key: 'waybillNumber', render: (t: string) => <b>{t}</b> },
        { title: 'Template', dataIndex: 'templateType', key: 'templateType', render: (t: string) => <Tag color={t === 'AMAZON' ? 'orange' : 'blue'}>{t}</Tag> },
        { title: 'Delivery Date', dataIndex: 'deliveryDate', key: 'deliveryDate' },
        { title: 'Driver', dataIndex: 'driverAlias', key: 'driverAlias' },
        { title: 'Pallets', dataIndex: 'totalPallets', key: 'totalPallets' },
    ];

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <Title level={2}>Trip Sheet Management</Title>

            {!showManifest ? (
                <Card title="Select Waybills to Group">
                    <Table
                        dataSource={MOCK_WAYBILLS}
                        columns={columns}
                        rowKey="id"
                        rowSelection={{ type: 'checkbox', ...rowSelection }}
                        pagination={false}
                    />
                    <div className="mt-4 flex justify-end">
                        <Button
                            type="primary"
                            size="large"
                            icon={<CarOutlined />}
                            disabled={selectedRows.length === 0}
                            onClick={generateTripSheet}
                        >
                            Generate Trip Sheet from Selected ({selectedRows.length})
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="flex gap-4">
                    <Card className="w-1/3 h-fit">
                        <Title level={4}>Trip Information</Title>
                        <div className="mb-4">
                            <Text type="secondary">Trip Sheet ID</Text>
                            <div className="text-2xl font-bold text-blue-600">{tripSheetId}</div>
                        </div>
                        <Alert message="Trip Sheet Generated Successfully" type="success" showIcon className="mb-4" />
                        <Space direction="vertical" className="w-full">
                            <Button block onClick={() => setShowManifest(false)}>Back to Selection</Button>
                            <Button block type="primary" icon={<PrinterOutlined />}>Print Manifest</Button>
                            <Button block icon={<FilePdfOutlined />}>Export PDF</Button>
                        </Space>
                    </Card>

                    <Card className="w-2/3" title="Manifest Preview">
                        {/* Simple Manifest List */}
                        <div className="border p-8 bg-white min-h-[500px]">
                            <h1 className="text-center font-bold text-2xl mb-2">TRIP MANIFEST</h1>
                            <h2 className="text-center text-xl mb-8">{tripSheetId}</h2>

                            <table className="w-full border-collapse border">
                                <thead>
                                    <tr className="bg-gray-200">
                                        <th className="border p-2">Seq</th>
                                        <th className="border p-2">Waybill #</th>
                                        <th className="border p-2">Stop Address</th>
                                        <th className="border p-2">Action</th>
                                        <th className="border p-2">Pallets</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedRows.map((wb, idx) => (
                                        <tr key={wb.id}>
                                            <td className="border p-2 text-center">{idx + 1}</td>
                                            <td className="border p-2">{wb.waybillNumber}</td>
                                            <td className="border p-2">
                                                {wb.locations.map(l => (
                                                    <div key={l.id} className="text-sm">
                                                        <Tag>{l.type}</Tag> {l.addressLine}, {l.city}
                                                    </div>
                                                ))}
                                            </td>
                                            <td className="border p-2 text-center">{wb.templateType === 'AMAZON' ? 'DROP' : 'PICK/DROP'}</td>
                                            <td className="border p-2 text-center">{wb.totalPallets}</td>
                                        </tr>
                                    ))}
                                    <tr className="font-bold bg-gray-100">
                                        <td colSpan={4} className="border p-2 text-right">Total:</td>
                                        <td className="border p-2 text-center">{selectedRows.reduce((sum, r) => sum + (r.totalPallets || 0), 0)}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="mt-12 flex justify-between">
                                <div>Driver Signature: __________________</div>
                                <div>Date: __________________</div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default WaybillTrip;
