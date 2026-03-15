# Lexical Engine Detailed Report (2026-03-15)

## 1) Executive Summary
Lexical Engine is a local-first English vocabulary learning subsystem for SoulFriend with six standalone functional areas:
- quiz
- memory
- audio playback
- microphone recording
- whisper transcription
- pronunciation scoring

The system is designed around a Tkinter desktop app, SQLite persistence, and optional local speech stack (sounddevice + openai-whisper + ffmpeg).

Current status snapshot in this workspace:
- Seed lexicon file present: 381 entries
- Benchmark report present: yes
- Latest benchmark: 20 items, passed = true, avg score = 95.9, pass rate = 0.95
- Runtime DB file currently absent until app bootstrap runs table creation

## 2) Project Structure And Responsibilities

### 2.1 Entry And Bootstrapping
- main.py
  - Adds project root to Python path
  - Launches app.ui.app_window.run
- app/ui/app_window.py
  - Calls create_tables then load_seed
  - Starts AppWindow Tk main loop

Boot order:
1. Schema migration and table creation
2. Seed loading (idempotent by word uniqueness)
3. UI initialization and screen navigation

### 2.2 Core Learning Modules
- app/core/quiz_engine.py
  - Builds quiz items with CEFR-aware distractors
  - Produces learn batch and review batch
  - Updates memory strength on each answer
  - Delegates scheduling persistence to review scheduler
- app/core/memory_engine.py
  - Pure SM-2 inspired computation
  - Calculates next interval/ease and review timestamps (UTC)
- app/core/review_scheduler.py
  - Gets due/new words
  - Persists next_review, interval_days, ease_factor
- app/core/difficulty_engine.py
  - Session composition policy: due words first, then new words
- app/core/pronunciation_scoring.py
  - Normalization + multi-factor scoring (char/ending/stress/phrase)
  - Weighted final score and coaching feedback

### 2.3 Speech Modules
- app/speech/audio_player.py
  - Local WAV naming and playback
  - Safe fallback behavior when file/backend missing
- app/speech/recorder.py
  - Local mic recording state machine
  - Silence gate to reject empty/near-silent recordings
  - Replay support
- app/speech/whisper_engine.py
  - Optional Whisper wrapper
  - ffmpeg readiness checks and imageio-ffmpeg shim fallback
  - Safe error modes when unavailable

### 2.4 Data Layer
- app/db/schema.py
  - Database connection setup
  - Table creation + progress table migration columns
- app/db/repository.py
  - Single query/write authority
  - Vocabulary/progress/pronunciation history APIs
  - Trend and recommendation analytics queries
- app/db/seed_loader.py
  - Loads data/lexicon_seed/words.json into vocabulary table

### 2.5 UI Modules
- app/ui/app_window.py
  - Home, quiz, review, pronunciation, progress, result screens
  - Navigation and session lifecycle
- app/ui/quiz_screen.py
- app/ui/review_screen.py
- app/ui/pronunciation_screen.py
- app/ui/progress_screen.py

## 3) Standalone Module Coverage (Requested Set)

### 3.1 quiz
- Source: app/core/quiz_engine.py
- Independent role: question generation and answer submission updates
- Depends on: repository + review_scheduler interfaces

### 3.2 memory
- Source: app/core/memory_engine.py
- Independent role: pure scheduling math without DB/UI side effects

### 3.3 audio
- Source: app/speech/audio_player.py, app/speech/audio_validator.py
- Independent role: playback and file validation behavior

### 3.4 mic
- Source: app/speech/recorder.py
- Independent role: recording lifecycle and gatekeeping invalid audio

### 3.5 whisper
- Source: app/speech/whisper_engine.py
- Independent role: transcription wrapper with graceful fallback

### 3.6 score
- Source: app/core/pronunciation_scoring.py
- Independent role: deterministic pronunciation scoring and rubric outputs

All six modules are importable independently and covered by focused tests.

## 4) Runtime Functional Flows

### 4.1 Learn And Review Flow
1. User starts Learn or Review from home
2. Batch assembled by quiz_engine (and due scheduler for review)
3. User selects answer
4. quiz_engine.submit_answer updates memory_strength and counters
5. review_scheduler computes next interval/ease and next_review
6. repository persists progress
7. Result screen displays session accuracy

### 4.2 Pronunciation Flow
1. User enters target word and starts recording
2. recorder checks microphone availability
3. On stop, recorder applies silence gate:
   - no frames => reject
   - duration below min threshold => reject
   - signal peak below silence threshold => reject
4. Valid WAV saved to assets/recordings
5. whisper_engine transcribes audio if backend ready
6. pronunciation_scoring computes score + feedback + rubric sub-scores
7. repository.insert_pronunciation_history persists attempt telemetry

### 4.3 Progress Analytics Flow
1. progress_screen requests metrics from repository
2. repository computes:
   - total attempts, 7-day attempts, active days
   - average scores for all/7-day/previous 7-day
   - trend delta and direction
   - streak days
   - top rising/falling words
   - practice recommendations
3. UI renders KPI labels, mini chart, trend lists, and recommendation list

### 4.4 Whisper Benchmark Flow
1. scripts/run_whisper_benchmark.py loads manifest (array or object.items)
2. Validates minimum benchmark size (20)
3. Runs transcription on each item via WhisperEngine
4. Scores each item via pronunciation_scoring
5. Produces summary and pass/fail by configured thresholds
6. Writes JSON report:
   - assets/whisper_benchmark/reports/latest.json
   - assets/whisper_benchmark/reports/history/benchmark_TIMESTAMP.json

## 5) Data Model And Persistence

Database path:
- data/lexical_engine.db

### 5.1 vocabulary
Main lexicon table with linguistic metadata:
- word, ipa, meaning_vi, cefr_level
- difficulty_score, pronunciation_difficulty
- emotion_tag, topic_tag
- created_at, updated_at

### 5.2 progress
Learning memory state per word:
- memory_strength, correct_count, wrong_count
- last_reviewed
- spaced repetition fields: next_review, interval_days, ease_factor

### 5.3 pronunciation_history
Speech attempt telemetry:
- target_word, recognized_text
- score, feedback, rubric_json
- audio_path, transcription_model
- created_at

## 6) Dependency And Runtime Model

Defined in requirements.txt:
- Core test/runtime: pytest
- Mic capture: sounddevice, numpy
- Transcription: openai-whisper, imageio-ffmpeg
- Whisper runtime pins: torch, tiktoken, numba, llvmlite, regex, tqdm

Operational principle:
- Learning and DB can run without Whisper stack
- Pronunciation transcription degrades gracefully when Whisper unavailable
- Mic flow blocks invalid silent captures via silence gate

## 7) Scripts And Operations Runbook

### 7.1 Health Checks
- scripts/check_microphone.py
- scripts/check_whisper_backend.py

### 7.2 Benchmark Execution
- scripts/run_whisper_benchmark.py
Configurable thresholds:
- pass-score
- min-avg-score
- min-pass-rate
Report controls:
- report-json
- report-history-dir
- no-report

### 7.3 Typical Operator Sequence
1. Install dependencies
2. Run microphone and whisper checks
3. Launch app and verify create_tables + load_seed
4. Record pronunciation attempts
5. Run benchmark and inspect latest + history reports

## 8) Quality Assurance Status

Focused module tests exist for requested standalone set:
- tests/test_quiz_engine.py
- tests/test_memory_engine.py
- tests/test_audio_player.py
- tests/test_recorder.py
- tests/test_whisper_engine.py
- tests/test_pronunciation_scoring.py

Additional coverage includes:
- DB operations and analytics
- progress screen behavior
- benchmark script behavior
- pronunciation scoring stability

Recent focused execution result in this environment:
- 51 passed for quiz/memory/audio/mic/whisper/score test set

## 9) Known Constraints And Operational Notes

1. SQLite DB file is created at runtime bootstrap. If app not started, DB may not exist yet.
2. Whisper requires ffmpeg access at runtime; wrapper attempts automatic shim path setup.
3. Benchmark quality is only meaningful when audio files contain real speech signal.
4. Silence gate threshold and minimum duration are configurable in recorder initialization.
5. Playback currently uses Windows winsound backend behavior.

## 10) Recommended Next Roadmap Steps

1. Public API index layer
- Add explicit package-level exports for six standalone modules to formalize plugin boundaries.

2. Structured observability
- Add lightweight JSON logging for recorder/whisper/score pipeline outcomes and errors.

3. Benchmark governance
- Add CI check using benchmark script with stable fixture set and threshold policy.

4. Data lifecycle
- Add retention/archival policy for pronunciation_history and recordings folder.

5. Packaging and distribution
- Add executable packaging profile and operator-friendly start scripts for non-dev usage.

## 11) Conclusion
Lexical Engine already has a clear standalone modular architecture for quiz, memory, audio, mic, whisper, and score; plus integrated UI and analytics workflow. It is currently operational with validated benchmark pass and test coverage for the requested module set. The next maturity jump is formal API boundaries, stronger observability, and automated benchmark governance.
