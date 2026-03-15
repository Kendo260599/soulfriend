import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { apiService } from '../services/apiService';

type WordItem = {
  word: string;
  meaningVi: string;
};

type MemoryMap = Record<string, number>;

type QuizState = {
  item: WordItem;
  choices: string[];
};

type ProgressState = {
  learned: number;
  avgMemoryPercent: number;
  attempts: number;
  avgPronunciationScore: number;
};

type PronunciationState = {
  target: string;
  recognized: string;
  score: number;
  feedback: string;
};

const WORD_BANK: WordItem[] = [
  { word: 'trust', meaningVi: 'tin tưởng' },
  { word: 'hope', meaningVi: 'hy vọng' },
  { word: 'fear', meaningVi: 'sợ hãi' },
  { word: 'care', meaningVi: 'quan tâm' },
  { word: 'love', meaningVi: 'tình yêu' },
  { word: 'friend', meaningVi: 'bạn bè' },
  { word: 'family', meaningVi: 'gia đình' },
  { word: 'support', meaningVi: 'hỗ trợ' },
  { word: 'respect', meaningVi: 'tôn trọng' },
  { word: 'listen', meaningVi: 'lắng nghe' },
  { word: 'speak', meaningVi: 'nói' },
  { word: 'understand', meaningVi: 'thấu hiểu' },
  { word: 'practice', meaningVi: 'luyện tập' },
  { word: 'review', meaningVi: 'ôn tập' },
  { word: 'focus', meaningVi: 'tập trung' },
  { word: 'balance', meaningVi: 'cân bằng' },
  { word: 'growth', meaningVi: 'phát triển' },
  { word: 'progress', meaningVi: 'tiến bộ' },
  { word: 'healing', meaningVi: 'chữa lành' },
  { word: 'calm', meaningVi: 'bình tĩnh' },
];

const STORAGE_MEMORY_KEY = 'lexical.frontend.memory';
const STORAGE_HISTORY_KEY = 'lexical.frontend.pronunciationHistory';
const STORAGE_USER_KEY = 'lexical.frontend.userId';

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

const ChoiceButton = styled(Button)<{ isCorrect?: boolean; isWrong?: boolean }>`
  background: ${props => (props.isCorrect ? '#2e8b57' : props.isWrong ? '#b33636' : '#e9f0f8')};
  color: ${props => (props.isCorrect || props.isWrong ? '#ffffff' : '#22364f')};
  border: 1px solid ${props => (props.isCorrect ? '#2e8b57' : props.isWrong ? '#b33636' : '#c8d6e6')};
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

const Score = styled.div<{ positive?: boolean }>`
  margin-top: 0.6rem;
  font-weight: 700;
  color: ${props => (props.positive ? '#226f43' : '#8b2d2d')};
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

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarityRatio(a: string, b: string): number {
  if (!a && !b) return 1;
  if (!a || !b) return 0;

  const dp: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  const dist = dp[a.length][b.length];
  return Math.max(0, 1 - dist / Math.max(a.length, b.length));
}

function pronunciationScore(targetWord: string, recognizedText: string): PronunciationState {
  const target = normalizeText(targetWord);
  const recognized = normalizeText(recognizedText);

  if (!recognized) {
    return {
      target,
      recognized,
      score: 0,
      feedback: 'Chưa nhận được gì. Hãy nói rõ hơn và thử lại.',
    };
  }

  const charScore = Math.round(similarityRatio(target, recognized) * 100);
  const targetEnding = target.slice(-2);
  const recognizedEnding = recognized.slice(-2);
  const endingScore = Math.round(similarityRatio(targetEnding, recognizedEnding) * 100);
  const score = Math.round(charScore * 0.7 + endingScore * 0.3);

  let feedback = 'Cần luyện thêm âm cuối và độ rõ.';
  if (score >= 90) feedback = 'Rất tốt. Phát âm gần như chính xác.';
  else if (score >= 70) feedback = 'Gần đúng. Thử chậm và rõ âm cuối hơn.';
  else if (score >= 50) feedback = 'Tạm ổn. Cần điều chỉnh độ rõ và nhịp.';

  return { target, recognized, score, feedback };
}

function chooseQuizItem(memory: MemoryMap): QuizState {
  const sorted = [...WORD_BANK].sort((a, b) => (memory[a.word] ?? 0) - (memory[b.word] ?? 0));
  const target = sorted[Math.floor(Math.random() * Math.min(8, sorted.length))] ?? WORD_BANK[0];
  const distractors = WORD_BANK.filter(w => w.word !== target.word)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(w => w.meaningVi);

  const choices = [...distractors, target.meaningVi].sort(() => Math.random() - 0.5);
  return { item: target, choices };
}

const EnglishLearningLab: React.FC = () => {
  const [memoryMap, setMemoryMap] = useState<MemoryMap>({});
  const [quiz, setQuiz] = useState<QuizState>(() => chooseQuizItem({}));
  const [selected, setSelected] = useState<string>('');
  const [quizMessage, setQuizMessage] = useState<string>('');
  const [micReady, setMicReady] = useState<boolean>(false);
  const [manualText, setManualText] = useState<string>('');
  const [pronResult, setPronResult] = useState<PronunciationState | null>(null);
  const [history, setHistory] = useState<Array<{ at: string; word: string; score: number; recognized: string }>>([]);
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);
  const [isBackendRecording, setIsBackendRecording] = useState<boolean>(false);
  const [bridgeStatus, setBridgeStatus] = useState<string>('');
  const [userId, setUserId] = useState<string>('anonymous');
  const [apiMode, setApiMode] = useState<boolean>(true);
  const [remoteProgress, setRemoteProgress] = useState<ProgressState>({
    learned: 0,
    avgMemoryPercent: 0,
    attempts: 0,
    avgPronunciationScore: 0,
  });
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    const existingUserId = localStorage.getItem(STORAGE_USER_KEY);
    const finalUserId = existingUserId || `user-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(STORAGE_USER_KEY, finalUserId);
    setUserId(finalUserId);

    try {
      const saved = localStorage.getItem(STORAGE_MEMORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as MemoryMap;
        setMemoryMap(parsed);
        setQuiz(chooseQuizItem(parsed));
      }
      const savedHistory = localStorage.getItem(STORAGE_HISTORY_KEY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory) as Array<{ at: string; word: string; score: number; recognized: string }>;
        setHistory(parsed.slice(0, 50));
      }
    } catch {
      // Keep default state if localStorage parse fails.
    }

    const bootstrapRemote = async () => {
      try {
        const [quizRes, progressRes, historyRes] = await Promise.all([
          apiService.getEnglishLabNextQuiz(finalUserId),
          apiService.getEnglishLabProgress(finalUserId),
          apiService.getEnglishLabHistory(finalUserId, 20),
        ]);

        const remoteQuiz = quizRes.data?.data;
        if (remoteQuiz?.item && Array.isArray(remoteQuiz?.choices)) {
          setQuiz({ item: remoteQuiz.item, choices: remoteQuiz.choices });
          setMemoryMap(progressRes.data?.data?.memory || {});
          localStorage.setItem(STORAGE_MEMORY_KEY, JSON.stringify(progressRes.data?.data?.memory || {}));
        }

        const remoteHist = historyRes.data?.data?.history;
        if (Array.isArray(remoteHist)) {
          const normalized = remoteHist.map((row: any) => ({
            at: String(row.at || ''),
            word: String(row.word || ''),
            score: Number(row.score || 0),
            recognized: String(row.recognized || ''),
          }));
          setHistory(normalized);
          localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(normalized));
        }

        const prog = progressRes.data?.data?.progress;
        if (prog) {
          setRemoteProgress({
            learned: Number(prog.learned || 0),
            avgMemoryPercent: Number(prog.avgMemoryPercent || 0),
            attempts: Number(prog.attempts || 0),
            avgPronunciationScore: Number(prog.avgPronunciationScore || 0),
          });
        }

        setApiMode(true);
      } catch {
        setApiMode(false);
      }
    };

    void bootstrapRemote();
  }, []);

  const stats = useMemo(() => {
    const values = Object.values(memoryMap);
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const learned = values.filter(v => v >= 0.6).length;
    return {
      learned,
      avg: Math.round(avg * 100),
      attempts: history.length,
    };
  }, [memoryMap, history]);

  const persistMemory = (next: MemoryMap) => {
    setMemoryMap(next);
    localStorage.setItem(STORAGE_MEMORY_KEY, JSON.stringify(next));
  };

  const handleAnswer = (choice: string) => {
    if (selected) return;

    const isCorrect = choice === quiz.item.meaningVi;
    setSelected(choice);
    setQuizMessage(isCorrect ? 'Đúng rồi. + memory strength' : 'Chưa đúng. - memory strength');

    const current = memoryMap[quiz.item.word] ?? 0;
    const updated = Math.max(0, Math.min(1, current + (isCorrect ? 0.2 : -0.3)));
    const nextMap = { ...memoryMap, [quiz.item.word]: updated };
    persistMemory(nextMap);

    const syncRemote = async () => {
      if (!apiMode) return;
      try {
        const res = await apiService.submitEnglishLabQuizAnswer({
          userId,
          word: quiz.item.word,
          selectedMeaning: choice,
        });

        const message = String(res.data?.data?.message || '');
        if (message) setQuizMessage(message);

        const prog = res.data?.data?.progress;
        if (prog) {
          setRemoteProgress({
            learned: Number(prog.learned || 0),
            avgMemoryPercent: Number(prog.avgMemoryPercent || 0),
            attempts: Number(prog.attempts || 0),
            avgPronunciationScore: Number(prog.avgPronunciationScore || 0),
          });
        }
      } catch {
        setApiMode(false);
      }
    };

    void syncRemote();
  };

  const nextQuiz = () => {
    setSelected('');
    setQuizMessage('');

    const localNext = chooseQuizItem(memoryMap);
    setQuiz(localNext);

    const fetchRemoteNext = async () => {
      if (!apiMode) return;
      try {
        const res = await apiService.getEnglishLabNextQuiz(userId);
        const payload = res.data?.data;
        if (payload?.item && Array.isArray(payload?.choices)) {
          setQuiz({ item: payload.item, choices: payload.choices });
        }
      } catch {
        setApiMode(false);
      }
    };

    void fetchRemoteNext();
  };

  const speakWord = (rate: number) => {
    if (!window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(quiz.item.word);
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
    const result = pronunciationScore(quiz.item.word, recognized);
    setPronResult(result);
    const row = {
      at: new Date().toISOString(),
      word: quiz.item.word,
      score: result.score,
      recognized: result.recognized,
    };
    const next = [row, ...history].slice(0, 50);
    setHistory(next);
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(next));

    const syncRemote = async () => {
      if (!apiMode) return;
      try {
        const res = await apiService.scoreEnglishLabPronunciation({
          userId,
          targetWord: quiz.item.word,
          recognizedText: recognized,
        });

        const remoteResult = res.data?.data?.result;
        if (remoteResult) {
          setPronResult({
            target: String(remoteResult.target || ''),
            recognized: String(remoteResult.recognized || ''),
            score: Number(remoteResult.score || 0),
            feedback: String(remoteResult.feedback || ''),
          });
        }

        const remoteHistory = res.data?.data?.history;
        if (Array.isArray(remoteHistory)) {
          const normalized = remoteHistory.map((item: any) => ({
            at: String(item.at || ''),
            word: String(item.word || ''),
            score: Number(item.score || 0),
            recognized: String(item.recognized || ''),
          }));
          setHistory(normalized);
          localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(normalized));
        }

        const prog = res.data?.data?.progress;
        if (prog) {
          setRemoteProgress({
            learned: Number(prog.learned || 0),
            avgMemoryPercent: Number(prog.avgMemoryPercent || 0),
            attempts: Number(prog.attempts || 0),
            avgPronunciationScore: Number(prog.avgPronunciationScore || 0),
          });
        }
      } catch {
        setApiMode(false);
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
    if (!apiMode) {
      setBridgeStatus('Bridge chỉ hoạt động khi backend API sẵn sàng.');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setBridgeStatus('Trình duyệt không hỗ trợ MediaRecorder/getUserMedia.');
      return;
    }

    try {
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
            targetWord: quiz.item.word,
            audioBlob,
            model: 'base',
            language: 'en',
          });

          const remoteResult = res.data?.data?.result;
          if (remoteResult) {
            setPronResult({
              target: String(remoteResult.target || ''),
              recognized: String(remoteResult.recognized || ''),
              score: Number(remoteResult.score || 0),
              feedback: String(remoteResult.feedback || ''),
            });
            setManualText(String(remoteResult.recognized || ''));
          }

          const remoteHistory = res.data?.data?.history;
          if (Array.isArray(remoteHistory)) {
            const normalized = remoteHistory.map((item: any) => ({
              at: String(item.at || ''),
              word: String(item.word || ''),
              score: Number(item.score || 0),
              recognized: String(item.recognized || ''),
            }));
            setHistory(normalized);
            localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(normalized));
          }

          const prog = res.data?.data?.progress;
          if (prog) {
            setRemoteProgress({
              learned: Number(prog.learned || 0),
              avgMemoryPercent: Number(prog.avgMemoryPercent || 0),
              attempts: Number(prog.attempts || 0),
              avgPronunciationScore: Number(prog.avgPronunciationScore || 0),
            });
          }

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
                  isCorrect={selected === choice && choice === quiz.item.meaningVi}
                  isWrong={selected === choice && choice !== quiz.item.meaningVi}
                >
                  {choice}
                </ChoiceButton>
              ))}
            </Row>

            <Score positive={quizMessage.startsWith('Đúng')}>{quizMessage}</Score>

            <RowTopMd>
              <Button onClick={nextQuiz}>Câu tiếp theo</Button>
            </RowTopMd>

            <StatBox>
              <Kpi>
                <Small>Số từ đã vững</Small>
                <strong>{apiMode ? remoteProgress.learned : stats.learned}</strong>
              </Kpi>
              <Kpi>
                <Small>Memory trung bình</Small>
                <strong>{apiMode ? remoteProgress.avgMemoryPercent : stats.avg}%</strong>
              </Kpi>
              <Kpi>
                <Small>Lần phát âm</Small>
                <strong>{apiMode ? remoteProgress.attempts : stats.attempts}</strong>
              </Kpi>
            </StatBox>
            <SmallTop>
              Chế độ dữ liệu: {apiMode ? 'Backend API' : 'Local fallback'} | User: {userId}
            </SmallTop>
          </Card>

          <Card>
            <CardTitle>Audio + Mic + Speech + Score</CardTitle>
            <Word>{quiz.item.word}</Word>
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
                <Button onClick={startBackendRecording} disabled={!apiMode}>
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
                <Score positive={pronResult.score >= 70}>Score: {pronResult.score}/100</Score>
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
