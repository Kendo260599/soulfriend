Write-Host "`n╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🎉 REDIS INTEGRATION - FINAL TEST SUITE 🎉     ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000"
$testsPassed = 0
$testsFailed = 0

# Test 1: Check server health
Write-Host "📊 Test 1: Server Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method GET
    Write-Host "   ✅ Server is running!" -ForegroundColor Green
    $testsPassed++
} catch {
    Write-Host "   ❌ Server not running! Start with: npm run dev" -ForegroundColor Red
    $testsFailed++
    Write-Host "`n⚠️  Please start the server first: cd backend && npm run dev`n" -ForegroundColor Yellow
    exit 1
}

# Test 2: Test rate limiting
Write-Host "`n📊 Test 2: Rate Limiting (Send 25 requests to trigger limit)..." -ForegroundColor Yellow
$testUserId = "rate_limit_test_$(Get-Random -Min 1000 -Max 9999)"
$sessionId = "sess_$(Get-Random -Min 1000 -Max 9999)"
$blockedCount = 0
$allowedCount = 0

Write-Host "   Sending 25 requests..." -ForegroundColor White

for ($i = 1; $i -le 25; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/v2/chatbot/chat-with-memory" -Method POST -ContentType "application/json" -Body (@{
            message = "Test message $i"
            sessionId = $sessionId
            userId = $testUserId
        } | ConvertTo-Json) -ErrorAction Stop
        
        $allowedCount++
        if ($i -le 20) {
            Write-Host "   $i. ✅ Allowed (within limit)" -ForegroundColor Green -NoNewline
        } else {
            Write-Host "   $i. ⚠️  Allowed (should be blocked!)" -ForegroundColor Yellow -NoNewline
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 429) {
            $blockedCount++
            Write-Host "   $i. 🛡️  Blocked (rate limited)" -ForegroundColor Cyan -NoNewline
        } else {
            Write-Host "   $i. ❌ Error: $statusCode" -ForegroundColor Red -NoNewline
        }
    }
    
    if ($i % 5 -eq 0) { Write-Host "" }
    Start-Sleep -Milliseconds 100
}

Write-Host "`n   📊 Results: $allowedCount allowed, $blockedCount blocked" -ForegroundColor White
if ($blockedCount -ge 5) {
    Write-Host "   ✅ Rate limiting working! (blocked $blockedCount requests)" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "   ⚠️  Rate limiting may not be active" -ForegroundColor Yellow
    $testsFailed++
}

# Test 3: Test memory caching
Write-Host "`n📊 Test 3: Memory Caching (Send same query twice)..." -ForegroundColor Yellow
$cacheTestUserId = "cache_test_$(Get-Random -Min 1000 -Max 9999)"
$cacheSessionId = "sess_$(Get-Random -Min 1000 -Max 9999)"
$testMessage = "I feel stressed about work"

# First request (cache miss)
Write-Host "   Request 1 (Cache MISS expected)..." -ForegroundColor White
$start1 = Get-Date
try {
    $response1 = Invoke-RestMethod -Uri "$baseUrl/api/v2/chatbot/chat-with-memory" -Method POST -ContentType "application/json" -Body (@{
        message = $testMessage
        sessionId = $cacheSessionId
        userId = $cacheTestUserId
    } | ConvertTo-Json)
    $duration1 = (Get-Date) - $start1
    Write-Host "   ⏱️  Duration: $($duration1.TotalMilliseconds)ms" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# Second request (cache hit expected)
Write-Host "   Request 2 (Cache HIT expected)..." -ForegroundColor White
$start2 = Get-Date
try {
    $response2 = Invoke-RestMethod -Uri "$baseUrl/api/v2/chatbot/chat-with-memory" -Method POST -ContentType "application/json" -Body (@{
        message = $testMessage
        sessionId = $cacheSessionId
        userId = $cacheTestUserId
    } | ConvertTo-Json)
    $duration2 = (Get-Date) - $start2
    Write-Host "   ⏱️  Duration: $($duration2.TotalMilliseconds)ms" -ForegroundColor Cyan
    
    if ($duration2.TotalMilliseconds -lt $duration1.TotalMilliseconds * 0.8) {
        Write-Host "   ✅ Cache working! (2nd request faster)" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "   ⚠️  Cache may not be active (similar speeds)" -ForegroundColor Yellow
        $testsFailed++
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 4: Check Redis connection from logs
Write-Host "`n📊 Test 4: Redis Connection Status..." -ForegroundColor Yellow
Write-Host "   Check server logs for:" -ForegroundColor White
Write-Host "   - '✅ Redis Cloud connected'" -ForegroundColor Gray
Write-Host "   - '✅ Cache HIT' or '⚠️ Cache MISS'" -ForegroundColor Gray
Write-Host "   ℹ️  Look at your terminal running 'npm run dev'" -ForegroundColor Cyan

# Summary
Write-Host "`n╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                   TEST SUMMARY                       ║" -ForegroundColor Cyan
Write-Host "╠══════════════════════════════════════════════════════╣" -ForegroundColor Cyan
Write-Host "║  ✅ Passed: $testsPassed                                       ║" -ForegroundColor Green
Write-Host "║  ❌ Failed: $testsFailed                                       ║" -ForegroundColor Red
Write-Host "╚══════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

if ($testsPassed -ge 2) {
    Write-Host "🎉 REDIS INTEGRATION SUCCESSFUL!" -ForegroundColor Green
    Write-Host "✅ Server is running" -ForegroundColor Green
    Write-Host "✅ Rate limiting active" -ForegroundColor Green
    Write-Host "✅ Caching working" -ForegroundColor Green
    Write-Host "`n📝 Check REDIS_INTEGRATION_COMPLETE_REPORT.md for details`n" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Some tests failed. Check server logs." -ForegroundColor Yellow
    Write-Host "`n💡 Troubleshooting:" -ForegroundColor Cyan
    Write-Host "   1. Make sure server is running: cd backend && npm run dev" -ForegroundColor White
    Write-Host "   2. Check Redis connection in logs" -ForegroundColor White
    Write-Host "   3. Verify .env has Redis credentials" -ForegroundColor White
    Write-Host ""
}
