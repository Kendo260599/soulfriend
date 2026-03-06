# BÁO CÁO CHI TIẾT ỨNG DỤNG SOULFRIEND V4.0

## Nền tảng chăm sóc sức khỏe tâm lý dành cho phụ nữ Việt Nam

| Thông tin | Chi tiết |
|---|---|
| **Phiên bản** | 4.0.0 |
| **Commit** | `4d5b09b` (274 commits) |
| **Repository** | github.com/Kendo260599/soulfriend.git |
| **Ngày báo cáo** | 06/03/2026 |

---

## I. TỔNG QUAN DỰ ÁN

| Chỉ số | Giá trị |
|---|---|
| Tổng dòng code backend | ~28,000 dòng (97 files TypeScript/JS) |
| Tổng dòng code frontend | ~41,000 dòng (118 files TSX/TS/CSS) |
| Components React | 65 files |
| Services frontend | 30 files |
| Services backend | 25 files |
| Database models | 15 files |
| API routes | 19 files |
| Middleware | 9 files |
| CI/CD workflows | 5 files |

---

## II. HẠ TẦNG KỸ THUẬT

### A. BACKEND STACK

| Công nghệ | Version | Vai trò |
|---|---|---|
| Node.js | 20.x | Runtime |
| Express | 5.1.0 | Web framework |
| TypeScript | 5.9.2 | Type safety |
| Mongoose | 8.18.1 | MongoDB ODM |
| Socket.io | 4.8.1 | Real-time communication |
| ioredis | 5.8.2 | Redis client (memory system) |
| redis | 5.9.0 | Redis client (caching) |
| OpenAI SDK | via @langchain/openai 1.1.1 | AI chatbot |
| LangChain | 1.0.4 | AI pipeline orchestration |
| Pinecone | 6.1.3 | Vector database |
| Sentry | 10.25.0 | Error monitoring & profiling |
| Helmet | 8.1.0 | Security headers |
| bcrypt | 6.0.0 | Password hashing (12 rounds) |
| jsonwebtoken | 9.0.2 | JWT authentication |
| SendGrid | 8.1.6 | Email service |
| Nodemailer | 7.0.10 | SMTP email fallback |
| QStash (Upstash) | 2.8.4 | Scheduled tasks & webhooks |

### B. FRONTEND STACK

| Công nghệ | Version | Vai trò |
|---|---|---|
| React | 19.1.1 | UI framework |
| React Router DOM | 7.9.1 | Client-side routing |
| styled-components | 6.1.19 | CSS-in-JS styling |
| TypeScript | 4.9.5 | Type safety |
| react-scripts (CRA) | 5.0.1 | Build toolchain |
| Chart.js + react-chartjs-2 | 4.5.1 | Data visualization |
| Axios | 1.12.2 | HTTP client |
| Socket.io-client | 4.8.1 | Real-time client |
| jsPDF | 3.0.3 | PDF export |
| html2canvas | 1.4.1 | Screenshot/PDF rendering |
| jwt-decode | 4.0.0 | Token decoding |

### C. CƠ SỞ DỮ LIỆU & CLOUD SERVICES

| Service | Dùng cho |
|---|---|
| MongoDB Atlas | Database chính — lưu users, test results, conversations, alerts, audit logs |
| Redis Cloud (AWS ap-southeast-1) | Caching, rate limiting, session, memory system |
| Pinecone | Vector database — long-term memory, RAG (Retrieval-Augmented Generation) |
| OpenAI GPT-4o-mini | AI chatbot engine |
| SendGrid / SMTP | Email thông báo HITL, crisis alerts |
| Sentry | Error tracking, performance monitoring, profiling |
| QStash (Upstash) | Cron jobs, scheduled webhooks |

### D. DEPLOYMENT & DEVOPS

| Platform | Vai trò |
|---|---|
| Vercel | Frontend hosting (soulfriend.vercel.app) |
| Render | Backend hosting (soulfriend-api.onrender.com) |
| GitHub Actions | CI/CD pipeline (5 workflows) |
| Docker | Multi-stage build, Kubernetes-ready |

**CI/CD Workflows (.github/workflows/):**

1. `ci.yml` — Continuous Integration (lint, test)
2. `cd.yml` — Continuous Deployment
3. `deploy.yml` — Manual deployment trigger
4. `codeql.yml` — Code security scanning (CodeQL)
5. `security-scan.yml` — Dependency vulnerability scan

---

## III. KIẾN TRÚC HỆ THỐNG

### A. Backend — 15 Database Models

| Model | Chức năng |
|---|---|
| User.ts | Người dùng (email, password hash, displayName) |
| Admin.ts | Admin hệ thống |
| Expert.ts | Chuyên gia tâm lý |
| TestResult.ts | Kết quả bài test DASS-21 |
| Consent.ts | Bản đồng ý sử dụng dịch vụ |
| ConversationLog.ts | Lịch sử hội thoại chatbot |
| LongTermMemory.ts | Bộ nhớ dài hạn AI (vector embeddings) |
| CriticalAlert.ts | Cảnh báo khủng hoảng tâm lý |
| HITLFeedback.ts | Human-in-the-Loop feedback từ chuyên gia |
| InterventionMessage.ts | Tin nhắn can thiệp chuyên gia → bệnh nhân |
| TrainingDataPoint.ts | Dữ liệu huấn luyện AI |
| ABExperiment.ts | A/B testing experiments |
| AuditLog.ts | Nhật ký kiểm tra bảo mật |
| ResearchData.ts | Dữ liệu nghiên cứu |
| WomenMentalHealth.ts | Dữ liệu sức khỏe tâm thần phụ nữ |

### B. API Routes — 19 Nhóm Endpoints

| Route | Path | Chức năng |
|---|---|---|
| userAuth.ts | /api/v2/auth/* | Đăng ký / Đăng nhập user (JWT) |
| expertAuth.ts | /api/v2/expert/* | Đăng nhập chuyên gia |
| tests.ts | /api/v2/tests/* | Bài test DASS-21 (câu hỏi, chấm điểm, submit) |
| chatbot.ts | /api/v2/chatbot/* | AI chatbot (chat, new session, crisis detect) |
| consent.ts | /api/v2/consent/* | Quản lý đồng ý sử dụng |
| admin.ts | /api/v2/admin/* | Admin panel |
| user.ts | /api/v2/user/* | User data, privacy management |
| research.ts | /api/v2/research/* | Nghiên cứu & analytics |
| hitlFeedback.ts | /api/hitl-feedback/* | Feedback loop chuyên gia |
| hitlIntervention.ts | /api/hitl/* | Can thiệp real-time chuyên gia |
| criticalAlerts.ts | /api/alerts/* | Cảnh báo khủng hoảng |
| conversationLearning.ts | /api/conversation-learning/* | AI learning từ hội thoại |
| fineTuning.ts | /api/fine-tuning/* | Auto fine-tuning pipeline |
| abTesting.ts | /api/ab-testing/* | A/B testing AI responses |
| qstashWebhooks.ts | /api/webhooks/qstash/* | Scheduled webhooks |
| qstashTest.ts | /api/test/qstash/* | Test QStash (dev only) |
| sentryTestRoutes.ts | /api/test/sentry/* | Test Sentry (dev only) |
| memoryTest.ts | /api/test/memory/* | Test memory system (dev only) |

### C. Backend Services — 25 Files

| Service | Vai trò |
|---|---|
| chatbotService.ts | Core chatbot logic |
| enhancedChatbotService.ts | Enhanced chatbot with context |
| memoryAwareChatbotService.ts | Chatbot tích hợp long-term memory |
| openAIService.ts | OpenAI GPT-4o-mini integration |
| emStyleReasoner.ts | Empathetic reasoning style |
| socialHarmDecoder.ts | Phát hiện tự hại / nguy hiểm |
| criticalInterventionService.ts | Quy trình can thiệp khủng hoảng |
| riskScoringService.ts | Chấm điểm rủi ro tâm lý |
| moderationService.ts | Content moderation |
| memorySystem.ts | Long-term memory (Redis + Pinecone) |
| memoryConsolidationService.ts | Memory cleanup & consolidation (24h cycle) |
| vectorStore.ts | Pinecone vector embeddings |
| redisService.ts | Redis caching layer |
| emailService.ts | SendGrid/SMTP email |
| hitlFeedbackService.ts | HITL feedback processing |
| hitlFeedbackService.persistent.ts | HITL persistent storage |
| conversationLearningService.ts | AI learning pipeline |
| autoFineTuningService.ts | Automatic model fine-tuning |
| abTestingService.ts | A/B test framework |
| anonymizationService.ts | Ẩn danh hóa dữ liệu (GDPR) |
| dataRetentionService.ts | Tự động xóa dữ liệu cũ (GDPR, 24h cycle) |
| circuitBreakerService.ts | Circuit breaker pattern (fault tolerance) |
| therapeuticContextService.ts | Bối cảnh trị liệu |
| biasMonitor.ts | Giám sát bias AI |
| offlineTrainingService.ts | Offline AI training |

### D. Middleware Layer — 9 Files

| Middleware | Chức năng |
|---|---|
| auth.ts | JWT authentication (Admin + Expert) |
| rateLimiter.ts | Rate limiting (global + per-endpoint) |
| redisRateLimiter.ts | Redis-backed distributed rate limiting |
| encryption.ts | Data encryption (AES-256) |
| auditLogger.ts | Ghi nhật ký hành vi nhạy cảm |
| consentEnforcement.ts | Bắt buộc đồng ý trước khi dùng |
| errorHandler.ts | Global error handling |
| asyncHandler.ts | Async/await error wrapper |
| requestContext.ts | Request ID + response time tracking |

### E. Security — Các lớp bảo mật đã triển khai

1. **Helmet** — Security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options)
2. **CORS whitelist** — Chỉ cho phép soulfriend.vercel.app domains
3. **bcrypt 12 rounds** — Password hashing
4. **JWT authentication** — 3 tiers: public / user / expert
5. **Rate limiting** — Global + per-auth-endpoint (Redis-backed)
6. **NoSQL injection sanitization** — Strip MongoDB `$` operators
7. **Vietnamese UTF-8 NFC normalization** — Fix encoding issues
8. **Data encryption AES-256** — Mã hóa dữ liệu nhạy cảm
9. **Audit logging** — Ghi nhật ký mọi hành vi nhạy cảm
10. **GDPR data retention** — Tự động xóa dữ liệu cũ (24h cycle)
11. **Anonymization service** — Ẩn danh hóa trước khi dùng cho nghiên cứu
12. **Content moderation** — Kiểm duyệt nội dung AI
13. **Non-root Docker user** — Container security
14. **Sentry error monitoring** — 20% sampling production

---

## IV. NỘI DUNG ỨNG DỤNG (FRONTEND)

### A. Routing & Access Control

**3-tier access system** (AppRouter.tsx — 285 dòng):

| Tier | Routes | Yêu cầu |
|---|---|---|
| PUBLIC | `/` (Landing), `/start` (DASS-21), `/features`, `/login` | Không cần đăng nhập |
| USER | `/content`, `/research`, `/community`, `/life-stages`, `/gamefi`, `/progress` | Đăng nhập JWT |
| EXPERT | `/expert/login`, `/expert/dashboard` | Expert JWT |

### B. 65 React Components — Phân loại theo chức năng

#### 1. Trang chính (Core Pages)

| Component | Chức năng |
|---|---|
| ContentShowcaseLanding.tsx | Landing page — giới thiệu SoulFriend |
| FeaturesShowcase.tsx | Trang Features — 6 tính năng, Testimonials, Expert Endorsements, Awards, Citations |
| ContentOverviewPage.tsx | Trang khám phá nội dung tổng quan |
| AuthPage.tsx | Đăng nhập / Đăng ký |

#### 2. Bài test tâm lý

| Component | Chức năng |
|---|---|
| DASS21Test.tsx | Bài test DASS-21 (21 câu — Trầm cảm, Lo âu, Stress) — DUY NHẤT ĐANG HOẠT ĐỘNG |
| ConsentForm.tsx / ConsentFormV2.tsx | Mẫu đồng ý trước khi test |
| TestResults.tsx | Hiển thị kết quả + khuyến nghị theo severity |
| TestSelection.tsx | Chọn bài test |
| TestTaking.tsx | Giao diện làm test |
| PHQ9Test, GAD7Test, EPDSTest... (11 files) | Các test legacy — đã disable, chỉ còn DASS-21 |

#### 3. AI Chatbot

| Component | Chức năng |
|---|---|
| ChatBot.tsx | Chatbot AI chính — GPT-4o-mini, floating widget toàn app |
| AdvancedChatBot.tsx | Version nâng cao |
| ChatbotBackendDemo.tsx | Demo chatbot |
| CrisisAlert.tsx | Cảnh báo khủng hoảng real-time |

#### 4. Nghiên cứu & Dữ liệu

| Component | Chức năng |
|---|---|
| ResearchDashboard.tsx | Dashboard nghiên cứu — Dữ liệu VN, WHO/DSM-5, biểu đồ CSS, trung tâm điều trị |
| AIInsights.tsx | Phân tích AI |
| ResultsAnalysis.tsx | Phân tích kết quả chi tiết |
| PDFExport.tsx | Xuất báo cáo PDF |

#### 5. Cộng đồng & Hỗ trợ

| Component | Chức năng |
|---|---|
| CommunitySupport.tsx | Tabs: Resources, Support Groups, Professionals, Emergency, AI Chatbot — 8 hotlines, 6 chuyên gia, HITL explanation |
| LifeStageNavigation.tsx | 4 giai đoạn sống phụ nữ VN + DASS-21 contextualized |

#### 6. Gamification & Progress

| Component | Chức năng |
|---|---|
| GameFi.tsx | Gamification — Daily quests (6), Badges (8), XP→Level, streak, localStorage |
| ProgressTracker.tsx | Journey stepper 5 bước, content progress 6 mục, DASS-21 history, weekly summary |
| SocialSharing.tsx | Chia sẻ Facebook/Zalo/Twitter/X (privacy-safe) |

#### 7. Expert Dashboard

| Component | Chức năng |
|---|---|
| ExpertDashboard.tsx | Dashboard chuyên gia — quản lý alerts, can thiệp real-time |
| ExpertLogin.tsx | Đăng nhập Expert |
| ProtectedRoute.tsx | Route guard cho Expert |
| MonitoringDashboard.tsx | System monitoring |
| ProfessionalDashboard.tsx | Professional view |

#### 8. UI Components

| Component | Chức năng |
|---|---|
| AnimatedButton.tsx | Nút bấm animated |
| AnimatedCard.tsx | Card có animation |
| LoadingSpinner.tsx | Loading indicator |
| PageTransition.tsx | Chuyển trang mượt |
| ProgressIndicator.tsx | Progress bar |
| Footer.tsx | Footer |
| NavigationTabs.tsx | Tab navigation |
| CTASection.tsx | Call-to-action section |
| ValidationWarning.tsx | Warning popup |
| MedicalDisclaimer.tsx | Disclaimer y tế |

#### 9. Nội dung & Tài liệu

| Component | Chức năng |
|---|---|
| SelfCareDocuments.tsx | Tài liệu tự chăm sóc |
| EBooks.tsx | Sách điện tử |
| VideoGuides.tsx / VideoGuidesUpdated.tsx | Video hướng dẫn |
| VideoPlayer.tsx / YouTubePlayer.tsx | Video player |
| VideoFallback.tsx | Fallback khi video lỗi |

#### 10. Privacy & Data

| Component | Chức năng |
|---|---|
| PrivacyManagement.tsx | Quản lý quyền riêng tư (GDPR) |
| DataBackup.tsx | Sao lưu dữ liệu |
| DemographicsCollection.tsx | Thu thập demographics |
| NotificationSystem.tsx | Hệ thống thông báo |

### C. Frontend Services — 30 Files

| Service | Chức năng |
|---|---|
| apiService.ts | HTTP client tới backend |
| aiService.ts / advancedAIService.ts | AI integration |
| chatbotBackendService.ts | Chatbot API calls |
| chatbotSafetyService.ts | Safety checks client-side |
| chatbotPersonality.ts | AI personality configuration |
| chatbotNLUService.ts | NLU (Natural Language Understanding) |
| chatbotRAGService.ts | RAG retrieval |
| chatbotOrchestratorService.ts | Orchestration logic |
| chatbotEvaluatorService.ts | Response evaluation |
| clinicalValidation.ts | Clinical validation rules |
| internationalStandards.ts | WHO/DSM-5 standards |
| vietnamAIService.ts | Vietnamese-specific AI |
| expertNLP.ts | Expert NLP processing |
| expertIntegrationService.ts | Expert dashboard integration |
| securityService.ts | Client-side security |
| monitoringService.ts | Client monitoring |
| analyticsEngine.ts | Analytics engine |
| performanceOptimizationService.ts | Performance tuning |
| qualityAssuranceService.ts | QA framework |
| cloudResearchService.ts | Cloud research data |
| realResearchService.ts | Real research data service |
| researchPlatform.ts | Research platform |
| demographicsService.ts | Demographics handling |
| realDataCollector.ts | Data collection |
| reportingService.ts | Report generation |
| workflowManager.ts | Workflow management |
| offlineChatService.ts | Offline chat fallback |
| adminAuthService.ts | Admin authentication |
| aiCompanionService.ts | AI companion service |

### D. Data Files

| File | Nội dung |
|---|---|
| vietnameseQuestions.ts | Câu hỏi DASS-21 tiếng Việt |
| vietnamResearchData.ts | Dữ liệu nghiên cứu Việt Nam (DASS-21 only) |
| videoData.ts | Dữ liệu video hướng dẫn |
| dass21.js (backend) | Ngân hàng câu hỏi DASS-21 backend |

---

## V. KIẾN TRÚC AI & CHATBOT

### Pipeline xử lý tin nhắn:

```
User Message
    |
    v
[moderationService] --> Check an toàn --> Reject nếu vi phạm
    |
    v
[socialHarmDecoder] --> Phát hiện tự hại / khủng hoảng
    |
    v
[riskScoringService] --> Chấm điểm rủi ro (low/medium/high/critical)
    |
    v
[memorySystem] --> Truy xuất context dài hạn từ Redis + Pinecone
    |
    v
[memoryAwareChatbotService] --> Gọi OpenAI GPT-4o-mini với full context
    |
    v
[emStyleReasoner] --> Áp dụng empathetic reasoning style
    |
    v
[criticalInterventionService] --> Nếu critical --> Alert chuyên gia
    |
    v
[conversationLearningService] --> Lưu & học từ hội thoại
    |
    v
AI Response --> User
```

### HITL (Human-in-the-Loop) Pipeline:

1. AI phát hiện rủi ro cao → tạo CriticalAlert
2. Email gửi đến chuyên gia (qua SendGrid)
3. Expert đăng nhập → ExpertDashboard
4. Expert can thiệp real-time qua Socket.io
5. Feedback vòng lặp → AI cải thiện quality

---

## VI. SƠ ĐỒ DEPLOYMENT

```
+------------------------+         +------------------------+
|   VERCEL (Frontend)    |  HTTPS  |   RENDER (Backend)     |
| soulfriend.vercel.app  | ------> | soulfriend-api.onrender|
|                        |         |                        |
| React 19 SPA           |         | Express 5 + Socket.io  |
| styled-components      |         | TypeScript 5.9         |
| CSP Headers            |         | Helmet + CORS          |
+------------------------+         +----------+-------------+
                                              |
                    +-------------------------+-------------------------+
                    |                         |                         |
          +---------v------+        +---------v--------+      +--------v-------+
          | MongoDB Atlas  |        |  Redis Cloud     |      |  Pinecone      |
          | (Database)     |        |  (Cache+Memory)  |      |  (Vectors)     |
          | 15 models      |        |  ap-southeast-1  |      |  LTM + RAG     |
          +----------------+        +------------------+      +----------------+
                    |                         |                         |
          +---------v------+        +---------v--------+      +--------v-------+
          |  OpenAI        |        |   Sentry         |      |  SendGrid      |
          |  GPT-4o-mini   |        |  Error Monitor   |      |  Email HITL    |
          +----------------+        +------------------+      +----------------+
```

---

## VII. TÍNH NĂNG THEO PHASE

| Phase | Trạng thái | Nội dung chi tiết |
|---|---|---|
| Phase 1 — Content Visibility | ✅ Hoàn thành | Wiring orphaned components, DASS-21 only, unified AppRouter |
| Phase 2 — Content Deepening | ✅ Hoàn thành | LifeStageNavigation, ResearchDashboard upgrade, CommunitySupport (8 hotlines, 6 experts), vietnamResearchData cleanup |
| Phase 3 — Engagement Enhancement | ✅ Hoàn thành | ProgressTracker, Smart Recommendations (severity-based), Social Proof (expert endorsements, before/after testimonials, DOI citations, awards), GameFi localStorage persistence (XP→Level), SocialSharing |
| Phase 4 — Performance & UX | ⬜ Chưa triển khai | Performance optimization, SEO, PWA, accessibility |

---

## VIII. UTILS & BACKEND SCORING

| File | Chức năng |
|---|---|
| scoring.ts | Chấm điểm DASS-21 (Depression, Anxiety, Stress subscales) |
| enhancedScoring.ts | Scoring nâng cao với phân tích chi tiết |
| clinicalValidation.ts | Validation theo tiêu chuẩn lâm sàng |
| clinicalTestRunner.ts | Chạy test clinical |
| aiAnalysis.ts | AI phân tích kết quả |
| encryption.ts | Mã hóa / giải mã AES-256 |
| logger.ts | Winston logger (file + console) |
| mockDataStore.ts | Mock data cho testing |

---

## IX. CONFIGURATION FILES

| File | Mục đích |
|---|---|
| backend/src/config/database.ts | MongoDB Atlas connection (pool 5-10, retry, majority write) |
| backend/src/config/environment.ts | 40+ env vars validation |
| backend/src/config/redis.ts | Redis Cloud connection |
| backend/src/config/security.ts | JWT, encryption, CORS policy |
| backend/src/config/sentry.ts | Sentry error monitoring (20% sampling) |
| backend/src/config/qstash.ts | QStash scheduled tasks |
| frontend/src/config/api.ts | API URL + endpoints config |
| vercel.json | Vercel build + CSP headers + rewrites |
| Dockerfile | Multi-stage Node 20 Alpine build |
| docker-compose.yml | Docker compose setup |
| tsconfig.json | TypeScript configuration |

---

## X. TÓM TẮT

**SoulFriend V4.0** là ứng dụng full-stack enterprise-grade với:

- **~69,000 dòng code** (backend 28K + frontend 41K)
- **7 cloud services** tích hợp (MongoDB, Redis, Pinecone, OpenAI, Sentry, SendGrid, QStash)
- **AI chatbot thông minh** với long-term memory, crisis detection, HITL pipeline
- **Bài test DASS-21** chuẩn quốc tế, validated trên quần thể Việt Nam
- **3-tier access control** (Public → User → Expert)
- **Gamification system** với XP, Level, Badges, Streaks, localStorage persistence
- **Security hardening** 14 lớp bảo mật (Helmet, CORS, bcrypt, JWT, rate limiting, NoSQL injection, AES-256, audit log, GDPR...)
- **CI/CD pipeline** 5 workflows (CI, CD, deploy, CodeQL, security scan)
- **Docker-ready** với multi-stage build, health checks, non-root user
- **Real-time communication** Socket.io cho Expert intervention
- **Empathetic AI** với Vietnamese-specific NLP và crisis detection

---

*Báo cáo được tạo tự động bởi hệ thống phân tích mã nguồn SoulFriend V4.0*
*Ngày: 06/03/2026*
