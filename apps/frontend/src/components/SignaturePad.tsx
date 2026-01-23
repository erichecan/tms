
import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Trash2 } from 'lucide-react';

interface SignaturePadProps {
    onSave: (dataUrl: string) => void;
    initialUrl?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, initialUrl }) => {
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [preview, setPreview] = useState<string | null>(initialUrl || null);

    const clear = () => {
        sigCanvas.current?.clear();
        setPreview(null);
        // Don't call onSave('') immediately, let user confirm
    };

    const confirm = () => {
        if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
            const data = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
            setPreview(data);
            onSave(data);
        } else if (preview && onSave) {
            onSave(preview);
        } else {
            // Feedback for empty signature
            window.alert('Please sign before confirming.');
        }
    };

    return (
        <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Electronic Signature</div>

            <div style={{
                border: '2px dashed var(--slate-200)',
                borderRadius: '16px',
                background: 'white',
                height: '180px',
                position: 'relative',
                overflow: 'hidden',
                touchAction: 'none' // Important for mobile drawing
            }}>
                {preview ? (
                    <img src={preview} alt="Signature" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                    <SignatureCanvas
                        ref={sigCanvas}
                        canvasProps={{
                            style: { width: '100%', height: '100%', touchAction: 'none' }, // Ensure touch events work
                            className: 'sigCanvas'
                        }}
                    />
                )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
                <button
                    onClick={clear}
                    style={{
                        flex: 1,
                        padding: '14px',
                        borderRadius: '14px',
                        background: 'var(--slate-50)',
                        border: '1px solid var(--slate-200)',
                        color: 'var(--slate-600)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    <Trash2 size={18} /> Clear
                </button>
                <button
                    onClick={confirm}
                    style={{
                        flex: 2,
                        padding: '14px',
                        borderRadius: '14px',
                        background: 'var(--primary-grad)',
                        border: 'none',
                        color: 'white',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
                    }}
                >
                    Confirm Signature
                </button>
            </div>
        </div>
    );
};
