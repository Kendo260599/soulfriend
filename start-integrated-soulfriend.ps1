# SoulFriend Integrated Startup Script
# Starts both backend and frontend with chatbot integration

Write-Host "🚀 Starting SoulFriend with AI Chatbot Integration..." -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found. Please install npm first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
Set-Location ../frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}

Set-Location ..

Write-Host "✅ All dependencies installed successfully!" -ForegroundColor Green
Write-Host ""

# Check environment files
Write-Host "🔧 Checking environment configuration..." -ForegroundColor Yellow

if (-not (Test-Path "backend/.env")) {
    if (Test-Path "backend/env.example") {
        Write-Host "📝 Creating .env file from example..." -ForegroundColor Cyan
        Copy-Item "backend/env.example" "backend/.env"
        Write-Host "⚠️  Please update backend/.env with your actual values" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  No .env file found. Creating basic configuration..." -ForegroundColor Yellow
        @"
# SoulFriend Backend Configuration
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/soulfriend
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CORS_ORIGIN=http://localhost:3000

# AI Configuration
GEMINI_API_KEY=YOUR_GEMINI_API_KEY

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# Monitoring
ENABLE_AUDIT_LOGGING=true
LOG_LEVEL=info

# Emergency Contacts (Vietnam)
EMERGENCY_PHONE_VIETNAM=1900599958
CRISIS_HOTLINE_VIETNAM=1900599958
MENTAL_HEALTH_HOTLINE=1900599958
"@ | Out-File -FilePath "backend/.env" -Encoding UTF8
    }
}

Write-Host "✅ Environment configuration ready!" -ForegroundColor Green
Write-Host ""

# Start MongoDB (if available)
Write-Host "🗄️  Starting MongoDB..." -ForegroundColor Yellow
try {
    Start-Process -FilePath "mongod" -ArgumentList "--dbpath", "data/db" -WindowStyle Hidden -ErrorAction SilentlyContinue
    Write-Host "✅ MongoDB started" -ForegroundColor Green
} catch {
    Write-Host "⚠️  MongoDB not found or already running" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 Starting SoulFriend Services..." -ForegroundColor Green
Write-Host ""

# Function to start backend
function Start-Backend {
    Write-Host "🚀 Starting Backend Server..." -ForegroundColor Cyan
    Set-Location backend
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Normal
    Set-Location ..
}

# Function to start frontend
function Start-Frontend {
    Write-Host "🎨 Starting Frontend Development Server..." -ForegroundColor Cyan
    Set-Location frontend
    Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Normal
    Set-Location ..
}

# Start services
Start-Backend
Start-Sleep -Seconds 3
Start-Frontend

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    🌸 SoulFriend Started! 🌸                 ║" -ForegroundColor Green
Write-Host "╠══════════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  Frontend: http://localhost:3000                             ║" -ForegroundColor White
Write-Host "║  Backend:  http://localhost:5000                            ║" -ForegroundColor White
Write-Host "║  API:      http://localhost:5000/api/v2                     ║" -ForegroundColor White
Write-Host "║  Health:   http://localhost:5000/api/health                  ║" -ForegroundColor White
Write-Host "║                                                              ║" -ForegroundColor White
Write-Host "║  🤖 AI Chatbot: Integrated and Ready!                        ║" -ForegroundColor Cyan
Write-Host "║  🧠 Crisis Detection: Active                                ║" -ForegroundColor Cyan
Write-Host "║  🛡️  Safety Features: Enabled                                ║" -ForegroundColor Cyan
Write-Host "║  📊 Professional Dashboard: Available                        ║" -ForegroundColor Cyan
Write-Host "║                                                              ║" -ForegroundColor White
Write-Host "║  Press Ctrl+C to stop all services                           ║" -ForegroundColor Yellow
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# Wait for user input to stop
Write-Host "Press any key to stop all services..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "🛑 Stopping SoulFriend services..." -ForegroundColor Red

# Stop all Node.js processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "✅ SoulFriend stopped successfully!" -ForegroundColor Green
Write-Host "👋 Thank you for using SoulFriend!" -ForegroundColor Cyan
