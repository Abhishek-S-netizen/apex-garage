import React, { useState } from 'react';

export default function Libraries({
    brands,
    makers,
    activeView,
    onAddBrand,
    onDeleteBrand,
    onAddMaker,
    onDeleteMaker
}) {
    const [newBrand, setNewBrand] = useState('');
    const [newMaker, setNewMaker] = useState('');

    const handleAddBrandSubmit = (e) => {
        e.preventDefault();
        const b = newBrand.trim();
        if (b) {
            onAddBrand(b);
            setNewBrand('');
        }
    };

    const handleAddMakerSubmit = (e) => {
        e.preventDefault();
        const m = newMaker.trim();
        if (m) {
            onAddMaker(m);
            setNewMaker('');
        }
    };

    return (
        <section className={`view-panel ${activeView === 'libraries' ? 'active' : ''}`} id="viewLibraries">
            <div className="libraries-wrapper">
                <div className="libraries-header">
                    <span className="bento-tag">STANDARDIZED LIBRARIES</span>
                    <h2 className="registry-title">Brands & Manufacturers</h2>
                    <p className="registry-sub">
                        Standardize your database. Add, rename, or purge vehicle brands and model makers globally.
                    </p>
                </div>

                <div className="libraries-split-grid">
                    {/* Left: Car Brands */}
                    <div className="library-card">
                        <div className="library-card-header">
                            <div>
                                <span className="library-tag">AUTOMOBILE MARQUES</span>
                                <h3 className="library-title">Vehicle Brands ({brands.length})</h3>
                            </div>
                            <form className="library-add-inline" onSubmit={handleAddBrandSubmit}>
                                <input
                                    type="text"
                                    id="inputNewBrand"
                                    placeholder="New Brand..."
                                    maxLength={30}
                                    value={newBrand}
                                    onChange={(e) => setNewBrand(e.target.value)}
                                />
                                <button type="submit" className="btn-inline-add" id="btnAddBrand">+</button>
                            </form>
                        </div>
                        <div className="library-tags-list" id="brandsTagsList">
                            {brands.map(b => (
                                <div key={b} className="lib-tag-pill">
                                    <span>{b}</span>
                                    <span
                                        className="lib-tag-delete"
                                        onClick={() => onDeleteBrand(b)}
                                        title={`Delete ${b}`}
                                    >
                                        ✕
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Model Makers */}
                    <div className="library-card">
                        <div className="library-card-header">
                            <div>
                                <span className="library-tag">MODEL DIECAST MAKERS</span>
                                <h3 className="library-title">Manufacturers ({makers.length})</h3>
                            </div>
                            <form className="library-add-inline" onSubmit={handleAddMakerSubmit}>
                                <input
                                    type="text"
                                    id="inputNewMaker"
                                    placeholder="New Maker..."
                                    maxLength={30}
                                    value={newMaker}
                                    onChange={(e) => setNewMaker(e.target.value)}
                                />
                                <button type="submit" className="btn-inline-add" id="btnAddMaker">+</button>
                            </form>
                        </div>
                        <div className="library-tags-list" id="makersTagsList">
                            {makers.map(m => (
                                <div key={m} className="lib-tag-pill">
                                    <span>{m}</span>
                                    <span
                                        className="lib-tag-delete"
                                        onClick={() => onDeleteMaker(m)}
                                        title={`Delete ${m}`}
                                    >
                                        ✕
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
