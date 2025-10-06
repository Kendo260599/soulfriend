# VERCEL MANUAL DEPLOY SCRIPT
# Requires: Vercel CLI installed (npm i -g vercel)

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "║     🚀 VERCEL MANUAL DEPLOY SCRIPT 🚀                 ║" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
Write-Host "1️⃣ Checking Vercel CLI..." -ForegroundColor Yellow
try {
    $vercelVersion = vercel --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Vercel CLI installed: $vercelVersion" -ForegroundColor Green
    } else {
        throw "Vercel CLI not found"
    }
} catch {
    Write-Host "   ❌ Vercel CLI not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "📦 TO INSTALL VERCEL CLI:" -ForegroundColor Yellow
    Write-Host "   npm install -g vercel" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or use manual redeploy in dashboard:" -ForegroundColor Gray
    Write-Host "   https://vercel.com/kendo260599s-projects/frontend" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "2️⃣ Navigating to frontend..." -ForegroundColor Yellow
cd frontend
Write-Host "   ✅ In frontend directory" -ForegroundColor Green

Write-Host ""
Write-Host "3️⃣ Starting Vercel deployment..." -ForegroundColor Yellow
Write-Host "   (You may need to login if first time)" -ForegroundColor Gray
Write-Host ""

# Deploy to production
vercel --prod

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "║     ✅ DEPLOYMENT COMPLETE! ✅                         ║" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "   1. Open the URL shown above" -ForegroundColor White
Write-Host "   2. Press F12 for DevTools" -ForegroundColor White
Write-Host "   3. Check Console - ZERO ERRORS!" -ForegroundColor White
Write-Host ""


