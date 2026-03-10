# COPILOT DEVELOPMENT RULES — SoulFriend GameFi Module

> **Mọi Copilot agent PHẢI đọc file này trước khi sinh code liên quan đến GameFi.**
> Prompt chuẩn: `Follow the rules in COPILOT_RULES_GAMEFI.md. Create a new GameFi module without modifying existing code. All files must be placed inside /gamefi.`

---

## RULE 1 — Không sửa code cũ

GameFi must be implemented as a **completely isolated module**.

Copilot is **NOT allowed** to modify existing files in:
- `backend/`
- `frontend/`
- `ai/`

All new code must be placed inside the `/gamefi` directory.

> Quy tắc này ngăn Copilot đụng vào chatbot hoặc AI engine hiện tại.

---

## RULE 2 — Kiến trúc module cố định

The GameFi system must follow this architecture:

```
gamefi/
 ├─ core/          # Character, XP, level, archetype
 ├─ engine/        # Psychological growth engine, progression
 ├─ quests/        # Quest definitions, quest logic
 ├─ economy/       # SoulPoint, EmpathyPoint, rewards
 ├─ world/         # World map, locations, narrative content (Vietnamese JSON)
 ├─ api/           # API endpoints for GameFi
 └─ test/          # Test scripts for every module
```

Each module must be **independent** and **export functions**.
Do not create files outside this structure.

---

## RULE 3 — Event-driven architecture

GameFi must use an **event-driven architecture**.

GameFi **cannot** directly call chatbot logic.

Instead it must **listen to events** such as:

| Event                        | Trigger                              |
|------------------------------|--------------------------------------|
| `user_journal_entry`         | User writes a journal entry          |
| `user_helped_user`           | User supports another user           |
| `user_completed_reflection`  | User completes a reflection exercise |
| `user_shared_story`          | User shares a personal story         |
| `user_completed_quest`       | User finishes a quest                |

GameFi reacts to events — it never initiates calls to existing systems.

---

## RULE 4 — Dữ liệu tách riêng

GameFi must store data in its **own database schema**.

Tables include:

| Table        | Purpose                                  |
|--------------|------------------------------------------|
| `characters` | Archetype, level, XP, growth vector      |
| `quests`     | Quest definitions & completion tracking  |
| `rewards`    | Badges, points, unlocks                  |
| `progress`   | Psychological growth scores & milestones |

GameFi must **not** modify existing application tables.

---

## RULE 5 — Nội dung Việt hóa

All narrative content must be written in **Vietnamese**.

This includes:
- Character names (Người Tìm Đường, Người Hồi Sinh, ...)
- Locations (Thung Lũng Câu Hỏi, Rừng Tự Nhận Thức, ...)
- Quests (Lắng nghe cảm xúc, Viết lại câu chuyện, ...)
- Rewards (Huy Hiệu Thấu Hiểu, Huy Hiệu Đồng Cảm, ...)
- Story text

Content must be stored in **JSON files** inside: `gamefi/world/`

---

## RULE 6 — Logic game: Psychological RPG

GameFi must implement a **psychological RPG system**.

### Character attributes

Each character has:
- `level` — Game progression level
- `experience` — XP points
- `growthScore` — Psychological Growth Score
- `archetype` — One of 5 archetypes

### 5 Archetypes

| Archetype       | Vietnamese            | Description                    |
|-----------------|-----------------------|--------------------------------|
| Seeker          | Người Tìm Đường       | Đang tìm hướng đi trong cuộc sống |
| Phoenix         | Người Hồi Sinh        | Đang vượt qua tổn thương       |
| Builder         | Người Kiến Tạo        | Muốn xây dựng bản thân tốt hơn |
| Empath          | Người Đồng Cảm        | Thích hỗ trợ người khác        |
| Explorer        | Người Khám Phá        | Tò mò về cảm xúc và tâm trí   |

### 5 Psychological Stats (Growth Vector)

```
G = [Nhận diện cảm xúc, An toàn tâm lý, Ý nghĩa sống, Linh hoạt nhận thức, Kết nối xã hội]
```

| Stat                    | English                  | Increases when...               |
|-------------------------|--------------------------|---------------------------------|
| Nhận diện cảm xúc      | Emotional Awareness      | Viết nhật ký                    |
| An toàn tâm lý          | Psychological Safety     | Hoàn thành quest điều tiết       |
| Ý nghĩa sống           | Meaning in Life          | Tìm mục đích, phản chiếu        |
| Linh hoạt nhận thức     | Cognitive Flexibility    | Viết lại câu chuyện cá nhân     |
| Kết nối xã hội          | Social Connection        | Hỗ trợ người khác               |

### Psychological Growth Score

```
PGS = (Emotional Awareness + Safety + Meaning + Flexibility + Connection) / 5
```

Actions increase experience and psychological growth. Users see their journey, not the formula.

---

## RULE 7 — An toàn dữ liệu

GameFi must **never** expose sensitive psychological data.

- Only **anonymized user IDs** may be used.
- No personal information should be stored in GameFi tables.
- Psychological data must be handled with care per privacy regulations.

---

## RULE 8 — Code style

Code must follow these rules:

- Use **simple modular Node.js** (TypeScript preferred)
- Use **clear function names** (e.g., `calculateGrowthScore`, `completeQuest`)
- **Avoid long files** — each file ≤ 200 lines
- Each file should handle **one responsibility**
- Export functions explicitly
- No inline magic numbers — use constants

---

## RULE 9 — Test mọi module

Every GameFi module must include test scripts inside: `gamefi/test/`

The system must **run independently** before integration.

Test file naming: `<module>.test.ts` (e.g., `core.test.ts`, `quests.test.ts`)

---

## RULE 10 — Phát triển theo giai đoạn

GameFi development must follow phases. Do **not** build Phase 2/3 features during Phase 1.

### Phase 1 — Foundation
- Character system (archetype, stats)
- XP system (experience, level)
- Basic quest system

### Phase 2 — Depth
- Psychological growth engine
- World map & locations
- Community quests & guilds

### Phase 3 — Economy & Scale
- Token economy (SoulPoint, EmpathyPoint)
- Guild system
- AI quest generator
- Research dataset export

---

## GAME DESIGN REFERENCE

> Phần dưới đây là tài liệu thiết kế game để Copilot hiểu ngữ cảnh khi sinh code.

### Tầm nhìn dự án

SoulFriend là một **Psychological RPG** nơi người chơi khám phá thế giới nội tâm thông qua nhiệm vụ phản ánh, kết nối cộng đồng và phát triển bản thân.

Vòng lặp cốt lõi:
```
Chia sẻ → Thấu hiểu → Kết nối → Trưởng thành
```

Khác với game truyền thống: thay vì "đánh quái → lên level", SoulFriend dùng vòng lặp tâm lý.

### Core Gameplay Loop

```
Người dùng chia sẻ suy nghĩ
       ↓
AI phân tích cảm xúc và câu chuyện
       ↓
GameFi kích hoạt quest hoặc phần thưởng
       ↓
Nhân vật tăng kinh nghiệm
       ↓
Mở khóa khu vực mới trong thế giới tâm lý
```

### Level System

| Level | Title             | Vietnamese          |
|-------|-------------------|---------------------|
| 1     | Observer          | Người Quan Sát       |
| 2     | Learner           | Người Tìm Hiểu      |
| 3     | Understander      | Người Thấu Hiểu     |
| 4     | Connector         | Người Kết Nối        |
| 5     | Guide             | Người Dẫn Đường      |

Level cao hơn mở khóa: quest mới, địa điểm mới, vai trò cộng đồng.

### World Map — Bản đồ hành trình tâm lý

```
Thung Lũng Câu Hỏi          (Điểm khởi đầu)
       ↓
Rừng Tự Nhận Thức            (Nhận diện cảm xúc)
       ↓
Dòng Sông Cảm Xúc            (Điều tiết cảm xúc)
       ↓
Thành Phố Kết Nối            (Xây dựng mối quan hệ)
       ↓
Đỉnh Núi Ý Nghĩa            (Tìm mục đích sống)
```

Mỗi khu vực mở khóa khi người chơi đạt level nhất định.

### Quest Examples

| Quest                  | Description                                      | Stat Increased           |
|------------------------|--------------------------------------------------|--------------------------|
| Lắng nghe cảm xúc      | Viết vài dòng về cảm xúc hôm nay                 | Nhận diện cảm xúc        |
| Viết lại câu chuyện     | Nhìn lại ký ức khó khăn từ góc độ khác            | Linh hoạt nhận thức      |
| Một lời đồng cảm        | Để lại lời hỗ trợ cho người khác                  | Kết nối xã hội           |
| Khoảnh khắc biết ơn     | Viết ba điều bạn biết ơn hôm nay                  | Ý nghĩa sống            |

### Reward System

| Reward                | Type   | Earned by                        |
|-----------------------|--------|----------------------------------|
| Điểm Hành Trình       | XP     | Hoàn thành quest                 |
| Huy Hiệu Thấu Hiểu   | Badge  | Viết nhiều nhật ký               |
| Huy Hiệu Đồng Cảm    | Badge  | Hỗ trợ cộng đồng                |
| Huy Hiệu Kiên Cường   | Badge  | Vượt qua khó khăn               |

Phần thưởng tạo động lực nhưng **không gây nghiện**.

### Economy System

| Currency      | Earned by              | Used for                      |
|---------------|------------------------|-------------------------------|
| SoulPoint     | Hoàn thành quest       | Mở khóa avatar, quest đặc biệt |
| EmpathyPoint  | Hỗ trợ người khác      | Tham gia workshop, unlock      |

**Không** khuyến khích đầu cơ tài chính.

### Community — Guild System

| Guild                      | Focus                    |
|----------------------------|--------------------------|
| Guild Lo Âu                | Hỗ trợ lo âu             |
| Guild Cô Đơn              | Kết nối người cô đơn     |
| Guild Tìm Ý Nghĩa         | Tìm mục đích sống        |
| Guild Phát Triển Bản Thân  | Phát triển cá nhân       |

Guilds có: quest nhóm, thảo luận, hỗ trợ lẫn nhau.

### AI Integration (read-only from GameFi)

AI có ba vai trò (handled by existing `ai/` module):
1. **Phân tích cảm xúc** — xác định trạng thái tâm lý người chơi
2. **Phân tích narrative** — hiểu câu chuyện người dùng kể
3. **Gợi ý quest** — đề xuất nhiệm vụ phù hợp

GameFi chỉ **nhận kết quả** qua events, không gọi trực tiếp AI.

---

## PSYCHOLOGICAL PROGRESSION SYSTEM

> Hệ thống tiến trình tâm lý — khiến người chơi cảm nhận "Tôi đang thay đổi thật."

### Hai loại tiến trình

| Type                  | Metrics                           | Purpose           |
|-----------------------|-----------------------------------|--------------------|
| Progression kỹ thuật  | XP, Level, Badge                  | Động lực ngắn hạn  |
| Progression tâm lý    | Awareness, Regulation, Meaning... | Tiến trình dài hạn |

SoulFriend phải hiển thị **cả hai**.

### Milestones (thay vì chỉ Level)

| Milestone         | Requirement                          | Unlock                              |
|-------------------|--------------------------------------|--------------------------------------|
| Người Nhận Diện    | Viết 10 nhật ký cảm xúc              | Khả năng hiểu cảm xúc bản thân      |
| Người Bình Tĩnh    | Hoàn thành 5 quest điều tiết cảm xúc | Kỹ năng điều tiết                    |
| Người Thấu Hiểu    | Giúp 20 người trong cộng đồng        | Vai trò hỗ trợ cộng đồng            |
| Người Dẫn Đường    | Hỗ trợ người khác vượt qua khó khăn  | Danh hiệu cao nhất                   |

Milestone khiến người chơi cảm thấy họ đang trở thành **một kiểu người mới**.

### Psychological Skill Tree

```
Nhận diện bản thân
   ├─ Nhận diện cảm xúc
   ├─ Hiểu suy nghĩ
   └─ Quan sát hành vi

Điều tiết cảm xúc
   ├─ Thở và bình tĩnh
   ├─ Viết lại suy nghĩ
   └─ Chấp nhận cảm xúc

Kết nối xã hội
   ├─ Lắng nghe
   ├─ Đồng cảm
   └─ Giao tiếp lành mạnh
```

Người chơi mở khóa từng nhánh qua hành vi thật.

### Narrative Evolution

AI theo dõi câu chuyện người dùng theo thời gian:

```
Ban đầu:  "tôi cảm thấy mình thất bại"
3 tháng:  "tôi đang học từ những sai lầm của mình"

→ Narrative Shift Detected: Self-blame → Growth mindset
```

Người chơi nhìn thấy sự thay đổi trong cách họ kể câu chuyện đời mình.

### Reflection Moments

Sau mỗi milestone, game tạo một **moment phản chiếu**:

> *"3 tháng trước bạn viết rằng bạn cảm thấy lạc lối.
> Hôm nay bạn đã giúp 12 người khác vượt qua khó khăn."*

### Empathy Reputation

```
Người Lắng Nghe → Người Đồng Cảm → Người Hỗ Trợ → Người Dẫn Đường
```

Danh hiệu đến từ hành vi thật, không mua được.

### Psychological Timeline

```
Tháng 1 — Bắt đầu hành trình
Tháng 2 — Hoàn thành quest nhận diện cảm xúc
Tháng 3 — Giúp người khác lần đầu
Tháng 4 — Mở khóa Thành Phố Kết Nối
```

### Identity Transformation

Game không chỉ nói: *"Bạn đạt level 10"*
Mà nói: **"Bạn đã trở thành Người Dẫn Đường."**

Nguyên lý: **identity-based motivation** — khi danh tính thay đổi, hành vi thay đổi theo.

---

## SỰ KHÁC BIỆT CỦA SOULFRIEND

Hầu hết GameFi nói: *"kiếm token"*

SoulFriend nói: **"trở thành phiên bản trưởng thành hơn của chính bạn."**

---

## QUICK REFERENCE FOR COPILOT

When generating GameFi code, always:

1. Place files in `/gamefi/<module>/`
2. Never import from `backend/`, `frontend/`, or `ai/`
3. Use event listeners, not direct function calls
4. Write content in Vietnamese
5. Include tests in `gamefi/test/`
6. Keep files short and single-responsibility
7. Use anonymized user IDs only
8. Follow the current development phase
