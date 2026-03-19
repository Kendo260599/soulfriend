import React from 'react';
import '../styles/xp-bar.css';
import { useGamification } from '../hooks/useGamification';

/**
 * XPProgressBar - Experience points and level progression component
 * Shows user's current level and progress towards next level
 * Gamification element for engagement
 */
interface XPProgressBarProps {
  currentXP?: number;
  xpToNextLevel?: number;
  currentLevel?: number;
  totalXP?: number; // For session/lifetime tracking
  userId?: string; // If provided, fetches live data from API
}

const XPProgressBar: React.FC<XPProgressBarProps> = ({
  currentXP: propCurrentXP = 0,
  xpToNextLevel: propXpToNextLevel = 100,
  currentLevel: propCurrentLevel = 1,
  totalXP: propTotalXP = 0,
  userId,
}) => {
  // Use API data if userId provided, otherwise use props
  const gamification = userId ? useGamification(userId) : null;

  const currentXP = gamification?.data?.xp ?? propCurrentXP;
  const xpToNextLevel = gamification?.data?.xpToNextLevel ?? propXpToNextLevel;
  const currentLevel = gamification?.data?.currentLevel ?? propCurrentLevel;
  const totalXP = gamification?.data?.totalXP ?? propTotalXP;
  const levelTier = gamification?.data?.levelTier ?? 'bronze';
  const isLoading = userId && gamification?.loading;

  const progressPercentage = (currentXP / xpToNextLevel) * 100;
  const isLevelingUp = progressPercentage >= 100;

  if (isLoading) {
    return (
      <div className="xp-container xp-loading" role="status" aria-live="polite">
        <div className="xp-skeleton" />
      </div>
    );
  }

  return (
    <div className="xp-container">
      {/* Level Badge */}
      <div className={`level-badge ${levelTier}`} aria-label={`Level ${currentLevel}`}>
        <div className="level-number">{currentLevel}</div>
        <div className="level-tier">{levelTier.charAt(0).toUpperCase() + levelTier.slice(1)}</div>
      </div>

      {/* Progress Section */}
      <div className="xp-progress-section">
        {/* Header */}
        <div className="xp-header">
          <div>
            <h3 className="xp-title">Experience Points</h3>
            <p className="xp-subtitle">
              {currentXP} / {xpToNextLevel} XP
            </p>
          </div>
          {totalXP > 0 && (
            <div className="xp-total" aria-label={`Total experience: ${totalXP}`}>
              Total: <strong>{totalXP}</strong>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="xp-bar-wrapper">
          <div className="xp-bar-background">
            {/* Main progress fill */}
            <div
              className={`xp-bar-fill ${isLevelingUp ? 'level-up' : ''}`}
              style={{ '--progress-width': Math.min(progressPercentage, 100) } as React.CSSProperties}
              role="progressbar"
              aria-valuenow={Math.min(Math.round(progressPercentage), 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Experience progress: ${Math.round(progressPercentage)}%`}
            >
              {/* Shine effect */}
              <div className="xp-bar-shine" aria-hidden="true" />
            </div>

            {/* Milestone markers */}
            <div className="xp-milestones" aria-hidden="true">
              <div className="milestone milestone-1" />
              <div className="milestone milestone-2" />
              <div className="milestone milestone-3" />
            </div>
          </div>

          {/* Percentage text overlay */}
          <div className="xp-percentage">{Math.round(Math.min(progressPercentage, 100))}%</div>
        </div>

        {/* Level up notification */}
        {isLevelingUp && (
          <div className="level-up-notification" role="alert" aria-live="polite">
            🎉 Level Up Ready! Claim your reward!
          </div>
        )}

        {/* Next level estimate */}
        <div className="xp-estimate" aria-live="polite">
          {xpToNextLevel - currentXP > 0 ? (
            <>
              <span className="xp-remaining">{xpToNextLevel - currentXP} XP</span> until next level
            </>
          ) : (
            <span className="xp-complete">Ready for next level! 🚀</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default XPProgressBar;
