# 🚀 SoulFriend Auto Deploy Script
Write-Host "🚀 SoulFriend Auto Deploy Script" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Function to check build status
function Test-Build {
    Write-Host "🔍 Checking build status..." -ForegroundColor Cyan
    cd backend
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build successful!" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        return $false
    }
}

# Function to check linting
function Test-Lint {
    Write-Host "🔍 Checking linting..." -ForegroundColor Cyan
    npm run lint
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Linting passed!" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Linting failed!" -ForegroundColor Red
        return $false
    }
}

# Function to check tests
function Test-Tests {
    Write-Host "🔍 Checking tests..." -ForegroundColor Cyan
    npm run test:ci
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Tests passed!" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Tests failed!" -ForegroundColor Red
        return $false
    }
}

# Function to check Railway CLI
function Test-Railway {
    Write-Host "🔍 Checking Railway CLI..." -ForegroundColor Cyan
    if (Test-Command "railway") {
        Write-Host "✅ Railway CLI installed!" -ForegroundColor Green
        railway --version
        return $true
    } else {
        Write-Host "❌ Railway CLI not found!" -ForegroundColor Red
        Write-Host "Installing Railway CLI..." -ForegroundColor Yellow
        npm install -g @railway/cli
        return $true
    }
}

# Function to attempt Railway login
function Test-RailwayLogin {
    Write-Host "🔍 Checking Railway login..." -ForegroundColor Cyan
    railway whoami
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Railway logged in!" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Railway not logged in!" -ForegroundColor Red
        Write-Host "Please run: railway login" -ForegroundColor Yellow
        return $false
    }
}

# Main execution
Write-Host "`n🚀 Starting auto-deploy process..." -ForegroundColor Green

# Check if we're in the right directory
if (!(Test-Path "backend/package.json")) {
    Write-Host "❌ Please run this script from the project root directory!" -ForegroundColor Red
    exit 1
}

# Step 1: Check build
if (!(Test-Build)) {
    Write-Host "❌ Build failed! Please fix build errors first." -ForegroundColor Red
    exit 1
}

# Step 2: Check linting
if (!(Test-Lint)) {
    Write-Host "❌ Linting failed! Please fix linting errors first." -ForegroundColor Red
    exit 1
}

# Step 3: Check tests
if (!(Test-Tests)) {
    Write-Host "❌ Tests failed! Please fix test errors first." -ForegroundColor Red
    exit 1
}

# Step 4: Check Railway CLI
if (!(Test-Railway)) {
    Write-Host "❌ Railway CLI installation failed!" -ForegroundColor Red
    exit 1
}

# Step 5: Check Railway login
if (!(Test-RailwayLogin)) {
    Write-Host "`n🔐 Railway Login Required!" -ForegroundColor Yellow
    Write-Host "Please run the following command and login:" -ForegroundColor Yellow
    Write-Host "railway login" -ForegroundColor White
    Write-Host "`nAfter logging in, run this script again." -ForegroundColor Yellow
    exit 1
}

# Step 6: Deploy backend
Write-Host "`n🚀 Deploying backend..." -ForegroundColor Cyan
cd backend
railway init
railway up --detach
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Backend deployment failed!" -ForegroundColor Red
    exit 1
}

# Step 7: Deploy frontend
Write-Host "`n🚀 Deploying frontend..." -ForegroundColor Cyan
cd ../frontend
railway init
railway up --detach
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend deployment failed!" -ForegroundColor Red
    exit 1
}

# Step 8: Final verification
Write-Host "`n🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host "✅ Backend: Deployed to Railway" -ForegroundColor Green
Write-Host "✅ Frontend: Deployed to Railway" -ForegroundColor Green
Write-Host "`n📊 Check your Railway dashboard for URLs and logs." -ForegroundColor Cyan
Write-Host "🔗 Railway Dashboard: https://railway.app" -ForegroundColor Cyan


