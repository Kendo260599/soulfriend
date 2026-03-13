# GameFi Fix Logic + Upgrade Plan

Date: 2026-03-13
Owner: GameFi Team
Status: Proposed for execution

## 1) Goal
- Fix remaining bugs with production impact.
- Harden game logic consistency (quest completion, rewards, progression, behavior loops).
- Upgrade architecture and quality gates for safer releases.

## 2) Current Baseline
- Browser publisher QA suite is green: 5/5 pass.
- Existing suite is strong for UI flows under deterministic mocked APIs.
- Remaining risk is primarily real-backend behavior, data consistency, and release hardening.

## 3) Priority Matrix

### P0 (must fix first)
1. Logic consistency under real backend latency/failure:
- duplicate reward prevention in race conditions
- quest state transitions under retry/reload/multi-tab
- daily reset consistency (UTC/local mismatch edge cases)

2. Data integrity:
- idempotent completion semantics across all completion endpoints
- persistence write-through correctness after event + quest + behavior updates

3. Crash/Blockers:
- runtime exceptions or dead-end UI states

### P1 (next)
1. Resilience and UX correctness:
- retry strategy standardization
- stale request cancellation
- clearer user messaging for partial failure

2. Balancing correctness:
- XP/reward distribution drift checks
- anti-farming guard tuning

### P2 (upgrade)
1. Architecture and observability:
- stronger API contract validation
- metrics, traces, release gates
- performance optimization and maintainability

## 4) Execution Plan by Phase

## Phase 0: Triage + Real-Backend Validation (1-2 days)
Deliverables:
- Defect backlog with severity (P0/P1/P2).
- Repro checklist using staging backend (non-mocked).
- Failure matrix: endpoint, symptom, impact, repro rate.

Tasks:
1. Run publisher scenarios against staging backend.
2. Capture API failures, inconsistent states, and timing-related issues.
3. Map each issue to owner and target sprint.

Acceptance:
- Each discovered issue has: repro steps, expected vs actual, severity, owner.

## Phase 1: Core Logic Fixes (3-5 days)
Target files:
- backend/src/services/gamefi/gamefiEngine.ts
- backend/src/services/gamefi/questSemanticRegistry.ts
- backend/src/controllers/gamefiController.ts
- backend/src/services/gamefi/persistence.ts

Tasks:
1. Enforce idempotency for quest/behavior completion:
- ensure repeated requests cannot grant duplicate reward.
- add explicit idempotency checks at controller + service boundary.

2. Harden quest transition handling:
- fail-safe on invalid transitions.
- clear semantic error messages for client handling.

3. Normalize date/day boundary:
- central utility for daily key and reset behavior.
- remove mixed local/UTC assumptions.

4. Persistence safety:
- verify save order and rollback behavior for partially failed operations.

Acceptance:
- No duplicate reward under spam click or retry storms.
- Daily logic remains consistent across timezone boundaries.
- All invalid transition paths return deterministic error payloads.

## Phase 2: Frontend Logic and State Hardening (2-4 days)
Target files:
- frontend/src/components/gamefi/GameFiContext.tsx
- frontend/src/components/gamefi/QuestsTab.tsx
- frontend/src/components/gamefi/BehaviorTab.tsx
- frontend/src/components/gamefi/DashboardTab.tsx
- frontend/src/components/ChatBot.tsx

Tasks:
1. Standardize in-flight locks and cancellation:
- per-action lock map instead of global lock where needed.
- AbortController for stale requests on tab switch/reload.

2. Consistent error UX:
- map backend validation errors to actionable user copy.
- unify transient error retry prompt.

3. Session robustness:
- harden quest_chat counters and sync behavior across tab focus changes.

Acceptance:
- No double submit under rapid interactions.
- No stale response overriding fresh state.
- User receives deterministic feedback for retryable vs non-retryable failures.

## Phase 3: Upgrade Architecture and Quality Gates (3-5 days)
Target files:
- frontend/playwright.config.ts
- frontend/e2e/helpers/gamefiMock.ts
- frontend/package.json
- CI workflow files (if present)

Tasks:
1. Upgrade test strategy:
- split publisher suite into smoke, regression, chaos, soak lanes.
- add staging profile run (real backend) as nightly/RC gate.

2. Contract hardening:
- add response schema validation at API boundary.
- detect backward-incompatible payload drift early.

3. Observability:
- add structured error tags by subsystem (quest, behavior, world, chat).
- add release dashboard for pass rate, flake rate, and error trends.

Acceptance:
- CI has mandatory GameFi gates before release.
- Contract violations fail fast in CI, not in production.

## Phase 4: Tuning and Product Upgrade (ongoing)
Tasks:
1. Reward economy tuning using telemetry.
2. Adaptive quest quality improvements (better recommendations under sparse history).
3. Performance tuning for low-end mobile.

Acceptance:
- Stable conversion and retention metrics for GameFi loops.
- Reduced user-facing error rate and improved completion rate.

## 5) KPI and Exit Criteria
- P0 open defects: 0
- Duplicate reward incidents: 0
- GameFi publisher suite pass rate: >= 98%
- Staging real-backend nightly pass rate: >= 95%
- Flaky test rate: <= 2%
- Critical regression escape to production: 0

## 6) Suggested Sprint Breakdown
Sprint A (week 1):
- Phase 0 + Phase 1
- Output: P0 resolved and validated

Sprint B (week 2):
- Phase 2 + Phase 3
- Output: hardened frontend logic + CI upgrade gates

Sprint C (week 3, optional):
- Phase 4 tuning and balancing

## 7) Immediate Next Actions (start now)
1. Open implementation branch for logic hardening.
2. Execute staging run of publisher suite and capture defect list.
3. Start Phase 1 fixes with idempotency and daily boundary normalization first.
4. Re-run full publisher suite and staging regression after each merged fix batch.
