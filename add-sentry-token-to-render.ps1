# Add Sentry Auth Token to Render
# This script adds SENTRY_AUTH_TOKEN to your Render service

$RENDER_API_KEY = "rnd_kcF8wVsq6rItQZHCNmq4fZYZBPVU"
$SERVICE_ID = "srv-ctbkc9ggph6c73aps6og"

Write-Host "🔐 Adding SENTRY_AUTH_TOKEN to Render..." -ForegroundColor Cyan

# Add Sentry Auth Token
$body = @{
    key = "SENTRY_AUTH_TOKEN"
    value = "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"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $RENDER_API_KEY"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$SERVICE_ID/env-vars" `
        -Method POST `
        -Headers $headers `
        -Body $body

    Write-Host "✅ SENTRY_AUTH_TOKEN added successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Response:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Response body:" -ForegroundColor Yellow
    $_.ErrorDetails.Message
}

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Sentry will now be able to upload source maps from Render"
Write-Host "2. This enables better error tracking with original source code"
Write-Host "3. Check Sentry dashboard for source maps after next deploy"
