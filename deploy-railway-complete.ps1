# Complete Railway Deployment for SoulFriend V4.0
# Frontend + Backend + Database (MongoDB Atlas)

Write-Host "🚀 Starting Complete Railway Deployment..." -ForegroundColor Green
Write-Host "Architecture: Frontend + Backend + MongoDB Atlas" -ForegroundColor Cyan

# Set Railway token
$env:RAILWAY_TOKEN = "ef97cad8-db03-404b-aa04-1f3338740bcb"

Write-Host "`n🔐 Railway Token Set: ef97cad8-db03-404b-aa04-1f3338740bcb" -ForegroundColor Yellow

# Check Railway CLI
try {
    $railwayVersion = railway --version
    Write-Host "✅ Railway CLI: $railwayVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Installing Railway CLI..." -ForegroundColor Red
    npm install -g @railway/cli
}

Write-Host "`n📦 DEPLOYING BACKEND..." -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Set-Location backend

# Create backend project
Write-Host "Creating backend project..." -ForegroundColor Cyan
railway project new soulfriend-backend

# Set environment variables for backend
Write-Host "Setting backend environment variables..." -ForegroundColor Cyan
railway variables set NODE_ENV=production
railway variables set PORT=5000
railway variables set JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long-change-this
railway variables set ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
railway variables set DEFAULT_ADMIN_USERNAME=admin
railway variables set DEFAULT_ADMIN_EMAIL=admin@soulfriend.vn
railway variables set DEFAULT_ADMIN_PASSWORD=ChangeThisSecurePassword123!
railway variables set GEMINI_API_KEY=AIzaSyBaswf5ksxu1g7WvhS2_Hy7PHqWpjZu8LM
railway variables set CORS_ORIGIN=https://soulfriend-frontend.railway.app

# Deploy backend
Write-Host "Deploying backend..." -ForegroundColor Cyan
railway up --detach

# Get backend URL
$backendUrl = railway status --json | ConvertFrom-Json | Select-Object -ExpandProperty url
Write-Host "✅ Backend deployed: $backendUrl" -ForegroundColor Green

Write-Host "`n🌐 DEPLOYING FRONTEND..." -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Set-Location ../frontend

# Create frontend project
Write-Host "Creating frontend project..." -ForegroundColor Cyan
railway project new soulfriend-frontend

# Set environment variables for frontend
Write-Host "Setting frontend environment variables..." -ForegroundColor Cyan
railway variables set REACT_APP_API_URL=$backendUrl
railway variables set REACT_APP_GEMINI_API_KEY=AIzaSyBaswf5ksxu1g7WvhS2_Hy7PHqWpjZu8LM

# Deploy frontend
Write-Host "Deploying frontend..." -ForegroundColor Cyan
railway up --detach

# Get frontend URL
$frontendUrl = railway status --json | ConvertFrom-Json | Select-Object -ExpandProperty url
Write-Host "✅ Frontend deployed: $frontendUrl" -ForegroundColor Green

Write-Host "`n🎉 DEPLOYMENT COMPLETED!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🏗️  ARCHITECTURE:" -ForegroundColor Yellow
Write-Host "   Frontend (React)  → Railway: $frontendUrl" -ForegroundColor White
Write-Host "   Backend (Node.js) → Railway: $backendUrl" -ForegroundColor White
Write-Host "   Database (MongoDB) → MongoDB Atlas (Free)" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Write-Host "`n🧪 TESTING DEPLOYMENT:" -ForegroundColor Yellow
Write-Host "1. Backend Health: $backendUrl/api/health" -ForegroundColor White
Write-Host "2. Frontend App: $frontendUrl" -ForegroundColor White
Write-Host "3. API Integration: Test chatbot functionality" -ForegroundColor White

Write-Host "`n💰 COST BREAKDOWN:" -ForegroundColor Yellow
Write-Host "   Railway Frontend: ~$1-2/month" -ForegroundColor White
Write-Host "   Railway Backend:  ~$2-3/month" -ForegroundColor White
Write-Host "   MongoDB Atlas:    FREE (Free Tier)" -ForegroundColor White
Write-Host "   Total:            ~$3-5/month (Within Free Tier!)" -ForegroundColor Green

Write-Host "`n🔗 MANAGEMENT:" -ForegroundColor Yellow
Write-Host "   Railway Dashboard: https://railway.app/dashboard" -ForegroundColor Cyan
Write-Host "   MongoDB Atlas:     https://cloud.mongodb.com" -ForegroundColor Cyan

Write-Host "`nPress Enter to exit..." -ForegroundColor Yellow
Read-Host

