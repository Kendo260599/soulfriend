import { spawn } from 'child_process';
import path from 'path';

type BridgeAction = 'lesson' | 'progress' | 'curriculum' | 'track_lesson';

type BridgePayload = {
  action: BridgeAction;
  learnerId?: number;
  track?: string;
  lessonId?: string;
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
  return runBridge({ action: 'curriculum' });
};

export const getFoundationTrackLesson = async (
  track: string,
  lessonId: string,
  learnerId = 1,
): Promise<any> => {
  return runBridge({ action: 'track_lesson', track, lessonId, learnerId });
};
