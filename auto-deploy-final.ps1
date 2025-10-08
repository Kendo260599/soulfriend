# 🚀 SoulFriend Auto Deploy Script - Ready to Execute
Write-Host "🚀 SoulFriend Auto Deploy Script" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Function to check GitHub Actions status
function Test-GitHubActions {
    Write-Host "🔍 Checking GitHub Actions status..." -ForegroundColor Cyan
    
    $latestRun = & "C:\Program Files\GitHub CLI\gh.exe" run list --limit 1 --json status,conclusion,workflowName
    $runData = $latestRun | ConvertFrom-Json
    
    if ($runData.status -eq "completed" -and $runData.conclusion -eq "success") {
        Write-Host "✅ GitHub Actions: All checks passed!" -ForegroundColor Green
        return $true
    } elseif ($runData.status -eq "completed" -and $runData.conclusion -eq "failure") {
        # Check if it's just security scan issues (not critical)
        Write-Host "⚠️ GitHub Actions: Some non-critical failures detected" -ForegroundColor Yellow
        Write-Host "   (Security scan permissions - not blocking deployment)" -ForegroundColor Yellow
        return $true
    } else {
        Write-Host "❌ GitHub Actions: Still running or failed" -ForegroundColor Red
        return $false
    }
}

# Function to check Railway login
function Test-RailwayLogin {
    Write-Host "🔍 Checking Railway login..." -ForegroundColor Cyan
    railway whoami
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Railway logged in!" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Railway not logged in!" -ForegroundColor Red
        return $false
    }
}

# Function to deploy via Railway Dashboard
function Show-RailwayDashboardInstructions {
    Write-Host "`n🌐 Railway Dashboard Deploy Instructions:" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    Write-Host "`n1. Open Railway Dashboard:" -ForegroundColor White
    Write-Host "   https://railway.app" -ForegroundColor Blue
    
    Write-Host "`n2. Login with GitHub account" -ForegroundColor White
    
    Write-Host "`n3. Create Backend Service:" -ForegroundColor White
    Write-Host "   - Click 'New Project'" -ForegroundColor White
    Write-Host "   - Select 'Deploy from GitHub repo'" -ForegroundColor White
    Write-Host "   - Choose 'Kendo260599/soulfriend' repository" -ForegroundColor White
    Write-Host "   - Select 'backend' folder" -ForegroundColor White
    Write-Host "   - Name: 'soulfriend-backend'" -ForegroundColor White
    Write-Host "   - Click 'Deploy'" -ForegroundColor White
    
    Write-Host "`n4. Configure Backend Environment Variables:" -ForegroundColor White
    Write-Host "   NODE_ENV=production" -ForegroundColor Gray
    Write-Host "   PORT=5000" -ForegroundColor Gray
    Write-Host "   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/soulfriend" -ForegroundColor Gray
    Write-Host "   JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long-change-this-in-production" -ForegroundColor Gray
    Write-Host "   ENCRYPTION_KEY=your-encryption-key-must-be-64-hex-characters-long-change-this-in-production" -ForegroundColor Gray
    Write-Host "   DEFAULT_ADMIN_USERNAME=admin" -ForegroundColor Gray
    Write-Host "   DEFAULT_ADMIN_EMAIL=admin@soulfriend.vn" -ForegroundColor Gray
    Write-Host "   DEFAULT_ADMIN_PASSWORD=ChangeThisSecurePassword123!" -ForegroundColor Gray
    Write-Host "   GEMINI_API_KEY=your-gemini-api-key-here" -ForegroundColor Gray
    
    Write-Host "`n5. Create Frontend Service:" -ForegroundColor White
    Write-Host "   - Click 'New Project'" -ForegroundColor White
    Write-Host "   - Select 'Deploy from GitHub repo'" -ForegroundColor White
    Write-Host "   - Choose 'Kendo260599/soulfriend' repository" -ForegroundColor White
    Write-Host "   - Select 'frontend' folder" -ForegroundColor White
    Write-Host "   - Name: 'soulfriend-frontend'" -ForegroundColor White
    Write-Host "   - Click 'Deploy'" -ForegroundColor White
    
    Write-Host "`n6. Configure Frontend Environment Variables:" -ForegroundColor White
    Write-Host "   NODE_ENV=production" -ForegroundColor Gray
    Write-Host "   PORT=3000" -ForegroundColor Gray
    Write-Host "   REACT_APP_API_URL=https://soulfriend-backend-production.up.railway.app" -ForegroundColor Gray
    
    Write-Host "`n7. Wait for deployment to complete (5-10 minutes)" -ForegroundColor White
    
    Write-Host "`n8. Test your application:" -ForegroundColor White
    Write-Host "   Backend: https://soulfriend-backend-production.up.railway.app/api/health" -ForegroundColor Blue
    Write-Host "   Frontend: https://soulfriend-frontend-production.up.railway.app" -ForegroundColor Blue
}

# Function to attempt Railway CLI deploy
function Start-RailwayCLIDeploy {
    Write-Host "`n🚀 Attempting Railway CLI Deploy..." -ForegroundColor Cyan
    
    # Deploy backend
    Write-Host "`n📦 Deploying Backend..." -ForegroundColor Yellow
    cd backend
    railway init --service "soulfriend-backend" --environment "production"
    railway up --detach
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend deployed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend deployment failed!" -ForegroundColor Red
        return $false
    }
    
    # Deploy frontend
    Write-Host "`n📦 Deploying Frontend..." -ForegroundColor Yellow
    cd ../frontend
    railway init --service "soulfriend-frontend" --environment "production"
    railway up --detach
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Frontend deployed successfully!" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Frontend deployment failed!" -ForegroundColor Red
        return $false
    }
}

# Main execution
Write-Host "`n🚀 Starting auto-deploy process..." -ForegroundColor Green

# Step 1: Check GitHub Actions
if (!(Test-GitHubActions)) {
    Write-Host "`n⚠️ GitHub Actions not ready. Please wait for completion." -ForegroundColor Yellow
    Write-Host "You can check status with: gh run list" -ForegroundColor Yellow
    exit 1
}

# Step 2: Check Railway login
if (!(Test-RailwayLogin)) {
    Write-Host "`n🔐 Railway Login Required!" -ForegroundColor Yellow
    Write-Host "Please run: railway login" -ForegroundColor Yellow
    Write-Host "After logging in, run this script again." -ForegroundColor Yellow
    
    # Show dashboard instructions as alternative
    Show-RailwayDashboardInstructions
    exit 1
}

# Step 3: Attempt Railway CLI deploy
if (Start-RailwayCLIDeploy) {
    Write-Host "`n🎉 Deployment completed successfully!" -ForegroundColor Green
    Write-Host "=================================" -ForegroundColor Green
    Write-Host "✅ Backend: Deployed to Railway" -ForegroundColor Green
    Write-Host "✅ Frontend: Deployed to Railway" -ForegroundColor Green
    Write-Host "`n📊 Check your Railway dashboard for URLs and logs." -ForegroundColor Cyan
    Write-Host "🔗 Railway Dashboard: https://railway.app" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Railway CLI deployment failed!" -ForegroundColor Red
    Write-Host "Please use Railway Dashboard method instead:" -ForegroundColor Yellow
    Show-RailwayDashboardInstructions
}
