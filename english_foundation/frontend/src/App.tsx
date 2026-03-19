import React, { useEffect, useMemo, useState } from 'react';
import HomeScreen from './screens/HomeScreen';
import LessonScreen from './screens/LessonScreen';
import ProgressScreen from './screens/ProgressScreen';
import ReviewScreen, { ReviewPayload } from './screens/ReviewScreen';
import HomeScreenSkeleton from './screens/HomeScreenSkeleton';
import LessonScreenSkeleton from './screens/LessonScreenSkeleton';
import { fetchLesson, fetchProgress, submitVocabCheck, fetchReview, submitReview } from './services/learningApi';
import { LessonPayload, ProgressPayload } from './types';
import './styles.css';
import './styles/skeleton.css';

type Screen = 'home' | 'lesson' | 'progress' | 'review';

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

const emptyReview: ReviewPayload = {
  learner_id: 1,
  mode: 'due',
  items: [],
};

// Get or create userId from localStorage
const getUserId = (): string => {
  const stored = localStorage.getItem('english_foundation_user_id');
  if (stored) return stored;

  // Generate new userId (in production, this would come from auth)
  const newId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('english_foundation_user_id', newId);
  return newId;
};

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('home');
  const [lesson, setLesson] = useState<LessonPayload>(emptyLesson);
  const [progress, setProgress] = useState<ProgressPayload>(emptyProgress);
  const [review, setReview] = useState<ReviewPayload>(emptyReview);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userId] = useState<string>(() => getUserId());

  const lexicalLevel = useMemo(() => Math.min(1, progress.learned_words / 30), [progress.learned_words]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // Load lesson first - shows content immediately (1-2 seconds)
      try {
        const lessonData = await fetchLesson();
        setLesson(lessonData);
      } catch (lessonErr) {
        console.error('Lesson fetch error:', lessonErr);
        setError('Could not load lesson data. Please try again.');
        setLoading(false);
        return;
      }

      // Load progress after - updates in background
      try {
        const progressData = await fetchProgress();
        setProgress(progressData);
      } catch (progressErr) {
        console.error('Progress fetch error:', progressErr);
        // Don't fail if progress fails - lesson is still usable
      }

    } catch (e: any) {
      setError(e?.message || 'Unable to load learning data now.');
    } finally {
      setLoading(false);
    }
  };

  const handleLessonFinish = async (answers: Array<{ wordId: number; correct: boolean }>) => {
    try {
      // Submit answers to backend
      await submitVocabCheck(1, 'lesson-1', answers);
      
      // Reload progress to show updated stats
      const updatedProgress = await fetchProgress();
      setProgress(updatedProgress);
      
      // Move to progress screen
      setScreen('progress');
    } catch (e: any) {
      setError(e?.message || 'Failed to submit lesson answers.');
    }
  };

  const handleReviewStart = async (mode: 'due' | 'weak' | 'fresh' = 'due') => {
    try {
      setLoading(true);
      setError('');
      const reviewData = await fetchReview(1, 10);
      
      // Set mode on review data
      reviewData.mode = mode;
      
      setReview(reviewData);
      setScreen('review');
    } catch (e: any) {
      setError(e?.message || 'Failed to load review items.');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (answers: Array<{ wordId: number; correct: boolean }>) => {
    try {
      setLoading(true);
      // Submit review answers to backend
      await submitReview(1, answers);
      
      // Reload progress
      const updatedProgress = await fetchProgress();
      setProgress(updatedProgress);
      
      // Return to home
      setScreen('home');
    } catch (e: any) {
      setError(e?.message || 'Failed to submit review answers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

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

  // Show skeleton based on current screen
  if (loading && screen === 'home') {
    return <HomeScreenSkeleton />;
  }

  if (loading && screen === 'lesson') {
    return <LessonScreenSkeleton />;
  }

  if (loading) {
    return <div className="center-note">Loading...</div>;
  }

  if (screen === 'lesson') {
    return (
      <LessonScreen
        lesson={lesson}
        onFinish={handleLessonFinish}
        onBackHome={() => setScreen('home')}
      />
    );
  }

  if (screen === 'progress') {
    return <ProgressScreen progress={progress} onBackHome={() => setScreen('home')} />;
  }

  if (screen === 'review') {
    return (
      <ReviewScreen
        review={review}
        onSubmit={handleReviewSubmit}
        onCancel={() => setScreen('home')}
      />
    );
  }

  return (
    <HomeScreen
      userId={userId}
      lexicalLevel={lexicalLevel}
      dailyTarget="1 short lesson"
      onContinue={() => setScreen('lesson')}
      onOpenProgress={() => setScreen('progress')}
      onStartReview={() => handleReviewStart('due')}
    />
  );
};

export default App;
