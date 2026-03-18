# QA Report: English Foundation Vocab UI Flow

Date: 2026-03-16
Scope: Home -> Track -> Lesson -> Vocab Check -> Progress
Status: PASS

## Test method

- Backend compile check: TypeScript noEmit.
- Frontend compile check: production build.
- Service smoke flow: simulated user journey through learning service APIs with real DB.

## Checklist results

1. Home load
- API data returned for lesson, progress, curriculum.
- Sample words from home lesson: friend, routine, breakfast.
- Curriculum counts: vocab=28, grammar=24.

2. Track selection
- Selected lesson: VOC-A2-05.
- Expected topic: Technology and Internet.
- Returned words: technology, application, privacy.
- Result: topic-based vocab selection works.

3. Lesson flow
- Lesson payload includes words/phrases/grammar and sequence for rendering.
- Result: PASS.

4. Vocab check submit
- Submitted 3 answers (2 correct, 1 incorrect).
- Response received: score=67, weak_items returned, recommendation=review_weak_words.
- Result: PASS.

5. Progress update
- Progress updated after vocab check.
- Before check: learned_words=4, weak_words=2, grammar_completed=10.
- After check: learned_words=6, weak_words=3, grammar_completed=10.
- Result: PASS.

## Build/compile status

- Backend TypeScript check: PASS.
- Frontend build: PASS.

## Notes

- Legacy vocabulary rows were removed via safe migration script.
- Active vocabulary pool now serves curated topic-aligned entries.
- No commit performed in this step.
