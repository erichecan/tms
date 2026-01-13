
import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Eye, Edit, FileText, Download, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../apiConfig';
import { useDialog } from '../context/DialogContext';

interface WaybillActionMenuProps {
    waybillId: string;
    onDelete?: () => void;
}

export const WaybillActionMenu = ({ waybillId, onDelete }: WaybillActionMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [openUpwards, setOpenUpwards] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const navigate = useNavigate();
    const { confirm } = useDialog();

    const toggleMenu = () => {
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            // If less than 250px below, open upwards
            setOpenUpwards(spaceBelow < 250);
        }
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAction = (action: string) => {
        setIsOpen(false);
        switch (action) {
            case 'view':
                navigate(`/waybills/edit/${waybillId}?mode=view`);
                break;
            case 'edit':
                navigate(`/waybills/edit/${waybillId}`);
                break;
            case 'pdf':
                window.open(`${API_BASE_URL}/waybills/${waybillId}/pdf`, '_blank');
                break;
            case 'bol':
                window.open(`${API_BASE_URL}/waybills/${waybillId}/bol`, '_blank');
                break;
            case 'delete':
                confirm('Are you sure you want to permanently delete this waybill? This action cannot be undone.', 'Delete Waybill').then(ok => {
                    if (ok) onDelete?.();
                });
                break;
        }
    };

    return (
        <div style={{ position: 'relative' }} ref={menuRef}>
            <button
                ref={buttonRef}
                className="btn-secondary"
                style={{ padding: '8px', borderRadius: '10px', cursor: 'pointer' }}
                onClick={toggleMenu}
            >
                <MoreHorizontal size={20} />
            </button>

            {isOpen && (
                <div className="glass" style={{
                    position: 'absolute',
                    right: 0,
                    [openUpwards ? 'bottom' : 'top']: '100%',
                    [openUpwards ? 'marginBottom' : 'marginTop']: '8px',
                    background: 'white', borderRadius: '12px', padding: '8px',
                    boxShadow: openUpwards
                        ? '0 -10px 25px -5px rgba(0, 0, 0, 0.1)'
                        : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    zIndex: 100, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '4px'
                }}>
                    <MenuOption icon={<Eye size={16} />} label="View Details" onClick={() => handleAction('view')} />
                    <MenuOption icon={<Edit size={16} />} label="Edit Waybill" onClick={() => handleAction('edit')} />
                    <MenuOption icon={<Download size={16} />} label="Download PDF" onClick={() => handleAction('pdf')} />
                    <MenuOption icon={<FileText size={16} />} label="Generate BOL" onClick={() => handleAction('bol')} />
                    {onDelete && <MenuOption icon={<Trash size={16} />} label="Delete" color="#ef4444" onClick={() => handleAction('delete')} />}
                </div>
            )}
        </div>
    );
};

const MenuOption = ({ icon, label, onClick, color = 'var(--slate-700)' }: any) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
            border: 'none', background: 'transparent', width: '100%', textAlign: 'left',
            borderRadius: '8px', cursor: 'pointer', color: color, fontSize: '13px', fontWeight: 600,
            transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--slate-50)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
        {icon} {label}
    </button>
);
