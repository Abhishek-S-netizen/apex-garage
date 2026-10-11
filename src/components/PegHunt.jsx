import React from 'react';

export default function PegHunt({
    wishlist,
    activeView,
    onAddWish,
    onGraduateWish,
    onDeleteWish
}) {
    return (
        <section className={`view-panel ${activeView === 'peghunt' ? 'active' : ''}`} id="viewPeghunt">
            <div className="peghunt-wrapper">
                <div className="peghunt-top-shelf">
                    <div>
                        <span className="bento-tag">ACQUISITION RADAR</span>
                        <h2 className="registry-title">The Peg Hunt & Grails</h2>
                        <p className="registry-sub">
                            Target models on your watch radar. Track target prices, priorities, and graduate them into your garage with 1-click.
                        </p>
                    </div>
                    <button className="btn-hud-primary" id="btnAddWishlistItem" onClick={onAddWish} type="button">
                        + Add Target
                    </button>
                </div>

                <div className="wishlist-grid" id="wishlistGrid">
                    {wishlist.length === 0 ? (
                        <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '60px 20px', color: 'var(--text-tertiary)' }}>
                            No target grails currently on your radar. Click "+ Add Target" to begin tracking.
                        </div>
                    ) : (
                        wishlist.map(w => {
                            const tierClass = w.priority === 'GRAIL' ? 'tier-grail' : w.priority === 'HIGH' ? 'tier-high' : 'tier-normal';
                            return (
                                <div key={w.id} className="wish-card">
                                    <div className="wish-card-top">
                                        <span className="wish-brand-tag">
                                            {w.brand || 'TARGET MARQUE'} · {w.maker || ''} · {w.scale || '1:18'}
                                        </span>
                                        <span className={`wish-priority-badge ${tierClass}`}>{w.priority || 'NORMAL'}</span>
                                    </div>
                                    <div className="wish-model-title">{w.model}</div>
                                    <div className="wish-meta-row">
                                        <span>TARGET BUDGET</span>
                                        <span className="wish-target-price">${w.targetPrice || 0}</span>
                                    </div>
                                    <div className="wish-notes">{w.notes || 'No hunting notes recorded.'}</div>
                                    <div className="wish-actions">
                                        <button className="btn-wish-graduate" onClick={() => onGraduateWish(w)} type="button">
                                            + Park in Garage
                                        </button>
                                        <button className="btn-wish-delete" onClick={() => onDeleteWish(w.id)} title="Remove target" type="button">
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </section>
    );
}
