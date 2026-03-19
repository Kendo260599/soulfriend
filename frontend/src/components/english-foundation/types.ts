// Shared TypeScript types for the English Foundation module

export type Track = 'grammar' | 'vocab';

export type WordItem = {
  id: number;
  word: string;
  part_of_speech?: string;
  ipa: string;
  meaning_vi: string;
  collocation: string;
  example_sentence: string;
  synonyms?: string;
  collocations_json?: string;
};

export type PhraseItem = {
  id: number;
  phrase: string;
  meaning_vi: string;
};

export type GrammarItem = {
  id: number;
  pattern: string;
  example: string;
  explanation_vi?: string;
  usage_note?: string;
};

export type LessonPayload = {
  is_locked?: boolean;
  lock_reason?: string;
  track?: Track;
  lesson_meta?: {
    id?: string;
    level?: string;
    title?: string;
    focus?: string;
    objective?: string;
    topic_ielts?: string;
  };
  sequence?: string[];
  words: WordItem[];
  phrases: PhraseItem[];
  grammar: GrammarItem;
};

export type CurriculumLesson = {
  id: string;
  order?: number;
  level: string;
  title: string;
  focus: string;
  objective: string;
};

export type CurriculumPayload = {
  framework: string;
  tracks: {
    vocab: CurriculumLesson[];
    grammar: CurriculumLesson[];
  };
};

export type ProgressPayload = {
  learned_words: number;
  weak_words: number;
  grammar_completed: number;
  due_today?: number;
  curr_streak?: number;
};

export type VocabCheckAnswer = {
  wordId: number;
  correct: boolean;
};

export type VocabCheckResult = {
  score: number;
  correct: number;
  total: number;
  weak_items: number[];
  recommended_review: string;
  recommended_next?: string;
};

export type GrammarCheckResult = {
  grammar_id: number;
  correct: boolean;
  grammar_level_before: number;
  grammar_level_after: number;
  grammar_level_percent: number;
  recommended_next: string;
};

export type ReviewItem = {
  id: number;
  word: string;
  part_of_speech?: string;
  ipa?: string;
  meaning_vi: string;
  collocation?: string;
  example_sentence?: string;
  topic_ielts?: string;
  quiz_type?: 'flashcard' | 'multiple_choice' | 'fill_blank' | 'sentence_write';
  options?: string[];
};

export type ReviewPayload = {
  learner_id: number;
  mode: 'due' | 'weak' | 'fresh';
  items: ReviewItem[];
};

export type View = 'home' | 'track' | 'lesson' | 'vocab_check' | 'grammar_check' | 'review' | 'progress' | 'ielts_listening';

export type LessonCard = {
  key: string;
  title: string;
  main: string;
  sub: string;
  helper: string;
  audioText?: string;
};
