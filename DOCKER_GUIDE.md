# 🐳 SoulFriend Docker Deployment Guide

## 📋 Table of Contents
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum
- 10GB disk space

### 1. Clone and Setup
```bash
git clone <repository-url>
cd soulfriend
```

### 2. Configure Environment
```bash
# Copy example environment file
cp env.docker.example .env

# Edit .env and set your values
nano .env
```

**Important:** Change these values in production:
- `MONGO_ROOT_PASSWORD`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `DEFAULT_ADMIN_PASSWORD`
- `GEMINI_API_KEY`

### 3. Start Services
```bash
# Production mode
docker-compose up -d

# Development mode
docker-compose -f docker-compose.dev.yml up -d
```

### 4. Verify Deployment
```bash
# Check services status
docker-compose ps

# Check backend health
curl http://localhost:5000/api/health

# View logs
docker-compose logs -f backend
```

---

## 💻 Development Setup

### Start Development Environment
```bash
# Start with hot reload
docker-compose -f docker-compose.dev.yml up

# Run in background
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f backend
```

### Development Features
- ✅ Hot reload enabled
- ✅ Debug port exposed (9229)
- ✅ Source code mounted as volume
- ✅ Detailed logging (debug level)

### Debug with VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "attach",
  "name": "Docker: Attach to Node",
  "port": 9229,
  "address": "localhost",
  "localRoot": "${workspaceFolder}/backend",
  "remoteRoot": "/app",
  "protocol": "inspector"
}
```

---

## 🏭 Production Deployment

### 1. Build Production Images
```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
```

### 2. Start Production Services
```bash
# Start all services
docker-compose up -d

# Scale backend (if needed)
docker-compose up -d --scale backend=3
```

### 3. Health Checks
```bash
# Check all services
docker-compose ps

# Check backend health
curl http://localhost:5000/api/health

# Check MongoDB
docker exec soulfriend-mongodb mongosh --eval "db.adminCommand('ping')"
```

### 4. View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

---

## ⚙️ Configuration

### Environment Variables

#### MongoDB
```env
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=secure_password_here
MONGO_PORT=27017
```

#### Backend
```env
BACKEND_PORT=5000
NODE_ENV=production
LOG_LEVEL=info
```

#### Security
```env
JWT_SECRET=<64-character-random-string>
ENCRYPTION_KEY=<64-hex-character-string>
DEFAULT_ADMIN_PASSWORD=<strong-password>
```

#### AI Services
```env
GEMINI_API_KEY=<your-api-key>
```

### Port Mapping
- **Backend API**: `5000:5000`
- **MongoDB**: `27017:27017`
- **Debug Port** (dev only): `9229:9229`

### Volumes
- `mongodb_data`: MongoDB data persistence
- `mongodb_config`: MongoDB configuration
- `backend_logs`: Application logs

---

## 🔧 Common Commands

### Service Management
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart specific service
docker-compose restart backend

# Remove all containers and volumes
docker-compose down -v
```

### Logs and Debugging
```bash
# View logs
docker-compose logs -f

# Execute command in container
docker-compose exec backend sh

# Check MongoDB data
docker-compose exec mongodb mongosh -u admin -p <password>
```

### Database Operations
```bash
# Backup MongoDB
docker-compose exec mongodb mongodump --out=/data/backup

# Restore MongoDB
docker-compose exec mongodb mongorestore /data/backup

# Access MongoDB shell
docker-compose exec mongodb mongosh -u admin -p <password>
```

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. MongoDB not ready - wait 30s and restart
docker-compose restart backend

# 2. Port already in use
lsof -i :5000
kill -9 <PID>

# 3. Environment variables missing
docker-compose config
```

### MongoDB Connection Issues
```bash
# Check MongoDB status
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Check network
docker network inspect soulfriend-network

# Restart MongoDB
docker-compose restart mongodb
```

### Permission Issues
```bash
# Fix volume permissions
docker-compose down
sudo chown -R 1001:1001 ./volumes

# Recreate volumes
docker-compose down -v
docker-compose up -d
```

### High Memory Usage
```bash
# Check resource usage
docker stats

# Limit memory in docker-compose.yml:
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
```

---

## 📊 Monitoring

### Health Checks
```bash
# Backend health
curl http://localhost:5000/api/health

# MongoDB health
docker-compose exec mongodb mongosh --eval "db.serverStatus()"
```

### Resource Usage
```bash
# Real-time stats
docker stats

# Container inspection
docker inspect soulfriend-backend
```

---

## 🔐 Security Best Practices

1. **Change Default Passwords**
   - MongoDB root password
   - Admin account password
   - JWT secret
   - Encryption key

2. **Use Secrets Management**
   ```bash
   # Use Docker secrets in production
   docker secret create mongo_password mongo_password.txt
   ```

3. **Network Isolation**
   - Backend and MongoDB on private network
   - Only expose necessary ports

4. **Regular Updates**
   ```bash
   # Update images
   docker-compose pull
   docker-compose up -d
   ```

5. **Backup Strategy**
   ```bash
   # Automated backup script
   docker-compose exec mongodb mongodump --out=/backup/$(date +%Y%m%d)
   ```

---

## 📝 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Docker Hub](https://hub.docker.com/_/mongo)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

---

## 🆘 Support

If you encounter issues:
1. Check logs: `docker-compose logs -f`
2. Verify configuration: `docker-compose config`
3. Check health: `curl http://localhost:5000/api/health`
4. Review this guide's troubleshooting section

---

**Last Updated:** 2025-10-08  
**Version:** 1.0.0
