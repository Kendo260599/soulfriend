#!/bin/bash

# SoulFriend V3.0 Deployment Script
# This script handles production deployment with Docker

set -e

echo "🚀 Starting SoulFriend V3.0 deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from .env.production template..."
    if [ -f ".env.production" ]; then
        cp .env.production .env
        print_warning "Please edit .env file with your production settings before continuing."
        exit 1
    else
        print_error "No environment configuration found. Please create .env file."
        exit 1
    fi
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs ssl backups

# Generate self-signed SSL certificates if they don't exist
if [ ! -f "ssl/nginx-selfsigned.crt" ] || [ ! -f "ssl/nginx-selfsigned.key" ]; then
    print_status "Generating self-signed SSL certificates..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/nginx-selfsigned.key \
        -out ssl/nginx-selfsigned.crt \
        -subj "/C=VN/ST=HoChiMinh/L=HoChiMinh/O=SoulFriend/CN=localhost"
    print_warning "Using self-signed certificates. Replace with proper SSL certificates for production."
fi

# Build and start services
print_status "Building Docker images..."
docker-compose build --no-cache

print_status "Starting services..."
docker-compose up -d

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 30

# Check service health
print_status "Checking service health..."

# Check MongoDB
if docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    print_status "✅ MongoDB is healthy"
else
    print_error "❌ MongoDB is not responding"
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    print_status "✅ Redis is healthy"
else
    print_error "❌ Redis is not responding"
fi

# Check Application
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    print_status "✅ SoulFriend application is healthy"
else
    print_error "❌ SoulFriend application is not responding"
fi

# Check Nginx
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_status "✅ Nginx is healthy"
else
    print_error "❌ Nginx is not responding"
fi

# Setup default admin if needed
print_status "Setting up default admin user..."
docker-compose exec -T soulfriend-app node backend/dist/scripts/createDefaultAdmin.js

# Show deployment summary
echo ""
print_status "🎉 SoulFriend V3.0 deployment completed!"
echo ""
echo "📊 Service URLs:"
echo "   - Application: https://localhost"
echo "   - API Health: http://localhost:5000/api/health"
echo "   - Admin Panel: https://localhost/admin"
echo ""
echo "🔧 Management Commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Stop services: docker-compose down"
echo "   - Restart services: docker-compose restart"
echo "   - Update services: docker-compose pull && docker-compose up -d"
echo ""
echo "📝 Important Notes:"
echo "   - Default admin credentials are in your .env file"
echo "   - Change default passwords before production use"
echo "   - Replace self-signed SSL certificates with proper ones"
echo "   - Configure proper backup strategy"
echo ""

print_status "Deployment completed successfully! 🚀"
