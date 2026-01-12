
import { useState } from 'react';
import { Search, Send, Phone, Video, MoreVertical, Paperclip, MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Contact {
    id: string;
    name: string;
    avatar: string;
    lastMessage: string;
    time: string;
    unread: number;
    status: 'online' | 'offline';
}

interface Message {
    id: string;
    sender: 'me' | 'other';
    text: string;
    time: string;
}

export const Messages = () => {
    const { t } = useTranslation();
    const contacts: Contact[] = [
        { id: 'T-1001', name: 'James Holloway', avatar: 'https://i.pravatar.cc/150?u=D-001', lastMessage: 'Loaded and rolling out.', time: '10:30 AM', unread: 2, status: 'online' },
        { id: 'T-1002', name: 'Michael Davidson', avatar: 'https://i.pravatar.cc/150?u=D-003', lastMessage: 'Traffic is heavy near Chicago.', time: '09:15 AM', unread: 0, status: 'offline' },
    ];

    const [activeContactId, setActiveContactId] = useState(contacts[0].id);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', sender: 'other', text: 'Loaded and rolling out for the Quebec route. ETA looking good.', time: '10:30 AM' },
        { id: '2', sender: 'me', text: 'Copy that. Sensors show a clear path ahead. Drive safe!', time: '10:31 AM' },
    ]);
    const [inputText, setInputText] = useState('');

    const activeContact = contacts.find(c => c.id === activeContactId);

    const handleSend = () => {
        if (!inputText.trim()) return;
        setMessages([...messages, {
            id: Date.now().toString(),
            sender: 'me',
            text: inputText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setInputText('');
    };

    return (
        <div style={{ height: 'calc(100vh - 120px)', display: 'flex', gap: '24px', animation: 'fadeIn 0.5s ease-out' }}>
            {/* Sidebar List */}
            <div className="glass" style={{ width: '380px', padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>{t('sidebar.messages')}</h2>
                        <button className="btn-secondary" style={{ padding: '8px', borderRadius: '10px' }}><MoreHorizontal size={18} /></button>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
                        <input
                            placeholder={t('common.search')}
                            style={{
                                width: '100%', padding: '12px 12px 12px 48px',
                                border: '1px solid var(--glass-border)', borderRadius: '12px', background: 'var(--slate-50)', outline: 'none',
                                fontWeight: 600, fontSize: '14px'
                            }}
                        />
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                    {contacts.map(contact => (
                        <div
                            key={contact.id}
                            onClick={() => setActiveContactId(contact.id)}
                            style={{
                                padding: '16px', cursor: 'pointer', borderRadius: '16px', marginBottom: '8px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                background: activeContactId === contact.id ? 'var(--primary-grad)' : 'transparent',
                                color: activeContactId === contact.id ? 'white' : 'inherit',
                                boxShadow: activeContactId === contact.id ? '0 8px 16px rgba(0, 128, 255, 0.2)' : 'none'
                            }}
                        >
                            <div style={{ display: 'flex', gap: '14px' }}>
                                <div style={{ position: 'relative' }}>
                                    <img src={contact.avatar} style={{ width: '48px', height: '48px', borderRadius: '14px', border: '2px solid white' }} />
                                    <div style={{
                                        position: 'absolute', bottom: -2, right: -2, width: '12px', height: '12px', borderRadius: '50%',
                                        background: contact.status === 'online' ? 'var(--secondary)' : 'var(--slate-400)', border: '2px solid white'
                                    }}></div>
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <div style={{ fontWeight: 800, fontSize: '14px' }}>{contact.name}</div>
                                        <div style={{ fontSize: '11px', opacity: 0.8, fontWeight: 700 }}>{contact.time}</div>
                                    </div>
                                    <div style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500, opacity: activeContactId === contact.id ? 0.9 : 0.7 }}>
                                        {contact.lastMessage}
                                    </div>
                                </div>
                                {contact.unread > 0 && activeContactId !== contact.id && (
                                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800 }}>
                                        {contact.unread}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="glass" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--slate-50)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ position: 'relative' }}>
                            <img src={activeContact?.avatar} style={{ width: '48px', height: '48px', borderRadius: '14px' }} />
                            <div style={{ position: 'absolute', bottom: -2, right: -2, width: '12px', height: '12px', borderRadius: '50%', background: 'var(--secondary)', border: '2px solid white' }}></div>
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--slate-900)' }}>{activeContact?.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Live Tracking • Active Roster
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn-secondary" style={{ width: '44px', height: '44px', padding: 0 }}><Phone size={20} /></button>
                        <button className="btn-secondary" style={{ width: '44px', height: '44px', padding: 0 }}><Video size={20} /></button>
                        <button className="btn-secondary" style={{ width: '44px', height: '44px', padding: 0 }}><MoreVertical size={20} /></button>
                    </div>
                </div>

                {/* Messages Container */}
                <div style={{ flex: 1, padding: '32px', background: 'rgba(248, 250, 252, 0.5)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {messages.map(msg => (
                        <div key={msg.id} style={{ alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                            <div style={{
                                padding: '16px 20px', borderRadius: '18px',
                                background: msg.sender === 'me' ? 'var(--primary-grad)' : 'white',
                                color: msg.sender === 'me' ? 'white' : 'var(--slate-900)',
                                borderTopRightRadius: msg.sender === 'me' ? '4px' : '18px',
                                borderTopLeftRadius: msg.sender === 'other' ? '4px' : '18px',
                                boxShadow: msg.sender === 'other' ? '0 4px 12px rgba(0,0,0,0.03)' : '0 8px 20px rgba(0, 128, 255, 0.15)',
                                fontWeight: 500,
                                fontSize: '14px',
                                lineHeight: '1.5'
                            }}>
                                {msg.text}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--slate-400)', fontWeight: 700, marginTop: '6px', textAlign: msg.sender === 'me' ? 'right' : 'left', textTransform: 'uppercase' }}>
                                {msg.time} {msg.sender === 'me' && '• Delivered'}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Controls */}
                <div style={{ padding: '24px 32px', background: 'white', borderTop: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <button className="btn-secondary" style={{ width: '44px', height: '44px', padding: 0, borderRadius: '12px' }}>
                            <Paperclip size={20} />
                        </button>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                                placeholder="Compose secure transmission..."
                                style={{
                                    width: '100%', padding: '14px 20px', borderRadius: '14px', border: '1px solid var(--glass-border)', outline: 'none', resize: 'none',
                                    background: 'var(--slate-50)', fontWeight: 600, fontSize: '14px', fontFamily: 'inherit',
                                    minHeight: '48px', maxHeight: '120px'
                                }}
                                rows={1}
                            />
                        </div>
                        <button
                            onClick={handleSend}
                            className="btn-primary"
                            style={{ width: '48px', height: '48px', padding: 0, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
