import React from 'react';
import '../styles/achievements.css';
import { useGamification } from '../hooks/useGamification';

/**
 * AchievementBadges - Unlockable achievements gallery
 * Motivates users with milestones and special accomplishments
 */
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string; // ISO date
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

interface AchievementBadgesProps {
  achievements?: Achievement[];
  unlockedCount?: number;
  userId?: string; // If provided, fetches live data from API
}

const AchievementBadges: React.FC<AchievementBadgesProps> = ({
  achievements: propAchievements = [],
  unlockedCount: propUnlockedCount = 0,
  userId,
}) => {
  // Use API data if userId provided, otherwise use props
  const gamification = userId ? useGamification(userId) : null;

  const achievements = gamification?.achievements ?? propAchievements;
  const unlockedCount = gamification?.unlockedAchievements?.length ?? propUnlockedCount;
  const isLoading = userId && gamification?.loading;

  const totalAchievements = achievements.length;
  const completionPercentage = totalAchievements > 0 ? (unlockedCount / totalAchievements) * 100 : 0;

  if (isLoading) {
    return (
      <div className="achievements-container achievements-loading" role="status" aria-live="polite">
        <div className="achievements-skeleton" />
      </div>
    );
  }

  // Group achievements by rarity
  const groupedByRarity = achievements.reduce(
    (acc, achievement) => {
      if (!acc[achievement.rarity]) {
        acc[achievement.rarity] = [];
      }
      acc[achievement.rarity].push(achievement);
      return acc;
    },
    {} as Record<string, Achievement[]>,
  );

  const rarityOrder = ['legendary', 'rare', 'uncommon', 'common'];

  return (
    <div className="achievements-container">
      {/* Header */}
      <div className="achievements-header">
        <h2 className="achievements-title">🏆 Achievements</h2>
        <div className="achievements-stats">
          <span className="stat-badge">
            {unlockedCount} / {totalAchievements}
          </span>
          <span className="stat-percentage">{Math.round(completionPercentage)}%</span>
        </div>
      </div>

      {/* Completion Progress Bar */}
      <div className="achievements-progress" role="progressbar" aria-valuenow={Math.round(completionPercentage)} aria-valuemin={0} aria-valuemax={100} aria-label="Achievement completion progress">
        <div className="progress-background">
          <div
            className="progress-fill"
            style={{ '--progress-width': completionPercentage } as React.CSSProperties}
            data-progress={Math.round(completionPercentage)}
          />
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="achievements-grid">
        {rarityOrder.map(
          (rarity) =>
            groupedByRarity[rarity] && (
              <div key={rarity} className="rarity-section">
                <h3 className={`rarity-label ${rarity}`}>{rarity.toUpperCase()}</h3>
                <div className={`badges-group ${rarity}`}>
                  {groupedByRarity[rarity].map((achievement, index) => (
                    <div
                      key={achievement.id}
                      className={`achievement-badge ${achievement.rarity} ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                      style={{ '--badge-delay': `${index * 0.05}s` } as React.CSSProperties}
                      role="img"
                      aria-label={`${achievement.name}: ${achievement.description}${achievement.unlocked ? ' - Unlocked' : ' - Locked'}`}
                      title={achievement.description}
                    >
                      {/* Badge Icon */}
                      <div className="badge-icon">{achievement.icon}</div>

                      {/* Badge Info (visible on hover) */}
                      <div className="badge-info">
                        <div className="badge-name">{achievement.name}</div>
                        <div className="badge-description">{achievement.description}</div>
                        {achievement.unlocked && achievement.unlockedAt && (
                          <div className="badge-date">
                            Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {/* Lock overlay for locked badges */}
                      {!achievement.unlocked && <div className="badge-lock">🔒</div>}
                    </div>
                  ))}
                </div>
              </div>
            ),
        )}
      </div>

      {/* Empty state */}
      {achievements.length === 0 && (
        <div className="achievements-empty" role="status">
          <span className="empty-icon">🎯</span>
          <p>Start learning to unlock achievements!</p>
        </div>
      )}
    </div>
  );
};

export default AchievementBadges;
