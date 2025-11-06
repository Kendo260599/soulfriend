# Test Crisis Alert Email
$body = @{
    message = "Tôi muốn chết"
    sessionId = "test_crisis_email"
    userId = "test_user_email"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "🧪 Testing Crisis Alert Email..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-WebRequest `
        -Uri "http://localhost:5000/api/v2/chatbot/message" `
        -Method POST `
        -Body $body `
        -Headers $headers `
        -UseBasicParsing
    
    $result = $response.Content | ConvertFrom-Json
    
    Write-Host "✅ Response received:" -ForegroundColor Green
    Write-Host "Risk Level: $($result.data.riskLevel)" -ForegroundColor Red
    Write-Host "Crisis Level: $($result.data.crisisLevel)" -ForegroundColor Red
    Write-Host "Message: $($result.data.message)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📧 Check email inbox for HITL alert!" -ForegroundColor Yellow
    Write-Host "   Recipients: le3221374@gmail.com, lienquanviet05@gmail.com" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Response:" -ForegroundColor Yellow
    Write-Host $_.ErrorDetails.Message
}

Write-Host ""

