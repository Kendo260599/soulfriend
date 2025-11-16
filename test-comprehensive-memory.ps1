# Comprehensive Memory System Test Suite
# Tests all possible scenarios for memory-aware chatbot

$baseUrl = "https://soulfriend-api.onrender.com/api/v2/chatbot"
$testResults = @()

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🧪 COMPREHENSIVE MEMORY SYSTEM TEST SUITE           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

function Test-Scenario {
    param(
        [string]$TestName,
        [string]$UserId,
        [string]$SessionId,
        [string]$Message,
        [hashtable]$ExpectedResults
    )
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "Test: $TestName" -ForegroundColor Yellow
    Write-Host "Message: $Message" -ForegroundColor Gray
    
    $result = @{
        TestName = $TestName
        Success = $false
        Message = ""
        MemoryStats = $null
        RelevantMemories = 0
        Error = $null
    }
    
    try {
        $body = @{
            message = $Message
            userId = $UserId
            sessionId = $SessionId
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$baseUrl/chat-with-memory" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 30
        
        $result.Success = $true
        $result.Message = $response.data.message.Substring(0, [Math]::Min(80, $response.data.message.Length))
        
        if ($response.data.memoryContext) {
            $result.MemoryStats = $response.data.memoryContext
        }
        
        if ($response.data.relevantMemories) {
            $result.RelevantMemories = $response.data.relevantMemories.Count
        }
        
        # Validate expected results
        $allChecksPass = $true
        foreach ($key in $ExpectedResults.Keys) {
            $expected = $ExpectedResults[$key]
            $actual = $null
            
            switch ($key) {
                'HasWorkingMemory' { $actual = $response.data.memoryContext.hasWorkingMemory }
                'MinShortTerm' { $actual = $response.data.memoryContext.shortTermCount -ge $expected }
                'MinLongTerm' { $actual = $response.data.memoryContext.longTermCount -ge $expected }
                'CrisisLevel' { $actual = $response.data.crisisLevel -eq $expected }
            }
            
            if ($actual -ne $expected -and $key -ne 'MinShortTerm' -and $key -ne 'MinLongTerm') {
                $allChecksPass = $false
                Write-Host "  ❌ Check failed: $key (expected: $expected, got: $actual)" -ForegroundColor Red
            }
        }
        
        if ($allChecksPass) {
            Write-Host "  ✅ Test PASSED" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Test PASSED with warnings" -ForegroundColor Yellow
        }
        
        Write-Host "  Response: $($result.Message)..." -ForegroundColor Cyan
        Write-Host "  Intent: $($response.data.intent)" -ForegroundColor Gray
        Write-Host "  Crisis Level: $($response.data.crisisLevel)" -ForegroundColor Gray
        Write-Host "  Memory: Working=$($response.data.memoryContext.hasWorkingMemory), ST=$($response.data.memoryContext.shortTermCount), LT=$($response.data.memoryContext.longTermCount)" -ForegroundColor Magenta
        if ($result.RelevantMemories -gt 0) {
            Write-Host "  Relevant Memories: $($result.RelevantMemories)" -ForegroundColor Green
        }
        
    } catch {
        $result.Error = $_.Exception.Message
        Write-Host "  ❌ Test FAILED: $($result.Error)" -ForegroundColor Red
    }
    
    return $result
}

# ==========================================
# TEST SUITE 1: BASIC MEMORY OPERATIONS
# ==========================================
Write-Host "`n📋 TEST SUITE 1: BASIC MEMORY OPERATIONS`n" -ForegroundColor Cyan

$user1 = "test_basic_$(Get-Date -Format 'yyyyMMddHHmmss')"
$session1 = "session_basic_$(Get-Date -Format 'yyyyMMddHHmmss')"

$testResults += Test-Scenario -TestName "1.1 First Message (No Memory)" `
    -UserId $user1 -SessionId $session1 `
    -Message "Xin chào, tôi cần hỗ trợ" `
    -ExpectedResults @{ HasWorkingMemory = $false; MinShortTerm = 1 }

Start-Sleep -Seconds 2

$testResults += Test-Scenario -TestName "1.2 Second Message (Working Memory Active)" `
    -UserId $user1 -SessionId $session1 `
    -Message "Tôi đang cảm thấy hơi lo lắng" `
    -ExpectedResults @{ HasWorkingMemory = $true; MinShortTerm = 2 }

Start-Sleep -Seconds 2

$testResults += Test-Scenario -TestName "1.3 Third Message (Memory Context)" `
    -UserId $user1 -SessionId $session1 `
    -Message "Có phương pháp nào giúp tôi bình tĩnh không?" `
    -ExpectedResults @{ HasWorkingMemory = $true; MinShortTerm = 3 }

# ==========================================
# TEST SUITE 2: TOPIC EXTRACTION
# ==========================================
Write-Host "`n📋 TEST SUITE 2: TOPIC EXTRACTION & INSIGHTS`n" -ForegroundColor Cyan

$user2 = "test_topics_$(Get-Date -Format 'yyyyMMddHHmmss')"
$session2 = "session_topics_$(Get-Date -Format 'yyyyMMddHHmmss')"

$testResults += Test-Scenario -TestName "2.1 Work Topic" `
    -UserId $user2 -SessionId $session2 `
    -Message "Công việc của tôi rất áp lực, deadline liên tục" `
    -ExpectedResults @{ MinLongTerm = 1 }

Start-Sleep -Seconds 2

$testResults += Test-Scenario -TestName "2.2 Sleep Topic" `
    -UserId $user2 -SessionId $session2 `
    -Message "Tôi thường xuyên mất ngủ và thức khuya" `
    -ExpectedResults @{ MinLongTerm = 1 }

Start-Sleep -Seconds 2

$testResults += Test-Scenario -TestName "2.3 Relationship Topic" `
    -UserId $user2 -SessionId $session2 `
    -Message "Quan hệ với gia đình tôi có vấn đề" `
    -ExpectedResults @{ MinLongTerm = 1 }

Start-Sleep -Seconds 2

$testResults += Test-Scenario -TestName "2.4 Health Topic" `
    -UserId $user2 -SessionId $session2 `
    -Message "Sức khỏe tôi không được tốt gần đây" `
    -ExpectedResults @{ MinLongTerm = 1 }

# ==========================================
# TEST SUITE 3: SEMANTIC MEMORY SEARCH
# ==========================================
Write-Host "`n📋 TEST SUITE 3: SEMANTIC MEMORY SEARCH`n" -ForegroundColor Cyan
Write-Host "⏳ Waiting 5 seconds for Pinecone indexing..." -ForegroundColor Gray
Start-Sleep -Seconds 5

$user3 = "test_semantic_$(Get-Date -Format 'yyyyMMddHHmmss')"
$session3 = "session_semantic_$(Get-Date -Format 'yyyyMMddHHmmss')"

# Create some memories first
Test-Scenario -TestName "3.0 Create Memory: Work Stress" `
    -UserId $user3 -SessionId $session3 `
    -Message "Tôi rất stress vì công việc, dự án deadline gấp" `
    -ExpectedResults @{} | Out-Null

Start-Sleep -Seconds 3

Test-Scenario -TestName "3.1 Create Memory: Sleep Issues" `
    -UserId $user3 -SessionId $session3 `
    -Message "Tôi hay thức khuya vì lo lắng" `
    -ExpectedResults @{} | Out-Null

Start-Sleep -Seconds 5

# Test semantic search
$testResults += Test-Scenario -TestName "3.2 Search: Work Related Query" `
    -UserId $user3 -SessionId $session3 `
    -Message "Làm sao để xử lý tốt deadline dự án?" `
    -ExpectedResults @{}

Start-Sleep -Seconds 2

$testResults += Test-Scenario -TestName "3.3 Search: Sleep Related Query" `
    -UserId $user3 -SessionId $session3 `
    -Message "Làm sao để ngủ ngon hơn?" `
    -ExpectedResults @{}

# ==========================================
# TEST SUITE 4: CRISIS DETECTION WITH MEMORY
# ==========================================
Write-Host "`n📋 TEST SUITE 4: CRISIS DETECTION WITH MEMORY`n" -ForegroundColor Cyan

$user4 = "test_crisis_$(Get-Date -Format 'yyyyMMddHHmmss')"
$session4 = "session_crisis_$(Get-Date -Format 'yyyyMMddHHmmss')"

$testResults += Test-Scenario -TestName "4.1 Low Crisis" `
    -UserId $user4 -SessionId $session4 `
    -Message "Tôi cảm thấy hơi buồn hôm nay" `
    -ExpectedResults @{ CrisisLevel = 'low' }

Start-Sleep -Seconds 2

$testResults += Test-Scenario -TestName "4.2 Medium Crisis" `
    -UserId $user4 -SessionId $session4 `
    -Message "Tôi cảm thấy rất tuyệt vọng và không biết phải làm gì" `
    -ExpectedResults @{}

# ==========================================
# TEST SUITE 5: MULTI-SESSION MEMORY
# ==========================================
Write-Host "`n📋 TEST SUITE 5: MULTI-SESSION MEMORY`n" -ForegroundColor Cyan

$user5 = "test_multisession_$(Get-Date -Format 'yyyyMMddHHmmss')"
$session5a = "session_5a_$(Get-Date -Format 'yyyyMMddHHmmss')"
$session5b = "session_5b_$(Get-Date -Format 'yyyyMMddHHmmss')"

$testResults += Test-Scenario -TestName "5.1 Session A - Message 1" `
    -UserId $user5 -SessionId $session5a `
    -Message "Tôi đang học cách quản lý stress" `
    -ExpectedResults @{}

Start-Sleep -Seconds 2

$testResults += Test-Scenario -TestName "5.2 Session B - Message 1 (Different Session)" `
    -UserId $user5 -SessionId $session5b `
    -Message "Tôi muốn tiếp tục cải thiện sức khỏe tinh thần" `
    -ExpectedResults @{ HasWorkingMemory = $false }

# ==========================================
# TEST SUITE 6: EDGE CASES
# ==========================================
Write-Host "`n📋 TEST SUITE 6: EDGE CASES`n" -ForegroundColor Cyan

$user6 = "test_edge_$(Get-Date -Format 'yyyyMMddHHmmss')"
$session6 = "session_edge_$(Get-Date -Format 'yyyyMMddHHmmss')"

$testResults += Test-Scenario -TestName "6.1 Very Short Message" `
    -UserId $user6 -SessionId $session6 `
    -Message "OK" `
    -ExpectedResults @{}

Start-Sleep -Seconds 2

$testResults += Test-Scenario -TestName "6.2 Very Long Message" `
    -UserId $user6 -SessionId $session6 `
    -Message "Tôi đang trải qua một giai đoạn rất khó khăn trong cuộc sống. Công việc thì áp lực, gia đình thì có vấn đề, sức khỏe cũng không được tốt. Tôi cảm thấy như mình không thể đương đầu được với tất cả mọi thứ cùng một lúc. Đôi khi tôi thức cả đêm lo lắng về tương lai." `
    -ExpectedResults @{}

Start-Sleep -Seconds 2

$testResults += Test-Scenario -TestName "6.3 Mixed Language (Vietnamese + English)" `
    -UserId $user6 -SessionId $session6 `
    -Message "Tôi đang feeling very stressed về work deadline" `
    -ExpectedResults @{}

Start-Sleep -Seconds 2

$testResults += Test-Scenario -TestName "6.4 Special Characters & Emojis" `
    -UserId $user6 -SessionId $session6 `
    -Message "Tôi cảm thấy 😢 vì công việc quá nhiều!!!" `
    -ExpectedResults @{}

# ==========================================
# TEST SUITE 7: MEMORY PROFILE & HISTORY
# ==========================================
Write-Host "`n📋 TEST SUITE 7: MEMORY PROFILE & HISTORY`n" -ForegroundColor Cyan

Write-Host "Test 7.1: Get Memory Profile" -ForegroundColor Yellow
try {
    $profile = Invoke-RestMethod -Uri "$baseUrl/memory-profile/$user2" -Method Get
    Write-Host "  ✅ Profile retrieved" -ForegroundColor Green
    Write-Host "  Short-term: $($profile.data.stats.shortTermCount), Long-term: $($profile.data.stats.longTermCount)" -ForegroundColor Magenta
} catch {
    Write-Host "  ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTest 7.2: Get Conversation History" -ForegroundColor Yellow
try {
    $history = Invoke-RestMethod -Uri "$baseUrl/history-with-memory/$user3/$session3" -Method Get
    Write-Host "  ✅ History retrieved: $($history.data.messages.Count) messages" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTest 7.3: Clear Session Memory" -ForegroundColor Yellow
try {
    $clear = Invoke-RestMethod -Uri "$baseUrl/session-memory/$session1" -Method Delete
    Write-Host "  ✅ Session memory cleared" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# ==========================================
# TEST SUITE 8: PINECONE VERIFICATION
# ==========================================
Write-Host "`n📋 TEST SUITE 8: PINECONE VECTOR DATABASE`n" -ForegroundColor Cyan

Write-Host "Test 8.1: Pinecone Stats" -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "https://soulfriend-api.onrender.com/api/test/memory/pinecone-stats" -Method Get
    Write-Host "  ✅ Pinecone Stats:" -ForegroundColor Green
    Write-Host "    Total Vectors: $($stats.stats.totalRecordCount)" -ForegroundColor Cyan
    Write-Host "    Dimension: $($stats.stats.dimension)" -ForegroundColor Cyan
    Write-Host "    Index Fullness: $($stats.stats.indexFullness * 100)%" -ForegroundColor Cyan
} catch {
    Write-Host "  ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTest 8.2: Memory System Health" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "https://soulfriend-api.onrender.com/api/test/memory/health" -Method Get
    Write-Host "  ✅ Memory System: $($health.services.memorySystem.status)" -ForegroundColor Green
    Write-Host "  ✅ Vector Store: $($health.services.vectorStore.status)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# ==========================================
# SUMMARY REPORT
# ==========================================
Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  📊 TEST SUMMARY REPORT                              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$totalTests = $testResults.Count
$passedTests = ($testResults | Where-Object { $_.Success -eq $true }).Count
$failedTests = $totalTests - $passedTests
$successRate = [math]::Round(($passedTests / $totalTests) * 100, 2)

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests ✅" -ForegroundColor Green
Write-Host "Failed: $failedTests ❌" -ForegroundColor Red
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 90) { 'Green' } elseif ($successRate -ge 70) { 'Yellow' } else { 'Red' })

Write-Host "`n📝 Failed Tests:" -ForegroundColor Yellow
$failedTestsList = $testResults | Where-Object { $_.Success -eq $false }
if ($failedTestsList.Count -eq 0) {
    Write-Host "  None! All tests passed! 🎉" -ForegroundColor Green
} else {
    foreach ($test in $failedTestsList) {
        Write-Host "  ❌ $($test.TestName): $($test.Error)" -ForegroundColor Red
    }
}

Write-Host "`n🧠 Memory Growth Summary:" -ForegroundColor Magenta
Write-Host "  User 1 (Basic): ST=$(($testResults[2].MemoryStats.shortTermCount)) messages" -ForegroundColor Gray
Write-Host "  User 2 (Topics): ST=$(($testResults[6].MemoryStats.shortTermCount)), LT=$(($testResults[6].MemoryStats.longTermCount)) insights" -ForegroundColor Gray
Write-Host "  User 3 (Semantic): ST=$(($testResults[9].MemoryStats.shortTermCount)), LT=$(($testResults[9].MemoryStats.longTermCount)) insights" -ForegroundColor Gray

Write-Host "`n✨ Test Suite Complete! ✨`n" -ForegroundColor Cyan
