
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
        onSave('');
    };

    const save = () => {
        if (sigCanvas.current) {
            const data = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
            setPreview(data);
            onSave(data);
        }
    };

    if (preview && !initialUrl) {
        // Show preview mode if saved (and not just initial) - actually let's just show canvas always unless "locked"?
        // Simpler: Just show canvas. If there is an initialUrl, load it? signature-canvas doesn't easily load images back onto the editable canvas.
        // So for "View/Edit", if it exists, maybe show Image + "Clear to Resign" button.
    }

    return (
        <div className="glass" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase' }}>Electronic Signature</div>

            {preview ? (
                <div style={{ position: 'relative', border: '1px solid var(--glass-border)', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
                    <img src={preview} alt="Signature" style={{ width: '100%', height: '150px', objectFit: 'contain' }} />
                    <button onClick={clear} style={{ position: 'absolute', top: 5, right: 5, background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                    </button>
                </div>
            ) : (
                <>
                    <div style={{ border: '1px solid var(--glass-border)', borderRadius: '12px', background: 'white', height: '150px' }}>
                        <SignatureCanvas
                            ref={sigCanvas}
                            canvasProps={{ width: 500, height: 150, className: 'sigCanvas' }}
                            onEnd={save}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={clear} style={{ fontSize: '12px', color: 'var(--slate-500)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear Signature</button>
                    </div>
                </>
            )}
        </div>
    );
};
