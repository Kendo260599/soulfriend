import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

export type CanonicalBridgeResult<T = any> = {
  ok: boolean;
  data?: T;
  mode?: string;
  message?: string;
};

const CANONICAL_TIMEOUT_MS = 30_000;
const PHASE2_CACHE_TTL_MS = 3_000;

type TimedCacheEntry<T> = {
  expiresAt: number;
  result: CanonicalBridgeResult<T>;
};

const phase2StatusCache = new Map<string, TimedCacheEntry<any>>();
const phase2HomeCache = new Map<string, TimedCacheEntry<any>>();
const phase2StatusInFlight = new Map<string, Promise<CanonicalBridgeResult<any>>>();
const phase2HomeInFlight = new Map<string, Promise<CanonicalBridgeResult<any>>>();

function resolveLexicalRoot(): string {
  const cwd = process.cwd();
  const envRoot = process.env.LEXICAL_ENGINE_DIR;
  if (envRoot && fs.existsSync(envRoot)) return envRoot;

  const candidates = [
    path.resolve(cwd, '../lexical_engine'),
    path.resolve(cwd, 'lexical_engine'),
    path.resolve(__dirname, '../../../../lexical_engine'),
    path.resolve(__dirname, '../../../../../lexical_engine'),
  ];

  for (const item of candidates) {
    if (fs.existsSync(item)) return item;
  }

  return candidates[0];
}

function resolvePythonBin(): string {
  return process.env.PYTHON_BRIDGE_BIN || 'python';
}

type PythonCandidate = {
  bin: string;
  args: string[];
};

function splitArgs(value?: string): string[] {
  if (!value) return [];
  return value
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolvePythonCandidates(): PythonCandidate[] {
  const candidates: PythonCandidate[] = [];

  const envBin = (process.env.PYTHON_BRIDGE_BIN || '').trim();
  const envArgs = splitArgs(process.env.PYTHON_BRIDGE_ARGS);
  if (envBin) {
    candidates.push({ bin: envBin, args: envArgs });
  }

  if (process.platform === 'win32') {
    candidates.push({ bin: 'py', args: ['-3'] });
  }

  candidates.push({ bin: resolvePythonBin(), args: [] });
  candidates.push({ bin: 'python3', args: [] });

  const seen = new Set<string>();
  return candidates.filter((item) => {
    const key = `${item.bin}::${item.args.join(' ')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function runCanonicalWorker<T = any>(args: string[]): Promise<CanonicalBridgeResult<T>> {
  const lexicalRoot = resolveLexicalRoot();
  const workerPath = path.join(lexicalRoot, 'scripts', 'lexical_api_worker.py');

  if (!fs.existsSync(workerPath)) {
    return Promise.resolve({
      ok: false,
      mode: 'error',
      message: `Canonical worker not found: ${workerPath}`,
    });
  }

  const pythonCandidates = resolvePythonCandidates();

  return new Promise((resolve) => {
    const tried = pythonCandidates.map((item) => `${item.bin} ${item.args.join(' ')}`.trim());
    let lastSpawnError = '';

    const runAttempt = (index: number) => {
      if (index >= pythonCandidates.length) {
        resolve({
          ok: false,
          mode: 'error',
          message: `Failed to spawn canonical worker. Tried: ${tried.join(' | ')}${lastSpawnError ? `; lastError=${lastSpawnError}` : ''}`,
        });
        return;
      }

      const candidate = pythonCandidates[index];
      const child = spawn(candidate.bin, [...candidate.args, workerPath, ...args], {
        cwd: lexicalRoot,
        windowsHide: true,
      });

      let stdout = '';
      let stderr = '';
      let settled = false;

      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        child.kill();
        resolve({
          ok: false,
          mode: 'error',
          message: `Canonical worker timeout after ${CANONICAL_TIMEOUT_MS}ms`,
        });
      }, CANONICAL_TIMEOUT_MS);

      child.stdout.on('data', (chunk) => {
        stdout += String(chunk);
      });

      child.stderr.on('data', (chunk) => {
        stderr += String(chunk);
      });

      child.on('error', (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);

        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
          lastSpawnError = err.message;
          runAttempt(index + 1);
          return;
        }

        resolve({
          ok: false,
          mode: 'error',
          message: `Failed to spawn canonical worker: ${err.message}`,
        });
      });

      child.on('close', () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);

        const trimmed = stdout.trim();
        if (!trimmed) {
          resolve({
            ok: false,
            mode: 'error',
            message: `Canonical worker returned empty output. stderr=${stderr.trim()}`,
          });
          return;
        }

        try {
          const parsed = JSON.parse(trimmed);
          resolve({
            ok: Boolean(parsed.ok),
            data: parsed.data,
            mode: parsed.mode,
            message: parsed.message,
          });
        } catch {
          resolve({
            ok: false,
            mode: 'error',
            message: `Invalid canonical worker JSON. stdout=${trimmed} stderr=${stderr.trim()}`,
          });
        }
      });
    };

    runAttempt(0);
  });
}

function getCachedPhase2<T>(
  cache: Map<string, TimedCacheEntry<T>>,
  inFlight: Map<string, Promise<CanonicalBridgeResult<T>>>,
  key: string,
  loader: () => Promise<CanonicalBridgeResult<T>>,
): Promise<CanonicalBridgeResult<T>> {
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) {
    return Promise.resolve(cached.result);
  }

  const pending = inFlight.get(key);
  if (pending) {
    return pending;
  }

  const request = loader()
    .then((result) => {
      if (result.ok) {
        cache.set(key, {
          expiresAt: Date.now() + PHASE2_CACHE_TTL_MS,
          result,
        });
      }
      return result;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, request);
  return request;
}

export function getCanonicalWords() {
  return runCanonicalWorker<{ words: Array<{ word: string; meaningVi: string; cefrLevel: string }>; total: number }>(['words']);
}

export function getCanonicalQuizNext(mode: 'learn' | 'review' = 'learn') {
  return runCanonicalWorker<any>(['quiz-next', '--mode', mode, '--batch-size', '1']);
}

export function submitCanonicalQuizAnswer(payload: { word: string; selectedMeaning: string }) {
  return runCanonicalWorker<any>([
    'quiz-answer',
    '--word', payload.word,
    '--selected-meaning', payload.selectedMeaning,
  ]);
}

export function scoreCanonicalPronunciation(payload: {
  targetWord: string;
  recognizedText: string;
  transcriptionModel?: string;
}) {
  return runCanonicalWorker<any>([
    'pronunciation-score',
    '--target-word', payload.targetWord,
    '--recognized-text', payload.recognizedText,
    '--transcription-model', payload.transcriptionModel || 'manual',
  ]);
}

export function getCanonicalProgress() {
  return runCanonicalWorker<any>(['progress']);
}

export function getCanonicalHistory(limit = 20) {
  return runCanonicalWorker<any>(['history', '--limit', String(limit)]);
}

export function getCanonicalPhase2Status(payload?: {
  lessonSize?: number;
  phraseLimitPerWord?: number;
  grammarLimit?: number;
}) {
  const lessonSize = Number(payload?.lessonSize || 10);
  const phraseLimitPerWord = Number(payload?.phraseLimitPerWord || 2);
  const grammarLimit = Number(payload?.grammarLimit || 5);

  const key = `${lessonSize}:${phraseLimitPerWord}:${grammarLimit}`;
  return getCachedPhase2(
    phase2StatusCache,
    phase2StatusInFlight,
    key,
    () => runCanonicalWorker<any>([
      'phase2-status',
      '--lesson-size', String(lessonSize),
      '--phrase-limit-per-word', String(phraseLimitPerWord),
      '--grammar-limit', String(grammarLimit),
    ]),
  );
}

export function getCanonicalPhase2Home(payload?: {
  lessonSize?: number;
  phraseLimitPerWord?: number;
  grammarLimit?: number;
}) {
  const lessonSize = Number(payload?.lessonSize || 10);
  const phraseLimitPerWord = Number(payload?.phraseLimitPerWord || 2);
  const grammarLimit = Number(payload?.grammarLimit || 5);

  const key = `${lessonSize}:${phraseLimitPerWord}:${grammarLimit}`;
  return getCachedPhase2(
    phase2HomeCache,
    phase2HomeInFlight,
    key,
    () => runCanonicalWorker<any>([
      'phase2-home',
      '--lesson-size', String(lessonSize),
      '--phrase-limit-per-word', String(phraseLimitPerWord),
      '--grammar-limit', String(grammarLimit),
    ]),
  );
}
