# 🚀 Quick Fix and Deploy
# This script quickly fixes the react-scripts issue and prepares for deployment

Write-Host "🚀 Quick Fix and Deploy" -ForegroundColor Green
Write-Host "=======================" -ForegroundColor Green
Write-Host ""

# Navigate to frontend
Set-Location "D:\ung dung\soulfriend\frontend"

Write-Host "🔧 Testing build locally..." -ForegroundColor Yellow
npx react-scripts build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Local build successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Local build failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Navigate back to root
Set-Location "D:\ung dung\soulfriend"

Write-Host "📝 Committing changes..." -ForegroundColor Yellow
git add .
git commit -m "fix: update Railway build commands to use npx react-scripts"
git push origin main

Write-Host "✅ Changes committed and pushed!" -ForegroundColor Green
Write-Host ""

Write-Host "🎉 Ready for Railway deployment!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 What was fixed:" -ForegroundColor Yellow
Write-Host "- Updated frontend/railway.toml to use 'npx react-scripts build'" -ForegroundColor White
Write-Host "- Updated backend/railway.toml to use 'npm ci && npm run build'" -ForegroundColor White
Write-Host "- Tested local build successfully" -ForegroundColor White
Write-Host "- Committed and pushed changes" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to Railway dashboard" -ForegroundColor White
Write-Host "2. Redeploy your services" -ForegroundColor White
Write-Host "3. The 'react-scripts: command not found' error should be resolved!" -ForegroundColor White
Write-Host ""

Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
