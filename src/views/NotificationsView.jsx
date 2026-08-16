import React from 'react';

export default function NotificationsView({ notifications }) {
  return (
    <div className="view-content animate-fade-in">
      <div className="view-header-row" style={{ marginBottom: '24px' }}>
        <div className="view-header">
          <h1>Notifications</h1>
          <p>Stay up to date with your requests and activity.</p>
        </div>
      </div>
      {notifications.length === 0 && (
        <div className="empty-state"><span>🔔</span><p>No notifications yet.</p></div>
      )}
      {notifications.map(n => (
        <div key={n.id} className="notif-item notif-read">
          <div className="notif-dot" />
          <div className="notif-body">
            <p className="notif-text">{n.text}</p>
            <span className="notif-time">{n.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
