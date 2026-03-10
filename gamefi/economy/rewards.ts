// ============================================
// SoulFriend GameFi — Reward & Badge System
// ============================================

import { Badge, TitleInfo, Character } from '../core/types';

// ── Badge definitions (Vietnamese) ───────────

const BADGES: Badge[] = [
  {
    id: 'badge_thau_hieu',
    ten: 'Huy Hiệu Thấu Hiểu',
    moTa: 'Dành cho người viết nhiều nhật ký.',
    condition: 'Hoàn thành 10 quest reflection',
  },
  {
    id: 'badge_dong_cam',
    ten: 'Huy Hiệu Đồng Cảm',
    moTa: 'Dành cho người hỗ trợ cộng đồng.',
    condition: 'Hoàn thành 10 quest community',
  },
  {
    id: 'badge_kien_cuong',
    ten: 'Huy Hiệu Kiên Cường',
    moTa: 'Dành cho người vượt qua khó khăn.',
    condition: 'Hoàn thành 5 quest growth liên tiếp',
  },
  {
    id: 'badge_biet_on',
    ten: 'Huy Hiệu Biết Ơn',
    moTa: 'Dành cho người thực hành biết ơn.',
    condition: 'Hoàn thành 7 quest gratitude',
  },
  {
    id: 'badge_binh_tinh',
    ten: 'Huy Hiệu Bình Tĩnh',
    moTa: 'Dành cho người thực hành điều tiết cảm xúc.',
    condition: 'Hoàn thành 5 quest emotion_regulation',
  },
];

/** Danh hiệu (titles) — progression milestones */
const TITLES: TitleInfo[] = [
  { id: 'title_nguoi_lang_nghe', ten: 'Người Lắng Nghe', requirement: 'Viết 5 nhật ký cảm xúc' },
  { id: 'title_nguoi_dong_hanh', ten: 'Người Đồng Hành', requirement: 'Giúp 10 người khác' },
  { id: 'title_nguoi_dan_duong', ten: 'Người Dẫn Đường', requirement: 'Đạt level 5 và growth score ≥ 25' },
];

const badgeMap = new Map<string, Badge>();

/** Initialize badges */
export function initRewards(): void {
  for (const b of BADGES) {
    badgeMap.set(b.id, b);
  }
}

/** Get all available badges */
export function getAllBadges(): Badge[] {
  if (badgeMap.size === 0) initRewards();
  return Array.from(badgeMap.values());
}

/** Get all title milestones */
export function getAllTitles(): TitleInfo[] {
  return [...TITLES];
}

/** Award a badge to a character (if not already earned) */
export function awardBadge(character: Character, badgeId: string): boolean {
  if (character.badges.includes(badgeId)) return false;
  if (!badgeMap.has(badgeId) && badgeMap.size === 0) initRewards();
  if (!badgeMap.has(badgeId)) return false;

  character.badges.push(badgeId);
  return true;
}

/** Award SoulPoints to a character */
export function awardSoulPoints(character: Character, amount: number): void {
  if (amount <= 0) return;
  character.soulPoints += amount;
}

/** Check if character has a specific badge */
export function hasBadge(character: Character, badgeId: string): boolean {
  return character.badges.includes(badgeId);
}
