import React from 'react';
import StarRating from '../components/StarRating';
import { spotlightMove } from '../lib/spotlight';

const CATEGORIES = [
  { id: 'All', label: '🚀 All Items' },
  { id: 'Wardrobe', label: '🧥 Outfits' },
  { id: 'Notes', label: '📚 Exam Notes' },
  { id: 'Tools', label: '📐 Lab Tools' },
  { id: 'Utensils', label: '🍳 Utensils' },
  { id: 'Gaming', label: '🎮 Gaming' },
  { id: 'Speakers', label: '🔊 Audio' },
  { id: 'Vehicles', label: '🛵 Vehicles' },
];

const CATEGORY_EMOJI = {
  Wardrobe: '✨', Notes: '📚', Tools: '⚡', Utensils: '🍳', Gaming: '🎮', Speakers: '🔊', Vehicles: '🚲',
};

export default function RentalsView({ assets, selectedRentalCategory, setSelectedRentalCategory, reviewCounts, avgRatings, setSelectedAsset, navigate }) {
  const filteredRentals = assets.filter(item => selectedRentalCategory === 'All' || item.category === selectedRentalCategory);

  return (
    <div className="view-content animate-fade-in">
      <div className="view-header-row unified-marketplace-header">
        <div className="view-header">
          <h1>Campus Rental Marketplace</h1>
          <p>Peer-to-peer asset sharing network across all campus hostel blocks.</p>
        </div>
        <div className="category-pill-container scrollable-pills">
          {CATEGORIES.map(cat => (
            <button key={cat.id} className={`category-toggle-pill ${selectedRentalCategory === cat.id ? 'active' : ''}`} onClick={() => setSelectedRentalCategory(cat.id)}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {filteredRentals.length === 0 && (
        <div className="empty-state"><span>🛍️</span><p>No items listed in this category yet. Tap the + button to be the first!</p></div>
      )}

      <div className="rentals-dashboard-grid">
        {filteredRentals.map(item => {
          const avg = avgRatings[item.id] || 0;
          const revCount = reviewCounts[item.id] || 0;
          const isRented = item.status === 'rented';
          return (
            <div key={item.id} className={`rental-dashboard-card spotlight ${isRented ? 'card-rented' : ''}`}
              onMouseMove={spotlightMove}
              onClick={() => !isRented && (setSelectedAsset(item), navigate('item-detail'))}>
              <div className="item-thumbnail">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="item-thumbnail-img" />
                ) : (
                  <span className="thumbnail-emoji">{CATEGORY_EMOJI[item.category] || '📦'}</span>
                )}
                <span className="item-tag-pill type-badge">{item.category}</span>
                {isRented && (
                  <div className="rented-overlay">
                    <span className="rented-overlay-text">Currently Rented</span>
                  </div>
                )}
              </div>
              <div className="item-body">
                <h3>{item.title}</h3>
                <p className="item-spec-feature">{item.condition}</p>
                <p className="item-subtext">🏬 Hub: <strong>{item.location}</strong></p>
                {revCount > 0 && (
                  <div className="card-mini-rating">
                    <StarRating value={Math.round(avg)} readOnly />
                    <span className="mini-rating-text">{avg.toFixed(1)} ({revCount})</span>
                  </div>
                )}
                <div className="item-footer">
                  <div>
                    <span className="rate-display">₹{item.daily_price}<span>/day</span></span>
                    <p className="security-tag">🔒 ₹{item.security_deposit} deposit</p>
                  </div>
                  {isRented ? (
                    <span className="unavailable-pill">Unavailable</span>
                  ) : (
                    <button className="request-fit-btn" onClick={e => { e.stopPropagation(); setSelectedAsset(item); navigate('item-detail'); }}>
                      View Details
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
