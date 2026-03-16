import React, { useEffect, useMemo, useState } from 'react';
import HomeScreen from './screens/HomeScreen';
import LessonScreen from './screens/LessonScreen';
import ProgressScreen from './screens/ProgressScreen';
import { fetchLesson, fetchProgress } from './services/learningApi';
import { LessonPayload, ProgressPayload } from './types';
import './styles.css';

type Screen = 'home' | 'lesson' | 'progress';

const emptyLesson: LessonPayload = {
  words: [],
  phrases: [],
  grammar: { id: 0, pattern: '', example: '', difficulty: 1 },
};

const emptyProgress: ProgressPayload = {
  learned_words: 0,
  weak_words: 0,
  grammar_completed: 0,
};

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('home');
  const [lesson, setLesson] = useState<LessonPayload>(emptyLesson);
  const [progress, setProgress] = useState<ProgressPayload>(emptyProgress);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const lexicalLevel = useMemo(() => Math.min(1, progress.learned_words / 30), [progress.learned_words]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [lessonData, progressData] = await Promise.all([fetchLesson(), fetchProgress()]);
      setLesson(lessonData);
      setProgress(progressData);
    } catch (e: any) {
      setError(e?.message || 'Unable to load learning data now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  if (loading) {
    return <div className="center-note">Loading calm lesson...</div>;
  }

  if (error) {
    return (
      <div className="center-note">
        <p>{error}</p>
        <button className="primary-btn" onClick={() => void loadData()}>
          Try again
        </button>
      </div>
    );
  }

  if (screen === 'lesson') {
    return (
      <LessonScreen
        lesson={lesson}
        onFinish={() => setScreen('progress')}
        onBackHome={() => setScreen('home')}
      />
    );
  }

  if (screen === 'progress') {
    return <ProgressScreen progress={progress} onBackHome={() => setScreen('home')} />;
  }

  return (
    <HomeScreen
      lexicalLevel={lexicalLevel}
      dailyTarget="1 short lesson"
      onContinue={() => setScreen('lesson')}
      onOpenProgress={() => setScreen('progress')}
    />
  );
};

export default App;
