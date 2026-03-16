import React, { useMemo, useState } from 'react';
import { LessonPayload } from '../types';

type LessonScreenProps = {
  lesson: LessonPayload;
  onFinish: () => void;
  onBackHome: () => void;
};

type LessonCard = {
  key: string;
  title: string;
  main: string;
  sub: string;
  helper: string;
};

const LessonScreen: React.FC<LessonScreenProps> = ({ lesson, onFinish, onBackHome }) => {
  const cards = useMemo<LessonCard[]>(() => {
    const wordCards = lesson.words.map((w) => ({
      key: `word-${w.id}`,
      title: 'Word',
      main: `${w.word} ${w.ipa}`,
      sub: w.meaning_vi,
      helper: `${w.collocation} | ${w.example_sentence}`,
    }));

    const phraseCards = lesson.phrases.map((p) => ({
      key: `phrase-${p.id}`,
      title: 'Phrase',
      main: p.phrase,
      sub: p.meaning_vi,
      helper: 'Use this phrase in one short sentence.',
    }));

    const grammarCard: LessonCard = {
      key: `grammar-${lesson.grammar?.id ?? 'none'}`,
      title: 'Grammar Micro',
      main: lesson.grammar?.pattern ?? 'No grammar item',
      sub: lesson.grammar?.example ?? '',
      helper: 'Keep it short. Say one clear sentence.',
    };

    return [...wordCards, ...phraseCards, grammarCard];
  }, [lesson]);

  const [index, setIndex] = useState(0);
  const current = cards[index];
  const progressPct = Math.round(((index + 1) / cards.length) * 100);
  const isLast = index === cards.length - 1;

  const handleNext = () => {
    if (isLast) {
      onFinish();
      return;
    }
    setIndex((prev) => prev + 1);
  };

  return (
    <main className="page">
      <section className="card lesson-card">
        <div className="progress-head">
          <span>Lesson progress</span>
          <span>{progressPct}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>

        <div className="badge">{current.title}</div>
        <h2>{current.main}</h2>
        <p className="meaning">{current.sub}</p>
        <p className="helper">{current.helper}</p>

        <div className="button-row">
          <button className="secondary-btn" onClick={onBackHome}>
            Back home
          </button>
          <button className="primary-btn" onClick={handleNext}>
            {isLast ? 'Finish lesson' : 'Next'}
          </button>
        </div>
      </section>
    </main>
  );
};

export default LessonScreen;
