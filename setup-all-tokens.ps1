# SETUP ALL API TOKENS FOR COMPLETE AUTOMATION
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "║     🔑 SETUP ALL API TOKENS 🔑                         ║" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Cấp quyền đầy đủ cho AI để tự động hóa hoàn toàn!" -ForegroundColor Gray
Write-Host ""

# Check existing tokens
$hasVercel = Test-Path ".env.vercel"
$hasGitHub = $false
$hasRender = $false

if (Test-Path ".env.tokens") {
    $content = Get-Content ".env.tokens" -Raw
    $hasGitHub = $content -match "GITHUB_TOKEN"
    $hasRender = $content -match "RENDER_API_KEY"
}

Write-Host "📊 CURRENT STATUS:" -ForegroundColor Yellow
Write-Host "   Vercel: $(if ($hasVercel) { '✅ Configured' } else { '❌ Missing' })" -ForegroundColor $(if ($hasVercel) { 'Green' } else { 'Red' })
Write-Host "   GitHub: $(if ($hasGitHub) { '✅ Configured' } else { '❌ Missing' })" -ForegroundColor $(if ($hasGitHub) { 'Green' } else { 'Red' })
Write-Host "   Render: $(if ($hasRender) { '✅ Configured' } else { '❌ Missing' })" -ForegroundColor $(if ($hasRender) { 'Green' } else { 'Red' })
Write-Host ""

# ====================================
# GITHUB TOKEN
# ====================================
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "1️⃣ GITHUB PERSONAL ACCESS TOKEN" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($hasGitHub) {
    Write-Host "✅ GitHub token already configured!" -ForegroundColor Green
    $updateGitHub = Read-Host "Update GitHub token? (y/n)"
    if ($updateGitHub -ne 'y') {
        $githubToken = ""
    } else {
        Write-Host ""
        Write-Host "📋 TO CREATE GITHUB TOKEN:" -ForegroundColor Yellow
        Write-Host "1. Go to: https://github.com/settings/tokens" -ForegroundColor White
        Write-Host "2. Click 'Generate new token (classic)'" -ForegroundColor White
        Write-Host "3. Name: 'AI Assistant Auto Deploy'" -ForegroundColor White
        Write-Host "4. Select scopes:" -ForegroundColor White
        Write-Host "   ☑ repo (all)" -ForegroundColor Gray
        Write-Host "   ☑ workflow" -ForegroundColor Gray
        Write-Host "5. Click 'Generate token'" -ForegroundColor White
        Write-Host "6. COPY the token (shown only once!)" -ForegroundColor White
        Write-Host ""
        Start-Process "https://github.com/settings/tokens"
        $githubToken = Read-Host "Paste your GitHub token here"
    }
} else {
    Write-Host "📋 TO CREATE GITHUB TOKEN:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://github.com/settings/tokens" -ForegroundColor White
    Write-Host "2. Click 'Generate new token (classic)'" -ForegroundColor White
    Write-Host "3. Name: 'AI Assistant Auto Deploy'" -ForegroundColor White
    Write-Host "4. Select scopes:" -ForegroundColor White
    Write-Host "   ☑ repo (all)" -ForegroundColor Gray
    Write-Host "   ☑ workflow" -ForegroundColor Gray
    Write-Host "5. Click 'Generate token'" -ForegroundColor White
    Write-Host "6. COPY the token (shown only once!)" -ForegroundColor White
    Write-Host ""
    Write-Host "Opening GitHub settings..." -ForegroundColor Gray
    Start-Process "https://github.com/settings/tokens"
    Write-Host ""
    $githubToken = Read-Host "Paste your GitHub token here (or press Enter to skip)"
}

# ====================================
# RENDER API KEY
# ====================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "2️⃣ RENDER API KEY" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($hasRender) {
    Write-Host "✅ Render API key already configured!" -ForegroundColor Green
    $updateRender = Read-Host "Update Render API key? (y/n)"
    if ($updateRender -ne 'y') {
        $renderKey = ""
    } else {
        Write-Host ""
        Write-Host "📋 TO CREATE RENDER API KEY:" -ForegroundColor Yellow
        Write-Host "1. Go to: https://dashboard.render.com/account/settings" -ForegroundColor White
        Write-Host "2. Scroll to 'API Keys' section" -ForegroundColor White
        Write-Host "3. Click 'Create API Key'" -ForegroundColor White
        Write-Host "4. Name: 'AI Assistant Auto Deploy'" -ForegroundColor White
        Write-Host "5. COPY the key" -ForegroundColor White
        Write-Host ""
        Start-Process "https://dashboard.render.com/account/settings"
        $renderKey = Read-Host "Paste your Render API key here"
    }
} else {
    Write-Host "📋 TO CREATE RENDER API KEY:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://dashboard.render.com/account/settings" -ForegroundColor White
    Write-Host "2. Scroll to 'API Keys' section" -ForegroundColor White
    Write-Host "3. Click 'Create API Key'" -ForegroundColor White
    Write-Host "4. Name: 'AI Assistant Auto Deploy'" -ForegroundColor White
    Write-Host "5. COPY the key" -ForegroundColor White
    Write-Host ""
    Write-Host "Opening Render dashboard..." -ForegroundColor Gray
    Start-Process "https://dashboard.render.com/account/settings"
    Write-Host ""
    $renderKey = Read-Host "Paste your Render API key here (or press Enter to skip)"
}

# ====================================
# SAVE TOKENS
# ====================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "💾 SAVING TOKENS" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$tokenContent = @"
# API Tokens for Complete Automation
# Created: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

"@

if ($githubToken) {
    $tokenContent += "GITHUB_TOKEN=$githubToken`n"
    $tokenContent += "GITHUB_REPO=Kendo260599/soulfriend`n"
    Write-Host "✅ GitHub token saved" -ForegroundColor Green
}

if ($renderKey) {
    $tokenContent += "RENDER_API_KEY=$renderKey`n"
    $tokenContent += "RENDER_SERVICE_ID=your_service_id`n"
    Write-Host "✅ Render API key saved" -ForegroundColor Green
}

if ($githubToken -or $renderKey) {
    $tokenContent | Out-File -FilePath ".env.tokens" -Encoding UTF8
    
    # Add to .gitignore
    if (Test-Path ".gitignore") {
        $gitignoreContent = Get-Content ".gitignore" -Raw
        if ($gitignoreContent -notmatch "\.env\.tokens") {
            Add-Content -Path ".gitignore" -Value "`n# API Tokens`n.env.tokens"
            Write-Host "✅ Added .env.tokens to .gitignore" -ForegroundColor Green
        }
    }
    
    # Set environment variables
    if ($githubToken) {
        $env:GITHUB_TOKEN = $githubToken
    }
    if ($renderKey) {
        $env:RENDER_API_KEY = $renderKey
    }
}

# ====================================
# SUMMARY
# ====================================
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "║     ✅ SETUP COMPLETE! ✅                              ║" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📊 TOKEN STATUS:" -ForegroundColor Cyan
Write-Host "   Vercel: $(if ($hasVercel) { '✅' } else { '❌' })" -ForegroundColor $(if ($hasVercel) { 'Green' } else { 'Red' })
Write-Host "   GitHub: $(if ($githubToken -or $hasGitHub) { '✅' } else { '❌' })" -ForegroundColor $(if ($githubToken -or $hasGitHub) { 'Green' } else { 'Red' })
Write-Host "   Render: $(if ($renderKey -or $hasRender) { '✅' } else { '❌' })" -ForegroundColor $(if ($renderKey -or $hasRender) { 'Green' } else { 'Red' })
Write-Host ""

Write-Host "🎯 BÂY GIỜ AI CÓ THỂ:" -ForegroundColor Yellow
if ($hasVercel) {
    Write-Host "   ✅ Deploy frontend tự động (Vercel)" -ForegroundColor Green
}
if ($githubToken -or $hasGitHub) {
    Write-Host "   ✅ Push code tự động (GitHub)" -ForegroundColor Green
}
if ($renderKey -or $hasRender) {
    Write-Host "   ✅ Deploy backend tự động (Render)" -ForegroundColor Green
}
Write-Host ""

if (($hasVercel -or $githubToken) -and ($githubToken -or $hasGitHub) -and ($renderKey -or $hasRender)) {
    Write-Host "🌸 COMPLETE AUTOMATION ENABLED!" -ForegroundColor Green
    Write-Host "   AI có thể tự động fix, commit, push và deploy!" -ForegroundColor White
} else {
    Write-Host "⚠️ PARTIAL AUTOMATION:" -ForegroundColor Yellow
    Write-Host "   Một số tác vụ vẫn cần manual." -ForegroundColor Gray
}
Write-Host ""

Write-Host "🔒 SECURITY REMINDER:" -ForegroundColor Yellow
Write-Host "   • Tokens saved in .env.tokens (gitignored)" -ForegroundColor Gray
Write-Host "   • NEVER commit this file!" -ForegroundColor Gray
Write-Host "   • Revoke tokens when done" -ForegroundColor Gray
Write-Host ""

