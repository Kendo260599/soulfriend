# 🚀 SoulFriend CI/CD Guide

## 📋 Overview

This guide explains the Continuous Integration and Continuous Deployment (CI/CD) pipelines for the SoulFriend project using GitHub Actions.

---

## 🔄 CI Pipeline (Continuous Integration)

### Triggers
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

### Jobs

#### 1. **Lint & Format Check**
- Runs ESLint to check code quality
- Verifies Prettier formatting
- **Duration:** ~2 minutes

#### 2. **Unit & Integration Tests**
- Runs all tests with MongoDB service
- Generates coverage reports
- Uploads to Codecov
- **Duration:** ~5 minutes

#### 3. **Build Check**
- Compiles TypeScript to JavaScript
- Uploads build artifacts
- **Duration:** ~3 minutes

#### 4. **Docker Build Check**
- Builds Docker image
- Uses layer caching for speed
- **Duration:** ~4 minutes

#### 5. **Security Scan**
- Runs `npm audit` for vulnerabilities
- Scans with Trivy
- Uploads results to GitHub Security
- **Duration:** ~2 minutes

### Total CI Time: ~16 minutes

---

## 🚢 CD Pipeline (Continuous Deployment)

### Triggers
- Push to `main` branch
- Git tags matching `v*` (e.g., `v1.0.0`)

### Jobs

#### 1. **Build & Push Docker Image**
- Builds production Docker image
- Pushes to GitHub Container Registry (ghcr.io)
- Tags with version, SHA, and branch name
- **Duration:** ~5 minutes

#### 2. **Deploy to Production**
- Only runs on version tags (`v*`)
- Supports multiple deployment platforms:
  - Render
  - Railway
  - DigitalOcean
  - SSH deployment
- **Duration:** ~3-10 minutes (depends on platform)

#### 3. **Create GitHub Release**
- Generates changelog from commits
- Creates GitHub release with notes
- Includes Docker image pull command
- **Duration:** ~1 minute

### Total CD Time: ~9-16 minutes

---

## ⚙️ Setup Instructions

### 1. Enable GitHub Actions
GitHub Actions is enabled by default for public repositories. For private repos:
1. Go to Settings → Actions → General
2. Enable "Allow all actions and reusable workflows"

### 2. Configure Secrets

#### Required Secrets (for CD)
Go to Settings → Secrets and variables → Actions → New repository secret:

```bash
# For Render deployment
RENDER_API_KEY=rnd_xxxxxxxxxxxxx
RENDER_SERVICE_ID=srv-xxxxxxxxxxxxx

# For Railway deployment
RAILWAY_TOKEN=xxxxxxxxxxxxx
RAILWAY_SERVICE_ID=xxxxxxxxxxxxx

# For DigitalOcean deployment
DIGITALOCEAN_ACCESS_TOKEN=xxxxxxxxxxxxx

# For SSH deployment
SSH_HOST=your-server.com
SSH_USERNAME=deploy
SSH_PRIVATE_KEY=-----BEGIN OPENSSH PRIVATE KEY-----...
```

#### Optional Secrets
```bash
# For Codecov integration
CODECOV_TOKEN=xxxxxxxxxxxxx
```

### 3. Configure Environments

Create production environment:
1. Go to Settings → Environments
2. Click "New environment"
3. Name: `production`
4. Add protection rules:
   - Required reviewers
   - Wait timer
   - Deployment branches: only `main`

---

## 📊 Workflow Status Badges

Add to your README.md:

```markdown
![CI](https://github.com/your-username/soulfriend/workflows/CI/badge.svg)
![CD](https://github.com/your-username/soulfriend/workflows/CD/badge.svg)
![CodeQL](https://github.com/your-username/soulfriend/workflows/CodeQL/badge.svg)
```

---

## 🔧 Local Testing

### Test CI Pipeline Locally
```bash
# Install act (GitHub Actions local runner)
brew install act  # macOS
choco install act  # Windows

# Run CI workflow
act push

# Run specific job
act -j test
```

### Manual Deployment Test
```bash
# Build Docker image
docker build -t soulfriend-backend:test ./backend

# Test image
docker run -p 5000:5000 --env-file .env soulfriend-backend:test
```

---

## 📝 Workflow Files

### `.github/workflows/ci.yml`
Main CI pipeline with:
- Linting
- Testing
- Building
- Security scanning

### `.github/workflows/cd.yml`
Deployment pipeline with:
- Docker image building
- Multi-platform deployment
- Release creation

### `.github/workflows/codeql.yml`
Security analysis with:
- Weekly scheduled scans
- Pull request analysis
- Security alerts

---

## 🐛 Troubleshooting

### CI Failures

#### Lint Errors
```bash
# Fix locally
cd backend
npm run lint:fix
npm run format
git add .
git commit -m "fix: lint errors"
```

#### Test Failures
```bash
# Run tests locally
cd backend
npm test

# Check MongoDB connection
docker run -d -p 27017:27017 mongo:7.0
npm test
```

#### Build Errors
```bash
# Clean and rebuild
cd backend
rm -rf dist node_modules
npm install
npm run build
```

### CD Failures

#### Docker Build Fails
```bash
# Test Docker build locally
docker build -t test ./backend

# Check Dockerfile syntax
docker build --no-cache -t test ./backend
```

#### Deployment Fails
```bash
# Check secrets are set
gh secret list

# Test deployment manually
# (Follow platform-specific guides)
```

---

## 🔐 Security Best Practices

### 1. **Secret Management**
- Never commit secrets to repository
- Use GitHub Secrets for sensitive data
- Rotate secrets regularly

### 2. **Branch Protection**
- Require PR reviews
- Require status checks to pass
- Restrict who can push to `main`

### 3. **Dependency Updates**
```bash
# Enable Dependabot
# Create .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/backend"
    schedule:
      interval: "weekly"
```

### 4. **Security Scanning**
- CodeQL runs weekly
- Trivy scans on every push
- npm audit on every build

---

## 📈 Performance Optimization

### 1. **Caching**
- npm dependencies cached
- Docker layers cached
- Build artifacts cached

### 2. **Parallel Jobs**
- Lint and test run in parallel
- Multiple deployment targets supported

### 3. **Conditional Execution**
- CD only runs on `main` branch
- Deployment only on version tags
- Security scans on schedule

---

## 🎯 Deployment Strategies

### 1. **Blue-Green Deployment**
```yaml
# In cd.yml, add:
- name: Deploy new version
  run: docker-compose up -d --scale backend=2

- name: Health check
  run: curl http://localhost:5000/api/health

- name: Switch traffic
  run: docker-compose up -d --scale backend-old=0
```

### 2. **Canary Deployment**
```yaml
# Deploy to 10% of servers first
- name: Deploy canary
  run: kubectl set image deployment/backend backend=new-image
  env:
    REPLICAS: 1

# Monitor for 5 minutes
- name: Monitor
  run: sleep 300

# Full rollout
- name: Full deployment
  run: kubectl scale deployment/backend --replicas=10
```

### 3. **Rolling Update**
```yaml
# Default Docker Compose behavior
docker-compose up -d --no-deps --build backend
```

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [Trivy Security Scanner](https://github.com/aquasecurity/trivy)

---

## 🆘 Support

If you encounter issues:
1. Check workflow logs in Actions tab
2. Review this guide's troubleshooting section
3. Test locally with `act`
4. Check GitHub Actions status page

---

**Last Updated:** 2025-10-08  
**Version:** 1.0.0
