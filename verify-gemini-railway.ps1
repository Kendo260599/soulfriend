#!/usr/bin/env pwsh
# Verify Gemini API is working on Railway

Write-Host "`n🧪 VERIFYING GEMINI API ON RAILWAY...`n" -ForegroundColor Cyan

$backendUrl = "https://soulfriend-production.up.railway.app"

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "🎯 Testing: $backendUrl" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

# Test 1: Health Check
Write-Host "📊 Test 1: Health Check..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$backendUrl/api/health" -Method GET
    Write-Host "✅ Backend: $($health.status)" -ForegroundColor Green
    if ($health.ai -and $health.ai.gemini) {
        Write-Host "✅ Gemini Status: $($health.ai.gemini.status)" -ForegroundColor Green
        Write-Host "   Model: $($health.ai.gemini.model)" -ForegroundColor White
    }
}
catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Chatbot Message (AI Response)
Write-Host "📊 Test 2: Chatbot AI Response..." -ForegroundColor Cyan

$testMessage = @{
    message   = "Xin chào, bạn là ai? Trả lời ngắn gọn bằng tiếng Việt."
    sessionId = "verify_$(Get-Date -Format 'yyyyMMddHHmmss')"
    userId    = "verify_user"
} | ConvertTo-Json -Compress

try {
    $response = Invoke-RestMethod `
        -Uri "$backendUrl/api/v2/chatbot/message" `
        -Method POST `
        -ContentType "application/json; charset=utf-8" `
        -Body ([System.Text.Encoding]::UTF8.GetBytes($testMessage))
    
    if ($response.response) {
        Write-Host "✅ Chatbot Response:" -ForegroundColor Green
        Write-Host "   $($response.response.Substring(0, [Math]::Min(150, $response.response.Length)))..." -ForegroundColor White
        
        # Check if AI-generated
        if ($response.aiGenerated -eq $true) {
            Write-Host "`n🎉 GEMINI API ĐANG HOẠT ĐỘNG!" -ForegroundColor Green
            Write-Host "   AI Model: Gemini Pro" -ForegroundColor Cyan
        }
        elseif ($response.response -match "offline|không khả dụng|tạm thời") {
            Write-Host "`n⚠️  CHATBOT ĐANG DÙNG OFFLINE MODE!" -ForegroundColor Yellow
            Write-Host "   → Gemini API chưa hoạt động hoặc key chưa đúng" -ForegroundColor Red
        }
        else {
            Write-Host "`n✅ Response OK (kiểm tra aiGenerated flag)" -ForegroundColor Yellow
        }
    }
}
catch {
    Write-Host "❌ Chatbot test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "🏁 VERIFICATION COMPLETE" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

# Summary
Write-Host "📋 SUMMARY:" -ForegroundColor Yellow
Write-Host "   If you see '🎉 GEMINI API ĐANG HOẠT ĐỘNG!' → Success!" -ForegroundColor White
Write-Host "   If you see '⚠️ OFFLINE MODE' → Check Railway GEMINI_API_KEY" -ForegroundColor White
Write-Host ""




















