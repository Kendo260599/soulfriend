# Test Multiple Crisis Messages
$messages = @(
    "Tôi muốn tự tử",
    "Tôi sẽ làm đêm nay",
    "Tôi đã chuẩn bị dao rồi"
)

$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "🧪 Testing CRITICAL Crisis Alerts..." -ForegroundColor Red
Write-Host ""

foreach ($msg in $messages) {
    $body = @{
        message = $msg
        sessionId = "test_critical_$(Get-Date -Format 'HHmmss')"
        userId = "test_user_critical"
    } | ConvertTo-Json
    
    Write-Host "📨 Sending: '$msg'" -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest `
            -Uri "http://localhost:5000/api/v2/chatbot/message" `
            -Method POST `
            -Body $body `
            -Headers $headers `
            -UseBasicParsing
        
        $result = $response.Content | ConvertFrom-Json
        
        Write-Host "   Risk Level: $($result.data.riskLevel)" -ForegroundColor $(if($result.data.riskLevel -eq 'CRITICAL'){'Red'}else{'Yellow'})
        Write-Host "   Crisis Level: $($result.data.crisisLevel)" -ForegroundColor $(if($result.data.crisisLevel -eq 'critical'){'Red'}else{'Yellow'})
        
        if ($result.data.riskLevel -eq 'CRITICAL') {
            Write-Host "   🚨 HITL Alert should be sent!" -ForegroundColor Red
        }
        
        Write-Host ""
        Start-Sleep -Seconds 2
        
    } catch {
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host "📧 Check emails:" -ForegroundColor Green
Write-Host "   • le3221374@gmail.com" -ForegroundColor Gray
Write-Host "   • lienquanviet05@gmail.com" -ForegroundColor Gray
Write-Host ""

