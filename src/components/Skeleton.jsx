import React from 'react';

export function SkeletonCard({ tall = false }) {
  return (
    <div className={`skeleton-card ${tall ? 'skeleton-card-tall' : ''}`}>
      <div className="skeleton-block skeleton-thumb shimmer" />
      <div className="skeleton-block skeleton-line-lg shimmer" />
      <div className="skeleton-block skeleton-line-sm shimmer" />
      <div className="skeleton-block skeleton-line-sm shimmer" style={{ width: '60%' }} />
    </div>
  );
}

export default function SkeletonGrid({ count = 6, className = 'rentals-dashboard-grid' }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} tall={i === 0} />)}
    </div>
  );
}
