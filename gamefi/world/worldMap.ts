// ============================================
// SoulFriend GameFi — Psychological World Map
// ============================================

import { WorldLocation, LocationId, Character } from '../core/types';

// ── World locations (Vietnamese content) ─────

const WORLD_MAP: WorldLocation[] = [
  {
    id: 'thung_lung_cau_hoi',
    ten: 'Thung Lũng Câu Hỏi',
    moTa: 'Nơi bắt đầu hành trình. Mọi người đều khởi đầu với những câu hỏi.',
    unlock: { levelRequired: 1, growthScoreRequired: 0, questsRequired: [] },
  },
  {
    id: 'rung_tu_nhan_thuc',
    ten: 'Rừng Tự Nhận Thức',
    moTa: 'Học cách nhận diện cảm xúc bản thân trong khu rừng tĩnh lặng.',
    unlock: { levelRequired: 2, growthScoreRequired: 3, questsRequired: [] },
  },
  {
    id: 'dong_song_cam_xuc',
    ten: 'Dòng Sông Cảm Xúc',
    moTa: 'Học cách điều tiết cảm xúc, giống như dòng nước chảy qua mọi chướng ngại.',
    unlock: { levelRequired: 3, growthScoreRequired: 8, questsRequired: [] },
  },
  {
    id: 'thanh_pho_ket_noi',
    ten: 'Thành Phố Kết Nối',
    moTa: 'Xây dựng mối quan hệ lành mạnh trong thành phố của sự đồng cảm.',
    unlock: { levelRequired: 4, growthScoreRequired: 15, questsRequired: [] },
  },
  {
    id: 'dinh_nui_y_nghia',
    ten: 'Đỉnh Núi Ý Nghĩa',
    moTa: 'Đỉnh cao của hành trình — tìm mục đích sống.',
    unlock: { levelRequired: 5, growthScoreRequired: 25, questsRequired: [] },
  },
];

const locationMap = new Map<LocationId, WorldLocation>();

/** Initialize world map data */
export function initWorldMap(): void {
  for (const loc of WORLD_MAP) {
    locationMap.set(loc.id, loc);
  }
}

/** Get all locations */
export function getAllLocations(): WorldLocation[] {
  if (locationMap.size === 0) initWorldMap();
  return Array.from(locationMap.values());
}

/** Get a single location */
export function getLocation(id: LocationId): WorldLocation | undefined {
  if (locationMap.size === 0) initWorldMap();
  return locationMap.get(id);
}

/** Check if a character can access a location */
export function canAccessLocation(
  character: Character,
  locationId: LocationId,
): boolean {
  const loc = getLocation(locationId);
  if (!loc) return false;

  const { unlock } = loc;

  if (character.level < unlock.levelRequired) return false;
  if (character.growthScore < unlock.growthScoreRequired) return false;

  for (const qId of unlock.questsRequired) {
    if (!character.completedQuestIds.includes(qId)) return false;
  }

  return true;
}

/** Get all locations a character has unlocked */
export function getUnlockedLocations(character: Character): WorldLocation[] {
  return getAllLocations().filter((loc) => canAccessLocation(character, loc.id));
}

/** Move character to a location (if unlocked) */
export function travelTo(
  character: Character,
  locationId: LocationId,
): { success: boolean; message: string } {
  if (!canAccessLocation(character, locationId)) {
    const loc = getLocation(locationId);
    return {
      success: false,
      message: `Chưa mở khóa ${loc?.ten ?? locationId}. Hãy tiếp tục phát triển!`,
    };
  }
  character.currentLocation = locationId;
  return {
    success: true,
    message: `Bạn đã đến ${getLocation(locationId)!.ten}.`,
  };
}
