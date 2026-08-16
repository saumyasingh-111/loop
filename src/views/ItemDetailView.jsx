import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import StarRating from '../components/StarRating';
import { getProfile, listReviews, createReview } from '../lib/api';
import { useToast } from '../components/Toast';

export default function ItemDetailView({ selectedAsset, currentUserId, navigate, onOpenBooking }) {
  const toast = useToast();
  const [lender, setLender] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewForm, setReviewForm] = useState({ stars: 0, text: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoadingReviews(true);
    Promise.all([
      selectedAsset.renter_id ? getProfile(selectedAsset.renter_id).catch(() => null) : Promise.resolve(null),
      listReviews(selectedAsset.id).catch(() => []),
    ]).then(([lenderData, reviewData]) => {
      if (!mounted) return;
      setLender(lenderData);
      setReviews(reviewData);
      setLoadingReviews(false);
    });
    return () => { mounted = false; };
  }, [selectedAsset.id, selectedAsset.renter_id]);

  const avg = reviews.length ? (reviews.reduce((a, b) => a + b.stars, 0) / reviews.length) : 0;

  const submitReview = async () => {
    if (!reviewForm.stars || !reviewForm.text.trim()) return;
    setSubmitting(true);
    try {
      const newReview = await createReview({
        asset_id: selectedAsset.id,
        reviewer_id: currentUserId,
        stars: reviewForm.stars,
        text: reviewForm.text.trim(),
      });
      setReviews(prev => [newReview, ...prev]);
      setReviewForm({ stars: 0, text: '' });
      toast.success('Review posted — thanks for the feedback!');
    } catch (err) {
      toast.error(err.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div className="view-content animate-fade-in" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <button className="back-btn" onClick={() => navigate('rentals')}>← Back to Marketplace</button>
      <div className="detail-page-grid">
        <div className="detail-visual-col">
          <div className="detail-emoji-box">
            {selectedAsset.image_url ? (
              <img src={selectedAsset.image_url} alt={selectedAsset.title} className="detail-image" />
            ) : (
              <span>📦</span>
            )}
            <span className="detail-category-badge">{selectedAsset.category}</span>
          </div>
        </div>
        <div className="detail-info-col">
          <h1 className="detail-title">{selectedAsset.title}</h1>
          <p className="detail-subtext-pill">{selectedAsset.condition}</p>
          <div className="detail-rating-row">
            <StarRating value={Math.round(avg)} readOnly />
            <span className="detail-rating-text">{avg > 0 ? `${avg.toFixed(1)} out of 5` : 'No reviews yet'} {reviews.length > 0 && `· ${reviews.length} review${reviews.length > 1 ? 's' : ''}`}</span>
          </div>
          <p className="detail-description">{selectedAsset.description}</p>
          <div className="detail-pricing-card">
            <div className="pricing-row">
              <span className="pricing-label">Daily Rental</span>
              <span className="pricing-value">₹{selectedAsset.daily_price}<span className="pricing-unit">/day</span></span>
            </div>
            <div className="pricing-row security">
              <span className="pricing-label">🔒 Refundable Security Deposit</span>
              <span className="pricing-value security-amount">₹{selectedAsset.security_deposit}</span>
            </div>
            <p className="security-note">The deposit is fully refundable upon return in original condition.</p>
          </div>
          {selectedAsset.renter_id === currentUserId ? (
            <p className="security-note">This is your own listing — manage it from the Lender Portal.</p>
          ) : selectedAsset.status === 'rented' ? (
            <span className="unavailable-pill">Currently Unavailable</span>
          ) : (
            <button className="confirm-btn detail-rent-btn" onClick={onOpenBooking}>Request Rent</button>
          )}
        </div>
      </div>

      {lender && (
        <div className="lender-profile-section">
          <h2 className="section-title">About the Lender</h2>
          <div className="lender-card">
            {lender.avatar_url ? (
              <img className="lender-avatar-big-img" src={lender.avatar_url} alt={lender.name} />
            ) : (
              <div className="lender-avatar-big">🎓</div>
            )}
            <div className="lender-info">
              <h3 className="lender-name">{lender.name}</h3>
              <p className="lender-meta">📍 {lender.hostel_block || 'Campus'}</p>
              <p className="lender-meta">📞 {lender.contact_number || selectedAsset.contact_number || '—'}</p>
              <p className="lender-meta">🗓️ Member since {new Date(lender.member_since || lender.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</p>
            </div>
            <div className="lender-stats">
              <div className="stat-box"><span className="stat-value">✨ {lender.aura_points}</span><span className="stat-label">Aura Points</span></div>
            </div>
          </div>
        </div>
      )}

      <div className="reviews-section">
        <h2 className="section-title">Reviews <span className="review-count-badge">{reviews.length}</span></h2>
        {!loadingReviews && reviews.length === 0 && <p className="no-reviews-msg">No reviews yet. Be the first to review after renting!</p>}
        <div className="reviews-list">
          {reviews.map(rev => (
            <div key={rev.id} className="review-card">
              <div className="review-header">
                <span className="review-date">{new Date(rev.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <StarRating value={rev.stars} readOnly />
              <p className="review-text">{rev.text}</p>
            </div>
          ))}
        </div>
        <div className="write-review-box">
          <h3>Write a Review</h3>
          <p className="write-review-sub">Share your experience with this item</p>
          <div className="review-stars-row">
            <span>Your Rating:</span>
            <StarRating value={reviewForm.stars} onChange={s => setReviewForm(f => ({ ...f, stars: s }))} />
          </div>
          <textarea className="review-textarea" placeholder="Describe your experience..." rows={3} value={reviewForm.text} onChange={e => setReviewForm(f => ({ ...f, text: e.target.value }))} />
          <button className="confirm-btn" style={{ marginTop: '12px', width: 'auto', padding: '10px 24px' }}
            onClick={submitReview} disabled={!reviewForm.stars || !reviewForm.text.trim() || submitting}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
