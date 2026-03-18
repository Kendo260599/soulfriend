# Vocabulary Upgrade Research (Next Phase)

Date: 2026-03-16
Scope: Vocabulary-first continuation after current module stabilization

## 1) Current baseline

### Stable today

- Topic-based vocab lesson selection is working for tracked lesson IDs.
- Vocab check endpoint is available and updates progress memory strength.
- Legacy non-curated words have been removed from the active DB.
- Frontend lesson card now supports showing active lesson topic.

### Verified behaviors

- Curriculum load: vocab and grammar tracks are available.
- Topic routing examples:
  - VOC-A1-01 -> Personal Information words.
  - VOC-A2-02 -> Travel and Transport words.
  - VOC-A2-05 -> Technology and Internet words.
  - VOC-B1-03 -> Media and Opinion words.
- Vocab check returns score, weak_items, and recommendation.

## 2) Gaps to solve next (vocab-only)

### Gap A: No true review queue yet

Current progress table tracks memory_strength but has no due-date scheduling. This means weak words are detected, but review cadence is not truly spaced.

Impact:

- Users receive score feedback but do not get a daily review queue ordered by urgency.
- Memory recovery is weaker than expected over multiple days.

### Gap B: Progress signals are too coarse

Current progress metrics are useful, but not enough for adaptive review:

- learned_words
- weak_words
- grammar_completed

Missing vocab-specific signals:

- due_today
- overdue_items
- retention_7d
- avg_accuracy_recent

### Gap C: UI review loop not available

The current flow ends at progress after vocab check. There is no dedicated "Review now" path that serves weak/due words immediately.

### Gap D: Lightweight analytics missing

There is no per-lesson or per-topic outcome tracking for:

- which topic causes most wrong answers
- which words repeatedly fail
- review completion rate

## 3) Recommended architecture for next upgrade

### 3.1 Data model extensions

Extend progress schema into spaced-review compatible model (incremental, backward-safe):

- review_due_at TEXT (ISO datetime)
- last_reviewed_at TEXT (ISO datetime)
- streak_correct INTEGER default 0
- last_result INTEGER (0/1)
- learner_id INTEGER default 1 (for future multi-learner support)

Note:

- Keep current columns unchanged.
- Populate new columns lazily on first vocab_check update.

### 3.2 Scheduling policy (simple and robust)

Use a deterministic policy first, then refine:

- Correct answer:
  - streak_correct +1
  - memory_strength increases with cap
  - due interval by streak: 1d, 3d, 7d, 14d
- Wrong answer:
  - streak_correct reset to 0
  - memory_strength decreases with floor
  - due interval = 12h or 24h

This policy is easy to reason about and test in production.

### 3.3 New API surface

Add review APIs under foundation:

- GET /api/v2/foundation/review?learnerId=1&limit=20
  - Returns due items first, then weak fallback items.
- POST /api/v2/foundation/review-submit
  - Body: learnerId, answers [{wordId, correct}]
  - Updates schedule and returns summary.

Keep current vocab-check endpoint for lesson-end scoring; reuse shared scoring logic internally.

### 3.4 UI additions

Add Review section in vocabulary flow:

- Home card:
  - due today count
  - button: Start review
- Review screen:
  - one-word quick loop
  - Remembered / Not yet actions
  - finish summary: reviewed, correct rate, next due recommendation

### 3.5 Compatibility and rollout safety

- Maintain worker fallback patterns already used for legacy action support.
- If review endpoint fails, UI should still allow normal lesson flow.
- Keep foundation timeout profile for cold-start resilience.

## 4) Execution plan (next sprint, vocab-only)

### Vocab-N1: Schema + migration

- Add new review scheduling columns.
- Add migration helper for old DBs.
- Validate no data loss in existing progress rows.

### Vocab-N2: Review engine in learning service

- Implement queue generation (due-first).
- Implement schedule updates on review submit.
- Add unit-like smoke checks for interval transitions.

### Vocab-N3: Bridge and backend routes

- Add review actions to bridge worker.
- Expose review endpoints in backend routes.
- Add payload validation for malformed answers.

### Vocab-N4: Frontend review UI

- Add review panel and review flow.
- Connect submit + summary.
- Show due_today and weak_words in progress/home.

### Vocab-N5: QA and telemetry

- Add smoke scripts for:
  - due queue ordering
  - review submit idempotency safety
  - cold-start handling
- Add QA report doc for review flow similar to existing vocab UI report.

## 5) Acceptance criteria for next upgrade

- User can start a daily review session from home.
- Due items are prioritized correctly.
- Review submit updates due schedule deterministically.
- Progress shows due_today and weak_words coherently.
- Backend/Frontend builds pass and smoke checks pass.

## 6) Risks and mitigations

Risk: schedule logic too aggressive or too slow
- Mitigation: keep fixed interval table first; tune after 1 week data.

Risk: old DB rows missing new fields
- Mitigation: additive migration + defensive defaults.

Risk: timeout on first review fetch
- Mitigation: keep dedicated foundation timeout and graceful retry for read-only calls.

## 7) Recommendation

Proceed with Vocab-N1 to Vocab-N3 first (backend complete), then Vocab-N4 UI.
This keeps rollout safe: API can be validated before UI dependency.
