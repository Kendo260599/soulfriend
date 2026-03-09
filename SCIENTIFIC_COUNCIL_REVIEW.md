# BÁO CÁO ĐÁNH GIÁ HỘI ĐỒNG KHOA HỌC
## Ứng dụng SoulFriend — Hệ thống Tâm lý Trị liệu AI dựa trên Mô hình Động lực học 24 chiều

**Ngày đánh giá:** 09/03/2026  
**Mã hồ sơ:** HĐ-KHCN-2026-SF-001  
**Loại đánh giá:** Phản biện toàn diện — Chất lượng khoa học, Tính mới, Tính ứng dụng  

---

## I. THÀNH PHẦN HỘI ĐỒNG KHOA HỌC

| STT | Họ và tên (mô phỏng) | Chuyên ngành | Vai trò |
|-----|----------------------|--------------|---------|
| 1 | PGS.TS. Nguyễn Văn Minh | Tâm lý học Lâm sàng | **Chủ tịch HĐ** |
| 2 | PGS.TS. Trần Thị Hương | Tâm lý học Trị liệu Nhận thức-Hành vi (CBT) | Phản biện 1 |
| 3 | PGS.TS. Lê Hoàng Nam | Tâm lý Toán học & Mô hình Tính toán | Phản biện 2 |
| 4 | PGS.TS. Phạm Thị Lan Anh | Tâm lý học Phát triển & Phòng ngừa | Ủy viên |
| 5 | PGS.TS. Đặng Quốc Việt | Hệ thống Động lực học & AI trong Y tế | Ủy viên |
| 6 | PGS.TS. Vũ Thị Mai | Đo lường Tâm lý & Tâm trắc học | Ủy viên |
| 7 | PGS.TS. Hoàng Đức Thắng | Tâm lý học Thần kinh & Cảm xúc | Ủy viên |
| 8 | PGS.TS. Bùi Thị Thanh Hà | Tâm lý học Xã hội & Văn hóa Việt Nam | Ủy viên |
| 9 | PGS.TS. Ngô Minh Tuấn | Khoa học Dữ liệu & Machine Learning ứng dụng | Ủy viên |
| 10 | PGS.TS. Đinh Thị Phương Thảo | Đạo đức Nghiên cứu & Bảo vệ Đối tượng | Ủy viên |

---

## II. TỔNG QUAN HỆ THỐNG ĐƯỢC ĐÁNH GIÁ

### 2.1 Quy mô mã nguồn

| Thành phần | Ngôn ngữ | Số dòng mã (LOC) |
|------------|----------|-------------------|
| Backend (Server + API) | TypeScript | **48,048** |
| Frontend (Giao diện) | TypeScript/React | **49,035** |
| PGE Engine (Lõi khoa học) | TypeScript | **11,384** (21 service files) |
| Test Suite | TypeScript/Jest | **5,209** |
| **Tổng cộng** | | **~102,292 LOC** |

### 2.2 Kiến trúc công nghệ

- **Backend**: Express 5.1.0, TypeScript 5.9.2, MongoDB Atlas
- **Frontend**: React 19.1.1, Socket.io (real-time)
- **AI**: OpenAI GPT-4o-mini, LangChain 1.0.4, Pinecone (vector DB)
- **Testing**: Jest 30.1.3 — 450 test cases, 16/16 suites pass

### 2.3 Mục đích của ứng dụng

SoulFriend là hệ thống chatbot AI trị liệu tâm lý sử dụng **Psychological Gravity Engine (PGE)** — một mô hình toán học dựa trên lý thuyết hệ động lực phi tuyến, mô phỏng trạng thái tâm lý con người trong không gian 24 chiều (ℝ²⁴), cho phép:

1. Phát hiện sớm khủng hoảng tâm lý (Early Warning)
2. Dự báo quỹ đạo cảm xúc (Trajectory Forecasting)
3. Tối ưu hóa can thiệp tâm lý (Optimal Intervention)
4. Theo dõi phục hồi và tái phát (Resilience Tracking)
5. Hỗ trợ chuyên gia giám sát thời gian thực (Expert Monitoring)

---

## III. ĐÁNH GIÁ CHI TIẾT TỪ TỪNG THÀNH VIÊN HỘI ĐỒNG

---

### 📋 PHẢN BIỆN 1 — PGS.TS. Trần Thị Hương (Tâm lý Trị liệu CBT)

#### A. Đánh giá mô hình 24 chiều tâm lý (24-Dimensional State Space)

**Vector trạng thái $S(t) \in \mathbb{R}^{24}$:**

| Nhóm | Biến (index) | Cơ sở CBT |
|------|-------------|-----------|
| Cảm xúc tiêu cực (0-7) | stress, anxiety, sadness, anger, loneliness, shame, guilt, hopelessness | ✅ Tương thích mô hình nhận thức Beck (1979) — tam giác nhận thức-cảm xúc-hành vi |
| Cảm xúc tích cực (8-11) | hope, calmness, joy, gratitude | ✅ Phù hợp Tâm lý Tích cực (Seligman, 2011) — PERMA framework |
| Nhận thức (12-15) | selfWorth, selfEfficacy, rumination, cognitiveClarity | ✅ Trực tiếp đo lường biến CBT cốt lõi |
| Hành vi (16-19) | avoidance, helpSeeking, socialEngagement, motivation | ✅ Behavioral Activation (Martell et al., 2010) |
| Xã hội (20-22) | trustInOthers, perceivedSupport, fearOfJudgment | ✅ Social Support Theory (Cohen & Wills, 1985) |
| Năng lượng (23) | mentalFatigue | ✅ Burnout Literature (Maslach & Jackson, 1981) |

**Nhận xét:**

> *"Việc lựa chọn 24 biến là hợp lý và bao quát. Các biến phủ đầy đủ 5 lĩnh vực chính của tâm lý trị liệu: cảm xúc, nhận thức, hành vi, xã hội, và sinh lý. Đặc biệt, việc bao gồm `rumination` (suy nghĩ lặp lại tiêu cực) và `selfEfficacy` (niềm tin vào năng lực bản thân) cho thấy sự hiểu biết sâu về cơ chế CBT."*

> *"Tuy nhiên, mô hình thiếu 3 biến quan trọng: **(1) emotion regulation strategies** (chiến lược điều hòa cảm xúc cụ thể), **(2) sleep quality** (chất lượng giấc ngủ — predictor mạnh của trầm cảm), **(3) substance use** (sử dụng chất kích thích). Đây là thiếu sót cần bổ sung trong phiên bản tương lai."*

**Điểm: 8.5/10** — Bao quát tốt, cần bổ sung vài biến lâm sàng quan trọng.

---

#### B. Đánh giá công thức Emotional Black Hole (EBH)

$$EBH = 0.25 \cdot L_{norm} + 0.30 \cdot I_{neg} + 0.30 \cdot U_{norm} - 0.15 \cdot H$$

| Thành phần | Ý nghĩa lâm sàng | Trọng số | Đánh giá |
|-----------|-------------------|----------|----------|
| $L_{norm}$ — Vòng phản hồi dương | Chu kỳ cảm xúc tự cường hóa (VD: buồn → suy nghĩ → buồn hơn) | 0.25 | ✅ Phù hợp — rumination loops là cơ chế chính của trầm cảm (Nolen-Hoeksema, 2000) |
| $I_{neg}$ — Quán tính cảm xúc | Tính "dính" của cảm xúc tiêu cực (autocorrelation) | 0.30 | ✅ Phù hợp — emotional inertia dự báo depression (Kuppens et al., 2010) |
| $U_{norm}$ — Năng lượng thế | Tổng "áp lực" tâm lý | 0.30 | ✅ Sáng tạo — áp dụng Lyapunov energy vào tâm lý |
| $H$ — Hy vọng | Yếu tố bảo vệ | -0.15 | ⚠️ Trọng số too low — Hope Theory (Snyder, 2002) chỉ ra hope là predictor mạnh nhất của recovery |

**Nhận xét:**

> *"Công thức EBH là đóng góp khoa học đáng kể. Việc kết hợp 4 thành phần — vòng phản hồi, quán tính, năng lượng thế, và hy vọng — tạo ra chỉ số composite có cơ sở lý thuyết vững chắc. Tuy nhiên, trọng số $\delta = 0.15$ cho hy vọng quá thấp. Literature cho thấy hopelessness là predictor số 1 của suicide (Beck et al., 1985). Khuyến nghị tăng $\delta$ lên 0.20-0.25."*

**Điểm: 8.0/10** — Công thức sáng tạo, cần điều chỉnh trọng số hope.

---

#### C. Đánh giá hệ thống phân vùng nguy cơ (Zone Classification)

| Vùng | Ngưỡng EBH | Đánh giá lâm sàng |
|------|------------|-------------------|
| Safe | < 0.20 | ✅ Phù hợp |
| Caution | 0.20–0.40 | ✅ Hợp lý — tương đương "mild" trên DASS-21 |
| Risk | 0.40–0.60 | ✅ Tương đương "moderate-severe" DASS-21 |
| Critical | 0.60–0.80 | ✅ Tương đương "extremely severe" DASS-21 |
| Black Hole | ≥ 0.80 | ✅ Cần can thiệp khẩn cấp — phù hợp suicide risk literature |

**Điểm: 9.0/10** — Phân vùng tốt, có cơ sở lâm sàng rõ ràng.

---

### 📋 PHẢN BIỆN 2 — PGS.TS. Lê Hoàng Nam (Tâm lý Toán học)

#### A. Đánh giá nền tảng toán học (Mathematical Framework)

**1. Hàm Năng lượng thế (Potential Energy Function)**

$$U(S) = \frac{1}{2} S^T W S$$

Với ma trận trọng số W (đường chéo):

| Biến | $w_i$ | Ý nghĩa |
|------|-------|---------|
| hopelessness | **1.5** | Yếu tố gây mất ổn định mạnh nhất |
| rumination | 1.4 | Suy nghĩ vòng lặp phá vỡ ổn định |
| anxiety | 1.3 | Trạng thái đe dọa cao |
| stress | 1.2 | Áp lực tổng quát |
| hope | **-1.4** | Yếu tố ổn định mạnh nhất |
| selfWorth | -1.2 | Tự giá trị bảo vệ |
| calmness | -1.0 | Trạng thái bình ổn |

**Nhận xét:**

> *"Việc áp dụng Lyapunov stability theory vào tâm lý học là **cách tiếp cận rất sáng tạo**. Hàm $U(S)$ đóng vai trò Lyapunov function, cho phép phân tích ổn định topology tâm lý. Gradient $F = -\nabla U = -WS$ mô tả hướng "chảy" tự nhiên của trạng thái tâm lý — hệ thống tự động tìm kiếm trạng thái cân bằng."*

> *"**Hạn chế chính**: Ma trận W là đường chéo → giả định các chiều cảm xúc đóng góp năng lượng **độc lập**. Thực tế, stress × anxiety có tương tác phi tuyến (interaction effect). Đề xuất mở rộng sang W đầy đủ (full matrix) hoặc thêm term bậc cao: $U(S) = \frac{1}{2}S^TWS + \frac{1}{4}\sum_{ijk} C_{ijk}S_iS_jS_k$"*

**Điểm: 8.5/10** — Nền tảng toán vững, cần mở rộng phi tuyến.

**2. Ma trận Tương tác A (24×24 Interaction Matrix)**

Học bằng Ridge Regression:

$$A^* = \arg\min_A ||S(t+1) - A \cdot S(t)||^2_F + \lambda ||A||^2_F$$

$$A = (X^TX + \lambda I)^{-1} X^T Y, \quad \lambda = 0.05$$

| Tương tác chính | Hệ số | Ý nghĩa lâm sàng |
|-----------------|-------|-------------------|
| stress → anxiety | 0.60 | Stress kích hoạt lo âu (validated) |
| anxiety → rumination | 0.55 | Lo âu dẫn đến suy nghĩ xoáy vòng |
| sadness → hopelessness | 0.50 | Buồn kéo dài → tuyệt vọng |
| rumination → stress | 0.50 | Vòng phản hồi: suy nghĩ → stress |
| hope → motivation | 0.50 | Hy vọng thúc đẩy hành động |
| calmness → anxiety | -0.45 | Bình tĩnh đối lập lo âu |
| Self-persistence (diagonal) | 0.85 | 85% quán tính cảm xúc |

**Nhận xét:**

> *"Ma trận tương tác mặc định phản ánh đúng các pathway tâm lý được thiết lập trong literature (stress-anxiety cascade, rumination loop, hope-motivation pathway). Hệ số 0.85 trên đường chéo thể hiện emotional inertia hợp lý — phù hợp với nghiên cứu của Kuppens et al. (2010) cho thấy cảm xúc có autocorrelation lag-1 khoảng 0.80-0.90."*

> *"Việc cá nhân hóa ma trận A thông qua ridge regression là điểm mạnh lớn — cho phép hệ thống **học pattern riêng** của từng user. Tuy nhiên, cần tối thiểu 5 messages, và chất lượng ước lượng phụ thuộc vào quality của emotion extraction. Đề xuất: thêm Bayesian prior từ population matrix thay vì chỉ dùng Lambda penalty."*

**Điểm: 8.0/10** — Phương pháp tốt, có thể cải thiện bằng Bayesian approach.

**3. Phân tích Ổn định Phổ (Spectral Stability Analysis)**

$$\lambda_{max}(A) = \text{dominant eigenvalue via power iteration (50 iterations)}$$

- $|\lambda_{max}| < 1$: Hệ ổn định (trajectory converge đến fixed point)
- $|\lambda_{max}| > 1$: Hệ mất ổn định (trajectory diverge)
- $|\lambda_{max}| \approx 1$: Critical slowing down — cảnh báo sớm bifurcation

**Nhận xét:**

> *"Phân tích spectral radius là phương pháp chuẩn trong dynamical systems theory. Áp dụng vào tâm lý là **chưa từng thấy** trong literature tâm lý học tính toán. Đây là đóng góp gốc (novel contribution). Power iteration 50 bước là đủ cho ma trận 24×24 — convergence thường xảy ra trước 30 bước."*

**Điểm: 9.5/10** — Đóng góp gốc, phương pháp đúng chuẩn.

**4. Phát hiện Vòng phản hồi (Feedback Loop Detection)**

DFS-based cycle detection trên weighted directed graph:
- Edge threshold: $|w_{ij}| > 0.15$
- Max loop length: 5
- Classification: positive loops (amplifying) vs negative loops (damping)

**Nhận xét:**

> *"Phát hiện feedback loop là tính năng có giá trị lâm sàng cao. Vòng lặp dương (VD: sadness → rumination → hopelessness → sadness) là cơ chế cốt lõi của rối loạn trầm cảm (Borsboom, 2017 — Network Theory of Mental Disorders). Hệ thống tự động phát hiện các vòng này → giúp chuyên gia nhận diện cơ chế bệnh lý."*

**Điểm: 9.0/10** — Phù hợp Network Theory of Psychopathology.

**5. Lý thuyết Hố đen Cảm xúc (Emotional Black Hole Theory)**

Phát hiện bifurcation qua Critical Slowing Down (CSD):

$$\text{CSD Index} = w_1 \cdot \Delta\sigma^2 + w_2 \cdot \Delta\rho_{lag1} + w_3 \cdot \text{flickering}$$

| Chỉ báo | Ngưỡng | Ý nghĩa |
|---------|--------|---------|
| Variance trend ($\Delta\sigma^2$) | > 0.01/5-window | Hệ mất ổn định |
| Autocorrelation trend ($\Delta\rho$) | > 0.6 | Critical slowing down |
| Flickering ($\Delta EBH > 0.15 \times 3$) | 3+ bước liên tiếp | Dao động giữa các attractor |
| Composite CSD | > 0.6 | Bifurcation sắp xảy ra |

**Nhận xét:**

> *"Áp dụng Critical Slowing Down — lý thuyết từ hệ sinh thái (Scheffer et al., 2009) — vào phát hiện sớm khủng hoảng tâm lý là **ý tưởng đột phá**. CSD indicators (variance increase + autocorrelation increase) đã được chứng minh có thể phát hiện regime shifts trước khi chúng xảy ra. Nếu validated empirically, đây sẽ là công cụ cảnh báo sớm (early warning) có ý nghĩa lâm sàng lớn."*

> *"Hạn chế: CSD cần chuỗi dữ liệu đủ dài (tối thiểu 20-30 data points) để ước lượng reliable. Với frequency 1-3 messages/ngày, cần 10-15 ngày dữ liệu trước khi CSD hoạt động tốt."*

**Điểm: 9.0/10** — Đóng góp gốc ứng dụng CSD vào tâm lý, cần validation.

---

### 📋 ỦY VIÊN 1 — PGS.TS. Phạm Thị Lan Anh (Tâm lý Phát triển & Phòng ngừa)

#### Đánh giá Hệ thống Dự báo (Forecast Engine)

**Holt's Double Exponential Smoothing:**

$$L_t = 0.3 \cdot y_t + 0.7 \cdot (L_{t-1} + T_{t-1})$$
$$T_t = 0.1 \cdot (L_t - L_{t-1}) + 0.9 \cdot T_{t-1}$$
$$\hat{y}_{t+h} = L_t + h \cdot T_t$$

| Tầm dự báo | Bước | Tương đương | Ngưỡng cảnh báo |
|-------------|------|-------------|------------------|
| 1 ngày | 3 steps | ~3 tin nhắn | P(risk) > 0.30 |
| 3 ngày | 9 steps | ~9 tin nhắn | P(risk) > 0.25 |
| 7 ngày | 21 steps | ~21 tin nhắn | P(risk) > 0.20 |

**Nhận xét:**

> *"Sử dụng Holt's method là lựa chọn phù hợp cho time series cảm xúc — nó nắm bắt cả level và trend. Tham số $\alpha = 0.3$ (moderate smoothing) và $\beta = 0.1$ (conservative trend) là hợp lý cho dữ liệu cảm xúc vốn có noise cao."*

> *"**Quan ngại**: Giả định Gaussian residuals cho P(risk) có thể dẫn đến **underestimation** tần suất khủng hoảng. Phân phối EBH thực tế có heavy tails (extreme events thường xuyên hơn normal distribution dự đoán). Đề xuất: dùng Student-t distribution hoặc bootstrapped confidence intervals."*

> *"**Điểm mạnh phòng ngừa**: Việc hạ ngưỡng cảnh báo khi horizon xa hơn (0.30 → 0.25 → 0.20) thể hiện nguyên tắc phòng ngừa (precautionary principle) — chấp nhận false alarm rate cao hơn để không bỏ lỡ khủng hoảng thực."*

**Điểm: 7.5/10** — Phương pháp đúng, cần cải thiện distributional assumption.

---

### 📋 ỦY VIÊN 2 — PGS.TS. Đặng Quốc Việt (Hệ thống Động lực học & AI)

#### Đánh giá Topology Mapper & Attractor Landscape

**Newton-Raphson Fixed-Point Detection:**

$$F(S^*) = (A - I) \cdot S^* = 0$$

- Tìm tối đa 15 fixed points từ nhiều initial conditions
- Classification bằng Jacobian eigenvalues:
  - Stable attractor: tất cả $|\lambda_i| < 1$
  - Unstable repeller: bất kỳ $|\lambda_i| > 1$
  - Saddle point: mixed eigenvalues

**5 Archetype Attractors:**

| Archetype | S* đặc trưng | Profile |
|-----------|-------------|---------|
| Depression | sadness≈0.7, hopelessness≈0.8, hope≈0.1 | fragile |
| Burnout | stress≈0.8, fatigue≈0.9, motivation≈0.2 | stuck |
| Anxiety Spiral | anxiety≈0.9, rumination≈0.85, avoidance≈0.7 | chaotic |
| Disengagement | motivation≈0.1, socialEngagement≈0.1 | stuck |
| Growth | negatives≈0.05, positives≈0.8 | resilient |

**5 Topology Profiles:**

| Profile | Mô tả | Chiến lược can thiệp |
|---------|--------|----------------------|
| **Fragile** | 1 attractor sâu tiêu cực, yếu tích cực | Xây dựng cấu trúc hỗ trợ bên ngoài |
| **Chaotic** | Nhiều unstable points, quỹ đạo hỗn loạn | Ổn định/grounding trước |
| **Stuck** | Attractor ổn định nhưng không tối ưu, inertia cao | Reframing nhận thức để phá vỡ |
| **Resilient** | Attractor tích cực mạnh | Duy trì & củng cố |
| **Transitional** | Giữa các basin, high-leverage moment | Hỗ trợ targeted (nỗ lực nhỏ → hiệu quả lớn) |

**Nhận xét:**

> *"Topology mapping là thành phần **đầy tham vọng và sáng tạo nhất** của hệ thống. Áp dụng bifurcation theory và attractor landscape vào tâm lý lâm sàng là frontier research — cùng hướng với các công trình của Guastello & Gregson (2011, Nonlinear Dynamical Systems Analysis for the Behavioral Sciences) nhưng **đi xa hơn** bằng cách triển khai thành hệ thống tính toán tự động."*

> *"**Ưu điểm lớn**: 5 topology profiles (fragile, chaotic, stuck, resilient, transitional) cho phép **cá nhân hóa chiến lược can thiệp** — đây là bước tiến so với 'one-size-fits-all' approach."*

> *"**Quan ngại**: Newton-Raphson trên hệ 24 chiều có thể hội tụ đến local minima; hệ thực tế có thể có limit cycles (periodic attractors) mà Newton-Raphson không tìm được. Đề xuất bổ sung: continuation methods (AUTO-07P style) hoặc Poincaré sections."*

**Điểm: 9.0/10** — Frontier research, triển khai ấn tượng.

---

### 📋 ỦY VIÊN 3 — PGS.TS. Vũ Thị Mai (Đo lường Tâm lý & Tâm trắc học)

#### Đánh giá Hệ thống Trích xuất Cảm xúc (Emotion Extraction)

**Pipeline:**
1. Primary: GPT-4o-mini ($T = 0.2$, structured JSON output)
2. Fallback: Vietnamese keyword matching (24 pattern dictionaries)
3. Confidence: GPT ~0.7-0.9, Rule-based ~0.4

**Nhận xét:**

> *"Đây là điểm **yếu nhất** của hệ thống từ góc độ tâm trắc học. Toàn bộ hàm năng lượng, ma trận tương tác, và EBH đều phụ thuộc vào **quality of emotion extraction**. Nhưng hiện tại không có validation study nào cho GPT-4o-mini extraction accuracy."*

> *"**Các vấn đề cụ thể:**"*
> - *"**Construct validity** chưa được chứng minh: GPT output 24 scores → nhưng chúng có thực sự đo đúng 24 constructs không?"*
> - *"**Test-retest reliability**: Cùng một message, GPT có cho kết quả nhất quán không? $T = 0.2$ giúp giảm variance nhưng không đảm bảo."*
> - *"**Vietnamese linguistic nuances**: 'Mệt quá' có thể là physical fatigue hoặc emotional exhaustion — context-dependent."*
> - *"**Social desirability bias**: Users có thể underreport negative emotions → hệ thống blind spot."*

> *"**Đề xuất cấp bách:** (1) Validation study so sánh GPT extraction với expert clinical ratings trên 200+ Vietnamese conversations; (2) Inter-rater reliability giữa GPT và 3 clinical psychologists; (3) Concurrent validity với DASS-21 scores."*

**Điểm: 6.5/10** — Thiếu validation empirical nghiêm trọng. Đây là bottleneck accuracy.

---

#### Đánh giá Tích hợp DASS-21

**Ánh xạ DASS-21 → 24D:**

$$S_{blend}[i] = (1 - w) \cdot S_{text}[i] + w \cdot S_{DASS}[i]$$

$$w = 0.40 - 0.05 \times \text{age\_days}, \quad w \in [0, 0.40]$$

| Subscale | Biến PGE chính | Hệ số mapping | Đánh giá |
|----------|--------------|---------------|----------|
| Depression → sadness | 0.90 | ✅ Trực tiếp, phù hợp |
| Depression → hopelessness | 0.85 | ✅ Core construct |
| Depression → ↓joy | $\max(0, 0.6 - d \times 0.6)$ | ✅ Anhedonia validated |
| Anxiety → anxiety | 0.90 | ✅ Trực tiếp |
| Anxiety → fearOfJudgment | 0.60 | ⚠️ DASS-21 Anxiety ≠ Social Anxiety — overlap nhưng không đồng nhất |
| Stress → mentalFatigue | 0.70 | ✅ Validated pathway |
| Depression → ↓motivation | $\max(0, 0.6 - d \times 0.55)$ | ✅ Psychomotor retardation |

**Nhận xét:**

> *"DASS-21 integration là **thành công đáng kể**. Weight decay ($-5\%$/ngày) và recency limit (7 ngày) thể hiện hiểu biết rằng test scores 'stale' nhanh. Blend weight $w = 0.40$ ở thời điểm tươi cho DASS-21 ảnh hưởng moderate — phù hợp vì text extraction real-time quan trọng hơn snapshot test."*

> *"**Quan ngại**: fearOfJudgment mapping từ DASS-21 Anxiety subscale là inexact — DASS-21 Anxiety đo physiological arousal (VD: trembling, dry mouth), không phải social anxiety. Đề xuất: thêm Liebowitz Social Anxiety Scale hoặc SPIN nếu muốn đo chính xác fear of judgment."*

**Điểm: 8.0/10** — Integration tốt, vài mapping cần tinh chỉnh.

---

### 📋 ỦY VIÊN 4 — PGS.TS. Hoàng Đức Thắng (Tâm lý Thần kinh & Cảm xúc)

#### Đánh giá Emotional Inertia & Quán tính Cảm xúc

**Công thức:**

$$I_i = \text{corr}(s_i(t), s_i(t-1))$$

$$I_{neg} = \text{mean}(I_{stress}, I_{anxiety}, I_{sadness}, I_{anger}, I_{loneliness}, I_{shame}, I_{guilt}, I_{hopelessness})$$

**Nhận xét:**

> *"Emotional inertia là construct đã được validated extensively (Kuppens et al., 2010; Houben et al., 2015). Lag-1 autocorrelation là gold standard measure. Hệ thống áp dụng đúng."*

> *"**Nhận xét nâng cao**: Nên phân biệt giữa inertia (autocorrelation) và variability (standard deviation). Hai người có cùng inertia nhưng khác variability có profile tâm lý rất khác: (A) high inertia + low variability = stable negative (chronic depression); (B) high inertia + high variability = volatile swings (bipolar-like). Hệ thống hiện chỉ dùng inertia, chưa exploit variability đầy đủ."*

**Điểm: 8.5/10** — Áp dụng đúng, cần thêm variability measure.

---

#### Đánh giá Resilience Engine

**6 Growth Phases:**

```
decline → stagnation → early_growth → acceleration → consolidation → mastery
```

**Resilience Index:**

| Thành phần | Công thức | Ý nghĩa |
|-----------|---------|---------|
| Bounce-Back Rate | $\frac{1}{\text{recovery\_time}}$ trung bình | Tốc độ phục hồi sau peak EBH |
| Growth Velocity | $-\text{slope}(\text{EBH}_{\text{recent}})$ | Xu hướng cải thiện |
| Stability Index | $1 - \min(1, \sigma^2_{\text{recent}} / 0.1)$ | Ổn định (low variance) |
| Protective Strength | Mean strength of protective factors | Yếu tố bảo vệ |

**Relapse Probability:**

$$P(\text{relapse}) = (1 - \text{resilience}) \times (1 + \Delta\sigma^2) \times (1 + \rho_{lag1}) \times \text{zoneBoost}$$

**Nhận xét:**

> *"Growth phases capture quá trình recovery tâm lý rất tốt — phù hợp với Transtheoretical Model of Change (Prochaska & DiClemente, 1983). Đặc biệt, consolidation phase (EBH < 0.3 AND variance < 0.02) thể hiện đúng khái niệm 'maintenance' trong SCT."*

> *"Relapse probability formula là multiplicative — cho phép các yếu tố rủi ro **cộng hưởng** (compounding risk). Đây là phù hợp sinh lý thần kinh hơn additive model."*

> *"**Quan ngại**: Không có protective factor đặc thù cho bối cảnh Vietnamese — gia đình, tín ngưỡng, cộng đồng. Đề xuất bổ sung cultural-specific protective factors."*

**Điểm: 8.0/10** — Framework vững, cần cultural adaptation.

---

### 📋 ỦY VIÊN 5 — PGS.TS. Bùi Thị Thanh Hà (Tâm lý Xã hội & Văn hóa Việt Nam)

#### Đánh giá Tính phù hợp Văn hóa Việt Nam

**Hệ thống đã Việt hóa:**
- ✅ Keyword extraction bằng tiếng Việt (24 bộ pattern)
- ✅ Phát hiện khủng hoảng: "tự tử", "tự sát", "không muốn sống", "chết đi"...
- ✅ Hotline Việt Nam: 1900 599 958, 113, 115
- ✅ PII removal cho tên Việt Nam, CMND/CCCD, SĐT Việt Nam
- ✅ Nhãn cohort tiếng Việt: "Khủng hoảng", "Dễ tổn thương", "Ổn định", "Phát triển"

**Nhận xét:**

> *"Việc Việt hóa là **rất tích cực** — hầu hết các ứng dụng tâm lý AI quốc tế không hỗ trợ tiếng Việt. SoulFriend là **một trong những hệ thống đầu tiên** triển khai NLP tâm lý bằng tiếng Việt."*

> *"**Tuy nhiên, có các thiếu sót văn hóa quan trọng:**"*

> 1. *"**Collectivism vs Individualism**: Tâm lý Việt Nam thiên về collectivist — gia đình, cộng đồng ảnh hưởng mạnh hơn self-efficacy cá nhân. Mô hình hiện tại gán selfEfficacy weight cao (-1.1 trong W) — có thể cần giảm cho population Việt Nam và tăng perceivedSupport."*

> 2. *"**Face (thể diện)**: Khái niệm 'thể diện' (loss of face) là stressor đặc thù châu Á — liên quan đến shame và fearOfJudgment nhưng mạnh hơn nhiều so với Western context. Model hiện tại underweight shame (W = 0.6)."*

> 3. *"**Somatization**: Người Việt thường biểu đạt distress qua triệu chứng cơ thể ('đau đầu', 'mệt mỏi', 'khó ngủ') thay vì cảm xúc ('buồn', 'lo'). Emotion extractor cần thêm somatic keyword patterns."*

> 4. *"**Filial piety ('hiếu')**: Không có biến nào capture áp lực báo hiếu — nguồn stress cultural-specific đáng kể."*

> 5. *"**Mental health stigma**: Người Việt có xu hướng underreport severe symptoms do stigma. Model cần adjust sensitivity cho population này."*

**Điểm: 7.0/10** — Việt hóa tốt về ngôn ngữ, cần sâu hơn về tâm lý văn hóa.

---

### 📋 ỦY VIÊN 6 — PGS.TS. Ngô Minh Tuấn (Khoa học Dữ liệu & ML)

#### Đánh giá Thompson Sampling & Contextual Bandits

**Algorithm:**

$$\theta_i \sim \text{Beta}(\alpha_0 + \text{successes}_i, \beta_0 + \text{failures}_i)$$

$$\text{UCB}_i = \bar{x}_i + 1.5 \sqrt{\frac{\ln N}{n_i}}$$

$$\text{Score}_i = 0.7 \cdot \theta_i + 0.3 \cdot \text{UCB}_i$$

| Tham số | Giá trị | Đánh giá |
|---------|---------|----------|
| Prior | Beta(1,1) = Uniform | ✅ Non-informative prior phù hợp |
| UCB constant $c$ | 1.5 | ✅ Cân bằng exploration/exploitation |
| Thompson weight | 0.70 | ✅ Ưu tiên exploitation (quan trọng trong clinical setting) |
| Success threshold | 0.25 effectiveness | ⚠️ Có thể quá thấp — "25% improvement" có clinically significant không? |
| Min observations | 15 | ✅ Hợp lý cho warm-up |

**Nhận xét:**

> *"Thompson Sampling là state-of-the-art cho online decision-making. Việc kết hợp Thompson + UCB là hybrid approach tốt — Thompson chống cold-start vấn đề, UCB đảm bảo exploration ở long tail."*

> *"**Context features** (topology_profile × zone × ebh_level) tạo ra ~75 contexts (5×5×3). Với 4 arms và 75 contexts, cần ~1,125 observations cho convergence (15 per context). Điều này realistic cho ứng dụng có user base trung bình."*

> *"**Vấn đề reward definition**: effectiveness ≥ 0.25 = success. Trong clinical psychology, 'clinically significant change' thường đòi hỏi Reliable Change Index (Jacobson & Truax, 1991). Đề xuất: RCI-based success criterion thay vì fixed threshold."*

**Điểm: 8.5/10** — Thuật toán SOTA, cần refine reward definition.

---

#### Đánh giá SPSI (Social Psychological Stress Index)

**Công thức:**

$$\text{SPSI} = 0.25S + 0.20A + 0.15R + 0.15L + 0.10H + 0.10Sa - 0.15Ho - 0.08PS - 0.07G$$

| Alert Level | Ngưỡng | Ý nghĩa |
|-------------|--------|---------|
| none | < 0.50 | Không có stress đáng kể |
| watch | 0.50–0.70 | Theo dõi |
| warning | 0.70–0.85 | Cần can thiệp |
| critical | ≥ 0.85 | Nguy cơ cao |

**Research Hypotheses:**
- H1: $r(\text{SPSI}, \text{DASS}_{stress}) > 0.5$
- H2: $\text{AUC}(\text{SPSI} \to \text{crisis within 7 days}) > 0.75$

**Nhận xét:**

> *"SPSI là chỉ số composite hữu ích cho nghiên cứu population-level. Trọng số được thiết kế hợp lý — stress (0.25) và anxiety (0.20) chiếm 45% tổng, phù hợp vì chúng là predictors mạnh nhất."*

> *"**Quan ngại**: Trọng số hiện tại là expert-assigned, chưa được validated empirically. Đề xuất: (1) Calibrate weights bằng logistic regression trên DASS+SPSI data; (2) Cross-validate trên held-out sample; (3) Compare với equal-weighted version (null model)."*

> *"14-day trend analysis bằng linear regression là phương pháp đơn giản nhưng hiệu quả cho monotonic trends. Tuy nhiên, non-linear trends (U-shaped recovery, cyclical) sẽ bị miss. Đề xuất: thêm polynomial/spline fitting."*

**Điểm: 7.5/10** — Promising research index, cần empirical calibration.

---

#### Đánh giá PDD (Psychological Dynamics Dataset)

**5-Layer Architecture:**

```
Layer 1: Consent Gate (GDPR/IRB compliant)
Layer 2: Anonymization (SHA256 hash, PII removal)
Layer 3: Quality Assessment (completeness, validity, reliability, freshness)
Layer 4: Event Logging (6 event types)
Layer 5: Aggregation (daily/weekly/monthly snapshots)
```

**Nhận xét:**

> *"PDD pipeline là **exemplary research data infrastructure**. Consent-gated logging, GDPR compliance, anonymization, và data quality assessment — đây là các tiêu chuẩn mà nhiều nghiên cứu tâm lý số chưa đạt được."*

> *"**Điểm mạnh đặc biệt**: (1) SHA256 hashing không thể đảo ngược; (2) Vietnamese PII detection (tên, CMND, SĐT); (3) Quality scoring per-event → cho phép filter low-quality data; (4) 5-year TTL phù hợp longitudinal research."*

> *"**Đề xuất**: Thêm differential privacy (ε-noise) ngoài anonymization — quan trọng nếu dataset sẽ được shared với external researchers."*

**Điểm: 9.0/10** — Research infrastructure xuất sắc.

---

### 📋 ỦY VIÊN 7 — PGS.TS. Đinh Thị Phương Thảo (Đạo đức Nghiên cứu)

#### Đánh giá Đạo đức & An toàn

**Crisis Detection System:**

| Priority | Keywords | Risk Level | Confidence |
|----------|----------|-----------|------------|
| 1 — Suicidality | "tự tử", "tự sát", "không muốn sống", "chết đi", "kết thúc cuộc đời" | CRITICAL | 0.95 |
| 2 — Severe Distress | "trầm cảm nặng", "tuyệt vọng", "muốn biến mất" | HIGH | 0.85 |

**Safety Mechanisms:**
- ✅ Hotline Việt Nam: 1900 599 958 (24/7), 113 (cảnh sát), 115 (y tế)
- ✅ HITL (Human-in-the-Loop) ở mức CRITICAL/EXTREME
- ✅ Rate limiting: 20 msg/phút (prevent floods)
- ✅ Expert monitoring real-time qua WebSocket
- ✅ Risk scoring multi-source (6 sources, weighted fusion)
- ✅ Research consent model (GDPR/IRB compliant)

**Nhận xét:**

> *"Hệ thống an toàn là **tốt hơn đáng kể** so với hầu hết chatbot tâm lý AI trên thị trường. 47/47 accuracy rate cho crisis detection là exceptional."*

> *"**Các khuyến nghị đạo đức:**"*

> 1. *"**Informed consent for AI therapy**: Cần thông báo rõ ràng rằng đây là AI, không phải chuyên gia tâm lý con người. Hiện tại chưa thấy disclaimer rõ ràng trong chatbot flow."*

> 2. *"**Mandatory escalation protocol**: Khi EBH > 0.80, hệ thống hiện chỉ provide hotline numbers. Đề xuất: **tự động gửi alert** cho cơ sở y tế gần nhất hoặc emergency contact đã đăng ký."*

> 3. *"**Right to human therapist**: Phải luôn có option để user yêu cầu nói chuyện với chuyên gia thật, không bị locked trong AI loop."*

> 4. *"**Data retention**: 3-year TTL cho SPSI records, 5-year cho research events — cần informed consent cụ thể cho từng duration."*

> 5. *"**Withdrawal mechanism**: ResearchConsent model có withdrawDate — tốt. Nhưng cần đảm bảo withdrawal là **fully reversible** và xóa toàn bộ dữ liệu, không chỉ ngừng thu thập."*

> 6. *"**Age verification**: Không thấy kiểm tra tuổi. Nếu users < 18 → cần parent consent theo luật bảo vệ trẻ em."*

**Điểm: 7.5/10** — Safety tốt, cần bổ sung nhiều safeguard đạo đức.

---

### 📋 CHỦ TỊCH HĐ — PGS.TS. Nguyễn Văn Minh (Tâm lý Lâm sàng)

#### Đánh giá Tổng thể & Tính Mới

**Nhận xét tổng quát:**

> *"SoulFriend/PGE là hệ thống **tham vọng nhất** mà tôi đã review trong lĩnh vực AI tâm lý. Với 102,000+ LOC, 21 PGE services, 14 phases, và 450 test cases, đây là một **công trình kỹ thuật đáng kể**."*

> *"Hệ thống không chỉ là chatbot — nó là một **framework lý thuyết mới** áp dụng dynamical systems theory vào tâm lý lâm sàng. Ý tưởng cốt lõi — rằng trạng thái tâm lý con người có thể được mô hình hóa như quỹ đạo trong không gian 24 chiều, với attractors, basins, và bifurcations — là **đóng góp gốc có tính đột phá**."*

---

## IV. ĐÁNH GIÁ TỔNG HỢP — 8 TIÊU CHÍ

### 4.1 Tính Khoa học (Scientific Rigor)

| Tiêu chí | Điểm | Nhận xét |
|----------|------|----------|
| Cơ sở lý thuyết | **9.0**/10 | Lyapunov stability, dynamical systems, CSD theory — vững chắc |
| Đúng đắn toán học | **8.5**/10 | Ridge regression, eigenvalue analysis, Newton-Raphson — chính xác |
| Tham chiếu literature | **8.0**/10 | Beck (1979), Kuppens (2010), Scheffer (2009), Nolen-Hoeksema (2000) |
| Validation | **5.5**/10 | ⚠️ **Điểm yếu lớn nhất** — thiếu prospective validation study |
| Reproducibility | **7.5**/10 | Code quality tốt, nhưng thiếu published dataset |
| **Trung bình** | **7.7**/10 | |

### 4.2 Tính Mới (Novelty)

| Tiêu chí | Điểm | Nhận xét |
|----------|------|----------|
| Mô hình 24D state space cho tâm lý | **9.5**/10 | Chưa có hệ thống nào triển khai scale này |
| CSD early warning cho crisis tâm lý | **9.0**/10 | Adaptation từ ecology → psychology là novel |
| Topology profiling (fragile/chaotic/stuck/resilient/transitional) | **9.0**/10 | Phân loại mới, có utility lâm sàng |
| EBH (Emotional Black Hole) concept | **8.5**/10 | Metaphor hấp dẫn, formalization tốt |
| SPSI index | **7.5**/10 | Composite index — novel nhưng cần validation |
| PDD research pipeline | **8.0**/10 | Infrastructure research tốt, không hoàn toàn novel |
| Thompson Sampling cho intervention | **7.5**/10 | Áp dụng existing algorithm vào new domain |
| Tiếng Việt NLP cho tâm lý | **8.5**/10 | Rất ít hệ thống tương tự tồn tại |
| **Trung bình** | **8.4**/10 | |

### 4.3 Tính Ứng dụng (Practical Applicability)

| Tiêu chí | Điểm | Nhận xét |
|----------|------|----------|
| Khả năng triển khai thực tế | **8.0**/10 | Full-stack app, deployable on Render/Vercel |
| Expert dashboard | **8.5**/10 | Real-time monitoring, WebSocket alerts |
| Crisis safety | **8.5**/10 | 47/47 accuracy, đa tầng safety |
| Scalability | **7.0**/10 | Single-server, MAX_USERS = 500 |
| Performance | **7.5**/10 | 5-min cache TTL, lazy computation |
| UX/Accessibility | **7.0**/10 | Chatbot interface, thiếu accessibility features |
| **Trung bình** | **7.8**/10 | |

### 4.4 Chất lượng Kỹ thuật (Technical Quality)

| Tiêu chí | Điểm | Nhận xét |
|----------|------|----------|
| Code architecture | **9.0**/10 | Clean separation: models, services, routes, orchestrator |
| Test coverage | **8.0**/10 | 450 tests, 16/16 suites — nhưng thiếu integration tests end-to-end |
| TypeScript type safety | **8.5**/10 | tsc --noEmit clean, proper interfaces |
| Error handling | **8.0**/10 | Graceful fallbacks, circuit breakers |
| Documentation | **7.0**/10 | In-code comments tốt, thiếu API docs formal |
| **Trung bình** | **8.1**/10 | |

### 4.5 Đạo đức & An toàn (Ethics & Safety)

| Tiêu chí | Điểm | Nhận xét |
|----------|------|----------|
| Crisis detection | **9.0**/10 | Critical + High detection cho Vietnamese |
| HITL escalation | **8.5**/10 | Expert review at CRITICAL level |
| Data privacy | **8.0**/10 | SHA256 anonymization, GDPR model |
| Informed consent | **6.5**/10 | ⚠️ Thiếu AI disclaimer, age verification |
| Cultural sensitivity | **7.0**/10 | Vietnamese language tốt, cultural depth chưa đủ |
| **Trung bình** | **7.8**/10 | |

---

## V. TỔNG ĐIỂM HỘI ĐỒNG

| Thành viên | Lĩnh vực đánh giá | Điểm |
|------------|-------------------|------|
| PGS.TS. Trần Thị Hương | Mô hình CBT & EBH | **8.2**/10 |
| PGS.TS. Lê Hoàng Nam | Toán học & Dynamical Systems | **8.8**/10 |
| PGS.TS. Phạm Thị Lan Anh | Dự báo & Phòng ngừa | **7.5**/10 |
| PGS.TS. Đặng Quốc Việt | Topology & Attractor Analysis | **9.0**/10 |
| PGS.TS. Vũ Thị Mai | Đo lường & Tâm trắc học | **7.3**/10 |
| PGS.TS. Hoàng Đức Thắng | Thần kinh & Cảm xúc | **8.3**/10 |
| PGS.TS. Bùi Thị Thanh Hà | Văn hóa Việt Nam | **7.0**/10 |
| PGS.TS. Ngô Minh Tuấn | ML & Khoa học Dữ liệu | **8.3**/10 |
| PGS.TS. Đinh Thị Phương Thảo | Đạo đức Nghiên cứu | **7.5**/10 |
| PGS.TS. Nguyễn Văn Minh | Tổng thể & Tính mới | **8.5**/10 |

### **ĐIỂM TRUNG BÌNH HỘI ĐỒNG: 8.04/10**

### **XẾP LOẠI: XUẤT SẮC** (≥ 8.0)

---

## VI. KẾT LUẬN & KIẾN NGHỊ CỦA HỘI ĐỒNG

### 6.1 Kết luận

Hội đồng **nhất trí đánh giá** SoulFriend/PGE là một công trình nghiên cứu ứng dụng **có chất lượng khoa học cao**, **có tính mới đáng kể**, và **có tiềm năng ứng dụng thực tiễn lớn** trong lĩnh vực sức khỏe tâm thần số (Digital Mental Health) tại Việt Nam.

**Các đóng góp gốc (Original Contributions) nổi bật:**

1. **Psychological Gravity Engine (PGE)**: Mô hình hóa tâm lý con người bằng hệ động lực phi tuyến 24 chiều — **tiếp cận chưa từng có** trong literature tâm lý học tính toán
2. **Emotional Black Hole (EBH) Theory**: Khái niệm hóa khủng hoảng tâm lý như "hố đen" trong không gian cảm xúc — metaphor hấp dẫn và formalization toán học chặt chẽ
3. **CSD-based Early Warning**: Áp dụng Critical Slowing Down từ ecology vào phát hiện sớm bifurcation tâm lý — **đóng góp liên ngành sáng tạo**
4. **Topology Profiling**: 5 dạng topology tâm lý (fragile/chaotic/stuck/resilient/transitional) → cá nhân hóa can thiệp — **framework mới**
5. **Vietnamese NLP for Psychology**: Một trong những hệ thống đầu tiên triển khai trích xuất cảm xúc tiếng Việt ở quy mô này

### 6.2 Điểm yếu cần khắc phục (Bắt buộc trước khi triển khai lâm sàng)

| # | Vấn đề | Mức độ | Hướng khắc phục |
|---|--------|--------|-----------------|
| **W1** | **Thiếu prospective validation study** | 🔴 Critical | Cần nghiên cứu longitudinal 6-12 tháng, N ≥ 200, so sánh EBH predictions vs actual outcomes |
| **W2** | **Emotion extraction chưa validated** | 🔴 Critical | Inter-rater reliability study: GPT-4o-mini vs 3 clinical psychologists trên 200+ conversations tiếng Việt |
| **W3** | **Thiếu randomized controlled trial (RCT)** cho intervention | 🟡 High | RCT: PGE-guided interventions vs standard care, N ≥ 100, 3-6 tháng |
| **W4** | **Cultural adaptation chưa đủ sâu** | 🟡 High | Thêm somatic keywords, collectivist adjustment, filial piety variable |
| **W5** | **Informed consent cho AI therapy** | 🟡 High | Thêm clear disclaimer, age verification, right-to-human option |
| **W6** | **Gaussian assumption trong forecast** | 🟠 Medium | Chuyển sang Student-t distribution hoặc bootstrap CI |
| **W7** | **Linear dynamics assumption** | 🟠 Medium | Thêm nonlinear terms hoặc kernel-based interaction matrix |
| **W8** | **Scalability** | 🟠 Medium | Horizontal scaling, microservices architecture |

### 6.3 Kiến nghị phát triển

**Ngắn hạn (3-6 tháng):**
1. Validation study trên clinical sample Việt Nam (N ≥ 200)
2. Inter-rater reliability cho emotion extraction
3. Thêm AI disclaimer và age verification
4. Cultural adaptation workshop với chuyên gia Việt Nam

**Trung hạn (6-12 tháng):**
5. RCT cho intervention effectiveness
6. Cross-cultural validation (so sánh Vietnamese vs international population)
7. Thêm Student-t forecast distribution
8. Bayesian prior cho interaction matrix learning

**Dài hạn (12-24 tháng):**
9. Nonlinear dynamics extension (kernel methods)
10. Multi-modal input (voice, facial expression)
11. Integration với hệ thống y tế điện tử Việt Nam
12. IRB-approved publication trong peer-reviewed journal

### 6.4 Tiềm năng công bố

Hội đồng đánh giá hệ thống có tiềm năng công bố tại:

| Tạp chí / Hội nghị | Impact Factor | Khả năng |
|---------------------|---------------|----------|
| *Journal of Medical Internet Research (JMIR)* | 7.4 | ✅ Cao — nếu có validation study |
| *Computers in Human Behavior* | 9.0 | ✅ Cao — HCI angle |
| *Nature Digital Medicine* | 15.2 | ⚠️ Trung bình — cần RCT |
| *IEEE Transactions on Affective Computing* | 13.3 | ✅ Cao — technical contribution |
| *Frontiers in Psychiatry (Digital)* | 4.7 | ✅ Rất cao — phù hợp scope |
| *ACM CHI* | Top CS-HCI | ✅ Cao — novel system design |

---

## VII. BIÊN BẢN BIỂU QUYẾT

| Câu hỏi | Đồng ý | Không đồng ý | Ý kiến khác |
|---------|--------|-------------|-------------|
| Hệ thống có cơ sở khoa học vững chắc? | **9/10** | 0/10 | 1/10 (cần validation) |
| Hệ thống có tính mới? | **10/10** | 0/10 | 0/10 |
| Đề xuất tiếp tục phát triển? | **10/10** | 0/10 | 0/10 |
| Sẵn sàng triển khai lâm sàng? | 3/10 | **5/10** | 2/10 (cần validation trước) |
| Tiềm năng công bố quốc tế? | **8/10** | 0/10 | 2/10 (cần data) |

### Quyết định: **THÔNG QUA CÓ ĐIỀU KIỆN**

Hội đồng **nhất trí thông qua** đánh giá chất lượng khoa học và tính mới của hệ thống SoulFriend/PGE, với điều kiện:

1. ✅ **Đạt** tiêu chí tính mới (novelty) — *Đánh giá: 8.4/10*
2. ✅ **Đạt** tiêu chí chất lượng kỹ thuật — *Đánh giá: 8.1/10*
3. ⚠️ **Đạt có điều kiện** tiêu chí khoa học — *Cần prospective validation study (W1, W2)*
4. ⚠️ **Đạt có điều kiện** tiêu chí đạo đức — *Cần bổ sung safeguards (W5)*

---

**Chủ tịch Hội đồng Khoa học**

*PGS.TS. Nguyễn Văn Minh*  
*Ngày 09/03/2026*

---

> *Ghi chú: Đây là báo cáo đánh giá mô phỏng dựa trên phân tích mã nguồn. Để có đánh giá peer review chính thức, cần submit tại tạp chí/hội nghị khoa học thực sự với quy trình blind review. Các PGS.TS. trong báo cáo này là vai trò mô phỏng, không đại diện cho cá nhân thực.*
