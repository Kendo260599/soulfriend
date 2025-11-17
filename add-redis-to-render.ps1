# 🔴 Script tự động thêm Redis ENV vào Render
# Cần Render API key để chạy

$RENDER_API_KEY = Read-Host "Nhập Render API Key (hoặc Enter để skip)"

if ([string]::IsNullOrWhiteSpace($RENDER_API_KEY)) {
    Write-Host "`n⚠️  Không có API key - Vui lòng thêm thủ công qua Dashboard" -ForegroundColor Yellow
    Write-Host "   https://dashboard.render.com/web/soulfriend-api`n" -ForegroundColor Cyan
    exit
}

$SERVICE_ID = "srv-cv7rsog8ii6s73an16e0" # Replace with your actual service ID

$envVars = @(
    @{
        key = "REDIS_URL"
        value = "redis://default:KukvFehuuP2iegRw1iJdWCYwHyszYOC5@redis-11240.c93.us-east-1-3.ec2.cloud.redislabs.com:11240"
    },
    @{
        key = "REDIS_HOST"
        value = "redis-11240.c93.us-east-1-3.ec2.cloud.redislabs.com"
    },
    @{
        key = "REDIS_PORT"
        value = "11240"
    },
    @{
        key = "REDIS_USERNAME"
        value = "default"
    },
    @{
        key = "REDIS_PASSWORD"
        value = "KukvFehuuP2iegRw1iJdWCYwHyszYOC5"
    },
    @{
        key = "REDIS_API_KEY"
        value = "A2s74mit1227i4y187h8m6c6i0q2wzdb73nq0r7j153a22xcnf0"
    }
)

Write-Host "`n🔄 Đang thêm Redis environment variables vào Render...`n" -ForegroundColor Yellow

foreach ($env in $envVars) {
    Write-Host "Adding $($env.key)..." -ForegroundColor Cyan
    
    $body = @{
        key = $env.key
        value = $env.value
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$SERVICE_ID/env-vars" `
            -Method Post `
            -Headers @{
                "Authorization" = "Bearer $RENDER_API_KEY"
                "Content-Type" = "application/json"
            } `
            -Body $body
        
        Write-Host "✅ Added $($env.key)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to add $($env.key): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n✅ Hoàn tất! Render sẽ tự động deploy lại.`n" -ForegroundColor Green
