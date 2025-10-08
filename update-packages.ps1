# 🔄 Update Deprecated Packages Script
Write-Host "🔄 SoulFriend Package Update Script" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

# Function to update backend packages
function Update-BackendPackages {
    Write-Host "`n🔍 Updating Backend Packages..." -ForegroundColor Yellow
    cd backend
    
    # Update to latest versions
    Write-Host "Running npm update..." -ForegroundColor Gray
    npm update
    
    # Check for outdated packages
    Write-Host "Checking for outdated packages..." -ForegroundColor Gray
    npm outdated
    
    Write-Host "✅ Backend packages updated!" -ForegroundColor Green
}

# Function to update frontend packages
function Update-FrontendPackages {
    Write-Host "`n🔍 Updating Frontend Packages..." -ForegroundColor Yellow
    cd ../frontend
    
    # Update to latest versions
    Write-Host "Running npm update..." -ForegroundColor Gray
    npm update
    
    # Check for outdated packages
    Write-Host "Checking for outdated packages..." -ForegroundColor Gray
    npm outdated
    
    Write-Host "✅ Frontend packages updated!" -ForegroundColor Green
}

# Function to fix specific deprecated packages
function Fix-DeprecatedPackages {
    Write-Host "`n🔧 Fixing Specific Deprecated Packages..." -ForegroundColor Yellow
    
    # Backend fixes
    cd backend
    Write-Host "Fixing backend deprecated packages..." -ForegroundColor Gray
    
    # Update specific packages that are commonly deprecated
    npm install rimraf@latest --save-dev
    npm install glob@latest --save-dev
    
    cd ../frontend
    Write-Host "Fixing frontend deprecated packages..." -ForegroundColor Gray
    
    # Update React Scripts to latest version
    npm install react-scripts@latest
    
    Write-Host "✅ Deprecated packages fixed!" -ForegroundColor Green
}

# Main execution
Write-Host "`n🚀 Starting package updates..." -ForegroundColor Green

# Check if we're in the right directory
if (!(Test-Path "backend/package.json") -or !(Test-Path "frontend/package.json")) {
    Write-Host "❌ Please run this script from the project root directory!" -ForegroundColor Red
    exit 1
}

# Update packages
Update-BackendPackages
Update-FrontendPackages
Fix-DeprecatedPackages

Write-Host "`n🎉 Package updates completed!" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host "✅ Backend: Packages updated" -ForegroundColor Green
Write-Host "✅ Frontend: Packages updated" -ForegroundColor Green
Write-Host "✅ Deprecated: Packages fixed" -ForegroundColor Green
Write-Host "`n🚀 Ready to test build again!" -ForegroundColor Cyan
