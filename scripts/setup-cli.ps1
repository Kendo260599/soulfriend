# Quick setup script for Railway and Vercel CLI

Write-Host "🚀 Railway & Vercel CLI Setup" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "🔍 Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    Write-Host "   Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if npm is installed
Write-Host "`n🔍 Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm installed: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found!" -ForegroundColor Red
    exit 1
}

# Install Railway CLI
Write-Host "`n📦 Installing Railway CLI..." -ForegroundColor Yellow
try {
    npm install -g @railway/cli
    Write-Host "✅ Railway CLI installed successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Railway CLI installation failed or already installed" -ForegroundColor Yellow
}

# Check Railway CLI
Write-Host "`n🔍 Checking Railway CLI..." -ForegroundColor Yellow
try {
    $railwayVersion = railway --version 2>&1
    Write-Host "✅ Railway CLI: $railwayVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI not found" -ForegroundColor Red
}

# Install Vercel CLI
Write-Host "`n📦 Installing Vercel CLI..." -ForegroundColor Yellow
try {
    npm install -g vercel
    Write-Host "✅ Vercel CLI installed successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Vercel CLI installation failed or already installed" -ForegroundColor Yellow
}

# Check Vercel CLI
Write-Host "`n🔍 Checking Vercel CLI..." -ForegroundColor Yellow
try {
    $vercelVersion = vercel --version 2>&1
    Write-Host "✅ Vercel CLI: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found" -ForegroundColor Red
}

# Instructions
Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Login to Railway:" -ForegroundColor Yellow
Write-Host "   railway login" -ForegroundColor White
Write-Host ""

Write-Host "2. Link Railway project:" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   railway link" -ForegroundColor White
Write-Host ""

Write-Host "3. Login to Vercel:" -ForegroundColor Yellow
Write-Host "   vercel login" -ForegroundColor White
Write-Host ""

Write-Host "4. Link Vercel project:" -ForegroundColor Yellow
Write-Host "   cd frontend" -ForegroundColor White
Write-Host "   vercel link" -ForegroundColor White
Write-Host ""

Write-Host "5. Run debug script:" -ForegroundColor Yellow
Write-Host "   cd .." -ForegroundColor White
Write-Host "   .\scripts\debug-railway-vercel.ps1" -ForegroundColor White
Write-Host ""

Write-Host "✅ Setup complete!" -ForegroundColor Green










