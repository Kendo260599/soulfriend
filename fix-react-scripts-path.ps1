# 🔧 Fix React Scripts Path Issue
# This script fixes the "react-scripts: command not found" error

Write-Host "🔧 Fixing React Scripts Path Issue" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host ""

# Navigate to frontend directory
Set-Location "D:\ung dung\soulfriend\frontend"

Write-Host "🔍 Step 1: Checking current setup..." -ForegroundColor Yellow
Write-Host "Node version: $(node --version)"
Write-Host "NPM version: $(npm --version)"
Write-Host ""

Write-Host "📦 Step 2: Checking react-scripts installation..." -ForegroundColor Cyan
if (Test-Path "node_modules\.bin\react-scripts.cmd") {
    Write-Host "✅ react-scripts.cmd found" -ForegroundColor Green
}
else {
    Write-Host "❌ react-scripts.cmd not found" -ForegroundColor Red
}

if (Test-Path "node_modules\.bin\react-scripts") {
    Write-Host "✅ react-scripts found" -ForegroundColor Green
}
else {
    Write-Host "❌ react-scripts not found" -ForegroundColor Red
}
Write-Host ""

Write-Host "🔧 Step 3: Reinstalling react-scripts..." -ForegroundColor Cyan
npm uninstall react-scripts
npm install react-scripts@5.0.1 --save-exact
Write-Host "✅ react-scripts reinstalled" -ForegroundColor Green
Write-Host ""

Write-Host "🔧 Step 4: Creating build script workaround..." -ForegroundColor Cyan

# Create a build script that uses the full path
$buildScript = @"
#!/bin/bash
# Build script for Railway deployment
echo "Building frontend with react-scripts..."
cd /app/frontend
if [ -f "node_modules/.bin/react-scripts" ]; then
    ./node_modules/.bin/react-scripts build
elif [ -f "node_modules/.bin/react-scripts.cmd" ]; then
    ./node_modules/.bin/react-scripts.cmd build
else
    echo "react-scripts not found, trying npx..."
    npx react-scripts build
fi
"@

$buildScript | Out-File -FilePath "build-frontend.sh" -Encoding UTF8
Write-Host "✅ Created build-frontend.sh" -ForegroundColor Green

# Create Windows batch file
$buildBatch = @"
@echo off
echo Building frontend with react-scripts...
cd /d "%~dp0frontend"
if exist "node_modules\.bin\react-scripts.cmd" (
    call node_modules\.bin\react-scripts.cmd build
) else if exist "node_modules\.bin\react-scripts" (
    call node_modules\.bin\react-scripts build
) else (
    echo react-scripts not found, trying npx...
    npx react-scripts build
)
"@

$buildBatch | Out-File -FilePath "build-frontend.bat" -Encoding UTF8
Write-Host "✅ Created build-frontend.bat" -ForegroundColor Green

Write-Host ""

Write-Host "🔧 Step 5: Updating package.json scripts..." -ForegroundColor Cyan

# Read current package.json
$packageJson = Get-Content "package.json" | ConvertFrom-Json

# Update build script to use full path
$packageJson.scripts.build = "node_modules/.bin/react-scripts build"
$packageJson.scripts.start = "node_modules/.bin/react-scripts start"
$packageJson.scripts.test = "node_modules/.bin/react-scripts test"

# Write back to package.json
$packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
Write-Host "✅ Updated package.json scripts" -ForegroundColor Green

Write-Host ""

Write-Host "🔧 Step 6: Testing build with different methods..." -ForegroundColor Cyan

Write-Host "Testing with npx..." -ForegroundColor White
npx react-scripts build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ npx react-scripts build works" -ForegroundColor Green
}
else {
    Write-Host "❌ npx react-scripts build failed" -ForegroundColor Red
}

Write-Host "Testing with direct path..." -ForegroundColor White
.\node_modules\.bin\react-scripts.cmd build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Direct path works" -ForegroundColor Green
}
else {
    Write-Host "❌ Direct path failed" -ForegroundColor Red
}

Write-Host ""

Write-Host "🔧 Step 7: Updating Railway configuration..." -ForegroundColor Cyan

# Update frontend railway.toml
$frontendRailway = @"
[build]
builder = "nixpacks"
buildCommand = "cd frontend && npm ci && npx react-scripts build"
nixpacksConfig = { providers = ["nodejs"], variables = { NODE_VERSION = "20" }, phases = { setup = "nix-env -iA nixpkgs.nodejs_20" } }

[deploy]
startCommand = "npx serve -s frontend/build -l 3000"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10

[environments.production.variables]
NODE_ENV = "production"
PORT = "3000"
NODE_VERSION = "20"
"@

$frontendRailway | Set-Content "frontend/railway.toml"
Write-Host "✅ Updated frontend/railway.toml" -ForegroundColor Green

Write-Host ""

# Navigate back to root
Set-Location "D:\ung dung\soulfriend"

Write-Host "✅ React Scripts Path Fix Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary of fixes:" -ForegroundColor Yellow
Write-Host "- Reinstalled react-scripts with exact version" -ForegroundColor White
Write-Host "- Created build scripts with full paths" -ForegroundColor White
Write-Host "- Updated package.json to use full paths" -ForegroundColor White
Write-Host "- Updated Railway configuration" -ForegroundColor White
Write-Host "- Tested multiple build methods" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Next steps:" -ForegroundColor Yellow
Write-Host "1. Commit changes: git add . && git commit -m 'fix: resolve react-scripts path issue'" -ForegroundColor White
Write-Host "2. Push to repository: git push origin main" -ForegroundColor White
Write-Host "3. Redeploy on Railway" -ForegroundColor White
Write-Host ""

Write-Host "💡 The 'react-scripts: command not found' error should now be resolved!" -ForegroundColor Magenta
Write-Host ""

Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
