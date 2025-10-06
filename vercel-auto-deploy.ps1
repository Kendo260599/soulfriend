# VERCEL AUTO DEPLOY WITH API TOKEN
param(
    [string]$Token = $env:VERCEL_TOKEN,
    [string]$ProjectId = "frontend",
    [string]$TeamId = "kendo260599s-projects"
)

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "║     🚀 VERCEL AUTO DEPLOY VIA API 🚀                  ║" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check for token
if (-not $Token) {
    Write-Host "❌ ERROR: VERCEL_TOKEN not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 TO SET TOKEN:" -ForegroundColor Yellow
    Write-Host "   `$env:VERCEL_TOKEN = 'your_token_here'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 OR create .env.vercel file:" -ForegroundColor Yellow
    Write-Host "   VERCEL_TOKEN=your_token_here" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🔗 Get token at:" -ForegroundColor Yellow
    Write-Host "   https://vercel.com/account/tokens" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📖 See VERCEL_API_SETUP.md for detailed instructions" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host "✅ Token found: ${Token.Substring(0, 10)}..." -ForegroundColor Green
Write-Host ""

# Load .env.vercel if exists
if (Test-Path ".env.vercel") {
    Write-Host "📄 Loading .env.vercel..." -ForegroundColor Yellow
    Get-Content ".env.vercel" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.+)$') {
            $key = $matches[1]
            $value = $matches[2]
            Set-Item -Path "env:$key" -Value $value
            Write-Host "   ✅ Loaded: $key" -ForegroundColor Green
        }
    }
    Write-Host ""
    
    # Update variables from .env
    if ($env:VERCEL_PROJECT_ID) { $ProjectId = $env:VERCEL_PROJECT_ID }
    if ($env:VERCEL_ORG_ID) { $TeamId = $env:VERCEL_ORG_ID }
}

Write-Host "📊 Deployment Configuration:" -ForegroundColor Cyan
Write-Host "   Project: $ProjectId" -ForegroundColor Gray
Write-Host "   Team: $TeamId" -ForegroundColor Gray
Write-Host ""

# Get latest deployment
Write-Host "1️⃣ Getting latest deployment..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
}

try {
    $deploymentsUrl = "https://api.vercel.com/v6/deployments?projectId=$ProjectId&teamId=$TeamId&limit=1"
    $deploymentsResponse = Invoke-RestMethod -Uri $deploymentsUrl -Headers $headers -Method GET
    
    if ($deploymentsResponse.deployments -and $deploymentsResponse.deployments.Count -gt 0) {
        $latestDeployment = $deploymentsResponse.deployments[0]
        Write-Host "   ✅ Latest deployment found:" -ForegroundColor Green
        Write-Host "      ID: $($latestDeployment.uid)" -ForegroundColor Gray
        Write-Host "      URL: $($latestDeployment.url)" -ForegroundColor Gray
        Write-Host "      State: $($latestDeployment.state)" -ForegroundColor Gray
        Write-Host ""
        
        # Trigger redeploy
        Write-Host "2️⃣ Triggering redeploy..." -ForegroundColor Yellow
        $redeployUrl = "https://api.vercel.com/v13/deployments?teamId=$TeamId"
        $redeployBody = @{
            "name" = $ProjectId
            "deploymentId" = $latestDeployment.uid
            "target" = "production"
        } | ConvertTo-Json
        
        $redeployResponse = Invoke-RestMethod -Uri $redeployUrl -Headers $headers -Method POST -Body $redeployBody
        
        Write-Host "   ✅ Redeploy triggered!" -ForegroundColor Green
        Write-Host "      New Deployment ID: $($redeployResponse.uid)" -ForegroundColor Gray
        Write-Host "      URL: $($redeployResponse.url)" -ForegroundColor Gray
        Write-Host ""
        
        # Monitor deployment
        Write-Host "3️⃣ Monitoring deployment..." -ForegroundColor Yellow
        $newDeploymentId = $redeployResponse.uid
        $maxChecks = 40  # 40 checks * 5 seconds = 3.3 minutes
        $checkCount = 0
        $deploymentComplete = $false
        
        while ($checkCount -lt $maxChecks -and -not $deploymentComplete) {
            Start-Sleep -Seconds 5
            $checkCount++
            
            try {
                $statusUrl = "https://api.vercel.com/v13/deployments/$newDeploymentId?teamId=$TeamId"
                $statusResponse = Invoke-RestMethod -Uri $statusUrl -Headers $headers -Method GET
                
                $state = $statusResponse.state
                $readyState = $statusResponse.readyState
                
                Write-Host "   Check $checkCount/$maxChecks - State: $state, Ready: $readyState" -ForegroundColor Gray
                
                if ($readyState -eq "READY") {
                    $deploymentComplete = $true
                    Write-Host ""
                    Write-Host "   ✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
                    Write-Host "      URL: https://$($statusResponse.url)" -ForegroundColor Cyan
                    break
                }
                
                if ($state -eq "ERROR" -or $state -eq "CANCELED") {
                    Write-Host ""
                    Write-Host "   ❌ Deployment failed: $state" -ForegroundColor Red
                    break
                }
                
            } catch {
                Write-Host "   ⚠️ Status check error: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
        
        if (-not $deploymentComplete) {
            Write-Host ""
            Write-Host "   ⏳ Deployment still in progress..." -ForegroundColor Yellow
            Write-Host "   Check status at: https://vercel.com/$TeamId/$ProjectId" -ForegroundColor Cyan
        }
        
    } else {
        Write-Host "   ❌ No deployments found" -ForegroundColor Red
    }
    
} catch {
    $errorMessage = $_.Exception.Message
    Write-Host "   ❌ API Error: $errorMessage" -ForegroundColor Red
    Write-Host ""
    
    if ($errorMessage -match "403" -or $errorMessage -match "401") {
        Write-Host "   🔑 Token might be invalid or expired" -ForegroundColor Yellow
        Write-Host "   Generate new token at: https://vercel.com/account/tokens" -ForegroundColor Cyan
    } elseif ($errorMessage -match "404") {
        Write-Host "   🔍 Project or Team ID might be wrong" -ForegroundColor Yellow
        Write-Host "   Check at: https://vercel.com/$TeamId/$ProjectId/settings" -ForegroundColor Cyan
    }
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "║     ✅ AUTO DEPLOY COMPLETE! ✅                        ║" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "   1. Test the deployed site" -ForegroundColor White
Write-Host "   2. Press F12 to check Console" -ForegroundColor White
Write-Host "   3. Verify: ZERO ERRORS!" -ForegroundColor White
Write-Host ""
Write-Host "🌸 Deployment automated successfully!" -ForegroundColor Green
Write-Host ""


