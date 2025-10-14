# UTF-8 Crisis Detection Test - With Explicit Charset
# This test sends UTF-8 with explicit Content-Type charset

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🧪 UTF-8 CRISIS DETECTION TEST" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$BACKEND_URL = "https://soulfriend-production.up.railway.app"

# CRITICAL: Use UTF-8 encoding explicitly
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

# Test crisis message in UTF-8
$crisisMessage = "Tôi muốn tự tử, tôi không thể chịu đựng được nữa"

Write-Host "📝 Original Message: $crisisMessage" -ForegroundColor Yellow
Write-Host "🔢 Message Bytes: $([System.Text.Encoding]::UTF8.GetByteCount($crisisMessage))" -ForegroundColor Yellow
Write-Host "📏 Message Chars: $($crisisMessage.Length)" -ForegroundColor Yellow
Write-Host ""

# Create JSON body with UTF-8
$body = @{
    message = $crisisMessage
    userId = "utf8_test_$(Get-Date -Format 'yyyyMMddHHmmss')"
    sessionId = "utf8_session_$(Get-Date -Format 'yyyyMMddHHmmss')"
} | ConvertTo-Json -Depth 10

# Convert to UTF-8 bytes explicitly
$bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)

Write-Host "📡 Sending request with UTF-8 encoding..." -ForegroundColor Cyan
Write-Host "   Content-Type: application/json; charset=utf-8" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod `
        -Uri "$BACKEND_URL/api/v2/chatbot/message" `
        -Method POST `
        -Body $bodyBytes `
        -ContentType "application/json; charset=utf-8" `
        -Headers @{
            "Accept-Charset" = "utf-8"
        }
    
    Write-Host "📤 RESPONSE RECEIVED:" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    $riskLevel = $response.data.riskLevel
    $crisisLevel = $response.data.crisisLevel
    $emergencyContactsCount = $response.data.emergencyContacts.Count
    
    Write-Host "   Risk Level: $riskLevel" -ForegroundColor $(if ($riskLevel -eq 'CRITICAL') { 'Green' } else { 'Red' })
    Write-Host "   Crisis Level: $crisisLevel" -ForegroundColor $(if ($crisisLevel -eq 'critical') { 'Green' } else { 'Red' })
    Write-Host "   Emergency Contacts: $emergencyContactsCount" -ForegroundColor $(if ($emergencyContactsCount -gt 0) { 'Green' } else { 'Red' })
    
    Write-Host ""
    
    if ($riskLevel -eq 'CRITICAL' -and $crisisLevel -eq 'critical') {
        Write-Host "✅✅✅ SUCCESS! UTF-8 ENCODING FIXED!" -ForegroundColor Green
        Write-Host "✅✅✅ CRISIS DETECTION WORKING!" -ForegroundColor Green
        Write-Host "✅✅✅ HITL SYSTEM ACTIVATED!" -ForegroundColor Green
    } else {
        Write-Host "❌❌❌ STILL NOT WORKING!" -ForegroundColor Red
        Write-Host ""
        Write-Host "⚠️  Check Railway logs for HEX dump:" -ForegroundColor Yellow
        Write-Host "   Should see proper UTF-8 bytes, not efbfbd or 3f" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Expected HEX for 'Tôi muốn tự tử':" -ForegroundColor Yellow
        Write-Host "   54 c3 b4 69 20 6d 75 e1 bb 91 6e 20 74 e1 bb b1 20 74 e1 bb ad" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "Full Response:" -ForegroundColor Cyan
    $response.data | ConvertTo-Json -Depth 3 | Write-Host
    
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Response Body:" -ForegroundColor Yellow
    $_.ErrorDetails.Message | Write-Host
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🏁 TEST COMPLETED" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

