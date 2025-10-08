# Railway Deployment Script for SoulFriend
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

# Login to Railway
Write-Host "🔐 Logging into Railway..." -ForegroundColor Yellow
Write-Host "Please login manually when prompted:" -ForegroundColor Cyan
Write-Host "Token: ef97cad8-db03-404b-aa04-1f3338740bcb" -ForegroundColor Cyan
railway login

# Deploy backend
Write-Host "🚀 Deploying backend..." -ForegroundColor Yellow
Set-Location backend
railway project new soulfriend-backend
railway up --detach

# Get backend URL
$backendUrl = railway status --json | ConvertFrom-Json | Select-Object -ExpandProperty url
Write-Host "✅ Backend deployed: $backendUrl" -ForegroundColor Green

# Deploy frontend
Write-Host "🌐 Deploying frontend..." -ForegroundColor Yellow
Set-Location ../frontend
railway project new soulfriend-frontend
railway up --detach

# Get frontend URL
$frontendUrl = railway status --json | ConvertFrom-Json | Select-Object -ExpandProperty url
Write-Host "✅ Frontend deployed: $frontendUrl" -ForegroundColor Green

Write-Host "🎉 Deployment completed!" -ForegroundColor Green
Write-Host "Backend: $backendUrl" -ForegroundColor Cyan
Write-Host "Frontend: $frontendUrl" -ForegroundColor Cyan
Write-Host "🔗 Check your Railway dashboard for more details" -ForegroundColor Yellow

