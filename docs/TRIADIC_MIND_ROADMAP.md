# SoulFriend Triadic Mind Engine - Technical Roadmap

## 1. Objective and Scope

This document defines the most feasible technical roadmap to evolve SoulFriend from a prompt-driven chatbot into a policy-adaptive therapeutic agent with controlled autonomy.

Core intent:
- Reduce dependency on static prompts.
- Increase structural reasoning and continuity across sessions.
- Keep strict safety and human override.

Out of scope:
- Fully autonomous AI without safety gating.
- Clinical diagnosis replacement.

## 2. Current Baseline (Already Implemented)

Current codebase already provides a strong foundation:
- V5 learning pipeline (capture -> evaluation -> feedback -> expert review -> curation -> improvement).
- Event-driven handlers and intervention flags.
- EBH scoring, warning, intervention policy, cooldown, dry-run, apply/revert/history.
- Expert-facing analytics and dashboards.

Key existing modules:
- `backend/src/services/ebhScoringService.ts`
- `backend/src/routes/v5/analytics.ts`
- `backend/src/routes/v5/learningPipeline.ts`
- `backend/src/services/memoryAwareChatbotService.ts`
- `backend/src/services/enhancedChatbotService.ts`

## 3. Target Architecture

Triadic Mind introduces 3 cognitive layers plus synthesis:

1. Einstein Layer (Structural Intelligence)
- Purpose: detect hidden stable patterns and trajectory laws.
- Inputs: interaction timeline, risk/sentiment transitions, recurrence loops.
- Outputs: structural hypotheses, trend confidence, mismatch signatures.

2. Musk Layer (Operational Intelligence)
- Purpose: propose smallest effective intervention.
- Inputs: structural hypotheses, current risk zone, user burden constraints.
- Outputs: low-cost intervention plan, expected short-horizon effect.

3. Jung Layer (Symbolic Depth Intelligence)
- Purpose: detect symbolic language, archetypal tension, identity conflict.
- Inputs: user message stream + memory continuity.
- Outputs: symbolic interpretation with confidence and evidence spans.

4. Triadic Synthesizer
- Purpose: merge outputs into one safe and coherent response plan.
- Inputs: Einstein + Musk + Jung outputs.
- Outputs: final response guidance, action hint, and metadata for logging.

Safety governor remains final gate before user-visible output.

## 4. Proposed Module Layout

Create new service modules:

- `backend/src/services/triadic/structuralEngine.ts`
- `backend/src/services/triadic/operationalReducer.ts`
- `backend/src/services/triadic/symbolicInterpreter.ts`
- `backend/src/services/triadic/triadicSynthesizer.ts`
- `backend/src/services/triadic/triadicTypes.ts`
- `backend/src/services/triadic/triadicGuardrails.ts`

Integration points:
- Primary runtime integration in `enhancedChatbotService`.
- Memory context enrichment in `memoryAwareChatbotService`.
- Telemetry capture into `InteractionEvent` metadata.
- Analytics exposure via `v5/analytics` endpoints.

## 5. Data Contract (MVP)

Recommended per-turn metadata (stored under interaction metadata):

- `triadic.structural`:
  - `hypotheses[]`
  - `trendType`
  - `confidence`

- `triadic.operational`:
  - `microIntervention`
  - `expectedDelta`
  - `confidence`

- `triadic.symbolic`:
  - `symbolicDensity`
  - `archetypeCandidates[]`
  - `identityConflict`
  - `confidence`
  - `evidenceSpans[]`

- `triadic.synthesis`:
  - `selectedStrategy`
  - `safeToUse`
  - `reasoningSummary`

## 6. Runtime Gating Rules (Critical)

Jung/symbolic mode should only activate when all are true:
- Symbolic density >= threshold.
- Identity-language cues present.
- Repetition over recent window.
- Current risk not in crisis override mode.

Hard constraints:
- No deterministic archetype claims.
- No diagnostic language.
- No mystical framing.
- Always produce confidence + fallback neutral phrasing.

## 7. Implementation Phases

### Phase 0 - Stabilize Baseline (1-2 weeks)

Tasks:
- Keep EBH Phase 1-3 in production monitoring.
- Freeze schemas and telemetry naming.
- Add baseline dashboards for false-positive and intervention efficacy.

Exit criteria:
- 2 weeks stable with no severe regressions.

### Phase 1 - Triadic MVP in Shadow Mode (2-4 weeks)

Tasks:
- Implement triadic modules with no user-visible effect.
- Run inference in shadow; store metadata only.
- Add analytics endpoint for triadic internal inspection.

Exit criteria:
- Triadic outputs generated consistently.
- No performance/SLO impact beyond target envelope.

### Phase 2 - Controlled Synthesis Rollout (4-8 weeks)

Tasks:
- Enable synthesis output for limited traffic (canary).
- Introduce one-pivot response rule from operational layer.
- Keep safety governor precedence.

Exit criteria:
- Improved helpfulness vs baseline.
- No safety metric degradation.

### Phase 3 - Policy Learning (8-12 weeks)

Tasks:
- Batch policy updates from user feedback + expert review.
- Automatic candidate evaluation with rollback.
- Continue cooldown and audit constraints.

Exit criteria:
- Candidate models outperform baseline out-of-sample.
- Rollback tested and verified.

## 8. KPI and Evaluation Plan

Primary KPIs:
- User helpfulness rate.
- Positive emotion shift rate.
- Escalation precision/recall (high-risk zones).
- Contradiction rate across sessions.
- Expert override frequency.

Safety KPIs:
- False-positive crisis alerts.
- False-negative crisis misses.
- Unsafe response incidents.

Operational KPIs:
- p95 latency overhead from triadic modules.
- Event processing success rate.
- Audit completeness for apply/revert actions.

## 9. Risk Register and Mitigations

1. Over-interpretation risk (symbolic layer)
- Mitigation: strict gating, confidence threshold, evidence spans, neutral fallback.

2. Persona drift
- Mitigation: memory continuity checks and contradiction detector.

3. Policy drift from online learning
- Mitigation: batch learning only, canary rollout, hard rollback.

4. Latency increase
- Mitigation: shadow mode profiling, timeout budgets, graceful fallback.

5. Expert overload from warnings
- Mitigation: cooldown, deduplication, severity-based routing.

## 10. Minimum Production Readiness Checklist

Before broad rollout:
- Unit tests for each triadic module.
- Route integration tests for dry-run/apply/revert/history.
- Full backend regression pass.
- Audit logs verified in production.
- On-call playbook for rollback.

## 11. First Sprint Backlog (Actionable)

Sprint goal: Phase 1 shadow-mode operational.

- [x] 1. Add triadic type contracts and module skeletons.
- [x] 2. Implement structural feature extraction from existing interaction timeline.
- [x] 3. Implement symbolic density scorer and archetype candidate detector (read-only).
- [x] 4. Implement operational micro-intervention selector (read-only).
- [x] 5. Add synthesizer with safety-neutral fallback.
- [x] 6. Log triadic metadata into interaction events.
- [x] 7. Create `/api/v5/analytics/triadic/user/:userId` internal endpoint.
- [x] 8. Add tests and performance budget checks.

Status note:
- Item 8 completed: route/service tests are in place and p95 latency budget enforcement gate is implemented.

## 12. Decision Gate

Proceed to user-visible rollout only when:
- Safety KPIs hold or improve.
- Helpfulness KPIs improve with significance.
- Expert panel signs off on response quality.
- Rollback tested in staging and production simulation.

## 13. Implementation Progress Tracker (Living)

Last updated: 2026-03-14

Legend:
- Completed: implemented and validated in current backend.
- Partial: implemented in part, or lacking formal exit/gate proof.
- Not started: planned but not implemented yet.

### 13.1 Phase Status

| Phase | Status | Notes |
| --- | --- | --- |
| Phase 0 - Stabilize Baseline | Partial | Baseline exists, but 2-week explicit stability gate is not yet recorded here. |
| Phase 1 - Triadic MVP in Shadow Mode | Completed | Triadic modules, shadow inference, metadata storage, and internal analytics endpoints are in place. |
| Phase 2 - Controlled Synthesis Rollout | Partial | Canary gate + KPI auto-disable + canary exposure audit events are implemented; rollout is still controlled and not broad. |
| Phase 3 - Policy Learning | Not started | No triadic-specific batch policy learning + candidate rollback loop yet. |

### 13.2 Sprint Tracking Source of Truth

- First Sprint item-by-item progress is tracked in Section 11.
- Current sprint summary: 8/8 done.
- Tests are passing for triadic route/service shadow suites.

### 13.3 Current Integration Notes

- Runtime flow currently attaches triadic shadow metadata via V5 integration capture path.
- This is functionally aligned with Phase 1 shadow-mode intent.
- Architecture wording in Section 4 should be interpreted as logical integration ownership; practical invocation currently happens through controller -> V5 integration path.

### 13.4 Next Gate to Unlock Phase 2

Before enabling user-visible synthesis canary:
- Define canary cohort and traffic percentage.
- Add safety and helpfulness KPI guard thresholds.
- Add rollback drill evidence for triadic-enabled path.

### 13.5 Recent Execution Notes (2026-03-14)

- Added Phase 2 canary scaffold in runtime chat flow:
  - feature flag: `V5_TRIADIC_CANARY_ENABLED`
  - traffic gate: `V5_TRIADIC_CANARY_PERCENT`
  - safety guard: high-risk users are excluded from canary synthesis path.
- Added one-pivot response hook for canary cohort (safe scaffolding).
- Added route tests for canary-in-cohort and high-risk-block behaviors.

### 13.6 Recent Execution Notes (2026-03-15)

- Added canary KPI guard thresholds with rolling-window evaluation:
  - min helpfulness threshold
  - max unsafe-rate threshold
  - auto-disable canary when threshold is violated
- Added audit events for canary decisioning and governance:
  - `triadic.canary.exposure`
  - `triadic.canary.kpi_breached`
- Added tests for KPI guard behavior and audit event publication.
- Added internal real-time canary KPI dashboard snapshot endpoint for expert sign-off:
  - `/api/v5/analytics/triadic/canary/status`
- Added internal time-series endpoint for canary KPI trend monitoring:
  - `/api/v5/analytics/triadic/canary/status/history`
- Added bucketed aggregate endpoint for dashboard-friendly trend rendering:
  - `/api/v5/analytics/triadic/canary/status/history/aggregate` (supports 5m/15m/60m buckets + `granularity=auto`)
- Added internal decision-gate readiness endpoint (pass/fail + reasons) for expert sign-off:
  - `/api/v5/analytics/triadic/canary/decision-gate` (includes explainable `checks[]` breakdown and prioritized `recommendedActions[]` with owner + ETA + status)
- Added internal action execution endpoint for decision-gate workflow loop:
  - `POST /api/v5/analytics/triadic/canary/decision-gate/action-status` (updates action status with audit trail + event publication)
- Added internal manual recovery endpoint to support rollback drill evidence:
  - `POST /api/v5/analytics/triadic/canary/decision-gate/re-enable` (requires reason, writes audit log, publishes recovery event, and returns updated snapshot/readiness)
- Added internal rollback drill report endpoint for manual recovery governance:
  - `GET /api/v5/analytics/triadic/canary/decision-gate/re-enable/history` (supports `limit`, optional `since/until`, and returns actor-level summary for expert dashboard)
- Added hard safety gate for manual re-enable:
  - re-enable is blocked when rolling unsafe-rate still exceeds configured threshold.
- Added explicit manual re-enable readiness contract:
  - `getManualReenableReadiness()` now returns pass/fail + checks + reasons and is surfaced via re-enable response and rollback-history report.
- Added internal action timeline endpoint for decision-gate workflow tracking:
  - `GET /api/v5/analytics/triadic/canary/decision-gate/action-status/history` (supports `limit`, optional `actionId`, `since/until`, cursor pagination via `cursor` + `nextCursor`, `sort=newest|oldest`, `includeSummary=true`, and `groupBy=owner|priority|status` for quick dashboard breakdown)
- Added expert-facing dashboard consumer for manual re-enable readiness analytics:
  - `frontend/src/components/ImpactDashboard.tsx` now fetches `/api/v5/analytics/triadic/canary/decision-gate/re-enable/history` and renders:
    - readiness pass-rate,
    - fail reason distribution (top reasons),
    - actor-level readiness quality (top actors).
- Added focused frontend tests for triadic readiness widget behavior:
  - `frontend/src/components/ImpactDashboard.test.tsx` covers:
    - data-available rendering (pass-rate + fail reasons + actor readiness),
    - endpoint-unavailable fallback rendering.
