import { LessonPayload, ProgressPayload } from '../types';

const API_BASE = '/api/foundation';

export async function fetchLesson(): Promise<LessonPayload> {
  const response = await fetch(`${API_BASE}/lesson`);
  if (!response.ok) {
    throw new Error('Cannot load lesson now. Please try again.');
  }
  return response.json();
}

export async function fetchProgress(): Promise<ProgressPayload> {
  const response = await fetch(`${API_BASE}/progress`);
  if (!response.ok) {
    throw new Error('Cannot load progress now. Please try again.');
  }
  return response.json();
}

export async function submitVocabCheck(
  learnerId: number,
  lessonId: string,
  answers: Array<{ wordId: number; correct: boolean }>
): Promise<{ score: number; correct: number; total: number; weak_items: number[] }> {
  const response = await fetch(`${API_BASE}/vocab-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ learnerId, lessonId, answers }),
  });
  if (!response.ok) {
    throw new Error('Failed to submit vocab check');
  }
  return response.json();
}

export async function submitGrammarCheck(
  learnerId: number,
  lessonId: string,
  grammarId: number,
  correct: boolean
): Promise<{ grammar_level_after: number; grammar_level_percent: number }> {
  const response = await fetch(`${API_BASE}/grammar-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ learnerId, lessonId, grammarId, correct }),
  });
  if (!response.ok) {
    throw new Error('Failed to submit grammar check');
  }
  return response.json();
}

export async function fetchCurriculum(): Promise<any> {
  const response = await fetch(`${API_BASE}/curriculum`);
  if (!response.ok) {
    throw new Error('Failed to load curriculum');
  }
  return response.json();
}

export async function fetchTrackLesson(
  track: 'vocab' | 'grammar',
  lessonId: string,
  learnerId: number = 1
): Promise<any> {
  const params = new URLSearchParams({
    track,
    lessonId,
    learnerId: String(learnerId),
  });
  const response = await fetch(`${API_BASE}/lesson?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to load track lesson');
  }
  return response.json();
}

export async function fetchReview(
  learnerId: number = 1,
  limit: number = 20
): Promise<any> {
  const params = new URLSearchParams({
    learnerId: String(learnerId),
    limit: String(limit),
  });
  const response = await fetch(`${API_BASE}/review?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to load review items');
  }
  return response.json();
}

export async function submitReview(
  learnerId: number,
  answers: Array<{ wordId: number; correct: boolean }>
): Promise<{ score: number; correct: number; total: number }> {
  const response = await fetch(`${API_BASE}/review-submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ learnerId, answers }),
  });
  if (!response.ok) {
    throw new Error('Failed to submit review');
  }
  return response.json();
}
