import React from 'react';

/**
 * HomeScreenSkeleton - Loading placeholder for HomeScreen
 * Shows animated skeleton while data is being fetched
 */
const HomeScreenSkeleton: React.FC = () => {
  return (
    <main className="page skeleton-page">
      <section className="card calm-card">
        {/* Title skeleton */}
        <div className="skeleton-title"></div>

        {/* Subtitle skeleton */}
        <div className="skeleton-text" style={{ marginBottom: '20px' }}></div>
        <div className="skeleton-text" style={{ width: '80%', marginBottom: '24px' }}></div>

        {/* Stat pills skeleton */}
        <div className="stat-row">
          <div className="skeleton-pill"></div>
          <div className="skeleton-pill"></div>
        </div>

        {/* Buttons skeleton */}
        <div className="skeleton-button"></div>
        <div className="skeleton-button"></div>
        <div className="skeleton-button"></div>
      </section>
    </main>
  );
};

export default HomeScreenSkeleton;
