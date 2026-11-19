import React from 'react';

export default function MacDock({
    activeView,
    setActiveView,
    onOpenStudio,
    onAddCar,
    isOwnerLoggedIn,
    ownerUser,
    onOpenAuthModal,
    onSignOut
}) {
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
            key: 'registry',
            label: 'Registry',
            title: 'Master Fleet Registry (Key 2)',
            renderIcon: (isActive) => isActive ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#E1E1E1" />
                    <polyline points="14 2 14 8 20 8" fill="#2C3752" />
                    <line x1="16" y1="13" x2="8" y2="13" stroke="#2C3752" strokeWidth="2" strokeLinecap="round" />
                    <line x1="16" y1="17" x2="8" y2="17" stroke="#2C3752" strokeWidth="2" strokeLinecap="round" />
                </svg>
            ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
            )
        },
        {
            key: 'libraries',
            label: 'Libraries',
            title: 'Marque & Maker Libraries (Key 3)',
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
