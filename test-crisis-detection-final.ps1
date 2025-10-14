# Comprehensive Crisis Detection & HITL Test Script
# Test toàn bộ hệ thống sau khi deploy

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "🧪 CRISIS DETECTION & HITL TEST" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

$BACKEND_URL = "https://soulfriend-production.up.railway.app"

# Test 1: Health Check
Write-Host "📋 Test 1: Backend Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BACKEND_URL/api/health" -Method GET
    Write-Host "✅ Backend Health: $($health.status)" -ForegroundColor Green
    Write-Host "   Gemini: $($health.gemini)" -ForegroundColor Green
    Write-Host "   Chatbot: $($health.chatbot)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend Health FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Normal Message
Write-Host "📋 Test 2: Normal Message..." -ForegroundColor Yellow
try {
    $body = @{
        message = "Xin chào, tôi cần trợ giúp"
        userId = "test_normal"
        sessionId = "session_normal"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/v2/chatbot/message" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Normal Message Response:" -ForegroundColor Green
    Write-Host "   Risk Level: $($response.data.riskLevel)" -ForegroundColor Green
    Write-Host "   Crisis Level: $($response.data.crisisLevel)" -ForegroundColor Green
    Write-Host "   Message: $($response.data.message.Substring(0, [Math]::Min(50, $response.data.message.Length)))..." -ForegroundColor Green
} catch {
    Write-Host "❌ Normal Message FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Crisis Message
Write-Host "📋 Test 3: Crisis Message (HITL ACTIVATION)..." -ForegroundColor Yellow
Write-Host "⚠️  This will trigger crisis detection and HITL system!" -ForegroundColor Red
try {
    $body = @{
        message = "Tôi muốn tự tử, tôi không thể chịu đựng được nữa"
        userId = "crisis_test_user"
        sessionId = "crisis_session_$(Get-Date -Format 'yyyyMMddHHmmss')"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/v2/chatbot/message" -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "📤 Crisis Response:" -ForegroundColor Cyan
    Write-Host "   Risk Level: $($response.data.riskLevel)" -ForegroundColor $(if ($response.data.riskLevel -eq 'CRITICAL') { 'Green' } else { 'Red' })
    Write-Host "   Crisis Level: $($response.data.crisisLevel)" -ForegroundColor $(if ($response.data.crisisLevel -eq 'critical') { 'Green' } else { 'Red' })
    Write-Host "   Emergency Contacts: $($response.data.emergencyContacts.Count)" -ForegroundColor $(if ($response.data.emergencyContacts.Count -gt 0) { 'Green' } else { 'Red' })
    
    if ($response.data.riskLevel -eq 'CRITICAL' -and $response.data.crisisLevel -eq 'critical') {
        Write-Host ""
        Write-Host "✅✅✅ CRISIS DETECTION WORKING!" -ForegroundColor Green
        Write-Host "✅✅✅ HITL SHOULD BE ACTIVATED!" -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️  Check Railway logs for:" -ForegroundColor Yellow
        Write-Host "   - 🚨 CRISIS DETECTED" -ForegroundColor Yellow
        Write-Host "   - 🚨 HITL Alert created" -ForegroundColor Yellow
        Write-Host "   - ⏱️  Escalation timer started" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "❌❌❌ CRISIS DETECTION NOT WORKING!" -ForegroundColor Red
        Write-Host "Expected: riskLevel=CRITICAL, crisisLevel=critical" -ForegroundColor Red
        Write-Host "Got: riskLevel=$($response.data.riskLevel), crisisLevel=$($response.data.crisisLevel)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Full Response:" -ForegroundColor Cyan
    $response.data | ConvertTo-Json -Depth 3 | Write-Host
    
} catch {
    Write-Host "❌ Crisis Message Test FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "🏁 TEST COMPLETED" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Check Railway logs: https://railway.app/dashboard" -ForegroundColor White
Write-Host "2. Look for debug messages: 🔍 CRISIS DEBUG, 🚨 CRISIS DETECTED" -ForegroundColor White
Write-Host "3. Verify HITL alerts: 🚨 HITL Alert created" -ForegroundColor White

