import React, { useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { apiService } from '../services/apiService';
import { useFoundationReducer } from './english-foundation/useFoundationReducer';
import {
  LessonCard,
  LessonPayload,
  Track,
  VocabCheckAnswer,
  VocabCheckResult,
} from './english-foundation/types';

// ─── Styled components (shared design system) ────────────────────────────────

const Page = styled.div`
  min-height: 100vh;
  padding: 24px 16px 56px;
  font-family: 'Sora', 'Segoe UI', sans-serif;
  background:
    radial-gradient(circle at 16% 12%, rgba(255, 187, 106, 0.2), transparent 32%),
    radial-gradient(circle at 86% 4%, rgba(83, 202, 144, 0.2), transparent 30%),
    linear-gradient(165deg, #f6f9f7 0%, #f2f7f3 40%, #eef4f1 100%);
`;

const Shell = styled.div`max-width: 880px; margin: 0 auto;`;

const Hero = styled.div`
  position: relative; overflow: hidden; border-radius: 26px;
  padding: 28px; margin-bottom: 14px; border: 1px solid #d6e4da;
  background: linear-gradient(125deg, #fdf8ee 0%, #f2fbf5 52%, #ebf4ff 100%);
  box-shadow: 0 16px 34px rgba(45, 85, 56, 0.1);
  @media (max-width: 720px) { padding: 22px; }
`;
const HeroAccent = styled.div`
  position: absolute; width: 210px; height: 210px; border-radius: 999px;
  right: -56px; top: -74px;
  background: radial-gradient(circle, rgba(66,193,138,0.3), rgba(66,193,138,0));
  pointer-events: none;
`;
const Card = styled.section`
  max-width: 880px; margin: 0 auto 14px; background: #fff;
  border: 1px solid #d5e3d8; border-radius: 22px; padding: 24px;
  box-shadow: 0 12px 28px rgba(42, 84, 55, 0.08);
  @media (max-width: 720px) { padding: 18px; }
`;
const Title = styled.h1`margin: 0; color: #1f2f25; line-height: 1.2; letter-spacing: -0.02em;`;
const HeroTitle = styled(Title)`
  font-size: 40px; margin-bottom: 10px;
  @media (max-width: 720px) { font-size: 30px; }
`;
const Muted = styled.p`margin: 0; color: #5c6f61; line-height: 1.55;`;
const Pill = styled.div`
  display: inline-block; border: 1px solid #d4e2d7; border-radius: 999px;
  padding: 7px 12px; margin: 4px 8px 4px 0; font-weight: 700;
  background: #f9fdf9; color: #2f4437;
`;
const Button = styled.button<{ $ghost?: boolean }>`
  width: 100%; min-height: 52px; margin-top: 8px; border-radius: 13px;
  cursor: pointer; font-size: 16px; font-weight: 700;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  border: ${p => (p.$ghost ? '1px solid #d7e4d9' : '1px solid transparent')};
  color: ${p => (p.$ghost ? '#26382d' : '#fff')};
  background: ${p => (p.$ghost ? '#fff' : 'linear-gradient(92deg, #4fb675, #60c98a)')};
  &:hover { transform: translateY(-1px); box-shadow: 0 8px 18px rgba(46,110,69,0.16); }
`;
const HeaderRow = styled.div`
  display: flex; justify-content: space-between; gap: 10px;
  flex-wrap: wrap; align-items: center;
`;
const SectionTitle = styled.h2`margin: 0 0 12px; color: #1f2f25; font-size: 22px; letter-spacing: -0.01em;`;
const HeroMeta = styled.div`margin-top: 14px;`;
const HomeButtons = styled.div`
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 6px;
  @media (max-width: 720px) { grid-template-columns: 1fr; }
`;
const Grid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; margin: 12px 0;
`;
const TwoCol = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;
const TrackCard = styled.button`
  border: 1px solid #d5e3d8; border-radius: 16px; padding: 18px; background: #f9fdf9;
  text-align: left; cursor: pointer;
  &:hover { background: #f0faf4; }
`;
const TrackHeading = styled.div`
  display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 16px;
`;
const TrackTabs = styled.div`display: flex; gap: 8px;`;
const TrackTab = styled.button<{ $active?: boolean }>`
  padding: 8px 18px; border-radius: 10px; font-weight: 700; cursor: pointer;
  border: 1px solid ${p => (p.$active ? '#4fb675' : '#d5e3d8')};
  background: ${p => (p.$active ? '#effbf3' : '#fff')};
  color: ${p => (p.$active ? '#1e6a3b' : '#5c6f61')};
`;
const LessonListButton = styled.button`
  border: 1px solid #d6e3d8; border-radius: 14px; padding: 14px;
  background: linear-gradient(170deg, #ffffff, #f8fcf9); text-align: left; cursor: pointer;
  &:hover { border-color: #4fb675; }
`;
const LessonTop = styled.div`display: flex; justify-content: space-between; color: #6d8a72; font-size: 13px; margin-bottom: 4px;`;
const LessonMain = styled.div`
  border: 1px solid #d6e4da; border-radius: 18px; padding: 24px; margin: 16px 0;
  background: linear-gradient(170deg, #ffffff, #f4fcf7);
`;
const Badge = styled.div`
  display: inline-block; background: #4fb675; color: #fff; border-radius: 8px;
  padding: 4px 12px; font-weight: 700; font-size: 13px; margin-bottom: 10px;
`;
const ProgressTrack = styled.div`background: #e0ede5; border-radius: 999px; height: 6px; margin: 6px 0 14px;`;
const ProgressFill = styled.div<{ $pct: number }>`
  background: linear-gradient(92deg, #4fb675, #60c98a); border-radius: 999px;
  height: 6px; width: ${p => p.$pct}%;
`;
const StatItem = styled.div`
  border: 1px solid #d6e3d8; border-radius: 14px; padding: 14px;
  background: linear-gradient(170deg, #ffffff, #f8fcf9);
`;
const ErrorNote = styled.div`color: #9d2b2b; margin-top: 12px;`;
const CheckRow = styled.div`
  display: grid; grid-template-columns: 1fr auto auto; gap: 8px;
  align-items: center; border: 1px solid #d7e4d9; border-radius: 12px;
  padding: 10px 12px; background: #fff;
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;
const SmallButton = styled.button<{ $active?: boolean; $danger?: boolean }>`
  border: 1px solid ${p => (p.$active ? (p.$danger ? '#e48a8a' : '#7fcd95') : '#d6e3d8')};
  background: ${p => (p.$active ? (p.$danger ? '#fff0f0' : '#effbf3') : '#fff')};
  color: ${p => (p.$active ? (p.$danger ? '#963535' : '#1e6a3b') : '#355045')};
  border-radius: 10px; padding: 8px 10px; font-weight: 700; cursor: pointer;
`;
const GrammarExplain = styled.div`
  background: #f0fdf4; border: 1px solid #c3e6cb; border-radius: 12px;
  padding: 14px; margin-top: 12px;
`;

// ─── Main orchestrator component ─────────────────────────────────────────────

const EnglishFoundationModule: React.FC = () => {
  const [state, dispatch] = useFoundationReducer();
  const {
    view, lesson, progress, curriculum, selectedTrack, selectedLessonId,
    loading, error, cardIndex, checkAnswers, checkResult,
    grammarAnswer, grammarResult, reviewMode, reviewItems, reviewAnswers, reviewResult,
  } = state;

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadAll = async () => {
    dispatch({ type: 'LOAD_START' });
    try {
      const [lessonRes, progressRes, curriculumRes] = await Promise.all([
        apiService.getFoundationLesson(),
        apiService.getFoundationProgress(),
        apiService.getFoundationCurriculum(),
      ]);
      dispatch({
        type: 'LOAD_ALL_SUCCESS',
        lesson: lessonRes.data,
        progress: progressRes.data,
        curriculum: curriculumRes.data,
        firstLessonId: curriculumRes.data?.tracks?.vocab?.[0]?.id || '',
      });
    } catch (e: any) {
      dispatch({ type: 'LOAD_ERROR', error: e?.response?.data?.message || e?.message || 'Cannot load foundation lesson now.' });
    }
  };

  useEffect(() => { void loadAll(); }, []);

  // ── Lesson cards memo ─────────────────────────────────────────────────────

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
      helper: lesson.grammar?.explanation_vi || 'Keep sentence short and clear.',
    };
    const sequence = lesson.sequence || [];
    if (sequence[0] === 'grammar') return [grammarCard, ...wordCards];
    return [...wordCards, ...phraseCards, grammarCard];
  }, [lesson]);

  // ── API actions ───────────────────────────────────────────────────────────

  const loadTrackLesson = async (track: Track, lessonId: string) => {
    dispatch({ type: 'LOAD_START' });
    try {
      const res = await apiService.getFoundationTrackLesson(track, lessonId);
      dispatch({ type: 'LOAD_TRACK_SUCCESS', lesson: res.data as LessonPayload, track, lessonId });
    } catch (e: any) {
      dispatch({ type: 'LOAD_ERROR', error: e?.response?.data?.message || e?.message || 'Cannot load this lesson now.' });
    }
  };

  const submitVocabCheck = async () => {
    if (!lesson?.words?.length || !selectedLessonId) { dispatch({ type: 'SET_VIEW', view: 'progress' }); return; }
    const unanswered = lesson.words.filter(item => !Object.prototype.hasOwnProperty.call(checkAnswers, item.id));
    if (unanswered.length > 0) {
      dispatch({ type: 'LOAD_ERROR', error: `Please answer all words before submitting (${unanswered.length} left).` });
      return;
    }
    const answers: VocabCheckAnswer[] = lesson.words.map(item => ({ wordId: item.id, correct: Boolean(checkAnswers[item.id]) }));
    dispatch({ type: 'LOAD_START' });
    try {
      const res = await apiService.submitFoundationVocabCheck({ learnerId: 1, lessonId: selectedLessonId, answers });
      dispatch({ type: 'SET_CHECK_RESULT', result: res.data as VocabCheckResult });
      const progressRes = await apiService.getFoundationProgress();
      dispatch({ type: 'SET_PROGRESS', progress: progressRes.data });
      dispatch({ type: 'SET_VIEW', view: 'progress' });
    } catch (e: any) {
      dispatch({ type: 'LOAD_ERROR', error: e?.response?.data?.message || e?.message || 'Cannot submit vocab check now.' });
    }
  };

  const submitGrammarCheck = async () => {
    const grammarId = Number(lesson?.grammar?.id || 0);
    if (!selectedLessonId || !grammarId) {
      dispatch({ type: 'LOAD_ERROR', error: 'Grammar item is missing. Please reload.' });
      return;
    }
    if (grammarAnswer === null) {
      dispatch({ type: 'LOAD_ERROR', error: 'Please choose your grammar self-check result before submitting.' });
      return;
    }
    dispatch({ type: 'LOAD_START' });
    try {
      const res = await apiService.submitFoundationGrammarCheck({ learnerId: 1, lessonId: selectedLessonId, grammarId, correct: grammarAnswer });
      dispatch({ type: 'SET_GRAMMAR_RESULT', result: res.data });
      const progressRes = await apiService.getFoundationProgress();
      dispatch({ type: 'SET_PROGRESS', progress: progressRes.data });
      dispatch({ type: 'SET_VIEW', view: 'progress' });
    } catch (e: any) {
      dispatch({ type: 'LOAD_ERROR', error: e?.response?.data?.message || e?.message || 'Cannot submit grammar check now.' });
    }
  };

  const openReview = async () => {
    dispatch({ type: 'LOAD_START' });
    try {
      const res = await apiService.getFoundationReview(1, 12);
      const payload = res.data;
      dispatch({ type: 'SET_REVIEW_ITEMS', mode: payload?.mode || 'due', items: Array.isArray(payload?.items) ? payload.items : [] });
      dispatch({ type: 'SET_VIEW', view: 'review' });
    } catch (e: any) {
      dispatch({ type: 'LOAD_ERROR', error: e?.response?.data?.message || e?.message || 'Cannot load review queue now.' });
    }
  };

  const submitReview = async () => {
    if (!reviewItems.length) { dispatch({ type: 'SET_VIEW', view: 'progress' }); return; }
    const unanswered = reviewItems.filter(item => !Object.prototype.hasOwnProperty.call(reviewAnswers, item.id));
    if (unanswered.length > 0) {
      dispatch({ type: 'LOAD_ERROR', error: `Please answer all review items (${unanswered.length} left).` });
      return;
    }
    const answers: VocabCheckAnswer[] = reviewItems.map(item => ({ wordId: item.id, correct: Boolean(reviewAnswers[item.id]) }));
    dispatch({ type: 'LOAD_START' });
    try {
      const res = await apiService.submitFoundationReview({ learnerId: 1, answers });
      dispatch({ type: 'SET_REVIEW_RESULT', result: res.data as VocabCheckResult });
      const progressRes = await apiService.getFoundationProgress();
      dispatch({ type: 'SET_PROGRESS', progress: progressRes.data });
      dispatch({ type: 'SET_VIEW', view: 'progress' });
    } catch (e: any) {
      dispatch({ type: 'LOAD_ERROR', error: e?.response?.data?.message || e?.message || 'Cannot submit review now.' });
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Page><Shell><Card>
        <Title>English Foundation</Title>
        <Muted>Loading calm lesson...</Muted>
      </Card></Shell></Page>
    );
  }

  // ── Home view ─────────────────────────────────────────────────────────────

  if (view === 'home') {
    const lexicalLevel = Math.min(1, (progress?.learned_words || 0) / 30);
    return (
      <Page><Shell>
        <Hero>
          <HeroAccent />
          <HeroTitle>English Foundation</HeroTitle>
          <Muted>Build IELTS-ready confidence with one calm Grammar or Vocabulary lesson each day.</Muted>
          <HeroMeta>
            <Pill>Current level: {Math.round(lexicalLevel * 100)}%</Pill>
            <Pill>Goal: 1 focused lesson today</Pill>
            <Pill>Path: A1 to B1</Pill>
            <Pill>Due today: {progress?.due_today || 0}</Pill>
          </HeroMeta>
        </Hero>
        <Card>
          <SectionTitle>Choose Your Practice Focus</SectionTitle>
          <TwoCol>
            <TrackCard aria-label="Vocabulary track" onClick={() => { dispatch({ type: 'SET_TRACK', track: 'vocab' }); dispatch({ type: 'SET_VIEW', view: 'track' }); }}>
              <strong>IELTS Vocabulary</strong>
              <Muted>Learn useful words, collocations, and short phrases for common IELTS topics.</Muted>
            </TrackCard>
            <TrackCard aria-label="Grammar track" onClick={() => { dispatch({ type: 'SET_TRACK', track: 'grammar' }); dispatch({ type: 'SET_VIEW', view: 'track' }); }}>
              <strong>IELTS Grammar</strong>
              <Muted>Practice core grammar patterns to speak and write clear IELTS sentences.</Muted>
            </TrackCard>
          </TwoCol>
          <HomeButtons>
            <Button aria-label="Start lesson" onClick={() => dispatch({ type: 'SET_VIEW', view: 'track' })}>Start lesson now</Button>
            <Button $ghost aria-label="Open review" onClick={() => void openReview()}>Daily review ({progress?.due_today || 0})</Button>
            <Button $ghost aria-label="View progress" onClick={() => dispatch({ type: 'SET_VIEW', view: 'progress' })}>View learning progress</Button>
          </HomeButtons>
          {error ? <ErrorNote role="alert">{error}</ErrorNote> : null}
        </Card>
      </Shell></Page>
    );
  }

  // ── Track view ────────────────────────────────────────────────────────────

  if (view === 'track') {
    const trackLessons = selectedTrack === 'grammar'
      ? (curriculum?.tracks?.grammar || [])
      : (curriculum?.tracks?.vocab || []);
    return (
      <Page><Shell><Card>
        <TrackHeading>
          <div>
            <SectionTitle>Track and Lesson Library</SectionTitle>
            <Muted>{curriculum?.framework || 'IELTS-aligned Grammar and Vocabulary path'}</Muted>
          </div>
          <TrackTabs role="tablist">
            <TrackTab role="tab" aria-selected={selectedTrack === 'vocab'} $active={selectedTrack === 'vocab'} onClick={() => dispatch({ type: 'SET_TRACK', track: 'vocab' })}>Vocabulary</TrackTab>
            <TrackTab role="tab" aria-selected={selectedTrack === 'grammar'} $active={selectedTrack === 'grammar'} onClick={() => dispatch({ type: 'SET_TRACK', track: 'grammar' })}>Grammar</TrackTab>
          </TrackTabs>
        </TrackHeading>
        <Grid>
          {trackLessons.map(item => (
            <LessonListButton key={item.id} aria-label={`Lesson ${item.order}: ${item.title}`} onClick={() => void loadTrackLesson(selectedTrack, item.id)}>
              <LessonTop><span>Lesson {item.order || '-'}</span><span>{item.level}</span></LessonTop>
              <strong>{item.id} | {item.title}</strong>
              <Muted>{item.focus}</Muted>
              <Muted>{item.objective}</Muted>
            </LessonListButton>
          ))}
        </Grid>
        <Button $ghost onClick={() => dispatch({ type: 'SET_VIEW', view: 'home' })}>Back home</Button>
        {error ? <ErrorNote role="alert">{error}</ErrorNote> : null}
      </Card></Shell></Page>
    );
  }

  // ── Progress view ─────────────────────────────────────────────────────────

  if (view === 'progress') {
    return (
      <Page><Shell><Card>
        <HeaderRow>
          <SectionTitle>Your Learning Progress</SectionTitle>
          <Pill>Keep going daily</Pill>
        </HeaderRow>
        <Muted>Small steady wins create long-term IELTS confidence.</Muted>
        <Grid>
          <StatItem>Learned words: <strong>{progress?.learned_words || 0}</strong></StatItem>
          <StatItem>Words to review: <strong>{progress?.weak_words || 0}</strong></StatItem>
          <StatItem>Grammar completion: <strong>{progress?.grammar_completed || 0}%</strong></StatItem>
          <StatItem>Due today: <strong>{progress?.due_today || 0}</strong></StatItem>
        </Grid>
        {checkResult && (
          <Grid>
            <StatItem>Latest vocab score: <strong>{checkResult.score}%</strong></StatItem>
            <StatItem>Correct: <strong>{checkResult.correct}/{checkResult.total}</strong></StatItem>
            <StatItem>Recommendation: <strong>{checkResult.recommended_review}</strong></StatItem>
          </Grid>
        )}
        {reviewResult && (
          <Grid>
            <StatItem>Latest review score: <strong>{reviewResult.score}%</strong></StatItem>
            <StatItem>Review answers: <strong>{reviewResult.correct}/{reviewResult.total}</strong></StatItem>
            <StatItem>Next action: <strong>{reviewResult.recommended_next || 'new_lesson'}</strong></StatItem>
          </Grid>
        )}
        {grammarResult && (
          <Grid>
            <StatItem>Grammar check: <strong>{grammarResult.correct ? 'Understood' : 'Need more practice'}</strong></StatItem>
            <StatItem>Grammar level: <strong>{Math.round(grammarResult.grammar_level_before * 100)}% → {grammarResult.grammar_level_percent}%</strong></StatItem>
            <StatItem>Next action: <strong>{grammarResult.recommended_next}</strong></StatItem>
          </Grid>
        )}
        <HomeButtons>
          <Button onClick={() => void openReview()}>Start daily review</Button>
          <Button $ghost onClick={() => dispatch({ type: 'SET_VIEW', view: 'home' })}>Back home</Button>
        </HomeButtons>
      </Card></Shell></Page>
    );
  }

  // ── Review view ───────────────────────────────────────────────────────────

  if (view === 'review') {
    const answered = reviewItems.filter(item => Object.prototype.hasOwnProperty.call(reviewAnswers, item.id)).length;
    const modeLabel = reviewMode === 'due' ? 'Due items' : reviewMode === 'weak' ? 'Weak memory items' : 'Fresh vocabulary';
    return (
      <Page><Shell><Card>
        <HeaderRow>
          <SectionTitle>Daily Review Queue</SectionTitle>
          <Pill aria-live="polite">{answered}/{reviewItems.length} answered</Pill>
        </HeaderRow>
        <Muted>Mode: {modeLabel}. Mark quickly and let the schedule adapt to your memory.</Muted>
        <Grid>
          {reviewItems.map(item => (
            <CheckRow key={`review-${item.id}`} role="group" aria-label={item.word}>
              <div>
                <strong>{item.word}</strong> {item.ipa || ''}
                <Muted>{item.meaning_vi}</Muted>
                {!!item.topic_ielts && <Muted>Topic: {item.topic_ielts}</Muted>}
              </div>
              <SmallButton aria-label="Remembered" $active={reviewAnswers[item.id] === true}
                onClick={() => dispatch({ type: 'SET_REVIEW_ANSWER', itemId: item.id, correct: true })}>
                Remembered
              </SmallButton>
              <SmallButton aria-label="Not yet" $danger $active={reviewAnswers[item.id] === false}
                onClick={() => dispatch({ type: 'SET_REVIEW_ANSWER', itemId: item.id, correct: false })}>
                Not yet
              </SmallButton>
            </CheckRow>
          ))}
        </Grid>
        {!reviewItems.length && <Muted>No review items right now. Continue with a new lesson.</Muted>}
        <HomeButtons>
          <Button $ghost onClick={() => dispatch({ type: 'SET_VIEW', view: 'progress' })}>Back to progress</Button>
          <Button onClick={() => void submitReview()}>Submit daily review</Button>
        </HomeButtons>
        {error ? <ErrorNote role="alert">{error}</ErrorNote> : null}
      </Card></Shell></Page>
    );
  }

  // ── Vocab check view ──────────────────────────────────────────────────────

  if (view === 'vocab_check') {
    const words = lesson?.words || [];
    const answered = words.filter(item => Object.prototype.hasOwnProperty.call(checkAnswers, item.id)).length;
    return (
      <Page><Shell><Card>
        <HeaderRow>
          <SectionTitle>Quick Vocab Check</SectionTitle>
          <Pill aria-live="polite">{answered}/{words.length} answered</Pill>
        </HeaderRow>
        <Muted>Mark each word as remembered or not yet. We will adjust your progress.</Muted>
        <Grid>
          {words.map(item => (
            <CheckRow key={`check-${item.id}`} role="group" aria-label={item.word}>
              <div>
                <strong>{item.word}</strong> {item.ipa}
                <Muted>{item.meaning_vi}</Muted>
              </div>
              <SmallButton aria-label="Remembered" $active={checkAnswers[item.id] === true}
                onClick={() => dispatch({ type: 'SET_CHECK_ANSWER', wordId: item.id, correct: true })}>
                Remembered
              </SmallButton>
              <SmallButton aria-label="Not yet" $danger $active={checkAnswers[item.id] === false}
                onClick={() => dispatch({ type: 'SET_CHECK_ANSWER', wordId: item.id, correct: false })}>
                Not yet
              </SmallButton>
            </CheckRow>
          ))}
        </Grid>
        <HomeButtons>
          <Button $ghost onClick={() => dispatch({ type: 'SET_VIEW', view: 'lesson' })}>Back to lesson</Button>
          <Button onClick={() => void submitVocabCheck()}>Submit vocab check</Button>
        </HomeButtons>
        {!words.length && <Muted>No vocabulary items found. Please pick another vocab lesson.</Muted>}
        {error ? <ErrorNote role="alert">{error}</ErrorNote> : null}
      </Card></Shell></Page>
    );
  }

  // ── Grammar check view ────────────────────────────────────────────────────

  if (view === 'grammar_check') {
    const grammar = lesson?.grammar;
    return (
      <Page><Shell><Card>
        <HeaderRow>
          <SectionTitle>Quick Grammar Check</SectionTitle>
          <Pill>{grammarAnswer === null ? '0/1 answered' : '1/1 answered'}</Pill>
        </HeaderRow>
        <Muted>Can you use this grammar pattern correctly in your own sentence?</Muted>
        <LessonMain>
          <Badge>Grammar</Badge>
          <Title style={{ fontSize: '28px', marginBottom: 8 }}>{grammar?.pattern || 'No pattern'}</Title>
          <Muted>{grammar?.example || ''}</Muted>
          {grammar?.explanation_vi && (
            <GrammarExplain>
              <strong>📘 Giải thích:</strong> {grammar.explanation_vi}
            </GrammarExplain>
          )}
          {grammar?.usage_note && (
            <GrammarExplain>
              <strong>⚠️ Lưu ý:</strong> {grammar.usage_note}
            </GrammarExplain>
          )}
        </LessonMain>
        <Grid>
          <CheckRow role="group" aria-label="Grammar self-check">
            <div>
              <strong>Your self-check</strong>
              <Muted>Be honest. This helps the system adapt your next grammar lesson.</Muted>
            </div>
            <SmallButton aria-label="I can use it" $active={grammarAnswer === true}
              onClick={() => dispatch({ type: 'SET_GRAMMAR_ANSWER', answer: true })}>
              I can use it
            </SmallButton>
            <SmallButton aria-label="Need more practice" $danger $active={grammarAnswer === false}
              onClick={() => dispatch({ type: 'SET_GRAMMAR_ANSWER', answer: false })}>
              Need more practice
            </SmallButton>
          </CheckRow>
        </Grid>
        <HomeButtons>
          <Button $ghost onClick={() => dispatch({ type: 'SET_VIEW', view: 'lesson' })}>Back to lesson</Button>
          <Button onClick={() => void submitGrammarCheck()}>Submit grammar check</Button>
        </HomeButtons>
        {error ? <ErrorNote role="alert">{error}</ErrorNote> : null}
      </Card></Shell></Page>
    );
  }

  // ── Lesson flow view (default) ────────────────────────────────────────────

  const card = cards[cardIndex];
  const total = cards.length || 1;
  const progressPct = Math.round(((cardIndex + 1) / total) * 100);
  const isLast = cardIndex >= total - 1;

  return (
    <Page><Shell><Card>
      <HeaderRow>
        <SectionTitle>Lesson Flow</SectionTitle>
        <Pill>{selectedTrack === 'grammar' ? 'Grammar track' : 'Vocabulary track'}</Pill>
      </HeaderRow>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#355045' }}>
        <span>Progress</span><span>{progressPct}%</span>
      </div>
      <ProgressTrack role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
        <ProgressFill $pct={progressPct} />
      </ProgressTrack>
      {!!lesson?.lesson_meta?.id && (
        <Muted>{lesson.lesson_meta.id} | {lesson.lesson_meta.level} | {lesson.lesson_meta.title}</Muted>
      )}
      {!!lesson?.lesson_meta?.topic_ielts && <Pill>Topic: {lesson.lesson_meta.topic_ielts}</Pill>}
      <LessonMain aria-live="polite">
        <Badge>{card?.title || 'Lesson item'}</Badge>
        <Title style={{ fontSize: '30px', marginBottom: 8 }}>{card?.main || 'No item'}</Title>
        <Muted>{card?.sub || ''}</Muted>
        <Muted>{card?.helper || ''}</Muted>
      </LessonMain>
      <HomeButtons>
        <Button $ghost onClick={() => dispatch({ type: 'SET_VIEW', view: 'track' })}>Back to lessons</Button>
        <Button onClick={() => {
          if (isLast) {
            dispatch({ type: 'SET_VIEW', view: selectedTrack === 'vocab' ? 'vocab_check' : 'grammar_check' });
            return;
          }
          dispatch({ type: 'SET_CARD_INDEX', index: cardIndex + 1 });
        }}>
          {isLast ? 'Finish lesson' : 'Next item'}
        </Button>
      </HomeButtons>
    </Card></Shell></Page>
  );
};

export default EnglishFoundationModule;
