// ============================================
// SoulFriend GameFi — 200 Quest Database
// ============================================
// 10 nhóm × 20 quest = 200 quest
// Tất cả nội dung bằng tiếng Việt

import { Quest } from '../core/types';

// ── Growth Impact Presets ────────────────────
// Based on Growth Impact Table:
//   journal:    emotion+3, safety+1, meaning+1, cognition+2
//   share:      emotion+2, safety+2, meaning+1, cognition+1, relation+1
//   help:       emotion+1, safety+1, meaning+2, relation+3
//   gratitude:  emotion+1, safety+2, meaning+2, relation+1
//   reframing:  emotion+1, safety+1, meaning+1, cognition+3
//   community:  emotion+1, safety+1, meaning+1, relation+3

const IMPACT = {
  journal:   { emotionalAwareness: 3, psychologicalSafety: 1, meaning: 1, cognitiveFlexibility: 2 },
  share:     { emotionalAwareness: 2, psychologicalSafety: 2, meaning: 1, cognitiveFlexibility: 1, relationshipQuality: 1 },
  help:      { emotionalAwareness: 1, psychologicalSafety: 1, meaning: 2, relationshipQuality: 3 },
  gratitude: { emotionalAwareness: 1, psychologicalSafety: 2, meaning: 2, relationshipQuality: 1 },
  reframe:   { emotionalAwareness: 1, psychologicalSafety: 1, meaning: 1, cognitiveFlexibility: 3 },
  community: { emotionalAwareness: 1, psychologicalSafety: 1, meaning: 1, relationshipQuality: 3 },
};

// ══════════════════════════════════════════════
// NHÓM 1 — Reflection (20)
// ══════════════════════════════════════════════

const REFLECTION_QUESTS: Quest[] = [
  { id: 'ref_01', title: 'Viết cảm xúc hôm nay', description: 'Viết vài dòng mô tả cảm xúc của bạn hôm nay.', loai: 'reflection', category: 'reflection', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thung_lung_cau_hoi' },
  { id: 'ref_02', title: 'Điều khiến bạn suy nghĩ nhiều nhất', description: 'Điều gì khiến bạn suy nghĩ nhiều nhất hôm nay? Viết ra.', loai: 'reflection', category: 'reflection', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thung_lung_cau_hoi' },
  { id: 'ref_03', title: 'Điều bạn học về bản thân tuần này', description: 'Một điều bạn học được về bản thân trong tuần qua.', loai: 'reflection', category: 'reflection', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thung_lung_cau_hoi' },
  { id: 'ref_04', title: 'Ký ức tuổi thơ đáng nhớ', description: 'Viết về một ký ức tuổi thơ đáng nhớ và cảm xúc đi kèm.', loai: 'reflection', category: 'reflection', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thung_lung_cau_hoi' },
  { id: 'ref_05', title: 'Khoảnh khắc tự hào', description: 'Khoảnh khắc bạn cảm thấy tự hào nhất về bản thân.', loai: 'reflection', category: 'reflection', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thung_lung_cau_hoi' },
  { id: 'ref_06', title: 'Điều muốn thay đổi', description: 'Điều bạn muốn thay đổi trong cuộc sống và tại sao.', loai: 'reflection', category: 'reflection', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thung_lung_cau_hoi' },
  { id: 'ref_07', title: 'Ngày hoàn hảo', description: 'Viết về một ngày hoàn hảo của bạn sẽ trông như thế nào.', loai: 'reflection', category: 'reflection', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thung_lung_cau_hoi' },
  { id: 'ref_08', title: 'Điều mang lại bình yên', description: 'Điều gì khiến bạn cảm thấy bình yên nhất?', loai: 'reflection', category: 'reflection', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thung_lung_cau_hoi' },
  { id: 'ref_09', title: 'Thư cho bản thân tương lai', description: 'Viết một lá thư cho bản thân trong tương lai.', loai: 'reflection', category: 'reflection', xpReward: 25, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thung_lung_cau_hoi' },
  { id: 'ref_10', title: 'Nỗi sợ muốn vượt qua', description: 'Một điều bạn sợ nhưng muốn vượt qua.', loai: 'reflection', category: 'reflection', xpReward: 25, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thung_lung_cau_hoi' },
  { id: 'ref_11', title: 'Cảm giác được hiểu', description: 'Điều gì khiến bạn cảm thấy được hiểu?', loai: 'reflection', category: 'reflection', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thung_lung_cau_hoi' },
  { id: 'ref_12', title: 'Khi cảm thấy cô đơn', description: 'Khi nào bạn cảm thấy cô đơn? Viết về điều đó.', loai: 'reflection', category: 'reflection', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thung_lung_cau_hoi' },
  { id: 'ref_13', title: 'Quyết định khó khăn', description: 'Một quyết định khó khăn bạn từng đưa ra và kết quả.', loai: 'reflection', category: 'reflection', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thung_lung_cau_hoi' },
  { id: 'ref_14', title: 'Cảm giác có giá trị', description: 'Điều gì khiến bạn cảm thấy mình có giá trị?', loai: 'reflection', category: 'reflection', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thung_lung_cau_hoi' },
  { id: 'ref_15', title: 'Người ảnh hưởng lớn', description: 'Một người ảnh hưởng lớn đến cuộc đời bạn.', loai: 'reflection', category: 'reflection', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thung_lung_cau_hoi' },
  { id: 'ref_16', title: 'Nói với bản thân 5 năm trước', description: 'Điều bạn muốn nói với bản thân 5 năm trước.', loai: 'reflection', category: 'reflection', xpReward: 25, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thung_lung_cau_hoi' },
  { id: 'ref_17', title: 'Sai lầm thành bài học', description: 'Một sai lầm bạn học được điều gì đó quý giá.', loai: 'reflection', category: 'reflection', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thung_lung_cau_hoi' },
  { id: 'ref_18', title: 'Giấc mơ chưa thực hiện', description: 'Một giấc mơ bạn chưa thực hiện nhưng vẫn ấp ủ.', loai: 'reflection', category: 'reflection', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thung_lung_cau_hoi' },
  { id: 'ref_19', title: 'Khám phá bản thân', description: 'Điều bạn muốn khám phá thêm về bản thân.', loai: 'reflection', category: 'reflection', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thung_lung_cau_hoi' },
  { id: 'ref_20', title: 'Câu chuyện cuộc đời trong 10 dòng', description: 'Viết lại câu chuyện cuộc đời bạn trong 10 dòng.', loai: 'reflection', category: 'reflection', xpReward: 30, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thung_lung_cau_hoi' },
];

// ══════════════════════════════════════════════
// NHÓM 2 — Emotional Awareness (20)
// ══════════════════════════════════════════════

const EMOTIONAL_AWARENESS_QUESTS: Quest[] = [
  { id: 'emo_01', title: 'Cảm xúc chính hôm nay', description: 'Nhận diện cảm xúc chính của bạn hôm nay.', loai: 'reflection', category: 'emotional_awareness', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'rung_tu_nhan_thuc' },
  { id: 'emo_02', title: 'Gọi tên ba cảm xúc', description: 'Gọi tên ba cảm xúc đang tồn tại trong bạn lúc này.', loai: 'reflection', category: 'emotional_awareness', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'rung_tu_nhan_thuc' },
  { id: 'emo_03', title: 'Khi căng thẳng nhất', description: 'Khi nào bạn cảm thấy căng thẳng nhất? Mô tả.', loai: 'reflection', category: 'emotional_awareness', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'rung_tu_nhan_thuc' },
  { id: 'emo_04', title: 'Khi cảm thấy bình yên', description: 'Khi nào bạn cảm thấy bình yên nhất?', loai: 'reflection', category: 'emotional_awareness', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'rung_tu_nhan_thuc' },
  { id: 'emo_05', title: 'Cảm xúc thường né tránh', description: 'Cảm xúc nào bạn thường né tránh? Tại sao?', loai: 'reflection', category: 'emotional_awareness', xpReward: 25, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'rung_tu_nhan_thuc' },
  { id: 'emo_06', title: 'Điều khiến bạn vui', description: 'Điều gì khiến bạn vui gần đây?', loai: 'reflection', category: 'emotional_awareness', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'rung_tu_nhan_thuc' },
  { id: 'emo_07', title: 'Điều khiến bạn buồn', description: 'Điều gì khiến bạn buồn gần đây?', loai: 'reflection', category: 'emotional_awareness', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'rung_tu_nhan_thuc' },
  { id: 'emo_08', title: 'Một lần giận dữ', description: 'Viết về một lần bạn giận dữ và cách bạn xử lý.', loai: 'reflection', category: 'emotional_awareness', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'rung_tu_nhan_thuc' },
  { id: 'emo_09', title: 'Một lần lo lắng', description: 'Viết về một lần bạn lo lắng và điều đã xảy ra.', loai: 'reflection', category: 'emotional_awareness', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'rung_tu_nhan_thuc' },
  { id: 'emo_10', title: 'Cảm xúc muốn hiểu hơn', description: 'Cảm xúc nào bạn muốn hiểu hơn? Tại sao?', loai: 'reflection', category: 'emotional_awareness', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'rung_tu_nhan_thuc' },
  { id: 'emo_11', title: 'Cảm giác an toàn', description: 'Điều gì khiến bạn cảm thấy an toàn?', loai: 'reflection', category: 'emotional_awareness', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'rung_tu_nhan_thuc' },
  { id: 'emo_12', title: 'Cảm giác bất an', description: 'Điều gì khiến bạn cảm thấy bất an?', loai: 'reflection', category: 'emotional_awareness', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'rung_tu_nhan_thuc' },
  { id: 'emo_13', title: 'Ngày nhiều cảm xúc', description: 'Viết về một ngày có nhiều cảm xúc khác nhau.', loai: 'reflection', category: 'emotional_awareness', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'rung_tu_nhan_thuc' },
  { id: 'emo_14', title: 'Ba điều làm bạn mỉm cười', description: 'Ba điều làm bạn mỉm cười hôm nay.', loai: 'reflection', category: 'emotional_awareness', xpReward: 15, actionType: 'gratitude', growthImpact: IMPACT.gratitude, location: 'rung_tu_nhan_thuc' },
  { id: 'emo_15', title: 'Khi được yêu thương', description: 'Khi nào bạn cảm thấy được yêu thương?', loai: 'reflection', category: 'emotional_awareness', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'rung_tu_nhan_thuc' },
  { id: 'emo_16', title: 'Khi bị hiểu lầm', description: 'Khi nào bạn cảm thấy bị hiểu lầm? Bạn đã làm gì?', loai: 'reflection', category: 'emotional_awareness', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'rung_tu_nhan_thuc' },
  { id: 'emo_17', title: 'Cảm xúc chưa nói với ai', description: 'Một cảm xúc bạn chưa từng nói với ai.', loai: 'reflection', category: 'emotional_awareness', xpReward: 25, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'rung_tu_nhan_thuc' },
  { id: 'emo_18', title: 'Cảm giác nhẹ nhõm', description: 'Điều gì khiến bạn cảm thấy nhẹ nhõm?', loai: 'reflection', category: 'emotional_awareness', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'rung_tu_nhan_thuc' },
  { id: 'emo_19', title: 'Áp lực trong cuộc sống', description: 'Điều gì khiến bạn cảm thấy áp lực nhất?', loai: 'reflection', category: 'emotional_awareness', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'rung_tu_nhan_thuc' },
  { id: 'emo_20', title: 'Điều giúp bạn bình tĩnh', description: 'Điều gì giúp bạn bình tĩnh lại khi căng thẳng?', loai: 'reflection', category: 'emotional_awareness', xpReward: 15, actionType: 'emotion_regulation', growthImpact: IMPACT.share, location: 'rung_tu_nhan_thuc' },
];

// ══════════════════════════════════════════════
// NHÓM 3 — Cognitive Reframing (20)
// ══════════════════════════════════════════════

const COGNITIVE_REFRAMING_QUESTS: Quest[] = [
  { id: 'cog_01', title: 'Viết lại suy nghĩ tiêu cực', description: 'Viết lại một suy nghĩ tiêu cực theo hướng tích cực hơn.', loai: 'narrative', category: 'cognitive_reframing', xpReward: 20, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'rung_tu_nhan_thuc' },
  { id: 'cog_02', title: 'Thất bại từ góc nhìn khác', description: 'Nhìn một thất bại theo góc nhìn khác.', loai: 'narrative', category: 'cognitive_reframing', xpReward: 25, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'rung_tu_nhan_thuc' },
  { id: 'cog_03', title: 'Sai lầm giúp trưởng thành', description: 'Một sai lầm đã giúp bạn trưởng thành.', loai: 'narrative', category: 'cognitive_reframing', xpReward: 20, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'rung_tu_nhan_thuc' },
  { id: 'cog_04', title: 'Điều tốt trong khó khăn', description: 'Tìm điều tốt trong một trải nghiệm khó khăn.', loai: 'narrative', category: 'cognitive_reframing', xpReward: 25, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'rung_tu_nhan_thuc' },
  { id: 'cog_05', title: 'Viết lại câu chuyện đau buồn', description: 'Viết lại một câu chuyện đau buồn theo cách trưởng thành hơn.', loai: 'narrative', category: 'cognitive_reframing', xpReward: 30, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'rung_tu_nhan_thuc' },
  { id: 'cog_06', title: 'Khi quá khắt khe với bản thân', description: 'Khi nào bạn từng đánh giá bản thân quá khắt khe?', loai: 'narrative', category: 'cognitive_reframing', xpReward: 20, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'rung_tu_nhan_thuc' },
  { id: 'cog_07', title: 'Điều hiểu sai về bản thân', description: 'Một điều bạn từng hiểu sai về bản thân.', loai: 'narrative', category: 'cognitive_reframing', xpReward: 25, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'rung_tu_nhan_thuc' },
  { id: 'cog_08', title: 'Kỷ niệm nhìn lại trưởng thành hơn', description: 'Viết lại một kỷ niệm theo góc nhìn trưởng thành hơn.', loai: 'narrative', category: 'cognitive_reframing', xpReward: 25, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'rung_tu_nhan_thuc' },
  { id: 'cog_09', title: 'Lời khuyên cho chính mình', description: 'Một lời khuyên bạn sẽ cho chính mình.', loai: 'narrative', category: 'cognitive_reframing', xpReward: 20, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'rung_tu_nhan_thuc' },
  { id: 'cog_10', title: 'Bài học từ khó khăn', description: 'Một bài học bạn rút ra từ khó khăn.', loai: 'narrative', category: 'cognitive_reframing', xpReward: 20, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'rung_tu_nhan_thuc' },
  { id: 'cog_11', title: 'Thay đổi suy nghĩ', description: 'Khi nào bạn thay đổi suy nghĩ về điều gì đó quan trọng?', loai: 'narrative', category: 'cognitive_reframing', xpReward: 20, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'rung_tu_nhan_thuc' },
  { id: 'cog_12', title: 'Nỗi sợ đã vượt qua', description: 'Điều bạn từng sợ nhưng giờ không còn sợ nữa.', loai: 'narrative', category: 'cognitive_reframing', xpReward: 20, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'rung_tu_nhan_thuc' },
  { id: 'cog_13', title: 'Thất bại mở ra cơ hội', description: 'Một thất bại đã mở ra cơ hội mới cho bạn.', loai: 'narrative', category: 'cognitive_reframing', xpReward: 25, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'rung_tu_nhan_thuc' },
  { id: 'cog_14', title: 'Điểm yếu thành sức mạnh', description: 'Điều bạn từng nghĩ là điểm yếu nhưng lại là sức mạnh.', loai: 'narrative', category: 'cognitive_reframing', xpReward: 25, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'rung_tu_nhan_thuc' },
  { id: 'cog_15', title: 'Học từ sai lầm', description: 'Khi nào bạn học được bài học quý giá từ sai lầm?', loai: 'narrative', category: 'cognitive_reframing', xpReward: 20, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'rung_tu_nhan_thuc' },
  { id: 'cog_16', title: 'Trải nghiệm thay đổi quan điểm', description: 'Một trải nghiệm khiến bạn thay đổi quan điểm sâu sắc.', loai: 'narrative', category: 'cognitive_reframing', xpReward: 25, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'rung_tu_nhan_thuc' },
  { id: 'cog_17', title: 'Nhìn cuộc sống khác đi', description: 'Điều gì khiến bạn nhìn cuộc sống khác đi?', loai: 'narrative', category: 'cognitive_reframing', xpReward: 20, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'rung_tu_nhan_thuc' },
  { id: 'cog_18', title: 'Suy nghĩ muốn buông bỏ', description: 'Một suy nghĩ bạn muốn buông bỏ và tại sao.', loai: 'narrative', category: 'cognitive_reframing', xpReward: 25, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'rung_tu_nhan_thuc' },
  { id: 'cog_19', title: 'Niềm tin mới', description: 'Một niềm tin mới bạn muốn xây dựng cho bản thân.', loai: 'narrative', category: 'cognitive_reframing', xpReward: 20, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'rung_tu_nhan_thuc' },
  { id: 'cog_20', title: 'Góc nhìn mới về chính mình', description: 'Một góc nhìn mới về chính mình mà bạn muốn khám phá.', loai: 'narrative', category: 'cognitive_reframing', xpReward: 20, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'rung_tu_nhan_thuc' },
];

// ══════════════════════════════════════════════
// NHÓM 4 — Resilience (20)
// ══════════════════════════════════════════════

const RESILIENCE_QUESTS: Quest[] = [
  { id: 'res_01', title: 'Thử thách đã vượt qua', description: 'Một thử thách bạn đã vượt qua và cách bạn làm được.', loai: 'growth', category: 'resilience', xpReward: 20, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'dong_song_cam_xuc' },
  { id: 'res_02', title: 'Điều giúp bạn mạnh mẽ', description: 'Điều gì giúp bạn mạnh mẽ hơn?', loai: 'growth', category: 'resilience', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dong_song_cam_xuc' },
  { id: 'res_03', title: 'Khi không bỏ cuộc', description: 'Khi nào bạn đã không bỏ cuộc dù muốn từ bỏ?', loai: 'growth', category: 'resilience', xpReward: 25, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'dong_song_cam_xuc' },
  { id: 'res_04', title: 'Đứng dậy sau thất bại', description: 'Một lần bạn đứng dậy sau thất bại.', loai: 'growth', category: 'resilience', xpReward: 25, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'dong_song_cam_xuc' },
  { id: 'res_05', title: 'Người giúp vượt khó khăn', description: 'Một người đã giúp bạn vượt qua khó khăn.', loai: 'growth', category: 'resilience', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dong_song_cam_xuc' },
  { id: 'res_06', title: 'Điều khiến bạn tiếp tục', description: 'Điều gì khiến bạn tiếp tục tiến lên?', loai: 'growth', category: 'resilience', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dong_song_cam_xuc' },
  { id: 'res_07', title: 'Cảm giác kiên cường', description: 'Khi nào bạn cảm thấy kiên cường nhất?', loai: 'growth', category: 'resilience', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dong_song_cam_xuc' },
  { id: 'res_08', title: 'Bài học từ khó khăn', description: 'Một bài học quý giá bạn rút ra từ khó khăn.', loai: 'growth', category: 'resilience', xpReward: 20, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'dong_song_cam_xuc' },
  { id: 'res_09', title: 'Hồi phục sau stress', description: 'Điều gì giúp bạn hồi phục sau stress?', loai: 'growth', category: 'resilience', xpReward: 20, actionType: 'emotion_regulation', growthImpact: IMPACT.share, location: 'dong_song_cam_xuc' },
  { id: 'res_10', title: 'Trải nghiệm trưởng thành', description: 'Một trải nghiệm khiến bạn trưởng thành hơn.', loai: 'growth', category: 'resilience', xpReward: 25, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'dong_song_cam_xuc' },
  { id: 'res_11', title: 'Nỗi sợ đã chiến thắng', description: 'Một nỗi sợ bạn đã vượt qua.', loai: 'growth', category: 'resilience', xpReward: 25, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'dong_song_cam_xuc' },
  { id: 'res_12', title: 'Tự hào về bản thân', description: 'Điều gì khiến bạn tự hào nhất về bản thân?', loai: 'growth', category: 'resilience', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dong_song_cam_xuc' },
  { id: 'res_13', title: 'Kiên nhẫn nhất', description: 'Khi nào bạn kiên nhẫn nhất?', loai: 'growth', category: 'resilience', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dong_song_cam_xuc' },
  { id: 'res_14', title: 'Quyết định dũng cảm', description: 'Một quyết định dũng cảm bạn từng đưa ra.', loai: 'growth', category: 'resilience', xpReward: 25, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'dong_song_cam_xuc' },
  { id: 'res_15', title: 'Giữ hy vọng', description: 'Điều gì giúp bạn tiếp tục hy vọng?', loai: 'growth', category: 'resilience', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dong_song_cam_xuc' },
  { id: 'res_16', title: 'Thách thức hiện tại', description: 'Một thách thức hiện tại bạn đang đối mặt.', loai: 'growth', category: 'resilience', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dong_song_cam_xuc' },
  { id: 'res_17', title: 'Giữ vững niềm tin', description: 'Điều gì giúp bạn giữ vững niềm tin?', loai: 'growth', category: 'resilience', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dong_song_cam_xuc' },
  { id: 'res_18', title: 'Khi cảm thấy mạnh mẽ', description: 'Khi nào bạn cảm thấy mình mạnh mẽ nhất?', loai: 'growth', category: 'resilience', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dong_song_cam_xuc' },
  { id: 'res_19', title: 'Khó khăn thay đổi bạn', description: 'Một khó khăn đã thay đổi bạn theo hướng tốt.', loai: 'growth', category: 'resilience', xpReward: 25, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'dong_song_cam_xuc' },
  { id: 'res_20', title: 'Một bước nhỏ hôm nay', description: 'Một bước nhỏ bạn có thể làm hôm nay để tiến lên.', loai: 'growth', category: 'resilience', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dong_song_cam_xuc' },
];

// ══════════════════════════════════════════════
// NHÓM 5 — Relationships (20)
// ══════════════════════════════════════════════

const RELATIONSHIPS_QUESTS: Quest[] = [
  { id: 'rel_01', title: 'Người bạn biết ơn', description: 'Một người trong đời mà bạn biết ơn.', loai: 'community', category: 'relationships', xpReward: 15, actionType: 'gratitude', growthImpact: IMPACT.gratitude, location: 'thanh_pho_ket_noi' },
  { id: 'rel_02', title: 'Cuộc trò chuyện ý nghĩa', description: 'Viết về một cuộc trò chuyện ý nghĩa gần đây.', loai: 'community', category: 'relationships', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thanh_pho_ket_noi' },
  { id: 'rel_03', title: 'Khi được lắng nghe', description: 'Khi nào bạn cảm thấy được lắng nghe thật sự?', loai: 'community', category: 'relationships', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thanh_pho_ket_noi' },
  { id: 'rel_04', title: 'Khi bạn lắng nghe', description: 'Khi nào bạn thật sự lắng nghe người khác?', loai: 'community', category: 'relationships', xpReward: 20, actionType: 'help_others', growthImpact: IMPACT.help, location: 'thanh_pho_ket_noi' },
  { id: 'rel_05', title: 'Kỷ niệm đẹp với bạn bè', description: 'Một kỷ niệm đẹp với bạn bè.', loai: 'community', category: 'relationships', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thanh_pho_ket_noi' },
  { id: 'rel_06', title: 'Người khiến bạn an toàn', description: 'Một người khiến bạn cảm thấy an toàn.', loai: 'community', category: 'relationships', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thanh_pho_ket_noi' },
  { id: 'rel_07', title: 'Khi bạn giúp ai đó', description: 'Khi nào bạn giúp ai đó và cảm giác ra sao?', loai: 'community', category: 'relationships', xpReward: 20, actionType: 'help_others', growthImpact: IMPACT.help, location: 'thanh_pho_ket_noi' },
  { id: 'rel_08', title: 'Người muốn cảm ơn', description: 'Một người bạn muốn nói lời cảm ơn.', loai: 'community', category: 'relationships', xpReward: 15, actionType: 'gratitude', growthImpact: IMPACT.gratitude, location: 'thanh_pho_ket_noi' },
  { id: 'rel_09', title: 'Cảm giác gần gũi', description: 'Khi nào bạn cảm thấy gần gũi với ai đó?', loai: 'community', category: 'relationships', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thanh_pho_ket_noi' },
  { id: 'rel_10', title: 'Bài học về tình bạn', description: 'Một bài học bạn học được về tình bạn.', loai: 'community', category: 'relationships', xpReward: 20, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'thanh_pho_ket_noi' },
  { id: 'rel_11', title: 'Mối quan hệ muốn cải thiện', description: 'Một mối quan hệ bạn muốn cải thiện.', loai: 'community', category: 'relationships', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thanh_pho_ket_noi' },
  { id: 'rel_12', title: 'Mối quan hệ lành mạnh', description: 'Điều gì khiến mối quan hệ trở nên lành mạnh?', loai: 'community', category: 'relationships', xpReward: 20, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'thanh_pho_ket_noi' },
  { id: 'rel_13', title: 'Bài học từ gia đình', description: 'Một điều bạn học được từ gia đình.', loai: 'community', category: 'relationships', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thanh_pho_ket_noi' },
  { id: 'rel_14', title: 'Khi được hỗ trợ', description: 'Khi nào bạn cảm thấy được hỗ trợ từ người khác?', loai: 'community', category: 'relationships', xpReward: 15, actionType: 'gratitude', growthImpact: IMPACT.gratitude, location: 'thanh_pho_ket_noi' },
  { id: 'rel_15', title: 'Người hiểu bạn', description: 'Một người khiến bạn cảm thấy được hiểu thật sự.', loai: 'community', category: 'relationships', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thanh_pho_ket_noi' },
  { id: 'rel_16', title: 'Khi bạn xin lỗi', description: 'Khi nào bạn xin lỗi ai đó? Bạn cảm thấy thế nào?', loai: 'community', category: 'relationships', xpReward: 25, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thanh_pho_ket_noi' },
  { id: 'rel_17', title: 'Khi bạn tha thứ', description: 'Khi nào bạn tha thứ cho ai đó?', loai: 'community', category: 'relationships', xpReward: 25, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'thanh_pho_ket_noi' },
  { id: 'rel_18', title: 'Điều muốn nói với người thân', description: 'Một điều bạn muốn nói với người thân.', loai: 'community', category: 'relationships', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thanh_pho_ket_noi' },
  { id: 'rel_19', title: 'Reconnect', description: 'Một người bạn muốn kết nối lại.', loai: 'community', category: 'relationships', xpReward: 20, actionType: 'help_others', growthImpact: IMPACT.help, location: 'thanh_pho_ket_noi' },
  { id: 'rel_20', title: 'Mối quan hệ bền vững', description: 'Điều gì khiến mối quan hệ trở nên bền vững?', loai: 'community', category: 'relationships', xpReward: 20, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'thanh_pho_ket_noi' },
];

// ══════════════════════════════════════════════
// NHÓM 6 — Empathy (20)
// ══════════════════════════════════════════════

const EMPATHY_QUESTS: Quest[] = [
  { id: 'emp_01', title: 'Lời động viên cho người lạ', description: 'Viết lời động viên dành cho một người lạ.', loai: 'community', category: 'empathy', xpReward: 20, actionType: 'help_others', growthImpact: IMPACT.community, location: 'thanh_pho_ket_noi' },
  { id: 'emp_02', title: 'Lời khích lệ', description: 'Chia sẻ một lời khích lệ với cộng đồng.', loai: 'community', category: 'empathy', xpReward: 15, actionType: 'help_others', growthImpact: IMPACT.community, location: 'thanh_pho_ket_noi' },
  { id: 'emp_03', title: 'Lắng nghe câu chuyện', description: 'Lắng nghe câu chuyện của ai đó và chia sẻ cảm nhận.', loai: 'community', category: 'empathy', xpReward: 25, actionType: 'help_others', growthImpact: IMPACT.help, location: 'thanh_pho_ket_noi' },
  { id: 'emp_04', title: 'Phản hồi đồng cảm', description: 'Viết một phản hồi đồng cảm cho ai đó.', loai: 'community', category: 'empathy', xpReward: 20, actionType: 'help_others', growthImpact: IMPACT.community, location: 'thanh_pho_ket_noi' },
  { id: 'emp_05', title: 'Chia sẻ trải nghiệm giúp người', description: 'Chia sẻ một trải nghiệm có thể giúp người khác.', loai: 'community', category: 'empathy', xpReward: 25, actionType: 'help_others', growthImpact: IMPACT.help, location: 'thanh_pho_ket_noi' },
  { id: 'emp_06', title: 'Hiểu cảm xúc người khác', description: 'Khi nào bạn hiểu cảm xúc của người khác sâu sắc?', loai: 'community', category: 'empathy', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thanh_pho_ket_noi' },
  { id: 'emp_07', title: 'Cảm ơn cộng đồng', description: 'Một lời cảm ơn dành cho cộng đồng.', loai: 'community', category: 'empathy', xpReward: 15, actionType: 'gratitude', growthImpact: IMPACT.gratitude, location: 'thanh_pho_ket_noi' },
  { id: 'emp_08', title: 'Câu chuyện truyền cảm hứng', description: 'Chia sẻ một câu chuyện truyền cảm hứng.', loai: 'community', category: 'empathy', xpReward: 25, actionType: 'help_others', growthImpact: IMPACT.help, location: 'thanh_pho_ket_noi' },
  { id: 'emp_09', title: 'Giúp ai đó vượt khó', description: 'Khi nào bạn giúp ai đó vượt qua khó khăn?', loai: 'community', category: 'empathy', xpReward: 25, actionType: 'help_others', growthImpact: IMPACT.help, location: 'thanh_pho_ket_noi' },
  { id: 'emp_10', title: 'Bài học về đồng cảm', description: 'Một bài học bạn học được về sự đồng cảm.', loai: 'community', category: 'empathy', xpReward: 20, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'thanh_pho_ket_noi' },
  { id: 'emp_11', title: 'Hiểu người khác hơn', description: 'Điều gì khiến bạn hiểu người khác hơn?', loai: 'community', category: 'empathy', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thanh_pho_ket_noi' },
  { id: 'emp_12', title: 'Hành động tử tế nhỏ', description: 'Một hành động tử tế nhỏ bạn đã làm hoặc nhận.', loai: 'community', category: 'empathy', xpReward: 15, actionType: 'help_others', growthImpact: IMPACT.community, location: 'thanh_pho_ket_noi' },
  { id: 'emp_13', title: 'Gắn kết cộng đồng', description: 'Khi nào bạn cảm thấy gắn kết với cộng đồng?', loai: 'community', category: 'empathy', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thanh_pho_ket_noi' },
  { id: 'emp_14', title: 'Trải nghiệm chữa lành', description: 'Chia sẻ một trải nghiệm chữa lành.', loai: 'community', category: 'empathy', xpReward: 25, actionType: 'help_others', growthImpact: IMPACT.help, location: 'thanh_pho_ket_noi' },
  { id: 'emp_15', title: 'Tự hào về cộng đồng', description: 'Khi nào bạn cảm thấy tự hào về cộng đồng?', loai: 'community', category: 'empathy', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thanh_pho_ket_noi' },
  { id: 'emp_16', title: 'Khích lệ cho người đang buồn', description: 'Một lời khích lệ dành cho người đang buồn.', loai: 'community', category: 'empathy', xpReward: 20, actionType: 'help_others', growthImpact: IMPACT.community, location: 'thanh_pho_ket_noi' },
  { id: 'emp_17', title: 'Câu nói truyền động lực', description: 'Một câu nói truyền động lực từ trải nghiệm của bạn.', loai: 'community', category: 'empathy', xpReward: 15, actionType: 'help_others', growthImpact: IMPACT.community, location: 'thanh_pho_ket_noi' },
  { id: 'emp_18', title: 'Muốn giúp người khác', description: 'Khi nào bạn cảm thấy muốn giúp người khác nhất?', loai: 'community', category: 'empathy', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thanh_pho_ket_noi' },
  { id: 'emp_19', title: 'Hành động tốt đã làm', description: 'Một hành động tốt bạn từng làm và cảm giác ra sao.', loai: 'community', category: 'empathy', xpReward: 20, actionType: 'help_others', growthImpact: IMPACT.help, location: 'thanh_pho_ket_noi' },
  { id: 'emp_20', title: 'Hành động tốt muốn làm', description: 'Một hành động tốt bạn muốn làm sắp tới.', loai: 'community', category: 'empathy', xpReward: 15, actionType: 'help_others', growthImpact: IMPACT.community, location: 'thanh_pho_ket_noi' },
];

// ══════════════════════════════════════════════
// NHÓM 7 — Meaning & Purpose (20)
// ══════════════════════════════════════════════

const MEANING_PURPOSE_QUESTS: Quest[] = [
  { id: 'mea_01', title: 'Cuộc sống có ý nghĩa', description: 'Điều gì khiến cuộc sống của bạn có ý nghĩa?', loai: 'growth', category: 'meaning_purpose', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dinh_nui_y_nghia' },
  { id: 'mea_02', title: 'Đóng góp cho thế giới', description: 'Điều bạn muốn đóng góp cho thế giới.', loai: 'growth', category: 'meaning_purpose', xpReward: 25, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'dinh_nui_y_nghia' },
  { id: 'mea_03', title: 'Ước mơ lớn', description: 'Một ước mơ lớn của bạn là gì?', loai: 'growth', category: 'meaning_purpose', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dinh_nui_y_nghia' },
  { id: 'mea_04', title: 'Cuộc sống có mục đích', description: 'Khi nào bạn cảm thấy cuộc sống có mục đích rõ ràng?', loai: 'growth', category: 'meaning_purpose', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dinh_nui_y_nghia' },
  { id: 'mea_05', title: 'Thức dậy mỗi sáng', description: 'Điều gì khiến bạn muốn thức dậy mỗi sáng?', loai: 'growth', category: 'meaning_purpose', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dinh_nui_y_nghia' },
  { id: 'mea_06', title: 'Cảm giác có giá trị', description: 'Điều gì khiến bạn cảm thấy mình có giá trị?', loai: 'growth', category: 'meaning_purpose', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dinh_nui_y_nghia' },
  { id: 'mea_07', title: 'Dự định tương lai', description: 'Một dự định cho tương lai bạn muốn thực hiện.', loai: 'growth', category: 'meaning_purpose', xpReward: 20, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'dinh_nui_y_nghia' },
  { id: 'mea_08', title: 'Điều muốn đạt được', description: 'Điều bạn muốn đạt được nhất trong đời.', loai: 'growth', category: 'meaning_purpose', xpReward: 25, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dinh_nui_y_nghia' },
  { id: 'mea_09', title: 'Khoảnh khắc ý nghĩa', description: 'Khi nào bạn cảm thấy cuộc sống thật sự có ý nghĩa?', loai: 'growth', category: 'meaning_purpose', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dinh_nui_y_nghia' },
  { id: 'mea_10', title: 'Sống trọn vẹn', description: 'Một điều khiến bạn cảm thấy sống trọn vẹn.', loai: 'growth', category: 'meaning_purpose', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dinh_nui_y_nghia' },
  { id: 'mea_11', title: 'Điều muốn học', description: 'Điều bạn muốn học trong cuộc đời.', loai: 'growth', category: 'meaning_purpose', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dinh_nui_y_nghia' },
  { id: 'mea_12', title: 'Trải nghiệm thay đổi', description: 'Một trải nghiệm khiến bạn thay đổi hoàn toàn.', loai: 'growth', category: 'meaning_purpose', xpReward: 25, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'dinh_nui_y_nghia' },
  { id: 'mea_13', title: 'Điều để lại cho thế giới', description: 'Điều bạn muốn để lại cho thế giới này.', loai: 'growth', category: 'meaning_purpose', xpReward: 25, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'dinh_nui_y_nghia' },
  { id: 'mea_14', title: 'Mục tiêu cá nhân', description: 'Một mục tiêu cá nhân bạn đang theo đuổi.', loai: 'growth', category: 'meaning_purpose', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dinh_nui_y_nghia' },
  { id: 'mea_15', title: 'Sống thật với mình', description: 'Điều gì khiến bạn cảm thấy sống thật với mình?', loai: 'growth', category: 'meaning_purpose', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dinh_nui_y_nghia' },
  { id: 'mea_16', title: 'Cảm giác tự do', description: 'Khi nào bạn cảm thấy tự do nhất?', loai: 'growth', category: 'meaning_purpose', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dinh_nui_y_nghia' },
  { id: 'mea_17', title: 'Điều muốn khám phá', description: 'Một điều bạn muốn khám phá trong cuộc sống.', loai: 'growth', category: 'meaning_purpose', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dinh_nui_y_nghia' },
  { id: 'mea_18', title: 'Điều muốn cải thiện', description: 'Một điều bạn muốn cải thiện về bản thân.', loai: 'growth', category: 'meaning_purpose', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dinh_nui_y_nghia' },
  { id: 'mea_19', title: 'Sống đúng với mình', description: 'Một điều khiến bạn cảm thấy sống đúng với mình.', loai: 'growth', category: 'meaning_purpose', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dinh_nui_y_nghia' },
  { id: 'mea_20', title: 'Hy vọng', description: 'Một điều khiến bạn cảm thấy hy vọng về tương lai.', loai: 'growth', category: 'meaning_purpose', xpReward: 15, actionType: 'gratitude', growthImpact: IMPACT.gratitude, location: 'dinh_nui_y_nghia' },
];

// ══════════════════════════════════════════════
// NHÓM 8 — Gratitude (20)
// ══════════════════════════════════════════════

const GRATITUDE_QUESTS: Quest[] = [
  { id: 'gra_01', title: 'Ba điều biết ơn hôm nay', description: 'Ba điều bạn biết ơn hôm nay.', loai: 'reflection', category: 'gratitude', xpReward: 15, actionType: 'gratitude', growthImpact: IMPACT.gratitude, location: 'thung_lung_cau_hoi' },
  { id: 'gra_02', title: 'Người bạn biết ơn', description: 'Một người bạn thật sự biết ơn.', loai: 'reflection', category: 'gratitude', xpReward: 15, actionType: 'gratitude', growthImpact: IMPACT.gratitude, location: 'thung_lung_cau_hoi' },
  { id: 'gra_03', title: 'Trải nghiệm đáng quý', description: 'Một trải nghiệm bạn cảm thấy đáng quý.', loai: 'reflection', category: 'gratitude', xpReward: 15, actionType: 'gratitude', growthImpact: IMPACT.gratitude, location: 'thung_lung_cau_hoi' },
  { id: 'gra_04', title: 'Điều nhỏ khiến hạnh phúc', description: 'Một điều nhỏ khiến bạn hạnh phúc.', loai: 'reflection', category: 'gratitude', xpReward: 15, actionType: 'gratitude', growthImpact: IMPACT.gratitude, location: 'thung_lung_cau_hoi' },
  { id: 'gra_05', title: 'Khoảnh khắc đẹp trong ngày', description: 'Một khoảnh khắc đẹp trong ngày hôm nay.', loai: 'reflection', category: 'gratitude', xpReward: 15, actionType: 'gratitude', growthImpact: IMPACT.gratitude, location: 'thung_lung_cau_hoi' },
  { id: 'gra_06', title: 'Kỷ niệm đáng trân trọng', description: 'Một kỷ niệm đáng trân trọng.', loai: 'reflection', category: 'gratitude', xpReward: 20, actionType: 'gratitude', growthImpact: IMPACT.gratitude, location: 'thung_lung_cau_hoi' },
  { id: 'gra_07', title: 'Điều tốt xảy ra gần đây', description: 'Một điều tốt xảy ra gần đây.', loai: 'reflection', category: 'gratitude', xpReward: 15, actionType: 'gratitude', growthImpact: IMPACT.gratitude, location: 'thung_lung_cau_hoi' },
  { id: 'gra_08', title: 'Người khiến cuộc sống tốt hơn', description: 'Một người khiến cuộc sống bạn tốt hơn.', loai: 'reflection', category: 'gratitude', xpReward: 20, actionType: 'gratitude', growthImpact: IMPACT.gratitude, location: 'thung_lung_cau_hoi' },
  { id: 'gra_09', title: 'Điều thường bỏ qua nhưng đáng quý', description: 'Một điều bạn thường bỏ qua nhưng thật ra rất đáng quý.', loai: 'reflection', category: 'gratitude', xpReward: 20, actionType: 'gratitude', growthImpact: IMPACT.gratitude, location: 'thung_lung_cau_hoi' },
  { id: 'gra_10', title: 'Điều khiến bạn mỉm cười', description: 'Một điều khiến bạn mỉm cười hôm nay.', loai: 'reflection', category: 'gratitude', xpReward: 15, actionType: 'gratitude', growthImpact: IMPACT.gratitude, location: 'thung_lung_cau_hoi' },
  { id: 'gra_11', title: 'Món quà cuộc sống', description: 'Một món quà mà cuộc sống đã mang lại cho bạn.', loai: 'reflection', category: 'gratitude', xpReward: 20, actionType: 'gratitude', growthImpact: IMPACT.gratitude, location: 'thung_lung_cau_hoi' },
  { id: 'gra_12', title: 'May mắn', description: 'Một điều khiến bạn cảm thấy may mắn.', loai: 'reflection', category: 'gratitude', xpReward: 15, actionType: 'gratitude', growthImpact: IMPACT.gratitude, location: 'thung_lung_cau_hoi' },
  { id: 'gra_13', title: 'Biết ơn bản thân', description: 'Một điều khiến bạn thấy biết ơn chính bản thân.', loai: 'reflection', category: 'gratitude', xpReward: 20, actionType: 'gratitude', growthImpact: IMPACT.gratitude, location: 'thung_lung_cau_hoi' },
  { id: 'gra_14', title: 'Biết ơn người khác', description: 'Một điều khiến bạn thấy biết ơn người khác.', loai: 'reflection', category: 'gratitude', xpReward: 15, actionType: 'gratitude', growthImpact: IMPACT.gratitude, location: 'thung_lung_cau_hoi' },
  { id: 'gra_15', title: 'Biết ơn cuộc sống', description: 'Một điều khiến bạn thấy biết ơn cuộc sống.', loai: 'reflection', category: 'gratitude', xpReward: 15, actionType: 'gratitude', growthImpact: IMPACT.gratitude, location: 'thung_lung_cau_hoi' },
  { id: 'gra_16', title: 'Cảm giác bình yên', description: 'Một điều khiến bạn thấy bình yên nhất.', loai: 'reflection', category: 'gratitude', xpReward: 15, actionType: 'gratitude', growthImpact: IMPACT.gratitude, location: 'thung_lung_cau_hoi' },
  { id: 'gra_17', title: 'Niềm vui đơn giản', description: 'Một niềm vui đơn giản trong cuộc sống.', loai: 'reflection', category: 'gratitude', xpReward: 15, actionType: 'gratitude', growthImpact: IMPACT.gratitude, location: 'thung_lung_cau_hoi' },
  { id: 'gra_18', title: 'Trân trọng', description: 'Một điều bạn muốn trân trọng hơn.', loai: 'reflection', category: 'gratitude', xpReward: 15, actionType: 'gratitude', growthImpact: IMPACT.gratitude, location: 'thung_lung_cau_hoi' },
  { id: 'gra_19', title: 'Hạnh phúc', description: 'Một điều khiến bạn cảm thấy hạnh phúc thật sự.', loai: 'reflection', category: 'gratitude', xpReward: 15, actionType: 'gratitude', growthImpact: IMPACT.gratitude, location: 'thung_lung_cau_hoi' },
  { id: 'gra_20', title: 'Đủ đầy', description: 'Một điều khiến bạn cảm thấy cuộc sống đủ đầy.', loai: 'reflection', category: 'gratitude', xpReward: 20, actionType: 'gratitude', growthImpact: IMPACT.gratitude, location: 'thung_lung_cau_hoi' },
];

// ══════════════════════════════════════════════
// NHÓM 9 — Self-Compassion (20)
// ══════════════════════════════════════════════

const SELF_COMPASSION_QUESTS: Quest[] = [
  { id: 'sel_01', title: 'Lời tử tế cho bản thân', description: 'Viết một lời tử tế dành cho bản thân.', loai: 'growth', category: 'self_compassion', xpReward: 15, actionType: 'emotion_regulation', growthImpact: IMPACT.share, location: 'dong_song_cam_xuc' },
  { id: 'sel_02', title: 'Tha thứ cho mình', description: 'Điều bạn muốn tha thứ cho chính mình.', loai: 'growth', category: 'self_compassion', xpReward: 25, actionType: 'emotion_regulation', growthImpact: IMPACT.share, location: 'dong_song_cam_xuc' },
  { id: 'sel_03', title: 'Buông bỏ lỗi lầm', description: 'Một lỗi lầm bạn muốn buông bỏ.', loai: 'growth', category: 'self_compassion', xpReward: 25, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'dong_song_cam_xuc' },
  { id: 'sel_04', title: 'Tự hào về bản thân', description: 'Điều khiến bạn tự hào nhất về bản thân.', loai: 'growth', category: 'self_compassion', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dong_song_cam_xuc' },
  { id: 'sel_05', title: 'Điểm mạnh của bạn', description: 'Một điểm mạnh lớn nhất của bạn.', loai: 'growth', category: 'self_compassion', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dong_song_cam_xuc' },
  { id: 'sel_06', title: 'Chăm sóc bản thân', description: 'Khi nào bạn thật sự chăm sóc bản thân?', loai: 'growth', category: 'self_compassion', xpReward: 15, actionType: 'emotion_regulation', growthImpact: IMPACT.share, location: 'dong_song_cam_xuc' },
  { id: 'sel_07', title: 'Lời khuyên cho mình', description: 'Một lời khuyên bạn dành cho chính mình lúc này.', loai: 'growth', category: 'self_compassion', xpReward: 20, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'dong_song_cam_xuc' },
  { id: 'sel_08', title: 'Đủ tốt', description: 'Một khoảnh khắc bạn cảm thấy mình đủ tốt.', loai: 'growth', category: 'self_compassion', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dong_song_cam_xuc' },
  { id: 'sel_09', title: 'Nói với mình khi buồn', description: 'Điều bạn muốn nói với bản thân khi buồn.', loai: 'growth', category: 'self_compassion', xpReward: 20, actionType: 'emotion_regulation', growthImpact: IMPACT.share, location: 'dong_song_cam_xuc' },
  { id: 'sel_10', title: 'Tha thứ', description: 'Một điều bạn muốn tha thứ cho bản thân.', loai: 'growth', category: 'self_compassion', xpReward: 25, actionType: 'emotion_regulation', growthImpact: IMPACT.share, location: 'dong_song_cam_xuc' },
  { id: 'sel_11', title: 'Yêu bản thân', description: 'Điều gì khiến bạn cảm thấy yêu bản thân?', loai: 'growth', category: 'self_compassion', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dong_song_cam_xuc' },
  { id: 'sel_12', title: 'Bước nhỏ chăm sóc mình', description: 'Một bước nhỏ để chăm sóc bản thân hôm nay.', loai: 'growth', category: 'self_compassion', xpReward: 15, actionType: 'emotion_regulation', growthImpact: IMPACT.share, location: 'dong_song_cam_xuc' },
  { id: 'sel_13', title: 'Đối xử tốt với mình', description: 'Khi nào bạn đối xử tốt với bản thân nhất?', loai: 'growth', category: 'self_compassion', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dong_song_cam_xuc' },
  { id: 'sel_14', title: 'Động viên chính mình', description: 'Một lời động viên dành cho chính mình.', loai: 'growth', category: 'self_compassion', xpReward: 15, actionType: 'emotion_regulation', growthImpact: IMPACT.share, location: 'dong_song_cam_xuc' },
  { id: 'sel_15', title: 'Chấp nhận', description: 'Một điều bạn muốn học cách chấp nhận.', loai: 'growth', category: 'self_compassion', xpReward: 25, actionType: 'reflection', growthImpact: IMPACT.reframe, location: 'dong_song_cam_xuc' },
  { id: 'sel_16', title: 'Điểm mạnh hay quên', description: 'Một điểm mạnh bạn thường quên mất.', loai: 'growth', category: 'self_compassion', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dong_song_cam_xuc' },
  { id: 'sel_17', title: 'Cảm giác đáng giá', description: 'Một điều khiến bạn cảm thấy đáng giá.', loai: 'growth', category: 'self_compassion', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dong_song_cam_xuc' },
  { id: 'sel_18', title: 'Nhắc nhở tích cực', description: 'Một lời nhắc nhở tích cực cho bản thân mỗi ngày.', loai: 'growth', category: 'self_compassion', xpReward: 15, actionType: 'emotion_regulation', growthImpact: IMPACT.share, location: 'dong_song_cam_xuc' },
  { id: 'sel_19', title: 'Học cách yêu', description: 'Một điều bạn muốn học cách yêu thương.', loai: 'growth', category: 'self_compassion', xpReward: 20, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'dong_song_cam_xuc' },
  { id: 'sel_20', title: 'Bình an nội tâm', description: 'Một điều khiến bạn cảm thấy bình an bên trong.', loai: 'growth', category: 'self_compassion', xpReward: 15, actionType: 'emotion_regulation', growthImpact: IMPACT.share, location: 'dong_song_cam_xuc' },
];

// ══════════════════════════════════════════════
// NHÓM 10 — Community Impact (20)
// ══════════════════════════════════════════════

const COMMUNITY_IMPACT_QUESTS: Quest[] = [
  { id: 'com_01', title: 'Chia sẻ bài học', description: 'Chia sẻ một bài học với cộng đồng.', loai: 'community', category: 'community_impact', xpReward: 20, actionType: 'help_others', growthImpact: IMPACT.community, location: 'thanh_pho_ket_noi' },
  { id: 'com_02', title: 'Hỗ trợ người đang buồn', description: 'Hỗ trợ một người đang buồn trong cộng đồng.', loai: 'community', category: 'community_impact', xpReward: 25, actionType: 'help_others', growthImpact: IMPACT.help, location: 'thanh_pho_ket_noi' },
  { id: 'com_03', title: 'Gửi lời động viên', description: 'Gửi một lời động viên cho ai đó.', loai: 'community', category: 'community_impact', xpReward: 15, actionType: 'help_others', growthImpact: IMPACT.community, location: 'thanh_pho_ket_noi' },
  { id: 'com_04', title: 'Trả lời câu hỏi', description: 'Trả lời câu hỏi của ai đó trong cộng đồng.', loai: 'community', category: 'community_impact', xpReward: 20, actionType: 'help_others', growthImpact: IMPACT.help, location: 'thanh_pho_ket_noi' },
  { id: 'com_05', title: 'Câu chuyện truyền cảm hứng', description: 'Chia sẻ câu chuyện truyền cảm hứng từ cuộc đời bạn.', loai: 'community', category: 'community_impact', xpReward: 25, actionType: 'help_others', growthImpact: IMPACT.help, location: 'thanh_pho_ket_noi' },
  { id: 'com_06', title: 'Giúp người mới', description: 'Giúp một người mới trong cộng đồng.', loai: 'community', category: 'community_impact', xpReward: 20, actionType: 'help_others', growthImpact: IMPACT.help, location: 'thanh_pho_ket_noi' },
  { id: 'com_07', title: 'Cảm ơn cộng đồng', description: 'Một lời cảm ơn dành cho cộng đồng SoulFriend.', loai: 'community', category: 'community_impact', xpReward: 15, actionType: 'gratitude', growthImpact: IMPACT.gratitude, location: 'thanh_pho_ket_noi' },
  { id: 'com_08', title: 'Bài học muốn chia sẻ', description: 'Một bài học cuộc sống bạn muốn chia sẻ.', loai: 'community', category: 'community_impact', xpReward: 20, actionType: 'help_others', growthImpact: IMPACT.community, location: 'thanh_pho_ket_noi' },
  { id: 'com_09', title: 'Cộng đồng giúp bạn', description: 'Khi nào cộng đồng đã giúp bạn?', loai: 'community', category: 'community_impact', xpReward: 15, actionType: 'gratitude', growthImpact: IMPACT.gratitude, location: 'thanh_pho_ket_noi' },
  { id: 'com_10', title: 'Bạn giúp cộng đồng', description: 'Khi nào bạn đã giúp cộng đồng?', loai: 'community', category: 'community_impact', xpReward: 20, actionType: 'help_others', growthImpact: IMPACT.help, location: 'thanh_pho_ket_noi' },
  { id: 'com_11', title: 'Hành động tích cực', description: 'Một hành động tích cực bạn muốn thực hiện.', loai: 'community', category: 'community_impact', xpReward: 15, actionType: 'help_others', growthImpact: IMPACT.community, location: 'thanh_pho_ket_noi' },
  { id: 'com_12', title: 'Lời khuyên cho người trẻ', description: 'Một lời khuyên bạn muốn dành cho người trẻ.', loai: 'community', category: 'community_impact', xpReward: 20, actionType: 'help_others', growthImpact: IMPACT.help, location: 'thanh_pho_ket_noi' },
  { id: 'com_13', title: 'Câu chuyện vượt khó', description: 'Chia sẻ một câu chuyện vượt khó của bạn.', loai: 'community', category: 'community_impact', xpReward: 25, actionType: 'help_others', growthImpact: IMPACT.help, location: 'thanh_pho_ket_noi' },
  { id: 'com_14', title: 'Học từ người khác', description: 'Một điều bạn học được từ người khác.', loai: 'community', category: 'community_impact', xpReward: 15, actionType: 'journal_entry', growthImpact: IMPACT.journal, location: 'thanh_pho_ket_noi' },
  { id: 'com_15', title: 'Điều muốn chia sẻ', description: 'Một điều bạn muốn chia sẻ với mọi người.', loai: 'community', category: 'community_impact', xpReward: 15, actionType: 'help_others', growthImpact: IMPACT.community, location: 'thanh_pho_ket_noi' },
  { id: 'com_16', title: 'Lời chúc cộng đồng', description: 'Một lời chúc dành cho cộng đồng SoulFriend.', loai: 'community', category: 'community_impact', xpReward: 15, actionType: 'help_others', growthImpact: IMPACT.community, location: 'thanh_pho_ket_noi' },
  { id: 'com_17', title: 'Hành động tử tế', description: 'Một hành động tử tế bạn đã làm hoặc muốn làm.', loai: 'community', category: 'community_impact', xpReward: 20, actionType: 'help_others', growthImpact: IMPACT.help, location: 'thanh_pho_ket_noi' },
  { id: 'com_18', title: 'Bài học cuộc sống', description: 'Một bài học cuộc sống quan trọng nhất với bạn.', loai: 'community', category: 'community_impact', xpReward: 20, actionType: 'help_others', growthImpact: IMPACT.community, location: 'thanh_pho_ket_noi' },
  { id: 'com_19', title: 'Trải nghiệm ý nghĩa', description: 'Một trải nghiệm ý nghĩa bạn muốn chia sẻ.', loai: 'community', category: 'community_impact', xpReward: 20, actionType: 'help_others', growthImpact: IMPACT.help, location: 'thanh_pho_ket_noi' },
  { id: 'com_20', title: 'Tin vào con người', description: 'Một điều khiến bạn tin vào con người.', loai: 'community', category: 'community_impact', xpReward: 20, actionType: 'help_others', growthImpact: IMPACT.community, location: 'thanh_pho_ket_noi' },
];

// ══════════════════════════════════════════════
// ALL 200 QUESTS — Combined export
// ══════════════════════════════════════════════

export const ALL_QUESTS: Quest[] = [
  ...REFLECTION_QUESTS,
  ...EMOTIONAL_AWARENESS_QUESTS,
  ...COGNITIVE_REFRAMING_QUESTS,
  ...RESILIENCE_QUESTS,
  ...RELATIONSHIPS_QUESTS,
  ...EMPATHY_QUESTS,
  ...MEANING_PURPOSE_QUESTS,
  ...GRATITUDE_QUESTS,
  ...SELF_COMPASSION_QUESTS,
  ...COMMUNITY_IMPACT_QUESTS,
];

// Category-grouped export for easy access
export const QUEST_GROUPS = {
  reflection:          REFLECTION_QUESTS,
  emotional_awareness: EMOTIONAL_AWARENESS_QUESTS,
  cognitive_reframing: COGNITIVE_REFRAMING_QUESTS,
  resilience:          RESILIENCE_QUESTS,
  relationships:       RELATIONSHIPS_QUESTS,
  empathy:             EMPATHY_QUESTS,
  meaning_purpose:     MEANING_PURPOSE_QUESTS,
  gratitude:           GRATITUDE_QUESTS,
  self_compassion:     SELF_COMPASSION_QUESTS,
  community_impact:    COMMUNITY_IMPACT_QUESTS,
} as const;
