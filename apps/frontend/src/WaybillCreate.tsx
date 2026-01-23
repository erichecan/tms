
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
    item_count: string; // Used for Default template
    pro: string;
    po_list: string;
    // Amazon specific fields
    bol_vendor_ref?: string;
    vendor_name?: string;
    carton_count?: string;
    unit_count?: string;
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
    const [waybillNo, setWaybillNo] = useState(() => {
        if (id) return ''; // Will be set by fetch useEffect
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const mins = now.getMinutes().toString().padStart(2, '0');
        return `Y${year}${month}-${day}${hours}${mins}`;
    });

    // Default Template State
    const [shipFrom, setShipFrom] = useState({ company: 'Apony Group', contact: '', phone: '', address: '1399 Kennedy road' });
    const [shipTo, setShipTo] = useState({ company: '', contact: '', phone: '', address: '' });

    // Amazon Template State
    const [baseInfo, setBaseInfo] = useState({
        fc_alias: 'Y001',
        fc_address: '',
        delivery_date: '',
        delivery_time: '09:00', // New field for time
        reference_code: ''
    });

    // Goods & Footer State
    const [goodsLines, setGoodsLines] = useState<GoodsLine[]>([
        { pallet_count: '0', item_count: '0', pro: '', po_list: '', bol_vendor_ref: '', vendor_name: '', carton_count: '0', unit_count: '0' },
        { pallet_count: '0', item_count: '0', pro: '', po_list: '', bol_vendor_ref: '', vendor_name: '', carton_count: '0', unit_count: '0' }
    ]);

    const [footerInfo, setFooterInfo] = useState({
        time_in: '',
        time_out: '',
        client_name: '',
        distance: '0',
        price: '0'
    });

    // Note: useEffect was removed here and replaced by lazy initializer above

    // Signature
    const [signatureUrl, setSignatureUrl] = useState<string>('');
    const [billingType, setBillingType] = useState<'DISTANCE' | 'TIME'>('DISTANCE');

    // Image Placeholders
    const [isaImage, setIsaImage] = useState<string | null>(null);
    const [barcodeImage, setBarcodeImage] = useState<string | null>(null);
    const [isDraggingIsa, setIsDraggingIsa] = useState(false);
    const [isDraggingBarcode, setIsDraggingBarcode] = useState(false);

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
        // Increase limit to 1000 for dropdown selection and handle paginated response
        fetch(`${API_BASE_URL}/customers?limit=1000`, { headers })
            .then(res => res.json())
            .then(result => {
                if (result && result.data) {
                    setCustomers(result.data);
                } else if (Array.isArray(result)) {
                    setCustomers(result);
                }
            })
            .catch(() => { });
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

                        const loadedFrom = d.shipFrom || {};
                        setShipFrom({
                            company: loadedFrom.company || recoveredFromComp || '',
                            contact: loadedFrom.contact || '',
                            phone: loadedFrom.phone || '',
                            address: loadedFrom.address || found.origin || ''
                        });

                        const loadedTo = d.shipTo || {};
                        setShipTo({
                            company: loadedTo.company || recoveredToComp || '',
                            contact: loadedTo.contact || '',
                            phone: loadedTo.phone || '',
                            address: loadedTo.address || found.destination || ''
                        });

                        const loadedBase = d.baseInfo || {};
                        setBaseInfo({
                            fc_alias: loadedBase.fc_alias || found.fulfillment_center || 'Y001',
                            fc_address: loadedBase.fc_address || '',
                            delivery_date: loadedBase.delivery_date || (found.delivery_date ? found.delivery_date.split(' ')[0] : ''),
                            delivery_time: loadedBase.delivery_time || (found.delivery_date && found.delivery_date.includes(' ') ? found.delivery_date.split(' ')[1] : '09:00'),
                            reference_code: loadedBase.reference_code || recoveredRef || found.reference_code || ''
                        });

                        if (d.goodsLines) {
                            setGoodsLines(d.goodsLines.map((l: any) => ({
                                pallet_count: l.pallet_count || '0',
                                item_count: l.item_count || '0',
                                pro: l.pro || '',
                                po_list: l.po_list || '',
                                bol_vendor_ref: l.bol_vendor_ref || '',
                                vendor_name: l.vendor_name || '',
                                carton_count: l.carton_count || '0',
                                unit_count: l.unit_count || '0'
                            })));
                        } else if (recoveredLines.length > 0) {
                            setGoodsLines(recoveredLines);
                        }
                        if (d.isaImage) setIsaImage(d.isaImage);
                        if (d.barcodeImage) setBarcodeImage(d.barcodeImage);

                        const loadedFooter = d.footerInfo || {};
                        setFooterInfo({
                            time_in: loadedFooter.time_in || '',
                            time_out: loadedFooter.time_out || '',
                            client_name: loadedFooter.client_name || found.customer_id || '',
                            distance: loadedFooter.distance || found.distance?.toString() || '0',
                            price: loadedFooter.price || found.price_estimated?.toString() || '0'
                        });

                        if (found.signature_url) setSignatureUrl(found.signature_url);
                        if (found.billing_type) setBillingType(found.billing_type);
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
                        billingType,
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
        setGoodsLines([...goodsLines, {
            pallet_count: '0',
            item_count: '0',
            pro: '',
            po_list: '',
            bol_vendor_ref: '',
            vendor_name: '',
            carton_count: '0',
            unit_count: '0'
        }]);
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

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

    const validateAndProcessFile = async (file: File, setImage: (s: string) => void) => {
        if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
            await alert(t('waybill.invalidFileType'), t('common.error'));
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            await alert(t('waybill.fileTooLarge'), t('common.error'));
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) setImage(event.target.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent, setImage: (s: string) => void, setDragging: (b: boolean) => void) => {
        if (isViewMode) return;
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            validateAndProcessFile(files[0], setImage);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (isViewMode) return;
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragEnter = (e: React.DragEvent, setDragging: (b: boolean) => void) => {
        if (isViewMode) return;
        e.preventDefault();
        e.stopPropagation();
        setDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent, setDragging: (b: boolean) => void) => {
        if (isViewMode) return;
        e.preventDefault();
        e.stopPropagation();
        // Only set dragging to false if we're leaving the drop zone itself
        if (e.currentTarget === e.target) {
            setDragging(false);
        }
    };

    const handleDeleteImage = async (setImage: (s: string | null) => void) => {
        if (isViewMode) return;
        const confirmed = await alert(
            t('waybill.deleteImageConfirm'),
            t('waybill.deleteImageTitle')
        );
        if (confirmed) {
            setImage(null);
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
            origin: shipFrom.address || 'Unknown',
            destination: isAmazon ? (baseInfo.fc_address || baseInfo.fc_alias) : shipTo.address,
            fulfillment_center: isAmazon ? baseInfo.fc_alias : 'N/A',
            cargo_desc: `Target: ${baseInfo.reference_code || ''}, Items: ${goodsLines.length}, ShipFrom: ${shipFrom.company}, ShipTo: ${shipTo.company}`,
            price_estimated: Number(footerInfo.price) || 0,
            delivery_date: isAmazon && baseInfo.delivery_date && baseInfo.delivery_time
                ? `${baseInfo.delivery_date} ${baseInfo.delivery_time}`
                : baseInfo.delivery_date,
            billing_type: billingType,
            status: 'NEW',
            signature_url: signatureUrl,
            signed_at: signatureUrl ? new Date().toISOString() : undefined,
            signed_by: 'Driver/Customer',
            pallet_count: goodsLines.reduce((acc, line) => acc + (parseInt(line.pallet_count) || 0), 0),
            distance: Number(footerInfo.distance) || 0,
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
                        {/* ISA Image Upload Section - MOVED TO TOP */}
                        {!isViewMode && (
                            <div className="glass" style={{ padding: '24px', marginBottom: '32px', display: 'flex', gap: '32px' }}>
                                <div style={{ width: '180px' }}><h4 style={{ margin: 0 }}>{t('waybill.shipmentAppointment')}</h4></div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'row', gap: '16px' }}>
                                    {/* ISA Image Upload */}
                                    <div
                                        onPaste={(e) => handlePaste(e, setIsaImage)}
                                        onDrop={(e) => handleDrop(e, setIsaImage, setIsDraggingIsa)}
                                        onDragOver={handleDragOver}
                                        onDragEnter={(e) => handleDragEnter(e, setIsDraggingIsa)}
                                        onDragLeave={(e) => handleDragLeave(e, setIsDraggingIsa)}
                                        style={{
                                            position: 'relative',
                                            height: '100px',
                                            flex: 1,
                                            border: isDraggingIsa ? '2px solid #3B82F6' : '2px dashed var(--glass-border)',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            background: isDraggingIsa ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                                            transition: 'all 0.2s ease',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {isaImage ? (
                                            <>
                                                <img src={isaImage} alt="ISA" style={{ height: '100%', objectFit: 'contain' }} />
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteImage(setIsaImage); }}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '8px',
                                                        right: '8px',
                                                        background: 'rgba(239, 68, 68, 0.9)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        padding: '4px 8px',
                                                        fontSize: '10px',
                                                        fontWeight: 600,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {t('waybill.deleteImage')}
                                                </button>
                                            </>
                                        ) : (
                                            <span style={{ color: isDraggingIsa ? '#3B82F6' : 'var(--slate-500)', fontWeight: isDraggingIsa ? 600 : 400, fontSize: '12px' }}>
                                                {isDraggingIsa ? t('waybill.dropToUpload') : t('waybill.pasteIsa')}
                                            </span>
                                        )}
                                    </div>

                                    {/* Barcode Image Upload */}
                                    <div
                                        onPaste={(e) => handlePaste(e, setBarcodeImage)}
                                        onDrop={(e) => handleDrop(e, setBarcodeImage, setIsDraggingBarcode)}
                                        onDragOver={handleDragOver}
                                        onDragEnter={(e) => handleDragEnter(e, setIsDraggingBarcode)}
                                        onDragLeave={(e) => handleDragLeave(e, setIsDraggingBarcode)}
                                        style={{
                                            position: 'relative',
                                            height: '100px',
                                            flex: 1,
                                            border: isDraggingBarcode ? '2px solid #3B82F6' : '2px dashed var(--glass-border)',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            background: isDraggingBarcode ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                                            transition: 'all 0.2s ease',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {barcodeImage ? (
                                            <>
                                                <img src={barcodeImage} alt="Barcode" style={{ height: '100%', objectFit: 'contain' }} />
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteImage(setBarcodeImage); }}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '8px',
                                                        right: '8px',
                                                        background: 'rgba(239, 68, 68, 0.9)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        padding: '4px 8px',
                                                        fontSize: '10px',
                                                        fontWeight: 600,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {t('waybill.deleteImage')}
                                                </button>
                                            </>
                                        ) : (
                                            <span style={{ color: isDraggingBarcode ? '#3B82F6' : 'var(--slate-500)', fontWeight: isDraggingBarcode ? 600 : 400, fontSize: '12px' }}>
                                                {isDraggingBarcode ? t('waybill.dropToUpload') : t('waybill.pasteBarcode')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="glass" style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '16px', fontWeight: 800, fontSize: '14px', color: 'var(--slate-900)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {t('waybill.form.baseInfo')}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '6px', textTransform: 'uppercase' }}>{t('waybill.form.fulfillmentCenter')}</div>
                                    <input name="fc_alias" value={baseInfo.fc_alias} onChange={handleBaseChange} placeholder="e.g. Y001" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 600 }} readOnly={isViewMode} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '6px', textTransform: 'uppercase' }}>{t('waybill.form.referenceCode')}</div>
                                    <input name="reference_code" value={baseInfo.reference_code} onChange={handleBaseChange} placeholder="Appointment ID / Ref" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 600 }} readOnly={isViewMode} />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <div style={{ flex: 2 }}>
                                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '6px', textTransform: 'uppercase' }}>{t('waybill.form.deliveryDate')}</div>
                                        <input type="date" name="delivery_date" value={baseInfo.delivery_date} onChange={handleBaseChange} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 600 }} readOnly={isViewMode} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '6px', textTransform: 'uppercase' }}>{t('common.time')}</div>
                                        <input type="time" name="delivery_time" value={baseInfo.delivery_time} onChange={handleBaseChange} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 600 }} readOnly={isViewMode} />
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: '20px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '6px', textTransform: 'uppercase' }}>{t('fleet.address')} (FC)</div>
                                <input name="fc_address" value={baseInfo.fc_address} onChange={handleBaseChange} placeholder="Full Delivery Address" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 600 }} readOnly={isViewMode} />
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

                {/* Cargo Manifest */}
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <Package size={20} color="var(--slate-900)" />
                        <h4 style={{ fontWeight: 800, margin: 0 }}>{t('waybill.cargoManifest')}</h4>
                    </div>

                    {templateType === 'AMAZON' ? (
                        <div className="glass" style={{ padding: '0', overflowX: 'auto', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--slate-50)', borderBottom: '2px solid var(--slate-100)' }}>
                                        <th style={{ padding: '12px 16px', fontSize: '10px', fontWeight: 800, color: 'var(--slate-500)', textTransform: 'uppercase', textAlign: 'left' }}>
                                            {t('waybill.amazonManifest.proCarrierRef')}
                                        </th>
                                        <th style={{ padding: '12px 16px', fontSize: '10px', fontWeight: 800, color: 'var(--slate-500)', textTransform: 'uppercase', textAlign: 'left' }}>
                                            {t('waybill.amazonManifest.bolVendorRefList')} <span style={{ textTransform: 'none', fontWeight: 500, opacity: 0.7 }}>{t('waybill.amazonManifest.separatorHint')}</span>
                                        </th>
                                        <th style={{ padding: '12px 16px', fontSize: '10px', fontWeight: 800, color: 'var(--slate-500)', textTransform: 'uppercase', textAlign: 'left' }}>
                                            {t('waybill.amazonManifest.vendorName')}
                                        </th>
                                        <th style={{ padding: '12px 16px', fontSize: '10px', fontWeight: 800, color: 'var(--slate-500)', textTransform: 'uppercase', textAlign: 'left', width: '80px' }}>
                                            {t('waybill.pallets')}
                                        </th>
                                        <th style={{ padding: '12px 16px', fontSize: '10px', fontWeight: 800, color: 'var(--slate-500)', textTransform: 'uppercase', textAlign: 'left', width: '80px' }}>
                                            {t('waybill.amazonManifest.cartonCount')}
                                        </th>
                                        <th style={{ padding: '12px 16px', fontSize: '10px', fontWeight: 800, color: 'var(--slate-500)', textTransform: 'uppercase', textAlign: 'left', width: '80px' }}>
                                            {t('waybill.amazonManifest.unitCount')}
                                        </th>
                                        <th style={{ padding: '12px 16px', fontSize: '10px', fontWeight: 800, color: 'var(--slate-500)', textTransform: 'uppercase', textAlign: 'left' }}>
                                            {t('waybill.amazonManifest.poList')} <span style={{ textTransform: 'none', fontWeight: 500, opacity: 0.7 }}>{t('waybill.amazonManifest.separatorHint')}</span>
                                        </th>
                                        {!isViewMode && <th style={{ width: '40px' }}></th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {goodsLines.map((line, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid var(--slate-100)' }}>
                                            <td style={{ padding: '8px 12px' }}>
                                                <input value={line.pro} onChange={e => handleLineChange(idx, 'pro', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--slate-200)', fontSize: '13px' }} readOnly={isViewMode} />
                                            </td>
                                            <td style={{ padding: '8px 12px' }}>
                                                <input value={line.bol_vendor_ref} onChange={e => handleLineChange(idx, 'bol_vendor_ref', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--slate-200)', fontSize: '13px' }} readOnly={isViewMode} />
                                            </td>
                                            <td style={{ padding: '8px 12px' }}>
                                                <input value={line.vendor_name} onChange={e => handleLineChange(idx, 'vendor_name', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--slate-200)', fontSize: '13px' }} readOnly={isViewMode} />
                                            </td>
                                            <td style={{ padding: '8px 12px' }}>
                                                <input value={line.pallet_count} onChange={e => handleLineChange(idx, 'pallet_count', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--slate-200)', fontSize: '13px' }} readOnly={isViewMode} />
                                            </td>
                                            <td style={{ padding: '8px 12px' }}>
                                                <input value={line.carton_count} onChange={e => handleLineChange(idx, 'carton_count', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--slate-200)', fontSize: '13px' }} readOnly={isViewMode} />
                                            </td>
                                            <td style={{ padding: '8px 12px' }}>
                                                <input value={line.unit_count} onChange={e => handleLineChange(idx, 'unit_count', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--slate-200)', fontSize: '13px' }} readOnly={isViewMode} />
                                            </td>
                                            <td style={{ padding: '8px 12px' }}>
                                                <input value={line.po_list} onChange={e => handleLineChange(idx, 'po_list', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--slate-200)', fontSize: '13px' }} readOnly={isViewMode} />
                                            </td>
                                            {!isViewMode && (
                                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                                    {goodsLines.length > 1 && (
                                                        <button onClick={() => removeLine(idx)} style={{ color: '#EF4444', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="glass" style={{ padding: '0', overflow: 'hidden', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'var(--slate-50)', borderBottom: '2px solid var(--slate-100)' }}>
                                        <th style={{ padding: '16px', fontSize: '11px', fontWeight: 800, color: 'var(--slate-500)', textTransform: 'uppercase', textAlign: 'left', width: '40px' }}>#</th>
                                        <th style={{ padding: '16px', fontSize: '11px', fontWeight: 800, color: 'var(--slate-500)', textTransform: 'uppercase', textAlign: 'left', width: '100px' }}>{t('waybill.pallets')}</th>
                                        <th style={{ padding: '16px', fontSize: '11px', fontWeight: 800, color: 'var(--slate-500)', textTransform: 'uppercase', textAlign: 'left', width: '100px' }}>{t('waybill.items')}</th>
                                        <th style={{ padding: '16px', fontSize: '11px', fontWeight: 800, color: 'var(--slate-500)', textTransform: 'uppercase', textAlign: 'left', width: '180px' }}>{t('waybill.proDesc')}</th>
                                        <th style={{ padding: '16px', fontSize: '11px', fontWeight: 800, color: 'var(--slate-500)', textTransform: 'uppercase', textAlign: 'left' }}>{t('waybill.poList')}</th>
                                        {!isViewMode && <th style={{ padding: '16px', width: '50px' }}></th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {goodsLines.map((line, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid var(--slate-100)' }}>
                                            <td style={{ padding: '16px', color: 'var(--slate-400)', fontWeight: 700 }}>{idx + 1}</td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <input value={line.pallet_count} onChange={e => handleLineChange(idx, 'pallet_count', e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--slate-200)', fontSize: '14px', fontWeight: 600 }} readOnly={isViewMode} />
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <input value={line.item_count} onChange={e => handleLineChange(idx, 'item_count', e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--slate-200)', fontSize: '14px', fontWeight: 600 }} readOnly={isViewMode} />
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <input value={line.pro} onChange={e => handleLineChange(idx, 'pro', e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--slate-200)', fontSize: '14px', fontWeight: 600 }} readOnly={isViewMode} />
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <input value={line.po_list} onChange={e => handleLineChange(idx, 'po_list', e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--slate-200)', fontSize: '14px', fontWeight: 600 }} readOnly={isViewMode} />
                                            </td>
                                            {!isViewMode && (
                                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                                    {goodsLines.length > 1 && (
                                                        <button onClick={() => removeLine(idx)} style={{ color: '#EF4444', border: 'none', background: 'var(--slate-50)', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!isViewMode && (
                        <div style={{ marginTop: '16px' }}>
                            <button onClick={addLine} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '13px' }}>
                                <Plus size={16} /> {t('waybill.addGoodsLine')}
                            </button>
                        </div>
                    )}
                </div>


                {/* Signature Pad */}
                {((isEditMode || isViewMode) && signatureUrl) && (
                    <div style={{ marginBottom: '40px' }}>
                        <div style={{ pointerEvents: 'none' }}>
                            <SignaturePad onSave={handleSignatureSave} initialUrl={signatureUrl} />
                        </div>
                    </div>
                )}

                {/* Template Specific Header Content for Amazon (ISA) - MOVED TO TOP as per request */}
                {/* Note: In code logic, this block was previously below signature pad, but user requested it at top of template. 
                    However, your request said "Move ... to the top". 
                    I see there is already a "Template Specific Header Content" block at lines 721-828.
                    Wait, looking at the code, lines 721-828 ARE the ISA block. 
                    It is currently located AFTER the goods lines and signature pad (lines 529-718).
                    I will move this entire block (721-828) to go BEFORE the Template container start or inside it at the top. 
                */}

                {/* Final Submission Controls */}
                {!isViewMode && (
                    <div className="glass" style={{ padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', width: '100%' }}>
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
                                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '8px', textTransform: 'uppercase' }}>{t('waybill.billingType')}</div>
                                <select
                                    value={billingType}
                                    onChange={e => setBillingType(e.target.value as 'DISTANCE' | 'TIME')}
                                    style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700, fontSize: '14px' }}
                                >
                                    <option value="DISTANCE">{t('waybill.byDistance')}</option>
                                    <option value="TIME">{t('waybill.byTime')}</option>
                                </select>
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '8px', textTransform: 'uppercase' }}>{t('waybill.form.price')}</div>
                                <input name="price" value={footerInfo.price} onChange={handleFooterChange} placeholder="0.00" style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700, fontSize: '14px', width: '120px' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '8px', textTransform: 'uppercase' }}>{t('waybill.form.timeIn')}</div>
                                <input type="time" name="time_in" value={footerInfo.time_in} onChange={handleFooterChange} style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700, fontSize: '14px', width: '110px' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '8px', textTransform: 'uppercase' }}>{t('waybill.form.timeOut')}</div>
                                <input type="time" name="time_out" value={footerInfo.time_out} onChange={handleFooterChange} style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700, fontSize: '14px', width: '110px' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-end', flex: 1 }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '8px', textTransform: 'uppercase', visibility: 'hidden' }}>{t('pricing.calculate')}</div>
                                <button className="btn-secondary" onClick={handleSubmit} style={{ padding: '12px 24px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                                    {isEditMode ? t('waybill.updateWaybill') : t('waybill.createFinish')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
