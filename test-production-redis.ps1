# Test Production API với Redis Integration

$API_URL = "https://soulfriend-api.onrender.com"

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        🧪 TESTING PRODUCTION API - REDIS INTEGRATION        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "1️⃣  HEALTH CHECK" -ForegroundColor Yellow
Write-Host "   Endpoint: $API_URL/api/health" -ForegroundColor Gray

try {
    $health = Invoke-RestMethod -Uri "$API_URL/api/health" -Method Get -TimeoutSec 30
    Write-Host "   ✅ Status: $($health.status)" -ForegroundColor Green
    Write-Host "   ✅ Message: $($health.message)" -ForegroundColor Green
    
    if ($health.redis) {
        Write-Host "   🔴 Redis: $($health.redis)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Redis status not in response" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Test 2: Chat with Memory (Test Cache)
Write-Host "`n2️⃣  CHAT WITH MEMORY - TEST REDIS CACHE" -ForegroundColor Yellow
$userId = "redis_test_$(Get-Random -Min 1000 -Max 9999)"
$sessionId = "session_$(Get-Random -Min 1000 -Max 9999)"

Write-Host "   User ID: $userId" -ForegroundColor Gray
Write-Host "   Session ID: $sessionId" -ForegroundColor Gray

# Send 3 messages to populate cache
$messages = @(
    "Xin chào! Tôi đang cảm thấy có chút lo lắng về công việc",
    "Tôi thường xuyên bị stress khi gặp deadline",
    "Bạn có thể giúp tôi với vấn đề này không?"
)

foreach ($i in 0..($messages.Length - 1)) {
    $msgNum = $i + 1
    Write-Host "`n   📨 Message $msgNum`: Sending..." -ForegroundColor Cyan
    
    $body = @{
        message = $messages[$i]
        sessionId = $sessionId
        userId = $userId
    } | ConvertTo-Json -Compress

    try {
        $startTime = Get-Date
        $response = Invoke-RestMethod -Uri "$API_URL/api/v2/chatbot/chat-with-memory" `
            -Method Post `
            -Body $body `
            -ContentType "application/json" `
            -TimeoutSec 60

        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds

        Write-Host "   ✅ Response received in $([math]::Round($duration, 0))ms" -ForegroundColor Green
        
        if ($response.response) {
            $shortResponse = $response.response.Substring(0, [Math]::Min(80, $response.response.Length))
            Write-Host "   💬 Reply: $shortResponse..." -ForegroundColor White
        }

        if ($response.memoryContext) {
            $memCtx = $response.memoryContext
            Write-Host "   🧠 Memory Context:" -ForegroundColor Cyan
            Write-Host "      - Short-term: $($memCtx.shortTermCount) memories" -ForegroundColor Gray
            Write-Host "      - Long-term: $($memCtx.longTermCount) memories" -ForegroundColor Gray
            
            if ($memCtx.longTermCount -gt 0) {
                Write-Host "      🔴 (Should be cached in Redis now)" -ForegroundColor Yellow
            }
        }

        # Check response headers for rate limit info
        if ($response.PSObject.Properties.Name -contains 'headers') {
            Write-Host "   🛡️  Rate Limit Info:" -ForegroundColor Cyan
            if ($response.headers.'X-RateLimit-Limit') {
                Write-Host "      - Limit: $($response.headers.'X-RateLimit-Limit')" -ForegroundColor Gray
                Write-Host "      - Remaining: $($response.headers.'X-RateLimit-Remaining')" -ForegroundColor Gray
            }
        }

    } catch {
        Write-Host "   ❌ Request failed: $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "   📊 Status Code: $statusCode" -ForegroundColor Red
            
            if ($statusCode -eq 429) {
                Write-Host "   🛡️  RATE LIMITED - Redis rate limiter is working!" -ForegroundColor Yellow
            }
        }
    }

    Start-Sleep -Seconds 2
}

# Test 3: Check if subsequent requests use cache (should be faster)
Write-Host "`n3️⃣  CACHE PERFORMANCE TEST" -ForegroundColor Yellow
Write-Host "   Testing if Redis cache makes queries faster..." -ForegroundColor Gray

$cacheTestMessage = "Tôi cảm thấy lo lắng về công việc"

Write-Host "`n   📊 Request #1 (Should hit cache):" -ForegroundColor Cyan
$body = @{
    message = $cacheTestMessage
    sessionId = $sessionId
    userId = $userId
} | ConvertTo-Json -Compress

try {
    $startTime = Get-Date
    $response1 = Invoke-RestMethod -Uri "$API_URL/api/v2/chatbot/chat-with-memory" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -TimeoutSec 60
    $endTime = Get-Date
    $duration1 = ($endTime - $startTime).TotalMilliseconds

    Write-Host "   ✅ Response time: $([math]::Round($duration1, 0))ms" -ForegroundColor Green
    
    Start-Sleep -Seconds 1

    # Second request - should use cache
    Write-Host "`n   📊 Request #2 (Cache should be HOT):" -ForegroundColor Cyan
    $startTime = Get-Date
    $response2 = Invoke-RestMethod -Uri "$API_URL/api/v2/chatbot/chat-with-memory" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -TimeoutSec 60
    $endTime = Get-Date
    $duration2 = ($endTime - $startTime).TotalMilliseconds

    Write-Host "   ✅ Response time: $([math]::Round($duration2, 0))ms" -ForegroundColor Green

    # Compare
    Write-Host "`n   📈 Performance Comparison:" -ForegroundColor Yellow
    Write-Host "      Request #1: $([math]::Round($duration1, 0))ms" -ForegroundColor White
    Write-Host "      Request #2: $([math]::Round($duration2, 0))ms" -ForegroundColor White
    
    if ($duration2 -lt $duration1) {
        $improvement = [math]::Round((($duration1 - $duration2) / $duration1) * 100, 1)
        Write-Host "      ⚡ $improvement% faster (Cache working!)" -ForegroundColor Green
    } else {
        Write-Host "      ⚠️  No significant improvement detected" -ForegroundColor Yellow
    }

} catch {
    Write-Host "   ❌ Cache test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Rate Limiting Test
Write-Host "`n4️⃣  RATE LIMITING TEST (20 req/min)" -ForegroundColor Yellow
Write-Host "   Sending rapid requests to trigger rate limit..." -ForegroundColor Gray

$rateLimitHit = $false
for ($i = 1; $i -le 25; $i++) {
    try {
        $body = @{
            message = "Test message $i"
            sessionId = $sessionId
            userId = $userId
        } | ConvertTo-Json -Compress

        $response = Invoke-RestMethod -Uri "$API_URL/api/v2/chatbot/chat-with-memory" `
            -Method Post `
            -Body $body `
            -ContentType "application/json" `
            -TimeoutSec 10

        Write-Host "   ✅ Request $i`: Success" -ForegroundColor Green

    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 429) {
            Write-Host "   🛡️  Request $i`: RATE LIMITED!" -ForegroundColor Yellow
            Write-Host "   ✅ Redis rate limiter is working correctly!" -ForegroundColor Green
            $rateLimitHit = $true
            break
        } else {
            Write-Host "   ⚠️  Request $i`: Error - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

if (-not $rateLimitHit) {
    Write-Host "   ⚠️  Rate limit not triggered (may need more requests)" -ForegroundColor Yellow
}

# Test 5: Memory Stats
Write-Host "`n5️⃣  MEMORY STATS CHECK" -ForegroundColor Yellow
Write-Host "   Checking memory statistics for user..." -ForegroundColor Gray

try {
    $stats = Invoke-RestMethod -Uri "$API_URL/api/test/memory/memory-stats/$userId" `
        -Method Get `
        -TimeoutSec 30

    if ($stats) {
        Write-Host "   ✅ Memory Stats Retrieved:" -ForegroundColor Green
        Write-Host "      $stats" -ForegroundColor White
    }
} catch {
    Write-Host "   ⚠️  Stats endpoint not available or error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Summary
Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    🎉 TEST COMPLETED                         ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📊 SUMMARY:" -ForegroundColor Yellow
Write-Host "   Test User: $userId" -ForegroundColor White
Write-Host "   Messages Sent: $($messages.Length)" -ForegroundColor White
Write-Host "   API Status: Check results above" -ForegroundColor White
Write-Host "`n🔴 REDIS STATUS:" -ForegroundColor Yellow
Write-Host "   - Caching: Check performance comparison" -ForegroundColor White
Write-Host "   - Rate Limiting: $(if($rateLimitHit){'✅ Working'}else{'⚠️  Not triggered'})" -ForegroundColor White
Write-Host "`n💡 NOTE:" -ForegroundColor Cyan
Write-Host "   If Redis is not enabled on Render, you should see:" -ForegroundColor White
Write-Host "   - No cache speedup" -ForegroundColor Gray
Write-Host "   - No rate limiting (429 errors)" -ForegroundColor Gray
Write-Host "   - Need to add REDIS_URL to Render env vars`n" -ForegroundColor Gray
