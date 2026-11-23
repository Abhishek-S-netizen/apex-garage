import React, { useState, useEffect } from 'react';
import CustomDropdown from './CustomDropdown';

export default function VehicleModal({
    isOpen,
    onClose,
    onSave,
    onDelete,
    brands,
    makers,
    editCar = null
}) {
    const [model, setModel] = useState('');
    const [brand, setBrand] = useState('');
    const [maker, setMaker] = useState('');
    const [scale, setScale] = useState('1:18');
    const [year, setYear] = useState('');

    useEffect(() => {
        if (editCar) {
            setModel(editCar.model || '');
            setBrand(editCar.brand || (brands[0] || ''));
            setMaker(editCar.maker || (makers[0] || ''));
            setScale(editCar.scale || '1:18');
            setYear(editCar.year || '');
        } else {
            setModel('');
            setBrand(brands[0] || 'Porsche');
            setMaker(makers[0] || 'AutoArt');
            setScale('1:18');
            setYear('');
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
            year: Number(year) || null
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
                    <h3 className="modal-title">{editCar ? 'Edit Vehicle' : 'Register New Vehicle'}</h3>
                </div>

                <form className="modal-form apple-modal-form" onSubmit={handleSubmit}>
                    <div className="form-grid-2" style={{ position: 'relative', zIndex: 35 }}>
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

                    <div className="modal-actions apple-modal-actions">
                        {editCar && onDelete && (
                            <button
                                type="button"
                                className="btn-modal-delete"
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to remove this vehicle from your garage?')) {
                                        onDelete(editCar.id);
                                        onClose();
                                    }
                                }}
                            >
                                Delete
                            </button>
                        )}
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
