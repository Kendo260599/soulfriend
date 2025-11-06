# Quick Test với Token mới

$env:RAILWAY_TOKEN = "fdbe56ee-390e-4bf7-b079-8b722a028a57"
$railwayUrl = "https://soulfriend-production.up.railway.app"

Write-Host "🔍 Testing Railway với Token mới" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Test Health
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "$railwayUrl/api/health" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Status: $($health.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $healthJson = $health.Content | ConvertFrom-Json
    Write-Host "  Status: $($healthJson.status)" -ForegroundColor Gray
    Write-Host "  Version: $($healthJson.version)" -ForegroundColor Gray
    Write-Host "  Uptime: $([math]::Round($healthJson.uptime, 2))s" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host ""

# Test OPTIONS
Write-Host "Test 2: OPTIONS (CORS Preflight)" -ForegroundColor Yellow
try {
    $options = Invoke-WebRequest -Uri "$railwayUrl/api/v2/chatbot/message" `
        -Method OPTIONS `
        -Headers @{
            "Origin" = "https://soulfriend-git-main-kendo260599s-projects.vercel.app"
            "Access-Control-Request-Method" = "POST"
            "Access-Control-Request-Headers" = "Content-Type"
        } `
        -TimeoutSec 10 `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "✅ Status: $($options.StatusCode)" -ForegroundColor Green
    Write-Host "CORS Headers:" -ForegroundColor Gray
    if ($options.Headers.'Access-Control-Allow-Origin') {
        Write-Host "  ✅ Access-Control-Allow-Origin: $($options.Headers.'Access-Control-Allow-Origin')" -ForegroundColor Green
    }
    if ($options.Headers.'Access-Control-Allow-Methods') {
        Write-Host "  ✅ Access-Control-Allow-Methods: $($options.Headers.'Access-Control-Allow-Methods')" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host ""

# Test Railway CLI
Write-Host "Test 3: Railway CLI Status" -ForegroundColor Yellow
try {
    $whoami = railway whoami 2>&1
    if ($whoami -notmatch "Unauthorized" -and $whoami -notmatch "not logged" -and $whoami -notmatch "Error") {
        Write-Host "✅ Railway CLI logged in" -ForegroundColor Green
        
        Write-Host "`nRecent Logs:" -ForegroundColor Cyan
        railway logs --tail 20 2>&1 | Out-Host
    } else {
        Write-Host "⚠️  Railway CLI not logged in" -ForegroundColor Yellow
        Write-Host "   Set token: `$env:RAILWAY_TOKEN = 'fdbe56ee-390e-4bf7-b079-8b722a028a57'" -ForegroundColor Gray
        Write-Host "   Then run: railway login" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  Railway CLI not available" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Test complete!" -ForegroundColor Green



$env:RAILWAY_TOKEN = "fdbe56ee-390e-4bf7-b079-8b722a028a57"
$railwayUrl = "https://soulfriend-production.up.railway.app"

Write-Host "🔍 Testing Railway với Token mới" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Test Health
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "$railwayUrl/api/health" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Status: $($health.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $healthJson = $health.Content | ConvertFrom-Json
    Write-Host "  Status: $($healthJson.status)" -ForegroundColor Gray
    Write-Host "  Version: $($healthJson.version)" -ForegroundColor Gray
    Write-Host "  Uptime: $([math]::Round($healthJson.uptime, 2))s" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host ""

# Test OPTIONS
Write-Host "Test 2: OPTIONS (CORS Preflight)" -ForegroundColor Yellow
try {
    $options = Invoke-WebRequest -Uri "$railwayUrl/api/v2/chatbot/message" `
        -Method OPTIONS `
        -Headers @{
            "Origin" = "https://soulfriend-git-main-kendo260599s-projects.vercel.app"
            "Access-Control-Request-Method" = "POST"
            "Access-Control-Request-Headers" = "Content-Type"
        } `
        -TimeoutSec 10 `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "✅ Status: $($options.StatusCode)" -ForegroundColor Green
    Write-Host "CORS Headers:" -ForegroundColor Gray
    if ($options.Headers.'Access-Control-Allow-Origin') {
        Write-Host "  ✅ Access-Control-Allow-Origin: $($options.Headers.'Access-Control-Allow-Origin')" -ForegroundColor Green
    }
    if ($options.Headers.'Access-Control-Allow-Methods') {
        Write-Host "  ✅ Access-Control-Allow-Methods: $($options.Headers.'Access-Control-Allow-Methods')" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host ""

# Test Railway CLI
Write-Host "Test 3: Railway CLI Status" -ForegroundColor Yellow
try {
    $whoami = railway whoami 2>&1
    if ($whoami -notmatch "Unauthorized" -and $whoami -notmatch "not logged" -and $whoami -notmatch "Error") {
        Write-Host "✅ Railway CLI logged in" -ForegroundColor Green
        
        Write-Host "`nRecent Logs:" -ForegroundColor Cyan
        railway logs --tail 20 2>&1 | Out-Host
    } else {
        Write-Host "⚠️  Railway CLI not logged in" -ForegroundColor Yellow
        Write-Host "   Set token: `$env:RAILWAY_TOKEN = 'fdbe56ee-390e-4bf7-b079-8b722a028a57'" -ForegroundColor Gray
        Write-Host "   Then run: railway login" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  Railway CLI not available" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Test complete!" -ForegroundColor Green












