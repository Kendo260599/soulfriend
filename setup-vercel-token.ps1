# SETUP VERCEL TOKEN - Interactive Script
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "║     🔑 VERCEL TOKEN SETUP 🔑                          ║" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Hướng dẫn tạo và lưu Vercel API Token" -ForegroundColor Gray
Write-Host ""

# Step 1: Guide to create token
Write-Host "📋 BƯỚC 1: TẠO VERCEL TOKEN" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""
Write-Host "1. Mở URL sau trong browser:" -ForegroundColor White
Write-Host "   https://vercel.com/account/tokens" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Click 'Create Token'" -ForegroundColor White
Write-Host ""
Write-Host "3. Điền thông tin:" -ForegroundColor White
Write-Host "   • Name: AI Assistant Auto Deploy" -ForegroundColor Gray
Write-Host "   • Scope: Full Account" -ForegroundColor Gray
Write-Host "   • Expiration: No Expiration" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Click 'Create' và COPY token" -ForegroundColor White
Write-Host "   (Token chỉ hiện 1 lần!)" -ForegroundColor Yellow
Write-Host ""

# Ask for token
Write-Host "═══════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""
$token = Read-Host "Paste your Vercel token here"

if (-not $token) {
    Write-Host ""
    Write-Host "❌ No token provided!" -ForegroundColor Red
    Write-Host "Run this script again when you have the token." -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "✅ Token received: $($token.Substring(0, 10))..." -ForegroundColor Green
Write-Host ""

# Step 2: Get Project ID
Write-Host "📋 BƯỚC 2: LẤY PROJECT INFORMATION" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""
Write-Host "Đang lấy thông tin project từ Vercel..." -ForegroundColor White

$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    # Get user info
    $userResponse = Invoke-RestMethod -Uri "https://api.vercel.com/v2/user" -Headers $headers -Method GET
    $username = $userResponse.username
    Write-Host "✅ Logged in as: $username" -ForegroundColor Green
    
    # Get projects
    Write-Host "✅ Đang tìm projects..." -ForegroundColor Green
    $projectsResponse = Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects" -Headers $headers -Method GET
    
    if ($projectsResponse.projects.Count -gt 0) {
        Write-Host ""
        Write-Host "📦 YOUR PROJECTS:" -ForegroundColor Cyan
        $i = 1
        foreach ($project in $projectsResponse.projects) {
            Write-Host "   $i. $($project.name) (ID: $($project.id))" -ForegroundColor White
            $i++
        }
        Write-Host ""
        
        # Find frontend project
        $frontendProject = $projectsResponse.projects | Where-Object { $_.name -eq "frontend" }
        if ($frontendProject) {
            $projectId = $frontendProject.id
            $projectName = $frontendProject.name
            Write-Host "✅ Found 'frontend' project!" -ForegroundColor Green
            Write-Host "   ID: $projectId" -ForegroundColor Gray
        } else {
            Write-Host "⚠️ No 'frontend' project found, using first project..." -ForegroundColor Yellow
            $projectId = $projectsResponse.projects[0].id
            $projectName = $projectsResponse.projects[0].name
        }
    } else {
        Write-Host "❌ No projects found!" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible reasons:" -ForegroundColor Yellow
    Write-Host "• Token is invalid" -ForegroundColor Gray
    Write-Host "• Token doesn't have correct permissions" -ForegroundColor Gray
    Write-Host "• Network error" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# Step 3: Save to .env file
Write-Host ""
Write-Host "📋 BƯỚC 3: LƯU TOKEN" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""

$envContent = @"
# Vercel API Configuration
# Created: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

VERCEL_TOKEN=$token
VERCEL_PROJECT_ID=$projectId
VERCEL_PROJECT_NAME=$projectName
VERCEL_ORG_ID=$username
"@

# Save to .env.vercel
$envContent | Out-File -FilePath ".env.vercel" -Encoding UTF8
Write-Host "✅ Token saved to .env.vercel" -ForegroundColor Green

# Add to .gitignore
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    if ($gitignoreContent -notmatch "\.env\.vercel") {
        Add-Content -Path ".gitignore" -Value "`n# Vercel Token`n.env.vercel"
        Write-Host "✅ Added .env.vercel to .gitignore" -ForegroundColor Green
    } else {
        Write-Host "✅ .env.vercel already in .gitignore" -ForegroundColor Green
    }
}

# Set environment variable for current session
$env:VERCEL_TOKEN = $token
Write-Host "✅ Token set for current PowerShell session" -ForegroundColor Green

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "║     ✅ SETUP COMPLETE! ✅                              ║" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 BÂY GIỜ BẠN CÓ THỂ:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣ Auto deploy with API:" -ForegroundColor Cyan
Write-Host "   .\vercel-auto-deploy.ps1" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣ Test API connection:" -ForegroundColor Cyan
Write-Host "   `$env:VERCEL_TOKEN = '$($token.Substring(0,10))...'" -ForegroundColor White
Write-Host ""
Write-Host "3️⃣ View saved config:" -ForegroundColor Cyan
Write-Host "   Get-Content .env.vercel" -ForegroundColor White
Write-Host ""
Write-Host "🔒 SECURITY REMINDER:" -ForegroundColor Yellow
Write-Host "   • Token is saved in .env.vercel (gitignored)" -ForegroundColor Gray
Write-Host "   • NEVER commit this file to Git!" -ForegroundColor Gray
Write-Host "   • Revoke token at: https://vercel.com/account/tokens" -ForegroundColor Gray
Write-Host ""
Write-Host "🌸 Token setup successful!" -ForegroundColor Green
Write-Host ""


