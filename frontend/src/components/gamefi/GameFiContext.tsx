/**
 * GameFi — Shared Context (state, fetchers, helpers)
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate, NavigateFunction } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { FullGameData, AdaptiveQuestData, QuestDbData, DailyQuest, RewardData } from './types';
import { API_URL, QUEST_ROUTES } from './config';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = 'gamefi_cache_v1';

interface GameFiCtx {
  data: FullGameData | null;
  loading: boolean;
  error: string | null;
  userId: string;
  toast: { msg: string; visible: boolean };
  rewardData: RewardData | null;
  confirmQuest: DailyQuest | null;
  setConfirmQuest: React.Dispatch<React.SetStateAction<DailyQuest | null>>;
  fetchAll: () => Promise<void>;
  apiPost: (path: string, body: Record<string, unknown>) => Promise<any>;
  formatApiError: (payload: unknown, fallbackMsg: string) => string;
  showToast: (msg: string) => void;
  showReward: (data: any, questTitle: string) => void;
  dismissReward: () => void;
  navigate: NavigateFunction;
  authHeaders: HeadersInit;
}

type ApiErrorKind = 'abort' | 'network' | 'cors' | 'http' | 'unknown';

interface ApiErrorMeta {
  message: string;
  retryable: boolean;
  kind: ApiErrorKind;
  action?: string;
}

const Ctx = createContext<GameFiCtx | null>(null);

export const useGameFi = (): GameFiCtx => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useGameFi must be used inside <GameFiProvider>');
  return c;
};

export const GameFiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const [data, setData] = useState<FullGameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState({ msg: '', visible: false });
  const [rewardData, setRewardData] = useState<RewardData | null>(null);
  const [confirmQuest, setConfirmQuest] = useState<DailyQuest | null>(null);
  const fetchAllAbortRef = useRef<AbortController | null>(null);
  const fetchAllInFlightRef = useRef<Promise<void> | null>(null);

  const userId = user?.id || 'anonymous';

  const authHeaders: HeadersInit = useMemo(() => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }, [token]);

  const showToast = (msg: string) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };

  const showReward = (data: any, questTitle: string) => {
    setRewardData({
      xpGained: data.xpGained || 0,
      growthImpact: data.growthImpact || {},
      newLevel: data.newLevel || 0,
      levelTitle: data.levelTitle || '',
      milestone: data.milestone || null,
      rewards: data.rewards || { soulPoints: 0, empathyPoints: 0 },
      feedback: data.feedback || '',
      questTitle,
      eventType: data.eventType || undefined,
    });
  };

  const dismissReward = () => setRewardData(null);

  const classifyApiError = useCallback((payload: unknown, fallbackMsg: string): ApiErrorMeta => {
    const fallback = fallbackMsg || 'Có lỗi xảy ra';
    const retryAction = 'Vui lòng kiểm tra mạng/CORS rồi bấm "Thử lại".';
    const isAbortLike = (text: string) => /abort|aborted|cancelled|canceled/i.test(text);
    const isCorsLike = (text: string) => /cors|cross-origin|access-control-allow-origin|blocked by c/i.test(text);
    const isNetworkLike = (text: string) => /network|timeout|timed out|failed to fetch|err_connection|err_name_not_resolved|err_internet_disconnected/i.test(text);

    if (payload instanceof DOMException && payload.name === 'AbortError') {
      return {
        message: 'Yêu cầu đã bị gián đoạn',
        retryable: true,
        kind: 'abort',
        action: retryAction,
      };
    }

    if (payload && typeof payload === 'object') {
      const maybe = payload as { error?: unknown; message?: unknown; status?: unknown; retryable?: unknown };
      const status = typeof maybe.status === 'number' ? maybe.status : null;
      const rawMsg = typeof maybe.error === 'string'
        ? maybe.error
        : typeof maybe.message === 'string'
          ? maybe.message
          : fallback;

      const explicitRetryable = typeof maybe.retryable === 'boolean' ? maybe.retryable : null;
      const byStatus = status != null ? status >= 500 || status === 408 || status === 429 : null;
      const retryable = explicitRetryable ?? byStatus ?? isNetworkLike(rawMsg);

      if (status === 0 || isCorsLike(rawMsg)) {
        return {
          message: 'Không thể truy cập API (khả năng CORS/chứng chỉ/HTTPS)',
          retryable: true,
          kind: 'cors',
          action: 'Kiểm tra REACT_APP_API_URL, cấu hình CORS của backend, rồi thử lại.',
        };
      }

      if (isAbortLike(rawMsg)) {
        return {
          message: 'Yêu cầu đã bị gián đoạn',
          retryable: true,
          kind: 'abort',
          action: retryAction,
        };
      }

      if (retryable && isNetworkLike(rawMsg)) {
        return {
          message: 'Kết nối mạng chưa ổn định',
          retryable: true,
          kind: 'network',
          action: retryAction,
        };
      }

      return {
        message: rawMsg,
        retryable,
        kind: status != null ? 'http' : 'unknown',
        action: retryable ? retryAction : undefined,
      };
    }

    if (payload instanceof Error) {
      const msg = payload.message || fallback;

      if (isAbortLike(msg)) {
        return {
          message: 'Yêu cầu đã bị gián đoạn',
          retryable: true,
          kind: 'abort',
          action: retryAction,
        };
      }

      if (isCorsLike(msg)) {
        return {
          message: 'Không thể truy cập API (khả năng CORS/chứng chỉ/HTTPS)',
          retryable: true,
          kind: 'cors',
          action: 'Kiểm tra REACT_APP_API_URL, cấu hình CORS của backend, rồi thử lại.',
        };
      }

      const retryable = isNetworkLike(msg);
      return {
        message: retryable ? 'Kết nối mạng chưa ổn định' : fallback,
        retryable,
        kind: retryable ? 'network' : 'unknown',
        action: retryable ? retryAction : undefined,
      };
    }

    return {
      message: fallback,
      retryable: true,
      kind: 'unknown',
      action: retryAction,
    };
  }, []);

  const formatApiError = useCallback((payload: unknown, fallbackMsg: string) => {
    const meta = classifyApiError(payload, fallbackMsg);
    const retryableSuffix = meta.retryable ? ' (có thể thử lại)' : '';
    const action = meta.action ? ` ${meta.action}` : '';
    return `${meta.message}${retryableSuffix}${action}`;
  }, [classifyApiError]);

  const waitWithAbort = useCallback((ms: number, signal: AbortSignal): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', onAbort);
        resolve();
      }, ms);
      const onAbort = () => {
        clearTimeout(timer);
        signal.removeEventListener('abort', onAbort);
        reject(new DOMException('Aborted', 'AbortError'));
      };
      signal.addEventListener('abort', onAbort, { once: true });
    });
  }, []);

  // ── localStorage cache helpers ─────────────────────────────────────────────

  const readCache = useCallback((): { data: FullGameData | null; stale: boolean } => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return { data: null, stale: false };
      const cached = JSON.parse(raw) as { userId: string; data: FullGameData; ts: number };
      return {
        data: cached.userId === userId ? cached.data : null,
        stale: Date.now() - cached.ts > CACHE_TTL_MS,
      };
    } catch {
      return { data: null, stale: false };
    }
  }, [userId]);

  const writeCache = useCallback((data: FullGameData) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ userId, data, ts: Date.now() }));
    } catch { /* quota exceeded — ignore */ }
  }, [userId]);

  // ── fetchAll with cache-first strategy ─────────────────────────────────────

  const fetchAll = useCallback(async () => {
    if (fetchAllInFlightRef.current) {
      return fetchAllInFlightRef.current;
    }

    fetchAllAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAllAbortRef.current = controller;

    const run = async () => {
      // Step 1: Show cached data immediately (no loading flash for warm cache)
      const { data: cached, stale } = readCache();
      if (cached && !stale) {
        setData(cached);
        setLoading(false);
        setError(null);
      }

      // Step 2: Fetch fresh data from backend in background
      setLoading(cached === null);

      const maxAttempts = 2;
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          const res = await fetch(`${API_URL}/api/v2/gamefi/full/${encodeURIComponent(userId)}`, {
            headers: authHeaders,
            signal: controller.signal,
          });

          if (!res.ok) {
            throw {
              status: res.status,
              error: `HTTP ${res.status}`,
              retryable: res.status >= 500 || res.status === 408 || res.status === 429,
            };
          }

          const json = await res.json();
          if (!json.success) {
            throw json;
          }

          setData(json.data);
          writeCache(json.data);
          setError(null);
          return;
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') {
            return;
          }

          const meta = classifyApiError(err, 'Không thể tải dữ liệu');
          const canRetry = meta.retryable && attempt < maxAttempts;

          if (canRetry) {
            const backoffMs = 350 * (2 ** (attempt - 1));
            try {
              await waitWithAbort(backoffMs, controller.signal);
              continue;
            } catch {
              return;
            }
          }

          // Only set error if we had no cached data to fall back on
          if (!cached) {
            setError(formatApiError(err, 'Không thể tải dữ liệu'));
          }
          return;
        }
      }
    };

    fetchAllInFlightRef.current = run();

    try {
      await fetchAllInFlightRef.current;
    } finally {
      if (fetchAllInFlightRef.current) {
        fetchAllInFlightRef.current = null;
      }
      setLoading(false);
    }
  }, [userId, authHeaders, classifyApiError, formatApiError, waitWithAbort, readCache, writeCache]);

  // Cleanup on unmount — abort any in-flight requests
  useEffect(() => {
    return () => {
      fetchAllAbortRef.current?.abort();
      fetchAllInFlightRef.current = null;
    };
  }, []);

  // Sau khi hoàn thành DASS-21 (TestFlow) — xóa cache và refetch ngay
  useEffect(() => {
    const onInvalidate = () => {
      void fetchAll();
    };
    window.addEventListener('gamefi:invalidate-cache', onInvalidate);
    return () => window.removeEventListener('gamefi:invalidate-cache', onInvalidate);
  }, [fetchAll]);

  // Re-fetch when user changes (handles async auth load: mount → anonymous → real user)
  useEffect(() => {
    fetchAll();
  }, [fetchAll, user?.id]);

  // Invalidate cache when user logs out
  useEffect(() => {
    if (!token) {
      setData(null);
      try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
    }
  }, [token]);

  const apiPost = async (path: string, body: Record<string, unknown>) => {
    try {
      const res = await fetch(`${API_URL}/api/v2/gamefi${path}`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify(body),
      });

      let json: any;
      try {
        json = await res.json();
      } catch {
        return {
          success: false,
          error: `HTTP ${res.status}: Phản hồi không hợp lệ`,
          status: res.status,
          retryable: res.status >= 500 || res.status === 408 || res.status === 429,
        };
      }

      if (!res.ok) {
        const normalized = (json && typeof json === 'object') ? json : {};
        return {
          ...normalized,
          success: false,
          status: res.status,
          retryable: res.status >= 500 || res.status === 408 || res.status === 429,
          error: normalized.error || normalized.message || `HTTP ${res.status}`,
        };
      }

      return json;
    } catch (err) {
      const meta = classifyApiError(err, 'Không thể kết nối máy chủ');
      return {
        success: false,
        error: formatApiError(err, 'Không thể kết nối máy chủ'),
        retryable: meta.retryable,
        kind: meta.kind,
      };
    }
  };

  return (
    <Ctx.Provider value={{ data, loading, error, userId, toast, rewardData, confirmQuest, setConfirmQuest, fetchAll, apiPost, formatApiError, showToast, showReward, dismissReward, navigate, authHeaders }}>
      {children}
    </Ctx.Provider>
  );
};

/* Re-export commonly needed auth hook for logout */
export { useAuth } from '../../contexts/AuthContext';
