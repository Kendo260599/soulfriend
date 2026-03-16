import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ImpactDashboard from './ImpactDashboard';

const makeDashboardPayload = () => ({
  success: true,
  data: {
    period30d: {
      totalInteractions: 100,
      avgResponseTime: 320,
      positiveOutcomeRate: 0.7,
      riskEscalationRate: 0.1,
      aiResponseQuality: 0.75,
      userSatisfactionRate: 0.72,
      psychologicalSafetyIndex: 0.68,
      crisisDetectionAccuracy: 0.8,
    },
    period7d: {
      totalInteractions: 25,
      avgResponseTime: 300,
      positiveOutcomeRate: 0.73,
      riskEscalationRate: 0.09,
      aiResponseQuality: 0.78,
      userSatisfactionRate: 0.76,
      psychologicalSafetyIndex: 0.71,
      crisisDetectionAccuracy: 0.82,
    },
    trends: [
      { date: '2026-03-14', interactions: 10, avgQuality: 0.7, satisfaction: 0.72 },
      { date: '2026-03-15', interactions: 12, avgQuality: 0.74, satisfaction: 0.75 },
    ],
  },
});

const makeSafetyPayload = () => ({
  success: true,
  data: {
    totalViolations: 2,
    blockedCount: 1,
    sanitizedCount: 1,
    unreviewed: 0,
  },
});

describe('ImpactDashboard triadic readiness widget', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders triadic pass rate, fail reasons and actor readiness rows', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch' as any)
      .mockResolvedValueOnce({ ok: true, json: async () => makeDashboardPayload() } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => makeSafetyPayload() } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            summary: {
              total: 3,
              uniqueActors: 2,
              byActor: { expert_1: 2, expert_2: 1 },
              readiness: {
                withReadiness: 2,
                pass: 1,
                fail: 1,
                unknown: 1,
                passRate: 0.5,
              },
              failReasons: {
                'Unsafe rate above threshold': 1,
              },
              byActorReadiness: {
                expert_1: {
                  total: 2,
                  withReadiness: 2,
                  pass: 1,
                  fail: 1,
                  unknown: 0,
                  passRate: 0.5,
                },
                expert_2: {
                  total: 1,
                  withReadiness: 0,
                  pass: 0,
                  fail: 0,
                  unknown: 1,
                  passRate: 0,
                },
              },
            },
          },
        }),
      } as Response);

    render(<ImpactDashboard />);

    await waitFor(() => {
      expect(screen.getByText('🧭 Triadic Manual Re-enable Readiness')).toBeInTheDocument();
    });

    expect(screen.getByText('Readiness Pass Rate')).toBeInTheDocument();
    expect(screen.getByText('50.0%')).toBeInTheDocument();
    expect(screen.getByText(/Unsafe rate above threshold/)).toBeInTheDocument();
    expect(screen.getByText(/expert_1/)).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('renders fallback text when triadic summary endpoint is unavailable', async () => {
    jest
      .spyOn(global, 'fetch' as any)
      .mockResolvedValueOnce({ ok: true, json: async () => makeDashboardPayload() } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => makeSafetyPayload() } as Response)
      .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Internal Server Error' } as Response);

    render(<ImpactDashboard />);

    await waitFor(() => {
      expect(screen.getByText('🧭 Triadic Manual Re-enable Readiness')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Triadic readiness summary chưa khả dụng trong môi trường hiện tại.')
    ).toBeInTheDocument();
  });
});
