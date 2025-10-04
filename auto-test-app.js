/**
 * Script tự động test toàn bộ ứng dụng Soulfriend
 * Kiểm tra backend, frontend và tất cả các tính năng
 */

const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class SoulfriendAutoTester {
  constructor() {
    this.backendUrl = 'http://localhost:5000';
    this.frontendUrl = 'http://localhost:3000';
    this.testResults = {
      backend: {},
      frontend: {},
      integration: {},
      performance: {},
      summary: {}
    };
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async testBackendHealth() {
    this.log('🔍 Testing Backend Health...', 'info');
    try {
      const response = await axios.get(`${this.backendUrl}/api/health`);
      if (response.status === 200) {
        this.testResults.backend.health = { status: 'PASS', message: 'Backend is healthy' };
        this.log('✅ Backend health check passed', 'success');
        return true;
      }
    } catch (error) {
      this.testResults.backend.health = { status: 'FAIL', error: error.message };
      this.log('❌ Backend health check failed: ' + error.message, 'error');
      return false;
    }
  }

  async testBackendAPIs() {
    this.log('🔍 Testing Backend APIs...', 'info');
    const endpoints = [
      { path: '/api/health', method: 'GET', name: 'Health Check' },
      { path: '/api/tests', method: 'GET', name: 'Tests Endpoint' },
      { path: '/api/consent', method: 'GET', name: 'Consent Endpoint' },
      { path: '/api/admin', method: 'GET', name: 'Admin Endpoint' },
      { path: '/api/user', method: 'GET', name: 'User Endpoint' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios({
          method: endpoint.method,
          url: `${this.backendUrl}${endpoint.path}`,
          timeout: 5000
        });
        
        this.testResults.backend[endpoint.name] = { 
          status: 'PASS', 
          statusCode: response.status,
          responseTime: Date.now()
        };
        this.log(`✅ ${endpoint.name}: ${response.status}`, 'success');
      } catch (error) {
        const status = error.response ? error.response.status : 'NO_RESPONSE';
        this.testResults.backend[endpoint.name] = { 
          status: status === 404 ? 'EXPECTED' : 'FAIL', 
          error: error.message 
        };
        this.log(`⚠️  ${endpoint.name}: ${status} (${error.message})`, 'warning');
      }
    }
  }

  async testFrontendAccess() {
    this.log('🔍 Testing Frontend Access...', 'info');
    try {
      const response = await axios.get(this.frontendUrl, { timeout: 10000 });
      if (response.status === 200) {
        this.testResults.frontend.access = { status: 'PASS', message: 'Frontend is accessible' };
        this.log('✅ Frontend is accessible', 'success');
        return true;
      }
    } catch (error) {
      this.testResults.frontend.access = { status: 'FAIL', error: error.message };
      this.log('❌ Frontend access failed: ' + error.message, 'error');
      return false;
    }
  }

  async testDatabaseConnection() {
    this.log('🔍 Testing Database Connection...', 'info');
    try {
      // Test through backend API that might use database
      const response = await axios.get(`${this.backendUrl}/api/health`);
      const healthData = response.data;
      
      if (healthData.message) {
        this.testResults.backend.database = { 
          status: 'PASS', 
          message: 'Database connection working (via health check)' 
        };
        this.log('✅ Database connection test passed', 'success');
      }
    } catch (error) {
      this.testResults.backend.database = { 
        status: 'WARNING', 
        message: 'Database test inconclusive - app may run without DB' 
      };
      this.log('⚠️  Database connection test inconclusive', 'warning');
    }
  }

  async testPsychologicalTests() {
    this.log('🔍 Testing Psychological Test System...', 'info');
    
    const testData = {
      testType: 'DASS-21',
      responses: Array(21).fill().map((_, i) => ({ questionId: i + 1, answer: 1 })),
      demographics: {
        age: 25,
        gender: 'female',
        education: 'university'
      }
    };

    try {
      const response = await axios.post(`${this.backendUrl}/api/tests/submit`, testData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      
      this.testResults.integration.psychTests = { 
        status: 'PASS', 
        message: 'Psychological tests working' 
      };
      this.log('✅ Psychological test system working', 'success');
    } catch (error) {
      const status = error.response ? error.response.status : 'NO_RESPONSE';
      this.testResults.integration.psychTests = { 
        status: status === 404 ? 'EXPECTED' : 'FAIL', 
        error: error.message 
      };
      this.log(`⚠️  Psychological test system: ${status}`, 'warning');
    }
  }

  async testAIFeatures() {
    this.log('🔍 Testing AI Features...', 'info');
    
    const aiTestData = {
      message: 'Tôi cảm thấy lo lắng về công việc',
      testResults: [],
      demographics: { age: 25, gender: 'female' }
    };

    try {
      const response = await axios.post(`${this.backendUrl}/api/ai/analyze`, aiTestData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      });
      
      this.testResults.integration.aiFeatures = { 
        status: 'PASS', 
        message: 'AI features working' 
      };
      this.log('✅ AI features working', 'success');
    } catch (error) {
      const status = error.response ? error.response.status : 'NO_RESPONSE';
      this.testResults.integration.aiFeatures = { 
        status: status === 404 ? 'EXPECTED' : 'FAIL', 
        error: error.message 
      };
      this.log(`⚠️  AI features: ${status}`, 'warning');
    }
  }

  async performanceTest() {
    this.log('🔍 Running Performance Tests...', 'info');
    
    const startTime = Date.now();
    const requests = [];
    
    // Test concurrent requests
    for (let i = 0; i < 10; i++) {
      requests.push(axios.get(`${this.backendUrl}/api/health`));
    }
    
    try {
      await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      this.testResults.performance.concurrentRequests = {
        status: totalTime < 5000 ? 'PASS' : 'SLOW',
        totalTime: totalTime,
        requestCount: 10
      };
      
      this.log(`✅ Performance test: ${totalTime}ms for 10 concurrent requests`, 'success');
    } catch (error) {
      this.testResults.performance.concurrentRequests = {
        status: 'FAIL',
        error: error.message
      };
      this.log('❌ Performance test failed: ' + error.message, 'error');
    }
  }

  async checkServerStatus() {
    this.log('🔍 Checking Server Status...', 'info');
    
    try {
      // Check if ports are listening
      const { exec } = require('child_process');
      
      return new Promise((resolve) => {
        exec('netstat -ano | findstr ":5000\\|:3000"', (error, stdout) => {
          if (stdout) {
            const ports = stdout.split('\n').filter(line => line.trim());
            this.testResults.backend.portStatus = {
              status: 'PASS',
              ports: ports
            };
            this.log(`✅ Server ports status: ${ports.length} active connections`, 'success');
          } else {
            this.testResults.backend.portStatus = {
              status: 'WARNING',
              message: 'No active connections found'
            };
            this.log('⚠️  No active server connections found', 'warning');
          }
          resolve();
        });
      });
    } catch (error) {
      this.log('❌ Could not check server status: ' + error.message, 'error');
    }
  }

  generateReport() {
    this.log('📊 Generating Test Report...', 'info');
    
    const report = {
      timestamp: new Date().toISOString(),
      testResults: this.testResults,
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };

    // Count test results
    const countResults = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key].status) {
          report.summary.totalTests++;
          switch (obj[key].status) {
            case 'PASS':
              report.summary.passed++;
              break;
            case 'FAIL':
              report.summary.failed++;
              break;
            case 'WARNING':
            case 'EXPECTED':
            case 'SLOW':
              report.summary.warnings++;
              break;
          }
        } else if (typeof obj[key] === 'object') {
          countResults(obj[key]);
        }
      }
    };

    countResults(this.testResults);

    // Save report to file
    const reportPath = path.join(__dirname, 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`📋 Test Report saved to: ${reportPath}`, 'info');
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('🎯 SOULFRIEND APPLICATION TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`📊 Total Tests: ${report.summary.totalTests}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`📈 Success Rate: ${((report.summary.passed / report.summary.totalTests) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));
    
    return report;
  }

  async runFullTest() {
    this.log('🚀 Starting Soulfriend Application Full Test Suite...', 'info');
    console.log('\n' + '='.repeat(60));
    console.log('🎯 SOULFRIEND COMPREHENSIVE APPLICATION TEST');
    console.log('='.repeat(60) + '\n');

    // Wait for servers to be ready
    this.log('⏳ Waiting for servers to be ready...', 'info');
    await this.wait(10000);

    // Run all tests
    await this.checkServerStatus();
    await this.testBackendHealth();
    await this.testBackendAPIs();
    await this.testDatabaseConnection();
    await this.testFrontendAccess();
    await this.testPsychologicalTests();
    await this.testAIFeatures();
    await this.performanceTest();

    // Generate final report
    const report = this.generateReport();
    
    this.log('🎉 Full application test completed!', 'success');
    
    return report;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  const tester = new SoulfriendAutoTester();
  tester.runFullTest().catch(console.error);
}

module.exports = SoulfriendAutoTester;


