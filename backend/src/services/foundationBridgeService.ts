import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

type BridgeAction = 'lesson' | 'progress' | 'curriculum' | 'track_lesson';

type BridgePayload = {
  action: BridgeAction;
  learnerId?: number;
  track?: string;
  lessonId?: string;
};

type TrackKey = 'grammar' | 'vocab';

type CurriculumLesson = {
  id: string;
  order?: number;
  level?: string;
  title?: string;
  focus?: string;
  objective?: string;
};

type CurriculumPayload = {
  framework: string;
  tracks: {
    vocab: CurriculumLesson[];
    grammar: CurriculumLesson[];
  };
};

const resolveEngineRoot = (): string => {
  const envRoot = process.env.FOUNDATION_ENGINE_DIR;
  if (envRoot) {
    return path.resolve(process.cwd(), envRoot);
  }

  return path.resolve(process.cwd(), '../english_foundation');
};

const resolvePythonCommand = (): { command: string; args: string[] } => {
  const command = (process.env.PYTHON_BRIDGE_BIN || '').trim() || (process.platform === 'win32' ? 'py' : 'python3');
  const args = (process.env.PYTHON_BRIDGE_ARGS || '').trim().split(/\s+/).filter(Boolean);
  return { command, args };
};

const isUnsupportedActionError = (error: unknown, action: BridgeAction): boolean => {
  const message = String((error as any)?.message || '');
  const normalized = message.toLowerCase();
  return normalized.includes('unsupported action') && normalized.includes(action.toLowerCase());
};

const resolveCurriculumPath = (): string => {
  return path.resolve(resolveEngineRoot(), 'content', 'cambridge_curriculum.json');
};

const toSafeOrder = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 9999;
};

const sortLessons = (lessons: CurriculumLesson[]): CurriculumLesson[] => {
  return [...lessons].sort((a, b) => {
    const orderDiff = toSafeOrder(a.order) - toSafeOrder(b.order);
    if (orderDiff !== 0) {
      return orderDiff;
    }
    return String(a.id || '').localeCompare(String(b.id || ''));
  });
};

const readCurriculumFromNode = (): CurriculumPayload => {
  const fallback: CurriculumPayload = {
    framework: 'IELTS-aligned Grammar and Vocabulary path for Vietnamese learners',
    tracks: {
      vocab: [],
      grammar: [],
    },
  };

  const curriculumPath = resolveCurriculumPath();
  if (!fs.existsSync(curriculumPath)) {
    return fallback;
  }

  const raw = fs.readFileSync(curriculumPath, { encoding: 'utf-8' }).replace(/^\uFEFF/, '');
  const parsed = JSON.parse(raw) as Partial<CurriculumPayload>;
  const tracks = parsed?.tracks || {};

  return {
    framework: parsed?.framework || fallback.framework,
    tracks: {
      vocab: sortLessons(Array.isArray((tracks as any).vocab) ? (tracks as any).vocab : []),
      grammar: sortLessons(Array.isArray((tracks as any).grammar) ? (tracks as any).grammar : []),
    },
  };
};

const normalizeTrack = (track: string): TrackKey => {
  const normalized = String(track || '').trim().toLowerCase();
  if (normalized !== 'grammar' && normalized !== 'vocab') {
    throw new Error("Track must be 'grammar' or 'vocab'.");
  }
  return normalized;
};

const runBridge = async (payload: BridgePayload): Promise<any> => {
  const engineRoot = resolveEngineRoot();
  const workerPath = path.resolve(engineRoot, 'api', 'bridge_worker.py');
  const { command, args } = resolvePythonCommand();

  const input = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const child = spawn(command, [...args, workerPath], {
      cwd: path.resolve(engineRoot, '..'),
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', chunk => {
      stdout += String(chunk);
    });

    child.stderr.on('data', chunk => {
      stderr += String(chunk);
    });

    child.on('error', err => {
      reject(err);
    });

    child.on('close', code => {
      if (code !== 0) {
        reject(new Error(`Foundation bridge exited with code ${code}. ${stderr}`));
        return;
      }

      const lines = stdout
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);
      const lastLine = lines[lines.length - 1];
      if (!lastLine) {
        reject(new Error(`Foundation bridge returned empty output. ${stderr}`));
        return;
      }

      try {
        const parsed = JSON.parse(lastLine);
        if (!parsed.ok) {
          reject(new Error(parsed.error || 'Unknown bridge error'));
          return;
        }
        resolve(parsed.data);
      } catch (err: any) {
        reject(new Error(`Invalid foundation bridge JSON: ${err?.message || String(err)}`));
      }
    });

    child.stdin.write(input + '\n');
    child.stdin.end();
  });
};

export const getFoundationLesson = async (learnerId = 1): Promise<any> => {
  return runBridge({ action: 'lesson', learnerId });
};

export const getFoundationProgress = async (learnerId = 1): Promise<any> => {
  return runBridge({ action: 'progress', learnerId });
};

export const getFoundationCurriculum = async (): Promise<any> => {
  try {
    return await runBridge({ action: 'curriculum' });
  } catch (error) {
    if (!isUnsupportedActionError(error, 'curriculum')) {
      throw error;
    }
    return readCurriculumFromNode();
  }
};

export const getFoundationTrackLesson = async (
  track: string,
  lessonId: string,
  learnerId = 1,
): Promise<any> => {
  try {
    return await runBridge({ action: 'track_lesson', track, lessonId, learnerId });
  } catch (error) {
    if (!isUnsupportedActionError(error, 'track_lesson')) {
      throw error;
    }

    const trackKey = normalizeTrack(track);
    const curriculum = readCurriculumFromNode();
    const lessons = curriculum.tracks?.[trackKey] || [];
    const selectedLesson = lessons.find(item => String(item.id) === String(lessonId)) || lessons[0] || {};

    const baseLesson = await runBridge({ action: 'lesson', learnerId });
    const sequence = trackKey === 'grammar'
      ? ['grammar', 'words', 'phrases']
      : ['words', 'phrases', 'grammar'];

    return {
      track: trackKey,
      lesson_meta: selectedLesson,
      words: baseLesson?.words || [],
      phrases: baseLesson?.phrases || [],
      grammar: baseLesson?.grammar || {},
      sequence,
    };
  }
};
