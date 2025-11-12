# 🚨 URGENT ACTION ITEMS - FIX NGAY

**Created:** November 12, 2025  
**Priority:** CRITICAL

---

## 🔴 CRITICAL - Làm Ngay Hôm Nay

### 1. REVOKE EXPOSED API KEY ⚠️
```bash
# SendGrid API key đã bị exposed trong .env file!
SENDGRID_API_KEY=SG.REDACTED_API_KEY_EXPOSED_IN_CODE
```

**Actions:**
- [ ] Login to SendGrid dashboard: https://app.sendgrid.com
- [ ] Go to Settings > API Keys
- [ ] Find and REVOKE key starting with `SG.kMqHWEo...` (check SendGrid dashboard)
- [ ] Generate new API key
- [ ] Update `.env` file with new key
- [ ] **DO NOT commit .env to git**

### 2. Fix .gitignore
```bash
cd "d:\ung dung\soulfriend"
echo "" >> .gitignore
echo "# Environment variables" >> .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore
echo "backend/.env" >> .gitignore
```

### 3. Remove .env from Git History
```bash
cd "d:\ung dung\soulfriend"
# Remove from staging
git rm --cached backend/.env

# Commit the removal
git commit -m "security: remove .env file from git tracking"
```

---

## 🟡 HIGH PRIORITY - This Week

### 4. Fix Redis Performance Issue
```typescript
// File: backend/src/config/redis.ts:213-227

// REPLACE:
async deletePattern(pattern: string): Promise<number> {
  const keys = await this.client.keys(pattern); // ❌ O(n) operation

// WITH:
async deletePattern(pattern: string): Promise<number> {
  let cursor = 0;
  let count = 0;
  do {
    const result = await this.client.scan(cursor, { MATCH: pattern, COUNT: 100 });
    cursor = result.cursor;
    if (result.keys.length > 0) {
      await this.client.del(result.keys);
      count += result.keys.length;
    }
  } while (cursor !== 0);
  return count;
}
```

### 5. Update Production Secrets
```env
# Generate strong secrets for production:

# JWT Secret (minimum 64 characters)
JWT_SECRET=$(openssl rand -base64 64)

# Encryption Key (minimum 32 characters)  
ENCRYPTION_KEY=$(openssl rand -base64 32)

# Admin Password (strong random)
DEFAULT_ADMIN_PASSWORD=$(openssl rand -base64 16)
```

### 6. Add Database Indexes
```typescript
// File: backend/src/models/TestResult.ts
TestResultSchema.index({ userId: 1, createdAt: -1 });
TestResultSchema.index({ testType: 1, userId: 1 });

// File: backend/src/models/ConversationLog.ts  
ConversationLogSchema.index({ sessionId: 1, timestamp: -1 });
ConversationLogSchema.index({ userId: 1, timestamp: -1 });

// File: backend/src/models/HITLFeedback.ts
HITLFeedbackSchema.index({ alertId: 1, status: 1 });
HITLFeedbackSchema.index({ expertId: 1, createdAt: -1 });
```

---

## 🟢 MEDIUM PRIORITY - Next 2 Weeks

### 7. Remove Duplicate Dependency
```bash
cd "d:\ung dung\soulfriend\backend"
npm uninstall bcryptjs
# Only use bcrypt (already installed)
```

### 8. Implement Socket.io Conversation History
```typescript
// File: backend/src/socket/socketServer.ts:361

// REPLACE:
// TODO: Implement MongoDB query to get conversation history

// WITH:
const conversationHistory = await ConversationLog.find({
  $or: [
    { sessionId: alert.sessionId },
    { userId: alert.userId }
  ]
})
.sort({ timestamp: 1 })
.limit(50)
.lean();
```

### 9. Add Pagination to All List Endpoints
```typescript
// Example for backend/src/routes/user.ts:116

router.get('/tests/history/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const [results, total] = await Promise.all([
    TestResult.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    TestResult.countDocuments({ userId })
  ]);

  res.json({
    success: true,
    data: results,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});
```

### 10. Replace console.error with logger
```bash
# Find and replace in all files:
console.error → logger.error
console.log → logger.info
console.warn → logger.warn
```

---

## 📋 Quick Checklist

- [ ] ⚠️  **CRITICAL:** Revoke SendGrid API key
- [ ] ⚠️  **CRITICAL:** Add .env to .gitignore  
- [ ] ⚠️  **CRITICAL:** Remove .env from git
- [ ] 🔧 Fix Redis keys() performance issue
- [ ] 🔒 Update production secrets (JWT, passwords)
- [ ] 📊 Add database indexes
- [ ] 🧹 Remove bcryptjs dependency
- [ ] ✅ Implement conversation history
- [ ] 📄 Add pagination to endpoints
- [ ] 📝 Standardize logging

---

## 🎯 Commands to Run Now

```bash
# 1. Fix .gitignore
cd "d:\ung dung\soulfriend"
echo ".env*" >> .gitignore
git rm --cached backend/.env
git add .gitignore
git commit -m "security: remove .env and update .gitignore"

# 2. Clean up dependencies
cd backend
npm uninstall bcryptjs

# 3. Build and verify
npm run build

# 4. Test everything still works
npm start
```

---

## 📞 Next Steps After Fixes

1. **Deploy to Staging**
   - Test all endpoints
   - Verify new API key works
   - Check performance improvements

2. **Monitor**
   - Check Sentry for errors
   - Monitor Redis performance
   - Review database query times

3. **Documentation**
   - Update README with new setup steps
   - Create API documentation
   - Document security procedures

---

**Status:** 🔴 URGENT - 3 critical security issues  
**Timeline:** Fix today (security), this week (performance)  
**Owner:** Development Team
