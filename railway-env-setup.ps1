# 🚀 Railway Environment Setup Script
Write-Host "🚀 Railway Environment Setup Script" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

# Function to set Railway environment variables
function Set-RailwayEnvironment {
    Write-Host "`n🔧 Setting Railway Environment Variables..." -ForegroundColor Yellow
    
    # Check if Railway CLI is installed
    try {
        railway --version | Out-Null
        Write-Host "✅ Railway CLI is installed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Red
        npm install -g @railway/cli
    }
    
    # Check if logged in
    try {
        railway whoami | Out-Null
        Write-Host "✅ Logged in to Railway" -ForegroundColor Green
    } catch {
        Write-Host "❌ Not logged in to Railway. Please login first:" -ForegroundColor Red
        Write-Host "Run: railway login" -ForegroundColor Yellow
        return $false
    }
    
    Write-Host "`n🔧 Setting Node.js version..." -ForegroundColor Gray
    
    # Set Node.js version for backend
    Write-Host "Setting backend Node.js version..." -ForegroundColor Gray
    cd backend
    railway variables --set "NODE_VERSION=20"
    railway variables --set "NODE_ENV=production"
    railway variables --set "PORT=5000"
    
    cd ../frontend
    Write-Host "Setting frontend Node.js version..." -ForegroundColor Gray
    railway variables --set "NODE_VERSION=20"
    railway variables --set "NODE_ENV=production"
    railway variables --set "PORT=3000"
    
    cd ..
    
    Write-Host "✅ Environment variables set!" -ForegroundColor Green
    return $true
}

# Function to trigger Railway rebuild
function Trigger-RailwayRebuild {
    Write-Host "`n🔄 Triggering Railway Rebuild..." -ForegroundColor Yellow
    
    # Backend rebuild
    Write-Host "Triggering backend rebuild..." -ForegroundColor Gray
    cd backend
    railway up --detach
    
    cd ../frontend
    Write-Host "Triggering frontend rebuild..." -ForegroundColor Gray
    railway up --detach
    
    cd ..
    
    Write-Host "✅ Rebuild triggered!" -ForegroundColor Green
}

# Main execution
Write-Host "`n🚀 Starting Railway environment setup..." -ForegroundColor Green

# Check if we're in the right directory
if (!(Test-Path "backend/package.json") -or !(Test-Path "frontend/package.json")) {
    Write-Host "❌ Please run this script from the project root directory!" -ForegroundColor Red
    exit 1
}

# Set environment variables
if (Set-RailwayEnvironment) {
    # Trigger rebuild
    Trigger-RailwayRebuild
    
    Write-Host "`n🎉 Railway environment setup completed!" -ForegroundColor Green
    Write-Host "===================================" -ForegroundColor Green
    Write-Host "✅ Node.js version: Set to 20" -ForegroundColor Green
    Write-Host "✅ Environment: Production" -ForegroundColor Green
    Write-Host "✅ Rebuild: Triggered" -ForegroundColor Green
    Write-Host "`n📊 Check Railway Dashboard for build status!" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Please login to Railway first:" -ForegroundColor Red
    Write-Host "Run: railway login" -ForegroundColor Yellow
}
