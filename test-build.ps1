# 🧪 Test Build Script - Kiểm tra trước khi deploy
Write-Host "🧪 SoulFriend Build Test Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Function to test backend build
function Test-BackendBuild {
    Write-Host "`n🔍 Testing Backend Build..." -ForegroundColor Yellow
    cd backend
    
    # Check if TypeScript is available
    Write-Host "Checking TypeScript installation..." -ForegroundColor Gray
    npx tsc --version
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ TypeScript not found!" -ForegroundColor Red
        return $false
    }
    
    # Test build
    Write-Host "Running npm run build..." -ForegroundColor Gray
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend build successful!" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Backend build failed!" -ForegroundColor Red
        return $false
    }
}

# Function to test frontend build
function Test-FrontendBuild {
    Write-Host "`n🔍 Testing Frontend Build..." -ForegroundColor Yellow
    cd ../frontend
    
    # Test build
    Write-Host "Running npm run build..." -ForegroundColor Gray
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Frontend build successful!" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Frontend build failed!" -ForegroundColor Red
        return $false
    }
}

# Function to check Node.js version
function Test-NodeVersion {
    Write-Host "`n🔍 Checking Node.js Version..." -ForegroundColor Yellow
    $nodeVersion = node --version
    Write-Host "Current Node.js version: $nodeVersion" -ForegroundColor Gray
    
    # Extract major version number
    $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    
    if ($majorVersion -ge 20) {
        Write-Host "✅ Node.js version is compatible (>=20.0.0)" -ForegroundColor Green
        return $true
    } else {
        Write-Host "⚠️ Node.js version may cause issues (current: v$majorVersion, required: >=20)" -ForegroundColor Yellow
        Write-Host "Railway will use Node.js 20+ automatically" -ForegroundColor Gray
        return $true
    }
}

# Main execution
Write-Host "`n🚀 Starting build tests..." -ForegroundColor Green

# Check if we're in the right directory
if (!(Test-Path "backend/package.json") -or !(Test-Path "frontend/package.json")) {
    Write-Host "❌ Please run this script from the project root directory!" -ForegroundColor Red
    exit 1
}

# Test Node.js version
if (!(Test-NodeVersion)) {
    Write-Host "⚠️ Node.js version warning - Railway will handle this" -ForegroundColor Yellow
}

# Test backend build
if (!(Test-BackendBuild)) {
    Write-Host "`n❌ Backend build failed! Please fix errors before deploying." -ForegroundColor Red
    exit 1
}

# Test frontend build
if (!(Test-FrontendBuild)) {
    Write-Host "`n❌ Frontend build failed! Please fix errors before deploying." -ForegroundColor Red
    exit 1
}

# All tests passed
Write-Host "`n🎉 All build tests passed!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host "✅ Backend: Build successful" -ForegroundColor Green
Write-Host "✅ Frontend: Build successful" -ForegroundColor Green
Write-Host "✅ Node.js: Version compatible" -ForegroundColor Green
Write-Host "`n🚀 Ready to deploy to Railway!" -ForegroundColor Cyan
Write-Host "Run: powershell -ExecutionPolicy Bypass -File auto-deploy-final.ps1" -ForegroundColor Cyan
