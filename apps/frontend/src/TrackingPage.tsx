

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Truck, MessageSquare, Send, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GoogleMap from './components/GoogleMap/GoogleMap';

export const TrackingPage = () => {
    const { t } = useTranslation();
    // Hardcoded ID for MVP demo if no params
    const { id } = useParams();
    const tripId = id || 'T-1001';
    const navigate = useNavigate();

    const [activeTrips, setActiveTrips] = useState<any[]>([]);
    const [tripData, setTripData] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const fetchMessages = () => {
        fetch(`http://localhost:3001/api/trips/${tripId}/messages`)
            .then(res => res.ok ? res.json() : [])
            .then(data => setMessages(Array.isArray(data) ? data : []))
            .catch(e => { console.error("Msg Error", e); setMessages([]); });
    };

    useEffect(() => {
        const API_URL = 'http://localhost:3001/api';
        setError(null);
        fetch(`${API_URL}/trips/${tripId}/tracking`)
            .then(async res => {
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Failed to fetch tracking");
                }
                return res.json();
            })
            .then(data => {
                // Validate essential data structure to prevent crash
                if (!data || !Array.isArray(data.waybills)) {
                    data.waybills = []; // Fallback
                }
                // Ensure timeline exists
                if (!data.timeline) data.timeline = [];

                setTripData(data);
            })
            .catch(err => {
                console.error(err);
                setError(err.message);
            });

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // Polling chat
        return () => clearInterval(interval);
    }, [tripId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Fetch Active Trips for Sidebar
    useEffect(() => {
        fetch('http://localhost:3001/api/trips?status=ACTIVE')
            .then(res => res.json())
            .then(data => setActiveTrips(Array.isArray(data) ? data : []))
            .catch(console.error);
    }, []);

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
        try {
            await fetch(`http://localhost:3001/api/trips/${tripId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newMessage })
            });
            setNewMessage('');
            fetchMessages();
        } catch (err) {
            console.error(err);
        }
    };

    if (error) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h2 style={{ color: '#EF4444' }}>{t('common.error') || 'Error'}</h2>
                <p>{error}</p>
                <button onClick={() => window.location.reload()} className="btn-secondary">Retry</button>
            </div>
        );
    }

    if (!tripData) return <div>{t('common.loading')}</div>;

    // Prepare Lat/Lng for Google Maps
    // Assuming backend provides latitude/longitude in currentLocation or we use defaults for demo
    // If real data is missing, we default to a known location (e.g. Toronto)
    const currentLat = tripData.currentLocation?.latitude || tripData.currentLocation?.lat || 43.6532;
    const currentLng = tripData.currentLocation?.longitude || tripData.currentLocation?.lng || -79.3832;

    const mapCenter = { lat: currentLat, lng: currentLng };

    // Create markers
    const markers = [
        {
            id: 'current-location',
            position: mapCenter,
            title: tripData.vehicle?.plate || 'Current Location',
            info: `<div>
                    <strong>${tripData.vehicle?.plate || 'Vehicle'}</strong><br/>
                    ${tripData.currentLocation?.place || 'Unknown Location'}
                   </div>`
        }
    ];

    // Add waybill markers if they have coordinates
    tripData.waybills.forEach((w: any) => {
        if (w.destinationLat && w.destinationLng) {
            markers.push({
                id: `waybill-${w.id}`,
                position: { lat: w.destinationLat, lng: w.destinationLng },
                title: w.waybill_no,
                info: `<div><strong>${w.waybill_no}</strong><br/>${w.destination}</div>`
            });
        }
    });

    // ... existing fetch logic for specific trip ...

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 320px', gap: '24px', height: 'calc(100vh - 100px)' }}>

            {/* Left Sidebar: Active Fleet List */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
                <h3 style={{ marginTop: 0, fontSize: '16px' }}>{t('sidebar.trackingLoop') || 'Tracking Loop'}</h3>
                {activeTrips.length === 0 ? <p style={{ color: '#9CA3AF', fontSize: '13px' }}>No active trips</p> :
                    activeTrips.map(trip => (
                        <div
                            key={trip.id}
                            onClick={() => navigate(`/tracking/${trip.id}`)}
                            style={{
                                padding: '12px',
                                borderRadius: '8px',
                                border: trip.id === tripId ? '1px solid var(--color-primary)' : '1px solid transparent',
                                background: trip.id === tripId ? 'var(--color-primary-light, #eff6ff)' : '#F9FAFB',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{trip.vehicle_id}</div>
                            <div style={{ fontSize: '12px', color: '#6B7280' }}>Driver: {trip.driver_id}</div>
                            {trip.id === tripId && <div style={{ fontSize: '11px', color: 'var(--color-primary)', marginTop: '4px' }}>• Viewing</div>}
                        </div>
                    ))
                }
            </div>

            {/* Middle Column: Map & Waybills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>

                {/* Header Card */}
                <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '20px' }}>{t('tracking.inTransit')}: {tripData.driver?.name}</h2>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '4px', color: '#6B7280' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Truck size={14} /> {tripData.vehicle?.plate}</span>
                            <span>•</span>
                            <span>{t('tracking.eta')}: {new Date(tripData.end_time_est).toLocaleString()}</span>
                        </div>
                    </div>
                    <div className={`badge ${tripData.status === 'ACTIVE' ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: '14px', padding: '6px 12px' }}>
                        {tripData.status}
                    </div>
                </div>

                {/* Map */}
                <GoogleMap
                    center={mapCenter}
                    zoom={12}
                    markers={markers}
                    height="400px"
                />

                {/* Waybill Info */}
                <div className="card">
                    <h3 style={{ marginTop: 0 }}>{t('tracking.waybillsOnRoute')}</h3>
                    {tripData.waybills.length === 0 ? <p>{t('dashboard.noJobs')}</p> :
                        tripData.waybills.map((w: any) => (
                            <div key={w.id} style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{w.waybill_no}</div>
                                    <div style={{ fontSize: '13px', color: '#6B7280' }}>{w.origin} → {w.destination}</div>
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{w.cargo_desc}</div>
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            {/* Right Column: Timeline & Chat */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>

                {/* Timeline */}
                <div className="card" style={{ flex: 1, overflowY: 'auto' }}>
                    <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={16} /> {t('tracking.timeline')}</h3>
                    <div style={{ position: 'relative', paddingLeft: '16px', borderLeft: '2px solid #E5E7EB', marginLeft: '8px' }}>
                        {tripData.timeline?.map((event: any, i: number) => (
                            <div key={i} style={{ marginBottom: '24px', position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '-21px', top: '0', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-primary)', border: '2px solid white' }}></div>
                                <div style={{ fontSize: '12px', color: '#6B7280' }}>{new Date(event.time).toLocaleTimeString()}</div>
                                <div style={{ fontWeight: 500 }}>{event.status}</div>
                                <div style={{ fontSize: '14px' }}>{event.description}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat */}
                <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
                    <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><MessageSquare size={16} /> {t('tracking.communication')}</h3>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '12px', background: '#F9FAFB', borderRadius: '8px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {messages.map(m => (
                            <div key={m.id} data-testid="chat-message" style={{
                                alignSelf: m.sender === 'DISPATCHER' ? 'flex-end' : 'flex-start',
                                maxWidth: '80%',
                                background: m.sender === 'DISPATCHER' ? 'var(--color-primary)' : 'white',
                                color: m.sender === 'DISPATCHER' ? 'white' : 'black',
                                padding: '8px 12px',
                                borderRadius: '12px',
                                border: m.sender !== 'DISPATCHER' ? '1px solid #E5E7EB' : 'none',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '2px' }}>{m.sender}</div>
                                <div>{m.text}</div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            data-testid="chat-input"
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                            placeholder={t('messages.typeMessage')}
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                        />
                        <button
                            data-testid="send-message-btn"
                            onClick={handleSendMessage}
                            style={{ background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', width: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

