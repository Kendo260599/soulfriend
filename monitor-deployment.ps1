# 🔍 Railway Deployment Monitor
Write-Host "🔍 Monitoring Railway deployments..." -ForegroundColor Yellow
Write-Host ""

# Set Railway token
$env:RAILWAY_TOKEN = "6b6b5528-4a3e-4c94-a074-3c02f94bb2fb"

# Check if we can access Railway
try {
    Write-Host "🔐 Checking Railway authentication..." -ForegroundColor Yellow
    $whoami = railway whoami 2>&1
    if ($whoami -match "Unauthorized") {
        Write-Host "❌ Not authenticated with Railway" -ForegroundColor Red
        Write-Host "💡 Please login manually in the Railway dashboard:" -ForegroundColor Yellow
        Write-Host "   1. Go to https://railway.app" -ForegroundColor Cyan
        Write-Host "   2. Login with GitHub" -ForegroundColor Cyan
        Write-Host "   3. Create projects for backend and frontend" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "🌐 Opening Railway dashboard..." -ForegroundColor Yellow
        Start-Process "https://railway.app"
    } else {
        Write-Host "✅ Connected to Railway as: $whoami" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "📋 Your Railway projects:" -ForegroundColor Cyan
        railway projects
        
        Write-Host ""
        Write-Host "🚀 Recent deployments:" -ForegroundColor Cyan
        railway deployments
        
        Write-Host ""
        Write-Host "📊 Project status:" -ForegroundColor Cyan
        railway status
    }
} catch {
    Write-Host "❌ Cannot connect to Railway CLI" -ForegroundColor Red
    Write-Host "💡 This is normal - use the Railway dashboard instead" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🌐 Opening Railway dashboard..." -ForegroundColor Yellow
    Start-Process "https://railway.app"
}

Write-Host ""
Write-Host "📋 Manual Deployment Checklist:" -ForegroundColor Yellow
Write-Host "□ Backend project created" -ForegroundColor White
Write-Host "□ Frontend project created" -ForegroundColor White
Write-Host "□ Backend environment variables configured" -ForegroundColor White
Write-Host "□ Frontend environment variables configured" -ForegroundColor White
Write-Host "□ Backend deployed successfully" -ForegroundColor White
Write-Host "□ Frontend deployed successfully" -ForegroundColor White
Write-Host "□ Application tested and working" -ForegroundColor White
Write-Host ""

Write-Host "🔗 Useful Railway URLs:" -ForegroundColor Cyan
Write-Host "Dashboard: https://railway.app" -ForegroundColor White
Write-Host "Documentation: https://docs.railway.app" -ForegroundColor White
Write-Host "Support: https://railway.app/support" -ForegroundColor White
Write-Host ""

Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")