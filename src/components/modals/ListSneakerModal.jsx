import React, { useState } from 'react';
import { createSneaker, uploadSneakerPhoto } from '../../lib/api';
import { useToast } from '../Toast';

const SIZES = ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11', 'UK 12'];
const CONDITIONS = ['DS', 'VNDS', 'Good', 'Fair'];

export default function ListSneakerModal({ userId, onClose, onCreated }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [form, setForm] = useState({
    brand: '', model: '', size: 'UK 9', condition: 'DS', starting_bid: '', description: '',
  });

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let image_url = null;
      if (imageFile) image_url = await uploadSneakerPhoto(userId, imageFile);
      await createSneaker({
        brand: form.brand,
        model: form.model,
        size: form.size,
        condition: form.condition,
        starting_bid: Number(form.starting_bid) || 0,
        current_bid: Number(form.starting_bid) || 0,
        description: form.description,
        seller_id: userId,
        image_url,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to list sneaker.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-surface inline-form-modal">
        <div className="modal-title-row">
          <h2>List Sneaker for Bidding</h2>
          <button className="modal-close-x" onClick={onClose}>✕</button>
        </div>
        <form className="lender-form" onSubmit={handleSubmit}>
          <div className="form-row-two">
            <div>
              <label>Brand *</label>
              <input type="text" name="brand" value={form.brand} onChange={handleChange} placeholder="e.g. Nike" required />
            </div>
            <div>
              <label>Model *</label>
              <input type="text" name="model" value={form.model} onChange={handleChange} placeholder="e.g. Air Jordan 1" required />
            </div>
          </div>
          <label>Upload Photo</label>
          <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
          <div className="form-row-two">
            <div>
              <label>Size</label>
              <select name="size" value={form.size} onChange={handleChange}>
                {SIZES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label>Condition</label>
              <select name="condition" value={form.condition} onChange={handleChange}>
                {CONDITIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <label>Starting Bid (₹) *</label>
          <input type="number" name="starting_bid" value={form.starting_bid} onChange={handleChange} placeholder="e.g. 5000" required />
          <label>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Colourway, box condition, wear details..." rows="3" />
          <div className="sneaker-condition-guide">
            <span className="condition-chip">DS</span> Deadstock &nbsp;·&nbsp;
            <span className="condition-chip">VNDS</span> Very Near DS &nbsp;·&nbsp;
            <span className="condition-chip">Good</span> Light wear &nbsp;·&nbsp;
            <span className="condition-chip">Fair</span> Visible wear
          </div>
          {error && <p className="auth-error">{error}</p>}
          <div className="modal-actions" style={{ marginTop: '8px' }}>
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="confirm-btn" disabled={loading}>{loading ? 'Listing...' : 'List for Bidding'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
