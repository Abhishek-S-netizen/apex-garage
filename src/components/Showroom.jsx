import React, { useState, useMemo, useEffect } from 'react';

export default function Showroom({
    fleet = [],
    activeView,
    onEditCar
}) {
    const [selectedMarque, setSelectedMarque] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [scaleFilter, setScaleFilter] = useState('all');

    // Filter fleet by scale and search query
    const filteredFleet = useMemo(() => {
        return fleet.filter(car => {
            if (scaleFilter !== 'all' && car.scale !== scaleFilter) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const text = `${car.model || ''} ${car.brand || ''} ${car.maker || ''} ${car.year || ''}`.toLowerCase();
                if (!text.includes(q)) return false;
            }
            return true;
        });
    }, [fleet, scaleFilter, searchQuery]);

    // Unique marques present in the filtered fleet + counts
    const { sortedBrands, marqueCounts } = useMemo(() => {
        const counts = {};
        filteredFleet.forEach(c => {
            const b = c.brand || 'Bespoke';
            counts[b] = (counts[b] || 0) + 1;
        });
        const sorted = Object.keys(counts).sort((a, b) => {
            if (counts[b] !== counts[a]) return counts[b] - counts[a];
            return a.localeCompare(b);
        });
        return { sortedBrands: sorted, marqueCounts: counts };
    }, [filteredFleet]);

    // Auto-select the first marque so the right pane isn't empty on load
    useEffect(() => {
        if (sortedBrands.length === 0) return;
        const stillExists = selectedMarque && sortedBrands.some(b => b.toLowerCase() === selectedMarque.toLowerCase());
        if (!stillExists) {
            setSelectedMarque(sortedBrands[0]);
        }
    }, [sortedBrands, selectedMarque]);

    // Displayed fleet grouped by marque (search spans all marques)
    const displayedGroups = useMemo(() => {
        if (!selectedMarque && !searchQuery) {
            return [];
        }

        const activeBrands = (searchQuery || !selectedMarque)
            ? sortedBrands
            : sortedBrands.filter(b => b.toLowerCase() === selectedMarque.toLowerCase());

        return activeBrands.map(brand => ({
            brand,
            cars: filteredFleet.filter(c => (c.brand || 'Bespoke').toLowerCase() === brand.toLowerCase())
        })).filter(g => g.cars.length > 0);
    }, [filteredFleet, sortedBrands, selectedMarque, searchQuery]);

    return (
        <section className={`view-panel ${activeView === 'showroom' ? 'active' : ''}`} id="viewShowroom">
            <div className="unified-garage-stage">
                {/* Header */}
                <div className="garage-header">
                    <div className="curator-tag-pill">PRIVATE ATELIER SHOWCASE</div>
                    <div className="garage-title-row">
                        <h2 className="curator-hero-title">
                            <span>THE SHOWROOM</span>
                            <span className="title-dot-sep">·</span>
                            <span className="title-count-val">{fleet.length}</span>
                        </h2>
                    </div>
                </div>

                {/* Search & Scale Filter Toolbar */}
                <div className="curator-toolbar">
                    <div className="curator-search-box">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            id="showroomSearchInput"
                            placeholder="Filter models, livery, or years..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoComplete="off"
                        />
                        {searchQuery && (
                            <button
                                style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '13px' }}
                                onClick={() => setSearchQuery('')}
                                type="button"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="curator-scale-pills" id="curatorScalePills">
                        {['all', '1:18', '1:24', '1:32', '1:40', '1:43', '1:64'].map(scale => (
                            <button
                                key={scale}
                                className={`curator-scale-btn ${scaleFilter === scale ? 'active' : ''}`}
                                onClick={() => setScaleFilter(scale)}
                                type="button"
                            >
                                {scale === 'all' ? 'All Scales' : scale}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Split Stage: Left Marque Sidebar + Right Cars Table */}
                <div className="garage-split-stage">
                    <div className="garage-marque-pills-bar" aria-label="Marque filter">
                        {sortedBrands.map(brand => {
                            const count = marqueCounts[brand] || 0;
                            const isActive = selectedMarque && selectedMarque.toLowerCase() === brand.toLowerCase();
                            return (
                                <button
                                    key={brand}
                                    type="button"
                                    className={`garage-marque-pill ${!searchQuery && isActive ? 'active' : ''}`}
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedMarque(brand);
                                    }}
                                >
                                    <span>{brand.toUpperCase()}</span>
                                    <span className="pill-count">{count}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Direct Same-Page Grid View */}
                    <div className="garage-grid-container">
                        {!selectedMarque && !searchQuery ? (
                            <div className="garage-prompt-state">
                                <p className="garage-prompt-msg">Select a marque to view cars</p>
                            </div>
                        ) : displayedGroups.length === 0 ? (
                            <div className="garage-empty-state">
                                <p>No vehicles match your active search or filters.</p>
                                <button
                                    type="button"
                                    className="garage-clear-btn"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setScaleFilter('all');
                                        setSelectedMarque(null);
                                    }}
                                >
                                    Reset All Filters
                                </button>
                            </div>
                        ) : (
                            displayedGroups.map(group => {
                                return (
                                    <div className="pavilion-brand-section" key={group.brand}>
                                        {/* Brand Header Line */}
                                        <div className="pavilion-brand-header">
                                            <div className="pavilion-brand-title-wrap">
                                                <h3 className="pavilion-brand-heading">{group.brand.toUpperCase()}</h3>
                                                <span className="pavilion-brand-badge">
                                                    {group.cars.length} {group.cars.length === 1 ? 'MODEL' : 'MODELS'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Vehicles List (Subtle Separator Lines, Zero Card Aesthetic) */}
                                        <div className="garage-cars-list">
                                            {group.cars.map(car => (
                                                <div key={car.id} className="garage-spec-row">
                                                    <div className="garage-row-left">
                                                        <span className="garage-row-scale">{car.scale || '1:64'}</span>
                                                        <div className="garage-row-details">
                                                            <h4 className="garage-row-model">{car.model}</h4>
                                                            <span className="garage-row-specs">
                                                                {car.maker && <span>{car.maker}</span>}
                                                                {car.maker && car.year && <span className="garage-row-sep">/</span>}
                                                                {car.year && <span>{car.year}</span>}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="garage-row-right">
                                                        <button
                                                            type="button"
                                                            className="garage-row-edit"
                                                            onClick={() => onEditCar && onEditCar(car.id)}
                                                            title="Edit Vehicle"
                                                            aria-label={`Edit ${car.model}`}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M12 20h9" />
                                                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
