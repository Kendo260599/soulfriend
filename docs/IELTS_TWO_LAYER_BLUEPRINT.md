# IELTS Two-Layer Blueprint (Vietnamese Learner Focus)

## 1) Product Positioning

This product should be split into 2 layers:

1. Foundation Layer (already built):
- Goal: remove fear, rebuild core grammar and vocabulary from A1 to B1.
- User: beginners and lost-foundation learners.
- Output: stable sentence building and topic vocabulary.

2. IELTS Track Layer (new):
- Goal: exam readiness for IELTS Academic/General style tasks.
- User: learners who completed enough foundation units.
- Output: skill scores, band-aligned feedback, exam strategy habits.

The system should present Foundation as mandatory or strongly recommended pre-phase for weak users.

---

## 2) Learning Flow for Vietnamese Users

### Phase A - Diagnose (5 to 8 minutes)
- Quick baseline: grammar, lexical range, reading speed, listening comprehension confidence.
- Route users to:
  - Foundation-first path
  - Mixed path (Foundation + light IELTS)
  - IELTS-first path (for stronger users)

### Phase B - Build Foundation (A1 to B1)
- Keep current module philosophy: calm, short, safe.
- Daily format:
  - 1 grammar micro lesson
  - 1 vocabulary/phrase lesson
  - 1 mixed review

### Phase C - Bridge to IELTS
- Introduce IELTS task structures gradually:
  - Reading: matching headings, true/false/not given
  - Listening: form completion, map labeling
  - Writing: task response basics and coherence
  - Speaking: Part 1 fluency and idea expansion

### Phase D - IELTS Intensive
- Full mock sets by skill with timed mode.
- Band projection and weak-skill targeting.

---

## 3) Technical Architecture

### Current
- React frontend consumes backend domain APIs.
- Backend route /api/v2/foundation bridges to canonical Python logic.
- SQLite stores foundation learning data.

### Target Extension

1. Keep Foundation canonical package:
- english_foundation/core
- english_foundation/api
- english_foundation/db

2. Add IELTS canonical package:
- ielts_track/core
- ielts_track/api
- ielts_track/db
- ielts_track/content

3. Shared orchestration service in backend:
- backend/src/routes/learningPath.ts
- decides next activity from both layers.

4. Keep Python as source of truth for scoring and recommendation.

---

## 4) New Core Engines (IELTS Track)

Create only exam-critical engines first:

1. reading_engine.py
- Task generators by question type.
- Accuracy and speed metrics.

2. listening_engine.py
- Segment-based audio tasks and transcript checkpoints.
- Answer confidence scoring.

3. writing_engine.py
- Task templates (Task 1 and Task 2 style skeletons).
- Rubric-based scoring buckets:
  - task_response
  - coherence
  - lexical_resource
  - grammar_range_accuracy

4. speaking_engine.py
- Part 1/2/3 prompt flow.
- Fluency and grammar/lexical note markers.

5. band_projection_engine.py
- Weighted aggregation from skill engines.
- Confidence interval for predicted band.

---

## 5) Database Additions (Do not break existing foundation tables)

Add separate IELTS tables:

1. ielts_skill_progress
- id
- learner_id
- skill (reading/listening/writing/speaking)
- score_raw
- estimated_band
- updated_at

2. ielts_attempt
- id
- learner_id
- skill
- task_type
- correct_count
- total_count
- duration_sec
- details_json
- created_at

3. ielts_writing_feedback
- id
- learner_id
- prompt_id
- task_response
- coherence
- lexical_resource
- grammar_range_accuracy
- estimated_band
- feedback_json
- created_at

4. ielts_speaking_feedback
- id
- learner_id
- part
- fluency
- lexical_resource
- grammar_range_accuracy
- pronunciation_proxy
- estimated_band
- feedback_json
- created_at

5. learning_path_state
- id
- learner_id
- foundation_readiness
- ielts_readiness
- current_phase
- next_recommended_activity

---

## 6) API Contract (Backend Domain)

### Foundation (existing)
- GET /api/v2/foundation/curriculum
- GET /api/v2/foundation/lesson
- GET /api/v2/foundation/progress

### New IELTS
- GET /api/v2/ielts/readiness
- GET /api/v2/ielts/next-task
- POST /api/v2/ielts/submit-task
- GET /api/v2/ielts/skill-progress
- GET /api/v2/ielts/band-projection

### New Orchestration
- GET /api/v2/learning-path/next
- returns one next card:
  - foundation_grammar
  - foundation_vocab
  - ielts_reading
  - ielts_listening
  - ielts_writing
  - ielts_speaking

---

## 7) UX Strategy

### Keep
- Calm card UI.
- Large buttons.
- Minimal overload.

### Add for IELTS readiness
1. Two tabs on top:
- Foundation
- IELTS Track

2. IELTS skill board (simple):
- Reading band estimate
- Listening band estimate
- Writing band estimate
- Speaking band estimate

3. Next recommendation card:
- "Today best next step"
- reason in one sentence

4. Vietnamese support mode:
- simple Vietnamese explanation for errors
- avoid heavy technical grammar wording

---

## 8) Quality Rubric for "IELTS-ready" status

System can be called IELTS-ready only when all are true:

1. Has 4-skill training tasks.
2. Has score history and trend lines by skill.
3. Has band projection with confidence.
4. Has timed mock mode.
5. Has Vietnamese learner guidance layer.
6. Has personalized remediation from weak patterns.

---

## 9) Delivery Plan (4 Sprints)

### Sprint 1 - Readiness and Orchestration
- Add baseline diagnostic.
- Add learning_path_state table.
- Build /api/v2/learning-path/next.
- Keep UI simple with next-step card.

### Sprint 2 - Reading and Listening MVP
- Implement reading_engine and listening_engine.
- Store attempts and progress.
- Add skill-progress endpoints.

### Sprint 3 - Writing and Speaking MVP
- Implement writing_engine and speaking_engine with rubric buckets.
- Add Vietnamese feedback phrasing templates.

### Sprint 4 - Band Projection and Mock Mode
- Implement band_projection_engine.
- Add timed mock flows and consolidated report page.

---

## 10) Immediate Next Build Tasks

1. Create package skeleton:
- ielts_track/core
- ielts_track/api
- ielts_track/db
- ielts_track/content

2. Add new backend route:
- backend/src/routes/ielts.ts
- register in backend/src/index.ts

3. Build readiness endpoint first:
- /api/v2/ielts/readiness

4. Add UI entry in app router:
- /ielts-track
- with a minimal score board + next task card

This sequence preserves current stable foundation module while safely expanding into IELTS capabilities for Vietnamese learners.
