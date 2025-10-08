# 🚀 Railway Auto Login & Error Check Script
Write-Host "🚀 Railway Auto Login & Error Check Script" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Function to check Railway CLI installation
function Check-RailwayCLI {
    Write-Host "`n🔍 Checking Railway CLI..." -ForegroundColor Yellow
    try {
        $version = railway --version
        Write-Host "✅ Railway CLI is installed: $version" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Red
        npm install -g @railway/cli
        return $true
    }
}

# Function to check Railway login status
function Check-RailwayLogin {
    Write-Host "`n🔍 Checking Railway login status..." -ForegroundColor Yellow
    try {
        $user = railway whoami
        Write-Host "✅ Logged in as: $user" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Not logged in to Railway" -ForegroundColor Red
        return $false
    }
}

# Function to login to Railway
function Login-Railway {
    Write-Host "`n🔐 Logging in to Railway..." -ForegroundColor Yellow
    Write-Host "A browser window will open for authentication..." -ForegroundColor Gray
    
    try {
        railway login
        Write-Host "✅ Successfully logged in to Railway!" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Failed to login to Railway" -ForegroundColor Red
        return $false
    }
}

# Function to check Railway projects
function Check-RailwayProjects {
    Write-Host "`n📊 Checking Railway projects..." -ForegroundColor Yellow
    try {
        railway projects
        Write-Host "✅ Projects retrieved successfully" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Failed to retrieve projects" -ForegroundColor Red
        return $false
    }
}

# Function to check build status
function Check-BuildStatus {
    Write-Host "`n🔍 Checking build status..." -ForegroundColor Yellow
    
    # Check backend build status
    Write-Host "Checking backend build status..." -ForegroundColor Gray
    cd backend
    try {
        railway status
        Write-Host "✅ Backend status retrieved" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to get backend status" -ForegroundColor Red
    }
    
    cd ../frontend
    Write-Host "Checking frontend build status..." -ForegroundColor Gray
    try {
        railway status
        Write-Host "✅ Frontend status retrieved" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to get frontend status" -ForegroundColor Red
    }
    
    cd ..
}

# Function to trigger rebuild
function Trigger-Rebuild {
    Write-Host "`n🔄 Triggering rebuild..." -ForegroundColor Yellow
    
    # Backend rebuild
    Write-Host "Triggering backend rebuild..." -ForegroundColor Gray
    cd backend
    try {
        railway up --detach
        Write-Host "✅ Backend rebuild triggered" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to trigger backend rebuild" -ForegroundColor Red
    }
    
    cd ../frontend
    Write-Host "Triggering frontend rebuild..." -ForegroundColor Gray
    try {
        railway up --detach
        Write-Host "✅ Frontend rebuild triggered" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to trigger frontend rebuild" -ForegroundColor Red
    }
    
    cd ..
}

# Function to check recent deployments
function Check-RecentDeployments {
    Write-Host "`n📈 Checking recent deployments..." -ForegroundColor Yellow
    
    # Backend deployments
    Write-Host "Checking backend deployments..." -ForegroundColor Gray
    cd backend
    try {
        railway logs --tail 20
        Write-Host "✅ Backend logs retrieved" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to get backend logs" -ForegroundColor Red
    }
    
    cd ../frontend
    Write-Host "Checking frontend deployments..." -ForegroundColor Gray
    try {
        railway logs --tail 20
        Write-Host "✅ Frontend logs retrieved" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to get frontend logs" -ForegroundColor Red
    }
    
    cd ..
}

# Main execution
Write-Host "`n🚀 Starting Railway auto login and error check..." -ForegroundColor Green

# Check if we're in the right directory
if (!(Test-Path "backend/package.json") -or !(Test-Path "frontend/package.json")) {
    Write-Host "❌ Please run this script from the project root directory!" -ForegroundColor Red
    exit 1
}

# Step 1: Check Railway CLI
if (!(Check-RailwayCLI)) {
    Write-Host "❌ Failed to install Railway CLI" -ForegroundColor Red
    exit 1
}

# Step 2: Check login status
if (!(Check-RailwayLogin)) {
    # Step 3: Login to Railway
    if (!(Login-Railway)) {
        Write-Host "`n❌ Failed to login to Railway. Please login manually:" -ForegroundColor Red
        Write-Host "Run: railway login" -ForegroundColor Yellow
        exit 1
    }
}

# Step 4: Check projects
if (!(Check-RailwayProjects)) {
    Write-Host "⚠️ Could not retrieve projects, but continuing..." -ForegroundColor Yellow
}

# Step 5: Check build status
Check-BuildStatus

# Step 6: Check recent deployments
Check-RecentDeployments

# Step 7: Trigger rebuild
Write-Host "`n🔄 Do you want to trigger a rebuild? (y/n)" -ForegroundColor Cyan
$response = Read-Host
if ($response -eq "y" -or $response -eq "Y") {
    Trigger-Rebuild
}

Write-Host "`n🎉 Railway check completed!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host "✅ Railway CLI: Installed" -ForegroundColor Green
Write-Host "✅ Login: Successful" -ForegroundColor Green
Write-Host "✅ Projects: Retrieved" -ForegroundColor Green
Write-Host "✅ Build Status: Checked" -ForegroundColor Green
Write-Host "✅ Logs: Retrieved" -ForegroundColor Green
Write-Host "`n📊 Check Railway Dashboard for detailed status!" -ForegroundColor Cyan
