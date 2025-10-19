# Check Vercel Deployment Details
# Verify if env vars are in the build

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔍 CHECKING VERCEL DEPLOYMENT" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$VERCEL_URL = "https://soulfriend-git-main-kendo260599s-projects.vercel.app"

Write-Host "📋 Step 1: Check Vercel Frontend Status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $VERCEL_URL -UseBasicParsing
    Write-Host "✅ Vercel: Online (Status: $($response.StatusCode))" -ForegroundColor Green
}
catch {
    Write-Host "❌ Vercel Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Step 2: Check for Backend URL in HTML..." -ForegroundColor Yellow

$htmlContent = $response.Content

if ($htmlContent -like '*soulfriend-production.up.railway.app*') {
    Write-Host "✅ Railway backend URL found in HTML!" -ForegroundColor Green
    Write-Host "✅ Environment variables are working!" -ForegroundColor Green
}
else {
    Write-Host "❌ Railway backend URL NOT found in HTML!" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 PROBLEM IDENTIFIED:" -ForegroundColor Red
    Write-Host "   Vercel deployment doesn't have environment variables" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 SOLUTION:" -ForegroundColor Yellow
    Write-Host "   1. Go to Vercel Dashboard" -ForegroundColor White
    Write-Host "   2. Settings → Environment Variables" -ForegroundColor White
    Write-Host "   3. Verify these exist:" -ForegroundColor White
    Write-Host "      - REACT_APP_API_URL = https://soulfriend-production.up.railway.app" -ForegroundColor Gray
    Write-Host "      - REACT_APP_BACKEND_URL = https://soulfriend-production.up.railway.app" -ForegroundColor Gray
    Write-Host "   4. If missing: Add them for ALL environments (Production, Preview, Development)" -ForegroundColor White
    Write-Host "   5. Deployments → Latest → Redeploy (UNCHECK build cache)" -ForegroundColor White
    Write-Host "   6. Wait 1-2 minutes" -ForegroundColor White
}

Write-Host ""
Write-Host "📋 Step 3: Check for JavaScript bundle..." -ForegroundColor Yellow

# Try to find main.js or bundle
if ($htmlContent -match 'static/js/main\..*\.js') {
    $jsFile = $Matches[0]
    Write-Host "✅ Found JS bundle: $jsFile" -ForegroundColor Green
    
    # Try to fetch JS and check for backend URL
    try {
        $jsUrl = "$VERCEL_URL/$jsFile"
        $jsContent = Invoke-WebRequest -Uri $jsUrl -UseBasicParsing
        
        if ($jsContent.Content -like '*soulfriend-production.up.railway.app*') {
            Write-Host "✅ Backend URL found in JavaScript!" -ForegroundColor Green
        }
        else {
            Write-Host "❌ Backend URL NOT in JavaScript bundle!" -ForegroundColor Red
            Write-Host "   This confirms env vars were not in build" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "⚠️  Could not fetch JavaScript file" -ForegroundColor Yellow
    }
}
else {
    Write-Host "⚠️  JavaScript bundle not found in HTML" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 DIAGNOSIS COMPLETE" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

Write-Host "🎯 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "   1. Verify env vars in Vercel Dashboard (tab already open)" -ForegroundColor White
Write-Host "   2. Redeploy without cache if needed" -ForegroundColor White
Write-Host "   3. Wait for deployment complete" -ForegroundColor White
Write-Host "   4. Test again" -ForegroundColor White





