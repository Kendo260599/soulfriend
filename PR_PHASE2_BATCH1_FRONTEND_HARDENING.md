# PR Draft - Phase 2 Batch 1

## Title
GameFi Phase 2 Batch 1: frontend stale-request cancellation and per-action submit locks

## Summary
This batch hardens GameFi frontend interaction safety under rapid user actions and network instability by:
- preventing duplicate submits at action granularity
- cancelling stale fetches in Quests tab
- normalizing API post error payload handling in context layer

## Scope
### Updated files
- frontend/src/components/gamefi/QuestsTab.tsx
- frontend/src/components/gamefi/BehaviorTab.tsx
- frontend/src/components/gamefi/GameFiContext.tsx
- frontend/e2e/gamefi.network.chaos.spec.ts

## Implemented changes
1. QuestsTab hardening
- per-quest lock set (`submittingQuestIds`) instead of one global boolean
- stale-request cancellation with `AbortController` for:
  - adaptive recommendations
  - quest DB fetch
  - quest history fetch
- cleanup abort on unmount to avoid stale response override

2. BehaviorTab hardening
- per-step ritual lock set (`checkin`, `reflection`, `community`)
- per-weekly-challenge lock set (by challenge id)
- prevents accidental duplicate submit under rapid clicks

3. GameFiContext API robustness
- `apiPost` now returns deterministic `{ success: false, error }` on:
  - network failure
  - invalid JSON response
  - non-OK response without parseable payload

4. E2E chaos spec resilience
- updated error assertion to accept normalized network-error toast text

## Validation
- Ran full publisher regression suite:
  - `npm run e2e:publisher`
  - Result: 5 passed, 0 failed

## Risk and mitigation
Risk:
- stricter in-flight guards can make repeated clicks feel less responsive.

Mitigation:
- action remains visible and existing reward/toast feedback confirms progress.
- per-action locking keeps unrelated actions available.

## Next batch candidates (Phase 2)
- add AbortController support for additional non-Quests GET paths
- standardize retryable/non-retryable UI message taxonomy
- add focused tests for stale-response race scenarios in unit/integration layer
