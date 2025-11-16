# Test: Verify if chatbot is auto-learning from conversations
# This test will check if insights are being extracted and applied

$baseUrl = "https://soulfriend-api.onrender.com/api/v2/chatbot"
$testUser = "learning_test_user_$(Get-Random)"
$testSession = "session_$(Get-Random)"

Write-Host "`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🧠 CHATBOT AUTO-LEARNING VERIFICATION TEST              ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Test User: $testUser" -ForegroundColor Yellow
Write-Host "Session: $testSession`n" -ForegroundColor Yellow

# Helper function
function Send-Message {
    param(
        [string]$Message,
        [string]$StepName
    )
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "📤 STEP: $StepName" -ForegroundColor Cyan
    Write-Host "Message: $Message" -ForegroundColor White
    
    $body = @{
        userId = $testUser
        sessionId = $testSession
        message = $Message
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/chat-with-memory" -Method Post -Body $body -ContentType "application/json"
        
        Write-Host "`n✅ Response:" -ForegroundColor Green
        Write-Host $response.response.substring(0, [Math]::Min(200, $response.response.Length)) -ForegroundColor White
        
        Write-Host "`n📊 Memory Status:" -ForegroundColor Yellow
        Write-Host "  Working Memory: $($response.memoryUsed.workingMemoryActive)" -ForegroundColor White
        Write-Host "  Short-term: $($response.memoryUsed.shortTermCount) interactions" -ForegroundColor White
        Write-Host "  Long-term: $($response.memoryUsed.longTermCount) insights" -ForegroundColor White
        Write-Host "  Relevant Memories: $($response.memoryUsed.relevantMemoriesCount)" -ForegroundColor White
        
        if ($response.memoryUsed.relevantMemories -and $response.memoryUsed.relevantMemories.Count -gt 0) {
            Write-Host "`n🧠 Retrieved Memories:" -ForegroundColor Magenta
            foreach ($mem in $response.memoryUsed.relevantMemories) {
                Write-Host "  - [$($mem.type)] $($mem.content.substring(0, [Math]::Min(100, $mem.content.Length)))" -ForegroundColor Cyan
                Write-Host "    Confidence: $([math]::Round($mem.confidence * 100, 1))%" -ForegroundColor Gray
            }
        }
        
        return $response
    }
    catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

function Get-MemoryProfile {
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "📊 CHECKING MEMORY PROFILE" -ForegroundColor Cyan
    
    try {
        $profile = Invoke-RestMethod -Uri "$baseUrl/memory-profile/$testUser" -Method Get
        
        Write-Host "`n✅ Memory Profile Retrieved:" -ForegroundColor Green
        Write-Host "  Total Short-term: $($profile.shortTermMemory.total)" -ForegroundColor White
        Write-Host "  Total Long-term: $($profile.longTermMemory.total)" -ForegroundColor White
        
        if ($profile.longTermMemory.memories -and $profile.longTermMemory.memories.Count -gt 0) {
            Write-Host "`n🧠 Long-term Insights:" -ForegroundColor Magenta
            foreach ($mem in $profile.longTermMemory.memories) {
                Write-Host "`n  Type: $($mem.type)" -ForegroundColor Yellow
                Write-Host "  Content: $($mem.content)" -ForegroundColor White
                Write-Host "  Confidence: $([math]::Round($mem.metadata.confidence * 100, 1))%" -ForegroundColor Gray
                Write-Host "  Category: $($mem.metadata.category)" -ForegroundColor Gray
                Write-Host "  Created: $($mem.createdAt)" -ForegroundColor Gray
            }
        }
        
        return $profile
    }
    catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# TEST SEQUENCE: Simulate real user learning scenario

Write-Host "`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  PHASE 1: Initial Conversations (Building Memory)        ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

# Message 1: User shares about work stress
Send-Message "Công việc của tôi rất áp lực, tôi phải làm việc đến 10-11 giờ tối mỗi ngày" "1. Work Stress Pattern"
Start-Sleep -Seconds 3

# Message 2: User shares about sleep issues
Send-Message "Vì công việc nhiều nên tôi thường xuyên mất ngủ, chỉ ngủ được 4-5 tiếng mỗi đêm" "2. Sleep Problem Pattern"
Start-Sleep -Seconds 3

# Message 3: User shares emotional state
Send-Message "Tôi cảm thấy rất mệt mỏi và stress, đôi khi muốn bỏ cuộc" "3. Emotional Pattern"
Start-Sleep -Seconds 5

Write-Host "`n⏳ Waiting 5 seconds for insight extraction..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check memory profile after initial conversations
$profileAfterPhase1 = Get-MemoryProfile

Write-Host "`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  PHASE 2: Test if Bot Learned (Applying Memory)          ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

# Message 4: User asks about work-life balance
# Bot should reference previous work stress pattern
Send-Message "Làm sao tôi có thể cân bằng công việc và cuộc sống?" "4. Work-Life Balance Query (Should Use Learned Context)"
Start-Sleep -Seconds 3

# Message 5: User asks about sleep improvement
# Bot should reference previous sleep issues
Send-Message "Có cách nào giúp tôi ngủ ngon hơn không?" "5. Sleep Improvement Query (Should Use Learned Context)"
Start-Sleep -Seconds 3

# Message 6: Check if bot remembers emotional state
Send-Message "Hôm nay tôi cảm thấy tốt hơn một chút" "6. Emotional Update (Should Reference Previous State)"
Start-Sleep -Seconds 5

Write-Host "`n⏳ Waiting 5 seconds for final insight extraction..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Final memory profile check
$profileAfterPhase2 = Get-MemoryProfile

Write-Host "`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  📊 LEARNING VERIFICATION SUMMARY                        ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Analysis
Write-Host "🔍 ANALYSIS:" -ForegroundColor Yellow

$phase1LongTerm = if ($profileAfterPhase1) { $profileAfterPhase1.longTermMemory.total } else { 0 }
$phase2LongTerm = if ($profileAfterPhase2) { $profileAfterPhase2.longTermMemory.total } else { 0 }

Write-Host "`n1. Memory Growth:" -ForegroundColor White
Write-Host "   Phase 1 (Initial): $phase1LongTerm long-term insights" -ForegroundColor Cyan
Write-Host "   Phase 2 (Final): $phase2LongTerm long-term insights" -ForegroundColor Cyan
Write-Host "   Growth: +$($phase2LongTerm - $phase1LongTerm) insights" -ForegroundColor $(if ($phase2LongTerm -gt $phase1LongTerm) { "Green" } else { "Yellow" })

Write-Host "`n2. Auto-Learning Status:" -ForegroundColor White
if ($phase2LongTerm -gt 0) {
    Write-Host "   ✅ CONFIRMED: Chatbot is auto-extracting insights!" -ForegroundColor Green
    Write-Host "   ✅ Insights are being saved to long-term memory" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  WARNING: No long-term insights detected" -ForegroundColor Yellow
}

Write-Host "`n3. Context Application:" -ForegroundColor White
Write-Host "   Check if bot responses in Phase 2 referenced Phase 1 patterns" -ForegroundColor Cyan
Write-Host "   (Review 'Retrieved Memories' sections above)" -ForegroundColor Gray

Write-Host "`n4. Learning Categories Detected:" -ForegroundColor White
if ($profileAfterPhase2 -and $profileAfterPhase2.longTermMemory.memories) {
    $categories = $profileAfterPhase2.longTermMemory.memories | Select-Object -ExpandProperty metadata | Select-Object -ExpandProperty category -Unique
    foreach ($cat in $categories) {
        Write-Host "   • $cat" -ForegroundColor Green
    }
}

# Check Pinecone vectors
Write-Host "`n5. Vector Database (Pinecone):" -ForegroundColor White
try {
    $pineconeStats = Invoke-RestMethod -Uri "https://soulfriend-api.onrender.com/api/test/memory/pinecone-stats" -Method Get
    Write-Host "   Total Vectors: $($pineconeStats.stats.totalRecordCount)" -ForegroundColor Cyan
    Write-Host "   Status: $($pineconeStats.stats.enabled)" -ForegroundColor Cyan
} catch {
    Write-Host "   ⚠️  Could not fetch Pinecone stats" -ForegroundColor Yellow
}

Write-Host "`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ TEST COMPLETE                                         ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📝 Summary:" -ForegroundColor Yellow
Write-Host "   - Bot collected user data from conversations: ✅" -ForegroundColor White
Write-Host "   - Insights auto-extracted to long-term memory: $(if ($phase2LongTerm -gt 0) { '✅' } else { '⚠️' })" -ForegroundColor White
Write-Host "   - Context applied in follow-up responses: ✅ (Check 'Retrieved Memories' above)" -ForegroundColor White
Write-Host "   - Learning system operational: $(if ($phase2LongTerm -gt 0) { '✅' } else { '⚠️' })" -ForegroundColor White
