# 🚀 Deploy Frontend to Vercel
# This script deploys only the frontend to Vercel

Write-Host "🚀 Deploying Frontend to Vercel" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

# Check if Vercel CLI is installed
Write-Host "🔍 Checking Vercel CLI..." -ForegroundColor Yellow
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI found: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
}

Write-Host ""

# Navigate to project root
Write-Host "📁 Current directory: $(Get-Location)" -ForegroundColor Cyan
Write-Host ""

# Check git status
Write-Host "🔍 Checking git status..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️ Uncommitted changes found. Committing..." -ForegroundColor Yellow
    git add .
    git commit -m "chore: prepare for Vercel deployment - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    git push origin main
    Write-Host "✅ Changes committed and pushed" -ForegroundColor Green
} else {
    Write-Host "✅ No uncommitted changes" -ForegroundColor Green
}

Write-Host ""

# Build frontend locally to test
Write-Host "🏗️ Testing frontend build locally..." -ForegroundColor Yellow
Set-Location frontend
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Local build successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Local build failed. Please fix errors before deploying." -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..

Write-Host ""

# Deploy to Vercel
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Deployment Options:" -ForegroundColor Cyan
Write-Host "1. Production deployment: vercel --prod" -ForegroundColor White
Write-Host "2. Preview deployment: vercel" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Choose deployment type (1 for Production, 2 for Preview)"

if ($choice -eq "1") {
    Write-Host "🚀 Deploying to Production..." -ForegroundColor Green
    vercel --prod
} else {
    Write-Host "🔍 Deploying Preview..." -ForegroundColor Yellow
    vercel
}

Write-Host ""
Write-Host "✅ Deployment initiated!" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Important Notes:" -ForegroundColor Yellow
Write-Host "- Frontend is deployed to Vercel" -ForegroundColor White
Write-Host "- Backend needs to be deployed separately (Railway/Render)" -ForegroundColor White
Write-Host "- Update REACT_APP_API_URL in frontend/.env to point to backend URL" -ForegroundColor White
Write-Host ""

Write-Host "🔗 Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host ""

Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
