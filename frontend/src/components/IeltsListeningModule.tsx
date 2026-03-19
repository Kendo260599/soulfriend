import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { apiService } from '../services/apiService';

// --- Shared Types ---
export interface ListeningQuestion {
  id: number;
  question_num: number;
  question_type: string;
  prompt: string;
  timestamp_hint?: number;
}

export interface ListeningSection {
  id: number;
  part_num: number;
  title: string;
  context_description?: string;
  audio_url?: string;
  audio_script?: string;
  duration_seconds?: number;
  questions: ListeningQuestion[];
}

export interface ListeningVerifyResult {
  total: number;
  correct: number;
  band_estimate: number | null;
  results: { question_id: number; is_correct: boolean }[];
}

// --- Styled Components (Glassmorphism & Modern UI) ---
const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Page = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #eef2f5 100%);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 20px;
  font-family: 'Inter', -apple-system, sans-serif;
  color: #2c3e50;
`;

const Shell = styled.div`
  max-width: 800px;
  width: 100%;
  animation: ${slideUp} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 24px;
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255,255,255,0.8);
  padding: 48px;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  padding-bottom: 24px;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Pill = styled.span`
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(17, 153, 142, 0.3);
`;

const Muted = styled.p`
  color: #7f8c8d;
  font-size: 15px;
  line-height: 1.6;
  margin: 0;
`;

const Button = styled.button<{ $ghost?: boolean; $danger?: boolean; $active?: boolean }>`
  background: ${p => p.$ghost ? 'rgba(255,255,255,0.6)' : p.$danger ? 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)' : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'};
  color: ${p => p.$ghost ? '#34495e' : '#fff'};
  border: 1px solid ${p => p.$ghost ? 'rgba(0,0,0,0.1)' : 'transparent'};
  padding: 14px 28px;
  border-radius: 14px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: ${p => p.$ghost ? 'none' : '0 8px 16px rgba(79, 172, 254, 0.3)'};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  ${p => p.$active && `
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    color: white;
    box-shadow: 0 8px 16px rgba(17, 153, 142, 0.3);
    border: none;
  `}

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${p => p.$ghost ? '0 4px 12px rgba(0,0,0,0.05)' : '0 12px 20px rgba(79, 172, 254, 0.4)'};
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const TrackCard = styled.div`
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255,255,255,0.8);
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);

  &:hover {
    transform: translateY(-4px);
    background: white;
    box-shadow: 0 12px 24px rgba(0,0,0,0.06);
  }

  h3 { margin: 0 0 8px; color: #2c3e50; }
`;

const AudioControlPanel = styled.div`
  background: #fdfdfd;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
`;

const AudioRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const ProgressTrack = styled.div`
  flex: 1;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
`;

const ProgressBar = styled.div<{ $progress: number }>`
  position: absolute;
  top: 0; left: 0; bottom: 0;
  width: ${p => p.$progress}%;
  background: linear-gradient(90deg, #4facfe, #00f2fe);
  transition: width 0.1s linear;
`;

const SpeedControls = styled.div`
  display: flex;
  gap: 8px;
`;

const FormBlockContainer = styled.div`
  background: #fff;
  border: 1px solid #e1e4e8;
  border-radius: 12px;
  padding: 32px;
  font-family: 'Times New Roman', Times, serif; /* Make it look like a real exam paper */
  position: relative;
`;

const ExamTitle = styled.h3`
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 2px solid #2c3e50;
  padding-bottom: 12px;
  margin-top: 0;
`;

const QuestionRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 18px;
`;

const QuestionNumber = styled.span`
  font-weight: bold;
  margin-right: 12px;
  min-width: 30px;
`;

const AnswerInput = styled.input<{ $isCorrect?: boolean; $isWrong?: boolean }>`
  border: none;
  border-bottom: 1px solid #2c3e50;
  background: transparent;
  padding: 4px 8px;
  font-size: 18px;
  font-family: inherit;
  width: 200px;
  margin-left: 8px;
  outline: none;
  font-weight: bold;
  color: ${p => p.$isCorrect ? '#11998e' : p.$isWrong ? '#ff416c' : '#2c3e50'};

  &:focus {
    border-bottom: 2px solid #4facfe;
    background: rgba(79, 172, 254, 0.05);
  }

  &:disabled {
    background: transparent;
    cursor: default;
  }
`;

const ErrorNote = styled.div`
  background: rgba(255, 65, 108, 0.1);
  color: #ff416c;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  border: 1px solid rgba(255, 65, 108, 0.2);
`;

export default function IeltsListeningModule() {
  const [view, setView] = useState<'home' | 'list' | 'exam' | 'result'>('home');
  const [part, setPart] = useState<number>(1);
  const [sections, setSections] = useState<ListeningSection[]>([]);
  const [currentSection, setCurrentSection] = useState<ListeningSection | null>(null);
  
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<ListeningVerifyResult | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  const loadSections = async (partNum: number) => {
    setLoading(true); setError(null);
    try {
      const res = await apiService.getListeningSections(partNum);
      setSections(res.data.sections || []);
      setPart(partNum);
      setView('list');
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || 'Cannot load sections');
    } finally {
      setLoading(false);
    }
  };

  const loadExam = async (sectionId: number) => {
    setLoading(true); setError(null);
    try {
      const res = await apiService.getListeningSectionDetails(sectionId);
      setCurrentSection(res.data);
      setAnswers({});
      setResult(null);
      setProgress(0);
      setIsPlaying(false);
      setView('exam');
      // Assume audio_url points to public folder or mock
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = res.data.audio_url || '';
        audioRef.current.load();
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Cannot load exam');
    } finally {
      setLoading(false);
    }
  };

  const submitExam = async () => {
    if (!currentSection) return;
    setLoading(true); setError(null);
    const payload = Object.keys(answers).map(k => ({
      question_id: Number(k),
      answer: answers[Number(k)]
    }));

    try {
      const res = await apiService.verifyListeningAnswers({ answers: payload });
      setResult(res.data);
      setView('result');
      if (audioRef.current) audioRef.current.pause();
    } catch(e: any) {
      setError(e?.response?.data?.error || 'Submit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (!audioRef.current) return;
    const p = (audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100;
    setProgress(p);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setProgress(100);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      void audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  if (view === 'home') {
    return (
      <Page><Shell><Card>
        <HeaderRow>
          <div>
            <SectionTitle>IELTS Listening Hub</SectionTitle>
            <Muted>Master academic listening skills</Muted>
          </div>
          <Pill>Band 5.0 Targeted</Pill>
        </HeaderRow>
        <Muted>Select a section to begin. Part 1 and 2 are the easiest ways to secure your foundational Band 5.0 score.</Muted>
        <Grid>
          <TrackCard onClick={() => loadSections(1)}>
            <h3>Part 1: Conversational Form</h3>
            <Muted>Everyday social context (e.g. booking a hotel, opening a bank account).</Muted>
          </TrackCard>
          <TrackCard onClick={() => loadSections(2)} style={{ opacity: 0.6 }}>
            <h3>Part 2: Monologue (Locked)</h3>
            <Muted>Everyday social context (e.g. a speech about local facilities).</Muted>
          </TrackCard>
        </Grid>
        {loading && <Muted>Loading...</Muted>}
        {error && <ErrorNote>{error}</ErrorNote>}
      </Card></Shell></Page>
    );
  }

  if (view === 'list') {
    return (
      <Page><Shell><Card>
        <HeaderRow>
          <SectionTitle>Listening Part {part}</SectionTitle>
          <Button $ghost onClick={() => setView('home')}>Back</Button>
        </HeaderRow>
        <Grid>
          {sections.length === 0 && <Muted>No lessons available for this part yet.</Muted>}
          {sections.map(s => (
            <TrackCard key={s.id} onClick={() => loadExam(s.id)}>
              <Pill style={{marginBottom: 12, display: 'inline-block'}}>{s.duration_seconds !== undefined && s.duration_seconds !== null ? `${Math.floor(s.duration_seconds/60)}:${(s.duration_seconds%60).toString().padStart(2, '0')}` : 'Audio length unknown'}</Pill>
              <h3>{s.title}</h3>
              <Muted>{s.context_description}</Muted>
            </TrackCard>
          ))}
        </Grid>
      </Card></Shell></Page>
    );
  }

  if (view === 'exam' && currentSection) {
    return (
      <Page><Shell><Card>
        <HeaderRow>
          <div>
            <SectionTitle>{currentSection.title}</SectionTitle>
            <Muted>{currentSection.context_description}</Muted>
          </div>
          <Button $ghost onClick={() => { if(audioRef.current) audioRef.current.pause(); setView('list'); }}>Cancel</Button>
        </HeaderRow>

        <AudioControlPanel>
          <audio 
            ref={audioRef} 
            src={currentSection.audio_url} 
            onTimeUpdate={handleAudioTimeUpdate} 
            onEnded={handleAudioEnded} 
          />
          <AudioRow>
            <Button onClick={togglePlay} style={{ padding: '8px 16px', borderRadius: '50%' }}>
              {isPlaying ? '⏸' : '▶'}
            </Button>
            <ProgressTrack>
              <ProgressBar $progress={progress} />
            </ProgressTrack>
            <span style={{ fontSize: 13, fontWeight: 'bold' }}>
               {audioRef.current ? Math.floor(audioRef.current.currentTime) : 0}s 
            </span>
          </AudioRow>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <Muted style={{fontSize: 13}}>Adjust listening speed:</Muted>
            <SpeedControls>
              <Button $ghost={speed !== 0.75} $active={speed === 0.75} onClick={() => setSpeed(0.75)} style={{padding: '4px 12px', fontSize: 12}}>0.75x</Button>
              <Button $ghost={speed !== 1.0} $active={speed === 1.0} onClick={() => setSpeed(1.0)} style={{padding: '4px 12px', fontSize: 12}}>1.0x</Button>
              <Button $ghost={speed !== 1.25} $active={speed === 1.25} onClick={() => setSpeed(1.25)} style={{padding: '4px 12px', fontSize: 12}}>1.25x</Button>
            </SpeedControls>
          </div>
        </AudioControlPanel>

        <FormBlockContainer>
          <ExamTitle>Booking Form</ExamTitle>
          <Muted style={{marginBottom: 24, fontStyle: 'italic'}}>Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.</Muted>
          
          {currentSection.questions.map(q => (
            <QuestionRow key={q.id}>
              <QuestionNumber>{q.question_num}.</QuestionNumber>
              <span>{q.prompt}</span>
              <AnswerInput 
                value={answers[q.id] || ''} 
                onChange={e => setAnswers({...answers, [q.id]: e.target.value})}
                placeholder="Type answer..."
                spellCheck={false}
              />
            </QuestionRow>
          ))}
        </FormBlockContainer>

        {error && <ErrorNote>{error}</ErrorNote>}
        <Button onClick={submitExam} disabled={loading}>{loading ? 'Submitting...' : 'Submit Answers'}</Button>
      </Card></Shell></Page>
    );
  }

  if (view === 'result' && result && currentSection) {
    const isPass = (result.band_estimate || 0) >= 5.0;
    return (
      <Page><Shell><Card>
         <HeaderRow>
          <SectionTitle>Listening Result</SectionTitle>
          <Pill style={{ background: isPass ? undefined : 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)' }}>
            {isPass ? 'Band 5.0+ Passed' : 'Needs Practice'}
          </Pill>
        </HeaderRow>
        
        <Grid>
          <TrackCard>
            <h3 style={{fontSize: 36, color: '#11998e'}}>{result.correct}/{result.total}</h3>
            <Muted>Correct Answers</Muted>
          </TrackCard>
          <TrackCard>
            <h3 style={{fontSize: 36, color: '#4facfe'}}>{result.band_estimate ? result.band_estimate.toFixed(1) : 'N/A'}</h3>
            <Muted>Estimated Band Score</Muted>
          </TrackCard>
        </Grid>

        <FormBlockContainer>
          <ExamTitle>Answer Review</ExamTitle>
          {currentSection.questions.map(q => {
            const resRecord = result.results.find(r => r.question_id === q.id);
            const isCorrect = resRecord?.is_correct || false;
            return (
               <QuestionRow key={q.id}>
                <QuestionNumber>{q.question_num}.</QuestionNumber>
                <span>{q.prompt}</span>
                <AnswerInput 
                  value={answers[q.id] || '--- no answer ---'} 
                  disabled
                  $isCorrect={isCorrect}
                  $isWrong={!isCorrect}
                />
                {!isCorrect && <span style={{marginLeft: 12, color: '#ff416c', fontWeight: 'bold'}}>✗</span>}
                {isCorrect && <span style={{marginLeft: 12, color: '#11998e', fontWeight: 'bold'}}>✓</span>}
              </QuestionRow>
            );
          })}
        </FormBlockContainer>
        
        <div style={{display: 'flex', gap: 16}}>
           <Button onClick={() => loadExam(currentSection.id)}>Retry Module</Button>
           <Button $ghost onClick={() => setView('list')}>Back to Lessons</Button>
        </div>
      </Card></Shell></Page>
    );
  }

  return null;
}
