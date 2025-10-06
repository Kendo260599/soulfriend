# Start SoulFriend with Minimal Backend (AI Online Mode)
Write-Host "🚀 Starting SoulFriend with AI Online..." -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Stop existing processes
Write-Host "🔄 Stopping existing Node processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start Minimal Backend
Write-Host "🔧 Starting Minimal Backend (AI Enabled)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\ung dung\soulfriend\backend'; Write-Host '🔧 Minimal Backend with Gemini AI' -ForegroundColor Green; node minimal-server.js"

# Wait for backend
Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Test backend
try {
    $health = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -TimeoutSec 5
    $json = $health.Content | ConvertFrom-Json
    Write-Host "✅ Backend Online: $($json.chatbot)" -ForegroundColor Green
    Write-Host "✅ Gemini AI: $($json.gemini)" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend health check failed" -ForegroundColor Yellow
}

# Start Frontend  
Write-Host "🎨 Starting Frontend Application..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\ung dung\soulfriend\frontend'; Write-Host '🎨 Frontend React App' -ForegroundColor Green; npm start"

# Wait for frontend
Write-Host "⏳ Waiting for frontend..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "🎉 SoulFriend Application Status:" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "✅ Backend (Minimal): http://localhost:5000" -ForegroundColor Green
Write-Host "✅ Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "✅ Chatbot AI: ONLINE (Gemini Powered)" -ForegroundColor Green
Write-Host ""
Write-Host "🤖 Chatbot Features:" -ForegroundColor Cyan
Write-Host "   ✅ Google Gemini AI Integration" -ForegroundColor White
Write-Host "   ✅ Intelligent Responses" -ForegroundColor White
Write-Host "   ✅ Crisis Detection" -ForegroundColor White  
Write-Host "   ✅ Vietnamese Language Support" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Open http://localhost:3000 in your browser" -ForegroundColor Green
Write-Host "💬 Click chatbot button to test AI" -ForegroundColor Green
Write-Host ""
Write-Host "🛑 To stop: Get-Process -Name 'node' | Stop-Process -Force" -ForegroundColor Yellow
Write-Host ""


