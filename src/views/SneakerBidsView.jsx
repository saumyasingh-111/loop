import React, { useState } from 'react';
import { placeBid } from '../lib/api';
import { useToast } from '../components/Toast';
import { spotlightMove } from '../lib/spotlight';

export default function SneakerBidsView({ sneakers, bidAmounts, setBidAmounts, profilesById, onBidPlaced, currentUserId }) {
  const toast = useToast();
  const [placingId, setPlacingId] = useState(null);
  const [expandedHistory, setExpandedHistory] = useState({});

  const handleBid = async (sneaker) => {
    const amount = Number(bidAmounts[sneaker.id]);
    if (!amount || amount <= sneaker.current_bid) {
      toast.warning(`Bid must be higher than current bid of ₹${sneaker.current_bid}`);
      return;
    }
    setPlacingId(sneaker.id);
    try {
      await placeBid(sneaker.id, amount);
      setBidAmounts(prev => ({ ...prev, [sneaker.id]: '' }));
      onBidPlaced();
      toast.success(`You're leading at ₹${amount.toLocaleString()} 🔥`);
    } catch (err) {
      toast.error(err.message || 'Failed to place bid.');
    } finally {
      setPlacingId(null);
    }
  };

  return (
    <div className="view-content animate-fade-in">
      <div className="view-header" style={{ marginBottom: '28px' }}>
        <h1>Sneaker Bidding</h1>
        <p>Bid on rare and limited sneakers listed by campus students.</p>
      </div>

      {sneakers.length === 0 && (
        <div className="empty-state"><span>👟</span><p>No sneakers listed yet. Tap the + button to list one!</p></div>
      )}

      <div className="sneaker-grid">
        {sneakers.map(sn => {
          const topBidderProfile = sn.top_bidder ? profilesById[sn.top_bidder] : null;
          const isOwn = sn.seller_id === currentUserId;
          return (
            <div key={sn.id} className="sneaker-card spotlight" onMouseMove={spotlightMove}>
              <div className="sneaker-thumb">
                {sn.image_url ? <img src={sn.image_url} alt={sn.model} className="sneaker-thumb-img" /> : <span style={{ fontSize: '64px' }}>👟</span>}
                <span className="sneaker-condition-badge">{sn.condition}</span>
              </div>
              <div className="sneaker-body">
                <p className="sneaker-brand">{sn.brand}</p>
                <h3 className="sneaker-model">{sn.model}</h3>
                <p className="sneaker-meta">Size: {sn.size}</p>
                <p className="sneaker-desc">{sn.description}</p>
                <div className="sneaker-bid-row">
                  <div>
                    <p className="bid-label">Current Bid</p>
                    <p className="bid-amount">₹{Number(sn.current_bid).toLocaleString()}</p>
                    {topBidderProfile && <p className="bid-leader">🏆 {topBidderProfile.name}</p>}
                  </div>
                  {!isOwn && (
                    <div className="bid-input-group">
                      <input
                        type="number"
                        className="bid-input-field"
                        placeholder={`> ₹${sn.current_bid}`}
                        value={bidAmounts[sn.id] || ''}
                        onChange={e => setBidAmounts(prev => ({ ...prev, [sn.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleBid(sn)}
                      />
                      <button className="confirm-btn" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => handleBid(sn)} disabled={placingId === sn.id}>
                        {placingId === sn.id ? '...' : 'Place Bid'}
                      </button>
                    </div>
                  )}
                  {isOwn && <span className="unavailable-pill">Your Listing</span>}
                </div>
                <button className="inline-link" style={{ marginTop: '8px' }} onClick={() => setExpandedHistory(prev => ({ ...prev, [sn.id]: !prev[sn.id] }))}>
                  {expandedHistory[sn.id] ? 'Hide bid history' : 'View bid history'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
