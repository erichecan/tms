
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Calculator, Globe, Package, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logo from './assets/logo.png';
import { API_BASE_URL } from './apiConfig';
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
            const res = await fetch(`${API_BASE_URL}/waybills`, {
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
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px', animation: 'fadeIn 0.5s ease-out' }}>
            {/* Header Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <button onClick={() => navigate('/')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
                    <ArrowLeft size={20} /> {t('common.back')}
                </button>

                <div className="glass" style={{ padding: '6px', display: 'flex', gap: '4px' }}>
                    <button
                        onClick={() => setTemplateType('DEFAULT')}
                        style={{ padding: '8px 24px', borderRadius: '10px', border: 'none', background: templateType === 'DEFAULT' ? 'var(--primary-grad)' : 'transparent', color: templateType === 'DEFAULT' ? 'white' : 'var(--slate-500)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s' }}
                    >
                        Default
                    </button>
                    <button
                        onClick={() => setTemplateType('AMAZON')}
                        style={{ padding: '8px 24px', borderRadius: '10px', border: 'none', background: templateType === 'AMAZON' ? 'var(--primary-grad)' : 'transparent', color: templateType === 'AMAZON' ? 'white' : 'var(--slate-500)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s' }}
                    >
                        Amazon
                    </button>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '48px' }}>
                {/* Branding Block */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px' }}>
                    <div>
                        <img src={logo} alt="Apony Group" style={{ height: '56px', objectFit: 'contain' }} />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: 'var(--slate-500)', fontWeight: 600 }}>Tel: 437 202 8888 | Fax: 437 202 8888</div>
                        <div style={{ fontSize: '12px', color: 'var(--primary-start)', fontWeight: 700 }}>delivery@aponygroup.com</div>
                        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                            <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--slate-900)' }}>{t('waybill.waybillNo')} :</span>
                            <input
                                value={waybillNo}
                                onChange={(e) => setWaybillNo(e.target.value)}
                                style={{ border: '1px solid var(--glass-border)', padding: '8px 16px', borderRadius: '10px', textAlign: 'right', width: '180px', fontWeight: 700, background: 'var(--slate-50)' }}
                            />
                        </div>
                    </div>
                </div>

                {templateType === 'AMAZON' ? (
                    <div style={{ marginBottom: '40px' }}>
                        <div className="glass" style={{ padding: '24px', marginBottom: '32px', display: 'flex', gap: '32px' }}>
                            <div style={{ width: '180px' }}>
                                <h4 style={{ margin: 0, fontWeight: 800, color: 'var(--slate-900)' }}>{t('waybill.form.isa')}</h4>
                                <p style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '4px' }}>Paste appointment screenshots here</p>
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div onPaste={(e) => handlePaste(e, setIsaImage)} style={{ height: '100px', border: '2px dashed var(--glass-border)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--slate-50)', color: 'var(--slate-400)', fontSize: '13px', cursor: 'text', overflow: 'hidden' }}>
                                    {isaImage ? <img src={isaImage} alt="ISA" style={{ height: '100%', objectFit: 'contain' }} /> : <span>{t('waybill.form.isaPlaceholder')}</span>}
                                </div>
                                <div onPaste={(e) => handlePaste(e, setBarcodeImage)} style={{ height: '100px', border: '2px dashed var(--glass-border)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--slate-50)', color: 'var(--slate-400)', fontSize: '13px', cursor: 'text', overflow: 'hidden' }}>
                                    {barcodeImage ? <img src={barcodeImage} alt="Barcode" style={{ height: '100%', objectFit: 'contain' }} /> : <span>{t('waybill.form.barcodePlaceholder')}</span>}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate-400)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Fulfillment Center Code</label>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <input name="fc_alias" value={baseInfo.fc_alias} onChange={handleBaseChange} style={{ width: '100px', padding: '12px', border: '1px solid var(--glass-border)', borderRadius: '12px', fontWeight: 700 }} />
                                    <input name="fc_address" placeholder="Full FC Address" value={baseInfo.fc_address} onChange={handleBaseChange} style={{ flex: 1, padding: '12px', border: '1px solid var(--glass-border)', borderRadius: '12px', background: 'var(--slate-50)' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate-400)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Delivery Schedule</label>
                                <input type="date" name="delivery_date" value={baseInfo.delivery_date} onChange={handleBaseChange} style={{ width: '100%', padding: '12px', border: '1px solid var(--glass-border)', borderRadius: '12px', fontWeight: 600 }} />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
                        {/* Ship From */}
                        <div className="glass" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <Globe size={20} color="var(--primary-start)" />
                                <h4 style={{ fontWeight: 800, margin: 0 }}>PICK UP AT</h4>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <input value={shipFrom.company} onChange={e => setShipFrom({ ...shipFrom, company: e.target.value })} placeholder="Company Name" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)' }} />
                                <input value={shipFrom.phone} onChange={e => setShipFrom({ ...shipFrom, phone: e.target.value })} placeholder="Phone" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)' }} />
                            </div>
                            <input ref={shipFromRef} value={shipFrom.address} onChange={e => setShipFrom({ ...shipFrom, address: e.target.value })} placeholder="Origin address..." style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)' }} />
                        </div>

                        {/* Ship To */}
                        <div className="glass" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <Target size={20} color="var(--secondary)" />
                                <h4 style={{ fontWeight: 800, margin: 0 }}>DELIVER TO</h4>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <input value={shipTo.company} onChange={e => setShipTo({ ...shipTo, company: e.target.value })} placeholder="Consignee Name" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)' }} />
                                <input value={shipTo.phone} onChange={e => setShipTo({ ...shipTo, phone: e.target.value })} placeholder="Phone" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)' }} />
                            </div>
                            <input ref={shipToRef} value={shipTo.address} onChange={e => setShipTo({ ...shipTo, address: e.target.value })} placeholder="Destination address..." style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)' }} />
                        </div>
                    </div>
                )}

                {/* Items Manifest */}
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <Package size={20} color="var(--slate-900)" />
                        <h4 style={{ fontWeight: 800, margin: 0 }}>Cargo Manifest & PO Tracking</h4>
                    </div>
                    <div className="glass" style={{ padding: '0', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--slate-50)', borderBottom: '1px solid var(--glass-border)' }}>
                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '11px', fontWeight: 700 }}>#</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '11px', fontWeight: 700 }}>PALLETS</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '11px', fontWeight: 700 }}>ITEMS</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '11px', fontWeight: 700 }}>PRO #</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '11px', fontWeight: 700 }}>PO LIST</th>
                                    <th style={{ padding: '16px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {goodsLines.map((line, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '16px', fontWeight: 700, color: 'var(--slate-400)' }}>{idx + 1}</td>
                                        <td style={{ padding: '16px' }}><input value={line.pallet_count} onChange={e => handleLineChange(idx, 'pallet_count', e.target.value)} style={{ width: '80px', padding: '10px', borderRadius: '10px', border: '1px solid var(--glass-border)' }} /></td>
                                        <td style={{ padding: '16px' }}><input value={line.item_count} onChange={e => handleLineChange(idx, 'item_count', e.target.value)} style={{ width: '80px', padding: '10px', borderRadius: '10px', border: '1px solid var(--glass-border)' }} /></td>
                                        <td style={{ padding: '16px' }}><input value={line.pro} onChange={e => handleLineChange(idx, 'pro', e.target.value)} placeholder="PRO#" style={{ width: '140px', padding: '10px', borderRadius: '10px', border: '1px solid var(--glass-border)' }} /></td>
                                        <td style={{ padding: '16px' }}><input value={line.po_list} onChange={e => handleLineChange(idx, 'po_list', e.target.value)} placeholder="PO List" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--glass-border)' }} /></td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}><button onClick={() => removeLine(idx)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ padding: '16px' }}>
                            <button onClick={addLine} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '13px' }}>
                                <Plus size={16} /> Add Goods Line
                            </button>
                        </div>
                    </div>
                </div>

                {/* Logistics Engine Integrated */}
                {templateType === 'DEFAULT' && (
                    <div className="glass" style={{ marginBottom: '40px', padding: '32px', border: '1px solid var(--primary-start)', background: 'linear-gradient(135deg, rgba(0,128,255,0.03) 0%, rgba(139,0,255,0.03) 100%)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ padding: '10px', background: 'var(--primary-grad)', borderRadius: '12px', color: 'white' }}>
                                    <Calculator size={24} />
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontWeight: 800 }}>Real-time Logistics Engine</h4>
                                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--slate-500)' }}>Automated rate prediction based on route feasibility</p>
                                </div>
                            </div>
                            {isCalculating && <div className="badge-blue">Analyzing...</div>}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px' }}>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-900)', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>Service Tier</label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {['STANDARD', 'WASTE_COLLECTION', 'WAREHOUSE_TRANSFER'].map(t => (
                                        <button key={t} onClick={() => setBusinessType(t)} style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: businessType === t ? 'var(--slate-900)' : 'white', color: businessType === t ? 'white' : 'var(--slate-500)', fontSize: '11px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                            {t.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '24px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-900)', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>Schedule Date</label>
                                    <input type="date" value={baseInfo.delivery_date} onChange={e => setBaseInfo({ ...baseInfo, delivery_date: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)' }} />
                                </div>
                                <div style={{ width: '120px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-900)', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>Wait (Min)</label>
                                    <input type="number" value={waitingTime} onChange={e => setWaitingTime(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', textAlign: 'center', fontWeight: 700 }} />
                                </div>
                            </div>
                        </div>

                        {pricingResult && (
                            <div style={{ marginTop: '32px', padding: '24px', background: 'rgba(255,255,255,0.6)', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--glass-border)' }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: 'var(--slate-500)', fontWeight: 700, marginBottom: '6px' }}>ESTIMATED TOTAL QUOTE</div>
                                    <div style={{ fontSize: '42px', fontWeight: 900, color: 'var(--primary-start)' }}>${pricingResult.totalRevenue.toFixed(2)} <span style={{ fontSize: '18px', fontWeight: 600 }}>USD</span></div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '4px' }}>{pricingResult.distance.toFixed(1)} KM</div>
                                    <div style={{ fontSize: '13px', color: 'var(--slate-500)', fontWeight: 600 }}>ETA: ~{pricingResult.duration.toFixed(0)} minutes</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Final Submission Controls */}
                <div className="glass" style={{ padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                    <div style={{ display: 'flex', gap: '40px' }}>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '8px', textTransform: 'uppercase' }}>Client Selection</div>
                            <select name="client_name" value={footerInfo.client_name} onChange={handleFooterChange} style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700, fontSize: '14px' }}>
                                <option value="">Select Partner</option>
                                <option value="Customer A">Apony Prime</option>
                                <option value="Customer B">Global Logistics Co.</option>
                            </select>
                        </div>
                        <div style={{ width: '150px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '8px', textTransform: 'uppercase' }}>Final Estimate</div>
                            <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--slate-900)' }}>${footerInfo.price}</div>
                        </div>
                    </div>
                    <button onClick={handleSubmit} className="btn-primary" style={{ padding: '16px 48px', fontSize: '18px' }}>
                        Create & Finish Waybill
                    </button>
                </div>
            </div>
        </div>
    );
};
