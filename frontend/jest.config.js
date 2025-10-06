// Jest configuration for SOULFRIEND V2.0
module.exports = {
  preset: 'react-app', // Use Create React App's preset
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    // Mock axios for Jest
    '^axios$': '<rootDir>/src/__mocks__/axios.ts',
    // Handle CSS imports
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(axios)/)', // Transform axios in node_modules
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
  ],
};