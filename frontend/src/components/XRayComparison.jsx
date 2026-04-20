import React, { useState, useRef } from 'react';
import { AlertCircle, Loader2, Save, LogOut, UploadCloud, ImagePlus, X } from 'lucide-react';
import { saveComparison } from '../api/comparisons';

export default function XRayComparison({
    patient,
    baselineImage,
    followUpImage: _followUpProp, // ignored – user uploads their own
    diagnosis,
    onFinalize,
    onExit
}) {
    const [outcome, setOutcome] = useState('Improved');
    const [observations, setObservations] = useState('patient condition good');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Follow-up image state (starts blank, user uploads)
    const [followUpImage, setFollowUpImage] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    // ── File validation helper ──
    const handleFileSelect = (file) => {
        if (!file) return;
        const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowed.includes(file.type)) {
            setError('Only JPG, JPEG or PNG images are allowed.');
            return;
        }
        setError(null);
        const reader = new FileReader();
        reader.onload = (e) => setFollowUpImage(e.target.result);
        reader.readAsDataURL(file);
    };

    const handleInputChange = (e) => handleFileSelect(e.target.files[0]);

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files[0]);
    };

    const handleSave = async () => {
        if (!followUpImage) {
            setError('Please upload the Follow-up X-Ray image before saving.');
            return;
        }

        if (!observations || observations.trim() === '') {
            setError('Clinical observations cannot be empty.');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const payload = {
                patient_name: `${patient.first_name} ${patient.last_name}`,
                condition: outcome,
                disease: diagnosis,
                doctor_note: observations.trim()
            };
            await saveComparison(payload);
            onFinalize && onFinalize();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Failed to save comparison.');
        } finally {
            setLoading(false);
        }
    };

    const greenButtonColor = '#14b8a6';
    const paleBackground   = '#f8fafc';
    const whiteBackground  = '#ffffff';

    return (
        <div className="comparison-container" style={{ padding: '32px', background: paleBackground, borderRadius: 20, maxWidth: '1000px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', color: '#1e293b', fontWeight: 800, textAlign: 'center', marginBottom: 40 }}>X-Ray Comparison</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 40 }}>

                {/* ── Baseline (read-only) ── */}
                <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 16, color: '#1e293b' }}>Baseline X-Ray (Before)</h2>
                    <div style={{ background: '#0f172a', borderRadius: 16, overflow: 'hidden', height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={baselineImage} alt="Baseline" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                </div>

                {/* ── Follow-up (blank → upload) ── */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>Follow up X-Ray (After)</h2>
                        {followUpImage && (
                            <button
                                title="Remove image"
                                onClick={() => setFollowUpImage(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}
                            >
                                <X size={14} /> Remove
                            </button>
                        )}
                    </div>

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                        style={{ display: 'none' }}
                        onChange={handleInputChange}
                    />

                    {followUpImage ? (
                        /* Show uploaded image */
                        <div
                            onClick={() => fileInputRef.current.click()}
                            title="Click to change image"
                            style={{ background: '#0f172a', borderRadius: 16, overflow: 'hidden', height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}
                        >
                            <img src={followUpImage} alt="Follow up" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            {/* Hover overlay hint */}
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.35)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
                            >
                                <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem', opacity: 0, pointerEvents: 'none' }}>Change Image</span>
                            </div>
                        </div>
                    ) : (
                        /* Blank upload zone */
                        <div
                            onClick={() => fileInputRef.current.click()}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            style={{
                                height: '350px',
                                borderRadius: 16,
                                border: `2px dashed ${isDragging ? '#14b8a6' : '#cbd5e1'}`,
                                background: isDragging ? '#f0fdfa' : '#f8fafc',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 12,
                                cursor: 'pointer',
                                transition: 'border-color 0.2s, background 0.2s'
                            }}
                        >
                            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0fdfa', border: '2px solid #99f6e4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ImagePlus size={26} color="#14b8a6" />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.95rem' }}>Click to upload Follow-up X-Ray</div>
                                <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: 4 }}>or drag &amp; drop here</div>
                                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: 6, background: '#e2e8f0', borderRadius: 20, padding: '2px 10px', display: 'inline-block' }}>JPG, JPEG or PNG</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Patient info form ── */}
            <div style={{ background: whiteBackground, borderRadius: 16, padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: 32 }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 24, color: '#1e293b' }}>Patient Diagnostic Information</h2>

                {error && (
                    <div style={{ padding: 12, background: '#fee2e2', color: '#991b1b', borderRadius: 8, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Patient Name</span>
                        <div style={{ background: '#cbd5e1', padding: '12px 16px', borderRadius: 8, color: '#334155', fontWeight: 500 }}>
                            {patient.first_name} {patient.last_name}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Residential Address</span>
                        <div style={{ background: '#cbd5e1', padding: '12px 16px', borderRadius: 8, color: '#334155', fontWeight: 500 }}>
                            {patient.address || 'N/A'}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Primary Diagnosis</span>
                        <div style={{ background: '#cbd5e1', padding: '12px 16px', borderRadius: 8, color: '#334155', fontWeight: 500 }}>
                            {diagnosis}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Comparison Outcome</span>
                        <select
                            value={outcome}
                            onChange={(e) => setOutcome(e.target.value)}
                            style={{ background: '#cbd5e1', padding: '12px 16px', borderRadius: 8, color: '#334155', fontWeight: 500, border: 'none', outline: 'none' }}
                        >
                            <option value="Improved">Improved</option>
                            <option value="Stable">Stable</option>
                            <option value="Deteriorated">Deteriorated</option>
                        </select>
                    </div>

                    <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Clinical Observations</span>
                        <textarea
                            rows={4}
                            value={observations}
                            onChange={(e) => setObservations(e.target.value)}
                            style={{ background: '#cbd5e1', padding: '12px 16px', borderRadius: 8, color: '#334155', fontWeight: 500, border: 'none', resize: 'none', outline: 'none' }}
                        />
                    </div>
                </div>
            </div>

            {/* ── Action buttons ── */}
            <div style={{ display: 'flex', gap: 24 }}>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    style={{ flex: 1, padding: '16px', borderRadius: 12, border: 'none', background: greenButtonColor, color: '#fff', fontWeight: 700, fontSize: '1.1rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: loading ? 0.7 : 1 }}
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                    Finalize and Save
                </button>
                <button
                    onClick={onExit}
                    style={{ flex: 1, padding: '16px', borderRadius: 12, border: 'none', background: greenButtonColor, color: '#fff', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                >
                    <LogOut size={20} />
                    Return to Dashboard
                </button>
            </div>
        </div>
    );
}
