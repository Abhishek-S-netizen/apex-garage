import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

/**
 * 3D Parallax Marque Card with Specular Sheen & Floating Z-Depth
 */
function ParallaxMarqueCard({ brand, count, index, onSelect, accentColor, isAllFleet = false }) {
    const cardRef = useRef(null);
    const [tilt, setTilt] = useState({ rx: 0, ry: 0, mx: 50, my: 50, active: false });

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        // Refined 4.2 deg max tilt
        const rx = -((y - cy) / cy) * 4.2;
        const ry = ((x - cx) / cx) * 4.2;
        const mx = (x / rect.width) * 100;
        const my = (y / rect.height) * 100;
        setTilt({ rx, ry, mx, my, active: true });
    };

    const handleMouseLeave = () => {
        setTilt({ rx: 0, ry: 0, mx: 50, my: 50, active: false });
    };

    return (
        <div
            ref={cardRef}
            className={`curator-marque-card ${isAllFleet ? 'curator-all-fleet-card' : ''}`}
            onClick={() => onSelect(isAllFleet ? 'all' : brand)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                '--card-delay': `${(index || 0) * 0.04}s`,
                transform: tilt.active
                    ? `perspective(1000px) rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`
                    : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
                transition: tilt.active ? 'transform 0.08s ease-out' : 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                '--specular-x': `${tilt.mx}%`,
                '--specular-y': `${tilt.my}%`
            }}
            role="button"
            tabIndex={0}
        >
            <div className="marque-specular-sheen" style={{ opacity: tilt.active ? 1 : 0 }} />

            <div className="marque-card-inner">
                <div className="marque-card-top">
                    <span className="marque-count-badge">
                        {count} {count === 1 ? 'VEHICLE' : 'VEHICLES'}
                    </span>
                </div>

                <div className="marque-card-body">
                    <h3 className="marque-card-name">
                        {isAllFleet ? 'ALL FLEET' : brand.toUpperCase()}
                    </h3>
                </div>

                <div className="marque-card-footer">
                    <span className="marque-enter-cta">
                        <span>{isAllFleet ? 'EXPLORE' : 'INSPECT'}</span>
                        <span className="cta-arrow">→</span>
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function Showroom({
    fleet,
    activeView,
    onOpenDossier,
    onEditCar,
    onToggleFavorite
}) {
    const [stage, setStage] = useState('curator'); // 'curator', 'carousel', or 'pavilion'
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

    // Segregated Marque Fleet for All Fleet Grand Pavilion
    const fleetByMarque = useMemo(() => {
        const groups = {};
        curatorFleet.forEach(car => {
            const b = car.brand || 'Bespoke';
            if (!groups[b]) groups[b] = [];
            groups[b].push(car);
        });
        return sortedBrands.map(b => ({
            brand: b,
            cars: groups[b] || []
        })).filter(g => g.cars.length > 0);
    }, [curatorFleet, sortedBrands]);

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

    // Direct Showroom Entry
    const handleSelectMarqueAndEnter = (brandKey) => {
        setSelectedMarque(brandKey);
        setActiveIndex(0);
        if (brandKey === 'all') {
            setStage('pavilion'); // Scalable 100+ car Grand Pavilion Gallery!
        } else {
            setStage('carousel'); // 3D Turntable Ring for individual brand!
        }
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
                    <h2 className="curator-hero-title">SELECT MARQUE TO ENTER SHOWROOM</h2>
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

                {/* Unified Apple-Style Marque Vitrine Grid */}
                <div className="curator-marque-grid" id="curatorMarqueGrid">
                    {/* Card 0: ALL FLEET Premier Vitrine */}
                    <ParallaxMarqueCard
                        brand="All Fleet"
                        count={curatorFleet.length}
                        index={0}
                        accentColor="#BDA794"
                        onSelect={handleSelectMarqueAndEnter}
                        isAllFleet={true}
                    />

                    {/* Brand Vitrines */}
                    {sortedBrands.map((brand, idx) => {
                        const info = marqueDetails[brand];
                        const accent = BRAND_HERITAGE_ACCENTS[brand] || '#BDA794';

                        return (
                            <ParallaxMarqueCard
                                key={brand}
                                brand={brand}
                                count={info?.count || 1}
                                index={idx + 1}
                                accentColor={accent}
                                onSelect={handleSelectMarqueAndEnter}
                            />
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

                    {/* Header Dots Indicator */}
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

            {/* ══════════════════════════════════════════════════════════════
                 STAGE 3: ALL FLEET GRAND PAVILION GALLERY (SCALABLE 100+ CARS)
            ══════════════════════════════════════════════════════════════ */}
            <div className={`showroom-pavilion-stage ${stage === 'pavilion' ? 'active' : ''}`} id="showroomPavilionStage">
                {/* Pavilion Top Header Shelf */}
                <div className="pavilion-top-shelf">
                    <button
                        className="btn-showroom-back"
                        onClick={handleReturnToCurator}
                        title="Return to Brand Selection"
                        type="button"
                    >
                        <span>←</span>
                        <span>BACK TO MARQUES</span>
                    </button>

                    <div className="pavilion-title-group">
                        <span className="pavilion-tag">GRAND ATELIER ARCHIVE</span>
                        <h2 className="pavilion-heading">
                            ALL FLEET GALLERY
                            <span className="pavilion-count-pill">{curatorFleet.length} VEHICLES</span>
                        </h2>
                    </div>
                </div>

                {/* Segregated by Marque Sections */}
                <div className="pavilion-brands-container">
                    {fleetByMarque.map(group => {
                        const accent = BRAND_HERITAGE_ACCENTS[group.brand] || '#BDA794';
                        return (
                            <div className="pavilion-brand-section" key={group.brand}>
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
                                    <button
                                        type="button"
                                        className="pavilion-brand-turntable-btn"
                                        onClick={() => {
                                            setSelectedMarque(group.brand);
                                            setActiveIndex(0);
                                            setStage('carousel');
                                        }}
                                        title={`Inspect ${group.brand} on 3D Turntable`}
                                    >
                                        <span>⟳ 3D TURNTABLE</span>
                                    </button>
                                </div>

                                <div className="pavilion-grid">
                                    {group.cars.map(car => (
                                        <div
                                            key={car.id}
                                            className="pavilion-car-card"
                                            onClick={() => onOpenDossier(car.id)}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <div className="pavilion-car-photo-wrap">
                                                <img
                                                    src={car.photoUrl || 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=800&auto=format&fit=crop'}
                                                    alt={car.model}
                                                    loading="lazy"
                                                />
                                                <div className="pavilion-card-badges">
                                                    <span className="pavilion-scale-badge">{car.scale || '1:18'}</span>
                                                    {car.isFavorite && <span className="pavilion-fav-star">★</span>}
                                                </div>
                                            </div>

                                            <div className="pavilion-car-info">
                                                <div className="pavilion-mobile-row">
                                                    <span className="pavilion-mobile-scale-pill">{car.scale || '1:18'}</span>
                                                    <span className="pavilion-car-brand">{(car.brand || 'Bespoke').toUpperCase()}</span>
                                                </div>
                                                <h4 className="pavilion-car-model">{car.model}</h4>
                                                <div className="pavilion-car-meta">
                                                    <span className="pavilion-maker">{car.maker || '—'}</span>
                                                    {car.year && <span className="pavilion-year">{car.year}</span>}
                                                </div>
                                            </div>
                                            <span className="pavilion-mobile-chevron" aria-hidden="true">›</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
