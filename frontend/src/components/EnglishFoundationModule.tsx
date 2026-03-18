import React, { useEffect, useMemo, useState } from 'react';
import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;
const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
`;
const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
`;
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
  padding: 30px 16px 60px;
  font-family: 'Sora', 'Segoe UI', system-ui, sans-serif;
  background:
    radial-gradient(circle at 10% 20%, rgba(255, 187, 106, 0.15), transparent 35%),
    radial-gradient(circle at 90% 10%, rgba(83, 202, 144, 0.15), transparent 35%),
    radial-gradient(circle at 50% 80%, rgba(135, 206, 235, 0.15), transparent 40%),
    linear-gradient(145deg, #f8fbf9 0%, #f1f7f4 40%, #eaeff1 100%);
`;

const Shell = styled.div`max-width: 880px; margin: 0 auto;`;

const Hero = styled.div`
  position: relative; overflow: hidden; border-radius: 28px;
  padding: 32px; margin-bottom: 20px;
  background: linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(242,251,245,0.6) 100%);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 16px 40px rgba(45, 85, 56, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.6);
  @media (max-width: 720px) { padding: 24px; }
`;
const HeroAccent = styled.div`
  position: absolute; width: 210px; height: 210px; border-radius: 999px;
  right: -56px; top: -74px;
  background: radial-gradient(circle, rgba(66,193,138,0.3), rgba(66,193,138,0));
  pointer-events: none;
`;
const Card = styled.section`
  max-width: 880px; margin: 0 auto 16px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 24px; padding: 28px;
  box-shadow: 0 12px 32px rgba(42, 84, 55, 0.04), 0 2px 8px rgba(0, 0, 0, 0.02);
  @media (max-width: 720px) { padding: 20px; }
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
  width: 100%; min-height: 54px; margin-top: 10px; border-radius: 16px;
  cursor: pointer; font-size: 16px; font-weight: 700;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: ${p => (p.$ghost ? '1px solid rgba(46, 110, 69, 0.15)' : '1px solid transparent')};
  color: ${p => (p.$ghost ? '#26382d' : '#fff')};
  background: ${p => (p.$ghost ? 'rgba(255, 255, 255, 0.8)' : 'linear-gradient(135deg, #4fb675 0%, #2f9a56 100%)')};
  box-shadow: ${p => (p.$ghost ? '0 4px 12px rgba(0,0,0,0.03)' : '0 8px 20px rgba(79, 182, 117, 0.25)')};
  backdrop-filter: blur(8px);
  
  &:hover { 
    transform: translateY(-2px) scale(1.02); 
    box-shadow: ${p => (p.$ghost ? '0 6px 16px rgba(0,0,0,0.06)' : '0 12px 28px rgba(79, 182, 117, 0.35)')};
  }
  &:active { transform: translateY(1px) scale(0.98); }
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
  border: 1px solid rgba(255, 255, 255, 0.9); border-radius: 20px; padding: 22px; 
  background: linear-gradient(145deg, rgba(255,255,255,0.9), rgba(248,252,249,0.7));
  text-align: left; cursor: pointer;
  box-shadow: 0 6px 16px rgba(42, 84, 55, 0.03);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  
  &:hover { 
    transform: translateY(-4px); 
    box-shadow: 0 12px 24px rgba(42, 84, 55, 0.08); 
    background: linear-gradient(145deg, rgba(255,255,255,1), rgba(240,250,244,0.9));
  }
  &:active { transform: translateY(0); }
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
const CheckRow = styled.div<{ $isCorrect?: boolean; $isWrong?: boolean }>`
  display: grid; grid-template-columns: 1fr auto auto; gap: 8px;
  align-items: center; border: 1px solid #d7e4d9; border-radius: 12px;
  padding: 10px 12px; background: #fff;
  animation: ${p => p.$isCorrect ? bounce : p.$isWrong ? shake : 'none'} 0.5s ease-out;
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;
const SmallButton = styled.button<{ $active?: boolean; $danger?: boolean }>`
  border: 1px solid ${p => (p.$active ? (p.$danger ? 'rgba(228,138,138,0.5)' : 'rgba(127,205,149,0.6)') : 'rgba(214,227,216,0.6)')};
  background: ${p => (p.$active ? (p.$danger ? 'linear-gradient(135deg, #fff0f0, #ffe5e5)' : 'linear-gradient(135deg, #effbf3, #e1f7e9)') : 'linear-gradient(135deg, #ffffff, #f9fcf9)')};
  color: ${p => (p.$active ? (p.$danger ? '#963535' : '#1e6a3b') : '#355045')};
  border-radius: 12px; padding: 10px 14px; font-weight: 700; cursor: pointer;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 2px 6px rgba(0,0,0,0.02);
  
  &:hover:not(:disabled) { 
    transform: translateY(-2px); 
    box-shadow: 0 6px 12px rgba(0,0,0,0.05); 
  }
  &:active:not(:disabled) { transform: translateY(0) scale(0.98); }
  &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
`;
const GrammarExplain = styled.div`
  background: #f0fdf4; border: 1px solid #c3e6cb; border-radius: 12px;
  padding: 14px; margin-top: 12px;
`;

// ─── Quiz components ─────────────────────────────────────────────────────────

const QuizBox = styled.div<{ $isCorrect?: boolean; $isWrong?: boolean }>`
  border: 1px solid rgba(215, 228, 217, 0.6); 
  border-radius: 16px; padding: 20px; 
  background: rgba(255, 255, 255, 0.85); 
  backdrop-filter: blur(8px);
  margin-bottom: 14px;
  box-shadow: 0 4px 12px rgba(42, 84, 55, 0.03);
  transition: all 0.3s ease;
  animation: ${p => p.$isCorrect ? bounce : p.$isWrong ? shake : 'none'} 0.5s ease-out;
  
  ${p => p.$isCorrect && `
    border-color: #8ce3a6;
    background: rgba(239, 251, 243, 0.9);
    box-shadow: 0 8px 20px rgba(79, 182, 117, 0.15);
  `}
  ${p => p.$isWrong && `
    border-color: #f1a9a9;
    background: rgba(255, 240, 240, 0.9);
  `}
`;
const MCQGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px;
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;
const MCQButton = styled.button<{ $selected?: boolean; $isCorrect?: boolean; $showCorrect?: boolean }>`
  border: 1px solid ${p => p.$selected ? (p.$isCorrect ? 'rgba(127,205,149,0.8)' : 'rgba(228,138,138,0.8)') : (p.$showCorrect ? 'rgba(127,205,149,0.8)' : 'rgba(214,227,216,0.6)')};
  background: ${p => p.$selected ? (p.$isCorrect ? 'linear-gradient(135deg, #effbf3, #e1f7e9)' : 'linear-gradient(135deg, #fff0f0, #ffe5e5)') : (p.$showCorrect ? 'linear-gradient(135deg, #effbf3, #e1f7e9)' : 'linear-gradient(135deg, #ffffff, #f9fcf9)')};
  color: ${p => p.$selected ? (p.$isCorrect ? '#1e6a3b' : '#963535') : (p.$showCorrect ? '#1e6a3b' : '#355045')};
  border-radius: 14px; padding: 14px; font-weight: 600; cursor: pointer; text-align: left;
  transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 4px 10px rgba(0,0,0,0.02);
  
  &:hover:not(:disabled) { 
    transform: translateY(-3px); 
    box-shadow: 0 8px 16px rgba(0,0,0,0.06); 
    border-color: rgba(79, 182, 117, 0.4);
  }
  &:active:not(:disabled) { transform: translateY(1px); }
  &:disabled { cursor: not-allowed; }
`;
const BlankInput = styled.input`
  border: 1px solid #d6e3d8; border-radius: 8px; padding: 8px 12px;
  font-family: inherit; font-size: 16px; width: 100%; margin-top: 8px;
  &:focus { outline: none; border-color: #4fb675; }
  &:disabled { background: #f8fcf9; color: #5c6f61; }
`;

const BuilderWord = styled.button<{ $isUsed?: boolean }>`
  background: ${p => p.$isUsed ? '#eef4f1' : '#fff'};
  border: 1px solid ${p => p.$isUsed ? '#d5e3d8' : '#60c98a'};
  color: ${p => p.$isUsed ? '#5c6f61' : '#1e6a3b'};
  border-radius: 10px; padding: 10px 16px; font-weight: 700; font-size: 16px;
  cursor: ${p => p.$isUsed ? 'default' : 'pointer'};
  box-shadow: ${p => p.$isUsed ? 'none' : '0 4px 6px rgba(46,110,69,0.08)'};
  opacity: ${p => p.$isUsed ? 0.3 : 1};
  transition: transform 0.1s;
  &:active { transform: ${p => p.$isUsed ? 'none' : 'scale(0.95)'}; }
`;

const BuilderDropzone = styled.div<{ $isSuccess?: boolean; $isError?: boolean }>`
  min-height: 60px; border: 2px dashed ${p => p.$isSuccess ? '#7fcd95' : p.$isError ? '#e48a8a' : '#b7d1c1'};
  border-radius: 14px; padding: 12px; display: flex; flex-wrap: wrap; gap: 8px;
  background: ${p => p.$isSuccess ? '#effbf3' : p.$isError ? '#fff0f0' : '#fcfdfc'};
  margin-bottom: 20px; align-items: center; transition: all 0.2s;
`;

const AudioBtn = styled.button`
  background: none; border: none; cursor: pointer; color: #4fb675;
  padding: 6px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
  margin-left: 6px; transition: background 0.2s, transform 0.1s;
  &:hover { background: #effbf3; transform: scale(1.05); }
  &:active { transform: scale(0.95); }
  svg { width: 20px; height: 20px; fill: currentColor; }
`;

const AudioIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
  </svg>
);

const playAudio = (text: string, rate: number = 0.9) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = rate; // slightly slower for learners
  window.speechSynthesis.speak(utterance);
};

const PosBadge = styled.span`
  display: inline-block; background: #eef4ff; color: #4a6fa5;
  border: 1px solid #c3d4e9; border-radius: 6px; padding: 2px 7px;
  font-size: 11px; font-weight: 700; margin-left: 8px; letter-spacing: 0.02em;
  vertical-align: middle; text-transform: lowercase;
`;

const StreakBadge = styled(Pill)`
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%);
  color: #c92a2a;
  border-color: #ff9a9e;
  font-weight: bold;
  animation: ${pulse} 2s infinite ease-in-out;
`;

// Simple beep sounds using Web Audio API
const playBeep = (type: 'correct' | 'incorrect') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    // Ignore if audio context fails
  }
};

const ReviewItemCard: React.FC<{ item: any; answer?: boolean; onAnswer: (correct: boolean) => void }> = ({ item, answer, onAnswer }) => {
  const [blankValue, setBlankValue] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  const isAnswered = answer !== undefined;

  const handleAnswer = (correct: boolean) => {
    playBeep(correct ? 'correct' : 'incorrect');
    onAnswer(correct);
  };

  if (item.quiz_type === 'multiple_choice') {
    return (
      <QuizBox $isCorrect={isAnswered && answer} $isWrong={isAnswered && !answer}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <strong>{item.word}</strong> <span style={{ marginLeft: 6 }}>{item.ipa}</span>
          {item.part_of_speech && <PosBadge>{item.part_of_speech}</PosBadge>}
          <AudioBtn onClick={(e) => { e.stopPropagation(); playAudio(item.word); }} aria-label="Play pronunciation" title="Play audio">
            <AudioIcon />
          </AudioBtn>
        </div>
        <Muted>Choose the correct meaning:</Muted>
        <MCQGrid>
          {item.options?.map((opt: string) => {
            const isThisSelected = selectedOption === opt;
            const isThisCorrect = opt === item.meaning_vi;
            return (
              <MCQButton 
                key={opt}
                disabled={isAnswered}
                $selected={isThisSelected}
                $isCorrect={isThisCorrect}
                $showCorrect={isAnswered && isThisCorrect}
                onClick={() => {
                  setSelectedOption(opt);
                  handleAnswer(opt === item.meaning_vi);
                }}
              >
                {opt}
              </MCQButton>
            );
          })}
        </MCQGrid>
      </QuizBox>
    );
  }

  if (item.quiz_type === 'fill_blank') {
    const maskedObj = (item.example_sentence || '').replace(new RegExp(item.word, 'gi'), '_______');
    return (
      <QuizBox $isCorrect={isAnswered && answer} $isWrong={isAnswered && !answer}>
        <div><strong>Fill in the blank:</strong></div>
        <Muted>{maskedObj}</Muted>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <BlankInput 
            disabled={isAnswered}
            placeholder={`Type ${item.meaning_vi} in English...`} 
            value={blankValue} 
            onChange={(e) => setBlankValue(e.target.value)} 
          />
          <SmallButton 
            disabled={isAnswered || !blankValue.trim()} 
            onClick={() => handleAnswer(blankValue.trim().toLowerCase() === item.word.toLowerCase())}
          >
            Check
          </SmallButton>
        </div>
        {isAnswered && answer && <Muted style={{color: '#1e6a3b', marginTop: 8}}>Correct! ({item.word})</Muted>}
        {isAnswered && !answer && <Muted style={{color: '#963535', marginTop: 8}}>Incorrect. The right word is: {item.word}</Muted>}
      </QuizBox>
    );
  }

  if (item.quiz_type === 'sentence_write') {
    return (
      <QuizBox $isCorrect={isAnswered && answer} $isWrong={isAnswered && !answer}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <strong>Write a sentence using: {item.word}</strong> <span style={{ marginLeft: 6 }}>{item.ipa}</span>
          {item.part_of_speech && <PosBadge>{item.part_of_speech}</PosBadge>}
        </div>
        <Muted>Meaning: {item.meaning_vi}</Muted>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexDirection: 'column' }}>
          <textarea 
            disabled={isAnswered}
            placeholder={`E.g., ${item.example_sentence}`}
            value={blankValue} 
            onChange={(e) => setBlankValue(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d0d7e5', minHeight: '60px', fontFamily: 'inherit', resize: 'vertical' }}
          />
          <SmallButton 
            disabled={isAnswered || !blankValue.trim()} 
            onClick={() => {
              const userSentence = blankValue.trim().toLowerCase();
              const targetWord = item.word.toLowerCase();
              // Rudimentary check: does the sentence contain the target word?
              const isCorrect = userSentence.includes(targetWord) && userSentence.length > targetWord.length + 5;
              handleAnswer(isCorrect);
            }}
            style={{ alignSelf: 'flex-start' }}
          >
            Submit Sentence
          </SmallButton>
        </div>
        {isAnswered && answer && <Muted style={{color: '#1e6a3b', marginTop: 8}}>Great job using the word in context!</Muted>}
        {isAnswered && !answer && <Muted style={{color: '#963535', marginTop: 8}}>Make sure to use the exact word "{item.word}" and write a full sentence.</Muted>}
      </QuizBox>
    );
  }

  // Fallback to flashcard checkrow
  return (
    <CheckRow $isCorrect={isAnswered && answer} $isWrong={isAnswered && !answer} role="group" aria-label={item.word}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <strong>{item.word}</strong> <span style={{ marginLeft: 6 }}>{item.ipa || ''}</span>
          {item.part_of_speech && <PosBadge>{item.part_of_speech}</PosBadge>}
          <AudioBtn onClick={(e) => { e.stopPropagation(); playAudio(item.word); }} aria-label="Play pronunciation" title="Play audio">
            <AudioIcon />
          </AudioBtn>
        </div>
        <Muted>{item.meaning_vi}</Muted>
        {!!item.topic_ielts && <Muted>Topic: {item.topic_ielts}</Muted>}
      </div>
      <SmallButton aria-label="Remembered" $active={answer === true} onClick={() => handleAnswer(true)}>Remembered</SmallButton>
      <SmallButton aria-label="Not yet" $danger $active={answer === false} onClick={() => handleAnswer(false)}>Not yet</SmallButton>
    </CheckRow>
  );
};

const GrammarSentenceBuilder: React.FC<{ sentence: string; onComplete: (correct: boolean) => void }> = ({ sentence, onComplete }) => {
  const [pool, setPool] = useState<{id: string, word: string}[]>([]);
  const [constructed, setConstructed] = useState<{id: string, word: string}[]>([]);
  const [hasChecked, setHasChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    // Strip punctuation at the end and split
    const cleanSentence = sentence.trim();
    const words = cleanSentence.split(/\s+/).filter(Boolean);
    const initialPool = words.map((w, i) => ({ id: `w-${i}-${Math.random()}`, word: w }));
    // Shuffle pool
    for (let i = initialPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [initialPool[i], initialPool[j]] = [initialPool[j], initialPool[i]];
    }
    setPool(initialPool);
    setConstructed([]);
    setHasChecked(false);
    setIsCorrect(false);
  }, [sentence]);

  const handlePoolClick = (item: {id: string, word: string}) => {
    if (hasChecked) return;
    if (constructed.some(x => x.id === item.id)) return;
    setConstructed(prev => [...prev, item]);
  };

  const handleConstructedClick = (item: {id: string, word: string}) => {
    if (hasChecked) return;
    setConstructed(prev => prev.filter(x => x.id !== item.id));
  };

  const handleCheck = () => {
    const userSentence = constructed.map(x => x.word).join(' ');
    // We compare ignoring trailing punctuation and case to be slightly forgiving, but for grammar, exact sequence is key.
    const normalize = (s: string) => s.replace(/[.,!?]+$/, '').toLowerCase().trim();
    const correct = normalize(userSentence) === normalize(sentence);
    playBeep(correct ? 'correct' : 'incorrect');
    setIsCorrect(correct);
    setHasChecked(true);
    onComplete(correct);
  };

  const handleReset = () => {
    setConstructed([]);
    setHasChecked(false);
    setIsCorrect(false);
    onComplete(false); // Reset answer
  };

  return (
    <QuizBox $isCorrect={hasChecked && isCorrect} $isWrong={hasChecked && !isCorrect}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <strong>Form the correct sentence:</strong>
        <AudioBtn style={{ marginLeft: 8 }} onClick={() => playAudio(sentence)} aria-label="Play pronunciation" title="Play audio">
          <AudioIcon />
        </AudioBtn>
      </div>
      <BuilderDropzone $isSuccess={hasChecked && isCorrect} $isError={hasChecked && !isCorrect}>
        {constructed.length === 0 && <Muted style={{ opacity: 0.5 }}>Tap words below to build...</Muted>}
        {constructed.map(item => (
          <BuilderWord key={`c-${item.id}`} onClick={() => handleConstructedClick(item)}>
            {item.word}
          </BuilderWord>
        ))}
      </BuilderDropzone>
      
      {!hasChecked && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          {pool.map(item => {
            const isUsed = constructed.some(x => x.id === item.id);
            return (
              <BuilderWord key={`p-${item.id}`} $isUsed={isUsed} onClick={() => handlePoolClick(item)}>
                {item.word}
              </BuilderWord>
            );
          })}
        </div>
      )}

      {hasChecked && isCorrect && <Muted style={{color: '#1e6a3b', fontWeight: 600}}>Perfect! That is structurally correct.</Muted>}
      {hasChecked && !isCorrect && (
        <div>
          <Muted style={{color: '#963535', fontWeight: 600, marginBottom: 8}}>Incorrect structure.</Muted>
          <Muted><strong>Correct answer:</strong> {sentence}</Muted>
          <Button $ghost style={{marginTop: 12, padding: '8px 16px', minHeight: 'auto'}} onClick={handleReset}>Try Again</Button>
        </div>
      )}

      {!hasChecked && (
        <Button 
          style={{ padding: '12px', minHeight: 'auto', marginTop: 8 }} 
          disabled={constructed.length !== pool.length}
          onClick={handleCheck}
        >
          Check Answer
        </Button>
      )}
    </QuizBox>
  );
};

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
      helper: `${w.collocation} | ${w.example_sentence}${w.synonyms ? ` | Synonyms: ${w.synonyms}` : ''}`,
      audioText: w.word,
    }));
    const phraseCards = (lesson.phrases || []).map(p => ({
      key: `p-${p.id}`,
      title: 'Phrase',
      main: p.phrase,
      sub: p.meaning_vi,
      helper: 'Say one short sentence with this phrase.',
      audioText: p.phrase,
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
            <Pill>Level: {Math.round(lexicalLevel * 100)}%</Pill>
            <Pill>Due today: {progress?.due_today || 0}</Pill>
            {(progress?.curr_streak ?? 0) > 0 ? (
              <StreakBadge>🔥 {progress?.curr_streak} Day Streak!</StreakBadge>
            ) : (
              <Pill style={{ opacity: 0.7 }} title="Complete a lesson to start your streak!">🔥 Let's start a Streak!</Pill>
            )}
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
            <Button 
              aria-label="Start lesson" 
              onClick={() => dispatch({ type: 'SET_VIEW', view: 'track' })}
              disabled={(progress?.due_today || 0) > 10}
              style={{ opacity: (progress?.due_today || 0) > 10 ? 0.6 : 1, cursor: (progress?.due_today || 0) > 10 ? 'not-allowed' : 'pointer' }}
            >
              {(progress?.due_today || 0) > 10 ? 'Clear Reviews to Unlock' : 'Start lesson now'}
            </Button>
            <Button 
              $ghost 
              aria-label="Open review" 
              onClick={() => void openReview()}
              style={{
                background: (progress?.due_today || 0) > 10 ? 'linear-gradient(135deg, #fff0f0, #ffe5e5)' : undefined,
                borderColor: (progress?.due_today || 0) > 10 ? 'rgba(228,138,138,0.5)' : undefined,
                color: (progress?.due_today || 0) > 10 ? '#963535' : undefined,
              }}
            >
              Daily review ({progress?.due_today || 0}) {(progress?.due_today || 0) > 10 && '⚠️'}
            </Button>
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
        
        <div style={{ marginTop: 16 }}>
          {reviewItems.map(item => (
            <ReviewItemCard 
              key={`review-${item.id}`} 
              item={item} 
              answer={reviewAnswers[item.id]} 
              onAnswer={(correct) => dispatch({ type: 'SET_REVIEW_ANSWER', itemId: item.id, correct })} 
            />
          ))}
        </div>

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
        
        <div style={{ marginTop: 16 }}>
          {words.map(item => (
            <ReviewItemCard 
              key={`check-${item.id}`} 
              item={{ ...item, quiz_type: 'flashcard' }} 
              answer={checkAnswers[item.id]} 
              onAnswer={(correct) => dispatch({ type: 'SET_CHECK_ANSWER', wordId: item.id, correct })} 
            />
          ))}
        </div>

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
        <Muted>Reconstruct the example sentence using the target grammar pattern.</Muted>
        <LessonMain>
          <Badge>Grammar Pattern</Badge>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Title style={{ fontSize: '28px', margin: '0 0 8px' }}>{grammar?.pattern || 'No pattern'}</Title>
          </div>
          <Muted>{grammar?.explanation_vi && (
            <GrammarExplain style={{ marginTop: 0 }}>
              <strong>📘 Giải thích:</strong> {grammar.explanation_vi}
            </GrammarExplain>
          )}</Muted>
          {grammar?.usage_note && (
            <GrammarExplain>
              <strong>⚠️ Lưu ý:</strong> {grammar.usage_note}
            </GrammarExplain>
          )}
        </LessonMain>
        <div style={{ margin: '20px 0' }}>
          {grammar?.example ? (
             <GrammarSentenceBuilder 
               sentence={grammar.example} 
               onComplete={(correct) => dispatch({ type: 'SET_GRAMMAR_ANSWER', answer: correct })} 
             />
          ) : (
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
          )}
        </div>
        <HomeButtons>
          <Button $ghost onClick={() => dispatch({ type: 'SET_VIEW', view: 'lesson' })}>Back to lesson</Button>
          <Button disabled={grammarAnswer === null} onClick={() => void submitGrammarCheck()}>Submit grammar check</Button>
        </HomeButtons>
        {error ? <ErrorNote role="alert">{error}</ErrorNote> : null}
      </Card></Shell></Page>
    );
  }

  // ── Lesson flow view (default) ────────────────────────────────────────────

  if (lesson?.is_locked) {
    return (
      <Page><Shell><Card>
        <HeaderRow>
          <SectionTitle>Lesson Locked</SectionTitle>
          <Pill>Too many weak words</Pill>
        </HeaderRow>
        <LessonMain style={{ background: '#fff0f0', borderColor: '#e48a8a' }}>
          <Badge style={{ background: '#d64545' }}>Locked</Badge>
          <Title style={{ fontSize: '28px', marginBottom: 8 }}>Review required!</Title>
          <Muted>{lesson.lock_reason}</Muted>
          <Muted style={{ marginTop: 8 }}>
            Our adaptive system ensures you master your current vocabulary before moving on. This prevents memory overload and builds confidence.
          </Muted>
        </LessonMain>
        <HomeButtons>
          <Button onClick={() => void openReview()}>Start daily review now</Button>
          <Button $ghost onClick={() => dispatch({ type: 'SET_VIEW', view: 'track' })}>Back to tracks</Button>
        </HomeButtons>
      </Card></Shell></Page>
    );
  }

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
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Title style={{ fontSize: '30px', margin: '0 0 8px' }}>{card?.main || 'No item'}</Title>
          {card?.audioText && (
            <AudioBtn style={{ marginBottom: 8 }} onClick={() => playAudio(card.audioText!)} aria-label="Play pronunciation" title="Play audio">
              <AudioIcon />
            </AudioBtn>
          )}
        </div>
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
