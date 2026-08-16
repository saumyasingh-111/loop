import React from 'react';

export default function MyRequestsView({ bookings, assetsById, navigate }) {
  return (
    <div className="view-content">
      <div className="view-header" style={{ marginBottom: '28px' }}>
        <h1>My Requests</h1>
        <p>Track all your rental requests and their current status.</p>
      </div>
      {bookings.length === 0 && (
        <div className="empty-state">
          <span>📦</span>
          <p>No active requests yet. Browse the <button className="inline-link" onClick={() => navigate('rentals')}>Rental Marketplace</button> to get started.</p>
        </div>
      )}
      {bookings.map(req => {
        const asset = assetsById[req.item_id];
        const days = Math.max(1, Math.round((new Date(req.end_date) - new Date(req.start_date)) / 86400000) + 1);
        return (
          <div key={req.id} className="request-card">
            <div className="request-card-left">
              <span className="request-emoji">{asset?.image_url ? '🖼️' : '📦'}</span>
              <div>
                <p className="request-title">{asset?.title || 'Item unavailable'}</p>
                <p className="request-meta">{asset?.location} · {days} day(s) · ₹{req.total_price}</p>
                <p className="request-meta">📅 {req.start_date} → {req.end_date}</p>
              </div>
            </div>
            <span className={`status-pill status-${req.status}`}>
              {req.status === 'accepted' ? '✅ Accepted' : req.status === 'declined' ? '❌ Declined' : '⏳ Pending'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
