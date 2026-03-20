# 🚀 Kết nối với Render.com qua API Key
# API Key: rnd_sPQaZfs9g2eU66SG47PZj4dbDVzJ

$RENDER_API_KEY = "rnd_sPQaZfs9g2eU66SG47PZj4dbDVzJ"
$RENDER_SERVICE_ID = "rnd_sPQaZfs9g2eU66SG47PZj4dbDVzJ"

Write-Host "🚀 Kết nối với Render.com qua API" -ForegroundColor Green
Write-Host "==================================`n" -ForegroundColor Green

# Set API key as environment variable
$env:RENDER_API_KEY = $RENDER_API_KEY

Write-Host "✅ API Key đã được set:" -ForegroundColor Green
Write-Host "   RENDER_API_KEY=$RENDER_API_KEY`n" -ForegroundColor White

Write-Host "📋 Service ID:" -ForegroundColor Yellow
Write-Host "   $RENDER_SERVICE_ID`n" -ForegroundColor White

# Test connection với Render API
Write-Host "📋 Bước 1: Test kết nối với Render API" -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $RENDER_API_KEY"
    "Content-Type" = "application/json"
}

Write-Host "Đang test kết nối..." -ForegroundColor White

try {
    # Get service info
    $serviceUrl = "https://api.render.com/v1/services/$RENDER_SERVICE_ID"
    Write-Host "`nTesting: GET $serviceUrl" -ForegroundColor Cyan
    
    $response = Invoke-RestMethod -Uri $serviceUrl -Method Get -Headers $headers -ErrorAction Stop
    
    Write-Host "✅ Kết nối thành công!`n" -ForegroundColor Green
    Write-Host "Service Info:" -ForegroundColor Yellow
    Write-Host "  Name: $($response.service.name)" -ForegroundColor White
    Write-Host "  Type: $($response.service.type)" -ForegroundColor White
    if ($response.service.serviceDetails) {
        if ($response.service.serviceDetails.currentRelease) {
            Write-Host "  Status: $($response.service.serviceDetails.currentRelease.status)" -ForegroundColor White
        }
        if ($response.service.serviceDetails.url) {
            Write-Host "  URL: $($response.service.serviceDetails.url)" -ForegroundColor White
        }
    }
    
} catch {
    Write-Host "❌ Lỗi khi kết nối:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Yellow
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "   Status Code: $statusCode" -ForegroundColor Yellow
        
        if ($statusCode -eq 401) {
            Write-Host "`n⚠️  API Key không hợp lệ hoặc đã hết hạn" -ForegroundColor Yellow
            Write-Host "   Hãy kiểm tra lại API key trong Render Dashboard" -ForegroundColor White
        } elseif ($statusCode -eq 404) {
            Write-Host "`n⚠️  Service ID không tồn tại" -ForegroundColor Yellow
            Write-Host "   Hãy kiểm tra lại Service ID" -ForegroundColor White
        }
    }
}

Write-Host "`n📋 Bước 2: Các lệnh hữu ích" -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Yellow

Write-Host "🔗 Render API Endpoints:" -ForegroundColor Cyan
Write-Host "  - Get Service: GET https://api.render.com/v1/services/$RENDER_SERVICE_ID" -ForegroundColor White
Write-Host "  - Get Logs: GET https://api.render.com/v1/services/$RENDER_SERVICE_ID/logs" -ForegroundColor White
Write-Host "  - Get Env Vars: GET https://api.render.com/v1/services/$RENDER_SERVICE_ID/env-vars" -ForegroundColor White
Write-Host "  - Deploy: POST https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys" -ForegroundColor White

Write-Host "`n💡 Sử dụng API Key:" -ForegroundColor Cyan
Write-Host "  Set environment variable:" -ForegroundColor White
Write-Host "    `$env:RENDER_API_KEY = '$RENDER_API_KEY'" -ForegroundColor Yellow
Write-Host "`n  Hoặc dùng trong curl:" -ForegroundColor White
Write-Host "    curl -H 'Authorization: Bearer $RENDER_API_KEY' https://api.render.com/v1/services/$RENDER_SERVICE_ID" -ForegroundColor Yellow

Write-Host "`n📝 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Kiểm tra service info trong Render Dashboard" -ForegroundColor White
Write-Host "  2. Set environment variables qua Dashboard hoặc API" -ForegroundColor White
Write-Host "  3. Trigger deploy qua Dashboard hoặc API" -ForegroundColor White
Write-Host "  4. Check logs qua Dashboard hoặc API`n" -ForegroundColor White

Write-Host "✅ Setup hoàn tất!`n" -ForegroundColor Green

