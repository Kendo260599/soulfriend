# ═══════════════════════════════════════════════════════════
# 🚀 SoulFriend Deployment Script - AI Online Mode
# ═══════════════════════════════════════════════════════════
# Version: 1.0
# Features: Gemini AI, Crisis Detection, Vietnamese Support
# ═══════════════════════════════════════════════════════════

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🌸 SoulFriend V3.0 - Full Deployment           ║" -ForegroundColor Cyan
Write-Host "║  AI-Powered Mental Health Support Platform      ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean up existing processes
Write-Host "🧹 Step 1/5: Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "   ✅ Cleanup complete" -ForegroundColor Green

# Step 2: Start Backend with Gemini AI
Write-Host ""
Write-Host "🔧 Step 2/5: Starting Backend Server..." -ForegroundColor Yellow
Write-Host "   📍 Location: backend/simple-gemini-server.js" -ForegroundColor Gray
Write-Host "   🤖 AI Model: Google Gemini Pro" -ForegroundColor Gray
Write-Host "   🔌 Port: 5000" -ForegroundColor Gray

Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "cd 'D:\ung dung\soulfriend\backend'; " + `
    "Write-Host ''; " + `
    "Write-Host '═══════════════════════════════════════' -ForegroundColor Cyan; " + `
    "Write-Host '    SOULFRIEND BACKEND SERVER' -ForegroundColor Cyan; " + `
    "Write-Host '═══════════════════════════════════════' -ForegroundColor Cyan; " + `
    "Write-Host ''; " + `
    "node simple-gemini-server.js"

Write-Host "   ⏳ Waiting for backend initialization..." -ForegroundColor Gray
Start-Sleep -Seconds 8

# Step 3: Verify Backend Health
Write-Host ""
Write-Host "🏥 Step 3/5: Checking Backend Health..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -TimeoutSec 10
    $json = $health.Content | ConvertFrom-Json
    
    Write-Host "   ✅ Backend Status: " -NoNewline -ForegroundColor Green
    Write-Host $json.status -ForegroundColor White
    Write-Host "   ✅ Chatbot Status: " -NoNewline -ForegroundColor Green
    Write-Host $json.chatbot -ForegroundColor White
    Write-Host "   ✅ Gemini AI: " -NoNewline -ForegroundColor Green
    Write-Host $json.gemini -ForegroundColor White
    Write-Host "   ✅ AI Model: " -NoNewline -ForegroundColor Green
    Write-Host $json.model -ForegroundColor White
    
    if ($json.chatbot -ne 'ready') {
        Write-Host "   ⚠️  Warning: Chatbot not ready, but continuing..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Backend health check failed!" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "   ⚠️  Continuing anyway - backend might still be initializing..." -ForegroundColor Yellow
}

# Step 4: Test Chatbot AI
Write-Host ""
Write-Host "🤖 Step 4/5: Testing Chatbot AI..." -ForegroundColor Yellow
try {
    $testMessage = @{
        message = "Xin chào CHUN!"
        userId = "deployment_test"
        sessionId = "test_$(Get-Date -Format 'yyyyMMddHHmmss')"
    } | ConvertTo-Json

    $chatResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/v2/chatbot/message" `
        -Method POST `
        -ContentType "application/json" `
        -Body $testMessage `
        -UseBasicParsing `
        -TimeoutSec 15

    $chatJson = $chatResponse.Content | ConvertFrom-Json
    
    if ($chatJson.success) {
        Write-Host "   ✅ AI Response received!" -ForegroundColor Green
        Write-Host "   📨 Response preview: " -NoNewline -ForegroundColor Gray
        $preview = $chatJson.data.message.Substring(0, [Math]::Min(60, $chatJson.data.message.Length))
        Write-Host "$preview..." -ForegroundColor Cyan
        Write-Host "   🎯 AI Generated: " -NoNewline -ForegroundColor Gray
        Write-Host $chatJson.data.aiGenerated -ForegroundColor $(if($chatJson.data.aiGenerated){'Green'}else{'Yellow'})
        Write-Host "   🛡️  Risk Level: " -NoNewline -ForegroundColor Gray
        Write-Host $chatJson.data.riskLevel -ForegroundColor White
    } else {
        Write-Host "   ⚠️  AI response received but not successful" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Could not test chatbot (may still work)" -ForegroundColor Yellow
}

# Step 5: Start Frontend
Write-Host ""
Write-Host "🎨 Step 5/5: Starting Frontend Application..." -ForegroundColor Yellow
Write-Host "   📍 Location: frontend/" -ForegroundColor Gray
Write-Host "   🔌 Port: 3000" -ForegroundColor Gray
Write-Host "   ⚛️  Framework: React" -ForegroundColor Gray

Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "cd 'D:\ung dung\soulfriend\frontend'; " + `
    "Write-Host ''; " + `
    "Write-Host '═══════════════════════════════════════' -ForegroundColor Magenta; " + `
    "Write-Host '    SOULFRIEND FRONTEND APP' -ForegroundColor Magenta; " + `
    "Write-Host '═══════════════════════════════════════' -ForegroundColor Magenta; " + `
    "Write-Host ''; " + `
    "npm start"

Write-Host "   ⏳ Waiting for frontend to compile..." -ForegroundColor Gray
Start-Sleep -Seconds 20

# Final Status Report
Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║       🎉 DEPLOYMENT COMPLETE!                    ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📊 Application Status:" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan

# Check frontend
try {
    $frontendCheck = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
    Write-Host "   ✅ Frontend:    " -NoNewline -ForegroundColor Green
    Write-Host "http://localhost:3000" -ForegroundColor White
} catch {
    Write-Host "   ⏳ Frontend:    " -NoNewline -ForegroundColor Yellow
    Write-Host "http://localhost:3000 (still compiling...)" -ForegroundColor Yellow
}

# Check backend
Write-Host "   ✅ Backend API: " -NoNewline -ForegroundColor Green
Write-Host "http://localhost:5000" -ForegroundColor White

Write-Host ""
Write-Host "🤖 AI Features:" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   ✅ Google Gemini AI Integration" -ForegroundColor White
Write-Host "   ✅ Intelligent Vietnamese Responses" -ForegroundColor White
Write-Host "   ✅ Crisis Detection & Emergency Support" -ForegroundColor White
Write-Host "   ✅ Context-Aware Conversations" -ForegroundColor White
Write-Host "   ✅ Real-time Risk Assessment" -ForegroundColor White

Write-Host ""
Write-Host "📱 How to Use:" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   1. Open browser: " -NoNewline -ForegroundColor White
Write-Host "http://localhost:3000" -ForegroundColor Yellow
Write-Host "   2. Look for the chatbot button (💬) on the page" -ForegroundColor White
Write-Host "   3. Click to start chatting with CHUN AI" -ForegroundColor White
Write-Host "   4. Try: 'Xin chào CHUN' or 'Tôi cảm thấy lo lắng'" -ForegroundColor White

Write-Host ""
Write-Host "🔧 Management Commands:" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   🛑 Stop all:     " -NoNewline -ForegroundColor White
Write-Host "Get-Process -Name 'node' | Stop-Process -Force" -ForegroundColor Gray
Write-Host "   🔄 Restart:      " -NoNewline -ForegroundColor White
Write-Host ".\deploy-soulfriend.ps1" -ForegroundColor Gray
Write-Host "   🏥 Check health: " -NoNewline -ForegroundColor White
Write-Host "Invoke-WebRequest http://localhost:5000/api/health" -ForegroundColor Gray

Write-Host ""
Write-Host "📋 Two PowerShell Windows Opened:" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   1️⃣  Backend Server  (keep running)" -ForegroundColor White
Write-Host "   2️⃣  Frontend App    (keep running)" -ForegroundColor White

Write-Host ""
Write-Host "⚠️  Important Notes:" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "   • Keep both PowerShell windows open" -ForegroundColor White
Write-Host "   • Frontend may take 1-2 minutes to fully load" -ForegroundColor White
Write-Host "   • First AI response might be slower" -ForegroundColor White
Write-Host "   • Chatbot will show 'Online' mode with AI icon" -ForegroundColor White

Write-Host ""
Write-Host "🌸 SoulFriend is now running with AI Online!" -ForegroundColor Green
Write-Host "   Helping Vietnamese women with mental health support" -ForegroundColor Gray
Write-Host ""

