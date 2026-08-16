import React, { useState } from 'react';
import { createAsset, uploadItemImage } from '../../lib/api';
import { useToast } from '../Toast';

const CATEGORIES = ['Wardrobe', 'Notes', 'Tools', 'Utensils', 'Gaming', 'Speakers', 'Vehicles'];
const CONDITIONS = ['Brand New', 'Good', 'Fairly Used'];

export default function ListAssetModal({ userId, onClose, onCreated }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', category: 'Wardrobe', condition: 'Good',
    location: '', contact_number: '', security_deposit: '', daily_price: '',
  });

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let image_url = null;
      if (imageFile) image_url = await uploadItemImage(userId, imageFile);
      await createAsset({
        title: form.title,
        description: form.description,
        category: form.category,
        condition: form.condition,
        location: form.location,
        contact_number: form.contact_number,
        security_deposit: Number(form.security_deposit) || 0,
        daily_price: Number(form.daily_price) || 0,
        renter_id: userId,
        image_url,
      });
      onCreated();
      onClose();
      toast.success('Listed on the marketplace!');
    } catch (err) {
      setError(err.message || 'Failed to list item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-surface inline-form-modal">
        <div className="modal-title-row">
          <h2>List Your Asset</h2>
          <button className="modal-close-x" onClick={onClose}>✕</button>
        </div>
        <form className="lender-form" onSubmit={handleSubmit}>
          <label>Asset Title *</label>
          <input type="text" name="title" value={form.title} onChange={handleChange} placeholder="e.g. DSLR Camera" required />
          <label>Description *</label>
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Features, condition notes..." rows="3" required />
          <label>Upload Image</label>
          <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
          <div className="form-row-two">
            <div>
              <label>Category</label>
              <select name="category" value={form.category} onChange={handleChange}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label>Condition</label>
              <select name="condition" value={form.condition} onChange={handleChange}>
                {CONDITIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <label>Location (Hostel/Block) *</label>
          <input type="text" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Block C, Room 204" required />
          <label>Contact Number *</label>
          <input type="tel" name="contact_number" value={form.contact_number} onChange={handleChange} placeholder="+91 XXXXXXXXXX" required />
          <div className="form-row-two">
            <div>
              <label>Daily Price (₹)</label>
              <input type="number" name="daily_price" value={form.daily_price} onChange={handleChange} placeholder="100" />
            </div>
            <div>
              <label>Security Deposit (₹)</label>
              <input type="number" name="security_deposit" value={form.security_deposit} onChange={handleChange} placeholder="500" />
            </div>
          </div>
          {error && <p className="auth-error">{error}</p>}
          <div className="modal-actions" style={{ marginTop: '8px' }}>
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="confirm-btn" disabled={loading}>{loading ? 'Listing...' : 'Add to Marketplace'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
