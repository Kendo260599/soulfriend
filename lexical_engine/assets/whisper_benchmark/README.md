# Whisper Benchmark Dataset

Place benchmark audio files and manifest here.

## Required files

- `manifest.json`
- WAV files referenced by manifest

## Manifest format

```json
[
  { "word": "trust", "audio": "trust.wav" },
  { "word": "hope", "audio": "hope.wav" }
]
```

Also accepted:

```json
{
  "items": [
    { "word": "trust", "audio": "trust.wav" },
    { "word": "hope", "audio": "hope.wav" }
  ]
}
```

Rules:
- At least 20 entries for Phase E stabilization run.
- `audio` is relative to this folder.
- Audio should be mono or stereo WAV readable by ffmpeg.

## Run benchmark

From `lexical_engine` folder:

```powershell
python scripts/run_whisper_benchmark.py
```

Optional:
- `--model base|small|medium`
- `--min-avg-score 60`
- `--min-pass-rate 0.6`
- `--pass-score 70`
- `--report-json assets/whisper_benchmark/reports/latest.json`
- `--report-history-dir assets/whisper_benchmark/reports/history`
- `--no-report`

## Report output

By default, each run writes:
- Latest report: `assets/whisper_benchmark/reports/latest.json`
- Timestamped archive report: `assets/whisper_benchmark/reports/history/benchmark_*.json`
