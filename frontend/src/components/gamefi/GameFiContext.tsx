/**
 * GameFi — Shared Context (state, fetchers, helpers)
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useNavigate, NavigateFunction } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { FullGameData, AdaptiveQuestData, QuestDbData, DailyQuest, RewardData } from './types';
import { API_URL, QUEST_ROUTES } from './config';

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
  showToast: (msg: string) => void;
  showReward: (data: any, questTitle: string) => void;
  dismissReward: () => void;
  navigate: NavigateFunction;
  authHeaders: HeadersInit;
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

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await fetch(`${API_URL}/api/v2/gamefi/full/${encodeURIComponent(userId)}`, { headers: authHeaders });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) setData(json.data);
      else throw new Error(json.error || 'Failed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
    } finally { setLoading(false); }
  }, [userId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const apiPost = async (path: string, body: Record<string, unknown>) => {
    const res = await fetch(`${API_URL}/api/v2/gamefi${path}`, {
      method: 'POST', headers: authHeaders,
      body: JSON.stringify(body),
    });
    return res.json();
  };

  return (
    <Ctx.Provider value={{ data, loading, error, userId, toast, rewardData, confirmQuest, setConfirmQuest, fetchAll, apiPost, showToast, showReward, dismissReward, navigate, authHeaders }}>
      {children}
    </Ctx.Provider>
  );
};

/* Re-export commonly needed auth hook for logout */
export { useAuth } from '../../contexts/AuthContext';
