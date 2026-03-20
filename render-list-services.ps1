# 🚀 List tất cả services trên Render.com
# API Key: rnd_sPQaZfs9g2eU66SG47PZj4dbDVzJ

$RENDER_API_KEY = "rnd_sPQaZfs9g2eU66SG47PZj4dbDVzJ"

Write-Host "🚀 List Render Services" -ForegroundColor Green
Write-Host "======================`n" -ForegroundColor Green

# Set API key as environment variable
$env:RENDER_API_KEY = $RENDER_API_KEY

# Headers
$headers = @{
    "Authorization" = "Bearer $RENDER_API_KEY"
    "Content-Type" = "application/json"
}

Write-Host "📋 Đang list tất cả services..." -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Yellow

try {
    # List all services
    $servicesUrl = "https://api.render.com/v1/services"
    Write-Host "`nTesting: GET $servicesUrl" -ForegroundColor Cyan
    
    $response = Invoke-RestMethod -Uri $servicesUrl -Method Get -Headers $headers -ErrorAction Stop
    
    Write-Host "✅ Kết nối thành công!`n" -ForegroundColor Green
    
    if ($response -and $response.Count -gt 0) {
        Write-Host "📋 Services Found: $($response.Count)`n" -ForegroundColor Yellow
        
        foreach ($service in $response) {
            Write-Host "Service ID: $($service.service.id)" -ForegroundColor Cyan
            Write-Host "  Name: $($service.service.name)" -ForegroundColor White
            Write-Host "  Type: $($service.service.type)" -ForegroundColor White
            if ($service.service.serviceDetails) {
                if ($service.service.serviceDetails.url) {
                    Write-Host "  URL: $($service.service.serviceDetails.url)" -ForegroundColor White
                }
                if ($service.service.serviceDetails.currentRelease) {
                    Write-Host "  Status: $($service.service.serviceDetails.currentRelease.status)" -ForegroundColor White
                }
            }
            Write-Host ""
        }
    } else {
        Write-Host "⚠️  Không tìm thấy services nào" -ForegroundColor Yellow
        Write-Host "   Hãy tạo service mới trong Render Dashboard`n" -ForegroundColor White
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
            Write-Host "   Render Dashboard → Account Settings → API Keys" -ForegroundColor White
        } elseif ($statusCode -eq 404) {
            Write-Host "`n⚠️  API endpoint không tồn tại" -ForegroundColor Yellow
            Write-Host "   Hãy kiểm tra lại API documentation" -ForegroundColor White
        }
    }
}

Write-Host "`n📝 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Nếu không có services, tạo service mới trong Render Dashboard" -ForegroundColor White
Write-Host "  2. Nếu có services, dùng Service ID để quản lý" -ForegroundColor White
Write-Host "  3. Set environment variables qua Dashboard hoặc API" -ForegroundColor White
Write-Host "  4. Deploy service qua Dashboard hoặc API`n" -ForegroundColor White
