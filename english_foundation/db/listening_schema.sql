-- Schema for the IELTS Listening Module 
-- Focused on Part 1 (Form Completion) and others

CREATE TABLE IF NOT EXISTS listening_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_num INTEGER NOT NULL, -- 1, 2, 3, or 4
  title TEXT NOT NULL, 
  context_description TEXT, -- e.g., "A phone call to a hotel booking agency"
  audio_url TEXT, -- URL or local path to the audio file
  audio_script TEXT, -- The entire transcript of the listening section
  duration_seconds INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS listening_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id INTEGER NOT NULL,
  question_num INTEGER NOT NULL, -- e.g., Question 1
  question_type TEXT NOT NULL, -- 'form_completion', 'multiple_choice', 'map_labeling'
  prompt TEXT NOT NULL, -- e.g., "Customer's first name: ____________"
  correct_answer_regex TEXT NOT NULL, -- e.g., "^(?i)(David|Dave)$"
  timestamp_hint INTEGER, -- Seconds into the audio where the answer appears
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (section_id) REFERENCES listening_sections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_listening_questions_section ON listening_questions(section_id);
