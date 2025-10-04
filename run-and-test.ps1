#!/usr/bin/env pwsh
# Script tự động chạy và test ứng dụng SoulFriend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SOULFRIEND AUTO RUN & TEST SCRIPT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
    return $connection.TcpTestSucceeded
}

# Check if backend is running
Write-Host "Checking if Backend (port 5000) is running..." -ForegroundColor Yellow
$backendRunning = Test-Port -Port 5000

# Check if frontend is running  
Write-Host "Checking if Frontend (port 3000) is running..." -ForegroundColor Yellow
$frontendRunning = Test-Port -Port 3000

# Start Backend if not running
if (-not $backendRunning) {
    Write-Host "Starting Backend Server..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start" -WindowStyle Normal
    Write-Host "Waiting for backend to start (15 seconds)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
} else {
    Write-Host "Backend is already running!" -ForegroundColor Green
}

# Start Frontend if not running
if (-not $frontendRunning) {
    Write-Host "Starting Frontend Server..." -ForegroundColor Green
    $env:BROWSER = "none"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm start" -WindowStyle Normal
    Write-Host "Waiting for frontend to start (20 seconds)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 20
} else {
    Write-Host "Frontend is already running!" -ForegroundColor Green
}

# Wait for servers to be fully ready
Write-Host ""
Write-Host "Waiting for all services to be fully ready (10 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Run comprehensive tests
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RUNNING COMPREHENSIVE TESTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

node auto-test-app.js

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST COMPLETED!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Green
Write-Host "API Health: http://localhost:5000/api/health" -ForegroundColor Green
Write-Host ""
Write-Host "Check test-report.json for detailed results" -ForegroundColor Yellow
Write-Host ""

