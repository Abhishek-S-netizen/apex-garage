import React from 'react';
import { SWATCHES } from '../theme/themeEngine.js';

export default function ThemeDrawer({
    isOpen,
    onClose,
    themeState,
    updateTheme,
    resetTheme,
    apexData = null,
    onImportData = () => {}
}) {
    const currentAccent = (themeState.autoAdapt
        ? '#9F3E3E'
        : (themeState.customAccent || '#9F3E3E')
    ).toUpperCase();

    const handleExportBackup = () => {
        if (!apexData) return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(apexData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        const dateStr = new Date().toISOString().substring(0, 10);
        downloadAnchor.setAttribute("download", `apex_garage_backup_${dateStr}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    };

    const handleImportFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                if (parsed && Array.isArray(parsed.fleet)) {
                    if (window.confirm(`Restore garage backup containing ${parsed.fleet.length} vehicles? This will update your hard-disk collection.`)) {
                        onImportData(parsed);
                    }
                } else {
                    alert('Invalid APEX backup file. File must contain a fleet array.');
                }
            } catch (err) {
                alert('Error parsing JSON backup file.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    return (
        <div
            className={`theme-drawer-overlay ${isOpen ? 'active' : ''}`}
            id="themeDrawerOverlay"
            onClick={(e) => {
                if (e.target.id === 'themeDrawerOverlay') onClose();
            }}
        >
            <aside className="theme-drawer" id="themeDrawer">
                <div className="theme-drawer-header">
                    <div>
                        <span className="theme-drawer-tag">STUDIO ENGINE</span>
                        <h3 className="theme-drawer-title">Garage & Cockpit Studio</h3>
                    </div>
                    <button className="theme-drawer-close" id="themeDrawerClose" onClick={onClose} title="Close Studio" type="button">
                        ✕
                    </button>
                </div>

                <div className="theme-drawer-body">
                    {/* Section 1: Surface Material & Geometry */}
                    <div className="drawer-section">
                        <span className="drawer-section-label">SURFACE MATERIAL & GEOMETRY</span>

                        <div className="studio-slider-group">
                            <div className="slider-label-row">
                                <span>Card Surface Opacity</span>
                                <span className="slider-val">{themeState.cardOpacity}%</span>
                            </div>
                            <input
                                type="range"
                                min="15"
                                max="100"
                                value={themeState.cardOpacity}
                                onChange={(e) => updateTheme({ cardOpacity: Number(e.target.value) })}
                                className="studio-range"
                            />
                            <span className="slider-hint">Controls dark obsidian panel transparency over the gradient</span>
                        </div>

                        <div className="studio-slider-group">
                            <div className="slider-label-row">
                                <span>Corner Radius</span>
                                <span className="slider-val">{themeState.cornerRadius}px</span>
                            </div>
                            <input
                                type="range"
                                min="6"
                                max="36"
                                value={themeState.cornerRadius}
                                onChange={(e) => updateTheme({ cornerRadius: Number(e.target.value) })}
                                className="studio-range"
                            />
                            <span className="slider-hint">Apple-grade plush curvature for cards, binnacle, and modals</span>
                        </div>

                        <div className="studio-slider-group">
                            <div className="slider-label-row">
                                <span>Micro-Label Contrast</span>
                                <span className="slider-val">{themeState.eyebrowContrast}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={themeState.eyebrowContrast}
                                onChange={(e) => updateTheme({ eyebrowContrast: Number(e.target.value) })}
                                className="studio-range"
                            />
                            <span className="slider-hint">Harmonizes secondary champagne sand telemetry tags</span>
                        </div>
                    </div>

                    {/* Section 2: Adaptive Accent Color */}
                    <div className="drawer-section">
                        <div className="section-flex-header">
                            <span className="drawer-section-label">ACCENT & NEEDLE PALETTE</span>
                            <button
                                type="button"
                                className={`btn-auto-adapt ${themeState.autoAdapt ? 'active' : ''}`}
                                onClick={() => updateTheme({ autoAdapt: true, customAccent: null })}
                                title="Default Atelier Carmine Palette"
                            >
                                <span className="auto-dot" />
                                <span>ATELIER DEFAULT</span>
                            </button>
                        </div>

                        <div className="studio-accent-swatches">
                            {SWATCHES.map(sw => (
                                <button
                                    key={sw.color}
                                    type="button"
                                    className={`studio-color-btn ${!themeState.autoAdapt && currentAccent === sw.color.toUpperCase() ? 'active' : ''}`}
                                    title={sw.label}
                                    style={{ background: sw.color }}
                                    onClick={() => updateTheme({ autoAdapt: false, customAccent: sw.color })}
                                />
                            ))}
                        </div>

                        {/* Custom HEX Picker */}
                        <div className="custom-hex-card">
                            <label className="custom-hex-trigger" htmlFor="customAccentPicker" title="Click to choose custom accent & needle color">
                                <span className="custom-color-preview-ring" style={{ borderColor: currentAccent }}>
                                    <span className="custom-color-preview-circle" style={{ backgroundColor: currentAccent }} />
                                </span>
                                <input
                                    type="color"
                                    id="customAccentPicker"
                                    className="custom-color-input"
                                    value={currentAccent}
                                    onChange={(e) => updateTheme({ autoAdapt: false, customAccent: e.target.value })}
                                />
                            </label>
                            <div className="custom-hex-info">
                                <span className="custom-hex-caption">CUSTOM NEEDLE HEX</span>
                                <span className="custom-hex-value">{currentAccent}</span>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Fleet Persistence & Disk Backup */}
                    <div className="drawer-section">
                        <span className="drawer-section-label">FLEET TELEMETRY & DISK BACKUP</span>
                        <div className="drawer-backup-card">
                            <span className="drawer-backup-hint">
                                Auto-syncs directly to physical cars.json on disk. Export or restore offline backups anytime.
                            </span>
                            <div className="drawer-backup-row">
                                <button
                                    type="button"
                                    className="btn-backup"
                                    onClick={handleExportBackup}
                                    title="Download complete garage snapshot as JSON"
                                >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    <span>Export JSON</span>
                                </button>

                                <label className="btn-backup btn-backup-upload" title="Restore garage collection from JSON backup">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                    <span>Restore JSON</span>
                                    <input
                                        type="file"
                                        accept=".json"
                                        style={{ display: 'none' }}
                                        onChange={handleImportFile}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Drawer Footer Reset */}
                    <div className="drawer-actions">
                        <button type="button" className="btn-hud-secondary btn-full" onClick={resetTheme}>
                            Reset Studio to Defaults
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    );
}
