import React, { useState } from 'react';
import ConsentForm from './components/ConsentForm';
import { TestType } from './components/TestSelection';
import TestTaking from './components/TestTaking';
import TestResults from './components/TestResults';
import { TestResult } from './types';

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
