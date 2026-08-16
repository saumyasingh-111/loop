import React, { useState } from 'react';
import { createPoll } from '../../lib/api';
import { useToast } from '../Toast';

const emptyOption = () => ({ name: '', vibe: '', image_url: '', linked_item_id: '' });

export default function CreatePollModal({ userId, assets, onClose, onCreated }) {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState([emptyOption(), emptyOption()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateOption = (idx, field, value) => {
    setOptions(prev => prev.map((o, i) => {
      if (i !== idx) return o;
      const next = { ...o, [field]: value };
      // Auto-fill name/image/vibe when a marketplace item is linked
      if (field === 'linked_item_id' && value) {
        const asset = assets.find(a => String(a.id) === String(value));
        if (asset) {
          next.name = next.name || asset.title;
          next.image_url = next.image_url || asset.image_url || '';
          next.vibe = next.vibe || asset.category;
        }
      }
      return next;
    }));
  };

  const addOption = () => setOptions(prev => [...prev, emptyOption()]);
  const removeOption = (idx) => setOptions(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async e => {
    e.preventDefault();
    const validOptions = options.filter(o => o.name.trim());
    if (!title.trim() || validOptions.length < 2) {
      setError('Add a title and at least 2 outfit options.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createPoll({
        title: title.trim(),
        created_by: userId,
        linked_item_id: validOptions[0].linked_item_id || null,
        options: validOptions.map(o => ({
          name: o.name.trim(),
          vibe: o.vibe,
          image_url: o.image_url || null,
          linked_item_id: o.linked_item_id || null,
        })),
      });
      onCreated();
      onClose();
      toast.success('FitCheck poll is live!');
    } catch (err) {
      setError(err.message || 'Failed to create poll.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-surface inline-form-modal">
        <div className="modal-title-row">
          <h2>Create a FitCheck Poll</h2>
          <button className="modal-close-x" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Poll Question</label>
          <input
            type="text" className="search-input" style={{ width: '100%', marginBottom: '16px' }}
            placeholder="e.g. Which fit for the Freshers Night?"
            value={title} onChange={e => setTitle(e.target.value)} required
          />

          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            Outfit Options (link a rental item so voters can rent the winning fit)
          </p>
          {options.map((opt, idx) => (
            <div key={idx} className="poll-option-form-row" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: '10px' }}>
              <div className="form-row-two">
                <div>
                  <label>Option Name</label>
                  <input type="text" value={opt.name} onChange={e => updateOption(idx, 'name', e.target.value)} placeholder="e.g. Kurti" />
                </div>
                <div>
                  <label>Link to Marketplace Item</label>
                  <select value={opt.linked_item_id} onChange={e => updateOption(idx, 'linked_item_id', e.target.value)}>
                    <option value="">— none —</option>
                    {assets.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row-two" style={{ marginTop: '8px' }}>
                <div>
                  <label>Vibe</label>
                  <input type="text" value={opt.vibe} onChange={e => updateOption(idx, 'vibe', e.target.value)} placeholder="e.g. Elegant & Traditional" />
                </div>
                <div>
                  <label>Image URL (optional)</label>
                  <input type="text" value={opt.image_url} onChange={e => updateOption(idx, 'image_url', e.target.value)} placeholder="https://..." />
                </div>
              </div>
              {options.length > 2 && (
                <button type="button" className="cancel-btn" style={{ marginTop: '8px', padding: '4px 12px', fontSize: '12px' }} onClick={() => removeOption(idx)}>Remove option</button>
              )}
            </div>
          ))}
          <button type="button" className="toggle-btn" onClick={addOption} style={{ marginBottom: '16px' }}>+ Add another option</button>

          {error && <p className="auth-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="confirm-btn" disabled={loading}>{loading ? 'Creating...' : 'Create Poll'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
