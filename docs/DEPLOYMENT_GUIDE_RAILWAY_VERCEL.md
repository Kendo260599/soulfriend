# 🚀 Hướng dẫn Set Environment Variables trên Railway và Vercel

## 📋 Tổng quan

Sau khi migration sang OpenAI GPT-4o-mini, bạn cần set `OPENAI_API_KEY` trên cả Railway (backend) và Vercel (frontend nếu cần).

---

## 🚂 RAILWAY (Backend)

### Bước 1: Truy cập Railway Dashboard

1. Đăng nhập vào [Railway Dashboard](https://railway.app/)
2. Chọn project **SoulFriend Backend** (hoặc project backend của bạn)

### Bước 2: Mở Variables Tab

1. Click vào project của bạn
2. Click vào tab **"Variables"** ở menu bên trái
3. Hoặc click vào service → **"Variables"** tab

### Bước 3: Thêm OPENAI_API_KEY

1. Click nút **"+ New Variable"** hoặc **"Add Variable"**
2. Nhập:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: `sk-proj-YOUR-OPENAI-API-KEY-HERE` (thay bằng API key thực tế)
3. Click **"Add"** hoặc **"Save"**

### Bước 4: Xóa GEMINI_API_KEY (Optional)

Nếu không còn dùng Gemini:
1. Tìm `GEMINI_API_KEY` trong Variables
2. Click **"Delete"** hoặc **"Remove"**

### Bước 5: Redeploy Service

1. Railway sẽ tự động redeploy khi thêm/sửa variables
2. Hoặc bạn có thể:
   - Click vào **"Deployments"** tab
   - Click **"Redeploy"** để force redeploy

### Bước 6: Verify

1. Check logs để xem:
   ```
   ✅ OpenAI AI initialized successfully with GPT-4o-mini
   ```

2. Test health endpoint:
   ```bash
   curl https://your-railway-url.up.railway.app/api/health
   ```

   Response phải có:
   ```json
   {
     "openai": "initialized",
     "ai_model": "gpt-4o-mini"
   }
   ```

---

## 🌐 VERCEL (Frontend)

### Bước 1: Truy cập Vercel Dashboard

1. Đăng nhập vào [Vercel Dashboard](https://vercel.com/)
2. Chọn project **SoulFriend** (hoặc project frontend của bạn)

### Bước 2: Mở Settings

1. Click vào project của bạn
2. Click vào tab **"Settings"** ở menu trên cùng

### Bước 3: Mở Environment Variables

1. Trong Settings menu, click **"Environment Variables"**
2. Hoặc vào: **Settings → Environment Variables**

### Bước 4: Thêm Variables

Frontend cần 2 variables để kết nối với backend:

#### Variable 1: REACT_APP_API_URL

1. Click **"Add New"**
2. Nhập:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://your-railway-url.up.railway.app` (thay bằng Railway URL thực tế)
   - **Environment**: Chọn tất cả (Production, Preview, Development)
3. Click **"Save"**

#### Variable 2: REACT_APP_BACKEND_URL

1. Click **"Add New"**
2. Nhập:
   - **Key**: `REACT_APP_BACKEND_URL`
   - **Value**: `https://your-railway-url.up.railway.app` (cùng Railway URL)
   - **Environment**: Chọn tất cả (Production, Preview, Development)
3. Click **"Save"**

⚠️ **Lưu ý**: 
- Frontend **KHÔNG** cần `OPENAI_API_KEY` vì backend đã xử lý
- Cả hai variables có thể dùng cùng Railway URL
- Sau khi set, Vercel sẽ tự động redeploy

### Bước 5: Redeploy

1. Vercel sẽ tự động redeploy khi thêm variables
2. Hoặc:
   - Click vào **"Deployments"** tab
   - Click **"..."** → **"Redeploy"** trên deployment mới nhất

### Bước 6: Verify

1. Check deployment logs để xem build thành công
2. Test frontend:
   - Mở website
   - Test chatbot functionality
   - Check console để xem có errors không

---

## 📝 Checklist

### Railway (Backend):
- [ ] `OPENAI_API_KEY` đã được set
- [ ] `GEMINI_API_KEY` đã được xóa (optional)
- [ ] Service đã redeploy
- [ ] Health check pass
- [ ] Logs show "OpenAI AI initialized"

### Vercel (Frontend):
- [ ] `REACT_APP_API_URL` đã được set (hoặc `NEXT_PUBLIC_API_URL`)
- [ ] `REACT_APP_BACKEND_URL` đã được set (nếu cần)
- [ ] Frontend đã redeploy
- [ ] Chatbot hoạt động trên production

---

## 🔍 Troubleshooting

### Railway Issues:

**Problem**: Service không start sau khi set variables
- **Solution**: 
  1. Check logs để xem error
  2. Verify variable name đúng: `OPENAI_API_KEY`
  3. Verify API key format đúng (bắt đầu với `sk-`)

**Problem**: OpenAI API calls fail với 401
- **Solution**: 
  1. Verify API key đúng trong Railway variables
  2. Check API key có expired không
  3. Regenerate API key trên OpenAI dashboard

**Problem**: Service không redeploy sau khi thêm variables
- **Solution**: 
  1. Force redeploy: Deployments → Redeploy
  2. Hoặc push commit mới lên GitHub

### Vercel Issues:

**Problem**: Frontend không connect được backend
- **Solution**: 
  1. Verify `REACT_APP_API_URL` đúng Railway URL
  2. Check CORS settings trên Railway
  3. Verify backend đang chạy

**Problem**: Environment variables không update trên frontend
- **Solution**: 
  1. Redeploy project
  2. Clear browser cache
  3. Verify variable name đúng format (Vercel cần prefix `REACT_APP_` hoặc `NEXT_PUBLIC_`)

**Problem**: Build fails
- **Solution**: 
  1. Check build logs
  2. Verify tất cả required variables đã được set
  3. Check TypeScript errors

---

## 🔐 Security Best Practices

### 1. **Never commit API keys**
- ✅ Đã có `.env` trong `.gitignore`
- ✅ Dùng environment variables trên Railway/Vercel

### 2. **Rotate API keys regularly**
- Thay đổi API key mỗi 3-6 tháng
- Revoke old keys sau khi rotate

### 3. **Use different keys for environments**
- Production: Key riêng
- Development: Key riêng (hoặc test key)

### 4. **Monitor API usage**
- Check OpenAI dashboard regularly
- Set usage limits để tránh unexpected charges

---

## 📊 Verification Commands

### Test Railway Backend:

```bash
# Health check
curl https://your-railway-url.up.railway.app/api/health

# Detailed health check
curl https://your-railway-url.up.railway.app/api/health/detailed

# Test chatbot
curl -X POST https://your-railway-url.up.railway.app/api/v2/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Xin chào", "userId": "test-user", "sessionId": "test-session"}'
```

### Test Vercel Frontend:

```bash
# Check if site is live
curl https://your-vercel-url.vercel.app

# Check build status
# (Check Vercel dashboard → Deployments)
```

---

## 📞 Support

Nếu gặp vấn đề:

1. **Railway Support**: 
   - [Railway Discord](https://discord.gg/railway)
   - [Railway Docs](https://docs.railway.app/)

2. **Vercel Support**:
   - [Vercel Discord](https://vercel.com/discord)
   - [Vercel Docs](https://vercel.com/docs)

3. **OpenAI Support**:
   - [OpenAI Platform](https://platform.openai.com/)
   - [OpenAI Docs](https://platform.openai.com/docs)

---

## ✅ Quick Reference

### Railway Variables:
```
OPENAI_API_KEY=sk-proj-...
```

### Vercel Variables:
```
REACT_APP_API_URL=https://your-railway-url.up.railway.app
REACT_APP_BACKEND_URL=https://your-railway-url.up.railway.app
```

---

**Last Updated**: 2025-11-04  
**Status**: ✅ Ready for Deployment

