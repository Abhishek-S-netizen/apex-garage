import React from 'react';

export default function MacDock({ activeView, setActiveView, onOpenStudio, onAddCar }) {
    const navItems = [
        {
            key: 'cockpit',
            label: 'Cockpit',
            title: 'Cockpit Binnacle (Key 1)',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <polyline points="12 7 12 12 15 15" />
                </svg>
            )
        },
        {
            key: 'showroom',
            label: 'Showroom',
            title: 'Showroom 3D Turntable Pavilion (Key 2)',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 13.5c0-.8.5-1.5 1.2-1.7l2.8-.8 3.2-4.5c.5-.7 1.3-1.1 2.2-1.1h4.6c.8 0 1.6.4 2.1 1.1l2.5 4.5h2.4c.8 0 1.5.7 1.5 1.5v1.5c0 .6-.4 1-1 1h-1.5" />
                    <circle cx="6.5" cy="15.5" r="2.2" />
                    <line x1="8.7" y1="15.5" x2="15.3" y2="15.5" />
                    <circle cx="17.5" cy="15.5" r="2.2" />
                    <path d="M2.5 14.5v1c0 .6.4 1 1 1h.8" />
                    <path d="M9.5 7.5h4.2l1.8 3.5h-7.5l1.5-3.5z" strokeWidth="1.3" />
                </svg>
            )
        },
        {
            key: 'registry',
            label: 'Registry',
            title: 'Master Fleet Registry (Key 3)',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
            )
        },
        {
            key: 'peghunt',
            label: 'Peg Hunt',
            title: 'Peg Hunt Watchlist (Key 4)',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="22" y1="12" x2="18" y2="12" />
                    <line x1="6" y1="12" x2="2" y2="12" />
                    <line x1="12" y1="6" x2="12" y2="2" />
                    <line x1="12" y1="22" x2="12" y2="18" />
                </svg>
            )
        },
        {
            key: 'libraries',
            label: 'Libraries',
            title: 'Marque & Maker Libraries (Key 5)',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                            >
                                <div className="dock-icon-box">
                                    {item.icon}
                                </div>
                                <span className="dock-label">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="dock-separator" />

                {/* Dock Action Items */}
                <div className="dock-actions">
                    <button
                        className="dock-action-btn"
                        onClick={onOpenStudio}
                        title="Theme Studio (Hotkey: 'T')"
                        type="button"
                    >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="4" y1="21" x2="4" y2="14" />
                            <line x1="4" y1="10" x2="4" y2="3" />
                            <line x1="12" y1="21" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12" y2="3" />
                            <line x1="20" y1="21" x2="20" y2="16" />
                            <line x1="20" y1="12" x2="20" y2="3" />
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
