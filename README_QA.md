# 🔍 SOULFRIEND V3.0 - QA/CI/CD SETUP GUIDE

Hướng dẫn nhanh để áp dụng các cải tiến QA/CI/CD cho dự án SoulFriend.

---

## 📦 FILES MỚI ĐƯỢC TẠO

### CI/CD & Automation
```
.github/
├── workflows/
│   ├── ci.yml              # Main CI/CD pipeline
│   └── security-scan.yml   # Daily security scans

Makefile                     # Quick commands (make test, make build, etc.)
apply-qa-fixes.ps1          # Script to apply fixes
```

### Docker Optimization
```
backend/.dockerignore        # Reduce Docker context by 50%+
frontend/.dockerignore       # Optimize frontend builds
```

### Code Quality
```
backend/src/middleware/
└── asyncHandler.ts          # Fix async route errors

backend/tsconfig.json        # Updated to include Jest types
```

### Documentation
```
QA_CI_CD_COMPREHENSIVE_REPORT.md  # Detailed 200+ line analysis
QA_SUMMARY.md                     # Quick summary & fixes
README_QA.md                      # This file
```

---

## 🚀 QUICK START

### 1. Xem tổng quan
```bash
# Đọc file tóm tắt nhanh
cat QA_SUMMARY.md

# Hoặc đọc báo cáo chi tiết
cat QA_CI_CD_COMPREHENSIVE_REPORT.md
```

### 2. Sử dụng Makefile
```bash
# Xem tất cả lệnh có sẵn
make help

# Chạy quality check đầy đủ
make quality

# Chạy tests với coverage
make test

# Build production
make build

# Docker
make docker-up
```

### 3. Áp dụng fixes (Cần manual)

#### Backend - Thêm asyncHandler

**File:** `backend/src/routes/admin.ts`

```typescript
// 1. Add import at top
import { asyncHandler } from '../middleware/asyncHandler';

// 2. Wrap async routes
router.get('/dashboard', authenticateAdmin, asyncHandler(async (req, res) => {
  // ... existing code stays the same
}));

router.get('/test-results', authenticateAdmin, asyncHandler(async (req, res) => {
  // ... existing code stays the same
}));

router.get('/export', authenticateAdmin, asyncHandler(async (req, res) => {
  // ... existing code stays the same
}));
```

**Repeat for:**
- `backend/src/routes/tests.ts`
- Any other async routes

#### Frontend - Fix Tests

**File:** `frontend/src/App.test.tsx`

```typescript
// OLD:
test('renders SoulFriend application', () => {
  render(<App />);
  const titleElements = screen.getAllByText(/SoulFriend V3.0/i);
  expect(titleElements.length).toBeGreaterThan(0);
});

// NEW:
test('renders SoulFriend application', () => {
  render(<App />);
  const title = screen.getByText(/SoulFriend/i);
  const version = screen.getByText(/V3.0 Expert Edition/i);
  expect(title).toBeInTheDocument();
  expect(version).toBeInTheDocument();
});
```

### 4. Verify Fixes
```bash
# Test backend
cd backend
npm run test:coverage

# Test frontend  
cd frontend
npm test -- --coverage --watchAll=false

# Or use Makefile
make test
```

### 5. Commit Changes
```bash
git add .
git commit -m "fix: improve error handling and test coverage

- Add asyncHandler middleware for Express routes
- Fix frontend test matchers
- Add CI/CD workflows
- Optimize Docker builds with .dockerignore
- Add Makefile for common tasks"

git push origin main
```

---

## 📊 CURRENT STATUS

### Test Results (Before Fixes)

**Backend:**
- ✅ 22/54 tests passing (40.7%)
- ❌ 32 tests failing (admin routes 500 errors)
- 📊 Coverage: 6.49%

**Frontend:**
- ✅ 3/11 tests passing (27.3%)
- ❌ 8 tests failing (async rendering)
- 📊 Coverage: 14.32%

### Expected After Fixes

**Backend:**
- ✅ ~50/54 tests passing (92%+)
- 📊 Coverage: ~15-20% (need more tests)

**Frontend:**
- ✅ ~10/11 tests passing (90%+)
- 📊 Coverage: ~20-25% (need more tests)

---

## 🎯 ROADMAP TO 80% COVERAGE

### Phase 1: Fix Existing (This Week)
- [x] Create CI/CD infrastructure
- [x] Add asyncHandler middleware
- [ ] Apply fixes to routes
- [ ] Run tests → verify improvements
- [ ] Commit & push

### Phase 2: Write Missing Tests (Next 2 Weeks)
- [ ] Backend services (0% → 60%)
- [ ] Backend utils (6% → 80%)
- [ ] Frontend components (24% → 70%)
- [ ] Integration tests

### Phase 3: Optimize (Week 3-4)
- [ ] Add Redis caching
- [ ] Database indexes
- [ ] Performance monitoring
- [ ] Load testing with k6

---

## 🔒 SECURITY

### Automated Scans
- **npm audit** - Runs in CI on every PR
- **Trivy** - Scans for vulnerabilities daily
- **TruffleHog** - Secret scanning

### Manual Checks Needed
1. Review JWT secret handling (no hardcoded fallbacks)
2. Input validation on all POST/PUT routes
3. Rate limiting configuration
4. CORS origins for production

---

## 🐳 DOCKER

### Before (.dockerignore missing)
- Build context: ~200MB+
- Includes: tests, node_modules, .git, etc.

### After (.dockerignore added)
- Build context: ~50-100MB
- Excludes: tests, coverage, dev files

### Commands
```bash
# Build optimized image
make docker-build

# Start stack
make docker-up

# View logs
make docker-logs

# Stop & clean
make docker-down
```

---

## 🤖 CI/CD WORKFLOWS

### Main CI Pipeline (`.github/workflows/ci.yml`)

Runs on every push/PR to main/develop:
1. **Backend Lint** → Type check → ESLint → Prettier
2. **Backend Test** → Jest with coverage → Upload to Codecov
3. **Backend Security** → npm audit → Trivy scan
4. **Backend Build** → Docker build
5. **Frontend Test** → Jest with coverage
6. **Frontend Build** → Production build
7. **Quality Gate** → All checks must pass

### Security Scan (`.github/workflows/security-scan.yml`)

Runs daily at 2 AM UTC:
- Dependency vulnerability scan
- Trivy filesystem scan
- Secret scanning with TruffleHog
- Results uploaded to GitHub Security tab

---

## 📚 REFERENCES

### Key Files to Read
1. `QA_SUMMARY.md` - Quick overview & fixes
2. `QA_CI_CD_COMPREHENSIVE_REPORT.md` - Detailed analysis
3. `Makefile` - All available commands
4. `.github/workflows/ci.yml` - CI/CD pipeline

### Documentation
- [Jest Testing](https://jestjs.io/docs/getting-started)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Makefile Tutorial](https://makefiletutorial.com/)

---

## 💡 TIPS

### Development
```bash
# Watch mode for backend tests
cd backend && npm run test:watch

# Start both backend & frontend
make dev-backend & make dev-frontend

# Quick quality check before commit
make quality
```

### Debugging Failed Tests
```bash
# Run specific test file
cd backend
npm test -- tests/routes/admin.test.ts

# Verbose output
npm test -- --verbose

# Update snapshots (if using)
npm test -- -u
```

### Docker Troubleshooting
```bash
# Check logs
docker-compose logs -f backend

# Rebuild from scratch
make docker-clean && make docker-build

# Shell into container
docker-compose exec backend sh
```

---

## ✅ CHECKLIST

Pre-commit:
- [ ] `make lint` passes
- [ ] `make type-check` passes
- [ ] `make test` passes
- [ ] No new security vulnerabilities
- [ ] Code formatted with Prettier

Pre-push:
- [ ] All tests passing locally
- [ ] Coverage not decreased
- [ ] Conventional commit message
- [ ] Branch up to date with main

Pre-deploy:
- [ ] CI/CD pipeline green
- [ ] Staging tested
- [ ] Database migrations ready
- [ ] Environment variables set

---

**Last Updated:** 2025-10-13  
**QA Engineer:** Cursor Super QA/CI/CD  
**Status:** ✅ Ready for implementation

