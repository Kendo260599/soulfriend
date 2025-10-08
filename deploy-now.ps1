# 🚀 SoulFriend Railway Deploy - Ready to Run
Write-Host "🚀 SoulFriend Railway Deploy Script" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Check if Railway CLI is installed
Write-Host "🔍 Checking Railway CLI..." -ForegroundColor Yellow
try {
    $railwayVersion = railway --version
    Write-Host "✅ Railway CLI found: $railwayVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Red
    npm install -g @railway/cli
    Write-Host "✅ Railway CLI installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔐 STEP 1: Login to Railway" -ForegroundColor Cyan
Write-Host "Please run the following command and paste the token:" -ForegroundColor Yellow
Write-Host "railway login" -ForegroundColor White
Write-Host "Token: ef97cad8-db03-404b-aa04-1f3338740bcb" -ForegroundColor White
Write-Host ""

# Wait for user to login
Read-Host "Press Enter after logging in to Railway"

Write-Host ""
Write-Host "🚀 STEP 2: Deploy Backend" -ForegroundColor Cyan
Set-Location backend

Write-Host "📦 Initializing Railway project for backend..." -ForegroundColor Yellow
railway init

Write-Host "🔧 Setting environment variables..." -ForegroundColor Yellow
railway variables --set "NODE_ENV=production"
railway variables --set "PORT=5000"
railway variables --set "MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/soulfriend"
railway variables --set "JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long-change-this-in-production"
railway variables --set "ENCRYPTION_KEY=your-encryption-key-must-be-64-hex-characters-long-change-this-in-production"
railway variables --set "DEFAULT_ADMIN_USERNAME=admin"
railway variables --set "DEFAULT_ADMIN_EMAIL=admin@soulfriend.vn"
railway variables --set "DEFAULT_ADMIN_PASSWORD=ChangeThisSecurePassword123!"
railway variables --set "GEMINI_API_KEY=***REDACTED_GEMINI_KEY***"

Write-Host "🚀 Deploying backend..." -ForegroundColor Yellow
railway up --detach

Write-Host "✅ Backend deployed!" -ForegroundColor Green
$backendUrl = railway status --json | ConvertFrom-Json | Select-Object -ExpandProperty url
Write-Host "Backend URL: $backendUrl" -ForegroundColor Cyan

Write-Host ""
Write-Host "🌐 STEP 3: Deploy Frontend" -ForegroundColor Cyan
Set-Location ../frontend

Write-Host "📦 Initializing Railway project for frontend..." -ForegroundColor Yellow
railway init

Write-Host "🔧 Setting environment variables..." -ForegroundColor Yellow
railway variables --set "REACT_APP_API_URL=$backendUrl"
railway variables --set "REACT_APP_GEMINI_API_KEY=***REDACTED_GEMINI_KEY***"

Write-Host "🚀 Deploying frontend..." -ForegroundColor Yellow
railway up --detach

Write-Host "✅ Frontend deployed!" -ForegroundColor Green
$frontendUrl = railway status --json | ConvertFrom-Json | Select-Object -ExpandProperty url
Write-Host "Frontend URL: $frontendUrl" -ForegroundColor Cyan

Write-Host ""
Write-Host "🎉 DEPLOYMENT COMPLETED!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host "Backend:  $backendUrl" -ForegroundColor Cyan
Write-Host "Frontend: $frontendUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔗 Next steps:" -ForegroundColor Yellow
Write-Host "1. Test your application at the frontend URL" -ForegroundColor White
Write-Host "2. Check Railway dashboard for monitoring" -ForegroundColor White
Write-Host "3. Update MongoDB URI with your actual database" -ForegroundColor White
Write-Host "4. Change default admin password" -ForegroundColor White
Write-Host ""
Write-Host "💰 Cost: ~$3-5/month (within free tier!)" -ForegroundColor Green
Write-Host "🚀 Happy coding!" -ForegroundColor Green
