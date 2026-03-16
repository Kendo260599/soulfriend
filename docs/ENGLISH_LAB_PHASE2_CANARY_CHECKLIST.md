# English Lab Phase-2 Canary Rollout Checklist

## Scope

- Feature: canonical Phase-2 flow in English Lab (`phase2/status`, `phase2/home`, UI gating)
- Rollout type: staged canary with fast rollback
- Environment order: local -> staging -> production canary -> full rollout

## Entry Criteria

- Backend TypeScript check passes (`EXIT_CODE:0`)
- Route contract tests pass for:
  - `backend/tests/routes/englishLab.phase2Status.test.ts`
  - `backend/tests/routes/englishLab.phase2Home.test.ts`
  - `backend/tests/routes/englishLab.integrationSmoke.test.ts`
- Frontend component tests pass for:
  - `frontend/src/components/EnglishLearningLab.test.tsx`
- Canonical worker reachable and returns valid JSON for `phase2-status` and `phase2-home`

## Canary Config

- Start with 5% traffic for users with `userId` sampling key
- Hold period at each stage: 24h minimum
- Increase schedule:
  - Stage 1: 5%
  - Stage 2: 15%
  - Stage 3: 35%
  - Stage 4: 70%
  - Stage 5: 100%

## Observability Requirements

- Capture telemetry fields from API responses:
  - `telemetry.source`
  - `telemetry.endpoint`
  - `telemetry.fetchedAt`
  - `telemetry.requested`
- Monitor 95th percentile latency for:
  - `GET /api/v2/english-lab/phase2/status`
  - `GET /api/v2/english-lab/phase2/home`
- Monitor error rates:
  - 5xx on Phase-2 endpoints
  - frontend fetch failures/retries

## Guardrail Thresholds

- Endpoint 5xx error rate < 1.0%
- P95 latency:
  - `phase2/status` < 600ms
  - `phase2/home` < 800ms
- Frontend fallback mode activation < 2.0% sessions
- No increase in quiz-answer endpoint 5xx compared to pre-canary baseline

## Validation Steps Per Stage

1. Run smoke checks against canary slice:
   - quiz-next -> quiz-answer -> progress -> history -> phase2/status -> phase2/home
2. Validate UI behavior:
   - locked stage hides phrase/grammar practice buttons
   - unlocked stage shows practice buttons
   - stage badge and thresholds/signals render correctly
3. Validate contract stability:
   - default fallback payload exists when bridge payload is partial
   - telemetry object remains present

## Rollback Criteria

- Any threshold breach lasting >= 10 minutes
- Invalid JSON responses from canonical worker
- Contract mismatch causing frontend render breakages
- Regression in core quiz flow reliability

## Rollback Procedure

1. Set canary percentage to 0%
2. Verify new traffic uses pre-canary behavior
3. Keep Phase-2 endpoints enabled for diagnostics only
4. Collect:
   - failing request samples
   - worker stderr snippets
   - endpoint latency/error timeline
5. Open incident summary with owner and remediation ETA

## Exit Criteria for 100%

- All canary stages passed with no sustained threshold breach
- No open Sev-1/Sev-2 issues related to Phase-2
- Final regression check completed
- Release note prepared with endpoint/test evidence
