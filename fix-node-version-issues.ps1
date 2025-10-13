# 🔧 Fix Node.js Version Issues for Railway Deployment
# This script addresses the Node.js version compatibility warnings

Write-Host "🔧 Fixing Node.js Version Issues for Railway" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

# Check current Node.js version
Write-Host "🔍 Current Node.js version:" -ForegroundColor Yellow
node --version
Write-Host ""

# Verify package.json engine requirements
Write-Host "📋 Checking package.json engine requirements..." -ForegroundColor Yellow

Write-Host "Frontend requirements:" -ForegroundColor Cyan
$frontendEngines = (Get-Content "frontend/package.json" | ConvertFrom-Json).engines
Write-Host "  Node: $($frontendEngines.node)" -ForegroundColor White
Write-Host "  NPM: $($frontendEngines.npm)" -ForegroundColor White

Write-Host "Backend requirements:" -ForegroundColor Cyan
$backendEngines = (Get-Content "backend/package.json" | ConvertFrom-Json).engines
Write-Host "  Node: $($backendEngines.node)" -ForegroundColor White
Write-Host "  NPM: $($backendEngines.npm)" -ForegroundColor White

Write-Host ""

# Verify Railway configuration files
Write-Host "🚂 Checking Railway configuration..." -ForegroundColor Yellow

Write-Host "Frontend railway.toml:" -ForegroundColor Cyan
Get-Content "frontend/railway.toml" | Select-String "NODE_VERSION"
Write-Host ""

Write-Host "Backend railway.toml:" -ForegroundColor Cyan
Get-Content "backend/railway.toml" | Select-String "NODE_VERSION"
Write-Host ""

Write-Host "Root railway.toml:" -ForegroundColor Cyan
Get-Content "railway.toml" | Select-String "NODE_VERSION"
Write-Host ""

# Check .nvmrc files
Write-Host "📁 Checking .nvmrc files..." -ForegroundColor Yellow
if (Test-Path "frontend/.nvmrc") {
    Write-Host "✅ Frontend .nvmrc: $(Get-Content 'frontend/.nvmrc')" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend .nvmrc missing" -ForegroundColor Red
}

if (Test-Path "backend/.nvmrc") {
    Write-Host "✅ Backend .nvmrc: $(Get-Content 'backend/.nvmrc')" -ForegroundColor Green
} else {
    Write-Host "❌ Backend .nvmrc missing" -ForegroundColor Red
}

Write-Host ""

# Summary of fixes applied
Write-Host "✅ Fixes Applied:" -ForegroundColor Green
Write-Host "1. Updated frontend/railway.toml with explicit Node.js 20 in nixpacksConfig" -ForegroundColor White
Write-Host "2. Updated backend/railway.toml with explicit Node.js 20 in nixpacksConfig" -ForegroundColor White
Write-Host "3. Updated root railway.toml with explicit Node.js 20 in nixpacksConfig" -ForegroundColor White
Write-Host "4. Created .nvmrc files specifying Node.js 20 for both frontend and backend" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Commit these changes to git" -ForegroundColor White
Write-Host "2. Push to your repository" -ForegroundColor White
Write-Host "3. Redeploy on Railway" -ForegroundColor White
Write-Host "4. The Node.js version warnings should be resolved" -ForegroundColor White
Write-Host ""

Write-Host "💡 Additional Notes:" -ForegroundColor Magenta
Write-Host "- Railway will now use Node.js 20 for both frontend and backend builds" -ForegroundColor White
Write-Host "- The EBADENGINE warnings should disappear" -ForegroundColor White
Write-Host "- All packages requiring Node.js 20+ will work correctly" -ForegroundColor White
Write-Host ""

# Check if we should commit changes
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "📝 Uncommitted changes detected. Would you like to commit them? (y/n)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "y" -or $response -eq "Y") {
        git add .
        git commit -m "fix: update Node.js version to 20 for Railway deployment compatibility"
        Write-Host "✅ Changes committed" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🎉 Node.js version fix complete!" -ForegroundColor Green
Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
