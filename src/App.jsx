import React, { useState, useEffect, useCallback } from 'react';
import { DEFAULT_APEX_DATA } from './data/initialData.js';
import { useApexTheme } from './theme/themeEngine.js';
import {
    fetchRemoteGarage,
    saveRemoteGarage,
    isSupabaseConfigured,
    getStoredSession,
    validateCurrentSession,
    signOutOwner
} from './lib/supabase.js';

import MacDock from './components/MacDock.jsx';
import Cockpit from './components/Cockpit.jsx';
import Showroom from './components/Showroom.jsx';
import Registry from './components/Registry.jsx';
import PegHunt from './components/PegHunt.jsx';
import Libraries from './components/Libraries.jsx';
import ThemeDrawer from './components/ThemeDrawer.jsx';
import VehicleModal from './components/VehicleModal.jsx';
import DossierModal from './components/DossierModal.jsx';
import WishModal from './components/WishModal.jsx';
import AuthModal from './components/AuthModal.jsx';

export default function App() {
    // Theme Engine
    const { themeState, tokens, updateTheme, resetTheme } = useApexTheme();

    // Owner Security & Session State
    const [ownerSession, setOwnerSession] = useState(() => getStoredSession());
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const isOwnerLoggedIn = Boolean(ownerSession && ownerSession.access_token);

    // Validate active session in background on load
    useEffect(() => {
        validateCurrentSession().then(validated => {
            setOwnerSession(validated);
        });
    }, []);

    const handleSignOut = async () => {
        await signOutOwner();
        setOwnerSession(null);
    };

    // Owner Guard: Prompts AuthModal if in Viewer Mode
    const requireOwner = useCallback((actionFn) => {
        if (isOwnerLoggedIn) {
            actionFn();
        } else {
            setIsAuthModalOpen(true);
        }
    }, [isOwnerLoggedIn]);

    // Collection State
    const [apexData, setApexData] = useState(() => {
        try {
            const saved = localStorage.getItem('apex_suite_data');
            if (saved !== null) {
                const parsed = JSON.parse(saved);
                if (parsed && Array.isArray(parsed.fleet)) return parsed;
            }
        } catch (e) { }
        return DEFAULT_APEX_DATA;
    });

    const [activeView, setActiveView] = useState('cockpit');
    const [isZenMode, setIsZenMode] = useState(false);
    const [isStudioOpen, setIsStudioOpen] = useState(false);

    // Modal states
    const [isCarModalOpen, setIsCarModalOpen] = useState(false);
    const [editCarId, setEditCarId] = useState(null);

    const [isDossierOpen, setIsDossierOpen] = useState(false);
    const [dossierCarId, setDossierCarId] = useState(null);

    const [isWishModalOpen, setIsWishModalOpen] = useState(false);

    // Save and sync helper (Cloud + LocalStorage + Theme)
    const saveAndSyncData = useCallback((newData) => {
        setApexData(newData);
        try {
            localStorage.setItem('apex_suite_data', JSON.stringify(newData));
        } catch (e) { }

        // Sync to Supabase Cloud if configured (including active theme)
        if (isSupabaseConfigured()) {
            saveRemoteGarage({ ...newData, theme: themeState });
        }

        // Optional local dev server fallback
        fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newData)
        }).catch(() => { });
    }, [themeState]);

    // Handle theme updates and sync with Supabase
    const handleUpdateTheme = useCallback((updates) => {
        updateTheme(updates);
        if (isSupabaseConfigured()) {
            const updatedTheme = { ...themeState, ...updates };
            saveRemoteGarage({ ...apexData, theme: updatedTheme });
        }
    }, [updateTheme, themeState, apexData]);

    const handleResetTheme = useCallback(() => {
        resetTheme();
        if (isSupabaseConfigured()) {
            saveRemoteGarage({ ...apexData, theme: null });
        }
    }, [resetTheme, apexData]);

    // Initial load: Fetch from Supabase Cloud (or local server fallback)
    useEffect(() => {
        if (isSupabaseConfigured()) {
            fetchRemoteGarage().then(remoteData => {
                if (remoteData) {
                    if (Array.isArray(remoteData.fleet)) {
                        setApexData(remoteData);
                        try {
                            localStorage.setItem('apex_suite_data', JSON.stringify(remoteData));
                        } catch (e) { }
                    }
                    if (remoteData.theme) {
                        updateTheme(remoteData.theme);
                    }
                }
            });
        } else {
            // Local fallback
            fetch('/api/data', { cache: 'no-cache' })
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error('Offline');
                })
                .then(data => {
                    if (data && Array.isArray(data.fleet)) {
                        setApexData(data);
                        try {
                            localStorage.setItem('apex_suite_data', JSON.stringify(data));
                        } catch (e) { }
                    }
                })
                .catch(() => { });
        }
    }, []);

    // Global keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
                if (e.key === 'Escape') {
                    setIsCarModalOpen(false);
                    setIsDossierOpen(false);
                    setIsWishModalOpen(false);
                    setIsStudioOpen(false);
                }
                return;
            }

            if (e.key === '\\') {
                e.preventDefault();
                setIsZenMode(prev => !prev);
                return;
            }

            if (isZenMode && e.key === 'Escape') {
                e.preventDefault();
                setIsZenMode(false);
                return;
            }

            if (e.key === '1') setActiveView('cockpit');
            if (e.key === '2') setActiveView('showroom');
            if (e.key === '3') setActiveView('registry');
            if (e.key === '4') setActiveView('peghunt');
            if (e.key === '5') setActiveView('libraries');
            if (e.key === 'n' || e.key === 'N') {
                setEditCarId(null);
                setIsCarModalOpen(true);
            }
            if (e.key === 't' || e.key === 'T') {
                setIsStudioOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsCarModalOpen(false);
                setIsDossierOpen(false);
                setIsWishModalOpen(false);
                setIsStudioOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isZenMode]);

    // Zen mode toggle on body
    useEffect(() => {
        document.body.classList.toggle('zen-mode', isZenMode);
    }, [isZenMode]);

    // Vehicle CRUD
    const handleSaveCar = (carPayload) => {
        const isEditing = apexData.fleet.some(c => c.id === carPayload.id);
        let updatedFleet;
        if (isEditing) {
            updatedFleet = apexData.fleet.map(c => c.id === carPayload.id ? carPayload : c);
        } else {
            updatedFleet = [carPayload, ...apexData.fleet];
        }
        saveAndSyncData({ ...apexData, fleet: updatedFleet });
    };

    const handleDeleteCar = (carId) => {
        const updatedFleet = apexData.fleet.filter(c => c.id !== carId);
        saveAndSyncData({ ...apexData, fleet: updatedFleet });
    };

    const handleToggleFavorite = (carId) => {
        const updatedFleet = apexData.fleet.map(c => {
            if (c.id === carId) return { ...c, isFavorite: !c.isFavorite };
            return c;
        });
        saveAndSyncData({ ...apexData, fleet: updatedFleet });
    };

    // Wishlist actions
    const handleSaveWish = (wishItem) => {
        const updatedWishlist = [wishItem, ...apexData.wishlist];
        saveAndSyncData({ ...apexData, wishlist: updatedWishlist });
    };

    const handleDeleteWish = (wishId) => {
        const updatedWishlist = apexData.wishlist.filter(w => w.id !== wishId);
        saveAndSyncData({ ...apexData, wishlist: updatedWishlist });
    };

    const handleGraduateWish = (wishItem) => {
        setEditCarId(null);
        setIsCarModalOpen(true);
    };

    // Libraries actions
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

    // Export JSON (Owner Protected)
    const handleExportJSON = () => {
        requireOwner(() => {
            const blob = new Blob([JSON.stringify(apexData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `APEX_Fleet_Backup_${new Date().toISOString().substring(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    };

    const activeDossierCar = apexData.fleet.find(c => c.id === dossierCarId);
    const activeEditCar = apexData.fleet.find(c => c.id === editCarId);

    return (
        <>
            {/* Atelier Ambient Warm Gradient Backdrop (#BDA794 to #1A1819) */}
            <div className="atelier-gradient-backdrop" id="atelierBackdrop" />
            <div className="ambient-warmth-orb orb-top" />
            <div className="ambient-warmth-orb orb-bottom" />

            <div className="app-shell" id="appShell">
                {/* Top Telemetry & Vault Security Status Bar */}
                <div className="top-status-bar">
                    <div className="status-brand-mark">
                        <span className="status-dot" />
                        <span>VAULT ONLINE</span>
                    </div>

                    <div className="status-auth-pill">
                        {isOwnerLoggedIn ? (
                            <div className="owner-status-chip">
                                <span className="owner-dot" />
                                <span className="owner-label">OWNER ACTIVE</span>
                                {ownerSession?.user?.email && (
                                    <span className="owner-email">{ownerSession.user.email}</span>
                                )}
                                <button
                                    className="btn-auth-switch"
                                    onClick={handleSignOut}
                                    title="Sign out to Viewer Mode"
                                    type="button"
                                >
                                    Log Out
                                </button>
                            </div>
                        ) : (
                            <div className="viewer-status-chip">
                                <span className="viewer-label">VIEWER MODE</span>
                                <button
                                    className="btn-auth-switch"
                                    onClick={() => setIsAuthModalOpen(true)}
                                    title="Sign in as Owner"
                                    type="button"
                                >
                                    Sign In
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* macOS Floating Frosted Glass Dock */}
                <MacDock
                    activeView={activeView}
                    setActiveView={setActiveView}
                    onOpenStudio={() => setIsStudioOpen(true)}
                    onAddCar={() => requireOwner(() => {
                        setEditCarId(null);
                        setIsCarModalOpen(true);
                    })}
                    isOwnerLoggedIn={isOwnerLoggedIn}
                    ownerUser={ownerSession?.user}
                    onOpenAuthModal={() => setIsAuthModalOpen(true)}
                    onSignOut={handleSignOut}
                />

                {/* Main Views Container */}
                <main className="main-stage">
                    <Cockpit
                        fleet={apexData.fleet}
                        activeView={activeView}
                        themeTokens={tokens}
                        onOpenDossier={(carId) => {
                            setDossierCarId(carId);
                            setIsDossierOpen(true);
                        }}
                        onAddCar={() => requireOwner(() => {
                            setEditCarId(null);
                            setIsCarModalOpen(true);
                        })}
                    />

                    <Showroom
                        fleet={apexData.fleet}
                        activeView={activeView}
                        onOpenDossier={(carId) => {
                            setDossierCarId(carId);
                            setIsDossierOpen(true);
                        }}
                        onEditCar={(carId) => requireOwner(() => {
                            setEditCarId(carId);
                            setIsCarModalOpen(true);
                        })}
                        onToggleFavorite={(carId) => requireOwner(() => handleToggleFavorite(carId))}
                    />

                    <Registry
                        fleet={apexData.fleet}
                        activeView={activeView}
                        onOpenDossier={(carId) => {
                            setDossierCarId(carId);
                            setIsDossierOpen(true);
                        }}
                        onEditCar={(carId) => requireOwner(() => {
                            setEditCarId(carId);
                            setIsCarModalOpen(true);
                        })}
                        onAddCar={() => requireOwner(() => {
                            setEditCarId(null);
                            setIsCarModalOpen(true);
                        })}
                        onToggleFavorite={(carId) => requireOwner(() => handleToggleFavorite(carId))}
                        onExportJSON={handleExportJSON}
                    />

                    <PegHunt
                        wishlist={apexData.wishlist}
                        activeView={activeView}
                        onAddWish={() => requireOwner(() => setIsWishModalOpen(true))}
                        onGraduateWish={(wishItem) => requireOwner(() => handleGraduateWish(wishItem))}
                        onDeleteWish={(wishId) => requireOwner(() => handleDeleteWish(wishId))}
                    />

                    <Libraries
                        brands={apexData.brands}
                        makers={apexData.makers}
                        activeView={activeView}
                        onAddBrand={(b) => requireOwner(() => handleAddBrand(b))}
                        onDeleteBrand={(b) => requireOwner(() => handleDeleteBrand(b))}
                        onAddMaker={(m) => requireOwner(() => handleAddMaker(m))}
                        onDeleteMaker={(m) => requireOwner(() => handleDeleteMaker(m))}
                    />
                </main>
            </div>

            {/* Modals & Slide-in Drawers */}
            <VehicleModal
                isOpen={isCarModalOpen}
                onClose={() => setIsCarModalOpen(false)}
                onSave={(car) => requireOwner(() => handleSaveCar(car))}
                brands={apexData.brands}
                makers={apexData.makers}
                editCar={activeEditCar}
            />

            <DossierModal
                isOpen={isDossierOpen}
                car={activeDossierCar}
                onClose={() => setIsDossierOpen(false)}
                onEdit={(carId) => requireOwner(() => {
                    setEditCarId(carId);
                    setIsCarModalOpen(true);
                })}
                onDelete={(carId) => requireOwner(() => handleDeleteCar(carId))}
                onToggleFavorite={(carId) => requireOwner(() => handleToggleFavorite(carId))}
            />

            <WishModal
                isOpen={isWishModalOpen}
                onClose={() => setIsWishModalOpen(false)}
                onSave={(w) => requireOwner(() => handleSaveWish(w))}
                brands={apexData.brands}
                makers={apexData.makers}
            />

            <ThemeDrawer
                isOpen={isStudioOpen}
                onClose={() => setIsStudioOpen(false)}
                themeState={themeState}
                updateTheme={handleUpdateTheme}
                resetTheme={handleResetTheme}
                apexData={apexData}
                onImportData={(data) => requireOwner(() => saveAndSyncData(data))}
                onExportBackup={handleExportJSON}
            />

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onAuthSuccess={(session) => {
                    setOwnerSession(session);
                }}
            />

            {/* Zen Mode Exit Indicator */}
            {isZenMode && (
                <div
                    className="zen-exit-indicator"
                    onClick={() => setIsZenMode(false)}
                >
                    CLICK ANYWHERE OR PRESS ESC TO EXIT ZEN VIEW
                </div>
            )}
        </>
    );
}
