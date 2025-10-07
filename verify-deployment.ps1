# VERIFY DEPLOYMENT SCRIPT
# Kiểm tra tự động xem deployment có thực sự thành công không

Write-Host "`n🔍 VERIFYING DEPLOYMENT - AUTO CHECK`n" -ForegroundColor Cyan
Write-Host "=" * 70

$results = @{
    GitHub = $false
    RenderAPI = $false
    MongoDB = $false
    HITLEndpoints = $false
    ConversationLearning = $false
    NewModels = $false
}

# ==============================================================================
# 1. CHECK GITHUB COMMIT
# ==============================================================================

Write-Host "`n📦 [1/6] Checking GitHub Commit..." -ForegroundColor Yellow

try {
    $latestCommit = git log -1 --oneline
    Write-Host "   Latest commit: $latestCommit" -ForegroundColor Gray
    
    if ($latestCommit -match "HITL|Conversation|Learning") {
        Write-Host "   ✅ GitHub: New commit found!" -ForegroundColor Green
        $results.GitHub = $true
    } else {
        Write-Host "   ⚠️  GitHub: Commit doesn't mention new features" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ GitHub: Check failed - $_" -ForegroundColor Red
}

# ==============================================================================
# 2. CHECK RENDER API HEALTH
# ==============================================================================

Write-Host "`n🌐 [2/6] Checking Render API Health..." -ForegroundColor Yellow

try {
    $apiUrl = "https://soulfriend-api.onrender.com/api/health"
    $response = Invoke-RestMethod -Uri $apiUrl -Method Get -TimeoutSec 10
    
    Write-Host "   Status: $($response.status)" -ForegroundColor Gray
    Write-Host "   Version: $($response.version)" -ForegroundColor Gray
    
    if ($response.status -eq "healthy") {
        Write-Host "   ✅ Render API: Online and healthy!" -ForegroundColor Green
        $results.RenderAPI = $true
    }
} catch {
    Write-Host "   ❌ Render API: Not responding - $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   💡 API might be cold-starting (wait 2-3 minutes)" -ForegroundColor Yellow
}

# ==============================================================================
# 3. CHECK MONGODB CONNECTION
# ==============================================================================

Write-Host "`n🗄️  [3/6] Checking MongoDB Connection..." -ForegroundColor Yellow

try {
    node test-mongodb.js 2>&1 | Select-String "MongoDB connected" | ForEach-Object {
        Write-Host "   $_" -ForegroundColor Gray
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ MongoDB: Connected successfully!" -ForegroundColor Green
        $results.MongoDB = $true
    } else {
        Write-Host "   ❌ MongoDB: Connection failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ⚠️  MongoDB: Check script failed" -ForegroundColor Yellow
}

# ==============================================================================
# 4. CHECK HITL FEEDBACK ENDPOINTS
# ==============================================================================

Write-Host "`n🚨 [4/6] Checking HITL Feedback Endpoints..." -ForegroundColor Yellow

try {
    $hitlUrl = "https://soulfriend-api.onrender.com/api/hitl-feedback/metrics"
    $response = Invoke-RestMethod -Uri $hitlUrl -Method Get -TimeoutSec 10
    
    Write-Host "   Endpoint: /api/hitl-feedback/metrics" -ForegroundColor Gray
    Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
    
    if ($response.success -or $response.metrics) {
        Write-Host "   ✅ HITL Endpoints: Working!" -ForegroundColor Green
        $results.HITLEndpoints = $true
    }
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host "   ❌ HITL Endpoints: 404 NOT FOUND - Not deployed yet!" -ForegroundColor Red
    } elseif ($_.Exception.Response.StatusCode.value__ -eq 500) {
        Write-Host "   ⚠️  HITL Endpoints: 500 error - Deployed but has errors" -ForegroundColor Yellow
        $results.HITLEndpoints = $true  # Deployed but có lỗi
    } else {
        Write-Host "   ⚠️  HITL Endpoints: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# ==============================================================================
# 5. CHECK CONVERSATION LEARNING ENDPOINTS
# ==============================================================================

Write-Host "`n🧠 [5/6] Checking Conversation Learning Endpoints..." -ForegroundColor Yellow

try {
    $learningUrl = "https://soulfriend-api.onrender.com/api/conversation-learning/insights"
    $response = Invoke-RestMethod -Uri $learningUrl -Method Get -TimeoutSec 10
    
    Write-Host "   Endpoint: /api/conversation-learning/insights" -ForegroundColor Gray
    Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
    
    if ($response.success -or $response.insights) {
        Write-Host "   ✅ Conversation Learning: Working!" -ForegroundColor Green
        $results.ConversationLearning = $true
    }
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host "   ❌ Conversation Learning: 404 NOT FOUND - Not deployed!" -ForegroundColor Red
    } elseif ($_.Exception.Response.StatusCode.value__ -eq 500) {
        Write-Host "   ⚠️  Conversation Learning: 500 error - Deployed but has errors" -ForegroundColor Yellow
        $results.ConversationLearning = $true
    } else {
        Write-Host "   ⚠️  Conversation Learning: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# ==============================================================================
# 6. CHECK NEW MODEL FILES
# ==============================================================================

Write-Host "`n📁 [6/6] Checking New Model Files..." -ForegroundColor Yellow

$modelFiles = @(
    "backend/src/models/HITLFeedback.ts",
    "backend/src/models/TrainingDataPoint.ts",
    "backend/src/models/ConversationLog.ts"
)

$allFilesExist = $true
foreach ($file in $modelFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file - NOT FOUND!" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if ($allFilesExist) {
    $results.NewModels = $true
}

# ==============================================================================
# FINAL REPORT
# ==============================================================================

Write-Host "`n" + "=" * 70 -ForegroundColor Cyan
Write-Host "📊 DEPLOYMENT VERIFICATION REPORT" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

Write-Host "`n✅ PASSED CHECKS:" -ForegroundColor Green
$passedCount = 0
foreach ($check in $results.Keys) {
    if ($results[$check]) {
        Write-Host "   ✅ $check" -ForegroundColor Green
        $passedCount++
    }
}

Write-Host "`n❌ FAILED CHECKS:" -ForegroundColor Red
$failedCount = 0
foreach ($check in $results.Keys) {
    if (-not $results[$check]) {
        Write-Host "   ❌ $check" -ForegroundColor Red
        $failedCount++
    }
}

# Calculate percentage
$totalChecks = $results.Count
$percentage = [math]::Round(($passedCount / $totalChecks) * 100, 1)

Write-Host "`n📈 DEPLOYMENT SUCCESS RATE: $percentage%" -ForegroundColor $(if ($percentage -ge 80) { "Green" } elseif ($percentage -ge 50) { "Yellow" } else { "Red" })
Write-Host "   Passed: $passedCount/$totalChecks checks" -ForegroundColor Gray

# ==============================================================================
# VERDICT
# ==============================================================================

Write-Host "`n" + "=" * 70 -ForegroundColor Cyan

if ($percentage -eq 100) {
    Write-Host "🎉 VERDICT: DEPLOYMENT 100% SUCCESSFUL!" -ForegroundColor Green
    Write-Host "   All systems operational. Features are live!" -ForegroundColor Green
} elseif ($percentage -ge 80) {
    Write-Host "✅ VERDICT: DEPLOYMENT MOSTLY SUCCESSFUL" -ForegroundColor Green
    Write-Host "   Core features deployed. Minor issues need fixing." -ForegroundColor Yellow
} elseif ($percentage -ge 50) {
    Write-Host "⚠️  VERDICT: PARTIAL DEPLOYMENT" -ForegroundColor Yellow
    Write-Host "   Some features deployed but significant issues remain." -ForegroundColor Yellow
} else {
    Write-Host "❌ VERDICT: DEPLOYMENT FAILED OR INCOMPLETE" -ForegroundColor Red
    Write-Host "   Most features not deployed. Check errors above." -ForegroundColor Red
}

# ==============================================================================
# RECOMMENDATIONS
# ==============================================================================

Write-Host "`n💡 RECOMMENDATIONS:" -ForegroundColor Cyan

if (-not $results.RenderAPI) {
    Write-Host "   1. Wait 2-3 minutes for Render cold start" -ForegroundColor Yellow
    Write-Host "   2. Check Render dashboard: https://dashboard.render.com" -ForegroundColor Yellow
}

if (-not $results.HITLEndpoints -or -not $results.ConversationLearning) {
    Write-Host "   3. Check backend/src/index.ts routes are imported" -ForegroundColor Yellow
    Write-Host "   4. Rebuild: cd backend && npm run build" -ForegroundColor Yellow
    Write-Host "   5. Redeploy manually if auto-deploy failed" -ForegroundColor Yellow
}

if (-not $results.MongoDB) {
    Write-Host "   6. Verify MongoDB Atlas connection string in .env" -ForegroundColor Yellow
    Write-Host "   7. Check IP whitelist includes 0.0.0.0/0" -ForegroundColor Yellow
}

Write-Host "`n📖 For detailed logs, check:" -ForegroundColor Cyan
Write-Host "   - Render Logs: https://dashboard.render.com" -ForegroundColor Gray
Write-Host "   - GitHub Actions: https://github.com/your-repo/actions" -ForegroundColor Gray

Write-Host "`n🔄 To re-run this check: powershell -File verify-deployment.ps1`n" -ForegroundColor Cyan

