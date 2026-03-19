import React from 'react';
import '../styles/streak.css';
import { useGamification } from '../hooks/useGamification';

/**
 * StreakWidget - Daily streak counter component
 * Motivates users to maintain consistent learning habits
 * Shows current streak and personal best
 */
interface StreakWidgetProps {
  currentStreak?: number;
  bestStreak?: number;
  missedDays?: number;
  lastActive?: string; // yyyy-mm-dd format
  userId?: string; // If provided, fetches live data from API
}

const StreakWidget: React.FC<StreakWidgetProps> = ({
  currentStreak: propCurrentStreak = 0,
  bestStreak: propBestStreak = 0,
  missedDays: propMissedDays = 0,
  userId,
}) => {
  // Use API data if userId provided, otherwise use props
  const gamification = userId ? useGamification(userId) : null;

  const currentStreak = gamification?.streak?.currentStreak ?? propCurrentStreak;
  const bestStreak = gamification?.streak?.bestStreak ?? propBestStreak;
  const missedDays = gamification?.streak?.missedDays ?? propMissedDays;

  const isStreakActive = currentStreak > 0;
  const isLoading = userId && gamification?.loading;

  if (isLoading) {
    return (
      <div className="streak-widget streak-loading" role="status" aria-live="polite">
        <div className="streak-skeleton" />
      </div>
    );
  }

  return (
    <div className="streak-widget" role="region" aria-label="Daily streak counter">
      {/* Current Streak */}
      <div className={`streak-item ${isStreakActive ? 'active' : ''}`}>
        <div className="streak-icon" aria-hidden="true">
          🔥
        </div>
        <div className="streak-info">
          <div className="streak-count">{currentStreak}</div>
          <div className="streak-label">Current</div>
        </div>
      </div>

      {/* Divider */}
      <div className="streak-divider" aria-hidden="true">
        •
      </div>

      {/* Best Streak */}
      <div className="streak-item best">
        <div className="streak-icon" aria-hidden="true">
          🏆
        </div>
        <div className="streak-info">
          <div className="streak-count">{bestStreak}</div>
          <div className="streak-label">Best</div>
        </div>
      </div>

      {/* Motivation Message */}
      {missedDays === 0 && isStreakActive && (
        <div className="streak-motivation" aria-live="polite">
          Keep it up! 🚀
        </div>
      )}

      {missedDays === 1 && (
        <div className="streak-warning" aria-live="polite">
          ⚠️ Practice today to restore your streak!
        </div>
      )}
    </div>
  );
};

export default StreakWidget;
