# SoulFriend V3.0 Deployment Script for Windows
# This script handles production deployment with Docker

param(
    [switch]$Dev,
    [switch]$Prod,
    [switch]$Stop,
    [switch]$Logs
)

# Colors for output
function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

Write-Host "🚀 SoulFriend V3.0 Deployment Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Check if Docker is installed
try {
    docker --version | Out-Null
    Write-Status "Docker is installed"
} catch {
    Write-Error "Docker is not installed. Please install Docker Desktop first."
    exit 1
}

# Check if Docker Compose is installed
try {
    docker-compose --version | Out-Null
    Write-Status "Docker Compose is installed"
} catch {
    Write-Error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
}

# Handle different deployment modes
if ($Stop) {
    Write-Status "Stopping all services..."
    docker-compose down
    docker-compose -f docker-compose.dev.yml down
    Write-Status "All services stopped."
    exit 0
}

if ($Logs) {
    Write-Status "Showing logs..."
    if ($Dev) {
        docker-compose -f docker-compose.dev.yml logs -f
    } else {
        docker-compose logs -f
    }
    exit 0
}

# Development deployment
if ($Dev) {
    Write-Status "Starting development environment..."
    
    # Create necessary directories
    if (!(Test-Path "logs")) { New-Item -ItemType Directory -Path "logs" }
    
    # Start development services
    docker-compose -f docker-compose.dev.yml up -d --build
    
    Write-Status "Development environment started!"
    Write-Host ""
    Write-Host "📊 Development URLs:" -ForegroundColor Cyan
    Write-Host "   - Frontend: http://localhost:3000"
    Write-Host "   - Backend API: http://localhost:5000/api"
    Write-Host "   - API Health: http://localhost:5000/api/health"
    Write-Host ""
    Write-Host "🔧 Management Commands:" -ForegroundColor Cyan
    Write-Host "   - View logs: .\scripts\deploy.ps1 -Dev -Logs"
    Write-Host "   - Stop services: .\scripts\deploy.ps1 -Stop"
    Write-Host ""
    
    exit 0
}

# Production deployment
Write-Status "Starting production deployment..."

# Create necessary directories
Write-Status "Creating necessary directories..."
@("logs", "ssl", "backups") | ForEach-Object {
    if (!(Test-Path $_)) { 
        New-Item -ItemType Directory -Path $_ 
        Write-Status "Created directory: $_"
    }
}

# Check if .env file exists
if (!(Test-Path ".env")) {
    Write-Warning ".env file not found."
    if (Test-Path ".env.production") {
        Copy-Item ".env.production" ".env"
        Write-Warning "Copied .env.production to .env"
        Write-Warning "Please edit .env file with your production settings before continuing."
        Write-Host "Press any key to continue after editing .env file..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    } else {
        Write-Error "No environment configuration found. Please create .env file."
        exit 1
    }
}

# Generate self-signed SSL certificates if they don't exist
if (!(Test-Path "ssl\nginx-selfsigned.crt") -or !(Test-Path "ssl\nginx-selfsigned.key")) {
    Write-Status "Generating self-signed SSL certificates..."
    
    # Check if OpenSSL is available
    try {
        openssl version | Out-Null
        
        # Generate self-signed certificate
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 `
            -keyout ssl\nginx-selfsigned.key `
            -out ssl\nginx-selfsigned.crt `
            -subj "/C=VN/ST=HoChiMinh/L=HoChiMinh/O=SoulFriend/CN=localhost"
            
        Write-Status "SSL certificates generated"
        Write-Warning "Using self-signed certificates. Replace with proper SSL certificates for production."
    } catch {
        Write-Warning "OpenSSL not found. Creating placeholder SSL files."
        Write-Warning "Please generate proper SSL certificates manually."
        
        # Create placeholder files
        "# Placeholder SSL certificate" | Out-File -FilePath "ssl\nginx-selfsigned.crt"
        "# Placeholder SSL key" | Out-File -FilePath "ssl\nginx-selfsigned.key"
    }
}

# Build and start services
Write-Status "Building Docker images..."
docker-compose build --no-cache

Write-Status "Starting services..."
docker-compose up -d

# Wait for services to be ready
Write-Status "Waiting for services to start..."
Start-Sleep -Seconds 30

# Check service health
Write-Status "Checking service health..."

# Check Application
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Status "✅ SoulFriend application is healthy"
    }
} catch {
    Write-Error "❌ SoulFriend application is not responding"
}

# Setup default admin if needed
Write-Status "Setting up default admin user..."
try {
    docker-compose exec -T soulfriend-app node backend/dist/scripts/createDefaultAdmin.js
    Write-Status "Default admin setup completed"
} catch {
    Write-Warning "Could not setup default admin automatically. Please run setup manually."
}

# Show deployment summary
Write-Host ""
Write-Status "🎉 SoulFriend V3.0 deployment completed!"
Write-Host ""
Write-Host "📊 Service URLs:" -ForegroundColor Cyan
Write-Host "   - Application: https://localhost"
Write-Host "   - API Health: http://localhost:5000/api/health"
Write-Host "   - Admin Panel: https://localhost/admin"
Write-Host ""
Write-Host "🔧 Management Commands:" -ForegroundColor Cyan
Write-Host "   - View logs: .\scripts\deploy.ps1 -Logs"
Write-Host "   - Stop services: .\scripts\deploy.ps1 -Stop"
Write-Host "   - Development mode: .\scripts\deploy.ps1 -Dev"
Write-Host ""
Write-Host "📝 Important Notes:" -ForegroundColor Cyan
Write-Host "   - Default admin credentials are in your .env file"
Write-Host "   - Change default passwords before production use"
Write-Host "   - Replace self-signed SSL certificates with proper ones"
Write-Host "   - Configure proper backup strategy"
Write-Host ""

Write-Status "Deployment completed successfully! 🚀"
