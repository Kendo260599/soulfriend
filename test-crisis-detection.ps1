# Test Crisis Detection Debug Endpoint
$testMessages = @(
    "Tôi muốn tự tử",
    "Tôi sẽ làm đêm nay",
    "Tôi đã chuẩn bị dao rồi",
    "Xin chào"
)

Write-Host "🧪 Testing Crisis Detection Function Directly..." -ForegroundColor Yellow
Write-Host ""

foreach ($msg in $testMessages) {
    $encoded = [System.Web.HttpUtility]::UrlEncode($msg)
    $url = "http://localhost:5000/api/v2/chatbot/debug/crisis-test?message=$encoded"
    
    Write-Host "📨 Testing: '$msg'" -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing
        $result = $response.Content | ConvertFrom-Json
        
        Write-Host "   Crisis Detected: $($result.crisisDetected)" -ForegroundColor $(if($result.crisisDetected){'Red'}else{'Green'})
        Write-Host "   Crisis Level: $($result.crisisLevel)" -ForegroundColor $(if($result.crisisLevel -eq 'critical'){'Red'}else{'Yellow'})
        Write-Host "   Risk Level: $($result.riskLevel)" -ForegroundColor $(if($result.riskLevel -eq 'CRITICAL'){'Red'}else{'Yellow'})
        
        if ($result.crisis) {
            Write-Host "   Crisis ID: $($result.crisis.id)" -ForegroundColor Gray
            Write-Host "   Triggers: $($result.crisis.triggers -join ', ')" -ForegroundColor Gray
        }
        
    } catch {
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

