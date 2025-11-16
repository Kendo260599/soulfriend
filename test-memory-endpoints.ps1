# Test Memory System Endpoints
# Run this after deploying to Render with ENABLE_TEST_ROUTES=true

$baseUrl = "https://soulfriend-api.onrender.com/api/test/memory"
$userId = "test_user_$(Get-Date -Format 'yyyyMMddHHmmss')"

Write-Host "`n🧪 Testing Memory System on Render`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "Test 1: Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✅ Health: $($health | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health check failed: $_" -ForegroundColor Red
}

# Test 2: Working Memory
Write-Host "`nTest 2: Working Memory..." -ForegroundColor Yellow
try {
    $workingMemory = Invoke-RestMethod -Uri "$baseUrl/working-memory" -Method Post
    Write-Host "✅ Working Memory: Session ID = $($workingMemory.sessionId)" -ForegroundColor Green
    Write-Host "   Emotion: $($workingMemory.data.emotion), Intent: $($workingMemory.data.intent)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Working memory failed: $_" -ForegroundColor Red
}

# Test 3: Short-term Memory
Write-Host "`nTest 3: Short-term Memory..." -ForegroundColor Yellow
try {
    $body = @{ userId = $userId } | ConvertTo-Json
    $shortTerm = Invoke-RestMethod -Uri "$baseUrl/short-term-memory" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✅ Short-term Memory: Saved $($shortTerm.count) interactions" -ForegroundColor Green
    Write-Host "   Latest: $($shortTerm.interactions[0].message)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Short-term memory failed: $_" -ForegroundColor Red
}

# Test 4: Long-term Memory (Pinecone + OpenAI)
Write-Host "`nTest 4: Long-term Memory with Semantic Search..." -ForegroundColor Yellow
Write-Host "   (This will take ~5 seconds due to embedding generation and indexing)" -ForegroundColor Gray
try {
    $body = @{ userId = $userId } | ConvertTo-Json
    $longTerm = Invoke-RestMethod -Uri "$baseUrl/long-term-memory" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 30
    Write-Host "✅ Long-term Memory: Found $($longTerm.relevantMemories.Count) relevant memories" -ForegroundColor Green
    Write-Host "   Query: $($longTerm.query)" -ForegroundColor Gray
    foreach ($memory in $longTerm.relevantMemories) {
        Write-Host "   - [$($memory.type)] $($memory.content) (confidence: $($memory.confidence))" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Long-term memory failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   This may be due to OpenAI API rate limits or Pinecone indexing delay" -ForegroundColor Yellow
}

# Test 5: Pinecone Stats
Write-Host "`nTest 5: Pinecone Vector Database Stats..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$baseUrl/pinecone-stats" -Method Get
    Write-Host "✅ Pinecone Stats:" -ForegroundColor Green
    Write-Host "   - Dimension: $($stats.stats.dimension)" -ForegroundColor Gray
    Write-Host "   - Total vectors: $($stats.stats.totalRecordCount)" -ForegroundColor Gray
    Write-Host "   - Index fullness: $($stats.stats.indexFullness * 100)%" -ForegroundColor Gray
} catch {
    Write-Host "❌ Pinecone stats failed: $_" -ForegroundColor Red
}

# Test 6: Memory Stats
Write-Host "`nTest 6: Memory Statistics for User..." -ForegroundColor Yellow
try {
    $memStats = Invoke-RestMethod -Uri "$baseUrl/memory-stats/$userId" -Method Get
    Write-Host "✅ Memory Stats for $userId" -ForegroundColor Green
    Write-Host "   - Short-term memories: $($memStats.stats.shortTermCount)" -ForegroundColor Gray
    Write-Host "   - Long-term memories: $($memStats.stats.longTermCount)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Memory stats failed: $_" -ForegroundColor Red
}

# Test 7: GDPR Deletion
Write-Host "`nTest 7: GDPR-compliant User Memory Deletion..." -ForegroundColor Yellow
try {
    $delete = Invoke-RestMethod -Uri "$baseUrl/user-memories/$userId" -Method Delete
    Write-Host "✅ Deleted memories for user: $userId" -ForegroundColor Green
    Write-Host "   $($delete.message)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Deletion failed: $_" -ForegroundColor Red
}

Write-Host "`n🎉 Memory System Test Complete!`n" -ForegroundColor Cyan
