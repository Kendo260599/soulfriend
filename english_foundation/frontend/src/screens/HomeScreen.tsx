import React from 'react';

type HomeScreenProps = {
  lexicalLevel: number;
  dailyTarget: string;
  onContinue: () => void;
  onOpenProgress: () => void;
};

const HomeScreen: React.FC<HomeScreenProps> = ({
  lexicalLevel,
  dailyTarget,
  onContinue,
  onOpenProgress,
}) => {
  return (
    <main className="page">
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
        <button className="secondary-btn" onClick={onOpenProgress}>
          View progress
        </button>
      </section>
    </main>
  );
};

export default HomeScreen;
