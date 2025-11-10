# ============================================
# 🔗 AUTO UPDATE FRONTEND FOR RENDER CONNECTION
# ============================================
# Script để tự động update frontend config để kết nối với Render

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🔗 UPDATE FRONTEND FOR RENDER" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

$renderUrl = "https://soulfriend-api.onrender.com"

# ============================================
# STEP 1: UPDATE vercel.json
# ============================================
Write-Host "📦 Step 1: Updating vercel.json..." -ForegroundColor Yellow

$vercelJsonPath = "vercel.json"

if (Test-Path $vercelJsonPath) {
    $vercelConfig = Get-Content $vercelJsonPath -Raw | ConvertFrom-Json
    
    # Update Content-Security-Policy
    $cspHeader = $vercelConfig.headers[0].headers | Where-Object { $_.key -eq "Content-Security-Policy" }
    
    if ($cspHeader) {
        # Remove old Railway URLs and add Render URLs
        $oldCsp = $cspHeader.value
        
        # Update connect-src to include Render
        $newCsp = $oldCsp -replace 'https://soulfriend-production\.up\.railway\.app', ''
        $newCsp = $newCsp -replace 'https://api\.railway\.app', ''
        $newCsp = $newCsp -replace 'https://api\.cerebras\.ai', ''
        
        # Add Render URLs if not present
        if ($newCsp -notmatch 'https://soulfriend-api\.onrender\.com') {
            $newCsp = $newCsp -replace 'connect-src ''self''', "connect-src 'self' https://soulfriend-api.onrender.com wss://soulfriend-api.onrender.com"
        }
        
        $cspHeader.value = $newCsp
        
        # Save updated config
        $vercelConfig | ConvertTo-Json -Depth 10 | Set-Content $vercelJsonPath
        
        Write-Host "  ✅ Updated vercel.json CSP headers" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  CSP header not found in vercel.json" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ❌ vercel.json not found!" -ForegroundColor Red
    exit 1
}

# ============================================
# STEP 2: UPDATE frontend/.env.production.template
# ============================================
Write-Host "`n📦 Step 2: Updating .env.production.template..." -ForegroundColor Yellow

$envTemplatePath = "frontend\.env.production.template"

if (Test-Path $envTemplatePath) {
    $envContent = "# Production Environment Variables for Vercel`nREACT_APP_API_URL=$renderUrl`n"
    
    Set-Content -Path $envTemplatePath -Value $envContent
    
    Write-Host "  ✅ Updated .env.production.template" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Creating .env.production.template..." -ForegroundColor Yellow
    $envContent = "# Production Environment Variables for Vercel`nREACT_APP_API_URL=$renderUrl`n"
    New-Item -Path "frontend" -Name ".env.production.template" -ItemType File -Value $envContent -Force
    Write-Host "  ✅ Created .env.production.template" -ForegroundColor Green
}

# ============================================
# STEP 3: UPDATE frontend/src/config/api.ts
# ============================================
Write-Host "`n📦 Step 3: Updating api.ts fallback URL..." -ForegroundColor Yellow

$apiConfigPath = "frontend\src\config\api.ts"

if (Test-Path $apiConfigPath) {
    $apiContent = Get-Content $apiConfigPath -Raw
    
    # Update fallback URL
    $apiContent = $apiContent -replace "https://soulfriend-production\.up\.railway\.app", $renderUrl
    
    Set-Content -Path $apiConfigPath -Value $apiContent
    
    Write-Host "  ✅ Updated api.ts fallback URL" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  api.ts not found - skipping" -ForegroundColor Yellow
}

# ============================================
# STEP 4: UPDATE OTHER COMPONENTS
# ============================================
Write-Host "`n📦 Step 4: Updating frontend components..." -ForegroundColor Yellow

$componentsToUpdate = @(
    "frontend\src\components\ChatBot.tsx",
    "frontend\src\components\ExpertLogin.tsx",
    "frontend\src\components\ExpertDashboard.tsx",
    "frontend\src\services\monitoringService.ts",
    "frontend\src\services\cloudResearchService.ts",
    "frontend\src\contexts\AIContext.tsx"
)

$updatedCount = 0

foreach ($componentPath in $componentsToUpdate) {
    if (Test-Path $componentPath) {
        $content = Get-Content $componentPath -Raw
        
        if ($content -match "https://soulfriend-production\.up\.railway\.app") {
            $content = $content -replace "https://soulfriend-production\.up\.railway\.app", $renderUrl
            Set-Content -Path $componentPath -Value $content
            
            $fileName = Split-Path $componentPath -Leaf
            Write-Host "  ✅ Updated $fileName" -ForegroundColor Green
            $updatedCount++
        }
    }
}

Write-Host "  📊 Updated $updatedCount component files" -ForegroundColor Cyan

# ============================================
# STEP 5: CREATE VERCEL ENV SETUP SCRIPT
# ============================================
Write-Host "`n📦 Step 5: Creating Vercel environment setup guide..." -ForegroundColor Yellow

$vercelEnvGuide = @"
# 🔧 VERCEL ENVIRONMENT VARIABLES SETUP

## Quick Setup via Vercel Dashboard:

1. Go to: https://vercel.com/dashboard
2. Select project: **soulfriend**
3. Settings → Environment Variables
4. Add new variable:

\`\`\`
Key: REACT_APP_API_URL
Value: $renderUrl

Environments:
☑ Production
☑ Preview  
☑ Development
\`\`\`

5. Save and Redeploy

---

## Or via Vercel CLI:

\`\`\`powershell
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Add environment variable
vercel env add REACT_APP_API_URL production

# When prompted, enter:
$renderUrl

# Also add for preview and development
vercel env add REACT_APP_API_URL preview
vercel env add REACT_APP_API_URL development

# Redeploy
vercel --prod
\`\`\`

---

## Verify:

After deployment, check in browser console:

\`\`\`javascript
console.log(process.env.REACT_APP_API_URL);
// Should output: $renderUrl
\`\`\`

---

## ✅ Checklist:

- [ ] Add REACT_APP_API_URL to Vercel (Production)
- [ ] Add REACT_APP_API_URL to Vercel (Preview)
- [ ] Add REACT_APP_API_URL to Vercel (Development)
- [ ] Trigger Vercel redeploy
- [ ] Test API connection from frontend
- [ ] Test Socket.io connection
- [ ] Verify CORS working

---

**Note:** Vercel will automatically use this environment variable during build.
The fallback URL in code is now also updated to $renderUrl
"@

Set-Content -Path "VERCEL_ENV_SETUP.md" -Value $vercelEnvGuide

Write-Host "  ✅ Created VERCEL_ENV_SETUP.md" -ForegroundColor Green

# ============================================
# STEP 6: SUMMARY
# ============================================
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "🎉 FRONTEND UPDATE COMPLETED!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Render URL    : $renderUrl" -ForegroundColor White
Write-Host "Updated Files : vercel.json, .env.production.template, api.ts, $updatedCount components" -ForegroundColor White
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "📋 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Review changes:" -ForegroundColor White
Write-Host "     git diff vercel.json" -ForegroundColor Cyan
Write-Host "     git diff frontend/" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. Commit changes:" -ForegroundColor White
Write-Host "     git add ." -ForegroundColor Cyan
Write-Host "     git commit -m ""Update frontend to connect with Render backend""" -ForegroundColor Cyan
Write-Host "     git push origin main" -ForegroundColor Cyan
Write-Host ""
Write-Host "  3. Add environment variable to Vercel:" -ForegroundColor White
Write-Host "     Follow instructions in: VERCEL_ENV_SETUP.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "  4. Vercel will auto-deploy from GitHub push" -ForegroundColor White
Write-Host "     Or manually: vercel --prod" -ForegroundColor Cyan
Write-Host ""
Write-Host "  5. Test connection:" -ForegroundColor White
Write-Host "     https://soulfriend.vercel.app" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  IMPORTANT:" -ForegroundColor Yellow
Write-Host "  • Must add REACT_APP_API_URL to Vercel dashboard" -ForegroundColor Red
Write-Host "  • Must redeploy Vercel after adding env var" -ForegroundColor Red
Write-Host "  • Test CORS and Socket.io after deployment" -ForegroundColor Red

Write-Host "`n🔗 Quick Links:" -ForegroundColor Cyan
Write-Host "  Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "  Backend Health  : $renderUrl/api/health" -ForegroundColor White
Write-Host "  Setup Guide     : CONNECT_RENDER_VERCEL.md" -ForegroundColor White
Write-Host "  Env Setup       : VERCEL_ENV_SETUP.md" -ForegroundColor White

Write-Host "`n✨ Script completed!`n" -ForegroundColor Cyan
