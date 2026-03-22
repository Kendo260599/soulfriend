import React, { useState } from 'react';
import ConsentForm from './components/ConsentForm';
import { TestType } from './components/TestSelection';
import TestTaking from './components/TestTaking';
import TestResults from './components/TestResults';
import { TestResult } from './types';
import { useAuth } from './contexts/AuthContext';

const API_URL = (process.env.REACT_APP_API_URL || 'https://soulfriend-api.onrender.com').replace(/\/$/, '');

/**
 * TestFlow - Step-based test flow component
 * Consent → DASS-21 → Results
 * Rendered at /start route by AppRouter
 */

enum AppStep {
  CONSENT = 'consent',
  TAKING_TEST = 'taking-test',
  RESULTS = 'results',
}

function TestFlow() {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.CONSENT);
  const [consentId, setConsentId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const { user, token } = useAuth();

  /** Auto-complete quest_dass when DASS test is finished (requires đăng nhập). */
  const completeDassQuest = async (): Promise<void> => {
    const userId = user?.id;
    if (!userId || !token) {
      console.warn('[GameFi] Bỏ qua auto-complete quest DASS: chưa đăng nhập hoặc thiếu token.');
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const questId = `quest_dass_${today}`;
    try {
      const res = await fetch(`${API_URL}/api/v2/gamefi/quest/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId, questId, autoEvent: true }),
      });
      let body: { success?: boolean; error?: string; message?: string } = {};
      try {
        body = await res.json();
      } catch {
        /* ignore */
      }
      // 409 = quest đã hoàn thành trước đó — vẫn refetch để UI đồng bộ
      if (res.status === 409) {
        try {
          localStorage.removeItem('gamefi_cache_v1');
        } catch {
          /* ignore */
        }
        window.dispatchEvent(new CustomEvent('gamefi:invalidate-cache'));
        return;
      }

      if (!res.ok || body.success === false) {
        console.warn('[GameFi] Không thể auto-complete quest DASS:', body.error || body.message || res.status);
        return;
      }

      try {
        localStorage.removeItem('gamefi_cache_v1');
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new CustomEvent('gamefi:invalidate-cache'));
    } catch (e) {
      console.warn('[GameFi] Lỗi mạng khi auto-complete quest DASS:', e);
    }
  };

  const handleConsentGiven = (id: string) => {
    setConsentId(id);
    setCurrentStep(AppStep.TAKING_TEST);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case AppStep.CONSENT:
        return <ConsentForm onConsentGiven={handleConsentGiven} />;
      
      case AppStep.TAKING_TEST:
        return (
          <TestTaking
            selectedTests={[TestType.DASS_21]}
            consentId={consentId || ''}
            onComplete={(results) => {
              setTestResults(results);
              setCurrentStep(AppStep.RESULTS);
              // Lưu vào localStorage để realDataCollector nhặt được — fix research data pipeline
              try {
                const stored: TestResult[] = JSON.parse(localStorage.getItem('testResults') || '[]');
                const updated: TestResult[] = [...stored, ...results];
                localStorage.setItem('testResults', JSON.stringify(updated));
                // Bắn sự kiện để realDataCollector xử lý ngay (thay vì đợi 2s polling)
                window.dispatchEvent(new CustomEvent('test-completed', { detail: results }));
              } catch {
                /* quota exceeded — ignore */
              }
              void completeDassQuest().catch((e) => console.warn('[GameFi] completeDassQuest:', e));
            }}
            onBack={() => setCurrentStep(AppStep.CONSENT)}
          />
        );
      
      case AppStep.RESULTS:
        return (
          <TestResults
            results={testResults}
            onRetakeTests={() => {
              setTestResults([]);
              setCurrentStep(AppStep.TAKING_TEST);
            }}
            onNewTests={() => {
              setTestResults([]);
              setCurrentStep(AppStep.CONSENT);
            }}
          />
        );
      
      default:
        return <ConsentForm onConsentGiven={handleConsentGiven} />;
    }
  };

  return (
    <div className="App">
      {renderCurrentStep()}
    </div>
  );
}

export default TestFlow;
