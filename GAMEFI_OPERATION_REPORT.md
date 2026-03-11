# 🎮 BÁO CÁO CHI TIẾT: Hệ Thống GameFi — SoulFriend

> **Ngày tạo:** 2026-03-11  
> **Phiên bản:** v2.0 (22 hệ thống, 200+ quest)

---

## 📋 MỤC LỤC

1. [Tổng Quan Hệ Thống](#1-tổng-quan-hệ-thống)
2. [Hành Trình Người Chơi](#2-hành-trình-người-chơi)
3. [Hệ Thống Quest (Nhiệm Vụ)](#3-hệ-thống-quest)
4. [Cơ Chế Hoàn Thành Quest](#4-cơ-chế-hoàn-thành-quest)
5. [Hệ Thống Kinh Tế (XP, Points)](#5-hệ-thống-kinh-tế)
6. [Level & Cấp Bậc](#6-level--cấp-bậc)
7. [Chỉ Số Phát Triển Tâm Lý](#7-chỉ-số-phát-triển-tâm-lý)
8. [AI Đề Xuất Quest (Adaptive)](#8-ai-đề-xuất-quest)
9. [Chuỗi Nhiệm Vụ (Quest Chains)](#9-chuỗi-nhiệm-vụ)
10. [Bản Đồ Thế Giới](#10-bản-đồ-thế-giới)
11. [Cây Kỹ Năng](#11-cây-kỹ-năng)
12. [Hệ Thống Huy Hiệu](#12-hệ-thống-huy-hiệu)
13. [Vòng Lặp Hành Vi](#13-vòng-lặp-hành-vi)
14. [Tích Hợp ChatBot](#14-tích-hợp-chatbot)
15. [Tính Cách Nhân Vật (Archetypes)](#15-tính-cách-nhân-vật)
16. [Luồng Dữ Liệu & API](#16-luồng-dữ-liệu--api)

---

## 1. TỔNG QUAN HỆ THỐNG

SoulFriend GameFi là hệ thống gamification tâm lý học, biến việc chăm sóc sức khỏe tâm thần thành hành trình khám phá thế giới nội tâm. Người chơi hoàn thành nhiệm vụ tâm lý → nhận XP → lên cấp → mở khóa kỹ năng và vùng đất mới.

### Thành phần chính:
```
┌─────────────────────────────────────────────────────────┐
│                  FRONTEND (React)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │Dashboard │ │Quests AI │ │World Map │ │Skill Tree │  │
│  │(6 daily) │ │(200+ DB) │ │(5 vùng)  │ │(20 skills)│  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘  │
│       └─────────┬──┴────────────┘              │        │
│           ┌─────▼──────┐                       │        │
│           │  GameFi    │◄──────────────────────┘        │
│           │  Context   │   (shared state)                │
│           └─────┬──────┘                                │
├─────────────────┼───────────────────────────────────────┤
│                 ▼ API Calls                              │
│             BACKEND (Express + GameFi Engine)            │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Event Handler → Growth Stats → Level → Rewards  │    │
│  │ Adaptive AI → Quest Chains → State Machine      │    │
│  └─────────────────────────────────────────────────┘    │
│                     ▼                                    │
│               MongoDB (persistence)                      │
└─────────────────────────────────────────────────────────┘
```

---

## 2. HÀNH TRÌNH NGƯỜI CHƠI

### 2.1 Người dùng mới (Onboarding)

```
Đăng ký → Chọn Archetype → Onboarding Modal → Dashboard
```

1. **Lần đầu vào GameFi**: Hệ thống detect Level 1 + 0 quest hoàn thành → hiện **Onboarding Modal**
2. Modal giới thiệu thế giới và hướng dẫn cơ bản
3. Người chơi bắt đầu tại **Thung Lũng Câu Hỏi** (vùng đất khởi đầu)

### 2.2 Vòng lặp hàng ngày

```
Mở app → Dashboard (6 daily quests)
         ├── Quest Chat (nói chuyện 3 tin nhắn) → Auto-complete
         ├── Quest DASS (làm bài test)           → Auto-complete
         ├── Quest Journal (viết nhật ký)         → Nhập text
         ├── Quest Breathing (hít thở 5 phút)    → Xác nhận
         ├── Quest Gratitude (viết biết ơn)       → Nhập text
         └── Quest Walk (đi dạo 15 phút)         → Xác nhận
                    ↓
         Nhận XP + Soul/Empathy Points
                    ↓
         Xem Quests AI → Nhận đề xuất → Làm quest DB
                    ↓
         Lên level → Mở khóa vùng đất/kỹ năng mới
```

### 2.3 Các tab chính

| Tab | Chức năng |
|-----|-----------|
| 🌸 **Profile** | Thông tin tổng hợp người chơi |
| 🏠 **Dashboard** | XP, stats, 6 daily quests, huy hiệu |
| 🗺️ **World Map** | 5 vùng đất, di chuyển khi đủ điều kiện |
| 🌳 **Skill Tree** | 20 kỹ năng trong 5 nhánh, unlock dần |
| 🎯 **Quests AI** | AI đề xuất + 200 quest DB + lịch sử |
| 🔄 **Behavior** | Ritual hàng ngày, thử thách tuần/mùa |
| 📜 **Lore** | Câu chuyện thế giới, triết lý, truyền thuyết |

---

## 3. HỆ THỐNG QUEST

### 3.1 Daily Quests (6 quest/ngày)

**2 quest cố định + 4 quest xoay vòng** (chọn từ pool 13 quest theo hash ngày)

| Quest | XP | Cách hoàn thành | Mô tả |
|-------|-----|-----------------|-------|
| 🤖 Trò chuyện AI | 3 | Tự động (3+ tin nhắn) | Nói chuyện với chatbot |
| 📋 Làm DASS-21 | 5 | Tự động | Hoàn thành bài test tâm lý |
| 📝 Viết nhật ký | 3 | Nhập text (≥3 câu) | Ghi lại cảm xúc hôm nay |
| 🧘 Hít thở 5 phút | 2 | Bấm xác nhận | Thực hành mindfulness |
| 🔍 Tìm hiểu tâm lý | 2 | Tự động | Đọc bài viết tâm lý |
| 📣 Chia sẻ câu chuyện | 5 | Nhập text (≥3 câu) | Viết trải nghiệm cá nhân |
| 🙏 Biết ơn | 3 | Nhập text | Viết điều biết ơn |
| 🎵 Nghe nhạc thư giãn | 2 | Bấm xác nhận | Nghe nhạc 10 phút |
| 🚶 Đi dạo | 2 | Bấm xác nhận | Đi bộ 15 phút |
| 📞 Gọi bạn bè | 3 | Bấm xác nhận | Liên lạc 1 người thân |
| 💆 Chăm sóc bản thân | 2 | Bấm xác nhận | Tự thưởng bản thân |
| ✍️ Suy nghĩ tích cực | 3 | Nhập text | Viết 3 điều tích cực |
| 💧 Uống nước | 2 | Bấm xác nhận | Uống đủ 8 ly |
| 😴 Ngủ đủ giấc | 2 | Nhập text | Ghi giờ ngủ/dậy |
| 💝 Làm việc tử tế | 4 | Bấm xác nhận | Giúp đỡ ai đó |

**Quest ID format:** `quest_{key}_{YYYY-MM-DD}` (ví dụ: `quest_chat_2026-03-11`)

### 3.2 Quest Database (200 quest)

10 thể loại × 20 quest mỗi loại = **200 quest** trong kho:

| Thể Loại | Số Quest | Vùng Đất | ActionType chính | XP |
|-----------|----------|----------|------------------|----|
| 🪞 Reflection (Suy ngẫm) | 20 | Thung Lũng Câu Hỏi | journal_entry | 15-30 |
| 💗 Emotional Awareness | 20 | Rừng Tự Nhận Thức | journal_entry | 15-30 |
| 🧠 Cognitive Reframing | 20 | Rừng Tự Nhận Thức | reflection | 15-30 |
| 💪 Resilience (Kiên cường) | 20 | Dòng Sông Cảm Xúc | reflection | 15-30 |
| 🤝 Relationships | 20 | Thành Phố Kết Nối | gratitude/help | 15-30 |
| 💜 Empathy (Đồng cảm) | 20 | Thành Phố Kết Nối | help_others | 15-30 |
| ✨ Meaning & Purpose | 20 | Đỉnh Núi Ý Nghĩa | journal_entry | 15-30 |
| 🙏 Gratitude (Biết ơn) | 20 | Thung Lũng Câu Hỏi | gratitude | 15-30 |
| 🌊 Self Compassion | 20 | Dòng Sông Cảm Xúc | emotion_reg | 15-30 |
| 🌍 Community Impact | 20 | Thành Phố Kết Nối | help_others | 15-30 |

### 3.3 Ví dụ quest cụ thể

**Ví dụ quest journal_entry (yêu cầu nhập text):**
> 📝 *"Viết về một khoảnh khắc trong ngày khiến bạn cảm thấy bình yên"*  
> Category: reflection | Location: Thung Lũng Câu Hỏi | +15 XP

**Ví dụ quest help_others (xác nhận thủ công):**
> 🤝 *"Gửi một tin nhắn động viên đến người bạn đang gặp khó khăn"*  
> Category: empathy | Location: Thành Phố Kết Nối | +20 XP

---

## 4. CƠ CHẾ HOÀN THÀNH QUEST

### 4.1 Bốn chế độ hoàn thành (Completion Modes)

```
┌─────────────────────────────────────────────────────────────┐
│                    CLICK QUEST                               │
│                        │                                     │
│              ┌─────────▼──────────┐                          │
│              │ tryCompleteQuest()  │                          │
│              │  Check mode         │                          │
│              └─────────┬──────────┘                          │
│         ┌──────────┬───┴────┬────────────┐                   │
│         ▼          ▼        ▼            ▼                   │
│   auto_event  requires_  manual_     instant                 │
│   (toast msg)  input    confirm    (confirm                  │
│   "Quest tự   (modal    (overlay    overlay)                 │
│    động")     nhập text) xác nhận)                           │
│                  │         │           │                      │
│                  ▼         ▼           ▼                      │
│           ┌──────────────────────────────┐                   │
│           │   API POST /quest/complete    │                   │
│           │   hoặc /quests/complete       │                   │
│           └──────────────┬───────────────┘                   │
│                          ▼                                    │
│              ┌───────────────────┐                            │
│              │ RewardOverlay 🎉  │                            │
│              │ XP + Growth Stats │                            │
│              │ + Level Up check  │                            │
│              └───────────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

| Mode | Khi nào | Giao diện | Validation |
|------|---------|-----------|------------|
| `auto_event` | DASS test, Chat 3+ msg | Tự động, không cần click | Hệ thống phải gửi `autoEvent: true` |
| `requires_input` | Viết nhật ký, chia sẻ | **JournalInputModal** — textarea bắt buộc ≥3 câu | `journalText` không được rỗng |
| `manual_confirm` | Hít thở, đi dạo, gọi bạn | **ConfirmOverlay** — nút "Đã hoàn thành" | Luôn cho phép |
| `instant` | (Dự phòng) | Hiển thị confirm overlay | Luôn cho phép |

### 4.2 Quest State Machine

```
locked → available → in_progress → awaiting_validation → completed → rewarded
```

- Chỉ cho phép chuyển tiếp (forward transitions)
- `rewarded` là trạng thái cuối cùng — ngăn nhận thưởng 2 lần
- Mỗi quest theo dõi trạng thái riêng cho từng user

### 4.3 Luồng hoàn thành chi tiết

```
1. User click quest
2. Frontend kiểm tra completionMode
3. Hiện modal/overlay tương ứng
4. User xác nhận (+ nhập text nếu requires_input)
5. Frontend gọi API POST
6. Backend: validate state machine transition
7. Backend: processEvent → tính growth stats
8. Backend: tính XP + Soul/Empathy Points (có daily cap)
9. Backend: kiểm tra level up
10. Backend: kiểm tra milestone
11. Backend: trả về EventResult
12. Frontend: hiển thị RewardOverlay (XP, stats, milestone)
13. Frontend: refresh toàn bộ data
```

---

## 5. HỆ THỐNG KINH TẾ

### 5.1 Ba loại tiền tệ

| Tiền tệ | Cách kiếm | Mục đích |
|----------|-----------|----------|
| **XP** | Mọi quest | Lên level |
| **Soul Points ✨** | Reflection, journaling, checkin | (Tích lũy, chưa có cơ chế tiêu) |
| **Empathy Points 💜** | Help others, community | Xác định Empathy Rank |

### 5.2 Bảng phần thưởng theo hành động

| Hành Động | XP | Soul Points | Empathy Points |
|-----------|-----|-------------|----------------|
| Hoàn thành quest | +5 | — | — |
| Viết reflection | +3 | +2 | — |
| Viết nhật ký | +3 | +2 | — |
| Giúp đỡ người khác | +2 | — | +3 |
| Reply cộng đồng | +2 | +1 | +2 |
| Check-in hàng ngày | +2 | +1 | — |

*Note: Đây là XP cơ bản từ event. Quest DB (200 quest) thưởng 15-30 XP riêng.*

### 5.3 Giới hạn hàng ngày (Chống Nghiện)

| Loại | Giới hạn/ngày |
|------|---------------|
| XP | 100 |
| Soul Points | 50 |
| Empathy Points | 30 |

### 5.4 Streak Bonus

| Streak | Thưởng |
|--------|--------|
| 3 ngày | +10 XP |
| 7 ngày | +20 XP + Huy hiệu ⭐ |
| 14 ngày | +30 XP + Mở quest đặc biệt |
| 30 ngày | +50 XP + Huy hiệu 💎 |

### 5.5 Empathy Rank

| Rank | Điểm tối thiểu |
|------|----------------|
| Người Lắng Nghe | 0 |
| Người Đồng Cảm | 20 |
| Người Hỗ Trợ | 50 |
| Người Dẫn Đường | 100 |

---

## 6. LEVEL & CẤP BẬC

### 6.1 Bảng level

| Level | Danh hiệu | XP cần | Mở khóa |
|-------|-----------|--------|---------|
| 1 | 🌱 Người Quan Sát | 0 | Thung Lũng Câu Hỏi |
| 2 | 📚 Người Tìm Hiểu | 100 | Rừng Tự Nhận Thức |
| 3 | 💡 Người Thấu Hiểu | 300 | Dòng Sông Cảm Xúc |
| 4 | 🤝 Người Kết Nối | 600 | Thành Phố Kết Nối |
| 5 | ⭐ Người Dẫn Đường | 1000 | Đỉnh Núi Ý Nghĩa |

### 6.2 Tính XP Progress

```
XP Progress (%) = (XP hiện tại - XP level hiện tại) / (XP level tiếp - XP level hiện tại) × 100
```

Ví dụ: Level 2, có 250 XP → `(250 - 100) / (300 - 100) × 100 = 75%`

### 6.3 Milestone khi lên level

Khi lên level, backend trả về:
```json
{
  "milestone": "Lên cấp 3: Người Thấu Hiểu",
  "newLevel": 3,
  "levelTitle": "Người Thấu Hiểu"
}
```
→ Frontend hiện **RewardOverlay** với hiệu ứng glow đặc biệt + badge 🏆

---

## 7. CHỈ SỐ PHÁT TRIỂN TÂM LÝ

### 7.1 Năm chỉ số (0-100)

| Chỉ số | Icon | Ý nghĩa |
|--------|------|---------|
| Nhận Diện Cảm Xúc (EA) | 💗 | Khả năng nhận biết và gọi tên cảm xúc |
| An Toàn Tâm Lý (PS) | 🛡️ | Mức độ cảm thấy an toàn nội tâm |
| Ý Nghĩa Sống (M) | ✨ | Cảm nhận mục đích và ý nghĩa |
| Linh Hoạt Nhận Thức (CF) | 🧠 | Khả năng nhìn vấn đề từ nhiều góc |
| Kết Nối Xã Hội (RQ) | 🤝 | Chất lượng mối quan hệ |

### 7.2 Cách tính tăng trưởng

Mỗi quest có `actionType` → mỗi actionType tác động khác nhau lên 5 chỉ số:

| ActionType | EA | PS | M | CF | RQ |
|------------|----|----|---|----|----|
| `journal_entry` | +3 | +1 | +1 | +2 | 0 |
| `emotion_regulation` | +2 | +2 | +1 | +1 | +1 |
| `reflection` | +1 | +1 | +1 | +3 | 0 |
| `help_others` | +1 | +1 | +1 | 0 | +3 |
| `gratitude` | +1 | +2 | +2 | 0 | +1 |

**Bonus theo Archetype:** Ví dụ "Người Đồng Cảm" được +10% cho RQ

### 7.3 Growth Score

```
Growth Score = trung bình 5 chỉ số = (EA + PS + M + CF + RQ) / 5
```

Growth Score quyết định:
- Vùng tâm lý hiện tại (zone)
- Mở khóa vùng đất
- Gợi ý quest AI

### 7.4 Vùng tâm lý (Zones)

| Zone | Growth Score | Mô tả |
|------|-------------|-------|
| 🔴 Disorientation | 0-19 | Mất phương hướng |
| 🟠 Self Exploration | 20-39 | Đang khám phá bản thân |
| 🟡 Stabilization | 40-59 | Ổn định dần |
| 🟢 Growth | 60-79 | Đang phát triển tích cực |
| 🟣 Mentor Stage | 80-100 | Có thể hướng dẫn người khác |

---

## 8. AI ĐỀ XUẤT QUEST (Adaptive)

### 8.1 Thuật toán chấm điểm

Mỗi quest trong DB (200 quest) được chấm điểm:

```
quest_score = stat_need + narrative_relevance + novelty + progression_bonus
```

| Yếu tố | Phạm vi | Cách tính |
|---------|---------|-----------|
| **stat_need** | 0-100 | Ưu tiên quest cải thiện chỉ số yếu nhất. `30 + max(0, 50 - weakestValue)` + 20 nếu category khớp |
| **narrative_relevance** | 0-25 | Quest khớp chủ đề narrative hiện tại |
| **novelty** | 0-20 | 20 nếu chưa hoàn thành, 0 nếu đã làm |
| **progression_bonus** | 5-15 | XP reward ≥15 → 15pt, ≥10 → 10pt, else 5pt |

**Top 5** quest điểm cao nhất được đề xuất.

### 8.2 Ví dụ cụ thể

Giả sử người chơi có:
- EA=45, PS=30, M=40, CF=50, RQ=20 → **RQ yếu nhất**
- Chưa làm quest `rel_05` (category: relationships, +20 XP)

```
stat_need  = 30 + max(0, 50-20) + 20 = 30 + 30 + 20 = 80
novelty    = 20 (chưa hoàn thành)
progression= 15 (XP ≥ 15)
narrative  = 0  (không khớp theme hiện tại)
─────────────
TOTAL      = 115 → Rất cao, sẽ được đề xuất
```

### 8.3 Điều chỉnh độ khó

| Tỷ lệ hoàn thành | Hành động |
|-------------------|-----------|
| < 40% | Giảm độ khó |
| 40-85% | Giữ nguyên |
| > 85% | Tăng độ khó |

Mapping: `easy` (Level ≤2), `medium` (Level 3), `hard` (Level ≥4)

### 8.4 Player Phases

| Phase | Growth Score | Đặc điểm |
|-------|-------------|----------|
| Disorientation | 0-24 | Quest dễ, focus vào self-awareness |
| Exploration | 25-39 | Mở rộng thể loại quest |
| Stabilization | 40-59 | Quest trung bình, đa dạng hơn |
| Growth | 60-79 | Quest khó, community focus |
| Mentor | 80+ | Quest giúp đỡ người khác |

---

## 9. CHUỖI NHIỆM VỤ (Quest Chains)

5 chuỗi quest, mỗi chuỗi 3 bước, nhắm vào 1 chủ đề tâm lý:

| Chuỗi | Chủ đề | XP tổng | Chỉ số target |
|--------|--------|---------|---------------|
| 🤝 Hành Trình Kết Nối | Cô đơn | 25 | Kết Nối Xã Hội |
| 💪 Hành Trình Tự Tin | Tự ti | 27 | Linh Hoạt Nhận Thức |
| 🛡️ Hành Trình An Tâm | Lo âu | 23 | An Toàn Tâm Lý |
| ✨ Hành Trình Ý Nghĩa | Vô nghĩa | 27 | Ý Nghĩa Sống |
| 🔥 Hành Trình Kiên Cường | Yếu đuối | 27 | Nhận Diện Cảm Xúc |

### Ví dụ: Hành Trình Kết Nối

```
Bước 1: "Nhận diện cảm giác cô đơn" (viết journal)     → +7 XP
Bước 2: "Gửi tin nhắn cho 1 người bạn cũ" (xác nhận)    → +8 XP  
Bước 3: "Chia sẻ trải nghiệm kết nối" (viết journal)    → +10 XP
                                                     Tổng: 25 XP
```

Thanh tiến trình hiển thị % hoàn thành. Phải làm tuần tự từ bước 1→2→3.

---

## 10. BẢN ĐỒ THẾ GIỚI

### 5 vùng đất — mở khóa dần theo Level + Growth Score

```
                    ⛰️ Đỉnh Núi Ý Nghĩa
                    (Lv.5, GS≥25)
                         │
                 🏙️ Thành Phố Kết Nối
                 (Lv.4, GS≥15)
                         │
              🌊 Dòng Sông Cảm Xúc
              (Lv.3, GS≥8)
                         │
            🌲 Rừng Tự Nhận Thức
            (Lv.2, GS≥3)
                         │
         🏔️ Thung Lũng Câu Hỏi
         (Lv.1, GS≥0) ← BẮT ĐẦU
```

| Vùng đất | Yêu cầu | Quest categories tại đây |
|----------|---------|-------------------------|
| 🏔️ Thung Lũng Câu Hỏi | Lv.1 | Reflection, Gratitude |
| 🌲 Rừng Tự Nhận Thức | Lv.2 + GS≥3 | Emotional Awareness, Cognitive Reframing |
| 🌊 Dòng Sông Cảm Xúc | Lv.3 + GS≥8 | Resilience, Self Compassion |
| 🏙️ Thành Phố Kết Nối | Lv.4 + GS≥15 | Relationships, Empathy, Community |
| ⛰️ Đỉnh Núi Ý Nghĩa | Lv.5 + GS≥25 | Meaning & Purpose |

Người chơi có thể **di chuyển** giữa các vùng đã mở khóa. Vùng hiện tại hiển thị trên bản đồ.

---

## 11. CÂY KỸ NĂNG

### 5 nhánh × 4 tier = 20 kỹ năng

Mỗi nhánh liên kết với 1 vùng đất. Kỹ năng mở khóa khi đạt đủ quest + điều kiện:

#### 🪞 Nhánh 1: Tự Nhận Thức (→ Rừng Tự Nhận Thức)
```
Tier 1: Nhận diện cảm xúc    ← 5 quest + reflection
Tier 2: Quan sát suy nghĩ    ← cognitive_reframing + tier 1
Tier 3: Hiểu mô hình hành vi ← 15 reflections + tier 2
Tier 4: Nhận thức sâu         ← narrative quest + tier 3
```

#### 🌊 Nhánh 2: Điều Tiết Cảm Xúc (→ Dòng Sông Cảm Xúc)
```
Tier 1: Bình tĩnh              ← 3 quest + emotional_awareness
Tier 2: Điều tiết stress       ← 5 quest + self_compassion + tier 1
Tier 3: Chấp nhận cảm xúc     ← 10 reflections + tier 2
Tier 4: Phục hồi nhanh         ← 15 quest + resilience + tier 3
```

#### 🧠 Nhánh 3: Linh Hoạt Nhận Thức (→ Rừng Tự Nhận Thức)
```
Tier 1: Nhìn từ góc khác       ← 3 quest + cognitive_reframing
Tier 2: Thách thức suy nghĩ    ← 8 reflections + tier 1
Tier 3: Viết lại câu chuyện    ← narrative quest + tier 2
Tier 4: Tư duy phát triển      ← 20 quest + resilience & cog + tier 3
```

#### 🤝 Nhánh 4: Kỹ Năng Quan Hệ (→ Thành Phố Kết Nối)
```
Tier 1: Lắng nghe              ← 3 quest + relationships
Tier 2: Đồng cảm              ← 10 helpOthers + 15 empathy + tier 1
Tier 3: Giao tiếp lành mạnh   ← 10 quest + empathy & relationships + tier 2
Tier 4: Hỗ trợ người khác     ← 20 helpOthers + 30 empathy + tier 3
```

#### ⛰️ Nhánh 5: Ý Nghĩa & Mục Đích (→ Đỉnh Núi Ý Nghĩa)
```
Tier 1: Giá trị cá nhân        ← 5 quest + meaning_purpose
Tier 2: Mục tiêu cuộc sống    ← 10 reflections + gratitude + tier 1
Tier 3: Định hướng tương lai   ← 15 quest + tier 2
Tier 4: Sống có ý nghĩa        ← 25 quest + community + 10 help + tier 3
```

### Synergies (Kết hợp kỹ năng)

| Synergy | Kỹ năng cần | Hiệu ứng |
|---------|-------------|----------|
| 🧘 Inner Balance | Nhận diện cảm xúc + Bình tĩnh | Cân bằng nội tâm |
| 🌍 Community Builder | Đồng cảm + Hỗ trợ người khác | Xây dựng cộng đồng |
| 🗺️ Life Pathfinder | Sống có ý nghĩa + Phục hồi nhanh | Tìm đường đi cuộc sống |

### Branch Mastery (Thạo nhánh)

Unlock hết 4 tier trong 1 nhánh → nhận **danh hiệu đặc biệt**:

| Nhánh | Danh hiệu |
|-------|-----------|
| Tự Nhận Thức | Người Thấu Hiểu |
| Điều Tiết Cảm Xúc | Người Bình Yên |
| Linh Hoạt Nhận Thức | Người Linh Hoạt |
| Kỹ Năng Quan Hệ | Người Kết Nối |
| Ý Nghĩa & Mục Đích | Người Dẫn Đường |

---

## 12. HỆ THỐNG HUY HIỆU

8 huy hiệu, mỗi cái unlock khi đạt điều kiện:

| Huy hiệu | Icon | Điều kiện |
|-----------|------|-----------|
| Người Bắt Đầu | 🌱 | Có XP > 0 (hoàn thành quest đầu tiên) |
| Kiên Trì 3 Ngày | 🔥 | Streak ≥ 3 ngày |
| Streak 7 Ngày | ⭐ | Streak ≥ 7 ngày |
| Kiên Trì 30 Ngày | 💎 | Streak ≥ 30 ngày |
| Người Đồng Cảm | 💜 | Empathy Points ≥ 10 |
| Tâm Hồn Phong Phú | ✨ | Soul Points ≥ 20 |
| Người Trưởng Thành | 🌳 | Growth Score ≥ 20 |
| Champion | 🏆 | Level ≥ 5 |

Huy hiệu hiển thị trên Dashboard dưới dạng grid. Huy hiệu chưa mở có opacity thấp.

---

## 13. VÒNG LẶP HÀNH VI

### 13.1 Daily Ritual (Nghi thức hàng ngày)

3 bước mỗi ngày:

| Bước | Hành động | Phần thưởng |
|------|-----------|-------------|
| 1️⃣ Check-in | Ghi nhận cảm xúc | Tiến trình ritual |
| 2️⃣ Reflection | Viết suy ngẫm | Tiến trình ritual |
| 3️⃣ Community | Tương tác cộng đồng | Tiến trình ritual |

**Hoàn thành cả 3** → +15 XP + 5 Soul Points (bonus)

### 13.2 Weekly Challenges (Thử thách tuần)

| Thử thách | XP | Huy hiệu kèm |
|-----------|-----|---------------|
| Viết Lại Một Câu Chuyện | 50 | badge_cau_chuyen_moi |
| Bảy Ngày Biết Ơn | 40 | — |
| Ba Lần Giúp Đỡ | 45 | badge_nguoi_ho_tro_tuan |
| Bản Đồ Cảm Xúc | 40 | — |
| Suy Ngẫm Sâu | 50 | badge_suy_ngam_sau |

### 13.3 Seasonal Goals (Mục tiêu theo mùa)

| Mục tiêu | Quest cần | Reflections | Empathy Actions | XP | Danh hiệu |
|-----------|-----------|-------------|-----------------|-----|-----------|
| Hành Trình Tự Nhận Thức | 40 | 10 | 5 | 200 | Người Thấu Hiểu |
| Hành Trình Kết Nối | 30 | 5 | 15 | 200 | Người Đồng Hành |
| Hành Trình Ý Nghĩa | 50 | 15 | 10 | 300 | Người Dẫn Đường |

---

## 14. TÍCH HỢP CHATBOT

### 14.1 Auto-complete quest chat

```
User gửi tin nhắn → Đếm tin nhắn → Khi ≥3 tin nhắn:
  → POST /api/v2/gamefi/quest/complete (questId: quest_chat_YYYY-MM-DD)
  → Hiện tin nhắn hệ thống trong chat: "🎮 Quest hoàn thành! +X XP"
  → (Nếu level up) "🏆 Lên cấp 3: Người Thấu Hiểu"
```

### 14.2 Narrative Quest Suggestions

ChatBot phân tích từ khóa trong cuộc trò chuyện → gợi ý quest liên quan:

| Từ khóa | Gợi ý |
|---------|-------|
| buồn, cô đơn, một mình | "Hãy thử quest Gọi điện cho bạn bè" |
| lo lắng, lo âu, sợ | "Hãy thử quest Bài tập thở 5 phút" |
| tức giận, bực mình | "Hãy thử quest về Điều tiết cảm xúc" |

### 14.3 Persistence

- **sessionStorage** lưu: ngày, số tin nhắn, đã hoàn thành chưa
- Mỗi ngày mới → reset bộ đếm
- Ngăn gửi API nhiều lần (optimistic flag)

---

## 15. TÍNH CÁCH NHÂN VẬT (Archetypes)

5 archetype, mỗi cái có stat khởi đầu và bonus khác nhau:

| Archetype | Stats khởi đầu | Bonus +10% | Quest ưu thích |
|-----------|----------------|------------|-----------------|
| 🧭 Người Tìm Đường | M+3, CF+1 | Ý Nghĩa | reflection, narrative |
| 🌅 Người Hồi Sinh | PS+3, EA+1 | An Toàn | reflection, growth |
| 🛠️ Người Kiến Tạo | CF+3, M+1 | Linh Hoạt | growth, narrative |
| 💜 Người Đồng Cảm | RQ+3, PS+1 | Kết Nối | community, growth |
| 🔍 Người Khám Phá | EA+3, CF+1 | Cảm Xúc | reflection, narrative |

Archetype ảnh hưởng:
- Stat khởi đầu (level 1)
- Bonus 10% khi tăng trưởng stat tương ứng
- AI đề xuất quest phù hợp hơn

---

## 16. LUỒNG DỮ LIỆU & API

### 16.1 Danh sách API endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/gamefi/full/:userId` | Toàn bộ data một lần (profile, skills, map, state, behavior, lore) |
| GET | `/gamefi/profile/:userId` | Profile (character, daily quests, badges) |
| GET | `/gamefi/adaptive/:userId` | AI đề xuất quest + quest chains |
| GET | `/gamefi/quests/:userId` | Quest DB (200 quest, paginated) |
| GET | `/gamefi/history/:userId` | Lịch sử hoàn thành |
| GET | `/gamefi/skills/:userId` | Cây kỹ năng |
| GET | `/gamefi/world/:userId` | Bản đồ thế giới |
| GET | `/gamefi/state/:userId` | Trạng thái tâm lý + trajectory |
| GET | `/gamefi/behavior/:userId` | Vòng lặp hành vi |
| GET | `/gamefi/lore` | Lore thế giới |
| POST | `/gamefi/quest/complete` | Hoàn thành daily quest |
| POST | `/gamefi/quests/complete` | Hoàn thành quest DB |
| POST | `/gamefi/event` | Gửi sự kiện tâm lý |
| POST | `/gamefi/world/travel` | Di chuyển vùng đất |
| POST | `/gamefi/behavior/daily` | Hoàn thành bước ritual |
| POST | `/gamefi/behavior/weekly` | Hoàn thành thử thách tuần |
| GET | `/gamefi/supported-events` | Danh sách event types |
| POST | `/gamefi/detect` | Phát hiện loại event |

### 16.2 Response cấu trúc khi hoàn thành quest

```json
{
  "success": true,
  "data": {
    "xpGained": 15,
    "growthImpact": {
      "emotionalAwareness": 3,
      "psychologicalSafety": 1,
      "meaning": 1,
      "cognitiveFlexibility": 2
    },
    "newLevel": 3,
    "levelTitle": "Người Thấu Hiểu",
    "milestone": "Lên cấp 3: Người Thấu Hiểu",
    "unlockedQuest": null,
    "safetyAlert": false,
    "rewards": {
      "soulPoints": 2,
      "empathyPoints": 0
    },
    "feedback": "🎉 +15 XP! ✨ +2 Soul Points..."
  }
}
```

### 16.3 Event Processing Pipeline

```
PsychEvent (input)
    │
    ▼
Map event → ActionType (journal_entry, reflection, etc.)
    │
    ▼
Update Growth Stats (+ archetype bonus %)
    │
    ▼
Calculate Economy (XP + SP + EP, daily cap check)
    │
    ▼
Apply XP → Check Level Up
    │
    ▼
Narrative Analysis → Quest Suggestion
    │
    ▼
Emotion Detection → Safety Check (crisis signals)
    │
    ▼
State Snapshot → Trajectory (for timeline)
    │
    ▼
Milestone Detection (level + growth milestones)
    │
    ▼
Return EventResult
```

---

## 📊 THỐNG KÊ TỔNG HỢP

| Metric | Giá trị |
|--------|---------|
| Tổng quest DB | 200 |
| Quest categories | 10 |
| Daily quests/ngày | 6 |
| Quest chains | 5 (15 bước) |
| Weekly challenges | 5 |
| Seasonal goals | 3 |
| Levels | 5 |
| Vùng đất | 5 |
| Kỹ năng | 20 (5 nhánh × 4 tier) |
| Synergies | 3 |
| Branch masteries | 5 |
| Huy hiệu | 8 |
| Archetypes | 5 |
| Zones tâm lý | 5 |
| Empathy ranks | 4 |
| API endpoints | 18 |
| ActionTypes | 5 |
| Growth stats | 5 |
| Tiền tệ | 3 (XP, Soul, Empathy) |

---

*Báo cáo được tạo tự động từ phân tích mã nguồn SoulFriend GameFi Module v2.0*
