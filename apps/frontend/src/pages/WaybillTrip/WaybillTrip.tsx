
import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Typography, Space, Modal, Tag, Alert, message, InputNumber, Form } from 'antd';
import { CarOutlined, PrinterOutlined, FilePdfOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Shipment } from '../../types';
import { shipmentsApi, tripsApi } from '../../services/api';

const { Title, Text } = Typography;

const WaybillTrip: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [selectedRows, setSelectedRows] = useState<Shipment[]>([]);
    const [tripSheetId, setTripSheetId] = useState('');
    const [showManifest, setShowManifest] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    const fetchShipments = async () => {
        setLoading(true);
        try {
            // Fetch active/submitted shipments that are not yet on a trip
            // Assuming filter support or processed client-side for now
            const response = await shipmentsApi.getShipments({ status: 'committed' }); // Adjust status as needed
            if (response.data && Array.isArray(response.data.data)) {
                // Client-side filter: only those without tripId
                const available = response.data.data.filter((s: Shipment) => !s.tripId);
                setShipments(available);
            } else if (Array.isArray(response.data)) {
                const available = response.data.filter((s: Shipment) => !s.tripId);
                setShipments(available);
            }
        } catch (error) {
            console.error('Failed to fetch shipments:', error);
            message.error('Failed to load shipments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShipments();
    }, []);

    // 2025-10-02 02:55:10
    useEffect(() => {
        // 2025-12-26: Check for pre-selected shipments passed from other pages (e.g., Mount Trip modal)
        const state = location.state as { selectedShipmentIds?: string[] } | null;
        if (shipments.length > 0 && state?.selectedShipmentIds && Array.isArray(state.selectedShipmentIds)) {
            const selectedIds = new Set(state.selectedShipmentIds);
            const preSelected = shipments.filter(s => selectedIds.has(s.id));
            setSelectedRows(preSelected);
            // Optionally clear state to prevent re-selection on refresh? No, let it persist for now.
        }
    }, [shipments, location.state]); // Add location.state dependency

    const onSelectChange = (newSelectedRowKeys: React.Key[], selectedRowsValues: Shipment[]) => {
        // use newSelectedRowKeys if needed or ignore with underscore
        console.debug('Selected keys:', newSelectedRowKeys);
        setSelectedRows(selectedRowsValues);
    };

    const handleInitialGenerate = () => {
        if (selectedRows.length === 0) return;

        // Validation: Check if same driver and vehicle
        const drivers = new Set(selectedRows.map(r => r.driverId).filter(Boolean));
        if (drivers.size > 1) {
            Modal.warning({ title: 'Driver Mismatch', content: 'Selected waybills must have the same driver assigned.' });
            return;
        }

        // Vehicle check - checking vehicleId
        const vehicles = new Set(selectedRows.map(r => r.vehicleId).filter(Boolean));
        if (vehicles.size > 1) {
            Modal.warning({ title: 'Vehicle Mismatch', content: 'Selected waybills must have the same vehicle assigned.' });
            return;
        }

        setIsModalVisible(true);
        // Calculate default values if needed
        const totalDriverFees = selectedRows.reduce((sum, s) => sum + (s.driverFee || 0), 0);
        form.setFieldsValue({ tripFee: totalDriverFees > 0 ? totalDriverFees : undefined });
    };

    const handleCreateTrip = async () => {
        try {
            const values = await form.validateFields();
            const driverId = selectedRows[0].driverId;
            const vehicleId = selectedRows[0].vehicleId;

            if (!driverId || !vehicleId) {
                message.error('Selected shipments must have a driver and vehicle assigned');
                return;
            }

            const tripPayload = {
                tripNo: `TRIP-${dayjs().format('YYYYMMDDHHmmss')}`,
                status: 'planned', // Fixed from planning to planned
                driverId: driverId,
                vehicleId: vehicleId,
                shipments: selectedRows.map(s => s.id),
                tripFee: values.tripFee,
                startTimePlanned: dayjs().toISOString(), // Default to now/today
            };

            const response = await tripsApi.createTrip(tripPayload);

            if (response.data) {
                message.success('Trip created successfully');
                setTripSheetId(response.data.tripNo || response.data.id);
                setShowManifest(true);
                setIsModalVisible(false);
                fetchShipments(); // Refresh list
                setSelectedRows([]);
            }
        } catch (error) {
            console.error('Create trip failed:', error);
            message.error('Failed to create trip');
        }
    };

    const rowSelection = {
        onChange: onSelectChange,
        selectedRowKeys: selectedRows.map(r => r.id),
    };

    const columns = [
        {
            title: 'Waybill #',
            dataIndex: 'shipmentNumber',
            key: 'shipmentNumber',
            render: (t: string, r: Shipment) => <b>{t || (r as any).shipmentNo || r.id}</b>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (t: string) => <Tag color="blue">{t}</Tag>
        },
        {
            title: 'Delivery Date',
            dataIndex: 'deliveryAt',
            key: 'deliveryAt',
            render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-'
        },
        {
            title: 'Driver ID',
            dataIndex: 'driverId',
            key: 'driverId'
        },
        {
            title: 'Fee',
            dataIndex: 'driverFee',
            key: 'driverFee',
            render: (val: number) => val ? `$${val.toFixed(2)}` : '-'
        },
    ];

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-4">
                <Title level={2}>Trip Sheet Management</Title>
                <Button icon={<ReloadOutlined />} onClick={fetchShipments}>Refresh</Button>
            </div>

            {!showManifest ? (
                <Card title="Select Waybills to Group">
                    <Table
                        dataSource={shipments}
                        columns={columns}
                        rowKey="id"
                        rowSelection={{ type: 'checkbox', ...rowSelection }}
                        pagination={false}
                        loading={loading}
                    />
                    <div className="mt-4 flex justify-end">
                        <Button
                            type="primary"
                            size="large"
                            icon={<CarOutlined />}
                            disabled={selectedRows.length === 0}
                            onClick={handleInitialGenerate}
                        >
                            Generate Trip Sheet ({selectedRows.length})
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
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedRows.map((wb, idx) => (
                                        <tr key={wb.id}>
                                            <td className="border p-2 text-center">{idx + 1}</td>
                                            <td className="border p-2">{(wb as any).shipmentNumber || (wb as any).shipmentNo || wb.id}</td>
                                            <td className="border p-2">
                                                {wb.deliveryAddress?.city}, {(wb.deliveryAddress as any)?.street || wb.deliveryAddress?.addressLine1}
                                            </td>
                                            <td className="border p-2 text-center">DELIVERY</td>
                                        </tr>
                                    ))}
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

            <Modal
                title="Create Trip"
                open={isModalVisible}
                onOk={handleCreateTrip}
                onCancel={() => setIsModalVisible(false)}
            >
                <Form form={form} layout="vertical">
                    <Alert
                        message="Trip Processing"
                        description={`Creating trip for ${selectedRows.length} shipments. Driver: ${selectedRows[0]?.driverId || 'N/A'}`}
                        type="info"
                        className="mb-4"
                    />
                    <Form.Item label="Trip Fee (Flat Rate Override)" name="tripFee" tooltip="If set, this flat fee overrides individual shipment driver fees for salary calculation.">
                        <InputNumber style={{ width: '100%' }} prefix="$" precision={2} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default WaybillTrip;
