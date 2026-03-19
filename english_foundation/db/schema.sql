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
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  explanation_vi TEXT,
  explanation_en TEXT,
  usage_note TEXT,
  native_example_vi TEXT
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
