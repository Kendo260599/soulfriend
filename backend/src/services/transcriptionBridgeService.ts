import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import { logger } from '../utils/logger';

export type BridgeTranscriptionResult = {
  ok: boolean;
  text: string;
  mode: string;
  message: string;
};

const TRANSCRIBE_TIMEOUT_MS = 90_000;

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

function extFromMime(mimeType: string): string {
  const lower = mimeType.toLowerCase();
  if (lower.includes('wav')) return '.wav';
  if (lower.includes('webm')) return '.webm';
  if (lower.includes('ogg')) return '.ogg';
  if (lower.includes('mpeg') || lower.includes('mp3')) return '.mp3';
  if (lower.includes('mp4')) return '.mp4';
  return '.bin';
}

export async function transcribeAudioBuffer(params: {
  audioBuffer: Buffer;
  mimeType: string;
  model?: string;
  language?: string;
}): Promise<BridgeTranscriptionResult> {
  const lexicalRoot = resolveLexicalRoot();
  const workerPath = path.join(lexicalRoot, 'scripts', 'transcription_bridge_worker.py');

  if (!fs.existsSync(workerPath)) {
    return {
      ok: false,
      text: '',
      mode: 'error',
      message: `Transcription worker not found: ${workerPath}`,
    };
  }

  const extension = extFromMime(params.mimeType || 'audio/webm');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'soulfriend-audio-'));
  const audioPath = path.join(tmpDir, `input${extension}`);
  fs.writeFileSync(audioPath, params.audioBuffer);

  const pythonCandidates = resolvePythonCandidates();
  const model = params.model || process.env.WHISPER_MODEL || 'base';
  const language = params.language || 'en';

  logger.info('Transcription bridge spawn', {
    pythonCandidates: pythonCandidates.map((item) => `${item.bin} ${item.args.join(' ')}`.trim()),
    workerPath,
    lexicalRoot,
    audioPath,
    model,
    language,
  });

  const result = await new Promise<BridgeTranscriptionResult>((resolve) => {
    const args = [
      workerPath,
      '--audio',
      audioPath,
      '--model',
      model,
      '--language',
      language,
    ];

    const tried = pythonCandidates.map((item) => `${item.bin} ${item.args.join(' ')}`.trim());
    let lastSpawnError = '';

    const runAttempt = (index: number) => {
      if (index >= pythonCandidates.length) {
        resolve({
          ok: false,
          text: '',
          mode: 'error',
          message: `Failed to spawn python worker. Tried: ${tried.join(' | ')}${lastSpawnError ? `; lastError=${lastSpawnError}` : ''}`,
        });
        return;
      }

      const candidate = pythonCandidates[index];
      const child = spawn(candidate.bin, [...candidate.args, ...args], {
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
          text: '',
          mode: 'error',
          message: `Transcription timeout after ${TRANSCRIBE_TIMEOUT_MS}ms`,
        });
      }, TRANSCRIBE_TIMEOUT_MS);

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
          text: '',
          mode: 'error',
          message: `Failed to spawn python worker: ${err.message}`,
        });
      });

      child.on('close', (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);

        const trimmedOut = stdout.trim();
        if (!trimmedOut) {
          resolve({
            ok: false,
            text: '',
            mode: 'error',
            message: `Worker returned empty output. stderr=${stderr.trim()}`,
          });
          return;
        }

        try {
          const parsed = JSON.parse(trimmedOut);
          resolve({
            ok: Boolean(parsed.ok),
            text: String(parsed.text || ''),
            mode: String(parsed.mode || (parsed.ok ? 'transcribed' : 'error')),
            message: String(parsed.message || ''),
          });
        } catch {
          resolve({
            ok: false,
            text: '',
            mode: 'error',
            message: `Invalid worker JSON. code=${code} stdout=${trimmedOut} stderr=${stderr.trim()}`,
          });
        }
      });
    };

    runAttempt(0);
  });

  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // Ignore temp cleanup failure.
  }

  return result;
}
