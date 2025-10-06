# AUTO CHECK VERCEL DEPLOYMENT STATUS
param(
    [string]$FrontendUrl = "https://frontend-m6o1xh7ki-kendo260599s-projects.vercel.app",
    [int]$MaxRetries = 10,
    [int]$RetryDelay = 30
)

Write-Host "🔍 AUTO CHECK VERCEL DEPLOYMENT" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   URL: $FrontendUrl" -ForegroundColor Gray
Write-Host "   Max Retries: $MaxRetries" -ForegroundColor Gray
Write-Host "   Retry Delay: $RetryDelay seconds" -ForegroundColor Gray
Write-Host ""

$retryCount = 0
$deploymentReady = $false

while ($retryCount -lt $MaxRetries -and -not $deploymentReady) {
    $retryCount++
    Write-Host "🔄 Attempt $retryCount of $MaxRetries..." -ForegroundColor Cyan
    Write-Host ""
    
    try {
        # Test 1: Check if site is accessible
        Write-Host "   1️⃣ Testing site accessibility..." -ForegroundColor Yellow
        $response = Invoke-WebRequest -Uri $FrontendUrl -Method GET -TimeoutSec 30 -MaximumRedirection 5 -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Host "      ✅ Site is accessible (200 OK)" -ForegroundColor Green
            
            # Test 2: Check content
            Write-Host "   2️⃣ Checking content..." -ForegroundColor Yellow
            $content = $response.Content
            
            $checks = @{
                "SoulFriend" = $content -match "SoulFriend"
                "manifest.json" = $content -match 'rel="manifest"'
                "React App" = $content -match '<div id="root">'
            }
            
            $allChecksPassed = $true
            foreach ($check in $checks.GetEnumerator()) {
                if ($check.Value) {
                    Write-Host "      ✅ $($check.Key): Found" -ForegroundColor Green
                } else {
                    Write-Host "      ⚠️ $($check.Key): Not found" -ForegroundColor Yellow
                    $allChecksPassed = $false
                }
            }
            
            # Test 3: Check deployment timestamp
            Write-Host "   3️⃣ Checking deployment info..." -ForegroundColor Yellow
            $headers = $response.Headers
            if ($headers.ContainsKey('x-vercel-id')) {
                Write-Host "      ✅ Vercel Deployment ID: $($headers['x-vercel-id'])" -ForegroundColor Green
            }
            if ($headers.ContainsKey('date')) {
                Write-Host "      ✅ Last Modified: $($headers['date'])" -ForegroundColor Green
            }
            
            if ($allChecksPassed) {
                Write-Host ""
                Write-Host "   ✅ ALL CHECKS PASSED!" -ForegroundColor Green
                $deploymentReady = $true
            } else {
                Write-Host ""
                Write-Host "   ⚠️ Some checks failed, retrying..." -ForegroundColor Yellow
            }
            
        } else {
            Write-Host "      ⚠️ Unexpected status: $($response.StatusCode)" -ForegroundColor Yellow
        }
        
    } catch {
        $errorMessage = $_.Exception.Message
        
        if ($errorMessage -match "401") {
            Write-Host "      ⚠️ 401 Unauthorized - Site is deploying..." -ForegroundColor Yellow
        } elseif ($errorMessage -match "404") {
            Write-Host "      ⚠️ 404 Not Found - Deployment not ready..." -ForegroundColor Yellow
        } elseif ($errorMessage -match "503") {
            Write-Host "      ⚠️ 503 Service Unavailable - Vercel is building..." -ForegroundColor Yellow
        } else {
            Write-Host "      ⚠️ Error: $errorMessage" -ForegroundColor Yellow
        }
    }
    
    if (-not $deploymentReady -and $retryCount -lt $MaxRetries) {
        Write-Host ""
        Write-Host "   ⏳ Waiting $RetryDelay seconds before next check..." -ForegroundColor Gray
        Start-Sleep -Seconds $RetryDelay
        Write-Host ""
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($deploymentReady) {
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                                                            ║" -ForegroundColor Green
    Write-Host "║     ✅ DEPLOYMENT READY! ✅                            ║" -ForegroundColor Green
    Write-Host "║                                                            ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 YOUR WEBSITE IS LIVE:" -ForegroundColor Yellow
    Write-Host "   $FrontendUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🧪 NEXT STEPS:" -ForegroundColor Yellow
    Write-Host "   1. Open the URL above" -ForegroundColor White
    Write-Host "   2. Press F12 to open DevTools" -ForegroundColor White
    Write-Host "   3. Check Console tab" -ForegroundColor White
    Write-Host "   4. Verify ZERO ERRORS! ✅" -ForegroundColor White
    Write-Host ""
    Write-Host "🎯 EXPECTED CONSOLE OUTPUT:" -ForegroundColor Yellow
    Write-Host "   • Component initialization logs ✅" -ForegroundColor White
    Write-Host "   • AI services initialized ✅" -ForegroundColor White
    Write-Host "   • NO manifest.json errors ✅" -ForegroundColor White
    Write-Host "   • NO localhost errors ✅" -ForegroundColor White
    Write-Host "   • NO SecurityService spam ✅" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║                                                            ║" -ForegroundColor Yellow
    Write-Host "║     ⏳ DEPLOYMENT STILL IN PROGRESS ⏳                 ║" -ForegroundColor Yellow
    Write-Host "║                                                            ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 WHAT TO DO:" -ForegroundColor Yellow
    Write-Host "   1. Wait a few more minutes" -ForegroundColor White
    Write-Host "   2. Check Vercel dashboard:" -ForegroundColor White
    Write-Host "      https://vercel.com/kendo260599s-projects/frontend" -ForegroundColor Cyan
    Write-Host "   3. Or run this script again:" -ForegroundColor White
    Write-Host "      .\check-vercel-deployment.ps1" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "🌸 Check complete!" -ForegroundColor Green
Write-Host ""

