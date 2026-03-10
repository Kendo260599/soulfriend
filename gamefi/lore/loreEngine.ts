// ============================================
// SoulFriend GameFi — Lore Engine
// ============================================
// Thế Giới Nội Tâm — mythology tâm lý
// Lore xuất hiện qua quest, level up, location unlock, milestone

import {
  LoreMessage,
  LoreTrigger,
  LegendaryFigure,
  LocationLore,
  WorldPhilosophy,
  LocationId,
} from '../core/types';

// ══════════════════════════════════════════════
// WORLD PHILOSOPHY — Triết lý cốt lõi
// ══════════════════════════════════════════════

const WORLD_PHILOSOPHIES: WorldPhilosophy[] = [
  {
    id: 'phil_01',
    noiDung: 'Không ai thật sự lạc lối. Chỉ là họ chưa tìm thấy con đường trong thế giới nội tâm của mình.',
  },
  {
    id: 'phil_02',
    noiDung: 'Thế Giới Nội Tâm tồn tại trong tâm trí mỗi con người. Mỗi người sinh ra đều mang theo một vùng đất như vậy, nhưng hầu hết không bao giờ khám phá nó.',
  },
  {
    id: 'phil_03',
    noiDung: 'Một người có thể khám phá thế giới nội tâm một mình. Nhưng hành trình trở nên dễ dàng hơn khi có Những Người Đồng Hành.',
  },
  {
    id: 'phil_04',
    noiDung: 'Con rồng lớn nhất mà nhiều người phải đối mặt không phải quái vật — mà là lo âu, cô đơn, và mất phương hướng.',
  },
  {
    id: 'phil_05',
    noiDung: 'Ý nghĩa cuộc sống không phải là đích đến mà là hành trình bạn đã đi qua.',
  },
];

// ══════════════════════════════════════════════
// LEGENDARY FIGURES — Nhân vật huyền thoại
// ══════════════════════════════════════════════

const LEGENDARY_FIGURES: LegendaryFigure[] = [
  {
    id: 'legend_nguoi_quan_sat',
    ten: 'Người Quan Sát',
    moTa: 'Người đầu tiên nhận ra rằng cảm xúc có thể được hiểu. Trong bóng tối của sự mơ hồ, Người Quan Sát đã dừng lại, nhìn vào bên trong, và lần đầu tiên gọi tên nỗi buồn của mình.',
    becomeCondition: 'Bắt đầu hành trình — mọi người chơi đều là Người Quan Sát khi mới bước vào Thế Giới Nội Tâm.',
  },
  {
    id: 'legend_nguoi_hoi_sinh',
    ten: 'Người Hồi Sinh',
    moTa: 'Người đã vượt qua nỗi đau lớn và viết lại câu chuyện của mình. Khi tất cả tưởng đã kết thúc, Người Hồi Sinh đã tìm được cách nhìn quá khứ bằng đôi mắt mới.',
    becomeCondition: 'Master nhánh Emotional Regulation — vượt qua dòng sông cảm xúc.',
  },
  {
    id: 'legend_nguoi_dong_hanh',
    ten: 'Người Đồng Hành',
    moTa: 'Người giúp đỡ những lữ hành khác trên hành trình. Người Đồng Hành không đi trước cũng không đi sau — họ đi bên cạnh.',
    becomeCondition: 'Master nhánh Relationship Skills — trở thành người kết nối trong cộng đồng.',
  },
  {
    id: 'legend_nguoi_dan_duong',
    ten: 'Người Dẫn Đường',
    moTa: 'Những người đã đi qua toàn bộ hành trình. Họ không dạy người khác phải đi đâu — họ chỉ soi sáng con đường phía trước.',
    becomeCondition: 'Master nhánh Meaning & Purpose — đến được Đỉnh Núi Ý Nghĩa.',
  },
];

// ══════════════════════════════════════════════
// LOCATION LORE — Truyền thuyết vùng đất
// ══════════════════════════════════════════════

const LOCATION_LORES: LocationLore[] = [
  {
    locationId: 'thung_lung_cau_hoi',
    ten: 'Thung Lũng Câu Hỏi',
    truyenThuyet: 'Nơi mọi hành trình bắt đầu. Trong thung lũng tĩnh lặng này, tiếng vọng của những câu hỏi chưa được trả lời vang lên: "Tôi là ai?", "Tôi muốn gì?", "Tại sao tôi cảm thấy như vậy?" Những người dũng cảm dừng lại để lắng nghe sẽ tìm thấy con đường đầu tiên.',
    trieuLy: 'Hành trình ngàn dặm bắt đầu bằng một câu hỏi.',
  },
  {
    locationId: 'rung_tu_nhan_thuc',
    ten: 'Rừng Tự Nhận Thức',
    truyenThuyet: 'Một khu rừng đầy những tấm gương. Mỗi tấm gương phản chiếu một phần của bản thân mà người lữ hành chưa từng nhìn thấy. Nhiều người sợ hãi và quay lại. Nhưng ai đủ can đảm nhìn sẽ bắt đầu hiểu mình thật sự là ai.',
    trieuLy: 'Sự thật không đáng sợ bằng sự mơ hồ.',
  },
  {
    locationId: 'dong_song_cam_xuc',
    ten: 'Dòng Sông Cảm Xúc',
    truyenThuyet: 'Một con sông luôn thay đổi — lúc êm ả, lúc dữ dội. Ai cố gắng chống lại nó sẽ bị cuốn đi. Ai học cách bơi cùng dòng nước sẽ tìm được sự bình yên. Truyền thuyết kể rằng Người Hồi Sinh đã suýt chìm ở đây, nhưng thay vì chống lại, đã học cách thở và để dòng sông đưa đi.',
    trieuLy: 'Cảm xúc không phải kẻ thù — chúng là dòng nước dẫn ta về nhà.',
  },
  {
    locationId: 'thanh_pho_ket_noi',
    ten: 'Thành Phố Kết Nối',
    truyenThuyet: 'Một thành phố được xây bằng những mối quan hệ. Mỗi cây cầu ở đây được xây bởi một cuộc trò chuyện chân thành, mỗi ngôi nhà được dựng từ sự tin tưởng. Ở đây người lữ hành gặp những người đồng hành khác và học rằng không ai cần phải đi một mình.',
    trieuLy: 'Sức mạnh thật sự không đến từ một mình — mà từ sự kết nối.',
  },
  {
    locationId: 'dinh_nui_y_nghia',
    ten: 'Đỉnh Núi Ý Nghĩa',
    truyenThuyet: 'Nơi cao nhất của Thế Giới Nội Tâm. Không phải ai cũng đến được đây. Những người leo lên được ngọn núi này nhận ra một điều: ý nghĩa cuộc sống không phải là đích đến — mà là hành trình họ đã đi qua. Từ đỉnh núi, họ có thể nhìn lại mọi vùng đất đã đi qua và thấy mọi thử thách đều có ý nghĩa.',
    trieuLy: 'Đỉnh cao không phải nơi bạn đứng — mà là cách bạn nhìn lại.',
  },
];

// ══════════════════════════════════════════════
// LORE MESSAGES — Thông điệp xuất hiện trong game
// ══════════════════════════════════════════════

const LORE_MESSAGES: LoreMessage[] = [
  // ── Level up ────────────────────────────
  {
    id: 'lore_level_1',
    trigger: 'level_up',
    triggerRef: '1',
    text: 'Bạn đã bước vào Thế Giới Nội Tâm. Hành trình hiểu bản thân bắt đầu từ đây.',
  },
  {
    id: 'lore_level_2',
    trigger: 'level_up',
    triggerRef: '2',
    text: 'Bạn không còn là người đứng bên ngoài nữa. Bạn đã bắt đầu lắng nghe tiếng nói bên trong.',
  },
  {
    id: 'lore_level_3',
    trigger: 'level_up',
    triggerRef: '3',
    text: 'Thế Giới Nội Tâm đang mở rộng. Bạn bắt đầu thấy những con đường mà trước đây bị che khuất.',
  },
  {
    id: 'lore_level_4',
    trigger: 'level_up',
    triggerRef: '4',
    text: 'Những người xung quanh bắt đầu nhận ra sự thay đổi ở bạn. Sự hiểu biết đang trở thành ánh sáng.',
  },
  {
    id: 'lore_level_5',
    trigger: 'level_up',
    triggerRef: '5',
    text: 'Bạn đã đi qua thung lũng, rừng sâu, dòng sông, và thành phố. Đỉnh núi đang chờ đợi.',
  },

  // ── Location unlock ─────────────────────
  {
    id: 'lore_loc_thung_lung',
    trigger: 'location_unlock',
    triggerRef: 'thung_lung_cau_hoi',
    text: 'Chào mừng đến Thung Lũng Câu Hỏi — nơi mọi hành trình bắt đầu. Hãy lắng nghe tiếng vọng của những câu hỏi chưa được trả lời.',
  },
  {
    id: 'lore_loc_rung',
    trigger: 'location_unlock',
    triggerRef: 'rung_tu_nhan_thuc',
    text: 'Bạn đã bước vào khu rừng nơi mọi người lần đầu nhìn thấy chính mình. Những tấm gương ở đây không nói dối.',
  },
  {
    id: 'lore_loc_song',
    trigger: 'location_unlock',
    triggerRef: 'dong_song_cam_xuc',
    text: 'Dòng sông cảm xúc hiện ra trước mắt. Đừng cố chống lại dòng chảy — hãy học cách bơi cùng nó.',
  },
  {
    id: 'lore_loc_thanh_pho',
    trigger: 'location_unlock',
    triggerRef: 'thanh_pho_ket_noi',
    text: 'Cánh cổng Thành Phố Kết Nối đã mở. Mỗi cây cầu ở đây được xây bởi một cuộc trò chuyện chân thành.',
  },
  {
    id: 'lore_loc_dinh_nui',
    trigger: 'location_unlock',
    triggerRef: 'dinh_nui_y_nghia',
    text: 'Con đường lên Đỉnh Núi Ý Nghĩa đã mở. Rất ít người đến được đây. Từ đỉnh núi, bạn sẽ nhìn lại toàn bộ hành trình.',
  },

  // ── Skill unlock ────────────────────────
  {
    id: 'lore_skill_nhan_dien',
    trigger: 'skill_unlock',
    triggerRef: 'sa_1_nhan_dien_cam_xuc',
    text: 'Bạn đã học cách gọi tên cảm xúc. Như Người Quan Sát ngày xưa, bạn bắt đầu nhìn vào bên trong thay vì chạy trốn.',
  },
  {
    id: 'lore_skill_binh_tinh',
    trigger: 'skill_unlock',
    triggerRef: 'er_1_binh_tinh',
    text: 'Bạn đã tìm được sự tĩnh lặng giữa cơn bão. Dòng sông vẫn chảy, nhưng bạn không còn bị cuốn đi.',
  },
  {
    id: 'lore_skill_goc_nhin',
    trigger: 'skill_unlock',
    triggerRef: 'cf_1_goc_nhin_khac',
    text: 'Một tấm gương mới xuất hiện trong Rừng Tự Nhận Thức. Bạn bắt đầu nhìn vấn đề từ nhiều góc độ.',
  },
  {
    id: 'lore_skill_lang_nghe',
    trigger: 'skill_unlock',
    triggerRef: 'rs_1_lang_nghe',
    text: 'Cánh cổng đầu tiên của Thành Phố Kết Nối đã mở. Bạn đã học nghệ thuật lắng nghe thật sự.',
  },
  {
    id: 'lore_skill_gia_tri',
    trigger: 'skill_unlock',
    triggerRef: 'mp_1_gia_tri_ca_nhan',
    text: 'Chân núi đã hiện ra. Bạn bắt đầu nhận ra những giá trị thật sự quan trọng trong cuộc đời mình.',
  },
  {
    id: 'lore_skill_nhan_thuc_sau',
    trigger: 'skill_unlock',
    triggerRef: 'sa_4_nhan_thuc_sau',
    text: 'Bạn đã nhìn xuyên qua tất cả tấm gương trong rừng. Giờ đây, bạn hiểu động cơ sâu thẳm bên trong mình.',
  },
  {
    id: 'lore_skill_phuc_hoi',
    trigger: 'skill_unlock',
    triggerRef: 'er_4_phuc_hoi_nhanh',
    text: 'Dòng sông không còn đáng sợ nữa. Bạn đã học cách ngã xuống và đứng dậy — như Người Hồi Sinh trong truyền thuyết.',
  },
  {
    id: 'lore_skill_tu_duy',
    trigger: 'skill_unlock',
    triggerRef: 'cf_4_tu_duy_phat_trien',
    text: 'Mọi khó khăn giờ đây đều là cơ hội. Bạn đã viết lại câu chuyện của mình bằng ngôn ngữ của sự trưởng thành.',
  },
  {
    id: 'lore_skill_ho_tro',
    trigger: 'skill_unlock',
    triggerRef: 'rs_4_ho_tro_nguoi_khac',
    text: 'Bạn đã trở thành cây cầu trong Thành Phố Kết Nối. Giống Người Đồng Hành, bạn đi bên cạnh những người cần giúp đỡ.',
  },
  {
    id: 'lore_skill_song_co_y_nghia',
    trigger: 'skill_unlock',
    triggerRef: 'mp_4_song_co_y_nghia',
    text: 'Bạn đã đứng trên Đỉnh Núi Ý Nghĩa. Nhìn lại hành trình, mọi bước đi đều có ý nghĩa — kể cả những bước đi lạc.',
  },

  // ── Branch mastery ──────────────────────
  {
    id: 'lore_mastery_sa',
    trigger: 'branch_mastery',
    triggerRef: 'self_awareness',
    text: 'Bạn đã trở thành Người Thấu Hiểu. Như truyền thuyết kể, ai hiểu được chính mình thì có thể hiểu được cả thế giới.',
  },
  {
    id: 'lore_mastery_er',
    trigger: 'branch_mastery',
    triggerRef: 'emotional_regulation',
    text: 'Bạn đã trở thành Người Bình Yên. Dòng sông cảm xúc giờ đây là bạn đồng hành, không còn là kẻ thù.',
  },
  {
    id: 'lore_mastery_cf',
    trigger: 'branch_mastery',
    triggerRef: 'cognitive_flexibility',
    text: 'Bạn đã trở thành Người Linh Hoạt. Không có bóng tối nào mà bạn không tìm được ánh sáng.',
  },
  {
    id: 'lore_mastery_rs',
    trigger: 'branch_mastery',
    triggerRef: 'relationship_skills',
    text: 'Bạn đã trở thành Người Kết Nối. Như Người Đồng Hành trong truyền thuyết, bạn đi bên cạnh những người khác.',
  },
  {
    id: 'lore_mastery_mp',
    trigger: 'branch_mastery',
    triggerRef: 'meaning_purpose',
    text: 'Bạn đã trở thành Người Dẫn Đường. Hành trình chưa kết thúc — nhưng giờ đây bạn có thể soi sáng cho người khác.',
  },

  // ── Synergy unlock ──────────────────────
  {
    id: 'lore_syn_inner_balance',
    trigger: 'synergy_unlock',
    triggerRef: 'syn_inner_balance',
    text: 'Inner Balance đã thức tỉnh. Khi hiểu mình và điều tiết được cảm xúc, bạn tìm được sự cân bằng mà nhiều người tìm kiếm cả đời.',
  },
  {
    id: 'lore_syn_community_builder',
    trigger: 'synergy_unlock',
    triggerRef: 'syn_community_builder',
    text: 'Community Builder đã thức tỉnh. Bạn không chỉ kết nối — bạn đang xây dựng những cây cầu cho người khác đi qua.',
  },
  {
    id: 'lore_syn_life_pathfinder',
    trigger: 'synergy_unlock',
    triggerRef: 'syn_life_pathfinder',
    text: 'Life Pathfinder đã thức tỉnh. Sự kiên cường kết hợp ý nghĩa — bạn đã trở thành người tìm đường trong cuộc sống thật.',
  },

  // ── Milestone ───────────────────────────
  {
    id: 'lore_mile_first_quest',
    trigger: 'milestone',
    triggerRef: 'first_quest',
    text: 'Bạn đã hoàn thành nhiệm vụ đầu tiên. Từ rất lâu trước đây, những Người Dẫn Đường cũng bắt đầu như vậy.',
  },
  {
    id: 'lore_mile_10_quests',
    trigger: 'milestone',
    triggerRef: '10_quests',
    text: 'Mười bước đã qua. Thế Giới Nội Tâm đang mở rộng dưới chân bạn.',
  },
  {
    id: 'lore_mile_50_quests',
    trigger: 'milestone',
    triggerRef: '50_quests',
    text: 'Năm mươi bước trên hành trình. Bạn đã đi xa hơn nhiều người từng nghĩ mình có thể.',
  },
  {
    id: 'lore_mile_100_quests',
    trigger: 'milestone',
    triggerRef: '100_quests',
    text: 'Một trăm bước. Truyền thuyết sẽ kể về những người như bạn — những người không bỏ cuộc.',
  },
  {
    id: 'lore_mile_first_help',
    trigger: 'milestone',
    triggerRef: 'first_help',
    text: 'Bạn đã giúp người khác lần đầu tiên. Cộng đồng Những Người Đồng Hành chào đón bạn.',
  },
];

// ══════════════════════════════════════════════
// IN-MEMORY STORES
// ══════════════════════════════════════════════

const messageMap: Map<string, LoreMessage> = new Map();
let initialized = false;

// ══════════════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════════════

/** Initialize lore data */
export function initLore(): void {
  messageMap.clear();
  for (const m of LORE_MESSAGES) {
    messageMap.set(m.id, m);
  }
  initialized = true;
}

/** Get the world name */
export function getWorldName(): string {
  return 'Thế Giới Nội Tâm';
}

/** Get the player role name */
export function getPlayerRole(): string {
  return 'Người Lữ Hành Nội Tâm';
}

/** Get the community name */
export function getCommunityName(): string {
  return 'Những Người Đồng Hành';
}

// ── Philosophies ──────────────────────────────

/** Get all world philosophies */
export function getAllPhilosophies(): WorldPhilosophy[] {
  return [...WORLD_PHILOSOPHIES];
}

/** Get a random philosophy */
export function getRandomPhilosophy(): WorldPhilosophy {
  const idx = Math.floor(Math.random() * WORLD_PHILOSOPHIES.length);
  return WORLD_PHILOSOPHIES[idx];
}

// ── Legendary Figures ────────────────────────

/** Get all legendary figures */
export function getAllLegends(): LegendaryFigure[] {
  return [...LEGENDARY_FIGURES];
}

/** Get a legend by ID */
export function getLegend(id: string): LegendaryFigure | undefined {
  return LEGENDARY_FIGURES.find((f) => f.id === id);
}

// ── Location Lore ────────────────────────────

/** Get all location lores */
export function getAllLocationLores(): LocationLore[] {
  return [...LOCATION_LORES];
}

/** Get lore for a specific location */
export function getLocationLore(locationId: LocationId): LocationLore | undefined {
  return LOCATION_LORES.find((l) => l.locationId === locationId);
}

// ── Lore Messages ────────────────────────────

/** Get all lore messages */
export function getAllLoreMessages(): LoreMessage[] {
  if (!initialized) initLore();
  return Array.from(messageMap.values());
}

/** Get a lore message by ID */
export function getLoreMessage(id: string): LoreMessage | undefined {
  if (!initialized) initLore();
  return messageMap.get(id);
}

/** Get lore messages by trigger type */
export function getLoreByTrigger(trigger: LoreTrigger): LoreMessage[] {
  if (!initialized) initLore();
  return getAllLoreMessages().filter((m) => m.trigger === trigger);
}

/**
 * Get the lore message for a specific event.
 * E.g. getLoreForEvent('level_up', '2') → level 2 lore message
 *      getLoreForEvent('location_unlock', 'rung_tu_nhan_thuc') → forest lore
 */
export function getLoreForEvent(trigger: LoreTrigger, ref: string): LoreMessage | undefined {
  if (!initialized) initLore();
  return getAllLoreMessages().find((m) => m.trigger === trigger && m.triggerRef === ref);
}

/** Get the total number of lore messages */
export function getLoreMessageCount(): number {
  if (!initialized) initLore();
  return messageMap.size;
}
