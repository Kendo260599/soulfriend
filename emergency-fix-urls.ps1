# Emergency Fix - Hardcode Railway URLs in Frontend
# Use this if env vars are not working

Write-Host "🚨 EMERGENCY FIX - Hardcoding Railway URLs..." -ForegroundColor Red
Write-Host ""

$RAILWAY_URL = "https://soulfriend-production.up.railway.app"

# Files to fix
$files = @(
    "frontend\src\services\chatbotBackendService.ts",
    "frontend\src\services\monitoringService.ts",
    "frontend\src\contexts\AIContext.tsx",
    "frontend\src\services\cloudResearchService.ts"
)

Write-Host "Files to update:" -ForegroundColor Yellow
$files | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
Write-Host ""

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "📝 Updating: $file" -ForegroundColor Cyan
        
        # Read file
        $content = Get-Content $file -Raw
        
        # Replace env var fallbacks with hardcoded URL
        $content = $content -replace "process\.env\.REACT_APP_API_URL \|\| '[^']*'", "'$RAILWAY_URL'"
        $content = $content -replace "process\.env\.REACT_APP_BACKEND_URL \|\| '[^']*'", "'$RAILWAY_URL'"
        
        # Write back
        $content | Set-Content $file -NoNewline
        
        Write-Host "   ✅ Updated" -ForegroundColor Green
    }
    else {
        Write-Host "   ⚠️  File not found: $file" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ URLs hardcoded to: $RAILWAY_URL" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Build frontend: cd frontend; npm run build" -ForegroundColor White
Write-Host "2. Commit: git add .; git commit -m 'Emergency fix: Hardcode Railway URLs'" -ForegroundColor White
Write-Host "3. Push: git push origin main" -ForegroundColor White
Write-Host "4. Vercel will auto-deploy" -ForegroundColor White
Write-Host "5. Test again after 1-2 minutes" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Remember to revert this after fixing env vars!" -ForegroundColor Red

