# Sprint 2 Checklist: Vocab-First Upgrade

## 1) Scope lock

- Focus area: Vocab track first, then bridge to Grammar.
- Product target: IELTS foundation (A1-A2-B1), beginner-safe flow.
- Out of scope in this sprint: Listening, Reading, Writing, Speaking scoring.

## 2) Execution order (commit-by-commit)

### Commit V1 - Data contract hardening for vocab lessons

- Goal: Every vocab lesson is complete and machine-safe.
- Files:
  - english_foundation/content/cambridge_curriculum.json
  - english_foundation/api/learning_service.py
- Tasks:
  - Validate every vocab lesson has id, order, level, title, focus, objective.
  - Enforce unique order inside vocab track.
  - Enforce stable sort by order then id.
  - Reject malformed lesson entries with clear error message.
- Done criteria:
  - Curriculum payload returns deterministic vocab order.
  - Invalid curriculum rows fail fast with explicit reason.

### Commit V2 - Vocab lesson shape expansion

- Goal: Standardize vocab payload for UI and future review engine.
- Files:
  - english_foundation/core/lesson_engine.py
  - english_foundation/api/learning_service.py
  - english_foundation/api/bridge_worker.py
  - backend/src/services/foundationBridgeService.ts
- Tasks:
  - Extend word item shape with stable fields: id, word, ipa, meaning_vi, collocation, example_sentence.
  - Ensure lesson response always includes sequence for rendering order.
  - Keep backward compatibility for old worker behavior.
- Done criteria:
  - Vocab lesson payload is stable across lesson endpoint and track lesson endpoint.

### Commit V3 - Vocab mini-check API

- Goal: Add a lightweight check after each vocab lesson.
- Files:
  - backend/src/routes/foundation.ts
  - backend/src/services/foundationBridgeService.ts
  - english_foundation/api/bridge_worker.py
  - english_foundation/api/learning_service.py
- Tasks:
  - Add endpoint: POST /api/v2/foundation/vocab-check.
  - Request body: learnerId, track, lessonId, answers.
  - Response: score, weak_items, recommended_review.
  - Add validation and clear 400 errors for bad payload.
- Done criteria:
  - Endpoint works end-to-end and returns deterministic score payload.

### Commit V4 - Persist vocab performance

- Goal: Save check outcomes to support review scheduling.
- Files:
  - english_foundation/db/bootstrap.py
  - english_foundation/api/learning_service.py
  - english_foundation/db/foundation.db (generated runtime)
- Tasks:
  - Add table for vocab performance (word_id, learner_id, correct_count, wrong_count, memory_strength, due_date).
  - Upsert on every vocab-check submission.
  - Clamp memory_strength into safe range.
- Done criteria:
  - Performance data persists and can be queried by learner.

### Commit V5 - Daily vocab review endpoint

- Goal: Serve prioritized review items from weakest to strongest.
- Files:
  - english_foundation/api/learning_service.py
  - english_foundation/api/bridge_worker.py
  - backend/src/services/foundationBridgeService.ts
  - backend/src/routes/foundation.ts
  - frontend/src/services/apiService.ts
- Tasks:
  - Add endpoint: GET /api/v2/foundation/review?learnerId=1.
  - Return due items first, then weak items.
  - Include minimal metadata for quick review cards.
- Done criteria:
  - API returns non-empty list when weak or due words exist.

### Commit V6 - Vocab UI flow upgrade (learn -> practice -> recall -> check)

- Goal: Turn vocab lesson into a clear 4-step loop.
- Files:
  - frontend/src/components/EnglishFoundationModule.tsx
  - frontend/src/services/apiService.ts
- Tasks:
  - Add 4-step lesson flow state.
  - Show collocation-focused prompts in practice step.
  - Add recall step before final check.
  - Submit check results to new backend endpoint.
- Done criteria:
  - User can complete full vocab loop without manual page reload.

### Commit V7 - Review UI and progress metrics

- Goal: Show daily review and vocab progress health.
- Files:
  - frontend/src/components/EnglishFoundationModule.tsx
  - frontend/src/services/apiService.ts
- Tasks:
  - Add Daily Review section on home or progress screen.
  - Show counts: learned_words, weak_words, due_today.
  - Add CTA from lesson finish to review queue.
- Done criteria:
  - User can start review directly from home screen.

### Commit V8 - Reliability and timeout resilience

- Goal: Keep vocab UX stable on cold starts and transient backend delays.
- Files:
  - frontend/src/config/api.ts
  - frontend/src/services/apiService.ts
  - backend/src/services/foundationBridgeService.ts
- Tasks:
  - Keep dedicated foundation timeout profile.
  - Add safe retry for read-only foundation calls.
  - Preserve backend compatibility fallbacks for old worker actions.
- Done criteria:
  - No user-facing crash on temporary timeout.

## 3) Test checklist per commit

- Backend checks:
  - Run: Set-Location backend; npx tsc --noEmit
- Frontend checks:
  - Run: Set-Location frontend; npm run build
- Smoke checks:
  - Open /english-foundation
  - Load curriculum
  - Open vocab track lesson
  - Complete lesson flow and submit mini-check

## 4) Acceptance criteria for Sprint 2 (Vocab-first)

- Curriculum and track lesson always load (including legacy worker compatibility path).
- Vocab lesson has complete field set for each item.
- User can complete mini-check and receive score + weak items.
- Review queue endpoint and UI are available.
- Build passes on backend and frontend pipelines.

## 5) Suggested branch strategy

- Branch: feat/vocab-sprint2
- Merge policy: squash per milestone (V1-V8).
- Keep each commit deployable and reversible.
