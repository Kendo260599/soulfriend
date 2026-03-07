/**
 * Comprehensive Integration Test Script for SoulFriend V5.0
 * Tests: Auth, Chat, PGE, Topology, Bandit
 */

const http = require('http');

const BASE = 'http://localhost:5000';
let userToken = '';
let userId = '';
let expertToken = '';
const TEST_EMAIL = `test_${Date.now()}@test.com`;
const TEST_PASS = 'TestPass123';
const results = [];

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    
    const r = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    r.on('error', reject);
    r.on('timeout', () => { r.destroy(); reject(new Error('Timeout')); });
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function log(name, pass, detail) {
  const icon = pass ? '✅' : '❌';
  console.log(`${icon} ${name}: ${detail}`);
  results.push({ name, pass, detail });
}

async function run() {
  console.log('='.repeat(60));
  console.log('  SoulFriend V5.0 - Comprehensive Integration Tests');
  console.log('='.repeat(60));
  console.log(`Test email: ${TEST_EMAIL}\n`);

  // ==================== AUTH TESTS ====================
  console.log('\n--- AUTH TESTS ---');
  
  // 1. Health check
  try {
    const r = await req('GET', '/api/health');
    log('Health Check', r.status === 200 && r.body.status === 'healthy', 
      `${r.status} - ${r.body.message || 'no message'}`);
  } catch (e) { log('Health Check', false, e.message); }

  // 2. Register
  try {
    const r = await req('POST', '/api/v2/auth/register', { email: TEST_EMAIL, password: TEST_PASS });
    const pass = r.status === 201 && r.body.success === true;
    if (pass) {
      userToken = r.body.token;
      userId = r.body.user?.id;
    }
    log('Register User', pass, 
      `${r.status} - ${r.body.message || r.body.errors || JSON.stringify(r.body).substring(0,100)}`);
  } catch (e) { log('Register User', false, e.message); }

  // 3. Duplicate register
  try {
    const r = await req('POST', '/api/v2/auth/register', { email: TEST_EMAIL, password: TEST_PASS });
    log('Duplicate Register (expect 409)', r.status === 409, `${r.status} - ${r.body.message}`);
  } catch (e) { log('Duplicate Register', false, e.message); }

  // 4. Login
  try {
    const r = await req('POST', '/api/v2/auth/login', { email: TEST_EMAIL, password: TEST_PASS });
    const pass = r.status === 200 && r.body.success === true;
    if (pass && r.body.token) userToken = r.body.token;
    if (pass && r.body.user?.id) userId = r.body.user.id;
    log('Login User', pass, `${r.status} - ${r.body.message || 'logged in'} - userId: ${userId}`);
  } catch (e) { log('Login User', false, e.message); }

  // 5. Wrong password login
  try {
    const r = await req('POST', '/api/v2/auth/login', { email: TEST_EMAIL, password: 'WrongPass999' });
    log('Wrong Password (expect 401)', r.status === 401, `${r.status} - ${r.body.message}`);
  } catch (e) { log('Wrong Password', false, e.message); }

  // 6. Get profile
  try {
    const r = await req('GET', '/api/v2/auth/profile', null, userToken);
    log('Get Profile', r.status === 200 && r.body.success, 
      `${r.status} - email: ${r.body.user?.email || 'N/A'}`);
  } catch (e) { log('Get Profile', false, e.message); }

  // ==================== EXPERT AUTH TESTS ====================
  console.log('\n--- EXPERT AUTH TESTS ---');
  
  // 7. Expert register
  const expertEmail = `expert_${Date.now()}@test.com`;
  try {
    const r = await req('POST', '/api/v2/expert/register', { 
      email: expertEmail, password: TEST_PASS, name: 'Test Expert', specialization: 'psychology' 
    });
    const pass = r.status === 201 && r.body.success;
    if (pass && r.body.token) expertToken = r.body.token;
    log('Register Expert', pass, `${r.status} - ${r.body.message}`);
  } catch (e) { log('Register Expert', false, e.message); }

  // 8. Expert login
  try {
    const r = await req('POST', '/api/v2/expert/login', { email: expertEmail, password: TEST_PASS });
    const pass = r.status === 200 && r.body.success;
    if (pass && r.body.token) expertToken = r.body.token;
    log('Login Expert', pass, `${r.status} - ${r.body.message || 'logged in'}`);
  } catch (e) { log('Login Expert', false, e.message); }

  // ==================== CHATBOT TESTS ====================
  console.log('\n--- CHATBOT TESTS ---');
  
  // 9. Send chat message (non-auth endpoint)
  try {
    const r = await req('POST', '/api/chatbot/message', { 
      message: 'Xin chào, tôi cảm thấy hơi buồn hôm nay',
      userId: userId || 'test-user'
    });
    log('Chat Message', r.status === 200, 
      `${r.status} - reply length: ${(r.body.reply || r.body.response || '').length} chars`);
  } catch (e) { log('Chat Message', false, e.message); }

  // 10. Send message triggering emotion detection
  try {
    const r = await req('POST', '/api/chatbot/message', {
      message: 'Tôi rất lo lắng về kỳ thi sắp tới, không thể ngủ được và hay khóc',
      userId: userId || 'test-user'
    });
    log('Emotional Message', r.status === 200, 
      `${r.status} - reply: ${(r.body.reply || r.body.response || '').substring(0, 80)}...`);
  } catch (e) { log('Emotional Message', false, e.message); }

  // 11. Chat history
  try {
    const r = await req('GET', `/api/chatbot/history/${userId || 'test-user'}`);
    log('Chat History', r.status === 200, 
      `${r.status} - messages: ${Array.isArray(r.body) ? r.body.length : (r.body.history?.length || 'N/A')}`);
  } catch (e) { log('Chat History', false, e.message); }

  // ==================== DASS-21 TESTS ====================
  console.log('\n--- DASS-21 TESTS ---');
  
  // 12. Get DASS-21 questions
  try {
    const r = await req('GET', '/api/dass21/questions');
    const count = Array.isArray(r.body) ? r.body.length : (r.body.questions?.length || 0);
    log('DASS-21 Questions', r.status === 200 && count > 0, `${r.status} - ${count} questions`);
  } catch (e) { log('DASS-21 Questions', false, e.message); }

  // 13. Submit DASS-21
  try {
    const answers = Array.from({length: 21}, (_, i) => ({ questionId: i + 1, answer: Math.floor(Math.random() * 4) }));
    const r = await req('POST', '/api/dass21/submit', { userId: userId || 'test-user', answers });
    log('DASS-21 Submit', r.status === 200 || r.status === 201, 
      `${r.status} - ${JSON.stringify(r.body).substring(0, 120)}`);
  } catch (e) { log('DASS-21 Submit', false, e.message); }

  // ==================== PGE TESTS (need expert token) ====================
  console.log('\n--- PGE TESTS ---');
  const pgeToken = expertToken || userToken;
  
  // 14. PGE Summary
  try {
    const r = await req('GET', '/api/pge/summary', null, pgeToken);
    log('PGE Summary', r.status === 200, 
      `${r.status} - ${JSON.stringify(r.body).substring(0, 120)}`);
  } catch (e) { log('PGE Summary', false, e.message); }

  // 15. PGE Field Map
  if (userId) {
    try {
      const r = await req('GET', `/api/pge/field-map/${userId}`, null, pgeToken);
      log('PGE Field Map', r.status === 200, 
        `${r.status} - ${JSON.stringify(r.body).substring(0, 120)}`);
    } catch (e) { log('PGE Field Map', false, e.message); }
  } else {
    log('PGE Field Map', false, 'No userId available');
  }

  // 16. PGE Trajectory
  if (userId) {
    try {
      const r = await req('GET', `/api/pge/trajectory/${userId}`, null, pgeToken);
      log('PGE Trajectory', r.status === 200, 
        `${r.status} - ${JSON.stringify(r.body).substring(0, 120)}`);
    } catch (e) { log('PGE Trajectory', false, e.message); }
  }

  // 17. PGE Interventions
  if (userId) {
    try {
      const r = await req('GET', `/api/pge/interventions/${userId}`, null, pgeToken);
      log('PGE Interventions', r.status === 200, 
        `${r.status} - ${JSON.stringify(r.body).substring(0, 120)}`);
    } catch (e) { log('PGE Interventions', false, e.message); }
  }

  // ==================== TOPOLOGY TESTS (Phase 3) ====================
  console.log('\n--- TOPOLOGY TESTS (Phase 3) ---');
  
  if (userId) {
    // 18. Topology Profile
    try {
      const r = await req('GET', `/api/pge/topology/${userId}`, null, pgeToken);
      log('Topology Profile', r.status === 200, 
        `${r.status} - ${JSON.stringify(r.body).substring(0, 150)}`);
    } catch (e) { log('Topology Profile', false, e.message); }

    // 19. Topology Landscape
    try {
      const r = await req('GET', `/api/pge/topology/landscape/${userId}`, null, pgeToken);
      log('Topology Landscape', r.status === 200, 
        `${r.status} - ${JSON.stringify(r.body).substring(0, 150)}`);
    } catch (e) { log('Topology Landscape', false, e.message); }
  } else {
    log('Topology Profile', false, 'No userId');
    log('Topology Landscape', false, 'No userId');
  }

  // ==================== BANDIT TESTS (Phase 5) ====================
  console.log('\n--- BANDIT TESTS (Phase 5) ---');
  
  if (userId) {
    // 20. Bandit Analytics
    try {
      const r = await req('GET', `/api/pge/bandit/${userId}`, null, pgeToken);
      log('Bandit Analytics', r.status === 200, 
        `${r.status} - ${JSON.stringify(r.body).substring(0, 150)}`);
    } catch (e) { log('Bandit Analytics', false, e.message); }

    // 21. Bandit Select Arm
    try {
      const r = await req('GET', `/api/pge/bandit/select/${userId}?zone=caution&ebh=0.5`, null, pgeToken);
      log('Bandit Select Arm', r.status === 200, 
        `${r.status} - ${JSON.stringify(r.body).substring(0, 150)}`);
    } catch (e) { log('Bandit Select Arm', false, e.message); }
  } else {
    log('Bandit Analytics', false, 'No userId');
    log('Bandit Select Arm', false, 'No userId');
  }

  // ==================== V5 ENDPOINTS TESTS ====================
  console.log('\n--- V5 ENDPOINTS ---');
  
  // 22. Knowledge Graph
  try {
    const r = await req('GET', '/api/v5/knowledge-graph/stats', null, pgeToken);
    log('Knowledge Graph Stats', r.status === 200, 
      `${r.status} - ${JSON.stringify(r.body).substring(0, 120)}`);
  } catch (e) { log('Knowledge Graph Stats', false, e.message); }

  // 23. Self-Improving stats
  try {
    const r = await req('GET', '/api/v5/self-improving/stats', null, pgeToken);
    log('Self-Improving Stats', r.status === 200, 
      `${r.status} - ${JSON.stringify(r.body).substring(0, 120)}`);
  } catch (e) { log('Self-Improving Stats', false, e.message); }

  // ==================== SUMMARY ====================
  console.log('\n' + '='.repeat(60));
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${results.length} total`);
  console.log('='.repeat(60));
  
  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.pass).forEach(r => console.log(`  ❌ ${r.name}: ${r.detail}`));
  }
  
  console.log('\nDone.');
}

run().catch(e => console.error('Fatal:', e));
