# 🔧 Automated Deployment Scripts

## 📋 Overview

Scripts để tự động hóa các tác vụ deployment và verification.

---

## 🚀 Quick Deploy Script

### `scripts/deploy.sh`

```bash
#!/bin/bash

echo "🚀 Starting deployment..."

# Build backend
echo "📦 Building backend..."
cd backend
npm run build
cd ..

# Commit and push
echo "📤 Pushing to GitHub..."
git add .
git commit -m "chore: Auto-deploy via script"
git push origin main

echo "✅ Deployment initiated!"
echo "📊 Railway will auto-deploy backend"
echo "📊 Vercel will auto-deploy frontend"
```

---

## 🔍 Verify Deployment Script

### `scripts/verify-deployment.sh`

```bash
#!/bin/bash

BACKEND_URL="https://soulfriend-production.up.railway.app"
FRONTEND_URL="https://soulfriend-kendo260599s-projects.vercel.app"

echo "🔍 Verifying deployments..."

# Check backend
echo "📡 Checking backend..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/health")
if [ "$BACKEND_STATUS" = "200" ]; then
  echo "✅ Backend is online"
else
  echo "❌ Backend returned $BACKEND_STATUS"
fi

# Check frontend
echo "📡 Checking frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$FRONTEND_STATUS" = "200" ]; then
  echo "✅ Frontend is online"
else
  echo "❌ Frontend returned $FRONTEND_STATUS"
fi
```

---

## ⚙️ PowerShell Scripts (Windows)

### `scripts/deploy.ps1`

```powershell
Write-Host "🚀 Starting deployment..." -ForegroundColor Green

# Build backend
Write-Host "📦 Building backend..." -ForegroundColor Yellow
Set-Location backend
npm run build
Set-Location ..

# Commit and push
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
git add .
git commit -m "chore: Auto-deploy via script"
git push origin main

Write-Host "✅ Deployment initiated!" -ForegroundColor Green
Write-Host "📊 Railway will auto-deploy backend" -ForegroundColor Cyan
Write-Host "📊 Vercel will auto-deploy frontend" -ForegroundColor Cyan
```

### `scripts/verify-deployment.ps1`

```powershell
$BACKEND_URL = "https://soulfriend-production.up.railway.app"
$FRONTEND_URL = "https://soulfriend-kendo260599s-projects.vercel.app"

Write-Host "🔍 Verifying deployments..." -ForegroundColor Green

# Check backend
Write-Host "📡 Checking backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend is online" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend returned $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Backend check failed: $_" -ForegroundColor Red
}

# Check frontend
Write-Host "📡 Checking frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $FRONTEND_URL -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend is online" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend returned $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Frontend check failed: $_" -ForegroundColor Red
}
```

---

## 📝 Usage

### Deploy:
```bash
# Windows
.\scripts\deploy.ps1

# Linux/Mac
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### Verify:
```bash
# Windows
.\scripts\verify-deployment.ps1

# Linux/Mac
chmod +x scripts/verify-deployment.sh
./scripts/verify-deployment.sh
```

---

**Note**: Railway và Vercel đã tự động deploy từ GitHub. Scripts này chỉ để trigger và verify.

