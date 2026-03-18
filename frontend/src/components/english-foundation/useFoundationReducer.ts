import { useReducer } from 'react';
import {
  CurriculumPayload,
  GrammarCheckResult,
  LessonPayload,
  ProgressPayload,
  ReviewItem,
  Track,
  VocabCheckResult,
  View,
} from './types';

// ---- State ----
export type FoundationState = {
  view: View;
  lesson: LessonPayload | null;
  progress: ProgressPayload | null;
  curriculum: CurriculumPayload | null;
  selectedTrack: Track;
  selectedLessonId: string;
  loading: boolean;
  error: string;
  cardIndex: number;
  checkAnswers: Record<number, boolean>;
  checkResult: VocabCheckResult | null;
  grammarAnswer: boolean | null;
  grammarResult: GrammarCheckResult | null;
  reviewMode: 'due' | 'weak' | 'fresh';
  reviewItems: ReviewItem[];
  reviewAnswers: Record<number, boolean>;
  reviewResult: VocabCheckResult | null;
};

// ---- Actions ----
export type FoundationAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'LOAD_ALL_SUCCESS'; lesson: LessonPayload; progress: ProgressPayload; curriculum: CurriculumPayload; firstLessonId: string }
  | { type: 'LOAD_TRACK_SUCCESS'; lesson: LessonPayload; track: Track; lessonId: string }
  | { type: 'SET_VIEW'; view: View }
  | { type: 'SET_TRACK'; track: Track }
  | { type: 'SET_LESSON_ID'; id: string }
  | { type: 'SET_CARD_INDEX'; index: number }
  | { type: 'SET_CHECK_ANSWER'; wordId: number; correct: boolean }
  | { type: 'SET_CHECK_RESULT'; result: VocabCheckResult }
  | { type: 'SET_GRAMMAR_ANSWER'; answer: boolean | null }
  | { type: 'SET_GRAMMAR_RESULT'; result: GrammarCheckResult }
  | { type: 'SET_PROGRESS'; progress: ProgressPayload }
  | { type: 'SET_REVIEW_ITEMS'; mode: 'due' | 'weak' | 'fresh'; items: ReviewItem[] }
  | { type: 'SET_REVIEW_ANSWER'; itemId: number; correct: boolean }
  | { type: 'SET_REVIEW_RESULT'; result: VocabCheckResult }
  | { type: 'CLEAR_ERROR' };

// ---- Initial state ----
export const initialState: FoundationState = {
  view: 'home',
  lesson: null,
  progress: null,
  curriculum: null,
  selectedTrack: 'vocab',
  selectedLessonId: '',
  loading: true,
  error: '',
  cardIndex: 0,
  checkAnswers: {},
  checkResult: null,
  grammarAnswer: null,
  grammarResult: null,
  reviewMode: 'due',
  reviewItems: [],
  reviewAnswers: {},
  reviewResult: null,
};

// ---- Reducer ----
function foundationReducer(state: FoundationState, action: FoundationAction): FoundationState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loading: true, error: '' };
    case 'LOAD_ERROR':
      return { ...state, loading: false, error: action.error };
    case 'LOAD_ALL_SUCCESS':
      return {
        ...state,
        loading: false,
        lesson: action.lesson,
        progress: action.progress,
        curriculum: action.curriculum,
        selectedLessonId: action.firstLessonId || state.selectedLessonId,
        cardIndex: 0,
        grammarAnswer: null,
        grammarResult: null,
        reviewAnswers: {},
        reviewResult: null,
      };
    case 'LOAD_TRACK_SUCCESS':
      return {
        ...state,
        loading: false,
        lesson: action.lesson,
        selectedTrack: action.track,
        selectedLessonId: action.lessonId,
        cardIndex: 0,
        checkAnswers: {},
        checkResult: null,
        grammarAnswer: null,
        grammarResult: null,
        view: 'lesson',
      };
    case 'SET_VIEW':
      return { ...state, view: action.view };
    case 'SET_TRACK':
      return { ...state, selectedTrack: action.track };
    case 'SET_LESSON_ID':
      return { ...state, selectedLessonId: action.id };
    case 'SET_CARD_INDEX':
      return { ...state, cardIndex: action.index };
    case 'SET_CHECK_ANSWER':
      return { ...state, checkAnswers: { ...state.checkAnswers, [action.wordId]: action.correct } };
    case 'SET_CHECK_RESULT':
      return { ...state, checkResult: action.result };
    case 'SET_GRAMMAR_ANSWER':
      return { ...state, grammarAnswer: action.answer };
    case 'SET_GRAMMAR_RESULT':
      return { ...state, grammarResult: action.result };
    case 'SET_PROGRESS':
      return { ...state, progress: action.progress };
    case 'SET_REVIEW_ITEMS':
      return { ...state, reviewMode: action.mode, reviewItems: action.items, reviewAnswers: {}, reviewResult: null };
    case 'SET_REVIEW_ANSWER':
      return { ...state, reviewAnswers: { ...state.reviewAnswers, [action.itemId]: action.correct } };
    case 'SET_REVIEW_RESULT':
      return { ...state, reviewResult: action.result };
    case 'CLEAR_ERROR':
      return { ...state, error: '' };
    default:
      return state;
  }
}

// ---- Hook ----
export function useFoundationReducer() {
  return useReducer(foundationReducer, initialState);
}
