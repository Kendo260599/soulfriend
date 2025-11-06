# 🚀 Simple Vercel Environment Variables Setup
# Hướng dẫn từng bước set environment variables

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  VERCEL ENVIRONMENT VARIABLES SETUP  " -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Vercel CLI
Write-Host "📋 Step 1: Check Vercel CLI installation" -ForegroundColor Yellow
Write-Host ""

$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI is not installed." -ForegroundColor Red
    Write-Host ""
    Write-Host "Installing Vercel CLI globally..." -ForegroundColor Yellow
    npm install -g vercel
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Vercel CLI installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install Vercel CLI." -ForegroundColor Red
        Write-Host "Please install manually: npm install -g vercel" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "✅ Vercel CLI is already installed." -ForegroundColor Green
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Step 2: Login to Vercel
Write-Host "📋 Step 2: Login to Vercel" -ForegroundColor Yellow
Write-Host ""

$whoami = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  You are not logged in to Vercel." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opening Vercel login..." -ForegroundColor Yellow
    Write-Host "(A browser window will open for authentication)" -ForegroundColor Cyan
    Write-Host ""
    
    vercel login
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Successfully logged in to Vercel!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Login failed. Please try again." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Already logged in as: $whoami" -ForegroundColor Green
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Step 3: Link to Vercel project
Write-Host "📋 Step 3: Link to Vercel project" -ForegroundColor Yellow
Write-Host ""

# Check if already linked
if (Test-Path ".vercel") {
    Write-Host "✅ Project is already linked to Vercel." -ForegroundColor Green
} else {
    Write-Host "⚠️  Project is not linked to Vercel yet." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Linking project..." -ForegroundColor Yellow
    Write-Host ""
    
    vercel link
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Project linked successfully!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Failed to link project." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Step 4: Set Environment Variables
Write-Host "📋 Step 4: Set Environment Variables" -ForegroundColor Yellow
Write-Host ""

Write-Host "The following 6 environment variables will be set:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. REACT_APP_API_URL" -ForegroundColor White
Write-Host "     → https://soulfriend-production.up.railway.app" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. REACT_APP_BACKEND_URL" -ForegroundColor White
Write-Host "     → https://soulfriend-production.up.railway.app" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. NODE_VERSION" -ForegroundColor White
Write-Host "     → 20" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. DISABLE_ESLINT_PLUGIN" -ForegroundColor White
Write-Host "     → true" -ForegroundColor Gray
Write-Host ""
Write-Host "  5. GENERATE_SOURCEMAP" -ForegroundColor White
Write-Host "     → false" -ForegroundColor Gray
Write-Host ""
Write-Host "  6. SKIP_PREFLIGHT_CHECK" -ForegroundColor White
Write-Host "     → true" -ForegroundColor Gray
Write-Host ""

$confirmation = Read-Host "Continue with setting these variables? (Y/N)"

if ($confirmation -ne 'Y' -and $confirmation -ne 'y') {
    Write-Host ""
    Write-Host "❌ Cancelled by user." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "Setting environment variables..." -ForegroundColor Yellow
Write-Host "(This may take a moment...)" -ForegroundColor Gray
Write-Host ""

# Create a temporary file with all env vars
$tempFile = "vercel-env-temp.txt"
$envContent = @"
REACT_APP_API_URL=https://soulfriend-production.up.railway.app
REACT_APP_BACKEND_URL=https://soulfriend-production.up.railway.app
NODE_VERSION=20
DISABLE_ESLINT_PLUGIN=true
GENERATE_SOURCEMAP=false
SKIP_PREFLIGHT_CHECK=true
"@

$envContent | Out-File -FilePath $tempFile -Encoding utf8

Write-Host "✅ Created environment variables file: $tempFile" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next, you need to set these manually in Vercel Dashboard:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1 - Via Vercel Dashboard (Recommended):" -ForegroundColor Cyan
Write-Host "  1. Open: https://vercel.com/kendo260599s-projects/soulfriend/settings/environment-variables" -ForegroundColor White
Write-Host "  2. For each variable in the file above:" -ForegroundColor White
Write-Host "     - Click 'Add New'" -ForegroundColor White
Write-Host "     - Enter Name and Value" -ForegroundColor White
Write-Host "     - Select: Production, Preview, Development" -ForegroundColor White
Write-Host "     - Click 'Save'" -ForegroundColor White
Write-Host ""
Write-Host "Option 2 - Via CLI (For advanced users):" -ForegroundColor Cyan
Write-Host "  Run these commands manually:" -ForegroundColor White
Write-Host ""
Write-Host '  echo "https://soulfriend-production.up.railway.app" | vercel env add REACT_APP_API_URL production' -ForegroundColor Gray
Write-Host '  echo "https://soulfriend-production.up.railway.app" | vercel env add REACT_APP_BACKEND_URL production' -ForegroundColor Gray
Write-Host '  echo "20" | vercel env add NODE_VERSION production' -ForegroundColor Gray
Write-Host '  echo "true" | vercel env add DISABLE_ESLINT_PLUGIN production' -ForegroundColor Gray
Write-Host '  echo "false" | vercel env add GENERATE_SOURCEMAP production' -ForegroundColor Gray
Write-Host '  echo "true" | vercel env add SKIP_PREFLIGHT_CHECK production' -ForegroundColor Gray
Write-Host ""

Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Step 5: Offer to open browser
$openBrowser = Read-Host "Open Vercel Dashboard in browser now? (Y/N)"

if ($openBrowser -eq 'Y' -or $openBrowser -eq 'y') {
    Write-Host ""
    Write-Host "🌐 Opening Vercel Dashboard..." -ForegroundColor Yellow
    Start-Process "https://vercel.com/kendo260599s-projects/soulfriend/settings/environment-variables"
    Write-Host ""
    Write-Host "✅ Browser opened!" -ForegroundColor Green
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. ✅ Vercel CLI installed and logged in" -ForegroundColor Green
Write-Host "2. ✅ Project linked to Vercel" -ForegroundColor Green
Write-Host "3. ⏳ Set environment variables (see options above)" -ForegroundColor Yellow
Write-Host "4. 🔄 Redeploy project after setting variables" -ForegroundColor Cyan
Write-Host ""
Write-Host "To redeploy after setting variables:" -ForegroundColor White
Write-Host "  vercel --prod" -ForegroundColor Gray
Write-Host ""
Write-Host "Or trigger redeploy from Dashboard:" -ForegroundColor White
Write-Host "  https://vercel.com/kendo260599s-projects/soulfriend" -ForegroundColor Cyan
Write-Host ""
Write-Host "✨ Setup preparation complete!" -ForegroundColor Green
Write-Host ""

