import React, { useState, useEffect } from 'react';
import { createBooking } from '../../lib/api';
import { useToast } from '../Toast';

export default function BookingModal({ asset, userId, onClose, onBooked }) {
  const toast = useToast();
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [days, setDays] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = Math.max(1, Math.round((e - s) / 86400000) + 1);
    setDays(diff);
  }, [startDate, endDate]);

  const totalPrice = asset.daily_price * days;

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      await createBooking({
        item_id: asset.id,
        renter_id: userId,
        start_date: startDate,
        end_date: endDate,
        status: 'pending',
        total_price: totalPrice,
        security_deposit: asset.security_deposit,
      });
      onBooked();
      onClose();
      toast.success('Request sent to the lender!');
    } catch (err) {
      setError(err.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-surface" style={{ width: '460px' }}>
        <h2>Request Rental</h2>
        <p className="modal-desc">Requesting <strong>{asset.title}</strong></p>

        <div className="calendar-section">
          <p className="calendar-label">Select Rental Period</p>
          <div className="calendar-row">
            <div className="calendar-field">
              <label>Start Date</label>
              <input type="date" className="date-input" value={startDate} min={today}
                onChange={e => { setStartDate(e.target.value); if (e.target.value > endDate) setEndDate(e.target.value); }} />
            </div>
            <div className="calendar-field">
              <label>End Date</label>
              <input type="date" className="date-input" value={endDate} min={startDate}
                onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="invoice-breakdown">
          <div className="invoice-line"><span>Daily Rental Fee:</span> <span>₹{asset.daily_price}</span></div>
          <div className="invoice-line"><span>Duration:</span> <span>{days} Day(s)</span></div>
          <div className="invoice-line"><span>Rental Total:</span> <span>₹{totalPrice}</span></div>
          <div className="invoice-line security-line"><span>🔒 Security Deposit (Refundable):</span> <span>₹{asset.security_deposit}</span></div>
          <hr />
          <div className="invoice-line total"><span>Amount Payable Now:</span> <span>₹{totalPrice + asset.security_deposit}</span></div>
        </div>

        {error && <p className="auth-error">{error}</p>}

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="confirm-btn" onClick={handleConfirm} disabled={loading}>{loading ? 'Submitting...' : 'Confirm Request'}</button>
        </div>
      </div>
    </div>
  );
}
