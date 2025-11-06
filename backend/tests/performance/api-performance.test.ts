/**
 * Performance Tests for Backend API
 * Tests response times, load handling, and memory usage
 */

import request from 'supertest';
import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../../src/index';

describe('API Performance Tests', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    // Use in-memory MongoDB for performance testing
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  describe('Response Time Tests', () => {
    it('should respond to health check within 100ms', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/tests/health-check')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(100);
    });

    it('should process chatbot message within 2 seconds', async () => {
      const startTime = Date.now();
      
      await request(app)
        .post('/api/v2/chatbot/message')
        .send({
          message: 'Xin chào',
          sessionId: 'perf_test_session',
          userId: 'perf_test_user',
        });
      
      const responseTime = Date.now() - startTime;
      console.log(`Chatbot response time: ${responseTime}ms`);
      expect(responseTime).toBeLessThan(2000);
    });

    it('should process crisis detection within 1 second', async () => {
      const startTime = Date.now();
      
      await request(app)
        .post('/api/v2/chatbot/message')
        .send({
          message: 'Tôi muốn chết',
          sessionId: 'crisis_perf_test',
          userId: 'crisis_perf_user',
        });
      
      const responseTime = Date.now() - startTime;
      console.log(`Crisis detection response time: ${responseTime}ms`);
      expect(responseTime).toBeLessThan(1000);
    });

    it('should retrieve test questions within 200ms', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/tests/questions/PHQ-9')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(200);
    });
  });

  describe('Load Testing - Concurrent Requests', () => {
    it('should handle 10 concurrent health checks', async () => {
      const requests = Array(10).fill(null).map(() => 
        request(app)
          .get('/api/tests/health-check')
          .expect(200)
      );
      
      const startTime = Date.now();
      await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      
      console.log(`10 concurrent health checks completed in ${totalTime}ms`);
      expect(totalTime).toBeLessThan(1000); // All should complete within 1 second
    });

    it('should handle 5 concurrent chatbot messages', async () => {
      const messages = [
        'Xin chào',
        'Tôi cảm thấy buồn',
        'Làm sao để vui hơn?',
        'Tôi cần giúp đỡ',
        'Cảm ơn bạn',
      ];
      
      const requests = messages.map((msg, idx) => 
        request(app)
          .post('/api/v2/chatbot/message')
          .send({
            message: msg,
            sessionId: `concurrent_test_${idx}`,
            userId: `concurrent_user_${idx}`,
          })
      );
      
      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      
      console.log(`5 concurrent chatbot requests completed in ${totalTime}ms`);
      expect(responses.every(r => r.status === 200 || r.status === 201)).toBe(true);
      expect(totalTime).toBeLessThan(5000); // All should complete within 5 seconds
    });

    it('should handle 20 concurrent test question requests', async () => {
      const testTypes = ['PHQ-9', 'GAD-7', 'DASS-21'];
      const requests = Array(20).fill(null).map((_, idx) => 
        request(app)
          .get(`/api/tests/questions/${testTypes[idx % testTypes.length]}`)
          .expect(200)
      );
      
      const startTime = Date.now();
      await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      
      console.log(`20 concurrent question requests completed in ${totalTime}ms`);
      expect(totalTime).toBeLessThan(2000);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not leak memory with repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await request(app)
          .get('/api/tests/health-check')
          .expect(200);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB
      
      console.log(`Memory increase after 100 requests: ${memoryIncrease.toFixed(2)}MB`);
      expect(memoryIncrease).toBeLessThan(50); // Should not increase by more than 50MB
    });

    it('should handle large message payloads efficiently', async () => {
      const largeMessage = 'Tôi cảm thấy rất buồn. '.repeat(100); // ~2.3KB message
      const initialMemory = process.memoryUsage().heapUsed;
      
      await request(app)
        .post('/api/v2/chatbot/message')
        .send({
          message: largeMessage,
          sessionId: 'large_payload_test',
          userId: 'large_payload_user',
        });
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB
      
      console.log(`Memory increase for large payload: ${memoryIncrease.toFixed(2)}MB`);
      expect(memoryIncrease).toBeLessThan(20); // Should not increase by more than 20MB
    });
  });

  describe('Throughput Tests', () => {
    it('should maintain throughput over sustained load', async () => {
      const duration = 5000; // 5 seconds
      const startTime = Date.now();
      let requestCount = 0;
      
      const makeRequest = async () => {
        await request(app)
          .get('/api/tests/health-check')
          .expect(200);
        requestCount++;
      };
      
      // Keep making requests for the duration
      const requests: Promise<void>[] = [];
      while (Date.now() - startTime < duration) {
        requests.push(makeRequest());
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      await Promise.all(requests);
      
      const actualDuration = (Date.now() - startTime) / 1000;
      const throughput = requestCount / actualDuration;
      
      console.log(`Throughput: ${throughput.toFixed(2)} requests/second over ${actualDuration.toFixed(2)}s`);
      console.log(`Total requests: ${requestCount}`);
      
      expect(throughput).toBeGreaterThan(10); // Should handle at least 10 req/s
    });
  });

  describe('Database Performance', () => {
    it('should query test results efficiently', async () => {
      // Create some test data first
      const consentResponse = await request(app)
        .post('/api/consent')
        .send({
          consentGiven: true,
          termsAccepted: true,
          privacyPolicyAccepted: true,
        });
      
      const consentId = consentResponse.body.data._id;
      
      // Submit a test result
      await request(app)
        .post('/api/tests/submit')
        .send({
          consentId,
          testType: 'PHQ-9',
          answers: Array(9).fill({ questionId: 'q1', score: 2 }),
        });
      
      // Query with timing
      const startTime = Date.now();
      await request(app)
        .get('/api/tests/results')
        .expect(200);
      
      const queryTime = Date.now() - startTime;
      console.log(`Database query time: ${queryTime}ms`);
      
      expect(queryTime).toBeLessThan(500);
    });
  });

  describe('Rate Limiting Performance', () => {
    it('should efficiently handle rate-limited requests', async () => {
      const requests = Array(50).fill(null).map((_, idx) => 
        request(app)
          .get('/api/tests/health-check')
      );
      
      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      
      const successCount = responses.filter(r => r.status === 200).length;
      const rateLimitedCount = responses.filter(r => r.status === 429).length;
      
      console.log(`50 requests: ${successCount} succeeded, ${rateLimitedCount} rate-limited in ${totalTime}ms`);
      
      // Rate limiting should work without crashing
      expect(successCount + rateLimitedCount).toBe(50);
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });
});

describe('API Performance Benchmarks', () => {
  it('should log performance metrics for key endpoints', async () => {
    const endpoints = [
      { method: 'get', path: '/api/tests/health-check', name: 'Health Check' },
      { method: 'get', path: '/api/tests/questions/PHQ-9', name: 'Get Test Questions' },
      { method: 'post', path: '/api/v2/chatbot/message', name: 'Chatbot Message', 
        body: { message: 'Test', sessionId: 'bench', userId: 'bench' } },
    ];
    
    console.log('\n=== API Performance Benchmarks ===\n');
    
    for (const endpoint of endpoints) {
      const times: number[] = [];
      
      // Run each endpoint 10 times
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        
        if (endpoint.method === 'get') {
          await request(app).get(endpoint.path);
        } else if (endpoint.method === 'post' && endpoint.body) {
          await request(app).post(endpoint.path).send(endpoint.body);
        }
        
        times.push(Date.now() - startTime);
      }
      
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];
      
      console.log(`${endpoint.name}:`);
      console.log(`  Avg: ${avg.toFixed(2)}ms`);
      console.log(`  Min: ${min}ms`);
      console.log(`  Max: ${max}ms`);
      console.log(`  P95: ${p95}ms\n`);
    }
    
    expect(true).toBe(true); // This test always passes, it's just for logging
  });
});

