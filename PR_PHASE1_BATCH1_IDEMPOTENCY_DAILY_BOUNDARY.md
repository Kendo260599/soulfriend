# PR Draft - Phase 1 Batch 1

## Title
GameFi Phase 1 Batch 1: enforce quest idempotency and UTC daily boundary

## Summary
This PR hardens core GameFi completion logic by:
- preventing duplicate rewards under concurrent completion requests
- enforcing UTC-based daily quest boundary validation
- preserving deterministic behavior for ritual and weekly reward grant

## Scope
### Backend logic changes
1. Added UTC daily boundary utility:
- backend/src/services/gamefi/dailyBoundary.ts

2. Hardened GameFi engine completion paths:
- backend/src/services/gamefi/gamefiEngine.ts

Implemented:
- in-flight lock guards for:
  - quest completion (daily and full quest routes share lock key)
  - daily ritual completion
  - weekly challenge completion
- UTC day key normalization via shared utility
- stale daily quest ID rejection for non-today daily quests
- daily reflection validation retained (requires journal text and minimum sentence count)
- restored daily quest history title/xp mapping using daily templates

### Regression tests
3. Added/updated route regression tests:
- backend/tests/routes/gamefi.test.ts

New assertions:
- stale daily quest IDs are rejected (HTTP 400)
- concurrent completion of same quest yields idempotent result (one success + one already completed)

## Why this change
- Closes race-condition window where parallel requests could duplicate reward grant.
- Aligns all daily quest boundary checks with UTC to avoid timezone/day rollover inconsistencies.
- Improves deterministic API behavior under retry storms and multi-tab interactions.

## Validation
Executed:
- backend TypeScript check: pass
- targeted integration tests: pass
  - backend/tests/routes/gamefi.test.ts -> 37 passed, 0 failed

## Risk and mitigation
Risk:
- stricter daily boundary may reject stale quest IDs previously accepted.

Mitigation:
- explicit error messaging for expired daily quest IDs
- regression coverage for stale-ID rejection and concurrent idempotency

## Rollback plan
- revert files in this PR:
  - backend/src/services/gamefi/dailyBoundary.ts
  - backend/src/services/gamefi/gamefiEngine.ts
  - backend/tests/routes/gamefi.test.ts

## Follow-up (next Phase 1 batches)
- add idempotency key persistence if cross-process execution is required
- expand staging tests with real backend traffic profile and retry storms
