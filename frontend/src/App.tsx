import React, { useState, useEffect } from 'react';
import ProfessionalWelcomePage from './components/ProfessionalWelcomePage';
import ConsentFormV2 from './components/ConsentFormV2';
import TestSelection, { TestType } from './components/TestSelection';
import TestTaking from './components/TestTaking';
import TestResults from './components/TestResults';
import ResultsAnalysis from './components/ResultsAnalysis';
import ProgressIndicator from './components/ProgressIndicator';
// import NavigationTabs from './components/NavigationTabs'; // Removed per user request
// PMSTest and MenopauseTest are imported in TestTaking.tsx
import PrivacyManagement from './components/PrivacyManagement';
import ProfessionalDashboard from './components/ProfessionalDashboard';
import DataBackup from './components/DataBackup';
import { ResearchDashboard } from './components/ResearchDashboard';
import CommunitySupport from './components/CommunitySupport';
import MonitoringDashboard from './components/MonitoringDashboard';
import AICompanionDashboard from './components/AICompanionDashboard';
import NotificationSystem, { Notification } from './components/NotificationSystem';
import PageTransition from './components/PageTransition';
import ChatBot from './components/ChatBot';
import CrisisAlert from './components/CrisisAlert';
import WelcomeSplash from './components/WelcomeSplash';
import ContentShowcaseLanding from './components/ContentShowcaseLanding';
import ContentOverviewPage from './components/ContentOverviewPage';
import { AIProvider } from './contexts/AIContext';
import { TestResult } from './types';
import { workflowManager, WorkflowStep } from './services/workflowManager';
import './services/realDataCollector';
import { monitoringService } from './services/monitoringService'; // Tự động thu thập dữ liệu thật
import { cloudResearchService, CloudResearchData } from './services/cloudResearchService';
// import { reportingService } from './services/reportingService'; // Hệ thống báo cáo tự động
import './App.css';

// Enum để quản lý các bước của ứng dụng (legacy)
enum AppStep {
  WELCOME = 'welcome',
  CONTENT_OVERVIEW = 'content-overview',
  CONSENT = 'consent',
  DASHBOARD = 'dashboard',
  TEST_SELECTION = 'test-selection',
  TAKING_TEST = 'taking-test',
  RESULTS = 'results',
  RESULTS_ANALYSIS = 'results-analysis',
  PRIVACY_MANAGEMENT = 'privacy-management',
  DATA_BACKUP = 'data-backup',
  RESEARCH_DASHBOARD = 'research-dashboard',
  COMMUNITY_SUPPORT = 'community-support',
  MONITORING_DASHBOARD = 'monitoring-dashboard',
  AI_COMPANION = 'ai-companion'
}

// Using TestResult from types/index.ts

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.WELCOME);
  const [consentId, setConsentId] = useState<string | null>(null);
  const [selectedTests, setSelectedTests] = useState<TestType[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [crisisAlert, setCrisisAlert] = useState<{
    level: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    recommendations: string[];
    emergencyContacts: string[];
  } | null>(null);

  /**
   * Kiểm tra crisis indicators từ test results
   */
  const checkCrisisIndicators = (results: TestResult[]) => {
    console.log('🔍 Checking crisis indicators for results:', results);
    
    for (const result of results) {
      const score = result.totalScore || 0;
      const maxScore = result.maxScore || 100;
      const percentage = (score / maxScore) * 100;
      const level = result.evaluation?.level || 'normal';
      
      console.log(`📊 Test ${result.testType}: score=${score}, maxScore=${maxScore}, percentage=${percentage.toFixed(1)}%, level=${level}`);
      
      // Critical crisis indicators
      if (level === 'severe' || level === 'critical' || percentage > 90) {
        console.log('🚨 CRITICAL CRISIS DETECTED!');
        setCrisisAlert({
          level: 'critical',
          message: `🚨 CẢNH BÁO NGHIÊM TRỌNG: Kết quả ${result.testType} cho thấy dấu hiệu khủng hoảng nghiêm trọng. Bạn cần được hỗ trợ chuyên nghiệp NGAY LẬP TỨC!`,
          recommendations: [
            'Gọi ngay hotline tư vấn tâm lý: 1900 599 958',
            'Đến bệnh viện tâm thần gần nhất',
            'Liên hệ người thân hoặc bạn bè tin cậy',
            'Không ở một mình trong lúc này'
          ],
          emergencyContacts: [
            'Hotline tư vấn tâm lý: 1900 599 958',
            'Bệnh viện Tâm thần Trung ương: 024 3736 2121',
            'Trung tâm Phòng chống tự tử: 1900 599 958'
          ]
        });
        return;
      }
      
      // High crisis indicators
      if (level === 'high' || percentage > 80) {
        console.log('⚠️ HIGH CRISIS DETECTED!');
        setCrisisAlert({
          level: 'high',
          message: `⚠️ CẢNH BÁO: Kết quả ${result.testType} cho thấy dấu hiệu stress nghiêm trọng. Bạn nên tìm kiếm sự hỗ trợ chuyên nghiệp sớm.`,
          recommendations: [
            'Tham khảo ý kiến chuyên gia tâm lý',
            'Thực hành kỹ thuật thở sâu',
            'Tránh cô lập bản thân',
            'Duy trì lịch trình sinh hoạt đều đặn'
          ],
          emergencyContacts: [
            'Tìm chuyên gia tâm lý gần nhất',
            'Hotline tư vấn: 1900 599 958',
            'Tham gia nhóm hỗ trợ cộng đồng'
          ]
        });
        return;
      }
    }
    
    console.log('✅ No crisis indicators detected');
  };


  /**
   * Xử lý khi người dùng click "Bắt đầu ngay" từ Welcome Page
   */
  const handleGetStarted = () => {
    try {
      setCurrentStep(AppStep.CONSENT);
      monitoringService.updateProgress('user_flow', 10);
    } catch (error) {
      monitoringService.trackError(error as Error, { action: 'handleGetStarted' });
    }
  };

  /**
   * Xử lý khi người dùng đã đồng ý tham gia
   */
  const handleConsentGiven = (id: string) => {
    try {
      setConsentId(id);
      setCurrentStep(AppStep.TEST_SELECTION);
      monitoringService.updateProgress('user_flow', 25);
      // Update workflow state
      workflowManager.updateStep(WorkflowStep.CONSENT);
      workflowManager.updateProgress({ hasConsented: true });
    } catch (error) {
      monitoringService.trackError(error as Error, { action: 'handleConsentGiven', consentId: id });
    }
  };

  /**
   * Xử lý khi người dùng chọn các test
   */
  const handleTestsSelected = (tests: TestType[]) => {
    try {
      setSelectedTests(tests);
      setCurrentStep(AppStep.TAKING_TEST);
      monitoringService.updateProgress('user_flow', 50);
      monitoringService.updateTaskStatus(1, 1, 0); // 1 task completed, 1 total
      // Update workflow state
      workflowManager.updateStep(WorkflowStep.TEST_SELECTION);
      workflowManager.updateProgress({ hasSelectedTests: true });
    } catch (error) {
      monitoringService.trackError(error as Error, { action: 'handleTestsSelected', tests });
    }
  };

  /**
   * Xử lý quay lại bước trước
   */
  const handleBack = () => {
    try {
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
        case AppStep.DATA_BACKUP:
          setCurrentStep(AppStep.DASHBOARD);
          break;
        case AppStep.RESEARCH_DASHBOARD:
          setCurrentStep(AppStep.DASHBOARD);
          break;
        case AppStep.COMMUNITY_SUPPORT:
          setCurrentStep(AppStep.DASHBOARD);
          break;
        case AppStep.MONITORING_DASHBOARD:
          setCurrentStep(AppStep.WELCOME);
          break;
        default:
          setCurrentStep(AppStep.WELCOME);
          break;
      }
      
      // Track navigation
      monitoringService.updateProgress('navigation', 100);
    } catch (error) {
      monitoringService.trackError(error as Error, { action: 'handleBack', currentStep });
    }
  };

  /**
   * Render nội dung theo bước hiện tại
   */
  const renderCurrentStep = () => {
    switch (currentStep) {
      case AppStep.WELCOME:
        return <ProfessionalWelcomePage 
          onGetStarted={handleGetStarted} 
          onAdminLogin={() => setCurrentStep(AppStep.RESEARCH_DASHBOARD)}
          onMonitoringDashboard={() => setCurrentStep(AppStep.MONITORING_DASHBOARD)}
          onAICompanion={() => setCurrentStep(AppStep.AI_COMPANION)}
          onResearchDashboard={() => setCurrentStep(AppStep.RESEARCH_DASHBOARD)}
          onCommunitySupport={() => setCurrentStep(AppStep.COMMUNITY_SUPPORT)}
          onDataBackup={() => setCurrentStep(AppStep.DATA_BACKUP)}
        />;
        
      case AppStep.CONTENT_OVERVIEW:
        return <ContentOverviewPage 
          onBack={() => setCurrentStep(AppStep.WELCOME)}
          onNavigateToTest={(testType) => {
            setSelectedTests([testType]);
            setCurrentStep(AppStep.TAKING_TEST);
          }}
          onNavigateToAI={() => setCurrentStep(AppStep.AI_COMPANION)}
          onNavigateToResearch={() => setCurrentStep(AppStep.RESEARCH_DASHBOARD)}
        />;
        
      case AppStep.CONSENT:
        return <ConsentFormV2 
          onConsentGiven={handleConsentGiven} 
          onBack={() => setCurrentStep(AppStep.WELCOME)} 
        />;
      
      case AppStep.DASHBOARD:
        return (
          <ProfessionalDashboard
            onNewTest={() => setCurrentStep(AppStep.TEST_SELECTION)}
            onViewProfile={() => setCurrentStep(AppStep.PRIVACY_MANAGEMENT)}
            onDataBackup={() => setCurrentStep(AppStep.DATA_BACKUP)}
            onResearchDashboard={() => setCurrentStep(AppStep.RESEARCH_DASHBOARD)}
            onCommunitySupport={() => setCurrentStep(AppStep.COMMUNITY_SUPPORT)}
            onAICompanion={() => setCurrentStep(AppStep.AI_COMPANION)}
            onStartTests={() => setCurrentStep(AppStep.TEST_SELECTION)}
            testResults={testResults}
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
            onComplete={async (results) => {
              setTestResults(results);
              
              // Kiểm tra crisis indicators ngay lập tức
              checkCrisisIndicators(results);
              
              // Lưu dữ liệu test vào localStorage (fallback)
              const existingResults = JSON.parse(localStorage.getItem('testResults') || '[]');
              const newTestData = {
                id: `test_${Date.now()}`,
                timestamp: new Date().toISOString(),
                testResults: results,
                // Không có demographics - chỉ lưu dữ liệu test thật
                demographics: null,
                culturalContext: null,
                qualityMetrics: {
                  completeness: 1.0, // Test hoàn thành 100%
                  validity: 1.0,     // Dữ liệu thật từ người dùng
                  reliability: 1.0,  // Đáng tin cậy
                  responseTime: 0    // Không đo response time
                }
              };
              
              existingResults.push(newTestData);
              localStorage.setItem('testResults', JSON.stringify(existingResults));
              
              // 🌐 LƯU LÊN CLOUD (MongoDB)
              try {
                const cloudData: CloudResearchData = {
                  participantId: `P${Date.now()}`,
                  testResults: results.map(r => ({
                    testType: r.testType,
                    score: r.totalScore,
                    severity: r.severity || r.evaluation.level,
                    answers: r.answers,
                    completionTime: 0,
                    subscaleScores: r.subscaleScores
                  })),
                  sessionData: {
                    sessionId: newTestData.id,
                    startTime: new Date(),
                    endTime: new Date(),
                    duration: 0,
                    device: navigator.platform || 'Unknown',
                    browser: navigator.userAgent.split(' ').pop() || 'Unknown',
                    userAgent: navigator.userAgent
                  },
                  qualityMetrics: {
                    completeness: 1.0,
                    validity: 1.0,
                    reliability: 1.0,
                    responseTime: 0
                  },
                  metadata: {
                    version: '3.0',
                    platform: 'web',
                    locale: 'vi'
                  }
                };

                console.log('📤 Saving test results to cloud...');
                const cloudResult = await cloudResearchService.saveResearchData(cloudData);
                
                if (cloudResult.success) {
                  console.log('✅ Test results saved to cloud:', cloudResult.participantId);
                } else {
                  console.warn('⚠️  Failed to save to cloud, data kept in localStorage:', cloudResult.error);
                }
              } catch (error) {
                console.error('❌ Error saving to cloud:', error);
                console.log('💾 Data is safely stored in localStorage as fallback');
              }
              
              setCurrentStep(AppStep.RESULTS_ANALYSIS);
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
            onBack={() => setCurrentStep(AppStep.DASHBOARD)}
          />
        );
      
      case AppStep.RESULTS_ANALYSIS:
        return (
          <ResultsAnalysis
            testResults={testResults}
            onContinue={() => setCurrentStep(AppStep.DASHBOARD)}
            onViewAI={() => setCurrentStep(AppStep.AI_COMPANION)}
            onBack={() => setCurrentStep(AppStep.TAKING_TEST)}
          />
        );
      
      case AppStep.PRIVACY_MANAGEMENT:
        return <PrivacyManagement onBack={() => setCurrentStep(AppStep.DASHBOARD)} />;
      
      case AppStep.DATA_BACKUP:
        return <DataBackup onBack={() => setCurrentStep(AppStep.DASHBOARD)} />;
      
      case AppStep.RESEARCH_DASHBOARD:
        return <ResearchDashboard onBack={() => setCurrentStep(AppStep.DASHBOARD)} />;
      
      case AppStep.COMMUNITY_SUPPORT:
        return <CommunitySupport onBack={() => setCurrentStep(AppStep.DASHBOARD)} />;
      
      case AppStep.MONITORING_DASHBOARD:
        return <MonitoringDashboard onBack={() => setCurrentStep(AppStep.DASHBOARD)} />;
      
      case AppStep.AI_COMPANION:
        return <AICompanionDashboard 
          userId="user_001" 
          onBack={() => setCurrentStep(AppStep.DASHBOARD)} 
        />;
      
      case AppStep.CONSENT:
        return <ConsentFormV2 
          onConsentGiven={handleConsentGiven} 
          onBack={() => setCurrentStep(AppStep.WELCOME)}
        />;
      
      default:
        return <ConsentFormV2 
          onConsentGiven={handleConsentGiven}
          onBack={() => setCurrentStep(AppStep.WELCOME)}
        />;
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

  const handleProgressNavigation = (step: string | WorkflowStep) => {
    // Map string step to AppStep
    const stepMap: Record<string, AppStep> = {
      'welcome': AppStep.WELCOME,
      'content-overview': AppStep.CONTENT_OVERVIEW,
      'consent': AppStep.CONSENT,
      'test-selection': AppStep.TEST_SELECTION,
      'taking-test': AppStep.TAKING_TEST,
      'results-analysis': AppStep.RESULTS_ANALYSIS,
      'dashboard': AppStep.DASHBOARD,
      'ai-companion': AppStep.AI_COMPANION
    };
    
    const appStep = stepMap[step];
    if (appStep) {
      setCurrentStep(appStep);
    }
  };

  const getCurrentStepString = () => {
    const stepMap: Record<AppStep, string> = {
      [AppStep.WELCOME]: 'welcome',
      [AppStep.CONTENT_OVERVIEW]: 'content-overview',
      [AppStep.CONSENT]: 'consent',
      [AppStep.DASHBOARD]: 'dashboard',
      [AppStep.TEST_SELECTION]: 'test-selection',
      [AppStep.TAKING_TEST]: 'taking-test',
      [AppStep.RESULTS]: 'results',
      [AppStep.RESULTS_ANALYSIS]: 'results-analysis',
      [AppStep.PRIVACY_MANAGEMENT]: 'privacy-management',
      [AppStep.DATA_BACKUP]: 'data-backup',
      [AppStep.RESEARCH_DASHBOARD]: 'research-dashboard',
      [AppStep.COMMUNITY_SUPPORT]: 'community-support',
      [AppStep.MONITORING_DASHBOARD]: 'monitoring-dashboard',
      [AppStep.AI_COMPANION]: 'ai-companion'
    };
    return stepMap[currentStep] || 'welcome';
  };

  const getCompletedSteps = () => {
    // Only return completed steps that are actually completed
    const completedSteps = workflowManager.getState().completedSteps.map(step => {
      const stepMap: Record<WorkflowStep, string> = {
        [WorkflowStep.WELCOME]: 'welcome',
        [WorkflowStep.CONSENT]: 'consent',
        [WorkflowStep.TEST_SELECTION]: 'test-selection',
        [WorkflowStep.TEST_TAKING]: 'taking-test',
        [WorkflowStep.RESULTS_ANALYSIS]: 'results-analysis',
        [WorkflowStep.DASHBOARD]: 'dashboard',
        [WorkflowStep.AI_COMPANION]: 'ai-companion'
      };
      return stepMap[step];
    }).filter(Boolean);
    
    // Always include 'welcome' as completed since we're on the welcome page
    if (currentStep === AppStep.WELCOME) {
      return ['welcome'];
    }
    
    return completedSteps;
  };

         return (
           <AIProvider>
             <div className="App">
               {/* Content Showcase Landing Screen */}
               {showSplash && (
                 <ContentShowcaseLanding 
                   onComplete={() => setShowSplash(false)}
                   duration={3000}
                 />
               )}
               
               {/* Main App Content */}
               {!showSplash && (
                 <>
                   {/* Temporarily hide ProgressIndicator to test */}
                   {/* <ProgressIndicator onNavigate={handleProgressNavigation} /> */}
                   
                   {/* Navigation Tabs removed per user request */}
                   
                   <PageTransition isVisible={true}>
                     {renderCurrentStep()}
                   </PageTransition>
                   
                   <NotificationSystem 
                     notifications={notifications}
                     onRemoveNotification={removeNotification}
                   />
                   
                   <ChatBot testResults={testResults} />
                   
                   {/* Crisis Alert - Hiển thị khi phát hiện nguy cơ */}
                   {crisisAlert && (
                     <CrisisAlert
                       level={crisisAlert.level}
                       message={crisisAlert.message}
                       recommendations={crisisAlert.recommendations}
                       emergencyContacts={crisisAlert.emergencyContacts}
                       onClose={() => setCrisisAlert(null)}
                     />
                   )}
                 </>
               )}
             </div>
           </AIProvider>
         );
}

export default App;
