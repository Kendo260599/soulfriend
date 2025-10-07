# ═══════════════════════════════════════════════════════════════
# TEST DEPLOYMENT STATUS - SoulFriend
# Kiểm tra trạng thái deployment toàn diện
# ═══════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                           ║" -ForegroundColor Cyan
Write-Host "║     🧪 TEST DEPLOYMENT STATUS - SOULFRIEND 🌸          ║" -ForegroundColor Cyan
Write-Host "║                                                           ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$results = @{
    GitHub = @{ Status = "Unknown"; Details = "" }
    Vercel = @{ Status = "Unknown"; Details = "" }
    Render = @{ Status = "Unknown"; Details = "" }
    Integration = @{ Status = "Unknown"; Details = "" }
}

# ═══════════════════════════════════════════════════════════════
# 1. TEST GITHUB CONNECTION
# ═══════════════════════════════════════════════════════════════

Write-Host "📦 [1/4] Testing GitHub Connection..." -ForegroundColor Yellow
Write-Host ""

try {
    $gitRemote = git remote -v 2>&1
    if ($LASTEXITCODE -eq 0 -and $gitRemote -match "github.com") {
        $results.GitHub.Status = "✅ Connected"
        $remoteLine = ($gitRemote | Select-Object -First 1).ToString()
        if ($remoteLine -match 'https://github.com/([^/]+)/([^.]+)\.git') {
            $results.GitHub.Details = "Repo: $($matches[1])/$($matches[2])"
        }
        Write-Host "   ✅ GitHub: Connected" -ForegroundColor Green
        Write-Host "   📍 $($results.GitHub.Details)" -ForegroundColor Gray
    } else {
        $results.GitHub.Status = "❌ Not Connected"
        $results.GitHub.Details = "No GitHub remote found"
        Write-Host "   ❌ GitHub: Not Connected" -ForegroundColor Red
    }
} catch {
    $results.GitHub.Status = "❌ Error"
    $results.GitHub.Details = $_.Exception.Message
    Write-Host "   ❌ GitHub: Error - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════
# 2. TEST VERCEL DEPLOYMENT (Frontend)
# ═══════════════════════════════════════════════════════════════

Write-Host "🌐 [2/4] Testing Vercel Deployment..." -ForegroundColor Yellow
Write-Host ""

$vercelUrl = "https://soulfriend-bh3r4zttm-kendo260599s-projects.vercel.app"

try {
    $response = Invoke-WebRequest -Uri $vercelUrl -Method GET -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        $results.Vercel.Status = "✅ Online"
        $contentLength = $response.Content.Length
        $results.Vercel.Details = "Status: $($response.StatusCode), Size: $contentLength bytes"
        
        Write-Host "   ✅ Vercel: Online (Status $($response.StatusCode))" -ForegroundColor Green
        Write-Host "   📍 URL: $vercelUrl" -ForegroundColor Gray
        Write-Host "   📊 Content: $contentLength bytes" -ForegroundColor Gray
        
        # Check if content contains React app markers
        if ($response.Content -match 'root' -or $response.Content -match 'React') {
            Write-Host "   ✅ React app detected" -ForegroundColor Green
        }
    } else {
        $results.Vercel.Status = "⚠️ Unexpected Status"
        $results.Vercel.Details = "Status: $($response.StatusCode)"
        Write-Host "   ⚠️ Vercel: Unexpected Status $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    $results.Vercel.Status = "❌ Offline"
    $results.Vercel.Details = $_.Exception.Message
    Write-Host "   ❌ Vercel: Offline - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════
# 3. TEST RENDER BACKEND
# ═══════════════════════════════════════════════════════════════

Write-Host "🖥️  [3/4] Testing Render Backend..." -ForegroundColor Yellow
Write-Host ""

$renderUrl = "https://soulfriend-api.onrender.com/api/health"

try {
    $response = Invoke-RestMethod -Uri $renderUrl -Method GET -TimeoutSec 15 -ErrorAction Stop
    
    if ($response.status -eq "healthy") {
        $results.Render.Status = "✅ Healthy"
        $results.Render.Details = "Chatbot: $($response.chatbot), Gemini: $($response.gemini), Model: $($response.model)"
        
        Write-Host "   ✅ Render: Healthy" -ForegroundColor Green
        Write-Host "   📍 URL: $renderUrl" -ForegroundColor Gray
        Write-Host "   🤖 Chatbot: $($response.chatbot)" -ForegroundColor Gray
        Write-Host "   🧠 Gemini: $($response.gemini)" -ForegroundColor Gray
        Write-Host "   📦 Model: $($response.model)" -ForegroundColor Gray
        Write-Host "   🌐 CORS: $($response.cors)" -ForegroundColor Gray
    } else {
        $results.Render.Status = "⚠️ Unhealthy"
        $results.Render.Details = "Status: $($response.status)"
        Write-Host "   ⚠️ Render: Unhealthy - $($response.status)" -ForegroundColor Yellow
    }
} catch {
    $results.Render.Status = "❌ Offline"
    $results.Render.Details = $_.Exception.Message
    Write-Host "   ❌ Render: Offline - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════
# 4. TEST INTEGRATION
# ═══════════════════════════════════════════════════════════════

Write-Host "🔗 [4/4] Testing Integration..." -ForegroundColor Yellow
Write-Host ""

$allOk = $true
foreach ($key in @("GitHub", "Vercel", "Render")) {
    if ($results[$key].Status -notmatch "✅") {
        $allOk = $false
        break
    }
}

if ($allOk) {
    $results.Integration.Status = "✅ All Systems Operational"
    $results.Integration.Details = "GitHub, Vercel, and Render are all working"
    Write-Host "   ✅ Integration: All Systems Operational" -ForegroundColor Green
} else {
    $results.Integration.Status = "⚠️ Some Issues Detected"
    $failedSystems = @()
    foreach ($key in $results.Keys) {
        if ($key -ne "Integration" -and $results[$key].Status -match "❌|⚠️") {
            $failedSystems += $key
        }
    }
    $results.Integration.Details = "Issues with: $($failedSystems -join ', ')"
    Write-Host "   ⚠️ Integration: Some Issues Detected" -ForegroundColor Yellow
    Write-Host "   ⚠️ Issues with: $($failedSystems -join ', ')" -ForegroundColor Yellow
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════
# SUMMARY REPORT
# ═══════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                 📊 DEPLOYMENT SUMMARY                     ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

foreach ($key in $results.Keys) {
    $status = $results[$key].Status
    $details = $results[$key].Details
    
    $color = "White"
    if ($status -match "✅") { $color = "Green" }
    elseif ($status -match "⚠️") { $color = "Yellow" }
    elseif ($status -match "❌") { $color = "Red" }
    
    Write-Host "  $($key.PadRight(15)): $status" -ForegroundColor $color
    if ($details) {
        Write-Host "  $(' ' * 17)$details" -ForegroundColor Gray
    }
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════
# FINAL STATUS
# ═══════════════════════════════════════════════════════════════

if ($allOk) {
    Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                                                           ║" -ForegroundColor Green
    Write-Host "║             🎉 ALL SYSTEMS OPERATIONAL! 🎉              ║" -ForegroundColor Green
    Write-Host "║                                                           ║" -ForegroundColor Green
    Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Frontend:  $vercelUrl" -ForegroundColor Cyan
    Write-Host "🖥️  Backend:   https://soulfriend-api.onrender.com" -ForegroundColor Cyan
    Write-Host "📦 GitHub:    https://github.com/Kendo260599/soulfriend" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "✅ Your application is LIVE and ready to use!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║                                                           ║" -ForegroundColor Yellow
    Write-Host "║             ⚠️  ACTION REQUIRED  ⚠️                     ║" -ForegroundColor Yellow
    Write-Host "║                                                           ║" -ForegroundColor Yellow
    Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please review the issues above and:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Check BAO_CAO_DEPLOYMENT_TOAN_DIEN.md for details" -ForegroundColor White
    Write-Host "2. Verify environment variables on Render" -ForegroundColor White
    Write-Host "3. Check deployment logs" -ForegroundColor White
    Write-Host "4. Contact support if needed" -ForegroundColor White
    Write-Host ""
}

Write-Host "📋 Full report: BAO_CAO_DEPLOYMENT_TOAN_DIEN.md" -ForegroundColor Gray
Write-Host "📅 Test completed: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

