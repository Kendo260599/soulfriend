# 🔍 Check Deployment Status
# Quick script to verify everything is ready for Railway deployment

Write-Host "🔍 Checking Deployment Status" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Write-Host ""

# 1. Check if all files are committed
Write-Host "📝 Checking Git status..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️ Uncommitted changes found:" -ForegroundColor Yellow
    git status --short
}
else {
    Write-Host "✅ All changes committed" -ForegroundColor Green
}
Write-Host ""

# 2. Check backend build
Write-Host "🔧 Checking Backend build..." -ForegroundColor Yellow
Set-Location "backend"
npm run build 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend builds successfully" -ForegroundColor Green
}
else {
    Write-Host "❌ Backend build failed" -ForegroundColor Red
}
Set-Location ..
Write-Host ""

# 3. Check frontend build
Write-Host "🎨 Checking Frontend build..." -ForegroundColor Yellow
Set-Location "frontend"
npx react-scripts build 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend builds successfully" -ForegroundColor Green
}
else {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
}
Set-Location ..
Write-Host ""

# 4. Check Railway configuration
Write-Host "🚂 Checking Railway configuration..." -ForegroundColor Yellow

if (Test-Path "frontend/railway.toml") {
    Write-Host "✅ frontend/railway.toml exists" -ForegroundColor Green
}
else {
    Write-Host "❌ frontend/railway.toml missing" -ForegroundColor Red
}

if (Test-Path "backend/railway.toml") {
    Write-Host "✅ backend/railway.toml exists" -ForegroundColor Green
}
else {
    Write-Host "❌ backend/railway.toml missing" -ForegroundColor Red
}

if (Test-Path "frontend/nixpacks.json") {
    Write-Host "✅ frontend/nixpacks.json exists" -ForegroundColor Green
}
else {
    Write-Host "⚠️ frontend/nixpacks.json missing (optional)" -ForegroundColor Yellow
}

if (Test-Path "backend/nixpacks.json") {
    Write-Host "✅ backend/nixpacks.json exists" -ForegroundColor Green
}
else {
    Write-Host "⚠️ backend/nixpacks.json missing (optional)" -ForegroundColor Yellow
}

Write-Host ""

# 5. Summary
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "- Latest commit: $(git log -1 --pretty=format:'%h - %s')" -ForegroundColor White
Write-Host "- Branch: $(git branch --show-current)" -ForegroundColor White
Write-Host "- Remote: $(git remote get-url origin)" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Go to Railway Dashboard: https://railway.app" -ForegroundColor White
Write-Host "2. Check deployment logs" -ForegroundColor White
Write-Host "3. Clear build cache if needed (Settings → Danger Zone)" -ForegroundColor White
Write-Host "4. Redeploy if necessary" -ForegroundColor White
Write-Host ""

Write-Host "💡 Tip: If build fails on Railway but works locally," -ForegroundColor Magenta
Write-Host "   try clearing the build cache and redeploying." -ForegroundColor Magenta
Write-Host ""

Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
