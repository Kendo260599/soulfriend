# Check latest Vercel deployment
$ErrorActionPreference = "Continue"

# Load tokens
if (Test-Path ".env.vercel") {
    Get-Content ".env.vercel" | ForEach-Object {
        if ($_ -match '^VERCEL_TOKEN=(.+)$') { $env:VERCEL_TOKEN = $matches[1] }
        if ($_ -match '^VERCEL_PROJECT_ID=(.+)$') { $env:VERCEL_PROJECT_ID = $matches[1] }
    }
}

$headers = @{
    "Authorization" = "Bearer $env:VERCEL_TOKEN"
}

try {
    $url = "https://api.vercel.com/v6/deployments?projectId=$env:VERCEL_PROJECT_ID&limit=1"
    $response = Invoke-RestMethod -Uri $url -Headers $headers -Method GET
    
    if ($response.deployments -and $response.deployments.Count -gt 0) {
        $latest = $response.deployments[0]
        $createdTime = [datetime]$latest.createdAt
        $elapsed = (Get-Date) - $createdTime
        
        $result = @{
            url = "https://$($latest.url)"
            state = $latest.state
            ready = $latest.readyState
            age_minutes = [math]::Round($elapsed.TotalMinutes, 1)
            created = $latest.createdAt
        }
        
        $result | ConvertTo-Json | Out-File "deployment-status.json" -Encoding UTF8
        
        Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
        Write-Host "║                                                            ║" -ForegroundColor Cyan
        Write-Host "║     📊 LATEST VERCEL DEPLOYMENT 📊                    ║" -ForegroundColor Cyan
        Write-Host "║                                                            ║" -ForegroundColor Cyan
        Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "🌐 URL:" -ForegroundColor Yellow
        Write-Host "   $($result.url)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📊 STATUS:" -ForegroundColor Yellow
        Write-Host "   State: $($result.state)" -ForegroundColor $(if ($result.state -eq 'READY') { 'Green' } else { 'Yellow' })
        Write-Host "   Ready: $($result.ready)" -ForegroundColor $(if ($result.ready -eq 'READY') { 'Green' } else { 'Yellow' })
        Write-Host "   Age: $($result.age_minutes) minutes ago" -ForegroundColor Gray
        Write-Host ""
        
        if ($result.state -eq 'READY' -and $result.ready -eq 'READY') {
            Write-Host "✅ DEPLOYMENT IS LIVE!" -ForegroundColor Green
            Write-Host ""
            Write-Host "🧪 TEST NOW:" -ForegroundColor Yellow
            Write-Host "   1. Open: $($result.url)" -ForegroundColor White
            Write-Host "   2. Press F12 for DevTools" -ForegroundColor White
            Write-Host "   3. Check Console tab" -ForegroundColor White
            Write-Host "   4. Test chatbot AI" -ForegroundColor White
        } else {
            Write-Host "⏳ Still deploying..." -ForegroundColor Yellow
            Write-Host "   Please wait a few more minutes" -ForegroundColor Gray
        }
        Write-Host ""
        
    } else {
        Write-Host "❌ No deployments found" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Error checking deployment:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Gray
}


