# Test SoulFriend Deployment
param(
    [string]$BackendUrl = "",
    [string]$FrontendUrl = "https://frontend-itgyjx8eq-kendo260599s-projects.vercel.app"
)

Write-Host "🧪 Testing SoulFriend Deployment..." -ForegroundColor Cyan
Write-Host ""

if ([string]::IsNullOrEmpty($BackendUrl)) {
    Write-Host "❌ Please provide backend URL:" -ForegroundColor Red
    Write-Host "   .\test-deployment.ps1 -BackendUrl 'https://soulfriend-api-XXXX.onrender.com'" -ForegroundColor Yellow
    exit 1
}

Write-Host "🔗 Backend URL: $BackendUrl" -ForegroundColor Green
Write-Host "🔗 Frontend URL: $FrontendUrl" -ForegroundColor Green
Write-Host ""

# Test 1: Backend Health
Write-Host "1️⃣ Testing Backend Health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "$BackendUrl/api/health" -Method GET -TimeoutSec 30
    if ($healthResponse.StatusCode -eq 200) {
        $healthData = $healthResponse.Content | ConvertFrom-Json
        Write-Host "✅ Backend Health: OK" -ForegroundColor Green
        Write-Host "   Status: $($healthData.status)" -ForegroundColor Gray
        Write-Host "   Chatbot: $($healthData.chatbot)" -ForegroundColor Gray
        Write-Host "   Gemini: $($healthData.gemini)" -ForegroundColor Gray
        Write-Host "   Model: $($healthData.model)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Backend Health: Failed (Status: $($healthResponse.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Backend Health: Error - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Chatbot API
Write-Host "2️⃣ Testing Chatbot API..." -ForegroundColor Yellow
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
        Write-Host "✅ Chatbot API: OK" -ForegroundColor Green
        Write-Host "   Success: $($chatbotData.success)" -ForegroundColor Gray
        if ($chatbotData.success) {
            Write-Host "   AI Response: $($chatbotData.data.message.Substring(0, [Math]::Min(100, $chatbotData.data.message.Length)))..." -ForegroundColor Gray
            Write-Host "   AI Generated: $($chatbotData.data.aiGenerated)" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ Chatbot API: Failed (Status: $($chatbotResponse.StatusCode))" -ForegroundColor Red
        Write-Host "   Response: $($chatbotResponse.Content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Chatbot API: Error - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: CORS
Write-Host "3️⃣ Testing CORS..." -ForegroundColor Yellow
try {
    $corsResponse = Invoke-WebRequest -Uri "$BackendUrl/api/v2/chatbot/message" -Method OPTIONS -Headers @{
        "Origin" = $FrontendUrl
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "Content-Type"
    } -TimeoutSec 30
    
    $corsOrigin = $corsResponse.Headers["Access-Control-Allow-Origin"]
    if ($corsOrigin -eq $FrontendUrl -or $corsOrigin -eq "*") {
        Write-Host "✅ CORS: OK" -ForegroundColor Green
        Write-Host "   Allow-Origin: $corsOrigin" -ForegroundColor Gray
    } else {
        Write-Host "⚠️ CORS: Warning" -ForegroundColor Yellow
        Write-Host "   Allow-Origin: $corsOrigin (Expected: $FrontendUrl)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ CORS: Error - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Frontend
Write-Host "4️⃣ Testing Frontend..." -ForegroundColor Yellow
try {
    $frontendResponse = Invoke-WebRequest -Uri $FrontendUrl -Method GET -TimeoutSec 30
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend: OK" -ForegroundColor Green
        Write-Host "   Status: $($frontendResponse.StatusCode)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Frontend: Failed (Status: $($frontendResponse.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Frontend: Error - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "📊 DEPLOYMENT TEST SUMMARY" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Backend URL: $BackendUrl" -ForegroundColor White
Write-Host "Frontend URL: $FrontendUrl" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "1. If all tests pass: Open frontend and test chatbot" -ForegroundColor White
Write-Host "2. If backend fails: Check Render deployment" -ForegroundColor White
Write-Host "3. If CORS fails: Update CORS_ORIGIN in Render" -ForegroundColor White
Write-Host "4. If chatbot fails: Check Gemini API key" -ForegroundColor White
Write-Host ""
Write-Host "🌸 SoulFriend deployment test complete!" -ForegroundColor Green
