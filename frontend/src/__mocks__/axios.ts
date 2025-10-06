// Mock axios for Jest testing
const mockAxios: any = {
  get: jest.fn(() => Promise.resolve({ 
    data: { 
      success: true, 
      data: {},
      message: 'Mock response'
    } 
  })),
  post: jest.fn(() => Promise.resolve({ 
    data: { 
      success: true, 
      data: {
        testId: 'mock_test_id',
        totalScore: 10,
        evaluation: {
          severity: 'mild',
          interpretation: 'Mock test result',
          recommendations: ['Mock recommendation']
        }
      },
      message: 'Test submitted successfully'
    } 
  })),
  put: jest.fn(() => Promise.resolve({ 
    data: { 
      success: true, 
      data: {},
      message: 'Updated successfully'
    } 
  })),
  delete: jest.fn(() => Promise.resolve({ 
    data: { 
      success: true, 
      message: 'Deleted successfully'
    } 
  })),
  patch: jest.fn(() => Promise.resolve({ 
    data: { 
      success: true, 
      data: {},
      message: 'Patched successfully'
    } 
  })),
  defaults: {
    baseURL: 'http://localhost:5000',
    headers: {
      common: {},
      delete: {},
      get: {},
      head: {},
      post: {},
      put: {},
      patch: {}
    }
  },
  interceptors: {
    request: {
      use: jest.fn(),
      eject: jest.fn(),
    },
    response: {
      use: jest.fn(),
      eject: jest.fn(),
    },
  },
};

// Add create method after mockAxios is defined to avoid circular reference
mockAxios.create = jest.fn(() => mockAxios);

export default mockAxios;