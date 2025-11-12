import React, { useState } from 'react';
import ConsentForm from './components/ConsentForm';
import TestSelection, { TestType } from './components/TestSelection';
import TestTaking from './components/TestTaking';
import TestResults from './components/TestResults';
import PrivacyManagement from './components/PrivacyManagement';
import Dashboard from './components/Dashboard';
import DataBackup from './components/DataBackup';
import NotificationSystem, { Notification } from './components/NotificationSystem';
import PageTransition from './components/PageTransition';
import LoadingSpinner from './components/LoadingSpinner';
import ChatBot from './components/ChatBot';
import { AIProvider } from './contexts/AIContext';
import { TestResult } from './types';
import './App.css';

// Enum để quản lý các bước của ứng dụng
enum AppStep {
  CONSENT = 'consent',
  DASHBOARD = 'dashboard',
  TEST_SELECTION = 'test-selection',
  TAKING_TEST = 'taking-test',
  RESULTS = 'results',
  PRIVACY_MANAGEMENT = 'privacy-management',
  DATA_BACKUP = 'data-backup'
}

// Using TestResult from types/index.ts

function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.CONSENT);
  const [consentId, setConsentId] = useState<string | null>(null);
  const [selectedTests, setSelectedTests] = useState<TestType[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  /**
   * Xử lý khi người dùng đã đồng ý tham gia
   */
  const handleConsentGiven = (id: string) => {
    setConsentId(id);
    setCurrentStep(AppStep.DASHBOARD);
  };

  /**
   * Xử lý khi người dùng chọn các test
   */
  const handleTestsSelected = (tests: TestType[]) => {
    setSelectedTests(tests);
    setCurrentStep(AppStep.TAKING_TEST);
  };

  /**
   * Xử lý quay lại bước trước
   */
  const handleBack = () => {
    switch (currentStep) {
      case AppStep.TEST_SELECTION:
        setCurrentStep(AppStep.DASHBOARD);
        break;
      case AppStep.TAKING_TEST:
        setCurrentStep(AppStep.TEST_SELECTION);
        break;
      case AppStep.RESULTS:
        setCurrentStep(AppStep.TAKING_TEST);
        break;
      case AppStep.PRIVACY_MANAGEMENT:
        setCurrentStep(AppStep.DASHBOARD);
        break;
    }
  };

  /**
   * Render nội dung theo bước hiện tại
   */
  const renderCurrentStep = () => {
    switch (currentStep) {
      case AppStep.CONSENT:
        return <ConsentForm onConsentGiven={handleConsentGiven} />;
      
      case AppStep.DASHBOARD:
        return (
          <Dashboard
            onNewTest={() => setCurrentStep(AppStep.TEST_SELECTION)}
            onViewProfile={() => setCurrentStep(AppStep.PRIVACY_MANAGEMENT)}
            onDataBackup={() => setCurrentStep(AppStep.DATA_BACKUP)}
          />
        );
      
      case AppStep.TEST_SELECTION:
        return (
          <TestSelection 
            consentId={consentId!}
            onTestsSelected={handleTestsSelected}
            onBack={handleBack}
          />
        );
      
      case AppStep.TAKING_TEST:
        return (
          <TestTaking
            selectedTests={selectedTests}
            consentId={consentId!}
            onComplete={(results) => {
              setTestResults(results);
              setCurrentStep(AppStep.RESULTS);
            }}
            onBack={handleBack}
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
              setSelectedTests([]);
              setCurrentStep(AppStep.DASHBOARD);
            }}
            onPrivacyManagement={() => setCurrentStep(AppStep.PRIVACY_MANAGEMENT)}
          />
        );
      
      case AppStep.PRIVACY_MANAGEMENT:
        return <PrivacyManagement />;
      
      case AppStep.DATA_BACKUP:
        return <DataBackup onBack={() => setCurrentStep(AppStep.DASHBOARD)} />;
      
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
