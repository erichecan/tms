
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Globe, Package, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logo from './assets/logo.png';
import { API_BASE_URL } from './apiConfig';
import { createPlacesAutocomplete } from './services/mapsService';
import { calculatePrice } from './services/pricingService';
import { SignaturePad } from './components/SignaturePad';
import { useDialog } from './context/DialogContext';

interface GoodsLine {
    pallet_count: string;
    item_count: string;
    pro: string;
    po_list: string;
}

export const WaybillCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { alert } = useDialog();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const isViewMode = searchParams.get('mode') === 'view';
    const isEditMode = Boolean(id) && !isViewMode;

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

    // Signature
    const [signatureUrl, setSignatureUrl] = useState<string>('');

    // Image Placeholders
    const [isaImage, setIsaImage] = useState<string | null>(null);
    const [barcodeImage, setBarcodeImage] = useState<string | null>(null);

    // Pricing Integration State
    const [businessType] = useState('STANDARD');
    const [waitingTime] = useState(0);
    const [, setIsCalculating] = useState(false);
    const [pickupCoords, setPickupCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number, lng: number } | null>(null);

    // Customer Dropdown Data
    const [customers, setCustomers] = useState<any[]>([]);

    const shipFromRef = useRef<HTMLInputElement>(null);
    const shipToRef = useRef<HTMLInputElement>(null);

    // Fetch Customers
    useEffect(() => {
        const token = localStorage.getItem('token');
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        fetch(`${API_BASE_URL}/customers`, { headers }).then(res => res.json()).then(setCustomers).catch(() => { });
    }, []);

    // Fetch Data on Edit/View
    useEffect(() => {
        if ((isEditMode || isViewMode) && id) {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            fetch(`${API_BASE_URL}/waybills/${id}`, { headers })
                .then(res => res.json())
                .then(found => {
                    if (found) {
                        setWaybillNo(found.waybill_no);

                        // Populate from saved JSON 'details' if available, otherwise fallback to columns
                        const d = found.details || {};
                        const cargoDesc = found.cargo_desc || '';

                        // Recovery logic for legacy waybills where JSONB was empty
                        let recoveredFromComp = '';
                        let recoveredToComp = '';
                        let recoveredRef = '';

                        const fromMatch = cargoDesc.match(/ShipFrom:\s*([^,]+)/i);
                        if (fromMatch) recoveredFromComp = fromMatch[1].trim();

                        const toMatch = cargoDesc.match(/ShipTo:\s*([^,]+)/i);
                        if (toMatch) recoveredToComp = toMatch[1].trim();

                        const refMatch = cargoDesc.match(/Target:\s*([^,]+)/i);
                        if (refMatch) recoveredRef = refMatch[1].trim();

                        // Recover items count
                        const itemsMatch = cargoDesc.match(/Items:\s*(\d+)/i);
                        const recoveredItemCount = itemsMatch ? parseInt(itemsMatch[1]) : 0;
                        const recoveredLines = [];
                        if (recoveredItemCount > 0) {
                            for (let i = 0; i < recoveredItemCount; i++) {
                                recoveredLines.push({ pallet_count: '0', item_count: '0', pro: '', po_list: '' });
                            }
                        }

                        if (d.templateType) setTemplateType(d.templateType);

                        setShipFrom(d.shipFrom || {
                            company: recoveredFromComp,
                            contact: '',
                            phone: '',
                            address: found.origin || ''
                        });

                        setShipTo(d.shipTo || {
                            company: recoveredToComp,
                            contact: '',
                            phone: '',
                            address: found.destination || ''
                        });

                        if (d.baseInfo) {
                            setBaseInfo(d.baseInfo);
                        } else {
                            // Fallback for flat cols + recovered ref
                            setBaseInfo({
                                fc_alias: found.fulfillment_center || '',
                                fc_address: '',
                                delivery_date: found.delivery_date || '',
                                reference_code: recoveredRef || found.reference_code || ''
                            });
                        }

                        if (d.goodsLines) {
                            setGoodsLines(d.goodsLines);
                        } else if (recoveredLines.length > 0) {
                            setGoodsLines(recoveredLines);
                        }
                        if (d.isaImage) setIsaImage(d.isaImage);
                        if (d.barcodeImage) setBarcodeImage(d.barcodeImage);

                        const loadedFooter = d.footerInfo || {};
                        setFooterInfo({
                            ...loadedFooter,
                            client_name: loadedFooter.client_name || found.customer_id, // Backward compat
                            price: found.price_estimated?.toString() || '0'
                        });

                        if (found.signature_url) setSignatureUrl(found.signature_url);
                    }
                });
        }
    }, [isEditMode, isViewMode, id]);


    useEffect(() => {
        if (templateType === 'DEFAULT' && !isViewMode) {
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
    }, [templateType, isViewMode]);

    useEffect(() => {
        const triggerCalculation = async () => {
            if (pickupCoords && deliveryCoords && templateType === 'DEFAULT' && !isViewMode) {
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
                    // setPricingResult(result);
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
    }, [pickupCoords, deliveryCoords, businessType, waitingTime, templateType, isViewMode]);

    const handleBaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isViewMode) return;
        setBaseInfo({ ...baseInfo, [e.target.name]: e.target.value });
    };

    const handleFooterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (isViewMode) return;
        setFooterInfo({ ...footerInfo, [e.target.name]: e.target.value });
    };

    const handleLineChange = (index: number, field: keyof GoodsLine, value: string) => {
        if (isViewMode) return;
        const newLines = [...goodsLines];
        newLines[index][field] = value;
        setGoodsLines(newLines);
    };

    const addLine = () => {
        if (isViewMode) return;
        setGoodsLines([...goodsLines, { pallet_count: '0', item_count: '0', pro: '', po_list: '' }]);
    };

    const removeLine = (index: number) => {
        if (isViewMode) return;
        if (goodsLines.length > 1) {
            setGoodsLines(goodsLines.filter((_, i) => i !== index));
        }
    };

    const handlePaste = (e: React.ClipboardEvent, setImage: (s: string) => void) => {
        if (isViewMode) return;
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
        if (isViewMode) return;

        const isAmazon = templateType === 'AMAZON';
        const fullDetails = {
            templateType,
            shipFrom,
            shipTo,
            baseInfo,
            goodsLines,
            footerInfo,
            isaImage,
            barcodeImage
        };

        const payload = {
            waybill_no: waybillNo,
            customer_id: footerInfo.client_name || '',
            origin: isAmazon ? 'Unknown' : shipFrom.address,
            destination: isAmazon ? (baseInfo.fc_address || baseInfo.fc_alias) : shipTo.address,
            fulfillment_center: isAmazon ? baseInfo.fc_alias : 'N/A',
            cargo_desc: `Target: ${baseInfo.reference_code || ''}, Items: ${goodsLines.length}, ShipFrom: ${shipFrom.company}, ShipTo: ${shipTo.company}`,
            price_estimated: Number(footerInfo.price) || 0,
            delivery_date: baseInfo.delivery_date,
            status: 'NEW',
            signature_url: signatureUrl,
            signed_at: signatureUrl ? new Date().toISOString() : undefined,
            signed_by: 'Driver/Customer',
            details: fullDetails // Persist ALL state
        };

        const url = isEditMode ? `${API_BASE_URL}/waybills/${id}` : `${API_BASE_URL}/waybills`;
        const method = isEditMode ? 'PUT' : 'POST';

        try {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                if (isEditMode) {
                    await alert(t('messages.updateSuccess'), t('messages.updateSuccessTitle'));
                }
                navigate('/waybills');
            } else {
                await alert(t('messages.saveFailed'), t('messages.saveFailedTitle'));
            }
        } catch (err) {
            console.error(err);
            await alert(t('messages.connectionError'), t('messages.connectionErrorTitle'));
        }
    };

    const handleSignatureSave = (data: string) => {
        if (isViewMode) return;
        setSignatureUrl(data);
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px', animation: 'fadeIn 0.5s ease-out' }}>
            {/* Header Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <button onClick={() => navigate('/waybills')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
                    <ArrowLeft size={20} /> {t('common.back')}
                </button>

                {!isViewMode && (
                    <div className="glass" style={{ padding: '6px', display: 'flex', gap: '4px' }}>
                        <button
                            onClick={() => setTemplateType('DEFAULT')}
                            style={{ padding: '8px 24px', borderRadius: '10px', border: 'none', background: templateType === 'DEFAULT' ? 'var(--primary-grad)' : 'transparent', color: templateType === 'DEFAULT' ? 'white' : 'var(--slate-500)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s' }}
                        >
                            {t('waybill.default')}
                        </button>
                        <button
                            onClick={() => setTemplateType('AMAZON')}
                            style={{ padding: '8px 24px', borderRadius: '10px', border: 'none', background: templateType === 'AMAZON' ? 'var(--primary-grad)' : 'transparent', color: templateType === 'AMAZON' ? 'white' : 'var(--slate-500)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s' }}
                        >
                            {t('waybill.amazon')}
                        </button>
                    </div>
                )}
            </div>

            <div className="glass-card" style={{ padding: '48px', pointerEvents: isViewMode ? 'none' : 'auto', opacity: isViewMode ? 0.9 : 1 }}>

                {isEditMode && <div className="badge-yellow" style={{ marginBottom: '20px', textAlign: 'center' }}>{t('waybill.editMode')}</div>}
                {isViewMode && <div className="badge-blue" style={{ marginBottom: '20px', textAlign: 'center' }}>{t('waybill.viewMode')}</div>}

                {/* Branding Block */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px' }}>
                    <div>
                        <img src={logo} alt="Apony Group" style={{ height: '56px', objectFit: 'contain' }} />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: 'var(--slate-500)', fontWeight: 600 }}>{t('fleet.tel')}: 437 202 8888 | {t('fleet.fax')}: 437 202 8888</div>
                        <div style={{ fontSize: '12px', color: 'var(--primary-start)', fontWeight: 700 }}>delivery@aponygroup.com</div>
                        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                            <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--slate-900)' }}>{t('waybill.waybillNo')} :</span>
                            <input
                                value={waybillNo}
                                onChange={(e) => setWaybillNo(e.target.value)}
                                style={{ border: '1px solid var(--glass-border)', padding: '8px 16px', borderRadius: '10px', textAlign: 'right', width: '180px', fontWeight: 700, background: 'var(--slate-50)' }}
                                readOnly={isViewMode}
                            />
                        </div>
                    </div>
                </div>

                {/* Templates */}
                {templateType === 'AMAZON' ? (
                    <div style={{ marginBottom: '40px' }}>
                        <div className="glass" style={{ padding: '24px', marginBottom: '32px', display: 'flex', gap: '32px' }}>
                            <div style={{ width: '180px' }}><h4 style={{ margin: 0 }}>{t('waybill.isaBarcode')}</h4></div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div onPaste={(e) => handlePaste(e, setIsaImage)} style={{ height: '100px', border: '2px dashed var(--glass-border)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    {isaImage ? <img src={isaImage} alt="ISA" style={{ height: '100%', objectFit: 'contain' }} /> : <span>{t('waybill.pasteIsa')}</span>}
                                </div>
                                <div onPaste={(e) => handlePaste(e, setBarcodeImage)} style={{ height: '100px', border: '2px dashed var(--glass-border)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    {barcodeImage ? <img src={barcodeImage} alt="Barcode" style={{ height: '100%', objectFit: 'contain' }} /> : <span>{t('waybill.pasteBarcode')}</span>}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate-400)', display: 'block', marginBottom: '8px' }}>{t('waybill.fcCode')}</label>
                                <input name="fc_alias" value={baseInfo.fc_alias} onChange={handleBaseChange} readOnly={isViewMode} style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate-400)', display: 'block', marginBottom: '8px' }}>{t('waybill.deliveryDate')}</label>
                                <input type="date" name="delivery_date" value={baseInfo.delivery_date} onChange={handleBaseChange} readOnly={isViewMode} style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', width: '100%' }} />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
                        {/* Pick Up */}
                        <div className="glass" style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><Globe size={16} /> {t('waybill.pickupAt')}</div>
                            <input value={shipFrom.company} onChange={e => setShipFrom({ ...shipFrom, company: e.target.value })} placeholder={t('fleet.companyName')} style={{ width: '100%', padding: '12px', marginBottom: '8px', borderRadius: '10px', border: '1px solid var(--glass-border)' }} readOnly={isViewMode} />
                            <input value={shipFrom.contact} onChange={e => setShipFrom({ ...shipFrom, contact: e.target.value })} placeholder={t('fleet.contactPerson')} style={{ width: '100%', padding: '12px', marginBottom: '8px', borderRadius: '10px', border: '1px solid var(--glass-border)' }} readOnly={isViewMode} />
                            <input value={shipFrom.phone} onChange={e => setShipFrom({ ...shipFrom, phone: e.target.value })} placeholder={t('fleet.phone')} style={{ width: '100%', padding: '12px', marginBottom: '8px', borderRadius: '10px', border: '1px solid var(--glass-border)' }} readOnly={isViewMode} />
                            <input ref={shipFromRef} value={shipFrom.address} onChange={e => setShipFrom({ ...shipFrom, address: e.target.value })} placeholder={t('fleet.address')} style={{ width: '100%', padding: '12px', marginBottom: '8px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)' }} readOnly={isViewMode} />
                        </div>
                        {/* Deliver To */}
                        <div className="glass" style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><Target size={16} /> {t('waybill.deliverTo')}</div>
                            <input value={shipTo.company} onChange={e => setShipTo({ ...shipTo, company: e.target.value })} placeholder={t('fleet.companyName')} style={{ width: '100%', padding: '12px', marginBottom: '8px', borderRadius: '10px', border: '1px solid var(--glass-border)' }} readOnly={isViewMode} />
                            <input value={shipTo.contact} onChange={e => setShipTo({ ...shipTo, contact: e.target.value })} placeholder={t('fleet.contactPerson')} style={{ width: '100%', padding: '12px', marginBottom: '8px', borderRadius: '10px', border: '1px solid var(--glass-border)' }} readOnly={isViewMode} />
                            <input value={shipTo.phone} onChange={e => setShipTo({ ...shipTo, phone: e.target.value })} placeholder={t('fleet.phone')} style={{ width: '100%', padding: '12px', marginBottom: '8px', borderRadius: '10px', border: '1px solid var(--glass-border)' }} readOnly={isViewMode} />
                            <input ref={shipToRef} value={shipTo.address} onChange={e => setShipTo({ ...shipTo, address: e.target.value })} placeholder={t('fleet.address')} style={{ width: '100%', padding: '12px', marginBottom: '8px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)' }} readOnly={isViewMode} />
                        </div>
                    </div>
                )}

                {/* Items Manifest */}
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <Package size={20} color="var(--slate-900)" />
                        <h4 style={{ fontWeight: 800, margin: 0 }}>{t('waybill.cargoManifest')}</h4>
                    </div>
                    <div className="glass" style={{ padding: '0', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--slate-50)', borderBottom: '1px solid var(--glass-border)' }}>
                                    <th style={{ padding: '16px', fontSize: '11px', fontWeight: 700 }}>#</th>
                                    <th style={{ padding: '16px', fontSize: '11px', fontWeight: 700 }}>{t('waybill.pallets')}</th>
                                    <th style={{ padding: '16px', fontSize: '11px', fontWeight: 700 }}>{t('waybill.items')}</th>
                                    <th style={{ padding: '16px', fontSize: '11px', fontWeight: 700 }}>{t('waybill.proDesc')}</th>
                                    <th style={{ padding: '16px', fontSize: '11px', fontWeight: 700 }}>{t('waybill.poList')}</th>
                                    <th style={{ padding: '16px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {goodsLines.map((line, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '16px' }}>{idx + 1}</td>
                                        <td style={{ padding: '16px' }}><input value={line.pallet_count} onChange={e => handleLineChange(idx, 'pallet_count', e.target.value)} style={{ width: '80px', padding: '10px', borderRadius: '10px', border: '1px solid var(--glass-border)' }} readOnly={isViewMode} /></td>
                                        <td style={{ padding: '16px' }}><input value={line.item_count} onChange={e => handleLineChange(idx, 'item_count', e.target.value)} style={{ width: '80px', padding: '10px', borderRadius: '10px', border: '1px solid var(--glass-border)' }} readOnly={isViewMode} /></td>
                                        <td style={{ padding: '16px' }}><input value={line.pro} onChange={e => handleLineChange(idx, 'pro', e.target.value)} style={{ width: '140px', padding: '10px', borderRadius: '10px', border: '1px solid var(--glass-border)' }} readOnly={isViewMode} /></td>
                                        <td style={{ padding: '16px' }}><input value={line.po_list} onChange={e => handleLineChange(idx, 'po_list', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--glass-border)' }} readOnly={isViewMode} /></td>
                                        <td style={{ padding: '16px' }}>{!isViewMode && <button onClick={() => removeLine(idx)} style={{ color: '#EF4444', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {!isViewMode && <div style={{ padding: '16px' }}>
                            <button onClick={addLine} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '13px' }}><Plus size={16} /> {t('waybill.addGoodsLine')}</button>
                        </div>}
                    </div>
                </div>


                {/* Signature Pad */}
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ pointerEvents: isViewMode ? 'none' : 'auto' }}>
                        <SignaturePad onSave={handleSignatureSave} initialUrl={signatureUrl} />
                    </div>
                </div>

                {/* Final Submission Controls */}
                {!isViewMode && (
                    <div className="glass" style={{ padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                        <div style={{ display: 'flex', gap: '40px' }}>
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '8px', textTransform: 'uppercase' }}>{t('waybill.billTo')}</div>
                                <select name="client_name" value={footerInfo.client_name} onChange={handleFooterChange} style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700, fontSize: '14px' }}>
                                    <option value="">{t('waybill.selectCustomer')}</option>
                                    {customers.length > 0 ? customers.map((c: any) => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                    )) : <option value="Ad Hoc">{t('waybill.adHocClient')}</option>}
                                </select>
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '8px', textTransform: 'uppercase' }}>{t('waybill.form.price')}</div>
                                <input name="price" value={footerInfo.price} onChange={handleFooterChange} placeholder="0.00" style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700, fontSize: '14px', width: '120px' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '8px', textTransform: 'uppercase' }}>{t('waybill.form.distance')}</div>
                                <input name="distance" value={footerInfo.distance} onChange={handleFooterChange} placeholder="0" style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700, fontSize: '14px', width: '100px' }} />
                            </div>
                        </div>
                        <button onClick={handleSubmit} className="btn-primary" style={{ padding: '16px 48px', fontSize: '18px' }}>
                            {isEditMode ? t('waybill.updateWaybill') : t('waybill.createFinish')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
