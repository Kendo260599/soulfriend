# Test HITL Email in Railway Production
$productionUrl = "https://soulfriend-production.up.railway.app"

$criticalMessages = @(
    "Tôi muốn tự tử",
    "Tôi sẽ kết thúc mọi chuyện đêm nay",
    "Tôi đã chuẩn bị sẵn dao"
)

Write-Host "🚀 Testing HITL Email System in Railway Production" -ForegroundColor Green
Write-Host "URL: $productionUrl" -ForegroundColor Gray
Write-Host ""

foreach ($msg in $criticalMessages) {
    $body = @{
        message = $msg
        sessionId = "prod_test_$(Get-Date -Format 'HHmmss')"
        userId = "prod_test_user"
    } | ConvertTo-Json
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    Write-Host "📨 Sending: '$msg'" -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest `
            -Uri "$productionUrl/api/v2/chatbot/message" `
            -Method POST `
            -Body $body `
            -Headers $headers `
            -UseBasicParsing `
            -TimeoutSec 30
        
        $result = $response.Content | ConvertFrom-Json
        
        if ($result.success) {
            Write-Host "   ✅ Response received" -ForegroundColor Green
            Write-Host "   Risk Level: $($result.data.riskLevel)" -ForegroundColor $(
                switch ($result.data.riskLevel) {
                    'CRITICAL' { 'Red' }
                    'HIGH' { 'Yellow' }
                    default { 'Gray' }
                }
            )
            Write-Host "   Crisis Level: $($result.data.crisisLevel)" -ForegroundColor $(
                switch ($result.data.crisisLevel) {
                    'critical' { 'Red' }
                    'high' { 'Yellow' }
                    default { 'Gray' }
                }
            )
            
            if ($result.data.riskLevel -eq 'CRITICAL') {
                Write-Host "   🚨 CRITICAL ALERT - Email should be sent to:" -ForegroundColor Red
                Write-Host "      • le3221374@gmail.com" -ForegroundColor Gray
                Write-Host "      • lienquanviet05@gmail.com" -ForegroundColor Gray
            }
        } else {
            Write-Host "   ❌ Error: $($result.error)" -ForegroundColor Red
        }
        
    } catch {
        Write-Host "   ❌ Request failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails) {
            $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "   Error details: $($errorObj.error.message)" -ForegroundColor Gray
        }
    }
    
    Write-Host ""
    Start-Sleep -Seconds 2
}

Write-Host "📧 Check email inboxes for HITL alerts!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Railway Logs:" -ForegroundColor Cyan
Write-Host "   Run: railway logs" -ForegroundColor Gray
Write-Host ""

