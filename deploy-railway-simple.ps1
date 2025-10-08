# Simple Railway Deployment Script for SoulFriend
Write-Host "🚀 Starting Railway deployment..." -ForegroundColor Green

# Set Railway token
$env:RAILWAY_TOKEN = "ef97cad8-db03-404b-aa04-1f3338740bcb"

# Check if Railway CLI is installed
try {
    railway --version
    Write-Host "✅ Railway CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Red
    npm install -g @railway/cli
}

Write-Host "🔐 Please login to Railway manually:" -ForegroundColor Yellow
Write-Host "1. Run: railway login" -ForegroundColor Cyan
Write-Host "2. Paste token: ef97cad8-db03-404b-aa04-1f3338740bcb" -ForegroundColor Cyan
Write-Host "3. Press Enter" -ForegroundColor Cyan

# Wait for user to login
Read-Host "Press Enter after logging in"

# Deploy backend
Write-Host "🚀 Deploying backend..." -ForegroundColor Yellow
Set-Location backend

# Initialize project
Write-Host "📦 Initializing Railway project for backend..." -ForegroundColor Cyan
railway init

# Set environment variables
Write-Host "🔧 Setting backend environment variables..." -ForegroundColor Cyan
railway variables --set "NODE_ENV=production"
railway variables --set "PORT=5000"
railway variables --set "MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/soulfriend"
railway variables --set "JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long-change-this-in-production"
railway variables --set "ENCRYPTION_KEY=your-encryption-key-must-be-64-hex-characters-long-change-this-in-production"
railway variables --set "DEFAULT_ADMIN_USERNAME=admin"
railway variables --set "DEFAULT_ADMIN_EMAIL=admin@soulfriend.vn"
railway variables --set "DEFAULT_ADMIN_PASSWORD=ChangeThisSecurePassword123!"
railway variables --set "GEMINI_API_KEY=AIzaSyBaswf5ksxu1g7WvhS2_Hy7PHqWpjZu8LM"

# Deploy backend
railway up --detach

# Get backend URL
Write-Host "✅ Backend deployed! Getting URL..." -ForegroundColor Green
$backendUrl = railway status --json | ConvertFrom-Json | Select-Object -ExpandProperty url
Write-Host "Backend URL: $backendUrl" -ForegroundColor Cyan

# Deploy frontend
Write-Host "🌐 Deploying frontend..." -ForegroundColor Yellow
Set-Location ../frontend

# Initialize project
Write-Host "📦 Initializing Railway project for frontend..." -ForegroundColor Cyan
railway init

# Set environment variables
Write-Host "🔧 Setting frontend environment variables..." -ForegroundColor Cyan
railway variables --set "REACT_APP_API_URL=$backendUrl"
railway variables --set "REACT_APP_GEMINI_API_KEY=AIzaSyBaswf5ksxu1g7WvhS2_Hy7PHqWpjZu8LM"

# Deploy frontend
railway up --detach

# Get frontend URL
Write-Host "✅ Frontend deployed! Getting URL..." -ForegroundColor Green
$frontendUrl = railway status --json | ConvertFrom-Json | Select-Object -ExpandProperty url
Write-Host "Frontend URL: $frontendUrl" -ForegroundColor Cyan

Write-Host "🎉 Deployment completed!" -ForegroundColor Green
Write-Host "Backend: $backendUrl" -ForegroundColor Cyan
Write-Host "Frontend: $frontendUrl" -ForegroundColor Cyan
Write-Host "🔗 Check your Railway dashboard for more details" -ForegroundColor Yellow
