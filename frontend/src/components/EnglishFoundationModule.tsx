import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { apiService } from '../services/apiService';

type WordItem = {
  id: number;
  word: string;
  ipa: string;
  meaning_vi: string;
  collocation: string;
  example_sentence: string;
};

type PhraseItem = {
  id: number;
  phrase: string;
  meaning_vi: string;
};

type GrammarItem = {
  id: number;
  pattern: string;
  example: string;
};

type LessonPayload = {
  words: WordItem[];
  phrases: PhraseItem[];
  grammar: GrammarItem;
};

type ProgressPayload = {
  learned_words: number;
  weak_words: number;
  grammar_completed: number;
};

type View = 'home' | 'lesson' | 'progress';

type LessonCard = {
  key: string;
  title: string;
  main: string;
  sub: string;
  helper: string;
};

const Page = styled.div`
  min-height: 100vh;
  background: radial-gradient(circle at 10% 0%, #eef7f1 0%, #f8fbf9 45%);
  padding: 20px;
  font-family: 'Nunito', 'Segoe UI', sans-serif;
`;

const Card = styled.section`
  max-width: 620px;
  margin: 0 auto;
  background: #fff;
  border: 1px solid #d7e6da;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 10px 24px rgba(42, 84, 55, 0.08);
`;

const Title = styled.h1`
  margin: 0 0 10px 0;
  color: #243329;
`;

const Muted = styled.p`
  margin: 0 0 14px 0;
  color: #5c6f61;
`;

const Pill = styled.div`
  display: inline-block;
  border: 1px solid #d7e6da;
  border-radius: 999px;
  padding: 8px 12px;
  margin: 4px 0;
  font-weight: 700;
  background: #f7fcf8;
`;

const Button = styled.button<{ $ghost?: boolean }>`
  width: 100%;
  min-height: 52px;
  margin-top: 10px;
  border-radius: 14px;
  cursor: pointer;
  font-size: 18px;
  font-weight: 700;
  border: ${p => (p.$ghost ? '1px solid #d7e6da' : 'none')};
  color: ${p => (p.$ghost ? '#27372c' : '#fff')};
  background: ${p => (p.$ghost ? '#fff' : '#61bf7f')};
`;

const ProgressTrack = styled.div`
  height: 10px;
  background: #e7f2ea;
  border-radius: 999px;
  overflow: hidden;
  margin: 12px 0 18px 0;
`;

const ProgressFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${p => `${p.$pct}%`};
  background: linear-gradient(90deg, #63c181 0%, #9bdeaf 100%);
`;

const Badge = styled.div`
  display: inline-block;
  background: #eef9f1;
  border: 1px solid #cfe5d5;
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 10px;
`;

const Grid = styled.div`
  display: grid;
  gap: 10px;
  margin: 12px 0;
`;

const StatItem = styled.div`
  border: 1px solid #d7e6da;
  border-radius: 12px;
  padding: 12px;
  background: #f9fcfa;
`;

const ErrorNote = styled.div`
  color: #9d2b2b;
  margin-top: 12px;
`;

const EnglishFoundationModule: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [lesson, setLesson] = useState<LessonPayload | null>(null);
  const [progress, setProgress] = useState<ProgressPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [cardIndex, setCardIndex] = useState<number>(0);

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [lessonRes, progressRes] = await Promise.all([
        apiService.getFoundationLesson(),
        apiService.getFoundationProgress(),
      ]);
      setLesson(lessonRes.data);
      setProgress(progressRes.data);
      setCardIndex(0);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Cannot load foundation lesson now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const cards = useMemo<LessonCard[]>(() => {
    if (!lesson) return [];

    const wordCards = (lesson.words || []).map(w => ({
      key: `w-${w.id}`,
      title: 'Word',
      main: `${w.word} ${w.ipa}`,
      sub: w.meaning_vi,
      helper: `${w.collocation} | ${w.example_sentence}`,
    }));

    const phraseCards = (lesson.phrases || []).map(p => ({
      key: `p-${p.id}`,
      title: 'Phrase',
      main: p.phrase,
      sub: p.meaning_vi,
      helper: 'Say one short sentence with this phrase.',
    }));

    const grammarCard: LessonCard = {
      key: `g-${lesson.grammar?.id || 0}`,
      title: 'Grammar Micro',
      main: lesson.grammar?.pattern || 'No pattern',
      sub: lesson.grammar?.example || '',
      helper: 'Keep sentence short and clear.',
    };

    return [...wordCards, ...phraseCards, grammarCard];
  }, [lesson]);

  if (loading) {
    return (
      <Page>
        <Card>
          <Title>English Foundation</Title>
          <Muted>Loading calm lesson...</Muted>
        </Card>
      </Page>
    );
  }

  if (view === 'home') {
    const lexicalLevel = Math.min(1, (progress?.learned_words || 0) / 30);
    return (
      <Page>
        <Card>
          <Title>English Foundation</Title>
          <Muted>A calm first English teacher for beginners.</Muted>
          <Pill>Current level: {Math.round(lexicalLevel * 100)}%</Pill>
          <br />
          <Pill>Daily target: 1 short lesson</Pill>

          <Button onClick={() => setView('lesson')}>Continue lesson</Button>
          <Button $ghost onClick={() => setView('progress')}>View progress</Button>

          {error ? <ErrorNote>{error}</ErrorNote> : null}
        </Card>
      </Page>
    );
  }

  if (view === 'progress') {
    return (
      <Page>
        <Card>
          <Title>Your Progress</Title>
          <Muted>Small steps are still progress.</Muted>

          <Grid>
            <StatItem>Learned words: <strong>{progress?.learned_words || 0}</strong></StatItem>
            <StatItem>Weak words: <strong>{progress?.weak_words || 0}</strong></StatItem>
            <StatItem>Grammar completed: <strong>{progress?.grammar_completed || 0}%</strong></StatItem>
          </Grid>

          <Button onClick={() => setView('home')}>Back home</Button>
        </Card>
      </Page>
    );
  }

  const card = cards[cardIndex];
  const total = cards.length || 1;
  const progressPct = Math.round(((cardIndex + 1) / total) * 100);
  const isLast = cardIndex >= total - 1;

  return (
    <Page>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
          <span>Lesson progress</span>
          <span>{progressPct}%</span>
        </div>
        <ProgressTrack>
          <ProgressFill $pct={progressPct} />
        </ProgressTrack>

        <Badge>{card?.title || 'Lesson item'}</Badge>
        <Title style={{ fontSize: '28px' }}>{card?.main || 'No item'}</Title>
        <Muted>{card?.sub || ''}</Muted>
        <Muted>{card?.helper || ''}</Muted>

        <Button $ghost onClick={() => setView('home')}>Back home</Button>
        <Button
          onClick={() => {
            if (isLast) {
              setView('progress');
              return;
            }
            setCardIndex(prev => prev + 1);
          }}
        >
          {isLast ? 'Finish lesson' : 'Next'}
        </Button>
      </Card>
    </Page>
  );
};

export default EnglishFoundationModule;
