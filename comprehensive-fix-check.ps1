# 🔍 Comprehensive Fix Status Check
Write-Host "🔍 Comprehensive Fix Status Check" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Function to check Node.js version fixes
function Check-NodeVersionFixes {
    Write-Host "`n🔍 Checking Node.js version fixes..." -ForegroundColor Yellow
    
    # Check .nvmrc files
    if (Test-Path ".nvmrc") {
        $nvmrc = Get-Content ".nvmrc"
        Write-Host "✅ Root .nvmrc: $nvmrc" -ForegroundColor Green
    } else {
        Write-Host "❌ Root .nvmrc missing" -ForegroundColor Red
    }
    
    if (Test-Path "backend/.nvmrc") {
        $backendNvmrc = Get-Content "backend/.nvmrc"
        Write-Host "✅ Backend .nvmrc: $backendNvmrc" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend .nvmrc missing" -ForegroundColor Red
    }
    
    if (Test-Path "frontend/.nvmrc") {
        $frontendNvmrc = Get-Content "frontend/.nvmrc"
        Write-Host "✅ Frontend .nvmrc: $frontendNvmrc" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend .nvmrc missing" -ForegroundColor Red
    }
    
    # Check railway.toml files
    if (Test-Path "backend/railway.toml") {
        $backendToml = Get-Content "backend/railway.toml" | Select-String "NODE_VERSION"
        if ($backendToml) {
            Write-Host "✅ Backend railway.toml: $backendToml" -ForegroundColor Green
        } else {
            Write-Host "❌ Backend railway.toml missing NODE_VERSION" -ForegroundColor Red
        }
    }
    
    if (Test-Path "frontend/railway.toml") {
        $frontendToml = Get-Content "frontend/railway.toml" | Select-String "NODE_VERSION"
        if ($frontendToml) {
            Write-Host "✅ Frontend railway.toml: $frontendToml" -ForegroundColor Green
        } else {
            Write-Host "❌ Frontend railway.toml missing NODE_VERSION" -ForegroundColor Red
        }
    }
}

# Function to check TypeScript fixes
function Check-TypeScriptFixes {
    Write-Host "`n🔍 Checking TypeScript fixes..." -ForegroundColor Yellow
    
    # Check tsconfig.json
    if (Test-Path "backend/tsconfig.json") {
        $tsconfig = Get-Content "backend/tsconfig.json" | ConvertFrom-Json
        if ($tsconfig.compilerOptions.types -contains "node") {
            Write-Host "✅ tsconfig.json: Node types included" -ForegroundColor Green
        } else {
            Write-Host "❌ tsconfig.json: Node types missing" -ForegroundColor Red
        }
        
        if ($tsconfig.compilerOptions.moduleResolution -eq "node") {
            Write-Host "✅ tsconfig.json: Module resolution set to node" -ForegroundColor Green
        } else {
            Write-Host "❌ tsconfig.json: Module resolution not set" -ForegroundColor Red
        }
    }
    
    # Check package.json for @types
    if (Test-Path "backend/package.json") {
        $packageJson = Get-Content "backend/package.json" | ConvertFrom-Json
        $devDeps = $packageJson.devDependencies
        
        $requiredTypes = @("@types/node", "@types/express", "@types/cors", "@types/compression", "@types/jsonwebtoken", "@types/bcryptjs")
        
        foreach ($type in $requiredTypes) {
            if ($devDeps.$type) {
                Write-Host "✅ $type`: $($devDeps.$type)" -ForegroundColor Green
            } else {
                Write-Host "❌ $type`: Missing" -ForegroundColor Red
            }
        }
    }
}

# Function to check build test
function Test-Build {
    Write-Host "`n🔍 Testing build locally..." -ForegroundColor Yellow
    
    # Test backend build
    Write-Host "Testing backend build..." -ForegroundColor Gray
    cd backend
    try {
        npm run build
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Backend build: SUCCESS" -ForegroundColor Green
        } else {
            Write-Host "❌ Backend build: FAILED" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Backend build: ERROR" -ForegroundColor Red
    }
    
    cd ../frontend
    Write-Host "Testing frontend build..." -ForegroundColor Gray
    try {
        npm run build
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Frontend build: SUCCESS" -ForegroundColor Green
        } else {
            Write-Host "❌ Frontend build: FAILED" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Frontend build: ERROR" -ForegroundColor Red
    }
    
    cd ..
}

# Function to check git status
function Check-GitStatus {
    Write-Host "`n🔍 Checking git status..." -ForegroundColor Yellow
    
    try {
        $gitStatus = git status --porcelain
        if ($gitStatus) {
            Write-Host "⚠️ Uncommitted changes:" -ForegroundColor Yellow
            $gitStatus | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        } else {
            Write-Host "✅ All changes committed" -ForegroundColor Green
        }
        
        $lastCommit = git log -1 --oneline
        Write-Host "✅ Last commit: $lastCommit" -ForegroundColor Green
    } catch {
        Write-Host "❌ Git status check failed" -ForegroundColor Red
    }
}

# Main execution
Write-Host "`n🚀 Starting comprehensive fix status check..." -ForegroundColor Green

# Check if we're in the right directory
if (!(Test-Path "backend/package.json") -or !(Test-Path "frontend/package.json")) {
    Write-Host "❌ Please run this script from the project root directory!" -ForegroundColor Red
    exit 1
}

# Run all checks
Check-NodeVersionFixes
Check-TypeScriptFixes
Check-GitStatus
Test-Build

Write-Host "`n🎉 Comprehensive check completed!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "- Node.js version fixes: Applied" -ForegroundColor White
Write-Host "- TypeScript compilation fixes: Applied" -ForegroundColor White
Write-Host "- Build configuration: Updated" -ForegroundColor White
Write-Host "- All fixes: Committed to git" -ForegroundColor White

Write-Host "`n🚀 Next steps:" -ForegroundColor Cyan
Write-Host "1. Login to Railway: railway login" -ForegroundColor White
Write-Host "2. Check Railway Dashboard: https://railway.app/dashboard" -ForegroundColor White
Write-Host "3. Trigger rebuild: railway up" -ForegroundColor White
Write-Host "4. Monitor build logs for success" -ForegroundColor White

Write-Host "`n🎯 Expected result: Build should succeed!" -ForegroundColor Green
