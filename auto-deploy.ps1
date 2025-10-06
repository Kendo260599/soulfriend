# SoulFriend Auto-Deploy Script
# Automated deployment to Vercel and Render

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🚀 SOULFRIEND AUTO-DEPLOY WIZARD                   ║" -ForegroundColor Cyan
Write-Host "║   Automated deployment to cloud platforms            ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Function to show progress
function Show-Progress {
    param($Message, $Status)
    if ($Status -eq "success") {
        Write-Host "   ✅ $Message" -ForegroundColor Green
    } elseif ($Status -eq "warning") {
        Write-Host "   ⚠️  $Message" -ForegroundColor Yellow
    } elseif ($Status -eq "info") {
        Write-Host "   ℹ️  $Message" -ForegroundColor Cyan
    } else {
        Write-Host "   ❌ $Message" -ForegroundColor Red
    }
}

# Step 0: Collect Information
Write-Host "📝 Let's collect some information first..." -ForegroundColor Cyan
Write-Host ""

Write-Host "🔑 GitHub Username:" -ForegroundColor Yellow
$githubUsername = Read-Host "   Enter your GitHub username"

if ([string]::IsNullOrWhiteSpace($githubUsername)) {
    Write-Host ""
    Show-Progress "GitHub username is required!" "error"
    Write-Host ""
    Write-Host "💡 Don't have a GitHub account?" -ForegroundColor Cyan
    Write-Host "   Create one at: https://github.com/join" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "📋 Repository Information:" -ForegroundColor Cyan
Write-Host "   Name: soulfriend" -ForegroundColor White
Write-Host "   URL:  https://github.com/$githubUsername/soulfriend" -ForegroundColor White
Write-Host ""

# Step 1: Prepare Local Repository
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "STEP 1: PREPARING LOCAL REPOSITORY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check Git
if (!(Test-Path ".git")) {
    Show-Progress "Initializing Git repository..." "info"
    git init
    if ($LASTEXITCODE -eq 0) {
        Show-Progress "Git initialized" "success"
    } else {
        Show-Progress "Failed to initialize Git" "error"
        exit 1
    }
} else {
    Show-Progress "Git already initialized" "success"
}

# Configure Git user if not set
$gitUser = git config user.name
if ([string]::IsNullOrWhiteSpace($gitUser)) {
    Show-Progress "Configuring Git user..." "info"
    $userName = Read-Host "   Enter your name for Git commits"
    $userEmail = Read-Host "   Enter your email for Git commits"
    git config user.name "$userName"
    git config user.email "$userEmail"
    Show-Progress "Git user configured" "success"
}

Write-Host ""

# Step 2: Prepare Files
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "STEP 2: PREPARING DEPLOYMENT FILES" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Show-Progress "Checking deployment files..." "info"

# Ensure .gitignore exists
if (!(Test-Path ".gitignore")) {
    Show-Progress "Creating .gitignore..." "warning"
    # .gitignore should already be created by prepare-deploy.ps1
}

# Create README if not exists
if (!(Test-Path "README.md")) {
    Show-Progress "Creating README.md..." "info"
    @"
# SoulFriend V3.0

AI-powered mental health support platform for Vietnamese women.

## Features
- 🤖 AI Chatbot powered by Google Gemini 2.5 Flash
- 📊 10+ Mental Health Assessment Tests
- 🎥 Video Guides (Yoga, Meditation, Breathing)
- 📚 Self-Care Resources
- 🚨 Crisis Detection & Emergency Support
- 🇻🇳 Vietnamese Language Support

## Tech Stack
- **Frontend:** React, TypeScript, Styled Components
- **Backend:** Node.js, Express
- **AI:** Google Gemini API
- **Deployment:** Vercel (Frontend), Render (Backend)

## Live Demo
- Frontend: https://soulfriend.vercel.app
- Backend API: https://soulfriend-api.onrender.com

## Local Development
See DEPLOY_GUIDE.md for instructions.

## Research
This application is designed for mental health research with Vietnamese women.
See documentation for IRB compliance and data protection measures.

## License
MIT License - For research and educational purposes
"@ | Out-File -FilePath "README.md" -Encoding UTF8
    Show-Progress "README.md created" "success"
}

Show-Progress "All files prepared" "success"
Write-Host ""

# Step 3: Commit Changes
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "STEP 3: COMMITTING CHANGES" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Show-Progress "Adding files to Git..." "info"
git add .

Show-Progress "Creating commit..." "info"
git commit -m "Initial deployment commit - SoulFriend V3.0 with Gemini AI

Features:
- AI Chatbot with Gemini 2.5 Flash
- Mental health assessment tests
- Crisis detection and emergency support
- Vietnamese language support
- Deployment ready for Vercel and Render"

if ($LASTEXITCODE -eq 0) {
    Show-Progress "Commit created successfully" "success"
} else {
    Show-Progress "Nothing to commit or commit failed" "warning"
}

Write-Host ""

# Step 4: Push to GitHub
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "STEP 4: PUSHING TO GITHUB" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Show-Progress "Setting up GitHub remote..." "info"
$repoUrl = "https://github.com/$githubUsername/soulfriend.git"

# Remove existing remote if any
git remote remove origin 2>$null

# Add new remote
git remote add origin $repoUrl

# Rename branch to main
git branch -M main

Show-Progress "Pushing to GitHub..." "info"
Write-Host ""
Write-Host "   ⚠️  You will need to authenticate with GitHub" -ForegroundColor Yellow
Write-Host "   If this is your first time, you may need to:" -ForegroundColor Yellow
Write-Host "   1. Enter your GitHub username" -ForegroundColor Gray
Write-Host "   2. Enter a Personal Access Token (not password)" -ForegroundColor Gray
Write-Host ""
Write-Host "   How to create a token:" -ForegroundColor Cyan
Write-Host "   1. Go to: https://github.com/settings/tokens" -ForegroundColor Gray
Write-Host "   2. Generate new token (classic)" -ForegroundColor Gray
Write-Host "   3. Select 'repo' scope" -ForegroundColor Gray
Write-Host "   4. Copy and use as password" -ForegroundColor Gray
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Show-Progress "Code pushed to GitHub successfully!" "success"
    Write-Host ""
    Write-Host "   🎉 View your repository at:" -ForegroundColor Green
    Write-Host "   https://github.com/$githubUsername/soulfriend" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Show-Progress "Failed to push to GitHub" "error"
    Write-Host ""
    Write-Host "   Common issues:" -ForegroundColor Yellow
    Write-Host "   1. Repository doesn't exist" -ForegroundColor White
    Write-Host "      Solution: Create it at https://github.com/new" -ForegroundColor Gray
    Write-Host "   2. Authentication failed" -ForegroundColor White
    Write-Host "      Solution: Use Personal Access Token, not password" -ForegroundColor Gray
    Write-Host "   3. Wrong username" -ForegroundColor White
    Write-Host "      Solution: Check your GitHub username" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   📖 See troubleshooting guide in DEPLOY_GUIDE.md" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

# Step 5: Deploy Instructions
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "STEP 5: CLOUD DEPLOYMENT" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Show-Progress "Code is on GitHub! Now deploying to cloud..." "success"
Write-Host ""

# Try to install Vercel CLI if not present
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (!$vercelInstalled) {
    Show-Progress "Installing Vercel CLI..." "info"
    npm install -g vercel --silent
    if ($LASTEXITCODE -eq 0) {
        Show-Progress "Vercel CLI installed" "success"
    } else {
        Show-Progress "Failed to install Vercel CLI" "warning"
    }
}

Write-Host ""
Write-Host "🎯 DEPLOYMENT OPTIONS:" -ForegroundColor Cyan
Write-Host ""

Write-Host "Option A: AUTOMATIC (Recommended)" -ForegroundColor Yellow
Write-Host "   I'll guide you through automated deployment" -ForegroundColor White
Write-Host ""

Write-Host "Option B: MANUAL" -ForegroundColor Yellow
Write-Host "   You deploy manually using dashboards" -ForegroundColor White
Write-Host ""

$deployChoice = Read-Host "Choose option (A/B)"

if ($deployChoice -eq "A" -or $deployChoice -eq "a") {
    # Automatic deployment
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║   🚀 AUTOMATIC DEPLOYMENT                    ║" -ForegroundColor Green
    Write-Host "╚═══════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    
    # Frontend Deployment
    Write-Host "📦 Deploying Frontend to Vercel..." -ForegroundColor Cyan
    Write-Host ""
    
    Show-Progress "You'll need to login to Vercel first..." "info"
    Write-Host ""
    
    vercel login
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Show-Progress "Logged in to Vercel" "success"
        Write-Host ""
        
        # Deploy frontend
        Show-Progress "Deploying frontend..." "info"
        cd frontend
        
        # Create .env.production
        "REACT_APP_API_URL=https://soulfriend-api.onrender.com" | Out-File -FilePath ".env.production" -Encoding UTF8
        
        vercel --prod --yes
        
        cd ..
        
        if ($LASTEXITCODE -eq 0) {
            Show-Progress "Frontend deployed to Vercel!" "success"
        } else {
            Show-Progress "Frontend deployment had issues" "warning"
        }
    }
    
    Write-Host ""
    Write-Host "📦 Backend Deployment (Render):" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Render doesn't have a CLI, so you'll need to:" -ForegroundColor White
    Write-Host ""
    Write-Host "   1. Visit: https://dashboard.render.com/" -ForegroundColor Yellow
    Write-Host "   2. Click 'New +' → 'Web Service'" -ForegroundColor Yellow
    Write-Host "   3. Connect your GitHub repository: soulfriend" -ForegroundColor Yellow
    Write-Host "   4. Configure:" -ForegroundColor Yellow
    Write-Host "      • Root Directory: backend" -ForegroundColor Gray
    Write-Host "      • Build Command: npm install" -ForegroundColor Gray
    Write-Host "      • Start Command: node simple-gemini-server.js" -ForegroundColor Gray
    Write-Host "   5. Add Environment Variables:" -ForegroundColor Yellow
    Write-Host "      • GEMINI_API_KEY=AIzaSyC2tzM5BF-g6fIU3Hqr2V6ipq5H1gjCn3k" -ForegroundColor Gray
    Write-Host "      • CORS_ORIGIN=[Your Vercel URL]" -ForegroundColor Gray
    Write-Host "   6. Deploy" -ForegroundColor Yellow
    Write-Host ""
    
    # Open Render dashboard
    $openRender = Read-Host "Open Render dashboard in browser? (Y/N)"
    if ($openRender -eq "Y" -or $openRender -eq "y") {
        Start-Process "https://dashboard.render.com/"
        Show-Progress "Render dashboard opened in browser" "success"
    }
    
} else {
    # Manual deployment
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║   📖 MANUAL DEPLOYMENT INSTRUCTIONS          ║" -ForegroundColor Yellow
    Write-Host "╚═══════════════════════════════════════════════╝" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "🔧 BACKEND (Render):" -ForegroundColor Cyan
    Write-Host "   1. Go to: https://dashboard.render.com/" -ForegroundColor White
    Write-Host "   2. New Web Service → Connect GitHub" -ForegroundColor White
    Write-Host "   3. Select repository: soulfriend" -ForegroundColor White
    Write-Host "   4. Root: backend" -ForegroundColor White
    Write-Host "   5. Start: node simple-gemini-server.js" -ForegroundColor White
    Write-Host "   6. Add env vars from: backend/.env.production.template" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🎨 FRONTEND (Vercel):" -ForegroundColor Cyan
    Write-Host "   1. Go to: https://vercel.com/new" -ForegroundColor White
    Write-Host "   2. Import Git Repository" -ForegroundColor White
    Write-Host "   3. Select: soulfriend" -ForegroundColor White
    Write-Host "   4. Framework Preset: Create React App" -ForegroundColor White
    Write-Host "   5. Root Directory: frontend" -ForegroundColor White
    Write-Host "   6. Add env var: REACT_APP_API_URL=[Render URL]" -ForegroundColor White
    Write-Host "   7. Deploy" -ForegroundColor White
    Write-Host ""
}

# Final Summary
Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   🎉 DEPLOYMENT PREPARATION COMPLETE!                ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📊 SUMMARY:" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "   ✅ Code prepared and committed" -ForegroundColor Green
Write-Host "   ✅ Pushed to GitHub" -ForegroundColor Green
Write-Host "   ✅ Ready for cloud deployment" -ForegroundColor Green
Write-Host ""

Write-Host "🔗 IMPORTANT URLS:" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "   GitHub Repo:     https://github.com/$githubUsername/soulfriend" -ForegroundColor White
Write-Host "   Render Deploy:   https://dashboard.render.com/" -ForegroundColor White
Write-Host "   Vercel Deploy:   https://vercel.com/new" -ForegroundColor White
Write-Host ""

Write-Host "📚 DOCUMENTATION:" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Full Guide:      DEPLOY_GUIDE.md" -ForegroundColor White
Write-Host "   Checklist:       DEPLOYMENT_COMPLETE_CHECKLIST.md" -ForegroundColor White
Write-Host "   Quick Info:      DEPLOYMENT_INFO.txt" -ForegroundColor White
Write-Host ""

Write-Host "🎯 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "   1. Complete backend deployment on Render" -ForegroundColor Yellow
Write-Host "   2. Complete frontend deployment on Vercel" -ForegroundColor Yellow
Write-Host "   3. Test the live application" -ForegroundColor Yellow
Write-Host "   4. Share with beta testers" -ForegroundColor Yellow
Write-Host "   5. Start collecting research data" -ForegroundColor Yellow
Write-Host ""

Write-Host "🌸 SoulFriend is ready to help Vietnamese women!" -ForegroundColor Green
Write-Host ""


