import React from 'react';
import { ProgressPayload } from '../types';

type ProgressScreenProps = {
  progress: ProgressPayload;
  onBackHome: () => void;
};

const ProgressScreen: React.FC<ProgressScreenProps> = ({ progress, onBackHome }) => {
  return (
    <main className="page">
      <section className="card calm-card">
        <h1>Your Progress</h1>
        <p className="muted">Small steps are still progress.</p>

        <div className="progress-grid">
          <div className="progress-item">
            <span className="label">Learned words</span>
            <strong>{progress.learned_words}</strong>
          </div>
          <div className="progress-item">
            <span className="label">Weak words</span>
            <strong>{progress.weak_words}</strong>
          </div>
          <div className="progress-item">
            <span className="label">Grammar completed</span>
            <strong>{progress.grammar_completed}%</strong>
          </div>
        </div>

        <button className="primary-btn" onClick={onBackHome}>
          Back to home
        </button>
      </section>
    </main>
  );
};

export default ProgressScreen;
