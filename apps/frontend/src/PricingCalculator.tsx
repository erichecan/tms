
import React, { useState, useEffect, useRef } from 'react';
import {
    Calculator,
    MapPin,
    Navigation,
    Clock,
    DollarSign,
    TrendingUp,
    Info,
    AlertCircle,
    ArrowRight
} from 'lucide-react';
import { calculatePrice, type PricingResult } from './services/pricingService';
import { createPlacesAutocomplete } from './services/mapsService';

export const PricingCalculator: React.FC = () => {
    const [pickup, setPickup] = useState<any>(null);
    const [delivery, setDelivery] = useState<any>(null);
    const [businessType, setBusinessType] = useState('STANDARD');
    const [waitingTime, setWaitingTime] = useState<number | string>(0);
    const [result, setResult] = useState<PricingResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const pickupInputRef = useRef<HTMLInputElement>(null);
    const deliveryInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (pickupInputRef.current) {
            createPlacesAutocomplete(pickupInputRef.current, {
                onPlaceSelected: (place: google.maps.places.PlaceResult) => {
                    if (place.geometry && place.geometry.location) {
                        setPickup({
                            formattedAddress: place.formatted_address,
                            latitude: place.geometry.location.lat(),
                            longitude: place.geometry.location.lng()
                        });
                    }
                }
            });
        }
        if (deliveryInputRef.current) {
            createPlacesAutocomplete(deliveryInputRef.current, {
                onPlaceSelected: (place: google.maps.places.PlaceResult) => {
                    if (place.geometry && place.geometry.location) {
                        setDelivery({
                            formattedAddress: place.formatted_address,
                            latitude: place.geometry.location.lat(),
                            longitude: place.geometry.location.lng()
                        });
                    }
                }
            });
        }
    }, []);

    const handleCalculate = async () => {
        if (!pickup || !delivery) {
            setError('Please select both pickup and delivery addresses');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await calculatePrice({
                pickupAddress: pickup,
                deliveryAddress: delivery,
                businessType,
                waitingTimeLimit: Number(waitingTime) || 0
            });
            setResult(res);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Pricing Engine Timeout. Check your API configuration.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ paddingBottom: '40px', animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>
                    Intelligent Price Calculator
                </h1>
                <p style={{ margin: 0, color: 'var(--slate-500)', fontSize: '14px' }}>
                    Real-time logistics cost estimation powered by Global Rule Engine.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 450px', gap: '32px' }}>

                {/* Configuration Panel */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
                        <Navigation size={20} color="var(--primary-start)" />
                        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Route Parameters</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', marginBottom: '8px', textTransform: 'uppercase' }}>
                                Pickup Location
                            </label>
                            <div style={{ position: 'relative' }}>
                                <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-start)' }} />
                                <input
                                    ref={pickupInputRef}
                                    className="glass"
                                    placeholder="Enter origin address..."
                                    style={{ width: '100%', padding: '14px 14px 14px 40px', borderRadius: '14px', border: '1px solid var(--glass-border)', fontWeight: 600, fontSize: '14px' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', marginBottom: '8px', textTransform: 'uppercase' }}>
                                Delivery Destination
                            </label>
                            <div style={{ position: 'relative' }}>
                                <ArrowRight size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#10b981' }} />
                                <input
                                    ref={deliveryInputRef}
                                    className="glass"
                                    placeholder="Enter destination address..."
                                    style={{ width: '100%', padding: '14px 14px 14px 40px', borderRadius: '14px', border: '1px solid var(--glass-border)', fontWeight: 600, fontSize: '14px' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', marginBottom: '8px', textTransform: 'uppercase' }}>
                                    Business Type
                                </label>
                                <select
                                    value={businessType}
                                    onChange={(e) => setBusinessType(e.target.value)}
                                    className="glass"
                                    style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid var(--glass-border)', fontWeight: 600, fontSize: '14px', outline: 'none' }}
                                >
                                    <option value="STANDARD">Standard Delivery</option>
                                    <option value="WASTE_COLLECTION">Waste Collection</option>
                                    <option value="WAREHOUSE_TRANSFER">Warehouse Transfer</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', marginBottom: '8px', textTransform: 'uppercase' }}>
                                    Waiting Window (min)
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Clock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
                                    <input
                                        type="number"
                                        value={waitingTime}
                                        onChange={(e) => setWaitingTime(e.target.value)}
                                        className="glass"
                                        style={{ width: '100%', padding: '14px 14px 14px 40px', borderRadius: '14px', border: '1px solid var(--glass-border)', fontWeight: 600, fontSize: '14px' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div style={{ padding: '12px 16px', background: '#fee2e2', borderRadius: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 600 }}>
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleCalculate}
                        disabled={loading}
                        className="btn-primary"
                        style={{ width: '100%', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '16px' }}
                    >
                        {loading ? <div className="spinner-small"></div> : <Calculator size={20} />}
                        {loading ? 'Analyzing Market Rates...' : 'Calculate Quote'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                        <Info size={14} color="var(--slate-400)" />
                        <span style={{ fontSize: '12px', color: 'var(--slate-400)', fontWeight: 500 }}>
                            Estimates include distance surcharges and current fuel levels.
                        </span>
                    </div>
                </div>

                {/* Results Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="glass-card" style={{
                        background: 'var(--primary-grad)',
                        color: 'white',
                        border: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '40px 24px',
                        textAlign: 'center'
                    }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.1em', marginBottom: '8px' }}>
                            Estimated Shipment Total
                        </span>
                        <div style={{ fontSize: '48px', fontWeight: 900, marginBottom: '16px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            {result ? (
                                <>
                                    <span style={{ fontSize: '24px', opacity: 0.8 }}>$</span>
                                    {result.totalRevenue.toLocaleString()}
                                    <span style={{ fontSize: '16px', opacity: 0.8 }}>{result.currency}</span>
                                </>
                            ) : (
                                '--.--'
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '20px', fontSize: '13px', fontWeight: 600, opacity: 0.9 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <TrendingUp size={16} />
                                <span>{result ? `${result.distance.toFixed(1)} km` : '0 km'}</span>
                            </div>
                            <div style={{ width: '1px', background: 'rgba(255,255,255,0.3)' }}></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Clock size={16} />
                                <span>{result ? `${result.duration.toFixed(0)} min` : '0 min'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card" style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                            Cost Breakdown
                        </h3>

                        {result ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {result.breakdown.map((item, idx) => (
                                    <div key={idx} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        paddingBottom: '12px',
                                        borderBottom: idx === result.breakdown.length - 1 ? 'none' : '1px solid var(--slate-100)'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '2px' }}>
                                                {item.componentName}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--slate-400)', fontWeight: 600, fontFamily: 'monospace' }}>
                                                {item.formula}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--slate-900)' }}>
                                            ${item.amount.toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px 0', color: 'var(--slate-300)', gap: '12px' }}>
                                <DollarSign size={40} opacity={0.2} />
                                <p style={{ fontSize: '14px', fontWeight: 600 }}>Awaiting parameters...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .glass-card {
                    background: var(--glass-bg);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid var(--glass-border);
                    border-radius: 24px;
                    padding: 24px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.05);
                }
                .glass {
                    background: rgba(255, 255, 255, 0.4);
                    backdrop-filter: blur(8px);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .glass:focus {
                    background: white;
                    border-color: var(--primary-start);
                    box-shadow: 0 0 0 4px rgba(0, 128, 255, 0.1);
                }
                .spinner-small {
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
