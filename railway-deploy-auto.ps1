# 🚀 Railway Auto-Deploy with Token Authentication
param(
    [string]$Token = "6b6b5528-4a3e-4c94-a074-3c02f94bb2fb"
)

Write-Host "🚀 SoulFriend Auto-Deploy to Railway with Token" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""

# Set token as environment variable
$env:RAILWAY_TOKEN = $Token
Write-Host "✅ Railway token set: $($Token.Substring(0,8))..." -ForegroundColor Green

# Try to authenticate using Railway API
Write-Host "🔐 Attempting to authenticate with Railway..." -ForegroundColor Yellow

try {
    # Test authentication with Railway API
    $headers = @{
        "Authorization" = "Bearer $Token"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri "https://backboard.railway.app/graphql" -Method POST -Headers $headers -Body '{"query":"query { me { id name email } }"}'
    
    if ($response.data.me) {
        Write-Host "✅ Successfully authenticated as: $($response.data.me.name)" -ForegroundColor Green
        Write-Host "📧 Email: $($response.data.me.email)" -ForegroundColor Cyan
        
        # Now try to use Railway CLI
        Write-Host ""
        Write-Host "🚀 Attempting to deploy backend..." -ForegroundColor Yellow
        
        # Navigate to backend directory
        Set-Location "backend"
        
        # Try to deploy backend
        Write-Host "📦 Deploying backend from current directory..." -ForegroundColor Cyan
        railway up --detach
        
        Write-Host ""
        Write-Host "🔧 Setting backend environment variables..." -ForegroundColor Yellow
        
        # Set environment variables for backend
        $backendVars = @{
            "NODE_ENV" = "production"
            "PORT" = "5000"
            "MONGODB_URI" = "mongodb+srv://username:password@cluster.mongodb.net/soulfriend"
            "JWT_SECRET" = "your-super-secret-jwt-key-min-32-characters-long-change-this-in-production"
            "ENCRYPTION_KEY" = "your-encryption-key-must-be-64-hex-characters-long-change-this-in-production"
            "DEFAULT_ADMIN_USERNAME" = "admin"
            "DEFAULT_ADMIN_EMAIL" = "admin@soulfriend.vn"
            "DEFAULT_ADMIN_PASSWORD" = "ChangeThisSecurePassword123!"
            "GEMINI_API_KEY" = "AIzaSyBaswf5ksxu1g7WvhS2_Hy7PHqWpjZu8LM"
        }
        
        foreach ($var in $backendVars.GetEnumerator()) {
            Write-Host "Setting $($var.Key)..." -ForegroundColor White
            railway variables --set "$($var.Key)=$($var.Value)"
        }
        
        # Navigate to frontend directory
        Set-Location "../frontend"
        
        Write-Host ""
        Write-Host "🚀 Attempting to deploy frontend..." -ForegroundColor Yellow
        
        # Try to deploy frontend
        railway up --detach
        
        Write-Host ""
        Write-Host "🔧 Setting frontend environment variables..." -ForegroundColor Yellow
        
        # Set environment variables for frontend
        $frontendVars = @{
            "REACT_APP_API_URL" = "https://soulfriend-backend-production.railway.app"
            "REACT_APP_GEMINI_API_KEY" = "AIzaSyBaswf5ksxu1g7WvhS2_Hy7PHqWpjZu8LM"
        }
        
        foreach ($var in $frontendVars.GetEnumerator()) {
            Write-Host "Setting $($var.Key)..." -ForegroundColor White
            railway variables --set "$($var.Key)=$($var.Value)"
        }
        
        Write-Host ""
        Write-Host "🎉 Deployment completed!" -ForegroundColor Green
        Write-Host "📊 Checking deployment status..." -ForegroundColor Yellow
        
        # Check status
        railway status
        
    } else {
        Write-Host "❌ Authentication failed" -ForegroundColor Red
        Write-Host "💡 Token may be invalid or expired" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Error during authentication: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Falling back to manual deployment..." -ForegroundColor Yellow
    
    # Fallback to manual deployment
    Write-Host ""
    Write-Host "🌐 Opening Railway dashboard for manual deployment..." -ForegroundColor Yellow
    Start-Process "https://railway.app"
    
    Write-Host ""
    Write-Host "📋 Manual deployment steps:" -ForegroundColor Cyan
    Write-Host "1. Login to Railway dashboard" -ForegroundColor White
    Write-Host "2. Create new project for backend" -ForegroundColor White
    Write-Host "3. Deploy from GitHub repo: soulfriend/backend" -ForegroundColor White
    Write-Host "4. Create new project for frontend" -ForegroundColor White
    Write-Host "5. Deploy from GitHub repo: soulfriend/frontend" -ForegroundColor White
    Write-Host "6. Configure environment variables" -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
