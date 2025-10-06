# Fix API Connection Issues
param(
    [Parameter(Mandatory=$true)]
    [string]$BackendUrl
)

Write-Host "🔧 Fixing API Connection Issues..." -ForegroundColor Cyan
Write-Host "Backend URL: $BackendUrl" -ForegroundColor Green
Write-Host ""

# Test backend first
Write-Host "1️⃣ Testing backend connection..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "$BackendUrl/api/health" -Method GET -TimeoutSec 30
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "✅ Backend is working!" -ForegroundColor Green
        $healthData = $healthResponse.Content | ConvertFrom-Json
        Write-Host "   Status: $($healthData.status)" -ForegroundColor Gray
        Write-Host "   AI: $($healthData.gemini)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Backend health check failed!" -ForegroundColor Red
        Write-Host "   Status: $($healthResponse.StatusCode)" -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Host "❌ Cannot connect to backend!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔧 Solutions:" -ForegroundColor Yellow
    Write-Host "   1. Check if backend is deployed on Render" -ForegroundColor White
    Write-Host "   2. Verify the URL is correct" -ForegroundColor White
    Write-Host "   3. Check Render logs for errors" -ForegroundColor White
    exit 1
}

Write-Host ""

# Update frontend configuration
Write-Host "2️⃣ Updating frontend configuration..." -ForegroundColor Yellow
cd frontend

# Create production environment file
$envContent = @"
REACT_APP_API_URL=$BackendUrl
"@

$envContent | Out-File -FilePath ".env.production" -Encoding UTF8
Write-Host "✅ Updated .env.production" -ForegroundColor Green
Write-Host "   REACT_APP_API_URL = $BackendUrl" -ForegroundColor Gray

Write-Host ""

# Test chatbot API
Write-Host "3️⃣ Testing chatbot API..." -ForegroundColor Yellow
try {
    $chatbotBody = @{
        message = "Xin chào CHUN"
        userId = "test_user"
        sessionId = "test_session"
        context = @{
            userProfile = @{
                age = 25
                gender = "female"
                culturalContext = "vietnamese"
            }
            testResults = @()
        }
    } | ConvertTo-Json

    $chatbotResponse = Invoke-WebRequest -Uri "$BackendUrl/api/v2/chatbot/message" -Method POST -Body $chatbotBody -ContentType "application/json" -TimeoutSec 30
    
    if ($chatbotResponse.StatusCode -eq 200) {
        $chatbotData = $chatbotResponse.Content | ConvertFrom-Json
        Write-Host "✅ Chatbot API is working!" -ForegroundColor Green
        if ($chatbotData.success) {
            Write-Host "   AI Response: $($chatbotData.data.message.Substring(0, [Math]::Min(50, $chatbotData.data.message.Length)))..." -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ Chatbot API failed!" -ForegroundColor Red
        Write-Host "   Status: $($chatbotResponse.StatusCode)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Chatbot API error!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""

# Redeploy frontend
Write-Host "4️⃣ Redeploying frontend..." -ForegroundColor Yellow
Write-Host "This will take a few minutes..." -ForegroundColor Gray

try {
    $deployResult = vercel --prod --yes
    Write-Host "✅ Frontend redeployed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend deployment failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔧 Manual deployment:" -ForegroundColor Yellow
    Write-Host "   cd frontend" -ForegroundColor White
    Write-Host "   vercel --prod" -ForegroundColor White
}

Write-Host ""

# Final instructions
Write-Host "🎯 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Wait 2-3 minutes for deployment to complete" -ForegroundColor White
Write-Host "2. Open your website: https://frontend-itgyjx8eq-kendo260599s-projects.vercel.app" -ForegroundColor White
Write-Host "3. Test chatbot - should now show AI responses!" -ForegroundColor White
Write-Host "4. Check browser console - should see no more API errors" -ForegroundColor White
Write-Host ""
Write-Host "🌸 API connection should now be fixed!" -ForegroundColor Green
