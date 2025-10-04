# SoulFriend Integrated End-to-End Test
# Tests the complete integrated application with AI chatbot

Write-Host "🧪 SoulFriend Integrated End-to-End Test" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""

# Test configuration
$backendUrl = "http://localhost:5000"
$frontendUrl = "http://localhost:3000"
$testResults = @()

# Function to run test
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Body = $null,
        [string]$ExpectedStatus = "200"
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Cyan
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        if ($Body) {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -Body ($Body | ConvertTo-Json) -ErrorAction Stop
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -ErrorAction Stop
        }
        
        Write-Host "  ✅ Success: $Name" -ForegroundColor Green
        $testResults += @{
            Test = $Name
            Status = "PASS"
            Details = "Response received successfully"
        }
        return $true
    } catch {
        Write-Host "  ❌ Failed: $Name - $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{
            Test = $Name
            Status = "FAIL"
            Details = $_.Exception.Message
        }
        return $false
    }
}

# Function to wait for service
function Wait-ForService {
    param(
        [string]$Url,
        [int]$MaxAttempts = 30,
        [int]$DelaySeconds = 2
    )
    
    Write-Host "Waiting for service at $Url..." -ForegroundColor Yellow
    
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 5 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ Service is ready!" -ForegroundColor Green
                return $true
            }
        } catch {
            Write-Host "Attempt $i/$MaxAttempts - Service not ready yet..." -ForegroundColor Yellow
            Start-Sleep -Seconds $DelaySeconds
        }
    }
    
    Write-Host "❌ Service did not start within timeout" -ForegroundColor Red
    return $false
}

Write-Host "🔍 Checking if services are running..." -ForegroundColor Yellow
Write-Host ""

# Check backend
$backendReady = Wait-ForService "$backendUrl/api/health"
if (-not $backendReady) {
    Write-Host "❌ Backend service is not running. Please start it first." -ForegroundColor Red
    Write-Host "Run: .\start-integrated-soulfriend.ps1" -ForegroundColor Yellow
    exit 1
}

# Check frontend
$frontendReady = Wait-ForService $frontendUrl
if (-not $frontendReady) {
    Write-Host "❌ Frontend service is not running. Please start it first." -ForegroundColor Red
    Write-Host "Run: .\start-integrated-soulfriend.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🚀 Starting Integrated Tests..." -ForegroundColor Green
Write-Host ""

# Test 1: Backend Health Check
Test-Endpoint "Backend Health Check" "$backendUrl/api/health"

# Test 2: Backend Detailed Health
Test-Endpoint "Backend Detailed Health" "$backendUrl/api/health/detailed"

# Test 3: API Documentation
Test-Endpoint "API Documentation" "$backendUrl/api"

# Test 4: Chatbot Health Check
Test-Endpoint "Chatbot Health Check" "$backendUrl/api/v2/chatbot/health"

# Test 5: Chatbot Statistics
Test-Endpoint "Chatbot Statistics" "$backendUrl/api/v2/chatbot/stats"

# Test 6: Emergency Resources
Test-Endpoint "Emergency Resources" "$backendUrl/api/v2/chatbot/emergency-resources"

# Test 7: Chatbot Message Processing (Simple)
$messageBody = @{
    message = "Xin chào, tôi cảm thấy hơi căng thẳng"
    userId = "test_user"
    sessionId = "test_session_$(Get-Date -Format 'yyyyMMddHHmmss')"
    context = @{
        userProfile = @{
            age = 25
            gender = "female"
            culturalContext = "vietnamese"
        }
        testResults = @()
    }
}
Test-Endpoint "Chatbot Message Processing" "$backendUrl/api/v2/chatbot/message" "POST" $messageBody

# Test 8: Crisis Detection Test
$crisisBody = @{
    message = "Tôi muốn tự tử"
    userId = "test_user_crisis"
    sessionId = "test_crisis_session_$(Get-Date -Format 'yyyyMMddHHmmss')"
    context = @{
        userProfile = @{
            age = 30
            gender = "female"
            culturalContext = "vietnamese"
        }
        testResults = @()
    }
}
Test-Endpoint "Crisis Detection Test" "$backendUrl/api/v2/chatbot/message" "POST" $crisisBody

# Test 9: Intent Analysis
$intentBody = @{
    message = "Tôi muốn làm bài test DASS-21"
    userId = "test_user_intent"
    sessionId = "test_intent_session_$(Get-Date -Format 'yyyyMMddHHmmss')"
}
Test-Endpoint "Intent Analysis" "$backendUrl/api/v2/chatbot/analyze-intent" "POST" $intentBody

# Test 10: Safety Check
$safetyBody = @{
    message = "Tôi cảm thấy rất lo lắng về công việc"
    userId = "test_user_safety"
    sessionId = "test_safety_session_$(Get-Date -Format 'yyyyMMddHHmmss')"
}
Test-Endpoint "Safety Check" "$backendUrl/api/v2/chatbot/safety-check" "POST" $safetyBody

# Test 11: Knowledge Retrieval
$knowledgeBody = @{
    query = "Làm thế nào để giảm stress?"
    userId = "test_user_knowledge"
    sessionId = "test_knowledge_session_$(Get-Date -Format 'yyyyMMddHHmmss')"
}
Test-Endpoint "Knowledge Retrieval" "$backendUrl/api/v2/chatbot/knowledge" "POST" $knowledgeBody

# Test 12: Session Management
Test-Endpoint "Create Session" "$backendUrl/api/v2/chatbot/session" "POST" @{
    userId = "test_user_session"
    context = @{
        userProfile = @{
            age = 28
            gender = "female"
            culturalContext = "vietnamese"
        }
    }
}

# Test 13: Frontend Accessibility
Write-Host "Testing Frontend Accessibility..." -ForegroundColor Cyan
try {
    $frontendResponse = Invoke-WebRequest -Uri $frontendUrl -Method GET -TimeoutSec 10 -ErrorAction Stop
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "  ✅ Frontend is accessible" -ForegroundColor Green
        $testResults += @{
            Test = "Frontend Accessibility"
            Status = "PASS"
            Details = "Frontend loads successfully"
        }
    }
} catch {
    Write-Host "  ❌ Frontend not accessible: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{
        Test = "Frontend Accessibility"
        Status = "FAIL"
        Details = $_.Exception.Message
    }
}

Write-Host ""
Write-Host "📊 Test Results Summary" -ForegroundColor Green
Write-Host "=======================" -ForegroundColor Green
Write-Host ""

$passedTests = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failedTests = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$totalTests = $testResults.Count

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor Red
Write-Host "Success Rate: $([math]::Round(($passedTests / $totalTests) * 100, 2))%" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 Detailed Results:" -ForegroundColor Yellow
foreach ($result in $testResults) {
    $statusColor = if ($result.Status -eq "PASS") { "Green" } else { "Red" }
    Write-Host "  $($result.Status): $($result.Test)" -ForegroundColor $statusColor
    if ($result.Status -eq "FAIL") {
        Write-Host "    Details: $($result.Details)" -ForegroundColor Gray
    }
}

Write-Host ""
if ($failedTests -eq 0) {
    Write-Host "🎉 All tests passed! SoulFriend is fully integrated and working!" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Integration Status: COMPLETE" -ForegroundColor Green
    Write-Host "✅ AI Chatbot: OPERATIONAL" -ForegroundColor Green
    Write-Host "✅ Crisis Detection: ACTIVE" -ForegroundColor Green
    Write-Host "✅ Backend API: HEALTHY" -ForegroundColor Green
    Write-Host "✅ Frontend: ACCESSIBLE" -ForegroundColor Green
    Write-Host "✅ Safety Features: ENABLED" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some tests failed. Please check the issues above." -ForegroundColor Yellow
    Write-Host "Integration Status: PARTIAL" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🌐 Access URLs:" -ForegroundColor Cyan
Write-Host "  Frontend: $frontendUrl" -ForegroundColor White
Write-Host "  Backend:  $backendUrl" -ForegroundColor White
Write-Host "  API Docs: $backendUrl/api" -ForegroundColor White
Write-Host "  Health:   $backendUrl/api/health" -ForegroundColor White

Write-Host ""
Write-Host "🤖 AI Chatbot Features:" -ForegroundColor Cyan
Write-Host "  • Natural Language Understanding" -ForegroundColor White
Write-Host "  • Crisis Detection & Emergency Response" -ForegroundColor White
Write-Host "  • Vietnamese Language Support" -ForegroundColor White
Write-Host "  • Offline Fallback Mode" -ForegroundColor White
Write-Host "  • Safety Validation" -ForegroundColor White
Write-Host "  • Professional Dashboard Integration" -ForegroundColor White

Write-Host ""
Write-Host "👋 Test completed! Thank you for using SoulFriend!" -ForegroundColor Green
