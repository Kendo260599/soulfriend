# REAL-TIME DEPLOYMENT MONITOR
Write-Host "🔴 LIVE DEPLOYMENT MONITOR" -ForegroundColor Red
Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Gray
Write-Host ""

$iteration = 0
$deploymentSuccess = $false

while (-not $deploymentSuccess) {
    $iteration++
    Clear-Host
    
    Write-Host "🔴 LIVE DEPLOYMENT MONITOR" -ForegroundColor Red
    Write-Host "Iteration: $iteration | $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
    Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    # Check Backend
    Write-Host "🖥️ BACKEND (Render):" -ForegroundColor Yellow
    try {
        $backendResponse = Invoke-WebRequest -Uri "https://soulfriend-api.onrender.com/api/health" -Method GET -TimeoutSec 10
        if ($backendResponse.StatusCode -eq 200) {
            $backendData = $backendResponse.Content | ConvertFrom-Json
            Write-Host "   ✅ Online" -ForegroundColor Green
            Write-Host "   Status: $($backendData.status)" -ForegroundColor Gray
            Write-Host "   AI: $($backendData.gemini)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "   ❌ Offline" -ForegroundColor Red
    }
    
    Write-Host ""
    
    # Check Frontend
    Write-Host "🌐 FRONTEND (Vercel):" -ForegroundColor Yellow
    try {
        $frontendResponse = Invoke-WebRequest -Uri "https://frontend-m6o1xh7ki-kendo260599s-projects.vercel.app" -Method GET -TimeoutSec 10 -MaximumRedirection 5
        if ($frontendResponse.StatusCode -eq 200) {
            Write-Host "   ✅ DEPLOYED & ONLINE!" -ForegroundColor Green
            $content = $frontendResponse.Content
            
            # Check for key elements
            $hasSoulFriend = $content -match "SoulFriend"
            $hasManifest = $content -match 'rel="manifest"'
            $hasRoot = $content -match '<div id="root">'
            
            if ($hasSoulFriend) { Write-Host "   ✅ SoulFriend app detected" -ForegroundColor Green }
            if ($hasManifest) { Write-Host "   ✅ Manifest configured" -ForegroundColor Green }
            if ($hasRoot) { Write-Host "   ✅ React root present" -ForegroundColor Green }
            
            if ($hasSoulFriend -and $hasManifest -and $hasRoot) {
                $deploymentSuccess = $true
                Write-Host ""
                Write-Host "   🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
            }
        }
    } catch {
        $errorMsg = $_.Exception.Message
        if ($errorMsg -match "401") {
            Write-Host "   ⏳ Deploying... (401 Auth)" -ForegroundColor Yellow
        } elseif ($errorMsg -match "404") {
            Write-Host "   ⏳ Building... (404)" -ForegroundColor Yellow
        } elseif ($errorMsg -match "503") {
            Write-Host "   ⏳ Starting... (503)" -ForegroundColor Yellow
        } else {
            Write-Host "   ⏳ In Progress..." -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
    
    if (-not $deploymentSuccess) {
        Write-Host ""
        Write-Host "⏳ Next check in 15 seconds..." -ForegroundColor Gray
        Start-Sleep -Seconds 15
    }
}

# Success!
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "║     🎉 DEPLOYMENT SUCCESSFUL! 🎉                       ║" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 YOUR WEBSITE:" -ForegroundColor Yellow
Write-Host "   https://frontend-m6o1xh7ki-kendo260599s-projects.vercel.app" -ForegroundColor Cyan
Write-Host ""
Write-Host "🧪 TEST NOW:" -ForegroundColor Yellow
Write-Host "   1. Open URL above" -ForegroundColor White
Write-Host "   2. Press F12 for DevTools" -ForegroundColor White
Write-Host "   3. Check Console tab" -ForegroundColor White
Write-Host "   4. Verify: ZERO ERRORS! ✅" -ForegroundColor White
Write-Host ""
Write-Host "🎯 EXPECTED CONSOLE:" -ForegroundColor Yellow
Write-Host "   ✅ Component initialization" -ForegroundColor Green
Write-Host "   ✅ Services initialized" -ForegroundColor Green
Write-Host "   ❌ NO manifest.json errors" -ForegroundColor Green
Write-Host "   ❌ NO localhost errors" -ForegroundColor Green
Write-Host "   ❌ NO SecurityService spam" -ForegroundColor Green
Write-Host ""
Write-Host "🌸 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host ""

