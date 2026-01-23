import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, Clock, Camera, CheckCircle, AlertTriangle, ChevronLeft, Send } from 'lucide-react';
import { SignaturePad } from '../../components/SignaturePad';
import { useDialog } from '../../context/DialogContext';
import { API_BASE_URL } from '../../apiConfig';

interface Waybill {
    id: string;
    waybill_no: string;
    origin: string;
    destination: string;
    status: string;
    cargo_desc: string;
    customer_id: string;
    created_at: string;
    trip_id?: string;
    details?: any;
}

export const DriverWaybillDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { confirm, alert } = useDialog();
    const [waybill, setWaybill] = useState<Waybill | null>(null);
    const [loading, setLoading] = useState(true);
    const [showSignature, setShowSignature] = useState(false);
    const [showExceptionModal, setShowExceptionModal] = useState(false);
    const [exceptionType, setExceptionType] = useState('TRAFFIC');
    const [exceptionDesc, setExceptionDesc] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!id) return;

        const fetchWaybill = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/waybills/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setWaybill(data);
                } else {
                    console.error("Waybill not found");
                }
            } catch (err) {
                console.error("Failed to fetch waybill", err);
            } finally {
                setLoading(false);
            }
        };

        fetchWaybill();
    }, [id]);

    const handleUpdateStatus = async (newStatus: string) => {
        const ok = await confirm(`Are you sure you want to change status to ${newStatus}?`, 'Update Status');
        if (!ok) return;

        setIsUpdating(true);
        try {
            const res = await fetch(`${API_BASE_URL}/waybills/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...waybill,
                    status: newStatus
                })
            });

            if (res.ok) {
                const updated = await res.json();
                setWaybill(updated.waybill);
                alert(`Status updated to ${newStatus}`, 'Success');
            } else {
                throw new Error('Update failed');
            }
        } catch (err) {
            alert('Failed to update status', 'Error');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSignatureSave = async (signatureData: string) => {
        setIsUpdating(true);
        try {
            const now = new Date();
            const timeOut = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

            const updatedDetails = {
                ...(waybill?.details || {}),
                footerInfo: {
                    ...(waybill?.details?.footerInfo || {}),
                    time_out: timeOut
                }
            };

            const res = await fetch(`${API_BASE_URL}/waybills/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...waybill,
                    status: 'DELIVERED',
                    signature_url: signatureData,
                    signed_at: now.toISOString(),
                    signed_by: waybill?.customer_id || 'RECIPIENT',
                    details: updatedDetails
                })
            });

            if (res.ok) {
                const updated = await res.json();
                setWaybill(updated.waybill);
                setShowSignature(false);
                alert('Delivery confirmed with signature', 'Waybill Delivered');
            } else {
                throw new Error('Delivery confirmation failed');
            }
        } catch (err) {
            alert('Failed to confirm delivery', 'Error');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleReportException = async () => {
        if (!exceptionDesc.trim()) {
            return alert('Please provide a description for the exception');
        }

        setIsUpdating(true);
        try {
            // Use waybill.trip_id if available, fallback to WB ID for simulation
            const targetId = waybill?.trip_id || waybill?.id;

            const res = await fetch(`${API_BASE_URL}/trips/${targetId}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'EXCEPTION',
                    description: `[${exceptionType}] ${exceptionDesc}`
                })
            });

            if (res.ok) {
                alert('Exception reported successfully. Dispatcher has been notified.', 'Report Success');
                setShowExceptionModal(false);
                setExceptionDesc('');
            } else {
                throw new Error('Failed to report');
            }
        } catch (err) {
            alert('Failed to report exception. Please try again.', 'Error');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Compress or just convert to base64 for now
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            await uploadPhoto(base64String);
        };
        reader.readAsDataURL(file);
    };

    const uploadPhoto = async (base64Data: string) => {
        setIsUpdating(true);
        try {
            const res = await fetch(`${API_BASE_URL}/waybills/${waybill?.id}/photos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    photo: base64Data,
                    type: 'POD'
                })
            });

            if (res.ok) {
                alert('Photo uploaded and attached to waybill.', 'Upload Success');
            } else {
                throw new Error('Upload failed');
            }
        } catch (err) {
            alert('Failed to upload photo. Please try again.', 'Error');
        } finally {
            setIsUpdating(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (loading) return (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--slate-400)' }}>
            Loading waybill details...
        </div>
    );

    if (!waybill) return <div>Waybill not found</div>;

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out', paddingBottom: '40px' }}>
            {/* Back Button */}
            <button
                onClick={() => navigate('/driver')}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'transparent', border: 'none',
                    color: 'var(--slate-500)', fontWeight: 700, marginBottom: '24px',
                    cursor: 'pointer'
                }}
            >
                <ChevronLeft size={20} /> Back to List
            </button>

            {/* Status Card */}
            <div className="glass" style={{
                padding: '24px', borderRadius: '24px', background: 'white',
                marginBottom: '24px', border: '1px solid var(--glass-border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <div>
                    <div style={{ fontSize: '12px', color: 'var(--slate-400)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Current Status</div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary-start)' }}>{waybill.status}</div>
                </div>
                <div style={{
                    width: '48px', height: '48px', borderRadius: '16px',
                    background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-start)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Clock size={24} />
                </div>
            </div>

            {/* Info Card */}
            <div className="glass" style={{
                padding: '28px', borderRadius: '32px', background: 'white',
                marginBottom: '24px', border: '1px solid var(--glass-border)'
            }}>
                <h3 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '24px', color: 'var(--slate-900)' }}>{waybill.waybill_no}</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary-start)', border: '3px solid white', boxShadow: '0 0 0 4px rgba(59,130,246,0.1)' }}></div>
                            <div style={{ width: '2px', flex: 1, background: 'repeating-linear-gradient(to bottom, var(--slate-200) 0, var(--slate-200) 4px, transparent 4px, transparent 8px)' }}></div>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981', border: '3px solid white', boxShadow: '0 0 0 4px rgba(16,185,129,0.1)' }}></div>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--slate-400)', fontWeight: 800, textTransform: 'uppercase' }}>Pickup</div>
                                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--slate-800)' }}>{waybill.origin}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--slate-400)', fontWeight: 800, textTransform: 'uppercase' }}>Delivery</div>
                                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--slate-800)' }}>{waybill.destination}</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ height: '1px', background: 'var(--slate-100)' }}></div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                        <div>
                            <div style={{ fontSize: '11px', color: 'var(--slate-400)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Cargo Details</div>
                            <div style={{
                                padding: '16px',
                                borderRadius: '16px',
                                background: 'var(--slate-50)',
                                border: '1px solid var(--slate-100)',
                                fontSize: '15px',
                                fontWeight: 700,
                                color: 'var(--slate-700)',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px'
                            }}>
                                <Package size={20} style={{ marginTop: '2px', color: 'var(--primary-start)' }} />
                                <span style={{ lineHeight: '1.4' }}>{waybill.cargo_desc}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {waybill.status === 'ASSIGNED' && (
                    <button
                        onClick={() => handleUpdateStatus('IN_TRANSIT')}
                        disabled={isUpdating}
                        className="btn-primary"
                        style={{ padding: '18px', borderRadius: '20px', fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
                    >
                        {isUpdating ? 'Starting...' : <><Send size={20} /> Start Mission</>}
                    </button>
                )}

                {waybill.status === 'IN_TRANSIT' && (
                    <>
                        <button
                            onClick={() => setShowSignature(true)}
                            className="btn-primary"
                            style={{ padding: '18px', borderRadius: '20px', fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', background: 'var(--secondary)' }}
                        >
                            <CheckCircle size={20} /> Delivered & Sign
                        </button>
                        <button
                            onClick={() => setShowExceptionModal(true)}
                            className="btn-secondary"
                            style={{ padding: '18px', borderRadius: '20px', fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#F59E0B' }}
                        >
                            <AlertTriangle size={20} /> Report Exception
                        </button>
                    </>
                )}

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUpdating}
                    className="btn-secondary"
                    style={{ padding: '18px', borderRadius: '20px', fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
                >
                    <Camera size={20} /> {isUpdating ? 'Uploading...' : 'Upload Photo'}
                </button>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                />
            </div>

            {/* Signature Modal */}
            {showSignature && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div className="glass" style={{ width: '100%', maxWidth: '480px', background: 'white', borderRadius: '32px', padding: '32px', position: 'relative' }}>
                        <button
                            onClick={() => setShowSignature(false)}
                            style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--slate-100)', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <h3 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px' }}>Delivery Confirmation</h3>
                        <p style={{ color: 'var(--slate-500)', fontSize: '14px', marginBottom: '24px' }}>Please ask the recipient to sign below</p>

                        <SignaturePad onSave={handleSignatureSave} />
                    </div>
                </div>
            )}

            {/* Exception Modal */}
            {showExceptionModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div className="glass" style={{ width: '100%', maxWidth: '480px', background: 'white', borderRadius: '32px', padding: '32px', position: 'relative' }}>
                        <button
                            onClick={() => setShowExceptionModal(false)}
                            style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--slate-100)', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <h3 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <AlertTriangle size={24} /> Report Exception
                        </h3>
                        <p style={{ color: 'var(--slate-500)', fontSize: '14px', marginBottom: '24px' }}>Let dispatch know about the issue you're facing.</p>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Issue Type</label>
                            <select
                                value={exceptionType}
                                onChange={(e) => setExceptionType(e.target.value)}
                                style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--slate-200)', background: 'var(--slate-50)', fontWeight: 700, outline: 'none' }}
                            >
                                <option value="TRAFFIC">Traffic Congestion</option>
                                <option value="BREAKDOWN">Vehicle Breakdown</option>
                                <option value="ACCIDENT">Road Accident</option>
                                <option value="NO_SINGER">Nobody to Sign</option>
                                <option value="WRONG_ADDR">Wrong Address</option>
                                <option value="OTHER">Other Issue</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Description</label>
                            <textarea
                                value={exceptionDesc}
                                onChange={(e) => setExceptionDesc(e.target.value)}
                                placeholder="Describe the situation..."
                                style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--slate-200)', background: 'var(--slate-50)', minHeight: '120px', fontWeight: 600, outline: 'none', resize: 'none' }}
                            />
                        </div>

                        <button
                            onClick={handleReportException}
                            disabled={isUpdating}
                            className="btn-primary"
                            style={{ width: '100%', padding: '18px', borderRadius: '20px', fontSize: '16px', fontWeight: 800, background: '#F59E0B' }}
                        >
                            {isUpdating ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
