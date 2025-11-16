# Quick Demo: Verify Learning System is Working
# This will show that bot learns from conversations and applies context

$baseUrl = "https://soulfriend-api.onrender.com/api/v2/chatbot"
$userId = "demo_$(Get-Random)"
$sessionId = "session_$(Get-Random)"

Write-Host "`n╔═══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🧠 CHATBOT LEARNING SYSTEM - QUICK DEMO        ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

function Test-Chat {
    param([string]$Msg, [string]$Step)
    
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "📤 $Step" -ForegroundColor Yellow
    Write-Host "Message: $Msg`n" -ForegroundColor White
    
    try {
        $body = @{ userId=$userId; sessionId=$sessionId; message=$Msg } | ConvertTo-Json
        $res = Invoke-RestMethod -Uri "$baseUrl/chat-with-memory" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 30
        
        Write-Host "Response: $($res.response.substring(0, 150))..." -ForegroundColor Green
        Write-Host "`n📊 Memory: Working=$($res.memoryUsed.workingMemoryActive) | ST=$($res.memoryUsed.shortTermCount) | LT=$($res.memoryUsed.longTermCount) | Retrieved=$($res.memoryUsed.relevantMemoriesCount)" -ForegroundColor Cyan
        
        if ($res.memoryUsed.relevantMemories -and $res.memoryUsed.relevantMemories.Count -gt 0) {
            Write-Host "🧠 Applied Memory:" -ForegroundColor Magenta
            foreach ($m in $res.memoryUsed.relevantMemories) {
                Write-Host "   • [$($m.type)] $($m.content.substring(0, 80))... ($([math]::Round($m.confidence*100,1))%)" -ForegroundColor Gray
            }
        }
        return $res
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# PHASE 1: Build Memory
Write-Host "PHASE 1: Building Memory..." -ForegroundColor Green
Test-Chat "Công việc của tôi rất áp lực, deadline liên tục" "1. Share Work Stress"
Start-Sleep 3

Test-Chat "Tôi thường xuyên mất ngủ vì lo lắng" "2. Share Sleep Issue"
Start-Sleep 5

Write-Host "`n⏳ Waiting for insights extraction (background job)..." -ForegroundColor Yellow
Start-Sleep 7

# PHASE 2: Test if learned
Write-Host "`nPHASE 2: Testing if Bot Learned..." -ForegroundColor Green
Test-Chat "Làm sao xử lý deadline tốt hơn?" "3. Query Related to Work (Should retrieve work memory)"
Start-Sleep 3

Test-Chat "Có cách nào cải thiện giấc ngủ?" "4. Query Related to Sleep (Should retrieve sleep memory)"

# Check memory profile
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "📊 CHECKING MEMORY PROFILE" -ForegroundColor Yellow

try {
    $profile = Invoke-RestMethod -Uri "$baseUrl/memory-profile/$userId" -Method Get -TimeoutSec 30
    Write-Host "`nTotal Long-term Insights: $($profile.longTermMemory.total)" -ForegroundColor Cyan
    
    if ($profile.longTermMemory.memories -and $profile.longTermMemory.memories.Count -gt 0) {
        Write-Host "`n🧠 Learned Insights:" -ForegroundColor Magenta
        foreach ($m in $profile.longTermMemory.memories | Select-Object -First 5) {
            Write-Host "   • [$($m.type)] $($m.content)" -ForegroundColor White
            Write-Host "     Category: $($m.metadata.category) | Confidence: $([math]::Round($m.metadata.confidence*100,1))%" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "❌ Could not fetch profile: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n╔═══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ DEMO COMPLETE                                ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "💡 Key Observations:" -ForegroundColor Yellow
Write-Host "   1. Check if 'Retrieved' count increases in Phase 2" -ForegroundColor White
Write-Host "   2. Check 'Applied Memory' sections for relevant past conversations" -ForegroundColor White
Write-Host "   3. Long-term insights should be > 0 after Phase 1" -ForegroundColor White
Write-Host "   4. Bot should reference previous context in Phase 2 responses`n" -ForegroundColor White
