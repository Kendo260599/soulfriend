// Pure Node.js HTTP server without Express
const http = require('http');
const url = require('url');

console.log('🔧 Starting pure HTTP server...');

// Load PMS data trước
let pmsData = null;
try {
  const pms = require('./dist/data/questions/pms');
  pmsData = pms.default;
  console.log('✅ PMS data loaded successfully');
} catch (error) {
  console.error('❌ Failed to load PMS data:', error.message);
}

const server = http.createServer((req, res) => {
  console.log(`📥 ${req.method} ${req.url}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  const parsedUrl = url.parse(req.url, true);
  
  if (parsedUrl.pathname === '/api/health') {
    console.log('✅ Health check called');
    res.writeHead(200);
    res.end(JSON.stringify({ 
      message: 'Pure HTTP server OK', 
      timestamp: new Date().toISOString() 
    }));
    return;
  }
  
  if (parsedUrl.pathname === '/api/tests/questions/PMS') {
    console.log('📋 PMS endpoint called');
    if (pmsData) {
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        data: pmsData,
        timestamp: new Date().toISOString()
      }));
    } else {
      res.writeHead(500);
      res.end(JSON.stringify({
        success: false,
        error: 'PMS data not available'
      }));
    }
    return;
  }
  
  // 404 for other routes
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 3003;

server.listen(PORT, 'localhost', () => {
  console.log('🚀 Pure HTTP server started successfully');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 PMS endpoint: http://localhost:${PORT}/api/tests/questions/PMS`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

// Process error handling
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});