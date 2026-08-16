import React, { useState } from 'react';
import { updateProfile, uploadAvatar } from '../../lib/api';
import { useToast } from '../Toast';

export default function ProfileModal({ profile, userId, onClose, onUpdated }) {
  const [form, setForm] = useState({
    name: profile?.name || '',
    bio: profile?.bio || '',
    hostel_block: profile?.hostel_block || '',
    contact_number: profile?.contact_number || '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleAvatarPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      let avatar_url = profile?.avatar_url || null;
      if (avatarFile) {
        avatar_url = await uploadAvatar(userId, avatarFile);
      }
      await updateProfile(userId, { ...form, avatar_url });
      onUpdated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-surface inline-form-modal">
        <div className="modal-title-row">
          <h2>Edit Profile</h2>
          <button className="modal-close-x" onClick={onClose}>✕</button>
        </div>
        <form className="lender-form" onSubmit={handleSave}>
          <div className="profile-avatar-row">
            <div className="profile-avatar-preview">
              {avatarPreview ? <img src={avatarPreview} alt="Avatar preview" /> : <span>🎓</span>}
            </div>
            <div>
              <label className="profile-avatar-upload-label" htmlFor="avatar-upload">Change Photo</label>
              <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarPick} style={{ display: 'none' }} />
              <p className="profile-avatar-hint">JPG or PNG, square photos look best.</p>
            </div>
          </div>

          <label>Display Name *</label>
          <input type="text" value={form.name} onChange={handleChange('name')} placeholder="e.g. Aanya Sharma" required />

          <label>Bio</label>
          <textarea rows="3" value={form.bio} onChange={handleChange('bio')} placeholder="Tell campus a bit about yourself..." />

          <div className="form-row-two">
            <div>
              <label>Hostel / Room Block</label>
              <input type="text" value={form.hostel_block} onChange={handleChange('hostel_block')} placeholder="e.g. Block B, Room 214" />
            </div>
            <div>
              <label>WhatsApp / Contact Number</label>
              <input type="tel" value={form.contact_number} onChange={handleChange('contact_number')} placeholder="+91 XXXXXXXXXX" />
            </div>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <div className="modal-actions" style={{ marginTop: '8px' }}>
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="confirm-btn" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
