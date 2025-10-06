/**
 * Workflow Manager - Quản lý luồng hoạt động khoa học
 * Thiết kế theo nguyên tắc UX/UI và tâm lý học
 */

export enum WorkflowStep {
  WELCOME = 'welcome',
  CONSENT = 'consent',
  TEST_SELECTION = 'test_selection',
  TEST_TAKING = 'test_taking',
  RESULTS_ANALYSIS = 'results_analysis',
  DASHBOARD = 'dashboard',
  AI_COMPANION = 'ai_companion'
}

export interface WorkflowState {
  currentStep: WorkflowStep;
  completedSteps: WorkflowStep[];
  userProgress: {
    hasConsented: boolean;
    hasSelectedTests: boolean;
    hasCompletedTests: boolean;
    hasSeenResults: boolean;
    hasAccessedAI: boolean;
  };
  testResults: any[];
  aiAnalysisReady: boolean;
}

export class WorkflowManager {
  private static instance: WorkflowManager;
  private state: WorkflowState;

  private constructor() {
    this.state = {
      currentStep: WorkflowStep.WELCOME,
      completedSteps: [],
      userProgress: {
        hasConsented: false,
        hasSelectedTests: false,
        hasCompletedTests: false,
        hasSeenResults: false,
        hasAccessedAI: false
      },
      testResults: [],
      aiAnalysisReady: false
    };
  }

  public static getInstance(): WorkflowManager {
    if (!WorkflowManager.instance) {
      WorkflowManager.instance = new WorkflowManager();
    }
    return WorkflowManager.instance;
  }

  // Get current state
  public getState(): WorkflowState {
    return { ...this.state };
  }

  // Update step
  public updateStep(step: WorkflowStep): void {
    this.state.currentStep = step;
    if (!this.state.completedSteps.includes(step)) {
      this.state.completedSteps.push(step);
    }
  }

  // Update progress
  public updateProgress(progress: Partial<WorkflowState['userProgress']>): void {
    this.state.userProgress = { ...this.state.userProgress, ...progress };
  }

  // Set test results
  public setTestResults(results: any[]): void {
    this.state.testResults = results;
    this.state.userProgress.hasCompletedTests = true;
    this.state.aiAnalysisReady = true;
  }

  // Get next step
  public getNextStep(): WorkflowStep | null {
    const { currentStep, userProgress } = this.state;
    
    switch (currentStep) {
      case WorkflowStep.WELCOME:
        return WorkflowStep.CONSENT;
      
      case WorkflowStep.CONSENT:
        return userProgress.hasConsented ? WorkflowStep.TEST_SELECTION : null;
      
      case WorkflowStep.TEST_SELECTION:
        return userProgress.hasSelectedTests ? WorkflowStep.TEST_TAKING : null;
      
      case WorkflowStep.TEST_TAKING:
        return userProgress.hasCompletedTests ? WorkflowStep.RESULTS_ANALYSIS : null;
      
      case WorkflowStep.RESULTS_ANALYSIS:
        return WorkflowStep.DASHBOARD;
      
      case WorkflowStep.DASHBOARD:
        return userProgress.hasCompletedTests ? WorkflowStep.AI_COMPANION : null;
      
      default:
        return null;
    }
  }

  // Check if can access AI Companion
  public canAccessAI(): boolean {
    return this.state.aiAnalysisReady && this.state.userProgress.hasCompletedTests;
  }

  // Get progress percentage
  public getProgressPercentage(): number {
    const totalSteps = 6; // WELCOME -> CONSENT -> TEST_SELECTION -> TEST_TAKING -> RESULTS -> DASHBOARD
    const completedCount = this.state.completedSteps.length;
    return Math.round((completedCount / totalSteps) * 100);
  }

  // Reset workflow
  public reset(): void {
    this.state = {
      currentStep: WorkflowStep.WELCOME,
      completedSteps: [],
      userProgress: {
        hasConsented: false,
        hasSelectedTests: false,
        hasCompletedTests: false,
        hasSeenResults: false,
        hasAccessedAI: false
      },
      testResults: [],
      aiAnalysisReady: false
    };
  }

  // Get workflow status message
  public getStatusMessage(): string {
    const { currentStep, userProgress } = this.state;
    
    switch (currentStep) {
      case WorkflowStep.WELCOME:
        return "Chào mừng bạn đến với SoulFriend - Hệ thống đánh giá sức khỏe tâm lý";
      
      case WorkflowStep.CONSENT:
        return "Vui lòng đồng ý tham gia và cung cấp thông tin cơ bản";
      
      case WorkflowStep.TEST_SELECTION:
        return "Chọn các bài test bạn muốn thực hiện";
      
      case WorkflowStep.TEST_TAKING:
        return "Đang thực hiện bài test...";
      
      case WorkflowStep.RESULTS_ANALYSIS:
        return "AI đang phân tích kết quả của bạn...";
      
      case WorkflowStep.DASHBOARD:
        return userProgress.hasCompletedTests 
          ? "Chào mừng trở lại! AI Companion đã sẵn sàng với insights cá nhân hóa"
          : "Dashboard của bạn";
      
      case WorkflowStep.AI_COMPANION:
        return "AI Companion - Phân tích và gợi ý cá nhân hóa";
      
      default:
        return "Đang tải...";
    }
  }
}

export const workflowManager = WorkflowManager.getInstance();





