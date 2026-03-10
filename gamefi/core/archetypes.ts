// ============================================
// SoulFriend GameFi — Archetype Definitions
// ============================================

import { ArchetypeInfo, ArchetypeId } from './types';

/** Full archetype data with Vietnamese content */
export const ARCHETYPES: Record<ArchetypeId, ArchetypeInfo> = {
  'Người Tìm Đường': {
    id: 'Người Tìm Đường',
    ten: 'Người Tìm Đường',
    moTa: 'Đang tìm hướng đi trong cuộc sống. Khao khát ý nghĩa và mục đích.',
    startingStats: { meaning: 3, cognitiveFlexibility: 1 },
    growthBonus: { meaning: 10 },
    preferredQuests: ['reflection', 'narrative'],
  },
  'Người Hồi Sinh': {
    id: 'Người Hồi Sinh',
    ten: 'Người Hồi Sinh',
    moTa: 'Đang vượt qua tổn thương. Sức mạnh nội tâm đang hồi phục.',
    startingStats: { psychologicalSafety: 3, emotionalAwareness: 1 },
    growthBonus: { psychologicalSafety: 10 },
    preferredQuests: ['reflection', 'growth'],
  },
  'Người Kiến Tạo': {
    id: 'Người Kiến Tạo',
    ten: 'Người Kiến Tạo',
    moTa: 'Muốn xây dựng bản thân tốt hơn. Luôn tìm cách phát triển.',
    startingStats: { cognitiveFlexibility: 3, meaning: 1 },
    growthBonus: { cognitiveFlexibility: 10 },
    preferredQuests: ['growth', 'narrative'],
  },
  'Người Đồng Cảm': {
    id: 'Người Đồng Cảm',
    ten: 'Người Đồng Cảm',
    moTa: 'Thích hỗ trợ người khác. Sức mạnh nằm ở sự kết nối.',
    startingStats: { relationshipQuality: 3, psychologicalSafety: 1 },
    growthBonus: { relationshipQuality: 10 },
    preferredQuests: ['community', 'growth'],
  },
  'Người Khám Phá': {
    id: 'Người Khám Phá',
    ten: 'Người Khám Phá',
    moTa: 'Tò mò về cảm xúc và tâm trí. Luôn muốn hiểu bản thân sâu hơn.',
    startingStats: { emotionalAwareness: 3, cognitiveFlexibility: 1 },
    growthBonus: { emotionalAwareness: 10 },
    preferredQuests: ['reflection', 'narrative'],
  },
};

/** Get archetype info by ID */
export function getArchetype(id: ArchetypeId): ArchetypeInfo {
  return ARCHETYPES[id];
}

/** Get all archetypes */
export function getAllArchetypes(): ArchetypeInfo[] {
  return Object.values(ARCHETYPES);
}
