# 🚀 SoulFriend Auto-Deploy to Railway
# This script automates the Railway deployment process

Write-Host "🚀 SoulFriend Auto-Deploy to Railway" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

# Set Railway token
$env:RAILWAY_TOKEN = "6b6b5528-4a3e-4c94-a074-3c02f94bb2fb"
Write-Host "✅ Railway token set" -ForegroundColor Green

# Check if Railway CLI is installed
Write-Host "🔍 Checking Railway CLI..." -ForegroundColor Yellow
try {
    $railwayVersion = railway --version
    Write-Host "✅ Railway CLI found: $railwayVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Red
    npm install -g @railway/cli
}

# Check current directory
Write-Host "📁 Current directory: $(Get-Location)" -ForegroundColor Cyan

# Check git status
Write-Host "🔍 Checking git status..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️  Uncommitted changes found. Committing..." -ForegroundColor Yellow
    git add .
    git commit -m "feat: auto-deploy preparation - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    git push origin main
    Write-Host "✅ Changes committed and pushed" -ForegroundColor Green
} else {
    Write-Host "✅ No uncommitted changes" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎯 Deployment Options:" -ForegroundColor Yellow
Write-Host "1. Manual Dashboard Deployment (Recommended)" -ForegroundColor Cyan
Write-Host "2. CLI Deployment (Requires interactive login)" -ForegroundColor Cyan
Write-Host ""

# Open Railway dashboard
Write-Host "🌐 Opening Railway Dashboard..." -ForegroundColor Yellow
Start-Process "https://railway.app"

Write-Host ""
Write-Host "📋 Manual Deployment Steps:" -ForegroundColor Yellow
Write-Host "1. Login to Railway with your GitHub account" -ForegroundColor White
Write-Host "2. Create new project for backend" -ForegroundColor White
Write-Host "3. Select 'Deploy from GitHub repo'" -ForegroundColor White
Write-Host "4. Choose 'soulfriend' repository" -ForegroundColor White
Write-Host "5. Select 'backend' folder" -ForegroundColor White
Write-Host "6. Name it: 'soulfriend-backend'" -ForegroundColor White
Write-Host "7. Repeat for frontend with 'frontend' folder" -ForegroundColor White
Write-Host ""

Write-Host "🔧 Environment Variables for Backend:" -ForegroundColor Magenta
Write-Host "NODE_ENV=production" -ForegroundColor White
Write-Host "PORT=5000" -ForegroundColor White
Write-Host "MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/soulfriend" -ForegroundColor White
Write-Host "JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long-change-this-in-production" -ForegroundColor White
Write-Host "ENCRYPTION_KEY=your-encryption-key-must-be-64-hex-characters-long-change-this-in-production" -ForegroundColor White
Write-Host "DEFAULT_ADMIN_USERNAME=admin" -ForegroundColor White
Write-Host "DEFAULT_ADMIN_EMAIL=admin@soulfriend.vn" -ForegroundColor White
Write-Host "DEFAULT_ADMIN_PASSWORD=ChangeThisSecurePassword123!" -ForegroundColor White
Write-Host "GEMINI_API_KEY=AIzaSyBaswf5ksxu1g7WvhS2_Hy7PHqWpjZu8LM" -ForegroundColor White
Write-Host ""

Write-Host "🔧 Environment Variables for Frontend:" -ForegroundColor Magenta
Write-Host "REACT_APP_API_URL=https://soulfriend-backend-production.railway.app" -ForegroundColor White
Write-Host "REACT_APP_GEMINI_API_KEY=AIzaSyBaswf5ksxu1g7WvhS2_Hy7PHqWpjZu8LM" -ForegroundColor White
Write-Host ""

# Create deployment monitoring script
Write-Host "📊 Creating deployment monitoring script..." -ForegroundColor Yellow
$monitorScript = @"
# Railway Deployment Monitor
Write-Host "🔍 Monitoring Railway deployments..." -ForegroundColor Yellow

# Check if we can access Railway
try {
    railway whoami
    Write-Host "✅ Connected to Railway" -ForegroundColor Green
    
    # List projects
    Write-Host "📋 Your Railway projects:" -ForegroundColor Cyan
    railway projects
    
    # Check deployments
    Write-Host "🚀 Recent deployments:" -ForegroundColor Cyan
    railway deployments
    
} catch {
    Write-Host "❌ Cannot connect to Railway. Please login manually:" -ForegroundColor Red
    Write-Host "   railway login" -ForegroundColor White
}
"@

$monitorScript | Out-File -FilePath "monitor-deployment.ps1" -Encoding UTF8
Write-Host "✅ Monitor script created: monitor-deployment.ps1" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Auto-deploy preparation complete!" -ForegroundColor Green
Write-Host "📖 See DEPLOYMENT_STEPS.md for detailed instructions" -ForegroundColor Cyan
Write-Host "🔍 Run .\monitor-deployment.ps1 to check deployment status" -ForegroundColor Cyan
Write-Host ""

# Wait for user input
Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
