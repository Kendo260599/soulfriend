# 🛡️ HƯỚNG DẪN CÀI ĐẶT VÀ CẤU HÌNH SENTRY

## ✅ Trạng thái hiện tại

**Packages đã cài**:
- ✅ `@sentry/node@10.25.0` - Sentry SDK cho Node.js
- ✅ `@sentry/profiling-node@10.25.0` - Performance profiling

**File config đã có**:
- ✅ `backend/src/config/sentry.ts` (326 dòng)

---

## 🔧 BƯỚC 1: Lấy Sentry DSN

### 1.1. Tạo tài khoản Sentry (nếu chưa có)
1. Truy cập: https://sentry.io/signup/
2. Đăng ký miễn phí (Free plan: 5,000 errors/month)

### 1.2. Tạo Project
1. Đăng nhập Sentry Dashboard: https://sentry.io/
2. Click **"Create Project"**
3. Chọn platform: **Node.js**
4. Project name: `soulfriend-backend`
5. Alert frequency: **Alert me on every new issue**
6. Click **"Create Project"**

### 1.3. Copy DSN
Sau khi tạo project, bạn sẽ thấy DSN (Data Source Name):
```
https://8797054ebfc26476257f829b8db2c2b8@o4518400842297348.ingest.us.sentry.io/4519280442736840
```

**Format DSN**:
```
https://<PUBLIC_KEY>@<ORGANIZATION_ID>.ingest.<REGION>.sentry.io/<PROJECT_ID>
```

---

## 🔧 BƯỚC 2: Cấu hình Environment Variables

### 2.1. Local Development (.env)

Mở file `backend/.env` và thêm:

```bash
# Sentry Configuration
SENTRY_DSN=https://YOUR_PUBLIC_KEY@YOUR_ORG.ingest.us.sentry.io/YOUR_PROJECT_ID
SENTRY_ENABLED=true  # Enable in development (optional)

# Release tracking (optional)
RENDER_GIT_COMMIT=local-dev
```

**Ví dụ cụ thể**:
```bash
SENTRY_DSN=https://8797054ebfc26476257f829b8db2c2b8@o4518400842297348.ingest.us.sentry.io/4519280442736840
SENTRY_ENABLED=true
```

### 2.2. Production (Render Dashboard)

1. Đăng nhập Render: https://dashboard.render.com/
2. Chọn service: **soulfriend-api**
3. Tab **Environment**
4. Add variables:

```bash
SENTRY_DSN=https://YOUR_DSN_HERE
```

**Note**: 
- `RENDER_GIT_COMMIT` tự động được set bởi Render
- `NODE_ENV=production` đã có sẵn

---

## 🔧 BƯỚC 3: Integrate vào Express App

### 3.1. File `backend/src/index.ts` hoặc `backend/src/simple-server.ts`

Thêm Sentry vào đầu file (TRƯỚC tất cả imports khác):

```typescript
// ===== SENTRY MUST BE FIRST =====
import { initSentry } from './config/sentry';
initSentry(); // Initialize Sentry trước mọi thứ
// ================================

import express from 'express';
import mongoose from 'mongoose';
import * as Sentry from '@sentry/node';
// ... other imports

const app = express();

// Sentry request handler PHẢI là middleware đầu tiên
app.use(Sentry.Handlers.requestHandler());

// Sentry tracing middleware (sau requestHandler)
app.use(Sentry.Handlers.tracingHandler());

// ... các middleware khác (cors, helmet, bodyParser, etc.)
app.use(express.json());
app.use(cors());

// ... routes của bạn
app.use('/api', routes);

// Sentry error handler PHẢI là middleware cuối cùng (trước error handler của bạn)
app.use(Sentry.Handlers.errorHandler());

// Custom error handler (sau Sentry errorHandler)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**⚠️ Thứ tự quan trọng**:
1. `initSentry()` - Đầu tiên
2. `Sentry.Handlers.requestHandler()` - Middleware đầu tiên
3. `Sentry.Handlers.tracingHandler()` - Middleware thứ 2
4. Các middleware khác (cors, bodyParser, etc.)
5. Routes
6. `Sentry.Handlers.errorHandler()` - Middleware cuối (trước custom error handler)
7. Custom error handler

---

## 📝 BƯỚC 4: Sử dụng Sentry trong Code

### 4.1. Import Sentry Utils

```typescript
import { 
  captureException, 
  captureMessage, 
  logger,
  setUserContext,
  addBreadcrumb,
  withSpan
} from './config/sentry';
```

### 4.2. Log Errors

```typescript
// ✅ Tự động: Uncaught exceptions được catch bởi Sentry
try {
  await someOperation();
} catch (error) {
  captureException(error, {
    userId: req.user?.id,
    action: 'create_user',
    endpoint: req.path
  });
  throw error;
}
```

### 4.3. Log Messages

```typescript
// Info log
logger.info('User logged in successfully', { 
  userId: user.id,
  email: user.email 
});

// Warning log
logger.warn('Rate limit approaching', { 
  current: 90, 
  limit: 100 
});

// Error log
logger.error('Payment failed', { 
  errorCode: 'CARD_DECLINED',
  amount: 100 
});

// Hoặc dùng captureMessage
captureMessage('User payment processed', 'info');
```

### 4.4. Set User Context

```typescript
// Sau khi user login
import { setUserContext } from './config/sentry';

app.post('/api/auth/login', async (req, res) => {
  const user = await authenticateUser(req.body);
  
  // Set user context cho Sentry
  setUserContext(user.id, user.email, user.username);
  
  res.json({ token: generateToken(user) });
});

// Khi user logout
import { clearUserContext } from './config/sentry';

app.post('/api/auth/logout', (req, res) => {
  clearUserContext();
  res.json({ message: 'Logged out' });
});
```

### 4.5. Add Breadcrumbs (Debug Trail)

```typescript
import { addBreadcrumb } from './config/sentry';

// Track user actions
addBreadcrumb('User clicked payment button', 'user', 'info', { 
  amount: 100,
  currency: 'USD' 
});

// Track API calls
addBreadcrumb('Calling payment API', 'api', 'info', { 
  endpoint: '/api/payment',
  method: 'POST' 
});
```

### 4.6. Performance Tracking

```typescript
import { withSpan } from './config/sentry';

// Track database query performance
const user = await withSpan('database.findUser', async () => {
  return await User.findById(userId);
});

// Track external API call
const result = await withSpan('api.payment.create', async () => {
  return await stripe.charges.create({ amount: 1000 });
});
```

---

## 🧪 BƯỚC 5: Test Sentry Integration

### 5.1. Test Route (Development)

Thêm test route vào `backend/src/routes/sentryTest.ts`:

```typescript
import express from 'express';
import { logger, captureMessage, captureException } from '../config/sentry';

const router = express.Router();

// Test Sentry logging
router.get('/test/sentry/log', (req, res) => {
  logger.info('Sentry test log triggered', { 
    action: 'test_log',
    timestamp: new Date().toISOString() 
  });
  
  res.json({ 
    message: 'Log sent to Sentry',
    check: 'https://sentry.io/ -> Logs' 
  });
});

// Test Sentry message
router.get('/test/sentry/message', (req, res) => {
  captureMessage('Test message from SoulFriend API', 'info');
  
  res.json({ 
    message: 'Message sent to Sentry',
    check: 'https://sentry.io/ -> Issues' 
  });
});

// Test Sentry error
router.get('/test/sentry/error', (req, res) => {
  try {
    throw new Error('Test error for Sentry monitoring');
  } catch (error) {
    captureException(error, {
      route: '/test/sentry/error',
      method: 'GET',
      test: true
    });
  }
  
  res.json({ 
    message: 'Error sent to Sentry',
    check: 'https://sentry.io/ -> Issues' 
  });
});

// Test Sentry crash (uncaught exception)
router.get('/test/sentry/crash', (req, res) => {
  // This will crash and be caught by Sentry
  throw new Error('Intentional crash for Sentry testing');
});

export default router;
```

Register route trong `backend/src/index.ts`:
```typescript
import sentryTestRoutes from './routes/sentryTest';
app.use('/api', sentryTestRoutes);
```

### 5.2. Test Commands

```bash
# Start server
cd backend
npm run dev

# Test logging
curl http://localhost:5000/api/test/sentry/log

# Test message
curl http://localhost:5000/api/test/sentry/message

# Test error
curl http://localhost:5000/api/test/sentry/error

# Test crash (server will crash and restart with nodemon)
curl http://localhost:5000/api/test/sentry/crash
```

### 5.3. Verify trên Sentry Dashboard

1. Login Sentry: https://sentry.io/
2. Chọn project: **soulfriend-backend**
3. Check các tabs:
   - **Issues** - Errors và messages
   - **Performance** - Transactions và spans
   - **Releases** - Deploy tracking

---

## 📊 BƯỚC 6: Monitoring và Alerts

### 6.1. Setup Alerts

1. Sentry Dashboard → **Alerts** → **Create Alert**
2. Chọn **Issues**
3. Conditions:
   - When: **a new issue is created**
   - Or: **the issue changes state from resolved to unresolved**
4. Actions:
   - Send notification to: **Your Email**
   - Or: Connect Slack/Discord

### 6.2. Performance Monitoring

1. **Performance** tab → Xem:
   - Transaction throughput
   - Response times (p50, p75, p95, p99)
   - Slow transactions
   - Database query performance

### 6.3. Release Tracking

Mỗi lần deploy, Render tự động set `RENDER_GIT_COMMIT`:
- Sentry track errors theo commit
- So sánh performance giữa các releases
- Rollback nếu có vấn đề

---

## 🔍 EXAMPLES: Real-World Usage

### Example 1: User Registration

```typescript
import { captureException, setUserContext, addBreadcrumb } from '../config/sentry';

router.post('/register', async (req, res) => {
  try {
    addBreadcrumb('User registration started', 'user', 'info', {
      email: req.body.email
    });

    const user = await User.create(req.body);
    
    // Set user context
    setUserContext(user.id, user.email, user.username);
    
    addBreadcrumb('User registered successfully', 'user', 'info', {
      userId: user.id
    });

    res.status(201).json({ user });
  } catch (error) {
    captureException(error, {
      action: 'user_registration',
      email: req.body.email,
      endpoint: '/api/register'
    });
    res.status(500).json({ error: 'Registration failed' });
  }
});
```

### Example 2: Database Query with Performance Tracking

```typescript
import { withSpan, captureException } from '../config/sentry';

async function getUserTests(userId: string) {
  try {
    const tests = await withSpan('database.getUserTests', async () => {
      return await TestResult
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(20);
    });
    
    return tests;
  } catch (error) {
    captureException(error, {
      action: 'get_user_tests',
      userId
    });
    throw error;
  }
}
```

### Example 3: External API Call

```typescript
import { withSpan, logger, captureException } from '../config/sentry';

async function sendEmail(to: string, subject: string, body: string) {
  try {
    const result = await withSpan('api.sendgrid.send', async () => {
      return await sendgridClient.send({
        to,
        from: 'noreply@soulfriend.com',
        subject,
        text: body
      });
    });
    
    logger.info('Email sent successfully', { 
      to, 
      subject,
      messageId: result[0].messageId 
    });
    
    return result;
  } catch (error) {
    captureException(error, {
      action: 'send_email',
      to,
      subject,
      provider: 'sendgrid'
    });
    throw error;
  }
}
```

---

## 📋 CHECKLIST CÀI ĐẶT

- [ ] ✅ Packages installed: `@sentry/node`, `@sentry/profiling-node`
- [ ] ✅ File config created: `backend/src/config/sentry.ts`
- [ ] Tạo Sentry project trên https://sentry.io/
- [ ] Copy SENTRY_DSN và add vào `.env` (local)
- [ ] Add SENTRY_DSN vào Render Environment Variables
- [ ] Integrate Sentry vào `index.ts` hoặc `simple-server.ts`:
  - [ ] `initSentry()` ở đầu file
  - [ ] `Sentry.Handlers.requestHandler()` middleware đầu tiên
  - [ ] `Sentry.Handlers.tracingHandler()` middleware thứ 2
  - [ ] `Sentry.Handlers.errorHandler()` trước custom error handler
- [ ] Test Sentry với test routes
- [ ] Verify errors xuất hiện trên Sentry Dashboard
- [ ] Setup alerts (email/Slack)
- [ ] Document cho team

---

## 🚀 QUICK START

```bash
# 1. Packages đã cài ✅
cd backend
npm list @sentry/node @sentry/profiling-node

# 2. Thêm DSN vào .env
echo "SENTRY_DSN=https://YOUR_DSN_HERE" >> .env
echo "SENTRY_ENABLED=true" >> .env

# 3. File config đã có ✅
# backend/src/config/sentry.ts

# 4. Import vào server
# Thêm vào đầu file index.ts:
import { initSentry } from './config/sentry';
initSentry();

# 5. Test
npm run dev
curl http://localhost:5000/api/test/sentry/log
```

---

## 📚 TÀI LIỆU THAM KHẢO

- Sentry Node.js SDK: https://docs.sentry.io/platforms/javascript/guides/node/
- Sentry Dashboard: https://sentry.io/
- Performance Monitoring: https://docs.sentry.io/product/performance/
- Release Health: https://docs.sentry.io/product/releases/health/

---

**Generated**: 2025-11-12  
**SoulFriend v4.0**  
**Status**: Packages installed ✅, Config ready ✅, Setup pending
