// Debug version với detailed error logging
const express = require('express');
const cors = require('cors');

console.log('🔧 Starting debug server...');

const app = express();

// Middleware với error handling
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ error: err.message });
});

// Simple health check
app.get('/api/health', (req, res) => {
  console.log('✅ Health check called');
  res.json({ message: 'Debug server OK', timestamp: new Date().toISOString() });
});

// PMS endpoint với detailed logging
app.get('/api/tests/questions/PMS', (req, res) => {
  console.log('📋 PMS endpoint called');
  try {
    console.log('Loading PMS module...');
    const pms = require('./dist/data/questions/pms');
    console.log('PMS module loaded successfully');
    
    const response = {
      success: true,
      data: pms.default,
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Sending PMS response');
    res.json(response);
  } catch (error) {
    console.error('❌ PMS Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

const PORT = 3002;

// Server startup với error handling
const server = app.listen(PORT, () => {
  console.log('🚀 Debug server started successfully');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
}).on('error', (err) => {
  console.error('❌ Server startup error:', err);
});

// Process error handling
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});