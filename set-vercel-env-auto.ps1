# 🔧 Auto Set Vercel Environment Variables
# Script tự động set 6 environment variables cần thiết cho Vercel deployment

Write-Host "🚀 Auto Setting Vercel Environment Variables..." -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
Write-Host "🔍 Checking Vercel CLI..." -ForegroundColor Yellow
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    Write-Host ""
    npm install -g vercel
    Write-Host ""
    Write-Host "✅ Vercel CLI installed!" -ForegroundColor Green
    Write-Host ""
}

# Login to Vercel (if not already logged in)
Write-Host "🔐 Checking Vercel authentication..." -ForegroundColor Yellow
vercel whoami 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Not logged in to Vercel. Please login..." -ForegroundColor Yellow
    Write-Host ""
    vercel login
    Write-Host ""
}

Write-Host "✅ Logged in to Vercel!" -ForegroundColor Green
Write-Host ""

# Define environment variables
$envVars = @(
    @{
        Name = "REACT_APP_API_URL"
        Value = "https://soulfriend-production.up.railway.app"
    },
    @{
        Name = "REACT_APP_BACKEND_URL"
        Value = "https://soulfriend-production.up.railway.app"
    },
    @{
        Name = "NODE_VERSION"
        Value = "20"
    },
    @{
        Name = "DISABLE_ESLINT_PLUGIN"
        Value = "true"
    },
    @{
        Name = "GENERATE_SOURCEMAP"
        Value = "false"
    },
    @{
        Name = "SKIP_PREFLIGHT_CHECK"
        Value = "true"
    }
)

Write-Host "📋 Will set the following environment variables:" -ForegroundColor Cyan
Write-Host ""
foreach ($var in $envVars) {
    Write-Host "  • $($var.Name) = $($var.Value)" -ForegroundColor White
}
Write-Host ""

# Confirm before proceeding
$confirmation = Read-Host "Continue? (Y/N)"
if ($confirmation -ne 'Y' -and $confirmation -ne 'y') {
    Write-Host "❌ Cancelled by user." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Setting environment variables..." -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($var in $envVars) {
    Write-Host "Setting: $($var.Name)..." -ForegroundColor White
    
    # Set for production
    $output = vercel env add $($var.Name) production 2>&1
    if ($output -match "already exists") {
        Write-Host "  ⚠️  Already exists in production, removing first..." -ForegroundColor Yellow
        vercel env rm $($var.Name) production --yes 2>&1 | Out-Null
    }
    
    # Add to production
    Write-Host $($var.Value) | vercel env add $($var.Name) production 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Production" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Failed for production" -ForegroundColor Red
        $failCount++
    }
    
    # Add to preview
    Write-Host $($var.Value) | vercel env add $($var.Name) preview 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Preview" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Failed for preview" -ForegroundColor Red
    }
    
    # Add to development
    Write-Host $($var.Value) | vercel env add $($var.Name) development 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Development" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "  ❌ Failed for development" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "  ✅ Success: $successCount/$($envVars.Count)" -ForegroundColor Green
Write-Host "  ❌ Failed: $failCount/$($envVars.Count)" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "🎉 All environment variables set successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔄 Next step: Trigger Vercel redeploy" -ForegroundColor Yellow
    Write-Host ""
    
    $redeploy = Read-Host "Trigger redeploy now? (Y/N)"
    if ($redeploy -eq 'Y' -or $redeploy -eq 'y') {
        Write-Host ""
        Write-Host "🚀 Triggering Vercel redeploy..." -ForegroundColor Yellow
        Write-Host ""
        vercel --prod
        Write-Host ""
        Write-Host "✅ Redeploy triggered!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⚠️  Remember to redeploy manually:" -ForegroundColor Yellow
        Write-Host "   vercel --prod" -ForegroundColor White
        Write-Host ""
        Write-Host "   OR via Vercel Dashboard:" -ForegroundColor White
        Write-Host "   https://vercel.com/kendo260599s-projects/soulfriend" -ForegroundColor Cyan
    }
} else {
    Write-Host "⚠️  Some variables failed to set. Check errors above." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You can set them manually at:" -ForegroundColor White
    Write-Host "https://vercel.com/kendo260599s-projects/soulfriend/settings/environment-variables" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "✨ Done!" -ForegroundColor Green
Write-Host ""

