export type WordItem = {
  id: number;
  word: string;
  ipa: string;
  meaning_vi: string;
  collocation: string;
  example_sentence: string;
  difficulty: number;
};

export type PhraseItem = {
  id: number;
  vocab_id: number;
  phrase: string;
  meaning_vi: string;
  difficulty: number;
};

export type GrammarItem = {
  id: number;
  pattern: string;
  example: string;
  difficulty: number;
};

export type LessonPayload = {
  words: WordItem[];
  phrases: PhraseItem[];
  grammar: GrammarItem;
};

export type ProgressPayload = {
  learned_words: number;
  weak_words: number;
  grammar_completed: number;
};
