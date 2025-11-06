# Use Railway CLI with token to get logs

$env:RAILWAY_TOKEN = "bf2e7d57-8c34-4441-aad6-7c8ca6c28e81"

Write-Host "🔍 Checking Railway Logs via CLI" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Try to set project
Write-Host "Setting Railway project..." -ForegroundColor Yellow
cd backend

try {
    # Check if project is linked
    $projectInfo = railway status 2>&1
    Write-Host "Project info: $projectInfo" -ForegroundColor Gray
    
    # Get logs
    Write-Host "`n📝 Recent Deploy Logs (last 50 lines):" -ForegroundColor Cyan
    Write-Host "----------------------------------------" -ForegroundColor Gray
    railway logs --tail 50 2>&1 | Out-Host
    
    Write-Host "`n📊 Service Status:" -ForegroundColor Cyan
    Write-Host "----------------------------------------" -ForegroundColor Gray
    railway status 2>&1 | Out-Host
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

cd ..

Write-Host "`n✅ Check complete!" -ForegroundColor Green



$env:RAILWAY_TOKEN = "bf2e7d57-8c34-4441-aad6-7c8ca6c28e81"

Write-Host "🔍 Checking Railway Logs via CLI" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Try to set project
Write-Host "Setting Railway project..." -ForegroundColor Yellow
cd backend

try {
    # Check if project is linked
    $projectInfo = railway status 2>&1
    Write-Host "Project info: $projectInfo" -ForegroundColor Gray
    
    # Get logs
    Write-Host "`n📝 Recent Deploy Logs (last 50 lines):" -ForegroundColor Cyan
    Write-Host "----------------------------------------" -ForegroundColor Gray
    railway logs --tail 50 2>&1 | Out-Host
    
    Write-Host "`n📊 Service Status:" -ForegroundColor Cyan
    Write-Host "----------------------------------------" -ForegroundColor Gray
    railway status 2>&1 | Out-Host
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

cd ..

Write-Host "`n✅ Check complete!" -ForegroundColor Green












