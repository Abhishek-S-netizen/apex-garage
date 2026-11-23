import React, { useRef } from 'react';

export default function MacDock({
    activeView,
    setActiveView,
    onAddCar,
    onExportJSON,
    onImportJSON,
    garageFile = { status: 'unsupported', name: null },
    onCreateGarageFile = () => { },
    onOpenGarageFile = () => { },
    onReconnectGarageFile = () => { }
}) {
    const importInputRef = useRef(null);

    const handleFileBtnClick = () => {
        if (garageFile.status === 'needs-permission' || garageFile.status === 'error') {
            onReconnectGarageFile();
        } else if (garageFile.status === 'linked') {
            onOpenGarageFile();
        } else if (garageFile.status === 'unlinked') {
            onCreateGarageFile();
        }
    };

    const navItems = [
        {
            key: 'showroom',
            label: 'Showroom',
            title: 'The Showroom (Key 1)',
            renderIcon: (isActive) => isActive ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M2.5 14c0-.6.4-1.1.9-1.2l2.6-.7 3.2-4.5c.5-.7 1.3-1.1 2.2-1.1h4.6c.8 0 1.6.4 2.1 1.1l2.5 4.5h2.4c.8 0 1.5.7 1.5 1.5v1.8c0 .6-.4 1-1 1h-1.2a2.8 2.8 0 0 1-5.4 0H9.7a2.8 2.8 0 0 1-5.4 0H2.5v-2.4z"
                        fill="#E1E1E1"
                    />
                    <path
                        d="M9.6 8h4.2l1.9 3.5H7.7l1.9-3.5z"
                        fill="#2C3752"
                    />
                    <circle cx="7" cy="16.4" r="2.1" fill="#2C3752" stroke="#E1E1E1" strokeWidth="1.6" />
                    <circle cx="17" cy="16.4" r="2.1" fill="#2C3752" stroke="#E1E1E1" strokeWidth="1.6" />
                </svg>
            ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 13.5c0-.8.5-1.5 1.2-1.7l2.8-.8 3.2-4.5c.5-.7 1.3-1.1 2.2-1.1h4.6c.8 0 1.6.4 2.1 1.1l2.5 4.5h2.4c.8 0 1.5.7 1.5 1.5v1.8c0 .6-.4 1-1 1h-1.2" />
                    <circle cx="7" cy="16.4" r="2.1" />
                    <line x1="9.1" y1="16.4" x2="14.9" y2="16.4" />
                    <circle cx="17" cy="16.4" r="2.1" />
                    <path d="M2.5 14.5v1.9c0 .6.4 1 1 1h1.4" />
                    <path d="M9.6 8h4.2l1.9 3.5H7.7l1.9-3.5z" strokeWidth="1.3" />
                </svg>
            )
        },
        {
            key: 'libraries',
            label: 'Libraries',
            title: 'Marque & Maker Libraries (Key 2)',
            renderIcon: (isActive) => isActive ? (
                <svg width="22" height="22" viewBox="0 0 24 24">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" fill="#E1E1E1" />
                </svg>
            ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
            )
        }
    ];

    return (
        <header className="macos-dock-header">
            <div className="macos-dock" role="navigation" aria-label="macOS App Dock">
                {/* Dock App Brand Mark */}
                <div className="dock-app-brand" title="APEX Performance Collection Suite">
                    <span className="dock-brand-text">APEX</span>
                </div>

                <div className="dock-separator" />

                {/* Central Technical Navigation Dock Items */}
                <nav className="dock-nav" aria-label="Suite Views">
                    {navItems.map(item => {
                        const isActive = activeView === item.key;
                        return (
                            <button
                                key={item.key}
                                className={`nav-tab dock-item ${isActive ? 'active' : ''}`}
                                onClick={() => setActiveView(item.key)}
                                title={item.title}
                                type="button"
                                aria-label={item.label}
                            >
                                <div className="dock-icon-box">
                                    {item.renderIcon(isActive)}
                                </div>
                            </button>
                        );
                    })}
                </nav>

                <div className="dock-separator" />

                {/* Dock Action Items */}
                <div className="dock-actions">
                    {garageFile.status !== 'unsupported' && garageFile.status !== 'checking' && (
                        <button
                            type="button"
                            className={`dock-util-btn dock-file-btn status-${garageFile.status}`}
                            onClick={handleFileBtnClick}
                            title={
                                garageFile.status === 'linked'
                                    ? `Saving to ${garageFile.name} — click to switch file`
                                    : garageFile.status === 'unlinked'
                                        ? 'Link cars.json on disk'
                                        : `Reconnect ${garageFile.name}`
                            }
                            aria-label="Garage File Sync"
                        >
                            <span className={`garage-file-dot status-${garageFile.status}`} />
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                        </button>
                    )}

                    <button
                        type="button"
                        className="dock-util-btn"
                        onClick={() => importInputRef.current?.click()}
                        title="Import JSON backup"
                        aria-label="Import JSON"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                    </button>
                    <input
                        ref={importInputRef}
                        type="file"
                        accept=".json,application/json"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && onImportJSON) {
                                onImportJSON(file);
                                e.target.value = '';
                            }
                        }}
                    />

                    <button
                        type="button"
                        className="dock-util-btn"
                        onClick={onExportJSON}
                        title="Export JSON backup"
                        aria-label="Export JSON"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                    </button>

                    <button
                        className="dock-register-btn"
                        onClick={onAddCar}
                        title="Register New Vehicle (N)"
                        type="button"
                    >
                        <span>+</span>
                        <span>Register</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
