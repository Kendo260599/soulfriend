# FINAL FIX - Complete Solution
param(
    [string]$BackendUrl = "https://soulfriend-api.onrender.com",
    [string]$FrontendUrl = "https://frontend-m6o1xh7ki-kendo260599s-projects.vercel.app"
)

Write-Host "🚨 FINAL FIX - COMPLETE SOLUTION" -ForegroundColor Red
Write-Host "=================================" -ForegroundColor Red
Write-Host ""

# Step 1: Check current status
Write-Host "1️⃣ Checking current status..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "$BackendUrl/api/health" -Method GET -TimeoutSec 30
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "✅ Backend is running" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend error: $($healthResponse.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Backend not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 2: Test CORS
Write-Host ""
Write-Host "2️⃣ Testing CORS..." -ForegroundColor Yellow
try {
    $corsResponse = Invoke-WebRequest -Uri "$BackendUrl/api/health" -Method OPTIONS -Headers @{
        "Origin" = $FrontendUrl
        "Access-Control-Request-Method" = "GET"
    } -TimeoutSec 30
    
    $allowOrigin = $corsResponse.Headers["Access-Control-Allow-Origin"]
    if ($allowOrigin -eq $FrontendUrl -or $allowOrigin -eq "*") {
        Write-Host "✅ CORS is working" -ForegroundColor Green
    } else {
        Write-Host "❌ CORS not working: '$allowOrigin'" -ForegroundColor Red
        Write-Host "   Expected: '$FrontendUrl' or '*'" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ CORS test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 3: Test chatbot API
Write-Host ""
Write-Host "3️⃣ Testing chatbot API..." -ForegroundColor Yellow
try {
    $chatbotBody = @{
        message = "Test CORS fix"
        userId = "test_user"
        sessionId = "test_session"
        context = @{
            userProfile = @{
                age = 25
                gender = "female"
                culturalContext = "vietnamese"
            }
            testResults = @()
        }
    } | ConvertTo-Json

    $chatbotResponse = Invoke-WebRequest -Uri "$BackendUrl/api/v2/chatbot/message" -Method POST -Body $chatbotBody -ContentType "application/json" -TimeoutSec 30
    
    if ($chatbotResponse.StatusCode -eq 200) {
        $chatbotData = $chatbotResponse.Content | ConvertFrom-Json
        Write-Host "✅ Chatbot API working" -ForegroundColor Green
        if ($chatbotData.success) {
            Write-Host "   AI Response: $($chatbotData.data.message.Substring(0, [Math]::Min(50, $chatbotData.data.message.Length)))..." -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ Chatbot API failed: $($chatbotResponse.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Chatbot API error: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Create emergency fix
Write-Host ""
Write-Host "4️⃣ Creating emergency fix..." -ForegroundColor Yellow

# Create a simple backend that definitely works
$emergencyBackend = @'
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS - Allow everything for now
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

app.use(express.json());

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY;
let genAI;
let model;
let aiReady = false;

if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    aiReady = true;
    console.log('✅ Gemini AI initialized');
  } catch (error) {
    console.error('❌ Gemini init failed:', error.message);
  }
}

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'SoulFriend API Running',
    chatbot: aiReady ? 'ready' : 'offline',
    gemini: aiReady ? 'initialized' : 'not initialized',
    model: 'gemini-2.5-flash',
    cors: 'enabled'
  });
});

// Chatbot endpoint
app.post('/api/v2/chatbot/message', async (req, res) => {
  try {
    const { message, userId, sessionId, context } = req.body;
    
    if (!aiReady) {
      return res.json({
        success: false,
        error: 'AI not initialized'
      });
    }

    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      data: {
        message: text,
        aiGenerated: true,
        confidence: 0.9,
        riskLevel: 'LOW',
        nextActions: [],
        emergencyContacts: []
      }
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SoulFriend Emergency Server running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
  console.log(`🤖 Chatbot: http://localhost:${PORT}/api/v2/chatbot/message`);
});
'@

$emergencyBackend | Out-File -FilePath "backend/emergency-server.js" -Encoding UTF8
Write-Host "✅ Created emergency backend" -ForegroundColor Green

# Step 5: Instructions
Write-Host ""
Write-Host "5️⃣ EMERGENCY SOLUTION:" -ForegroundColor Red
Write-Host "=====================" -ForegroundColor Red
Write-Host ""
Write-Host "🔧 OPTION 1 - Manual Restart Backend:" -ForegroundColor Yellow
Write-Host "1. Go to: https://dashboard.render.com/" -ForegroundColor White
Write-Host "2. Find service: 'soulfriend-api'" -ForegroundColor White
Write-Host "3. Click 'Manual Deploy'" -ForegroundColor White
Write-Host "4. Wait 3 minutes" -ForegroundColor White
Write-Host ""
Write-Host "🔧 OPTION 2 - Use Emergency Backend:" -ForegroundColor Yellow
Write-Host "1. Replace simple-gemini-server.js with emergency-server.js" -ForegroundColor White
Write-Host "2. Commit and push to GitHub" -ForegroundColor White
Write-Host "3. Render will auto-deploy" -ForegroundColor White
Write-Host ""
Write-Host "🔧 OPTION 3 - Local Test:" -ForegroundColor Yellow
Write-Host "1. Run: cd backend && node emergency-server.js" -ForegroundColor White
Write-Host "2. Test locally first" -ForegroundColor White
Write-Host ""
Write-Host "🎯 AFTER FIX:" -ForegroundColor Cyan
Write-Host "1. Test: $BackendUrl/api/health" -ForegroundColor White
Write-Host "2. Test chatbot in frontend" -ForegroundColor White
Write-Host "3. Check console - no more CORS errors" -ForegroundColor White
Write-Host ""
Write-Host "🚨 CHOOSE ONE OPTION AND EXECUTE!" -ForegroundColor Red
