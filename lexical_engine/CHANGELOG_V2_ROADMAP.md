# Changelog - V2 Roadmap Completion

## Version

- Pipeline version: `v2-seed-pipeline-2026-03-16`
- Report version: `2.0`

## Completed Areas

1. V2 import safety and control
- dry-run by default
- `--apply` commit mode
- `--replace-v2` scoped reset (`skills`, `skill_prerequisites`, `lesson_units`)
- guard against reset when `user_skill_mastery` contains data

2. Seed pipeline orchestration
- regroup script
- lesson-unit seed builder
- end-to-end runner script

3. Reporting and audit
- per-run JSON report history
- prefix-aware report naming
- command audit fields (`command_args`, `runner_command_args`)
- seed content metadata (`sha256`, `size_bytes`, `modified_at_utc`)
- lineage fields (`run_id`, `previous_report`, `lineage_depth`, `lineage_chain_head`)
- duplicate analysis detail in import report

4. Validation and governance
- report integrity checker script
- one-command release validation script
- focused CI workflow for lexical V2 pipeline

5. Lesson path behavior
- seeded lesson preference with fallback parity
- strict seeded mode support (`LEXICAL_STRICT_SEEDED_MODE`)

6. Tests
- V1 preservation tests
- V2 seed pipeline tests
- report lineage tests
- replace-v2 guard tests
- strict seeded/fallback parity tests

## Tag Preparation

Suggested release tag:

- `lexical-v2-roadmap-complete-2026-03-16`

Suggested commit message:

- `feat(lexical-v2): complete seed pipeline roadmap with audit lineage, integrity checks, strict seeded mode, and CI`

## Post-Tag Checklist

1. Run:
- `python scripts/validate_v2_release.py`

2. Verify latest report:
- under `data/reports/v2_seed_import/`
- `status=pass` from integrity checker

3. Confirm focused tests are green in CI workflow:
- `.github/workflows/lexical-v2-seed-ci.yml`
