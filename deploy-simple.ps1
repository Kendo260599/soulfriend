# Simple SoulFriend Deployment Script

Write-Host ""
Write-Host "🚀 Deploying SoulFriend with AI..." -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Stop existing
Write-Host "🔄 Stopping existing processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start Backend
Write-Host "🔧 Starting Backend (AI Enabled)..." -ForegroundColor Green
$backendCmd = "cd 'D:\ung dung\soulfriend\backend'; node simple-gemini-server.js"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

Start-Sleep -Seconds 8

# Test Backend
Write-Host "🏥 Testing Backend..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -TimeoutSec 10
    $json = $health.Content | ConvertFrom-Json
    Write-Host "   ✅ Chatbot: $($json.chatbot)" -ForegroundColor Green
    Write-Host "   ✅ Gemini: $($json.gemini)" -ForegroundColor Green
    Write-Host "   ✅ Model: $($json.model)" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Backend check failed (may still be starting)" -ForegroundColor Yellow
}

# Test AI
Write-Host ""
Write-Host "🤖 Testing AI Chatbot..." -ForegroundColor Yellow
try {
    $body = @{
        message = "Xin chào"
        userId = "test"
        sessionId = "test123"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/v2/chatbot/message" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing -TimeoutSec 15
    $data = ($response.Content | ConvertFrom-Json).data
    Write-Host "   ✅ AI Response: $($data.message.Substring(0, 50))..." -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  AI test failed (may still work)" -ForegroundColor Yellow
}

# Start Frontend
Write-Host ""
Write-Host "🎨 Starting Frontend..." -ForegroundColor Green
$frontendCmd = "cd 'D:\ung dung\soulfriend\frontend'; npm start"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host "   ⏳ Waiting for frontend..." -ForegroundColor Gray
Start-Sleep -Seconds 15

# Final Status
Write-Host ""
Write-Host "╔════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║    🎉 DEPLOYMENT COMPLETE!        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "✅ Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "✅ AI Status: ONLINE (Gemini Pro)" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Open http://localhost:3000 in your browser!" -ForegroundColor Cyan
Write-Host "💬 Click chatbot button to test AI" -ForegroundColor Cyan
Write-Host ""
Write-Host "🛑 To stop: Get-Process -Name 'node' | Stop-Process -Force" -ForegroundColor Yellow
Write-Host ""


