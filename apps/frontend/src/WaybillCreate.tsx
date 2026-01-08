
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface GoodsLine {
    pallet_count: string;
    item_count: string;
    pro: string;
    po_list: string;
}

export const WaybillCreate = () => {
    const navigate = useNavigate();
    // Form State
    const [waybillNo, setWaybillNo] = useState(`Y${new Date().getFullYear().toString().substr(-2)}01-XXXX`);
    const [baseInfo, setBaseInfo] = useState({
        fc_alias: 'Y001',
        fc_address: '',
        delivery_date: '',
        reference_code: ''
    });
    const [goodsLines, setGoodsLines] = useState<GoodsLine[]>([
        { pallet_count: '0', item_count: '0', pro: '', po_list: '' },
        { pallet_count: '0', item_count: '0', pro: '', po_list: '' }
    ]);
    const [footerInfo, setFooterInfo] = useState({
        time_in: '',
        time_out: '',
        client_name: '',
        distance: '0',
        price: '0'
    });

    // Image Placeholders (No actual upload logic for MVP to avoid complexity)
    const [isaImage, setIsaImage] = useState<string | null>(null);
    const [barcodeImage, setBarcodeImage] = useState<string | null>(null);

    const handleBaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBaseInfo({ ...baseInfo, [e.target.name]: e.target.value });
    };

    const handleFooterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFooterInfo({ ...footerInfo, [e.target.name]: e.target.value });
    };

    const handleLineChange = (index: number, field: keyof GoodsLine, value: string) => {
        const newLines = [...goodsLines];
        newLines[index][field] = value;
        setGoodsLines(newLines);
    };

    const addLine = () => {
        setGoodsLines([...goodsLines, { pallet_count: '0', item_count: '0', pro: '', po_list: '' }]);
    };

    const removeLine = (index: number) => {
        if (goodsLines.length > 1) {
            setGoodsLines(goodsLines.filter((_, i) => i !== index));
        }
    };

    const handlePaste = (e: React.ClipboardEvent, setImage: (s: string) => void) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        if (event.target?.result) setImage(event.target.result as string);
                    };
                    reader.readAsDataURL(blob);
                }
            }
        }
    };

    const handleSubmit = async () => {
        // Construct payload strictly matching Backend schema where possible, mapping fields
        const payload = {
            waybill_no: waybillNo,
            customer_id: footerInfo.client_name || 'Unknown', // Map Client Name
            origin: 'Unknown', // Not in this specific form, assume derived or default
            destination: baseInfo.fc_address || baseInfo.fc_alias,
            fulfillment_center: baseInfo.fc_alias,
            cargo_desc: `Target: ${baseInfo.reference_code}, Items: ${goodsLines.length}`,
            price_estimated: Number(footerInfo.price),
            delivery_date: baseInfo.delivery_date,
            // Store complex data as JSON string in cargo_desc or separate field if Schema allows. 
            // For MVP, we map what we can and mock the rest.
            created_at: new Date().toISOString(),
            status: 'NEW'
        };

        try {
            const res = await fetch('http://localhost:3001/api/waybills', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                navigate('/');
            } else {
                alert('Failed to create waybill');
            }
        } catch (err) {
            console.error(err);
            alert('Error connecting to server');
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
            <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'none', cursor: 'pointer', marginBottom: '16px', color: '#6B7280' }}>
                <ArrowLeft size={20} /> Back to Dashboard
            </button>

            <div className="card" style={{ padding: '32px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: 'black', letterSpacing: '-1px' }}>
                            Apony <span style={{ fontSize: '14px', fontWeight: 400, color: '#6B7280', display: 'block', marginTop: '-4px' }}>Group</span>
                        </h1>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '12px', color: '#374151' }}>
                        <div>Tel: 437 888 8888</div>
                        <div>Fax: 437 888 8888</div>
                        <div>delivery@aponygroup.com</div>
                        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            <span style={{ fontWeight: 600, fontSize: '14px' }}>waybill number :</span>
                            <input
                                value={waybillNo}
                                onChange={(e) => setWaybillNo(e.target.value)}
                                style={{ border: '1px solid #E5E7EB', padding: '4px 8px', borderRadius: '4px', textAlign: 'right', width: '120px' }}
                            />
                        </div>
                    </div>
                </div>

                {/* ISA Section */}
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px', marginBottom: '24px', display: 'flex', gap: '24px' }}>
                    <div style={{ width: '200px', fontWeight: 700, fontSize: '16px', color: '#374151' }}>
                        Shipment Appointment<br />(ISA)
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div
                            onPaste={(e) => handlePaste(e, setIsaImage)}
                            style={{
                                height: '80px', border: '1px dashed #D1D5DB', borderRadius: '6px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                                background: '#F9FAFB', color: '#9CA3AF', fontSize: '12px', cursor: 'text', overflow: 'hidden'
                            }}
                        >
                            {isaImage ? <img src={isaImage} alt="ISA" style={{ height: '100%', objectFit: 'contain' }} /> : (
                                <>
                                    <span>ISA Number (Image)</span>
                                    <span>Paste ISA # (Click & Paste Ctrl+V)</span>
                                </>
                            )}
                        </div>
                        <div
                            onPaste={(e) => handlePaste(e, setBarcodeImage)}
                            style={{
                                height: '80px', border: '1px dashed #D1D5DB', borderRadius: '6px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                                background: '#F9FAFB', color: '#9CA3AF', fontSize: '12px', cursor: 'text', overflow: 'hidden'
                            }}
                        >
                            {barcodeImage ? <img src={barcodeImage} alt="Barcode" style={{ height: '100%', objectFit: 'contain' }} /> : (
                                <>
                                    <span>Barcode (Image)</span>
                                    <span>Paste Barcode (Click & Paste Ctrl+V)</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Base Info */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <div style={{ width: '4px', height: '16px', background: 'var(--color-primary)' }}></div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Base Info</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, auto) 1fr', gap: '16px 24px', alignItems: 'center' }}>
                        <label style={{ fontSize: '14px', color: '#6B7280', textAlign: 'right' }}>
                            <span style={{ color: 'red' }}>*</span> Fulfillment Center (Alias)
                        </label>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <input
                                name="fc_alias"
                                value={baseInfo.fc_alias} onChange={handleBaseChange}
                                style={{ width: '120px', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
                            />
                            <input
                                name="fc_address"
                                placeholder="Full Address"
                                value={baseInfo.fc_address} onChange={handleBaseChange}
                                style={{ flex: 1, padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px', background: '#F9FAFB' }}
                            />
                        </div>

                        <label style={{ fontSize: '14px', color: '#6B7280', textAlign: 'right' }}>
                            <span style={{ color: 'red' }}>*</span> Delivery Date
                        </label>
                        <input
                            type="date"
                            name="delivery_date"
                            value={baseInfo.delivery_date} onChange={handleBaseChange}
                            style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
                        />

                        <label style={{ fontSize: '14px', color: '#6B7280', textAlign: 'right' }}>
                            Reference Code
                        </label>
                        <input
                            name="reference_code"
                            placeholder="REF-CODE"
                            value={baseInfo.reference_code} onChange={handleBaseChange}
                            style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
                        />
                    </div>
                </div>

                {/* Items Info */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <div style={{ width: '4px', height: '16px', background: 'var(--color-primary)' }}></div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Items Info</h3>
                    </div>

                    <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '40px 100px 100px 1fr 1fr 40px', gap: '12px', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>
                            <div style={{ textAlign: 'center' }}>No.</div>
                            <div>Pallet Count</div>
                            <div>Item Count</div>
                            <div>PRO</div>
                            <div>PO List</div>
                            <div></div>
                        </div>

                        {goodsLines.map((line, idx) => (
                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '40px 100px 100px 1fr 1fr 40px', gap: '12px', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontSize: '14px' }}>{idx + 1}</div>
                                <input value={line.pallet_count} onChange={(e) => handleLineChange(idx, 'pallet_count', e.target.value)} style={{ padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }} />
                                <input value={line.item_count} onChange={(e) => handleLineChange(idx, 'item_count', e.target.value)} style={{ padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }} />
                                <input value={line.pro} onChange={(e) => handleLineChange(idx, 'pro', e.target.value)} style={{ padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }} />
                                <input value={line.po_list} onChange={(e) => handleLineChange(idx, 'po_list', e.target.value)} style={{ padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }} />
                                <button onClick={() => removeLine(idx)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                            </div>
                        ))}

                        <button
                            onClick={addLine}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#374151', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, padding: 0 }}
                        >
                            <Plus size={16} /> Add Goods Line
                        </button>
                    </div>
                </div>

                {/* Footer Info */}
                <div style={{ marginBottom: '32px' }}>
                    <label style={{ display: 'block', fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
                        Amazon Stamp: <span style={{ color: '#9CA3AF' }}>(Please stamp and sign here)</span>
                    </label>
                    <div style={{ height: '100px', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '16px' }}></div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, auto) 1fr', gap: '16px 24px', alignItems: 'center' }}>
                        <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151', textAlign: 'right' }}>Time In</label>
                        <input name="time_in" value={footerInfo.time_in} onChange={handleFooterChange} placeholder="-- : --" style={{ width: '120px', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }} />

                        <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151', textAlign: 'right' }}>Time Out</label>
                        <input name="time_out" value={footerInfo.time_out} onChange={handleFooterChange} placeholder="-- : --" style={{ width: '120px', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }} />
                    </div>

                    <div style={{ borderTop: '1px solid #F3F4F6', margin: '24px 0' }}></div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, auto) 320px', gap: '16px 24px', alignItems: 'center' }}>
                        <label style={{ fontSize: '14px', color: '#6B7280', textAlign: 'right' }}>Client Name:</label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <select
                                name="client_name" value={footerInfo.client_name} onChange={handleFooterChange}
                                style={{ flex: 1, padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
                            >
                                <option value="">Select Client</option>
                                <option value="Customer A">Customer A</option>
                                <option value="Customer B">Customer B</option>
                            </select>
                            <button style={{ padding: '8px 12px', border: '1px dashed #D1D5DB', background: 'white', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                                <Plus size={14} /> Add
                            </button>
                        </div>

                        <label style={{ fontSize: '14px', color: '#6B7280', textAlign: 'right' }}>Distance (km)</label>
                        <input name="distance" value={footerInfo.distance} onChange={handleFooterChange} type="number" style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }} />

                        <label style={{ fontSize: '14px', color: '#6B7280', textAlign: 'right', fontWeight: 700 }}>Price</label>
                        <input name="price" value={footerInfo.price} onChange={handleFooterChange} type="number" style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }} />
                    </div>
                </div>

                {/* Global Action */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
                    <button onClick={handleSubmit} className="btn-primary" style={{ padding: '12px 64px', fontSize: '16px' }}>
                        Create Waybill
                    </button>
                </div>

            </div>
        </div>
    );
};
