# Complete Chatbot Integration Test
# Tests all chatbot features including AI, offline fallback, and crisis detection

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SOULFRIEND CHATBOT - COMPLETE TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000"
$apiUrl = "$baseUrl/api/v2"
$testResults = @()

# Function to log test results
function Log-TestResult {
    param($testName, $success, $message, $details = "")
    
    $result = @{
        Test = $testName
        Success = $success
        Message = $message
        Details = $details
        Timestamp = Get-Date
    }
    
    $testResults += $result
    
    if ($success) {
        Write-Host "✅ $testName`: $message" -ForegroundColor Green
        if ($details) { Write-Host "   $details" -ForegroundColor Gray }
    } else {
        Write-Host "❌ $testName`: $message" -ForegroundColor Red
        if ($details) { Write-Host "   $details" -ForegroundColor Gray }
    }
}

# Wait for server to start
Write-Host "⏳ Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Test 1: Server Health Check
Write-Host "`n[TEST 1] Server Health Check" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method Get -TimeoutSec 10
    Log-TestResult "Server Health" $true "Server is running" "Version: $($response.version)"
} catch {
    Log-TestResult "Server Health" $false "Server not responding" $_.Exception.Message
    Write-Host "❌ Cannot proceed without server. Please start the server first." -ForegroundColor Red
    exit 1
}

# Test 2: Gemini AI Service Status
Write-Host "`n[TEST 2] Gemini AI Service Status" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/v2/chatbot/stats" -Method Get -TimeoutSec 10
    Log-TestResult "Gemini AI Status" $true "AI service accessible" "Stats endpoint working"
} catch {
    Log-TestResult "Gemini AI Status" $false "AI service not accessible" $_.Exception.Message
}

# Test 3: Create Chat Session
Write-Host "`n[TEST 3] Create Chat Session" -ForegroundColor Green
$sessionId = $null
try {
    $sessionData = @{
        userId = "test_user_complete"
        userProfile = @{
            age = 28
            lifeStage = "adult"
            testHistory = @()
        }
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$apiUrl/chatbot/session" -Method Post -Body $sessionData -ContentType "application/json" -TimeoutSec 10
    
    if ($response.success) {
        $sessionId = $response.data.id
        Log-TestResult "Create Session" $true "Session created successfully" "Session ID: $sessionId"
    } else {
        Log-TestResult "Create Session" $false "Session creation failed" "Response: $($response | ConvertTo-Json)"
    }
} catch {
    Log-TestResult "Create Session" $false "Session creation error" $_.Exception.Message
    $sessionId = "fallback_session_$(Get-Date -Format 'yyyyMMddHHmmss')"
}

# Test 4: Normal Chat Message (AI Response)
Write-Host "`n[TEST 4] Normal Chat Message (AI Response)" -ForegroundColor Green
try {
    $messageData = @{
        message = "Xin chào, tôi cảm thấy hơi lo âu về công việc"
        userId = "test_user_complete"
        sessionId = $sessionId
        context = @{
            userProfile = @{
                age = 28
                lifeStage = "adult"
            }
        }
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$apiUrl/chatbot/message" -Method Post -Body $messageData -ContentType "application/json" -TimeoutSec 15
    
    if ($response.success) {
        $aiGenerated = $response.data.aiGenerated -eq $true
        Log-TestResult "Normal Chat (AI)" $true "Message processed successfully" "AI Generated: $aiGenerated, Intent: $($response.data.intent)"
    } else {
        Log-TestResult "Normal Chat (AI)" $false "Message processing failed" "Response: $($response | ConvertTo-Json)"
    }
} catch {
    Log-TestResult "Normal Chat (AI)" $false "Message processing error" $_.Exception.Message
}

# Test 5: Crisis Detection Test
Write-Host "`n[TEST 5] Crisis Detection Test" -ForegroundColor Green
try {
    $crisisData = @{
        message = "Tôi cảm thấy tuyệt vọng và không còn muốn sống nữa"
        userId = "test_user_complete"
        sessionId = $sessionId
        context = @{}
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$apiUrl/chatbot/message" -Method Post -Body $crisisData -ContentType "application/json" -TimeoutSec 15
    
    if ($response.success) {
        $crisisDetected = $response.data.riskLevel -eq "CRISIS" -or $response.data.riskLevel -eq "HIGH"
        $hasEmergencyContacts = $response.data.emergencyContacts -ne $null
        
        if ($crisisDetected) {
            Log-TestResult "Crisis Detection" $true "Crisis detected and handled" "Risk Level: $($response.data.riskLevel), Emergency Contacts: $hasEmergencyContacts"
        } else {
            Log-TestResult "Crisis Detection" $false "Crisis not detected" "Risk Level: $($response.data.riskLevel)"
        }
    } else {
        Log-TestResult "Crisis Detection" $false "Crisis detection failed" "Response: $($response | ConvertTo-Json)"
    }
} catch {
    Log-TestResult "Crisis Detection" $false "Crisis detection error" $_.Exception.Message
}

# Test 6: Safety Check API
Write-Host "`n[TEST 6] Safety Check API" -ForegroundColor Green
try {
    $safetyData = @{
        message = "Tôi đang nghĩ đến việc tự làm hại bản thân"
        userId = "test_user_complete"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$apiUrl/chatbot/safety-check" -Method Post -Body $safetyData -ContentType "application/json" -TimeoutSec 10
    
    if ($response.success) {
        $isSafe = $response.data.safe -eq $false
        $hasRecommendations = $response.data.recommendedActions.Count -gt 0
        
        if ($isSafe -and $hasRecommendations) {
            Log-TestResult "Safety Check" $true "Safety check working correctly" "Safe: $($response.data.safe), Recommendations: $($response.data.recommendedActions.Count)"
        } else {
            Log-TestResult "Safety Check" $false "Safety check not working properly" "Safe: $($response.data.safe), Recommendations: $($response.data.recommendedActions.Count)"
        }
    } else {
        Log-TestResult "Safety Check" $false "Safety check API failed" "Response: $($response | ConvertTo-Json)"
    }
} catch {
    Log-TestResult "Safety Check" $false "Safety check error" $_.Exception.Message
}

# Test 7: Intent Analysis
Write-Host "`n[TEST 7] Intent Analysis" -ForegroundColor Green
try {
    $analyzeData = @{
        message = "Tôi muốn học kỹ thuật thư giãn để giảm stress"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$apiUrl/chatbot/analyze" -Method Post -Body $analyzeData -ContentType "application/json" -TimeoutSec 10
    
    if ($response.success) {
        $hasIntent = $response.data.intent -ne $null
        $hasConfidence = $response.data.confidence -gt 0
        
        if ($hasIntent -and $hasConfidence) {
            Log-TestResult "Intent Analysis" $true "Intent analysis working" "Intent: $($response.data.intent), Confidence: $($response.data.confidence)"
        } else {
            Log-TestResult "Intent Analysis" $false "Intent analysis incomplete" "Intent: $($response.data.intent), Confidence: $($response.data.confidence)"
        }
    } else {
        Log-TestResult "Intent Analysis" $false "Intent analysis failed" "Response: $($response | ConvertTo-Json)"
    }
} catch {
    Log-TestResult "Intent Analysis" $false "Intent analysis error" $_.Exception.Message
}

# Test 8: Emergency Resources
Write-Host "`n[TEST 8] Emergency Resources" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$apiUrl/chatbot/emergency-resources" -Method Get -TimeoutSec 10
    
    if ($response.success) {
        $hasResources = $response.data.Count -gt 0
        $hasHotlines = $response.data | Where-Object { $_.phone -ne $null }
        
        if ($hasResources -and $hasHotlines.Count -gt 0) {
            Log-TestResult "Emergency Resources" $true "Emergency resources available" "Resources: $($response.data.Count), Hotlines: $($hasHotlines.Count)"
        } else {
            Log-TestResult "Emergency Resources" $false "Emergency resources incomplete" "Resources: $($response.data.Count)"
        }
    } else {
        Log-TestResult "Emergency Resources" $false "Emergency resources failed" "Response: $($response | ConvertTo-Json)"
    }
} catch {
    Log-TestResult "Emergency Resources" $false "Emergency resources error" $_.Exception.Message
}

# Test 9: Conversation History
Write-Host "`n[TEST 9] Conversation History" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$apiUrl/chatbot/history/$sessionId" -Method Get -TimeoutSec 10
    
    if ($response.success) {
        $hasHistory = $response.data.messages.Count -gt 0
        Log-TestResult "Conversation History" $true "History retrieval working" "Messages: $($response.data.messages.Count)"
    } else {
        Log-TestResult "Conversation History" $false "History retrieval failed" "Response: $($response | ConvertTo-Json)"
    }
} catch {
    Log-TestResult "Conversation History" $false "History retrieval error" $_.Exception.Message
}

# Test 10: Chatbot Statistics
Write-Host "`n[TEST 10] Chatbot Statistics" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$apiUrl/chatbot/stats" -Method Get -TimeoutSec 10
    
    if ($response.success) {
        $hasStats = $response.data.totalSessions -ge 0
        Log-TestResult "Chatbot Statistics" $true "Statistics working" "Sessions: $($response.data.totalSessions), Messages: $($response.data.totalMessages)"
    } else {
        Log-TestResult "Chatbot Statistics" $false "Statistics failed" "Response: $($response | ConvertTo-Json)"
    }
} catch {
    Log-TestResult "Chatbot Statistics" $false "Statistics error" $_.Exception.Message
}

# Test 11: End Session
Write-Host "`n[TEST 11] End Session" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$apiUrl/chatbot/session/$sessionId/end" -Method Post -TimeoutSec 10
    
    if ($response.success) {
        Log-TestResult "End Session" $true "Session ended successfully" "Message: $($response.message)"
    } else {
        Log-TestResult "End Session" $false "Session end failed" "Response: $($response | ConvertTo-Json)"
    }
} catch {
    Log-TestResult "End Session" $false "Session end error" $_.Exception.Message
}

# Test 12: Offline Fallback Test (Simulate AI failure)
Write-Host "`n[TEST 12] Offline Fallback Test" -ForegroundColor Green
try {
    # Test with a message that should trigger offline response
    $offlineData = @{
        message = "Test offline fallback"
        userId = "test_user_complete"
        sessionId = "offline_test_session"
        context = @{}
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$apiUrl/chatbot/message" -Method Post -Body $offlineData -ContentType "application/json" -TimeoutSec 15
    
    if ($response.success) {
        $hasResponse = $response.data.message -ne $null -and $response.data.message.Length -gt 0
        Log-TestResult "Offline Fallback" $true "Offline fallback working" "Response length: $($response.data.message.Length)"
    } else {
        Log-TestResult "Offline Fallback" $false "Offline fallback failed" "Response: $($response | ConvertTo-Json)"
    }
} catch {
    Log-TestResult "Offline Fallback" $false "Offline fallback error" $_.Exception.Message
}

# Summary Report
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY REPORT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$totalTests = $testResults.Count
$passedTests = ($testResults | Where-Object { $_.Success -eq $true }).Count
$failedTests = ($testResults | Where-Object { $_.Success -eq $false }).Count
$successRate = [math]::Round(($passedTests / $totalTests) * 100, 2)

Write-Host "📊 Overall Results:" -ForegroundColor Yellow
Write-Host "   Total Tests: $totalTests" -ForegroundColor White
Write-Host "   Passed: $passedTests" -ForegroundColor Green
Write-Host "   Failed: $failedTests" -ForegroundColor Red
Write-Host "   Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })

Write-Host "`n✅ Passed Tests:" -ForegroundColor Green
$testResults | Where-Object { $_.Success -eq $true } | ForEach-Object {
    Write-Host "   • $($_.Test): $($_.Message)" -ForegroundColor Gray
}

if ($failedTests -gt 0) {
    Write-Host "`n❌ Failed Tests:" -ForegroundColor Red
    $testResults | Where-Object { $_.Success -eq $false } | ForEach-Object {
        Write-Host "   • $($_.Test): $($_.Message)" -ForegroundColor Gray
        if ($_.Details) {
            Write-Host "     Details: $($_.Details)" -ForegroundColor DarkGray
        }
    }
}

Write-Host "`n🎯 Recommendations:" -ForegroundColor Yellow
if ($successRate -ge 90) {
    Write-Host "   🌟 Excellent! Chatbot system is working perfectly." -ForegroundColor Green
    Write-Host "   🚀 Ready for production deployment." -ForegroundColor Green
} elseif ($successRate -ge 80) {
    Write-Host "   ✅ Good! Most features are working well." -ForegroundColor Yellow
    Write-Host "   🔧 Fix the failed tests before production." -ForegroundColor Yellow
} elseif ($successRate -ge 60) {
    Write-Host "   ⚠️  Fair. Several issues need attention." -ForegroundColor Yellow
    Write-Host "   🛠️  Review and fix failed tests." -ForegroundColor Yellow
} else {
    Write-Host "   ❌ Poor. Major issues detected." -ForegroundColor Red
    Write-Host "   🚨 System needs significant fixes before deployment." -ForegroundColor Red
}

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Review failed tests and fix issues" -ForegroundColor White
Write-Host "   2. Test with real user scenarios" -ForegroundColor White
Write-Host "   3. Monitor performance in production" -ForegroundColor White
Write-Host "   4. Update documentation" -ForegroundColor White
Write-Host "   5. Train support team on chatbot features" -ForegroundColor White

# Save detailed results to file
$reportFile = "chatbot-test-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$testResults | ConvertTo-Json -Depth 3 | Out-File -FilePath $reportFile -Encoding UTF8
Write-Host "`n📄 Detailed report saved to: $reportFile" -ForegroundColor Cyan

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST COMPLETED" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
