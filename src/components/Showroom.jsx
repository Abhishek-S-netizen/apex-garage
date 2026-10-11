import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

export default function Showroom({
    fleet,
    activeView,
    onOpenDossier,
    onEditCar,
    onToggleFavorite
}) {
    const [stage, setStage] = useState('curator'); // 'curator' or 'carousel'
    const [selectedMarque, setSelectedMarque] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [scaleFilter, setScaleFilter] = useState('all');
    const [activeIndex, setActiveIndex] = useState(0);

    const dragStartX = useRef(null);

    // Curator Filtered Fleet
    const curatorFleet = useMemo(() => {
        return fleet.filter(car => {
            if (scaleFilter !== 'all' && car.scale !== scaleFilter) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const text = `${car.model} ${car.brand} ${car.maker} ${car.year || ''}`.toLowerCase();
                if (!text.includes(q)) return false;
            }
            return true;
        });
    }, [fleet, scaleFilter, searchQuery]);

    // Carousel Fleet (filtered by selected marque)
    const carouselFleet = useMemo(() => {
        if (selectedMarque === 'all') return curatorFleet;
        return curatorFleet.filter(car => car.brand && car.brand.toLowerCase() === selectedMarque.toLowerCase());
    }, [curatorFleet, selectedMarque]);

    // Brand Racing Heritage Accent Colors
    const BRAND_HERITAGE_ACCENTS = {
        'Ferrari': '#D40000',
        'Porsche': '#E10600',
        'McLaren': '#FF8000',
        'Mercedes-AMG': '#00A19B',
        'Nissan': '#C00000',
        'Toyota': '#EB0A1E',
        'Lamborghini': '#E5B80B',
        'BMW': '#0066B1',
        'Audi': '#BB0A30',
        'Bespoke': '#BDA794'
    };

    // Marque detailed data for Stage 1 visual cards
    const { marqueDetails, sortedBrands, fleetScaleCounts } = useMemo(() => {
        const details = {};
        const scaleCounts = {};

        curatorFleet.forEach(c => {
            const b = c.brand || 'Bespoke';
            if (!details[b]) {
                details[b] = {
                    brand: b,
                    count: 0,
                    scales: new Set(),
                    heroImage: c.photoUrl,
                    models: []
                };
            }
            details[b].count++;
            if (c.scale) {
                details[b].scales.add(c.scale);
                scaleCounts[c.scale] = (scaleCounts[c.scale] || 0) + 1;
            }
            if (c.model && details[b].models.length < 2) details[b].models.push(c.model);
            if (!details[b].heroImage && c.photoUrl) details[b].heroImage = c.photoUrl;
        });

        const sorted = Object.keys(details).sort((a, b) => {
            if (details[b].count !== details[a].count) return details[b].count - details[a].count;
            return a.localeCompare(b);
        });

        return { marqueDetails: details, sortedBrands: sorted, fleetScaleCounts: scaleCounts };
    }, [curatorFleet]);

    // Keyboard navigation in carousel stage
    useEffect(() => {
        if (activeView !== 'showroom' || stage !== 'carousel') return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setStage('curator');
            } else if (e.key === 'ArrowLeft') {
                swiperRef.current?.slidePrev();
            } else if (e.key === 'ArrowRight') {
                swiperRef.current?.slideNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeView, stage]);

    // Direct 1-Click Showroom Entry
    const handleSelectMarqueAndEnter = (brandKey) => {
        setSelectedMarque(brandKey);
        setActiveIndex(0);
        setStage('carousel');
    };

    const handleReturnToCurator = () => {
        setStage('curator');
    };

    const handlePrev = useCallback(() => {
        if (carouselFleet.length === 0) return;
        setActiveIndex(prev => (prev === 0 ? carouselFleet.length - 1 : prev - 1));
    }, [carouselFleet.length]);

    const handleNext = useCallback(() => {
        if (carouselFleet.length === 0) return;
        setActiveIndex(prev => (prev + 1) % carouselFleet.length);
    }, [carouselFleet.length]);

    useEffect(() => {
        if (stage !== 'carousel' || activeView !== 'showroom') return;
        const handleKeyDown = (e) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handlePrev();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                handleNext();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [stage, activeView, handlePrev, handleNext]);

    const handlePointerDown = (e) => {
        dragStartX.current = e.clientX;
    };

    const handlePointerUp = (e) => {
        if (dragStartX.current === null) return;
        const delta = e.clientX - dragStartX.current;
        if (delta > 40) {
            handlePrev();
        } else if (delta < -40) {
            handleNext();
        }
        dragStartX.current = null;
    };

    return (
        <section className={`view-panel ${activeView === 'showroom' ? 'active' : ''}`} id="viewShowroom">
            {/* ══════════════════════════════════════════════════════════════
                 STAGE 1: BRAND CURATION FLOOR (MARQUE GATEWAY)
            ══════════════════════════════════════════════════════════════ */}
            <div className={`showroom-curator-stage ${stage === 'curator' ? 'active' : ''}`} id="showroomCuratorStage">
                <div className="curator-hero-header">
                    <div className="curator-tag-pill">PRIVATE ATELIER SHOWCASE</div>
                    <h2 className="curator-hero-title">Select Marque to Enter Showroom</h2>
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
                        {['all', '1:18', '1:43', '1:64'].map(scale => (
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

                {/* 1. ALL FLEET Grand Pavilion Banner */}
                <div
                    className="curator-master-banner"
                    onClick={() => handleSelectMarqueAndEnter('all')}
                    title="Click to enter 3D Showroom with all vehicles"
                    role="button"
                    tabIndex={0}
                >
                    <div className="master-banner-glass" />
                    <div className="master-banner-content">
                        <div className="master-banner-left">
                            <h3 className="master-banner-title">ALL FLEET SHOWCASE</h3>
                            <p className="master-banner-desc">
                                Inspect all {curatorFleet.length} precision models across {sortedBrands.length} marques in an uninterrupted 3D Cover Flow ring.
                            </p>
                            <div className="master-banner-scales">
                                {Object.entries(fleetScaleCounts).map(([scale, count]) => (
                                    <span key={scale} className="master-scale-chip">
                                        {scale} ({count})
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="master-banner-right">
                            <div className="master-count-box">
                                <span className="master-count-digit">{curatorFleet.length}</span>
                                <span className="master-count-label">TOTAL VEHICLES</span>
                            </div>
                            <button
                                className="master-enter-btn"
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectMarqueAndEnter('all');
                                }}
                            >
                                <span>ENTER FULL SHOWROOM</span>
                                <span className="master-btn-arrow">→</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Individual Marque Cards Grid */}
                <div className="curator-marque-grid" id="curatorMarqueGrid">
                    {sortedBrands.map(brand => {
                        const info = marqueDetails[brand];
                        const count = info?.count || 1;
                        const modelsText = (info?.models || []).join(' · ');
                        const heroImg = info?.heroImage;
                        const scalesArray = Array.from(info?.scales || []);

                        return (
                            <div
                                key={brand}
                                className="curator-marque-card"
                                onClick={() => handleSelectMarqueAndEnter(brand)}
                                role="button"
                                tabIndex={0}
                            >
                                <div className="marque-card-inner">
                                    <div className="marque-card-top">
                                        <div className="marque-brand-identity">
                                            <span className="marque-tag-label">MARQUE</span>
                                        </div>
                                        <span className="marque-count-badge">
                                            {count} {count === 1 ? 'MODEL' : 'MODELS'}
                                        </span>
                                    </div>

                                    <div className="marque-card-body">
                                        <h3 className="marque-card-name">{brand.toUpperCase()}</h3>
                                        <p className="marque-card-models">
                                            {modelsText || 'Bespoke precision casting'}
                                        </p>
                                    </div>

                                    <div className="marque-card-footer">
                                        <div className="marque-scales-list">
                                            {scalesArray.map(sc => (
                                                <span key={sc} className="marque-scale-pill">{sc}</span>
                                            ))}
                                        </div>
                                        <span className="marque-enter-cta">
                                            <span>INSPECT</span>
                                            <span className="cta-arrow">→</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                 STAGE 2: 3D COVER FLOW CAROUSEL RING FLOOR
            ══════════════════════════════════════════════════════════════ */}
            <div className={`showroom-carousel-stage ${stage === 'carousel' ? 'active' : ''}`} id="showroomCarouselStage">
                {/* Carousel Top Header Shelf */}
                <div className="carousel-top-shelf">
                    <button
                        className="btn-showroom-back"
                        id="btnBackToBrands"
                        onClick={handleReturnToCurator}
                        title="Return to Brand Selection"
                        type="button"
                    >
                        <span>←</span>
                        <span>BACK TO MARQUES</span>
                    </button>

                    {/* Header Dots Indicator (replaces ALL FLEET 01/06) */}
                    <div className="carousel-dots-row carousel-header-dots" id="carouselHeaderDots">
                        {carouselFleet.map((_, i) => (
                            <div
                                key={i}
                                className={`carousel-dot ${i === activeIndex ? 'active' : ''}`}
                                onClick={() => setActiveIndex(i)}
                                title={`Vehicle ${i + 1} of ${carouselFleet.length}`}
                            />
                        ))}
                    </div>

                    <div className="carousel-nav-arrows">
                        <button
                            className="carousel-arrow-btn"
                            id="btnCarouselPrev"
                            title="Previous Car (Left Arrow)"
                            onClick={handlePrev}
                            type="button"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>
                        <button
                            className="carousel-arrow-btn"
                            id="btnCarouselNext"
                            title="Next Car (Right Arrow)"
                            onClick={handleNext}
                            type="button"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* 3D Spatial Anchor Revolving Ring (Strict 3-Card Stage) */}
                <div
                    className="carousel-3d-viewport"
                    id="carouselViewport"
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                >
                    {carouselFleet.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '120px 20px', color: 'var(--text-secondary)', width: '100%' }}>
                            <h4 style={{ fontFamily: 'var(--font-head)', fontSize: '18px', color: '#FFFFFF' }}>NO VEHICLES FOUND</h4>
                            <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-tertiary)' }}>No cars match the selected filters.</p>
                        </div>
                    ) : (
                        <div className="carousel-ring-container">
                            {carouselFleet.map((car, index) => {
                                const total = carouselFleet.length;
                                let diff = (index - activeIndex) % total;
                                if (diff > total / 2) diff -= total;
                                if (diff < -total / 2) diff += total;

                                let slotClass = 'slot-hidden';
                                if (diff === 0) slotClass = 'slot-center';
                                else if (diff === -1) slotClass = 'slot-left';
                                else if (diff === 1) slotClass = 'slot-right';
                                else if (diff < -1) slotClass = 'slot-hidden-left';
                                else if (diff > 1) slotClass = 'slot-hidden-right';

                                const isCenter = diff === 0;
                                const isLeft = diff === -1;
                                const isRight = diff === 1;

                                const yearText = car.year ? car.year : '—';
                                const makerText = car.maker ? car.maker : 'Bespoke';

                                return (
                                    <div
                                        key={car.id}
                                        className={`carousel-ring-card ${slotClass}`}
                                        onClick={() => {
                                            if (isLeft) handlePrev();
                                            else if (isRight) handleNext();
                                        }}
                                    >
                                        <div className="carousel-card-item">
                                            <div className="carousel-card-top-header">
                                                <span className="carousel-brand-tag-name">{(car.brand || 'ATELIER').toUpperCase()}</span>
                                                <span className="carousel-card-scale">{car.scale || '1:18'}</span>
                                            </div>

                                            <div className="carousel-card-hero-wrap">
                                                <img
                                                    className="carousel-card-hero-img"
                                                    src={car.photoUrl || 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=800&auto=format&fit=crop'}
                                                    alt={car.model}
                                                    loading="lazy"
                                                />
                                                <div className="carousel-hero-gradient-overlay" />
                                            </div>

                                            <div className="carousel-card-content">
                                                <div className="carousel-card-title-row">
                                                    <h3 className="carousel-card-model-name">{car.model}</h3>
                                                    <span
                                                        className={`carousel-fav-star ${car.isFavorite ? 'active' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onToggleFavorite(car.id);
                                                        }}
                                                        title="Toggle Favorite"
                                                    >
                                                        ★
                                                    </span>
                                                </div>

                                                <div className="carousel-card-specs-row">
                                                    <span className="spec-pill">{makerText}</span>
                                                    <span className="spec-pill">Year: {yearText}</span>
                                                    <span className="spec-pill">{car.scale || '1:18'}</span>
                                                </div>

                                                <div className="carousel-card-actions">
                                                    <button
                                                        type="button"
                                                        className="btn-carousel-dossier"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onOpenDossier(car.id);
                                                        }}
                                                    >
                                                        <span>Inspect Dossier</span>
                                                        <span>↗</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn-carousel-edit"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEditCar(car.id);
                                                        }}
                                                    >
                                                        <span>Edit ✎</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Carousel Bottom Controls */}
                <div className="carousel-bottom-shelf">
                    <div className="carousel-key-hint">
                        <span>Press <kbd>←</kbd> <kbd>→</kbd> arrow keys or click flanking cards to rotate</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
