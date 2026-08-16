import React from 'react';

export default function Sidebar({ profile, currentView, sidebarOpen, unreadCount, myRequestsCount, navigate, onLogout, onOpenProfile }) {
  return (
    <nav className={`dashboard-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand" style={{ padding: '20px 20px 10px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="brand-dot" style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#8a8aff' }}></div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#ffffff', margin: '0' }}>Loop</h2>
      </div>

      <button className="sidebar-user-card sidebar-user-card-btn" onClick={onOpenProfile} title="Edit profile">
        {profile?.avatar_url ? (
          <img className="sidebar-user-avatar-img" src={profile.avatar_url} alt={profile.name} />
        ) : (
          <span className="sidebar-user-avatar">🎓</span>
        )}
        <div>
          <p className="sidebar-user-name">{profile?.name || 'Campus Student'}</p>
          <p className="sidebar-user-sub">{profile?.hostel_block || 'Campus Network'}</p>
        </div>
      </button>

      <div className="nav-menu">
        <p className="sidebar-label">DISCOVER</p>
        <button className={`nav-link ${currentView === 'events' ? 'active' : ''}`} onClick={() => navigate('events')}><span>📅</span> Explore Events</button>
        <button className={`nav-link ${currentView === 'rentals' ? 'active' : ''}`} onClick={() => navigate('rentals')}><span>🛍️</span> Rental Marketplace</button>
        <button className={`nav-link ${currentView === 'sneaker-bids' ? 'active' : ''}`} onClick={() => navigate('sneaker-bids')}><span>👟</span> Sneaker Bidding</button>
        <button className={`nav-link ${currentView === 'polls' ? 'active' : ''}`} onClick={() => navigate('polls')}><span>✨</span> FitCheck Polls</button>

        <p className="sidebar-label">ACCOUNT</p>
        <button className={`nav-link ${currentView === 'lender' ? 'active' : ''}`} onClick={() => navigate('lender')}><span>🏪</span> Lender Portal</button>
        <button className={`nav-link ${currentView === 'requests' ? 'active' : ''}`} onClick={() => navigate('requests')}>
          <span>📦</span> My Requests {myRequestsCount > 0 && <span className="nav-badge">{myRequestsCount}</span>}
        </button>
        <button className={`nav-link ${currentView === 'notifications' ? 'active' : ''}`} onClick={() => navigate('notifications')}>
          <span>🔔</span> Notifications {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
        </button>
        <button className="nav-link" onClick={onOpenProfile}><span>👤</span> Profile</button>
        <button className={`nav-link ${currentView === 'suggestions' ? 'active' : ''}`} onClick={() => navigate('suggestions')}><span>💡</span> Suggestions & Help</button>
      </div>

      <div className="sidebar-footer" style={{ padding: '16px 20px', borderTop: '1px solid #1e293b' }}>
        <button className="logout-btn" onClick={onLogout}>⏏ Logout</button>
      </div>
    </nav>
  );
}
