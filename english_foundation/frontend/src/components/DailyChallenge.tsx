import React, { useState } from 'react';
import '../styles/daily-challenge.css';
import { useGamification, Challenge as GamificationChallenge } from '../hooks/useGamification';

/**
 * DailyChallenge - Daily task system for engagement
 * New challenge every day with rewards
 */
interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number; // e.g., lesson count, XP amount
  current: number;
  reward: number; // XP reward
  daysStreak?: number;
}

interface DailyChallengeProps {
  challenge?: Challenge;
  completed?: boolean;
  onClaimReward?: () => void;
  userId?: string; // If provided, fetches live daily challenges from API
}

const DailyChallenge: React.FC<DailyChallengeProps> = ({
  challenge,
  completed = false,
  onClaimReward,
  userId,
}) => {
  // Use API data if userId provided, otherwise use props
  const gamification = userId ? useGamification(userId) : null;
  const isLoading = userId && gamification?.loading;

  // State for claiming rewards
  const [claimingRewardId, setClaimingRewardId] = useState<string | null>(null);

  // Handle claiming reward
  const handleClaimReward = async (challengeId: string) => {
    if (!userId || !gamification) return;

    setClaimingRewardId(challengeId);
    try {
      await gamification.claimReward(challengeId);
    } finally {
      setClaimingRewardId(null);
    }
  };

  // Handle progress a challenge
  const handleProgressChallenge = async (challengeId: string) => {
    if (!userId || !gamification) return;
    await gamification.progressChallenge(challengeId, 1);
  };

  // Display multiple challenges if userId provided, otherwise show single challenge
  if (userId && gamification) {
    if (isLoading) {
      return (
        <div className="daily-challenge-container daily-challenges-loading" role="status" aria-live="polite">
          <div className="challenges-skeleton" />
        </div>
      );
    }

    const challenges = gamification.dailyChallenges;

    return (
      <div className="daily-challenges-container">
        <div className="challenges-header">
          <h2 className="challenges-title">📋 Daily Challenges</h2>
          <p className="challenges-subtitle">Complete challenges to earn bonus XP</p>
        </div>

        <div className="challenges-list">
          {challenges.map((ch: GamificationChallenge, index: number) => (
            <SingleChallengeCard
              key={ch.id}
              challenge={ch}
              onProgress={() => handleProgressChallenge(ch.id)}
              onClaim={() => handleClaimReward(ch.id)}
              isClaimingReward={claimingRewardId === ch.id}
            />
          ))}
        </div>

        <div className="challenges-footer">
          <small className="reset-text">Challenges reset daily at 00:00 UTC</small>
        </div>
      </div>
    );
  }

  // Single challenge display (props-based)
  if (!challenge) {
    challenge = {
      id: 'default',
      title: 'Complete 3 Lessons',
      description: 'Finish 3 lessons to earn bonus experience',
      icon: '📚',
      target: 3,
      current: 0,
      reward: 50,
    };
  }

  return (
    <div className="daily-challenge-container">
      <SingleChallengeCard
        challenge={challenge}
        onClaim={onClaimReward || (() => {})}
        completed={completed}
      />

      <div className="challenge-footer">
        <small className="reset-text">Challenge resets daily at 00:00 UTC</small>
      </div>
    </div>
  );
};

// Separate component for individual challenge card
interface SingleChallengeCardProps {
  challenge: Challenge | GamificationChallenge;
  completed?: boolean;
  onClaim?: () => void;
  onProgress?: () => void;
  isClaimingReward?: boolean;
}

const SingleChallengeCard: React.FC<SingleChallengeCardProps> = ({
  challenge,
  completed = false,
  onClaim = () => {},
  onProgress = () => {},
  isClaimingReward = false,
}) => {
  const progress = Math.min((challenge.current / challenge.target) * 100, 100);
  const isCompleted = challenge.current >= challenge.target;

  return (
    <div className="challenge-card">
      {/* Challenge Card */}
      <div className={`${isCompleted ? 'completed' : ''} ${completed || ('claimed' in challenge && challenge.claimed) ? 'claimed' : ''}`}>
        {/* Header */}
        <div className="challenge-header">
          <div className="challenge-icon">{challenge.icon}</div>
          <div className="challenge-text">
            <h3 className="challenge-title">{challenge.title}</h3>
            <p className="challenge-description">{challenge.description}</p>
          </div>
          <div className="challenge-reward">
            <span className="reward-icon">⭐</span>
            <span className="reward-amount">{challenge.reward}</span>
          </div>
        </div>

        {/* Challenge Progress */}
        <div className="challenge-progress-section">
          <div className="progress-info">
            <span className="progress-text">
              {Math.min(challenge.current, challenge.target)} / {challenge.target}
            </span>
            <span className="progress-percent">{Math.round(progress)}%</span>
          </div>

          {/* Progress Bar */}
          <div className="challenge-progress-bar">
            <div
              className="progress-fill"
              style={{ '--challenge-progress': progress } as React.CSSProperties}
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Challenge progress: ${Math.round(progress)}%`}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="challenge-actions">
          {isCompleted && !completed && !isClaimingReward && (
            <button
              className="btn-claim-reward"
              onClick={onClaim}
              aria-label={`Claim ${challenge.reward} XP reward for daily challenge`}
              disabled={isClaimingReward}
            >
              🎉 Claim {challenge.reward} XP
            </button>
          )}

          {isClaimingReward && (
            <div className="challenge-claiming" role="status">
              ⏳ Claiming...
            </div>
          )}

          {(completed || ('claimed' in challenge && challenge.claimed)) && (
            <div className="challenge-claimed" role="status">
              ✓ Claimed
            </div>
          )}

          {!isCompleted && !completed && !('claimed' in challenge && challenge.claimed) && (
            <div className="challenge-incomplete">
              {challenge.target - challenge.current} more to go
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyChallenge;
