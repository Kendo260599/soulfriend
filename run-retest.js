/**
 * Re-test only the previously-failed endpoints with corrected paths
 */
const http = require('http');
const BASE = 'http://localhost:5000';

// Re-use credentials from first run
const TEST_EMAIL = 'test_retest@test.com';
const TEST_PASS = 'TestPass123';
let userToken = '';
let userId = '';

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const opts = {
      hostname: url.hostname, port: url.port,
      path: url.pathname + url.search, method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    const r = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
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
  console.log(`${pass ? '✅' : '❌'} ${name}: ${detail}`);
}

async function run() {
  console.log('=== RETEST: Corrected paths ===\n');

  // First register & login to get token
  const regR = await req('POST', '/api/v2/auth/register', { email: TEST_EMAIL, password: TEST_PASS });
  if (regR.body.token) { userToken = regR.body.token; userId = regR.body.user?.id; }
  else {
    const loginR = await req('POST', '/api/v2/auth/login', { email: TEST_EMAIL, password: TEST_PASS });
    userToken = loginR.body.token; userId = loginR.body.user?.id;
  }
  console.log(`userId: ${userId}, token: ${userToken ? 'OK' : 'MISSING'}\n`);

  // 1. Profile - correct path /api/v2/auth/me
  try {
    const r = await req('GET', '/api/v2/auth/me', null, userToken);
    log('Get Profile (/me)', r.status === 200, `${r.status} - ${JSON.stringify(r.body).substring(0, 100)}`);
  } catch (e) { log('Get Profile', false, e.message); }

  // 2. DASS-21 Questions - correct path /api/tests/questions/DASS-21  
  try {
    const r = await req('GET', '/api/tests/questions/DASS-21');
    const count = Array.isArray(r.body) ? r.body.length : (r.body.questions?.length || r.body.data?.length || 0);
    log('DASS-21 Questions', r.status === 200, `${r.status} - items: ${count} - ${JSON.stringify(r.body).substring(0, 120)}`);
  } catch (e) { log('DASS-21 Questions', false, e.message); }

  // 3. DASS-21 Submit - correct path /api/tests/submit with testType
  try {
    const answers = Array.from({length: 21}, (_, i) => ({ questionId: i + 1, answer: Math.floor(Math.random() * 4) }));
    const r = await req('POST', '/api/tests/submit', { 
      testType: 'DASS-21', userId: userId || 'test-user', answers 
    });
    log('DASS-21 Submit', r.status === 200 || r.status === 201, 
      `${r.status} - ${JSON.stringify(r.body).substring(0, 150)}`);
  } catch (e) { log('DASS-21 Submit', false, e.message); }

  // 4. PGE Intervention (singular) - correct path /api/pge/intervention/:userId
  try {
    const r = await req('GET', `/api/pge/intervention/${userId}`, null, userToken);
    log('PGE Intervention', r.status === 200, 
      `${r.status} - ${JSON.stringify(r.body).substring(0, 150)}`);
  } catch (e) { log('PGE Intervention', false, e.message); }

  // 5. PGE Intervention History
  try {
    const r = await req('GET', `/api/pge/intervention/history/${userId}`, null, userToken);
    log('PGE Intervention History', r.status === 200, 
      `${r.status} - ${JSON.stringify(r.body).substring(0, 150)}`);
  } catch (e) { log('PGE Intervention History', false, e.message); }

  // 6. V5 Learning Stats - correct path
  try {
    const r = await req('GET', '/api/v5/learning/interactions/stats', null, userToken);
    log('V5 Learning Stats', r.status === 200, 
      `${r.status} - ${JSON.stringify(r.body).substring(0, 120)}`);
  } catch (e) { log('V5 Learning Stats', false, e.message); }

  // 7. Chat message retry (with longer timeout)
  try {
    const r = await req('POST', '/api/chatbot/message', { 
      message: 'Xin chào',
      userId: userId || 'test-user'  
    });
    log('Chat Message (retry)', r.status === 200, 
      `${r.status} - reply: ${(r.body.reply || r.body.response || JSON.stringify(r.body)).substring(0, 100)}`);
  } catch (e) { log('Chat Message (retry)', false, e.message); }

  console.log('\nDone.');
}

run().catch(e => console.error('Fatal:', e));
