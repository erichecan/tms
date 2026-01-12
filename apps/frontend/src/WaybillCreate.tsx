
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Calculator, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logo from './assets/logo.png';
import { createPlacesAutocomplete } from './services/mapsService';
import { calculatePrice, type PricingResult } from './services/pricingService';

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

    // Goods & Footer State
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

    // Pricing Integration State
    const [businessType, setBusinessType] = useState('STANDARD');
    const [waitingTime, setWaitingTime] = useState(0);
    const [pricingResult, setPricingResult] = useState<PricingResult | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [pickupCoords, setPickupCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number, lng: number } | null>(null);

    const shipFromRef = useRef<HTMLInputElement>(null);
    const shipToRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (templateType === 'DEFAULT') {
            if (shipFromRef.current) {
                createPlacesAutocomplete(shipFromRef.current, {
                    onPlaceSelected: (place) => {
                        if (place.geometry?.location) {
                            setShipFrom(prev => ({ ...prev, address: place.formatted_address || '' }));
                            setPickupCoords({
                                lat: place.geometry.location.lat(),
                                lng: place.geometry.location.lng()
                            });
                        }
                    }
                });
            }
            if (shipToRef.current) {
                createPlacesAutocomplete(shipToRef.current, {
                    onPlaceSelected: (place) => {
                        if (place.geometry?.location) {
                            setShipTo(prev => ({ ...prev, address: place.formatted_address || '' }));
                            setDeliveryCoords({
                                lat: place.geometry.location.lat(),
                                lng: place.geometry.location.lng()
                            });
                        }
                    }
                });
            }
        }
    }, [templateType]);

    useEffect(() => {
        const triggerCalculation = async () => {
            if (pickupCoords && deliveryCoords && templateType === 'DEFAULT') {
                setIsCalculating(true);
                try {
                    const result = await calculatePrice({
                        pickupAddress: {
                            formattedAddress: shipFrom.address,
                            latitude: pickupCoords.lat,
                            longitude: pickupCoords.lng
                        },
                        deliveryAddress: {
                            formattedAddress: shipTo.address,
                            latitude: deliveryCoords.lat,
                            longitude: deliveryCoords.lng
                        },
                        businessType,
                        waitingTimeLimit: waitingTime
                    });
                    setPricingResult(result);
                    setFooterInfo(prev => ({
                        ...prev,
                        price: result.totalRevenue.toFixed(2),
                        distance: result.distance.toFixed(1)
                    }));
                } catch (err) {
                    console.error("Pricing calculation failed", err);
                } finally {
                    setIsCalculating(false);
                }
            }
        };
        const timer = setTimeout(triggerCalculation, 500); // Debounce
        return () => clearTimeout(timer);
    }, [pickupCoords, deliveryCoords, businessType, waitingTime, templateType]);

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
        const payload = {
            waybill_no: waybillNo,
            customer_id: footerInfo.client_name || 'Unknown',
            origin: isAmazon ? 'Unknown' : shipFrom.address,
            destination: isAmazon ? (baseInfo.fc_address || baseInfo.fc_alias) : shipTo.address,
            fulfillment_center: isAmazon ? baseInfo.fc_alias : 'N/A',
            cargo_desc: `Target: ${baseInfo.reference_code}, Items: ${goodsLines.length}, ShipFrom: ${shipFrom.company}, ShipTo: ${shipTo.company}`,
            price_estimated: Number(footerInfo.price) || 0,
            delivery_date: baseInfo.delivery_date,
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
                    <div style={{ marginBottom: '32px' }}>
                        <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px', marginBottom: '24px', display: 'flex', gap: '24px' }}>
                            <div style={{ width: '200px', fontWeight: 700, fontSize: '16px', color: '#374151' }}>{t('waybill.form.isa')}</div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div onPaste={(e) => handlePaste(e, setIsaImage)} style={{ height: '80px', border: '1px dashed #D1D5DB', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', color: '#9CA3AF', fontSize: '12px', cursor: 'text', overflow: 'hidden' }}>
                                    {isaImage ? <img src={isaImage} alt="ISA" style={{ height: '100%', objectFit: 'contain' }} /> : <span>{t('waybill.form.isaPlaceholder')}</span>}
                                </div>
                                <div onPaste={(e) => handlePaste(e, setBarcodeImage)} style={{ height: '80px', border: '1px dashed #D1D5DB', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', color: '#9CA3AF', fontSize: '12px', cursor: 'text', overflow: 'hidden' }}>
                                    {barcodeImage ? <img src={barcodeImage} alt="Barcode" style={{ height: '100%', objectFit: 'contain' }} /> : <span>{t('waybill.form.barcodePlaceholder')}</span>}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, auto) 1fr', gap: '16px 24px', alignItems: 'center' }}>
                            <label style={{ fontSize: '14px', color: '#6B7280', textAlign: 'right' }}><span style={{ color: 'red' }}>*</span> {t('waybill.form.fulfillmentCenter')}</label>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <input name="fc_alias" value={baseInfo.fc_alias} onChange={handleBaseChange} style={{ width: '120px', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }} />
                                <input name="fc_address" placeholder="Full Address" value={baseInfo.fc_address} onChange={handleBaseChange} style={{ flex: 1, padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px', background: '#F9FAFB' }} />
                            </div>
                            <label style={{ fontSize: '14px', color: '#6B7280', textAlign: 'right' }}><span style={{ color: 'red' }}>*</span> {t('waybill.form.deliveryDate')}</label>
                            <input type="date" name="delivery_date" value={baseInfo.delivery_date} onChange={handleBaseChange} style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }} />
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', gap: '40px', marginBottom: '32px' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <div style={{ width: '4px', height: '16px', background: 'var(--color-primary)' }}></div>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>SHIP FROM / PICK UP AT</h3>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr', gap: '24px' }}>
                                    <div>
                                        <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Company</label>
                                        <input value={shipFrom.company} onChange={e => setShipFrom({ ...shipFrom, company: e.target.value })} placeholder="Company Name" style={{ width: '100%', padding: '10px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Contact</label>
                                        <input value={shipFrom.contact} onChange={e => setShipFrom({ ...shipFrom, contact: e.target.value })} placeholder="Name" style={{ width: '100%', padding: '10px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Phone</label>
                                        <input value={shipFrom.phone} onChange={e => setShipFrom({ ...shipFrom, phone: e.target.value })} placeholder="Phone" style={{ width: '100%', padding: '10px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px' }} />
                                    </div>
                                </div>
                                <div style={{ marginTop: '12px' }}>
                                    <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Origin Address</label>
                                    <input
                                        ref={shipFromRef}
                                        data-testid="ship-from-address"
                                        value={shipFrom.address}
                                        onChange={e => setShipFrom({ ...shipFrom, address: e.target.value })}
                                        placeholder="Type to search address..."
                                        style={{ width: '100%', padding: '10px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', background: '#F8FAFC' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '40px', marginBottom: '32px' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <div style={{ width: '4px', height: '16px', background: 'var(--color-primary)' }}></div>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>SHIP TO / DELIVER TO</h3>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr', gap: '24px' }}>
                                    <div>
                                        <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Company</label>
                                        <input value={shipTo.company} onChange={e => setShipTo({ ...shipTo, company: e.target.value })} placeholder="Company Name" style={{ width: '100%', padding: '10px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Contact</label>
                                        <input value={shipTo.contact} onChange={e => setShipTo({ ...shipTo, contact: e.target.value })} placeholder="Name" style={{ width: '100%', padding: '10px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Phone</label>
                                        <input value={shipTo.phone} onChange={e => setShipTo({ ...shipTo, phone: e.target.value })} placeholder="Phone" style={{ width: '100%', padding: '10px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px' }} />
                                    </div>
                                </div>
                                <div style={{ marginTop: '12px' }}>
                                    <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Destination Address</label>
                                    <input
                                        ref={shipToRef}
                                        data-testid="ship-to-address"
                                        value={shipTo.address}
                                        onChange={e => setShipTo({ ...shipTo, address: e.target.value })}
                                        placeholder="Type to search address..."
                                        style={{ width: '100%', padding: '10px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', background: '#F8FAFC' }}
                                    />
                                </div>
                            </div>
                        </div>

                    </>
                )}

                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>{t('waybill.form.itemsInfo')}</h3>
                    <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px' }}>
                        {goodsLines.map((line, idx) => (
                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '40px 100px 100px 1fr 1fr 40px', gap: '12px', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{idx + 1}</div>
                                <input value={line.pallet_count} onChange={e => handleLineChange(idx, 'pallet_count', e.target.value)} style={{ padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }} />
                                <input value={line.item_count} onChange={e => handleLineChange(idx, 'item_count', e.target.value)} style={{ padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }} />
                                <input value={line.pro} onChange={e => handleLineChange(idx, 'pro', e.target.value)} style={{ padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }} />
                                <input value={line.po_list} onChange={e => handleLineChange(idx, 'po_list', e.target.value)} style={{ padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }} />
                                <button onClick={() => removeLine(idx)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                            </div>
                        ))}
                        <button onClick={addLine} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><Plus size={16} /> Add Line</button>
                    </div>
                </div>

                <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
                        <div>
                            <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>Time In</label>
                            <input name="time_in" value={footerInfo.time_in} onChange={handleFooterChange} placeholder="00:00" style={{ padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>Time Out</label>
                            <input name="time_out" value={footerInfo.time_out} onChange={handleFooterChange} placeholder="00:00" style={{ padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '24px' }}>
                        <div>
                            <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>Client</label>
                            <select
                                data-testid="client-name-select"
                                name="client_name"
                                value={footerInfo.client_name}
                                onChange={handleFooterChange}
                                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
                            >
                                <option value="">Select</option>
                                <option value="Customer A">Client A</option>
                                <option value="Customer B">Client B</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>Distance</label>
                            <input
                                data-testid="distance-input"
                                name="distance"
                                value={footerInfo.distance}
                                onChange={handleFooterChange}
                                type="number"
                                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>Price</label>
                            <input
                                data-testid="price-input"
                                name="price"
                                value={footerInfo.price}
                                onChange={handleFooterChange}
                                type="number"
                                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
                            />
                        </div>
                    </div>
                </div>

                {templateType === 'DEFAULT' && (
                    <div style={{
                        marginBottom: '40px',
                        padding: '24px',
                        background: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)',
                        borderRadius: '20px',
                        border: '1px solid #e0f2fe',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Decorative element */}
                        <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '100px', height: '100px', background: 'rgba(37, 99, 235, 0.03)', borderRadius: '50%' }}></div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ padding: '8px', background: '#2563EB', borderRadius: '10px', color: 'white' }}>
                                    <Calculator size={20} />
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '17px', color: '#1E293B', fontWeight: 700 }}>Real-time Logistics Engine</h4>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>Optimized rates based on AI route analysis</p>
                                </div>
                            </div>
                            {isCalculating && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '6px 12px', borderRadius: '20px', border: '1px solid #E2E8F0', fontSize: '12px', fontWeight: 500, color: '#2563EB' }}>
                                    <div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid #DBEAFE', borderTopColor: '#2563EB', borderRadius: '50%' }}></div>
                                    Calculating Best Rate...
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: pricingResult ? '24px' : '0' }}>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '10px', letterSpacing: '0.05em' }}>BUSINESS SERVICE TYPE</label>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {['STANDARD', 'WASTE_COLLECTION', 'WAREHOUSE_TRANSFER'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setBusinessType(type)}
                                            style={{
                                                padding: '10px 16px',
                                                borderRadius: '10px',
                                                border: '1px solid',
                                                borderColor: businessType === type ? '#2563EB' : '#E2E8F0',
                                                background: businessType === type ? '#2563EB' : 'white',
                                                color: businessType === type ? 'white' : '#64748B',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                boxShadow: businessType === type ? '0 4px 6px -1px rgba(37, 99, 235, 0.2)' : 'none'
                                            }}
                                        >
                                            {type.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '10px', letterSpacing: '0.05em' }}>DELIVERY DATE</label>
                                    <input
                                        type="date"
                                        value={baseInfo.delivery_date}
                                        onChange={(e) => setBaseInfo({ ...baseInfo, delivery_date: e.target.value })}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', background: 'white' }}
                                    />
                                </div>
                                <div style={{ width: '100px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '10px', letterSpacing: '0.05em' }}>WAITING</label>
                                    <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0 10px' }}>
                                        <input
                                            type="number"
                                            value={waitingTime}
                                            onChange={e => setWaitingTime(parseInt(e.target.value) || 0)}
                                            style={{ width: '100%', padding: '10px 0', border: 'none', background: 'transparent', fontSize: '13px', textAlign: 'center' }}
                                        />
                                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>min</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {pricingResult && (
                            <div style={{
                                padding: '24px',
                                background: 'rgba(255, 255, 255, 0.7)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '16px',
                                border: '1px solid rgba(255, 255, 255, 0.5)',
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '6px' }}>ESTIMATED TOTAL REVENUE</div>
                                        <div style={{ fontSize: '36px', fontWeight: 900, color: '#059669', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                            ${pricingResult.totalRevenue.toFixed(2)}
                                            <span style={{ fontSize: '16px', color: '#10B981', fontWeight: 600 }}>{pricingResult.currency}</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', color: '#3B82F6', fontWeight: 700, fontSize: '15px' }}>
                                            <Info size={16} />
                                            {pricingResult.distance.toFixed(1)} km
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>ETA: ~{pricingResult.duration.toFixed(0)} minutes</div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                                    {pricingResult.breakdown.map((item, idx) => (
                                        <div key={idx} style={{ padding: '12px', background: 'white', borderRadius: '12px', border: '1px solid #F1F5F9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                            <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>{item.componentName}</div>
                                            <div style={{ fontSize: '15px', fontWeight: 800, color: '#334155' }}>${item.amount.toFixed(2)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Global Action */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
                    <button
                        data-testid="submit-waybill-btn"
                        onClick={handleSubmit}
                        className="btn-primary"
                        style={{ padding: '12px 64px' }}
                    >
                        Create Waybill
                    </button>
                </div>
            </div>
        </div>
    );
};
