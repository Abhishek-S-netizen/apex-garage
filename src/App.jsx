import React, { useState, useEffect, useCallback } from 'react';
import { DEFAULT_APEX_DATA } from './data/initialData.js';
import { useApexTheme } from './theme/themeEngine.js';

import MacDock from './components/MacDock.jsx';
import Showroom from './components/Showroom.jsx';
import Registry from './components/Registry.jsx';
import Libraries from './components/Libraries.jsx';
import ThemeDrawer from './components/ThemeDrawer.jsx';
import VehicleModal from './components/VehicleModal.jsx';
import DossierModal from './components/DossierModal.jsx';

// Core Schema Sanitizer (Strips dead CRM fields, keeps only essential telemetry)
export function sanitizeCar(car, index = 0) {
    if (!car) return null;
    return {
        id: String(car.id || `apex_car_${Date.now()}_${index}`),
        brand: (car.brand || 'Bespoke').trim(),
        model: (car.model || 'Unknown Model').trim(),
        maker: (car.maker || '—').trim(),
        scale: car.scale || '1:64',
        year: car.year ? Number(car.year) : null,
        isFavorite: Boolean(car.isFavorite)
    };
}

export default function App() {
    // Theme Engine
    const { themeState, tokens, updateTheme, resetTheme } = useApexTheme();

    // Collection State (Stored strictly on laptop disk / browser storage)
    const [apexData, setApexData] = useState(() => {
        try {
            const saved = localStorage.getItem('apex_suite_data');
            if (saved !== null) {
                const parsed = JSON.parse(saved);
                if (parsed && Array.isArray(parsed.fleet)) {
                    return {
                        ...parsed,
                        fleet: parsed.fleet.map((c, i) => sanitizeCar(c, i)).filter(Boolean)
                    };
                }
            }
        } catch (e) { }
        return {
            ...DEFAULT_APEX_DATA,
            fleet: DEFAULT_APEX_DATA.fleet.map((c, i) => sanitizeCar(c, i)).filter(Boolean)
        };
    });

    const [activeView, setActiveView] = useState('showroom');
    const [isZenMode, setIsZenMode] = useState(false);
    const [isStudioOpen, setIsStudioOpen] = useState(false);

    // Modal states
    const [isCarModalOpen, setIsCarModalOpen] = useState(false);
    const [editCarId, setEditCarId] = useState(null);

    const [isDossierOpen, setIsDossierOpen] = useState(false);
    const [dossierCarId, setDossierCarId] = useState(null);

    // Save strictly to local laptop storage
    const saveAndSyncData = useCallback((newData) => {
        const cleanFleet = (newData.fleet || []).map((c, i) => sanitizeCar(c, i)).filter(Boolean);
        const cleanData = {
            ...newData,
            fleet: cleanFleet
        };
        setApexData(cleanData);
        try {
            localStorage.setItem('apex_suite_data', JSON.stringify(cleanData));
        } catch (e) { }

        // Optional local dev server sync to cars.json
        fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cleanData)
        }).catch(() => { });
    }, []);

    const handleUpdateTheme = useCallback((updates) => {
        updateTheme(updates);
    }, [updateTheme]);

    const handleResetTheme = useCallback(() => {
        resetTheme();
    }, [resetTheme]);

    // Initial load: fetch local server cars.json fallback if available
    useEffect(() => {
        fetch('/api/data', { cache: 'no-cache' })
            .then(res => {
                if (res.ok) return res.json();
                throw new Error('Offline');
            })
            .then(data => {
                if (data && Array.isArray(data.fleet) && data.fleet.length > 0) {
                    const cleanFleet = data.fleet.map((c, i) => sanitizeCar(c, i)).filter(Boolean);
                    const cleanData = { ...data, fleet: cleanFleet };
                    setApexData(cleanData);
                    try {
                        localStorage.setItem('apex_suite_data', JSON.stringify(cleanData));
                    } catch (e) { }
                }
            })
            .catch(() => { });
    }, []);

    // Global keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
                if (e.key === 'Escape') {
                    setIsCarModalOpen(false);
                    setIsDossierOpen(false);
                    setIsStudioOpen(false);
                }
                return;
            }

            switch (e.key.toLowerCase()) {
                case '1':
                    setActiveView('showroom');
                    break;
                case '2':
                    setActiveView('registry');
                    break;
                case '3':
                    setActiveView('libraries');
                    break;
                case 'n':
                    e.preventDefault();
                    setEditCarId(null);
                    setIsCarModalOpen(true);
                    break;
                case 't':
                    e.preventDefault();
                    setIsStudioOpen(prev => !prev);
                    break;
                case 'z':
                    setIsZenMode(prev => !prev);
                    break;
                case 'escape':
                    setIsCarModalOpen(false);
                    setIsDossierOpen(false);
                    setIsStudioOpen(false);
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Zen Mode Class on Body
    useEffect(() => {
        if (isZenMode) {
            document.body.classList.add('zen-mode');
        } else {
            document.body.classList.remove('zen-mode');
        }
    }, [isZenMode]);

    // Vehicle CRUD Handlers
    const handleSaveCar = (carData) => {
        const cleanCar = sanitizeCar(carData);
        if (!cleanCar) return;

        let updatedFleet;
        const exists = apexData.fleet.some(c => c.id === cleanCar.id);
        if (exists) {
            updatedFleet = apexData.fleet.map(c => c.id === cleanCar.id ? cleanCar : c);
        } else {
            updatedFleet = [cleanCar, ...apexData.fleet];
        }

        const updatedBrands = apexData.brands.includes(cleanCar.brand)
            ? apexData.brands
            : [...apexData.brands, cleanCar.brand];

        const updatedMakers = apexData.makers.includes(cleanCar.maker)
            ? apexData.makers
            : [...apexData.makers, cleanCar.maker];

        saveAndSyncData({
            ...apexData,
            fleet: updatedFleet,
            brands: updatedBrands,
            makers: updatedMakers
        });
    };

    const handleDeleteCar = (carId) => {
        const updatedFleet = apexData.fleet.filter(c => c.id !== carId);
        saveAndSyncData({ ...apexData, fleet: updatedFleet });
    };

    const handleToggleFavorite = (carId) => {
        const updatedFleet = apexData.fleet.map(c => {
            if (c.id === carId) {
                return { ...c, isFavorite: !c.isFavorite };
            }
            return c;
        });
        saveAndSyncData({ ...apexData, fleet: updatedFleet });
    };

    // Library Handlers
    const handleAddBrand = (brandName) => {
        if (!apexData.brands.includes(brandName)) {
            saveAndSyncData({ ...apexData, brands: [...apexData.brands, brandName] });
        }
    };

    const handleDeleteBrand = (brandName) => {
        saveAndSyncData({ ...apexData, brands: apexData.brands.filter(b => b !== brandName) });
    };

    const handleAddMaker = (makerName) => {
        if (!apexData.makers.includes(makerName)) {
            saveAndSyncData({ ...apexData, makers: [...apexData.makers, makerName] });
        }
    };

    const handleDeleteMaker = (makerName) => {
        saveAndSyncData({ ...apexData, makers: apexData.makers.filter(m => m !== makerName) });
    };

    // Automatic Import & Cleaner (Uploads from Downloads, strips bloat, saves locally)
    const handleImportJSON = useCallback((fileOrData) => {
        const processData = (raw) => {
            const rawFleet = Array.isArray(raw) ? raw : (raw.fleet || []);
            const cleanFleet = rawFleet.map((c, i) => sanitizeCar(c, i)).filter(Boolean);

            if (cleanFleet.length === 0) {
                alert('No vehicles found in the selected file.');
                return;
            }

            // Automatically extract all unique marques and makers from the imported fleet
            const importedBrands = Array.from(new Set(cleanFleet.map(c => c.brand).filter(Boolean)));
            const importedMakers = Array.from(new Set(cleanFleet.map(c => c.maker).filter(Boolean)));

            const mergedBrands = Array.from(new Set([...(raw.brands || []), ...importedBrands, ...(apexData.brands || [])]));
            const mergedMakers = Array.from(new Set([...(raw.makers || []), ...importedMakers, ...(apexData.makers || [])]));

            const newCleanData = {
                fleet: cleanFleet,
                brands: mergedBrands,
                makers: mergedMakers
            };

            saveAndSyncData(newCleanData);
            alert(`Successfully restored ${cleanFleet.length} vehicles!`);
        };

        if (fileOrData instanceof File || fileOrData instanceof Blob) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const raw = JSON.parse(e.target.result);
                    processData(raw);
                } catch (err) {
                    console.error(err);
                    alert('Failed to read JSON file. Please check that the file contains valid JSON.');
                }
            };
            reader.readAsText(fileOrData);
        } else if (fileOrData && typeof fileOrData === 'object') {
            processData(fileOrData);
        }
    }, [apexData.brands, apexData.makers, saveAndSyncData]);

    // Export Clean JSON
    const handleExportJSON = useCallback(() => {
        const cleanFleet = apexData.fleet.map((c, i) => sanitizeCar(c, i)).filter(Boolean);
        const cleanData = {
            fleet: cleanFleet,
            brands: apexData.brands,
            makers: apexData.makers,
            exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(cleanData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `APEX_Fleet_Clean_${new Date().toISOString().substring(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [apexData]);

    const activeDossierCar = apexData.fleet.find(c => c.id === dossierCarId);
    const activeEditCar = apexData.fleet.find(c => c.id === editCarId);

    return (
        <>
            {/* Atelier Ambient Warm Gradient Backdrop (#BDA794 to #1A1819) */}
            <div className="atelier-gradient-backdrop" id="atelierBackdrop" />
            <div className="ambient-warmth-orb orb-top" />
            <div className="ambient-warmth-orb orb-bottom" />

            <div className="app-shell" id="appShell">
                {/* macOS Floating Frosted Glass Dock */}
                <MacDock
                    activeView={activeView}
                    setActiveView={setActiveView}
                    onOpenStudio={() => setIsStudioOpen(true)}
                    onAddCar={() => {
                        setEditCarId(null);
                        setIsCarModalOpen(true);
                    }}
                />

                {/* Main Views Container */}
                <main className="main-stage">
                    <Showroom
                        fleet={apexData.fleet}
                        activeView={activeView}
                        onOpenDossier={(carId) => {
                            setDossierCarId(carId);
                            setIsDossierOpen(true);
                        }}
                        onEditCar={(carId) => {
                            setEditCarId(carId);
                            setIsCarModalOpen(true);
                        }}
                        onToggleFavorite={(carId) => handleToggleFavorite(carId)}
                    />

                    <Registry
                        fleet={apexData.fleet}
                        activeView={activeView}
                        onOpenDossier={(carId) => {
                            setDossierCarId(carId);
                            setIsDossierOpen(true);
                        }}
                        onEditCar={(carId) => {
                            setEditCarId(carId);
                            setIsCarModalOpen(true);
                        }}
                        onAddCar={() => {
                            setEditCarId(null);
                            setIsCarModalOpen(true);
                        }}
                        onToggleFavorite={(carId) => handleToggleFavorite(carId)}
                        onExportJSON={handleExportJSON}
                        onImportJSON={handleImportJSON}
                    />

                    <Libraries
                        brands={apexData.brands}
                        makers={apexData.makers}
                        activeView={activeView}
                        onAddBrand={handleAddBrand}
                        onDeleteBrand={handleDeleteBrand}
                        onAddMaker={handleAddMaker}
                        onDeleteMaker={handleDeleteMaker}
                    />
                </main>
            </div>

            {/* Modals & Slide-in Drawers */}
            <VehicleModal
                isOpen={isCarModalOpen}
                onClose={() => setIsCarModalOpen(false)}
                onSave={handleSaveCar}
                brands={apexData.brands}
                makers={apexData.makers}
                editCar={activeEditCar}
            />

            <DossierModal
                isOpen={isDossierOpen}
                car={activeDossierCar}
                onClose={() => setIsDossierOpen(false)}
                onEdit={(carId) => {
                    setEditCarId(carId);
                    setIsCarModalOpen(true);
                }}
                onDelete={handleDeleteCar}
                onToggleFavorite={handleToggleFavorite}
            />

            <ThemeDrawer
                isOpen={isStudioOpen}
                onClose={() => setIsStudioOpen(false)}
                themeState={themeState}
                tokens={tokens}
                updateTheme={handleUpdateTheme}
                onUpdateTheme={handleUpdateTheme}
                resetTheme={handleResetTheme}
                onResetTheme={handleResetTheme}
                onExportBackup={handleExportJSON}
                onImportData={handleImportJSON}
                apexData={apexData}
            />
        </>
    );
}
