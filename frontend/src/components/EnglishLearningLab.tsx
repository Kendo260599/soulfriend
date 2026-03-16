import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { apiService } from '../services/apiService';
import {
  DEFAULT_PROGRESS,
  normalizeHistory,
  normalizeProgress,
  normalizePronunciationResult,
  type HistoryItem,
  type ProgressState,
  type PronunciationState,
} from './englishLabPayload';

type WordItem = {
  word: string;
  meaningVi: string;
};

type QuizState = {
  item: WordItem;
  choices: string[];
};

type Phase2FlowState = {
  stage: 'foundation' | 'phrase' | 'grammar';
  phraseUnlocked: boolean;
  grammarUnlocked: boolean;
  thresholds: {
    phraseUnlockMin: number;
    grammarUnlockMin: number;
  };
  signals: {
    lexicalLevel: number;
    grammarReadinessProxy: number;
    unlockedSkills: number;
  };
};

type Phase2HomePreviewState = {
  phraseCount: number;
  grammarCount: number;
  phraseLocked: boolean;
  grammarLocked: boolean;
  topPhrases: Array<{ sourceWord: string; phrase: string }>;
  topGrammar: Array<{ pattern: string; exampleSentence: string }>;
};

const STORAGE_HISTORY_KEY = 'lexical.frontend.pronunciationHistory';
const STORAGE_USER_KEY = 'lexical.frontend.userId';
const EMPTY_QUIZ: QuizState = {
  item: { word: '', meaningVi: '' },
  choices: [],
};

const DEFAULT_PHASE2_FLOW: Phase2FlowState = {
  stage: 'foundation',
  phraseUnlocked: false,
  grammarUnlocked: false,
  thresholds: {
    phraseUnlockMin: 0.45,
    grammarUnlockMin: 0.5,
  },
  signals: {
    lexicalLevel: 0,
    grammarReadinessProxy: 0,
    unlockedSkills: 0,
  },
};

const DEFAULT_PHASE2_HOME_PREVIEW: Phase2HomePreviewState = {
  phraseCount: 0,
  grammarCount: 0,
  phraseLocked: true,
  grammarLocked: true,
  topPhrases: [],
  topGrammar: [],
};

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% { background-position: -300px 0; }
  100% { background-position: 300px 0; }
`;

const Page = styled.div`
  min-height: 100vh;
  background:
    radial-gradient(circle at 10% 8%, #f7d8be 0%, transparent 28%),
    radial-gradient(circle at 92% 12%, #bee9df 0%, transparent 24%),
    radial-gradient(circle at 80% 88%, #f9d0cf 0%, transparent 30%),
    linear-gradient(140deg, #fff4ec 0%, #fdf9f2 52%, #eef7f6 100%);
  padding: 1.8rem;
  font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif;
`;

const Wrap = styled.div`
  max-width: 1180px;
  margin: 0 auto;
`;

const Header = styled.header`
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 1rem;
  align-items: end;
  margin-bottom: 1rem;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Hero = styled.div`
  animation: ${fadeIn} 400ms ease;
`;

const Title = styled.h1`
  font-family: 'Sora', 'IBM Plex Sans', sans-serif;
  font-size: 2.2rem;
  letter-spacing: -0.03em;
  color: #1e2a37;
  margin: 0 0 0.4rem 0;
`;

const SubTitle = styled.p`
  color: #5a6878;
  margin: 0 0 1rem 0;
`;

const Ribbon = styled.div`
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
`;

const Chip = styled.span<{ $tone?: 'info' | 'warn' | 'ok' }>`
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.36rem 0.7rem;
  border-radius: 999px;
  letter-spacing: 0.01em;
  color: ${p => (p.$tone === 'warn' ? '#7a4e1f' : p.$tone === 'ok' ? '#184e36' : '#1d3d63')};
  background: ${p => (p.$tone === 'warn' ? '#ffe7c9' : p.$tone === 'ok' ? '#d8f1e5' : '#dcecff')};
  border: 1px solid ${p => (p.$tone === 'warn' ? '#f4cb95' : p.$tone === 'ok' ? '#b4dfcb' : '#c0d8f3')};
`;

const ActionPane = styled.div`
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(34, 53, 78, 0.1);
  border-radius: 16px;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  animation: ${fadeIn} 500ms ease;
`;

const ActionTitle = styled.div`
  font-weight: 700;
  font-size: 0.93rem;
  color: #28425e;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 1rem;

  @media (max-width: 950px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.section`
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(36, 48, 66, 0.08);
  border-radius: 18px;
  padding: 1rem;
  box-shadow: 0 8px 24px rgba(36, 48, 66, 0.07);
  animation: ${fadeIn} 550ms ease;
`;

const CardTitle = styled.h2`
  font-family: 'Sora', 'IBM Plex Sans', sans-serif;
  margin: 0 0 0.8rem 0;
  color: #243042;
  font-size: 1.2rem;
`;

const Word = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1f3a5a;
  margin-bottom: 0.6rem;
`;

const Meta = styled.div`
  color: #627289;
  font-size: 0.95rem;
  margin-bottom: 0.8rem;
`;

const Phase2Panel = styled(Card)`
  margin-bottom: 1rem;
  background: linear-gradient(145deg, rgba(232, 242, 255, 0.95) 0%, rgba(241, 250, 251, 0.95) 100%);
  border-color: #c8dbf2;
`;

const Phase2Top = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  flex-wrap: wrap;
  margin-bottom: 0.45rem;
`;

const ProgressRail = styled.div`
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: #dce7f4;
  overflow: hidden;
  border: 1px solid #bdd1e8;
`;

const ProgressValue = styled.div<{ $pct: number; $tone?: 'blue' | 'green' }>`
  width: ${p => `${Math.max(0, Math.min(100, p.$pct))}%`};
  height: 100%;
  background: ${p => (p.$tone === 'green' ? 'linear-gradient(90deg, #3f945f 0%, #71b88c 100%)' : 'linear-gradient(90deg, #2a6ba1 0%, #66a6d8 100%)')};
  transition: width 260ms ease;
`;

const RailRow = styled.div`
  margin-top: 0.52rem;
`;

const RailLabel = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  color: #4f6782;
  font-size: 0.82rem;
  margin-bottom: 0.25rem;
`;

const Row = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const RowTopMd = styled(Row)`
  margin-top: 0.8rem;
`;

const RowTopSm = styled(Row)`
  margin-top: 0.7rem;
`;

const RowTopXs = styled(Row)`
  margin-top: 0.5rem;
`;

const BlockTopSm = styled.div`
  margin-top: 0.7rem;
`;

const Button = styled.button`
  border: none;
  border-radius: 10px;
  padding: 0.6rem 0.9rem;
  background: linear-gradient(135deg, #2a6598 0%, #376f9e 100%);
  color: #ffffff;
  cursor: pointer;
  font-weight: 600;

  &:hover {
    opacity: 0.92;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
`;

const ChoiceButton = styled(Button)<{ $isCorrect?: boolean; $isWrong?: boolean }>`
  background: ${props => (props.$isCorrect ? '#2e8b57' : props.$isWrong ? '#b33636' : '#e9f0f8')};
  color: ${props => (props.$isCorrect || props.$isWrong ? '#ffffff' : '#22364f')};
  border: 1px solid ${props => (props.$isCorrect ? '#2e8b57' : props.$isWrong ? '#b33636' : '#c8d6e6')};
  text-align: left;
  width: calc(50% - 0.25rem);

  @media (max-width: 600px) {
    width: 100%;
  }
`;

const RetryButton = styled(Button)`
  background: linear-gradient(135deg, #7c4b1a 0%, #946127 100%);
`;

const GhostButton = styled(Button)`
  background: #eef4fb;
  color: #244566;
  border: 1px solid #cadaeb;
`;

const Small = styled.div`
  color: #607287;
  font-size: 0.88rem;
`;

const SmallTop = styled(Small)`
  margin-top: 0.5rem;
`;

const Phase2Banner = styled.div`
  margin: 0.7rem 0 1rem 0;
  padding: 0.7rem 0.9rem;
  background: #f1f7ff;
  border: 1px solid #cfe0f5;
  border-radius: 12px;
`;

const StageBadge = styled.span<{ $stage: 'foundation' | 'phrase' | 'grammar' }>`
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 700;
  border-radius: 999px;
  padding: 0.22rem 0.56rem;
  color: #fff;
  background: ${props => (
    props.$stage === 'grammar' ? '#226f43'
    : props.$stage === 'phrase' ? '#1f5c8a'
    : '#7a4e1f'
  )};
`;

const MiniList = styled.ul`
  margin: 0.35rem 0 0 1rem;
  padding: 0;
`;

const MiniItem = styled.li`
  color: #445a70;
  font-size: 0.84rem;
  line-height: 1.35;
  margin: 0.18rem 0;
`;

const Score = styled.div<{ $positive?: boolean }>`
  margin-top: 0.6rem;
  font-weight: 700;
  color: ${props => (props.$positive ? '#226f43' : '#8b2d2d')};
`;

const SoftDivider = styled.div`
  margin-top: 0.7rem;
  border-top: 1px dashed #d0dce8;
`;

const Input = styled.input`
  width: 100%;
  border: 1px solid #c8d6e6;
  border-radius: 10px;
  padding: 0.6rem;
  font-size: 0.95rem;
  color: #243042;
`;

const StatBox = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
  margin-top: 0.8rem;
`;

const Loader = styled.div`
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(90deg, #edf2f9 0%, #d5e3f4 50%, #edf2f9 100%);
  background-size: 600px 100%;
  animation: ${shimmer} 1.2s linear infinite;
`;

const AlertBox = styled.div`
  margin-top: 0.8rem;
  border-radius: 12px;
  background: #fff1e8;
  border: 1px solid #f0c5aa;
  color: #7b3f1f;
  padding: 0.65rem 0.75rem;
`;

const Kpi = styled.div`
  background: #f2f8ff;
  border: 1px solid #d5e5f6;
  border-radius: 12px;
  padding: 0.6rem;
`;

const HistoryList = styled.div`
  max-height: 260px;
  overflow: auto;
  margin-top: 0.6rem;
  border-top: 1px dashed #c8d6e6;
  padding-top: 0.6rem;
`;

const HistoryRow = styled.div`
  font-size: 0.88rem;
  color: #31465d;
  padding: 0.3rem 0;
`;

const Empty = styled.div`
  margin-top: 0.65rem;
  color: #6c7d91;
  font-size: 0.9rem;
`;

const EnglishLearningLab: React.FC = () => {
  const [quiz, setQuiz] = useState<QuizState>(EMPTY_QUIZ);
  const [selected, setSelected] = useState<string>('');
  const [quizMessage, setQuizMessage] = useState<string>('');
  const [micReady, setMicReady] = useState<boolean>(false);
  const [manualText, setManualText] = useState<string>('');
  const [pronResult, setPronResult] = useState<PronunciationState | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);
  const [isBackendRecording, setIsBackendRecording] = useState<boolean>(false);
  const [bridgeStatus, setBridgeStatus] = useState<string>('');
  const [userId, setUserId] = useState<string>('anonymous');
  const [practiceTarget, setPracticeTarget] = useState<string>('');
  const [remoteProgress, setRemoteProgress] = useState<ProgressState>(DEFAULT_PROGRESS);
  const [phase2Flow, setPhase2Flow] = useState<Phase2FlowState>(DEFAULT_PHASE2_FLOW);
  const [phase2HomePreview, setPhase2HomePreview] = useState<Phase2HomePreviewState>(DEFAULT_PHASE2_HOME_PREVIEW);
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>('');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const applyProgress = (prog: any) => {
    setRemoteProgress(normalizeProgress(prog));
  };

  const applyHistory = (remoteHistory: any) => {
    const normalized = normalizeHistory(remoteHistory);
    setHistory(normalized);
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(normalized));
  };

  const applyPronunciationResult = (remoteResult: any) => {
    const normalized = normalizePronunciationResult(remoteResult);
    if (normalized) {
      setPronResult(normalized);
    }
  };

  const normalizePhase2Flow = (raw: any): Phase2FlowState => {
    if (!raw || typeof raw !== 'object') {
      return { ...DEFAULT_PHASE2_FLOW };
    }

    const stageRaw = String(raw.stage || '').toLowerCase();
    const stage: 'foundation' | 'phrase' | 'grammar' =
      stageRaw === 'grammar' ? 'grammar' : stageRaw === 'phrase' ? 'phrase' : 'foundation';

    return {
      stage,
      phraseUnlocked: Boolean(raw.phraseUnlocked),
      grammarUnlocked: Boolean(raw.grammarUnlocked),
      thresholds: {
        phraseUnlockMin: Number(raw?.thresholds?.phraseUnlockMin || 0.45),
        grammarUnlockMin: Number(raw?.thresholds?.grammarUnlockMin || 0.5),
      },
      signals: {
        lexicalLevel: Number(raw?.signals?.lexicalLevel || 0),
        grammarReadinessProxy: Number(raw?.signals?.grammarReadinessProxy || 0),
        unlockedSkills: Number(raw?.signals?.unlockedSkills || 0),
      },
    };
  };

  const stageLabel = (stage: 'foundation' | 'phrase' | 'grammar'): string => {
    if (stage === 'grammar') return 'Grammar';
    if (stage === 'phrase') return 'Phrase';
    return 'Foundation';
  };

  const fetchPhase2Pair = async (targetUserId: string, retries = 1) => {
    let lastError: unknown = null;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const [statusRes, homeRes] = await Promise.all([
          apiService.getEnglishLabPhase2Status(targetUserId),
          apiService.getEnglishLabPhase2Home(targetUserId),
        ]);
        return { statusRes, homeRes };
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  };

  const refreshAll = async (targetUserId: string) => {
    setLoadError('');
    try {
      const [quizRes, progressRes, historyRes] = await Promise.all([
        apiService.getEnglishLabNextQuiz(targetUserId),
        apiService.getEnglishLabProgress(targetUserId),
        apiService.getEnglishLabHistory(targetUserId, 20),
      ]);
      const { statusRes: phase2Res, homeRes: phase2HomeRes } = await fetchPhase2Pair(targetUserId, 1);

      const remoteQuiz = quizRes.data?.data;
      if (remoteQuiz?.item && Array.isArray(remoteQuiz?.choices)) {
        setQuiz({ item: remoteQuiz.item, choices: remoteQuiz.choices });
        setPracticeTarget(String(remoteQuiz.item.word || ''));
      }

      applyProgress(progressRes.data?.data?.progress);
      applyHistory(historyRes.data?.data?.history);
      setPhase2Flow(normalizePhase2Flow(phase2Res.data?.data?.phase2Flow));
      setPhase2HomePreview(normalizePhase2HomePreview(phase2HomeRes.data?.data?.phase2Home));
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Không thể tải dữ liệu canonical từ backend.';
      setBridgeStatus(msg);
      setLoadError(msg);
    }
  };

  const normalizePhase2HomePreview = (raw: any): Phase2HomePreviewState => {
    if (!raw || typeof raw !== 'object') {
      return { ...DEFAULT_PHASE2_HOME_PREVIEW };
    }

    const phraseItems = Array.isArray(raw?.phrasePack?.items) ? raw.phrasePack.items : [];
    const grammarItems = Array.isArray(raw?.grammarPack?.items) ? raw.grammarPack.items : [];
    const phraseLocked = Boolean(raw?.phrasePack?.summary?.locked);
    const grammarLocked = Boolean(raw?.grammarPack?.summary?.locked);
    const topPhrases = phraseItems.slice(0, 3).map((item: any) => ({
      sourceWord: String(item?.sourceWord || ''),
      phrase: String(item?.phrase || ''),
    }));
    const topGrammar = grammarItems.slice(0, 3).map((item: any) => ({
      pattern: String(item?.pattern || ''),
      exampleSentence: String(item?.exampleSentence || ''),
    }));

    return {
      phraseCount: phraseItems.length,
      grammarCount: grammarItems.length,
      phraseLocked,
      grammarLocked,
      topPhrases,
      topGrammar,
    };
  };

  const refreshPhase2Status = async (targetUserId: string) => {
    try {
      const { statusRes, homeRes } = await fetchPhase2Pair(targetUserId, 1);
      const flow = normalizePhase2Flow(statusRes.data?.data?.phase2Flow);
      const preview = normalizePhase2HomePreview(homeRes.data?.data?.phase2Home);
      setPhase2Flow(flow);
      setPhase2HomePreview(preview);
    } catch {
      // Keep current UI state when phase2 status endpoint is temporarily unavailable.
    }
  };

  useEffect(() => {
    const existingUserId = localStorage.getItem(STORAGE_USER_KEY);
    const finalUserId = existingUserId || `user-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(STORAGE_USER_KEY, finalUserId);
    setUserId(finalUserId);

    const bootstrapRemote = async () => {
      setIsBootstrapping(true);
      await refreshAll(finalUserId);
      setIsBootstrapping(false);
    };

    void bootstrapRemote();
  }, []);

  const handleAnswer = (choice: string) => {
    if (selected || !quiz.item.word) return;

    setSelected(choice);
    const syncRemote = async () => {
      try {
        const res = await apiService.submitEnglishLabQuizAnswer({
          userId,
          word: quiz.item.word,
          selectedMeaning: choice,
        });

        const message = String(res.data?.data?.message || '');
        if (message) setQuizMessage(message);
        applyProgress(res.data?.data?.progress);
        await refreshPhase2Status(userId);
      } catch (error: any) {
        setBridgeStatus(error?.response?.data?.message || 'Không thể gửi câu trả lời canonical.');
      }
    };

    void syncRemote();
  };

  const nextQuiz = () => {
    setSelected('');
    setQuizMessage('');

    const fetchRemoteNext = async () => {
      try {
        const res = await apiService.getEnglishLabNextQuiz(userId);
        const payload = res.data?.data;
        if (payload?.item && Array.isArray(payload?.choices)) {
          setQuiz({ item: payload.item, choices: payload.choices });
          setPracticeTarget(String(payload.item.word || ''));
        }
        applyProgress(payload?.progress);
        await refreshPhase2Status(userId);
      } catch (error: any) {
        setBridgeStatus(error?.response?.data?.message || 'Không thể tải quiz canonical tiếp theo.');
      }
    };

    void fetchRemoteNext();
  };

  const speakWord = (rate: number) => {
    if (!window.speechSynthesis) return;
    const target = practiceTarget || quiz.item.word;
    const utter = new SpeechSynthesisUtterance(target);
    utter.lang = 'en-US';
    utter.rate = rate;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  const enableMicrophone = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicReady(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setMicReady(true);
    } catch {
      setMicReady(false);
    }
  };

  const savePronunciationResult = (recognized: string) => {
    const syncRemote = async () => {
      try {
        const targetWord = (practiceTarget || quiz.item.word || '').trim();
        if (!targetWord) {
          setBridgeStatus('Chưa có target để chấm pronunciation.');
          return;
        }
        const res = await apiService.scoreEnglishLabPronunciation({
          userId,
          targetWord,
          recognizedText: recognized,
        });

        const remoteResult = res.data?.data?.result;
        applyPronunciationResult(remoteResult);

        applyHistory(res.data?.data?.history);
        applyProgress(res.data?.data?.progress);
        await refreshPhase2Status(userId);
      } catch (error: any) {
        setBridgeStatus(error?.response?.data?.message || 'Không thể chấm pronunciation canonical.');
      }
    };

    void syncRemote();
  };

  const startRecognition = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsRecognizing(true);
    recognition.onresult = (event: any) => {
      const text = event?.results?.[0]?.[0]?.transcript ?? '';
      setManualText(text);
      savePronunciationResult(text);
    };
    recognition.onerror = () => {
      setIsRecognizing(false);
    };
    recognition.onend = () => {
      setIsRecognizing(false);
    };
    recognition.start();
  };

  const stopBackendRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder) {
      setIsBackendRecording(false);
      return;
    }

    if (recorder.state !== 'inactive') {
      recorder.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startBackendRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setBridgeStatus('Trình duyệt không hỗ trợ MediaRecorder/getUserMedia.');
      return;
    }

    try {
      const targetWord = (practiceTarget || quiz.item.word || '').trim();
      if (!targetWord) {
        setBridgeStatus('Chưa có target để ghi âm/chấm điểm.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setIsBackendRecording(false);
        setBridgeStatus('Ghi âm backend bị lỗi. Vui lòng thử lại.');
      };

      recorder.onstop = async () => {
        setIsBackendRecording(false);

        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];

        if (audioBlob.size <= 0) {
          setBridgeStatus('Không thu được dữ liệu âm thanh.');
          return;
        }

        setBridgeStatus('Đang gửi audio tới Python worker...');

        try {
          const res = await apiService.transcribeAndScoreEnglishLab({
            userId,
            targetWord,
            audioBlob,
            model: 'base',
            language: 'en',
          });

          const remoteResult = res.data?.data?.result;
          const normalizedResult = normalizePronunciationResult(remoteResult);
          if (normalizedResult) {
            setPronResult(normalizedResult);
            setManualText(String(remoteResult.recognized || ''));
          }

          const remoteHistory = res.data?.data?.history;
          applyHistory(remoteHistory);
          applyProgress(res.data?.data?.progress);
          await refreshPhase2Status(userId);

          const transcribed = String(res.data?.data?.transcription?.text || '');
          setBridgeStatus(`Bridge OK: ${transcribed || '(rỗng)'}`);
        } catch (error: any) {
          const msg = error?.response?.data?.message || 'Bridge transcription thất bại.';
          setBridgeStatus(msg);
        }
      };

      recorder.start();
      setIsBackendRecording(true);
      setBridgeStatus('Đang ghi âm cho backend bridge...');
    } catch {
      setBridgeStatus('Không thể truy cập microphone để ghi âm backend.');
      setIsBackendRecording(false);
    }
  };

  const useManualInput = () => {
    savePronunciationResult(manualText);
  };

  const lexicalPct = useMemo(() => {
    const raw = (phase2Flow.signals.lexicalLevel / Math.max(phase2Flow.thresholds.phraseUnlockMin, 0.01)) * 100;
    return Math.max(0, Math.min(100, raw));
  }, [phase2Flow]);

  const grammarPct = useMemo(() => {
    const raw = (phase2Flow.signals.grammarReadinessProxy / Math.max(phase2Flow.thresholds.grammarUnlockMin, 0.01)) * 100;
    return Math.max(0, Math.min(100, raw));
  }, [phase2Flow]);

  const handleRetryBootstrap = () => {
    if (!userId) return;
    setIsBootstrapping(true);
    void refreshAll(userId).finally(() => setIsBootstrapping(false));
  };

  const hasQuiz = Boolean(quiz.item.word && quiz.choices.length > 0);

  const renderQuizBody = () => {
    if (isBootstrapping) {
      return (
        <>
          <Loader />
          <SmallTop>Đang tải quiz canonical...</SmallTop>
        </>
      );
    }

    if (!hasQuiz) {
      return (
        <>
          <Empty>Hiện chưa có câu hỏi khả dụng. Bạn bấm tải lại để đồng bộ dữ liệu mới nhất.</Empty>
          <RowTopSm>
            <RetryButton onClick={handleRetryBootstrap}>Tải lại dữ liệu học</RetryButton>
          </RowTopSm>
        </>
      );
    }

    return (
      <>
        <Word>{quiz.item.word}</Word>
        <Meta>Chọn nghĩa tiếng Việt đúng nhất.</Meta>

        <Row>
          {quiz.choices.map(choice => (
            <ChoiceButton
              key={choice}
              onClick={() => handleAnswer(choice)}
              $isCorrect={selected === choice && choice === quiz.item.meaningVi}
              $isWrong={selected === choice && choice !== quiz.item.meaningVi}
            >
              {choice}
            </ChoiceButton>
          ))}
        </Row>

        <Score $positive={quizMessage.startsWith('Đúng')}>{quizMessage}</Score>
      </>
    );
  };

  return (
    <Page>
      <Wrap>
        <Header>
          <Hero>
            <Title>English Learning Lab</Title>
            <SubTitle>
              Học theo nhịp cá nhân với quiz, phát âm, và phase-based progression. Mọi trạng thái đều đồng bộ từ canonical backend.
            </SubTitle>
            <Ribbon>
              <Chip $tone="info">User: {userId}</Chip>
              <Chip $tone={phase2Flow.phraseUnlocked ? 'ok' : 'warn'}>
                Phrase {phase2Flow.phraseUnlocked ? 'Unlocked' : 'Locked'}
              </Chip>
              <Chip $tone={phase2Flow.grammarUnlocked ? 'ok' : 'warn'}>
                Grammar {phase2Flow.grammarUnlocked ? 'Unlocked' : 'Locked'}
              </Chip>
            </Ribbon>
          </Hero>

          <ActionPane>
            <ActionTitle>Điều khiển nhanh</ActionTitle>
            <ActionRow>
              <Button onClick={handleRetryBootstrap}>Đồng bộ toàn bộ</Button>
              <GhostButton onClick={() => void refreshPhase2Status(userId)}>Sync Phase 2</GhostButton>
            </ActionRow>
            <Small>Bridge status: {bridgeStatus || 'ổn định'}</Small>
          </ActionPane>
        </Header>

        <Phase2Panel>
          <Phase2Top>
            <Small>
              Phase-2 Canonical Stage: <StageBadge $stage={phase2Flow.stage}>{stageLabel(phase2Flow.stage)}</StageBadge>
            </Small>
            <Small>
              Phrase pack: {phase2HomePreview.phraseCount} {phase2HomePreview.phraseLocked ? '(locked)' : '(ready)'}
              {' | '}Grammar pack: {phase2HomePreview.grammarCount} {phase2HomePreview.grammarLocked ? '(locked)' : '(ready)'}
            </Small>
          </Phase2Top>

          <RailRow>
            <RailLabel>
              <span>lexicalLevel</span>
              <span>{phase2Flow.signals.lexicalLevel.toFixed(2)} / {phase2Flow.thresholds.phraseUnlockMin.toFixed(2)}</span>
            </RailLabel>
            <ProgressRail>
              <ProgressValue $pct={lexicalPct} />
            </ProgressRail>
          </RailRow>

          <RailRow>
            <RailLabel>
              <span>grammarReadiness</span>
              <span>{phase2Flow.signals.grammarReadinessProxy.toFixed(2)} / {phase2Flow.thresholds.grammarUnlockMin.toFixed(2)}</span>
            </RailLabel>
            <ProgressRail>
              <ProgressValue $pct={grammarPct} $tone="green" />
            </ProgressRail>
          </RailRow>

          {phase2HomePreview.topPhrases.length > 0 && (
            <>
              <Small>Top phrase drills:</Small>
              <MiniList>
                {phase2HomePreview.topPhrases.map(item => (
                  <MiniItem key={`${item.sourceWord}:${item.phrase}`}>
                    {item.sourceWord}: {item.phrase}
                  </MiniItem>
                ))}
              </MiniList>
              {phase2Flow.phraseUnlocked ? (
                <RowTopXs>
                  {phase2HomePreview.topPhrases.map(item => (
                    <Button key={`practice-${item.sourceWord}-${item.phrase}`} onClick={() => setPracticeTarget(item.phrase)}>
                      Luyện: {item.phrase}
                    </Button>
                  ))}
                </RowTopXs>
              ) : (
                <Small>Phrase drills sẽ mở khi lexicalLevel đạt ngưỡng canonical.</Small>
              )}
            </>
          )}

          {phase2HomePreview.topGrammar.length > 0 && (
            <>
              <Small>Top grammar micro:</Small>
              <MiniList>
                {phase2HomePreview.topGrammar.map(item => (
                  <MiniItem key={`${item.pattern}:${item.exampleSentence}`}>
                    {item.pattern} {item.exampleSentence ? `- ${item.exampleSentence}` : ''}
                  </MiniItem>
                ))}
              </MiniList>
              {phase2Flow.grammarUnlocked ? (
                <RowTopXs>
                  {phase2HomePreview.topGrammar
                    .filter(item => Boolean(item.exampleSentence))
                    .map(item => (
                      <Button
                        key={`grammar-practice-${item.pattern}-${item.exampleSentence}`}
                        onClick={() => setPracticeTarget(item.exampleSentence)}
                      >
                        Luyện grammar: {item.pattern}
                      </Button>
                    ))}
                </RowTopXs>
              ) : (
                <Small>Grammar drills sẽ mở khi grammarReadiness đạt ngưỡng canonical.</Small>
              )}
            </>
          )}
        </Phase2Panel>

        <Grid>
          <Card>
            <CardTitle>Quiz + Memory</CardTitle>
            {renderQuizBody()}

            <RowTopMd>
              <Button onClick={nextQuiz}>Câu tiếp theo</Button>
              <GhostButton onClick={() => void refreshPhase2Status(userId)}>Làm mới Phase 2</GhostButton>
            </RowTopMd>

            <StatBox>
              <Kpi>
                <Small>Số từ đã vững</Small>
                <strong>{remoteProgress.learned}</strong>
              </Kpi>
              <Kpi>
                <Small>Memory trung bình</Small>
                <strong>{remoteProgress.avgMemoryPercent}%</strong>
              </Kpi>
              <Kpi>
                <Small>Lần phát âm</Small>
                <strong>{remoteProgress.attempts}</strong>
              </Kpi>
            </StatBox>

            <SoftDivider />
            <SmallTop>
              Chế độ dữ liệu: Backend API canonical | User: {userId}
            </SmallTop>

            {loadError && (
              <AlertBox>
                {loadError}
              </AlertBox>
            )}
          </Card>

          <Card>
            <CardTitle>Audio + Mic + Speech + Score</CardTitle>
            <Word>{practiceTarget || quiz.item.word}</Word>
            <Meta>Test phát âm trực tiếp trên browser.</Meta>

            <Row>
              <Button onClick={() => speakWord(1)}>Phát âm (normal)</Button>
              <Button onClick={() => speakWord(0.75)}>Phát âm (slow)</Button>
            </Row>

            <RowTopSm>
              <Button onClick={enableMicrophone}>Kiểm tra microphone</Button>
              <Small>Mic: {micReady ? 'sẵn sàng' : 'chưa cấp quyền/không hỗ trợ'}</Small>
            </RowTopSm>

            <RowTopSm>
              <Button onClick={startRecognition} disabled={isRecognizing}>
                {isRecognizing ? 'Đang nghe...' : 'Nói và chấm điểm (Web Speech)'}
              </Button>
            </RowTopSm>

            <RowTopSm>
              {!isBackendRecording ? (
                <Button onClick={startBackendRecording}>
                  Ghi âm và chấm bằng Backend Whisper
                </Button>
              ) : (
                <Button onClick={stopBackendRecording}>Dừng ghi âm backend</Button>
              )}
            </RowTopSm>
            {bridgeStatus ? <Small>{bridgeStatus}</Small> : null}

            <BlockTopSm>
              <Small>Fallback nhập tay nếu trình duyệt không hỗ trợ Web Speech:</Small>
              <Input
                value={manualText}
                onChange={e => setManualText(e.target.value)}
                placeholder="Ví dụ: trust"
              />
              <RowTopXs>
                <Button onClick={useManualInput}>Chấm điểm từ text</Button>
              </RowTopXs>
            </BlockTopSm>

            {pronResult && (
              <>
                <Score $positive={pronResult.score >= 70}>Score: {pronResult.score}/100</Score>
                <Small>Recognized: {pronResult.recognized || '(rong)'}</Small>
                <Small>Feedback: {pronResult.feedback}</Small>
                <Small>Avg score (API): {remoteProgress.avgPronunciationScore}</Small>
              </>
            )}

            <HistoryList>
              <Small>Lịch sử phát âm gần đây:</Small>
              {history.slice(0, 8).map(row => (
                <HistoryRow key={`${row.at}-${row.word}`}>
                  {row.at.slice(0, 19).replace('T', ' ')} | {row.word} | {row.score} | {row.recognized || '(rong)'}
                </HistoryRow>
              ))}
              {history.length === 0 && <Empty>Chưa có dữ liệu phát âm gần đây.</Empty>}
            </HistoryList>
          </Card>
        </Grid>
      </Wrap>
    </Page>
  );
};

export default EnglishLearningLab;
