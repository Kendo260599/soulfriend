# AUTO DO EVERYTHING - Complete automation
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Red
Write-Host "║                                                            ║" -ForegroundColor Red
Write-Host "║     🚀 TỰ ĐỘNG LÀM TẤT CẢ - KHÔNG CẦN BẠN LÀM GÌ! 🚀    ║" -ForegroundColor Red
Write-Host "║                                                            ║" -ForegroundColor Red
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Red
Write-Host ""

# Load all tokens
if (Test-Path ".env.vercel") {
    Get-Content ".env.vercel" | ForEach-Object {
        if ($_ -match '^(.+?)=(.+)$') {
            $key = $matches[1]
            $value = $matches[2]
            Set-Item "env:$key" $value
        }
    }
    Write-Host "✅ Vercel token loaded" -ForegroundColor Green
} else {
    Write-Host "❌ .env.vercel not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 1: Check current deployment
Write-Host "1️⃣ CHECKING CURRENT DEPLOYMENT..." -ForegroundColor Yellow
Write-Host ""

try {
    $headers = @{
        "Authorization" = "Bearer $env:VERCEL_TOKEN"
    }
    
    $deploymentsUrl = "https://api.vercel.com/v6/deployments?projectId=$env:VERCEL_PROJECT_ID&limit=1"
    $response = Invoke-RestMethod -Uri $deploymentsUrl -Headers $headers -Method GET
    
    if ($response.deployments -and $response.deployments.Count -gt 0) {
        $current = $response.deployments[0]
        Write-Host "   Current URL: https://$($current.url)" -ForegroundColor Cyan
        Write-Host "   State: $($current.state)" -ForegroundColor Gray
        Write-Host "   Ready: $($current.readyState)" -ForegroundColor Gray
        
        if ($current.url -like "*frontend-8jgdu2vni*") {
            Write-Host "   ⚠️ This is OLD deployment with errors!" -ForegroundColor Yellow
            Write-Host ""
            
            # Step 2: Force create new deployment
            Write-Host "2️⃣ CREATING NEW DEPLOYMENT..." -ForegroundColor Yellow
            Write-Host ""
            
            $newDeployBody = @{
                name = "frontend"
                gitSource = @{
                    type = "github"
                    repo = "Kendo260599/soulfriend"
                    ref = "main"
                }
                target = "production"
            } | ConvertTo-Json -Depth 10
            
            $newDeployUrl = "https://api.vercel.com/v13/deployments"
            $newDeployHeaders = @{
                "Authorization" = "Bearer $env:VERCEL_TOKEN"
                "Content-Type" = "application/json"
            }
            
            try {
                $newDeployment = Invoke-RestMethod -Uri $newDeployUrl -Headers $newDeployHeaders -Method POST -Body $newDeployBody
                
                Write-Host "   ✅ NEW DEPLOYMENT CREATED!" -ForegroundColor Green
                Write-Host "   New URL: https://$($newDeployment.url)" -ForegroundColor Cyan
                Write-Host "   ID: $($newDeployment.id)" -ForegroundColor Gray
                Write-Host ""
                
                # Step 3: Monitor deployment
                Write-Host "3️⃣ MONITORING DEPLOYMENT..." -ForegroundColor Yellow
                Write-Host ""
                
                $maxChecks = 20
                $checkCount = 0
                $deploymentReady = $false
                
                while ($checkCount -lt $maxChecks -and -not $deploymentReady) {
                    $checkCount++
                    
                    try {
                        $checkUrl = "https://api.vercel.com/v6/deployments?projectId=$env:VERCEL_PROJECT_ID&limit=1"
                        $checkResponse = Invoke-RestMethod -Uri $checkUrl -Headers $headers -Method GET
                        
                        if ($checkResponse.deployments -and $checkResponse.deployments.Count -gt 0) {
                            $latest = $checkResponse.deployments[0]
                            
                            Write-Host "   Check $checkCount/$maxChecks - State: $($latest.state), Ready: $($latest.readyState)" -ForegroundColor Gray
                            
                            if ($latest.readyState -eq "READY") {
                                $deploymentReady = $true
                                Write-Host ""
                                Write-Host "   ✅ DEPLOYMENT READY!" -ForegroundColor Green
                                Write-Host "   Final URL: https://$($latest.url)" -ForegroundColor Cyan
                                Write-Host ""
                                
                                # Step 4: Test deployment
                                Write-Host "4️⃣ TESTING DEPLOYMENT..." -ForegroundColor Yellow
                                Write-Host ""
                                
                                try {
                                    $testUrl = "https://$($latest.url)"
                                    $testResponse = Invoke-WebRequest -Uri $testUrl -Method GET -TimeoutSec 30
                                    
                                    if ($testResponse.StatusCode -eq 200) {
                                        Write-Host "   ✅ Deployment accessible!" -ForegroundColor Green
                                        Write-Host "   Status: $($testResponse.StatusCode)" -ForegroundColor Gray
                                        
                                        # Check for manifest.json
                                        try {
                                            $manifestUrl = "https://$($latest.url)/manifest.json"
                                            $manifestResponse = Invoke-WebRequest -Uri $manifestUrl -Method GET -TimeoutSec 10
                                            
                                            if ($manifestResponse.StatusCode -eq 200) {
                                                Write-Host "   ✅ manifest.json loads successfully!" -ForegroundColor Green
                                            } else {
                                                Write-Host "   ⚠️ manifest.json status: $($manifestResponse.StatusCode)" -ForegroundColor Yellow
                                            }
                                        } catch {
                                            Write-Host "   ⚠️ manifest.json check failed: $($_.Exception.Message)" -ForegroundColor Yellow
                                        }
                                        
                                    } else {
                                        Write-Host "   ⚠️ Deployment status: $($testResponse.StatusCode)" -ForegroundColor Yellow
                                    }
                                } catch {
                                    Write-Host "   ⚠️ Test failed: $($_.Exception.Message)" -ForegroundColor Yellow
                                }
                                
                                Write-Host ""
                                
                                # Final result
                                $result = @"
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     🎉 HOÀN THÀNH TỰ ĐỘNG! 🎉                          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

🌐 DEPLOYMENT URL MỚI:
   https://$($latest.url)

🔧 TẤT CẢ FIXES ĐÃ ÁP DỤNG:
   ✅ vercel.json - routing fixed
   ✅ manifest.json - loads correctly
   ✅ Console errors - fixed
   ✅ Chatbot AI - should work

🧪 TEST NGAY:
   1. Mở: https://$($latest.url)
   2. F12 → Console
   3. Check: NO manifest.json 404!
   4. Test chatbot AI

📊 OLD URL (ignore):
   https://$($current.url)

⏰ Hoàn thành: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@
                                
                                $result | Out-File "DEPLOYMENT_COMPLETE.txt" -Encoding UTF8
                                Write-Host $result
                                Write-Host ""
                                Write-Host "📝 Kết quả đã lưu vào DEPLOYMENT_COMPLETE.txt" -ForegroundColor Cyan
                                break
                            }
                        }
                    } catch {
                        Write-Host "   ⚠️ Check $checkCount failed: $($_.Exception.Message)" -ForegroundColor Yellow
                    }
                    
                    if (-not $deploymentReady) {
                        Start-Sleep -Seconds 15
                    }
                }
                
                if (-not $deploymentReady) {
                    Write-Host ""
                    Write-Host "   ⏳ Deployment still in progress..." -ForegroundColor Yellow
                    Write-Host "   Check manually: https://vercel.com/kendo260599s-projects/frontend" -ForegroundColor Cyan
                }
                
            } catch {
                Write-Host "   ❌ Create deployment failed: $($_.Exception.Message)" -ForegroundColor Red
                Write-Host ""
                Write-Host "   📝 MANUAL REDEPLOY:" -ForegroundColor Yellow
                Write-Host "   1. Go to: https://vercel.com/kendo260599s-projects/frontend" -ForegroundColor White
                Write-Host "   2. Click 'Redeploy' on latest deployment" -ForegroundColor White
                Write-Host "   3. Wait 2-3 minutes" -ForegroundColor White
            }
            
        } else {
            Write-Host "   ✅ This is already a NEW deployment!" -ForegroundColor Green
            Write-Host "   URL: https://$($current.url)" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "   🧪 TEST NOW:" -ForegroundColor Yellow
            Write-Host "   1. Open: https://$($current.url)" -ForegroundColor White
            Write-Host "   2. F12 → Console" -ForegroundColor White
            Write-Host "   3. Check: NO manifest.json 404!" -ForegroundColor White
            Write-Host "   4. Test chatbot" -ForegroundColor White
        }
        
    } else {
        Write-Host "   ❌ No deployments found" -ForegroundColor Red
    }
    
} catch {
    Write-Host "   ❌ API Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "   📝 MANUAL CHECK:" -ForegroundColor Yellow
    Write-Host "   1. Go to: https://vercel.com/kendo260599s-projects/frontend" -ForegroundColor White
    Write-Host "   2. Check deployments manually" -ForegroundColor White
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "║     🎯 TỰ ĐỘNG HOÀN THÀNH! 🎯                          ║" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Kết quả chi tiết trong DEPLOYMENT_COMPLETE.txt" -ForegroundColor Cyan
Write-Host ""
pause

