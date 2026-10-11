import React from 'react';

export default function DossierModal({
    isOpen,
    car,
    onClose,
    onEdit,
    onDelete,
    onToggleFavorite
}) {
    if (!isOpen || !car) return null;

    return (
        <div className="modal-overlay" style={{ display: 'flex' }} onClick={(e) => { if (e.target.className === 'modal-overlay') onClose(); }}>
            <div className="modal-card modal-xl">
                <button className="modal-close-btn" onClick={onClose} type="button">✕</button>

                <div className="dossier-layout">
                    {/* Left: Hero Image & Badges */}
                    <div className="dossier-hero-col">
                        <div className="dossier-hero-wrap">
                            <img
                                src={car.photoUrl || 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=1200&auto=format&fit=crop'}
                                alt={car.model}
                            />
                            <div className="dossier-hero-badges">
                                <span className="dossier-scale-pill">{car.scale || '1:18'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Specifications & Telemetry */}
                    <div className="dossier-info-col">
                        <div className="dossier-header-block">
                            <span className="dossier-brand-tag">{(car.brand || 'CAR').toUpperCase()}</span>
                            <h2 className="dossier-model-title">{car.model}</h2>
                            {car.livery && <p className="dossier-livery-sub">{car.livery}</p>}
                        </div>

                        <div className="dossier-specs-table">
                            <div className="dossier-spec-row">
                                <span className="spec-k">DIECAST MAKER</span>
                                <span className="spec-v">{car.maker || '—'}</span>
                            </div>
                            <div className="dossier-spec-row">
                                <span className="spec-k">MODEL YEAR</span>
                                <span className="spec-v">{car.year || '—'}</span>
                            </div>
                            <div className="dossier-spec-row">
                                <span className="spec-k">SCALE</span>
                                <span className="spec-v text-mono">{car.scale || '1:18'}</span>
                            </div>
                            <div className="dossier-spec-row">
                                <span className="spec-k">GARAGE STATUS</span>
                                <span className="spec-v" style={{ color: 'var(--accent)' }}>
                                    {car.isFavorite ? '★ Pinned Favorite' : 'Fleet Registered'}
                                </span>
                            </div>
                            {car.notes && (
                                <div className="dossier-spec-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px', paddingTop: '4px' }}>
                                    <span className="spec-k">COLLECTOR NOTES</span>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{car.notes}</p>
                                </div>
                            )}
                        </div>

                        <div className="dossier-actions-bar">
                            <button
                                className="btn-dossier-action delete"
                                onClick={() => {
                                    if (window.confirm("Are you sure you want to remove this vehicle from your garage?")) {
                                        onDelete(car.id);
                                        onClose();
                                    }
                                }}
                                type="button"
                            >
                                Delete Car
                            </button>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="btn-dossier-action"
                                    onClick={() => onToggleFavorite(car.id)}
                                    type="button"
                                >
                                    {car.isFavorite ? '★ Favorited' : '☆ Add to Favs'}
                                </button>
                                <button
                                    className="btn-dossier-action edit"
                                    onClick={() => {
                                        onClose();
                                        onEdit(car.id);
                                    }}
                                    type="button"
                                >
                                    Edit Vehicle
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
