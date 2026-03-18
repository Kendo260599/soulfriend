# Sprint 1 Technical Checklist

Scope: IELTS-focused Grammar + Vocabulary only.
Goal: ship a stable Sprint 1 baseline that can be coded immediately.

## 1. Definition of Done

- [ ] Only 2 active tracks: grammar and vocab.
- [ ] Curriculum endpoint returns ordered lessons by `order`.
- [ ] Lesson endpoint supports `track` + `lessonId`.
- [ ] Home and track screens clearly show IELTS Grammar/Vocabulary.
- [ ] No UI/API references to other skills (listening, reading, writing, speaking) in foundation module.
- [ ] Backend TypeScript check passes.
- [ ] Frontend tests pass.
- [ ] Frontend production build passes.

## 2. Execution Order (File-by-File)

### Task 1: Freeze product scope to grammar/vocab only

1. Edit file: english_foundation/content/cambridge_curriculum.json
- [ ] Confirm `framework` text is IELTS grammar/vocab aligned.
- [ ] Confirm `scope.enabled_tracks` contains exactly `grammar`, `vocab`.
- [ ] Confirm `scope.disabled` contains non-scope skills.

2. Edit file: english_foundation/api/learning_service.py
- [ ] Validate requested `track` must be `grammar` or `vocab`.
- [ ] Keep fallback payload aligned to IELTS grammar/vocab text.

3. Edit file: backend/src/routes/foundation.ts
- [ ] Return `400` when `track` is not `grammar` or `vocab`.

Acceptance check:
- [ ] GET `/api/v2/foundation/lesson?track=invalid&lessonId=...` returns 400.

---

### Task 2: Standardize curriculum ordering and metadata reliability

1. Edit file: english_foundation/content/cambridge_curriculum.json
- [ ] Ensure every lesson in `tracks.vocab` has `id, order, level, title, focus, objective`.
- [ ] Ensure every lesson in `tracks.grammar` has the same fields.
- [ ] Ensure `order` has no duplicates per track.

2. Edit file: english_foundation/api/learning_service.py
- [ ] Keep deterministic sorting by `order`, then `id`.
- [ ] Ensure `get_track_lesson_payload` selects lesson by `lessonId` and maps index correctly.

Acceptance check:
- [ ] GET `/api/v2/foundation/curriculum` returns strictly ordered lesson arrays.

---

### Task 3: Upgrade Vietnamese learning text quality in vocab seeds

1. Edit file: english_foundation/content/vocabulary_seed.json
- [ ] Convert `meaning_vi` and `phrase_meaning_vi` to natural Vietnamese with diacritics.
- [ ] Keep examples simple, practical, and IELTS-relevant where possible.
- [ ] Keep schema fields unchanged.

2. Edit file: english_foundation/db/bootstrap.py
- [ ] Keep current loading behavior (`utf-8-sig`) and seed insert stability.

Acceptance check:
- [ ] New bootstrap creates records with Vietnamese diacritics correctly.

---

### Task 4: Align lesson composition behavior with track intent

1. Edit file: english_foundation/core/lesson_engine.py
- [ ] Keep vocab lesson sequence: `word -> phrase -> grammar`.
- [ ] Keep grammar lesson sequence: `grammar -> word`.
- [ ] Ensure lesson composition is deterministic and stable for repeated requests.

2. Edit file: english_foundation/core/vocab_engine.py
- [ ] Ensure vocab selection respects level difficulty gates.

3. Edit file: english_foundation/core/grammar_engine.py
- [ ] Ensure grammar pattern selection respects level difficulty gates.

Acceptance check:
- [ ] Worker action `track_lesson` returns expected sequence per track.

---

### Task 5: Ensure backend bridge and API contracts are stable

1. Edit file: english_foundation/api/bridge_worker.py
- [ ] Keep actions: `curriculum`, `track_lesson`, `lesson`, `progress`.
- [ ] Keep BOM-safe input parsing and JSON-safe output.

2. Edit file: backend/src/services/foundationBridgeService.ts
- [ ] Keep bridge payload fields: `action`, `track`, `lessonId`, `learnerId`.
- [ ] Keep robust JSON parse and error handling.

3. Edit file: backend/src/routes/foundation.ts
- [ ] Verify contract:
  - [ ] GET `/curriculum`
  - [ ] GET `/lesson?track=&lessonId=&learnerId=`
  - [ ] GET `/progress?learnerId=`

Acceptance check:
- [ ] Worker smoke tests pass for `curriculum` and `track_lesson`.
- [ ] Route responses are JSON and non-empty for valid calls.

---

### Task 6: Sprint 1 UI readiness (Grammar/Vocab only)

1. Edit file: frontend/src/components/EnglishFoundationModule.tsx
- [ ] Home copy explicitly says IELTS Grammar + IELTS Vocabulary.
- [ ] Track chooser shows only two buttons: IELTS Vocabulary, IELTS Grammar.
- [ ] Track list renders lesson `order | id | title`.
- [ ] Lesson screen shows lesson meta and sequence output.
- [ ] Remove/avoid references to other skills in this module.

2. Edit file: frontend/src/services/apiService.ts
- [ ] Keep methods:
  - [ ] `getFoundationCurriculum`
  - [ ] `getFoundationTrackLesson`
  - [ ] `getFoundationProgress`

Acceptance check:
- [ ] User can go Home -> Track -> Lesson -> Progress with no broken state.

---

### Task 7: Verification tasks (must run before merge)

1. Run backend check
- [ ] Command: `Set-Location backend; npx tsc --noEmit 2>&1; Write-Output "EXIT_CODE:$LASTEXITCODE"`
- [ ] Expect: `EXIT_CODE:0`

2. Run frontend tests
- [ ] Command: `Set-Location frontend; $env:CI='true'; npx react-scripts test --watch=false`
- [ ] Expect: all tests pass.

3. Run frontend production build
- [ ] Command: `Set-Location frontend; $env:CI='true'; npx react-scripts build`
- [ ] Expect: `Compiled successfully`.

4. Run worker smoke tests
- [ ] Command: `Set-Location .; $json='{"action":"curriculum"}'; $json | py english_foundation\api\bridge_worker.py`
- [ ] Command: `Set-Location .; $json='{"action":"track_lesson","track":"grammar","lessonId":"GR-A1-01","learnerId":1}'; $json | py english_foundation\api\bridge_worker.py`
- [ ] Expect: `ok: true` with non-empty `data`.

---

## 3. Commit Plan (Sprint 1)

- [ ] Commit A: `chore(foundation): lock scope to IELTS grammar and vocab only`
  - Files: learning_service.py, foundation.ts, curriculum json (scope metadata)

- [ ] Commit B: `feat(foundation): refine curriculum order and IELTS-aligned lesson metadata`
  - Files: curriculum json, lesson_engine.py (if changed), related service sort logic

- [ ] Commit C: `feat(foundation-ui): polish IELTS grammar/vocab track flow`
  - Files: EnglishFoundationModule.tsx, apiService.ts

- [ ] Commit D: `chore(foundation): improve Vietnamese vocab seed quality`
  - Files: vocabulary_seed.json (+ bootstrap only if needed)

---

## 4. Risk Notes

- Keep all changes additive/controlled; do not re-introduce old lexical complexity.
- Do not add non-scope features in Sprint 1.
- If curriculum grows quickly, maintain strict `order` uniqueness per track.
