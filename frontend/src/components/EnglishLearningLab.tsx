import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

type WordItem = {
  word: string;
  meaningVi: string;
};

type MemoryMap = Record<string, number>;

type QuizState = {
  item: WordItem;
  choices: string[];
};

type PronunciationState = {
  target: string;
  recognized: string;
  score: number;
  feedback: string;
};

const WORD_BANK: WordItem[] = [
  { word: 'trust', meaningVi: 'tin tuong' },
  { word: 'hope', meaningVi: 'hy vong' },
  { word: 'fear', meaningVi: 'so hai' },
  { word: 'care', meaningVi: 'quan tam' },
  { word: 'love', meaningVi: 'tinh yeu' },
  { word: 'friend', meaningVi: 'ban be' },
  { word: 'family', meaningVi: 'gia dinh' },
  { word: 'support', meaningVi: 'ho tro' },
  { word: 'respect', meaningVi: 'ton trong' },
  { word: 'listen', meaningVi: 'lang nghe' },
  { word: 'speak', meaningVi: 'noi' },
  { word: 'understand', meaningVi: 'thau hieu' },
  { word: 'practice', meaningVi: 'luyen tap' },
  { word: 'review', meaningVi: 'on tap' },
  { word: 'focus', meaningVi: 'tap trung' },
  { word: 'balance', meaningVi: 'can bang' },
  { word: 'growth', meaningVi: 'phat trien' },
  { word: 'progress', meaningVi: 'tien bo' },
  { word: 'healing', meaningVi: 'chua lanh' },
  { word: 'calm', meaningVi: 'binh tinh' },
];

const STORAGE_MEMORY_KEY = 'lexical.frontend.memory';
const STORAGE_HISTORY_KEY = 'lexical.frontend.pronunciationHistory';

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
      feedback: 'Chua nhan duoc gi. Hay noi ro hon va thu lai.',
    };
  }

  const charScore = Math.round(similarityRatio(target, recognized) * 100);
  const targetEnding = target.slice(-2);
  const recognizedEnding = recognized.slice(-2);
  const endingScore = Math.round(similarityRatio(targetEnding, recognizedEnding) * 100);
  const score = Math.round(charScore * 0.7 + endingScore * 0.3);

  let feedback = 'Can luyen them am cuoi va do ro.';
  if (score >= 90) feedback = 'Rat tot. Phat am gan nhu chinh xac.';
  else if (score >= 70) feedback = 'Gan dung. Thu cham va ro am cuoi hon.';
  else if (score >= 50) feedback = 'Tam on. Can dieu chinh do ro va nhip.';

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

  useEffect(() => {
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
    setQuizMessage(isCorrect ? 'Dung roi. + memory strength' : 'Chua dung. - memory strength');

    const current = memoryMap[quiz.item.word] ?? 0;
    const updated = Math.max(0, Math.min(1, current + (isCorrect ? 0.2 : -0.3)));
    const nextMap = { ...memoryMap, [quiz.item.word]: updated };
    persistMemory(nextMap);
  };

  const nextQuiz = () => {
    setSelected('');
    setQuizMessage('');
    setQuiz(chooseQuizItem(memoryMap));
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

  const useManualInput = () => {
    savePronunciationResult(manualText);
  };

  return (
    <Page>
      <Wrap>
        <Title>English Learning Lab</Title>
        <SubTitle>
          Ban co the test truc tiep tren frontend: Quiz + Memory + Audio + Mic + Speech-to-text + Score.
        </SubTitle>

        <Grid>
          <Card>
            <CardTitle>Quiz + Memory</CardTitle>
            <Word>{quiz.item.word}</Word>
            <Meta>Chon nghia tieng Viet dung nhat.</Meta>

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

            <Score positive={quizMessage.startsWith('Dung')}>{quizMessage}</Score>

            <Row style={{ marginTop: '0.8rem' }}>
              <Button onClick={nextQuiz}>Cau tiep theo</Button>
            </Row>

            <StatBox>
              <Kpi>
                <Small>So tu da vung</Small>
                <strong>{stats.learned}</strong>
              </Kpi>
              <Kpi>
                <Small>Memory trung binh</Small>
                <strong>{stats.avg}%</strong>
              </Kpi>
              <Kpi>
                <Small>Lan phat am</Small>
                <strong>{stats.attempts}</strong>
              </Kpi>
            </StatBox>
          </Card>

          <Card>
            <CardTitle>Audio + Mic + Speech + Score</CardTitle>
            <Word>{quiz.item.word}</Word>
            <Meta>Test phat am truc tiep tren browser.</Meta>

            <Row>
              <Button onClick={() => speakWord(1)}>Phat am (normal)</Button>
              <Button onClick={() => speakWord(0.75)}>Phat am (slow)</Button>
            </Row>

            <Row style={{ marginTop: '0.7rem' }}>
              <Button onClick={enableMicrophone}>Kiem tra microphone</Button>
              <Small>Mic: {micReady ? 'san sang' : 'chua cap quyen/khong ho tro'}</Small>
            </Row>

            <Row style={{ marginTop: '0.7rem' }}>
              <Button onClick={startRecognition} disabled={isRecognizing}>
                {isRecognizing ? 'Dang nghe...' : 'Noi va cham diem (Web Speech)'}
              </Button>
            </Row>

            <div style={{ marginTop: '0.7rem' }}>
              <Small>Fallback nhap tay neu trinh duyet khong ho tro Web Speech:</Small>
              <Input
                value={manualText}
                onChange={e => setManualText(e.target.value)}
                placeholder="Vi du: trust"
              />
              <Row style={{ marginTop: '0.5rem' }}>
                <Button onClick={useManualInput}>Cham diem tu text</Button>
              </Row>
            </div>

            {pronResult && (
              <>
                <Score positive={pronResult.score >= 70}>Score: {pronResult.score}/100</Score>
                <Small>Recognized: {pronResult.recognized || '(rong)'}</Small>
                <Small>Feedback: {pronResult.feedback}</Small>
              </>
            )}

            <HistoryList>
              <Small>Lich su phat am gan day:</Small>
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
