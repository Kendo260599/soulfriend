# PowerShell script to check Railway build logs
# Usage: .\check-railway-build.ps1

Write-Host "🔍 Checking Railway deployment status..." -ForegroundColor Cyan

# Get latest deployment ID
Write-Host "`n📊 Getting latest deployment..." -ForegroundColor Yellow
$deployments = railway logs --deployment 2>&1 | Select-String -Pattern "deployment" -Context 0,5

if ($deployments) {
    Write-Host "✅ Found deployment logs" -ForegroundColor Green
    railway logs --deployment | Select-Object -First 50
} else {
    Write-Host "⚠️  No deployment logs found. Checking service logs..." -ForegroundColor Yellow
    railway logs --tail 30
}

Write-Host "`n🔍 Checking for Socket.io initialization..." -ForegroundColor Cyan
$socketLogs = railway logs --tail 100 | Select-String -Pattern "Socket.io|socketServer|expert.*namespace"

if ($socketLogs) {
    Write-Host "✅ Socket.io logs found!" -ForegroundColor Green
    $socketLogs
} else {
    Write-Host "❌ No Socket.io logs found - deployment may be using old code" -ForegroundColor Red
}

Write-Host "`n🔍 Checking for expert routes..." -ForegroundColor Cyan
$expertRoutes = railway logs --tail 100 | Select-String -Pattern "expert.*register|expert.*login|/api/v2/expert"

if ($expertRoutes) {
    Write-Host "✅ Expert routes found!" -ForegroundColor Green
    $expertRoutes
} else {
    Write-Host "⚠️  No expert route logs found" -ForegroundColor Yellow
}

Write-Host "`n📊 Testing API endpoints..." -ForegroundColor Cyan
$health = Invoke-WebRequest -Uri "https://soulfriend-production.up.railway.app/api/health" -UseBasicParsing -ErrorAction SilentlyContinue
if ($health.StatusCode -eq 200) {
    Write-Host "✅ Health check: OK" -ForegroundColor Green
} else {
    Write-Host "❌ Health check: FAILED" -ForegroundColor Red
}

$expertRegister = Invoke-WebRequest -Uri "https://soulfriend-production.up.railway.app/api/v2/expert/register" -Method POST -Body '{"test":"test"}' -ContentType "application/json" -UseBasicParsing -ErrorAction SilentlyContinue
if ($expertRegister.StatusCode -eq 400 -or $expertRegister.StatusCode -eq 409) {
    Write-Host "✅ Expert register endpoint: EXISTS (400/409 = validation error, route works)" -ForegroundColor Green
} elseif ($expertRegister.StatusCode -eq 404) {
    Write-Host "❌ Expert register endpoint: NOT FOUND (404)" -ForegroundColor Red
} else {
    Write-Host "⚠️  Expert register endpoint: Status $($expertRegister.StatusCode)" -ForegroundColor Yellow
}

Write-Host "`n✅ Check complete!" -ForegroundColor Green

