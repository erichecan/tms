

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logo from './assets/logo.png';

interface GoodsLine {
    pallet_count: string;
    item_count: string;
    pro: string;
    po_list: string;
}

export const WaybillCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    // Template State
    const [templateType, setTemplateType] = useState<'DEFAULT' | 'AMAZON'>('DEFAULT');

    // Common State
    const [waybillNo, setWaybillNo] = useState(`Y${new Date().getFullYear().toString().substr(-2)}01-XXXX`);

    // Default Template State
    const [shipFrom, setShipFrom] = useState({ company: '', contact: '', phone: '', address: '' });
    const [shipTo, setShipTo] = useState({ company: '', contact: '', phone: '', address: '' });

    // Amazon Template State
    const [baseInfo, setBaseInfo] = useState({
        fc_alias: 'Y001',
        fc_address: '',
        delivery_date: '',
        reference_code: ''
    });

    // ... existing goodsLines, footerInfo, pricingLines ...
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

    // Image Placeholders
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
        const isAmazon = templateType === 'AMAZON';

        // Construct payload strictly matching Backend schema where possible, mapping fields
        const payload = {
            waybill_no: waybillNo,
            customer_id: footerInfo.client_name || 'Unknown', // Map Client Name
            origin: isAmazon ? 'Unknown' : shipFrom.address,
            destination: isAmazon ? (baseInfo.fc_address || baseInfo.fc_alias) : shipTo.address,
            fulfillment_center: isAmazon ? baseInfo.fc_alias : 'N/A',
            cargo_desc: `Target: ${baseInfo.reference_code}, Items: ${goodsLines.length}, ShipFrom: ${shipFrom.company}, ShipTo: ${shipTo.company}`,
            price_estimated: Number(footerInfo.price) || 0,
            delivery_date: baseInfo.delivery_date, // Shared field
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'none', cursor: 'pointer', marginBottom: '16px', color: '#6B7280' }}>
                    <ArrowLeft size={20} /> {t('common.back')}
                </button>

                {/* Template Switcher */}
                <div style={{ background: '#F3F4F6', padding: '4px', borderRadius: '8px', display: 'flex', gap: '4px' }}>
                    <button
                        onClick={() => setTemplateType('DEFAULT')}
                        style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: templateType === 'DEFAULT' ? 'white' : 'transparent', fontWeight: 500, boxShadow: templateType === 'DEFAULT' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer' }}
                    >
                        Default
                    </button>
                    <button
                        onClick={() => setTemplateType('AMAZON')}
                        style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: templateType === 'AMAZON' ? 'white' : 'transparent', fontWeight: 500, boxShadow: templateType === 'AMAZON' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer' }}
                    >
                        Amazon
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: '32px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                    <div>
                        <img src={logo} alt="Apony Group" style={{ height: '48px', objectFit: 'contain' }} />
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '12px', color: '#374151' }}>
                        <div>Tel: 437 202 8888</div>
                        <div>Fax: 437 202 8888</div>
                        <div>delivery@aponygroup.com</div>
                        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            <span style={{ fontWeight: 600, fontSize: '14px' }}>{t('waybill.waybillNo')} :</span>
                            <input
                                data-testid="waybill-no-input"
                                value={waybillNo}
                                onChange={(e) => setWaybillNo(e.target.value)}
                                style={{ border: '1px solid #E5E7EB', padding: '4px 8px', borderRadius: '4px', textAlign: 'right', width: '120px' }}
                            />
                        </div>
                    </div>
                </div>

                {templateType === 'AMAZON' ? (
                    <>
                        {/* ISA Section (Amazon Only) */}
                        <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px', marginBottom: '24px', display: 'flex', gap: '24px' }}>
                            <div style={{ width: '200px', fontWeight: 700, fontSize: '16px', color: '#374151' }}>
                                {t('waybill.form.isa')}
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
                                            <span>{t('waybill.form.isaPlaceholder')}</span>
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
                                            <span>{t('waybill.form.barcodePlaceholder')}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Base Info (Amazon Only) */}
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <div style={{ width: '4px', height: '16px', background: 'var(--color-primary)' }}></div>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{t('waybill.form.baseInfo')}</h3>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, auto) 1fr', gap: '16px 24px', alignItems: 'center' }}>
                                <label style={{ fontSize: '14px', color: '#6B7280', textAlign: 'right' }}>
                                    <span style={{ color: 'red' }}>*</span> {t('waybill.form.fulfillmentCenter')}
                                </label>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <input
                                        data-testid="fc-alias-input"
                                        name="fc_alias"
                                        value={baseInfo.fc_alias} onChange={handleBaseChange}
                                        style={{ width: '120px', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
                                    />
                                    <input
                                        data-testid="fc-address-input"
                                        name="fc_address"
                                        placeholder="Full Address"
                                        value={baseInfo.fc_address} onChange={handleBaseChange}
                                        style={{ flex: 1, padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px', background: '#F9FAFB' }}
                                    />
                                </div>

                                <label style={{ fontSize: '14px', color: '#6B7280', textAlign: 'right' }}>
                                    <span style={{ color: 'red' }}>*</span> {t('waybill.form.deliveryDate')}
                                </label>
                                <input
                                    data-testid="delivery-date-input"
                                    type="date"
                                    name="delivery_date"
                                    value={baseInfo.delivery_date} onChange={handleBaseChange}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
                                />

                                <label style={{ fontSize: '14px', color: '#6B7280', textAlign: 'right' }}>
                                    {t('waybill.form.referenceCode')}
                                </label>
                                <input
                                    name="reference_code"
                                    placeholder="REF-CODE"
                                    value={baseInfo.reference_code} onChange={handleBaseChange}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Default Template: Ship From / Ship To */}
                        <div style={{ display: 'flex', gap: '40px', marginBottom: '32px' }}>

                            {/* SHIP FROM */}
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <div style={{ width: '4px', height: '16px', background: 'var(--color-primary)' }}></div>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>SHIP FROM / PICK UP AT</h3>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr', gap: '24px' }}>
                                    <div>
                                        <label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Company Name</label>
                                        <input
                                            value={shipFrom.company}
                                            onChange={e => setShipFrom({ ...shipFrom, company: e.target.value })}
                                            placeholder="Company Name"
                                            style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Contact Person</label>
                                        <input
                                            value={shipFrom.contact}
                                            onChange={e => setShipFrom({ ...shipFrom, contact: e.target.value })}
                                            placeholder="Contact Person"
                                            style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Phone</label>
                                        <input
                                            value={shipFrom.phone}
                                            onChange={e => setShipFrom({ ...shipFrom, phone: e.target.value })}
                                            placeholder="Phone"
                                            style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: '4px' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ marginTop: '12px' }}>
                                    <label style={{ fontSize: '11px', color: '#6B7280' }}>Address Line</label>
                                    <input
                                        data-testid="ship-from-address"
                                        value={shipFrom.address}
                                        onChange={e => setShipFrom({ ...shipFrom, address: e.target.value })}
                                        placeholder="Full Address"
                                        style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: '4px' }}
                                    />
                                </div>
                            </div>

                        </div>

                        <div style={{ display: 'flex', gap: '40px', marginBottom: '32px' }}>
                            {/* SHIP TO */}
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <div style={{ width: '4px', height: '16px', background: 'var(--color-primary)' }}></div>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>SHIP TO / DELIVER TO</h3>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr', gap: '24px' }}>
                                    <div>
                                        <label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Company Name</label>
                                        <input
                                            value={shipTo.company}
                                            onChange={e => setShipTo({ ...shipTo, company: e.target.value })}
                                            placeholder="Company Name"
                                            style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Contact Person</label>
                                        <input
                                            value={shipTo.contact}
                                            onChange={e => setShipTo({ ...shipTo, contact: e.target.value })}
                                            placeholder="Contact Person"
                                            style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Phone</label>
                                        <input
                                            value={shipTo.phone}
                                            onChange={e => setShipTo({ ...shipTo, phone: e.target.value })}
                                            placeholder="Phone"
                                            style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: '4px' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ marginTop: '12px' }}>
                                    <label style={{ fontSize: '11px', color: '#6B7280' }}>Address Line</label>
                                    <input
                                        data-testid="ship-to-address"
                                        value={shipTo.address}
                                        onChange={e => setShipTo({ ...shipTo, address: e.target.value })}
                                        placeholder="Full Address"
                                        style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: '4px' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Shared Delivery Date for Default Template */}
                        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <label style={{ fontSize: '14px', color: '#6B7280' }}>
                                <span style={{ color: 'red' }}>*</span> {t('waybill.form.deliveryDate')}
                            </label>
                            <input
                                data-testid="delivery-date-input"
                                type="date"
                                value={baseInfo.delivery_date} onChange={(e) => setBaseInfo({ ...baseInfo, delivery_date: e.target.value })}
                                style={{ padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
                            />
                        </div>
                    </>
                )}

                {/* Items Info (Shared) */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <div style={{ width: '4px', height: '16px', background: 'var(--color-primary)' }}></div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{t('waybill.form.itemsInfo')}</h3>
                    </div>

                    <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '40px 100px 100px 1fr 1fr 40px', gap: '12px', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>
                            <div style={{ textAlign: 'center' }}>No.</div>
                            <div>{t('waybill.form.palletCount')}</div>
                            <div>{t('waybill.form.itemCount')}</div>
                            <div>{t('waybill.form.pro')}</div>
                            <div>{t('waybill.form.poList')}</div>
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
                            <Plus size={16} /> {t('waybill.form.addGoodsLine')}
                        </button>
                    </div>
                </div>

                {/* Footer Info (Shared) */}
                <div style={{ marginBottom: '32px' }}>
                    <label style={{ display: 'block', fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
                        Customer Sign (Please stamp and sign here)
                    </label>
                    <div style={{ height: '100px', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '16px' }}></div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, auto) 1fr', gap: '16px 24px', alignItems: 'center' }}>
                        <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151', textAlign: 'right' }}>{t('waybill.form.timeIn')}</label>
                        <input name="time_in" value={footerInfo.time_in} onChange={handleFooterChange} placeholder="-- : --" style={{ width: '120px', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }} />

                        <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151', textAlign: 'right' }}>{t('waybill.form.timeOut')}</label>
                        <input name="time_out" value={footerInfo.time_out} onChange={handleFooterChange} placeholder="-- : --" style={{ width: '120px', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }} />
                    </div>

                    <div style={{ borderTop: '1px solid #F3F4F6', margin: '24px 0' }}></div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, auto) 280px', gap: '16px 24px', alignItems: 'center' }}>
                        <label style={{ fontSize: '14px', color: '#6B7280', textAlign: 'right' }}>{t('waybill.form.clientName')}:</label>
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
                                <Plus size={14} /> {t('common.add')}
                            </button>
                        </div>

                        <label style={{ fontSize: '14px', color: '#6B7280', textAlign: 'right' }}>{t('waybill.form.distance')}</label>
                        <input name="distance" value={footerInfo.distance} onChange={handleFooterChange} type="number" style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }} />

                        <label style={{ fontSize: '14px', color: '#6B7280', textAlign: 'right' }}>Price</label>
                        <input
                            data-testid="price-input"
                            name="price"
                            value={footerInfo.price}
                            onChange={handleFooterChange}
                            type="number"
                            placeholder="0.00"
                            style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
                        />
                    </div>
                </div>

                {/* Global Action */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
                    <button data-testid="submit-waybill-btn" onClick={handleSubmit} className="btn-primary" style={{ padding: '12px 64px', fontSize: '16px' }}>
                        {t('waybill.form.createButton')}
                    </button>
                </div>

            </div>
        </div>
    );
};
