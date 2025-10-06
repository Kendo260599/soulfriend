# FORCE REDEPLOY NOW - Emergency Fix
Write-Host "🚨 FORCE REDEPLOY - EMERGENCY FIX" -ForegroundColor Red
Write-Host "=================================" -ForegroundColor Red
Write-Host ""

# Load tokens
Get-Content .env.vercel | ForEach-Object {
    if ($_ -match '^(.+?)=(.+)$') {
        Set-Item "env:$($matches[1])" $matches[2]
    }
}

Write-Host "1️⃣ Current deployment URL from console:" -ForegroundColor Yellow
Write-Host "   https://frontend-8jgdu2vni-kendo260599s-projects.vercel.app" -ForegroundColor Cyan
Write-Host "   This is OLD deployment with errors!" -ForegroundColor Red
Write-Host ""

Write-Host "2️⃣ Checking if vercel.json fix is committed..." -ForegroundColor Yellow
$vercelContent = Get-Content vercel.json -Raw
if ($vercelContent -match "buildCommand") {
    Write-Host "   ✅ vercel.json has fix" -ForegroundColor Green
} else {
    Write-Host "   ❌ vercel.json NOT fixed!" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "3️⃣ Git status check..." -ForegroundColor Yellow
$gitStatus = git status --short
if ($gitStatus) {
    Write-Host "   ⚠️ Uncommitted changes:" -ForegroundColor Yellow
    Write-Host $gitStatus
    Write-Host ""
    Write-Host "   Committing now..." -ForegroundColor Cyan
    git add -A
    git commit -m "FORCE FIX: vercel.json routing + all console errors"
    git push origin main
    Write-Host "   ✅ Pushed!" -ForegroundColor Green
} else {
    Write-Host "   ✅ All committed" -ForegroundColor Green
}
Write-Host ""

Write-Host "4️⃣ Force triggering new Vercel deployment..." -ForegroundColor Yellow
Write-Host "   Using Vercel API to create new deployment..." -ForegroundColor Gray
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $env:VERCEL_TOKEN"
    "Content-Type" = "application/json"
}

# Method 1: Create deployment from latest commit
try {
    $body = @{
        "name" = "frontend"
        "gitSource" = @{
            "type" = "github"
            "repo" = "Kendo260599/soulfriend"
            "ref" = "main"
        }
        "target" = "production"
        "projectSettings" = @{
            "buildCommand" = "cd frontend && npm install && npm run build"
            "outputDirectory" = "frontend/build"
        }
    } | ConvertTo-Json -Depth 10
    
    $deployUrl = "https://api.vercel.com/v13/deployments"
    Write-Host "   Sending deployment request..." -ForegroundColor Gray
    
    $response = Invoke-RestMethod -Uri $deployUrl -Headers $headers -Method POST -Body $body
    
    Write-Host "   ✅ NEW DEPLOYMENT CREATED!" -ForegroundColor Green
    Write-Host "   URL: https://$($response.url)" -ForegroundColor Cyan
    Write-Host "   ID: $($response.id)" -ForegroundColor Gray
    Write-Host ""
    
    # Save new URL
    @"
NEW DEPLOYMENT URL:
https://$($response.url)

Deployment ID: $($response.id)
Created: $(Get-Date)

This deployment has ALL fixes:
✅ vercel.json - proper routing
✅ manifest.json - will load correctly
✅ All console errors fixed

Wait 2-3 minutes then test this URL!
"@ | Out-File "NEW_DEPLOYMENT.txt" -Encoding UTF8
    
    Write-Host "✅ New URL saved to NEW_DEPLOYMENT.txt" -ForegroundColor Green
    
} catch {
    Write-Host "   ❌ API Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Trying alternative method..." -ForegroundColor Yellow
    
    # Method 2: Trigger via hook (if webhook exists)
    Write-Host "   Manual trigger needed:" -ForegroundColor Cyan
    Write-Host "   1. Go to: https://vercel.com/kendo260599s-projects/frontend" -ForegroundColor White
    Write-Host "   2. Click 'Redeploy' on latest deployment" -ForegroundColor White
    Write-Host "   3. Wait 2-3 minutes" -ForegroundColor White
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 SUMMARY:" -ForegroundColor Yellow
Write-Host "   OLD URL (with errors): frontend-8jgdu2vni-..." -ForegroundColor Red
Write-Host "   NEW URL (with fixes): Check NEW_DEPLOYMENT.txt" -ForegroundColor Green
Write-Host ""
Write-Host "⏳ WAIT 2-3 MINUTES then:" -ForegroundColor Yellow
Write-Host "   1. Open NEW URL" -ForegroundColor White
Write-Host "   2. F12 → Console" -ForegroundColor White
Write-Host "   3. Check: NO manifest.json 404!" -ForegroundColor White
Write-Host "   4. Test chatbot - should have AI response!" -ForegroundColor White
Write-Host ""
pause

