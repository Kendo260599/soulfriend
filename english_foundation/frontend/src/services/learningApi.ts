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
