import React, { useState, useEffect, useRef } from 'react';
import CustomDropdown from './CustomDropdown';
import { uploadVehiclePhoto, isSupabaseConfigured } from '../lib/supabase.js';

export default function VehicleModal({
    isOpen,
    onClose,
    onSave,
    brands,
    makers,
    editCar = null
}) {
    const [model, setModel] = useState('');
    const [brand, setBrand] = useState('');
    const [maker, setMaker] = useState('');
    const [scale, setScale] = useState('1:18');
    const [year, setYear] = useState('');
    const [isFavorite, setIsFavorite] = useState(false);
    const [photoUrl, setPhotoUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef(null);

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!isSupabaseConfigured()) {
            setUploadError('Configure Supabase in .env to enable direct photo upload');
            return;
        }

        setIsUploading(true);
        setUploadError('');
        try {
            const cdnUrl = await uploadVehiclePhoto(file);
            setPhotoUrl(cdnUrl);
        } catch (err) {
            console.error('Upload failed:', err);
            setUploadError(err.message || 'Upload failed. Check Supabase storage settings.');
        } finally {
            setIsUploading(false);
        }
    };

    useEffect(() => {
        if (editCar) {
            setModel(editCar.model || '');
            setBrand(editCar.brand || (brands[0] || ''));
            setMaker(editCar.maker || (makers[0] || ''));
            setScale(editCar.scale || '1:18');
            setYear(editCar.year || '');
            setIsFavorite(!!editCar.isFavorite);
            setPhotoUrl(editCar.photoUrl || '');
        } else {
            setModel('');
            setBrand(brands[0] || 'Porsche');
            setMaker(makers[0] || 'AutoArt');
            setScale('1:18');
            setYear('');
            setIsFavorite(false);
            setPhotoUrl('');
        }
    }, [editCar, brands, makers, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            id: editCar ? editCar.id : `apex_car_${Date.now()}`,
            model: model.trim(),
            brand,
            maker,
            scale,
            year: Number(year) || null,
            isFavorite,
            photoUrl: photoUrl.trim() || 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=1200&auto=format&fit=crop',
            livery: editCar?.livery || '',
            condition: editCar?.condition || 'Mint in Box',
            purchasePrice: editCar?.purchasePrice || 0,
            estimatedValue: editCar?.estimatedValue || 0,
            acquiredDate: editCar?.acquiredDate || new Date().toISOString().substring(0, 10),
            chassisNo: editCar?.chassisNo || '',
            notes: editCar?.notes || '',
            createdAt: editCar?.createdAt || Date.now()
        });
        onClose();
    };

    const scaleOptions = [
        { value: '1:18', label: '1:18 (Heavyweight Display)' },
        { value: '1:24', label: '1:24 (Street Scale)' },
        { value: '1:32', label: '1:32 (Precision & Slot Display)' },
        { value: '1:40', label: '1:40 (Heritage & Solido Scale)' },
        { value: '1:43', label: '1:43 (Collector Showcase)' },
        { value: '1:64', label: '1:64 (Kaido / Mini GT / HW)' },
        { value: '1:12', label: '1:12 (Flagship Scale)' },
        { value: 'Other', label: 'Other Precision Scale' }
    ];

    return (
        <div className="modal-overlay" style={{ display: 'flex' }} onClick={(e) => { if (e.target.className === 'modal-overlay') onClose(); }}>
            <div className="modal-card modal-lg apple-modal-sheet">
                <button className="modal-close-btn" onClick={onClose} type="button" aria-label="Close modal">✕</button>
                <div className="modal-header">
                    <span className="modal-tag">{editCar ? 'MODIFY TELEMETRY' : 'ATELIER REGISTRY'}</span>
                    <h3 className="modal-title">{editCar ? 'Edit Vehicle Dossier' : 'Register New Vehicle'}</h3>
                </div>

                <form className="modal-form apple-modal-form" onSubmit={handleSubmit}>
                    {/* Section 1: Vehicle Identity & Hardware */}
                    <div className="apple-form-section" style={{ position: 'relative', zIndex: 30 }}>
                        <div className="apple-section-header">
                            <span className="apple-section-title">CHASSIS & HARDWARE SPECIFICATION</span>
                        </div>

                        <div className="form-grid-2">
                            <div className="form-group">
                                <label className="form-label">Model Name</label>
                                <input
                                    type="text"
                                    className="form-input apple-input"
                                    placeholder="e.g. 911 (992) GT3 RS Weissach"
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group" style={{ position: 'relative', zIndex: 35 }}>
                                <label className="form-label">Automobile Marque</label>
                                <CustomDropdown
                                    value={brand}
                                    onChange={setBrand}
                                    options={brands}
                                    placeholder="Select Marque..."
                                />
                            </div>
                        </div>

                        <div className="form-grid-3">
                            <div className="form-group" style={{ position: 'relative', zIndex: 34 }}>
                                <label className="form-label">Model Maker</label>
                                <CustomDropdown
                                    value={maker}
                                    onChange={setMaker}
                                    options={makers}
                                    placeholder="Select Maker..."
                                />
                            </div>

                            <div className="form-group" style={{ position: 'relative', zIndex: 33 }}>
                                <label className="form-label">Scale</label>
                                <CustomDropdown
                                    value={scale}
                                    onChange={setScale}
                                    options={scaleOptions}
                                    placeholder="Select Scale..."
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Model Year</label>
                                <input
                                    type="number"
                                    className="form-input apple-input"
                                    placeholder="e.g. 2023"
                                    min="1900"
                                    max="2035"
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Integrated Pin as Favorite Row */}
                        <div className="apple-toggle-row integrated-favorite-row">
                            <span className="apple-toggle-title">★ Pin as Favorite</span>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={isFavorite}
                                className={`apple-switch ${isFavorite ? 'active' : ''}`}
                                onClick={() => setIsFavorite(!isFavorite)}
                            >
                                <span className="apple-switch-thumb" />
                            </button>
                        </div>
                    </div>

                    {/* Section 2: High-Res Photograph */}
                    <div className="apple-form-section">
                        <div className="apple-section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span className="apple-section-title">PHOTOGRAPHY & MEDIA URL</span>
                            <button
                                type="button"
                                className="apple-upload-trigger-btn"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                title="Upload from camera roll or take photo"
                            >
                                {isUploading ? 'Uploading...' : ' Upload / Camera'}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleFileUpload}
                            />
                        </div>

                        <div className="form-group">
                            <input
                                type="url"
                                className="form-input apple-input"
                                placeholder="Paste image URL, or tap 'Upload / Camera' above..."
                                value={photoUrl}
                                onChange={(e) => setPhotoUrl(e.target.value)}
                            />

                            {uploadError && (
                                <p style={{ fontSize: '11px', color: 'var(--accent-bright)', marginTop: '2px' }}>
                                    {uploadError}
                                </p>
                            )}

                            <div className="photo-preview-box apple-photo-preview" style={{ marginTop: '10px' }}>
                                {photoUrl ? (
                                    <img
                                        src={photoUrl}
                                        alt="Vehicle Preview"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                ) : (
                                    <div className="photo-preview-placeholder">
                                        <span>Enter a valid image URL to preview vehicle showcase</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="modal-actions apple-modal-actions">
                        <button type="button" className="btn-modal-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-modal-save">
                            {editCar ? 'Save Changes' : 'Save to Garage'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
