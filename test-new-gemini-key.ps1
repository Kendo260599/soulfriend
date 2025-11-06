#!/usr/bin/env pwsh
# Test Gemini API Key from Railway

Write-Host "`n🧪 TESTING GEMINI API KEY FROM RAILWAY...`n" -ForegroundColor Cyan

# Prompt user for new API key to test
$apiKey = Read-Host "📝 Paste your NEW Gemini API Key here"

if ([string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Host "❌ No API key provided!" -ForegroundColor Red
    exit 1
}

Write-Host "`n🔍 Testing API Key: $($apiKey.Substring(0, 12))...`n" -ForegroundColor Yellow

# Test request body
$body = @{
    contents = @(
        @{
            parts = @(
                @{ text = "Xin chào, trả lời ngắn gọn bằng tiếng Việt." }
            )
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod `
        -Uri "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=$apiKey" `
        -Method POST `
        -ContentType "application/json; charset=utf-8" `
        -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
    
    if ($response.candidates -and $response.candidates[0].content.parts[0].text) {
        Write-Host "✅ API KEY HỢP LỆ!" -ForegroundColor Green
        Write-Host "`n📝 Response từ Gemini:" -ForegroundColor Cyan
        Write-Host $response.candidates[0].content.parts[0].text -ForegroundColor White
        Write-Host "`n🎉 BẠN CÓ THỂ DÙNG API KEY NÀY!" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️ Response không đúng format!" -ForegroundColor Yellow
        Write-Host ($response | ConvertTo-Json -Depth 5)
    }
    
}
catch {
    Write-Host "❌ API KEY KHÔNG HỢP LỆ!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "`n📋 Chi tiết lỗi:" -ForegroundColor Yellow
        Write-Host $responseBody -ForegroundColor Red
    }
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray





















