import React, { useMemo, useState } from 'react';
import { LessonPayload } from '../types';
import ttsService from '../services/ttsService';
import { PronunciationButton } from '../components/PronunciationButton';

type LessonScreenProps = {
  lesson: LessonPayload;
  onFinish: (answers: Array<{ wordId: number; correct: boolean }>) => void;
  onBackHome: () => void;
};

type LessonCard = {
  key: string;
  title: string;
  main: string;
  sub: string;
  helper: string;
  itemId: number;
};

type Answer = {
  wordId: number;
  correct: boolean;
};

const LessonScreen: React.FC<LessonScreenProps> = ({ lesson, onFinish, onBackHome }) => {
  const cards = useMemo<LessonCard[]>(() => {
    const wordCards = lesson.words.map((w) => ({
      key: `word-${w.id}`,
      title: 'Word',
      main: `${w.word} ${w.ipa}`,
      sub: w.meaning_vi,
      helper: `${w.collocation} | ${w.example_sentence}`,
      itemId: w.id,
    }));

    const phraseCards = lesson.phrases.map((p) => ({
      key: `phrase-${p.id}`,
      title: 'Phrase',
      main: p.phrase,
      sub: p.meaning_vi,
      helper: 'Use this phrase in one short sentence.',
      itemId: p.vocab_id,
    }));

    const grammarCard: LessonCard = {
      key: `grammar-${lesson.grammar?.id ?? 'none'}`,
      title: 'Grammar Micro',
      main: lesson.grammar?.pattern ?? 'No grammar item',
      sub: lesson.grammar?.example ?? '',
      helper: 'Keep it short. Say one clear sentence.',
      itemId: lesson.grammar?.id ?? 0,
    };

    return [...wordCards, ...phraseCards, grammarCard];
  }, [lesson]);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  const current = cards[index];
  const progressPct = Math.round(((index + 1) / cards.length) * 100);
  const isLast = index === cards.length - 1;

  const recordAnswer = (correct: boolean) => {
    const newAnswer: Answer = {
      wordId: current.itemId,
      correct,
    };
    setAnswers([...answers, newAnswer]);
    
    if (isLast) {
      handleFinish([...answers, newAnswer]);
    } else {
      setIndex((prev) => prev + 1);
    }
  };

  const handleCorrect = () => recordAnswer(true);
  const handleSkip = () => recordAnswer(false);
  
  const handleFinish = (finalAnswers: Answer[]) => {
    setIsSubmitting(true);
    onFinish(finalAnswers);
  };

  const handlePlayAudio = () => {
    if (!ttsService.isSupported()) {
      alert('Text-to-Speech is not supported in your browser');
      return;
    }

    setIsPlayingAudio(true);

    // Determine what to speak based on card type
    let textToSpeak = current.main;
    if (current.title === 'Word') {
      // Extract just the word (without IPA)
      textToSpeak = current.main.split(/\s+\//)[0];
      ttsService.speakWord(textToSpeak, undefined, () => setIsPlayingAudio(false));
    } else {
      // For phrases and grammar, speak the main text
      ttsService.speakPhrase(current.main, undefined, () => setIsPlayingAudio(false));
    }
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

        <div className="button-row" style={{ marginTop: '16px', marginBottom: '12px' }}>
          <button
            className="secondary-btn"
            onClick={handlePlayAudio}
            disabled={isSubmitting || isPlayingAudio}
            title="Click to hear pronunciation"
          >
            {isPlayingAudio ? '🔊 Playing...' : '🔉 Hear pronunciation'}
          </button>
          
          {current.title === 'Word' && (
            <PronunciationButton
              word={current.main.split(/\s+\//)[0]}
              variant="word"
              disabled={isSubmitting || isPlayingAudio}
              showLabel={true}
            />
          )}
        </div>

        <div className="button-row">
          <button 
            className="secondary-btn" 
            onClick={onBackHome}
            disabled={isSubmitting}
          >
            Back home
          </button>
        </div>

        <div className="button-row" style={{ marginTop: '12px', gap: '8px' }}>
          <button 
            className="secondary-btn" 
            onClick={handleSkip}
            disabled={isSubmitting}
            style={{ flex: 1 }}
          >
            ❓ Not sure
          </button>
          <button 
            className="primary-btn" 
            onClick={handleCorrect}
            disabled={isSubmitting}
            style={{ flex: 1 }}
          >
            ✓ I know this
          </button>
        </div>

        {isSubmitting && (
          <div className="center-note" style={{ marginTop: '12px' }}>
            <p>Submitting your answers...</p>
          </div>
        )}
      </section>
    </main>
  );
};

export default LessonScreen;
