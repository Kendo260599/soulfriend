/**
 * GameFi — Configuration Constants
 */

import type { GrowthStats } from './types';

export const API_URL = (process.env.REACT_APP_API_URL || 'https://soulfriend-api.onrender.com').replace(/\/$/, '');

export const GROWTH_CONFIG: { key: keyof GrowthStats; label: string; color: string; icon: string }[] = [
  { key: 'emotionalAwareness', label: 'Nhận Diện Cảm Xúc', color: '#E8B4B8', icon: '💗' },
  { key: 'psychologicalSafety', label: 'An Toàn Tâm Lý', color: '#48BB78', icon: '🛡️' },
  { key: 'meaning', label: 'Ý Nghĩa Sống', color: '#805AD5', icon: '✨' },
  { key: 'cognitiveFlexibility', label: 'Linh Hoạt Nhận Thức', color: '#DD6B20', icon: '🧠' },
  { key: 'relationshipQuality', label: 'Kết Nối Xã Hội', color: '#3182CE', icon: '🤝' },
];

export const BRANCH_CONFIG: Record<string, { icon: string; name: string; color: string }> = {
  self_awareness: { icon: '🪞', name: 'Tự Nhận Thức', color: '#E8B4B8' },
  emotional_regulation: { icon: '🌊', name: 'Điều Tiết Cảm Xúc', color: '#3182CE' },
  cognitive_flexibility: { icon: '🧠', name: 'Linh Hoạt Nhận Thức', color: '#DD6B20' },
  relationship_skills: { icon: '🤝', name: 'Kỹ Năng Quan Hệ', color: '#48BB78' },
  meaning_purpose: { icon: '⛰️', name: 'Ý Nghĩa & Mục Đích', color: '#805AD5' },
};

export const LOCATION_ICONS: Record<string, string> = {
  thung_lung_cau_hoi: '🏞️', rung_tu_nhan_thuc: '🌲', dong_song_cam_xuc: '🌊',
  thanh_pho_ket_noi: '🏙️', dinh_nui_y_nghia: '⛰️',
};

export const ZONE_NAMES: Record<string,string> = {
  disorientation: 'Mất Phương Hướng', self_exploration: 'Tự Khám Phá',
  stabilization: 'Ổn Định', growth: 'Phát Triển', mentor_stage: 'Người Dẫn Đường',
};

export const PHASE_NAMES: Record<string,string> = {
  disorientation: 'Mất phương hướng', exploration: 'Khám phá',
  stabilization: 'Ổn định', growth: 'Phát triển', mentor: 'Mentor',
};

export const DIFF_LABELS: Record<string,string> = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' };

export const CATEGORY_LABELS: Record<string,string> = {
  reflection: '🪞 Suy Ngẫm',
  emotional_awareness: '💗 Nhận Diện Cảm Xúc',
  cognitive_reframing: '🧠 Tư Duy Tích Cực',
  resilience: '💪 Kiên Cường',
  relationships: '🤝 Mối Quan Hệ',
  empathy: '💜 Đồng Cảm',
  meaning_purpose: '⛰️ Ý Nghĩa',
  gratitude: '🙏 Biết Ơn',
  self_compassion: '🌸 Tự Yêu Thương',
  community_impact: '🌍 Cộng Đồng',
};

export const LOAI_LABELS: Record<string,string> = {
  tu_nhan_thuc: '🪞 Tự nhận thức',
  cam_xuc: '💗 Cảm xúc',
  ket_noi: '🤝 Kết nối',
  y_nghia: '✨ Ý nghĩa',
  resilience: '💪 Kiên cường',
};

/** Quest routing config — maps quest ID prefix to navigation or self-report behavior.
 *  completionMode is resolved centrally via questSemanticRegistry — NOT duplicated here. */
export const QUEST_ROUTES: Record<string, { route?: string; needConfirm?: boolean; hint: string }> = {
  quest_dass: { route: '/start', hint: 'Hãy hoàn thành bài test DASS-21 — quest sẽ tự hoàn thành khi bạn nộp bài!' },
  quest_chat: { hint: '💬 Hãy mở chatbot và trò chuyện ít nhất 3 tin nhắn — quest sẽ tự hoàn thành!' },
  quest_journal: { needConfirm: true, hint: 'Bạn đã viết nhật ký cảm xúc (ít nhất 3 câu) chưa?' },
  quest_breathing: { needConfirm: true, hint: 'Bạn đã thực hành bài tập thở 5 phút chưa?' },
  quest_share: { needConfirm: true, hint: 'Bạn đã chia sẻ câu chuyện tích cực với ai đó chưa?' },
  quest_gratitude: { needConfirm: true, hint: 'Bạn đã viết 3 điều biết ơn hôm nay chưa?' },
};
