import React from 'react';
import { motion } from 'framer-motion';
import { spotlightMove } from '../lib/spotlight';

export default function EventsView({
  events, searchQuery, setSearchQuery, selectedVibeFilter, setSelectedVibeFilter,
  registrationCounts, myRegisteredEventIds, handleRegisterEvent, setSelectedRentalCategory, navigate,
}) {
  const filteredEvents = events.filter(ev => {
    const q = searchQuery.toLowerCase();
    return (ev.title.toLowerCase().includes(q) || (ev.vibe || '').toLowerCase().includes(q)) &&
      (selectedVibeFilter === 'All' || ev.category === selectedVibeFilter);
  });

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
      <div className="view-header-row">
        <div className="view-header">
          <h1>Upcoming Campus Events</h1>
          <p>Find what's happening on campus and plan your rentals.</p>
        </div>
        <div className="filter-controls-bar">
          <input type="text" placeholder="🔎 Search event or vibe..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="search-input" />
          <select value={selectedVibeFilter} onChange={e => setSelectedVibeFilter(e.target.value)} className="filter-dropdown">
            <option value="All">All Categories</option>
            <option value="Social">Social</option>
            <option value="Academic">Academic</option>
            <option value="Gaming">Gaming</option>
            <option value="Sports">Sports</option>
          </select>
        </div>
      </div>

      {filteredEvents.length === 0 && (
        <div className="empty-state"><span>📅</span><p>No events yet. Tap the + button to host the first one!</p></div>
      )}

      <div className="events-grid">
        {filteredEvents.map(event => {
          const taken = registrationCounts[event.id] || 0;
          const seatsLeft = Math.max(0, event.slots - taken);
          const alreadyRegistered = myRegisteredEventIds.includes(event.id);
          return (
            <div key={event.id} className="event-dashboard-card spotlight" onMouseMove={spotlightMove}>
              <div className="card-top">
                <span className="vibe-pill">{event.vibe}</span>
                <span className="category-tag">{event.category}</span>
              </div>
              <h3>{event.title}</h3>
              <div className="card-info">
                <p><span>📍 Location:</span> {event.location}</p>
                <p><span>⏰ Schedule:</span> {event.event_date ? new Date(event.event_date).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : 'TBA'}</p>
              </div>
              <div className="event-action-footer">
                <div className="slot-indicator">
                  <span className="slot-dot"></span>
                  {seatsLeft > 0 ? `${seatsLeft} seats left` : 'House Full!'}
                </div>
                <div className="footer-button-group">
                  <button className="view-fits-btn" onClick={() => {
                    if (event.category === "Academic") setSelectedRentalCategory("Notes");
                    else if (event.category === "Gaming") setSelectedRentalCategory("Gaming");
                    else setSelectedRentalCategory("Wardrobe");
                    navigate('rentals');
                  }}>Essentials</button>
                  <button className="register-event-btn" disabled={seatsLeft === 0 || alreadyRegistered} onClick={() => handleRegisterEvent(event.id)}>
                    {alreadyRegistered ? 'Registered ✓' : 'Book Tickets'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
