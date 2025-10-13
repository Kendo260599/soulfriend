# 🧹 Clean Deprecated Packages and Update Dependencies
# This script addresses deprecated package warnings

Write-Host "🧹 Cleaning Deprecated Packages and Updating Dependencies" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green
Write-Host ""

# Navigate to frontend directory
Set-Location "D:\ung dung\soulfriend\frontend"

Write-Host "📦 Current frontend dependencies status:" -ForegroundColor Yellow
npm outdated
Write-Host ""

Write-Host "🔧 Updating frontend dependencies..." -ForegroundColor Yellow

# Update specific packages that are causing deprecated warnings
Write-Host "1. Updating @types/node to latest..." -ForegroundColor Cyan
npm install @types/node@latest

Write-Host "2. Updating @types/jest to latest..." -ForegroundColor Cyan
npm install @types/jest@latest

Write-Host "3. Updating typescript to latest..." -ForegroundColor Cyan
npm install typescript@latest

Write-Host "4. Updating web-vitals to latest..." -ForegroundColor Cyan
npm install web-vitals@latest

Write-Host "5. Updating chart.js to latest..." -ForegroundColor Cyan
npm install chart.js@latest

Write-Host "6. Updating @testing-library/user-event to latest..." -ForegroundColor Cyan
npm install @testing-library/user-event@latest

Write-Host ""

# Update react-scripts to latest to get rid of deprecated dependencies
Write-Host "7. Updating react-scripts to latest..." -ForegroundColor Cyan
npm install react-scripts@latest

Write-Host ""

# Check for any remaining deprecated packages
Write-Host "🔍 Checking for remaining deprecated packages..." -ForegroundColor Yellow
npm ls --depth=0 | Select-String "deprecated"

Write-Host ""

# Run npm audit to check for security issues
Write-Host "🔒 Running security audit..." -ForegroundColor Yellow
npm audit

Write-Host ""

# Try to fix any vulnerabilities
Write-Host "🛠️ Attempting to fix vulnerabilities..." -ForegroundColor Yellow
npm audit fix

Write-Host ""

# Check updated dependencies
Write-Host "📋 Updated dependencies status:" -ForegroundColor Yellow
npm outdated

Write-Host ""

# Test build to make sure everything still works
Write-Host "🏗️ Testing build..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed. Please check the errors above." -ForegroundColor Red
}

Write-Host ""

# Navigate back to root
Set-Location "D:\ung dung\soulfriend"

Write-Host "✅ Deprecated packages cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary of changes:" -ForegroundColor Yellow
Write-Host "- Updated @types/node to latest version" -ForegroundColor White
Write-Host "- Updated @types/jest to latest version" -ForegroundColor White
Write-Host "- Updated typescript to latest version" -ForegroundColor White
Write-Host "- Updated web-vitals to latest version" -ForegroundColor White
Write-Host "- Updated chart.js to latest version" -ForegroundColor White
Write-Host "- Updated @testing-library/user-event to latest version" -ForegroundColor White
Write-Host "- Updated react-scripts to latest version" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Next steps:" -ForegroundColor Yellow
Write-Host "1. Test the application locally: npm start" -ForegroundColor White
Write-Host "2. Commit changes: git add . && git commit -m 'chore: update dependencies and clean deprecated packages'" -ForegroundColor White
Write-Host "3. Push to repository: git push origin main" -ForegroundColor White
Write-Host "4. Redeploy on Railway" -ForegroundColor White
Write-Host ""

Write-Host "💡 The deprecated package warnings should now be significantly reduced!" -ForegroundColor Magenta
Write-Host ""

Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
