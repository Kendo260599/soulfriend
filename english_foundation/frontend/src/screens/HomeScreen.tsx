import React from 'react';
import StreakWidget from '../components/StreakWidget';
import XPProgressBar from '../components/XPProgressBar';
import AchievementBadges from '../components/AchievementBadges';
import DailyChallenge from '../components/DailyChallenge';

type HomeScreenProps = {
  userId?: string;
  lexicalLevel: number;
  dailyTarget: string;
  onContinue: () => void;
  onOpenProgress: () => void;
  onStartReview: () => void;
};

const HomeScreen: React.FC<HomeScreenProps> = ({
  userId,
  lexicalLevel,
  dailyTarget,
  onContinue,
  onOpenProgress,
  onStartReview,
}) => {
  return (
    <main className="page">
      {/* Gamification Widgets */}
      {userId && (
        <section className="gamification-section">
          {/* Top Row: Streak + XP */}
          <div className="gamification-row">
            <div className="gamification-widget streak-widget-container">
              <StreakWidget userId={userId} />
            </div>
            <div className="gamification-widget xp-widget-container">
              <XPProgressBar userId={userId} />
            </div>
          </div>

          {/* Achievements */}
          <div className="gamification-full-width">
            <AchievementBadges userId={userId} />
          </div>

          {/* Daily Challenges */}
          <div className="gamification-full-width">
            <DailyChallenge userId={userId} />
          </div>
        </section>
      )}

      {/* Main Learning Section */}
      <section className="card calm-card">
        <h1>English Foundation</h1>
        <p className="muted">A calm first step for beginners and lost-foundation learners.</p>

        <div className="stat-row">
          <div className="stat-pill">Current level: {Math.round(lexicalLevel * 100)}%</div>
          <div className="stat-pill">Daily target: {dailyTarget}</div>
        </div>

        <button className="primary-btn" onClick={onContinue}>
          Continue lesson
        </button>
        <button className="secondary-btn" onClick={onStartReview}>
          Review items
        </button>
        <button className="secondary-btn" onClick={onOpenProgress}>
          View progress
        </button>
      </section>
    </main>
  );
};

export default HomeScreen;
