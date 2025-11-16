# 🚀 RENDER ENVIRONMENT SETUP

**Status:** ✅ Code deployed to GitHub (commit: fd374cd)  
**Next Step:** Add environment variables to Render

---

## 📋 Environment Variables cần thêm vào Render

### 1. Truy cập Render Dashboard

1. Go to: https://dashboard.render.com
2. Select service: **soulfriend-backend**
3. Click tab: **Environment**

---

### 2. Thêm các biến sau:

#### 🔴 REQUIRED - Sentry Configuration

```
Key: SENTRY_DSN
Value: https://87756dad75cc637adef034890b6b29dc@o4510344200454144.ingest.us.sentry.io/4510344229027840
```

```
Key: SENTRY_ENABLED
Value: true
```

#### 🔴 REQUIRED - Security Keys

```
Key: ENCRYPTION_KEY
Value: soulfriend_encryption_key_32_chars_minimum_required_2024
```

#### 🟡 OPTIONAL - OpenAI (nếu dùng chatbot)

```
Key: OPENAI_API_KEY
Value: sk-proj-... (your real OpenAI API key)
```

---

### 3. Các biến đã có sẵn (KHÔNG cần thêm lại):

- ✅ `PORT` (Render auto-set)
- ✅ `MONGODB_URI` (should already exist)
- ✅ `JWT_SECRET` (should already exist)
- ✅ `NODE_ENV` (Render auto-set to 'production')
- ✅ `SENDGRID_API_KEY` (should already exist)
- ✅ `SENDGRID_FROM_EMAIL` (should already exist)

---

## 🎯 Deployment Steps

### Step 1: Add Environment Variables
1. ✅ Open Render Dashboard
2. ✅ Go to Environment tab
3. ✅ Add SENTRY_DSN
4. ✅ Add SENTRY_ENABLED=true
5. ✅ Add ENCRYPTION_KEY
6. ✅ Add OPENAI_API_KEY (optional)
7. ✅ Click "Save Changes"

### Step 2: Deploy
- Render will **auto-deploy** after saving environment variables
- Or click "Manual Deploy" > "Deploy latest commit"

### Step 3: Monitor Deployment
```
Watch deploy logs:
https://dashboard.render.com/web/[YOUR-SERVICE-ID]/logs
```

Expected logs:
```
✅ Sentry initialized successfully
✅ OpenAI AI Ready (if API key provided)
✅ Database Connected
🚀 Server started on port 10000
```

### Step 4: Verify Sentry Working
```bash
# Test error capture
curl https://your-app.onrender.com/api/test/sentry/error

# Expected response:
# Server throws error -> captured in Sentry dashboard
```

### Step 5: Check Sentry Dashboard
1. Go to: https://sentry.io
2. Navigate to your project
3. Check "Issues" tab
4. You should see the test error appear within seconds

---

## ✅ Verification Checklist

After deployment:

- [ ] Render deploy status: **Live**
- [ ] Server logs show: "Sentry initialized successfully"
- [ ] Server logs show: "Server started"
- [ ] No error in logs
- [ ] Health check: `https://your-app.onrender.com/api/health` returns 200
- [ ] Sentry test: `https://your-app.onrender.com/api/test/sentry/error` works
- [ ] Sentry dashboard shows test error
- [ ] Performance tab shows transactions

---

## 🆘 Troubleshooting

### Issue: "ENCRYPTION_KEY is required"
**Solution:** Add ENCRYPTION_KEY to Render environment variables

### Issue: "Sentry not initialized"
**Solution:** 
1. Check SENTRY_DSN is correct
2. Verify SENTRY_ENABLED=true
3. Restart deployment

### Issue: Build fails
**Solution:**
1. Check Render build logs
2. Verify all dependencies in package.json
3. Run `npm run build` locally first

### Issue: Errors not appearing in Sentry
**Solution:**
1. Verify SENTRY_DSN is correct (no typos)
2. Check NODE_ENV=production on Render
3. Wait 1-2 minutes for data to sync
4. Check Sentry project settings > Client Keys

---

## 📊 Expected Results

### Render Logs:
```
==> Installing dependencies...
==> Running 'npm install'...
==> Building...
==> Running 'npm run build'...
✅ Build complete

==> Starting server...
✅ Sentry initialized successfully
   Environment: production
   DSN: https://87756dad75cc637adef034...
✅ MongoDB connected successfully
╔════════════════════════════════════════════╗
║   🚀 SIMPLE SERVER STARTED!               ║
║   ✅ OpenAI AI Ready (GPT-4o-mini)      ║
║   ✅ Database Connected                    ║
║   ✅ Sentry Enabled                    ║
╠════════════════════════════════════════════╣
║   Port: 10000                              ║
╚════════════════════════════════════════════╝
```

### Sentry Dashboard:
- **Issues tab:** Test errors visible
- **Performance tab:** HTTP transactions tracked
- **Releases tab:** New deployment visible (commit: fd374cd)

---

## 🎉 Success Indicators

✅ **Deployment successful when:**
1. Render status: **Live** (green)
2. Server logs: No errors
3. Health endpoint: Returns 200 OK
4. Sentry: Test error captured
5. Sentry: Performance data visible

---

## 📞 Support

**Render Docs:** https://render.com/docs  
**Sentry Docs:** https://docs.sentry.io/platforms/node/  
**GitHub Repo:** https://github.com/Kendo260599/soulfriend

---

**Commit:** fd374cd  
**Branch:** main  
**Date:** November 13, 2025  
**Status:** ⏳ Awaiting Render environment setup
