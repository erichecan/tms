
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Truck, MessageSquare, Send, Clock } from 'lucide-react';

// Mock Map Component
const MockMap = ({ location }: { location: any }) => (
    <div style={{ width: '100%', height: '400px', background: '#E5E7EB', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, background: 'var(--color-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: '4px solid white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <Truck size={24} />
            </div>
            <div style={{ marginTop: 8, background: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                {location?.place || 'Unknown Location'}
            </div>
        </div>
        <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'white', padding: 8, borderRadius: 8, fontSize: 12 }}>
            Google Maps Mock
        </div>
    </div>
);

export const TrackingPage = () => {
    // Hardcoded ID for MVP demo if no params
    const { id } = useParams();
    const tripId = id || 'T-1001';

    const [tripData, setTripData] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    const fetchMessages = () => {
        fetch(`http://localhost:3001/api/trips/${tripId}/messages`)
            .then(res => res.ok ? res.json() : [])
            .then(data => setMessages(Array.isArray(data) ? data : []))
            .catch(e => { console.error("Msg Error", e); setMessages([]); });
    };

    useEffect(() => {
        const API_URL = 'http://localhost:3001/api';
        fetch(`${API_URL}/trips/${tripId}/tracking`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch tracking");
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
            .catch(console.error);

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // Polling chat
        return () => clearInterval(interval);
    }, [tripId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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

    if (!tripData) return <div>Loading Tracking Data...</div>;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', height: 'calc(100vh - 100px)' }}>
            {/* Left Column: Map & Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>

                {/* Header Card */}
                <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '20px' }}>In Transit: {tripData.driver?.name}</h2>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '4px', color: '#6B7280' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Truck size={14} /> {tripData.vehicle?.plate}</span>
                            <span>•</span>
                            <span>ETA: {new Date(tripData.end_time_est).toLocaleString()}</span>
                        </div>
                    </div>
                    <div className={`badge ${tripData.status === 'ACTIVE' ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: '14px', padding: '6px 12px' }}>
                        {tripData.status}
                    </div>
                </div>

                {/* Map */}
                <MockMap location={tripData.currentLocation} />

                {/* Waybill Info */}
                <div className="card">
                    <h3 style={{ marginTop: 0 }}>Waybills on Route</h3>
                    {tripData.waybills.map((w: any) => (
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
                    <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={16} /> Timeline</h3>
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
                <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><MessageSquare size={16} /> Communication</h3>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '12px', background: '#F9FAFB', borderRadius: '8px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {messages.map(m => (
                            <div key={m.id} style={{
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
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type a message..."
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                        />
                        <button
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
