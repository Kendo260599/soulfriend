#!/bin/bash

# Simple Railway Deployment Script for SoulFriend
echo "🚀 Starting Railway deployment..."

# Set Railway token
export RAILWAY_TOKEN="ef97cad8-db03-404b-aa04-1f3338740bcb"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

echo "✅ Railway CLI found"

echo "🔐 Please login to Railway manually:"
echo "1. Run: railway login"
echo "2. Paste token: ef97cad8-db03-404b-aa04-1f3338740bcb"
echo "3. Press Enter"

# Wait for user to login
read -p "Press Enter after logging in"

# Deploy backend
echo "🚀 Deploying backend..."
cd backend

# Initialize project
echo "📦 Initializing Railway project for backend..."
railway init

# Set environment variables
echo "🔧 Setting backend environment variables..."
railway variables --set "NODE_ENV=production"
railway variables --set "PORT=5000"
railway variables --set "MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/soulfriend"
railway variables --set "JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long-change-this-in-production"
railway variables --set "ENCRYPTION_KEY=your-encryption-key-must-be-64-hex-characters-long-change-this-in-production"
railway variables --set "DEFAULT_ADMIN_USERNAME=admin"
railway variables --set "DEFAULT_ADMIN_EMAIL=admin@soulfriend.vn"
railway variables --set "DEFAULT_ADMIN_PASSWORD=ChangeThisSecurePassword123!"
railway variables --set "GEMINI_API_KEY=***REDACTED_GEMINI_KEY***"

# Deploy backend
railway up --detach

# Get backend URL
echo "✅ Backend deployed! Getting URL..."
BACKEND_URL=$(railway status --json | jq -r '.url')
echo "Backend URL: $BACKEND_URL"

# Deploy frontend
echo "🌐 Deploying frontend..."
cd ../frontend

# Initialize project
echo "📦 Initializing Railway project for frontend..."
railway init

# Set environment variables
echo "🔧 Setting frontend environment variables..."
railway variables --set "REACT_APP_API_URL=$BACKEND_URL"
railway variables --set "REACT_APP_GEMINI_API_KEY=***REDACTED_GEMINI_KEY***"

# Deploy frontend
railway up --detach

# Get frontend URL
echo "✅ Frontend deployed! Getting URL..."
FRONTEND_URL=$(railway status --json | jq -r '.url')
echo "Frontend URL: $FRONTEND_URL"

echo "🎉 Deployment completed!"
echo "Backend: $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
echo "🔗 Check your Railway dashboard for more details"
