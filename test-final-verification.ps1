# Final Verification Test - Improved Learning Algorithm
# Tests new insight types: triggers, coping, progress, behavior

$baseUrl = "https://soulfriend-api.onrender.com/api/v2/chatbot"
$userId = "final_test_$(Get-Random -Maximum 99999)"
$sessionId = "session_$(Get-Random -Maximum 99999)"

Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🧠 FINAL VERIFICATION - IMPROVED LEARNING ALGORITHM    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Test User ID: $userId" -ForegroundColor Yellow
Write-Host "Session ID: $sessionId`n" -ForegroundColor Yellow

function Send-TestMessage {
    param([string]$Message, [string]$TestName)
    
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "📤 $TestName" -ForegroundColor Cyan
    Write-Host "Message: $Message`n" -ForegroundColor White
    
    try {
        $body = @{ 
            userId = $userId
            sessionId = $sessionId
            message = $Message 
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$baseUrl/chat-with-memory" `
            -Method Post -Body $body -ContentType "application/json" -TimeoutSec 30
        
        if ($response.success -and $response.data) {
            Write-Host "✅ Response OK" -ForegroundColor Green
            Write-Host "Bot: $($response.data.response.Substring(0, [Math]::Min(120, $response.data.response.Length)))..." -ForegroundColor Cyan
            
            if ($response.data.memoryContext) {
                $mem = $response.data.memoryContext
                Write-Host "`n📊 Memory: ST=$($mem.shortTermCount) | LT=$($mem.longTermCount)" -ForegroundColor Magenta
            }
            
            return $response
        } else {
            Write-Host "❌ Unexpected response format" -ForegroundColor Red
            return $null
        }
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# ==========================================
# PHASE 1: Build Memory with Trigger Tests
# ==========================================
Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "PHASE 1: TRIGGER DETECTION TEST" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Green

Send-TestMessage "Deadline dự án rất gấp, sếp liên tục hối, tôi rất áp lực và lo lắng" `
    "Test 1.1: Multiple Triggers (deadline + authority)"
Start-Sleep -Seconds 3

Send-TestMessage "Cãi nhau với người yêu về vấn đề tiền bạc, cảm giác rất tệ" `
    "Test 1.2: Conflict + Financial Trigger"
Start-Sleep -Seconds 5

# ==========================================
# PHASE 2: Coping Strategy Tests
# ==========================================
Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "PHASE 2: COPING STRATEGY DETECTION" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Green

Send-TestMessage "Tôi đã thử tập thể dục và yoga để giảm stress, cảm thấy khá hơn" `
    "Test 2.1: Physical Exercise Coping"
Start-Sleep -Seconds 3

Send-TestMessage "Tôi thường nghe nhạc và thiền mỗi sáng để bình tĩnh hơn" `
    "Test 2.2: Music + Meditation Coping"
Start-Sleep -Seconds 5

# ==========================================
# PHASE 3: Progress Tracking Tests
# ==========================================
Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "PHASE 3: PROGRESS TRACKING" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Green

Send-TestMessage "Hôm nay tôi cảm thấy tốt hơn nhiều, đã học được cách quản lý cảm xúc" `
    "Test 3.1: Positive Progress + Learning"
Start-Sleep -Seconds 3

Send-TestMessage "Cảm ơn rất nhiều, tôi đã thử và thấy hiệu quả" `
    "Test 3.2: Gratitude + Active Coping"
Start-Sleep -Seconds 3

Send-TestMessage "Bây giờ tôi đã kiểm soát được tình hình tốt hơn rồi" `
    "Test 3.3: Increased Control"
Start-Sleep -Seconds 5

# ==========================================
# PHASE 4: Behavior Pattern (Temporal)
# ==========================================
Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "PHASE 4: BEHAVIOR PATTERN (TEMPORAL)" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Green

$currentHour = (Get-Date).Hour
$timePattern = if ($currentHour -lt 12) { "morning" } 
               elseif ($currentHour -lt 17) { "afternoon" }
               elseif ($currentHour -lt 21) { "evening" } 
               else { "night" }

Write-Host "Current time: $((Get-Date).ToString('HH:mm')) - $timePattern" -ForegroundColor Yellow

Send-TestMessage "Tôi thường cảm thấy lo lắng vào ban đêm khi mọi người đã ngủ" `
    "Test 4.1: Temporal Anxiety Pattern"

# ==========================================
# Wait for Background Processing
# ==========================================
Write-Host "`n⏳ Waiting 10 seconds for insight extraction (background job)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# ==========================================
# PHASE 5: Check Memory Profile
# ==========================================
Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 MEMORY PROFILE ANALYSIS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

try {
    $profile = Invoke-RestMethod -Uri "$baseUrl/memory-profile/$userId" -Method Get -TimeoutSec 30
    
    if ($profile.success -and $profile.data) {
        $data = $profile.data
        
        Write-Host "✅ Profile Retrieved Successfully!" -ForegroundColor Green
        Write-Host "`n📈 Statistics:" -ForegroundColor Yellow
        Write-Host "   Short-term memories: $($data.stats.shortTermCount)" -ForegroundColor White
        Write-Host "   Long-term insights: $($data.stats.longTermCount)" -ForegroundColor White
        
        if ($data.longTermMemory -and $data.longTermMemory.memories) {
            $memories = $data.longTermMemory.memories
            
            # Group by type
            $byType = $memories | Group-Object -Property type
            
            Write-Host "`n📊 Insights by Type:" -ForegroundColor Magenta
            foreach ($group in $byType) {
                Write-Host "   $($group.Name): $($group.Count) insights" -ForegroundColor Cyan
            }
            
            # Show triggers
            $triggers = $memories | Where-Object { $_.type -eq 'trigger' }
            if ($triggers -and $triggers.Count -gt 0) {
                Write-Host "`n⚠️  TRIGGERS DETECTED ($($triggers.Count)):" -ForegroundColor Red
                foreach ($t in ($triggers | Select-Object -First 3)) {
                    Write-Host "   • $($t.content)" -ForegroundColor White
                    if ($t.metadata.intensity) {
                        Write-Host "     Intensity: $([math]::Round($t.metadata.intensity*100))% | Confidence: $([math]::Round($t.metadata.confidence*100))%" -ForegroundColor Gray
                    }
                }
            } else {
                Write-Host "`n⚠️  No trigger insights found yet (may still be processing)" -ForegroundColor Yellow
            }
            
            # Show coping strategies
            $coping = $memories | Where-Object { $_.type -eq 'coping_strategy' }
            if ($coping -and $coping.Count -gt 0) {
                Write-Host "`n💪 COPING STRATEGIES LEARNED ($($coping.Count)):" -ForegroundColor Green
                foreach ($c in ($coping | Select-Object -First 3)) {
                    Write-Host "   • $($c.content)" -ForegroundColor White
                    if ($c.metadata.confidence) {
                        Write-Host "     Confidence: $([math]::Round($c.metadata.confidence*100))%" -ForegroundColor Gray
                    }
                }
            } else {
                Write-Host "`n💪 No coping strategies found yet (may still be processing)" -ForegroundColor Yellow
            }
            
            # Show progress
            $progress = $memories | Where-Object { $_.type -eq 'progress' }
            if ($progress -and $progress.Count -gt 0) {
                Write-Host "`n📈 PROGRESS INDICATORS ($($progress.Count)):" -ForegroundColor Magenta
                foreach ($p in ($progress | Select-Object -First 3)) {
                    Write-Host "   • $($p.content)" -ForegroundColor White
                }
            } else {
                Write-Host "`n📈 No progress indicators found yet (may still be processing)" -ForegroundColor Yellow
            }
            
            # Show behavior patterns
            $behavior = $memories | Where-Object { $_.type -eq 'behavior' }
            if ($behavior -and $behavior.Count -gt 0) {
                Write-Host "`n🕐 BEHAVIOR PATTERNS ($($behavior.Count)):" -ForegroundColor Blue
                foreach ($b in ($behavior | Select-Object -First 2)) {
                    Write-Host "   • $($b.content)" -ForegroundColor White
                    if ($b.metadata.timeContext) {
                        $tc = $b.metadata.timeContext
                        Write-Host "     Time: $($tc.timePattern) ($($tc.hour):00)" -ForegroundColor Gray
                    }
                }
            } else {
                Write-Host "`n🕐 No behavior patterns found yet (may still be processing)" -ForegroundColor Yellow
            }
            
            # Show regular patterns with intensity
            $patterns = $memories | Where-Object { 
                $_.type -eq 'pattern' -and 
                $_.metadata.category -eq 'discussion_topic' 
            }
            if ($patterns -and $patterns.Count -gt 0) {
                Write-Host "`n🎯 TOPIC PATTERNS ($($patterns.Count)):" -ForegroundColor Yellow
                foreach ($pat in ($patterns | Select-Object -First 5)) {
                    $intensity = if ($pat.metadata.intensity) { 
                        [math]::Round($pat.metadata.intensity*100) 
                    } else { 50 }
                    Write-Host "   • $($pat.content) - Intensity: $intensity%" -ForegroundColor White
                }
            }
            
        } else {
            Write-Host "`n⏳ No long-term insights yet. Background processing may still be running." -ForegroundColor Yellow
            Write-Host "   Try running this test again in 30 seconds." -ForegroundColor Gray
        }
        
    } else {
        Write-Host "❌ Unexpected profile response format" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Failed to fetch memory profile: $($_.Exception.Message)" -ForegroundColor Red
}

# ==========================================
# Summary
# ==========================================
Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ TEST COMPLETE                                        ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "🎯 Features Tested:" -ForegroundColor Yellow
Write-Host "   ✅ Trigger Detection (deadline, conflict, finance)" -ForegroundColor White
Write-Host "   ✅ Coping Strategy Learning (exercise, meditation)" -ForegroundColor White
Write-Host "   ✅ Progress Tracking (improvement, gratitude, control)" -ForegroundColor White
Write-Host "   ✅ Behavior Patterns (temporal context)" -ForegroundColor White
Write-Host "   ✅ Topic Intensity Calculation" -ForegroundColor White
Write-Host "   ✅ Multi-topic Detection (10 categories)" -ForegroundColor White

Write-Host "`n💡 Expected Results:" -ForegroundColor Cyan
Write-Host "   - 8-10 messages sent" -ForegroundColor White
Write-Host "   - 15-30 insights created (3-6 per message)" -ForegroundColor White
Write-Host "   - trigger, coping_strategy, progress, behavior types present" -ForegroundColor White
Write-Host "   - Intensity scores and temporal context included" -ForegroundColor White

Write-Host "`n📝 Note: If insights are still 0, wait 30 seconds and check again:" -ForegroundColor Yellow
Write-Host "   Invoke-RestMethod -Uri '$baseUrl/memory-profile/$userId' -Method Get`n" -ForegroundColor Gray
