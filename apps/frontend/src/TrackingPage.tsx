import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Truck, Clock, Send, MessageSquare, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from './apiConfig';
import GoogleMap from './components/GoogleMap/GoogleMap';

export const TrackingPage = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    // Dynamic selection: use URL ID or wait for list to provide one
    const tripId = id && id !== 'undefined' ? id : null;
    const navigate = useNavigate();

    const [activeTrips, setActiveTrips] = useState<any[]>([]);
    const [tripData, setTripData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const fetchMessages = () => {
        if (!tripId) return;
        const token = localStorage.getItem('token');
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        fetch(`${API_BASE_URL}/trips/${tripId}/messages`, { headers })
            .then(res => res.ok ? res.json() : [])
            .then(data => setMessages(Array.isArray(data) ? data : []))
            .catch(e => { console.error("Msg Error", e); setMessages([]); });
    };

    // Load active trips list once
    useEffect(() => {
        const token = localStorage.getItem('token');
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        fetch(`${API_BASE_URL}/trips?status=ACTIVE`, { headers })
            .then(res => res.json())
            .then(data => {
                const trips = Array.isArray(data) ? data : [];
                setActiveTrips(trips);

                // Auto-navigate to first trip if none specified in URL
                if (!id && trips.length > 0) {
                    navigate(`/tracking/${trips[0].id}`, { replace: true });
                }
            })
            .catch(console.error);
    }, [id, navigate]);

    // Fetch specific trip data
    useEffect(() => {
        if (!tripId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        fetch(`${API_BASE_URL}/trips/${tripId}/tracking`, { headers })
            .then(async res => {
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Trip not found or tracking unavailable");
                }
                return res.json();
            })
            .then(data => {
                // Ensure array properties exist
                if (!data || !Array.isArray(data.waybills)) data.waybills = [];
                if (!data.timeline) data.timeline = [];
                setTripData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError(err.message);
                setLoading(false);
            });

        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [tripId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !tripId) return;
        try {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            await fetch(`${API_BASE_URL}/trips/${tripId}/messages`, {
                method: 'POST',
                headers,
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
            <div style={{ padding: '80px', textAlign: 'center', animation: 'fadeIn 0.5s ease-out' }}>
                <div style={{ marginBottom: '24px', color: '#EF4444' }}><AlertCircle size={64} /></div>
                <h2 style={{ color: 'var(--slate-900)', fontWeight: 800 }}>{t('common.error') || 'Tracking Unavailable'}</h2>
                <p style={{ color: 'var(--slate-500)', marginBottom: '32px' }}>{error}</p>
                <button onClick={() => navigate('/tracking')} className="btn-secondary">View Fleet Overview</button>
            </div>
        );
    }

    if (loading) return (
        <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: 40, height: 40, border: '4px solid var(--primary-start)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
                <div style={{ color: 'var(--slate-500)', fontWeight: 600 }}>Syncing Fleet Logistics...</div>
            </div>
        </div>
    );

    if (!tripData && !tripId) return (
        <div style={{ padding: '80px', textAlign: 'center', animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ marginBottom: '24px', color: 'var(--primary-start)' }}><Truck size={64} /></div>
            <h2 style={{ color: 'var(--slate-900)', fontWeight: 800 }}>No Active Deployments Selected</h2>
            <p style={{ color: 'var(--slate-500)', marginBottom: '32px' }}>Please select a vehicle from the fleet list to begin tracking.</p>
            {activeTrips.length === 0 && <p style={{ color: 'var(--slate-400)', fontStyle: 'italic' }}>The current fleet is stationed.</p>}
        </div>
    );

    if (!tripData) return null;

    const currentLat = tripData.currentLocation?.latitude || tripData.currentLocation?.lat || 43.6532;
    const currentLng = tripData.currentLocation?.longitude || tripData.currentLocation?.lng || -79.3832;
    const mapCenter = { lat: currentLat, lng: currentLng };
    const markers = [
        {
            id: 'current-location',
            position: mapCenter,
            title: tripData.vehicle?.plate || 'Current Position',
            info: `<div><strong>${tripData.vehicle?.plate || 'Vehicle'}</strong><br/>${tripData.currentLocation?.place || 'En route'}</div>`
        }
    ];

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

    const displayTime = (time: any) => {
        if (!time) return 'Pending...';
        try {
            return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '---';
        }
    };

    const directions = (tripData.waybills && tripData.waybills.length > 0)
        ? { origin: tripData.waybills[0].origin, destination: tripData.waybills[0].destination }
        : undefined;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 340px', gap: '24px', height: 'calc(100vh - 120px)', animation: 'fadeIn 0.5s ease-out' }}>

            {/* Left Sidebar: Active Fleet */}
            <div className="glass" style={{ display: 'flex', flexDirection: 'column', padding: '24px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                    <Truck size={20} color="var(--primary-start)" />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Fleet Activity</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {activeTrips.length === 0 ? <p style={{ color: 'var(--slate-400)', fontSize: '13px' }}>No active deployments</p> :
                        activeTrips.map(trip => (
                            <div
                                key={trip.id}
                                onClick={() => navigate(`/tracking/${trip.id}`)}
                                style={{
                                    padding: '16px',
                                    borderRadius: '16px',
                                    background: trip.id === tripId ? 'var(--primary-grad)' : 'var(--slate-50)',
                                    color: trip.id === tripId ? 'white' : 'var(--slate-900)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: trip.id === tripId ? '0 8px 16px rgba(0, 128, 255, 0.2)' : 'none'
                                }}
                            >
                                <div style={{ fontWeight: 800, fontSize: '14px' }}>{trip.vehicle_id}</div>
                                <div style={{ fontSize: '12px', color: trip.id === tripId ? 'rgba(255,255,255,0.8)' : 'var(--slate-500)', marginTop: '2px' }}>Driver: {trip.driver_name || trip.driver_id}</div>

                                {/* Waybill numbers under the trip */}
                                {trip.waybills && trip.waybills.length > 0 && (
                                    <div style={{
                                        marginTop: '12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px',
                                        borderTop: `1px solid ${trip.id === tripId ? 'rgba(255,255,255,0.2)' : 'var(--glass-border)'}`,
                                        paddingTop: '8px'
                                    }}>
                                        {trip.waybills.map((w: any) => (
                                            <div key={w.id} style={{
                                                fontSize: '11px',
                                                color: trip.id === tripId ? 'rgba(255,255,255,0.7)' : 'var(--slate-400)',
                                                fontWeight: 600
                                            }}>
                                                # {w.waybill_no} {w.client_name ? `- ${w.client_name}` : ''}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {trip.id === tripId && <div style={{ fontSize: '10px', fontWeight: 800, marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>• Tracking Active</div>}
                            </div>
                        ))
                    }
                </div>
            </div>

            {/* Middle: Map & Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
                <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px' }}>
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '4px' }}>In Transit • {tripData.vehicle?.plate || 'Unknown Asset'}</div>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>{tripData.driver?.name || 'Assigned Driver'}</h2>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '4px' }}>Arrival Estimate</div>
                        <div style={{ fontWeight: 700, color: 'var(--primary-start)' }}>{displayTime(tripData.end_time_est)} Today</div>
                    </div>
                </div>

                <div className="glass" style={{ height: '400px', padding: '12px', position: 'relative', overflow: 'hidden' }}>
                    <GoogleMap center={mapCenter} zoom={12} markers={markers} directions={directions} height="100%" />
                </div>

                <div className="glass-card" style={{ padding: '32px' }}>
                    <h3 style={{ marginTop: 0, fontSize: '18px', fontWeight: 800, marginBottom: '24px' }}>Assigned Manifest</h3>
                    {(!tripData.waybills || tripData.waybills.length === 0) ? <p style={{ color: 'var(--slate-400)' }}>No waybills assigned.</p> :
                        tripData.waybills.map((w: any) => (
                            <div key={w.id} style={{ padding: '20px', border: '1px solid var(--glass-border)', borderRadius: '16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--slate-50)' }}>
                                <div>
                                    <div style={{ fontWeight: 800, color: 'var(--slate-900)' }}>{w.waybill_no}</div>
                                    <div style={{ fontSize: '13px', color: 'var(--slate-500)', marginTop: '4px' }}>{w.origin} → {w.destination}</div>
                                </div>
                                <div className="badge-blue" style={{ fontWeight: 700 }}>{w.cargo_desc}</div>
                            </div>
                        ))}
                </div>
            </div>

            {/* Right: Timeline & Chat */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="glass-card" style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                        <Clock size={16} color="var(--primary-start)" />
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Journey Timeline</h3>
                    </div>
                    <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '2px solid var(--glass-border)', marginLeft: '8px' }}>
                        {(!tripData.timeline || tripData.timeline.length === 0) ? <p style={{ color: 'var(--slate-400)', fontSize: '13px' }}>Awaiting events...</p> :
                            tripData.timeline.map((event: any, i: number) => (
                                <div key={i} style={{ marginBottom: '28px', position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '-31px', top: '0', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary-grad)', border: '3px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}></div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)' }}>{displayTime(event.time)}</div>
                                    <div style={{ fontWeight: 800, fontSize: '14px', margin: '2px 0', color: 'var(--slate-900)' }}>{event.status}</div>
                                    <div style={{ fontSize: '13px', color: 'var(--slate-500)' }}>{event.description}</div>
                                </div>
                            ))}
                    </div>
                </div>

                <div className="glass-card" style={{ height: '400px', display: 'flex', flexDirection: 'column', padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                        <MessageSquare size={16} color="var(--primary-start)" />
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Comm Link</h3>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: 'var(--slate-50)', borderRadius: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--glass-border)' }}>
                        {messages.length === 0 ? <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate-400)', fontSize: '12px' }}>No messages exchanged yet</div> :
                            messages.map(m => (
                                <div key={m.id} style={{
                                    alignSelf: m.sender === 'DISPATCHER' ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                    background: m.sender === 'DISPATCHER' ? 'var(--primary-grad)' : 'white',
                                    color: m.sender === 'DISPATCHER' ? 'white' : 'var(--slate-900)',
                                    padding: '10px 14px',
                                    borderRadius: m.sender === 'DISPATCHER' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                    border: m.sender !== 'DISPATCHER' ? '1px solid var(--glass-border)' : 'none',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                                }}>
                                    <div style={{ fontSize: '10px', opacity: 0.7, fontWeight: 700, marginBottom: '2px', textTransform: 'uppercase' }}>{m.sender}</div>
                                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{m.text}</div>
                                </div>
                            ))}
                        <div ref={chatEndRef} />
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Message driver..."
                            style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 600, fontSize: '13px' }}
                        />
                        <button
                            onClick={handleSendMessage}
                            className="btn-primary"
                            style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
