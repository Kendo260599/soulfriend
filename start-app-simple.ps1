# SoulFriend Simple Startup Script
Write-Host "🚀 Starting SoulFriend Application..." -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Stop existing processes
Write-Host "🔄 Stopping existing Node processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start Backend in new window
Write-Host "🔧 Starting Backend Server (Port 5000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\ung dung\soulfriend\backend'; Write-Host '🔧 Backend Server Starting...' -ForegroundColor Green; npm run dev"

# Wait for backend
Write-Host "⏳ Waiting 10 seconds for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Start Frontend in new window
Write-Host "🎨 Starting Frontend Application (Port 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\ung dung\soulfriend\frontend'; Write-Host '🎨 Frontend Application Starting...' -ForegroundColor Green; npm start"

# Wait for frontend
Write-Host "⏳ Waiting 15 seconds for frontend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "🎉 SoulFriend Application Status:" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "✅ Backend: http://localhost:5000/api/health" -ForegroundColor Green
Write-Host "✅ Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Two PowerShell windows have been opened:" -ForegroundColor Cyan
Write-Host "   1. Backend Server (keep running)" -ForegroundColor White
Write-Host "   2. Frontend Application (keep running)" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Open your browser at: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "🛑 To stop the application:" -ForegroundColor Yellow
Write-Host "   - Close both PowerShell windows, or" -ForegroundColor White
Write-Host "   - Run: Get-Process -Name 'node' | Stop-Process -Force" -ForegroundColor White
Write-Host ""
Write-Host "🚀 SoulFriend is now running!" -ForegroundColor Green
Write-Host ""

