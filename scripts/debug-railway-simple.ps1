# Alternative Railway Debug - Try Multiple Methods

param(
    [string]$RailwayToken = "bf2e7d57-8c34-4441-aad6-7c8ca6c28e81",
    [string]$RailwayUrl = "https://soulfriend-production.up.railway.app"
)

Write-Host "🔍 Railway Debug - Multiple Methods" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Method 1: Direct HTTP Tests
Write-Host "Method 1: Direct HTTP Tests" -ForegroundColor Yellow
Write-Host "---------------------------" -ForegroundColor Gray

# Health Check
Write-Host "`n1.1 Health Check:" -ForegroundColor Cyan
try {
    $health = Invoke-WebRequest -Uri "$RailwayUrl/api/health" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✅ Status: $($health.StatusCode)" -ForegroundColor Green
    $healthJson = $health.Content | ConvertFrom-Json
    Write-Host "   Status: $($healthJson.status)" -ForegroundColor Gray
    Write-Host "   Version: $($healthJson.version)" -ForegroundColor Gray
    if ($healthJson.openai) {
        Write-Host "   OpenAI: $($healthJson.openai)" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "   Status Code: $statusCode" -ForegroundColor Red
        
        if ($statusCode -eq 502) {
            Write-Host "   🚨 502 Bad Gateway - Server not responding!" -ForegroundColor Red
            Write-Host "   Possible causes:" -ForegroundColor Yellow
            Write-Host "   - Server crashed or not started" -ForegroundColor Gray
            Write-Host "   - Port binding issue" -ForegroundColor Gray
            Write-Host "   - Health check failing" -ForegroundColor Gray
        }
    }
}

# OPTIONS Preflight
Write-Host "`n1.2 OPTIONS Preflight (CORS):" -ForegroundColor Cyan
try {
    $options = Invoke-WebRequest -Uri "$RailwayUrl/api/v2/chatbot/message" `
        -Method OPTIONS `
        -Headers @{
            "Origin" = "https://soulfriend-git-main-kendo260599s-projects.vercel.app"
            "Access-Control-Request-Method" = "POST"
            "Access-Control-Request-Headers" = "Content-Type"
        } `
        -TimeoutSec 10 `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "   ✅ Status: $($options.StatusCode)" -ForegroundColor Green
    Write-Host "   CORS Headers:" -ForegroundColor Gray
    if ($options.Headers.'Access-Control-Allow-Origin') {
        Write-Host "     ✅ Access-Control-Allow-Origin: $($options.Headers.'Access-Control-Allow-Origin')" -ForegroundColor Green
    } else {
        Write-Host "     ❌ Missing Access-Control-Allow-Origin header!" -ForegroundColor Red
    }
    if ($options.Headers.'Access-Control-Allow-Methods') {
        Write-Host "     ✅ Access-Control-Allow-Methods: $($options.Headers.'Access-Control-Allow-Methods')" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "   Status Code: $statusCode" -ForegroundColor Red
        
        if ($statusCode -eq 502) {
            Write-Host "   🚨 502 Bad Gateway - Server not responding to OPTIONS!" -ForegroundColor Red
        }
    }
}

# POST Test
Write-Host "`n1.3 POST Chatbot Message:" -ForegroundColor Cyan
try {
    $postBody = @{
        message = "test"
        userId = "debug-test"
        sessionId = "debug-session-$(Get-Date -Format 'yyyyMMddHHmmss')"
    } | ConvertTo-Json
    
    $post = Invoke-WebRequest -Uri "$RailwayUrl/api/v2/chatbot/message" `
        -Method POST `
        -Headers @{
            "Origin" = "https://soulfriend-git-main-kendo260599s-projects.vercel.app"
            "Content-Type" = "application/json"
        } `
        -Body $postBody `
        -TimeoutSec 30 `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "   ✅ Status: $($post.StatusCode)" -ForegroundColor Green
    $postJson = $post.Content | ConvertFrom-Json
    if ($postJson.success) {
        Write-Host "   ✅ Response received successfully" -ForegroundColor Green
        Write-Host "   Message: $($postJson.data.message.Substring(0, [Math]::Min(100, $postJson.data.message.Length)))..." -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "   Status Code: $statusCode" -ForegroundColor Red
    }
}

Write-Host ""

# Method 2: Railway CLI
Write-Host "Method 2: Railway CLI" -ForegroundColor Yellow
Write-Host "-------------------" -ForegroundColor Gray

try {
    $railwayVersion = railway --version 2>&1
    if ($railwayVersion -match "railway") {
        Write-Host "✅ Railway CLI installed: $railwayVersion" -ForegroundColor Green
        
        # Try to use token
        $env:RAILWAY_TOKEN = $RailwayToken
        Write-Host "`n   Set RAILWAY_TOKEN environment variable" -ForegroundColor Gray
        
        # Check whoami
        $whoami = railway whoami 2>&1
        if ($whoami -notmatch "Unauthorized" -and $whoami -notmatch "not logged" -and $whoami -notmatch "Error") {
            Write-Host "✅ Logged in: $whoami" -ForegroundColor Green
            
            Write-Host "`n   Service Status:" -ForegroundColor Cyan
            railway status 2>&1 | Out-Host
            
            Write-Host "`n   Recent Logs (last 30 lines):" -ForegroundColor Cyan
            railway logs --tail 30 2>&1 | Out-Host
        } else {
            Write-Host "⚠️  Not logged in via CLI" -ForegroundColor Yellow
            Write-Host "   Try: railway login" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ Railway CLI not found" -ForegroundColor Red
        Write-Host "   Install: npm install -g @railway/cli" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  Railway CLI not available" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "📋 Analysis Summary" -ForegroundColor Yellow
Write-Host ""

# Determine issue
if ($health.StatusCode -eq 502 -or $options.StatusCode -eq 502) {
    Write-Host "🚨 PRIMARY ISSUE: 502 Bad Gateway" -ForegroundColor Red
    Write-Host ""
    Write-Host "Server is not responding. Possible causes:" -ForegroundColor Yellow
    Write-Host "1. Server crashed during startup" -ForegroundColor White
    Write-Host "2. Port binding issue (Railway PORT variable mismatch)" -ForegroundColor White
    Write-Host "3. Database connection timeout blocking startup" -ForegroundColor White
    Write-Host "4. Health check timeout causing Railway to mark service unhealthy" -ForegroundColor White
    Write-Host ""
    Write-Host "Recommended fixes:" -ForegroundColor Cyan
    Write-Host "1. Check Railway Deploy Logs for errors" -ForegroundColor White
    Write-Host "2. Verify PORT environment variable matches Railway assigned port" -ForegroundColor White
    Write-Host "3. Make database connection non-blocking" -ForegroundColor White
    Write-Host "4. Increase health check timeout in railway.json" -ForegroundColor White
} elseif ($health.StatusCode -eq 200) {
    Write-Host "✅ Health endpoint working!" -ForegroundColor Green
    if ($options.StatusCode -ne 204 -and $options.StatusCode -ne 200) {
        Write-Host "⚠️  OPTIONS preflight failing - CORS issue!" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ Debug complete!" -ForegroundColor Green

