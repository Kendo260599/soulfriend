# 🚀 Quick Start: Set Environment Variables

## 📋 Railway (Backend) - 5 phút

### Steps:
1. **Railway Dashboard** → Chọn project
2. **Variables** tab → **"+ New Variable"**
3. **Key**: `OPENAI_API_KEY`
4. **Value**: `sk-proj-YOUR-OPENAI-API-KEY-HERE`
5. **Save** → Railway tự động redeploy

### Verify:
```bash
curl https://your-railway-url.up.railway.app/api/health
```

Response phải có: `"openai": "initialized"`

---

## 🌐 Vercel (Frontend) - 5 phút

### Steps:
1. **Vercel Dashboard** → Chọn project
2. **Settings** → **Environment Variables**

3. **Variable 1:**
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://your-railway-url.up.railway.app`
   - **Environment**: Tất cả (Production, Preview, Development)
   - **Save**

4. **Variable 2:**
   - **Key**: `REACT_APP_BACKEND_URL`
   - **Value**: `https://your-railway-url.up.railway.app` (cùng URL)
   - **Environment**: Tất cả (Production, Preview, Development)
   - **Save**

5. Vercel tự động redeploy

### Verify:
- Mở website → Test chatbot
- Check console không có errors
- Test chat message được gửi và nhận response

---

## ✅ Checklist

### Railway (Backend):
- [ ] `OPENAI_API_KEY` set
- [ ] Service redeployed
- [ ] Health check pass
- [ ] Logs show "OpenAI AI initialized"

### Vercel (Frontend):
- [ ] `REACT_APP_API_URL` set
- [ ] `REACT_APP_BACKEND_URL` set
- [ ] Frontend redeployed
- [ ] Chatbot hoạt động
- [ ] No console errors

---

**Xem chi tiết**: `docs/DEPLOYMENT_GUIDE_RAILWAY_VERCEL.md`

