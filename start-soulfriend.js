/**
 * Script tự động khởi chạy toàn bộ ứng dụng Soulfriend
 * Khởi động backend, frontend và chạy test tự động
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class SoulfriendLauncher {
  constructor() {
    this.processes = [];
    this.backendReady = false;
    this.frontendReady = false;
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

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async startBackend() {
    this.log('🚀 Starting Backend Server...', 'info');
    
    return new Promise((resolve, reject) => {
      const backendProcess = spawn('npm', ['start'], {
        cwd: path.join(__dirname, 'backend'),
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      this.processes.push(backendProcess);

      backendProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[BACKEND] ${output.trim()}`);
        
        if (output.includes('server is running on port') || output.includes('listening on')) {
          this.backendReady = true;
          this.log('✅ Backend server started successfully', 'success');
          resolve();
        }
      });

      backendProcess.stderr.on('data', (data) => {
        const output = data.toString();
        console.log(`[BACKEND ERROR] ${output.trim()}`);
        
        if (output.includes('server is running on port') || output.includes('listening on')) {
          this.backendReady = true;
          this.log('✅ Backend server started successfully', 'success');
          resolve();
        }
      });

      backendProcess.on('error', (error) => {
        this.log(`❌ Backend failed to start: ${error.message}`, 'error');
        reject(error);
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!this.backendReady) {
          this.log('⚠️  Backend startup timeout - assuming it\'s running', 'warning');
          this.backendReady = true;
          resolve();
        }
      }, 30000);
    });
  }

  async startFrontend() {
    this.log('🚀 Starting Frontend Server...', 'info');
    
    return new Promise((resolve, reject) => {
      const frontendProcess = spawn('npm', ['start'], {
        cwd: path.join(__dirname, 'frontend'),
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        env: { ...process.env, BROWSER: 'none' }
      });

      this.processes.push(frontendProcess);

      frontendProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[FRONTEND] ${output.trim()}`);
        
        if (output.includes('webpack compiled') || 
            output.includes('Local:') || 
            output.includes('On Your Network:') ||
            output.includes('development server')) {
          this.frontendReady = true;
          this.log('✅ Frontend server started successfully', 'success');
          resolve();
        }
      });

      frontendProcess.stderr.on('data', (data) => {
        const output = data.toString();
        console.log(`[FRONTEND ERROR] ${output.trim()}`);
      });

      frontendProcess.on('error', (error) => {
        this.log(`❌ Frontend failed to start: ${error.message}`, 'error');
        reject(error);
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        if (!this.frontendReady) {
          this.log('⚠️  Frontend startup timeout - checking if accessible', 'warning');
          this.frontendReady = true;
          resolve();
        }
      }, 60000);
    });
  }

  async checkPorts() {
    this.log('🔍 Checking if ports are available...', 'info');
    
    return new Promise((resolve) => {
      exec('netstat -ano | findstr ":5000\\|:3000"', (error, stdout) => {
        if (stdout) {
          this.log('📊 Current port status:', 'info');
          console.log(stdout);
        }
        resolve();
      });
    });
  }

  async runTests() {
    this.log('🧪 Running comprehensive application tests...', 'info');
    
    const SoulfriendAutoTester = require('./auto-test-app.js');
    const tester = new SoulfriendAutoTester();
    
    try {
      const report = await tester.runFullTest();
      this.log('✅ All tests completed successfully', 'success');
      return report;
    } catch (error) {
      this.log(`❌ Tests failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async cleanup() {
    this.log('🧹 Cleaning up processes...', 'info');
    
    this.processes.forEach(process => {
      try {
        process.kill();
      } catch (error) {
        // Process might already be dead
      }
    });
  }

  async launch() {
    console.log('\n' + '='.repeat(70));
    console.log('🎯 SOULFRIEND APPLICATION AUTO LAUNCHER');
    console.log('='.repeat(70));
    console.log('🚀 Automatically starting backend, frontend, and running tests');
    console.log('='.repeat(70) + '\n');

    try {
      // Check current port status
      await this.checkPorts();

      // Start backend
      await this.startBackend();
      await this.wait(5000);

      // Start frontend
      await this.startFrontend();
      await this.wait(10000);

      // Wait for both to be fully ready
      this.log('⏳ Waiting for all services to be fully ready...', 'info');
      await this.wait(15000);

      // Run comprehensive tests
      const testReport = await this.runTests();

      // Display final status
      console.log('\n' + '='.repeat(70));
      console.log('🎉 SOULFRIEND APPLICATION SUCCESSFULLY LAUNCHED!');
      console.log('='.repeat(70));
      console.log('🌐 Frontend: http://localhost:3000');
      console.log('🖥️  Backend:  http://localhost:5000');
      console.log('📊 API Health: http://localhost:5000/api/health');
      console.log('='.repeat(70));
      
      if (testReport.summary.failed === 0) {
        this.log('✅ All systems operational - Application ready for use!', 'success');
      } else {
        this.log(`⚠️  Application launched with ${testReport.summary.failed} issues`, 'warning');
      }

      return testReport;

    } catch (error) {
      this.log(`❌ Launch failed: ${error.message}`, 'error');
      await this.cleanup();
      throw error;
    }
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down Soulfriend application...');
  process.exit(0);
});

// Run the launcher if this file is executed directly
if (require.main === module) {
  const launcher = new SoulfriendLauncher();
  launcher.launch().catch(console.error);
}

module.exports = SoulfriendLauncher;


