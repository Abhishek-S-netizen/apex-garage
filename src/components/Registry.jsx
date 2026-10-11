import React from 'react';

export default function Registry({
    fleet,
    activeView,
    onOpenDossier,
    onEditCar,
    onAddCar,
    onToggleFavorite,
    onExportJSON
}) {
    return (
        <section className={`view-panel ${activeView === 'registry' ? 'active' : ''}`} id="viewRegistry">
            <div className="registry-wrapper">
                <div className="registry-top-shelf">
                    <div>
                        <span className="bento-tag">TECHNICAL DATABASE</span>
                        <h2 className="registry-title">Master Vehicle Registry</h2>
                        <p className="registry-sub">
                            Complete garage fleet specifications, production editions, and technical telemetry.
                        </p>
                    </div>
                    <div className="registry-actions">
                        <button className="btn-hud-secondary" id="btnExportFleetJSON" onClick={onExportJSON} type="button">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            <span>Export JSON</span>
                        </button>
                        <button className="btn-hud-primary" id="btnRegistryAddCar" onClick={onAddCar} type="button">
                            + New Vehicle
                        </button>
                    </div>
                </div>

                <div className="registry-table-card">
                    <div className="registry-table-wrap">
                        <table className="registry-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '44px', textAlign: 'center' }}>★</th>
                                    <th>VEHICLE / MODEL</th>
                                    <th>MARQUE</th>
                                    <th>MAKER</th>
                                    <th>SCALE</th>
                                    <th>YEAR</th>
                                    <th style={{ textAlign: 'right', width: '160px' }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody id="registryTableBody">
                                {fleet.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                            No vehicles registered. Click "+ New Vehicle" to add one.
                                        </td>
                                    </tr>
                                ) : (
                                    fleet.map(car => (
                                        <tr key={car.id}>
                                            <td style={{ textAlign: 'center' }}>
                                                <span
                                                    className={`carousel-fav-star ${car.isFavorite ? 'active' : ''}`}
                                                    onClick={() => onToggleFavorite(car.id)}
                                                    style={{ cursor: 'pointer' }}
                                                    title="Toggle Favorite"
                                                >
                                                    ★
                                                </span>
                                            </td>
                                            <td>
                                                <strong className="registry-model-name">{car.model}</strong>
                                            </td>
                                            <td>
                                                <span className="spec-pill" style={{ color: 'var(--accent-bright)' }}>{car.brand || '—'}</span>
                                            </td>
                                            <td>
                                                <span className="registry-maker-label">{car.maker || '—'}</span>
                                            </td>
                                            <td>
                                                <span className="spec-pill">{car.scale || '1:18'}</span>
                                            </td>
                                            <td>
                                                <span className="registry-year-val">{car.year || '—'}</span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="registry-actions-cell">
                                                    <button
                                                        className="btn-table-action inspect"
                                                        onClick={() => onOpenDossier(car.id)}
                                                        type="button"
                                                    >
                                                        Inspect
                                                    </button>
                                                    <button
                                                        className="btn-table-action edit"
                                                        onClick={() => onEditCar(car.id)}
                                                        type="button"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
}
