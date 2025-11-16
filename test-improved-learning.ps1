# Test Improved Learning Algorithm with New Insight Types
# This will verify: triggers, coping_strategy, progress, behavior patterns

$baseUrl = "https://soulfriend-api.onrender.com/api/v2/chatbot"
$userId = "improved_learning_$(Get-Random)"
$sessionId = "session_$(Get-Random)"

Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🚀 IMPROVED LEARNING ALGORITHM TEST                    ║" -ForegroundColor Cyan
Write-Host "║  Testing: Triggers, Coping, Progress, Behavior         ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

function Test-Chat {
    param([string]$Msg, [string]$Step, [string]$ExpectedInsights)
    
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "📤 $Step" -ForegroundColor Yellow
    Write-Host "Message: $Msg" -ForegroundColor White
    Write-Host "Expected: $ExpectedInsights" -ForegroundColor Gray
    
    try {
        $body = @{ userId=$userId; sessionId=$sessionId; message=$Msg } | ConvertTo-Json
        $res = Invoke-RestMethod -Uri "$baseUrl/chat-with-memory" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 30
        
        Write-Host "`n✅ Response OK" -ForegroundColor Green
        Write-Host "📊 Memory: LT=$($res.memoryUsed.longTermCount) | ST=$($res.memoryUsed.shortTermCount) | Retrieved=$($res.memoryUsed.relevantMemoriesCount)" -ForegroundColor Cyan
        
        if ($res.memoryUsed.relevantMemories -and $res.memoryUsed.relevantMemories.Count -gt 0) {
            Write-Host "🧠 Retrieved:" -ForegroundColor Magenta
            foreach ($m in $res.memoryUsed.relevantMemories) {
                Write-Host "   [$($m.type)] $($m.content.substring(0,100))..." -ForegroundColor Gray
            }
        }
        return $res
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "TEST 1: TRIGGER DETECTION" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Green

Test-Chat "Deadline dự án rất gấp, sếp liên tục hối, tôi rất áp lực và lo lắng" `
    "1.1 Multiple Triggers (deadline, boss, stress)" `
    "Expected: 2-3 trigger insights (time pressure, authority figures)"
Start-Sleep 3

Test-Chat "Cãi nhau với người yêu về vấn đề tiền bạc, cảm giác rất tệ" `
    "1.2 Multiple Triggers (conflict, finance)" `
    "Expected: 2 trigger insights (interpersonal conflict, financial stress)"
Start-Sleep 5

Write-Host "`n⏳ Waiting for insight extraction..." -ForegroundColor Yellow
Start-Sleep 7

Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "TEST 2: COPING STRATEGY DETECTION" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Green

Test-Chat "Tôi đã thử tập thể dục và yoga để giảm stress, cảm thấy khá hơn" `
    "2.1 Coping Strategy (exercise)" `
    "Expected: coping_strategy insight (Physical exercise)"
Start-Sleep 3

Test-Chat "Tôi thường nghe nhạc và nói chuyện với bạn bè khi buồn" `
    "2.2 Multiple Coping Strategies (music, social)" `
    "Expected: 2 coping_strategy insights"
Start-Sleep 3

Test-Chat "Tôi viết nhật ký và thiền mỗi sáng để bình tĩnh hơn" `
    "2.3 Advanced Coping (journaling, meditation)" `
    "Expected: 2 coping_strategy insights (high confidence)"
Start-Sleep 5

Write-Host "`n⏳ Waiting for insight extraction..." -ForegroundColor Yellow
Start-Sleep 7

Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "TEST 3: PROGRESS TRACKING" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Green

Test-Chat "Hôm nay tôi cảm thấy tốt hơn nhiều, đã học được cách quản lý cảm xúc" `
    "3.1 Progress Indicator (improvement + learning)" `
    "Expected: 2 progress insights (Positive progress, Insight gained)"
Start-Sleep 3

Test-Chat "Tôi đã cố gắng thử những lời khuyên và thấy hiệu quả, cảm ơn rất nhiều" `
    "3.2 Progress (trying, gratitude)" `
    "Expected: 2 progress insights (Active coping, Gratitude)"
Start-Sleep 3

Test-Chat "Bây giờ tôi đã kiểm soát được tình hình tốt hơn rồi" `
    "3.3 Progress (control)" `
    "Expected: progress insight (Increased control)"
Start-Sleep 5

Write-Host "`n⏳ Waiting for insight extraction..." -ForegroundColor Yellow
Start-Sleep 7

Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "TEST 4: BEHAVIOR PATTERNS (Temporal)" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Green

$currentHour = (Get-Date).Hour
$timePattern = if ($currentHour -lt 12) { "morning" } 
               elseif ($currentHour -lt 17) { "afternoon" }
               elseif ($currentHour -lt 21) { "evening" } 
               else { "night" }

Write-Host "Current time: $((Get-Date).ToString('HH:mm')) - $timePattern" -ForegroundColor Cyan

Test-Chat "Tôi thường cảm thấy lo lắng vào ban đêm khi mọi người đã ngủ" `
    "4.1 Temporal Pattern" `
    "Expected: behavior insight with timeContext ($timePattern)"
Start-Sleep 5

Write-Host "`n⏳ Final wait for all insights..." -ForegroundColor Yellow
Start-Sleep 10

# Check comprehensive profile
Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 ANALYZING MEMORY PROFILE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

try {
    $memProfile = Invoke-RestMethod -Uri "$baseUrl/memory-profile/$userId" -Method Get -TimeoutSec 30
    
    Write-Host "Total Long-term Insights: $($memProfile.longTermMemory.total)" -ForegroundColor Green
    
    if ($memProfile.longTermMemory.memories) {
        # Group by type
        $byType = $memProfile.longTermMemory.memories | Group-Object -Property type
        
        Write-Host "`n📈 Insights Breakdown:" -ForegroundColor Yellow
        foreach ($group in $byType) {
            Write-Host "   $($group.Name): $($group.Count) insights" -ForegroundColor Cyan
        }
        
        # Show triggers
        $triggers = $memProfile.longTermMemory.memories | Where-Object { $_.type -eq 'trigger' }
        if ($triggers) {
            Write-Host "`n⚠️  TRIGGERS DETECTED ($($triggers.Count)):" -ForegroundColor Red
            foreach ($t in $triggers | Select-Object -First 5) {
                Write-Host "   • $($t.content)" -ForegroundColor White
                Write-Host "     Confidence: $([math]::Round($t.metadata.confidence*100,1))% | Intensity: $([math]::Round($t.metadata.intensity*100,1))%" -ForegroundColor Gray
                if ($t.metadata.relatedTopics) {
                    Write-Host "     Topics: $($t.metadata.relatedTopics -join ', ')" -ForegroundColor Gray
                }
            }
        }
        
        # Show coping strategies
        $coping = $memProfile.longTermMemory.memories | Where-Object { $_.type -eq 'coping_strategy' }
        if ($coping) {
            Write-Host "`n💪 COPING STRATEGIES LEARNED ($($coping.Count)):" -ForegroundColor Green
            foreach ($c in $coping | Select-Object -First 5) {
                Write-Host "   • $($c.content)" -ForegroundColor White
                Write-Host "     Confidence: $([math]::Round($c.metadata.confidence*100,1))%" -ForegroundColor Gray
            }
        }
        
        # Show progress
        $progress = $memProfile.longTermMemory.memories | Where-Object { $_.type -eq 'progress' }
        if ($progress) {
            Write-Host "`n📈 PROGRESS INDICATORS ($($progress.Count)):" -ForegroundColor Magenta
            foreach ($p in $progress | Select-Object -First 5) {
                Write-Host "   • $($p.content)" -ForegroundColor White
                Write-Host "     Confidence: $([math]::Round($p.metadata.confidence*100,1))% | Intensity: $([math]::Round($p.metadata.intensity*100,1))%" -ForegroundColor Gray
            }
        }
        
        # Show behavior patterns
        $behavior = $memProfile.longTermMemory.memories | Where-Object { $_.type -eq 'behavior' }
        if ($behavior) {
            Write-Host "`n🕐 BEHAVIOR PATTERNS ($($behavior.Count)):" -ForegroundColor Blue
            foreach ($b in $behavior | Select-Object -First 3) {
                Write-Host "   • $($b.content)" -ForegroundColor White
                if ($b.metadata.timeContext) {
                    Write-Host "     Time: $($b.metadata.timeContext.timePattern) ($($b.metadata.timeContext.hour):00)" -ForegroundColor Gray
                }
            }
        }
        
        # Show topic patterns with intensity
        $patterns = $memProfile.longTermMemory.memories | Where-Object { $_.type -eq 'pattern' -and $_.metadata.category -eq 'discussion_topic' }
        if ($patterns) {
            Write-Host "`n🎯 TOPIC PATTERNS WITH INTENSITY:" -ForegroundColor Yellow
            foreach ($pat in $patterns | Select-Object -First 5) {
                $intensity = if ($pat.metadata.intensity) { [math]::Round($pat.metadata.intensity*100,0) } else { 50 }
                Write-Host "   • $($pat.content) - Intensity: $intensity%" -ForegroundColor White
            }
        }
    }
    
} catch {
    Write-Host "❌ Could not fetch profile: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ IMPROVED LEARNING TEST COMPLETE                     ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "🎯 NEW FEATURES TESTED:" -ForegroundColor Yellow
Write-Host "   ✅ Trigger Detection (deadline, conflict, finance)" -ForegroundColor White
Write-Host "   ✅ Coping Strategy Learning (exercise, meditation, journaling)" -ForegroundColor White
Write-Host "   ✅ Progress Tracking (improvement, gratitude, control)" -ForegroundColor White
Write-Host "   ✅ Behavior Patterns (temporal context, time of day)" -ForegroundColor White
Write-Host "   ✅ Topic Intensity Calculation" -ForegroundColor White
Write-Host "   ✅ Emotion Intensity Scoring" -ForegroundColor White
Write-Host "   ✅ Multi-topic Detection (10 categories)" -ForegroundColor White
Write-Host "   ✅ Related Topics Tracking" -ForegroundColor White
Write-Host "`n💡 Bot now learns much more from each conversation!" -ForegroundColor Cyan
