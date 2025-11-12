# 🚨 Sentry Setup - Quick Start

## ✅ Đã hoàn thành
- [x] Cài đặt `@sentry/node` và `@sentry/profiling-node` (v10.25.0)
- [x] File config: `backend/src/config/sentry.ts` (326 lines)
- [x] Example code: `backend/src/examples/sentryExamples.ts`
- [x] Test routes: `backend/src/routes/sentryTestRoutes.ts`

## 🎯 Bước tiếp theo (5 phút)

### 1. Lấy Sentry DSN (2 phút)
```bash
# Truy cập: https://sentry.io/signup/
# Tạo account miễn phí (5,000 errors/tháng)
# Tạo project: Platform = Node.js, Name = "soulfriend-backend"
# Copy DSN từ Settings > Projects > Client Keys (DSN)
```

### 2. Thêm vào .env local (30 giây)
```env
# backend/.env
SENTRY_DSN=https://YOUR_PUBLIC_KEY@YOUR_ORG_ID.ingest.us.sentry.io/YOUR_PROJECT_ID
SENTRY_ENABLED=true
```

### 3. Thêm vào Render (1 phút)
```
Render Dashboard > soulfriend-backend > Environment
Thêm: SENTRY_DSN = <your-dsn-here>
Save Changes
```

### 4. Tích hợp vào Express (1 phút)
```typescript
// backend/src/index.ts hoặc simple-server.ts
// QUAN TRỌNG: Thêm Ở ĐẦU FILE

import { initSentry } from './config/sentry';

// Initialize Sentry FIRST
initSentry();

// Import Sentry handlers
import * as Sentry from '@sentry/node';

// After creating Express app
const app = express();

// Add Sentry handlers BEFORE routes
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// Your routes here...
app.use('/api', yourRoutes);

// Add Sentry error handler AFTER routes, BEFORE custom error handlers
app.use(Sentry.Handlers.errorHandler());

// Your custom error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Something went wrong' });
});
```

### 5. Test (30 giây)
```bash
# Start server
npm run dev

# Test error capture
curl http://localhost:5000/api/test/sentry/error

# Check Sentry dashboard
# https://sentry.io/organizations/YOUR_ORG/issues/
```

## 📚 Xem chi tiết

- **Setup đầy đủ**: `SENTRY_SETUP_GUIDE.md`
- **Usage examples**: `backend/src/examples/sentryExamples.ts`
- **Test routes**: `backend/src/routes/sentryTestRoutes.ts`

## 🔥 Quick Usage

```typescript
import { captureException, logger } from './config/sentry';

try {
  await riskyOperation();
} catch (error) {
  if (error instanceof Error) {
    captureException(error, {
      action: 'risky_operation',
      userId: user.id
    });
  }
  throw error;
}

// Logging
logger.info('User registered', { userId: user.id });
logger.error('Payment failed', { error: err.message });
```

## ✨ Features

- ✅ Error tracking with full stack traces
- ✅ Performance monitoring (100% traces)
- ✅ CPU profiling
- ✅ User context tracking
- ✅ Breadcrumbs (debugging trail)
- ✅ Structured logging
- ✅ Release tracking
- ✅ Auto-enabled in production only

## 🎉 Hoàn thành!

Sau khi thêm DSN và tích hợp vào Express:
- Mọi uncaught errors sẽ tự động report
- Performance được track
- Logs xuất hiện trong Sentry dashboard
- Nhận alerts qua email/Slack

---

**Need help?** Xem `SENTRY_SETUP_GUIDE.md` để biết chi tiết.
