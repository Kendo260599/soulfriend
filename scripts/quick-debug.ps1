# Quick Railway Debug Script - Run this and share output

Write-Host "🔍 Railway Quick Debug" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

$railwayUrl = "https://soulfriend-production.up.railway.app"

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "$railwayUrl/api/health" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Status: $($health.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    Write-Host $health.Content -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host "`n"

# Test 2: OPTIONS Preflight
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
        Write-Host "  Access-Control-Allow-Origin: $($options.Headers.'Access-Control-Allow-Origin')" -ForegroundColor Gray
    }
    if ($options.Headers.'Access-Control-Allow-Methods') {
        Write-Host "  Access-Control-Allow-Methods: $($options.Headers.'Access-Control-Allow-Methods')" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        Write-Host "Response:" -ForegroundColor Gray
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host $responseBody -ForegroundColor Gray
        } catch {}
    }
}

Write-Host "`n"

# Test 3: Check Railway CLI
Write-Host "Test 3: Railway CLI Status" -ForegroundColor Yellow
try {
    $railwayVersion = railway --version 2>&1
    if ($railwayVersion -match "railway") {
        Write-Host "✅ Railway CLI installed: $railwayVersion" -ForegroundColor Green
        
        $whoami = railway whoami 2>&1
        if ($whoami -notmatch "Unauthorized" -and $whoami -notmatch "not logged") {
            Write-Host "✅ Logged in: $whoami" -ForegroundColor Green
            
            Write-Host "`nRailway Status:" -ForegroundColor Cyan
            railway status 2>&1 | Out-Host
            
            Write-Host "`nRecent Logs (last 20 lines):" -ForegroundColor Cyan
            railway logs --tail 20 2>&1 | Out-Host
        } else {
            Write-Host "❌ Not logged in. Run: railway login" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Railway CLI not found. Install: npm install -g @railway/cli" -ForegroundColor Red
    }
} catch {
    Write-Host "⚠️  Railway CLI not available" -ForegroundColor Yellow
}

Write-Host "`n"
Write-Host "✅ Debug complete! Copy output above and share with assistant." -ForegroundColor Green



Write-Host "🔍 Railway Quick Debug" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

$railwayUrl = "https://soulfriend-production.up.railway.app"

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "$railwayUrl/api/health" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Status: $($health.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    Write-Host $health.Content -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host "`n"

# Test 2: OPTIONS Preflight
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
        Write-Host "  Access-Control-Allow-Origin: $($options.Headers.'Access-Control-Allow-Origin')" -ForegroundColor Gray
    }
    if ($options.Headers.'Access-Control-Allow-Methods') {
        Write-Host "  Access-Control-Allow-Methods: $($options.Headers.'Access-Control-Allow-Methods')" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        Write-Host "Response:" -ForegroundColor Gray
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host $responseBody -ForegroundColor Gray
        } catch {}
    }
}

Write-Host "`n"

# Test 3: Check Railway CLI
Write-Host "Test 3: Railway CLI Status" -ForegroundColor Yellow
try {
    $railwayVersion = railway --version 2>&1
    if ($railwayVersion -match "railway") {
        Write-Host "✅ Railway CLI installed: $railwayVersion" -ForegroundColor Green
        
        $whoami = railway whoami 2>&1
        if ($whoami -notmatch "Unauthorized" -and $whoami -notmatch "not logged") {
            Write-Host "✅ Logged in: $whoami" -ForegroundColor Green
            
            Write-Host "`nRailway Status:" -ForegroundColor Cyan
            railway status 2>&1 | Out-Host
            
            Write-Host "`nRecent Logs (last 20 lines):" -ForegroundColor Cyan
            railway logs --tail 20 2>&1 | Out-Host
        } else {
            Write-Host "❌ Not logged in. Run: railway login" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Railway CLI not found. Install: npm install -g @railway/cli" -ForegroundColor Red
    }
} catch {
    Write-Host "⚠️  Railway CLI not available" -ForegroundColor Yellow
}

Write-Host "`n"
Write-Host "✅ Debug complete! Copy output above and share with assistant." -ForegroundColor Green










