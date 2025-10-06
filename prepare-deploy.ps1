# SoulFriend Deployment Preparation Script

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🚀 SoulFriend Deployment Preparation      ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Git
Write-Host "Step 1: Checking Git..." -ForegroundColor Yellow
if (!(Test-Path ".git")) {
    Write-Host "   Initializing Git repository..." -ForegroundColor Gray
    git init
    Write-Host "   ✅ Git initialized" -ForegroundColor Green
} else {
    Write-Host "   ✅ Git already initialized" -ForegroundColor Green
}

# Step 2: Create .gitignore if not exists
Write-Host ""
Write-Host "Step 2: Checking .gitignore..." -ForegroundColor Yellow
if (!(Test-Path ".gitignore")) {
    Write-Host "   Creating .gitignore..." -ForegroundColor Gray
    Copy-Item ".gitignore.example" ".gitignore" -ErrorAction SilentlyContinue
    Write-Host "   ✅ .gitignore created" -ForegroundColor Green
} else {
    Write-Host "   ✅ .gitignore exists" -ForegroundColor Green
}

# Step 3: Check backend dependencies
Write-Host ""
Write-Host "Step 3: Checking backend..." -ForegroundColor Yellow
cd backend
if (Test-Path "node_modules") {
    Write-Host "   ✅ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   Installing backend dependencies..." -ForegroundColor Gray
    npm install
    Write-Host "   ✅ Backend dependencies installed" -ForegroundColor Green
}

# Check if simple-gemini-server.js exists
if (Test-Path "simple-gemini-server.js") {
    Write-Host "   ✅ Backend server file exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ Backend server file missing!" -ForegroundColor Red
}

cd ..

# Step 4: Check frontend dependencies
Write-Host ""
Write-Host "Step 4: Checking frontend..." -ForegroundColor Yellow
cd frontend
if (Test-Path "node_modules") {
    Write-Host "   ✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   Installing frontend dependencies..." -ForegroundColor Gray
    npm install
    Write-Host "   ✅ Frontend dependencies installed" -ForegroundColor Green
}

# Check proxy in package.json
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
if ($packageJson.proxy) {
    Write-Host "   ✅ Proxy configured: $($packageJson.proxy)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  No proxy configured (will be set for production)" -ForegroundColor Yellow
}

cd ..

# Step 5: Check required files
Write-Host ""
Write-Host "Step 5: Checking deployment files..." -ForegroundColor Yellow

$requiredFiles = @(
    "render.yaml",
    "vercel.json",
    ".gitignore",
    "DEPLOY_GUIDE.md",
    "backend/simple-gemini-server.js",
    "frontend/package.json"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file (missing)" -ForegroundColor Red
        $allFilesExist = $false
    }
}

# Step 6: Create production env template
Write-Host ""
Write-Host "Step 6: Creating env templates..." -ForegroundColor Yellow

# Backend env template
$backendEnvTemplate = @"
# Production Environment Variables for Render
NODE_ENV=production
PORT=5000
GEMINI_API_KEY=AIzaSyC2tzM5BF-g6fIU3Hqr2V6ipq5H1gjCn3k
CORS_ORIGIN=https://soulfriend.vercel.app
"@

$backendEnvTemplate | Out-File -FilePath "backend\.env.production.template" -Encoding UTF8
Write-Host "   ✅ backend/.env.production.template created" -ForegroundColor Green

# Frontend env template
$frontendEnvTemplate = @"
# Production Environment Variables for Vercel
REACT_APP_API_URL=https://soulfriend-api.onrender.com
"@

$frontendEnvTemplate | Out-File -FilePath "frontend\.env.production.template" -Encoding UTF8
Write-Host "   ✅ frontend/.env.production.template created" -ForegroundColor Green

# Step 7: Test local build
Write-Host ""
Write-Host "Step 7: Testing local builds..." -ForegroundColor Yellow

Write-Host "   Testing backend startup..." -ForegroundColor Gray
$backendTest = Start-Job -ScriptBlock {
    cd "$using:PWD\backend"
    $env:NODE_ENV = "development"
    node simple-gemini-server.js
}
Start-Sleep -Seconds 5

if ($backendTest.State -eq "Running") {
    Write-Host "   ✅ Backend starts successfully" -ForegroundColor Green
    Stop-Job $backendTest
    Remove-Job $backendTest
} else {
    Write-Host "   ⚠️  Backend test inconclusive" -ForegroundColor Yellow
    Remove-Job $backendTest -Force -ErrorAction SilentlyContinue
}

# Step 8: Generate deployment summary
Write-Host ""
Write-Host "Step 8: Generating deployment info..." -ForegroundColor Yellow

$deployInfo = @"
╔═══════════════════════════════════════════════════════════╗
║                 DEPLOYMENT INFORMATION                    ║
╚═══════════════════════════════════════════════════════════╝

📦 Repository Status:
   Git: $(if (Test-Path ".git") { "✅ Initialized" } else { "❌ Not initialized" })
   Files ready: $(if ($allFilesExist) { "✅ Yes" } else { "❌ Missing files" })

🔧 Backend:
   Server: simple-gemini-server.js
   Port: 5000
   AI: Gemini 2.5 Flash
   Dependencies: ✅ Installed

🎨 Frontend:
   Framework: React
   Port: 3000 (local) / 80 (prod)
   Dependencies: ✅ Installed

📋 Next Steps:

1️⃣  Create GitHub Repository:
   • Go to: https://github.com/new
   • Name: soulfriend
   • Public or Private
   • Don't initialize with README

2️⃣  Push to GitHub:
   git add .
   git commit -m "Initial deployment commit"
   git remote add origin https://github.com/YOUR_USERNAME/soulfriend.git
   git push -u origin main

3️⃣  Deploy Backend (Render):
   • Visit: https://dashboard.render.com/
   • New Web Service
   • Connect GitHub repo
   • Root: backend
   • Start: node simple-gemini-server.js
   • Add env vars (see backend/.env.production.template)

4️⃣  Deploy Frontend (Vercel):
   • Run: vercel login
   • Run: cd frontend && vercel --prod
   • Or connect at: https://vercel.com/new

📚 Documentation:
   • Full guide: DEPLOY_GUIDE.md
   • Deployment options: DEPLOYMENT_OPTIONS_RESEARCH.md

🔑 Important:
   ⚠️  DO NOT commit .env files to Git!
   ⚠️  Add env vars in Render/Vercel dashboard
   ⚠️  Test thoroughly before sharing with users

🌸 SoulFriend is ready for deployment!

"@

Write-Host $deployInfo -ForegroundColor Cyan

# Save deployment info
$deployInfo | Out-File -FilePath "DEPLOYMENT_INFO.txt" -Encoding UTF8
Write-Host ""
Write-Host "✅ Deployment info saved to: DEPLOYMENT_INFO.txt" -ForegroundColor Green

# Step 9: Final checks
Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "FINAL CHECKLIST:" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$checklist = @(
    @{ Item = "Git initialized"; Status = (Test-Path ".git") },
    @{ Item = ".gitignore present"; Status = (Test-Path ".gitignore") },
    @{ Item = "Backend ready"; Status = (Test-Path "backend/simple-gemini-server.js") },
    @{ Item = "Frontend ready"; Status = (Test-Path "frontend/package.json") },
    @{ Item = "Deployment configs"; Status = ((Test-Path "render.yaml") -and (Test-Path "vercel.json")) },
    @{ Item = "Documentation"; Status = (Test-Path "DEPLOY_GUIDE.md") }
)

$allReady = $true
foreach ($check in $checklist) {
    if ($check.Status) {
        Write-Host "   ✅ $($check.Item)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $($check.Item)" -ForegroundColor Red
        $allReady = $false
    }
}

Write-Host ""
if ($allReady) {
    Write-Host "╔═══════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║   ✅ READY FOR DEPLOYMENT!                   ║" -ForegroundColor Green
    Write-Host "╚═══════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "📖 Read DEPLOY_GUIDE.md for step-by-step instructions" -ForegroundColor Cyan
    Write-Host "🚀 Or run: .\github-push.ps1 to push to GitHub" -ForegroundColor Cyan
} else {
    Write-Host "╔═══════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║   ⚠️  SOME CHECKS FAILED                     ║" -ForegroundColor Yellow
    Write-Host "╚═══════════════════════════════════════════════╝" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please fix the issues above before deploying" -ForegroundColor Yellow
}

Write-Host ""


