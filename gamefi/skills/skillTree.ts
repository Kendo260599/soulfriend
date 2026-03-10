// ============================================
// SoulFriend GameFi — Skill Tree Engine
// ============================================
// 5 nhánh × 4 cấp = 20 kỹ năng tâm lý
// + 3 Skill Synergies + 5 Branch Masteries

import {
  Character,
  Skill,
  SkillBranchId,
  SkillSynergy,
  SkillUnlockCondition,
  BranchMastery,
  CharacterSkillState,
} from '../core/types';

// ══════════════════════════════════════════════
// BRANCH 1 — Self Awareness (Rừng Tự Nhận Thức)
// ══════════════════════════════════════════════

const SELF_AWARENESS_SKILLS: Skill[] = [
  {
    id: 'sa_1_nhan_dien_cam_xuc',
    branch: 'self_awareness',
    tier: 1,
    ten: 'Nhận diện cảm xúc',
    moTa: 'Khả năng gọi tên cảm xúc đang diễn ra.',
    unlockCondition: { questsCompleted: 5, questCategoriesCompleted: ['reflection'] },
    linkedLocation: 'rung_tu_nhan_thuc',
  },
  {
    id: 'sa_2_quan_sat_suy_nghi',
    branch: 'self_awareness',
    tier: 2,
    ten: 'Quan sát suy nghĩ',
    moTa: 'Hiểu suy nghĩ của mình ảnh hưởng đến cảm xúc.',
    unlockCondition: {
      questCategoriesCompleted: ['cognitive_reframing'],
      prerequisiteSkills: ['sa_1_nhan_dien_cam_xuc'],
    },
    linkedLocation: 'rung_tu_nhan_thuc',
  },
  {
    id: 'sa_3_hieu_mo_hinh_hanh_vi',
    branch: 'self_awareness',
    tier: 3,
    ten: 'Hiểu mô hình hành vi',
    moTa: 'Nhận ra thói quen tâm lý lặp lại.',
    unlockCondition: {
      reflectionCount: 15,
      prerequisiteSkills: ['sa_2_quan_sat_suy_nghi'],
    },
    linkedLocation: 'rung_tu_nhan_thuc',
  },
  {
    id: 'sa_4_nhan_thuc_sau',
    branch: 'self_awareness',
    tier: 4,
    ten: 'Nhận thức sâu',
    moTa: 'Hiểu động cơ bên trong chi phối hành vi.',
    unlockCondition: {
      narrativeQuestCompleted: true,
      prerequisiteSkills: ['sa_3_hieu_mo_hinh_hanh_vi'],
    },
    linkedLocation: 'rung_tu_nhan_thuc',
  },
];

// ══════════════════════════════════════════════
// BRANCH 2 — Emotional Regulation (Dòng Sông Cảm Xúc)
// ══════════════════════════════════════════════

const EMOTIONAL_REGULATION_SKILLS: Skill[] = [
  {
    id: 'er_1_binh_tinh',
    branch: 'emotional_regulation',
    tier: 1,
    ten: 'Bình tĩnh',
    moTa: 'Học cách dừng lại trước phản ứng.',
    unlockCondition: { questsCompleted: 3, questCategoriesCompleted: ['emotional_awareness'] },
    linkedLocation: 'dong_song_cam_xuc',
  },
  {
    id: 'er_2_dieu_tiet_stress',
    branch: 'emotional_regulation',
    tier: 2,
    ten: 'Điều tiết stress',
    moTa: 'Hiểu điều gì khiến mình căng thẳng.',
    unlockCondition: {
      questsCompleted: 5,
      questCategoriesCompleted: ['self_compassion'],
      prerequisiteSkills: ['er_1_binh_tinh'],
    },
    linkedLocation: 'dong_song_cam_xuc',
  },
  {
    id: 'er_3_chap_nhan_cam_xuc',
    branch: 'emotional_regulation',
    tier: 3,
    ten: 'Chấp nhận cảm xúc',
    moTa: 'Không né tránh cảm xúc khó.',
    unlockCondition: {
      reflectionCount: 10,
      prerequisiteSkills: ['er_2_dieu_tiet_stress'],
    },
    linkedLocation: 'dong_song_cam_xuc',
  },
  {
    id: 'er_4_phuc_hoi_nhanh',
    branch: 'emotional_regulation',
    tier: 4,
    ten: 'Phục hồi nhanh',
    moTa: 'Trở lại trạng thái ổn định sau khó khăn.',
    unlockCondition: {
      questsCompleted: 15,
      questCategoriesCompleted: ['resilience'],
      prerequisiteSkills: ['er_3_chap_nhan_cam_xuc'],
    },
    linkedLocation: 'dong_song_cam_xuc',
  },
];

// ══════════════════════════════════════════════
// BRANCH 3 — Cognitive Flexibility (Rừng Tự Nhận Thức)
// ══════════════════════════════════════════════

const COGNITIVE_FLEXIBILITY_SKILLS: Skill[] = [
  {
    id: 'cf_1_goc_nhin_khac',
    branch: 'cognitive_flexibility',
    tier: 1,
    ten: 'Nhìn vấn đề từ góc khác',
    moTa: 'Khả năng xem xét một tình huống từ nhiều hướng.',
    unlockCondition: { questsCompleted: 3, questCategoriesCompleted: ['cognitive_reframing'] },
    linkedLocation: 'rung_tu_nhan_thuc',
  },
  {
    id: 'cf_2_thach_thuc_tieu_cuc',
    branch: 'cognitive_flexibility',
    tier: 2,
    ten: 'Thách thức suy nghĩ tiêu cực',
    moTa: 'Dám đặt câu hỏi với suy nghĩ tự động.',
    unlockCondition: {
      reflectionCount: 8,
      prerequisiteSkills: ['cf_1_goc_nhin_khac'],
    },
    linkedLocation: 'rung_tu_nhan_thuc',
  },
  {
    id: 'cf_3_viet_lai_cau_chuyen',
    branch: 'cognitive_flexibility',
    tier: 3,
    ten: 'Viết lại câu chuyện',
    moTa: 'Viết lại trải nghiệm khó khăn theo cách trưởng thành hơn.',
    unlockCondition: {
      narrativeQuestCompleted: true,
      prerequisiteSkills: ['cf_2_thach_thuc_tieu_cuc'],
    },
    linkedLocation: 'rung_tu_nhan_thuc',
  },
  {
    id: 'cf_4_tu_duy_phat_trien',
    branch: 'cognitive_flexibility',
    tier: 4,
    ten: 'Tư duy phát triển',
    moTa: 'Nhìn khó khăn như cơ hội để trưởng thành.',
    unlockCondition: {
      questsCompleted: 20,
      questCategoriesCompleted: ['resilience', 'cognitive_reframing'],
      prerequisiteSkills: ['cf_3_viet_lai_cau_chuyen'],
    },
    linkedLocation: 'rung_tu_nhan_thuc',
  },
];

// ══════════════════════════════════════════════
// BRANCH 4 — Relationship Skills (Thành Phố Kết Nối)
// ══════════════════════════════════════════════

const RELATIONSHIP_SKILLS: Skill[] = [
  {
    id: 'rs_1_lang_nghe',
    branch: 'relationship_skills',
    tier: 1,
    ten: 'Lắng nghe',
    moTa: 'Khả năng lắng nghe thật sự.',
    unlockCondition: { questsCompleted: 3, questCategoriesCompleted: ['relationships'] },
    linkedLocation: 'thanh_pho_ket_noi',
  },
  {
    id: 'rs_2_dong_cam',
    branch: 'relationship_skills',
    tier: 2,
    ten: 'Đồng cảm',
    moTa: 'Hiểu cảm xúc của người khác.',
    unlockCondition: {
      helpOthersCount: 10,
      empathyScore: 15,
      prerequisiteSkills: ['rs_1_lang_nghe'],
    },
    linkedLocation: 'thanh_pho_ket_noi',
  },
  {
    id: 'rs_3_giao_tiep_lanh_manh',
    branch: 'relationship_skills',
    tier: 3,
    ten: 'Giao tiếp lành mạnh',
    moTa: 'Truyền đạt suy nghĩ và cảm xúc một cách lành mạnh.',
    unlockCondition: {
      questsCompleted: 10,
      questCategoriesCompleted: ['empathy', 'relationships'],
      prerequisiteSkills: ['rs_2_dong_cam'],
    },
    linkedLocation: 'thanh_pho_ket_noi',
  },
  {
    id: 'rs_4_ho_tro_nguoi_khac',
    branch: 'relationship_skills',
    tier: 4,
    ten: 'Hỗ trợ người khác',
    moTa: 'Chủ động giúp đỡ người khác vượt qua khó khăn.',
    unlockCondition: {
      helpOthersCount: 20,
      empathyScore: 30,
      prerequisiteSkills: ['rs_3_giao_tiep_lanh_manh'],
    },
    linkedLocation: 'thanh_pho_ket_noi',
  },
];

// ══════════════════════════════════════════════
// BRANCH 5 — Meaning & Purpose (Đỉnh Núi Ý Nghĩa)
// ══════════════════════════════════════════════

const MEANING_PURPOSE_SKILLS: Skill[] = [
  {
    id: 'mp_1_gia_tri_ca_nhan',
    branch: 'meaning_purpose',
    tier: 1,
    ten: 'Giá trị cá nhân',
    moTa: 'Nhận diện những giá trị quan trọng với mình.',
    unlockCondition: { questsCompleted: 5, questCategoriesCompleted: ['meaning_purpose'] },
    linkedLocation: 'dinh_nui_y_nghia',
  },
  {
    id: 'mp_2_muc_tieu_cuoc_song',
    branch: 'meaning_purpose',
    tier: 2,
    ten: 'Mục tiêu cuộc sống',
    moTa: 'Xác định mục tiêu cá nhân rõ ràng.',
    unlockCondition: {
      reflectionCount: 10,
      questCategoriesCompleted: ['gratitude'],
      prerequisiteSkills: ['mp_1_gia_tri_ca_nhan'],
    },
    linkedLocation: 'dinh_nui_y_nghia',
  },
  {
    id: 'mp_3_dinh_huong_tuong_lai',
    branch: 'meaning_purpose',
    tier: 3,
    ten: 'Định hướng tương lai',
    moTa: 'Lập kế hoạch sống có chiều sâu.',
    unlockCondition: {
      questsCompleted: 15,
      prerequisiteSkills: ['mp_2_muc_tieu_cuoc_song'],
    },
    linkedLocation: 'dinh_nui_y_nghia',
  },
  {
    id: 'mp_4_song_co_y_nghia',
    branch: 'meaning_purpose',
    tier: 4,
    ten: 'Sống có ý nghĩa',
    moTa: 'Sống theo giá trị và mục đích của mình.',
    unlockCondition: {
      questsCompleted: 25,
      questCategoriesCompleted: ['meaning_purpose', 'community_impact'],
      helpOthersCount: 10,
      prerequisiteSkills: ['mp_3_dinh_huong_tuong_lai'],
    },
    linkedLocation: 'dinh_nui_y_nghia',
  },
];

// ══════════════════════════════════════════════
// ALL 20 SKILLS
// ══════════════════════════════════════════════

const ALL_SKILLS: Skill[] = [
  ...SELF_AWARENESS_SKILLS,
  ...EMOTIONAL_REGULATION_SKILLS,
  ...COGNITIVE_FLEXIBILITY_SKILLS,
  ...RELATIONSHIP_SKILLS,
  ...MEANING_PURPOSE_SKILLS,
];

const skillMap: Map<string, Skill> = new Map();

// ══════════════════════════════════════════════
// SKILL SYNERGIES (3)
// ══════════════════════════════════════════════

const SYNERGIES: SkillSynergy[] = [
  {
    id: 'syn_inner_balance',
    ten: 'Inner Balance',
    moTa: 'Cân bằng nội tâm — hiểu mình và điều tiết cảm xúc.',
    requiredSkills: ['sa_1_nhan_dien_cam_xuc', 'er_1_binh_tinh'],
  },
  {
    id: 'syn_community_builder',
    ten: 'Community Builder',
    moTa: 'Người xây dựng cộng đồng — kết nối và đồng cảm.',
    requiredSkills: ['rs_2_dong_cam', 'rs_4_ho_tro_nguoi_khac'],
  },
  {
    id: 'syn_life_pathfinder',
    ten: 'Life Pathfinder',
    moTa: 'Người tìm đường sống — ý nghĩa kết hợp với kiên cường.',
    requiredSkills: ['mp_4_song_co_y_nghia', 'er_4_phuc_hoi_nhanh'],
  },
];

// ══════════════════════════════════════════════
// BRANCH MASTERY (5)
// ══════════════════════════════════════════════

const BRANCH_MASTERIES: BranchMastery[] = [
  { branch: 'self_awareness',       ten: 'Self Awareness Master',       danhHieu: 'Người Thấu Hiểu',  requiredSkillCount: 4 },
  { branch: 'emotional_regulation', ten: 'Emotional Regulation Master', danhHieu: 'Người Bình Yên',    requiredSkillCount: 4 },
  { branch: 'cognitive_flexibility', ten: 'Cognitive Flexibility Master', danhHieu: 'Người Linh Hoạt',   requiredSkillCount: 4 },
  { branch: 'relationship_skills',  ten: 'Relationship Skills Master',  danhHieu: 'Người Kết Nối',    requiredSkillCount: 4 },
  { branch: 'meaning_purpose',      ten: 'Meaning & Purpose Master',    danhHieu: 'Người Dẫn Đường',  requiredSkillCount: 4 },
];

// ══════════════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════════════

/** Initialize skill tree data */
export function initSkillTree(): void {
  skillMap.clear();
  for (const s of ALL_SKILLS) {
    skillMap.set(s.id, s);
  }
}

/** Get all 20 skills */
export function getAllSkills(): Skill[] {
  return Array.from(skillMap.values());
}

/** Get a single skill by ID */
export function getSkill(skillId: string): Skill | undefined {
  return skillMap.get(skillId);
}

/** Get skills for a specific branch */
export function getSkillsByBranch(branch: SkillBranchId): Skill[] {
  return getAllSkills().filter((s) => s.branch === branch);
}

/** Get all synergies */
export function getAllSynergies(): SkillSynergy[] {
  return [...SYNERGIES];
}

/** Get all branch masteries */
export function getAllBranchMasteries(): BranchMastery[] {
  return [...BRANCH_MASTERIES];
}

/** Create an empty skill state for a new character */
export function createSkillState(): CharacterSkillState {
  return {
    unlockedSkills: [],
    unlockedSynergies: [],
    masteredBranches: [],
  };
}

/** Check if a character has unlocked a specific skill */
export function hasSkill(state: CharacterSkillState, skillId: string): boolean {
  return state.unlockedSkills.includes(skillId);
}

// ── Unlock Logic ─────────────────────────────

/** Context needed to evaluate unlock conditions */
export interface UnlockContext {
  character: Character;
  skillState: CharacterSkillState;
  /** Number of quests completed in each category */
  categoryCounts: Partial<Record<string, number>>;
  /** Total reflection/journal actions */
  reflectionCount: number;
  /** Total help_others actions */
  helpOthersCount: number;
  /** Whether at least one narrative quest was completed */
  hasNarrativeQuest: boolean;
}

/** Check if a skill's unlock conditions are met */
export function canUnlockSkill(skill: Skill, ctx: UnlockContext): boolean {
  const cond = skill.unlockCondition;

  // prerequisite skills must be unlocked
  if (cond.prerequisiteSkills) {
    for (const preReq of cond.prerequisiteSkills) {
      if (!ctx.skillState.unlockedSkills.includes(preReq)) return false;
    }
  }

  // total quests completed
  if (cond.questsCompleted !== undefined) {
    if (ctx.character.completedQuestIds.length < cond.questsCompleted) return false;
  }

  // category-specific quests
  if (cond.questCategoriesCompleted) {
    for (const cat of cond.questCategoriesCompleted) {
      if ((ctx.categoryCounts[cat] ?? 0) < 1) return false;
    }
  }

  // reflection count
  if (cond.reflectionCount !== undefined) {
    if (ctx.reflectionCount < cond.reflectionCount) return false;
  }

  // empathy score
  if (cond.empathyScore !== undefined) {
    if (ctx.character.empathyScore < cond.empathyScore) return false;
  }

  // help others count
  if (cond.helpOthersCount !== undefined) {
    if (ctx.helpOthersCount < cond.helpOthersCount) return false;
  }

  // narrative quest
  if (cond.narrativeQuestCompleted) {
    if (!ctx.hasNarrativeQuest) return false;
  }

  return true;
}

/**
 * Attempt to unlock a skill for a character.
 * Returns true if newly unlocked, false if already unlocked or conditions not met.
 */
export function unlockSkill(
  skill: Skill,
  ctx: UnlockContext,
): boolean {
  if (ctx.skillState.unlockedSkills.includes(skill.id)) return false;
  if (!canUnlockSkill(skill, ctx)) return false;

  ctx.skillState.unlockedSkills.push(skill.id);

  // Check synergies
  for (const syn of SYNERGIES) {
    if (ctx.skillState.unlockedSynergies.includes(syn.id)) continue;
    const allMet = syn.requiredSkills.every((sid) =>
      ctx.skillState.unlockedSkills.includes(sid),
    );
    if (allMet) {
      ctx.skillState.unlockedSynergies.push(syn.id);
    }
  }

  // Check branch mastery
  for (const bm of BRANCH_MASTERIES) {
    if (ctx.skillState.masteredBranches.includes(bm.branch)) continue;
    const branchSkills = ALL_SKILLS.filter((s) => s.branch === bm.branch);
    const unlockedInBranch = branchSkills.filter((s) =>
      ctx.skillState.unlockedSkills.includes(s.id),
    ).length;
    if (unlockedInBranch >= bm.requiredSkillCount) {
      ctx.skillState.masteredBranches.push(bm.branch);
    }
  }

  return true;
}

/**
 * Scan all skills and unlock everything that is available.
 * Returns the list of newly unlocked skill IDs.
 */
export function unlockAvailableSkills(ctx: UnlockContext): string[] {
  const newlyUnlocked: string[] = [];
  // Multiple passes because unlocking a skill can enable prerequisites for others
  let changed = true;
  while (changed) {
    changed = false;
    for (const skill of ALL_SKILLS) {
      if (ctx.skillState.unlockedSkills.includes(skill.id)) continue;
      if (unlockSkill(skill, ctx)) {
        newlyUnlocked.push(skill.id);
        changed = true;
      }
    }
  }
  return newlyUnlocked;
}

/** Get branch mastery title if the branch is mastered, undefined otherwise */
export function getBranchMasteryTitle(
  state: CharacterSkillState,
  branch: SkillBranchId,
): string | undefined {
  if (!state.masteredBranches.includes(branch)) return undefined;
  return BRANCH_MASTERIES.find((bm) => bm.branch === branch)?.danhHieu;
}
