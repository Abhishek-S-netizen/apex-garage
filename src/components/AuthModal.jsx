import React, { useState } from 'react';
import { signInWithOwnerEmail } from '../lib/supabase.js';

export default function AuthModal({
    isOpen,
    onClose,
    onAuthSuccess
}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');
        setLoading(true);

        try {
            const session = await signInWithOwnerEmail(email, password);
            setSuccessMsg('Authentication successful. Welcome, Owner.');
            setTimeout(() => {
                onAuthSuccess(session);
                onClose();
            }, 400);
        } catch (err) {
            setErrorMsg(err.message || 'Authentication error.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="modal-overlay"
            style={{ display: 'flex' }}
            onClick={(e) => { if (e.target.className === 'modal-overlay') onClose(); }}
        >
            <div className="modal-card modal-md auth-modal-card">
                <button className="modal-close-btn" onClick={onClose} type="button">✕</button>

                <div className="modal-header">
                    <span className="modal-tag">VAULT SECURITY GATE</span>
                    <h3 className="modal-title">Owner Authentication</h3>
                    <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.55)', marginTop: '4px', lineHeight: 1.4 }}>
                        Sign in to unlock full editing, photo uploading, and fleet management permissions.
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ marginTop: '18px' }}>
                    {errorMsg && (
                        <div style={{
                            padding: '10px 14px',
                            background: 'rgba(220, 38, 38, 0.15)',
                            border: '1px solid rgba(220, 38, 38, 0.4)',
                            borderRadius: '8px',
                            color: '#FCA5A5',
                            fontSize: '0.82rem',
                            marginBottom: '14px',
                            lineHeight: 1.4
                        }}>
                            {errorMsg}
                        </div>
                    )}

                    {successMsg && (
                        <div style={{
                            padding: '10px 14px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            borderRadius: '8px',
                            color: '#6EE7B7',
                            fontSize: '0.82rem',
                            marginBottom: '14px',
                            lineHeight: 1.4
                        }}>
                            {successMsg}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">OWNER EMAIL</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="owner@apexgarage.com"
                            required
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">MASTER PASSWORD</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="••••••••••••"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '22px' }}>
                        <button
                            type="submit"
                            className="btn-hud-primary"
                            disabled={loading}
                            style={{ width: '100%', justifyContent: 'center', padding: '12px 18px', fontWeight: 700 }}
                        >
                            {loading ? 'AUTHENTICATING...' : 'UNLOCK OWNER ACCESS'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
