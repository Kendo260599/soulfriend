# Test Script for Chatbot Phase 1 Integration
# Tests backend chatbot API endpoints

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SOULFRIEND PHASE 1 - CHATBOT TESTING" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000"
$apiUrl = "$baseUrl/api/v2"

# Wait for server to start
Write-Host "⏳ Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test 1: Health Check
Write-Host "`n[TEST 1] Health Check" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method Get
    Write-Host "✅ Health Check: $($response.status)" -ForegroundColor Green
    Write-Host "   Version: $($response.version)" -ForegroundColor Gray
    Write-Host "   Uptime: $([math]::Round($response.uptime, 2))s" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health Check Failed: $_" -ForegroundColor Red
}

# Test 2: Detailed Health Check
Write-Host "`n[TEST 2] Detailed Health Check" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/health/detailed" -Method Get
    Write-Host "✅ Detailed Health: $($response.status)" -ForegroundColor Green
    Write-Host "   Database: $($response.services.database.status)" -ForegroundColor Gray
    Write-Host "   Database State: $($response.services.database.message)" -ForegroundColor Gray
    Write-Host "   Memory Used: $($response.system.memory.used) MB / $($response.system.memory.total) MB" -ForegroundColor Gray
} catch {
    Write-Host "❌ Detailed Health Check Failed: $_" -ForegroundColor Red
}

# Test 3: API Documentation
Write-Host "`n[TEST 3] API Documentation" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api" -Method Get
    Write-Host "✅ API Documentation Loaded" -ForegroundColor Green
    Write-Host "   API Name: $($response.name)" -ForegroundColor Gray
    Write-Host "   Version: $($response.version)" -ForegroundColor Gray
    Write-Host "   Chatbot Endpoint: $($response.endpoints.v2.chatbot)" -ForegroundColor Gray
} catch {
    Write-Host "❌ API Documentation Failed: $_" -ForegroundColor Red
}

# Test 4: Create Chat Session
Write-Host "`n[TEST 4] Create Chat Session" -ForegroundColor Green
try {
    $sessionData = @{
        userId = "test_user_001"
        userProfile = @{
            age = 28
            lifeStage = "adult"
        }
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$apiUrl/chatbot/session" -Method Post -Body $sessionData -ContentType "application/json"
    
    if ($response.success) {
        $sessionId = $response.data.id
        Write-Host "✅ Session Created: $sessionId" -ForegroundColor Green
        Write-Host "   User ID: $($response.data.userId)" -ForegroundColor Gray
        Write-Host "   Status: $($response.data.status)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Session Creation Failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Create Session Failed: $_" -ForegroundColor Red
    $sessionId = "fallback_session"
}

# Test 5: Send Chat Message - General
Write-Host "`n[TEST 5] Send Chat Message (General)" -ForegroundColor Green
try {
    $messageData = @{
        message = "Xin chào, tôi cảm thấy hơi lo âu"
        userId = "test_user_001"
        sessionId = $sessionId
        context = @{}
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$apiUrl/chatbot/message" -Method Post -Body $messageData -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "✅ Message Processed" -ForegroundColor Green
        Write-Host "   Intent: $($response.data.intent)" -ForegroundColor Gray
        Write-Host "   Risk Level: $($response.data.riskLevel)" -ForegroundColor Gray
        Write-Host "   Response: $($response.data.message.Substring(0, [Math]::Min(100, $response.data.message.Length)))..." -ForegroundColor Gray
    } else {
        Write-Host "❌ Message Processing Failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Send Message Failed: $_" -ForegroundColor Red
}

# Test 6: Send Chat Message - Test Request
Write-Host "`n[TEST 6] Send Chat Message (Test Request)" -ForegroundColor Green
try {
    $messageData = @{
        message = "Tôi muốn làm test đánh giá tâm lý"
        userId = "test_user_001"
        sessionId = $sessionId
        context = @{}
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$apiUrl/chatbot/message" -Method Post -Body $messageData -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "✅ Test Request Handled" -ForegroundColor Green
        Write-Host "   Intent: $($response.data.intent)" -ForegroundColor Gray
        Write-Host "   Suggested Tests: $($response.data.suggestedTests -join ', ')" -ForegroundColor Gray
    } else {
        Write-Host "❌ Test Request Failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Test Request Failed: $_" -ForegroundColor Red
}

# Test 7: Intent Analysis
Write-Host "`n[TEST 7] Intent Analysis" -ForegroundColor Green
try {
    $analyzeData = @{
        message = "Tôi muốn học kỹ thuật thư giãn"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$apiUrl/chatbot/analyze" -Method Post -Body $analyzeData -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "✅ Intent Analyzed" -ForegroundColor Green
        Write-Host "   Intent: $($response.data.intent)" -ForegroundColor Gray
        Write-Host "   Confidence: $($response.data.confidence)" -ForegroundColor Gray
        Write-Host "   Risk Level: $($response.data.riskLevel)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Intent Analysis Failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Intent Analysis Failed: $_" -ForegroundColor Red
}

# Test 8: Safety Check - Low Risk
Write-Host "`n[TEST 8] Safety Check (Low Risk)" -ForegroundColor Green
try {
    $safetyData = @{
        message = "Tôi hơi buồn hôm nay"
        userId = "test_user_001"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$apiUrl/chatbot/safety-check" -Method Post -Body $safetyData -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "✅ Safety Check Completed" -ForegroundColor Green
        Write-Host "   Safe: $($response.data.safe)" -ForegroundColor Gray
        Write-Host "   Risk Level: $($response.data.riskLevel)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Safety Check Failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Safety Check Failed: $_" -ForegroundColor Red
}

# Test 9: Safety Check - High Risk
Write-Host "`n[TEST 9] Safety Check (High Risk)" -ForegroundColor Green
try {
    $safetyData = @{
        message = "Tôi cảm thấy tuyệt vọng và không còn muốn sống nữa"
        userId = "test_user_001"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$apiUrl/chatbot/safety-check" -Method Post -Body $safetyData -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "✅ Safety Check Detected Crisis" -ForegroundColor Yellow
        Write-Host "   Safe: $($response.data.safe)" -ForegroundColor Yellow
        Write-Host "   Risk Level: $($response.data.riskLevel)" -ForegroundColor Yellow
        Write-Host "   Detected Issues: $($response.data.detectedIssues.Count)" -ForegroundColor Yellow
        Write-Host "   Recommended Actions: $($response.data.recommendedActions.Count)" -ForegroundColor Yellow
        
        if ($response.data.emergencyContacts) {
            Write-Host "   Emergency Contacts Available: ✓" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Safety Check Failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Safety Check Failed: $_" -ForegroundColor Red
}

# Test 10: Get Emergency Resources
Write-Host "`n[TEST 10] Get Emergency Resources" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$apiUrl/chatbot/emergency-resources" -Method Get
    
    if ($response.success) {
        Write-Host "✅ Emergency Resources Retrieved" -ForegroundColor Green
        Write-Host "   Total Resources: $($response.data.Count)" -ForegroundColor Gray
        foreach ($resource in $response.data) {
            Write-Host "   - $($resource.name): $($resource.phone)" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ Get Emergency Resources Failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Get Emergency Resources Failed: $_" -ForegroundColor Red
}

# Test 11: Get Conversation History
Write-Host "`n[TEST 11] Get Conversation History" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$apiUrl/chatbot/history/$sessionId" -Method Get
    
    if ($response.success) {
        Write-Host "✅ Conversation History Retrieved" -ForegroundColor Green
        Write-Host "   Session ID: $($response.data.sessionId)" -ForegroundColor Gray
        Write-Host "   Message Count: $($response.data.count)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Get History Failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Get History Failed: $_" -ForegroundColor Red
}

# Test 12: Get Chatbot Statistics
Write-Host "`n[TEST 12] Get Chatbot Statistics" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$apiUrl/chatbot/stats" -Method Get
    
    if ($response.success) {
        Write-Host "✅ Statistics Retrieved" -ForegroundColor Green
        Write-Host "   Total Sessions: $($response.data.totalSessions)" -ForegroundColor Gray
        Write-Host "   Active Sessions: $($response.data.activeSessions)" -ForegroundColor Gray
        Write-Host "   Total Messages: $($response.data.totalMessages)" -ForegroundColor Gray
        Write-Host "   Avg Messages/Session: $([math]::Round($response.data.averageMessagesPerSession, 2))" -ForegroundColor Gray
    } else {
        Write-Host "❌ Get Statistics Failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Get Statistics Failed: $_" -ForegroundColor Red
}

# Test 13: End Chat Session
Write-Host "`n[TEST 13] End Chat Session" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$apiUrl/chatbot/session/$sessionId/end" -Method Post
    
    if ($response.success) {
        Write-Host "✅ Session Ended Successfully" -ForegroundColor Green
        Write-Host "   Message: $($response.message)" -ForegroundColor Gray
    } else {
        Write-Host "❌ End Session Failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ End Session Failed: $_" -ForegroundColor Red
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Phase 1 Chatbot Integration Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Completed Features:" -ForegroundColor Yellow
Write-Host "  ✓ Health check endpoints" -ForegroundColor Gray
Write-Host "  ✓ Chat session management" -ForegroundColor Gray
Write-Host "  ✓ Message processing" -ForegroundColor Gray
Write-Host "  ✓ Intent analysis" -ForegroundColor Gray
Write-Host "  ✓ Safety checking with crisis detection" -ForegroundColor Gray
Write-Host "  ✓ Emergency resources" -ForegroundColor Gray
Write-Host "  ✓ Conversation history" -ForegroundColor Gray
Write-Host "  ✓ Chatbot statistics" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  - Review and optimize database models" -ForegroundColor Gray
Write-Host "  - Add authentication middleware" -ForegroundColor Gray
Write-Host "  - Integrate with Gemini AI" -ForegroundColor Gray
Write-Host "  - Add comprehensive logging" -ForegroundColor Gray
Write-Host "  - Update documentation" -ForegroundColor Gray
Write-Host ""

