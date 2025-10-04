# SoulFriend V3.0 Webapp Startup Script
# Chạy cả backend và frontend

Write-Host "🚀 Starting SoulFriend V3.0 Webapp..." -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Function to check if port is in use
function Test-Port {
    param($Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Kill existing Node processes to start fresh
Write-Host "🔄 Stopping existing Node processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start Backend
Write-Host "🔧 Starting Backend Server..." -ForegroundColor Green
Set-Location "backend"

# Check if .env exists, create if not
if (!(Test-Path ".env")) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    @"
NODE_ENV=development
PORT=5000
JWT_SECRET=development-jwt-secret-key-32-characters-long-for-testing
ENCRYPTION_KEY=development-encryption-key-32-characters-long-for-testing
DEFAULT_ADMIN_PASSWORD=DevAdmin123!
CORS_ORIGIN=http://localhost:3000
"@ | Out-File -FilePath ".env" -Encoding UTF8
}

# Start backend in background
Write-Host "▶️  Launching backend on port 5000..." -ForegroundColor Green
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Hidden
Set-Location ".."

# Wait for backend to start
Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
$backendReady = $false
$attempts = 0
while (-not $backendReady -and $attempts -lt 30) {
    Start-Sleep -Seconds 2
    $attempts++
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $backendReady = $true
            Write-Host "✅ Backend is ready!" -ForegroundColor Green
        }
    } catch {
        Write-Host "." -NoNewline -ForegroundColor Yellow
    }
}

if (-not $backendReady) {
    Write-Host "❌ Backend failed to start after 60 seconds" -ForegroundColor Red
    exit 1
}

# Start Frontend
Write-Host "🎨 Starting Frontend Application..." -ForegroundColor Green
Set-Location "frontend"

Write-Host "▶️  Launching frontend on port 3000..." -ForegroundColor Green
Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Hidden
Set-Location ".."

# Wait for frontend to start
Write-Host "⏳ Waiting for frontend to initialize..." -ForegroundColor Yellow
$frontendReady = $false
$attempts = 0
while (-not $frontendReady -and $attempts -lt 60) {
    Start-Sleep -Seconds 2
    $attempts++
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $frontendReady = $true
            Write-Host "✅ Frontend is ready!" -ForegroundColor Green
        }
    } catch {
        Write-Host "." -NoNewline -ForegroundColor Yellow
    }
}

if (-not $frontendReady) {
    Write-Host "⚠️  Frontend may still be starting..." -ForegroundColor Yellow
}

# Display status
Write-Host ""
Write-Host "🎉 SoulFriend V3.0 Webapp Status:" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check backend status
try {
    $backendHealth = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -TimeoutSec 5
    if ($backendHealth.StatusCode -eq 200) {
        Write-Host "✅ Backend API: http://localhost:5000 (RUNNING)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Backend API: http://localhost:5000 (NOT RESPONDING)" -ForegroundColor Red
}

# Check frontend status
try {
    $frontendHealth = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    if ($frontendHealth.StatusCode -eq 200) {
        Write-Host "✅ Frontend App: http://localhost:3000 (RUNNING)" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Frontend App: http://localhost:3000 (STARTING...)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📊 Available Endpoints:" -ForegroundColor Cyan
Write-Host "   🌐 Main App: http://localhost:3000" -ForegroundColor White
Write-Host "   🔧 API Health: http://localhost:5000/api/health" -ForegroundColor White
Write-Host "   📋 API Docs: http://localhost:5000/api" -ForegroundColor White
Write-Host ""
Write-Host "🛠️  Management Commands:" -ForegroundColor Cyan
Write-Host "   Stop all: Get-Process -Name 'node' | Stop-Process -Force" -ForegroundColor White
Write-Host "   Restart: .\start-webapp.ps1" -ForegroundColor White
Write-Host ""
Write-Host "🚀 SoulFriend V3.0 is now running!" -ForegroundColor Green
Write-Host "   Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host ""
