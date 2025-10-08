# Railway Deployment Script for SoulFriend V4.0
# Perfect for Solo Developer - Free Tier Available!

Write-Host "🚀 Starting Railway deployment for SoulFriend V4.0..." -ForegroundColor Green
Write-Host "Railway Token: ef97cad8-db03-404b-aa04-1f3338740bcb" -ForegroundColor Cyan

# Set Railway token
$env:RAILWAY_TOKEN = "ef97cad8-db03-404b-aa04-1f3338740bcb"

# Check if Railway CLI is installed
try {
    $railwayVersion = railway --version
    Write-Host "✅ Railway CLI found: $railwayVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Red
    npm install -g @railway/cli
}

Write-Host "`n🔐 Logging into Railway..." -ForegroundColor Yellow
Write-Host "Please login manually when prompted:" -ForegroundColor Cyan
Write-Host "Token: ef97cad8-db03-404b-aa04-1f3338740bcb" -ForegroundColor Cyan
Write-Host "Press Enter to continue..." -ForegroundColor Yellow
Read-Host

# Login to Railway
railway login

Write-Host "`n🚀 Deploying Backend..." -ForegroundColor Yellow
Set-Location backend

# Create backend project
Write-Host "Creating backend project..." -ForegroundColor Cyan
railway project new soulfriend-backend

# Set environment variables
Write-Host "Setting environment variables..." -ForegroundColor Cyan
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

Write-Host "`n🌐 Deploying Frontend..." -ForegroundColor Yellow
Set-Location ../frontend

# Create frontend project
Write-Host "Creating frontend project..." -ForegroundColor Cyan
railway project new soulfriend-frontend

# Set environment variables
Write-Host "Setting environment variables..." -ForegroundColor Cyan
railway variables set REACT_APP_API_URL=$backendUrl
railway variables set REACT_APP_GEMINI_API_KEY=AIzaSyBaswf5ksxu1g7WvhS2_Hy7PHqWpjZu8LM

# Deploy frontend
Write-Host "Deploying frontend..." -ForegroundColor Cyan
railway up --detach

# Get frontend URL
$frontendUrl = railway status --json | ConvertFrom-Json | Select-Object -ExpandProperty url
Write-Host "✅ Frontend deployed: $frontendUrl" -ForegroundColor Green

Write-Host "`n🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Backend URL:  $backendUrl" -ForegroundColor Cyan
Write-Host "Frontend URL: $frontendUrl" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Write-Host "`n📊 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test backend: $backendUrl/api/health" -ForegroundColor White
Write-Host "2. Test frontend: $frontendUrl" -ForegroundColor White
Write-Host "3. Check Railway dashboard for monitoring" -ForegroundColor White
Write-Host "4. Set up MongoDB Atlas for database" -ForegroundColor White

Write-Host "`n💰 Cost: ~$3-5/month (within free tier!)" -ForegroundColor Green
Write-Host "🔗 Railway Dashboard: https://railway.app/dashboard" -ForegroundColor Cyan

Write-Host "`nPress Enter to exit..." -ForegroundColor Yellow
Read-Host

