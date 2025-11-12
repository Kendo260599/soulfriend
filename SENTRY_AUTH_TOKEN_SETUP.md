# ✅ SENTRY AUTH TOKEN - Add to Render Manually

## 🔑 Environment Variable to Add:

**Variable Name:**
```
SENTRY_AUTH_TOKEN
```

**Value:**
```
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
```

---

## 📋 How to Add on Render Dashboard:

### Option 1: Via Render Dashboard (RECOMMENDED)
1. Go to: https://dashboard.render.com/
2. Select your service: **soulfriend-api**
3. Click **Environment** tab
4. Click **Add Environment Variable**
5. Add:
   - **Key**: `SENTRY_AUTH_TOKEN`
   - **Value**: `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`
6. Click **Save Changes**
7. Render will automatically redeploy

### Option 2: Via Render CLI
```bash
render config set SENTRY_AUTH_TOKEN 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
```

---

## 🎯 What This Token Does:

### 1. **Source Maps Upload**
- Automatically uploads TypeScript source maps to Sentry
- Enables viewing original source code in error stack traces
- Shows exact line numbers from `.ts` files (not compiled `.js`)

### 2. **Release Management**
- Creates releases in Sentry automatically
- Links errors to specific Git commits
- Tracks which code version caused each error

### 3. **Better Debugging**
Example of error WITHOUT source maps:
```
Error at index.js:1234:56
  at anonymousFunction (bundle.js:9876:12)
```

Example of error WITH source maps:
```
Error at src/services/chatbot.ts:45:10
  at ChatbotService.processMessage (src/services/chatbot.ts:45:10)
```

---

## 🔒 Security Note:

⚠️ **NEVER commit this token to Git!**
- Already added to `.env` (which is in `.gitignore`)
- Only add to Render environment variables
- Rotate token if accidentally exposed

---

## ✅ Verification:

After adding the token and redeploying, check:

1. **Sentry Dashboard** → **Settings** → **Source Maps**
   - Should see uploaded source maps for latest release

2. **Test Error Endpoint:**
   ```bash
   curl https://soulfriend-api.onrender.com/api/test/sentry/error
   ```

3. **Check Sentry Issues:**
   - Click on any error
   - Should see original TypeScript code (not compiled JavaScript)
   - Line numbers should match your source files

---

## 📚 Related Documentation:

- Sentry Source Maps: https://docs.sentry.io/platforms/javascript/sourcemaps/
- Render Env Vars: https://render.com/docs/environment-variables
- Sentry Auth Tokens: https://docs.sentry.io/api/auth/

---

## 🚀 Current Sentry Configuration:

```typescript
// backend/src/config/sentry.ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.RENDER_GIT_COMMIT, // ✅ Automatic release tracking
  tracesSampleRate: 0.1, // 10% performance monitoring
  profilesSampleRate: 0.1, // 10% profiling
});
```

**All configuration is ready - just add the token to Render!** 🎉
