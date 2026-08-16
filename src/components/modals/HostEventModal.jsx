import React, { useState } from 'react';
import { createEvent } from '../../lib/api';
import { useToast } from '../Toast';

export default function HostEventModal({ userId, onClose, onCreated }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', event_date: '', location: '', vibe: '', category: 'Social', slots: '',
  });

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createEvent({
        title: form.title,
        description: form.description,
        event_date: form.event_date || null,
        location: form.location,
        vibe: form.vibe || 'Smart Casual',
        category: form.category,
        slots: Number(form.slots) || 0,
        host_id: userId,
      });
      onCreated();
      onClose();
      toast.success('Event published to campus!');
    } catch (err) {
      setError(err.message || 'Failed to create event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-surface inline-form-modal">
        <div className="modal-title-row">
          <h2>Host an Event</h2>
          <button className="modal-close-x" onClick={onClose}>✕</button>
        </div>
        <form className="lender-form" onSubmit={handleSubmit}>
          <label>Event Name *</label>
          <input type="text" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Campus Hackathon 2026" required />
          <label>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="What's the event about?" rows="3" />
          <div className="form-row-two">
            <div>
              <label>Date & Time</label>
              <input type="datetime-local" name="event_date" value={form.event_date} onChange={handleChange} />
            </div>
            <div>
              <label>Category</label>
              <select name="category" value={form.category} onChange={handleChange}>
                <option>Social</option><option>Academic</option><option>Gaming</option><option>Sports</option>
              </select>
            </div>
          </div>
          <label>Location *</label>
          <input type="text" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Main Auditorium" required />
          <label>Vibe / Dress Code</label>
          <input type="text" name="vibe" value={form.vibe} onChange={handleChange} placeholder="e.g. Chic Indo-Western" />
          <label>Capacity</label>
          <input type="number" name="slots" value={form.slots} onChange={handleChange} placeholder="Max attendees" />
          {error && <p className="auth-error">{error}</p>}
          <div className="modal-actions" style={{ marginTop: '8px' }}>
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="confirm-btn" disabled={loading}>{loading ? 'Publishing...' : 'Publish Event'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
