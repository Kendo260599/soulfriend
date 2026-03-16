# V2 Seed Pipeline Runbook

## Scope

This runbook describes operations for the V2 seed pipeline:
- regroup source words
- build lesson-unit seed payload
- import seed into V2 tables with safe modes
- validate report lineage integrity

## Core Commands

1. Dry-run import with automatic vocabulary seed:

```powershell
python scripts/run_v2_seed_pipeline.py --ensure-seed
```

2. Apply import:

```powershell
python scripts/run_v2_seed_pipeline.py --ensure-seed --apply
```

3. Clean replace then apply (V2 tables only):

```powershell
python scripts/run_v2_seed_pipeline.py --ensure-seed --replace-v2 --apply
```

4. Custom report folder and prefix:

```powershell
python scripts/run_v2_seed_pipeline.py --ensure-seed --report-dir data/reports/v2_seed_import_custom --report-prefix staging_
```

## Importer Flags

- `--ensure-seed`: preload vocabulary from seed when DB may be empty.
- `--replace-v2`: reset only `skills`, `skill_prerequisites`, `lesson_units` before import.
- `--apply`: commit changes; default is dry-run rollback.
- `--report-dir`: output directory for generated report JSON.
- `--report-prefix`: prefix for generated report filenames.
- `--report`: explicit report file path override.

## Report Fields

Each import report includes:
- `run_id`
- `previous_report`
- `lineage_depth`
- `lineage_chain_head`
- `report_version`
- `pipeline_version`
- `command_args`
- `runner_command_args`
- `seed_metadata` (`sha256`, `size_bytes`, `modified_at_utc`)
- detailed import counters and duplicate analysis

## Integrity Check

Validate report chain:

```powershell
python scripts/check_v2_report_integrity.py --report-dir data/reports/v2_seed_import --prefix staging_
```

## Release Validation

Run one-command release check:

```powershell
python scripts/validate_v2_release.py
```

## Operational Notes

- `--replace-v2` is blocked if `user_skill_mastery` has rows.
- Strict seeded mode for lesson path:
  - env: `LEXICAL_STRICT_SEEDED_MODE=1`
  - strict mode uses seeded lesson_units only and does not fallback to heuristic buckets.
