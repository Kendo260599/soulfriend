# PowerShell script to automatically check Railway build logs
# Usage: .\check-build-logs.ps1

Write-Host "🔍 Checking Railway Build Status..." -ForegroundColor Cyan
Write-Host ""

# Get latest deployment ID
Write-Host "📊 Getting latest deployment..." -ForegroundColor Yellow
$deploymentOutput = railway logs --deployment 2>&1 | Select-Object -First 100

if ($deploymentOutput -match "error|ERROR|failed|FAILED") {
    Write-Host "❌ BUILD FAILED!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error Details:" -ForegroundColor Red
    $deploymentOutput | Select-String -Pattern "error|ERROR|failed|FAILED" | ForEach-Object {
        Write-Host $_.Line -ForegroundColor Red
    }
} elseif ($deploymentOutput -match "stage-0|nix-env|Nixpacks") {
    Write-Host "⚠️  Railway still using Nixpacks!" -ForegroundColor Yellow
    Write-Host "   Need to set builder in Railway Dashboard" -ForegroundColor Yellow
} elseif ($deploymentOutput -match "Dockerfile|docker build|FROM node") {
    Write-Host "✅ Using Dockerfile!" -ForegroundColor Green
} elseif ($deploymentOutput -match "Socket.io|socketServer|expert") {
    Write-Host "✅ Build successful! Socket.io initialized!" -ForegroundColor Green
} else {
    Write-Host "⏳ Build in progress or logs not available yet..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Recent Build Logs:" -ForegroundColor Cyan
Write-Host $deploymentOutput

Write-Host ""
Write-Host "🔗 Full logs: https://railway.app/dashboard" -ForegroundColor Cyan

