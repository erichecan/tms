import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type DialogType = 'alert' | 'confirm';

interface DialogOptions {
    title?: string;
    message: string;
    type: DialogType;
    resolve: (value: boolean) => void;
}

interface DialogContextType {
    alert: (message: string, title?: string) => Promise<boolean>;
    confirm: (message: string, title?: string) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useDialog = () => {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error('useDialog must be used within a DialogProvider');
    }
    return context;
};

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [dialog, setDialog] = useState<DialogOptions | null>(null);

    const showDialog = useCallback((type: DialogType, message: string, title?: string) => {
        return new Promise<boolean>((resolve) => {
            setDialog({ type, message, title, resolve });
        });
    }, []);

    const alert = useCallback((message: string, title?: string) => showDialog('alert', message, title), [showDialog]);
    const confirm = useCallback((message: string, title?: string) => showDialog('confirm', message, title), [showDialog]);

    const handleClose = (value: boolean) => {
        if (dialog) {
            dialog.resolve(value);
            setDialog(null);
        }
    };

    return (
        <DialogContext.Provider value={{ alert, confirm }}>
            {children}
            {dialog && (
                <PremiumDialog
                    type={dialog.type}
                    title={dialog.title}
                    message={dialog.message}
                    onClose={handleClose}
                />
            )}
        </DialogContext.Provider>
    );
};

// Internal component for the actual UI to avoid circular dependency if placed in separate file
import { Info, AlertTriangle, CheckCircle, HelpCircle, X } from 'lucide-react';

interface PremiumDialogProps {
    type: DialogType;
    title?: string;
    message: string;
    onClose: (value: boolean) => void;
}

const PremiumDialog: React.FC<PremiumDialogProps> = ({ type, title, message, onClose }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(12px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div className="glass" style={{
                maxWidth: '440px',
                width: '100%',
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '32px',
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 128, 255, 0.1)',
                position: 'relative',
                overflow: 'hidden',
                animation: 'slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
                {/* Decorative Background Glow */}
                <div style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '150px',
                    height: '150px',
                    background: type === 'confirm' ? 'rgba(139, 0, 255, 0.05)' : 'rgba(0, 128, 255, 0.05)',
                    filter: 'blur(40px)',
                    zIndex: 0
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        marginBottom: '20px'
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '16px',
                            background: type === 'confirm' ? 'rgba(139, 0, 255, 0.1)' : 'rgba(0, 128, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: type === 'confirm' ? 'var(--primary-end)' : 'var(--primary-start)'
                        }}>
                            {type === 'confirm' ? <HelpCircle size={24} /> : <Info size={24} />}
                        </div>
                        <h3 style={{
                            fontSize: '20px',
                            fontWeight: 800,
                            color: 'var(--slate-900)',
                            letterSpacing: '-0.02em'
                        }}>
                            {title || (type === 'confirm' ? 'Confirmation Required' : 'Information')}
                        </h3>
                    </div>

                    <p style={{
                        color: 'var(--slate-600)',
                        fontSize: '15px',
                        lineHeight: '1.6',
                        marginBottom: '32px',
                        fontWeight: 500
                    }}>
                        {message}
                    </p>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        {type === 'confirm' && (
                            <button
                                onClick={() => onClose(false)}
                                className="btn-secondary"
                                style={{
                                    flex: 1,
                                    padding: '12px 20px',
                                    fontSize: '14px',
                                    borderRadius: '14px'
                                }}
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={() => onClose(true)}
                            className="btn-primary"
                            style={{
                                flex: 2,
                                padding: '12px 20px',
                                fontSize: '14px',
                                borderRadius: '14px',
                                background: type === 'confirm' ? 'var(--primary-grad)' : 'var(--primary-grad)'
                            }}
                        >
                            {type === 'confirm' ? 'Confirm Action' : 'I Understand'}
                        </button>
                    </div>
                </div>

                {/* Animation Styles */}
                <style>{`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes slideUp {
                        from { transform: translateY(20px) scale(0.95); opacity: 0; }
                        to { transform: translateY(0) scale(1); opacity: 1; }
                    }
                `}</style>
            </div>
        </div>
    );
};
