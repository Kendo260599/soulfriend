import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { apiService } from '../services/apiService';

type Track = 'grammar' | 'vocab';

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
  track?: Track;
  lesson_meta?: {
    id?: string;
    level?: string;
    title?: string;
    focus?: string;
    objective?: string;
  };
  sequence?: string[];
  words: WordItem[];
  phrases: PhraseItem[];
  grammar: GrammarItem;
};

type CurriculumLesson = {
  id: string;
  order?: number;
  level: string;
  title: string;
  focus: string;
  objective: string;
};

type CurriculumPayload = {
  framework: string;
  tracks: {
    vocab: CurriculumLesson[];
    grammar: CurriculumLesson[];
  };
};

const FALLBACK_CURRICULUM: CurriculumPayload = {
  framework: 'IELTS-aligned Grammar and Vocabulary path for Vietnamese learners',
  tracks: {
    vocab: [
      {
        id: 'V-A1-01',
        order: 1,
        level: 'A1',
        title: 'Daily routines and basic actions',
        focus: 'High-frequency words and short phrases',
        objective: 'Use simple words to describe common daily activities.',
      },
      {
        id: 'V-A1-02',
        order: 2,
        level: 'A1',
        title: 'Home, food, and shopping basics',
        focus: 'Topic vocabulary for practical contexts',
        objective: 'Recognize and use core words in familiar real-life topics.',
      },
      {
        id: 'V-A2-01',
        order: 3,
        level: 'A2',
        title: 'Travel and city life words',
        focus: 'Useful topic sets for short descriptions',
        objective: 'Use topic words in short IELTS-style speaking answers.',
      },
      {
        id: 'V-B1-01',
        order: 4,
        level: 'B1',
        title: 'Study and work collocations',
        focus: 'Collocations and phrase building',
        objective: 'Apply collocations to produce clearer and more natural answers.',
      },
    ],
    grammar: [
      {
        id: 'G-A1-01',
        order: 1,
        level: 'A1',
        title: 'Be verb and simple statements',
        focus: 'Sentence foundation and word order',
        objective: 'Build accurate simple sentences for self-introduction topics.',
      },
      {
        id: 'G-A1-02',
        order: 2,
        level: 'A1',
        title: 'Present simple for routines',
        focus: 'Affirmative, negative, and questions',
        objective: 'Describe daily habits with correct present simple forms.',
      },
      {
        id: 'G-A2-01',
        order: 3,
        level: 'A2',
        title: 'Past simple for experiences',
        focus: 'Regular and common irregular verbs',
        objective: 'Talk about past events with clearer time references.',
      },
      {
        id: 'G-B1-01',
        order: 4,
        level: 'B1',
        title: 'Linking ideas with connectors',
        focus: 'because, so, although, however',
        objective: 'Connect ideas to improve IELTS speaking and writing clarity.',
      },
    ],
  },
};

const isUnsupportedActionError = (error: unknown): boolean => {
  const message = String((error as any)?.response?.data?.message || (error as any)?.message || '');
  return /unsupported action/i.test(message);
};

type ProgressPayload = {
  learned_words: number;
  weak_words: number;
  grammar_completed: number;
};

type View = 'home' | 'track' | 'lesson' | 'progress';

type LessonCard = {
  key: string;
  title: string;
  main: string;
  sub: string;
  helper: string;
};

const Page = styled.div`
  min-height: 100vh;
  padding: 24px 16px 56px;
  font-family: 'Sora', 'Segoe UI', sans-serif;
  background:
    radial-gradient(circle at 16% 12%, rgba(255, 187, 106, 0.2), transparent 32%),
    radial-gradient(circle at 86% 4%, rgba(83, 202, 144, 0.2), transparent 30%),
    linear-gradient(165deg, #f6f9f7 0%, #f2f7f3 40%, #eef4f1 100%);
`;

const Shell = styled.div`
  max-width: 880px;
  margin: 0 auto;
`;

const Hero = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: 26px;
  padding: 28px;
  margin-bottom: 14px;
  border: 1px solid #d6e4da;
  background: linear-gradient(125deg, #fdf8ee 0%, #f2fbf5 52%, #ebf4ff 100%);
  box-shadow: 0 16px 34px rgba(45, 85, 56, 0.1);

  @media (max-width: 720px) {
    padding: 22px;
  }
`;

const HeroAccent = styled.div`
  position: absolute;
  width: 210px;
  height: 210px;
  border-radius: 999px;
  right: -56px;
  top: -74px;
  background: radial-gradient(circle, rgba(66, 193, 138, 0.3), rgba(66, 193, 138, 0));
  pointer-events: none;
`;

const Card = styled.section`
  max-width: 880px;
  margin: 0 auto 14px;
  background: #fff;
  border: 1px solid #d5e3d8;
  border-radius: 22px;
  padding: 24px;
  box-shadow: 0 12px 28px rgba(42, 84, 55, 0.08);

  @media (max-width: 720px) {
    padding: 18px;
  }
`;

const Title = styled.h1`
  margin: 0;
  color: #1f2f25;
  line-height: 1.2;
  letter-spacing: -0.02em;
`;

const HeroTitle = styled(Title)`
  font-size: 40px;
  margin-bottom: 10px;

  @media (max-width: 720px) {
    font-size: 30px;
  }
`;

const Muted = styled.p`
  margin: 0;
  color: #5c6f61;
  line-height: 1.55;
`;

const Pill = styled.div`
  display: inline-block;
  border: 1px solid #d4e2d7;
  border-radius: 999px;
  padding: 7px 12px;
  margin: 4px 8px 4px 0;
  font-weight: 700;
  background: #f9fdf9;
  color: #2f4437;
`;

const Button = styled.button<{ $ghost?: boolean }>`
  width: 100%;
  min-height: 52px;
  margin-top: 8px;
  border-radius: 13px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 700;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  border: ${p => (p.$ghost ? '1px solid #d7e4d9' : '1px solid transparent')};
  color: ${p => (p.$ghost ? '#26382d' : '#fff')};
  background: ${p => (p.$ghost ? '#fff' : 'linear-gradient(92deg, #4fb675, #60c98a)')};

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(46, 110, 69, 0.16);
  }
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
`;

const SectionTitle = styled.h2`
  margin: 0 0 12px;
  color: #1f2f25;
  font-size: 22px;
  letter-spacing: -0.01em;
`;

const HeroMeta = styled.div`
  margin-top: 14px;
`;

const HomeButtons = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 6px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const TrackHeading = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin: 12px 0;

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const TrackTabs = styled.div`
  display: flex;
  gap: 8px;

  @media (max-width: 720px) {
    width: 100%;
  }
`;

const TrackTab = styled.button<{ $active: boolean }>`
  padding: 9px 14px;
  border-radius: 999px;
  border: 1px solid ${p => (p.$active ? '#4eb776' : '#d6e2d8')};
  background: ${p => (p.$active ? '#ecf9f1' : '#fff')};
  color: ${p => (p.$active ? '#1e6a3b' : '#395145')};
  font-weight: 700;
  cursor: pointer;

  @media (max-width: 720px) {
    flex: 1;
  }
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
  margin: 10px 0;
`;

const TwoCol = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const TrackCard = styled.button`
  text-align: left;
  border: 1px solid #d6e3d8;
  background: linear-gradient(160deg, #ffffff, #f8fdf9);
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(41, 86, 56, 0.12);
  }
`;

const LessonListButton = styled.button`
  text-align: left;
  border: 1px solid #d5e2d7;
  background: #f9fcfa;
  border-radius: 14px;
  padding: 14px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(42, 84, 55, 0.12);
  }
`;

const LessonTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 4px;
  color: #365246;
  font-weight: 700;
`;

const LessonMain = styled.div`
  border: 1px solid #d8e5da;
  border-radius: 16px;
  padding: 16px;
  margin-top: 12px;
  background: linear-gradient(150deg, #ffffff, #f8fcf9);
`;

const StatItem = styled.div`
  border: 1px solid #d6e3d8;
  border-radius: 14px;
  padding: 14px;
  background: linear-gradient(170deg, #ffffff, #f8fcf9);
`;

const ErrorNote = styled.div`
  color: #9d2b2b;
  margin-top: 12px;
`;

const EnglishFoundationModule: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [lesson, setLesson] = useState<LessonPayload | null>(null);
  const [progress, setProgress] = useState<ProgressPayload | null>(null);
  const [curriculum, setCurriculum] = useState<CurriculumPayload | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track>('vocab');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [cardIndex, setCardIndex] = useState<number>(0);

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [lessonResult, progressResult, curriculumResult] = await Promise.allSettled([
        apiService.getFoundationLesson(),
        apiService.getFoundationProgress(),
        apiService.getFoundationCurriculum(),
      ]);

      if (lessonResult.status !== 'fulfilled') {
        throw lessonResult.reason;
      }
      if (progressResult.status !== 'fulfilled') {
        throw progressResult.reason;
      }

      setLesson(lessonResult.value.data);
      setProgress(progressResult.value.data);

      if (curriculumResult.status === 'fulfilled') {
        setCurriculum(curriculumResult.value.data);
      } else {
        setCurriculum(FALLBACK_CURRICULUM);
      }

      const firstVocab = (
        curriculumResult.status === 'fulfilled'
          ? curriculumResult.value.data?.tracks?.vocab?.[0]?.id
          : FALLBACK_CURRICULUM.tracks.vocab[0]?.id
      );
      if (firstVocab) {
        setSelectedLessonId(firstVocab);
      }
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
      title: 'Grammar',
      main: lesson.grammar?.pattern || 'No pattern',
      sub: lesson.grammar?.example || '',
      helper: 'Keep sentence short and clear.',
    };

    const sequence = lesson.sequence || [];
    if (sequence[0] === 'grammar') {
      return [grammarCard, ...wordCards];
    }
    return [...wordCards, ...phraseCards, grammarCard];
  }, [lesson]);

  const loadTrackLesson = async (track: Track, lessonId: string) => {
    setLoading(true);
    setError('');
    try {
      const lessonRes = await apiService.getFoundationTrackLesson(track, lessonId);
      setLesson(lessonRes.data);
      setSelectedTrack(track);
      setSelectedLessonId(lessonId);
      setCardIndex(0);
      setView('lesson');
    } catch (e: any) {
      if (isUnsupportedActionError(e)) {
        try {
          const fallbackLesson = await apiService.getFoundationLesson();
          setLesson(fallbackLesson.data);
          setSelectedTrack(track);
          setSelectedLessonId(lessonId);
          setCardIndex(0);
          setView('lesson');
          return;
        } catch (fallbackError: any) {
          setError(fallbackError?.response?.data?.message || fallbackError?.message || 'Cannot load this lesson now.');
          return;
        }
      }

      setError(e?.response?.data?.message || e?.message || 'Cannot load this lesson now.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Page>
        <Shell>
          <Card>
            <Title>English Foundation</Title>
            <Muted>Loading calm lesson...</Muted>
          </Card>
        </Shell>
      </Page>
    );
  }

  if (view === 'home') {
    const lexicalLevel = Math.min(1, (progress?.learned_words || 0) / 30);
    return (
      <Page>
        <Shell>
          <Hero>
            <HeroAccent />
            <HeroTitle>English Foundation</HeroTitle>
            <Muted>Build IELTS-ready confidence with one calm Grammar or Vocabulary lesson each day.</Muted>
            <HeroMeta>
              <Pill>Current level: {Math.round(lexicalLevel * 100)}%</Pill>
              <Pill>Goal: 1 focused lesson today</Pill>
              <Pill>Path: A1 to B1</Pill>
            </HeroMeta>
          </Hero>

          <Card>
            <SectionTitle>Choose Your Practice Focus</SectionTitle>
            <TwoCol>
              <TrackCard onClick={() => { setSelectedTrack('vocab'); setView('track'); }}>
                <strong>IELTS Vocabulary</strong>
                <Muted>Learn useful words, collocations, and short phrases for common IELTS topics.</Muted>
              </TrackCard>
              <TrackCard onClick={() => { setSelectedTrack('grammar'); setView('track'); }}>
                <strong>IELTS Grammar</strong>
                <Muted>Practice core grammar patterns to speak and write clear IELTS sentences.</Muted>
              </TrackCard>
            </TwoCol>

            <HomeButtons>
              <Button onClick={() => setView('track')}>Start lesson now</Button>
              <Button $ghost onClick={() => setView('progress')}>View learning progress</Button>
            </HomeButtons>

            {error ? <ErrorNote>{error}</ErrorNote> : null}
          </Card>
        </Shell>
      </Page>
    );
  }

  if (view === 'track') {
    const trackLessons = selectedTrack === 'grammar'
      ? (curriculum?.tracks?.grammar || [])
      : (curriculum?.tracks?.vocab || []);

    return (
      <Page>
        <Shell>
          <Card>
            <TrackHeading>
              <div>
                <SectionTitle>Track and Lesson Library</SectionTitle>
                <Muted>{curriculum?.framework || 'IELTS-aligned Grammar and Vocabulary path for Vietnamese learners'}</Muted>
              </div>

              <TrackTabs>
                <TrackTab $active={selectedTrack === 'vocab'} onClick={() => setSelectedTrack('vocab')}>
                  Vocabulary
                </TrackTab>
                <TrackTab $active={selectedTrack === 'grammar'} onClick={() => setSelectedTrack('grammar')}>
                  Grammar
                </TrackTab>
              </TrackTabs>
            </TrackHeading>

            <Grid>
              {trackLessons.map(item => (
                <LessonListButton
                  key={item.id}
                  onClick={() => void loadTrackLesson(selectedTrack, item.id)}
                >
                  <LessonTop>
                    <span>Lesson {item.order || '-'}</span>
                    <span>{item.level}</span>
                  </LessonTop>
                  <strong>{item.id} | {item.title}</strong>
                  <Muted>{item.focus}</Muted>
                  <Muted>{item.objective}</Muted>
                </LessonListButton>
              ))}
            </Grid>

            <Button $ghost onClick={() => setView('home')}>Back home</Button>
            {error ? <ErrorNote>{error}</ErrorNote> : null}
          </Card>
        </Shell>
      </Page>
    );
  }

  if (view === 'progress') {
    return (
      <Page>
        <Shell>
          <Card>
            <HeaderRow>
              <SectionTitle>Your Learning Progress</SectionTitle>
              <Pill>Keep going daily</Pill>
            </HeaderRow>
            <Muted>Small steady wins create long-term IELTS confidence.</Muted>

            <Grid>
              <StatItem>Learned words: <strong>{progress?.learned_words || 0}</strong></StatItem>
              <StatItem>Words to review: <strong>{progress?.weak_words || 0}</strong></StatItem>
              <StatItem>Grammar completion: <strong>{progress?.grammar_completed || 0}%</strong></StatItem>
            </Grid>

            <Button onClick={() => setView('home')}>Back home</Button>
          </Card>
        </Shell>
      </Page>
    );
  }

  const card = cards[cardIndex];
  const total = cards.length || 1;
  const progressPct = Math.round(((cardIndex + 1) / total) * 100);
  const isLast = cardIndex >= total - 1;

  return (
    <Page>
      <Shell>
        <Card>
          <HeaderRow>
            <SectionTitle>Lesson Flow</SectionTitle>
            <Pill>{selectedTrack === 'grammar' ? 'Grammar track' : 'Vocabulary track'}</Pill>
          </HeaderRow>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#355045' }}>
            <span>Progress</span>
            <span>{progressPct}%</span>
          </div>
          <ProgressTrack>
            <ProgressFill $pct={progressPct} />
          </ProgressTrack>

          {!!lesson?.lesson_meta?.id && (
            <Muted>
              {lesson.lesson_meta.id} | {lesson.lesson_meta.level} | {lesson.lesson_meta.title}
            </Muted>
          )}

          <LessonMain>
            <Badge>{card?.title || 'Lesson item'}</Badge>
            <Title style={{ fontSize: '30px', marginBottom: 8 }}>{card?.main || 'No item'}</Title>
            <Muted>{card?.sub || ''}</Muted>
            <Muted>{card?.helper || ''}</Muted>
          </LessonMain>

          <HomeButtons>
            <Button $ghost onClick={() => setView('track')}>Back to lessons</Button>
            <Button
              onClick={() => {
                if (isLast) {
                  setView('progress');
                  return;
                }
                setCardIndex(prev => prev + 1);
              }}
            >
              {isLast ? 'Finish lesson' : 'Next item'}
            </Button>
          </HomeButtons>
        </Card>
      </Shell>
    </Page>
  );
};

export default EnglishFoundationModule;
