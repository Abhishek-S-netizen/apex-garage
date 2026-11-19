import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_APEX_DATA } from './data/initialData.js';
import { useApexTheme } from './theme/themeEngine.js';
import {
    isFileAccessSupported,
    getStoredHandle,
    storeHandle,
    clearStoredHandle,
    ensurePermission,
    readGarageFile,
    writeGarageFile,
    pickNewGarageFile,
    pickExistingGarageFile
} from './data/garageFile.js';

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

    // Primary Collection State (Laptop disk cars.json is the master database)
    const [apexData, setApexData] = useState(() => {
        try {
            const saved = localStorage.getItem('apex_suite_data');
            if (saved !== null) {
                const parsed = JSON.parse(saved);
                if (parsed && Array.isArray(parsed.fleet) && parsed.fleet.length > 0) {
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

    // ── Linked Garage File (real cars.json on laptop disk) ──
    // status: 'checking' | 'unsupported' | 'unlinked' | 'needs-permission' | 'linked' | 'error'
    const [garageFile, setGarageFile] = useState({
        status: isFileAccessSupported ? 'checking' : 'unsupported',
        name: null,
        error: null
    });
    const [isFileBannerDismissed, setIsFileBannerDismissed] = useState(false);
    const fileHandleRef = useRef(null);
    const writeQueueRef = useRef(Promise.resolve());
    const apexDataRef = useRef(apexData);
    useEffect(() => { apexDataRef.current = apexData; }, [apexData]);

    // Turn raw file contents into clean app data
    const normalizeData = (raw) => {
        const rawFleet = Array.isArray(raw) ? raw : (raw?.fleet || []);
        const fleet = rawFleet.map((c, i) => sanitizeCar(c, i)).filter(Boolean);
        const brands = Array.from(new Set([...(raw?.brands || []), ...fleet.map(c => c.brand)].filter(Boolean)));
        const makers = Array.from(new Set([...(raw?.makers || []), ...fleet.map(c => c.maker)].filter(Boolean)));
        return { fleet, brands, makers };
    };

    const applyData = (cleanData) => {
        setApexData(cleanData);
        try {
            localStorage.setItem('apex_suite_data', JSON.stringify(cleanData));
        } catch (e) { }
    };

    // Queue writes so rapid edits never overlap on disk
    const writeToLinkedFile = useCallback((data) => {
        const handle = fileHandleRef.current;
        if (!handle) return;
        writeQueueRef.current = writeQueueRef.current
            .then(() => writeGarageFile(handle, data))
            .then(() => setGarageFile(s => ({ ...s, status: 'linked', error: null })))
            .catch((err) => {
                console.error('[APEX Garage File] Write failed:', err);
                setGarageFile(s => ({ ...s, status: 'error', error: err.message }));
            });
    }, []);

    // Save: linked cars.json on disk (master) + browser mirror (safety net)
    const saveAndSyncData = useCallback((newData) => {
        const cleanFleet = (newData.fleet || []).map((c, i) => sanitizeCar(c, i)).filter(Boolean);
        const cleanData = {
            ...newData,
            fleet: cleanFleet
        };
        applyData(cleanData);
        writeToLinkedFile(cleanData);

        // Local dev only: Vite middleware also mirrors to the project's cars.json
        if (import.meta.env.DEV) {
            fetch('/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cleanData)
            }).catch(() => { });
        }
    }, [writeToLinkedFile]);

    const handleUpdateTheme = useCallback((updates) => {
        updateTheme(updates);
    }, [updateTheme]);

    const handleResetTheme = useCallback(() => {
        resetTheme();
    }, [resetTheme]);

    // Read the linked file into the app (or seed it if it's brand new / empty)
    const loadFromLinkedFile = async (handle) => {
        const raw = await readGarageFile(handle);
        const hasCars = raw && (Array.isArray(raw) || Array.isArray(raw.fleet));
        if (hasCars) {
            applyData(normalizeData(raw));
        } else {
            await writeGarageFile(handle, apexDataRef.current);
        }
    };

    // Startup: reconnect to the previously linked cars.json
    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!isFileAccessSupported) return;
            const handle = await getStoredHandle();
            if (cancelled) return;
            if (!handle) {
                setGarageFile({ status: 'unlinked', name: null, error: null });
                return;
            }
            fileHandleRef.current = handle;
            try {
                if (await ensurePermission(handle, false)) {
                    await loadFromLinkedFile(handle);
                    if (!cancelled) setGarageFile({ status: 'linked', name: handle.name, error: null });
                } else if (!cancelled) {
                    // Browser needs one click to re-allow access this session
                    setGarageFile({ status: 'needs-permission', name: handle.name, error: null });
                }
            } catch (err) {
                if (!cancelled) setGarageFile({ status: 'error', name: handle.name, error: err.message });
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const isPickerCancel = (err) => err && err.name === 'AbortError';

    // Create a new cars.json and write the current garage into it
    const handleCreateGarageFile = async () => {
        try {
            const handle = await pickNewGarageFile();
            await writeGarageFile(handle, apexDataRef.current);
            await storeHandle(handle);
            fileHandleRef.current = handle;
            setGarageFile({ status: 'linked', name: handle.name, error: null });
        } catch (err) {
            if (!isPickerCancel(err)) alert(`Could not create the garage file: ${err.message}`);
        }
    };

    // Link an existing cars.json and load its cars
    const handleOpenGarageFile = async () => {
        try {
            const handle = await pickExistingGarageFile();
            if (!(await ensurePermission(handle, true))) {
                alert('Permission to edit the file was not granted.');
                return;
            }
            const raw = await readGarageFile(handle);
            const incoming = raw ? normalizeData(raw) : null;
            if (incoming && incoming.fleet.length > 0) {
                if (!window.confirm(`Load ${incoming.fleet.length} vehicles from "${handle.name}"? This replaces the cars currently shown in the app.`)) return;
                applyData(incoming);
            } else {
                // Empty file: seed it with the current garage
                await writeGarageFile(handle, apexDataRef.current);
            }
            await storeHandle(handle);
            fileHandleRef.current = handle;
            setGarageFile({ status: 'linked', name: handle.name, error: null });
        } catch (err) {
            if (!isPickerCancel(err)) alert(`Could not open the garage file: ${err.message}`);
        }
    };

    // Re-allow access after reopening the app (needs a click)
    const handleReconnectGarageFile = async () => {
        const handle = fileHandleRef.current;
        if (!handle) return handleOpenGarageFile();
        try {
            if (await ensurePermission(handle, true)) {
                await loadFromLinkedFile(handle);
                setGarageFile({ status: 'linked', name: handle.name, error: null });
            }
        } catch (err) {
            setGarageFile({ status: 'error', name: handle.name, error: err.message });
        }
    };

    const handleUnlinkGarageFile = async () => {
        if (!window.confirm('Stop saving to this file? Your file on disk is kept; the app just stops writing to it.')) return;
        await clearStoredHandle().catch(() => { });
        fileHandleRef.current = null;
        setGarageFile({ status: 'unlinked', name: null, error: null });
    };

    // Local dev only: load the project's cars.json via Vite middleware (read-only on startup)
    useEffect(() => {
        if (!import.meta.env.DEV) return;
        fetch('/api/data', { cache: 'no-cache' })
            .then(res => (res.ok ? res.json() : null))
            .then(diskData => {
                if (fileHandleRef.current) return; // linked file wins
                if (diskData && Array.isArray(diskData.fleet) && diskData.fleet.length > 0) {
                    applyData(normalizeData(diskData));
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
            alert(fileHandleRef.current
                ? `Successfully restored ${cleanFleet.length} vehicles and saved them to ${fileHandleRef.current.name}.`
                : `Successfully restored ${cleanFleet.length} vehicles. Tip: link a cars.json file in Studio so they're saved to your disk.`);
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

            {/* Garage File status banner (only when action is needed) */}
            {(garageFile.status === 'needs-permission' ||
                garageFile.status === 'error' ||
                (garageFile.status === 'unlinked' && !isFileBannerDismissed)) && (
                <div className={`garage-file-banner ${garageFile.status === 'error' ? 'is-error' : ''}`} role="status">
                    <span className="garage-file-banner-text">
                        {garageFile.status === 'needs-permission' && <>Click to reconnect <strong>{garageFile.name}</strong> so changes save to your disk.</>}
                        {garageFile.status === 'error' && <>Couldn't save to <strong>{garageFile.name}</strong>. Reconnect the file to keep saving.</>}
                        {garageFile.status === 'unlinked' && <>Your garage isn't saved to a file on your laptop yet.</>}
                    </span>
                    {garageFile.status === 'unlinked' ? (
                        <>
                            <button type="button" className="garage-file-banner-btn" onClick={handleCreateGarageFile}>Create cars.json</button>
                            <button type="button" className="garage-file-banner-btn is-ghost" onClick={handleOpenGarageFile}>Open existing</button>
                            <button type="button" className="garage-file-banner-close" onClick={() => setIsFileBannerDismissed(true)} title="Dismiss">✕</button>
                        </>
                    ) : (
                        <button type="button" className="garage-file-banner-btn" onClick={handleReconnectGarageFile}>Reconnect</button>
                    )}
                </div>
            )}
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
                garageFile={garageFile}
                onCreateGarageFile={handleCreateGarageFile}
                onOpenGarageFile={handleOpenGarageFile}
                onReconnectGarageFile={handleReconnectGarageFile}
                onUnlinkGarageFile={handleUnlinkGarageFile}
            />
        </>
    );
}
