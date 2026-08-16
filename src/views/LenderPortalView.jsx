import React from 'react';

export default function LenderPortalView({ myAssets, toggleAssetStatus, incomingBookings, renterProfilesById, onAccept, onDecline }) {
  return (
    <div className="view-content">
      <div className="view-header" style={{ marginBottom: '28px' }}>
        <h1>Lender Portal</h1>
        <p>Manage your listings and review incoming rental requests.</p>
      </div>

      <h2 className="section-title">My Listings</h2>
      {myAssets.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>You haven't listed anything yet.</p>}
      {myAssets.map(item => (
        <div key={item.id} className="list-item">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {item.image_url ? (
              <img src={item.image_url} alt={item.title} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '24px' }}>📦</span>
            )}
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>{item.title}</p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{item.location} · ₹{item.daily_price}/day</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className={`status-pill ${item.status === 'rented' ? 'status-rented' : 'status-available'}`}>
              {item.status === 'rented' ? '🔴 Rented Out' : '🟢 Available'}
            </span>
            <button onClick={() => toggleAssetStatus(item)} className="toggle-btn">
              {item.status === 'available' ? 'Mark Rented' : 'Mark Available'}
            </button>
          </div>
        </div>
      ))}

      <h2 className="section-title" style={{ marginTop: '36px' }}>Incoming Requests</h2>
      {incomingBookings.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No rental requests yet.</p>}
      {incomingBookings.map(req => {
        const renter = renterProfilesById[req.renter_id];
        const days = Math.max(1, Math.round((new Date(req.end_date) - new Date(req.start_date)) / 86400000) + 1);
        return (
          <div key={req.id} className="list-item">
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>{req.assetTitle}</p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Requested by: {renter?.name || 'Unknown'} · {days} day(s)</p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>📅 {req.start_date} → {req.end_date}</p>
            </div>
            {req.status === 'pending' ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="confirm-btn" style={{ padding: '6px 16px', fontSize: '13px' }} onClick={() => onAccept(req)}>Accept</button>
                <button className="cancel-btn" style={{ padding: '6px 16px', fontSize: '13px', border: '1px solid #e2e8f0' }} onClick={() => onDecline(req)}>Decline</button>
              </div>
            ) : (
              <span className={`status-pill status-${req.status}`}>
                {req.status === 'accepted' ? '✅ Accepted' : '❌ Declined'}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
