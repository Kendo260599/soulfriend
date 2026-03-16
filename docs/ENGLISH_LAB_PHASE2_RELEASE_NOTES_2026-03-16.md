# English Lab Phase-2 Release Notes (2026-03-16)

## Release Summary

This release finalizes canonical Phase-2 integration for English Lab across Python worker, backend bridge routes, and frontend rendering/interactions.

## Delivered Scope

- Canonical Phase-2 endpoints consumed by frontend:
  - `GET /api/v2/english-lab/phase2/status`
  - `GET /api/v2/english-lab/phase2/home`
- UI stage banner with lock/unlock states, thresholds, and signals
- Phrase and grammar preview rendering
- Practice interactions for phrase and grammar items
- Canonical threshold gating for practice actions
- Stable fallback behavior under endpoint failures
- Telemetry metadata in Phase-2 responses
- Backend bridge optimization for repeated requests:
  - short TTL cache
  - in-flight request de-duplication for `phase2-status/home`

## Test Evidence

### Frontend

- `frontend/src/components/EnglishLearningLab.test.tsx`
  - 3/3 passing
  - covers stage rendering, fallback defaults, and threshold-gated interactions

### Backend

- `backend/tests/routes/englishLab.phase2Status.test.ts` pass
- `backend/tests/routes/englishLab.phase2Home.test.ts` pass
- `backend/tests/routes/englishLab.integrationSmoke.test.ts` pass

Route suite result: 9/9 tests passing.

### Python Canonical

- `lexical_engine/tests/test_phase2_engines_contracts.py` pass
- `lexical_engine/tests/test_progress_recommendation_service_contracts.py` pass

Focused canonical result: 8/8 tests passing.

### TypeScript Check

- Backend TypeScript check result: `EXIT_CODE:0`

## Rollout Assets

- Canary checklist prepared:
  - `docs/ENGLISH_LAB_PHASE2_CANARY_CHECKLIST.md`

## Risk Notes

- Backend bridge cache is in-memory and per-process; behavior is expected in horizontal scale but cache is not shared across instances.
- Canary monitoring should focus on endpoint latency/error rates and fallback activation ratio.

## Final Status

- Phase-2 workstream items completed through canary preparation and release documentation.
- Ready for staged canary rollout using the checklist.
