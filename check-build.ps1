# Auto-check Railway Build Status
# Usage: .\check-build.ps1

Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Railway Build Status Checker           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is available
$railwayCheck = railway --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Railway CLI not found!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Railway CLI: $railwayCheck" -ForegroundColor Green
Write-Host ""

# Get project status
Write-Host "📊 Checking project status..." -ForegroundColor Yellow
railway status
Write-Host ""

# Check recent logs for build indicators
Write-Host "🔍 Checking recent logs for build status..." -ForegroundColor Yellow
$logs = railway logs --tail 30 2>&1

# Check for build errors
if ($logs -match "error|ERROR|failed|FAILED|undefined variable") {
    Write-Host ""
    Write-Host "❌ BUILD ERRORS DETECTED!" -ForegroundColor Red
    Write-Host ""
    $logs | Select-String -Pattern "error|ERROR|failed|FAILED|undefined" | Select-Object -First 5 | ForEach-Object {
        Write-Host "  $($_.Line)" -ForegroundColor Red
    }
} elseif ($logs -match "Socket.io|socketServer|expert|Expert") {
    Write-Host ""
    Write-Host "✅ BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "   Socket.io and Expert routes are working!" -ForegroundColor Green
} elseif ($logs -match "stage-0|nix-env|Nixpacks") {
    Write-Host ""
    Write-Host "⚠️  Railway using Nixpacks (not Dockerfile)" -ForegroundColor Yellow
    Write-Host "   Need to configure builder in Railway Dashboard" -ForegroundColor Yellow
} elseif ($logs -match "Dockerfile|docker build|FROM node") {
    Write-Host ""
    Write-Host "✅ Using Dockerfile!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⏳ Checking logs..." -ForegroundColor Yellow
    Write-Host $logs
}

Write-Host ""
Write-Host "🔗 View full logs: https://railway.app/dashboard" -ForegroundColor Cyan
Write-Host ""

