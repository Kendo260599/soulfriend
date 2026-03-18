PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS vocabulary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL UNIQUE,
  ipa TEXT NOT NULL,
  meaning_vi TEXT NOT NULL,
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  example_sentence TEXT NOT NULL,
  collocation TEXT NOT NULL,
  topic_ielts TEXT,
  cefr_target TEXT,
  coca_frequency_band TEXT,
  source_standard TEXT
);

CREATE TABLE IF NOT EXISTS phrase_units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vocab_id INTEGER NOT NULL,
  phrase TEXT NOT NULL,
  meaning_vi TEXT NOT NULL,
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  FOREIGN KEY (vocab_id) REFERENCES vocabulary(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS grammar_units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern TEXT NOT NULL,
  example TEXT NOT NULL,
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5)
);

CREATE TABLE IF NOT EXISTS progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  learner_id INTEGER NOT NULL DEFAULT 1,
  item_id INTEGER NOT NULL,
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  memory_strength REAL NOT NULL DEFAULT 0.0,
  streak_correct INTEGER NOT NULL DEFAULT 0,
  last_result INTEGER,
  last_reviewed_at TEXT,
  review_due_at TEXT
);

CREATE TABLE IF NOT EXISTS learner_profile (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lexical_level REAL NOT NULL DEFAULT 0.0,
  grammar_level REAL NOT NULL DEFAULT 0.0
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_vocab_difficulty ON vocabulary(difficulty);
CREATE INDEX IF NOT EXISTS idx_vocab_source ON vocabulary(source_standard);
CREATE INDEX IF NOT EXISTS idx_vocab_topic ON vocabulary(topic_ielts);
CREATE INDEX IF NOT EXISTS idx_progress_review ON progress(learner_id, review_due_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_progress_learner_item ON progress(learner_id, item_id);
