import React, { useState } from 'react';
import ttsService from '../services/ttsService';

export type ReviewItem = {
  id: number;
  word: string;
  ipa: string;
  meaning_vi: string;
  collocation: string;
  example_sentence: string;
  memory_strength: number;
  topic_ielts?: string;
};

export type ReviewPayload = {
  learner_id: number;
  mode: 'due' | 'weak' | 'fresh';
  items: ReviewItem[];
};

interface ReviewScreenProps {
  review: ReviewPayload;
  onSubmit: (answers: Array<{ wordId: number; correct: boolean }>) => void;
  onCancel: () => void;
}

type Answer = {
  wordId: number;
  correct: boolean;
};

const ReviewScreen: React.FC<ReviewScreenProps> = ({ review, onSubmit, onCancel }) => {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const currentItem = review.items[index];
  const isFinished = index >= review.items.length;
  const progressPct = isFinished ? 100 : Math.round(((index + 1) / review.items.length) * 100);

  const recordAnswer = (correct: boolean) => {
    const newAnswer: Answer = {
      wordId: currentItem.id,
      correct,
    };
    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);

    if (index < review.items.length - 1) {
      setIndex(index + 1);
    } else {
      handleFinish(updatedAnswers);
    }
  };

  const handleCorrect = () => recordAnswer(true);
  const handleIncorrect = () => recordAnswer(false);

  const handleFinish = (finalAnswers: Answer[]) => {
    setIsSubmitting(true);
    onSubmit(finalAnswers);
  };

  const handlePlayAudio = () => {
    if (!ttsService.isSupported()) {
      alert('Text-to-Speech is not supported in your browser');
      return;
    }

    setIsPlayingAudio(true);
    ttsService.speakWord(currentItem.word, undefined, () => setIsPlayingAudio(false));
  };

  const getModeLabel = (): string => {
    switch (review.mode) {
      case 'due':
        return '📋 Items Due for Review';
      case 'weak':
        return '⚠️ Practice Weak Words';
      case 'fresh':
        return '✨ Learn New Words';
      default:
        return 'Review';
    }
  };

  if (isFinished) {
    const correctCount = answers.filter((a) => a.correct).length;
    const scorePercent = Math.round((correctCount / answers.length) * 100);

    return (
      <main className="page">
        <section className="card calm-card">
          <h2>🎉 Review Complete!</h2>
          <p className="muted">Great effort on your review session.</p>

          <div className="progress-grid">
            <div className="progress-item">
              <span className="label">Score</span>
              <strong>{scorePercent}%</strong>
            </div>
            <div className="progress-item">
              <span className="label">Correct</span>
              <strong>
                {correctCount}/{answers.length}
              </strong>
            </div>
            <div className="progress-item">
              <span className="label">Items</span>
              <strong>{answers.length}</strong>
            </div>
          </div>

          <button className="primary-btn" onClick={onCancel} style={{ marginTop: '16px' }}>
            Back to home
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="card lesson-card">
        <div className="progress-head">
          <span>{getModeLabel()}</span>
          <span>{progressPct}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>

        {currentItem && (
          <>
            <div className="badge">Review word</div>
            <h2>
              {currentItem.word} {currentItem.ipa}
            </h2>
            <p className="meaning">{currentItem.meaning_vi}</p>
            <p className="helper">
              <strong>Collocation:</strong> {currentItem.collocation}
            </p>
            <p className="helper">
              <strong>Example:</strong> {currentItem.example_sentence}
            </p>

            {currentItem.topic_ielts && (
              <p className="helper" style={{ marginTop: '8px', fontSize: '0.85em', color: '#666' }}>
                📌 Topic: {currentItem.topic_ielts}
              </p>
            )}

            <div className="button-row" style={{ marginTop: '16px', marginBottom: '12px' }}>
              <button
                className="secondary-btn"
                onClick={handlePlayAudio}
                disabled={isSubmitting || isPlayingAudio}
                title="Click to hear pronunciation"
              >
                {isPlayingAudio ? '🔊 Playing...' : '🔉 Hear pronunciation'}
              </button>
            </div>

            <div className="button-row" style={{ marginTop: '12px', gap: '8px' }}>
              <button
                className="secondary-btn"
                onClick={handleIncorrect}
                disabled={isSubmitting}
                style={{ flex: 1 }}
              >
                ✗ Need practice
              </button>
              <button
                className="primary-btn"
                onClick={handleCorrect}
                disabled={isSubmitting}
                style={{ flex: 1 }}
              >
                ✓ Got it
              </button>
            </div>

            <div className="button-row" style={{ marginTop: '8px' }}>
              <button className="secondary-btn" onClick={onCancel} disabled={isSubmitting} style={{ flex: 1 }}>
                Cancel review
              </button>
            </div>
          </>
        )}

        {isSubmitting && (
          <div className="center-note" style={{ marginTop: '12px' }}>
            <p>Saving your review progress...</p>
          </div>
        )}
      </section>
    </main>
  );
};

export default ReviewScreen;
