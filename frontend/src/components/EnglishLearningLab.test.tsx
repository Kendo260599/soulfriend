import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EnglishLearningLab from './EnglishLearningLab';
import { apiService } from '../services/apiService';

jest.mock('../services/apiService', () => ({
  apiService: {
    getEnglishLabNextQuiz: jest.fn(),
    getEnglishLabProgress: jest.fn(),
    getEnglishLabHistory: jest.fn(),
    getEnglishLabPhase2Status: jest.fn(),
    getEnglishLabPhase2Home: jest.fn(),
    submitEnglishLabQuizAnswer: jest.fn(),
    scoreEnglishLabPronunciation: jest.fn(),
    transcribeAndScoreEnglishLab: jest.fn(),
  },
}));

describe('EnglishLearningLab phase2 banner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders phase2 stage and top phrase/grammar previews from canonical endpoints', async () => {
    (apiService.getEnglishLabNextQuiz as jest.Mock)
      .mockResolvedValueOnce({
        data: {
          data: {
            item: { word: 'trust', meaningVi: 'tin tuong' },
            choices: ['tin tuong', 'bo qua'],
            progress: { learned: 2, avgMemoryPercent: 55, attempts: 3, avgPronunciationScore: 70 },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            item: { word: 'focus', meaningVi: 'tap trung' },
            choices: ['tap trung', 'tin tuong'],
            progress: { learned: 3, avgMemoryPercent: 62, attempts: 4, avgPronunciationScore: 73 },
          },
        },
      });

    (apiService.getEnglishLabProgress as jest.Mock).mockResolvedValue({
      data: {
        data: {
          progress: { learned: 2, avgMemoryPercent: 55, attempts: 3, avgPronunciationScore: 70 },
        },
      },
    });

    (apiService.getEnglishLabHistory as jest.Mock).mockResolvedValue({
      data: {
        data: {
          history: [
            { at: '2026-03-16T10:00:00Z', word: 'trust', score: 80, recognized: 'trust', feedback: 'ok' },
          ],
        },
      },
    });

    (apiService.getEnglishLabPhase2Status as jest.Mock)
      .mockResolvedValueOnce({
        data: {
          data: {
            phase2Flow: {
              stage: 'foundation',
              phraseUnlocked: false,
              grammarUnlocked: false,
              thresholds: { phraseUnlockMin: 0.45, grammarUnlockMin: 0.5 },
              signals: { lexicalLevel: 0.2, grammarReadinessProxy: 0.18, unlockedSkills: 1 },
            },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            phase2Flow: {
              stage: 'grammar',
              phraseUnlocked: true,
              grammarUnlocked: true,
              thresholds: { phraseUnlockMin: 0.45, grammarUnlockMin: 0.5 },
              signals: { lexicalLevel: 0.67, grammarReadinessProxy: 0.58, unlockedSkills: 3 },
            },
          },
        },
      });

    (apiService.getEnglishLabPhase2Home as jest.Mock)
      .mockResolvedValueOnce({
        data: {
          data: {
            phase2Home: {
              phrasePack: {
                items: [],
                summary: { locked: true },
              },
              grammarPack: {
                items: [],
                summary: { locked: true },
              },
            },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            phase2Home: {
              phrasePack: {
                items: [
                  { sourceWord: 'trust', phrase: 'build trust' },
                  { sourceWord: 'focus', phrase: 'stay focused' },
                ],
                summary: { locked: false },
              },
              grammarPack: {
                items: [
                  { pattern: 'I can + V', exampleSentence: 'I can help.' },
                ],
                summary: { locked: false },
              },
            },
          },
        },
      });

    render(<EnglishLearningLab />);

    await waitFor(() => {
      expect(screen.getByText('Foundation')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Câu tiếp theo' }));

    await waitFor(() => {
      expect(screen.getByText('Grammar')).toBeInTheDocument();
    });

    expect(screen.getByText(/Phrase pack: 2 \(ready\)/)).toBeInTheDocument();
    expect(screen.getByText(/Grammar pack: 1 \(ready\)/)).toBeInTheDocument();
    expect(screen.getByText(/trust: build trust/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Luyện: build trust/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Luyện grammar: I can \+ V/ })).toBeInTheDocument();
    expect(
      screen.getByText((content, element) => {
        const isGrammarPreviewItem = element?.tagName.toLowerCase() === 'li';
        return isGrammarPreviewItem && /I can \+ V/.test(content) && /I can help\./.test(content);
      })
    ).toBeInTheDocument();
  });

  it('keeps stable defaults when phase2 endpoints fail', async () => {
    (apiService.getEnglishLabNextQuiz as jest.Mock).mockResolvedValue({ data: { data: { item: null, choices: [] } } });
    (apiService.getEnglishLabProgress as jest.Mock).mockResolvedValue({ data: { data: { progress: {} } } });
    (apiService.getEnglishLabHistory as jest.Mock).mockResolvedValue({
      data: {
        data: {
          history: [],
        },
      },
    });
    (apiService.getEnglishLabPhase2Status as jest.Mock).mockRejectedValue(new Error('status fail'));
    (apiService.getEnglishLabPhase2Home as jest.Mock).mockRejectedValue(new Error('home fail'));

    render(<EnglishLearningLab />);

    await waitFor(() => {
      expect(screen.getByText('English Learning Lab')).toBeInTheDocument();
    });

    expect(screen.getByText('Foundation')).toBeInTheDocument();
    expect(screen.getByText(/Phrase pack: 0 \(locked\)/)).toBeInTheDocument();
    expect(screen.getByText(/Grammar pack: 0 \(locked\)/)).toBeInTheDocument();
  });

  it('gates phrase and grammar practice actions when thresholds are locked', async () => {
    (apiService.getEnglishLabNextQuiz as jest.Mock).mockResolvedValue({
      data: {
        data: {
          item: { word: 'trust', meaningVi: 'tin tuong' },
          choices: ['tin tuong', 'bo qua'],
          progress: { learned: 1, avgMemoryPercent: 48, attempts: 2, avgPronunciationScore: 66 },
        },
      },
    });

    (apiService.getEnglishLabProgress as jest.Mock).mockResolvedValue({ data: { data: { progress: {} } } });
    (apiService.getEnglishLabHistory as jest.Mock).mockResolvedValue({ data: { data: { history: [] } } });

    (apiService.getEnglishLabPhase2Status as jest.Mock).mockResolvedValue({
      data: {
        data: {
          phase2Flow: {
            stage: 'foundation',
            phraseUnlocked: false,
            grammarUnlocked: false,
            thresholds: { phraseUnlockMin: 0.45, grammarUnlockMin: 0.5 },
            signals: { lexicalLevel: 0.31, grammarReadinessProxy: 0.29, unlockedSkills: 1 },
          },
        },
      },
    });

    (apiService.getEnglishLabPhase2Home as jest.Mock).mockResolvedValue({
      data: {
        data: {
          phase2Home: {
            phrasePack: {
              items: [{ sourceWord: 'trust', phrase: 'build trust' }],
              summary: { locked: true },
            },
            grammarPack: {
              items: [{ pattern: 'I can + V', exampleSentence: 'I can help.' }],
              summary: { locked: true },
            },
          },
        },
      },
    });

    render(<EnglishLearningLab />);

    await waitFor(() => {
      expect(screen.getByText('Foundation')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /Luyện: build trust/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Luyện grammar: I can \+ V/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Phrase drills sẽ mở khi lexicalLevel đạt ngưỡng canonical\./)).toBeInTheDocument();
    expect(screen.getByText(/Grammar drills sẽ mở khi grammarReadiness đạt ngưỡng canonical\./)).toBeInTheDocument();
  });
});
