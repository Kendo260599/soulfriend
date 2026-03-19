import React from 'react';

/**
 * LessonScreenSkeleton - Loading placeholder for LessonScreen
 * Shows animated skeleton while lesson data is being fetched
 */
const LessonScreenSkeleton: React.FC = () => {
  return (
    <main className="page skeleton-page">
      <section className="card">
        {/* Header skeleton */}
        <div className="skeleton-title"></div>
        <div className="skeleton-text" style={{ marginBottom: '20px' }}></div>

        {/* Lesson card skeleton */}
        <div className="skeleton-card" style={{ marginBottom: '12px' }}></div>

        {/* Helper text skeleton */}
        <div className="skeleton-text" style={{ marginBottom: '20px' }}></div>

        {/* Answer buttons skeleton */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
          <div className="skeleton-button" style={{ flex: 1 }}></div>
          <div className="skeleton-button" style={{ flex: 1 }}></div>
        </div>

        {/* Submit button skeleton */}
        <div className="skeleton-button"></div>
      </section>
    </main>
  );
};

export default LessonScreenSkeleton;
