import React, { useState } from 'react';
import ConsentForm from './components/ConsentForm';
import { TestType } from './components/TestSelection';
import TestTaking from './components/TestTaking';
import TestResults from './components/TestResults';
import NotificationSystem, { Notification } from './components/NotificationSystem';
import PageTransition from './components/PageTransition';
import ChatBot from './components/ChatBot';
import { AIProvider } from './contexts/AIContext';
import { TestResult } from './types';
import './App.css';

// Enum để quản lý các bước của ứng dụng
enum AppStep {
  CONSENT = 'consent',
  TAKING_TEST = 'taking-test',
  RESULTS = 'results',
}

function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.CONSENT);
  const [consentId, setConsentId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  /**
   * Xử lý khi người dùng đã đồng ý tham gia
   * → Đi thẳng vào bài test DASS-21
   */
  const handleConsentGiven = (id: string) => {
    setConsentId(id);
    setCurrentStep(AppStep.TAKING_TEST);
  };

  /**
   * Render nội dung theo bước hiện tại
   */
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



  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Listen for notification events
  React.useEffect(() => {
    const handleNewNotification = (event: CustomEvent<Notification>) => {
      const notification = event.detail;
      setNotifications(prev => [...prev, notification]);
      
      // Auto remove after duration
      if (notification.duration) {
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, notification.duration);
      }
    };

    window.addEventListener('newNotification', handleNewNotification as EventListener);
    
    return () => {
      window.removeEventListener('newNotification', handleNewNotification as EventListener);
    };
  }, []);

  return (
    <AIProvider>
      <div className="App">
        <PageTransition isVisible={true}>
          {renderCurrentStep()}
        </PageTransition>
        <NotificationSystem 
          notifications={notifications}
          onRemoveNotification={removeNotification}
        />
        <ChatBot testResults={testResults} />
      </div>
    </AIProvider>
  );
}

export default App;
