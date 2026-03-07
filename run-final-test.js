/**
 * Final Comprehensive Test - SoulFriend V5.0
 * All corrected paths, single run
 */
const http = require('http');
const BASE = 'http://localhost:5000';
let userToken = '', userId = '', expertToken = '';
const STAMP = Date.now();
const results = [];

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
        let p; try { p = JSON.parse(data); } catch { p = data; }
        resolve({ status: res.statusCode, body: p });
      });
    });
    r.on('error', reject);
    r.on('timeout', () => { r.destroy(); reject(new Error('Timeout')); });
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function log(name, pass, detail) {
  const s = detail.length > 160 ? detail.substring(0, 160) + '...' : detail;
  console.log(`${pass ? '✅' : '❌'} ${name}: ${s}`);
  results.push({ name, pass, detail: s });
}

async function run() {
  console.log('='.repeat(65));
  console.log('  SoulFriend V5.0 — Final Comprehensive Test');
  console.log('  ' + new Date().toISOString());
  console.log('='.repeat(65));

  // ========== 1. HEALTH ==========
  console.log('\n📋 HEALTH');
  try {
    const r = await req('GET', '/api/health');
    log('T01 Health', r.status===200 && r.body.status==='healthy', `${r.status} v${r.body.version}`);
  } catch(e) { log('T01 Health', false, e.message); }

  // ========== 2. USER AUTH ==========
  console.log('\n🔐 USER AUTH');
  const email = `user_${STAMP}@test.com`, pass = 'TestPass123';

  try {
    const r = await req('POST', '/api/v2/auth/register', { email, password: pass });
    userToken = r.body.token || '';
    userId = r.body.user?.id || '';
    log('T02 Register', r.status===201 && r.body.success, `${r.status} userId:${userId}`);
  } catch(e) { log('T02 Register', false, e.message); }

  try {
    const r = await req('POST', '/api/v2/auth/register', { email, password: pass });
    log('T03 Dup Register', r.status===409, `${r.status}`);
  } catch(e) { log('T03 Dup Register', false, e.message); }

  try {
    const r = await req('POST', '/api/v2/auth/login', { email, password: pass });
    if (r.body.token) { userToken = r.body.token; userId = r.body.user?.id || userId; }
    log('T04 Login', r.status===200 && r.body.success, `${r.status}`);
  } catch(e) { log('T04 Login', false, e.message); }

  try {
    const r = await req('POST', '/api/v2/auth/login', { email, password: 'Wrong999' });
    log('T05 Bad Password', r.status===401, `${r.status}`);
  } catch(e) { log('T05 Bad Password', false, e.message); }

  try {
    const r = await req('GET', '/api/v2/auth/me', null, userToken);
    log('T06 Profile /me', r.status===200, `${r.status} email:${r.body.user?.email||r.body.email||'?'}`);
  } catch(e) { log('T06 Profile', false, e.message); }

  // ========== 3. EXPERT AUTH ==========
  console.log('\n👨‍⚕️ EXPERT AUTH');
  const expertEmail = `expert_${STAMP}@test.com`;
  try {
    const r = await req('POST', '/api/v2/expert/register', {
      email: expertEmail, password: pass, name: 'Dr Test', specialization: 'psychology'
    });
    if (r.body.token) expertToken = r.body.token;
    log('T07 Expert Register', r.status===201, `${r.status} ${r.body.message||''}`);
  } catch(e) { log('T07 Expert Register', false, e.message); }

  try {
    const r = await req('POST', '/api/v2/expert/login', { email: expertEmail, password: pass });
    if (r.body.token) expertToken = r.body.token;
    log('T08 Expert Login', r.status===200 && r.body.success, `${r.status} ${r.body.message||''}`);
  } catch(e) { log('T08 Expert Login', false, e.message); }

  // ========== 4. CHATBOT ==========
  console.log('\n💬 CHATBOT');
  try {
    const r = await req('POST', '/api/chatbot/message', {
      message: 'Tôi cảm thấy rất lo lắng và buồn bã gần đây, không ngủ được',
      userId: userId || 'test-user'
    });
    const reply = r.body.data?.message || r.body.reply || r.body.response || '';
    log('T09 Chat (emotional)', r.status===200, `${r.status} reply:${reply.substring(0,80)}...`);
  } catch(e) { log('T09 Chat', false, e.message); }

  try {
    const r = await req('GET', `/api/chatbot/history/${userId || 'test-user'}`);
    const len = r.body.data?.length || (Array.isArray(r.body) ? r.body.length : '?');
    log('T10 Chat History', r.status===200, `${r.status} messages:${len}`);
  } catch(e) { log('T10 Chat History', false, e.message); }

  // ========== 5. DASS-21 ==========
  console.log('\n📊 DASS-21');
  try {
    const r = await req('GET', '/api/tests/questions/DASS-21');
    const q = r.body.data?.questions;
    const count = q?.questions?.length || q?.length || 0;
    log('T11 DASS Questions', r.status===200, `${r.status} count:${count}`);
  } catch(e) { log('T11 DASS Questions', false, e.message); }

  try {
    const answers = Array.from({length:21}, (_,i) => ({
      questionId: `dass21_q${i+1}`,
      answer: Math.floor(Math.random()*4)
    }));
    const r = await req('POST', '/api/tests/submit', {
      testType: 'DASS-21', userId: userId || 'test-user', answers
    });
    log('T12 DASS Submit', r.status===200||r.status===201, `${r.status} ${JSON.stringify(r.body).substring(0,120)}`);
  } catch(e) { log('T12 DASS Submit', false, e.message); }

  // ========== 6. PGE CORE ==========
  console.log('\n🧠 PGE CORE');
  const pToken = expertToken || userToken;

  try {
    const r = await req('GET', '/api/pge/summary', null, pToken);
    log('T13 PGE Summary', r.status===200, `${r.status} states:${r.body.data?.totalStates||'?'}`);
  } catch(e) { log('T13 PGE Summary', false, e.message); }

  if (userId) {
    try {
      const r = await req('GET', `/api/pge/field-map/${userId}`, null, pToken);
      log('T14 PGE FieldMap', r.status===200, `${r.status} state:${JSON.stringify(r.body.data?.currentState||{}).substring(0,80)}`);
    } catch(e) { log('T14 PGE FieldMap', false, e.message); }

    try {
      const r = await req('GET', `/api/pge/intervention/${userId}`, null, pToken);
      log('T15 PGE Intervention', r.status===200, `${r.status} ${JSON.stringify(r.body.data||r.body).substring(0,120)}`);
    } catch(e) { log('T15 PGE Intervention', false, e.message); }

    try {
      const r = await req('GET', `/api/pge/intervention/history/${userId}`, null, pToken);
      log('T16 Intervention Hist', r.status===200, `${r.status} records:${r.body.data?.length||'?'}`);
    } catch(e) { log('T16 Intervention Hist', false, e.message); }
  }

  // ========== 7. TOPOLOGY (Phase 3) ==========
  console.log('\n🗺️ TOPOLOGY (Phase 3)');
  if (userId) {
    try {
      const r = await req('GET', `/api/pge/topology/${userId}`, null, pToken);
      const fp = r.body.data?.fixedPoints?.length || 0;
      const profile = r.body.data?.topologyProfile?.profile || '?';
      log('T17 Topology Profile', r.status===200, `${r.status} fixedPts:${fp} profile:${profile}`);
    } catch(e) { log('T17 Topology Profile', false, e.message); }

    try {
      const r = await req('GET', `/api/pge/topology/landscape/${userId}`, null, pToken);
      const pts = r.body.data?.landscape?.x?.length || 0;
      log('T18 Topology Landscape', r.status===200, `${r.status} gridSize:${pts}`);
    } catch(e) { log('T18 Topology Landscape', false, e.message); }
  }

  // ========== 8. BANDIT (Phase 5) ==========
  console.log('\n🎰 BANDIT (Phase 5)');
  if (userId) {
    try {
      const r = await req('GET', `/api/pge/bandit/${userId}`, null, pToken);
      const arms = r.body.data?.armStats?.length || 0;
      log('T19 Bandit Analytics', r.status===200, `${r.status} arms:${arms}`);
    } catch(e) { log('T19 Bandit Analytics', false, e.message); }

    try {
      const r = await req('GET', `/api/pge/bandit/select/${userId}?zone=caution&ebh=0.5`, null, pToken);
      const sel = r.body.data?.selections?.length || 0;
      log('T20 Bandit Select', r.status===200, `${r.status} selections:${sel}`);
    } catch(e) { log('T20 Bandit Select', false, e.message); }
  }

  // ========== 9. V5 KNOWLEDGE GRAPH ==========
  console.log('\n🌐 V5 SERVICES');
  try {
    const r = await req('GET', '/api/v5/knowledge-graph/stats', null, pToken);
    log('T21 KG Stats', r.status===200, `${r.status} nodes:${r.body.data?.totalNodes||'?'} edges:${r.body.data?.totalEdges||'?'}`);
  } catch(e) { log('T21 KG Stats', false, e.message); }

  try {
    const r = await req('GET', '/api/v5/learning/interactions/stats', null, pToken);
    log('T22 Learning Stats', r.status===200, `${r.status} ${JSON.stringify(r.body).substring(0,100)}`);
  } catch(e) { log('T22 Learning Stats', false, e.message); }

  // ========== 10. VALIDATION TESTS ==========
  console.log('\n🛡️ VALIDATION');
  try {
    const r = await req('POST', '/api/v2/auth/register', { email: 'invalid', password: '123' });
    log('T23 Bad Email Reject', r.status===400, `${r.status}`);
  } catch(e) { log('T23 Bad Email', false, e.message); }

  try {
    const r = await req('GET', '/api/pge/summary');
    log('T24 No Auth Token', r.status===401, `${r.status}`);
  } catch(e) { log('T24 No Auth', false, e.message); }

  try {
    const r = await req('GET', '/api/nonexistent');
    log('T25 404 Route', r.status===404, `${r.status}`);
  } catch(e) { log('T25 404', false, e.message); }

  // ========== SUMMARY ==========
  console.log('\n' + '='.repeat(65));
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`  FINAL: ${passed}/${results.length} PASSED — ${failed} FAILED`);
  console.log('='.repeat(65));

  if (failed > 0) {
    console.log('\n❌ Failed:');
    results.filter(r => !r.pass).forEach(r => console.log(`   ${r.name}: ${r.detail}`));
  }

  console.log('\n✅ Passed:');
  results.filter(r => r.pass).forEach(r => console.log(`   ${r.name}`));
}

run().catch(e => console.error('FATAL:', e));
