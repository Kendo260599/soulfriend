/**
 * useGamification - Custom hook for gamification API
 * Handles fetching and updating user gamification data
 */

import { useEffect, useState, useCallback } from 'react';

export interface Streak {
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: Date | null;
  missedDays: number;
  startDate: Date;
}

export interface XPData {
  xp: number;
  currentLevel: number;
  xpToNextLevel: number;
  totalXP: number;
  levelTier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  unlocked: boolean;
  unlockedAt: Date | null;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  current: number;
  reward: number;
  completed: boolean;
  claimed?: boolean;
  resetDate: Date;
}

export interface GamificationData {
  userId: string;
  streak: Streak;
  xp: number;
  currentLevel: number;
  xpToNextLevel: number;
  totalXP: number;
  levelTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  achievements: Achievement[];
  unlockedAchievementCount: number;
  dailyChallenges: Challenge[];
  createdAt: Date;
  updatedAt: Date;
}

const API_BASE = '/api/v2/foundation';

export const useGamification = (userId: string) => {
  const [data, setData] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch gamification data
  const fetchGamification = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/gamification?userId=${userId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch gamification: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Unknown error');
      }

      setData(result.data as GamificationData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Gamification fetch error:', message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Get achievements only
  const fetchAchievements = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE}/gamification/achievements?userId=${userId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch achievements');
      }

      const result = await response.json();
      return result.data as Achievement[];
    } catch (err) {
      console.error('Achievements fetch error:', err);
      return [];
    }
  }, [userId]);

  // Get challenges only
  const fetchChallenges = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE}/gamification/challenges?userId=${userId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch challenges');
      }

      const result = await response.json();
      return result.data as Challenge[];
    } catch (err) {
      console.error('Challenges fetch error:', err);
      return [];
    }
  }, [userId]);

  // Track activity
  const trackActivity = useCallback(
    async (activityType: string = 'lesson_complete') => {
      try {
        const response = await fetch(`${API_BASE}/gamification/activity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, activityType }),
        });

        if (!response.ok) {
          throw new Error('Failed to track activity');
        }

        const result = await response.json();

        if (result.success) {
          // Refresh data after activity
          await fetchGamification();
          return result.data;
        }
      } catch (err) {
        console.error('Track activity error:', err);
      }
    },
    [userId, fetchGamification]
  );

  // Award XP
  const awardXP = useCallback(
    async (xpAmount: number) => {
      try {
        const response = await fetch(`${API_BASE}/gamification/xp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, xpAmount }),
        });

        if (!response.ok) {
          throw new Error('Failed to award XP');
        }

        const result = await response.json();

        if (result.success) {
          // Refresh data after XP awarded
          await fetchGamification();
          return result.data;
        }
      } catch (err) {
        console.error('Award XP error:', err);
      }
    },
    [userId, fetchGamification]
  );

  // Progress challenge
  const progressChallenge = useCallback(
    async (challengeId: string, progress: number = 1) => {
      try {
        const response = await fetch(
          `${API_BASE}/gamification/challenge/progress`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, challengeId, progress }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to progress challenge');
        }

        const result = await response.json();

        if (result.success) {
          // Refresh only if completed
          if (result.data.completed) {
            await fetchGamification();
          } else {
            // Optimistic update
            if (data?.dailyChallenges) {
              const updatedChallenges = data.dailyChallenges.map((c) =>
                c.id === challengeId
                  ? { ...c, current: Math.min(c.current + progress, c.target) }
                  : c
              );
              setData({ ...data, dailyChallenges: updatedChallenges });
            }
          }
          return result.data;
        }
      } catch (err) {
        console.error('Progress challenge error:', err);
      }
    },
    [userId, data, fetchGamification]
  );

  // Claim challenge reward
  const claimReward = useCallback(
    async (challengeId: string) => {
      try {
        const response = await fetch(
          `${API_BASE}/gamification/challenge/claim`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, challengeId }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to claim reward');
        }

        const result = await response.json();

        if (result.success) {
          // Refresh data after reward claimed
          await fetchGamification();
          return result.data;
        }
      } catch (err) {
        console.error('Claim reward error:', err);
      }
    },
    [userId, fetchGamification]
  );

  // Initial fetch
  useEffect(() => {
    if (userId) {
      fetchGamification();
    }
  }, [userId, fetchGamification]);

  return {
    // Data
    data,
    loading,
    error,

    // Selectors
    streak: data?.streak,
    level: data?.currentLevel,
    totalXP: data?.totalXP,
    xpToNextLevel: data?.xpToNextLevel,
    levelTier: data?.levelTier,
    achievements: data?.achievements || [],
    unlockedAchievements: data?.achievements.filter((a) => a.unlocked) || [],
    dailyChallenges: data?.dailyChallenges || [],

    // Actions
    fetchGamification,
    fetchAchievements,
    fetchChallenges,
    trackActivity,
    awardXP,
    progressChallenge,
    claimReward,
  };
};
