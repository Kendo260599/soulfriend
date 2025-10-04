/**
 * Mock data store để test frontend khi không có MongoDB
 */

export interface MockConsent {
  id: string;
  agreed: boolean;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface MockTestResult {
  id: string;
  testType: string;
  answers: number[];
  totalScore: number;
  evaluation: {
    testType: string;
    totalScore: number;
    severity: string;
    interpretation: string;
    recommendations: string[];
  };
  consentId: string;
  completedAt: Date;
}

export interface MockAuditLog {
  id: string;
  action: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
}

// In-memory storage
const mockConsents: MockConsent[] = [];
const mockTestResults: MockTestResult[] = [];
const mockAuditLog: MockAuditLog[] = [];

export const MockDataStore = {
  // Consent methods
  createConsent: (data: Omit<MockConsent, 'id'>): MockConsent => {
    const consent: MockConsent = {
      id: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...data
    };
    mockConsents.push(consent);
    return consent;
  },

  getConsents: (): MockConsent[] => mockConsents,

  // Test result methods
  createTestResult: (data: Omit<MockTestResult, 'id'>): MockTestResult => {
    const testResult: MockTestResult = {
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...data
    };
    mockTestResults.push(testResult);
    return testResult;
  },

  getTestResults: (): MockTestResult[] => mockTestResults,

  getTestResultsByType: (testType: string): MockTestResult[] => {
    return mockTestResults.filter(result => result.testType === testType);
  },

  // Statistics methods
  getStats: () => ({
    totalConsents: mockConsents.length,
    totalTests: mockTestResults.length,
    todayConsents: mockConsents.filter(c => 
      c.timestamp.toDateString() === new Date().toDateString()
    ).length,
    todayTests: mockTestResults.filter(r => 
      r.completedAt.toDateString() === new Date().toDateString()
    ).length
  }),

  // Privacy management methods
  getAllTestResults: (): MockTestResult[] => mockTestResults,
  
  getAllConsents: (): MockConsent[] => mockConsents,

  logAction: (actionData: Omit<MockAuditLog, 'id'>): MockAuditLog => {
    const auditEntry: MockAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...actionData
    };
    mockAuditLog.push(auditEntry);
    return auditEntry;
  },

  getAuditLog: (): MockAuditLog[] => {
    // Return only last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    return mockAuditLog.filter(entry => 
      new Date(entry.timestamp) >= ninetyDaysAgo
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  clearAllUserData: (): void => {
    // Clear user data but keep audit log for legal compliance
    mockConsents.length = 0;
    mockTestResults.length = 0;
    
    // Log the deletion action
    const deletionLog: MockAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action: "user_data_cleared",
      timestamp: new Date().toISOString(),
      details: {
        reason: "User requested data deletion",
        itemsDeleted: ["consents", "test_results"]
      }
    };
    mockAuditLog.push(deletionLog);
  }
};