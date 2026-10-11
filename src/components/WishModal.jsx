import React, { useState } from 'react';
import CustomDropdown from './CustomDropdown';

export default function WishModal({
    isOpen,
    onClose,
    onSave,
    brands,
    makers
}) {
    const [model, setModel] = useState('');
    const [brand, setBrand] = useState(brands[0] || 'BMW');
    const [maker, setMaker] = useState(makers[0] || 'AutoArt');
    const [scale, setScale] = useState('1:18');
    const [targetPrice, setTargetPrice] = useState('');
    const [priority, setPriority] = useState('NORMAL');
    const [notes, setNotes] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            id: `wish_${Date.now()}`,
            model: model.trim(),
            brand,
            maker,
            scale,
            targetPrice: Number(targetPrice) || 0,
            priority,
            notes: notes.trim()
        });
        setModel('');
        setTargetPrice('');
        setNotes('');
        onClose();
    };

    const scaleOptions = [
        { value: '1:18', label: '1:18' },
        { value: '1:43', label: '1:43' },
        { value: '1:64', label: '1:64' },
        { value: '1:24', label: '1:24' }
    ];

    const priorityOptions = [
        { value: 'GRAIL', label: 'GRAIL (Immediate Buy)' },
        { value: 'HIGH', label: 'HIGH (Looking for deal)' },
        { value: 'NORMAL', label: 'NORMAL (Casual hunt)' }
    ];

    return (
        <div className="modal-overlay" style={{ display: 'flex' }} onClick={(e) => { if (e.target.className === 'modal-overlay') onClose(); }}>
            <div className="modal-card modal-md">
                <button className="modal-close-btn" onClick={onClose} type="button">✕</button>
                <div className="modal-header">
                    <span className="modal-tag">PEG HUNT RADAR</span>
                    <h3 className="modal-title">Track Target Model</h3>
                </div>

                <form className="modal-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Target Model Name *</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. BMW M3 (E30) Sport Evolution"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-grid-2">
                        <div className="form-group" style={{ position: 'relative', zIndex: 25 }}>
                            <label className="form-label">Brand</label>
                            <CustomDropdown
                                value={brand}
                                onChange={setBrand}
                                options={brands}
                            />
                        </div>

                        <div className="form-group" style={{ position: 'relative', zIndex: 25 }}>
                            <label className="form-label">Maker</label>
                            <CustomDropdown
                                value={maker}
                                onChange={setMaker}
                                options={makers}
                            />
                        </div>
                    </div>

                    <div className="form-grid-2">
                        <div className="form-group" style={{ position: 'relative', zIndex: 20 }}>
                            <label className="form-label">Scale</label>
                            <CustomDropdown
                                value={scale}
                                onChange={setScale}
                                options={scaleOptions}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Target Budget ($)</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="0"
                                value={targetPrice}
                                onChange={(e) => setTargetPrice(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ position: 'relative', zIndex: 15 }}>
                        <label className="form-label">Priority Tier</label>
                        <CustomDropdown
                            value={priority}
                            onChange={setPriority}
                            options={priorityOptions}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Hunting Notes</label>
                        <textarea
                            className="form-textarea"
                            placeholder="Color preferences, seller links, target condition..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-hud-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-hud-primary">Set on Radar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
