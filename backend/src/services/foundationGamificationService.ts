/**
 * English Foundation Gamification Service
 * Handles streak tracking, XP progression, achievements, and daily challenges
 */

import { EnglishFoundationGamification, IEnglishFoundationGamification } from '../models/EnglishFoundationGamification';
import { logger } from '../utils/logger';

// ── Constants ──────────────────────────────

const defaultAchievements = [
  // Common
  { id: 'first_lesson', name: 'First Step', description: 'Complete your first lesson', icon: '🎓', rarity: 'common' },
  { id: 'five_lessons', name: 'Getting Started', description: 'Complete 5 lessons', icon: '📚', rarity: 'common' },
  { id: 'ten_lessons', name: 'On a Roll', description: 'Complete 10 lessons', icon: '🚀', rarity: 'common' },
  { id: 'daily_05', name: 'Early Bird', description: 'Maintain a 5-day streak', icon: '🐦', rarity: 'uncommon' },

  // Uncommon
  { id: 'daily_10', name: 'Week Warrior', description: 'Maintain a 10-day streak', icon: '⚔️', rarity: 'uncommon' },
  { id: 'daily_30', name: 'Month Master', description: 'Maintain a 30-day streak', icon: '📅', rarity: 'uncommon' },
  { id: 'level_10', name: 'Proficient', description: 'Reach level 10', icon: '⭐', rarity: 'uncommon' },

  // Rare
  { id: 'daily_50', name: 'Golden Streak', description: 'Maintain a 50-day streak', icon: '✨', rarity: 'rare' },
  { id: 'level_25', name: 'Expert', description: 'Reach level 25', icon: '🏆', rarity: 'rare' },
  { id: 'perfections', name: 'Perfectionist', description: 'Score 100% on 10 lessons', icon: '💯', rarity: 'rare' },

  // Legendary
  { id: 'daily_100', name: 'Eternal Student', description: 'Maintain a 100-day streak', icon: '👑', rarity: 'legendary' },
  { id: 'level_50', name: 'Master', description: 'Reach level 50', icon: '🧙', rarity: 'legendary' },
  { id: 'legendary_xp', name: 'XP Legend', description: 'Earn 100,000 total XP', icon: '🌟', rarity: 'legendary' },
];

// ── Initialization ─────────────────────────

/**
 * Get or create gamification record for a user
 */
export async function getOrCreateGamification(userId: string): Promise<IEnglishFoundationGamification> {
  try {
    let record = await EnglishFoundationGamification.findOne({ userId });

    if (!record) {
      // Create new record with default achievements
      record = new EnglishFoundationGamification({
        userId,
        achievements: defaultAchievements.map((ach) => ({
          ...ach,
          unlocked: false,
          unlockedAt: null,
        })),
        dailyChallenges: generateDailyChallenges(),
      });
      await record.save();
      logger.info(`Created gamification record for user ${userId}`);
    }

    return record;
  } catch (error) {
    logger.error('Error getting/creating gamification:', error);
    throw error;
  }
}

// ── Daily Challenges ───────────────────────

/**
 * Generate daily challenges (should be pseudo-random but same for all users in a day)
 */
function generateDailyChallenges() {
  const now = new Date();
  const today = new Date(now.toDateString());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return [
    {
      id: 'daily_3_lessons',
      title: 'Complete 3 Lessons',
      description: 'Finish 3 lessons to earn bonus XP',
      icon: '📚',
      target: 3,
      current: 0,
      reward: 50,
      completed: false,
      completedAt: null,
      resetDate: tomorrow,
    },
    {
      id: 'daily_gram_10min',
      title: '10 Minutes Grammar',
      description: 'Spend 10 minutes on grammar exercises',
      icon: '✏️',
      target: 10,
      current: 0,
      reward: 30,
      completed: false,
      completedAt: null,
      resetDate: tomorrow,
    },
    {
      id: 'daily_vocab_20',
      title: 'Learn 20 Words',
      description: 'Learn 20 new vocabulary words',
      icon: '📖',
      target: 20,
      current: 0,
      reward: 40,
      completed: false,
      completedAt: null,
      resetDate: tomorrow,
    },
  ];
}

/**
 * Reset daily challenges if date has changed
 */
async function resetDailyChallengesIfNeeded(gamification: IEnglishFoundationGamification): Promise<void> {
  const now = new Date();
  const today = new Date(now.toDateString());

  const lastReset = new Date(gamification.lastChallengeResetDate.toDateString());

  if (today > lastReset) {
    gamification.dailyChallenges = generateDailyChallenges();
    gamification.lastChallengeResetDate = today;
    await gamification.save();
  }
}

// ── Streak Management ──────────────────────

/**
 * Update streak based on activity
 */
export async function updateStreak(userId: string, isActive: boolean = true): Promise<void> {
  try {
    const gamification = await getOrCreateGamification(userId);
    const now = new Date();
    const today = new Date(now.toDateString());

    const lastActive = gamification.streak.lastActiveDate 
      ? new Date(gamification.streak.lastActiveDate.toDateString())
      : null;

    if (isActive) {
      if (!lastActive || lastActive < today) {
        // New day activity
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastActive && lastActive.getTime() === yesterday.getTime()) {
          // Consecutive day - increment streak
          gamification.streak.currentStreak += 1;
          gamification.streak.missedDays = 0;
        } else if (!lastActive) {
          // First activity
          gamification.streak.currentStreak = 1;
          gamification.streak.startDate = today;
          gamification.streak.missedDays = 0;
        } else {
          // Streak broken - reset
          gamification.streak.currentStreak = 1;
          gamification.streak.startDate = today;
          gamification.streak.missedDays = Math.floor(
            (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
          ) - 1;
        }

        // Update best streak
        if (gamification.streak.currentStreak > gamification.streak.bestStreak) {
          gamification.streak.bestStreak = gamification.streak.currentStreak;
        }

        gamification.streak.lastActiveDate = today;
      }
    }

    gamification.lastActiveSessionDate = now;
    await gamification.save();
  } catch (error) {
    logger.error('Error updating streak:', error);
    throw error;
  }
}

// ── XP & Level System ──────────────────────

/**
 * Add XP to user and handle level ups
 */
export async function addXP(userId: string, xpAmount: number): Promise<{ newLevel: boolean; currentLevel: number }> {
  try {
    const gamification = await getOrCreateGamification(userId);

    const previousLevel = gamification.currentLevel;
    gamification.xp += xpAmount;
    gamification.totalXP += xpAmount;

    // Calculate levels (100 XP for level 1-5, 200 for 6-15, 300 for 16+)
    let totalXpRequired = 0;
    let level = 1;

    while (level <= 100) {
      let xpForThisLevel = 100;
      if (level > 15) xpForThisLevel = 300;
      else if (level > 5) xpForThisLevel = 200;

      if (totalXpRequired + xpForThisLevel > gamification.totalXP) {
        break;
      }

      totalXpRequired += xpForThisLevel;
      level++;
    }

    gamification.currentLevel = level;
    gamification.xpToNextLevel = getTotalXPRequiredForLevel(level + 1) - gamification.totalXP;

    // Update tier
    if (level <= 5) gamification.levelTier = 'bronze';
    else if (level <= 15) gamification.levelTier = 'silver';
    else if (level <= 30) gamification.levelTier = 'gold';
    else gamification.levelTier = 'platinum';

    await gamification.save();

    return {
      newLevel: gamification.currentLevel > previousLevel,
      currentLevel: gamification.currentLevel,
    };
  } catch (error) {
    logger.error('Error adding XP:', error);
    throw error;
  }
}

/**
 * Calculate total XP required to reach a specific level
 */
function getTotalXPRequiredForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    let xpForLevel = 100;
    if (i > 15) xpForLevel = 300;
    else if (i > 5) xpForLevel = 200;
    total += xpForLevel;
  }
  return total;
}

// ── Achievement System ─────────────────────

/**
 * Check and unlock achievements
 */
export async function checkAndUnlockAchievements(userId: string): Promise<string[]> {
  try {
    const gamification = await getOrCreateGamification(userId);
    const unlockedIds: string[] = [];

    for (const achievement of gamification.achievements) {
      if (!achievement.unlocked) {
        let shouldUnlock = false;

        // Check unlock conditions
        switch (achievement.id) {
          case 'first_lesson':
            shouldUnlock = true; // Can be unlocked another way
            break;
          case 'five_lessons':
            // Check through another service
            shouldUnlock = false;
            break;
          case 'daily_05':
            shouldUnlock = gamification.streak.currentStreak >= 5;
            break;
          case 'daily_10':
            shouldUnlock = gamification.streak.currentStreak >= 10;
            break;
          case 'daily_30':
            shouldUnlock = gamification.streak.currentStreak >= 30;
            break;
          case 'daily_50':
            shouldUnlock = gamification.streak.currentStreak >= 50;
            break;
          case 'daily_100':
            shouldUnlock = gamification.streak.currentStreak >= 100;
            break;
          case 'level_10':
            shouldUnlock = gamification.currentLevel >= 10;
            break;
          case 'level_25':
            shouldUnlock = gamification.currentLevel >= 25;
            break;
          case 'level_50':
            shouldUnlock = gamification.currentLevel >= 50;
            break;
          case 'legendary_xp':
            shouldUnlock = gamification.totalXP >= 100000;
            break;
        }

        if (shouldUnlock) {
          achievement.unlocked = true;
          achievement.unlockedAt = new Date();
          unlockedIds.push(achievement.id);
          gamification.unlockedAchievementCount += 1;
          logger.info(`Achievement unlocked: ${achievement.id} for user ${userId}`);
        }
      }
    }

    if (unlockedIds.length > 0) {
      await gamification.save();
    }

    return unlockedIds;
  } catch (error) {
    logger.error('Error checking achievements:', error);
    throw error;
  }
}

// ── Daily Challenges ───────────────────────

/**
 * Progress on a specific daily challenge
 */
export async function progressDailyChallenge(userId: string, challengeId: string, progress: number): Promise<boolean> {
  try {
    const gamification = await getOrCreateGamification(userId);
    await resetDailyChallengesIfNeeded(gamification);

    const challenge = gamification.dailyChallenges.find((c) => c.id === challengeId);
    if (!challenge) {
      throw new Error(`Challenge ${challengeId} not found`);
    }

    if (challenge.completed) {
      return false; // Already completed today
    }

    challenge.current = Math.min(challenge.current + progress, challenge.target);

    if (challenge.current >= challenge.target && !challenge.completed) {
      challenge.completed = true;
      challenge.completedAt = new Date();
      
      // Award XP
      await addXP(userId, challenge.reward);
      logger.info(`Challenge completed: ${challengeId} for user ${userId}, awarded ${challenge.reward} XP`);
    }

    await gamification.save();
    return challenge.completed;
  } catch (error) {
    logger.error('Error progressing daily challenge:', error);
    throw error;
  }
}

/**
 * Get all gamification data for a user
 */
export async function getGamificationData(userId: string): Promise<IEnglishFoundationGamification> {
  try {
    const gamification = await getOrCreateGamification(userId);
    await resetDailyChallengesIfNeeded(gamification);
    return gamification;
  } catch (error) {
    logger.error('Error getting gamification data:', error);
    throw error;
  }
}

/**
 * Claim daily challenge reward
 */
export async function claimDailyChallengeReward(userId: string, challengeId: string): Promise<number> {
  try {
    const gamification = await getOrCreateGamification(userId);
    const challenge = gamification.dailyChallenges.find((c) => c.id === challengeId);

    if (!challenge) {
      throw new Error(`Challenge ${challengeId} not found`);
    }

    if (!challenge.completed) {
      throw new Error('Challenge not completed yet');
    }

    // Already awarded when completion happened
    return challenge.reward;
  } catch (error) {
    logger.error('Error claiming reward:', error);
    throw error;
  }
}
