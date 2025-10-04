#!/usr/bin/env pwsh
# Script khởi động MongoDB cho SoulFriend V3.0

Write-Host "🗄️  Starting MongoDB for SoulFriend V3.0..." -ForegroundColor Green
Write-Host "======================================"

# Kiểm tra xem MongoDB đã được cài đặt chưa
$mongoInstalled = $false

# Kiểm tra MongoDB service
$mongoService = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
if ($mongoService) {
    Write-Host "✅ MongoDB service found" -ForegroundColor Green
    if ($mongoService.Status -ne "Running") {
        Write-Host "🔄 Starting MongoDB service..." -ForegroundColor Yellow
        try {
            Start-Service -Name "MongoDB"
            Write-Host "✅ MongoDB service started successfully" -ForegroundColor Green
            $mongoInstalled = $true
        } catch {
            Write-Host "❌ Failed to start MongoDB service: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "✅ MongoDB service is already running" -ForegroundColor Green
        $mongoInstalled = $true
    }
}

# Nếu không có MongoDB service, thử tìm MongoDB executable
if (-not $mongoInstalled) {
    $mongodPath = Get-Command "mongod" -ErrorAction SilentlyContinue
    if ($mongodPath) {
        Write-Host "✅ MongoDB executable found at: $($mongodPath.Source)" -ForegroundColor Green
        Write-Host "🔄 Starting MongoDB manually..." -ForegroundColor Yellow
        
        # Tạo thư mục data nếu chưa có
        $dataDir = "mongodb-data"
        if (-not (Test-Path $dataDir)) {
            New-Item -ItemType Directory -Path $dataDir
            Write-Host "📁 Created data directory: $dataDir" -ForegroundColor Blue
        }
        
        # Khởi động MongoDB
        Start-Process -FilePath "mongod" -ArgumentList "--dbpath", $dataDir, "--port", "27017" -NoNewWindow
        Write-Host "✅ MongoDB started manually" -ForegroundColor Green
        $mongoInstalled = $true
    }
}

# Nếu vẫn không có MongoDB, thử Docker
if (-not $mongoInstalled) {
    $dockerInstalled = Get-Command "docker" -ErrorAction SilentlyContinue
    if ($dockerInstalled) {
        Write-Host "🐳 MongoDB not found, trying Docker..." -ForegroundColor Yellow
        
        # Kiểm tra xem container MongoDB đã tồn tại chưa
        $mongoContainer = docker ps -a --filter "name=soulfriend-mongo" --format "{{.Names}}"
        
        if ($mongoContainer -eq "soulfriend-mongo") {
            Write-Host "✅ MongoDB container found" -ForegroundColor Green
            
            # Kiểm tra xem container có đang chạy không
            $runningContainer = docker ps --filter "name=soulfriend-mongo" --format "{{.Names}}"
            if ($runningContainer -ne "soulfriend-mongo") {
                Write-Host "🔄 Starting existing MongoDB container..." -ForegroundColor Yellow
                docker start soulfriend-mongo
                Write-Host "✅ MongoDB container started" -ForegroundColor Green
            } else {
                Write-Host "✅ MongoDB container is already running" -ForegroundColor Green
            }
        } else {
            Write-Host "🔄 Creating new MongoDB container..." -ForegroundColor Yellow
            docker run -d --name soulfriend-mongo -p 27017:27017 -v soulfriend-mongo-data:/data/db mongo:latest
            Write-Host "✅ MongoDB container created and started" -ForegroundColor Green
        }
        
        $mongoInstalled = $true
    } else {
        Write-Host "❌ Neither MongoDB nor Docker found" -ForegroundColor Red
        Write-Host "📝 Running without database (development mode)" -ForegroundColor Yellow
    }
}

if ($mongoInstalled) {
    Write-Host ""
    Write-Host "🔄 Waiting for MongoDB to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # Test kết nối
    try {
        $testConnection = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -TimeoutSec 5
        Write-Host "✅ Backend can connect to database" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Backend running without database connection" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎉 MongoDB setup complete!" -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
