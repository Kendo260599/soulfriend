# GitHub Push Script for SoulFriend

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   📤 Push SoulFriend to GitHub              ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (!(Test-Path ".git")) {
    Write-Host "❌ Git not initialized. Run: git init" -ForegroundColor Red
    exit 1
}

# Get GitHub username
Write-Host "📝 Enter your GitHub username:" -ForegroundColor Yellow
$githubUsername = Read-Host

if ([string]::IsNullOrWhiteSpace($githubUsername)) {
    Write-Host "❌ GitHub username is required!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Repository name will be: soulfriend" -ForegroundColor Cyan
Write-Host "🔗 Repository URL will be: https://github.com/$githubUsername/soulfriend" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  BEFORE CONTINUING:" -ForegroundColor Yellow
Write-Host "   1. Create repository at: https://github.com/new" -ForegroundColor White
Write-Host "      • Name: soulfriend" -ForegroundColor White
Write-Host "      • Public or Private (your choice)" -ForegroundColor White
Write-Host "      • Don't initialize with README" -ForegroundColor White
Write-Host ""

Write-Host "Have you created the GitHub repository? (Y/N)" -ForegroundColor Yellow
$confirm = Read-Host

if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "❌ Please create the repository first, then run this script again" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Starting Git operations..." -ForegroundColor Cyan
Write-Host ""

# Add all files
Write-Host "Step 1: Adding files to Git..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Files added" -ForegroundColor Green
} else {
    Write-Host "   ❌ Failed to add files" -ForegroundColor Red
    exit 1
}

# Commit
Write-Host ""
Write-Host "Step 2: Creating commit..." -ForegroundColor Yellow
git commit -m "Initial deployment commit - SoulFriend V3.0 with Gemini AI"
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Commit created" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Nothing to commit or commit failed" -ForegroundColor Yellow
}

# Add remote
Write-Host ""
Write-Host "Step 3: Adding remote repository..." -ForegroundColor Yellow
$repoUrl = "https://github.com/$githubUsername/soulfriend.git"
git remote add origin $repoUrl 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Remote added: $repoUrl" -ForegroundColor Green
} else {
    # Remote might already exist, try to set URL
    git remote set-url origin $repoUrl
    Write-Host "   ✅ Remote URL updated: $repoUrl" -ForegroundColor Green
}

# Rename branch to main
Write-Host ""
Write-Host "Step 4: Setting main branch..." -ForegroundColor Yellow
git branch -M main
Write-Host "   ✅ Branch set to 'main'" -ForegroundColor Green

# Push to GitHub
Write-Host ""
Write-Host "Step 5: Pushing to GitHub..." -ForegroundColor Yellow
Write-Host "   (You may need to authenticate)" -ForegroundColor Gray
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Pushed to GitHub successfully!" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║   ✅ SUCCESS! CODE IS ON GITHUB              ║" -ForegroundColor Green
    Write-Host "╚═══════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "🎉 Your code is now at:" -ForegroundColor Cyan
    Write-Host "   https://github.com/$githubUsername/soulfriend" -ForegroundColor White
    Write-Host ""
    
    Write-Host "📋 NEXT STEPS:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1️⃣  Deploy Backend (Render):" -ForegroundColor Yellow
    Write-Host "   • Visit: https://dashboard.render.com/" -ForegroundColor White
    Write-Host "   • New Web Service" -ForegroundColor White
    Write-Host "   • Connect repository: soulfriend" -ForegroundColor White
    Write-Host "   • Root directory: backend" -ForegroundColor White
    Write-Host "   • Start command: node simple-gemini-server.js" -ForegroundColor White
    Write-Host "   • Add environment variables from: backend/.env.production.template" -ForegroundColor White
    Write-Host ""
    
    Write-Host "2️⃣  Deploy Frontend (Vercel):" -ForegroundColor Yellow
    Write-Host "   Option A - CLI:" -ForegroundColor White
    Write-Host "     vercel login" -ForegroundColor Gray
    Write-Host "     cd frontend" -ForegroundColor Gray
    Write-Host "     vercel --prod" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Option B - Dashboard:" -ForegroundColor White
    Write-Host "     • Visit: https://vercel.com/new" -ForegroundColor Gray
    Write-Host "     • Import Git Repository" -ForegroundColor Gray
    Write-Host "     • Select: soulfriend" -ForegroundColor Gray
    Write-Host "     • Deploy" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "📚 Full Guide: DEPLOY_GUIDE.md" -ForegroundColor Cyan
    Write-Host ""
    
} else {
    Write-Host "   ❌ Failed to push to GitHub" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "   • Repository doesn't exist - create it at github.com/new" -ForegroundColor White
    Write-Host "   • Authentication failed - setup GitHub credentials" -ForegroundColor White
    Write-Host "   • Wrong username - check your GitHub username" -ForegroundColor White
    Write-Host ""
    Write-Host "Try manual push:" -ForegroundColor Yellow
    Write-Host "   git remote add origin https://github.com/$githubUsername/soulfriend.git" -ForegroundColor Gray
    Write-Host "   git push -u origin main" -ForegroundColor Gray
}

Write-Host ""


