# Debug Long-term Memory Test
# This script tests the long-term memory endpoint with detailed error output

$baseUrl = "https://soulfriend-api.onrender.com/api/test/memory"
$userId = "debug_user_$(Get-Date -Format 'yyyyMMddHHmmss')"

Write-Host "`n🔍 Debugging Long-term Memory Test`n" -ForegroundColor Cyan

Write-Host "Testing with userId: $userId" -ForegroundColor Yellow

try {
    $body = @{ userId = $userId } | ConvertTo-Json
    Write-Host "Sending request..." -ForegroundColor Gray
    
    $response = Invoke-WebRequest -Uri "$baseUrl/long-term-memory" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 45
    
    Write-Host "`n✅ Success! Status: $($response.StatusCode)" -ForegroundColor Green
    $result = $response.Content | ConvertFrom-Json
    Write-Host ($result | ConvertTo-Json -Depth 10) -ForegroundColor Cyan
    
} catch {
    Write-Host "`n❌ Error occurred!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    
    # Try to get the error response body
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        $reader.Close()
        
        Write-Host "`nError Response Body:" -ForegroundColor Yellow
        Write-Host $errorBody -ForegroundColor Red
        
        # Try to parse as JSON
        try {
            $errorJson = $errorBody | ConvertFrom-Json
            Write-Host "`nParsed Error:" -ForegroundColor Yellow
            Write-Host "Message: $($errorJson.error)" -ForegroundColor Red
            if ($errorJson.details) {
                Write-Host "Details: $($errorJson.details)" -ForegroundColor Red
            }
        } catch {
            Write-Host "Could not parse error as JSON" -ForegroundColor Gray
        }
    } catch {
        Write-Host "Could not read error response body" -ForegroundColor Gray
    }
    
    Write-Host "`nFull Exception:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n✅ Debug test complete`n" -ForegroundColor Cyan
