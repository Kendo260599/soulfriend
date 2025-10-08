#!/bin/bash

# Railway Deployment Script for SoulFriend
echo "🚀 Starting Railway deployment..."

# Set Railway token
export RAILWAY_TOKEN="ef97cad8-db03-404b-aa04-1f3338740bcb"

# Login to Railway
echo "🔐 Logging into Railway..."
railway login

# Create new project
echo "📦 Creating Railway project..."
railway project new soulfriend

# Link to existing project (if exists)
echo "🔗 Linking to project..."
railway link

# Deploy backend
echo "🚀 Deploying backend..."
cd backend
railway up --detach

# Deploy frontend
echo "🌐 Deploying frontend..."
cd ../frontend
railway up --detach

echo "✅ Deployment completed!"
echo "🔗 Check your Railway dashboard for URLs"

