# 🔧 Fix Node.js Version Issues - Complete Solution
# This script addresses all Node.js version compatibility issues

Write-Host "🔧 Fixing Node.js Version Issues - Complete Solution" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""

# Check current Node.js version
Write-Host "🔍 Current Node.js version:" -ForegroundColor Yellow
node --version
Write-Host ""

# 1. Update all Dockerfiles to use Node.js 20
Write-Host "🐳 Updating Dockerfiles to Node.js 20..." -ForegroundColor Yellow

# Update frontend Dockerfile.dev
if (Test-Path "frontend/Dockerfile.dev") {
    (Get-Content "frontend/Dockerfile.dev") -replace "FROM node:18-alpine", "FROM node:20-alpine" | Set-Content "frontend/Dockerfile.dev"
    Write-Host "✅ Updated frontend/Dockerfile.dev" -ForegroundColor Green
}

# Update backend Dockerfile.dev
if (Test-Path "backend/Dockerfile.dev") {
    (Get-Content "backend/Dockerfile.dev") -replace "FROM node:18-alpine", "FROM node:20-alpine" | Set-Content "backend/Dockerfile.dev"
    Write-Host "✅ Updated backend/Dockerfile.dev" -ForegroundColor Green
}

# Update root Dockerfile
if (Test-Path "Dockerfile") {
    (Get-Content "Dockerfile") -replace "FROM node:18-alpine", "FROM node:20-alpine" | Set-Content "Dockerfile"
    Write-Host "✅ Updated root Dockerfile" -ForegroundColor Green
}

Write-Host ""

# 2. Create nixpacks.toml files for explicit Node.js version control
Write-Host "📦 Creating nixpacks.toml files..." -ForegroundColor Yellow

# Frontend nixpacks.toml
$frontendNixpacks = @"
[providers]
nodejs = "20"

[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]
"@
$frontendNixpacks | Out-File -FilePath "frontend/nixpacks.toml" -Encoding UTF8
Write-Host "✅ Created frontend/nixpacks.toml" -ForegroundColor Green

# Backend nixpacks.toml
$backendNixpacks = @"
[providers]
nodejs = "20"

[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]
"@
$backendNixpacks | Out-File -FilePath "backend/nixpacks.toml" -Encoding UTF8
Write-Host "✅ Created backend/nixpacks.toml" -ForegroundColor Green

Write-Host ""

# 3. Update package.json to be more explicit about Node.js requirements
Write-Host "📋 Updating package.json files..." -ForegroundColor Yellow

# Update frontend package.json
$frontendPackage = Get-Content "frontend/package.json" | ConvertFrom-Json
$frontendPackage.engines.node = ">=20.0.0"
$frontendPackage.engines.npm = ">=10.0.0"
$frontendPackage | ConvertTo-Json -Depth 10 | Set-Content "frontend/package.json"
Write-Host "✅ Updated frontend/package.json engines" -ForegroundColor Green

# Update backend package.json
$backendPackage = Get-Content "backend/package.json" | ConvertFrom-Json
$backendPackage.engines.node = ">=20.0.0"
$backendPackage.engines.npm = ">=10.0.0"
$backendPackage | ConvertTo-Json -Depth 10 | Set-Content "backend/package.json"
Write-Host "✅ Updated backend/package.json engines" -ForegroundColor Green

Write-Host ""

# 4. Create .node-version files (alternative to .nvmrc)
Write-Host "📁 Creating .node-version files..." -ForegroundColor Yellow
"20" | Out-File -FilePath "frontend/.node-version" -Encoding UTF8
"20" | Out-File -FilePath "backend/.node-version" -Encoding UTF8
"20" | Out-File -FilePath ".node-version" -Encoding UTF8
Write-Host "✅ Created .node-version files" -ForegroundColor Green

Write-Host ""

# 5. Create a comprehensive Railway configuration
Write-Host "🚂 Creating comprehensive Railway configuration..." -ForegroundColor Yellow

# Update frontend railway.toml with more explicit configuration
$frontendRailway = @"
[build]
builder = "nixpacks"
buildCommand = "npm run build"
nixpacksConfig = { providers = ["nodejs"], variables = { NODE_VERSION = "20" }, phases = { setup = "nix-env -iA nixpkgs.nodejs_20" } }

[deploy]
startCommand = "npx serve -s build -l 3000"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10

[environments.production.variables]
NODE_ENV = "production"
PORT = "3000"
NODE_VERSION = "20"
"@
$frontendRailway | Set-Content "frontend/railway.toml"
Write-Host "✅ Updated frontend/railway.toml" -ForegroundColor Green

# Update backend railway.toml
$backendRailway = @"
[build]
builder = "nixpacks"
buildCommand = "npm run build"
nixpacksConfig = { providers = ["nodejs"], variables = { NODE_VERSION = "20" }, phases = { setup = "nix-env -iA nixpkgs.nodejs_20" } }

[deploy]
startCommand = "npm start"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10

[environments.production.variables]
NODE_ENV = "production"
PORT = "5000"
NODE_VERSION = "20"
"@
$backendRailway | Set-Content "backend/railway.toml"
Write-Host "✅ Updated backend/railway.toml" -ForegroundColor Green

Write-Host ""

# 6. Create a deployment verification script
Write-Host "📊 Creating deployment verification script..." -ForegroundColor Yellow
$verifyScript = @"
# Verify Node.js Version in Railway Deployment
Write-Host "🔍 Verifying Node.js version in Railway deployment..." -ForegroundColor Yellow

# Check if Railway CLI is available
try {
    railway --version
    Write-Host "✅ Railway CLI available" -ForegroundColor Green
    
    # Check current project
    railway status
    Write-Host ""
    
    # Show recent deployments
    Write-Host "📋 Recent deployments:" -ForegroundColor Cyan
    railway deployments --limit 5
    Write-Host ""
    
    # Show logs for latest deployment
    Write-Host "📝 Latest deployment logs:" -ForegroundColor Cyan
    railway logs --limit 50
    
} catch {
    Write-Host "❌ Railway CLI not available. Please install and login:" -ForegroundColor Red
    Write-Host "   npm install -g @railway/cli" -ForegroundColor White
    Write-Host "   railway login" -ForegroundColor White
}
"@
$verifyScript | Out-File -FilePath "verify-railway-deployment.ps1" -Encoding UTF8
Write-Host "✅ Created verify-railway-deployment.ps1" -ForegroundColor Green

Write-Host ""

# Summary
Write-Host "✅ Complete Node.js Version Fix Applied:" -ForegroundColor Green
Write-Host "1. Updated all Dockerfiles to use Node.js 20" -ForegroundColor White
Write-Host "2. Created nixpacks.toml files with explicit Node.js 20 configuration" -ForegroundColor White
Write-Host "3. Updated package.json engines to require Node.js >=20.0.0" -ForegroundColor White
Write-Host "4. Created .node-version files for version control" -ForegroundColor White
Write-Host "5. Updated Railway configuration with explicit Node.js 20 setup" -ForegroundColor White
Write-Host "6. Created deployment verification script" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Commit all changes: git add . && git commit -m 'fix: complete Node.js 20 migration'" -ForegroundColor White
Write-Host "2. Push to repository: git push origin main" -ForegroundColor White
Write-Host "3. Redeploy on Railway" -ForegroundColor White
Write-Host "4. Run .\verify-railway-deployment.ps1 to check deployment" -ForegroundColor White
Write-Host ""

Write-Host "💡 This should completely resolve the EBADENGINE warnings!" -ForegroundColor Magenta
Write-Host ""

# Check git status
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "📝 Uncommitted changes detected. Would you like to commit them? (y/n)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "y" -or $response -eq "Y") {
        git add .
        git commit -m "fix: complete Node.js 20 migration for Railway deployment"
        Write-Host "✅ Changes committed" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🎉 Complete Node.js version fix applied!" -ForegroundColor Green
Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
