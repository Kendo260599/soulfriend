# SoulFriend V3.0 - Makefile for Development & CI/CD
# Cross-platform commands for common tasks

.PHONY: help setup install test lint format clean build docker-build docker-up docker-down deploy

# Default target
help:
	@echo "SoulFriend V3.0 - Available Commands:"
	@echo ""
	@echo "  setup          - Full project setup (install all dependencies)"
	@echo "  install        - Install dependencies for backend and frontend"
	@echo "  test           - Run all tests with coverage"
	@echo "  lint           - Run linters on backend and frontend"
	@echo "  format         - Format code with Prettier"
	@echo "  type-check     - Run TypeScript type checking"
	@echo "  quality        - Run full quality check (lint + type + test)"
	@echo "  build          - Build backend and frontend for production"
	@echo "  clean          - Clean build artifacts and dependencies"
	@echo "  docker-build   - Build Docker images"
	@echo "  docker-up      - Start Docker Compose stack"
	@echo "  docker-down    - Stop Docker Compose stack"
	@echo "  audit          - Run security audits"
	@echo ""

# Setup & Installation
setup: install
	@echo "✅ Setup complete!"

install:
	@echo "📦 Installing backend dependencies..."
	cd backend && npm install
	@echo "📦 Installing frontend dependencies..."
	cd frontend && npm install
	@echo "✅ Dependencies installed!"

# Testing
test:
	@echo "🧪 Running backend tests..."
	cd backend && npm run test:coverage
	@echo "🧪 Running frontend tests..."
	cd frontend && npm test -- --coverage --watchAll=false
	@echo "✅ All tests complete!"

test-backend:
	@echo "🧪 Running backend tests..."
	cd backend && npm run test:coverage

test-frontend:
	@echo "🧪 Running frontend tests..."
	cd frontend && npm test -- --coverage --watchAll=false

# Code Quality
lint:
	@echo "🔍 Linting backend..."
	cd backend && npm run lint
	@echo "✅ Backend lint passed!"

lint-fix:
	@echo "🔧 Fixing backend lint issues..."
	cd backend && npm run lint:fix

format:
	@echo "💅 Formatting backend code..."
	cd backend && npm run format
	@echo "✅ Code formatted!"

format-check:
	@echo "💅 Checking backend code formatting..."
	cd backend && npm run format:check

type-check:
	@echo "🔎 Type checking backend..."
	cd backend && npm run type-check
	@echo "✅ Type check passed!"

quality: type-check lint format-check test
	@echo "✅ All quality checks passed!"

# Building
build:
	@echo "🏗️  Building backend..."
	cd backend && npm run build
	@echo "🏗️  Building frontend..."
	cd frontend && npm run build
	@echo "✅ Build complete!"

build-backend:
	cd backend && npm run build

build-frontend:
	cd frontend && npm run build

# Docker
docker-build:
	@echo "🐳 Building Docker images..."
	docker-compose build
	@echo "✅ Docker images built!"

docker-up:
	@echo "🐳 Starting Docker Compose..."
	docker-compose up -d
	@echo "✅ Services started!"
	@echo "Backend: http://localhost:5000"
	@echo "MongoDB: localhost:27017"

docker-down:
	@echo "🐳 Stopping Docker Compose..."
	docker-compose down
	@echo "✅ Services stopped!"

docker-logs:
	docker-compose logs -f

docker-clean:
	@echo "🧹 Cleaning Docker volumes and images..."
	docker-compose down -v
	docker system prune -f

# Security
audit:
	@echo "🔒 Running security audits..."
	cd backend && npm audit
	cd frontend && npm audit
	@echo "✅ Security audit complete!"

audit-fix:
	@echo "🔧 Fixing security vulnerabilities..."
	cd backend && npm audit fix
	cd frontend && npm audit fix

# Cleaning
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf backend/dist
	rm -rf backend/coverage
	rm -rf frontend/build
	rm -rf frontend/coverage
	@echo "✅ Clean complete!"

clean-all: clean
	@echo "🧹 Cleaning dependencies..."
	rm -rf backend/node_modules
	rm -rf frontend/node_modules
	@echo "✅ Full clean complete!"

# Development
dev-backend:
	@echo "🚀 Starting backend development server..."
	cd backend && npm run dev

dev-frontend:
	@echo "🚀 Starting frontend development server..."
	cd frontend && npm start

# Database
db-setup:
	@echo "🗄️  Setting up default admin..."
	cd backend && npm run setup

# CI/CD Simulation
ci: quality build
	@echo "✅ CI pipeline simulation complete!"

# Deployment (placeholder)
deploy:
	@echo "🚀 Deploying to production..."
	@echo "⚠️  Configure your deployment strategy first!"

