# Test Memory-Aware Chatbot
# Tests chatbot with 3-tier memory integration

$baseUrl = "https://soulfriend-api.onrender.com/api/v2/chatbot"
$userId = "memory_test_user_$(Get-Date -Format 'yyyyMMddHHmmss')"
$sessionId = "session_$(Get-Date -Format 'yyyyMMddHHmmss')"

Write-Host "`n🧠 Testing Memory-Aware Chatbot`n" -ForegroundColor Cyan
Write-Host "User ID: $userId" -ForegroundColor Gray
Write-Host "Session ID: $sessionId`n" -ForegroundColor Gray

# ====================
# TEST 1: First message (no memory context)
# ====================
Write-Host "Test 1: First Message (Building Memory)..." -ForegroundColor Yellow
try {
    $body = @{
        message = "Tôi đang lo lắng về công việc. Dự án deadline vào tuần sau."
        userId = $userId
        sessionId = $sessionId
    } | ConvertTo-Json

    $response1 = Invoke-RestMethod -Uri "$baseUrl/chat-with-memory" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 30
    
    Write-Host "✅ Response received" -ForegroundColor Green
    Write-Host "   Message: $($response1.data.message.Substring(0, [Math]::Min(100, $response1.data.message.Length)))..." -ForegroundColor Cyan
    Write-Host "   Intent: $($response1.data.intent)" -ForegroundColor Gray
    Write-Host "   Crisis Level: $($response1.data.crisisLevel)" -ForegroundColor Gray
    
    if ($response1.data.memoryContext) {
        Write-Host "   Memory Context:" -ForegroundColor Magenta
        Write-Host "     - Working Memory: $($response1.data.memoryContext.hasWorkingMemory)" -ForegroundColor Gray
        Write-Host "     - Short-term Count: $($response1.data.memoryContext.shortTermCount)" -ForegroundColor Gray
        Write-Host "     - Long-term Count: $($response1.data.memoryContext.longTermCount)" -ForegroundColor Gray
    }
    
    Start-Sleep -Seconds 2
} catch {
    Write-Host "❌ Test 1 failed: $($_.Exception.Message)" -ForegroundColor Red
}

# ====================
# TEST 2: Second message (with working memory)
# ====================
Write-Host "`nTest 2: Second Message (Working Memory Active)..." -ForegroundColor Yellow
try {
    $body = @{
        message = "Tôi thường thức khuya để hoàn thành công việc"
        userId = $userId
        sessionId = $sessionId
    } | ConvertTo-Json

    $response2 = Invoke-RestMethod -Uri "$baseUrl/chat-with-memory" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 30
    
    Write-Host "✅ Response received" -ForegroundColor Green
    Write-Host "   Message: $($response2.data.message.Substring(0, [Math]::Min(100, $response2.data.message.Length)))..." -ForegroundColor Cyan
    
    if ($response2.data.memoryContext) {
        Write-Host "   Memory Context:" -ForegroundColor Magenta
        Write-Host "     - Working Memory: $($response2.data.memoryContext.hasWorkingMemory)" -ForegroundColor Gray
        Write-Host "     - Short-term Count: $($response2.data.memoryContext.shortTermCount)" -ForegroundColor Gray
        Write-Host "     - Long-term Count: $($response2.data.memoryContext.longTermCount)" -ForegroundColor Gray
    }
    
    Start-Sleep -Seconds 2
} catch {
    Write-Host "❌ Test 2 failed: $($_.Exception.Message)" -ForegroundColor Red
}

# ====================
# TEST 3: Third message (related query - should use long-term memory)
# ====================
Write-Host "`nTest 3: Third Message (Semantic Memory Search)..." -ForegroundColor Yellow
Write-Host "   (Waiting 5 seconds for long-term memory indexing...)" -ForegroundColor Gray
Start-Sleep -Seconds 5

try {
    $body = @{
        message = "Tôi có dự án lớn cần hoàn thành"
        userId = $userId
        sessionId = $sessionId
    } | ConvertTo-Json

    $response3 = Invoke-RestMethod -Uri "$baseUrl/chat-with-memory" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 30
    
    Write-Host "✅ Response received" -ForegroundColor Green
    Write-Host "   Message: $($response3.data.message.Substring(0, [Math]::Min(100, $response3.data.message.Length)))..." -ForegroundColor Cyan
    
    if ($response3.data.relevantMemories) {
        Write-Host "   Relevant Memories Found: $($response3.data.relevantMemories.Count)" -ForegroundColor Magenta
        foreach ($memory in $response3.data.relevantMemories) {
            Write-Host "     - [$($memory.type)] $($memory.content) (confidence: $($memory.confidence))" -ForegroundColor Cyan
        }
    }
    
    if ($response3.data.memoryContext) {
        Write-Host "   Memory Stats:" -ForegroundColor Magenta
        Write-Host "     - Working Memory: $($response3.data.memoryContext.hasWorkingMemory)" -ForegroundColor Gray
        Write-Host "     - Short-term Count: $($response3.data.memoryContext.shortTermCount)" -ForegroundColor Gray
        Write-Host "     - Long-term Count: $($response3.data.memoryContext.longTermCount)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Test 3 failed: $($_.Exception.Message)" -ForegroundColor Red
}

# ====================
# TEST 4: Get memory profile
# ====================
Write-Host "`nTest 4: Get User Memory Profile..." -ForegroundColor Yellow
try {
    $profile = Invoke-RestMethod -Uri "$baseUrl/memory-profile/$userId" -Method Get
    
    Write-Host "✅ Memory profile retrieved" -ForegroundColor Green
    Write-Host "   Stats:" -ForegroundColor Magenta
    Write-Host "     - Short-term memories: $($profile.data.stats.shortTermCount)" -ForegroundColor Gray
    Write-Host "     - Long-term memories: $($profile.data.stats.longTermCount)" -ForegroundColor Gray
    Write-Host "     - Recent patterns: $($profile.data.recentPatterns.Count)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Test 4 failed: $($_.Exception.Message)" -ForegroundColor Red
}

# ====================
# TEST 5: Get conversation history with memory
# ====================
Write-Host "`nTest 5: Get Conversation History with Memory..." -ForegroundColor Yellow
try {
    $history = Invoke-RestMethod -Uri "$baseUrl/history-with-memory/$userId/$sessionId" -Method Get
    
    Write-Host "✅ History retrieved" -ForegroundColor Green
    Write-Host "   Messages: $($history.data.messages.Count)" -ForegroundColor Gray
    Write-Host "   Memory Context:" -ForegroundColor Magenta
    Write-Host "     - Working Memory exists: $($history.data.memoryContext.workingMemory -ne $null)" -ForegroundColor Gray
    Write-Host "     - Recent interactions: $($history.data.memoryContext.recentInteractions.Count)" -ForegroundColor Gray
    
    if ($history.data.memoryContext.workingMemory) {
        Write-Host "   Current Session Context:" -ForegroundColor Magenta
        Write-Host "     - Emotion: $($history.data.memoryContext.workingMemory.emotion)" -ForegroundColor Cyan
        Write-Host "     - Intent: $($history.data.memoryContext.workingMemory.intent)" -ForegroundColor Cyan
        Write-Host "     - Crisis Level: $($history.data.memoryContext.workingMemory.crisisLevel)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Test 5 failed: $($_.Exception.Message)" -ForegroundColor Red
}

# ====================
# TEST 6: Clear session memory
# ====================
Write-Host "`nTest 6: Clear Session Memory..." -ForegroundColor Yellow
try {
    $clearResult = Invoke-RestMethod -Uri "$baseUrl/session-memory/$sessionId" -Method Delete
    
    Write-Host "✅ Session memory cleared" -ForegroundColor Green
    Write-Host "   $($clearResult.message)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Test 6 failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Memory-Aware Chatbot Test Complete!`n" -ForegroundColor Cyan
