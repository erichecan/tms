import { useState } from 'react';
import { Search, Send, Phone, Video, MoreVertical, Paperclip } from 'lucide-react';

interface Contact {
    id: string; // Trip ID for now, since chat is trip-based
    name: string; // Driver Name
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
    // Mock Data for UI
    const contacts: Contact[] = [
        { id: 'T-1001', name: 'James Holloway', avatar: 'https://i.pravatar.cc/150?u=D-001', lastMessage: 'Loaded and rolling out.', time: '10:30 AM', unread: 2, status: 'online' },
        { id: 'T-1002', name: 'Michael Davidson', avatar: 'https://i.pravatar.cc/150?u=D-003', lastMessage: 'Traffic is heavy near Chicago.', time: '09:15 AM', unread: 0, status: 'offline' },
    ];

    const [activeContactId, setActiveContactId] = useState(contacts[0].id);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', sender: 'other', text: 'Loaded and rolling out.', time: '10:30 AM' },
        { id: '2', sender: 'me', text: 'Copy that. Drive safe!', time: '10:31 AM' },
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
        <div style={{ height: 'calc(100vh - 100px)', display: 'flex', gap: '24px' }}>
            {/* Sidebar List */}
            <div className="card" style={{ width: '300px', padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #F3F4F6' }}>
                    <h2 style={{ margin: '0 0 16px', fontSize: '20px' }}>Messages</h2>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                        <input
                            placeholder="Search chats..."
                            style={{
                                width: '100%', padding: '8px 8px 8px 36px',
                                border: '1px solid #E5E7EB', borderRadius: '8px', background: '#F9FAFB', outline: 'none'
                            }}
                        />
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {contacts.map(contact => (
                        <div
                            key={contact.id}
                            onClick={() => setActiveContactId(contact.id)}
                            style={{
                                padding: '16px 20px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', transition: 'background 0.2s',
                                background: activeContactId === contact.id ? '#EFF6FF' : 'white',
                                borderLeft: activeContactId === contact.id ? '4px solid var(--color-primary)' : '4px solid transparent'
                            }}
                        >
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ position: 'relative' }}>
                                    <img src={contact.avatar} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                                    <div style={{
                                        position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', borderRadius: '50%',
                                        background: contact.status === 'online' ? '#10B981' : '#9CA3AF', border: '2px solid white'
                                    }}></div>
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>{contact.name}</div>
                                        <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{contact.time}</div>
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {contact.lastMessage}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="card" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={activeContact?.avatar} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                        <div>
                            <div style={{ fontWeight: 600 }}>{activeContact?.name}</div>
                            <div style={{ fontSize: '12px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }}></div> Online
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', color: '#6B7280' }}>
                        <Phone size={20} style={{ cursor: 'pointer' }} />
                        <Video size={20} style={{ cursor: 'pointer' }} />
                        <MoreVertical size={20} style={{ cursor: 'pointer' }} />
                    </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, padding: '24px', background: '#F9FAFB', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {messages.map(msg => (
                        <div key={msg.id} style={{ alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                            <div style={{
                                padding: '12px 16px', borderRadius: '12px',
                                background: msg.sender === 'me' ? 'var(--color-primary)' : 'white',
                                color: msg.sender === 'me' ? 'white' : '#374151',
                                borderTopRightRadius: msg.sender === 'me' ? '2px' : '12px',
                                borderTopLeftRadius: msg.sender === 'other' ? '2px' : '12px',
                                boxShadow: msg.sender === 'other' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                            }}>
                                {msg.text}
                            </div>
                            <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px', textAlign: msg.sender === 'me' ? 'right' : 'left' }}>
                                {msg.time}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input */}
                <div style={{ padding: '20px', background: 'white', borderTop: '1px solid #F3F4F6' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                        <button style={{ padding: '10px', color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <Paperclip size={20} />
                        </button>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                            placeholder="Type a message..."
                            style={{
                                flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none', resize: 'none',
                                maxHeight: '100px', fontFamily: 'inherit'
                            }}
                            rows={1}
                        />
                        <button
                            onClick={handleSend}
                            className="btn-primary"
                            style={{ padding: '10px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
