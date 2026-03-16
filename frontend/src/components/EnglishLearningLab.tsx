import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
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

const Page = styled.div`
  min-height: 100vh;
  background: linear-gradient(140deg, #f6ebe6 0%, #fef7ef 50%, #eef8f8 100%);
  padding: 1.5rem;
`;

const Wrap = styled.div`
  max-width: 1100px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #243042;
  margin: 0 0 0.4rem 0;
`;

const SubTitle = styled.p`
  color: #5a6878;
  margin: 0 0 1rem 0;
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
`;

const CardTitle = styled.h2`
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
  background: #265d8f;
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
      try {
        const [quizRes, progressRes, historyRes] = await Promise.all([
          apiService.getEnglishLabNextQuiz(finalUserId),
          apiService.getEnglishLabProgress(finalUserId),
          apiService.getEnglishLabHistory(finalUserId, 20),
        ]);
        const { statusRes: phase2Res, homeRes: phase2HomeRes } = await fetchPhase2Pair(finalUserId, 1);

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
        setBridgeStatus(error?.response?.data?.message || 'Không thể tải dữ liệu canonical từ backend.');
      }
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

  return (
    <Page>
      <Wrap>
        <Title>English Learning Lab</Title>
        <SubTitle>
          Bạn có thể test trực tiếp trên frontend: Quiz + Memory + Audio + Mic + Speech-to-text + Score.
        </SubTitle>

        <Phase2Banner>
          <Small>
            Phase-2 Canonical Stage: <StageBadge $stage={phase2Flow.stage}>{stageLabel(phase2Flow.stage)}</StageBadge>
          </Small>
          <Small>
            Phrase: {phase2Flow.phraseUnlocked ? 'Unlocked' : 'Locked'} | Grammar: {phase2Flow.grammarUnlocked ? 'Unlocked' : 'Locked'}
          </Small>
          <Small>
            Phrase pack: {phase2HomePreview.phraseCount} {phase2HomePreview.phraseLocked ? '(locked)' : '(ready)'}
            {' | '}Grammar pack: {phase2HomePreview.grammarCount} {phase2HomePreview.grammarLocked ? '(locked)' : '(ready)'}
          </Small>
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
          <Small>
            lexicalLevel: {phase2Flow.signals.lexicalLevel.toFixed(2)} / {phase2Flow.thresholds.phraseUnlockMin.toFixed(2)}
            {' | '}grammarReadiness: {phase2Flow.signals.grammarReadinessProxy.toFixed(2)} / {phase2Flow.thresholds.grammarUnlockMin.toFixed(2)}
          </Small>
        </Phase2Banner>

        <Grid>
          <Card>
            <CardTitle>Quiz + Memory</CardTitle>
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

            <RowTopMd>
              <Button onClick={nextQuiz}>Câu tiếp theo</Button>
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
            <SmallTop>
              Chế độ dữ liệu: Backend API canonical | User: {userId}
            </SmallTop>
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
            </HistoryList>
          </Card>
        </Grid>
      </Wrap>
    </Page>
  );
};

export default EnglishLearningLab;
