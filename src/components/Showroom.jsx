import React, { useState, useMemo } from 'react';

// Brand Racing Heritage Accent Colors
const BRAND_HERITAGE_ACCENTS = {
    'Ferrari': '#D40000',
    'Porsche': '#E10600',
    'McLaren': '#FF8000',
    'Mercedes-AMG': '#00A19B',
    'Mercedes-Benz': '#00A19B',
    'Nissan': '#C00000',
    'Toyota': '#EB0A1E',
    'Lamborghini': '#E5B80B',
    'BMW': '#0066B1',
    'Audi': '#BB0A30',
    'Dodge': '#D00000',
    'Ford': '#003399',
    'Chevrolet': '#CD9B1D',
    'Bespoke': '#BDA794'
};

export default function Showroom({
    fleet = [],
    activeView,
    onOpenDossier,
    onEditCar,
    onToggleFavorite
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

    // Displayed fleet grouped by marque
    const displayedGroups = useMemo(() => {
        if (!selectedMarque && !searchQuery) {
            return [];
        }

        const activeBrands = !selectedMarque
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
                        <h2 className="curator-hero-title">THE SHOWROOM</h2>
                        <span className="garage-total-badge">{fleet.length} {fleet.length === 1 ? 'MODEL' : 'MODELS'}</span>
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

                {/* Minimalist Horizontal Marque Filter Buttons */}
                <div className="garage-marque-pills-bar">
                    {sortedBrands.map(brand => {
                        const count = marqueCounts[brand] || 0;
                        const isActive = selectedMarque && selectedMarque.toLowerCase() === brand.toLowerCase();
                        return (
                            <button
                                key={brand}
                                type="button"
                                className={`garage-marque-pill ${isActive ? 'active' : ''}`}
                                onClick={() => setSelectedMarque(isActive ? null : brand)}
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
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35, marginBottom: '6px' }}>
                                <path d="M12 19V5M5 12l7-7 7 7" />
                            </svg>
                            <p className="garage-prompt-msg">Click a pill to view cars</p>
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
                            const accent = BRAND_HERITAGE_ACCENTS[group.brand] || '#BDA794';
                            return (
                                <div className="pavilion-brand-section" key={group.brand}>
                                    {/* Brand Header Line */}
                                    <div className="pavilion-brand-header">
                                        <div className="pavilion-brand-title-wrap">
                                            <span
                                                className="pavilion-brand-accent-line"
                                                style={{ background: accent }}
                                            />
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
                                                        className={`garage-row-fav ${car.isFavorite ? 'active' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onToggleFavorite && onToggleFavorite(car.id);
                                                        }}
                                                        title="Toggle Favorite"
                                                    >
                                                        ★
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
        </section>
    );
}
