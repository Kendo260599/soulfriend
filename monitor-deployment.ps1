# MONITOR DEPLOYMENT PROGRESS
# Check every 30 seconds until endpoints are live

Write-Host "`n⏱️  MONITORING DEPLOYMENT PROGRESS`n" -ForegroundColor Cyan
Write-Host "Checking endpoints every 30 seconds..."
Write-Host "Press Ctrl+C to stop monitoring`n"

$maxAttempts = 20  # 20 attempts x 30 sec = 10 minutes max
$attempt = 0
$deployed = $false

while ($attempt -lt $maxAttempts -and -not $deployed) {
    $attempt++
    $timestamp = Get-Date -Format "HH:mm:ss"
    
    Write-Host "[$timestamp] Attempt $attempt/$maxAttempts..." -ForegroundColor Gray
    
    try {
        # Check HITL endpoint
        $hitlUrl = "https://soulfriend-api.onrender.com/api/hitl-feedback/metrics"
        $response = Invoke-RestMethod -Uri $hitlUrl -Method Get -TimeoutSec 5 -ErrorAction Stop
        
        Write-Host "[$timestamp] ✅ HITL Endpoint is LIVE!" -ForegroundColor Green
        
        # Check Conversation Learning endpoint
        $learningUrl = "https://soulfriend-api.onrender.com/api/conversation-learning/insights"
        $response2 = Invoke-RestMethod -Uri $learningUrl -Method Get -TimeoutSec 5 -ErrorAction Stop
        
        Write-Host "[$timestamp] ✅ Conversation Learning is LIVE!" -ForegroundColor Green
        Write-Host "`n🎉 DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
        $deployed = $true
        
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 404) {
            Write-Host "[$timestamp] ⏳ Still deploying... (404)" -ForegroundColor Yellow
        } elseif ($statusCode -eq 500) {
            Write-Host "[$timestamp] ⚠️  Deployed but has errors (500)" -ForegroundColor Yellow
            $deployed = $true  # Consider as deployed with errors
        } else {
            Write-Host "[$timestamp] ⏳ Waiting... ($($_.Exception.Message))" -ForegroundColor Gray
        }
    }
    
    if (-not $deployed) {
        Start-Sleep -Seconds 30
    }
}

if ($deployed) {
    Write-Host "`n✅ Endpoints are now available!" -ForegroundColor Green
    Write-Host "`n📊 Running full verification..." -ForegroundColor Cyan
    & powershell -ExecutionPolicy Bypass -File verify-deployment.ps1
} else {
    Write-Host "`n⏰ Timeout: Deployment taking longer than expected" -ForegroundColor Yellow
    Write-Host "Check manually: https://dashboard.render.com" -ForegroundColor Gray
}

