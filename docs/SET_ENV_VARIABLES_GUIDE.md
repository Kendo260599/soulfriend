# 🎯 Hướng dẫn Set Environment Variables - Step by Step với Screenshots

## 📋 Tổng quan

Sau khi migration sang OpenAI GPT-4o-mini, bạn cần set các environment variables sau:

### Railway (Backend):
- `OPENAI_API_KEY` ✅ **Required**

### Vercel (Frontend):
- `REACT_APP_API_URL` ✅ **Required**
- `REACT_APP_BACKEND_URL` ✅ **Required**

---

## 🚂 RAILWAY - Set OPENAI_API_KEY

### Bước 1: Đăng nhập Railway

1. Truy cập: https://railway.app
2. Đăng nhập với GitHub/Google
3. Chọn project **SoulFriend Backend** (hoặc project backend của bạn)

### Bước 2: Mở Variables

**Có 2 cách:**

**Cách 1: Từ Project Dashboard**
1. Click vào project của bạn
2. Click vào tab **"Variables"** ở menu bên trái

**Cách 2: Từ Service**
1. Click vào service backend của bạn
2. Click tab **"Variables"** ở menu trên cùng

### Bước 3: Thêm OPENAI_API_KEY

1. Click nút **"+ New Variable"** hoặc **"Add Variable"**
2. Nhập thông tin:
   ```
   Name: OPENAI_API_KEY
   Value: sk-proj-YOUR-OPENAI-API-KEY-HERE
   ```
3. Click **"Add"** hoặc **"Save"**

### Bước 4: Xác nhận

- Railway sẽ tự động redeploy service
- Bạn sẽ thấy deployment mới trong tab **"Deployments"**

### Bước 5: Verify

1. Click tab **"Deployments"**
2. Click vào deployment mới nhất
3. Click tab **"Logs"**
4. Tìm dòng:
   ```
   ✅ OpenAI AI initialized successfully with GPT-4o-mini
   ```

**Hoặc test bằng curl:**
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

## 🌐 VERCEL - Set Environment Variables

### Bước 1: Đăng nhập Vercel

1. Truy cập: https://vercel.com
2. Đăng nhập với GitHub/Google
3. Chọn project **SoulFriend** (hoặc project frontend của bạn)

### Bước 2: Mở Settings

1. Click vào project của bạn
2. Click tab **"Settings"** ở menu trên cùng

### Bước 3: Mở Environment Variables

1. Trong Settings menu, scroll xuống
2. Click **"Environment Variables"**

### Bước 4: Lấy Railway URL

Trước khi set variables, bạn cần Railway URL:

1. Vào Railway Dashboard
2. Chọn project backend
3. Click vào service backend
4. Tab **"Settings"** → **"Networking"**
5. Copy **Public Domain** (ví dụ: `https://soulfriend-production.up.railway.app`)

### Bước 5: Thêm REACT_APP_API_URL

1. Click **"+ Add New"**
2. Nhập:
   ```
   Key: REACT_APP_API_URL
   Value: https://your-railway-url.up.railway.app
   ```
3. Chọn environments:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
4. Click **"Save"**

### Bước 6: Thêm REACT_APP_BACKEND_URL

1. Click **"+ Add New"** (lần nữa)
2. Nhập:
   ```
   Key: REACT_APP_BACKEND_URL
   Value: https://your-railway-url.up.railway.app
   ```
   (Cùng Railway URL như trên)
3. Chọn environments:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
4. Click **"Save"**

### Bước 7: Xác nhận

- Vercel sẽ tự động trigger build mới
- Bạn sẽ thấy deployment mới trong tab **"Deployments"**

### Bước 8: Verify

1. Đợi deployment hoàn tất (thường 2-5 phút)
2. Click vào deployment mới nhất
3. Click **"Visit"** để mở website
4. Test chatbot:
   - Gửi message "Xin chào"
   - Kiểm tra có response không
   - Mở Developer Console (F12) → Check không có errors

---

## 🔍 Troubleshooting

### Railway Issues:

**Problem**: "OPENAI_API_KEY not found" trong logs
- **Solution**: 
  1. Verify variable name đúng: `OPENAI_API_KEY` (không có space)
  2. Verify API key đúng format (bắt đầu với `sk-`)
  3. Force redeploy: Deployments → Redeploy

**Problem**: API calls fail với 401
- **Solution**: 
  1. Check API key có expired không
  2. Regenerate key trên OpenAI dashboard
  3. Update lại trong Railway

**Problem**: Service không redeploy sau khi thêm variables
- **Solution**: 
  1. Manual redeploy: Deployments → "..." → Redeploy
  2. Hoặc push commit mới lên GitHub

### Vercel Issues:

**Problem**: Frontend không connect được backend
- **Solution**: 
  1. Verify `REACT_APP_API_URL` đúng Railway URL
  2. Check Railway URL có hoạt động không: `curl https://your-railway-url.up.railway.app/api/health`
  3. Verify CORS settings trên Railway

**Problem**: Environment variables không update
- **Solution**: 
  1. Clear browser cache
  2. Hard refresh: Ctrl+Shift+R (Windows) hoặc Cmd+Shift+R (Mac)
  3. Verify variable names đúng: `REACT_APP_API_URL` và `REACT_APP_BACKEND_URL`

**Problem**: Build fails
- **Solution**: 
  1. Check build logs trong Vercel
  2. Verify tất cả required variables đã set
  3. Check TypeScript/compilation errors

---

## 📊 Verification Checklist

### Railway (Backend):
- [ ] `OPENAI_API_KEY` đã được thêm vào Variables
- [ ] Service đã redeploy
- [ ] Logs show "OpenAI AI initialized"
- [ ] Health check endpoint trả về `"openai": "initialized"`

### Vercel (Frontend):
- [ ] `REACT_APP_API_URL` đã được set
- [ ] `REACT_APP_BACKEND_URL` đã được set
- [ ] Frontend đã redeploy thành công
- [ ] Website hoạt động
- [ ] Chatbot gửi/nhận messages được
- [ ] Console không có errors

---

## 🔐 Security Notes

### ⚠️ Important:

1. **Never commit API keys**
   - ✅ Đã có `.env` trong `.gitignore`
   - ✅ Chỉ set trên Railway/Vercel dashboard

2. **Rotate keys regularly**
   - Thay đổi mỗi 3-6 tháng
   - Revoke old keys sau khi rotate

3. **Monitor usage**
   - Check OpenAI dashboard để track usage
   - Set usage limits để tránh unexpected charges

---

## 📞 Support

Nếu gặp vấn đề:

1. **Railway**: 
   - [Railway Discord](https://discord.gg/railway)
   - [Railway Docs](https://docs.railway.app/)

2. **Vercel**:
   - [Vercel Discord](https://vercel.com/discord)
   - [Vercel Docs](https://vercel.com/docs)

3. **OpenAI**:
   - [OpenAI Platform](https://platform.openai.com/)
   - [OpenAI Docs](https://platform.openai.com/docs)

---

## ✅ Quick Reference

### Railway Variables:
```
OPENAI_API_KEY=sk-proj-YOUR-OPENAI-API-KEY-HERE
```

### Vercel Variables:
```
REACT_APP_API_URL=https://your-railway-url.up.railway.app
REACT_APP_BACKEND_URL=https://your-railway-url.up.railway.app
```

---

**Last Updated**: 2025-11-04  
**Status**: ✅ Ready for Deployment

