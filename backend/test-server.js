// Minimal test server
const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ message: 'Test server OK' });
});

app.get('/api/tests/questions/PMS', (req, res) => {
  try {
    const pms = require('./dist/data/questions/pms');
    console.log('PMS loaded successfully');
    res.json({
      success: true,
      data: pms.default || pms
    });
  } catch (error) {
    console.log('PMS error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});