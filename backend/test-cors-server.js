/**
 * ULTRA-SIMPLE CORS Test Server
 * Run: node test-cors-server.js
 * Test: curl -X OPTIONS http://localhost:5000/api/v2/chatbot/message -H "Origin: https://soulfriend-kendo260599s-projects.vercel.app" -v
 */

require('dotenv').config({ path: './.env' });

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🧪 Starting CORS Test Server...\n');

// STEP 1: OPTIONS handler FIRST (before any other middleware)
app.options(/.*/, (req, res) => {
  console.log('📨 OPTIONS request received:', req.path);
  console.log('   Origin:', req.headers.origin);

  const origin = req.headers.origin;

  // Set CORS headers
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Vary', 'Origin');
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-API-Version');
  res.header('Access-Control-Max-Age', '86400');

  console.log('✅ CORS headers set');
  res.status(204).end();
});

// STEP 2: CORS middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Version'],
}));

// STEP 3: Custom CORS middleware (backup)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Vary', 'Origin');
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-API-Version');

  if (req.method === 'OPTIONS') {
    console.log('📨 OPTIONS handled in middleware');
    res.status(204).end();
    return;
  }
  next();
});

// Test endpoint
app.post('/api/v2/chatbot/message', (req, res) => {
  console.log('📨 POST request received');
  res.json({ message: 'CORS test successful!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', cors: 'configured' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ CORS Test Server started on port ${PORT}`);
  console.log(`\n🧪 Test with:`);
  console.log(`   curl -X OPTIONS http://localhost:${PORT}/api/v2/chatbot/message \\`);
  console.log(`     -H "Origin: https://soulfriend-kendo260599s-projects.vercel.app" \\`);
  console.log(`     -H "Access-Control-Request-Method: POST" \\`);
  console.log(`     -v\n`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});










